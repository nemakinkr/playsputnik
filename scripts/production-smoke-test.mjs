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

const [html, appSource, moduleManifestSource, foundationCss, themesCss, i18nSource, i18nRuSource, swSource, runtimeConfig, dataHealth, searchSources, editorialRu] = await Promise.all([
  fetchText("./"),
  fetchText("./app.js"),
  fetchText("./src/module-manifest.js"),
  fetchText("./styles/foundation.css"),
  fetchText("./styles/themes.css"),
  fetchText("./src/app-i18n.js"),
  fetchText("./src/i18n-ru.js"),
  fetchText("./sw.js"),
  fetchText("./runtime-config.js"),
  fetchJson("./data/data-health.json"),
  fetchJson("./data/search-sources.json"),
  fetchJson("./data/editorial-ru.json"),
]);

const sourceCount = Array.isArray(searchSources.sources) ? searchSources.sources.length : 0;
const gameCount = Number(dataHealth.gameCount || dataHealth.games || dataHealth.catalog?.games || 0);
const coverPercent = Number(dataHealth.coverPercent || dataHealth.coverCoverage?.coverage || dataHealth.coverage?.covers || 0);
const regionalPriceCoverage = Object.values(dataHealth.regionCoverage || {})
  .map((region) => Number(region.priceCoverage || 0))
  .filter(Boolean);
const pricePercent = Number(dataHealth.pricePercent || dataHealth.coverage?.prices || (regionalPriceCoverage.length ? Math.min(...regionalPriceCoverage) : 0));

assert(/PlaySputnik/.test(html), "Published HTML should contain PlaySputnik");
assert(/src\/module-manifest\.js/.test(html), "Published HTML should load the runtime module manifest");
assert(/src\/app-state-migrations\.js/.test(moduleManifestSource), "Published manifest should load state migrations");
assert(/src\/app-state\.js/.test(moduleManifestSource), "Published manifest should load the split app-state module");
assert(/src\/app-detail-view\.js/.test(moduleManifestSource), "Published manifest should load the detail view module");
assert(/app-boot-overlay/.test(foundationCss), "Published foundation CSS should contain the boot surface");
assert(/DARK THEME OVERRIDES/.test(themesCss), "Published theme CSS should contain dark-mode overrides");
assert(/data-app-view="discover"/.test(html), "Published HTML should expose Discover navigation");
assert(/id="game-search-input"/.test(html), "Published HTML should expose global game search");
assert(/id="game-detail"/.test(html), "Published HTML should expose game detail drawer");
assert(/serviceWorker\.register/.test(html), "Published HTML should register the service worker in production");
assert(/runtime-config\.js/.test(html), "Published HTML should load runtime deployment config");
assert(/apiOrigin/.test(runtimeConfig), "Published runtime config should expose apiOrigin");

assert(/function renderGameSearch/.test(appSource), "Published app.js should contain game search renderer");
assert(/data-search-memory-panel/.test(appSource), "Published app.js should contain search memory confirmation panel");
assert(/data-detail-primary-action/.test(appSource), "Published app.js should contain smart detail CTA");
assert(/function runDetailPrimaryAction/.test(appSource), "Published app.js should contain detail CTA action handler");
assert(/function atomLabel/.test(i18nSource) && /window\.labelAtoms/.test(i18nSource), "Published i18n runtime should expose taxonomy label helpers");
assert(/realistic-violence.*реалистичное насилие/.test(i18nRuSource), "Published Russian catalog should contain taxonomy labels");
assert(/CACHE_VERSION = "v\d+"/.test(swSource), "Published sw.js should expose a versioned cache");
assert(gameCount >= 400, `Expected published data-health to report at least 400 games, got ${gameCount || "unknown"}`);
assert(sourceCount >= 3, `Expected at least 3 search sources, got ${sourceCount}`);
assert(editorialRu.locale === "ru", "Published editorial overlay should declare the Russian locale");
assert(Object.keys(editorialRu.records || {}).length >= 20, "Published editorial overlay should contain the key-game starter set");
assert(editorialRu.records?.["Mafia: The Old Country"]?.summary, "Published editorial overlay should contain the Mafia anchor");
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
    "module-manifest.js",
    "foundation.css",
    "themes.css",
    "app-i18n.js",
    "i18n-ru.js",
    "sw.js",
    "runtime-config.js",
    "data-health",
    "search-sources",
    "editorial-ru",
  ],
}, null, 2));
