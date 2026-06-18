import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/app-ai.js", import.meta.url), "utf8");
const state = {
  atomWeights: { story: 8, choice: 5, grind: -4 },
  liked: new Set(["Disco Elysium"]),
  importedRatings: [{ title: "Control", rating: 9 }],
  aiExplanations: {},
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

console.log("✅ AI narrative cache isolates locale and invalidates changed context");
