import { readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";

const ROOT = new URL("../", import.meta.url);
const fixture = JSON.parse(await readFile(new URL("test/fixtures/synthetic-recommendation-profiles.json", ROOT), "utf8"));
const games = JSON.parse(await readFile(new URL("data/games.json", ROOT), "utf8"));
const backbone = JSON.parse(await readFile(new URL("data/catalog-backbone.json", ROOT), "utf8"));
const external = JSON.parse(await readFile(new URL("data/global-search-fixtures.json", ROOT), "utf8"));
const aliases = JSON.parse(await readFile(new URL("data/title-aliases.json", ROOT), "utf8"));
const scoreSource = await readFile(new URL("src/app-score.js", ROOT), "utf8");
const OUTPUT_JSON = process.argv.includes("--json");
const WRITE_DIAGNOSTICS = process.argv.includes("--write-diagnostics");
const DIAGNOSTICS_URL = new URL("reports/synthetic-profile-diagnostics.json", ROOT);
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
const {
  gameSignalsForGame: gameSignals,
  tasteMotifsForGame,
} = signalSandbox.window.PlaySputnikScore;

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
      if (reaction === "loved") gameSignals(game).filter((signal) => !signal.startsWith("motif:")).forEach((signal) => positive.add(signal));
      if (reaction === "not_for_me") gameSignals(game).filter((signal) => !signal.startsWith("motif:")).forEach((signal) => negative.add(signal));
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
assert(
  tasteMotifsForGame({ atoms: ["story", "choice", "cinematic"] }).join("|") === "motif:story+choice|motif:story+cinematic",
  "Curated taste motifs should preserve supported pairs without combinatorial expansion",
);
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
  candidates.forEach((game) => {
    const visible = tools.tasteEngineGameSignals(game);
    assert(
      [...visible.positive, ...visible.negative, ...visible.mixed].every((signal) => !signal.startsWith("motif:")),
      `${game.title} leaked an internal taste motif into user-facing evidence`,
    );
  });
  const ranked = candidateRows
    .filter((row) => row.game)
    .map((row) => ({
      title: row.game.title,
      source: row.source,
      label: profile.labels[row.title],
      score: tools.scoreGame(row.game),
      taste: (() => {
        const result = tools.tasteEngineScore(row.game);
        return { pull: result.pull, caution: result.caution, uncertainty: result.uncertainty };
      })(),
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
    intensityPreference: tools.tasteIntensityPreference(),
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

function summarizeStress(reports, profiles) {
  const groups = profiles.map((profile) => {
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
    inputs: ratings.map(({ title, rating }) => ({ title, rating })),
    reactions: {
      positive: ratings.filter(({ rating }) => rating >= 7).length,
      neutral: ratings.filter(({ rating }) => rating > 5 && rating < 7).length,
      negative: ratings.filter(({ rating }) => rating <= 5).length,
    },
  }))
));
const aggregate = summarize(fullProfiles);
const starterAggregate = summarize(starterProfiles);
const stressAggregate = summarizeStress(stressProfiles, fixture.profiles);
const contradictorySourceProfiles = fixture.contradictoryProfiles || [];
const contradictoryFullProfiles = contradictorySourceProfiles.map((profile) => evaluateProfile(profile, profile.ratings));
const contradictoryStarterProfiles = contradictorySourceProfiles.map((profile) => {
  const starterKeys = new Set((profile.starterTitles || []).map(titleKey));
  return evaluateProfile(profile, profile.ratings.filter(({ title }) => starterKeys.has(titleKey(title))), "quick");
});
const contradictoryStressProfiles = contradictorySourceProfiles.flatMap((profile) => (
  randomRatingSets(profile).map((ratings, index) => ({
    ...evaluateProfile(profile, ratings, "quick"),
    scenario: index + 1,
    inputs: ratings.map(({ title, rating }) => ({ title, rating })),
    reactions: {
      positive: ratings.filter(({ rating }) => rating >= 7).length,
      neutral: ratings.filter(({ rating }) => rating > 5 && rating < 7).length,
      negative: ratings.filter(({ rating }) => rating <= 5).length,
    },
  }))
));
const contradictoryAggregate = summarize(contradictoryFullProfiles);
const contradictoryStarterAggregate = summarize(contradictoryStarterProfiles);
const contradictoryStressAggregate = summarizeStress(contradictoryStressProfiles, contradictorySourceProfiles);

function compactRows(rows) {
  return rows.map(({ title, label, score }) => ({ title, label, score }));
}

function modeDiagnostics(profile) {
  const topSix = profile.ranked.slice(0, 6);
  return {
    metrics: profile.metrics,
    intensityPreference: profile.intensityPreference,
    top3: profile.top3,
    overranked: compactRows(topSix.filter((row) => ["stretch", "avoid"].includes(row.label))),
    missedHighFit: compactRows(profile.ranked.filter((row, index) => index >= 6 && ["ideal", "strong"].includes(row.label))),
  };
}

function stressDiagnostics(profileId, stressRows = stressProfiles, stressSummary = stressAggregate) {
  const scenarios = stressRows.filter((profile) => profile.id === profileId);
  const recurring = new Map();
  scenarios.forEach((scenario) => scenario.top3
    .filter((row) => ["stretch", "avoid"].includes(row.label))
    .forEach((row) => {
      const key = `${row.title}|${row.label}`;
      const current = recurring.get(key) || { title: row.title, label: row.label, count: 0 };
      current.count += 1;
      recurring.set(key, current);
    }));
  const aggregateProfile = stressSummary.profiles.find((profile) => profile.id === profileId);
  return {
    metrics: aggregateProfile,
    recurringTop3Mismatches: [...recurring.values()]
      .sort((left, right) => right.count - left.count || left.title.localeCompare(right.title))
      .slice(0, 5),
    weakestScenarios: [...scenarios]
      .sort((left, right) => left.metrics.ndcgAt6 - right.metrics.ndcgAt6
        || left.metrics.highFitPrecisionAt3 - right.metrics.highFitPrecisionAt3
        || left.scenario - right.scenario)
      .slice(0, 3)
      .map((scenario) => ({
        scenario: scenario.scenario,
        inputs: scenario.inputs,
        reactions: scenario.reactions,
        ndcgAt6: scenario.metrics.ndcgAt6,
        highFitPrecisionAt3: scenario.metrics.highFitPrecisionAt3,
        top3: scenario.top3,
      })),
  };
}

const diagnostics = {
  version: 2,
  fixtureVersion: fixture.version,
  policy: "Synthetic labels are product hypotheses. Rows below are diagnostic mismatches, not claims about real players.",
  aggregate: { full: aggregate, starter: starterAggregate, stress: stressAggregate },
  profiles: fixture.profiles.map((profile) => ({
    id: profile.id,
    name: profile.name,
    hypothesis: profile.hypothesis,
    full: modeDiagnostics(fullProfiles.find((row) => row.id === profile.id)),
    fiveSignalStart: modeDiagnostics(starterProfiles.find((row) => row.id === profile.id)),
    randomFiveSignalStress: stressDiagnostics(profile.id),
  })),
  contradictory: {
    aggregate: {
      full: contradictoryAggregate,
      starter: contradictoryStarterAggregate,
      stress: contradictoryStressAggregate,
    },
    profiles: contradictorySourceProfiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      hypothesis: profile.hypothesis,
      full: modeDiagnostics(contradictoryFullProfiles.find((row) => row.id === profile.id)),
      fiveSignalStart: modeDiagnostics(contradictoryStarterProfiles.find((row) => row.id === profile.id)),
      randomFiveSignalStress: stressDiagnostics(profile.id, contradictoryStressProfiles, contradictoryStressAggregate),
    })),
  },
};

if (WRITE_DIAGNOSTICS) {
  await writeFile(DIAGNOSTICS_URL, `${JSON.stringify(diagnostics, null, 2)}\n`);
} else {
  const committedDiagnostics = JSON.parse(await readFile(DIAGNOSTICS_URL, "utf8"));
  assert(
    JSON.stringify(committedDiagnostics) === JSON.stringify(diagnostics),
    "Synthetic profile diagnostics are stale; run scripts/synthetic-profile-evaluation.mjs --write-diagnostics",
  );
}

const report = {
  mode: "synthetic-profile-evaluation",
  fixturePolicy: fixture.method,
  aggregate,
  profiles: fullProfiles,
  starter: { aggregate: starterAggregate, profiles: starterProfiles },
  stress: { aggregate: stressAggregate, scenarios: stressProfiles },
  contradictory: {
    aggregate: contradictoryAggregate,
    profiles: contradictoryFullProfiles,
    starter: { aggregate: contradictoryStarterAggregate, profiles: contradictoryStarterProfiles },
    stress: { aggregate: contradictoryStressAggregate, scenarios: contradictoryStressProfiles },
  },
  diagnostics,
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
  diagnostics.profiles.forEach((profile) => {
    const fullIssues = profile.full.overranked.length + profile.full.missedHighFit.length;
    const startIssues = profile.fiveSignalStart.overranked.length + profile.fiveSignalStart.missedHighFit.length;
    console.log(`   ⚑ ${profile.name}: ${fullIssues} full-profile mismatches, ${startIssues} five-signal mismatches, weakest stress NDCG ${profile.randomFiveSignalStress.weakestScenarios[0]?.ndcgAt6}`);
  });
  console.log(`   Contradictory profiles: ${contradictoryAggregate.profileCount}, full NDCG ${contradictoryAggregate.meanNdcgAt6}, five-signal NDCG ${contradictoryStarterAggregate.meanNdcgAt6}, stress NDCG ${contradictoryStressAggregate.meanNdcgAt6}`);
  contradictoryFullProfiles.forEach((profile) => {
    console.log(`   ↳ ${profile.name}: ${profile.top3.map((row) => `${row.title}:${row.label}:${row.score}`).join(", ")}`);
  });
}

assert(fixture.profiles.length === 8, `Synthetic benchmark should cover eight independent profiles, got ${fixture.profiles.length}`);
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
  const missingLabels = fixture.candidatePool.filter((title) => !profile.labels[title]);
  assert(missingLabels.length === 0, `${profile.name} is missing candidate labels: ${missingLabels.join(", ")}`);
});
assert(contradictorySourceProfiles.length === 3, `Contradictory benchmark should cover three profiles, got ${contradictorySourceProfiles.length}`);
contradictorySourceProfiles.forEach((profile) => {
  const candidateKeys = new Set(fixture.candidatePool.map(titleKey));
  const leaks = profile.ratings.filter(({ title }) => candidateKeys.has(titleKey(title))).map(({ title }) => title);
  assert(leaks.length === 0, `${profile.name} leaks rated titles into the contradictory candidate pool: ${leaks.join(", ")}`);
  assert(profile.starterTitles?.length === 5, `${profile.name} needs exactly five contradictory starter ratings`);
  const ratingKeys = new Set(profile.ratings.map(({ title }) => titleKey(title)));
  assert(profile.starterTitles.every((title) => ratingKeys.has(titleKey(title))), `${profile.name} has a contradictory starter title absent from ratings`);
  const starterRatings = profile.ratings.filter(({ title }) => profile.starterTitles.some((starter) => titleKey(starter) === titleKey(title)));
  assert(starterRatings.filter(({ rating }) => rating >= 7).length >= 2, `${profile.name} contradictory starter needs at least two positive reactions`);
  assert(starterRatings.filter(({ rating }) => rating <= 5).length >= 1, `${profile.name} contradictory starter needs at least one negative reaction`);
  assert(fixture.candidatePool.every((title) => profile.labels[title]), `${profile.name} is missing contradictory candidate labels`);
});
assert(aggregate.candidateCoverage === 1, `Synthetic candidate coverage regressed: missing ${report.missingCandidates.join(", ")}`);
assert(aggregate.ratingCoverage === 1, `Synthetic rating coverage regressed: ${fullProfiles.flatMap((profile) => profile.missingRatings).join(", ")}`);
fullProfiles.forEach((profile) => {
  assert(profile.metrics.ndcgAt6 >= 0.72, `${profile.name} NDCG@6 is too low: ${profile.metrics.ndcgAt6}`);
  assert(profile.metrics.highFitPrecisionAt3 >= 0.67, `${profile.name} high-fit precision@3 is too low: ${profile.metrics.highFitPrecisionAt3}`);
  assert(profile.metrics.avoidIntrusionsAt3 === 0, `${profile.name} surfaced an avoid title in the top 3`);
  assert(profile.metrics.positiveAvoidMargin >= 18, `${profile.name} positive/avoid score margin is too small: ${profile.metrics.positiveAvoidMargin}`);
});
assert(aggregate.uniqueTopChoices >= Math.ceil(aggregate.profileCount * 0.7), `Profiles collapsed onto ${aggregate.uniqueTopChoices}/${aggregate.profileCount} unique top choices`);
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
const systemsStress = diagnostics.profiles.find((profile) => profile.id === "systems_architect").randomFiveSignalStress;
const openWorldStress = stressAggregate.profiles.find((profile) => profile.id === "open_world_wanderer");
assert(systemsStress.weakestScenarios[0].ndcgAt6 >= 0.7, `Systems profile still collapses under positive-only evidence: ${systemsStress.weakestScenarios[0].ndcgAt6}`);
assert(openWorldStress.meanNdcgAt6 >= 0.75 && openWorldStress.highFitTopChoiceRate >= 0.95, `Open-world profile remains unstable: ${JSON.stringify(openWorldStress)}`);
contradictoryFullProfiles.forEach((profile) => {
  assert(profile.metrics.ndcgAt6 >= 0.75, `${profile.name} contradictory full-profile NDCG@6 is too low: ${profile.metrics.ndcgAt6}`);
  assert(profile.metrics.highFitPrecisionAt3 >= 0.67, `${profile.name} contradictory full-profile precision@3 is too low`);
  assert(profile.metrics.avoidIntrusionsAt3 === 0, `${profile.name} contradictory full profile surfaced an avoid title`);
  assert(profile.metrics.positiveAvoidMargin >= 25, `${profile.name} contradictory full-profile margin is too small`);
});
contradictoryStarterProfiles.forEach((profile) => {
  assert(profile.ratingCount === 5 && profile.signalMode === "quick", `${profile.name} contradictory starter bypassed the five-signal path`);
  assert(profile.metrics.ndcgAt6 >= 0.75, `${profile.name} contradictory five-signal NDCG@6 is too low: ${profile.metrics.ndcgAt6}`);
  assert(profile.metrics.highFitPrecisionAt3 >= 0.67, `${profile.name} contradictory five-signal precision@3 is too low`);
  assert(profile.metrics.avoidIntrusionsAt3 === 0, `${profile.name} contradictory five-signal profile surfaced an avoid title`);
});
assert(contradictoryStarterAggregate.meanNdcgAt6 >= 0.76, `Contradictory five-signal mean NDCG regressed: ${contradictoryStarterAggregate.meanNdcgAt6}`);
assert(contradictoryStressAggregate.meanNdcgAt6 >= 0.82, `Contradictory stress mean NDCG regressed: ${contradictoryStressAggregate.meanNdcgAt6}`);
contradictoryStressAggregate.profiles.forEach((profile) => {
  assert(profile.meanNdcgAt6 >= 0.75, `${profile.name} contradictory stress NDCG is too low: ${profile.meanNdcgAt6}`);
  assert(profile.highFitTopChoiceRate >= 0.85, `${profile.name} contradictory stress high-fit winner rate is too low`);
  assert(profile.avoidFreeTop3Rate >= 0.95, `${profile.name} contradictory stress avoid-free rate is too low`);
});
const contradictoryIntensityReads = [
  ...contradictoryFullProfiles.map((profile) => profile.intensityPreference),
  ...contradictoryStarterProfiles.map((profile) => profile.intensityPreference),
];
assert(contradictoryIntensityReads.some((preference) => preference.kind === "balanced"), "Contradictory profiles should preserve at least one balanced intensity read");
assert(contradictoryIntensityReads.every((preference) => preference.confidence !== "high"), "Contradictory profiles must not claim high intensity confidence");
