/* Consolidated i18n gate — one pass, one report.
 *
 * Runs the three static catalog checks together, loading the catalogs and the
 * code corpus once instead of three times:
 *   1. catalog sync  — EN/RU structure, plural branches, placeholders, taxonomy
 *   2. usage         — every t("…")/data-i18n key exists in the catalog
 *   3. orphan        — every catalog key is used somewhere
 * (The vm-based i18n-startup-test stays separate — it exercises engine logic,
 * not catalog content.) Each underlying *-check.mjs still runs standalone.
 *
 * Usage: node scripts/i18n-check.mjs
 */
import { readFile, readdir } from "node:fs/promises";
import { loadCatalog, logicalKeySet, validateCatalogPair, validateTaxonomyCoverage } from "./i18n-catalog-check.mjs";
import { collectHtmlReferences, collectJsReferences, validateI18nUsage } from "./i18n-usage-check.mjs";
import { findOrphans } from "./i18n-orphan-check.mjs";

const ROOT = new URL("../", import.meta.url);
const EXCLUDED = new Set(["app-i18n.js", "i18n-en.js", "i18n-ru.js"]);

// ── Load everything once ──────────────────────────────────────────────────────
const [enCatalog, ruCatalog, taxonomy, htmlSource, appSource] = await Promise.all([
  loadCatalog(new URL("src/i18n-en.js", ROOT), "en"),
  loadCatalog(new URL("src/i18n-ru.js", ROOT), "ru"),
  readFile(new URL("data/taxonomy.json", ROOT), "utf8").then(JSON.parse),
  readFile(new URL("index.html", ROOT), "utf8"),
  readFile(new URL("app.js", ROOT), "utf8"),
]);
const srcNames = (await readdir(new URL("src/", ROOT))).filter((f) => f.endsWith(".js")).sort();
const srcSources = await Promise.all(srcNames.map((f) => readFile(new URL(`src/${f}`, ROOT), "utf8")));

// ── 1. Catalog sync ───────────────────────────────────────────────────────────
const sync = validateCatalogPair(enCatalog, ruCatalog);
const syncIssues = [
  ...sync.issues,
  ...validateTaxonomyCoverage(enCatalog, taxonomy, "en"),
  ...validateTaxonomyCoverage(ruCatalog, taxonomy, "ru"),
];

// ── 2. Usage ──────────────────────────────────────────────────────────────────
const catalogKeys = logicalKeySet(enCatalog, "en");
const html = collectHtmlReferences(htmlSource);
const references = [...html.references, ...collectJsReferences(appSource, "app.js")];
srcNames.forEach((name, i) => {
  if (!EXCLUDED.has(name)) references.push(...collectJsReferences(srcSources[i], `src/${name}`));
});
const usage = validateI18nUsage(catalogKeys, references, html.issues);

// ── 3. Orphans ────────────────────────────────────────────────────────────────
const corpus = [appSource, htmlSource, ...srcSources].join("\n");
const { allKeys, orphans } = findOrphans(enCatalog, corpus);

// ── Unified report ────────────────────────────────────────────────────────────
let failed = false;
function stage(ok, okLine, label, issues) {
  if (ok) { console.log(`  ✅ ${okLine}`); return; }
  failed = true;
  console.error(`  ❌ ${label}: ${issues.length} issue(s)`);
  issues.forEach((i) => console.error(`     - ${i}`));
}
stage(!syncIssues.length, `catalog sync (${sync.enLeafCount} logical keys, EN + RU)`, "catalog sync", syncIssues);
stage(!usage.issues.length, `usage (${usage.referenceCount} references, ${usage.uniqueKeyCount} keys)`, "usage", usage.issues);
stage(!orphans.length, `no orphans (${allKeys.length} leaf keys)`, "orphans", orphans.map((k) => `unused key: ${k}`));

if (failed) { console.error("\n❌ i18n check failed."); process.exit(1); }
console.log("✅ i18n OK (catalog sync + usage + no orphans).");
