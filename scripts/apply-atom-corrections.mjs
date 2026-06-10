#!/usr/bin/env node
/**
 * apply-atom-corrections.mjs — apply manual atom corrections to data/games.json
 *
 * Usage:
 *   node scripts/apply-atom-corrections.mjs              # apply and write
 *   node scripts/apply-atom-corrections.mjs --dry-run    # show changes only
 */
"use strict";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// ── Corrections ───────────────────────────────────────────────────────────────
// Format: "Exact Title": { atoms, vibe, tone, difficulty, session, length }
// Only specified fields are overridden — rest stay as-is.

const CORRECTIONS = {
  // ── Action / Adventure ──────────────────────────────────────────────────────
  "Uncharted 2: Among Thieves":       { atoms: ["action", "story", "atmosphere"], vibe: "Cinematic adventure blockbuster" },
  "Uncharted 3: Drake's Deception":   { atoms: ["action", "story", "atmosphere"], vibe: "Cinematic adventure blockbuster" },
  "Uncharted 4: A Thief's End":       { atoms: ["action", "story", "atmosphere"], vibe: "Emotional cinematic adventure" },
  "Uncharted: Drake's Fortune":       { atoms: ["action", "story", "atmosphere"], vibe: "Cinematic treasure-hunt adventure" },
  "Uncharted: The Lost Legacy":       { atoms: ["action", "story", "atmosphere"], vibe: "Tight cinematic adventure" },
  "Batman: Arkham City":              { atoms: ["action", "story", "systems"], vibe: "Open-world superhero action", tone: "grim" },
  "Batman: Arkham Knight":            { atoms: ["action", "story", "systems"], vibe: "Dark superhero conclusion", tone: "grim" },
  "Batman: Arkham Asylum":            { atoms: ["action", "story", "atmosphere"], vibe: "Tight superhero action", tone: "grim" },
  "Assassin's Creed II":              { atoms: ["action", "story", "open-world"], vibe: "Renaissance open-world stealth action" },
  "Max Payne":                        { atoms: ["action", "story", "atmosphere"], vibe: "Noir bullet-time shooter", tone: "grim" },
  "Max Payne 3":                      { atoms: ["action", "story", "atmosphere"], vibe: "Intense third-person shooter", tone: "grim" },
  "Syphon Filter":                    { atoms: ["action", "stealth", "story"], vibe: "Tactical stealth action" },
  "inFAMOUS Second Son":              { atoms: ["action", "open-world", "story"], vibe: "Superhero open-world action" },
  "Marvel's Spider-Man: Miles Morales": { atoms: ["action", "story", "open-world"], vibe: "Feel-good superhero adventure" },
  "Watch Dogs 2":                     { atoms: ["action", "open-world", "systems"], vibe: "Hacker open-world sandbox" },
  "Metal Gear Solid V: The Phantom Pain": { atoms: ["action", "stealth", "systems"], vibe: "Deep open-world stealth sandbox", difficulty: "normal" },
  "Sekiro: Shadows Die Twice":        { atoms: ["action", "souls-like", "story"], vibe: "Precise parry-based souls combat", difficulty: "hard" },
  "Nioh 2":                           { atoms: ["action", "souls-like", "rpg"], vibe: "Deep souls-like with loot systems", difficulty: "hard" },
  "Ghost of Tsushima":                { atoms: ["action", "story", "open-world", "atmosphere"], vibe: "Samurai open-world epic" },

  // ── Roguelikes / Roguelites ─────────────────────────────────────────────────
  "Hades":                            { atoms: ["roguelike", "action", "story", "indie"], vibe: "Narrative roguelite with incredible writing" },
  "Dead Cells":                       { atoms: ["roguelike", "action", "platformer", "indie"], vibe: "Tight roguelite metroidvania", difficulty: "hard" },
  "Returnal":                         { atoms: ["roguelike", "action", "sci-fi", "souls-like"], vibe: "Intense sci-fi roguelike shooter", difficulty: "hard", tone: "strange" },
  "Rogue Legacy":                     { atoms: ["roguelike", "platformer", "indie", "systems"], vibe: "Family dynasty roguelite platformer" },
  "Enter the Gungeon":                { atoms: ["roguelike", "action", "indie"], vibe: "Bullet-hell roguelite dungeon crawler", difficulty: "hard" },
  "Spelunky 2":                       { atoms: ["roguelike", "platformer", "indie"], vibe: "Punishing roguelite spelunking", difficulty: "hard" },

  // ── Horror ──────────────────────────────────────────────────────────────────
  "Onimusha: Warlords":               { atoms: ["action", "story", "atmosphere"], vibe: "Japanese feudal action adventure", tone: "dark" },
  "Resident Evil Code: Veronica":     { atoms: ["horror", "story", "puzzle"], vibe: "Classic survival horror mystery", difficulty: "normal" },

  // ── Story / Narrative ───────────────────────────────────────────────────────
  "The Walking Dead: Season 1":       { atoms: ["story", "horror", "atmosphere"], vibe: "Emotional choice-driven survival story", tone: "grim" },
  "Detroit: Become Human":            { atoms: ["story", "atmosphere"], vibe: "Branching sci-fi choice drama", tone: "neutral" },
  "Heavy Rain":                       { atoms: ["story", "mystery", "atmosphere"], vibe: "Dark interactive thriller", tone: "grim" },
  "Beyond: Two Souls":                { atoms: ["story", "atmosphere"], vibe: "Cinematic supernatural drama" },
  "Life is Strange":                  { atoms: ["story", "mystery", "indie"], vibe: "Time-rewind coming-of-age drama" },
  "Undertale":                        { atoms: ["rpg", "story", "indie", "mystery"], vibe: "Subversive meta RPG with heart", tone: "light" },
  "Disco Elysium: The Final Cut":     { atoms: ["rpg", "story", "mystery", "systems"], vibe: "Unprecedented literary detective RPG" },
  "What Remains of Edith Finch":      { atoms: ["story", "atmosphere", "indie"], vibe: "Intimate family history walking sim", session: "short", length: "short" },
  "Oxenfree":                         { atoms: ["story", "mystery", "indie", "atmosphere"], vibe: "Supernatural teen mystery radio drama" },

  // ── Platformers ─────────────────────────────────────────────────────────────
  "Rayman Legends":                   { atoms: ["platformer", "co-op", "indie"], vibe: "Joyful rhythm platformer", tone: "light" },
  "Shovel Knight":                    { atoms: ["platformer", "indie", "action"], vibe: "Lovingly crafted retro platformer" },
  "Celeste":                          { atoms: ["platformer", "indie", "story"], vibe: "Precision platformer about anxiety", difficulty: "hard" },
  "Crash Bandicoot N. Sane Trilogy":  { atoms: ["platformer", "action"], vibe: "Classic PS1 platformer remastered" },
  "Sonic Mania":                      { atoms: ["platformer", "action", "indie"], vibe: "Pure Sonic speed platforming love letter" },

  // ── Metroidvanias ───────────────────────────────────────────────────────────
  "Ori and the Will of the Wisps":    { atoms: ["metroidvania", "platformer", "story", "indie"], vibe: "Gorgeous emotional metroidvania", tone: "moody" },
  "Ori and the Blind Forest":         { atoms: ["metroidvania", "platformer", "story", "indie"], vibe: "Beautiful atmospheric metroidvania" },
  "Blasphemous":                      { atoms: ["metroidvania", "action", "souls-like", "indie"], vibe: "Dark Spanish folklore metroidvania", tone: "grim", difficulty: "hard" },

  // ── Strategy / Tactics ──────────────────────────────────────────────────────
  "XCOM 2":                           { atoms: ["strategy", "tactics", "systems", "sci-fi"], vibe: "Tense turn-based alien resistance", difficulty: "hard" },
  "Into the Breach":                  { atoms: ["strategy", "tactics", "indie", "puzzle"], vibe: "Perfect-information mech tactics", difficulty: "hard" },
  "Shadow Tactics: Blades of the Shogun": { atoms: ["strategy", "stealth", "tactics"], vibe: "Precise feudal Japan stealth tactics", difficulty: "hard" },

  // ── RPGs ────────────────────────────────────────────────────────────────────
  "Divinity: Original Sin 2":         { atoms: ["rpg", "strategy", "co-op", "story", "systems"], vibe: "Deep tactical co-op RPG masterpiece", difficulty: "hard" },
  "Persona 5":                        { atoms: ["rpg", "story", "systems", "anime", "atmosphere"], vibe: "Stylish JRPG with daily life sim", length: "massive", commitment: "high" },
  "Final Fantasy X":                  { atoms: ["rpg", "story", "fantasy", "atmosphere"], vibe: "Emotional JRPG epic journey", length: "long" },
  "Final Fantasy IX":                 { atoms: ["rpg", "story", "fantasy", "atmosphere"], vibe: "Charming classic JRPG", length: "long" },
  "Dragon Age: Origins":              { atoms: ["rpg", "story", "systems", "fantasy"], vibe: "Deep western fantasy RPG" },
  "Mass Effect Legendary Edition":    { atoms: ["rpg", "story", "sci-fi", "systems"], vibe: "Definitive sci-fi RPG trilogy", length: "massive" },
  "Yakuza 0":                         { atoms: ["story", "action", "systems", "anime"], vibe: "Melodramatic Japanese crime epic", tone: "grim" },

  // ── Shooters / FPS ──────────────────────────────────────────────────────────
  "Quake":                            { atoms: ["action", "sci-fi", "arcade"], vibe: "Classic arena FPS speed-run", difficulty: "normal" },
  "Call of Duty 4: Modern Warfare":   { atoms: ["action", "story", "multiplayer"], vibe: "Definitive military shooter campaign" },
  "BioShock":                         { atoms: ["action", "story", "atmosphere", "sci-fi"], vibe: "Atmospheric narrative shooter", tone: "grim" },
  "BioShock Infinite":                { atoms: ["action", "story", "atmosphere", "sci-fi"], vibe: "Ambitious story-driven shooter", tone: "strange" },

  // ── Survival / Open-world ───────────────────────────────────────────────────
  "Subnautica":                       { atoms: ["survival", "exploration", "sci-fi", "systems"], vibe: "Alien ocean survival exploration", tone: "strange" },
  "No Man's Sky":                     { atoms: ["exploration", "survival", "sci-fi", "systems", "open-world"], vibe: "Infinite procedural space exploration" },
  "The Forest":                       { atoms: ["survival", "horror", "systems", "co-op"], vibe: "Cannibal island survival horror", tone: "grim" },

  // ── Puzzle ──────────────────────────────────────────────────────────────────
  "Portal 2":                         { atoms: ["puzzle", "story", "co-op", "sci-fi"], vibe: "Brilliant co-op puzzle platformer" },
  "The Talos Principle":              { atoms: ["puzzle", "story", "atmosphere"], vibe: "Philosophical robot puzzle adventure", tone: "moody" },
  "The Witness":                      { atoms: ["puzzle", "exploration", "atmosphere"], vibe: "Open-world line puzzle mystery", difficulty: "hard" },

  // ── Racing / Sports ─────────────────────────────────────────────────────────
  "Gran Turismo Sport":               { atoms: ["racing", "simulation"], vibe: "Precise racing simulation", difficulty: "hard" },
  "Assetto Corsa":                    { atoms: ["racing", "simulation"], vibe: "Hardcore racing sim", difficulty: "hard" },

  // ── Indie / Chill ───────────────────────────────────────────────────────────
  "Sayonara Wild Hearts":             { atoms: ["music", "indie", "arcade"], vibe: "Pop album rhythm action dream", session: "short", length: "short" },
  "Thumper":                          { atoms: ["music", "arcade", "indie"], vibe: "Violent rhythm violence", difficulty: "hard" },
  "Shu":                              { atoms: ["platformer", "indie"], vibe: "Wind-gliding runner platformer", session: "short" },
  "Oddworld: Abe's Oddysee":          { atoms: ["platformer", "puzzle", "story"], vibe: "Dark puzzle platformer rescue mission", tone: "strange" },
  "Frostpunk":                        { atoms: ["strategy", "survival", "systems", "dark"], vibe: "Brutal city survival strategy", difficulty: "hard", tone: "grim" },
  "SUPERHOT VR":                      { atoms: ["action", "puzzle", "arcade"], vibe: "Time moves when you move FPS puzzle", session: "short" },
  "Fahrenheit (Indigo Prophecy)":     { atoms: ["story", "mystery", "atmosphere"], vibe: "Supernatural noir interactive thriller" },
  "Psychonauts 2":                    { atoms: ["platformer", "story", "indie", "atmosphere"], vibe: "Mind-bending platformer sequel", tone: "light" },
};

// ── Apply ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  const games = JSON.parse(await readFile(join(ROOT, "data/games.json"), "utf8"));
  let changed = 0;

  const corrected = games.map((game) => {
    const fix = CORRECTIONS[game.title];
    if (!fix) return game;
    const before = { atoms: game.atoms, vibe: game.vibe, tone: game.tone, difficulty: game.difficulty };
    const updated = { ...game, ...fix };
    if (JSON.stringify(before) !== JSON.stringify({ atoms: updated.atoms, vibe: updated.vibe, tone: updated.tone, difficulty: updated.difficulty })) {
      console.log(`  ✏️  ${game.title}`);
      if (fix.atoms) console.log(`       atoms: [${before.atoms}] → [${fix.atoms}]`);
      if (fix.vibe) console.log(`       vibe:  "${before.vibe}" → "${fix.vibe}"`);
      if (fix.tone && fix.tone !== before.tone) console.log(`       tone:  ${before.tone} → ${fix.tone}`);
      changed++;
    }
    return updated;
  });

  console.log(`\n📊  ${changed} games corrected out of ${Object.keys(CORRECTIONS).length} corrections defined`);

  const notFound = Object.keys(CORRECTIONS).filter((title) => !games.find((g) => g.title === title));
  if (notFound.length) console.log(`⚠️   Not in catalog: ${notFound.join(", ")}`);

  if (dryRun) {
    console.log(`\n✅  Dry run — NOT written`);
    return;
  }

  await writeFile(join(ROOT, "data/games.json"), JSON.stringify(corrected, null, 2), "utf8");
  console.log(`\n✅  Written → data/games.json`);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
