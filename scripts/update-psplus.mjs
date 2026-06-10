#!/usr/bin/env node
/**
 * update-psplus.mjs — refresh PS Plus Extra/Premium catalog
 *
 * Strategy: PS Store has an undocumented container API used by the storefront.
 * We fetch the PS Plus Extra and Premium category pages and match titles to
 * our games catalog. Unmatched entries are logged but not written.
 *
 * Usage:
 *   node scripts/update-psplus.mjs              # update all regions
 *   node scripts/update-psplus.mjs --dry-run    # print matches, don't write
 *   node scripts/update-psplus.mjs --region US  # single region only
 *
 * Docs: unofficial PS Store container API (may change without notice)
 */
"use strict";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// ── PS Store category IDs ─────────────────────────────────────────────────────
// Verified 2026-06-08. Update if PS Store changes its category structure.
// To find updated IDs: fetch https://store.playstation.com/en-us/pages/latest?gameType=ps-plus
// and inspect category/{uuid} links in the HTML.
const PS_PLUS_CATEGORIES = {
  Extra:   "30e3fe35-8f2d-4496-95bc-844f56952e3c",
  // Premium: "b6c4e67d-f620-4c63-ba4c-baf1f55e1b49", // TODO: find correct Premium ID
};

const REGIONS = [
  { country: "US", locale: "en-us" },
  { country: "GB", locale: "en-gb" },
  { country: "DE", locale: "de-de" },
  { country: "TR", locale: "tr-tr" },
];

const RATE_PAUSE_MS = 600;
const PAGE_SIZE = 100;
const MAX_PAGES = 20; // max 2000 games per tier/region

function pause(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── PS Store container API ────────────────────────────────────────────────────

async function fetchPsPlusTierTitles(tier, categoryId, locale, maxPages = MAX_PAGES) {
  const titles = new Set();
  for (let page = 1; page <= maxPages; page++) {
    const url = `https://store.playstation.com/${locale}/category/${categoryId}/${page}`;
    try {
      const resp = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PlaySputnik/1.0)" },
      });
      if (!resp.ok) {
        if (resp.status === 404) break; // no more pages
        console.warn(`  [PSStore] HTTP ${resp.status} for ${locale} ${tier} page ${page}`);
        break;
      }
      const html = await resp.text();

      // PS Store embeds Apollo cache in a <script id="__NEXT_DATA__"> block
      // Try to extract product names from the cache
      const nextData = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (!nextData) {
        // Try Apollo cache format
        const apolloMatch = html.match(/<script[^>]*>(window\.__apollo_state__[\s\S]*?)<\/script>/);
        if (!apolloMatch) {
          console.warn(`  [PSStore] No data found in page ${page} for ${locale} ${tier}`);
          break;
        }
      }

      let pageCount = 0;
      if (nextData) {
        try {
          const data = JSON.parse(nextData[1]);
          // Walk the Apollo cache for Product entries with name fields
          const cache = data?.props?.apolloState || data?.props?.pageProps?.apolloState || {};
          for (const [key, value] of Object.entries(cache)) {
            if (key.startsWith("Product:") && value?.name) {
              titles.add(value.name);
              pageCount++;
            }
          }
          // Also check products array in initialState
          const products = data?.props?.pageProps?.products || [];
          for (const p of products) {
            if (p?.name) { titles.add(p.name); pageCount++; }
          }
        } catch {
          // ignore parse errors
        }
      }

      console.log(`  [PSStore] ${locale} ${tier} page ${page}: +${pageCount} products (${titles.size} total)`);

      if (pageCount === 0) break; // no new data, stop pagination

      await pause(RATE_PAUSE_MS);
    } catch (err) {
      console.warn(`  [PSStore] fetch error for ${locale} ${tier} page ${page}:`, err.message);
      break;
    }
  }
  return titles;
}

// ── Title matching ────────────────────────────────────────────────────────────

function normalizeForMatch(title) {
  return title
    .toLowerCase()
    // Normalize quotes/apostrophes
    .replace(/[''ʼ´`]/g, "'")
    // Remove platform suffixes like " PS4 & PS5", " for PS5®", " PS4™"
    .replace(/\s+(ps[45][\s&™®]*)+(\s|$)/gi, " ")
    .replace(/\s+for ps[45][\s™®]*/gi, " ")
    // Remove edition suffixes
    .replace(/\s+(complete|ultimate|definitive|game of the year|goty|remastered|remake)\s+edition/gi, "")
    // Remove trademark symbols
    .replace(/[™®©]/g, "")
    // Remove colons in subtitles (treat "God of War: Ragnarök" = "God of War Ragnarök")
    // .replace(/:/g, " ")  — keep colon to avoid "the last of us" matching "the last of us part ii"
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim();
}

function titlesMatch(a, b) {
  const na = normalizeForMatch(a);
  const nb = normalizeForMatch(b);
  if (na === nb) return true;
  // Also try with colons removed
  const naNoColon = na.replace(/:/g, " ").replace(/\s+/g, " ").trim();
  const nbNoColon = nb.replace(/:/g, " ").replace(/\s+/g, " ").trim();
  if (naNoColon === nbNoColon) return true;
  // One starts with the other (handles subtitle variants)
  const shorter = na.length < nb.length ? na : nb;
  const longer = na.length < nb.length ? nb : na;
  if (longer.startsWith(shorter) && shorter.length >= 6) return true;
  return false;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const regionFilter = args.includes("--region") ? args[args.indexOf("--region") + 1] : null;

  const activeRegions = regionFilter
    ? REGIONS.filter((r) => r.country === regionFilter)
    : REGIONS;

  if (activeRegions.length === 0) {
    console.error(`❌  Unknown region: ${regionFilter}`);
    process.exit(1);
  }

  const games = JSON.parse(await readFile(join(ROOT, "data/games.json"), "utf8"));
  console.log(`\n📋  ${games.length} games in catalog`);

  // Load existing subscriptions
  let existing = [];
  try {
    existing = JSON.parse(await readFile(join(ROOT, "data/subscription-availability.json"), "utf8"));
  } catch { /* fresh start */ }

  const checkedAt = new Date().toISOString();
  const records = [];
  let totalMatched = 0;

  for (const { country, locale } of activeRegions) {
    console.log(`\n🎮  Fetching PS Plus catalog for ${country} (${locale})…`);

    for (const [tier, categoryId] of Object.entries(PS_PLUS_CATEGORIES)) {
      console.log(`  ↳ ${tier}…`);
      const storeTitles = await fetchPsPlusTierTitles(tier, categoryId, locale);
      console.log(`  ✓ PS Store returned ${storeTitles.size} ${tier} titles for ${country}`);

      // Match to our catalog
      let matched = 0;
      for (const game of games) {
        const isMatch = [...storeTitles].some((t) => titlesMatch(game.title, t));
        if (isMatch) {
          records.push({
            title: game.title,
            region: country,
            tier,
            source: "ps_store_catalog",
            checkedAt,
            freshnessState: "live",
            confidence: "medium",
          });
          matched++;
          totalMatched++;
        }
      }

      console.log(`  → ${matched} catalog games matched in ${country} ${tier}`);
      await pause(RATE_PAUSE_MS);
    }
  }

  // For regions we didn't update, carry over existing records
  const updatedKeys = new Set(records.map((r) => `${r.title}::${r.region}`));
  for (const r of existing) {
    if (!activeRegions.find((ar) => ar.country === r.region)) {
      records.push(r);
    }
  }

  console.log(`\n📊  Total matched: ${totalMatched} game×region pairs`);

  if (dryRun) {
    console.log(`\n✅  Dry run — ${records.length} records generated, NOT written`);
    const sample = records.slice(0, 5).map((r) => `  ${r.title} / ${r.region} / ${r.tier}`).join("\n");
    console.log("Sample:\n" + sample);
    return;
  }

  if (records.length === 0) {
    console.warn("⚠️  No records generated — PS Store API may have changed. Keeping existing data.");
    return;
  }

  await writeFile(
    join(ROOT, "data/subscription-availability.json"),
    JSON.stringify(records, null, 2),
    "utf8",
  );
  console.log(`\n✅  Written ${records.length} records → data/subscription-availability.json`);
  console.log(`    Regions: ${activeRegions.map((r) => r.country).join(", ")}`);
  console.log(`    Updated: ${checkedAt}`);
  console.log(`\n⚠️  Note: PS Store category IDs may change. If results look wrong, check:`);
  console.log(`    https://store.playstation.com/en-us/category/${PS_PLUS_CATEGORIES.Extra}/1`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
