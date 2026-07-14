import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const ROOT = new URL("../", import.meta.url);
const games = JSON.parse(await readFile(new URL("data/games.json", ROOT), "utf8"));
const source = await readFile(new URL("src/app-score.js", ROOT), "utf8");
const context = {
  window: { PlaySputnikI18n: { t: (key) => key } },
  Math,
  Set,
};
vm.runInNewContext(source, context, { filename: "src/app-score.js" });

const {
  gameDifficultyIntensityProfile,
  gameSignalsForGame,
} = context.window.PlaySputnikScore;
const acceptedSourceValues = new Set(["easy", "low", "normal", "medium", "hard", "high"]);
const acceptedBands = new Set(["low", "medium", "high"]);
const difficultyCounts = { low: 0, medium: 0, high: 0 };
const intensityCounts = { low: 0, medium: 0, high: 0 };
const confidenceCounts = { low: 0, medium: 0, high: 0 };

assert(games.length >= 450, `Expected the full managed catalog, got ${games.length} games`);
games.forEach((game) => {
  assert(acceptedSourceValues.has(game.difficulty), `${game.title} has unsupported difficulty: ${game.difficulty}`);
  const profile = gameDifficultyIntensityProfile(game);
  assert(acceptedBands.has(profile.difficulty), `${game.title} has invalid normalized difficulty: ${profile.difficulty}`);
  assert(acceptedBands.has(profile.intensity), `${game.title} has invalid derived intensity: ${profile.intensity}`);
  assert(["low", "medium", "high"].includes(profile.confidence), `${game.title} has invalid signal confidence`);
  const signals = gameSignalsForGame(game);
  assert(signals.includes(`difficulty:${profile.difficulty}`), `${game.title} is missing its structured difficulty signal`);
  assert(signals.includes(`intensity:${profile.intensity}`), `${game.title} is missing its structured intensity signal`);
  difficultyCounts[profile.difficulty] += 1;
  intensityCounts[profile.intensity] += 1;
  confidenceCounts[profile.confidence] += 1;
});

const byTitle = new Map(games.map((game) => [game.title, game]));
const profileFor = (title) => gameDifficultyIntensityProfile(byTitle.get(title));
assert.deepEqual(
  { difficulty: profileFor("DOOM Eternal").difficulty, intensity: profileFor("DOOM Eternal").intensity },
  { difficulty: "medium", intensity: "high" },
  "DOOM Eternal should stay approachable by setting while still teaching high intensity",
);
assert.deepEqual(
  { difficulty: profileFor("Unpacking").difficulty, intensity: profileFor("Unpacking").intensity },
  { difficulty: "low", intensity: "low" },
  "Unpacking should anchor low difficulty and low intensity",
);
assert.equal(profileFor("Elden Ring").intensity, "high", "Elden Ring should anchor high intensity");
Object.entries(difficultyCounts).forEach(([band, count]) => assert(count > 0, `Difficulty band ${band} is empty`));
Object.entries(intensityCounts).forEach(([band, count]) => assert(count > 0, `Intensity band ${band} is empty`));

console.log(
  `✅ Difficulty/intensity audit: ${games.length} games normalized; difficulty ${JSON.stringify(difficultyCounts)}, intensity ${JSON.stringify(intensityCounts)}, confidence ${JSON.stringify(confidenceCounts)}`,
);
