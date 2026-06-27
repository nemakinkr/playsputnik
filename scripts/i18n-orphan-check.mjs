/* Orphan i18n-key gate (static, no browser).
 *
 * Mirror of i18n-usage-check (which fails on a USED key missing from a catalog):
 * this fails on a CATALOG key that is never used anywhere — dead copy that bloats
 * the catalogs and drifts out of sync. A leaf key counts as used if its full
 * dotted path appears literally in the code/markup (covers t("a.b"), data-i18n,
 * and key arrays like FILTER_KEYS) OR it sits under a dynamically-built prefix
 * (e.g. t(`views.${v}.summary`) → the whole `views.` namespace is in play).
 *
 * Usage: node scripts/i18n-orphan-check.mjs
 */
import { readFile, readdir } from "node:fs/promises";
import vm from "node:vm";

const ROOT = new URL("../", import.meta.url);

// Load the EN catalog (source of truth for structure).
const enSource = await readFile(new URL("src/i18n-en.js", ROOT), "utf8");
const ctx = { window: { PlaySputnikMessages: {} }, navigator: { language: "en" }, document: { documentElement: { setAttribute() {} } } };
vm.runInNewContext(enSource, ctx, { filename: "src/i18n-en.js" });
const catalog = ctx.window.PlaySputnikMessages.en || {};

const PLURAL_KEYS = new Set(["one", "two", "few", "many", "other", "zero"]);
function leafKeys(obj, prefix = "") {
  // A plural object ({one,few,many,...}) is itself a leaf, not a namespace.
  const keys = Object.keys(obj);
  if (keys.length && keys.every((k) => PLURAL_KEYS.has(k))) return [prefix];
  const out = [];
  for (const k of keys) {
    const v = obj[k];
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") out.push(...leafKeys(v, path));
    else out.push(path);
  }
  return out;
}
const allKeys = leafKeys(catalog);

// Gather the code/markup corpus.
const srcFiles = (await readdir(new URL("src/", ROOT))).filter((f) => f.endsWith(".js")).map((f) => `src/${f}`);
const files = ["app.js", "index.html", ...srcFiles];
const corpus = (await Promise.all(files.map((f) => readFile(new URL(f, ROOT), "utf8")))).join("\n");

// Dynamic prefixes: t(`views.${...}`) / `taxonomy.${axis}` → namespace is "in play".
const dynamicPrefixes = [...corpus.matchAll(/`([a-zA-Z0-9_.]*)\$\{/g)]
  .map((m) => m[1])
  .filter((p) => p.includes("."));

const orphans = allKeys.filter((key) => {
  if (corpus.includes(key)) return false;                       // used literally
  if (dynamicPrefixes.some((p) => key.startsWith(p))) return false; // under a dynamic prefix
  return true;
});

if (orphans.length) {
  console.error(`❌ ${orphans.length} orphan i18n key(s) — defined in the catalog, used nowhere:`);
  orphans.forEach((k) => console.error(`   - ${k}`));
  console.error("\nFix: remove the unused key from src/i18n-en.js and src/i18n-ru.js, or wire it up.");
  process.exit(1);
}
console.log(`✅ i18n catalog OK (${allKeys.length} leaf keys, none orphaned)`);
