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
  const response = await fetch(`${origin}${path}`, {
    ...options,
    headers: {
      Origin: appOrigin,
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(10000),
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

const health = await request("/api/health");
assert(health.response.ok, `health returned ${health.response.status}`);
assert(health.data.status === "ok", `health status is ${health.data.status || "missing"}`);
assert(health.data.service === "playsputnik-api", `unexpected service ${health.data.service || "missing"}`);
assert(health.data.searchConfigured === true, "RAWG search secret is not configured");
assert(health.data.aiConfigured === true, "Workers AI binding is not configured");
assert(health.data.aiProvider === "workers_ai", `unexpected AI provider ${health.data.aiProvider || "missing"}`);
assert(Boolean(health.data.aiModel), "Workers AI model is missing");
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
  aiNarrativeLength: narrativeText.length,
  aiRussian,
}, null, 2));
