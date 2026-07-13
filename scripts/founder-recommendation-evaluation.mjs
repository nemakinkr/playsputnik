import { readFile } from "node:fs/promises";
import vm from "node:vm";

const ROOT = new URL("../", import.meta.url);
const gold = JSON.parse(await readFile(new URL("test/fixtures/founder-recommendation-gold.json", ROOT), "utf8"));
const rankingText = await readFile(new URL(gold.rankedFixture, ROOT), "utf8");
const games = JSON.parse(await readFile(new URL("data/games.json", ROOT), "utf8"));
const backbone = JSON.parse(await readFile(new URL("data/catalog-backbone.json", ROOT), "utf8"));
const fixtures = JSON.parse(await readFile(new URL("data/global-search-fixtures.json", ROOT), "utf8"));
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

function appSignals(game) {
  return [
    ...(game.atoms || []),
    game.tone,
    game.content,
    game.adultTimeFit,
    game.commitment,
  ].filter(Boolean);
}

function derivedRating(rank, total) {
  if (total <= 1) return 10;
  return Math.round((10 - ((rank - 1) / (total - 1)) * 4.2) * 10) / 10;
}

function normalizeCandidate(record, source) {
  const atoms = record.atoms || [];
  const session = record.session || "medium";
  const commitment = record.commitment || (session === "long" ? "high" : "medium");
  const tone = atoms.includes("horror") || atoms.includes("dark") ? "dark"
    : atoms.includes("cinematic") ? "epic"
      : "neutral";
  return {
    ...record,
    atoms,
    vibe: record.vibe || record.reason || "Explicit catalog memory candidate",
    session,
    difficulty: record.difficulty || "normal",
    length: record.length || (commitment === "high" ? "long" : "medium"),
    commitment,
    tone: record.tone || tone,
    content: record.content || (atoms.includes("horror") ? "horror-themes" : "stylized-violence"),
    reviewBurden: record.reviewBurden || (record.atomStatus === "complete" ? "medium" : "high"),
    adultTimeFit: record.adultTimeFit || (session === "short" ? "weeknight" : "weekend"),
    backlog: Boolean(record.backlog),
    wishlist: Boolean(record.wishlist),
    externalCandidate: source !== "seed",
    prices: record.prices || {},
    discount: record.discount || {},
    priceMeta: record.priceMeta || {},
    priceHistory: record.priceHistory || {},
    psPlus: record.psPlus || [],
    subscriptionMeta: record.subscriptionMeta || {},
  };
}

const corpus = [
  ...games.map((game) => ({ record: game, source: "seed" })),
  ...(backbone.records || []).map((record) => ({ record, source: "backbone" })),
  ...(fixtures.records || []).map((record) => ({ record, source: "external" })),
];
const byKey = new Map();
corpus.forEach((item) => {
  const key = titleKey(item.record.title);
  if (!byKey.has(key)) byKey.set(key, item);
});

const rankingTitles = rankingText
  .split(/\r?\n/)
  .map((line) => line.trim().replace(/^(?:[0-9]\uFE0F?\u20E3)+\s*/u, ""))
  .filter(Boolean);
const atomWeights = {};
const importedRatings = [];
rankingTitles.forEach((title, index) => {
  const source = byKey.get(titleKey(title));
  if (!source) return;
  const rating = derivedRating(index + 1, rankingTitles.length);
  const strength = rating >= 7 ? rating - 6 : rating <= 5 ? 6 - rating : 0;
  const polarity = rating >= 7 ? 1 : rating <= 5 ? -1 : 0;
  appSignals(source.record).forEach((signal) => {
    atomWeights[signal] = (atomWeights[signal] || 0) + strength * polarity;
  });
  importedRatings.push({ title: source.record.title, rating });
});

const resolvedGold = gold.wishlist.map((entry) => {
  const source = byKey.get(titleKey(entry.title));
  return {
    ...entry,
    source: source?.source || "missing",
    game: source ? normalizeCandidate(source.record, source.source) : null,
  };
});
const candidateGames = resolvedGold.filter((entry) => entry.game).map((entry) => entry.game);
const referencePool = [...byKey.values()].map(({ record }) => record);
const state = {
  importedRatings,
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
  mood: "story",
  session: "short",
  sessionMinutes: 0,
  difficulty: "normal",
  psPlus: true,
  budget: 35,
  notebook: {
    ranked: rankingTitles.map((title, index) => ({ title, rank: index + 1 })),
    completed: [],
    access: [],
    wishlist: gold.wishlist.map(({ title, hearts }) => ({ title, hearts })),
  },
};
const sandbox = { window: { PlaySputnikI18n: { t: (key) => key } }, Math, Set };
vm.createContext(sandbox);
vm.runInContext(scoreSource, sandbox, { filename: "src/app-score.js" });
const tools = sandbox.window.PlaySputnikScore.createScoreTools({
  getState: () => state,
  getProfileGames: () => [],
  getQuickReaction: () => "",
  getFeedbackSource: () => null,
  getTasteConflict: () => ({ atoms: [] }),
  getTasteSignalCount: () => 0,
  getRecommendationPool: () => candidateGames,
  getTasteReferencePool: () => referencePool,
  titleMatches: (a, b) => titleKey(a) === titleKey(b),
  titleKey,
  effectiveGameState: () => "",
  getSubscriptionStatus: () => ({ canConfirm: false }),
  getPriceStatus: () => ({ canConfirm: false }),
  QUICK_TASTE_FIRST_TARGET: 5,
});

const ranked = resolvedGold
  .filter((entry) => entry.game)
  .map((entry) => ({ ...entry, score: tools.scoreGame(entry.game) }))
  .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
const gain = (entry) => ({ must_play: 7, strong_interest: 3, consider: 1 }[entry.label] || 0);
const dcg = (items, limit) => items.slice(0, limit).reduce(
  (sum, item, index) => sum + gain(item) / Math.log2(index + 2),
  0,
);
const ideal = [...ranked].sort((a, b) => gain(b) - gain(a) || a.title.localeCompare(b.title));
const top5 = ranked.slice(0, 5);
const mustPlayTotal = resolvedGold.filter((entry) => entry.label === "must_play").length;
const metrics = {
  coverage: resolvedGold.filter((entry) => entry.game).length / resolvedGold.length,
  ndcgAt10: dcg(ranked, 10) / dcg(ideal, 10),
  mustPlayRecallAt5: top5.filter((entry) => entry.label === "must_play").length / mustPlayTotal,
  highIntentPrecisionAt5: top5.filter((entry) => ["must_play", "strong_interest"].includes(entry.label)).length / top5.length,
};
Object.keys(metrics).forEach((key) => { metrics[key] = Math.round(metrics[key] * 100) / 100; });
const report = {
  mode: "founder-recommendation-evaluation",
  labels: {
    wishlist: gold.wishlist.length,
    confirmedNotForMe: gold.confirmedNotForMe.length,
    unconfirmedContrasts: gold.unconfirmedContrasts.length,
  },
  metrics,
  ranked: ranked.map(({ title, label, hearts, source, score }) => ({ title, label, hearts, source, score })),
  missing: resolvedGold.filter((entry) => !entry.game).map((entry) => entry.title),
  unconfirmedContrasts: gold.unconfirmedContrasts.map((entry) => entry.title),
};

if (OUTPUT_JSON) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`✅ Founder recommendation evaluation: ${report.ranked.length}/${gold.wishlist.length} covered, NDCG@10 ${metrics.ndcgAt10}, must-play recall@5 ${metrics.mustPlayRecallAt5}, high-intent P@5 ${metrics.highIntentPrecisionAt5}`);
  console.log(`   Top 5: ${report.ranked.slice(0, 5).map((entry) => `${entry.title}:${entry.label}:${entry.score}`).join(", ")}`);
  console.log(`   Unconfirmed contrasts excluded from gates: ${report.unconfirmedContrasts.join(", ") || "none"}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(gold.confirmedNotForMe.length === 0, "Do not invent founder dislikes without an explicit label");
assert(metrics.coverage === 1, `Founder wishlist coverage regressed: ${report.ranked.length}/${gold.wishlist.length}; missing ${report.missing.join(", ")}`);
assert(metrics.ndcgAt10 >= 0.9, `Founder wishlist NDCG@10 is too low: ${metrics.ndcgAt10}`);
assert(metrics.mustPlayRecallAt5 >= 0.67, `Founder must-play recall@5 is too low: ${metrics.mustPlayRecallAt5}`);
assert(metrics.highIntentPrecisionAt5 >= 0.8, `Founder high-intent precision@5 is too low: ${metrics.highIntentPrecisionAt5}`);
