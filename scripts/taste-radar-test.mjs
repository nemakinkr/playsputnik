import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const radar = JSON.parse(await readFile(new URL("../data/taste-radar.json", import.meta.url), "utf8"));
const oldSamples = new Set(["Blood Meridian Road", "Signal House", "Iron Saints", "Little Orbit Cafe", "The Long Gate"]);
assert(radar.length >= 12, "radar needs enough real candidates to personalize");
assert.equal(new Set(radar.map((item) => item.title.toLowerCase())).size, radar.length, "radar titles must be unique");
radar.forEach((item) => {
  assert(!oldSamples.has(item.title), `fictional sample leaked into radar: ${item.title}`);
  assert.equal(item.source, "rawg");
  assert.match(item.sourceUrl, /^https:\/\/rawg\.io\/games\//);
  assert.match(item.coverUrl, /^https?:\/\//);
  assert.match(item.releaseDate, /^\d{4}-\d{2}-\d{2}$/);
  assert(item.checkedAt && item.releaseConfidence === "medium");
  assert(!("price" in item) && !("subscription" in item), "radar must not invent commerce data");
});

const source = await readFile(new URL("../src/app-radar.js", import.meta.url), "utf8");
function rankedFor(weights, selected) {
  const context = {
    window: { PlaySputnikConfig: {}, PlaySputnikSearch: {}, PlaySputnikScore: {} },
    Date, Set,
  };
  vm.runInNewContext(source, context, { filename: "src/app-radar.js" });
  return context.window.PlaySputnikRadar.createRadarTools({
    getState: () => ({ atomWeights: weights, session: "short" }),
    getSelectedAtoms: () => selected,
    getSourceGames: () => [], getSourceStatus: () => ({}), tasteRadar: radar, monthlyDrop: [],
    normalizeTitle: (value) => value, titleMatches: (a, b) => a === b, titleIncludes: () => false,
    gameSignals: () => [], combinedTasteWeight: (atom) => weights[atom] || 0,
  }).rankedRadar();
}
const storyTop = rankedFor({ story: 4, atmosphere: 2 }, ["story"])[0];
const actionTop = rankedFor({ action: 4, shooter: 3 }, ["action"])[0];
assert(storyTop.evidence.fitConfidence !== "exploratory", "story profile should receive taste evidence");
assert(actionTop.evidence.fitConfidence !== "exploratory", "action profile should receive taste evidence");
assert.notEqual(storyTop.title, actionTop.title, "contrasting profiles should not get the same radar leader");

console.log(`✅ taste radar has ${radar.length} sourced releases and changes leader across contrasting profiles`);
