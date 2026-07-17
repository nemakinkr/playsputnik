#!/usr/bin/env node
/* Refresh the upcoming-release radar from RAWG. Dates remain provider candidates. */
"use strict";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUTPUT = join(ROOT, "data/taste-radar.json");
const RAWG_BASE = "https://api.rawg.io/api/games";
const PLATFORM_IDS = "18,187,4,1,7,186";
const GENRE_ATOMS = {
  action: ["action"], adventure: ["story", "exploration"], indie: ["indie"],
  "role-playing-games-rpg": ["rpg", "systems"], shooter: ["shooter", "action"],
  strategy: ["strategy", "systems"], simulation: ["simulation", "systems"],
  puzzle: ["puzzle"], platformer: ["platformer"], racing: ["racing"], sports: ["sports"],
  "massively-multiplayer": ["multiplayer"], fighting: ["action"], arcade: ["arcade"],
};
const TAG_ATOMS = {
  "story-rich": ["story"], atmospheric: ["atmosphere"], "open-world": ["open-world"],
  horror: ["horror"], stealth: ["stealth"], survival: ["survival"],
  "sci-fi": ["sci-fi"], fantasy: ["fantasy"], exploration: ["exploration"],
  tactical: ["tactical"], "turn-based": ["turn-based"], mystery: ["mystery"],
  "choices-matter": ["choice"], "co-op": ["co-op"], multiplayer: ["multiplayer"],
  "souls-like": ["soulslike"], metroidvania: ["metroidvania"], sandbox: ["sandbox"],
};

async function loadEnv() {
  const path = join(ROOT, ".env.local");
  if (!existsSync(path)) return;
  for (const raw of (await readFile(path, "utf8")).split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

function dateArg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function addMonths(iso, count) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + count);
  return date.toISOString().slice(0, 10);
}

function atomList(game) {
  const values = [
    ...(game.genres || []).flatMap((item) => GENRE_ATOMS[item.slug] || []),
    ...(game.tags || []).filter((item) => item.language === "eng").flatMap((item) => TAG_ATOMS[item.slug] || []),
  ];
  return [...new Set(values)].slice(0, 7);
}

function adultTimeFit(game) {
  const hours = Number(game.playtime) || 0;
  if (hours && hours <= 8) return "weeknight";
  if (hours >= 35) return "vacation";
  return "weekend";
}

function toneFor(atoms) {
  if (atoms.includes("horror")) return "tense";
  if (atoms.includes("fantasy")) return "epic";
  if (atoms.includes("sci-fi")) return "strange";
  return "neutral";
}

async function fetchUpcoming(apiKey, from, to) {
  const params = new URLSearchParams({
    key: apiKey, dates: `${from},${to}`, platforms: PLATFORM_IDS,
    ordering: "-added", page_size: "40", exclude_additions: "true",
  });
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(`${RAWG_BASE}?${params}`);
    if (response.ok) return response.json();
    lastError = new Error(`RAWG HTTP ${response.status}`);
    if (![429, 500, 502, 503, 504].includes(response.status)) break;
    await new Promise((resolve) => setTimeout(resolve, attempt * 700));
  }
  throw lastError;
}

async function main() {
  await loadEnv();
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) throw new Error("RAWG_API_KEY not set");
  const today = new Date().toISOString().slice(0, 10);
  const from = dateArg("--from", today);
  const to = dateArg("--to", addMonths(from, 18));
  const checkedAt = new Date().toISOString();
  const payload = await fetchUpcoming(apiKey, from, to);
  const seen = new Set();
  const records = (payload.results || [])
    .filter((game) => game.name && game.slug && game.released && game.background_image)
    .filter((game) => game.released >= from && game.released <= to)
    .filter((game) => {
      const key = game.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((game) => {
      const atoms = atomList(game);
      return {
        title: game.name,
        releaseDate: game.released,
        window: game.released.slice(0, 4),
        atoms: atoms.length ? atoms : ["action"],
        tone: toneFor(atoms),
        adultTimeFit: adultTimeFit(game),
        reason: "Upcoming RAWG candidate. Taste fit is personalized in PlaySputnik; verify the release date with the publisher before planning.",
        source: "rawg",
        sourceUrl: `https://rawg.io/games/${game.slug}`,
        coverUrl: game.background_image,
        checkedAt,
        freshnessState: "fresh",
        confidence: "medium",
        identityConfidence: "high",
        releaseConfidence: "medium",
        platforms: (game.platforms || []).map((item) => item.platform?.name).filter(Boolean),
        providerRecordId: game.id,
      };
    })
    .filter((item) => item.atoms.length)
    .slice(0, 24);
  if (records.length < 12) throw new Error(`Only ${records.length} valid upcoming records; refusing to replace radar`);
  await writeFile(OUTPUT, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  console.log(`✅ Taste radar: ${records.length} RAWG candidates (${from} → ${to})`);
}

main().catch((error) => {
  console.error(`❌ Taste radar refresh failed: ${error.message}`);
  process.exit(1);
});
