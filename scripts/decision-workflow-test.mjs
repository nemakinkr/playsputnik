import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/app-decisions.js", import.meta.url), "utf8");
const context = { window: {}, Date, Map, Set };
vm.runInNewContext(source, context, { filename: "src/app-decisions.js" });

const state = { comparisonGames: { first: "", second: "" }, ratingQueue: {} };
const events = [];
const key = (title) => String(title || "").toLowerCase();
const tools = context.window.PlaySputnikDecisions.createDecisionTools({
  getState: () => state,
  titleKey: key,
  titleMatches: (a, b) => key(a) === key(b),
  personalRatingForecast: (game) => ({ rating: game.forecast }),
  recordUserEvent: (type, title, detail = {}) => events.push({ type, title, detail }),
});

tools.selectTitleForComparison("Control", { source: "search" });
tools.selectTitleForComparison("Alan Wake 2", { source: "detail" });
assert.deepEqual(
  { ...state.comparisonGames },
  { first: "Control", second: "Alan Wake 2" },
  "comparison selection should fill both slots",
);
tools.swapComparisonGames();
assert.equal(state.comparisonGames.first, "Alan Wake 2");

const ranked = [
  { title: "Control", score: 88, forecast: 84 },
  { title: "Alan Wake 2", score: 94, forecast: 91 },
];
const pair = tools.comparisonPair(ranked);
assert.equal(pair.primary.title, "Alan Wake 2");
assert.equal(pair.alternative.title, "Control");

assert.equal(tools.toggleRatingQueueTitle("Control"), true);
assert.equal(tools.isTitleQueued("Control"), true);
assert.equal(tools.toggleRatingQueueTitle("Alan Wake 2"), true);
assert.equal(tools.ratingQueueItems(ranked)[0].game.title, "Alan Wake 2");
assert.equal(tools.removeRatingQueueGame("Control"), true);
assert.equal(tools.isTitleQueued("Control"), false);
assert(events.some((event) => event.type === "comparison_game_selected"));
assert(events.some((event) => event.type === "rating_queue_added"));

console.log("✅ decision workflows keep comparison and rate-later state deterministic");
