import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/app-state-migrations.js", import.meta.url), "utf8");
const context = { window: {} };
vm.runInNewContext(source, context, { filename: "src/app-state-migrations.js" });

const { CURRENT_STATE_VERSION, migrateState } = context.window.PlaySputnikStateMigrations;
const legacy = {
  liked: ["Control"],
  providerSearch: { query: "alan wake", resultShapeVersion: "search-result-v2", results: [] },
  providerSearchCache: {
    broken: { results: "invalid" },
    stale: { resultShapeVersion: "search-result-v2", results: [{ title: "Stale" }] },
    current: { resultShapeVersion: "search-result-v3", results: [{ title: "Current" }] },
  },
  importLookupQueue: ["Alan Wake 2"],
  importLookupResolved: { "alan wake 2": true },
  userGames: { control: { title: "Control", completionStatus: "playing", hoursPlayed: 2 } },
  userEvents: [{ type: "game_session_logged", title: "Control", detail: { minutes: 60 }, at: "2026-07-16T20:00:00.000Z" }],
};
const migrated = migrateState(legacy);

assert.equal(migrated.stateVersion, CURRENT_STATE_VERSION);
assert.deepEqual({ ...migrated.comparisonGames }, { first: "", second: "" });
assert.deepEqual({ ...migrated.ratingQueue }, {});
assert.equal(migrated.activeView, "today");
assert.deepEqual([...migrated.providerSearch.results], []);
assert.deepEqual(Object.keys(migrated.providerSearchCache), ["current"]);
assert.equal(migrated.providerSearch.query, "");
assert.equal(migrated.importLookupItems["alan wake 2"].status, "resolved");
assert.equal(migrated.importLookupItems["alan wake 2"].kind, "lookup");
assert.equal(migrated.aiImportDraft, null);
assert.equal(migrated.aiTodayRerank, null);
assert.equal(migrated.userGames.control.playProgress.sessionCount, 0);
assert.deepEqual([...migrated.userGames.control.playProgress.sessions], []);
assert.equal(migrated.continuityFocusTitle, "");
assert.deepEqual(JSON.parse(JSON.stringify(migrated.dailyBriefing)), { date: "", actions: [], completedAt: null });
assert.equal(migrated.userEvents[0].schemaVersion, 1);
assert.equal(migrated.userEvents[0].occurredAt, "2026-07-16T20:00:00.000Z");
assert.equal(migrated.userEvents[0].payload.minutes, 60);
assert.deepEqual(JSON.parse(JSON.stringify(migrated.providerEnrichmentBudget)), { date: "", used: 0, cap: 20 });
assert.deepEqual(JSON.parse(JSON.stringify(migrated.syncMeta)), {
  profileId: "",
  revision: 0,
  baseRevision: 0,
  updatedAt: null,
  lastPayloadHash: "",
  lastSyncedRevision: 0,
  lastSyncedAt: null,
});
assert.equal(legacy.stateVersion, undefined, "migration must not mutate stored input");
assert.deepEqual(
  JSON.parse(JSON.stringify(migrateState(migrated))),
  JSON.parse(JSON.stringify(migrated)),
  "migration must be idempotent at the current schema",
);

console.log(`✅ persisted state migrates deterministically to schema v${CURRENT_STATE_VERSION}`);

const stateSource = await readFile(new URL("../src/app-state.js", import.meta.url), "utf8");
const legacyContext = { window: {}, Date, Map, Set };
vm.runInNewContext(stateSource, legacyContext, { filename: "src/app-state.js" });
const storageWrites = [];
const legacyTools = legacyContext.window.PlaySputnikState.createStateTools({
  config: {
    STORAGE_KEY: "test-state",
    QUICK_TASTE_FIRST_TARGET: 5,
    ACCESS_STATES: ["owned"],
    COMPLETION_STATUS_STATES: ["playing", "completed"],
  },
  profileGames: [],
  titleMatches: (a, b) => a === b,
  titleKey: (title) => String(title || "").toLowerCase(),
  normalizeTitle: (title) => String(title || "").toLowerCase(),
  emptyNotebook: () => ({}),
  storage: {
    getItem: () => JSON.stringify({ liked: [], saved: [], hidden: [], snoozed: [] }),
    setItem: (key, value) => storageWrites.push({ key, value }),
  },
});
const legacyShellState = legacyTools.loadState();
assert.equal(legacyShellState.stateVersion, 0, "cached shells should use the compatibility schema");
legacyTools.saveState(legacyShellState);
assert.equal(JSON.parse(storageWrites[0].value).stateVersion, 0);

console.log("✅ cached pre-migration shells remain interactive during release upgrades");
