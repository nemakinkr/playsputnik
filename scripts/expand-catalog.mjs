#!/usr/bin/env node
/**
 * expand-catalog.mjs — pull PS4/PS5 games from RAWG and merge into data/games.json
 *
 * Usage:
 *   node scripts/expand-catalog.mjs              # fetch top ~200 games, merge
 *   node scripts/expand-catalog.mjs --dry-run    # print new entries, don't write
 *   node scripts/expand-catalog.mjs --limit 100  # limit fetched games
 *
 * Requires: RAWG_API_KEY in .env.local
 * RAWG docs: https://rawg.io/apidocs
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
const PAUSE_MS = 300;

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

// ── Atom taxonomy ─────────────────────────────────────────────────────────────
// Maps RAWG genre slugs + tag slugs → our atoms

const GENRE_TO_ATOMS = {
  "action":            ["action"],
  "action-rpg":        ["action", "rpg"],
  "adventure":         ["story"],
  "role-playing-games-rpg": ["rpg", "systems"],
  "shooter":           ["action"],
  "fighting":          ["action"],
  "sports":            ["sports"],
  "racing":            ["racing"],
  "puzzle":            ["puzzle"],
  "platformer":        ["platformer"],
  "strategy":          ["strategy", "systems"],
  "simulation":        ["simulation", "systems"],
  "arcade":            ["arcade"],
  "casual":            [],
  "family":            [],
  "indie":             ["indie"],
  "massively-multiplayer": ["multiplayer"],
  "board-games":       ["strategy"],
  "card":              ["strategy"],
  "educational":       [],
  "horror":            ["horror"],
};

const TAG_TO_ATOMS = {
  "open-world":        ["open-world"],
  "rpg":               ["rpg"],
  "story-rich":        ["story"],
  "atmospheric":       ["atmosphere"],
  "co-op":             ["co-op"],
  "multiplayer":       ["multiplayer"],
  "stealth":           ["stealth"],
  "horror":            ["horror"],
  "survival":          ["survival"],
  "crafting":          ["crafting"],
  "roguelike":         ["roguelike"],
  "roguelite":         ["roguelike"],
  "metroidvania":      ["metroidvania"],
  "souls-like":        ["souls-like"],
  "hack-and-slash":    ["action"],
  "turn-based":        ["turn-based"],
  "tactical":          ["tactics"],
  "sandbox":           ["sandbox"],
  "exploration":       ["exploration"],
  "puzzle-platformer": ["puzzle", "platformer"],
  "third-person":      [],
  "first-person":      [],
  "sci-fi":            ["sci-fi"],
  "fantasy":           ["fantasy"],
  "action-rpg":        ["action", "rpg"],
  "psychological-horror": ["horror", "atmosphere"],
  "mystery":           ["mystery"],
  "detective":         ["mystery"],
  "narrative":         ["story"],
  "choices-matter":    ["story"],
  "dark":              ["dark"],
  "cyberpunk":         ["sci-fi"],
  "post-apocalyptic":  ["dark"],
  "anime":             ["anime"],
  "music":             ["music"],
  "rhythm":            ["music"],
  "sports":            ["sports"],
  "fishing":           ["relaxed"],
  "farming":           ["relaxed"],
  "management":        ["management", "systems"],
  "city-builder":      ["management"],
};

function genreAndTagsToAtoms(genres, tags) {
  const atoms = new Set();
  for (const g of genres) {
    const mapped = GENRE_TO_ATOMS[g.slug] || [];
    mapped.forEach((a) => atoms.add(a));
  }
  for (const t of tags.slice(0, 20)) {
    const mapped = TAG_TO_ATOMS[t.slug] || [];
    mapped.forEach((a) => atoms.add(a));
  }
  // Fallback — at least one atom
  if (atoms.size === 0) atoms.add("action");
  return [...atoms].slice(0, 5);
}

// ── Metadata inference ────────────────────────────────────────────────────────

function inferSession(hltb) {
  if (!hltb) return "medium";
  if (hltb < 6) return "short";
  if (hltb < 20) return "medium";
  return "long";
}

function inferLength(hltb) {
  if (!hltb) return "medium";
  if (hltb < 8) return "short";
  if (hltb < 30) return "medium";
  if (hltb < 60) return "long";
  return "massive";
}

function inferCommitment(hltb, genres) {
  const genreSlugs = genres.map((g) => g.slug);
  if (genreSlugs.includes("massively-multiplayer")) return "high";
  if (!hltb) return "medium";
  if (hltb < 8) return "low";
  if (hltb < 25) return "medium";
  return "high";
}

function inferTone(tags, genres) {
  const slugs = new Set([...tags.map((t) => t.slug), ...genres.map((g) => g.slug)]);
  if (slugs.has("horror") || slugs.has("psychological-horror")) return "dark";
  if (slugs.has("post-apocalyptic") || slugs.has("dark")) return "grim";
  if (slugs.has("atmospheric")) return "moody";
  if (slugs.has("comedy") || slugs.has("funny")) return "light";
  if (slugs.has("sci-fi") || slugs.has("cyberpunk")) return "strange";
  if (slugs.has("fantasy")) return "epic";
  return "neutral";
}

function inferContent(tags) {
  const slugs = new Set(tags.map((t) => t.slug));
  if (slugs.has("gore") || slugs.has("violent")) return "graphic-violence";
  if (slugs.has("horror")) return "horror-themes";
  if (slugs.has("nudity") || slugs.has("sexual-content")) return "adult";
  return "stylized-violence";
}

function inferAdultTimeFit(hltb) {
  if (!hltb) return "anytime";
  if (hltb < 6) return "anytime";
  if (hltb < 15) return "evening";
  return "weekend";
}

function inferDifficulty(tags) {
  const slugs = new Set(tags.map((t) => t.slug));
  if (slugs.has("souls-like") || slugs.has("difficult") || slugs.has("hard")) return "hard";
  if (slugs.has("casual") || slugs.has("family-friendly")) return "easy";
  return "normal";
}

function inferReviewBurden(genres) {
  const slugs = new Set(genres.map((g) => g.slug));
  if (slugs.has("role-playing-games-rpg") || slugs.has("strategy")) return "medium";
  return "low";
}

function generateColor(genres) {
  const palette = [
    ["#1a1a2e", "#e94560"],
    ["#0d1b2a", "#2d6a4f"],
    ["#1b1b2f", "#e07b54"],
    ["#12232e", "#4fc3f7"],
    ["#1a0533", "#9c27b0"],
    ["#0f2027", "#2c5364"],
    ["#1c1c1c", "#c0392b"],
    ["#0a0a0a", "#f39c12"],
    ["#1a1a1a", "#3498db"],
    ["#16213e", "#0f3460"],
  ];
  const idx = Math.abs(genres.reduce((sum, g) => sum + g.name.charCodeAt(0), 0)) % palette.length;
  const [a, b] = palette[idx];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

function generateVibe(game, genres, tags) {
  const tagNames = new Set(tags.slice(0, 10).map((t) => t.name.toLowerCase()));
  const genreNames = genres.map((g) => g.name);
  // Simple rule-based vibe
  if (tagNames.has("souls-like")) return "Punishing souls-like challenge";
  if (tagNames.has("open-world") && genreNames.includes("Role Playing Games")) return "Vast open-world RPG";
  if (tagNames.has("horror")) return "Atmospheric horror experience";
  if (tagNames.has("roguelike") || tagNames.has("roguelite")) return "Roguelite runs and progression";
  if (tagNames.has("metroidvania")) return "Interconnected metroidvania exploration";
  if (tagNames.has("story-rich")) return "Story-driven narrative adventure";
  if (tagNames.has("co-op")) return "Cooperative multiplayer fun";
  if (genreNames.includes("Sports")) return "Competitive sports simulation";
  if (genreNames.includes("Racing")) return "High-speed racing action";
  if (genreNames.includes("Puzzle")) return "Mind-bending puzzle solving";
  if (genreNames.includes("Platformer")) return "Tight platformer action";
  if (genreNames.includes("Strategy")) return "Deep strategic gameplay";
  return `${genreNames[0] || "Action"} adventure`;
}

// ── RAWG fetch ────────────────────────────────────────────────────────────────

async function fetchRawgPage(apiKey, page, pageSize) {
  const params = new URLSearchParams({
    key: apiKey,
    platforms: `${PS4_ID},${PS5_ID}`,
    ordering: "-metacritic",
    page_size: String(pageSize),
    page: String(page),
    exclude_additions: "true",
  });
  const resp = await fetch(`${RAWG_BASE}/games?${params}`);
  if (!resp.ok) throw new Error(`RAWG HTTP ${resp.status}`);
  return resp.json();
}

function pause(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Transform ─────────────────────────────────────────────────────────────────

function rawgToEntry(game) {
  const genres = game.genres || [];
  const tags = (game.tags || []).filter((t) => t.language === "eng");
  const hltb = game.playtime || null; // RAWG playtime in hours (rough)

  return {
    title: game.name,
    atoms: genreAndTagsToAtoms(genres, tags),
    vibe: generateVibe(game, genres, tags),
    session: inferSession(hltb),
    difficulty: inferDifficulty(tags),
    length: inferLength(hltb),
    commitment: inferCommitment(hltb, genres),
    tone: inferTone(tags, genres),
    content: inferContent(tags),
    reviewBurden: inferReviewBurden(genres),
    adultTimeFit: inferAdultTimeFit(hltb),
    backlog: false,
    wishlist: false,
    color: generateColor(genres),
    hltbHours: hltb || null,
    criticScore: game.metacritic || null,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  await loadEnv();

  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    console.error("❌  RAWG_API_KEY not set. Add it to .env.local (free at rawg.io/apidocs)");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArg = args.includes("--limit") ? parseInt(args[args.indexOf("--limit") + 1]) : 200;

  // Load existing catalog
  const existing = JSON.parse(await readFile(join(ROOT, "data/games.json"), "utf8"));
  const existingTitles = new Set(existing.map((g) => g.title.toLowerCase()));
  console.log(`📋  Existing catalog: ${existing.length} games`);

  // Fetch from RAWG
  const PAGE_SIZE = 40;
  const pages = Math.ceil(limitArg / PAGE_SIZE);
  const fetched = [];

  console.log(`\n🌐  Fetching up to ${limitArg} PS4/PS5 games from RAWG…`);
  for (let page = 1; page <= pages; page++) {
    try {
      const data = await fetchRawgPage(apiKey, page, PAGE_SIZE);
      const results = data.results || [];
      fetched.push(...results);
      process.stdout.write(`  Page ${page}/${pages}: +${results.length} games (total ${fetched.length})\n`);
      if (!data.next) break;
      await pause(PAUSE_MS);
    } catch (err) {
      console.warn(`  ⚠️  Page ${page} failed: ${err.message}`);
      break;
    }
  }

  // Normalize title for dedup (strip Roman numerals variants, punctuation diffs)
  function normalizeTitle(t) {
    return t.toLowerCase()
      .replace(/[:\-–—''""]/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\biii\b/g, "3").replace(/\bii\b/g, "2").replace(/\biv\b/g, "4")
      .replace(/\bthe\b/g, "").trim();
  }
  const existingNorm = new Set(existing.map((g) => normalizeTitle(g.title)));

  // Filter and transform
  const newEntries = [];
  const skipped = [];

  for (const game of fetched) {
    if (!game.name) continue;
    if (existingTitles.has(game.name.toLowerCase()) || existingNorm.has(normalizeTitle(game.name))) {
      skipped.push(game.name);
      continue;
    }
    // Skip games with no metacritic score and no playtime — likely incomplete data
    if (!game.metacritic && !game.playtime) continue;
    newEntries.push(rawgToEntry(game));
    existingTitles.add(game.name.toLowerCase());
  }

  console.log(`\n📊  Results:`);
  console.log(`    Fetched:  ${fetched.length}`);
  console.log(`    Skipped (already in catalog): ${skipped.length}`);
  console.log(`    New entries: ${newEntries.length}`);

  if (newEntries.length === 0) {
    console.log("\n✅  Nothing new to add.");
    return;
  }

  // Preview
  console.log(`\n🎮  New games (first 20):`);
  newEntries.slice(0, 20).forEach((g) => {
    console.log(`    ${g.title.padEnd(40)} score:${String(g.criticScore ?? "—").padStart(4)}  atoms:[${g.atoms.join(", ")}]`);
  });
  if (newEntries.length > 20) console.log(`    … and ${newEntries.length - 20} more`);

  if (dryRun) {
    console.log(`\n✅  Dry run — NOT written`);
    return;
  }

  const merged = [...existing, ...newEntries];
  await writeFile(join(ROOT, "data/games.json"), JSON.stringify(merged, null, 2), "utf8");
  console.log(`\n✅  Written ${merged.length} games → data/games.json  (+${newEntries.length} new)`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
