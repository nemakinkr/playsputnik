#!/usr/bin/env node
/**
 * update-prices.mjs — fetch real PS Store prices from IsThereAnyDeal
 *
 * Usage:
 *   node scripts/update-prices.mjs              # all games, all regions
 *   node scripts/update-prices.mjs --dry-run    # print results, don't write file
 *   node scripts/update-prices.mjs --region US  # single region
 *
 * Requires: ITAD_API_KEY in .env.local (or env)
 * Docs: https://isthereanydeal.com/api/
 */
"use strict";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// ── Config ────────────────────────────────────────────────────────────────────

const ITAD_BASE = "https://api.isthereanydeal.com";
const PS_STORE_ID = 61; // IsThereAnyDeal shop ID for PlayStation Store

const REGIONS = [
  { country: "US", currency: "USD" },
  { country: "GB", currency: "GBP" },
  { country: "DE", currency: "EUR" },
  { country: "TR", currency: "TRY" },
];

// Pause between ITAD batch requests (ms) — stay well under 1000 req/5min
const RATE_PAUSE_MS = 400;

// ── Env ───────────────────────────────────────────────────────────────────────

async function loadEnv() {
  const envPath = join(ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  const text = await readFile(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

// ── ITAD helpers ──────────────────────────────────────────────────────────────

/**
 * Look up ITAD game IDs by title.
 * Returns Map<normalizedTitle, itadId>
 */
async function lookupItadIds(titles, apiKey) {
  // ITAD /games/search/v1 — search one at a time (simple, within quota)
  const results = new Map();
  for (const title of titles) {
    const url = `${ITAD_BASE}/games/search/v1?key=${apiKey}&title=${encodeURIComponent(title)}&results=3`;
    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        console.warn(`  [ITAD] search failed for "${title}": HTTP ${resp.status}`);
        continue;
      }
      const data = await resp.json();
      // data is an array of { id, slug, title, type }
      if (!Array.isArray(data) || data.length === 0) {
        console.warn(`  [ITAD] no result for "${title}"`);
        continue;
      }
      // Pick the best match (first result, ITAD sorts by relevance)
      const best = data.find((g) => g.type === "game") || data[0];
      results.set(title, best.id);
      console.log(`  [ITAD] "${title}" → ${best.id} (${best.title})`);
    } catch (err) {
      console.warn(`  [ITAD] search error for "${title}":`, err.message);
    }
    await pause(RATE_PAUSE_MS);
  }
  return results;
}

/**
 * Fetch prices for a batch of ITAD game IDs in a given country.
 * Returns Map<itadId, { price, regular, discount, currency, url }>
 */
async function fetchPricesForCountry(itadIds, country, apiKey) {
  if (itadIds.length === 0) return new Map();
  // ITAD /games/prices/v3 — POST with JSON array of IDs, up to 200 per request
  const BATCH = 200;
  const results = new Map();
  for (let i = 0; i < itadIds.length; i += BATCH) {
    const batch = itadIds.slice(i, i + BATCH);
    const params = new URLSearchParams({
      key: apiKey,
      country,
      shops: String(PS_STORE_ID),
      nondeals: "true",
    });
    const url = `${ITAD_BASE}/games/prices/v3?${params}`;
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
      });
      if (!resp.ok) {
        const errText = await resp.text().catch(() => "");
        console.warn(`  [ITAD] prices failed for ${country}: HTTP ${resp.status} ${errText.slice(0, 120)}`);
        continue;
      }
      const data = await resp.json();
      // data: Array of { id, deals: [{ shop, price, regular, cut, url }] }
      for (const game of data) {
        const psDeal = (game.deals || []).find((d) => d.shop?.id === PS_STORE_ID);
        if (!psDeal) continue;
        results.set(game.id, {
          price: psDeal.price?.amount ?? null,
          regular: psDeal.regular?.amount ?? psDeal.price?.amount ?? null,
          currency: psDeal.price?.currency ?? "",
          discount: psDeal.cut ?? 0,
          url: psDeal.url ?? null,
        });
      }
    } catch (err) {
      console.warn(`  [ITAD] prices error for ${country}:`, err.message);
    }
    await pause(RATE_PAUSE_MS);
  }
  return results;
}

// ── PS Store GraphQL fallback (TR) ────────────────────────────────────────────
// Used when ITAD doesn't have a price for a region.
// This is the undocumented PS Store storefront API — may break with PS Store updates.

const PS_STORE_REGIONS = {
  TR: { store: "tr/tr", currency: "TRY" },
  US: { store: "en-us", currency: "USD" },
  GB: { store: "en-gb", currency: "GBP" },
  DE: { store: "de-de", currency: "EUR" },
};

async function fetchPsStorePriceDirect(title, country) {
  // Step 1: search PS Store to get concept ID
  const regionCode = PS_STORE_REGIONS[country]?.store || "en-us";
  const searchUrl = `https://store.playstation.com/store/api/chihiro/00_09_000/tumbler/${regionCode}/99/search/${encodeURIComponent(title)}?suggested_size=5&mode=game`;
  try {
    const resp = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PlaySputnik price updater)",
      },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const links = data?.links;
    if (!Array.isArray(links) || links.length === 0) return null;
    const match = links[0];
    const price = match?.default_sku?.display_price;
    const regularPrice = match?.default_sku?.skus?.[0]?.display_price;
    if (!price) return null;
    // PS Store returns formatted strings like "₺699,00" — parse the number
    const numericPrice = parseFloat(
      price.replace(/[^\d.,]/g, "").replace(",", ".")
    );
    return {
      price: isNaN(numericPrice) ? null : numericPrice,
      regular: null,
      discount: 0,
      currency: PS_STORE_REGIONS[country]?.currency ?? "",
      url: `https://store.playstation.com/${regionCode}/product/${match.id}`,
      source: "ps-store-direct",
    };
  } catch {
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

function pause(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  await loadEnv();

  const apiKey = process.env.ITAD_API_KEY;
  if (!apiKey) {
    console.error("❌  ITAD_API_KEY not set. Add it to .env.local");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const regionFilter = args.includes("--region") ? args[args.indexOf("--region") + 1] : null;

  const activeRegions = regionFilter
    ? REGIONS.filter((r) => r.country === regionFilter)
    : REGIONS;

  if (activeRegions.length === 0) {
    console.error(`❌  Unknown region: ${regionFilter}. Options: ${REGIONS.map((r) => r.country).join(", ")}`);
    process.exit(1);
  }

  // Load catalog
  const games = JSON.parse(await readFile(join(ROOT, "data/games.json"), "utf8"));
  const titles = games.map((g) => g.title);
  console.log(`\n📋  ${titles.length} games in catalog`);

  // Load existing snapshots (to keep entries for games we can't update)
  let existing = [];
  try {
    existing = JSON.parse(await readFile(join(ROOT, "data/price-snapshots.json"), "utf8"));
  } catch { /* fresh start */ }

  // Load manual price overrides
  let overrides = {};
  try {
    overrides = JSON.parse(await readFile(join(ROOT, "data/price-overrides.json"), "utf8"));
  } catch { /* optional */ }

  // Step 1: resolve ITAD IDs for all titles
  console.log("\n🔍  Looking up ITAD game IDs…");
  const itadIdMap = await lookupItadIds(titles, apiKey); // Map<title, itadId>
  console.log(`  ✓ Resolved ${itadIdMap.size}/${titles.length} games`);

  const snapshots = [];
  const checkedAt = new Date().toISOString();

  // Step 2: for each region, fetch prices
  for (const { country, currency } of activeRegions) {
    console.log(`\n💰  Fetching prices for ${country}…`);
    const itadIds = [...itadIdMap.values()];
    const priceMap = await fetchPricesForCountry(itadIds, country, apiKey);

    // Invert ID map: itadId → title
    const idToTitle = new Map([...itadIdMap.entries()].map(([t, id]) => [id, t]));

    let hit = 0, miss = 0, fallback = 0;

    for (const game of games) {
      const itadId = itadIdMap.get(game.title);
      let entry = itadId ? priceMap.get(itadId) : null;
      let source = "itad";

      if (!entry) {
        // Check manual overrides first
        const override = overrides[game.title];
        if (override) {
          if (override.status === "free") {
            entry = { price: 0, regular: 0, discount: 0, currency, url: null };
            source = "override-free";
            fallback++;
          } else if (override.status === "delisted") {
            snapshots.push({
              title: game.title, region: country, price: null, currency,
              discount: 0, source: "delisted", checkedAt,
              freshnessState: "delisted", confidence: "none",
              note: override.note,
            });
            miss++;
            continue;
          } else if (override.status === "manual" && override.prices?.[country]) {
            const p = override.prices[country];
            entry = { price: p.price, regular: p.regular, discount: p.discount, currency: p.currency ?? currency, url: null };
            source = "override-manual";
            fallback++;
          }
        }

        if (!entry) {
          // Try PS Store direct as fallback (especially for TR)
          const direct = await fetchPsStorePriceDirect(game.title, country);
          if (direct) {
            entry = direct;
            source = "ps-store-direct";
            fallback++;
          } else {
            // Keep existing snapshot if we have one
            const prev = existing.find((s) => s.title === game.title && s.region === country);
            if (prev) {
              snapshots.push({ ...prev, freshnessState: "stale" });
            } else {
              snapshots.push({
                title: game.title, region: country, price: null, currency,
                discount: 0, source: "unavailable", checkedAt,
                freshnessState: "missing", confidence: "none",
              });
            }
            miss++;
            continue;
          }
        }
      } else {
        hit++;
      }

      const regularPrice = entry.regular ?? entry.price;
      const discountPct = entry.discount ?? (
        regularPrice && entry.price && regularPrice > entry.price
          ? Math.round((1 - entry.price / regularPrice) * 100)
          : 0
      );

      const snapshot = {
        title: game.title,
        region: country,
        price: entry.price,
        regular: entry.regular ?? null,
        currency: entry.currency || currency,
        discount: discountPct,
        source,
        checkedAt,
        freshnessState: "live",
        confidence: source === "itad" ? "high" : "medium",
      };
      if (entry.url) snapshot.storeUrl = entry.url;
      snapshots.push(snapshot);

      if (!dryRun || hit <= 5) {
        console.log(
          `  ${game.title.slice(0, 35).padEnd(35)} ${String(entry.price ?? "—").padStart(8)} ${currency}` +
          (discountPct > 0 ? `  -${discountPct}%` : "")
        );
      }
      await pause(50);
    }
    console.log(`  ✓ ${hit} live  ${fallback} fallback  ${miss} missing`);
  }

  if (dryRun) {
    console.log(`\n✅  Dry run — ${snapshots.length} snapshots generated, NOT written`);
    return;
  }

  // Write snapshots
  await writeFile(
    join(ROOT, "data/price-snapshots.json"),
    JSON.stringify(snapshots, null, 2),
    "utf8",
  );

  // Accumulate price history (object keyed by title → region → array of {price, discount, checkedAt})
  const HISTORY_MAX = 52; // keep up to 1 year of weekly entries
  let history = {};
  try {
    const raw = JSON.parse(await readFile(join(ROOT, "data/price-history.json"), "utf8"));
    // Migrate from old flat-array format if needed
    if (Array.isArray(raw)) {
      raw.forEach((s) => {
        if (!s.title || !s.region || s.price == null) return;
        history[s.title] ??= {};
        history[s.title][s.region] ??= [];
        history[s.title][s.region].push({ price: s.price, discount: s.discount ?? 0, checkedAt: s.checkedAt });
      });
    } else {
      history = raw;
    }
  } catch { /* fresh start */ }

  let historyAdded = 0;
  for (const snap of snapshots) {
    if (snap.price == null || snap.freshnessState !== "live") continue;
    history[snap.title] ??= {};
    history[snap.title][snap.region] ??= [];
    const arr = history[snap.title][snap.region];
    // Only add if price or discount changed since last entry (avoid duplicate runs)
    const last = arr[arr.length - 1];
    if (!last || last.price !== snap.price || last.discount !== snap.discount) {
      arr.push({ price: snap.price, discount: snap.discount ?? 0, checkedAt: snap.checkedAt });
      if (arr.length > HISTORY_MAX) arr.splice(0, arr.length - HISTORY_MAX);
      historyAdded++;
    }
  }

  await writeFile(
    join(ROOT, "data/price-history.json"),
    JSON.stringify(history, null, 2),
    "utf8",
  );

  console.log(`\n✅  Written ${snapshots.length} snapshots → data/price-snapshots.json`);
  console.log(`    Written ${historyAdded} new history entries → data/price-history.json`);
  console.log(`    Regions: ${activeRegions.map((r) => r.country).join(", ")}`);
  console.log(`    Updated: ${checkedAt}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
