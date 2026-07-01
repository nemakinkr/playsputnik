import { mkdir, readFile, writeFile } from "node:fs/promises";
import { envPresence, loadLocalEnv } from "./local-env.mjs";

const ROOT = new URL("../", import.meta.url);
const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const RAWG_ALL = args.includes("--rawg-all");
const checkedAt = argValue("--checked-at") || new Date().toISOString();
const OUTPUT_PATH = argValue("--output") || "reports/founder-ranking-provider-coverage.json";
const MIN_TRUSTED_SCORE = 70;
const RAWG_THROTTLE_MS = Number(argValue("--throttle-ms") || 180);

const localEnv = await loadLocalEnv(ROOT);
const rawgApiKey = process.env.RAWG_API_KEY || "";
const rawgKey = envPresence("RAWG_API_KEY", localEnv);

const [
  rankingText,
  games,
  catalogBackbone,
  globalSearchFixtures,
  titleAliases,
  taxonomy,
] = await Promise.all([
  readText("test/fixtures/founder-ranking-ru.txt"),
  readJson("data/games.json"),
  readJson("data/catalog-backbone.json"),
  readJson("data/global-search-fixtures.json"),
  readJson("data/title-aliases.json"),
  readJson("data/taxonomy.json"),
]);

const taxonomyAtoms = new Set(taxonomy.axes.atoms || []);
const seedByKey = new Map((games || []).map((game) => [titleKey(game.title), game]));
const backboneByKey = new Map((catalogBackbone.records || []).map((record) => [titleKey(record.title), record]));
const fixtureByKey = new Map((globalSearchFixtures.records || []).map((record) => [titleKey(record.title), record]));
const providerCache = new Map();

const ranking = parseRanking(rankingText);
const rows = [];

for (const entry of ranking) {
  const key = titleKey(entry.title);
  const canonicalTitle = canonicalTitleFor(entry.title);
  const local = localRecordForKey(key);
  const shouldQueryRawg = Boolean(rawgApiKey) && (RAWG_ALL || !local);
  const provider = shouldQueryRawg
    ? await bestRawgMatch(entry.title, canonicalTitle)
    : null;

  rows.push({
    rank: entry.rank,
    title: entry.title,
    canonicalTitle,
    key,
    local: local
      ? {
          status: local.status,
          title: local.record.title,
          sourceId: local.sourceId,
          hasCoverCandidate: Boolean(local.record.cover || local.record.coverUrl || local.record.coverStatus === "candidate"),
          priceStatus: local.record.priceStatus || (local.status === "seed_catalog" ? "seed_or_history" : "missing"),
        }
      : null,
    rawg: provider?.matched
      ? {
          status: "matched",
          title: provider.title,
          score: provider.score,
          matchKind: provider.matchKind,
          confidence: provider.confidence,
          coverStatus: provider.coverUrl ? "candidate" : "missing",
          sourceUrl: provider.sourceUrl,
          platforms: provider.platforms,
          atoms: provider.atoms,
        }
      : provider || rawgStatus(shouldQueryRawg),
    resolution: resolutionFor(local, provider),
  });

  if (shouldQueryRawg && RAWG_THROTTLE_MS > 0) await delay(RAWG_THROTTLE_MS);
}

const summary = summarize(rows);
const report = {
  mode: "founder-ranking-provider-coverage",
  checkedAt,
  fixture: "test/fixtures/founder-ranking-ru.txt",
  provider: {
    id: "rawg",
    keySource: rawgKey.source,
    queriedAllRows: RAWG_ALL,
    minimumTrustedScore: MIN_TRUSTED_SCORE,
    note: "RAWG is used for live search, metadata, platforms, atoms, and attributed cover candidates. Prices and subscription status remain store-backed signals.",
  },
  localSources: [
    "data/games.json",
    "data/catalog-backbone.json",
    "data/global-search-fixtures.json",
    "data/title-aliases.json",
  ],
  summary,
  unresolved: rows
    .filter((row) => row.resolution.status === "manual_fallback")
    .map(({ rank, title, canonicalTitle, rawg }) => ({
      rank,
      title,
      canonicalTitle,
      rawgStatus: rawg?.status || "not_queried",
      rawgBestTitle: rawg?.bestTitle || "",
      rawgBestScore: rawg?.bestScore || 0,
    })),
  rows,
};

if (WRITE) {
  await mkdir(new URL("reports/", ROOT), { recursive: true });
  await writeFile(new URL(OUTPUT_PATH, ROOT), `${JSON.stringify(report, null, 2)}\n`);
}

printSummary(report);

function argValue(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] || "" : "";
}

async function readJson(path) {
  return JSON.parse(await readText(path));
}

async function readText(path) {
  return readFile(new URL(path, ROOT), "utf8");
}

function stripRankingMarker(line) {
  return line
    .trim()
    .replace(/^(?:[0-9]\uFE0F?\u20E3)+\s*/u, "")
    .replace(/^✅\s*/u, "")
    .trim();
}

function parseRanking(text) {
  return text
    .split(/\n|\r\n/)
    .map(stripRankingMarker)
    .filter(Boolean)
    .map((title, index) => ({ rank: index + 1, title }));
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

function canonicalTitleFor(title) {
  return aliasEntryForTitle(title)?.title || title;
}

function aliasTermsForTitle(title) {
  const entry = aliasEntryForTitle(title);
  return entry ? [entry.title, ...(entry.aliases || [])] : [title];
}

function localRecordForKey(key) {
  const seed = seedByKey.get(key);
  if (seed) return { status: "seed_catalog", sourceId: "seed_catalog", record: seed };
  const backbone = backboneByKey.get(key);
  if (backbone) return { status: "catalog_backbone", sourceId: "catalog_backbone", record: backbone };
  const fixture = fixtureByKey.get(key);
  if (fixture) return { status: "external_fixture", sourceId: "prototype_external_index", record: fixture };
  return null;
}

async function bestRawgMatch(originalTitle, canonicalTitle) {
  const queries = unique([canonicalTitle, originalTitle].filter(Boolean));
  const candidates = [];
  const errors = [];

  for (const query of queries) {
    try {
      candidates.push(...await rawgSearch(query, originalTitle));
    } catch (error) {
      errors.push(formatRawgError(error));
    }
  }

  const ranked = candidates
    .map((candidate) => ({ ...candidate, score: searchMatch(candidate.title, candidate.blob, canonicalTitle, originalTitle).score }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || b.rawgRating - a.rawgRating || a.title.localeCompare(b.title));

  const best = ranked[0] || null;
  if (!best || best.score < MIN_TRUSTED_SCORE) {
    return {
      status: errors.length ? "error_or_weak_match" : "weak_or_empty_match",
      bestTitle: best?.title || "",
      bestScore: best?.score || 0,
      errors: errors.slice(0, 2),
    };
  }

  return {
    matched: true,
    ...best,
    matchKind: searchMatch(best.title, best.blob, canonicalTitle, originalTitle).kind,
    confidence: best.score >= 96 ? "high" : "medium",
  };
}

async function rawgSearch(query, originalTitle) {
  const cacheKey = normalizeTitle(query);
  if (providerCache.has(cacheKey)) return providerCache.get(cacheKey);

  const endpoint = new URL("https://api.rawg.io/api/games");
  endpoint.searchParams.set("key", rawgApiKey);
  endpoint.searchParams.set("search", query);
  endpoint.searchParams.set("page_size", "8");

  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(endpoint, { signal: controller.signal });
      if (!response.ok) throw new Error(`RAWG HTTP ${response.status} for ${queryLabel(originalTitle)}`);
      const payload = await response.json();
      const results = (payload.results || []).map(rawgRecordToCandidate).filter(Boolean);
      providerCache.set(cacheKey, results);
      return results;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await delay(600);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

function rawgRecordToCandidate(record) {
  const platforms = unique([
    ...(record.parent_platforms || []).map((item) => item.platform?.name),
    ...(record.platforms || []).map((item) => item.platform?.name),
  ].filter(Boolean)).slice(0, 8);
  const atoms = inferAtomsFromRawg(record);
  return {
    title: record.name || "",
    slug: record.slug || "",
    sourceUrl: record.slug ? `https://rawg.io/games/${record.slug}` : "https://rawg.io/",
    coverUrl: record.background_image || "",
    platforms,
    atoms,
    rawgRating: Number(record.rating) || 0,
    blob: searchTextBlob([
      record.name,
      record.slug,
      ...(record.genres || []).map((item) => item.name),
      ...(record.tags || []).map((item) => item.name),
    ]),
  };
}

function inferAtomsFromRawg(record) {
  const text = searchTextBlob([
    ...(record.genres || []).map((item) => item.name),
    ...(record.tags || []).map((item) => item.name),
  ]);
  const rules = [
    [/action|combat/, ["action"]],
    [/adventure/, ["exploration", "story"]],
    [/role playing|rpg/, ["rpg", "choice"]],
    [/shooter|fps/, ["shooter", "action"]],
    [/strategy|tactical/, ["strategy", "systems"]],
    [/puzzle/, ["puzzle", "systems"]],
    [/horror/, ["horror", "tension"]],
    [/sports|racing|football|soccer/, ["sports", "competitive"]],
    [/simulation|management/, ["management", "systems"]],
    [/platform/, ["platforming", "action"]],
    [/indie/, ["indie"]],
    [/multiplayer|co op|coop/, ["multiplayer", "co-op"]],
    [/survival/, ["survival", "systems"]],
    [/open world/, ["open-world", "exploration"]],
    [/stealth/, ["stealth", "tension"]],
  ];
  return unique(rules.flatMap(([pattern, atoms]) => pattern.test(text) ? atoms : []))
    .filter((atom) => taxonomyAtoms.has(atom))
    .slice(0, 8);
}

function searchTextBlob(parts) {
  return normalizeTitle(parts.filter(Boolean).join(" "));
}

function searchTokens(value) {
  return normalizeTitle(value)
    .split(" ")
    .filter((token) => token.length >= 2);
}

function searchMatch(candidateTitle, blob, canonicalTitle, originalTitle) {
  const normalizedCandidate = titleKey(candidateTitle);
  const normalizedCanonical = titleKey(canonicalTitle);
  const normalizedOriginal = titleKey(originalTitle);
  const rawCanonical = normalizeTitle(canonicalTitle);
  const rawOriginal = normalizeTitle(originalTitle);
  const aliasBlob = searchTextBlob(aliasTermsForTitle(canonicalTitle));
  const candidateAliasBlob = searchTextBlob(aliasTermsForTitle(candidateTitle));
  const haystack = `${normalizedCandidate} ${candidateAliasBlob} ${blob}`;

  if (!normalizedCanonical) return { score: 0, kind: "none" };
  if (normalizedCandidate === normalizedCanonical || normalizedCandidate === normalizedOriginal) return { score: 100, kind: "exact" };
  if ([rawCanonical, rawOriginal].filter(Boolean).some((raw) => aliasTermsForTitle(candidateTitle).map(normalizeTitle).includes(raw))) {
    return { score: 96, kind: "alias" };
  }
  if (rawCanonical && normalizedCandidate.startsWith(rawCanonical)) return { score: 82, kind: "prefix" };
  if (rawOriginal && normalizedCandidate.startsWith(rawOriginal)) return { score: 80, kind: "prefix" };
  if (rawCanonical.length >= 3 && normalizedCandidate.includes(rawCanonical)) return { score: 76, kind: "contains" };
  if (rawOriginal.length >= 3 && normalizedCandidate.includes(rawOriginal)) return { score: 74, kind: "contains" };
  const tokenScore = tokenCoverageScore(haystack, canonicalTitle);
  return { score: tokenScore, kind: tokenScore ? "token" : "none" };
}

function tokenCoverageScore(blob, query) {
  const tokens = searchTokens(query).filter((token) => token.length >= 3);
  if (!tokens.length) return 0;
  const blobTokens = searchTokens(blob);
  const hits = tokens.filter((token) => blobTokens.some((candidate) => (
    candidate === token
    || candidate.startsWith(token)
    || (token.length >= 5 && token.startsWith(candidate))
  )));
  if (!hits.length) return 0;
  const coverage = hits.length / tokens.length;
  if (coverage === 1) return tokens.length === 1 ? 52 : 68;
  if (coverage >= 0.67) return 58;
  if (coverage >= 0.5) return 42;
  return 0;
}

function rawgStatus(queried) {
  if (!rawgApiKey) return { status: "key_missing" };
  if (!queried) return { status: "not_queried_local_hit" };
  return { status: "not_matched" };
}

function resolutionFor(local, provider) {
  if (local) {
    return {
      status: local.status,
      sourceId: local.sourceId,
      trustedEnoughForWishlist: true,
      metadataSource: local.sourceId,
      coverSource: provider?.coverUrl ? "rawg_candidate" : local.sourceId,
    };
  }
  if (provider?.score >= MIN_TRUSTED_SCORE) {
    return {
      status: "rawg_live",
      sourceId: "rawg_provider_hook",
      trustedEnoughForWishlist: true,
      metadataSource: "rawg",
      coverSource: provider.coverUrl ? "rawg_candidate" : "missing",
    };
  }
  return {
    status: "manual_fallback",
    sourceId: "manual_unverified",
    trustedEnoughForWishlist: true,
    metadataSource: "manual_title_only",
    coverSource: "generated_poster_fallback",
  };
}

function summarize(records) {
  const total = records.length;
  const count = (predicate) => records.filter(predicate).length;
  return {
    total,
    seedCatalog: count((row) => row.resolution.status === "seed_catalog"),
    catalogBackbone: count((row) => row.resolution.status === "catalog_backbone"),
    externalFixture: count((row) => row.resolution.status === "external_fixture"),
    rawgLive: count((row) => row.resolution.status === "rawg_live"),
    manualFallback: count((row) => row.resolution.status === "manual_fallback"),
    localKnown: count((row) => ["seed_catalog", "catalog_backbone", "external_fixture"].includes(row.resolution.status)),
    rawgMatched: count((row) => row.rawg?.status === "matched"),
    coverCandidateFromRawg: count((row) => row.rawg?.coverStatus === "candidate"),
    resolvedForWishlist: count((row) => row.resolution.trustedEnoughForWishlist),
    top30ResolvedWithoutManual: count((row) => row.rank <= 30 && row.resolution.status !== "manual_fallback"),
    top60ResolvedWithoutManual: count((row) => row.rank <= 60 && row.resolution.status !== "manual_fallback"),
    localMissingResolvedByRawg: count((row) => !row.local && row.resolution.status === "rawg_live"),
    localMissingTotal: count((row) => !row.local),
  };
}

function printSummary(report) {
  const s = report.summary;
  console.log(`Founder ranking provider coverage: ${s.total} games`);
  console.log(`  Local known: ${s.localKnown}/${s.total} (seed ${s.seedCatalog}, backbone ${s.catalogBackbone}, fixtures ${s.externalFixture})`);
  console.log(`  RAWG matched: ${s.rawgMatched}/${s.total}; local-missing resolved by RAWG: ${s.localMissingResolvedByRawg}/${s.localMissingTotal}`);
  console.log(`  Manual fallback: ${s.manualFallback}/${s.total}`);
  console.log(`  RAWG cover candidates observed: ${s.coverCandidateFromRawg}/${s.total}`);
  if (report.unresolved.length) {
    console.log(`  Unresolved sample: ${report.unresolved.slice(0, 8).map((item) => `${item.rank}. ${item.title}`).join("; ")}`);
  }
  if (WRITE) console.log(`  Wrote ${OUTPUT_PATH}`);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function queryLabel(title) {
  return String(title || "").replace(/\s+/g, " ").slice(0, 80);
}

function formatRawgError(error) {
  const message = String(error?.message || error);
  const cause = error?.cause?.message ? ` (${error.cause.message})` : "";
  return `${message}${cause}`;
}
