import { readFile, writeFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const dryRun = process.argv.includes("--dry-run");

const [games, taxonomy] = await Promise.all([
  readJson("data/games.json"),
  readJson("data/taxonomy.json"),
]);

const taxonomySets = Object.fromEntries(
  Object.entries(taxonomy.axes).map(([axis, values]) => [axis, new Set(values)]),
);

const refinements = {
  "Baldur's Gate 3": {
    atoms: ["choice", "turn-based", "systems", "rpg", "long"],
    vibe: "Dense choice-driven fantasy RPG",
    content: "stylized-violence",
    wishlist: false,
  },
  "Civilization VI": {
    vibe: "Long strategic empire builder",
    tone: "epic",
    reviewBurden: "high",
    wishlist: false,
  },
  "Cyberpunk 2077": {
    atoms: ["sci-fi", "choice", "open-world", "action", "story"],
    vibe: "Neon open-world RPG with heavy choices",
    tone: "dark",
    content: "realistic-violence",
    adultTimeFit: "weekend",
    wishlist: false,
  },
  "Elden Ring": {
    atoms: ["challenge", "exploration", "open-world", "soulslike", "mythic"],
    vibe: "Open-world mythic challenge",
    tone: "dark",
    wishlist: false,
  },
  "God of War": {
    vibe: "Father-son mythic action drama",
    reviewBurden: "low",
    wishlist: false,
  },
  "God of War Ragnarok": {
    vibe: "Mythic blockbuster action sequel",
    reviewBurden: "low",
    wishlist: false,
  },
  "It Takes Two": {
    vibe: "Co-op story platformer built for two",
    content: "family-safe",
    reviewBurden: "low",
    wishlist: false,
  },
  "Red Dead Redemption 2": {
    atoms: ["story", "open-world", "slow", "realistic", "crime"],
    vibe: "Slow-burn western life simulator",
    tone: "melancholic",
    wishlist: false,
  },
  "Stardew Valley": {
    vibe: "Cozy routine with endless gentle goals",
    reviewBurden: "medium",
    wishlist: false,
  },
  "The Last of Us Part I": {
    vibe: "Linear survival drama",
    tone: "melancholic",
    reviewBurden: "low",
    wishlist: false,
  },
  "The Witcher 3: Wild Hunt": {
    atoms: ["story", "choice", "open-world", "rpg", "slow"],
    vibe: "Quest-heavy dark fantasy RPG",
    tone: "dark",
    content: "realistic-violence",
    wishlist: false,
  },
  "007 First Light": {
    vibe: "Cinematic spy action on the radar",
    reviewBurden: "medium",
    wishlist: true,
  },
  "EA Sports FC 26": {
    vibe: "Annual football service loop",
    reviewBurden: "medium",
    wishlist: false,
  },
  "Ghost of Tsushima": {
    atoms: ["open-world", "cinematic", "action", "stealth", "story"],
    vibe: "Samurai open-world drama",
    content: "realistic-violence",
    reviewBurden: "low",
    wishlist: false,
  },
  "Mafia: The Old Country": {
    vibe: "Cinematic Sicilian crime story",
    tone: "dark",
    reviewBurden: "medium",
    wishlist: true,
  },
  "Marvel's Spider-Man 2": {
    atoms: ["action", "cinematic", "open-world", "playful", "story"],
    vibe: "Fast superhero open-world action",
    length: "medium",
    tone: "epic",
    reviewBurden: "low",
    wishlist: false,
  },
  "The Alters": {
    vibe: "Strange sci-fi survival dilemma",
    content: "low-violence",
    reviewBurden: "medium",
    wishlist: true,
  },
  "The Last of Us Part II Remastered": {
    atoms: ["story", "cinematic", "stealth", "tension", "linear"],
    vibe: "Bleak cinematic revenge drama",
    tone: "tense",
    reviewBurden: "low",
    wishlist: false,
  },
  "The Outer Worlds": {
    atoms: ["sci-fi", "choice", "story", "rpg", "funny"],
    vibe: "Satirical sci-fi choice RPG",
    tone: "funny",
    content: "stylized-violence",
    reviewBurden: "medium",
    wishlist: false,
  },
  "Doom (2016)": {
    vibe: "Pure high-speed arena shooter",
    length: "medium",
    content: "stylized-violence",
    reviewBurden: "low",
    wishlist: false,
  },
  "Grounded": {
    atoms: ["co-op", "survival", "systems", "exploration", "playful"],
    vibe: "Tiny backyard survival sandbox",
    tone: "funny",
    reviewBurden: "medium",
    wishlist: false,
  },
  "Marvel Rivals": {
    vibe: "Team hero shooter service game",
    tone: "funny",
    content: "stylized-violence",
    reviewBurden: "medium",
    wishlist: false,
  },
  "Death Stranding 2": {
    vibe: "Strange slow-burn sci-fi journey",
    content: "stylized-violence",
    reviewBurden: "high",
    wishlist: true,
  },
  "Resident Evil Village": {
    vibe: "Gothic action-horror campaign",
    content: "horror",
    reviewBurden: "low",
    wishlist: false,
  },
};

const missingTitles = [];
let changed = 0;
const nextGames = games.map((game) => {
  const refinement = refinements[game.title];
  if (!refinement) return game;
  const refined = { ...game, ...refinement };
  if (JSON.stringify(game) !== JSON.stringify(refined)) changed += 1;
  return refined;
});

Object.keys(refinements).forEach((title) => {
  if (!games.some((game) => game.title === title)) missingTitles.push(title);
});

const issues = validate(nextGames);
if (issues.length) {
  console.error(issues.join("\n"));
  process.exit(1);
}

if (!dryRun) {
  await writeFile(new URL("data/games.json", ROOT), `${JSON.stringify(nextGames, null, 2)}\n`);
}

console.log(`${dryRun ? "Would refine" : "Refined"} ${changed} seed catalog records.`);
if (missingTitles.length) console.log(`Missing refinement targets: ${missingTitles.join(", ")}`);

function readJson(path) {
  return readFile(new URL(path, ROOT), "utf8").then(JSON.parse);
}

function validate(records) {
  const issues = [];
  records.forEach((game) => {
    if (!game.title) issues.push("Game is missing title");
    if (!Array.isArray(game.atoms) || game.atoms.length < 3) issues.push(`${game.title}: needs at least three atoms`);
    (game.atoms || []).forEach((atom) => {
      if (!taxonomySets.atoms.has(atom)) issues.push(`${game.title}: unknown atom ${atom}`);
    });
    ["session", "difficulty", "commitment", "tone", "content", "reviewBurden", "adultTimeFit"].forEach((axis) => {
      if (game[axis] && taxonomySets[axis] && !taxonomySets[axis].has(game[axis])) {
        issues.push(`${game.title}: unknown ${axis} ${game[axis]}`);
      }
    });
    if (!game.vibe || /upcoming wishlist radar|large-world roleplay|prestige narrative action/i.test(game.vibe)) {
      issues.push(`${game.title}: vibe is still too generic`);
    }
  });
  return issues;
}
