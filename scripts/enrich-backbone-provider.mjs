import { mkdir, readFile, writeFile } from "node:fs/promises";
import { normalizeRawgResult, rawgTitleMatch } from "../backend/rawg-normalize.mjs";
import { envPresence, loadLocalEnv } from "./local-env.mjs";

const ROOT = new URL("../", import.meta.url);
const args = process.argv.slice(2);
const writeMode = args.includes("--write");
const checkedAt = argValue("--checked-at") || new Date().toISOString();
const requestedTitles = argValues("--title");
const DEFAULT_TITLES = [
  "Ghost of Yotei",
  "Kingdom Come: Deliverance II",
  "Days Gone",
  "Atomic Heart",
  "Dispatch",
  "Marvel's Guardians of the Galaxy",
  "Assassin's Creed Shadows",
  "Senua's Saga: Hellblade II",
];
const targetTitles = requestedTitles.length ? requestedTitles : DEFAULT_TITLES;

const localEnv = await loadLocalEnv(ROOT);
const rawgApiKey = process.env.RAWG_API_KEY || "";
const rawgKey = envPresence("RAWG_API_KEY", localEnv);
if (!rawgApiKey) throw new Error("RAWG_API_KEY is required for backbone provider enrichment.");

const [backbone, coverSnapshots, aliases] = await Promise.all([
  readJson("data/catalog-backbone.json"),
  readJson("data/cover-snapshots.json"),
  readJson("data/title-aliases.json"),
]);
const recordsByKey = new Map(backbone.records.map((record) => [titleKey(record.title), record]));
const results = [];

for (const requestedTitle of targetTitles) {
  const record = recordsByKey.get(titleKey(requestedTitle));
  if (!record) {
    results.push({ title: requestedTitle, status: "backbone_missing" });
    continue;
  }
  try {
    const candidate = await findRawgCandidate(record.title);
    results.push(candidate
      ? { title: record.title, status: "matched", candidate }
      : { title: record.title, status: "no_trusted_match" });
  } catch (error) {
    results.push({ title: record.title, status: "provider_error", error: error.message });
  }
}

const matches = results.filter((result) => result.status === "matched");
if (writeMode && matches.length) {
  const matchByKey = new Map(matches.map((result) => [titleKey(result.title), result.candidate]));
  const nextRecords = backbone.records.map((record) => {
    const candidate = matchByKey.get(titleKey(record.title));
    if (!candidate) return record;
    return {
      ...record,
      status: record.atomStatus === "complete" ? "ready_for_seed" : "ready_for_atom_review",
      coverStatus: candidate.coverStatus,
      provider: candidate.provider,
      providerRecordId: candidate.providerRecordId,
      providerTitle: candidate.title,
      providerMatchConfidence: candidate.matchConfidence,
      providerMatchKind: candidate.matchKind,
      providerCheckedAt: checkedAt,
      sourceUrl: candidate.sourceUrl,
      coverUrl: candidate.coverUrl,
      coverLicenseNote: rawgLicenseNote(),
      priceStatus: "missing",
      providerPlatforms: candidate.platforms,
      providerInferenceProfile: compactInferenceProfile(candidate.inferenceProfile),
    };
  });
  const nextSnapshots = upsertCoverSnapshots(coverSnapshots, matches);
  await Promise.all([
    writeJson("data/catalog-backbone.json", { ...backbone, updatedAt: checkedAt, records: nextRecords }),
    writeJson("data/cover-snapshots.json", nextSnapshots),
  ]);
}

const report = {
  mode: writeMode ? "backbone-provider-enrichment-write" : "backbone-provider-enrichment-preview",
  checkedAt,
  provider: "rawg",
  keySource: rawgKey.source,
  requested: targetTitles.length,
  matched: matches.length,
  unresolved: results.length - matches.length,
  dataPolicy: {
    covers: "attributed RAWG candidates",
    metadata: "provider inference kept separately from curated atoms",
    prices: "missing until a store-backed source is available",
    subscriptions: "not asserted",
  },
  results: results.map((result) => result.status === "matched"
    ? {
        title: result.title,
        status: result.status,
        providerTitle: result.candidate.title,
        providerRecordId: result.candidate.providerRecordId,
        matchConfidence: result.candidate.matchConfidence,
        matchKind: result.candidate.matchKind,
        coverStatus: result.candidate.coverStatus,
        sourceUrl: result.candidate.sourceUrl,
        platforms: result.candidate.platforms,
        inferredAtoms: result.candidate.inferredAtoms,
        priceStatus: result.candidate.priceStatus,
      }
    : result),
};

if (writeMode) {
  await mkdir(new URL("reports/", ROOT), { recursive: true });
  await writeJson("reports/backbone-provider-enrichment.json", report);
}
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

function argValue(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] || "" : "";
}

function argValues(name) {
  return args.flatMap((arg, index) => arg === name ? [args[index + 1] || ""] : []).filter(Boolean);
}

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, ROOT), "utf8"));
}

async function writeJson(path, value) {
  await writeFile(new URL(path, ROOT), `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeTitle(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

function aliasEntry(title) {
  const normalized = normalizeTitle(title);
  return aliases.find((entry) => [entry.title, ...(entry.aliases || [])].map(normalizeTitle).includes(normalized));
}

function titleKey(title) {
  return normalizeTitle(aliasEntry(title)?.title || title);
}

function queryTerms(title) {
  const entry = aliasEntry(title);
  return [...new Set([entry?.title, title, ...(entry?.aliases || [])].filter(Boolean))];
}

async function findRawgCandidate(title) {
  const candidates = new Map();
  for (const term of queryTerms(title)) {
    for (const record of await rawgSearch(term)) candidates.set(String(record.id || record.slug), record);
  }
  const ranked = [...candidates.values()]
    .map((record) => {
      const matches = queryTerms(title).map((term) => rawgTitleMatch(record.name, term));
      const match = matches.sort((a, b) => b.score - a.score)[0];
      return { record, match };
    })
    .filter(({ record, match }) => record.background_image && match.confidence !== "low")
    .sort((a, b) => b.match.score - a.match.score || Number(b.record.ratings_count || 0) - Number(a.record.ratings_count || 0));
  const best = ranked[0];
  return best ? normalizeRawgResult(best.record, title, { match: best.match }) : null;
}

async function rawgSearch(query) {
  const endpoint = new URL("https://api.rawg.io/api/games");
  endpoint.searchParams.set("key", rawgApiKey);
  endpoint.searchParams.set("search", query);
  endpoint.searchParams.set("page_size", "10");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(endpoint, { signal: controller.signal });
    if (!response.ok) throw new Error(`RAWG HTTP ${response.status} for ${query}`);
    const payload = await response.json();
    return payload.results || [];
  } finally {
    clearTimeout(timeout);
  }
}

function rawgLicenseNote() {
  return "RAWG API image candidate. Attribute RAWG and link to the source page wherever this image is displayed.";
}

function compactInferenceProfile(profile = {}) {
  return {
    version: profile.version || "",
    status: profile.status || "inferred",
    confidence: profile.confidence || "low",
    limitations: profile.limitations || [],
    evidenceCount: profile.evidenceCount || 0,
    rawSignals: profile.rawSignals || {},
    fields: Object.fromEntries(Object.entries(profile.fields || {}).map(([key, field]) => [key, {
      value: field.value,
      confidence: field.confidence,
    }])),
  };
}

function upsertCoverSnapshots(current, matchedResults) {
  const updates = new Map(matchedResults.map(({ title, candidate }) => [titleKey(title), {
    title,
    status: "candidate",
    source: "rawg",
    sourceUrl: candidate.sourceUrl,
    checkedAt,
    licenseNote: rawgLicenseNote(),
    url: candidate.coverUrl,
    providerGameId: Number(candidate.providerRecordId) || candidate.providerRecordId,
    providerTitle: candidate.title,
    matchConfidence: candidate.matchConfidence,
  }]));
  const merged = current.map((record) => updates.get(titleKey(record.title)) || record);
  const existing = new Set(current.map((record) => titleKey(record.title)));
  updates.forEach((record, key) => { if (!existing.has(key)) merged.push(record); });
  return merged;
}
