import { readFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const rankingText = await readFile(new URL("test/fixtures/founder-ranking-ru.txt", ROOT), "utf8");
const games = JSON.parse(await readFile(new URL("data/games.json", ROOT), "utf8"));
const titleAliases = JSON.parse(await readFile(new URL("data/title-aliases.json", ROOT), "utf8"));
const catalogBackbone = JSON.parse(await readFile(new URL("data/catalog-backbone.json", ROOT), "utf8"));
const globalSearchFixtures = JSON.parse(await readFile(new URL("data/global-search-fixtures.json", ROOT), "utf8"));
const OUTPUT_JSON = process.argv.includes("--json");

const SEED_TOP_10_MIN_MATCHED = 8;
const SEED_TOTAL_MIN_COVERAGE = 0.35;
const KNOWN_TOP_30_MIN_MATCHED = 22;
const KNOWN_TOP_60_MIN_MATCHED = 45;
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

function hasCyrillic(value) {
  return /\p{Script=Cyrillic}/u.test(value);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const gameByKey = new Map(games.map((game) => [titleKey(game.title), game]));
const knownCorpus = [
  ...games.map((game) => ({ ...game, corpus: "seed" })),
  ...(catalogBackbone.records || []).map((record) => ({ ...record, corpus: "backbone" })),
  ...(globalSearchFixtures.records || []).map((record) => ({ ...record, corpus: "external" })),
];
const knownByKey = new Map();
knownCorpus.forEach((record) => {
  const key = titleKey(record.title);
  if (!knownByKey.has(key) || knownByKey.get(key).corpus !== "seed") knownByKey.set(key, record);
});
const ranking = parseRanking(rankingText);
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
    matchKind: game ? (normalizeTitle(game.title) === normalizeTitle(entry.title) ? "title" : "alias") : "missing",
  };
});

const matched = rows.filter((row) => row.game);
const knownMatched = rows.filter((row) => row.known);
const missing = rows.filter((row) => !row.game);
const unknown = rows.filter((row) => !row.known);
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
  },
  tasteShape: {
    top25Signals: countSignals(top25),
    bottom25Signals: countSignals(bottom25),
    top10Titles: top10.map((row) => row.matchedTitle || row.knownTitle || `UNKNOWN: ${row.title}`),
  },
  onboarding: {
    probeTitles: onboardingProbeTitles,
    knownTasteAnchors: onboardingKnownTasteAnchors,
    hasContrastProbe: onboardingProbeTitles.some((title) => !rows.some((row) => titleKey(row.title) === titleKey(title))),
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
  const promotion = audit.weakSpots.seedPromotionCandidates.map((item) => `${item.rank}. ${item.knownTitle}`).slice(0, 5).join("; ");
  console.log(`✅ Ranking dogfood OK: ${audit.ranking.seedMatched}/${audit.ranking.total} seed, ${audit.ranking.knownMatched}/${audit.ranking.total} known, top10 seed ${audit.ranking.seedTop10Matched}/10, top30 known ${audit.ranking.knownTop30Matched}/30, top60 known ${audit.ranking.knownTop60Matched}/60`);
  console.log(`   Top taste shape: ${audit.tasteShape.top25Signals.slice(0, 5).map((item) => `${item.signal}:${item.count}`).join(", ")}`);
  console.log(`   Promote next: ${promotion || "none"}`);
  console.log(`   Unknown top gaps: ${topUnknown || "none"}`);
  console.log(`   Unknown 31-60 gaps: ${nextUnknown || "none"}`);
}

assert(rows.length >= 100, `Expected a large real ranking fixture, got ${rows.length}`);
assert(platformMarkerLeaks.length === 0, `Platform emoji markers leaked into titles: ${platformMarkerLeaks.map((row) => row.title).join(", ")}`);
assert(top10Matched >= SEED_TOP_10_MIN_MATCHED, `Seed top-10 coverage too low: ${top10Matched}/10`);
assert(coverage >= SEED_TOTAL_MIN_COVERAGE, `Seed ranking coverage too low: ${matched.length}/${rows.length}`);
assert(knownTop30Matched >= KNOWN_TOP_30_MIN_MATCHED, `Known-corpus top-30 coverage too low: ${knownTop30Matched}/30`);
assert(knownTop60Matched >= KNOWN_TOP_60_MIN_MATCHED, `Known-corpus top-60 coverage too low: ${knownTop60Matched}/60`);
assert(knownCoverage >= KNOWN_TOTAL_MIN_COVERAGE, `Known-corpus ranking coverage too low: ${knownMatched.length}/${rows.length}`);
assert((rows.at(-1)?.derivedRating || 0) >= BOTTOM_MIN_DERIVED_RATING, "Ranked-list tail must remain positive taste evidence");
assert(onboardingKnownTasteAnchors.length >= 2, `Onboarding probes should include at least two known taste anchors, got ${onboardingKnownTasteAnchors.join(", ")}`);
assert(audit.onboarding.hasContrastProbe, "Onboarding probes should include at least one contrast game absent from the user's known ranking");
