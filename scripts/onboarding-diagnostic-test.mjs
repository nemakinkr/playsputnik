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
const onboardingSource = await readFile(new URL("src/app-onboarding.js", ROOT), "utf8");
const profileGames = extractConstArray(appSource, "profileGames");
const diagnosticOnboardingAtoms = extractConstArray(appSource, "DIAGNOSTIC_ONBOARDING_ATOMS");

const context = {
  window: {
    PlaySputnikConfig: {
      QUICK_TASTE_FIRST_TARGET: 5,
      QUICK_TASTE_USABLE_TARGET: 8,
      QUICK_TASTE_SHARP_TARGET: 10,
    },
    PlaySputnikSearch: {},
    PlaySputnikEnrichment: {},
  },
  t: (key, values = {}) => Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    key,
  ),
  labelAtom: (atom) => atom,
  labelAtoms: (atoms) => atoms.join(", "),
};
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
const firstThree = [
  answerNext(broadState, broadTools),
  answerNext(broadState, broadTools),
  answerNext(broadState, broadTools),
];
const firstThreeAxes = [...new Set(firstThree.flatMap((game) => broadTools.diagnosticAxisHits(game)))];
const firstQuestionIndex = profileGames.findIndex((game) => game.title === firstThree[0].title);

assert(firstQuestionIndex >= 0 && firstQuestionIndex < 12, `Expected the first onboarding question to stay broadly recognizable, got ${firstThree[0].title} at profile index ${firstQuestionIndex}`);
assert(firstThreeAxes.length >= 4, `Expected first three onboarding games to cover >=4 taste axes, got ${firstThreeAxes.join(", ")} from ${firstThree.map((game) => game.title).join(" / ")}`);
assert(
  firstThreeAxes.some((axis) => ["systems", "intensity", "social"].includes(axis)),
  `Expected early onboarding to include a format/intensity/social check, got ${firstThreeAxes.join(", ")}`,
);

const conflictState = { quickReactions: {}, liked: new Set() };
react(conflictState, "The Witcher 3: Wild Hunt", "loved");
react(conflictState, "Baldur's Gate 3", "not_for_me");
const conflictTools = createTools(conflictState);
const conflict = conflictTools.quickTasteConflictReport();
const followUp = conflictTools.nextDiagnosticGame();

assert(conflict.hasConflict && conflict.atoms.includes("choice"), `Expected choice conflict, got ${JSON.stringify(conflict)}`);
assert(followUp.atoms.includes("choice"), `Expected conflict follow-up to revisit choice, got ${followUp.title}`);

console.log(`✅ onboarding diagnostics cover ${firstThreeAxes.length} axes in the first 3 questions (${firstThree.map((game) => game.title).join(" / ")}) and resolve mixed choice signals with ${followUp.title}`);
