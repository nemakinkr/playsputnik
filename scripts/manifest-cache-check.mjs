/* Manifest/cache contract gate.
 *
 * The runtime module manifest is the single source of truth for app boot order
 * and Service Worker module precaching. This gate catches drift that can be
 * invisible locally: a module exists but is not in the manifest, the HTML boot
 * path stops using manifest phases, or the SW stops deriving cached modules
 * from the manifest.
 *
 * Usage: node scripts/manifest-cache-check.mjs
 */
import { readFile, access } from "node:fs/promises";
import vm from "node:vm";

const ROOT = new URL("../", import.meta.url);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function unique(values) {
  return [...new Set(values)];
}

async function fileExists(path) {
  try {
    await access(new URL(path, ROOT));
    return true;
  } catch {
    return false;
  }
}

function loadManifest(source) {
  const context = {};
  vm.runInNewContext(source, context, { filename: "src/module-manifest.js" });
  return context.PlaySputnikModules || [];
}

function explicitSwStaticAssets(source) {
  const match = source.match(/const STATIC_ASSETS = \[([\s\S]*?)\n\];/);
  assert(match, "Service Worker must define STATIC_ASSETS");
  return [...match[1].matchAll(/["']\.\/([^"']*)["']/g)].map((item) => item[1]);
}

const [html, swSource, manifestSource] = await Promise.all([
  readFile(new URL("index.html", ROOT), "utf8"),
  readFile(new URL("sw.js", ROOT), "utf8"),
  readFile(new URL("src/module-manifest.js", ROOT), "utf8"),
]);

const modules = loadManifest(manifestSource);
const modulePaths = modules.map((module) => module.path);
const duplicateModules = modulePaths.filter((path, index) => modulePaths.indexOf(path) !== index);

assert(modules.length > 0, "module-manifest.js should expose PlaySputnikModules");
assert(!duplicateModules.length, `Duplicate module manifest paths: ${unique(duplicateModules).join(", ")}`);
assert(
  modules.every((module) => Number.isInteger(module.phase) && module.path && typeof module.path === "string"),
  "Every manifest entry must have a numeric phase and string path",
);

const missingFiles = [];
for (const path of modulePaths) {
  if (!(await fileExists(path))) missingFiles.push(path);
}
assert(!missingFiles.length, `Manifest points at missing module file(s): ${missingFiles.join(", ")}`);

assert(/<script\s+src=["']src\/module-manifest\.js["']/.test(html), "HTML must load src/module-manifest.js before dynamic runtime boot");
assert(/for \(const phase of window\.PlaySputnikModulePhases\)/.test(html), "HTML boot must iterate manifest dependency phases");
assert(/Promise\.all\(phase\.map\(\(\{ path \}\) => loadScript\(path\)\)\)/.test(html), "HTML boot must load each manifest phase in parallel");
assert(/await loadScript\(["']app\.js["']\)/.test(html), "HTML boot must load app.js after manifest modules");

assert(/importScripts\(["']\.\/src\/module-manifest\.js["']\)/.test(swSource), "Service Worker must import the module manifest");
assert(/PlaySputnikModules\.map\(\(\{ path \}\) => `\.\/\$\{path\}`\)/.test(swSource), "Service Worker must derive module cache entries from PlaySputnikModules");

const swAssets = explicitSwStaticAssets(swSource);
const requiredShellAssets = [
  "",
  "index.html",
  "app.js",
  "styles.css",
  "styles/foundation.css",
  "styles/components.css",
  "styles/polish.css",
  "styles/themes.css",
  "styles/brand.css",
  "src/module-manifest.js",
  "manifest.json",
  "favicon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/brand/playsputnik-mark.png",
];
const missingShellAssets = requiredShellAssets.filter((path) => !swAssets.includes(path));
assert(!missingShellAssets.length, `Service Worker STATIC_ASSETS is missing shell asset(s): ${missingShellAssets.join(", ")}`);

const htmlStyles = [...html.matchAll(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/g)]
  .map((item) => item[1].replace(/^\.\//, ""));
const missingStyleCache = htmlStyles.filter((path) => !swAssets.includes(path));
assert(!missingStyleCache.length, `HTML stylesheet(s) are not explicitly precached: ${missingStyleCache.join(", ")}`);

console.log(`✅ manifest/cache contract OK (${modules.length} modules, ${htmlStyles.length} styles, ${swAssets.length} explicit static assets)`);
