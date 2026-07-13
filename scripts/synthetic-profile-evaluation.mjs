import { readFile } from "node:fs/promises";
import vm from "node:vm";

const ROOT = new URL("../", import.meta.url);
const fixture = JSON.parse(await readFile(new URL("test/fixtures/synthetic-recommendation-profiles.json", ROOT), "utf8"));
const games = JSON.parse(await readFile(new URL("data/games.json", ROOT), "utf8"));
const backbone = JSON.parse(await readFile(new URL("data/catalog-backbone.json", ROOT), "utf8"));
const external = JSON.parse(await readFile(new URL("data/global-search-fixtures.json", ROOT), "utf8"));
const aliases = JSON.parse(await readFile(new URL("data/title-aliases.json", ROOT), "utf8"));
const scoreSource = await readFile(new URL("src/app-score.js", ROOT), "utf8");
const OUTPUT_JSON = process.argv.includes("--json");
const STRESS_SETS_PER_PROFILE = 20;
const STRESS_SET_SIZE = 5;

function normalizeTitle(title) {
  return String(title || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

function titleKey(title) {
  const normalized = normalizeTitle(title);
  const alias = aliases.find((entry) => (
    [entry.title, ...(entry.aliases || [])].some((candidate) => normalizeTitle(candidate) === normalized)
  ));
  return normalizeTitle(alias?.title || title);
}

const signalSandbox = { window: { PlaySputnikI18n: { t: (key) => key } }, Math, Set };
vm.createContext(signalSandbox);
vm.runInContext(scoreSource, signalSandbox, { filename: "src/app-score.js" });
const gameSignals = signalSandbox.window.PlaySputnikScore.gameSignalsForGame;

function normalizeCandidate(record, source) {
  const atoms = record.atoms || [];
  const session = record.session || "medium";
  const commitment = record.commitment || (session === "long" ? "high" : "medium");
  return {
    ...record,
    atoms,
    vibe: record.vibe || record.reason || "Synthetic profile evaluation candidate",
    session,
    difficulty: record.difficulty || "normal",
    length: record.length || (commitment === "high" ? "long" : "medium"),
    commitment,
    tone: record.tone || "neutral",
    content: record.content || "stylized-violence",
    reviewBurden: record.reviewBurden || "medium",
    adultTimeFit: record.adultTimeFit || "evening",
    backlog: false,
    wishlist: false,
    externalCandidate: source !== "seed",
    prices: record.prices || {},
    discount: record.discount || {},
    priceMeta: record.priceMeta || {},
    priceHistory: record.priceHistory || {},
    psPlus: record.psPlus || [],
    subscriptionMeta: record.subscriptionMeta || {},
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const corpusPriority = { seed: 0, backbone: 1, external: 2 };
const byKey = new Map();
[
  ...games.map((record) => ({ record, source: "seed" })),
  ...(backbone.records || []).map((record) => ({ record, source: "backbone" })),
  ...(external.records || []).map((record) => ({ record, source: "external" })),
].forEach((item) => {
  const key = titleKey(item.record.title);
  const existing = byKey.get(key);
  if (!existing || corpusPriority[item.source] < corpusPriority[existing.source]) byKey.set(key, item);
});

function resolve(title) {
  return byKey.get(titleKey(title)) || null;
}

function atomWeightsFromRatings(ratings) {
  const weights = {};
  ratings.forEach(({ title, rating }) => {
    const source = resolve(title);
    if (!source) return;
    const polarity = rating >= 7 ? 1 : rating <= 5 ? -1 : 0;
    const strength = polarity > 0 ? rating - 6 : polarity < 0 ? 6 - rating : 0;
    gameSignals(source.record).forEach((signal) => {
      weights[signal] = (weights[signal] || 0) + polarity * strength;
    });
  });
  return weights;
}

function loadScoreTools(state, pool, referencePool, { profileGames = [], quickReactions = {} } = {}) {
  const conflictAtoms = (() => {
    const positive = new Set();
    const negative = new Set();
    profileGames.forEach((game) => {
      const reaction = quickReactions[titleKey(game.title)];
      if (reaction === "loved") gameSignals(game).forEach((signal) => positive.add(signal));
      if (reaction === "not_for_me") gameSignals(game).forEach((signal) => negative.add(signal));
    });
    return [...positive].filter((signal) => negative.has(signal));
  })();
  const sandbox = { window: { PlaySputnikI18n: { t: (key) => key } }, Math, Set };
  vm.createContext(sandbox);
  vm.runInContext(scoreSource, sandbox, { filename: "src/app-score.js" });
  return sandbox.window.PlaySputnikScore.createScoreTools({
    getState: () => state,
    getProfileGames: () => profileGames,
    getQuickReaction: (title) => quickReactions[titleKey(title)] || "",
    getFeedbackSource: () => null,
    getTasteConflict: () => ({ atoms: conflictAtoms }),
    getTasteSignalCount: () => Object.keys(quickReactions).length,
    getRecommendationPool: () => pool,
    getTasteReferencePool: () => referencePool,
    titleMatches: (a, b) => titleKey(a) === titleKey(b),
    titleKey,
    effectiveGameState: () => "",
    getSubscriptionStatus: () => ({ canConfirm: false }),
    getPriceStatus: () => ({ canConfirm: false }),
    QUICK_TASTE_FIRST_TARGET: 5,
  });
}

const candidateRows = fixture.candidatePool.map((title) => {
  const source = resolve(title);
  return { title, source: source?.source || "missing", game: source ? normalizeCandidate(source.record, source.source) : null };
});
const candidates = candidateRows.filter((row) => row.game).map((row) => row.game);
const referencePool = [...byKey.values()].map(({ record }) => record);
const gain = (label) => ({ ideal: 3, strong: 2, stretch: 1, avoid: 0 }[label] ?? 0);
const round = (value) => Math.round(value * 100) / 100;
const average = (rows) => rows.length ? rows.reduce((sum, row) => sum + row.score, 0) / rows.length : 0;
const dcg = (rows, limit) => rows.slice(0, limit).reduce(
  (sum, row, index) => sum + gain(row.label) / Math.log2(index + 2),
  0,
);

function evaluateProfile(profile, ratings, mode = "import") {
  const missingRatings = ratings.filter(({ title }) => !resolve(title)).map(({ title }) => title);
  const atomWeights = mode === "quick" ? {} : atomWeightsFromRatings(ratings);
  const quickReactions = mode === "quick"
    ? Object.fromEntries(ratings.map(({ title, rating }) => [
        titleKey(resolve(title)?.record.title || title),
        rating >= 7 ? "loved" : rating <= 5 ? "not_for_me" : "played",
      ]))
    : {};
  const quickProfileGames = mode === "quick"
    ? ratings.map(({ title }) => resolve(title)?.record).filter(Boolean)
    : [];
  const state = {
    importedRatings: mode === "quick"
      ? []
      : ratings.map(({ title, rating }) => ({ title: resolve(title)?.record.title || title, rating })),
    userGames: {},
    quickReactions: {},
    calibrationSkips: {},
    liked: new Set(),
    hidden: new Set(),
    saved: new Set(),
    snoozed: new Set(),
    atomWeights,
    feedbackLog: [],
    activeRegion: "US",
    mood: "__neutral_test__",
    session: "__neutral_test__",
    sessionMinutes: 0,
    difficulty: "__neutral_test__",
    psPlus: false,
    budget: -1,
    notebook: { ranked: [], completed: [], access: [], wishlist: [], prices: [], upcoming: [] },
  };
  const tools = loadScoreTools(state, candidates, referencePool, {
    profileGames: quickProfileGames,
    quickReactions,
  });
  const ranked = candidateRows
    .filter((row) => row.game)
    .map((row) => ({
      title: row.game.title,
      source: row.source,
      label: profile.labels[row.title],
      score: tools.scoreGame(row.game),
    }))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  const ideal = [...ranked].sort((a, b) => gain(b.label) - gain(a.label) || a.title.localeCompare(b.title));
  const top3 = ranked.slice(0, 3);
  const positive = ranked.filter((row) => ["ideal", "strong"].includes(row.label));
  const avoids = ranked.filter((row) => row.label === "avoid");
  return {
    id: profile.id,
    name: profile.name,
    hypothesis: profile.hypothesis,
    ratingCount: ratings.length,
    signalMode: mode,
    missingRatings,
    strongestSignals: Object.entries(atomWeights)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]) || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([signal, weight]) => ({ signal, weight: round(weight) })),
    metrics: {
      ndcgAt6: round(dcg(ranked, 6) / dcg(ideal, 6)),
      highFitPrecisionAt3: round(top3.filter((row) => ["ideal", "strong"].includes(row.label)).length / top3.length),
      avoidIntrusionsAt3: top3.filter((row) => row.label === "avoid").length,
      positiveAvoidMargin: round(average(positive) - average(avoids)),
    },
    top3: top3.map(({ title, label, score }) => ({ title, label, score })),
    ranked,
  };
}

function summarize(reports) {
  const top3Sets = reports.map((profile) => new Set(profile.top3.map((row) => titleKey(row.title))));
  const similarities = [];
  for (let left = 0; left < top3Sets.length; left += 1) {
    for (let right = left + 1; right < top3Sets.length; right += 1) {
      const union = new Set([...top3Sets[left], ...top3Sets[right]]);
      const overlap = [...top3Sets[left]].filter((title) => top3Sets[right].has(title)).length;
      similarities.push(overlap / union.size);
    }
  }
  return {
    profileCount: reports.length,
    candidateCoverage: round(candidates.length / fixture.candidatePool.length),
    ratingCoverage: round(
      reports.reduce((sum, profile) => sum + (profile.ratingCount - profile.missingRatings.length), 0)
        / reports.reduce((sum, profile) => sum + profile.ratingCount, 0),
    ),
    meanNdcgAt6: round(reports.reduce((sum, profile) => sum + profile.metrics.ndcgAt6, 0) / reports.length),
    meanHighFitPrecisionAt3: round(reports.reduce((sum, profile) => sum + profile.metrics.highFitPrecisionAt3, 0) / reports.length),
    totalAvoidIntrusionsAt3: reports.reduce((sum, profile) => sum + profile.metrics.avoidIntrusionsAt3, 0),
    meanTop3Jaccard: round(similarities.reduce((sum, value) => sum + value, 0) / similarities.length),
    uniqueTopChoices: new Set(reports.map((profile) => titleKey(profile.top3[0]?.title))).size,
  };
}

function seededRandom(seedText) {
  let seed = [...seedText].reduce((value, character) => (
    Math.imul(value ^ character.charCodeAt(0), 16777619) >>> 0
  ), 2166136261);
  return () => {
    seed += 0x6D2B79F5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randomRatingSets(profile) {
  assert(profile.ratings.length >= STRESS_SET_SIZE, `${profile.name} needs at least ${STRESS_SET_SIZE} ratings for stress sampling`);
  const random = seededRandom(`playsputnik:${profile.id}:five-signal:v1`);
  const sets = [];
  const seen = new Set();
  while (sets.length < STRESS_SETS_PER_PROFILE) {
    const shuffled = [...profile.ratings];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(random() * (index + 1));
      [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
    }
    const sample = shuffled.slice(0, STRESS_SET_SIZE);
    const signature = sample.map(({ title }) => titleKey(title)).sort().join("|");
    if (seen.has(signature)) continue;
    seen.add(signature);
    sets.push(sample);
  }
  return sets;
}

function summarizeStress(reports) {
  const groups = fixture.profiles.map((profile) => {
    const scenarios = reports.filter((report) => report.id === profile.id);
    return {
      id: profile.id,
      name: profile.name,
      scenarioCount: scenarios.length,
      meanNdcgAt6: round(scenarios.reduce((sum, report) => sum + report.metrics.ndcgAt6, 0) / scenarios.length),
      meanHighFitPrecisionAt3: round(scenarios.reduce((sum, report) => sum + report.metrics.highFitPrecisionAt3, 0) / scenarios.length),
      highFitTopChoiceRate: round(scenarios.filter((report) => ["ideal", "strong"].includes(report.top3[0]?.label)).length / scenarios.length),
      avoidFreeTop3Rate: round(scenarios.filter((report) => report.metrics.avoidIntrusionsAt3 === 0).length / scenarios.length),
    };
  });
  return {
    scenarioCount: reports.length,
    setsPerProfile: STRESS_SETS_PER_PROFILE,
    meanNdcgAt6: round(reports.reduce((sum, report) => sum + report.metrics.ndcgAt6, 0) / reports.length),
    meanHighFitPrecisionAt3: round(reports.reduce((sum, report) => sum + report.metrics.highFitPrecisionAt3, 0) / reports.length),
    highFitTopChoiceRate: round(reports.filter((report) => ["ideal", "strong"].includes(report.top3[0]?.label)).length / reports.length),
    avoidFreeTop3Rate: round(reports.filter((report) => report.metrics.avoidIntrusionsAt3 === 0).length / reports.length),
    profiles: groups,
  };
}

const fullProfiles = fixture.profiles.map((profile) => evaluateProfile(profile, profile.ratings));
const starterProfiles = fixture.profiles.map((profile) => {
  const starterKeys = new Set((profile.starterTitles || []).map(titleKey));
  return evaluateProfile(profile, profile.ratings.filter(({ title }) => starterKeys.has(titleKey(title))), "quick");
});
const stressProfiles = fixture.profiles.flatMap((profile) => (
  randomRatingSets(profile).map((ratings, index) => ({
    ...evaluateProfile(profile, ratings, "quick"),
    scenario: index + 1,
    reactions: {
      positive: ratings.filter(({ rating }) => rating >= 7).length,
      neutral: ratings.filter(({ rating }) => rating > 5 && rating < 7).length,
      negative: ratings.filter(({ rating }) => rating <= 5).length,
    },
  }))
));
const aggregate = summarize(fullProfiles);
const starterAggregate = summarize(starterProfiles);
const stressAggregate = summarizeStress(stressProfiles);
const report = {
  mode: "synthetic-profile-evaluation",
  fixturePolicy: fixture.method,
  aggregate,
  profiles: fullProfiles,
  starter: { aggregate: starterAggregate, profiles: starterProfiles },
  stress: { aggregate: stressAggregate, scenarios: stressProfiles },
  missingCandidates: candidateRows.filter((row) => !row.game).map((row) => row.title),
};

if (OUTPUT_JSON) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`✅ Synthetic profile evaluation: ${aggregate.profileCount} profiles, ${candidates.length}/${fixture.candidatePool.length} candidates, mean NDCG@6 ${aggregate.meanNdcgAt6}, mean high-fit P@3 ${aggregate.meanHighFitPrecisionAt3}`);
  fullProfiles.forEach((profile) => {
    console.log(`   ${profile.name}: ${profile.top3.map((row) => `${row.title}:${row.label}:${row.score}`).join(", ")} · margin ${profile.metrics.positiveAvoidMargin}`);
  });
  console.log(`   Personalization: ${aggregate.uniqueTopChoices}/${aggregate.profileCount} unique top choices, mean top-3 overlap ${aggregate.meanTop3Jaccard}`);
  console.log(`   Five-signal start: mean NDCG@6 ${starterAggregate.meanNdcgAt6}, mean high-fit P@3 ${starterAggregate.meanHighFitPrecisionAt3}, avoid intrusions ${starterAggregate.totalAvoidIntrusionsAt3}`);
  starterProfiles.forEach((profile) => {
    console.log(`   ↳ ${profile.name}: ${profile.top3.map((row) => `${row.title}:${row.label}:${row.score}`).join(", ")}`);
  });
  console.log(`   Random five-signal stress: ${stressAggregate.scenarioCount} scenarios, mean NDCG@6 ${stressAggregate.meanNdcgAt6}, high-fit winner ${stressAggregate.highFitTopChoiceRate}, avoid-free top 3 ${stressAggregate.avoidFreeTop3Rate}`);
  stressAggregate.profiles.forEach((profile) => {
    console.log(`   ↳ ${profile.name}: NDCG ${profile.meanNdcgAt6}, high-fit winner ${profile.highFitTopChoiceRate}, avoid-free ${profile.avoidFreeTop3Rate}`);
  });
}

assert(fixture.profiles.length >= 3, "Synthetic benchmark needs at least three independent profiles");
fixture.profiles.forEach((profile) => {
  const candidateKeys = new Set(fixture.candidatePool.map(titleKey));
  const leaks = profile.ratings.filter(({ title }) => candidateKeys.has(titleKey(title))).map(({ title }) => title);
  assert(leaks.length === 0, `${profile.name} leaks rated titles into the candidate pool: ${leaks.join(", ")}`);
  assert(profile.starterTitles?.length === 5, `${profile.name} needs exactly five starter ratings`);
  const ratingKeys = new Set(profile.ratings.map(({ title }) => titleKey(title)));
  const unknownStarterTitles = profile.starterTitles.filter((title) => !ratingKeys.has(titleKey(title)));
  assert(unknownStarterTitles.length === 0, `${profile.name} starter titles are absent from ratings: ${unknownStarterTitles.join(", ")}`);
  const starterRatings = profile.ratings.filter(({ title }) => profile.starterTitles.some((starter) => titleKey(starter) === titleKey(title)));
  assert(starterRatings.filter(({ rating }) => rating >= 7).length >= 2, `${profile.name} starter profile needs at least two positive reactions`);
  assert(starterRatings.filter(({ rating }) => rating <= 5).length >= 1, `${profile.name} starter profile needs at least one negative reaction`);
});
assert(aggregate.candidateCoverage === 1, `Synthetic candidate coverage regressed: missing ${report.missingCandidates.join(", ")}`);
assert(aggregate.ratingCoverage === 1, `Synthetic rating coverage regressed: ${fullProfiles.flatMap((profile) => profile.missingRatings).join(", ")}`);
fullProfiles.forEach((profile) => {
  assert(profile.metrics.ndcgAt6 >= 0.72, `${profile.name} NDCG@6 is too low: ${profile.metrics.ndcgAt6}`);
  assert(profile.metrics.highFitPrecisionAt3 >= 0.67, `${profile.name} high-fit precision@3 is too low: ${profile.metrics.highFitPrecisionAt3}`);
  assert(profile.metrics.avoidIntrusionsAt3 === 0, `${profile.name} surfaced an avoid title in the top 3`);
  assert(profile.metrics.positiveAvoidMargin >= 18, `${profile.name} positive/avoid score margin is too small: ${profile.metrics.positiveAvoidMargin}`);
});
assert(aggregate.uniqueTopChoices === aggregate.profileCount, `Profiles collapsed onto ${aggregate.uniqueTopChoices}/${aggregate.profileCount} unique top choices`);
assert(aggregate.meanTop3Jaccard <= 0.35, `Synthetic top-3 recommendations are too similar: ${aggregate.meanTop3Jaccard}`);
assert(starterAggregate.ratingCoverage === 1, `Five-signal rating coverage regressed: ${starterProfiles.flatMap((profile) => profile.missingRatings).join(", ")}`);
starterProfiles.forEach((profile) => {
  assert(profile.ratingCount === 5, `${profile.name} starter benchmark used ${profile.ratingCount}/5 ratings`);
  assert(profile.signalMode === "quick", `${profile.name} starter benchmark bypassed the quick-reaction path`);
  assert(profile.metrics.ndcgAt6 >= 0.68, `${profile.name} five-signal NDCG@6 is too low: ${profile.metrics.ndcgAt6}`);
  assert(profile.metrics.highFitPrecisionAt3 >= 0.67, `${profile.name} five-signal high-fit precision@3 is too low: ${profile.metrics.highFitPrecisionAt3}`);
  assert(profile.metrics.avoidIntrusionsAt3 === 0, `${profile.name} five-signal profile surfaced an avoid title in the top 3`);
  assert(profile.metrics.positiveAvoidMargin >= 10, `${profile.name} five-signal positive/avoid margin is too small: ${profile.metrics.positiveAvoidMargin}`);
});
starterProfiles.forEach((profile) => {
  assert(["ideal", "strong"].includes(profile.top3[0]?.label), `${profile.name} five-signal top choice is not a high-fit candidate`);
});
assert(starterAggregate.uniqueTopChoices >= 2, `Five-signal profiles collapsed onto ${starterAggregate.uniqueTopChoices}/${starterAggregate.profileCount} unique top choices`);
assert(starterAggregate.meanTop3Jaccard <= 0.35, `Five-signal top-3 recommendations are too similar: ${starterAggregate.meanTop3Jaccard}`);
assert(stressAggregate.scenarioCount === fixture.profiles.length * STRESS_SETS_PER_PROFILE, `Expected ${fixture.profiles.length * STRESS_SETS_PER_PROFILE} random five-signal scenarios, got ${stressAggregate.scenarioCount}`);
assert(stressAggregate.meanNdcgAt6 >= 0.78, `Random five-signal mean NDCG@6 is too low: ${stressAggregate.meanNdcgAt6}`);
assert(stressAggregate.meanHighFitPrecisionAt3 >= 0.7, `Random five-signal mean high-fit precision@3 is too low: ${stressAggregate.meanHighFitPrecisionAt3}`);
assert(stressAggregate.highFitTopChoiceRate >= 0.8, `Random five-signal high-fit top choice rate is too low: ${stressAggregate.highFitTopChoiceRate}`);
assert(stressAggregate.avoidFreeTop3Rate >= 0.9, `Random five-signal avoid-free top-3 rate is too low: ${stressAggregate.avoidFreeTop3Rate}`);
stressAggregate.profiles.forEach((profile) => {
  assert(profile.scenarioCount === STRESS_SETS_PER_PROFILE, `${profile.name} has ${profile.scenarioCount}/${STRESS_SETS_PER_PROFILE} stress scenarios`);
  assert(profile.meanNdcgAt6 >= 0.7, `${profile.name} random five-signal NDCG@6 is too low: ${profile.meanNdcgAt6}`);
  assert(profile.highFitTopChoiceRate >= 0.7, `${profile.name} random five-signal high-fit top choice rate is too low: ${profile.highFitTopChoiceRate}`);
  assert(profile.avoidFreeTop3Rate >= 0.8, `${profile.name} random five-signal avoid-free top-3 rate is too low: ${profile.avoidFreeTop3Rate}`);
});
