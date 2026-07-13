import { readFile } from "node:fs/promises";
import vm from "node:vm";

const ROOT = new URL("../", import.meta.url);
const rankingText = await readFile(new URL("test/fixtures/founder-ranking-ru.txt", ROOT), "utf8");
const games = JSON.parse(await readFile(new URL("data/games.json", ROOT), "utf8"));
const titleAliases = JSON.parse(await readFile(new URL("data/title-aliases.json", ROOT), "utf8"));
const catalogBackbone = JSON.parse(await readFile(new URL("data/catalog-backbone.json", ROOT), "utf8"));
const globalSearchFixtures = JSON.parse(await readFile(new URL("data/global-search-fixtures.json", ROOT), "utf8"));
const appRadarSource = await readFile(new URL("src/app-radar.js", ROOT), "utf8");
const appScoreSource = await readFile(new URL("src/app-score.js", ROOT), "utf8");
const appRecommendSource = await readFile(new URL("src/app-recommend.js", ROOT), "utf8");
const appSource = await readFile(new URL("app.js", ROOT), "utf8");
const OUTPUT_JSON = process.argv.includes("--json");

const SEED_TOP_10_MIN_MATCHED = 8;
const SEED_TOTAL_MIN_COVERAGE = 0.35;
const KNOWN_TOP_30_MIN_MATCHED = 22;
const KNOWN_TOP_60_MIN_MATCHED = 60;
const KNOWN_TOTAL_MIN_COVERAGE = 0.54;
const BOTTOM_MIN_DERIVED_RATING = 58;

function normalizeTitle(title) {
  return String(title || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

function aliasEntryForTitle(title) {
  const normalized = normalizeTitle(title);
  return titleAliases.find((entry) => {
    const keys = [entry.title, ...(entry.aliases || [])].map(normalizeTitle);
    return keys.includes(normalized);
  });
}

function titleKey(title) {
  const entry = aliasEntryForTitle(title);
  return normalizeTitle(entry?.title || title);
}

function stripRankingMarker(line) {
  return line
    .trim()
    .replace(/^(?:[0-9]\uFE0F?\u20E3)+\s*/u, "")
    .replace(/^✅\s*/u, "")
    .trim();
}

function parseRanking(text) {
  return text
    .split(/\n|\r\n/)
    .map(stripRankingMarker)
    .filter(Boolean)
    .map((title, index) => ({
      rank: index + 1,
      title,
      derivedRating: derivedRating(index + 1, text.split(/\n|\r\n/).filter((line) => stripRankingMarker(line)).length),
    }));
}

// A ranked-favorites list is ordinal, not a dislike list. Keep the tail positive:
// low-ranked completed games still teach taste, just less strongly than the top.
function derivedRating(rank, total) {
  if (total <= 1) return 100;
  return Math.round(100 - ((rank - 1) / (total - 1)) * (100 - BOTTOM_MIN_DERIVED_RATING));
}

function gameSignals(game) {
  return [
    ...(game.atoms || []),
    game.tone,
    game.content,
    game.session && `session:${game.session}`,
    game.length && `length:${game.length}`,
    game.adultTimeFit && `fit:${game.adultTimeFit}`,
    game.commitment && `commitment:${game.commitment}`,
  ].filter(Boolean);
}

function appTasteSignals(game) {
  return [
    ...(game.atoms || []),
    game.tone,
    game.content,
    game.adultTimeFit,
    game.commitment,
  ].filter(Boolean);
}

function rankedImportWeights(rows) {
  const weights = {};
  rows.forEach((row) => {
    const scoringGame = row.scoringGame || row.game;
    if (!scoringGame) return;
    const rating = row.derivedRating / 10;
    const polarity = rating >= 7 ? 1 : rating <= 5 ? -1 : 0;
    const strength = polarity > 0 ? rating - 6 : polarity < 0 ? 6 - rating : 0;
    if (!strength) return;
    appTasteSignals(scoringGame).forEach((signal) => {
      weights[signal] = (weights[signal] || 0) + polarity * strength;
    });
  });
  return weights;
}

function rankedImportScore(game, weights) {
  return appTasteSignals(game).reduce((sum, signal) => sum + Math.max(0, weights[signal] || 0), 0);
}

function founderRecommendationScore(game, weights) {
  const atoms = new Set(game.atoms || []);
  const taste = rankedImportScore(game, weights);
  const intent = game.wishlist ? 55 : 0;
  const sessionFit = game.session === "medium" ? 8 : game.session === "long" ? -8 : 0;
  const serviceFriction =
    (atoms.has("sports") ? 60 : 0)
    + (atoms.has("competitive") ? 20 : 0)
    + (atoms.has("annual") ? 12 : 0);
  return Math.round(taste + intent + sessionFit - serviceFriction);
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function countSignals(rows) {
  const counts = new Map();
  rows.forEach(({ game }) => {
    if (!game) return;
    gameSignals(game).forEach((signal) => counts.set(signal, (counts.get(signal) || 0) + 1));
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .map(([signal, count]) => ({ signal, count }));
}

function signalPrevalence(rows) {
  const counts = new Map();
  rows.forEach(({ game, scoringGame }) => {
    const source = scoringGame || game;
    if (!source) return;
    new Set(gameSignals(source)).forEach((signal) => counts.set(signal, (counts.get(signal) || 0) + 1));
  });
  return new Map([...counts].map(([signal, count]) => [signal, count / rows.length]));
}

function hasCyrillic(value) {
  return /\p{Script=Cyrillic}/u.test(value);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadAppRankedParser() {
  const sandbox = {
    window: {
      PlaySputnikConfig: {},
      PlaySputnikSearch: {},
      PlaySputnikScore: {},
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(appRadarSource, sandbox, { filename: "src/app-radar.js" });
  const tools = sandbox.window.PlaySputnikRadar.createRadarTools({
    getState: () => ({}),
    getSelectedAtoms: () => [],
    getSourceGames: () => [],
    getSourceStatus: () => ({}),
    tasteRadar: [],
    monthlyDrop: [],
    normalizeTitle,
    titleMatches: (a, b) => titleKey(a) === titleKey(b),
    titleIncludes: (title, needle) => normalizeTitle(title).includes(needle),
    gameSignals: appTasteSignals,
    combinedTasteWeight: () => 0,
  });
  return tools.parseRankedTasteLines;
}

function loadScoreTools(state, pool) {
  const sandbox = {
    window: { PlaySputnikI18n: { t: (key) => key } },
    Math,
    Set,
  };
  vm.createContext(sandbox);
  vm.runInContext(appScoreSource, sandbox, { filename: "src/app-score.js" });
  return sandbox.window.PlaySputnikScore.createScoreTools({
    getState: () => state,
    getProfileGames: () => [],
    getQuickReaction: () => "",
    getFeedbackSource: () => null,
    getTasteConflict: () => ({ atoms: [] }),
    getTasteSignalCount: () => 0,
    getRecommendationPool: () => pool,
    getTasteReferencePool: () => pool,
    titleMatches: (a, b) => titleKey(a) === titleKey(b),
    titleKey,
    effectiveGameState: () => "",
    getSubscriptionStatus: () => ({ canConfirm: false }),
    getPriceStatus: () => ({ canConfirm: false }),
    QUICK_TASTE_FIRST_TARGET: 5,
  });
}

const gameByKey = new Map(games.map((game) => [titleKey(game.title), game]));
const knownCorpus = [
  ...games.map((game) => ({ ...game, corpus: "seed" })),
  ...(catalogBackbone.records || []).map((record) => ({ ...record, corpus: "backbone" })),
  ...(globalSearchFixtures.records || []).map((record) => ({ ...record, corpus: "external" })),
];
const corpusPriority = { seed: 0, backbone: 1, external: 2 };
const knownByKey = new Map();
knownCorpus.forEach((record) => {
  const key = titleKey(record.title);
  const existing = knownByKey.get(key);
  if (!existing || (corpusPriority[record.corpus] ?? 9) < (corpusPriority[existing.corpus] ?? 9)) {
    knownByKey.set(key, record);
  }
});
const ranking = parseRanking(rankingText);
const appParsedRanking = loadAppRankedParser()(rankingText);
const rows = ranking.map((entry) => {
  const key = titleKey(entry.title);
  const game = gameByKey.get(key) || null;
  const known = knownByKey.get(key) || null;
  return {
    ...entry,
    key,
    matchedTitle: game?.title || "",
    knownTitle: known?.title || "",
    knownCorpus: known?.corpus || "",
    game,
    known,
    scoringGame: game || known,
    matchKind: game ? (normalizeTitle(game.title) === normalizeTitle(entry.title) ? "title" : "alias") : "missing",
  };
});

const matched = rows.filter((row) => row.game);
const knownMatched = rows.filter((row) => row.known);
const missing = rows.filter((row) => !row.game);
const unknown = rows.filter((row) => !row.known);
const scoringMatched = rows.filter((row) => row.scoringGame);
const top10 = rows.slice(0, 10);
const top30 = rows.slice(0, 30);
const top60 = rows.slice(0, 60);
const bottom25 = rows.slice(-25);
const top25 = rows.slice(0, 25);
const top10Matched = top10.filter((row) => row.game).length;
const top30Matched = top30.filter((row) => row.game).length;
const top60Matched = top60.filter((row) => row.game).length;
const knownTop30Matched = top30.filter((row) => row.known).length;
const knownTop60Matched = top60.filter((row) => row.known).length;
const coverage = matched.length / rows.length;
const knownCoverage = knownMatched.length / rows.length;
const platformMarkerLeaks = rows.filter((row) => /^[0-9]\uFE0F?\u20E3/u.test(row.title));
const russianSeedGaps = missing.filter((row) => hasCyrillic(row.title));
const russianUnknown = unknown.filter((row) => hasCyrillic(row.title));
const topMissing = missing.filter((row) => row.rank <= 30);
const topUnknown = unknown.filter((row) => row.rank <= 30);
const top60Unknown = unknown.filter((row) => row.rank <= 60);
const nextLayerUnknown = unknown.filter((row) => row.rank > 30 && row.rank <= 60);
const onboardingProbeTitles = ["Red Dead Redemption 2", "Cyberpunk 2077", "Stardew Valley"];
const onboardingKnownTasteAnchors = onboardingProbeTitles
  .filter((title) => rows.some((row) => row.game && titleKey(row.title) === titleKey(title)));
const importWeights = rankedImportWeights(rows);
const importTopSignals = Object.entries(importWeights)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .slice(0, 10)
  .map(([signal, weight]) => ({ signal, weight: Math.round(weight * 10) / 10 }));
const top25ImportScores = top25
  .filter((row) => row.scoringGame)
  .map((row) => rankedImportScore(row.scoringGame, importWeights));
const bottom25ImportScores = bottom25
  .filter((row) => row.scoringGame)
  .map((row) => rankedImportScore(row.scoringGame, importWeights));
const top25ImportAverage = average(top25ImportScores);
const bottom25ImportAverage = average(bottom25ImportScores);
const rankedKeys = new Set(rows.map((row) => row.key));
const founderRecommendationPool = games
  .filter((game) => !rankedKeys.has(titleKey(game.title)))
  .map((game) => ({
    title: game.title,
    score: founderRecommendationScore(game, importWeights),
    wishlist: Boolean(game.wishlist),
    atoms: game.atoms || [],
  }))
  .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
const founderWishlistTop = founderRecommendationPool.filter((game) => game.wishlist).slice(0, 8);
const founderPlayTop = founderRecommendationPool.slice(0, 8);
const founderSportsCandidate = founderRecommendationPool.find((game) => game.atoms.includes("sports"));
const founderMafiaCandidate = founderRecommendationPool.find((game) => game.title === "Mafia: The Old Country");
const scoreState = {
  importedRatings: scoringMatched.map((row) => ({
    title: row.scoringGame.title,
    rating: row.derivedRating / 10,
  })),
  userGames: {},
  quickReactions: {},
  calibrationSkips: {},
  liked: new Set(),
  atomWeights: importWeights,
  feedbackLog: [],
  notebook: {
    ranked: rows.map((row) => ({ title: row.scoringGame?.title || row.title, rank: row.rank })),
    completed: [],
  },
};
const calibrationPool = [...new Map(
  scoringMatched.map((row) => [row.key, row.scoringGame]),
).values()];
const calibration = loadScoreTools(scoreState, calibrationPool).tasteCalibrationProfile();
const equivalentRankError = Math.round(
  (calibration.meanAbsoluteError / (100 - BOTTOM_MIN_DERIVED_RATING)) * (rows.length - 1),
);
const topPrevalence = signalPrevalence(top25);
const tailPrevalence = signalPrevalence(bottom25);
const signalLift = [...new Set([...topPrevalence.keys(), ...tailPrevalence.keys()])]
  .map((signal) => ({
    signal,
    top: Number((topPrevalence.get(signal) || 0).toFixed(2)),
    tail: Number((tailPrevalence.get(signal) || 0).toFixed(2)),
    lift: Number(((topPrevalence.get(signal) || 0) - (tailPrevalence.get(signal) || 0)).toFixed(2)),
  }));
const topDiscriminators = signalLift
  .filter((item) => item.lift >= 0.16)
  .sort((a, b) => b.lift - a.lift || a.signal.localeCompare(b.signal))
  .slice(0, 8);
const tailDiscriminators = signalLift
  .filter((item) => item.lift <= -0.16)
  .sort((a, b) => a.lift - b.lift || a.signal.localeCompare(b.signal))
  .slice(0, 8);
const weakDiscriminators = signalLift
  .filter((item) => item.top + item.tail >= 0.32 && Math.abs(item.lift) <= 0.08)
  .sort((a, b) => (b.top + b.tail) - (a.top + a.tail) || a.signal.localeCompare(b.signal))
  .slice(0, 8);
const rankedImportBlock = appSource.slice(
  appSource.indexOf("function analyzeRankedTasteImport"),
  appSource.indexOf("function parsedTasteImportEntries"),
);

const audit = {
  mode: "ranking-dogfood-audit",
  fixture: "test/fixtures/founder-ranking-ru.txt",
  ranking: {
    total: rows.length,
    seedMatched: matched.length,
    seedCoverage: Number(coverage.toFixed(3)),
    seedTop10Matched: top10Matched,
    seedTop30Matched: top30Matched,
    seedTop60Matched: top60Matched,
    seedMissing: missing.length,
    knownMatched: knownMatched.length,
    knownCoverage: Number(knownCoverage.toFixed(3)),
    knownTop30Matched,
    knownTop60Matched,
    unknown: unknown.length,
  },
  parser: {
    platformMarkerLeaks: platformMarkerLeaks.map((row) => row.title),
    lowestDerivedRating: rows.at(-1)?.derivedRating || null,
    tailIsPositiveTaste: (rows.at(-1)?.derivedRating || 0) >= BOTTOM_MIN_DERIVED_RATING,
    appParserCount: appParsedRanking.length,
    appParserFirstTitle: appParsedRanking[0]?.title || "",
    appParserLastTitle: appParsedRanking.at(-1)?.title || "",
  },
  tasteShape: {
    top25Signals: countSignals(top25),
    bottom25Signals: countSignals(bottom25),
    top10Titles: top10.map((row) => row.matchedTitle || row.knownTitle || `UNKNOWN: ${row.title}`),
    discrimination: {
      top: topDiscriminators,
      tail: tailDiscriminators,
      weak: weakDiscriminators,
    },
  },
  onboarding: {
    probeTitles: onboardingProbeTitles,
    knownTasteAnchors: onboardingKnownTasteAnchors,
    hasContrastProbe: onboardingProbeTitles.some((title) => !rows.some((row) => titleKey(row.title) === titleKey(title))),
  },
  rankedImport: {
    matchedRatings: scoringMatched.length,
    seedMatchedRatings: matched.length,
    knownMatchedRatings: knownMatched.length,
    topSignals: importTopSignals,
    top25Average: Number(top25ImportAverage.toFixed(1)),
    bottom25Average: Number(bottom25ImportAverage.toFixed(1)),
    topBeatsTail: top25ImportAverage > bottom25ImportAverage,
    sourceNeutral: !/applyRatingWeight\([^\n]+(?:isAnchor|isProvider|resolution\.status)/.test(rankedImportBlock),
  },
  forecastCalibration: {
    sampleSize: calibration.count,
    ready: calibration.ready,
    trusted: calibration.trusted,
    model: calibration.model,
    meanAbsoluteError: calibration.meanAbsoluteError,
    equivalentRankError,
    modelErrors: calibration.modelErrors,
    rankingQuality: calibration.rankingQuality,
  },
  founderRecommendations: {
    playTop: founderPlayTop.map(({ title, score }) => ({ title, score })),
    wishlistTop: founderWishlistTop.map(({ title, score }) => ({ title, score })),
    sportsCandidate: founderSportsCandidate ? { title: founderSportsCandidate.title, score: founderSportsCandidate.score } : null,
    mafiaCandidate: founderMafiaCandidate ? { title: founderMafiaCandidate.title, score: founderMafiaCandidate.score } : null,
  },
  weakSpots: {
    topMissing: topMissing.map(({ rank, title }) => ({ rank, title })),
    topUnknown: topUnknown.map(({ rank, title }) => ({ rank, title })),
    top60Unknown: top60Unknown.map(({ rank, title }) => ({ rank, title })),
    nextLayerUnknown: nextLayerUnknown.map(({ rank, title }) => ({ rank, title })),
    russianSeedGaps: russianSeedGaps.map(({ rank, title }) => ({ rank, title })),
    russianUnknown: russianUnknown.map(({ rank, title }) => ({ rank, title })),
    seedPromotionCandidates: rows
      .filter((row) => row.rank <= 40 && !row.game && row.known)
      .map(({ rank, title, knownTitle, knownCorpus }) => ({ rank, title, knownTitle, source: knownCorpus })),
    missingSample: missing.slice(0, 20).map(({ rank, title }) => ({ rank, title })),
    unknownSample: unknown.slice(0, 20).map(({ rank, title }) => ({ rank, title })),
  },
  recommendations: [
    russianUnknown.length
      ? "Add high-priority Russian titles to aliases/search before treating imported rankings as reliable."
      : "Russian titles in the provided ranking are covered well enough for this baseline.",
    topMissing.length
      ? "Promote known top favorites from backbone/search into seed before using them for full taste scoring."
      : "Top-30 favorite coverage is strong enough for current recommendation dogfood.",
    topUnknown.length
      ? "Add unknown top favorites to the catalog/search corpus; they are invisible to every product surface."
      : "Top-30 favorites are at least known to search/backbone.",
    nextLayerUnknown.length
      ? "Use the 31-60 ranking window as the next catalog/search expansion queue."
      : "Top-60 favorites are at least known to search/backbone.",
    "Treat ranked-list tail as lower positive affinity, not negative feedback.",
    "Use the top-vs-bottom signal shape to tune taste explanations and onboarding probes.",
  ],
};

if (OUTPUT_JSON) {
  console.log(JSON.stringify(audit, null, 2));
} else {
  const topUnknown = audit.weakSpots.topUnknown.map((item) => `${item.rank}. ${item.title}`).slice(0, 5).join("; ");
  const nextUnknown = audit.weakSpots.nextLayerUnknown.map((item) => `${item.rank}. ${item.title}`).slice(0, 5).join("; ");
  const promotion = audit.weakSpots.seedPromotionCandidates.map((item) => `${item.rank}. ${item.knownTitle} (${item.source})`).slice(0, 5).join("; ");
  console.log(`✅ Ranking dogfood OK: ${audit.ranking.seedMatched}/${audit.ranking.total} seed, ${audit.ranking.knownMatched}/${audit.ranking.total} known, top10 seed ${audit.ranking.seedTop10Matched}/10, top30 known ${audit.ranking.knownTop30Matched}/30, top60 known ${audit.ranking.knownTop60Matched}/60`);
  console.log(`   Top taste shape: ${audit.tasteShape.top25Signals.slice(0, 5).map((item) => `${item.signal}:${item.count}`).join(", ")}`);
  console.log(`   Discriminators: top ${topDiscriminators.slice(0, 4).map((item) => `${item.signal}:${item.lift}`).join(", ")}; tail ${tailDiscriminators.slice(0, 4).map((item) => `${item.signal}:${item.lift}`).join(", ")}`);
  console.log(`   Ranked import: top25 avg ${audit.rankedImport.top25Average}, bottom25 avg ${audit.rankedImport.bottom25Average}, signals ${audit.rankedImport.topSignals.slice(0, 5).map((item) => `${item.signal}:${item.weight}`).join(", ")}`);
  console.log(`   Forecast calibration: ${audit.forecastCalibration.sampleSize} games, ${audit.forecastCalibration.model} model, holdout MAE ${audit.forecastCalibration.meanAbsoluteError} (~${audit.forecastCalibration.equivalentRankError} ranks)`);
  console.log(`   Recommendation quality: P@10 ${audit.forecastCalibration.rankingQuality.precisionAt10}, top-quartile recall ${audit.forecastCalibration.rankingQuality.topQuartileRecall}, bottom intrusions ${audit.forecastCalibration.rankingQuality.bottomIntrusionsAt10}, pairwise ${audit.forecastCalibration.rankingQuality.pairwiseAccuracy}`);
  console.log(`   Founder wishlist: ${audit.founderRecommendations.wishlistTop.slice(0, 5).map((item) => `${item.title}:${item.score}`).join(", ")}`);
  console.log(`   Promote next: ${promotion || "none"}`);
  console.log(`   Unknown top gaps: ${topUnknown || "none"}`);
  console.log(`   Unknown 31-60 gaps: ${nextUnknown || "none"}`);
}

assert(rows.length >= 100, `Expected a large real ranking fixture, got ${rows.length}`);
assert(appParsedRanking.length === rows.length, `App ranked parser should parse ${rows.length} rows, got ${appParsedRanking.length}`);
assert(appParsedRanking[0]?.title === rows[0]?.title, `App ranked parser first title mismatch: ${appParsedRanking[0]?.title}`);
assert(appParsedRanking.at(-1)?.title === rows.at(-1)?.title, `App ranked parser last title mismatch: ${appParsedRanking.at(-1)?.title}`);
assert(platformMarkerLeaks.length === 0, `Platform emoji markers leaked into titles: ${platformMarkerLeaks.map((row) => row.title).join(", ")}`);
assert(top10Matched >= SEED_TOP_10_MIN_MATCHED, `Seed top-10 coverage too low: ${top10Matched}/10`);
assert(coverage >= SEED_TOTAL_MIN_COVERAGE, `Seed ranking coverage too low: ${matched.length}/${rows.length}`);
assert(knownTop30Matched >= KNOWN_TOP_30_MIN_MATCHED, `Known-corpus top-30 coverage too low: ${knownTop30Matched}/30`);
assert(
  audit.weakSpots.seedPromotionCandidates.filter((item) => item.rank <= 30).every((item) => item.source !== "external"),
  "Top-30 seed promotion candidates should be managed by backbone before seed promotion",
);
assert(knownTop60Matched >= KNOWN_TOP_60_MIN_MATCHED, `Known-corpus top-60 coverage too low: ${knownTop60Matched}/60`);
assert(knownCoverage >= KNOWN_TOTAL_MIN_COVERAGE, `Known-corpus ranking coverage too low: ${knownMatched.length}/${rows.length}`);
assert(
  scoringMatched.length >= knownMatched.length,
  `Ranked import scoring should use the known corpus, got ${scoringMatched.length}/${knownMatched.length}`,
);
assert(audit.rankedImport.sourceNeutral, "Explicit taste evidence must not be weakened by catalog source confidence");
assert(
  calibration.count === scoringMatched.length,
  `Forecast calibration should use every resolved ranked game, got ${calibration.count}/${scoringMatched.length}`,
);
assert(
  /getTasteReferencePool:\s*\(\) => tasteReferencePool\(\)/.test(appSource)
    && /function tasteReferencePool\([\s\S]{0,500}globalSearchFixtures\?\.records/.test(appSource),
  "Production calibration must include resolved seed, backbone, and external-fixture taste references",
);
assert(calibration.ready, "The full founder ranking should make personal forecast calibration ready");
assert(calibration.trusted, `Founder ranking calibration should be honest enough to trust, MAE ${calibration.meanAbsoluteError}`);
assert(calibration.rankingQuality?.precisionAt10 >= 0.4, `Founder recommendation P@10 is too low: ${calibration.rankingQuality?.precisionAt10}`);
assert(calibration.rankingQuality?.bottomIntrusionsAt10 <= 1, `Founder recommendation top 10 contains too many tail games: ${calibration.rankingQuality?.bottomIntrusionsAt10}`);
assert(
  equivalentRankError <= 25,
  `Founder ranking forecasts are too imprecise: MAE ${calibration.meanAbsoluteError} equals about ${equivalentRankError} ranks`,
);
assert(topDiscriminators.length >= 3, `Founder ranking should reveal at least three top-vs-tail taste discriminators, got ${topDiscriminators.length}`);
assert(tailDiscriminators.length >= 2, `Founder ranking should reveal at least two tail taste discriminators, got ${tailDiscriminators.length}`);
assert(
  /ratingForecast\.calibrated[\s\S]{0,240}rankRangeForPersonalRating/.test(appRecommendSource),
  "Calibrated personal rank forecasts must use the context-free personal rating model",
);
assert((rows.at(-1)?.derivedRating || 0) >= BOTTOM_MIN_DERIVED_RATING, "Ranked-list tail must remain positive taste evidence");
assert(importTopSignals.some((item) => item.signal === "story"), "Ranked import should learn story as a top signal from the founder ranking");
assert(importTopSignals.every((item) => item.signal !== "sports"), "Ranked import should not learn sports as a top founder taste signal");
assert(
  top25ImportAverage >= bottom25ImportAverage + 8,
  `Ranked import should score top favorites above tail favorites, got ${top25ImportAverage.toFixed(1)} vs ${bottom25ImportAverage.toFixed(1)}`,
);
assert(
  audit.founderRecommendations.wishlistTop.slice(0, 5).some((item) => item.title === "Mafia: The Old Country"),
  "Founder recommendations should keep Mafia: The Old Country in the top wishlist candidates",
);
assert(
  audit.founderRecommendations.wishlistTop.slice(0, 5).some((item) => item.title === "007 First Light"),
  "Founder recommendations should keep 007 First Light in the top wishlist candidates",
);
assert(
  audit.founderRecommendations.wishlistTop.slice(0, 6).some((item) => item.title === "The Alters"),
  "Founder recommendations should keep The Alters near the top wishlist candidates",
);
assert(
  (audit.founderRecommendations.mafiaCandidate?.score || 0) > (audit.founderRecommendations.sportsCandidate?.score || 0) + 150,
  "Founder recommendations should not let sports/service-loop candidates outrank cinematic story candidates",
);
assert(onboardingKnownTasteAnchors.length >= 2, `Onboarding probes should include at least two known taste anchors, got ${onboardingKnownTasteAnchors.join(", ")}`);
assert(audit.onboarding.hasContrastProbe, "Onboarding probes should include at least one contrast game absent from the user's known ranking");
