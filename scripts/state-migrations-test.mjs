import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/app-state-migrations.js", import.meta.url), "utf8");
const context = { window: {} };
vm.runInNewContext(source, context, { filename: "src/app-state-migrations.js" });

const { CURRENT_STATE_VERSION, migrateState } = context.window.PlaySputnikStateMigrations;
const legacy = {
  liked: ["Control"],
  providerSearch: { query: "alan wake", results: "invalid" },
  providerSearchCache: { broken: { results: "invalid" } },
};
const migrated = migrateState(legacy);

assert.equal(migrated.stateVersion, CURRENT_STATE_VERSION);
assert.deepEqual({ ...migrated.comparisonGames }, { first: "", second: "" });
assert.deepEqual({ ...migrated.ratingQueue }, {});
assert.equal(migrated.activeView, "today");
assert.deepEqual([...migrated.providerSearch.results], []);
assert.deepEqual({ ...migrated.providerSearchCache }, {});
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
    QUICK_TASTE_FIRST_TARGET: 3,
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
