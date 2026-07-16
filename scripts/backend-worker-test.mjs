import assert from "node:assert/strict";
import { handleRequest } from "../backend/worker.mjs";
import { configureRuntimeSource } from "./configure-runtime.mjs";

const originalFetch = globalThis.fetch;
const originalCaches = globalThis.caches;
const cache = new Map();
globalThis.caches = {
  default: {
    async match(request) {
      return cache.get(request.url)?.clone() || null;
    },
    async put(request, response) {
      cache.set(request.url, response.clone());
    },
  },
};

let rawgCalls = 0;
let anthropicCalls = 0;
let workersAiCalls = 0;
globalThis.fetch = async (url, options = {}) => {
  const target = String(url);
  if (target.startsWith("https://api.rawg.io/")) {
    rawgCalls += 1;
    return Response.json({
      results: [{
        name: "Stray",
        slug: "stray",
        background_image: "https://example.test/stray.jpg",
        genres: [{ name: "Adventure" }, { name: "Indie" }],
        tags: [{ name: "Atmospheric" }, { name: "Story Rich" }, { name: "Puzzle" }],
        playtime: 6,
        rating: 4.3,
        ratings_count: 5000,
        parent_platforms: [{ platform: { name: "PlayStation" } }],
      }],
    });
  }
  if (target === "https://api.anthropic.com/v1/messages") {
    anthropicCalls += 1;
    assert.equal(options.headers["x-api-key"], "anthropic-secret");
    return Response.json({ content: [{ text: "Короткий персональный ответ." }] });
  }
  throw new Error(`Unexpected fetch: ${target}`);
};

const env = {
  RAWG_API_KEY: "rawg-secret",
  ANTHROPIC_API_KEY: "anthropic-secret",
  AI_PROVIDER: "workers_ai",
  WORKERS_AI_MODEL: "@cf/zai-org/glm-4.7-flash",
  AI: {
    async run(model, payload) {
      workersAiCalls += 1;
      assert.equal(payload.messages[0].role, "system");
      const responseSchema = payload.response_format?.json_schema;
      if (responseSchema?.properties?.entries) {
        assert.equal(model, "@cf/meta/llama-3.1-8b-instruct-fast");
        if (payload.messages.at(-1).content.includes("Прошел Control")) {
          return { response: {
            entries: [
              { title: "Control", rating: 2, rank: 1, status: "owned", sentiment: "disliked", confidence: "high" },
              { title: "Stray", rating: null, rank: 2, status: "completed", sentiment: "loved", confidence: "high" },
              { title: "Baldur's Gate 3", rating: 10, rank: 3, status: "owned", sentiment: "loved", confidence: "high" },
              { title: "Death Stranding", rating: null, rank: 4, status: "playing", sentiment: "loved", confidence: "high" },
            ],
            summary: "Смешанная заметка.",
            warnings: [],
          } };
        }
        if (payload.messages.at(-1).content.includes("Cyberpunk 2077")) {
          return { response: {
            entries: [
              { title: "Cyberpunk 2077", rating: 10, rank: 1, status: "completed", sentiment: "loved", confidence: "high" },
              { title: "Elden Ring", rating: 9, rank: 2, status: "owned", sentiment: "liked", confidence: "high" },
            ],
            summary: "Противоречивый отзыв.",
            warnings: [],
          } };
        }
        if (payload.messages.at(-1).content.includes("Цена 40 евро")) {
          return { response: {
            entries: [
              { title: "Control", rating: 5, rank: 1, status: "owned", sentiment: "loved", confidence: "high" },
              { title: "Alan Wake 2", rating: null, rank: 2, status: "unknown", sentiment: "unknown", confidence: "low" },
            ],
            summary: "Обсуждение двух игр.",
            warnings: ["Цена Alan Wake 2 не указана."],
          } };
        }
        assert.equal(payload.max_completion_tokens, 3000);
        return { response: {
          entries: [
            { title: "Red Dead Redemption 2", rating: 10, rank: 1, status: "completed", sentiment: "loved", confidence: "high" },
            { title: "red dead redemption 2", rating: 9, rank: 2, status: "unknown", sentiment: "liked", confidence: "medium" },
            { title: "Stray", rating: null, rank: null, status: "completed", sentiment: "liked", confidence: "high" },
            { title: "Unknown line", rating: null, rank: null, status: "unknown", sentiment: "unknown", confidence: "low" },
          ],
          summary: "Понятен сюжетный вкус.",
          warnings: ["Одна строка не содержит сигнала."],
        } };
      }
      if (responseSchema?.properties?.order) {
        assert.equal(model, "@cf/meta/llama-3.1-8b-instruct-fast");
        assert.equal(payload.max_completion_tokens, 1800);
        return { choices: [{ message: { content: JSON.stringify({
          order: ["Low Score", "Unknown Game", "Close Fit"],
          reasons: [
            { title: "Low Score", reason: "Mood fit" },
            { title: "Unknown Game", reason: "Must be discarded" },
          ],
          summary: "Session-aware order.",
        }) } }] };
      }
      assert.equal(model, "@cf/zai-org/glm-4.7-flash");
      assert.match(payload.messages[0].content, /русском языке/);
      assert.equal(payload.max_completion_tokens, 220);
      assert.deepEqual(payload.chat_template_kwargs, { enable_thinking: false });
      assert.equal(payload.max_tokens, undefined);
      if (workersAiCalls === 1) {
        return { choices: [{ message: { content: "An incorrect English first answer." } }] };
      }
      assert.match(payload.messages.at(-1).content, /кириллицей/);
      return { choices: [{ message: { content: "Русский ответ Workers AI." } }] };
    },
  },
  ALLOWED_ORIGINS: "https://nemakinkr.github.io",
};
const context = { waitUntil: (promise) => promise };
const originHeaders = { Origin: "https://nemakinkr.github.io" };

const health = await handleRequest(new Request("https://api.example/api/health", { headers: originHeaders }), env, context);
assert.equal(health.status, 200);
assert.deepEqual(await health.json(), {
  status: "ok",
  service: "playsputnik-api",
  version: "playsputnik-api-v7",
  searchConfigured: true,
  aiConfigured: true,
  aiProvider: "workers_ai",
  aiModel: "@cf/zai-org/glm-4.7-flash",
  aiStructuredModel: "@cf/meta/llama-3.1-8b-instruct-fast",
  aiNarrativeVersion: "ai-narrative-v2",
  aiTasteImportVersion: "ai-taste-import-v1",
  aiRerankVersion: "ai-rerank-v1",
});

const blocked = await handleRequest(new Request("https://api.example/api/search?q=Stray", {
  headers: { Origin: "https://evil.example" },
}), env, context);
assert.equal(blocked.status, 403);

const searchRequest = new Request("https://api.example/api/search?q=Stray", { headers: originHeaders });
const firstSearch = await handleRequest(searchRequest, env, context);
assert.equal(firstSearch.status, 200);
assert.equal(firstSearch.headers.get("X-PlaySputnik-Cache"), "MISS");
const firstPayload = await firstSearch.json();
assert.equal(firstPayload.results[0].title, "Stray");
assert.equal(firstPayload.results[0].provider, "rawg");
assert.equal(firstPayload.results[0].priceStatus, "missing");
assert.equal(firstPayload.resultShapeVersion, "search-result-v3");
assert.equal(firstPayload.results[0].session, "medium");
assert.equal(firstPayload.results[0].length, "short");
assert.equal(firstPayload.results[0].inferenceProfile.version, "rawg-inference-v1");
assert.equal(firstPayload.results[0].inferenceProfile.confidence, "medium");
assert(firstPayload.results[0].inferenceProfile.limitations.includes("price_requires_store_source"));
assert(!("price" in firstPayload.results[0]), "RAWG normalization must not invent a price");

const secondSearch = await handleRequest(searchRequest, env, context);
assert.equal(secondSearch.headers.get("X-PlaySputnik-Cache"), "HIT");
assert.equal(rawgCalls, 1, "search cache should avoid a second RAWG call");

const shortQuery = await handleRequest(new Request("https://api.example/api/search?q=x", { headers: originHeaders }), env, context);
assert.equal(shortQuery.status, 400);

const narrative = await handleRequest(new Request("https://api.example/api/narrative", {
  method: "POST",
  headers: { ...originHeaders, "Content-Type": "application/json" },
  body: JSON.stringify({ kind: "game_detail", locale: "ru", game: { title: "Stray", atoms: ["story"] } }),
}), env, context);
assert.equal(narrative.status, 200);
const narrativePayload = await narrative.json();
assert.equal(narrativePayload.locale, "ru");
assert.equal(narrativePayload.provider, "workers_ai");
assert.equal(narrativePayload.text, "Русский ответ Workers AI.");
assert.equal(workersAiCalls, 2, "Russian requests should retry one non-Cyrillic provider answer");
assert.equal(anthropicCalls, 0, "Workers AI should be the default when both providers exist");

const anthropicNarrative = await handleRequest(new Request("https://api.example/api/narrative", {
  method: "POST",
  headers: { ...originHeaders, "Content-Type": "application/json" },
  body: JSON.stringify({ kind: "game_detail", locale: "en", game: { title: "Stray", atoms: ["story"] } }),
}), { ...env, AI: undefined, AI_PROVIDER: "anthropic" }, context);
assert.equal(anthropicNarrative.status, 200);
assert.equal((await anthropicNarrative.json()).provider, "anthropic");
assert.equal(anthropicCalls, 1, "Anthropic should remain a provider-neutral fallback");

const tasteImport = await handleRequest(new Request("https://api.example/api/taste-import", {
  method: "POST",
  headers: { ...originHeaders, "Content-Type": "application/json" },
  body: JSON.stringify({ locale: "ru", text: "1. Red Dead Redemption 2 — любимая\nStray — прошел, понравилась" }),
}), env, context);
assert.equal(tasteImport.status, 200);
const tastePayload = await tasteImport.json();
assert.equal(tastePayload.schemaVersion, "ai-taste-import-v1");
assert.equal(tastePayload.entries.length, 2, "AI import should dedupe titles and remove entries without evidence");
assert.equal(tastePayload.entries[0].title, "Red Dead Redemption 2");
assert.equal(tastePayload.entries[1].status, "completed");
assert.equal(tastePayload.provider, "workers_ai");

const callsBeforeOrderedImport = workersAiCalls;
const orderedImport = await handleRequest(new Request("https://api.example/api/taste-import", {
  method: "POST",
  headers: { ...originHeaders, "Content-Type": "application/json" },
  body: JSON.stringify({
    locale: "ru",
    context: { orderedRanking: true },
    text: "4️⃣5️⃣Red Dead Redemption 2\n5️⃣Control\n5️⃣007 First Light",
  }),
}), { ...env, AI: undefined, ANTHROPIC_API_KEY: "", AI_PROVIDER: "" }, context);
const orderedPayload = await orderedImport.json();
assert.equal(orderedImport.status, 200);
assert.equal(orderedPayload.provider, "hybrid_parser");
assert.deepEqual(orderedPayload.entries.map((entry) => [entry.title, entry.rank, entry.rating]), [
  ["Red Dead Redemption 2", 1, null],
  ["Control", 2, null],
  ["007 First Light", 3, null],
]);
assert.equal(workersAiCalls, callsBeforeOrderedImport, "obvious ordered lists should not spend an AI request");

const ambiguousImport = await handleRequest(new Request("https://api.example/api/taste-import", {
  method: "POST",
  headers: { ...originHeaders, "Content-Type": "application/json" },
  body: JSON.stringify({
    locale: "ru",
    text: "В Control я играл и люблю ее, а Alan Wake 2 только советовали друзья. Цена 40 евро относилась к ужину.",
  }),
}), env, context);
const ambiguousPayload = await ambiguousImport.json();
assert.equal(ambiguousImport.status, 200);
assert.deepEqual(ambiguousPayload.entries, [{
  title: "Control",
  rating: null,
  rank: null,
  status: "unknown",
  sentiment: "loved",
  confidence: "low",
}], "unsupported ratings, ranks, and ownership must be stripped from AI output");
assert.deepEqual(ambiguousPayload.warnings, [], "missing-price warnings should not enter the review draft");

const mixedImport = await handleRequest(new Request("https://api.example/api/taste-import", {
  method: "POST",
  headers: { ...originHeaders, "Content-Type": "application/json" },
  body: JSON.stringify({
    locale: "ru",
    text: "Прошел Control, очень понравилось, 9/10. Сейчас играю в Stray. Baldur's Gate 3 лежит в вишлисте, но пока не покупал. Death Stranding бросил, не мое.",
  }),
}), env, context);
assert.equal(mixedImport.status, 200);
assert.deepEqual((await mixedImport.json()).entries.map(({ title, rating, rank, status, sentiment }) => ({ title, rating, rank, status, sentiment })), [
  { title: "Control", rating: 9, rank: null, status: "completed", sentiment: "liked" },
  { title: "Stray", rating: null, rank: null, status: "playing", sentiment: "unknown" },
  { title: "Baldur's Gate 3", rating: null, rank: null, status: "wishlist", sentiment: "unknown" },
  { title: "Death Stranding", rating: null, rank: null, status: "dropped", sentiment: "disliked" },
], "source evidence must override invented structured fields without losing explicit facts");

const contradictoryImport = await handleRequest(new Request("https://api.example/api/taste-import", {
  method: "POST",
  headers: { ...originHeaders, "Content-Type": "application/json" },
  body: JSON.stringify({
    locale: "ru",
    text: "В Cyberpunk 2077 мне понравилась история, но не понравился геймплей; оценку не ставлю. Elden Ring не играл.",
  }),
}), env, context);
assert.equal(contradictoryImport.status, 200);
assert.deepEqual((await contradictoryImport.json()).entries.map(({ title, rating, rank, status, sentiment }) => ({ title, rating, rank, status, sentiment })), [
  { title: "Cyberpunk 2077", rating: null, rank: null, status: "unknown", sentiment: "mixed" },
], "contradictory sentiment must survive while unplayed titles and invented facts are discarded");

const rerank = await handleRequest(new Request("https://api.example/api/rerank", {
  method: "POST",
  headers: { ...originHeaders, "Content-Type": "application/json" },
  body: JSON.stringify({
    locale: "en",
    taste: { topAtoms: ["story"] },
    context: { session: "short" },
    candidates: [
      { title: "Baseline", score: 100, atoms: ["story"] },
      { title: "Close Fit", score: 96, atoms: ["story", "short"] },
      { title: "Low Score", score: 70, atoms: ["short"] },
    ],
  }),
}), env, context);
assert.equal(rerank.status, 200);
const rerankPayload = await rerank.json();
assert.deepEqual(rerankPayload.order, ["Baseline", "Close Fit", "Low Score"]);
assert.equal(rerankPayload.guardrails.qualityGuardApplied, true, "AI must not promote a candidate outside the score floor");
assert.equal(rerankPayload.reasons.length, 1, "Unknown candidate reasons must be discarded");
assert.equal(rerankPayload.provider, "workers_ai");

const noPsn = await handleRequest(new Request("https://api.example/api/psn", {
  method: "POST",
  headers: originHeaders,
}), env, context);
assert.equal(noPsn.status, 404, "public backend must not accept PSN tokens");

const runtimeTemplate = `// apiOrigin: "https://example.invalid"\nwindow.PlaySputnikRuntime = {\n  apiOrigin: "",\n};\n`;
const configuredRuntime = configureRuntimeSource(runtimeTemplate, "https://playsputnik-api.example.workers.dev/");
assert.match(configuredRuntime.next, /apiOrigin: "https:\/\/playsputnik-api\.example\.workers\.dev"/);
assert.match(configuredRuntime.next, /\/\/ apiOrigin: "https:\/\/example\.invalid"/, "runtime config should not rewrite comments");
assert.throws(() => configureRuntimeSource(runtimeTemplate, "http://insecure.example"), /HTTPS origin/);

globalThis.fetch = originalFetch;
globalThis.caches = originalCaches;
console.log("✅ production backend contracts, CORS, cache, and secret-backed providers are valid");
