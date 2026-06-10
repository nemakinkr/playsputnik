#!/usr/bin/env node
/**
 * update-covers.mjs — fetch cover image URLs from RAWG for all catalog games
 *
 * Strategy:
 *   1. Fetch RAWG pages (metacritic-sorted PS4/PS5, same as expand-catalog) — ~12 requests
 *   2. Match each RAWG result to our catalog by title
 *   3. For unmatched games, search RAWG by title individually
 *   4. Write cover URLs to data/cover-snapshots.json
 *
 * Usage:
 *   node scripts/update-covers.mjs              # update all
 *   node scripts/update-covers.mjs --dry-run    # print matches, don't write
 *   node scripts/update-covers.mjs --search-only  # skip pages, only search missing
 *
 * Requires: RAWG_API_KEY in .env.local
 */
"use strict";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const RAWG_BASE = "https://api.rawg.io/api";
const PS4_ID = 18;
const PS5_ID = 187;
const PAGE_SIZE = 40;
const PAUSE_MS = 350;

const LICENSE_NOTE =
  "RAWG API image candidate. Attribute RAWG and link to the source page wherever this image is displayed.";

function pause(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Env ───────────────────────────────────────────────────────────────────────

async function loadEnv() {
  const path = join(ROOT, ".env.local");
  if (!existsSync(path)) return;
  const text = await readFile(path, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (k && !(k in process.env)) process.env[k] = v;
  }
}

// ── Title matching ────────────────────────────────────────────────────────────

function normalizeTitle(t) {
  return t
    .toLowerCase()
    .replace(/[:\-–—''""™®©]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\biii\b/g, "3")
    .replace(/\bii\b/g, "2")
    .replace(/\biv\b/g, "4")
    .replace(/\bthe\b/g, "")
    .trim();
}

function buildMatcher(games) {
  // Map: normalizedTitle → game.title
  const map = new Map();
  for (const g of games) {
    map.set(normalizeTitle(g.title), g.title);
    map.set(g.title.toLowerCase(), g.title);
  }
  return (rawgName) => {
    const direct = map.get(rawgName.toLowerCase());
    if (direct) return direct;
    return map.get(normalizeTitle(rawgName)) || null;
  };
}

// ── RAWG API ──────────────────────────────────────────────────────────────────

async function fetchPage(apiKey, page) {
  const params = new URLSearchParams({
    key: apiKey,
    platforms: `${PS4_ID},${PS5_ID}`,
    ordering: "-metacritic",
    page_size: String(PAGE_SIZE),
    page: String(page),
  });
  const resp = await fetch(`${RAWG_BASE}/games?${params}`);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

function titleSimilarity(a, b) {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (na === nb) return 1.0;
  if (na.startsWith(nb) || nb.startsWith(na)) return 0.85;
  // Word overlap
  const wa = new Set(na.split(" ").filter((w) => w.length > 2));
  const wb = new Set(nb.split(" ").filter((w) => w.length > 2));
  const shared = [...wa].filter((w) => wb.has(w)).length;
  return shared / Math.max(wa.size, wb.size, 1);
}

async function searchByTitle(apiKey, title) {
  const params = new URLSearchParams({
    key: apiKey,
    search: title,
    platforms: `${PS4_ID},${PS5_ID}`,
    page_size: "5",
  });
  const resp = await fetch(`${RAWG_BASE}/games?${params}`);
  if (!resp.ok) return null;
  const data = await resp.json();
  const results = data.results || [];
  if (!results.length) return null;
  // Rank by similarity to searched title — reject weak matches
  const ranked = results
    .filter((r) => r.background_image)
    .map((r) => ({ game: r, score: titleSimilarity(title, r.name) }))
    .sort((a, b) => b.score - a.score);
  if (!ranked.length || ranked[0].score < 0.5) return null; // reject weak match
  return ranked[0].game;
}

function makeRecord(catalogTitle, rawgGame) {
  return {
    title: catalogTitle,
    status: "candidate",
    source: "rawg",
    url: rawgGame.background_image,
    sourceUrl: `https://rawg.io/games/${rawgGame.slug}`,
    checkedAt: new Date().toISOString(),
    licenseNote: LICENSE_NOTE,
    providerGameId: rawgGame.id,
    providerTitle: rawgGame.name,
    matchConfidence: rawgGame.name.toLowerCase() === catalogTitle.toLowerCase() ? "high" : "medium",
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  await loadEnv();

  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    console.error("❌  RAWG_API_KEY not set. Add it to .env.local");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const searchOnly = args.includes("--search-only");

  // Load catalog
  const games = JSON.parse(await readFile(join(ROOT, "data/games.json"), "utf8"));
  console.log(`\n📋  ${games.length} games in catalog`);

  // Load existing covers (keep entries for games we won't update)
  let existingCovers = [];
  try {
    existingCovers = JSON.parse(await readFile(join(ROOT, "data/cover-snapshots.json"), "utf8"));
  } catch { /* fresh start */ }

  const alreadyCovered = new Set(existingCovers.filter((c) => c.url).map((c) => c.title));
  console.log(`    ${alreadyCovered.size} games already have a cover URL`);

  const match = buildMatcher(games);
  const newCovers = new Map(); // catalogTitle → record

  // ── Phase 1: paginated RAWG list ────────────────────────────────────────────

  if (!searchOnly) {
    const needed = games.filter((g) => !alreadyCovered.has(g.title)).length;
    const pages = Math.ceil(needed / PAGE_SIZE) + 4; // a few extra to catch stragglers
    console.log(`\n📄  Fetching ${Math.min(pages, 20)} RAWG pages to match ${needed} uncovered games…`);

    let matchedFromPages = 0;

    for (let page = 1; page <= Math.min(pages, 20); page++) {
      try {
        const data = await fetchPage(apiKey, page);
        const results = data.results || [];
        for (const rawgGame of results) {
          if (!rawgGame.background_image) continue;
          const catalogTitle = match(rawgGame.name);
          if (!catalogTitle) continue;
          if (alreadyCovered.has(catalogTitle) || newCovers.has(catalogTitle)) continue;
          newCovers.set(catalogTitle, makeRecord(catalogTitle, rawgGame));
          matchedFromPages++;
        }
        process.stdout.write(`  Page ${page}: ${results.length} RAWG games → ${matchedFromPages} matched so far\n`);
        if (!data.next) break;
        await pause(PAUSE_MS);
      } catch (err) {
        console.warn(`  ⚠️  Page ${page} failed: ${err.message}`);
        break;
      }
    }
    console.log(`  ✓ Phase 1 done: ${matchedFromPages} new covers from pages`);
  }

  // ── Phase 2: individual search for remaining games ──────────────────────────

  const stillMissing = games.filter(
    (g) => !alreadyCovered.has(g.title) && !newCovers.has(g.title)
  );
  console.log(`\n🔍  Searching RAWG individually for ${stillMissing.length} remaining games…`);

  let searchHits = 0;
  for (const game of stillMissing) {
    const rawgGame = await searchByTitle(apiKey, game.title);
    if (rawgGame?.background_image) {
      newCovers.set(game.title, makeRecord(game.title, rawgGame));
      console.log(`  ✓ ${game.title} → ${rawgGame.name}`);
      searchHits++;
    } else {
      console.log(`  ✗ ${game.title} (not found)`);
    }
    await pause(PAUSE_MS);
  }
  console.log(`  ✓ Phase 2 done: ${searchHits}/${stillMissing.length} found via search`);

  // ── Merge and write ──────────────────────────────────────────────────────────

  const totalNew = newCovers.size;
  console.log(`\n📊  Summary:`);
  console.log(`    Already covered:   ${alreadyCovered.size}`);
  console.log(`    New covers found:  ${totalNew}`);
  console.log(`    Still missing:     ${games.length - alreadyCovered.size - totalNew}`);

  if (dryRun) {
    console.log(`\n✅  Dry run — NOT written`);
    const sample = [...newCovers.values()].slice(0, 5).map((r) => `  ${r.title}: ${r.url?.slice(0, 60)}…`).join("\n");
    console.log("Sample:\n" + sample);
    return;
  }

  // Merge: keep existing, overwrite with new (fresher data)
  const byTitle = new Map(existingCovers.map((c) => [c.title, c]));
  for (const [title, record] of newCovers) {
    byTitle.set(title, record);
  }

  const merged = [...byTitle.values()];
  await writeFile(
    join(ROOT, "data/cover-snapshots.json"),
    JSON.stringify(merged, null, 2),
    "utf8",
  );
  console.log(`\n✅  Written ${merged.length} records → data/cover-snapshots.json`);
  console.log(`    New this run: ${totalNew}`);
  console.log(`    Checked at: ${new Date().toISOString()}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
