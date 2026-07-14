import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/app-score.js", import.meta.url), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function preference(atomWeights, importedCount = 10) {
  const sandbox = { window: { PlaySputnikI18n: { t: (key) => key } }, Math, Set };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "src/app-score.js" });
  const state = {
    atomWeights,
    importedRatings: Array.from({ length: importedCount }, (_, index) => ({ title: `Signal ${index}`, rating: 8 })),
    feedbackLog: [], liked: new Set(), quickReactions: {}, userGames: {},
    notebook: { ranked: [], completed: [], wishlist: [], access: [] },
  };
  const tools = sandbox.window.PlaySputnikScore.createScoreTools({
    getState: () => state,
    getProfileGames: () => [],
    getQuickReaction: () => "",
    getFeedbackSource: () => null,
    getTasteConflict: () => ({ atoms: [] }),
    getTasteSignalCount: () => 0,
    getRecommendationPool: () => [],
    titleMatches: (left, right) => left === right,
    titleKey: (title) => title,
    effectiveGameState: () => "",
    getSubscriptionStatus: () => ({ canConfirm: false }),
    getPriceStatus: () => ({ canConfirm: false }),
    QUICK_TASTE_FIRST_TARGET: 5,
  });
  return tools.tasteIntensityPreference();
}

const calm = preference({ "intensity:low": 6, "intensity:high": -4 });
const intense = preference({ "intensity:low": -5, "intensity:high": 7 });
const balanced = preference({ "intensity:low": 5, "intensity:high": 5 });
const uncertain = preference({}, 0);

assert(calm.kind === "calm" && calm.confidence === "high", `Expected high-confidence calm preference, got ${JSON.stringify(calm)}`);
assert(intense.kind === "intense" && intense.confidence === "high", `Expected high-confidence intense preference, got ${JSON.stringify(intense)}`);
assert(balanced.kind === "balanced" && balanced.confidence === "low", `Expected balanced preference without false certainty, got ${JSON.stringify(balanced)}`);
assert(uncertain.kind === "uncertain", `Expected uncertain empty preference, got ${JSON.stringify(uncertain)}`);

console.log("✅ Intensity preference distinguishes calm, intense, balanced and sparse profiles");
