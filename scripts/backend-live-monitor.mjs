const origin = String(
  process.env.PLAYSPUTNIK_API_ORIGIN
    || process.argv.find((arg) => arg.startsWith("https://"))
    || "https://playsputnik-api.playsputnik.workers.dev",
).replace(/\/+$/, "");
const appOrigin = "https://nemakinkr.github.io";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, options = {}) {
  const { timeoutMs = 10000, ...fetchOptions } = options;
  const response = await fetch(`${origin}${path}`, {
    ...fetchOptions,
    headers: {
      Origin: appOrigin,
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${path} returned non-JSON (${response.status})`);
  }
  return { response, data };
}

let health;
for (let attempt = 0; attempt < 30; attempt += 1) {
  health = await request("/api/health");
  if (health.data.version === "playsputnik-api-v5") break;
  await new Promise((resolve) => setTimeout(resolve, 2000));
}
assert(health.response.ok, `health returned ${health.response.status}`);
assert(health.data.status === "ok", `health status is ${health.data.status || "missing"}`);
assert(health.data.service === "playsputnik-api", `unexpected service ${health.data.service || "missing"}`);
assert(health.data.version === "playsputnik-api-v5", `deployed Worker version is ${health.data.version || "missing"}`);
assert(health.data.searchConfigured === true, "RAWG search secret is not configured");
assert(health.data.aiConfigured === true, "Workers AI binding is not configured");
assert(health.data.aiProvider === "workers_ai", `unexpected AI provider ${health.data.aiProvider || "missing"}`);
assert(Boolean(health.data.aiModel), "Workers AI model is missing");
assert(Boolean(health.data.aiStructuredModel), "Workers AI structured-output model is missing");
assert(health.data.aiTasteImportVersion === "ai-taste-import-v1", "deployed Worker has no structured taste-import contract");
assert(health.data.aiRerankVersion === "ai-rerank-v1", "deployed Worker has no guarded rerank contract");
assert(
  health.response.headers.get("access-control-allow-origin") === appOrigin,
  "health CORS origin does not match GitHub Pages",
);

const narrative = await request("/api/narrative", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    kind: "game_description",
    locale: "ru",
    game: { title: "Stray", atoms: ["story", "exploration"], length: "short" },
  }),
});
assert(narrative.response.ok, `AI narrative returned ${narrative.response.status}`);
assert(narrative.data.provider === "workers_ai", `AI narrative used ${narrative.data.provider || "no provider"}`);
assert(narrative.data.locale === "ru", `AI narrative locale is ${narrative.data.locale || "missing"}`);
const narrativeText = String(narrative.data.text || "").trim();
assert(narrativeText.length >= 20, "AI narrative returned no usable text");
const aiRussian = /[А-Яа-яЁё]/.test(narrativeText);
assert(aiRussian, "AI narrative locale contract returned no Russian text");

const tasteImport = await request("/api/taste-import", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    schemaVersion: "ai-taste-import-v1",
    locale: "en",
    text: "1. Stray - played and loved\n2. Control - wishlist",
  }),
  timeoutMs: 25000,
});
assert(tasteImport.response.ok, `AI taste import returned ${tasteImport.response.status}`);
assert(tasteImport.data.schemaVersion === "ai-taste-import-v1", "AI taste import schema is missing");
assert(Array.isArray(tasteImport.data.entries) && tasteImport.data.entries.length >= 2, "AI taste import returned no reviewable games");
assert(tasteImport.data.entries.every((entry) => entry.title && entry.confidence), "AI taste import returned an invalid row");

const rerankCandidates = [
  { title: "Control", score: 90, atoms: ["story", "action"], session: "medium" },
  { title: "Stray", score: 86, atoms: ["story", "exploration"], session: "short" },
  { title: "Weak Candidate", score: 50, atoms: ["service"], session: "long" },
];
const rerank = await request("/api/rerank", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    schemaVersion: "ai-rerank-v1",
    locale: "en",
    taste: { topAtoms: ["story", "exploration"] },
    context: { mood: "story", sessionMinutes: 45 },
    candidates: rerankCandidates,
  }),
  timeoutMs: 25000,
});
assert(rerank.response.ok, `AI Today rerank returned ${rerank.response.status}`);
assert(rerank.data.schemaVersion === "ai-rerank-v1", "AI Today rerank schema is missing");
assert(Array.isArray(rerank.data.order) && rerank.data.order.length === rerankCandidates.length, "AI Today rerank lost candidates");
assert(rerank.data.order.indexOf("Weak Candidate") === 2, "AI Today rerank moved a weak candidate through the quality guard");

const query = `Stray`;
const first = await request(`/api/search?q=${encodeURIComponent(query)}`);
assert(first.response.ok, `search returned ${first.response.status}`);
assert(first.data.mode === "provider_live", `search mode is ${first.data.mode || "missing"}`);
assert(first.data.provider === "rawg", `search provider is ${first.data.provider || "missing"}`);
assert(first.data.sourceHealth === "live_results", `search health is ${first.data.sourceHealth || "missing"}`);
assert(Array.isArray(first.data.results) && first.data.results.length > 0, "search returned no results");
const exactResult = first.data.results.find((result) => result.title === "Stray");
assert(exactResult, "search results do not contain the exact Stray title");
assert(exactResult.coverUrl, "exact Stray result has no cover candidate");
assert(first.data.results.every((result) => result.priceStatus === "missing"), "provider search invented a price status");
assert(first.data.resultShapeVersion === "search-result-v3", `unexpected search shape ${first.data.resultShapeVersion || "missing"}`);
assert(exactResult.inferenceProfile?.version === "rawg-inference-v1", "exact Stray result has no structured inference passport");
assert(Array.isArray(exactResult.inferenceProfile?.fields?.atoms?.value), "exact Stray result has no inferred atom field");
assert(!("prices" in exactResult), "provider search invented store prices");
assert(!("psPlus" in exactResult), "provider search invented subscription status");

let cacheHeader = "";
for (let attempt = 0; attempt < 5 && cacheHeader !== "HIT"; attempt += 1) {
  if (attempt) await new Promise((resolve) => setTimeout(resolve, 250));
  const cached = await request(`/api/search?q=${encodeURIComponent(query)}`);
  assert(cached.response.ok, `cached search returned ${cached.response.status}`);
  cacheHeader = cached.response.headers.get("x-playsputnik-cache") || "";
}
assert(cacheHeader === "HIT", `expected edge cache HIT, got ${cacheHeader || "missing"}`);

const blocked = await fetch(`${origin}/api/search?q=${encodeURIComponent(query)}`, {
  headers: { Origin: "https://untrusted.example" },
  signal: AbortSignal.timeout(10000),
});
assert(blocked.status === 403, `untrusted origin returned ${blocked.status}, expected 403`);

console.log(JSON.stringify({
  mode: "backend-live-monitor",
  origin,
  health: health.data.status,
  version: health.data.version,
  searchProvider: first.data.provider,
  resultCount: first.data.results.length,
  exactTitle: exactResult.title,
  cache: cacheHeader,
  untrustedOrigin: blocked.status,
  aiConfigured: Boolean(health.data.aiConfigured),
  aiProvider: health.data.aiProvider || "none",
  aiModel: health.data.aiModel || "",
  aiStructuredModel: health.data.aiStructuredModel || "",
  aiNarrativeLength: narrativeText.length,
  aiRussian,
  aiTasteImportCount: tasteImport.data.entries.length,
  aiRerankGuarded: rerank.data.order.indexOf("Weak Candidate") === 2,
}, null, 2));
