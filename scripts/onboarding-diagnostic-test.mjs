import { readFile } from "node:fs/promises";
import vm from "node:vm";

const ROOT = new URL("../", import.meta.url);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extractConstArray(source, name) {
  const marker = `const ${name} = `;
  const start = source.indexOf(marker);
  assert(start >= 0, `Missing ${name}`);
  const arrayStart = start + marker.length;
  const arrayEnd = source.indexOf("];", arrayStart);
  assert(arrayEnd > arrayStart, `Could not parse ${name}`);
  return vm.runInNewContext(source.slice(arrayStart, arrayEnd + 1));
}

function titleKey(title) {
  return String(title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalizeTitle(title) {
  return String(title || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function topEntries(counts, limit = 4) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

const appSource = await readFile(new URL("app.js", ROOT), "utf8");
const scoreSource = await readFile(new URL("src/app-score.js", ROOT), "utf8");
const onboardingSource = await readFile(new URL("src/app-onboarding.js", ROOT), "utf8");
const profileGames = extractConstArray(appSource, "profileGames");
const diagnosticOnboardingAtoms = extractConstArray(appSource, "DIAGNOSTIC_ONBOARDING_ATOMS");

const context = {
  window: {
    PlaySputnikConfig: {
      QUICK_TASTE_FIRST_TARGET: 5,
      QUICK_TASTE_USABLE_TARGET: 10,
      QUICK_TASTE_SHARP_TARGET: 20,
    },
    PlaySputnikSearch: {},
    PlaySputnikEnrichment: {},
    PlaySputnikI18n: { t: (key) => key },
  },
  t: (key, values = {}) => Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    key,
  ),
  labelAtom: (atom) => atom,
  labelAtoms: (atoms) => atoms.join(", "),
};
vm.runInNewContext(scoreSource, context);
vm.runInNewContext(onboardingSource, context);

function createTools(state) {
  return context.window.PlaySputnikOnboarding.createOnboardingTools({
    getState: () => state,
    profileGames,
    diagnosticOnboardingAtoms,
    titleKey,
    normalizeTitle,
    topEntries,
  });
}

function react(state, title, reaction) {
  state.quickReactions[titleKey(title)] = { title, reaction };
  if (reaction === "loved") state.liked.add(title);
  else state.liked.delete(title);
}

function answerNext(state, tools, reaction = "loved") {
  const game = tools.nextDiagnosticGame();
  assert(game, "Expected a diagnostic onboarding game");
  react(state, game.title, reaction);
  return game;
}

const broadState = { quickReactions: {}, liked: new Set() };
const broadTools = createTools(broadState);
assert(broadTools.quickProfileMaturity(5, 5).stage === "hypothesis", "Five signals must remain a cautious hypothesis");
assert(broadTools.quickProfileMaturity(10, 10).stage === "usable", "Ten signals must unlock a working taste read");
assert(broadTools.quickProfileMaturity(20, 20).stage === "sharp", "Twenty signals must unlock the confident quick profile");
assert(broadTools.diagnosticInformationGain(profileGames[0]) > 0, "Every unanswered diagnostic game should have measurable information gain");
const informationTarget = profileGames.find((game) => game.title === "The Witcher 3: Wild Hunt");
const freshInformation = broadTools.diagnosticInformationGain(informationTarget);
react(broadState, "The Last of Us Part I", "loved");
react(broadState, "Red Dead Redemption 2", "loved");
const learnedInformation = broadTools.diagnosticInformationGain(informationTarget);
assert(
  learnedInformation < freshInformation,
  `repeated story evidence should reduce expected information gain (${freshInformation} -> ${learnedInformation})`,
);
delete broadState.quickReactions[titleKey("The Last of Us Part I")];
delete broadState.quickReactions[titleKey("Red Dead Redemption 2")];
([...broadState.liked]).forEach((title) => broadState.liked.delete(title));
const firstThree = [
  answerNext(broadState, broadTools),
  answerNext(broadState, broadTools),
  answerNext(broadState, broadTools),
];
const firstThreeAxes = [...new Set(firstThree.flatMap((game) => broadTools.diagnosticAxisHits(game)))];
const firstThreeIntensityPoles = new Set(firstThree.map((game) => broadTools.diagnosticIntensityPole(game)).filter(Boolean));
const firstQuestionIndex = profileGames.findIndex((game) => game.title === firstThree[0].title);

assert(firstQuestionIndex >= 0 && firstQuestionIndex < 12, `Expected the first onboarding question to stay broadly recognizable, got ${firstThree[0].title} at profile index ${firstQuestionIndex}`);
assert(firstThreeAxes.length >= 4, `Expected first three onboarding games to cover >=4 taste axes, got ${firstThreeAxes.join(", ")} from ${firstThree.map((game) => game.title).join(" / ")}`);
assert(
  firstThreeAxes.some((axis) => ["systems", "intensity", "social"].includes(axis)),
  `Expected early onboarding to include a format/intensity/social check, got ${firstThreeAxes.join(", ")}`,
);
assert(
  firstThreeIntensityPoles.has("calm") && firstThreeIntensityPoles.has("intense"),
  `Expected first three onboarding games to contrast calm and intense play, got ${[...firstThreeIntensityPoles].join(", ")}`,
);
const firstFive = [
  ...firstThree,
  answerNext(broadState, broadTools),
  answerNext(broadState, broadTools),
];
const firstFiveMotifs = new Set(firstFive.flatMap((game) => context.window.PlaySputnikScore.tasteMotifsForGame(game)));
assert(
  firstFiveMotifs.size >= 3,
  `Expected five onboarding questions to test at least 3 distinct taste motifs, got ${[...firstFiveMotifs].join(", ")}`,
);
const broadNext = broadTools.nextDiagnosticGame();
const unansweredScores = profileGames
  .filter((game) => !broadTools.quickReaction(game.title))
  .map((game) => broadTools.diagnosticQuestionScore(game));
assert(
  broadTools.diagnosticQuestionScore(broadNext) === Math.max(...unansweredScores),
  "next onboarding question should maximize the production information score",
);

const conflictState = { quickReactions: {}, liked: new Set() };
react(conflictState, "The Witcher 3: Wild Hunt", "loved");
react(conflictState, "Baldur's Gate 3", "not_for_me");
const conflictTools = createTools(conflictState);
const conflict = conflictTools.quickTasteConflictReport();
const followUp = conflictTools.nextDiagnosticGame();

assert(conflict.hasConflict && conflict.atoms.includes("choice"), `Expected choice conflict, got ${JSON.stringify(conflict)}`);
assert(followUp.atoms.includes("choice"), `Expected conflict follow-up to revisit choice, got ${followUp.title}`);

assert(
  conflictTools.diagnosticQuestionScore(followUp) > conflictTools.diagnosticQuestionScore(profileGames.find((game) => game.title === "EA Sports FC 26")),
  "an unresolved taste conflict should outweigh an unrelated question",
);

const calmOnlyState = { quickReactions: {}, liked: new Set() };
react(calmOnlyState, "Red Dead Redemption 2", "loved");
const calmOnlyTools = createTools(calmOnlyState);
const intensityCounterpart = calmOnlyTools.nextDiagnosticGame();
assert(calmOnlyTools.diagnosticIntensityPole(intensityCounterpart) === "intense", `Expected an intense counterpoint after one calm answer, got ${intensityCounterpart.title}`);
assert(
  calmOnlyTools.intensityContrastNeedScore(intensityCounterpart) > calmOnlyTools.intensityContrastNeedScore(profileGames.find((game) => game.title === "Stardew Valley")),
  "Opposite intensity pole should receive a larger diagnostic bonus",
);

console.log(`✅ onboarding diagnostics gate honest 5/10/20 confidence, contrasts calm/intense play in the first 3 questions (${firstThree.map((game) => game.title).join(" / ")}), tests ${firstFiveMotifs.size} motifs in five questions, covers ${firstThreeAxes.length} axes, and resolves mixed choice signals with ${followUp.title}`);
