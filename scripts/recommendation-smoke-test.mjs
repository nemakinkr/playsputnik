import { readFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const games = JSON.parse(await readFile(new URL("test/fixtures/synthetic-games.json", ROOT), "utf8"));
const ratingsText = await readFile(new URL("test/fixtures/synthetic-ratings.txt", ROOT), "utf8");
const titleAliases = JSON.parse(await readFile(new URL("data/title-aliases.json", ROOT), "utf8"));

const state = {
  likedAtoms: ["cozy", "short", "story"],
  activeRegion: "US",
  mood: "cozy",
  session: "short",
  difficulty: "low",
  budget: 30,
  psPlus: true,
  userStates: {},
  atomWeights: {},
};

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

function titleMatches(a, b) {
  return Boolean(a && b && titleKey(a) === titleKey(b));
}

function gameSignals(game) {
  return [
    ...(game.atoms || []),
    game.tone,
    game.content,
    game.adultTimeFit,
    game.commitment,
  ].filter(Boolean);
}

function parseRatingLine(line) {
  const match = line.trim().match(/^(.*?)[\s,:-]+(\d+(?:\.\d+)?)\s*(?:\/\s*(5|10))?$/);
  if (!match) return null;
  const rawRating = Number(match[2]);
  const divisor = match[3] ? Number(match[3]) : rawRating <= 5 ? 5 : 10;
  return { title: match[1].trim(), rating: Math.max(0, Math.min(10, (rawRating / divisor) * 10)) };
}

function analyzeTasteImport() {
  const weights = {};
  ratingsText
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const parsed = parseRatingLine(line);
      const game = games.find((candidate) => normalizeTitle(candidate.title) === normalizeTitle(parsed?.title || ""));
      if (!parsed || !game) return;
      const polarity = parsed.rating >= 7 ? 1 : parsed.rating <= 5 ? -1 : 0;
      const strength = polarity > 0 ? parsed.rating - 6 : polarity < 0 ? 6 - parsed.rating : 0;
      gameSignals(game).forEach((signal) => {
        weights[signal] = (weights[signal] || 0) + polarity * strength;
      });
    });
  state.atomWeights = weights;
}

function effectiveGameState(game) {
  return state.userStates[normalizeTitle(game.title)] || "";
}

function isAlreadyAvailable(game) {
  return ["owned", "subscription", "playing"].includes(effectiveGameState(game));
}

function importedTasteScore(game) {
  const raw = gameSignals(game).reduce((sum, signal) => sum + (state.atomWeights[signal] || 0), 0);
  return Math.max(-30, Math.min(45, Math.round(raw * 3)));
}

function scoreGame(game) {
  const atomScore = game.atoms.reduce((sum, atom) => sum + (state.likedAtoms.includes(atom) ? 15 : 0), 0);
  const importedScore = importedTasteScore(game);
  const moodScore = game.atoms.includes(state.mood) ? 18 : 0;
  const sessionScore = game.session === state.session ? 14 : 0;
  const difficultyScore = game.difficulty === state.difficulty ? 12 : 0;
  const adultTimeScore = state.session === "short" && game.adultTimeFit === "weeknight" ? 12 : 0;
  const reviewBurdenScore = game.reviewBurden === "low" ? 8 : game.reviewBurden === "medium" ? 3 : -5;
  const commitmentScore = state.session === "short" && game.commitment === "low" ? 8 : game.commitment === "high" ? -8 : 0;
  const plusScore = state.psPlus && game.psPlus.includes(state.activeRegion) ? 16 : 0;
  const buyScore = game.prices[state.activeRegion] <= state.budget ? 8 : -8;
  const discountScore = Math.round((game.discount[state.activeRegion] || 0) / 8);
  const accessScore = isAlreadyAvailable(game) ? 14 : 0;
  return atomScore + importedScore + moodScore + sessionScore + difficultyScore + adultTimeScore + reviewBurdenScore + commitmentScore + plusScore + buyScore + discountScore + accessScore;
}

function rankedGames() {
  return games
    .filter((game) => !["hidden", "completed"].includes(effectiveGameState(game)))
    .map((game) => ({ ...game, score: scoreGame(game) }))
    .sort((a, b) => b.score - a.score);
}

function buyCluster() {
  return rankedGames()
    .filter((game) => game.prices[state.activeRegion] <= state.budget)
    .filter((game) => !isAlreadyAvailable(game))
    .sort((a, b) => b.discount[state.activeRegion] - a.discount[state.activeRegion]);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

analyzeTasteImport();
assert(
  normalizeTitle("Ghost of Y\u014dtei") === normalizeTitle("Ghost of Yotei"),
  "Title normalization should remove diacritics",
);
assert(
  normalizeTitle("Baldur\u2019s Gate 3") === normalizeTitle("Baldur's Gate 3"),
  "Title normalization should handle curly apostrophes",
);
assert(
  normalizeTitle("\u041e\u0434\u043d\u0438 \u0438\u0437 \u043d\u0430\u0441").length > 0,
  "Title normalization should preserve localized titles",
);
assert(
  titleMatches("The Last of Us Part I", "\u041e\u0434\u043d\u0438 \u0438\u0437 \u043d\u0430\u0441"),
  "Title aliases should match localized user notes",
);
assert(
  titleMatches("Ghost of Yotei", "Ghost of Y\u014dtei"),
  "Title aliases should match diacritic variants",
);
const firstTop = rankedGames()[0].title;
assert(firstTop === "Neon Orchard", `Expected Neon Orchard top pick, got ${firstTop}`);

state.userStates[normalizeTitle("Neon Orchard")] = "completed";
assert(rankedGames()[0].title !== "Neon Orchard", "Completed game should be excluded from ranked games");

state.userStates[normalizeTitle("Blue Witness")] = "owned";
assert(!buyCluster().some((game) => game.title === "Blue Witness"), "Owned game should be guarded out of buy cluster");

state.userStates[normalizeTitle("Iron Cathedral")] = "subscription";
assert(!buyCluster().some((game) => game.title === "Iron Cathedral"), "Subscription game should be guarded out of buy cluster");

console.log("Recommendation smoke test passed.");
