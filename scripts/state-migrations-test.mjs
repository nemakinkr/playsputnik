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
};
const migrated = migrateState(legacy);

assert.equal(migrated.stateVersion, CURRENT_STATE_VERSION);
assert.deepEqual({ ...migrated.comparisonGames }, { first: "", second: "" });
assert.deepEqual({ ...migrated.ratingQueue }, {});
assert.equal(migrated.activeView, "today");
assert.deepEqual([...migrated.providerSearch.results], []);
assert.equal(legacy.stateVersion, undefined, "migration must not mutate stored input");
assert.deepEqual(
  JSON.parse(JSON.stringify(migrateState(migrated))),
  JSON.parse(JSON.stringify(migrated)),
  "migration must be idempotent at the current schema",
);

console.log(`✅ persisted state migrates deterministically to schema v${CURRENT_STATE_VERSION}`);
