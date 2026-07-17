import { readFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const EXPECTED = [
  "Ghost of Yotei",
  "Kingdom Come: Deliverance II",
  "Days Gone",
  "Atomic Heart",
  "Dispatch",
  "Marvel's Guardians of the Galaxy",
  "Assassin's Creed Shadows",
  "Senua's Saga: Hellblade II",
];
const [backbone, covers, report] = await Promise.all([
  readJson("data/catalog-backbone.json"),
  readJson("data/cover-snapshots.json"),
  readJson("reports/backbone-provider-enrichment.json"),
]);
const byTitle = new Map(backbone.records.map((record) => [record.title, record]));
const coverByTitle = new Map(covers.map((record) => [record.title, record]));

for (const title of EXPECTED) {
  const record = byTitle.get(title);
  const cover = coverByTitle.get(title);
  assert(record, `Missing enriched backbone record: ${title}`);
  assert(record.provider === "rawg", `Expected RAWG provider for ${title}`);
  assert(["high", "medium"].includes(record.providerMatchConfidence), `Untrusted provider match for ${title}`);
  assert(record.coverStatus === "candidate" && /^https:\/\//.test(record.coverUrl || ""), `Missing cover candidate for ${title}`);
  assert(/^https:\/\/rawg\.io\//.test(record.sourceUrl || ""), `Missing RAWG attribution URL for ${title}`);
  assert(record.priceStatus === "missing", `Backbone enrichment invented a price state for ${title}`);
  assert(!Object.hasOwn(record, "price") && !Object.hasOwn(record, "discount"), `Backbone enrichment invented store facts for ${title}`);
  assert(Array.isArray(record.providerPlatforms), `Missing provider platforms for ${title}`);
  assert(record.providerInferenceProfile?.limitations?.includes("price_requires_store_source"), `Missing provider limitations for ${title}`);
  assert(cover?.source === "rawg" && cover.url === record.coverUrl, `Cover snapshot drift for ${title}`);
  assert(cover.licenseNote?.includes("Attribute RAWG"), `Missing RAWG cover attribution for ${title}`);
}

assert(report.matched === EXPECTED.length, `Expected ${EXPECTED.length} report matches, got ${report.matched}`);
assert(report.dataPolicy?.prices?.includes("missing"), "Report must state the no-invented-price policy");
console.log(`✅ Backbone provider enrichment: ${EXPECTED.length} attributed covers, metadata provenance, and honest price gaps`);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, ROOT), "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
