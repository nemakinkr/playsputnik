/* EN/RU catalog structure gate.
 *
 * Invisible regression class: a localized surface gains a key, plural branch,
 * or interpolation parameter in one catalog but not the other. English still
 * renders through fallback, so the omission can survive normal development.
 *
 * Checks identical logical paths, matching string/plural types, exact
 * locale-specific plural branches, non-empty messages, and matching
 * {interpolation} placeholders.
 *
 * Usage: node scripts/i18n-catalog-check.mjs
 *        node scripts/i18n-catalog-check.mjs path/to/en.js path/to/ru.js
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../", import.meta.url);
const DEFAULT_EN = new URL("src/i18n-en.js", ROOT);
const DEFAULT_RU = new URL("src/i18n-ru.js", ROOT);
const TAXONOMY_URL = new URL("data/taxonomy.json", ROOT);
const PLURAL_KEYS = new Set(["one", "few", "many", "other"]);
const REQUIRED_PLURALS = {
  en: ["one", "other"],
  ru: ["one", "few", "many"],
};

function sourceUrl(arg, fallback) {
  return arg ? new URL(arg, `file://${process.cwd()}/`) : fallback;
}

export async function loadCatalog(url, locale) {
  const source = await readFile(url, "utf8");
  const context = { window: { PlaySputnikMessages: {} } };
  vm.createContext(context);
  vm.runInContext(source, context, {
    filename: fileURLToPath(url),
    timeout: 1000,
  });
  const catalog = context.window.PlaySputnikMessages?.[locale];
  if (!catalog || typeof catalog !== "object" || Array.isArray(catalog)) {
    throw new Error(`${locale}: catalog did not register window.PlaySputnikMessages.${locale}`);
  }
  return catalog;
}

export function logicalKeySet(catalog, locale = "en") {
  return new Set(collectLeaves(catalog, locale).leaves.keys());
}

function placeholders(value) {
  return [...String(value).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}

function sameList(left, right) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function isPluralObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => PLURAL_KEYS.has(key));
}

function collectLeaves(value, locale, path = "", leaves = new Map(), issues = []) {
  if (typeof value === "string") {
    if (!value.trim()) issues.push(`${locale}:${path} is empty`);
    leaves.set(path, { kind: "string", placeholders: placeholders(value) });
    return { leaves, issues };
  }

  if (isPluralObject(value)) {
    const keys = Object.keys(value).sort();
    const expected = REQUIRED_PLURALS[locale];
    if (!sameList(keys, [...expected].sort())) {
      issues.push(`${locale}:${path} plural branches are [${keys.join(", ")}], expected [${expected.join(", ")}]`);
    }
    const branchParams = [];
    keys.forEach((key) => {
      if (typeof value[key] !== "string" || !value[key].trim()) {
        issues.push(`${locale}:${path}.${key} must be a non-empty string`);
        return;
      }
      branchParams.push(placeholders(value[key]));
    });
    if (branchParams.length > 1 && branchParams.some((params) => !sameList(params, branchParams[0]))) {
      issues.push(`${locale}:${path} plural branches use different placeholders`);
    }
    leaves.set(path, { kind: "plural", placeholders: branchParams[0] || [] });
    return { leaves, issues };
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    issues.push(`${locale}:${path || "<root>"} must be a string, plural object, or namespace`);
    return { leaves, issues };
  }

  const entries = Object.entries(value);
  if (!entries.length) issues.push(`${locale}:${path || "<root>"} namespace is empty`);
  entries.forEach(([key, child]) => {
    collectLeaves(child, locale, path ? `${path}.${key}` : key, leaves, issues);
  });
  return { leaves, issues };
}

export function validateCatalogPair(enCatalog, ruCatalog) {
  const en = collectLeaves(enCatalog, "en");
  const ru = collectLeaves(ruCatalog, "ru");
  const issues = [...en.issues, ...ru.issues];
  const allPaths = [...new Set([...en.leaves.keys(), ...ru.leaves.keys()])].sort();

  allPaths.forEach((path) => {
    const enLeaf = en.leaves.get(path);
    const ruLeaf = ru.leaves.get(path);
    if (!enLeaf) {
      issues.push(`Missing in en: ${path}`);
      return;
    }
    if (!ruLeaf) {
      issues.push(`Missing in ru: ${path}`);
      return;
    }
    if (enLeaf.kind !== ruLeaf.kind) {
      issues.push(`Type mismatch at ${path}: en=${enLeaf.kind}, ru=${ruLeaf.kind}`);
      return;
    }
    if (!sameList(enLeaf.placeholders, ruLeaf.placeholders)) {
      issues.push(`Placeholder mismatch at ${path}: en={${enLeaf.placeholders.join(",")}}, ru={${ruLeaf.placeholders.join(",")}}`);
    }
  });

  return {
    issues,
    enLeafCount: en.leaves.size,
    ruLeafCount: ru.leaves.size,
  };
}

export function validateTaxonomyCoverage(catalog, taxonomy, locale) {
  const issues = [];
  Object.entries(taxonomy.axes || {}).forEach(([axis, values]) => {
    values.forEach((value) => {
      const label = catalog.taxonomy?.[axis]?.[value];
      if (typeof label !== "string" || !label.trim()) {
        issues.push(`${locale}:taxonomy.${axis}.${value} is missing`);
      }
    });
  });
  return issues;
}

async function main() {
  const enUrl = sourceUrl(process.argv[2], DEFAULT_EN);
  const ruUrl = sourceUrl(process.argv[3], DEFAULT_RU);
  const [enCatalog, ruCatalog, taxonomy] = await Promise.all([
    loadCatalog(enUrl, "en"),
    loadCatalog(ruUrl, "ru"),
    readFile(TAXONOMY_URL, "utf8").then(JSON.parse),
  ]);
  const result = validateCatalogPair(enCatalog, ruCatalog);
  result.issues.push(
    ...validateTaxonomyCoverage(enCatalog, taxonomy, "en"),
    ...validateTaxonomyCoverage(ruCatalog, taxonomy, "ru"),
  );

  if (result.issues.length) {
    console.error(`❌ i18n catalogs: ${result.issues.length} issue(s)`);
    result.issues.forEach((issue) => console.error(`  - ${issue}`));
    process.exitCode = 1;
    return;
  }

  console.log(`✅ i18n catalogs synchronized (${result.enLeafCount} logical keys, EN + RU)`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main();
}
