import { readFile } from "node:fs/promises";

const games = JSON.parse(await readFile(new URL("../data/games.json", import.meta.url), "utf8"));
const byTitle = new Map(games.map((game) => [game.title, game]));
const violations = [];

function requireGame(title) {
  const game = byTitle.get(title);
  if (!game) throw new Error(`Atom audit game missing: ${title}`);
  return game;
}

function check(title, predicate, message) {
  const game = requireGame(title);
  if (!predicate(game)) violations.push(`${title}: ${message}`);
}

games.forEach((game) => {
  if (/\bservice\b/i.test(game.vibe || "") && !(game.atoms || []).includes("service")) {
    violations.push(`${game.title}: service-loop vibe is missing the service atom`);
  }
});

check("Battlefield 1", (game) => game.atoms.includes("shooter") && !game.atoms.includes("open-world"), "linear shooter campaign must not teach open-world preference");
check("Monster Hunter: World", (game) => (
  game.atoms.includes("challenge")
  && !game.atoms.includes("story")
  && game.session === "long"
  && game.length === "massive"
  && game.commitment === "high"
  && game.reviewBurden === "high"
), "hunting/build loop must expose its real time and systems friction");
check("Destiny 2", (game) => (
  game.atoms.includes("service")
  && !game.atoms.includes("open-world")
  && game.length === "massive"
  && game.commitment === "high"
  && game.reviewBurden === "high"
), "live-service commitment must not look like a short low-friction open world");
check("Knockout City", (game) => (
  game.atoms.includes("competitive")
  && game.atoms.includes("service")
  && !game.atoms.includes("story")
), "competitive service game must not inherit a fabricated story signal");
check("Assassin’s Creed Brotherhood", (game) => game.atoms.includes("stealth") && !game.atoms.includes("multiplayer"), "core campaign atoms should outweigh a legacy side mode");
check("Rise of the Tomb Raider", (game) => (
  game.atoms.includes("exploration")
  && game.atoms.includes("cinematic")
  && !game.atoms.includes("open-world")
), "hub exploration must not be represented as a full open world");
check("DOOM Eternal", (game) => (
  game.atoms.includes("shooter")
  && game.atoms.includes("adrenaline")
  && !game.atoms.includes("co-op")
), "arena shooter must expose adrenaline/shooter intensity without a fabricated co-op signal");

if (violations.length) {
  throw new Error(`Atom quality audit failed:\n- ${violations.join("\n- ")}`);
}

console.log(`✅ Atom quality audit: ${games.length} records scanned, 7 high-impact recommendation records gated, service-vibe consistency clean`);
