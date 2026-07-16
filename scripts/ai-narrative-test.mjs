import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/app-ai.js", import.meta.url), "utf8");
const state = {
  atomWeights: { story: 8, choice: 5, grind: -4 },
  liked: new Set(["Disco Elysium"]),
  importedRatings: [{ title: "Control", rating: 9 }],
  aiExplanations: {},
  aiTodayRerank: null,
};
let locale = "en";
const requests = [];
let healthCalls = 0;

const context = {
  window: {
    PlaySputnikConfig: {},
    __playsputnikAiOrigin: "http://127.0.0.1:4191",
  },
  location: { protocol: "http:" },
  AbortSignal,
  Date,
  JSON,
  Map,
  Set,
  Math,
  console,
  fetch: async (url, options = {}) => {
    if (String(url).endsWith("/api/health")) {
      healthCalls += 1;
      return { ok: true, json: async () => ({ aiConfigured: true }) };
    }
    const payload = JSON.parse(options.body);
    requests.push(payload);
    if (String(url).endsWith("/api/taste-import")) {
      return {
        ok: true,
        json: async () => ({
          schemaVersion: "ai-taste-import-v1",
          entries: [
            { title: "Control", rating: 9, status: "completed", sentiment: "loved", confidence: "high" },
            { title: "CONTROL", rating: 8, status: "unknown", sentiment: "liked", confidence: "medium" },
          ],
          summary: "Review before import",
          warnings: [],
        }),
      };
    }
    if (String(url).endsWith("/api/rerank")) {
      return {
        ok: true,
        json: async () => ({
          schemaVersion: "ai-rerank-v1",
          order: ["Low Score", "Close Fit", "Unknown Game", "Baseline"],
          reasons: [],
          summary: "Session-aware order",
        }),
      };
    }
    return {
      ok: true,
      json: async () => ({ text: payload.locale === "ru" ? "Русский ответ" : "English answer" }),
    };
  },
};
vm.runInNewContext(source, context, { filename: "src/app-ai.js" });

const tools = context.window.PlaySputnikAi.createAiTools({
  getState: () => state,
  getSourceGames: () => [{
    title: "Stray",
    atoms: ["story", "exploration"],
    session: "short",
    criticScore: 82,
    hltbHours: 5,
  }],
  getLocale: () => locale,
  gameSignals: () => ({}),
  combinedTasteWeight: () => 0,
  titleKey: (title) => String(title || "").toLowerCase(),
});

assert.deepEqual(await Promise.all([tools.narrativeAvailable(), tools.narrativeAvailable()]), [true, true]);
assert.equal(healthCalls, 1, "concurrent availability checks should share one health request");
const baseContext = { fallback: ["Try Stray."], risk: "short and focused" };
assert.equal(tools.cachedNarrative("companion", "Stray", baseContext), null);
assert.equal(await tools.fetchNarrative("companion", "Stray", baseContext), "English answer");
assert.equal(tools.cachedNarrative("companion", "Stray", baseContext), "English answer");
assert.equal(requests.length, 1, "same-locale cached narrative should avoid a second provider call");

locale = "ru";
assert.equal(tools.cachedNarrative("companion", "Stray", baseContext), null, "EN cache leaked into RU");
assert.equal(await tools.fetchNarrative("companion", "Stray", baseContext), "Русский ответ");
assert.equal(requests.length, 2);
assert.equal(requests[1].locale, "ru");

const changedContext = { ...baseContext, risk: "new taste evidence" };
assert.equal(tools.cachedNarrative("companion", "Stray", changedContext), null, "stale context cache was reused");
assert.equal(await tools.fetchNarrative("companion", "Stray", changedContext), "Русский ответ");
assert.equal(requests.length, 3);

assert.equal(Object.keys(state.aiExplanations).length, 2, "cache should be partitioned by kind, locale, and title");
assert(requests.every((request) => request.schemaVersion === "ai-narrative-v2"));
assert(requests.every((request) => request.game.title === "Stray"));

const memoryBeforeDraft = JSON.stringify({ importedRatings: state.importedRatings, userGames: state.userGames });
const draft = await tools.parseTasteImport("Control - 9/10");
assert.equal(draft.entries.length, 1, "AI import should deduplicate titles before review");
assert.equal(draft.entries[0].status, "completed");
assert.equal(
  JSON.stringify({ importedRatings: state.importedRatings, userGames: state.userGames }),
  memoryBeforeDraft,
  "creating an AI import draft must not mutate confirmed taste memory",
);

const rerankCandidates = [
  { title: "Baseline", score: 90, atoms: ["story"] },
  { title: "Close Fit", score: 84, atoms: ["choice"] },
  { title: "Low Score", score: 55, atoms: ["action"] },
];
const rerankContext = { mood: "story", session: "medium", sessionMinutes: 45, difficulty: "normal" };
await tools.fetchTodayRerank(rerankCandidates, rerankContext);
assert.equal(
  tools.applyTodayRerank(rerankCandidates, rerankContext).map((game) => game.title).join("|"),
  "Close Fit|Baseline|Low Score",
  "client quality guard must keep a weak candidate outside the flexible AI window",
);
assert.equal(tools.cachedTodayRerank(rerankCandidates, { ...rerankContext, sessionMinutes: 90 }), null, "Today rerank cache must invalidate when session context changes");

console.log("✅ AI narratives, review-only import, and guarded Today rerank are valid");
