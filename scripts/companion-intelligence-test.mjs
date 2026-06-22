import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/app-score.js", import.meta.url), "utf8");
const context = {
  window: {
    PlaySputnikI18n: { t: (key) => key },
  },
  Math,
  Set,
};

vm.runInNewContext(source, context, { filename: "src/app-score.js" });
const { classifyTasteVerdict } = context.window.PlaySputnikScore;

assert.equal(typeof classifyTasteVerdict, "function", "taste verdict classifier should be exported");
function assertVerdict(input, kind, confidenceCap, message) {
  const verdict = classifyTasteVerdict(input);
  assert.equal(verdict.kind, kind, message);
  assert.equal(verdict.confidenceCap, confidenceCap, message);
}

assertVerdict({ pull: 48, caution: -4, uncertainty: 0, confidence: "High" }, "strong", "High");
assertVerdict(
  { pull: 48, caution: -4, uncertainty: -4, confidence: "High" },
  "promising",
  "Medium",
  "a mixed signal should prevent a clean reliable-fit verdict",
);
assertVerdict(
  { pull: 42, caution: -28, uncertainty: -8, confidence: "High" },
  "polarizing",
  "Medium",
  "strong pull plus strong caution must not look like a clean high-confidence match",
);
assertVerdict({ pull: 8, caution: -30, uncertainty: 0, confidence: "High" }, "caution", "Low");
assertVerdict({ pull: 22, caution: -5, uncertainty: 0, confidence: "Medium" }, "promising", "Medium");
assertVerdict({ pull: 8, caution: -2, uncertainty: -4, confidence: "Early" }, "exploratory", "Low");
assert.match(source, /tensionPenalty = pull >= 24 && Math\.abs\(caution\) >= 14 \? 8 : 0/);

const games = [
  { title: "Story A", atoms: ["story", "choice"], tone: "dark", content: "mature", adultTimeFit: "weeknight", commitment: "medium" },
  { title: "Story B", atoms: ["story", "choice"], tone: "dark", content: "mature", adultTimeFit: "weekend", commitment: "high" },
  { title: "Story C", atoms: ["story", "cinematic"], tone: "dark", content: "mature", adultTimeFit: "weeknight", commitment: "medium" },
  { title: "Action A", atoms: ["action", "multiplayer"], tone: "epic", content: "violent", adultTimeFit: "evening", commitment: "medium" },
  { title: "Action B", atoms: ["action", "multiplayer"], tone: "epic", content: "violent", adultTimeFit: "evening", commitment: "high" },
  { title: "Action C", atoms: ["action", "service"], tone: "epic", content: "violent", adultTimeFit: "evening", commitment: "high" },
  { title: "New Story", atoms: ["story", "choice"], tone: "dark", content: "mature", adultTimeFit: "weeknight", commitment: "medium" },
];
const state = {
  importedRatings: [
    { title: "Story A", rating: 9.5 },
    { title: "Story B", rating: 9 },
    { title: "Story C", rating: 8.5 },
    { title: "Action A", rating: 4 },
    { title: "Action B", rating: 3 },
    { title: "Action C", rating: 2.5 },
  ],
  userGames: {},
  quickReactions: {},
  liked: new Set(),
  atomWeights: {},
  feedbackLog: [],
  notebook: { ranked: [], completed: [] },
};
const key = (title) => String(title || "").toLowerCase();
const tools = context.window.PlaySputnikScore.createScoreTools({
  getState: () => state,
  getProfileGames: () => [],
  getQuickReaction: () => "",
  getFeedbackSource: () => null,
  getTasteConflict: () => ({ atoms: [] }),
  getTasteSignalCount: () => 0,
  getRecommendationPool: () => games,
  titleMatches: (a, b) => key(a) === key(b),
  titleKey: key,
  effectiveGameState: () => "",
  getSubscriptionStatus: () => ({ canConfirm: false }),
  getPriceStatus: () => ({ canConfirm: false }),
  QUICK_TASTE_FIRST_TARGET: 3,
});
const calibration = tools.tasteCalibrationProfile();
assert.equal(calibration.ready, true);
assert.equal(calibration.count, 6);
assert(Number.isFinite(calibration.meanAbsoluteError));
const storyForecast = tools.personalRatingForecast(games.at(-1));
assert.equal(storyForecast.known, false);
assert(storyForecast.rating >= 80, `expected a high calibrated story forecast, got ${storyForecast.rating}`);
assert(storyForecast.neighbors.some((title) => title.startsWith("Story")));
assert.equal(storyForecast.calibrated, calibration.trusted);
assert.equal(tools.personalRatingForecast(games[0]).known, true);

console.log("✅ companion intelligence classifies fit and calibrates forecasts with held-out personal ratings");
