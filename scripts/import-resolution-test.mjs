import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/app-import-resolution.js", import.meta.url), "utf8");
const context = { window: {}, Date, Set, Object, Promise };
vm.runInNewContext(source, context, { filename: "src/app-import-resolution.js" });

const state = {
  gameSearchQuery: "",
  importLookupQueue: [],
  importLookupResolved: {},
  importLookupItems: {},
  importLookupBatchSummary: null,
};
const settled = [];
let active = 0;
let maxActive = 0;
let completed = 0;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const titleKey = (title) => String(title || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const tools = context.window.PlaySputnikImportResolution.createImportResolutionTools({
  getState: () => state,
  titleKey,
  titleMatches: (a, b) => titleKey(a) === titleKey(b),
  concurrency: 2,
  fetchProvider: async (query) => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    await wait(8);
    active -= 1;
    if (query === "Gamma") throw new Error("offline");
    if (query === "Beta") return { results: [] };
    return {
      provider: "rawg",
      results: [{
        title: `${query} Deluxe`,
        sourceId: "rawg_provider_hook",
        matchConfidence: "high",
        matchKind: "alias",
      }],
    };
  },
  normalizeProviderResult: (record) => record,
  onResolved: async (entry, result) => settled.push({ entry, result }),
  onComplete: () => { completed += 1; },
  now: () => "2026-07-13T12:00:00.000Z",
});

const queued = tools.queueEntries([
  { title: "Alpha", kind: "rating", rating: 9 },
  { title: "Alpha", kind: "rating", rating: 8 },
  { title: "Beta", kind: "library", userState: "owned" },
  { title: "Gamma", kind: "library", userState: "completed" },
  { title: "Delta", kind: "rating", rating: 7 },
]);
assert.equal(queued.total, 4, "queue should deduplicate titles");
assert.equal(state.importLookupItems.alpha.rating, 9, "first duplicate should retain its import meaning");

const result = await tools.runBatch();
assert.equal(maxActive, 2, "provider concurrency must stay bounded");
assert.equal(result.resolved, 2);
assert.equal(result.review, 1);
assert.equal(result.failed, 1);
assert.equal(result.remaining, 2);
assert.equal(completed, 1);
assert.deepEqual(settled.map(({ entry }) => entry.title).sort(), ["Alpha", "Delta"]);
assert.equal(state.importLookupBatchSummary.status, "partial");
assert.equal(state.importLookupResolved.alpha, true);
assert.equal(state.importLookupItems.beta.status, "review");
assert.equal(state.importLookupItems.gamma.status, "failed");

tools.markResolved("Beta");
assert.equal(tools.progress().resolved, 3, "manual review should remain compatible with the batch queue");
tools.clearQueue();
assert.equal(tools.progress().total, 0);
assert.equal(state.importLookupBatchSummary, null);

const replacementState = {
  gameSearchQuery: "",
  importLookupQueue: [],
  importLookupResolved: {},
  importLookupItems: {},
  importLookupBatchSummary: null,
};
const replacementHits = [];
const replacementTools = context.window.PlaySputnikImportResolution.createImportResolutionTools({
  getState: () => replacementState,
  titleKey,
  titleMatches: (a, b) => titleKey(a) === titleKey(b),
  concurrency: 1,
  fetchProvider: async (query) => {
    await wait(query === "Old import" ? 20 : 1);
    return { results: [{ title: query, sourceId: "rawg_provider_hook", matchConfidence: "high", matchKind: "exact" }] };
  },
  normalizeProviderResult: (record) => record,
  onResolved: async (entry) => replacementHits.push(entry.title),
});
replacementTools.queueEntries([{ title: "Old import" }]);
const oldRun = replacementTools.runBatch();
await wait(2);
replacementTools.queueEntries([{ title: "New import" }]);
const newRun = replacementTools.runBatch();
await Promise.all([oldRun, newRun]);
assert.deepEqual([...replacementState.importLookupQueue], ["New import"]);
assert.deepEqual(replacementHits, ["New import"], "a replacement batch must supersede in-flight provider work");

console.log("✅ imported titles resolve through a bounded, resumable provider queue");
