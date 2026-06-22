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

console.log("✅ companion intelligence distinguishes reliable, polarizing, cautious, and exploratory fit");
