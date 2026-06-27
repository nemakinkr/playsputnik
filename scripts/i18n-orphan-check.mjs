/* Orphan i18n-key gate (static, no browser).
 *
 * Mirror of i18n-usage-check (which fails on a USED key missing from a catalog):
 * this fails on a CATALOG key that is never used anywhere — dead copy that drifts
 * out of sync. A leaf key counts as used if its full dotted path appears
 * literally in the code/markup (covers t("a.b"), data-i18n, and key arrays) OR it
 * sits under a dynamically-built prefix (e.g. t(`views.${v}.summary`)).
 *
 * Exposes leafKeys()/findOrphans() so the consolidated i18n-check.mjs can reuse
 * them; still runs standalone.
 *
 * Usage: node scripts/i18n-orphan-check.mjs
 */
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog } from "./i18n-catalog-check.mjs";

const PLURAL_KEYS = new Set(["one", "two", "few", "many", "other", "zero"]);

export function leafKeys(obj, prefix = "") {
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

export function findOrphans(catalog, corpus) {
  const allKeys = leafKeys(catalog);
  // Dynamic prefixes: t(`views.${...}`) / `taxonomy.${axis}` → namespace in play.
  const dynamicPrefixes = [...corpus.matchAll(/`([a-zA-Z0-9_.]*)\$\{/g)]
    .map((m) => m[1])
    .filter((p) => p.includes("."));
  const orphans = allKeys.filter((key) => {
    if (corpus.includes(key)) return false;
    if (dynamicPrefixes.some((p) => key.startsWith(p))) return false;
    return true;
  });
  return { allKeys, orphans };
}

export async function buildCorpus(root) {
  const srcFiles = (await readdir(new URL("src/", root))).filter((f) => f.endsWith(".js")).map((f) => `src/${f}`);
  const files = ["app.js", "index.html", ...srcFiles];
  return (await Promise.all(files.map((f) => readFile(new URL(f, root), "utf8")))).join("\n");
}

async function main() {
  const ROOT = new URL("../", import.meta.url);
  const catalog = await loadCatalog(new URL("src/i18n-en.js", ROOT), "en");
  const corpus = await buildCorpus(ROOT);
  const { allKeys, orphans } = findOrphans(catalog, corpus);
  if (orphans.length) {
    console.error(`❌ ${orphans.length} orphan i18n key(s) — defined in the catalog, used nowhere:`);
    orphans.forEach((k) => console.error(`   - ${k}`));
    console.error("\nFix: remove the unused key from src/i18n-en.js and src/i18n-ru.js, or wire it up.");
    process.exitCode = 1;
    return;
  }
  console.log(`✅ i18n catalog OK (${allKeys.length} leaf keys, none orphaned)`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main();
}
