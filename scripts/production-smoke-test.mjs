const DEFAULT_URL = "https://nemakinkr.github.io/playsputnik/";
const target = process.argv.find((arg) => arg.startsWith("http://") || arg.startsWith("https://")) || DEFAULT_URL;
const rootUrl = target.endsWith("/") ? target : `${target}/`;
const cacheBust = `production-smoke-${Date.now()}`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function fetchText(path) {
  const url = new URL(path, rootUrl);
  url.searchParams.set("v", cacheBust);
  const response = await fetch(url, { redirect: "follow" });
  assert(response.ok, `Expected ${url.href} to return 2xx, got ${response.status}`);
  return response.text();
}

async function fetchJson(path) {
  return JSON.parse(await fetchText(path));
}

const [html, appSource, swSource, dataHealth, searchSources] = await Promise.all([
  fetchText("./"),
  fetchText("./app.js"),
  fetchText("./sw.js"),
  fetchJson("./data/data-health.json"),
  fetchJson("./data/search-sources.json"),
]);

const sourceCount = Array.isArray(searchSources.sources) ? searchSources.sources.length : 0;
const gameCount = Number(dataHealth.gameCount || dataHealth.games || dataHealth.catalog?.games || 0);
const coverPercent = Number(dataHealth.coverPercent || dataHealth.coverCoverage?.coverage || dataHealth.coverage?.covers || 0);
const regionalPriceCoverage = Object.values(dataHealth.regionCoverage || {})
  .map((region) => Number(region.priceCoverage || 0))
  .filter(Boolean);
const pricePercent = Number(dataHealth.pricePercent || dataHealth.coverage?.prices || (regionalPriceCoverage.length ? Math.min(...regionalPriceCoverage) : 0));

assert(/PlaySputnik/.test(html), "Published HTML should contain PlaySputnik");
assert(/src\/app-state\.js/.test(html), "Published HTML should load split app-state module");
assert(/data-app-view="discover"/.test(html), "Published HTML should expose Discover navigation");
assert(/id="game-search-input"/.test(html), "Published HTML should expose global game search");
assert(/id="game-detail"/.test(html), "Published HTML should expose game detail drawer");
assert(/serviceWorker\.register/.test(html), "Published HTML should register the service worker in production");

assert(/function renderGameSearch/.test(appSource), "Published app.js should contain game search renderer");
assert(/data-search-memory-panel/.test(appSource), "Published app.js should contain search memory confirmation panel");
assert(/data-detail-primary-action/.test(appSource), "Published app.js should contain smart detail CTA");
assert(/function runDetailPrimaryAction/.test(appSource), "Published app.js should contain detail CTA action handler");
assert(/CACHE_VERSION = "v\d+"/.test(swSource), "Published sw.js should expose a versioned cache");
assert(gameCount >= 400, `Expected published data-health to report at least 400 games, got ${gameCount || "unknown"}`);
assert(sourceCount >= 3, `Expected at least 3 search sources, got ${sourceCount}`);
assert(coverPercent >= 90 || /100/.test(JSON.stringify(dataHealth.coverage || dataHealth)), "Published data should report strong cover coverage");
assert(pricePercent >= 90, `Published data should report strong price coverage, got ${pricePercent || "unknown"}`);

console.log(JSON.stringify({
  mode: "production-smoke",
  url: rootUrl,
  gameCount,
  sourceCount,
  coverPercent,
  pricePercent,
  checks: [
    "html",
    "app.js",
    "sw.js",
    "data-health",
    "search-sources",
  ],
}, null, 2));
