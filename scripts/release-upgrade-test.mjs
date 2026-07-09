import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const ROOT = new URL("../", import.meta.url);
const [manifestSource, stateSource, swSource, html, cssCompat] = await Promise.all([
  readFile(new URL("src/module-manifest.js", ROOT), "utf8"),
  readFile(new URL("src/app-state.js", ROOT), "utf8"),
  readFile(new URL("sw.js", ROOT), "utf8"),
  readFile(new URL("index.html", ROOT), "utf8"),
  readFile(new URL("styles.css", ROOT), "utf8"),
]);

const manifestContext = { self: {} };
vm.runInNewContext(manifestSource, manifestContext, { filename: "src/module-manifest.js" });
const phases = manifestContext.self.PlaySputnikModulePhases;
const modules = manifestContext.self.PlaySputnikModules;

assert(Array.isArray(phases) && phases.length >= 4, "runtime manifest should expose dependency phases");
assert.equal(phases.flat().length, modules.length, "every module should appear in exactly one phase");
assert(phases[0].some(({ path }) => path === "src/app-i18n.js"), "i18n engine must load in the first phase");
assert(
  phases.findIndex((phase) => phase.some(({ path }) => path === "src/app-detail.js"))
    > phases.findIndex((phase) => phase.some(({ path }) => path === "src/app-library.js")),
  "detail module must load after its library dependency",
);
assert(/Promise\.all\(phase\.map/.test(html), "HTML boot should parallelize modules inside each dependency phase");

const legacyContext = { window: {}, Date, Map, Set };
vm.runInNewContext(stateSource, legacyContext, { filename: "src/app-state.js" });
const tools = legacyContext.window.PlaySputnikState.createStateTools({
  config: {
    STORAGE_KEY: "legacy",
    QUICK_TASTE_FIRST_TARGET: 5,
    ACCESS_STATES: [],
    COMPLETION_STATUS_STATES: [],
  },
  profileGames: [],
  titleMatches: (a, b) => a === b,
  titleKey: (title) => String(title || "").toLowerCase(),
  normalizeTitle: (title) => String(title || "").toLowerCase(),
  emptyNotebook: () => ({}),
  storage: {
    getItem: () => JSON.stringify({ liked: [], saved: [], hidden: [], snoozed: [] }),
    setItem: () => {},
  },
});
assert.equal(tools.loadState().stateVersion, 0, "cached shells must boot without the migration module");

assert(/request\.mode === "navigate"[\s\S]*networkFirstWithCache/.test(swSource), "navigations must be network-first");
assert(!/request\.mode === "navigate"\s*\|\|/.test(swSource), "navigations must not fall through to cache-first assets");
assert(/class="is-app-booting"/.test(html), "HTML should block interaction until app.js is ready");
assert(/id="app-boot-overlay"/.test(html), "HTML should show an explicit boot surface");
assert(/styles\/foundation\.css/.test(html) && /styles\/themes\.css/.test(html), "fresh HTML should load split styles");
assert(/@import url\("styles\/foundation\.css"\)/.test(cssCompat), "cached HTML should retain a compatible styles.css entrypoint");

console.log(`✅ release upgrades remain interactive across ${phases.length} parallel boot phases`);
