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

function gameSignals(game) {
  return [
    ...(game.atoms || []),
    game.tone,
    game.content,
    game.adultTimeFit,
    game.commitment,
  ].filter(Boolean);
}

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

function loadScoreTools(state, pool, referencePool) {
  const sandbox = { window: { PlaySputnikI18n: { t: (key) => key } }, Math, Set };
  vm.createContext(sandbox);
  vm.runInContext(scoreSource, sandbox, { filename: "src/app-score.js" });
  return sandbox.window.PlaySputnikScore.createScoreTools({
    getState: () => state,
    getProfileGames: () => [],
    getQuickReaction: () => "",
    getFeedbackSource: () => null,
    getTasteConflict: () => ({ atoms: [] }),
    getTasteSignalCount: () => 0,
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

const reports = fixture.profiles.map((profile) => {
  const missingRatings = profile.ratings.filter(({ title }) => !resolve(title)).map(({ title }) => title);
  const atomWeights = atomWeightsFromRatings(profile.ratings);
  const state = {
    importedRatings: profile.ratings.map(({ title, rating }) => ({ title: resolve(title)?.record.title || title, rating })),
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
  const tools = loadScoreTools(state, candidates, referencePool);
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
});

const top3Sets = reports.map((report) => new Set(report.top3.map((row) => titleKey(row.title))));
const similarities = [];
for (let left = 0; left < top3Sets.length; left += 1) {
  for (let right = left + 1; right < top3Sets.length; right += 1) {
    const union = new Set([...top3Sets[left], ...top3Sets[right]]);
    const overlap = [...top3Sets[left]].filter((title) => top3Sets[right].has(title)).length;
    similarities.push(overlap / union.size);
  }
}
const aggregate = {
  profileCount: reports.length,
  candidateCoverage: round(candidates.length / fixture.candidatePool.length),
  ratingCoverage: round(
    reports.reduce((sum, report) => sum + (fixture.profiles.find((profile) => profile.id === report.id).ratings.length - report.missingRatings.length), 0)
      / fixture.profiles.reduce((sum, profile) => sum + profile.ratings.length, 0),
  ),
  meanNdcgAt6: round(reports.reduce((sum, report) => sum + report.metrics.ndcgAt6, 0) / reports.length),
  meanHighFitPrecisionAt3: round(reports.reduce((sum, report) => sum + report.metrics.highFitPrecisionAt3, 0) / reports.length),
  totalAvoidIntrusionsAt3: reports.reduce((sum, report) => sum + report.metrics.avoidIntrusionsAt3, 0),
  meanTop3Jaccard: round(similarities.reduce((sum, value) => sum + value, 0) / similarities.length),
  uniqueTopChoices: new Set(reports.map((report) => titleKey(report.top3[0]?.title))).size,
};
const report = {
  mode: "synthetic-profile-evaluation",
  fixturePolicy: fixture.method,
  aggregate,
  profiles: reports,
  missingCandidates: candidateRows.filter((row) => !row.game).map((row) => row.title),
};

if (OUTPUT_JSON) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`✅ Synthetic profile evaluation: ${aggregate.profileCount} profiles, ${candidates.length}/${fixture.candidatePool.length} candidates, mean NDCG@6 ${aggregate.meanNdcgAt6}, mean high-fit P@3 ${aggregate.meanHighFitPrecisionAt3}`);
  reports.forEach((profile) => {
    console.log(`   ${profile.name}: ${profile.top3.map((row) => `${row.title}:${row.label}:${row.score}`).join(", ")} · margin ${profile.metrics.positiveAvoidMargin}`);
  });
  console.log(`   Personalization: ${aggregate.uniqueTopChoices}/${aggregate.profileCount} unique top choices, mean top-3 overlap ${aggregate.meanTop3Jaccard}`);
}

assert(fixture.profiles.length >= 3, "Synthetic benchmark needs at least three independent profiles");
fixture.profiles.forEach((profile) => {
  const candidateKeys = new Set(fixture.candidatePool.map(titleKey));
  const leaks = profile.ratings.filter(({ title }) => candidateKeys.has(titleKey(title))).map(({ title }) => title);
  assert(leaks.length === 0, `${profile.name} leaks rated titles into the candidate pool: ${leaks.join(", ")}`);
});
assert(aggregate.candidateCoverage === 1, `Synthetic candidate coverage regressed: missing ${report.missingCandidates.join(", ")}`);
assert(aggregate.ratingCoverage === 1, `Synthetic rating coverage regressed: ${reports.flatMap((profile) => profile.missingRatings).join(", ")}`);
reports.forEach((profile) => {
  assert(profile.metrics.ndcgAt6 >= 0.72, `${profile.name} NDCG@6 is too low: ${profile.metrics.ndcgAt6}`);
  assert(profile.metrics.highFitPrecisionAt3 >= 0.67, `${profile.name} high-fit precision@3 is too low: ${profile.metrics.highFitPrecisionAt3}`);
  assert(profile.metrics.avoidIntrusionsAt3 === 0, `${profile.name} surfaced an avoid title in the top 3`);
  assert(profile.metrics.positiveAvoidMargin >= 18, `${profile.name} positive/avoid score margin is too small: ${profile.metrics.positiveAvoidMargin}`);
});
assert(aggregate.uniqueTopChoices === aggregate.profileCount, `Profiles collapsed onto ${aggregate.uniqueTopChoices}/${aggregate.profileCount} unique top choices`);
assert(aggregate.meanTop3Jaccard <= 0.35, `Synthetic top-3 recommendations are too similar: ${aggregate.meanTop3Jaccard}`);
