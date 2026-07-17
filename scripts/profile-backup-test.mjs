import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const [syncSource, exportSource] = await Promise.all([
  readFile(new URL("../src/app-sync.js", import.meta.url), "utf8"),
  readFile(new URL("../src/app-export.js", import.meta.url), "utf8"),
]);

class FakeFileReader {
  readAsText(file) {
    this.onload({ target: { result: file.contents } });
  }
}

const context = {
  window: {
    PlaySputnikImport: {
      detectFormat: () => ({ type: "unknown" }), parseBackloggdCsv: () => ({}), parseHltbJson: () => ({}),
      parsePlainList: () => ({}), parsePsnTrophyTitles: () => ({}), importSummaryLabel: () => "",
    },
    PlaySputnikState: {},
    PlaySputnikI18n: { t: (key, values = {}) => `${key}:${values.count ?? ""}` },
  },
  Date, Math, Set, Map, FileReader: FakeFileReader,
  setTimeout: () => 0,
};
vm.runInNewContext(syncSource, context, { filename: "src/app-sync.js" });
vm.runInNewContext(exportSource, context, { filename: "src/app-export.js" });

const importedStates = [];
let saves = 0;
let renders = 0;
const els = { exportStatus: { textContent: "" } };
const tools = context.window.PlaySputnikExport.createExportTools({
  getState: () => ({}),
  setState: (state) => importedStates.push(state),
  defaultState: () => ({ liked: new Set(), hidden: new Set(), saved: new Set(), snoozed: new Set(), userGames: {}, syncMeta: {} }),
  hydrateUserGames: (profile) => profile.userGames || {},
  emptyNotebook: () => ({}),
  legacyStateFromUserGame: () => "",
  titleKey: (title) => String(title || "").toLowerCase(),
  applyStateToUserGame: (record) => record,
  userStateToUserGame: (title) => ({ title }),
  stateMigrations: { migrateState: (profile) => ({ ...profile, stateVersion: 11, migratedForTest: true }) },
  getDeviceId: () => "device_local",
  saveState: () => { saves += 1; },
  render: () => { renders += 1; },
  els,
});

const envelope = {
  format: "playsputnik-profile-envelope", envelopeVersion: 1, profileId: "profile_backup", revision: 4,
  profile: {
    liked: ["Control"], hidden: [], saved: [], snoozed: [],
    userGames: { control: { title: "Control", rating: 90 } },
    syncMeta: { profileId: "profile_backup", revision: 4 },
  },
};
tools.importStateJson({ contents: JSON.stringify(envelope) });
assert.equal(importedStates[0].stateVersion, 11, "backup restore must pass through current migrations");
assert.equal(importedStates[0].migratedForTest, true);
assert.equal(importedStates[0].syncMeta.profileId, "profile_backup");
assert(importedStates[0].liked instanceof Set && importedStates[0].liked.has("Control"));
assert.equal(importedStates[0].userGames.control.rating, 90);
assert.equal(saves, 1);
assert.equal(renders, 1);
assert.match(els.exportStatus.textContent, /profileBackupImported/);

tools.importStateJson({ contents: JSON.stringify({ liked: [], hidden: [], saved: [], snoozed: [], userGames: {} }) });
assert.equal(importedStates[1].stateVersion, 11, "legacy backup must also migrate");
assert.match(els.exportStatus.textContent, /legacyBackupImported/);

console.log("✅ versioned and legacy profile backups restore through the current state migration pipeline");
