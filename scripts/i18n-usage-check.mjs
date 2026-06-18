/* i18n key usage gate.
 *
 * Catches literal localization references that point at no catalog entry:
 *  - index.html data-i18n="..."
 *  - index.html data-i18n-attr="attribute:key;..."
 *  - JavaScript t("literal.key") / t('literal.key') calls
 *
 * Dynamic keys such as `views.${activeView}.summary` are intentionally outside
 * this narrow deterministic check and must keep their explicit runtime fallback.
 *
 * Usage: node scripts/i18n-usage-check.mjs
 */
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog, logicalKeySet } from "./i18n-catalog-check.mjs";

const ROOT = new URL("../", import.meta.url);
const EN_URL = new URL("src/i18n-en.js", ROOT);
const HTML_URL = new URL("index.html", ROOT);
const APP_URL = new URL("app.js", ROOT);
const SRC_URL = new URL("src/", ROOT);
const EXCLUDED_SOURCE_FILES = new Set(["app-i18n.js", "i18n-en.js", "i18n-ru.js"]);

function lineNumber(source, index) {
  return source.slice(0, index).split("\n").length;
}

function addReference(references, key, file, line, kind) {
  references.push({ key: key.trim(), file, line, kind });
}

export function collectHtmlReferences(source, file = "index.html") {
  const references = [];
  const issues = [];
  const attributePattern = /\b(data-i18n|data-i18n-attr)\s*=\s*(["'])(.*?)\2/g;
  let match;

  while ((match = attributePattern.exec(source))) {
    const [, attribute, , value] = match;
    const line = lineNumber(source, match.index);
    if (attribute === "data-i18n") {
      if (!value.trim()) issues.push(`${file}:${line} has an empty data-i18n value`);
      else addReference(references, value, file, line, attribute);
      continue;
    }

    value.split(";").forEach((rawPair) => {
      const pair = rawPair.trim();
      if (!pair) return;
      const separator = pair.indexOf(":");
      if (separator < 1 || !pair.slice(separator + 1).trim()) {
        issues.push(`${file}:${line} has malformed data-i18n-attr pair "${pair}"`);
        return;
      }
      addReference(references, pair.slice(separator + 1), file, line, attribute);
    });
  }

  return { references, issues };
}

export function collectJsReferences(source, file) {
  const references = [];
  const literalCallPattern = /\bt\s*\(\s*(["'`])([^"'`\r\n]+)\1/g;
  let match;
  while ((match = literalCallPattern.exec(source))) {
    addReference(references, match[2], file, lineNumber(source, match.index), "t()");
  }
  return references;
}

export function validateI18nUsage(catalogKeys, references, initialIssues = []) {
  const issues = [...initialIssues];
  references.forEach((reference) => {
    if (!reference.key) {
      issues.push(`${reference.file}:${reference.line} has an empty ${reference.kind} key`);
    } else if (!catalogKeys.has(reference.key)) {
      issues.push(`${reference.file}:${reference.line} references missing i18n key "${reference.key}"`);
    }
  });
  return {
    issues,
    referenceCount: references.length,
    uniqueKeyCount: new Set(references.map((reference) => reference.key)).size,
  };
}

async function main() {
  const enCatalog = await loadCatalog(EN_URL, "en");
  const catalogKeys = logicalKeySet(enCatalog, "en");
  const htmlSource = await readFile(HTML_URL, "utf8");
  const html = collectHtmlReferences(htmlSource);
  const references = [...html.references];

  const appSource = await readFile(APP_URL, "utf8");
  references.push(...collectJsReferences(appSource, "app.js"));

  const sourceFiles = (await readdir(SRC_URL))
    .filter((file) => file.endsWith(".js") && !EXCLUDED_SOURCE_FILES.has(file))
    .sort();
  for (const file of sourceFiles) {
    const source = await readFile(new URL(file, SRC_URL), "utf8");
    references.push(...collectJsReferences(source, `src/${file}`));
  }

  const result = validateI18nUsage(catalogKeys, references, html.issues);
  if (result.issues.length) {
    console.error(`❌ i18n usage: ${result.issues.length} issue(s)`);
    result.issues.forEach((issue) => console.error(`  - ${issue}`));
    process.exitCode = 1;
    return;
  }

  console.log(`✅ i18n usage valid (${result.referenceCount} references, ${result.uniqueKeyCount} catalog keys)`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main();
}
