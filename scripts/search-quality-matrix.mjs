import { readFile } from "node:fs/promises";
import vm from "node:vm";

const ROOT = new URL("../", import.meta.url);
const JSON_OUTPUT = process.argv.includes("--json");

const [
  appSearchSource,
  titleAliases,
  searchSources,
  games,
  catalogBackbone,
  globalSearchFixtures,
] = await Promise.all([
  readFile(new URL("src/app-search.js", ROOT), "utf8"),
  readJson("data/title-aliases.json"),
  readJson("data/search-sources.json"),
  readJson("data/games.json"),
  readJson("data/catalog-backbone.json"),
  readJson("data/global-search-fixtures.json"),
]);

const sandbox = {
  window: {
    PlaySputnikI18n: {
      t: (key, params = {}) => Object.entries(params).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), key),
    },
  },
};
vm.runInNewContext(appSearchSource, sandbox, { filename: "src/app-search.js" });

const state = {
  gameSearchQuery: "",
  providerSearch: {
    query: "",
    status: "idle",
    provider: "",
    results: [],
  },
  activeRegion: "US",
};

const searchTools = sandbox.window.PlaySputnikSearch.createSearchTools({
  getTitleAliases: () => titleAliases,
  getSearchSources: () => searchSources.sources || [],
  getSeedGames: () => games,
  getCatalogBackboneRecords: () => catalogBackbone.records || [],
  getGlobalSearchFixtureRecords: () => globalSearchFixtures.records || [],
  getProviderSearch: () => state.providerSearch,
  getSearchQuery: () => state.gameSearchQuery,
  getActiveRegion: () => state.activeRegion,
  enrichManualTitle: () => ({
    atoms: ["unverified", "manual"],
    summary: "Manual title-only candidate.",
  }),
});

const CASES = [
  { id: "alias-gta-6", query: "GTA 6", expectedTop: "Grand Theft Auto VI", sourceId: "prototype_external_index", matchKind: "exact" },
  { id: "alias-gta-vi", query: "GTA VI", expectedTop: "Grand Theft Auto VI", sourceId: "prototype_external_index", matchKind: "exact" },
  { id: "alias-bg3", query: "BG3", expectedTop: "Baldur's Gate 3", sourceId: "seed_catalog", matchKind: "exact" },
  { id: "roman-bg3", query: "Baldurs Gate III", expectedTop: "Baldur's Gate 3", sourceId: "seed_catalog", matchKind: "exact" },
  { id: "diacritic-yotei", query: "Ghost of Yōtei", expectedTop: "Ghost of Yotei", sourceId: "catalog_backbone", matchKind: "exact" },
  { id: "plain-yotei", query: "Ghost of Yotei", expectedTop: "Ghost of Yotei", sourceId: "catalog_backbone", matchKind: "exact" },
  { id: "ru-tsushima", query: "Призрак Цусимы", expectedTop: "Ghost of Tsushima", sourceId: "seed_catalog", matchKind: "exact" },
  { id: "ru-last-of-us", query: "Одни из нас", expectedTop: "The Last of Us Part I", sourceId: "seed_catalog", matchKind: "exact" },
  { id: "ru-rdr2-short", query: "РДР 2", expectedTop: "Red Dead Redemption 2", sourceId: "seed_catalog", matchKind: "exact" },
  { id: "alias-rdr2", query: "RDR2", expectedTop: "Red Dead Redemption 2", sourceId: "seed_catalog", matchKind: "exact" },
  { id: "ru-outer-worlds", query: "Внешние миры", expectedTop: "The Outer Worlds", sourceId: "seed_catalog", matchKind: "exact" },
  { id: "ru-guardians", query: "Marvel’s Стражи галактики", expectedTop: "Marvel's Guardians of the Galaxy", sourceId: "catalog_backbone", matchKind: "exact" },
  { id: "ru-ratchet-rift", query: "Ratchet & Clank: Сквозь миры", expectedTop: "Ratchet & Clank: Rift Apart", sourceId: "seed_catalog", matchKind: "exact" },
  { id: "alias-la-noire", query: "L. A. Noire", expectedTop: "L.A. Noire", sourceId: "seed_catalog", matchKind: "exact" },
  { id: "alias-true-colors", query: "Life is Strange True Colors", expectedTop: "Life is Strange: True Colors", sourceId: "catalog_backbone", matchKind: "exact" },
  { id: "hellblade-short", query: "Hellblade II", expectedTop: "Senua's Saga: Hellblade II", sourceId: "manual_unverified", matchKind: "alias_manual" },
  { id: "bond-number", query: "007", expectedTop: "007 First Light", sourceId: "seed_catalog", matchKind: "exact" },
  { id: "bond-project", query: "Project 007", expectedTop: "007 First Light", sourceId: "seed_catalog", matchKind: "exact" },
  { id: "fixture-black-myth", query: "Black Myth", expectedTop: "Black Myth: Wukong", sourceId: "prototype_external_index", matchKind: "prefix" },
  { id: "alias-wukong", query: "Wukong", expectedTop: "Black Myth: Wukong", sourceId: "prototype_external_index", matchKind: "exact" },
  { id: "expedition-short", query: "Expedition 33", expectedTop: "Clair Obscur: Expedition 33", sourceId: "prototype_external_index", matchKind: "exact" },
  { id: "expedition-full", query: "Clair Obscur Expedition 33", expectedTop: "Clair Obscur: Expedition 33", sourceId: "prototype_external_index", matchKind: "exact" },
  { id: "kcd2", query: "KCD2", expectedTop: "Kingdom Come: Deliverance II", sourceId: "catalog_backbone", matchKind: "exact" },
  { id: "death-stranding-subtitle", query: "Death Stranding 2 On the Beach", expectedTop: "Death Stranding 2", sourceId: "seed_catalog", matchKind: "exact" },
  { id: "spider-man-2", query: "Spider Man 2", expectedTop: "Marvel's Spider-Man 2", sourceId: "seed_catalog", matchKind: "exact" },
  { id: "indiana-short", query: "Great Circle", expectedTop: "Indiana Jones and the Great Circle", sourceId: "catalog_backbone", matchKind: "exact" },
  { id: "typo-balders", query: "Balders Gate 3", expectedTop: "Baldur's Gate 3", sourceId: "seed_catalog", matchKind: "token" },
  { id: "typo-yoteii", query: "Ghost of Yoteii", expectedTop: "Ghost of Yotei", sourceId: "catalog_backbone", matchKind: "token" },
  { id: "manual-new-title", query: "Totally New Prototype Game", expectedTop: "Totally New Prototype Game", sourceId: "manual_unverified", matchKind: "manual" },
];

function readJson(path) {
  return readFile(new URL(path, ROOT), "utf8").then(JSON.parse);
}

function runCase(testCase) {
  state.gameSearchQuery = testCase.query;
  const results = searchTools.globalSearchResults();
  const top = results[0] || null;
  const rank = results.findIndex((result) => searchTools.titleMatches(result.title, testCase.expectedTop));
  const pass = Boolean(top)
    && searchTools.titleMatches(top.title, testCase.expectedTop)
    && (!testCase.sourceId || top.sourceId === testCase.sourceId)
    && (!testCase.matchKind || top.matchKind === testCase.matchKind);

  return {
    ...testCase,
    pass,
    rank: rank >= 0 ? rank + 1 : null,
    top: top ? {
      title: top.title,
      sourceId: top.sourceId,
      score: top.score,
      matchKind: top.matchKind,
      matchConfidence: top.matchConfidence,
    } : null,
    topFive: results.slice(0, 5).map((result) => ({
      title: result.title,
      sourceId: result.sourceId,
      score: result.score,
      matchKind: result.matchKind,
    })),
  };
}

const results = CASES.map(runCase);
const failures = results.filter((result) => !result.pass);

const report = {
  mode: "search-quality-matrix",
  cases: CASES.length,
  passed: results.length - failures.length,
  failed: failures.length,
  results,
};

if (JSON_OUTPUT) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(JSON.stringify({
    mode: report.mode,
    cases: report.cases,
    passed: report.passed,
    failed: report.failed,
    failures: failures.map((failure) => ({
      id: failure.id,
      query: failure.query,
      expectedTop: failure.expectedTop,
      top: failure.top,
      rank: failure.rank,
    })),
  }, null, 2));
}

if (failures.length) {
  throw new Error(`Search quality matrix failed: ${failures.map((item) => item.id).join(", ")}`);
}
