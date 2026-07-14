import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/app-ranking.js", import.meta.url), "utf8");
const context = {
  window: {
    PlaySputnikConfig: {},
    PlaySputnikScore: {},
    PlaySputnikRecommend: {},
    PlaySputnikI18n: { t: (key) => key },
  },
  Set,
  Math,
};
vm.runInNewContext(source, context, { filename: "src/app-ranking.js" });
const { recommendationSimilarity, diversifyRecommendationOrder } = context.window.PlaySputnikRanking;
const { createRankingTools } = context.window.PlaySputnikRanking;

const ranked = [
  { title: "Story Prime", score: 100, atoms: ["story", "choice", "cinematic"], session: "medium", tone: "dark" },
  { title: "Story Echo", score: 99, atoms: ["story", "choice", "cinematic"], session: "medium", tone: "dark" },
  { title: "Story Echo 2", score: 98, atoms: ["story", "choice", "cinematic"], session: "medium", tone: "dark" },
  { title: "Action Break", score: 97, atoms: ["action", "shooter", "adrenaline"], session: "short", tone: "epic" },
  { title: "Systems Break", score: 96, atoms: ["systems", "strategy", "turn-based"], session: "long", tone: "neutral" },
  { title: "Cozy Break", score: 95, atoms: ["cozy", "routine", "management"], session: "short", tone: "warm" },
  { title: "Story Tail", score: 94, atoms: ["story", "choice"], session: "medium", tone: "dark" },
  { title: "Weak Novelty", score: 70, atoms: ["racing"], session: "short", tone: "light" },
];

const diversified = diversifyRecommendationOrder(ranked);
const repeated = diversifyRecommendationOrder(ranked);
const averagePairSimilarity = (items) => {
  const pairs = [];
  for (let left = 0; left < items.length; left += 1) {
    for (let right = left + 1; right < items.length; right += 1) {
      pairs.push(recommendationSimilarity(items[left], items[right]));
    }
  }
  return pairs.reduce((sum, value) => sum + value, 0) / pairs.length;
};

assert.equal(diversified[0].title, ranked[0].title, "diversity must never replace the strongest recommendation");
assert(diversified.slice(0, 3).some((game) => game.title === "Action Break"), "a near-tied different experience should enter the top 3");
assert(!diversified.slice(0, 6).some((game) => game.title === "Weak Novelty"), "diversity must not promote a materially weaker game");
assert(
  averagePairSimilarity(diversified.slice(0, 3)) < averagePairSimilarity(ranked.slice(0, 3)),
  "top-3 similarity should decrease",
);
assert.equal(
  diversified.map((game) => game.title).sort().join("|"),
  ranked.map((game) => game.title).sort().join("|"),
  "reranking must preserve every candidate exactly once",
);
assert.equal(
  diversified.map((game) => game.title).join("|"),
  repeated.map((game) => game.title).join("|"),
  "reranking must be deterministic",
);
const runtimeTools = createRankingTools({
  getState: () => ({ hidden: new Set(), snoozed: new Set() }),
  getRecommendationPool: () => ranked,
  getGameUserState: () => "",
  getSelectedAtoms: () => [],
  getBlocksPurchase: () => false,
  RANK_EXCLUDED_STATES: [],
  LIBRARY_ACTIVE_STATES: [],
  notebookCompletedSet: () => new Set(),
  notebookRankedSet: () => new Set(),
  scoreGame: (game) => game.score,
  notebookWishlistWeight: () => 0,
  priceCanGuideBuy: () => false,
  priceStatus: () => ({ canConfirm: false }),
  subscriptionStatus: () => ({ canConfirm: false }),
  watchOuts: () => [],
  effectiveGameState: () => "",
  titleKey: (title) => title.toLowerCase(),
});
assert.equal(
  runtimeTools.rankedGames().map((game) => game.title).join("|"),
  diversified.map((game) => game.title).join("|"),
  "the production rankedGames path must apply controlled diversity",
);

console.log(`✅ Recommendation diversity preserves #1 and quality floor while reducing top-3 similarity from ${averagePairSimilarity(ranked.slice(0, 3)).toFixed(2)} to ${averagePairSimilarity(diversified.slice(0, 3)).toFixed(2)}`);
