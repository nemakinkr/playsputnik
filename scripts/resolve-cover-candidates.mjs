import { readFile, writeFile } from "node:fs/promises";
import { envPresence, loadLocalEnv } from "./local-env.mjs";

const ROOT = new URL("../", import.meta.url);
const localEnv = await loadLocalEnv(ROOT);
const args = process.argv.slice(2);
const rawgApiKey = process.env.RAWG_API_KEY || "";
const rawgKey = envPresence("RAWG_API_KEY", localEnv);
const writeMode = args.includes("--write");
const limitIndex = args.indexOf("--limit");
const titleIndex = args.indexOf("--title");
const limit = Number(limitIndex >= 0 ? args[limitIndex + 1] : 12);
const onlyTitle = titleIndex >= 0 ? args[titleIndex + 1] || "" : "";

const [games, coverSnapshots, titleAliases] = await Promise.all([
  readJson("data/games.json"),
  readJson("data/cover-snapshots.json"),
  readJson("data/title-aliases.json"),
]);

const coverIndex = new Map(coverSnapshots.map((record) => [titleKey(record.title), record]));
const targets = games
  .filter((game) => !onlyTitle || titleMatches(game.title, onlyTitle))
  .filter((game) => {
    const cover = coverIndex.get(titleKey(game.title));
    return !cover || ["fallback", "missing", "blocked"].includes(cover.status);
  })
  .slice(0, Number.isFinite(limit) && limit > 0 ? limit : 12);

const checkedAt = new Date().toISOString();
const results = [];

for (const game of targets) {
  if (!rawgApiKey) {
    results.push(fallbackRecord(game, "rawg_key_missing"));
    continue;
  }

  try {
    const candidate = await rawgCoverCandidate(game);
    results.push(candidate || fallbackRecord(game, "rawg_no_cover_candidate"));
  } catch (error) {
    results.push(fallbackRecord(game, "rawg_lookup_failed", error.message));
  }
}

if (writeMode && rawgApiKey) {
  const nextSnapshots = upsertCoverSnapshots(coverSnapshots, results.filter((record) => record.status === "candidate"));
  await writeFile(new URL("data/cover-snapshots.json", ROOT), `${JSON.stringify(nextSnapshots, null, 2)}\n`);
}

process.stdout.write(`${JSON.stringify({
  mode: writeMode ? "cover-resolve-write" : "cover-resolve-preview",
  provider: rawgApiKey ? "rawg" : "generated_poster_fallback",
  keySource: rawgKey.source,
  checkedAt,
  writeMode,
  writeStatus: writeMode ? rawgApiKey ? "wrote_candidates" : "skipped_missing_key" : "preview_only",
  targets: targets.length,
  candidates: results.filter((record) => record.status === "candidate").length,
  fallback: results.filter((record) => record.status !== "candidate").length,
  results,
}, null, 2)}\n`);

async function readJson(path) {
  return readFile(new URL(path, ROOT), "utf8").then(JSON.parse);
}

function normalizeTitle(title) {
  return String(title || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

function aliasEntryForTitle(title) {
  const normalized = normalizeTitle(title);
  return titleAliases.find((entry) => {
    const keys = [entry.title, ...(entry.aliases || [])].map(normalizeTitle);
    return keys.includes(normalized);
  });
}

function titleKey(title) {
  const entry = aliasEntryForTitle(title);
  return normalizeTitle(entry?.title || title);
}

function titleMatches(a, b) {
  return Boolean(a && b && titleKey(a) === titleKey(b));
}

function aliasTermsForTitle(title) {
  const entry = aliasEntryForTitle(title);
  return entry ? [entry.title, ...(entry.aliases || [])] : [title];
}

function fallbackRecord(game, reason, error = "") {
  return {
    title: game.title,
    status: "fallback",
    source: "generated_poster",
    sourceUrl: "local://generated-poster",
    checkedAt,
    licenseNote: "Generated placeholder; no third-party image cached.",
    url: "",
    reason,
    error,
  };
}

async function rawgCoverCandidate(game) {
  const recordsById = new Map();
  for (const term of aliasTermsForTitle(game.title)) {
    const records = await rawgSearchRecords(term);
    records.forEach((record) => recordsById.set(record.id || `${record.name}-${record.slug}`, record));
  }
  const match = bestRawgMatch(game, [...recordsById.values()]);
  if (!match?.background_image) return null;
  return {
    title: game.title,
    status: "candidate",
    source: "rawg",
    sourceUrl: match.slug ? `https://rawg.io/games/${match.slug}` : "https://rawg.io/",
    checkedAt,
    licenseNote: "RAWG API image candidate. Attribute RAWG and link to the source page wherever this image is displayed.",
    url: match.background_image,
    providerGameId: match.id,
    providerTitle: match.name,
    matchConfidence: titleMatches(game.title, match.name) ? "high" : "medium",
  };
}

async function rawgSearchRecords(term) {
  const endpoint = new URL("https://api.rawg.io/api/games");
  endpoint.searchParams.set("key", rawgApiKey);
  endpoint.searchParams.set("search", term);
  endpoint.searchParams.set("page_size", "10");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(endpoint, { signal: controller.signal });
    if (!response.ok) throw new Error(`RAWG request failed: ${response.status}`);
    const payload = await response.json();
    return payload.results || [];
  } finally {
    clearTimeout(timeout);
  }
}

function bestRawgMatch(game, records) {
  const aliases = aliasTermsForTitle(game.title).map(titleKey);
  const matches = records
    .map((record, index) => {
      const key = titleKey(record.name);
      const numberSafe = hasCompatibleNumberTokens(game.title, record.name);
      const qualifierSafe = hasCompatibleQualifiers(game.title, record.name);
      const exact = aliases.includes(key);
      const partial = aliases.some((alias) => alias.length >= 5 && (key.includes(alias) || alias.includes(key)));
      const platformBonus = (record.parent_platforms || [])
        .some((item) => /playstation|pc|xbox|nintendo/i.test(item.platform?.name || "")) ? 4 : 0;
      return {
        record,
        score: numberSafe && qualifierSafe ? exact ? 100 : partial ? 70 : 30 - index + platformBonus : -100,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  return matches[0]?.record || null;
}

function titleNumberTokens(title) {
  const roman = {
    ii: "2",
    iii: "3",
    iv: "4",
    v: "5",
    vi: "6",
    vii: "7",
    viii: "8",
    ix: "9",
    x: "10",
  };
  return normalizeTitle(title)
    .split(" ")
    .map((token) => {
      if (/^\d+$/.test(token)) return String(Number(token));
      return roman[token] || "";
    })
    .filter(Boolean);
}

function hasCompatibleNumberTokens(sourceTitle, candidateTitle) {
  const required = titleNumberTokens(sourceTitle);
  if (!required.length) return true;
  const candidate = new Set(titleNumberTokens(candidateTitle));
  return required.every((token) => candidate.has(token));
}

function hasCompatibleQualifiers(sourceTitle, candidateTitle) {
  const blocked = ["toolkit", "demo", "soundtrack", "ost", "beta", "alpha", "trailer", "prologue", "dlc", "mod", "editor", "launcher"];
  const source = new Set(normalizeTitle(sourceTitle).split(" "));
  const candidate = new Set(normalizeTitle(candidateTitle).split(" "));
  return blocked.every((token) => !candidate.has(token) || source.has(token));
}

function upsertCoverSnapshots(currentSnapshots, candidates) {
  const byTitle = new Map(currentSnapshots.map((record) => [titleKey(record.title), record]));
  candidates.forEach((candidate) => {
    const key = titleKey(candidate.title);
    const current = byTitle.get(key) || {};
    byTitle.set(key, {
      ...current,
      ...candidate,
    });
  });
  return games
    .map((game) => byTitle.get(titleKey(game.title)) || fallbackRecord(game, "missing_existing_snapshot"))
    .filter(Boolean);
}
