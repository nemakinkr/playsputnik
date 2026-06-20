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
  ALLOWED_ORIGINS: "https://nemakinkr.github.io",
};
const context = { waitUntil: (promise) => promise };
const originHeaders = { Origin: "https://nemakinkr.github.io" };

const health = await handleRequest(new Request("https://api.example/api/health", { headers: originHeaders }), env, context);
assert.equal(health.status, 200);
assert.deepEqual(await health.json(), {
  status: "ok",
  service: "playsputnik-api",
  version: "playsputnik-api-v1",
  searchConfigured: true,
  aiConfigured: true,
  aiNarrativeVersion: "ai-narrative-v2",
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
assert.equal((await narrative.json()).locale, "ru");
assert.equal(anthropicCalls, 1);

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
