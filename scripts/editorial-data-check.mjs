import { readFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const catalog = JSON.parse(await readFile(new URL("data/games.json", ROOT), "utf8"));
const editorial = JSON.parse(await readFile(new URL("data/editorial-ru.json", ROOT), "utf8"));
const catalogTitles = new Set(catalog.map((game) => game.title));
const records = editorial.records || {};
const requiredAnchors = [
  "Alan Wake 2",
  "Baldur's Gate 3",
  "Cyberpunk 2077",
  "Red Dead Redemption 2",
  "The Last of Us Part I",
  "The Witcher 3: Wild Hunt",
];
const issues = [];

if (editorial.locale !== "ru") issues.push("locale must be ru");
if (!/^\d{4}-\d{2}-\d{2}$/.test(editorial.updatedAt || "")) issues.push("updatedAt must use YYYY-MM-DD");
if (!records || Array.isArray(records) || typeof records !== "object") issues.push("records must be an object keyed by exact catalog title");

Object.entries(records).forEach(([title, entry]) => {
  if (!catalogTitles.has(title)) issues.push(`unknown catalog title: ${title}`);
  if (!entry || typeof entry !== "object") {
    issues.push(`invalid entry: ${title}`);
    return;
  }
  const tagline = String(entry.tagline || "").trim();
  const summary = String(entry.summary || "").trim();
  if (tagline.length < 12 || tagline.length > 80) issues.push(`tagline length: ${title}`);
  if (summary.length < 100 || summary.length > 360) issues.push(`summary length: ${title}`);
  if (!/[А-Яа-яЁё]/.test(tagline)) issues.push(`tagline has no Cyrillic: ${title}`);
  if (!/[А-Яа-яЁё]/.test(summary)) issues.push(`summary has no Cyrillic: ${title}`);
  if (/<[^>]+>/.test(tagline) || /<[^>]+>/.test(summary)) issues.push(`HTML is not allowed: ${title}`);
});

requiredAnchors.forEach((title) => {
  if (!records[title]) issues.push(`missing required editorial anchor: ${title}`);
});

if (issues.length) {
  console.error(`Editorial data check failed (${issues.length}):`);
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

console.log(`Editorial data: ${Object.keys(records).length} Russian records, all linked to catalog titles.`);
