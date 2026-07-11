import { readFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);

const [
  appStorageSource,
  appConfigSource,
  appStateMigrationsSource,
  appStateSource,
  appSearchSource,
  appEnrichmentSource,
  appScoreSource,
  appRadarSource,
  appRecommendSource,
  appRankingSource,
  appAnswerSource,
  appDecisionsSource,
  appLibrarySource,
  appVisualSource,
  appProviderImportSource,
  appSearchMemorySource,
  appWishlistSource,
  appDetailSource,
  appDetailViewSource,
  appOnboardingSource,
  appEntrySource,
  appCoverSource,
  appDevSource,
  appSessionSource,
  appHltbSource,
  appAiSource,
  appCardsSource,
  appDataPanelSource,
  appImportSource,
  appExportSource,
  moduleManifestSource,
  appSource,
  html,
  cssCompatSource,
  foundationCss,
  componentsCss,
  polishCss,
  themesCss,
  brandCss,
  swSource,
  catalog,
  priceSnapshots,
  priceHistory,
  subscriptionAvailability,
  coverSnapshots,
  refreshPolicy,
  monthlyDrop,
  titleAliases,
  catalogBackbone,
  searchSources,
  catalogSources,
  globalSearchFixtures,
  founderProviderCoverage,
  dataHealth,
  devHealth,
  catalogImporterSource,
  catalogPromoterSource,
  catalogRefinerSource,
  searchProviderSource,
  coverResolverSource,
  visualCatalogSmokeSource,
  designSmokeSource,
  cdpHarnessSource,
  appViewSmokeSource,
  libraryWishlistSmokeSource,
  gameDetailSmokeSource,
  searchMemorySmokeSource,
  productionSmokeSource,
  productionBrowserSmokeSource,
  backendLiveMonitorSource,
  coreJourneySmokeSource,
  demoProfileSmokeSource,
  searchQualityMatrixSource,
  localEnvSource,
  searchFixtureImporterSource,
  previewServerSource,
  deployPagesWorkflowSource,
  deployBackendWorkflowSource,
  monitorBackendWorkflowSource,
  catalogImportFixture,
  searchFixtureImportFixture,
  searchFixtureExpansionFixture,
  searchFixtureMainstreamDiagnosticFixture,
] = await Promise.all([
  readFile(new URL("src/app-storage.js", ROOT), "utf8"),
  readFile(new URL("src/app-config.js", ROOT), "utf8"),
  readFile(new URL("src/app-state-migrations.js", ROOT), "utf8"),
  readFile(new URL("src/app-state.js", ROOT), "utf8"),
  readFile(new URL("src/app-search.js", ROOT), "utf8"),
  readFile(new URL("src/app-enrichment.js", ROOT), "utf8"),
  readFile(new URL("src/app-score.js", ROOT), "utf8"),
  readFile(new URL("src/app-radar.js", ROOT), "utf8"),
  readFile(new URL("src/app-recommend.js", ROOT), "utf8"),
  readFile(new URL("src/app-ranking.js", ROOT), "utf8"),
  readFile(new URL("src/app-answer.js", ROOT), "utf8"),
  readFile(new URL("src/app-decisions.js", ROOT), "utf8"),
  readFile(new URL("src/app-library.js", ROOT), "utf8"),
  readFile(new URL("src/app-visual.js", ROOT), "utf8"),
  readFile(new URL("src/app-provider-import.js", ROOT), "utf8"),
  readFile(new URL("src/app-search-memory.js", ROOT), "utf8"),
  readFile(new URL("src/app-wishlist.js", ROOT), "utf8"),
  readFile(new URL("src/app-detail.js", ROOT), "utf8"),
  readFile(new URL("src/app-detail-view.js", ROOT), "utf8"),
  readFile(new URL("src/app-onboarding.js", ROOT), "utf8"),
  readFile(new URL("src/app-entry.js", ROOT), "utf8"),
  readFile(new URL("src/app-cover.js", ROOT), "utf8"),
  readFile(new URL("src/app-dev.js", ROOT), "utf8"),
  readFile(new URL("src/app-session.js", ROOT), "utf8"),
  readFile(new URL("src/app-hltb.js", ROOT), "utf8"),
  readFile(new URL("src/app-ai.js", ROOT), "utf8"),
  readFile(new URL("src/app-cards.js", ROOT), "utf8"),
  readFile(new URL("src/app-data-panel.js", ROOT), "utf8"),
  readFile(new URL("src/app-import.js", ROOT), "utf8"),
  readFile(new URL("src/app-export.js", ROOT), "utf8"),
  readFile(new URL("src/module-manifest.js", ROOT), "utf8"),
  readFile(new URL("app.js", ROOT), "utf8"),
  readFile(new URL("index.html", ROOT), "utf8"),
  readFile(new URL("styles.css", ROOT), "utf8"),
  readFile(new URL("styles/foundation.css", ROOT), "utf8"),
  readFile(new URL("styles/components.css", ROOT), "utf8"),
  readFile(new URL("styles/polish.css", ROOT), "utf8"),
  readFile(new URL("styles/themes.css", ROOT), "utf8"),
  readFile(new URL("styles/brand.css", ROOT), "utf8"),
  readFile(new URL("sw.js", ROOT), "utf8"),
  readJson("data/games.json"),
  readJson("data/price-snapshots.json"),
  readJson("data/price-history.json"),
  readJson("data/subscription-availability.json"),
  readJson("data/cover-snapshots.json"),
  readJson("data/refresh-policy.json"),
  readJson("data/monthly-drop.json"),
  readJson("data/title-aliases.json"),
  readJson("data/catalog-backbone.json"),
  readJson("data/search-sources.json"),
  readJson("data/catalog-sources.json"),
  readJson("data/global-search-fixtures.json"),
  readJson("reports/founder-ranking-provider-coverage.json"),
  readJson("data/data-health.json"),
  readJson("data/dev-health.json"),
  readFile(new URL("scripts/import-catalog-backbone.mjs", ROOT), "utf8"),
  readFile(new URL("scripts/promote-catalog-candidates.mjs", ROOT), "utf8"),
  readFile(new URL("scripts/refine-seed-catalog.mjs", ROOT), "utf8"),
  readFile(new URL("scripts/search-provider-server.mjs", ROOT), "utf8"),
  readFile(new URL("scripts/resolve-cover-candidates.mjs", ROOT), "utf8"),
  readFile(new URL("scripts/visual-catalog-smoke-test.mjs", ROOT), "utf8"),
  readFile(new URL("scripts/design-smoke-test.mjs", ROOT), "utf8"),
  readFile(new URL("scripts/lib/cdp.mjs", ROOT), "utf8"),
  readFile(new URL("scripts/app-view-smoke-test.mjs", ROOT), "utf8"),
  readFile(new URL("scripts/library-wishlist-smoke-test.mjs", ROOT), "utf8"),
  readFile(new URL("scripts/game-detail-smoke-test.mjs", ROOT), "utf8"),
  readFile(new URL("scripts/search-memory-smoke-test.mjs", ROOT), "utf8"),
  readFile(new URL("scripts/production-smoke-test.mjs", ROOT), "utf8"),
  readFile(new URL("scripts/production-browser-smoke-test.mjs", ROOT), "utf8"),
  readFile(new URL("scripts/backend-live-monitor.mjs", ROOT), "utf8"),
  readFile(new URL("scripts/core-journey-smoke-test.mjs", ROOT), "utf8"),
  readFile(new URL("scripts/demo-profile-smoke-test.mjs", ROOT), "utf8"),
  readFile(new URL("scripts/search-quality-matrix.mjs", ROOT), "utf8"),
  readFile(new URL("scripts/local-env.mjs", ROOT), "utf8"),
  readFile(new URL("scripts/import-global-search-fixtures.mjs", ROOT), "utf8"),
  readFile(new URL("scripts/preview-server.mjs", ROOT), "utf8"),
  readFile(new URL(".github/workflows/deploy-pages.yml", ROOT), "utf8"),
  readFile(new URL(".github/workflows/deploy-backend.yml", ROOT), "utf8"),
  readFile(new URL(".github/workflows/monitor-backend.yml", ROOT), "utf8"),
  readFile(new URL("test/fixtures/catalog-import-note.txt", ROOT), "utf8"),
  readFile(new URL("test/fixtures/search-fixture-import.txt", ROOT), "utf8"),
  readFile(new URL("test/fixtures/search-fixture-expansion-80.txt", ROOT), "utf8"),
  readFile(new URL("test/fixtures/search-fixture-mainstream-diagnostic.txt", ROOT), "utf8"),
]);

// User-facing copy moved into the i18n catalogs; checks below look here too.
const i18nEnSource = await readFile(new URL("src/i18n-en.js", ROOT), "utf8");
const css = `${foundationCss}\n${componentsCss}\n${polishCss}\n${themesCss}\n${brandCss}`;

const appRuntimeSource = `${appStorageSource}\n${appConfigSource}\n${appStateMigrationsSource}\n${appStateSource}\n${appSessionSource}\n${appHltbSource}\n${appAiSource}\n${appCardsSource}\n${appDataPanelSource}\n${appImportSource}\n${appExportSource}\n${appSearchSource}\n${appEnrichmentSource}\n${appOnboardingSource}\n${appEntrySource}\n${appScoreSource}\n${appRadarSource}\n${appRecommendSource}\n${appRankingSource}\n${appAnswerSource}\n${appDecisionsSource}\n${appLibrarySource}\n${appVisualSource}\n${appSearchMemorySource}\n${appWishlistSource}\n${appDetailSource}\n${appDetailViewSource}\n${appCoverSource}\n${appDevSource}\n${appSource}`;
const appLoadSource = `${html}\n${moduleManifestSource}`;

const USER_STATE_LABELS = {
  later: "Play later",
  saved: "Saved",
  want_to_finish: "Want to finish",
  paused: "Paused",
  owned: "Owned",
  owned_forever: "Owned forever",
  subscription: "Subscription",
  playing: "Playing",
  completed: "Completed",
  dropped: "Dropped",
  hidden: "Hidden",
};

const PLAYABLE_STATES = ["owned", "owned_forever", "subscription", "playing", "paused", "want_to_finish"];
const ACCESS_STATES = ["owned", "owned_forever", "subscription"];
const RANK_EXCLUDED_STATES = ["hidden", "completed", "dropped"];

const profileGames = [
  { title: "The Last of Us Part I", axis: "Cinematic story", atoms: ["story", "cinematic", "stealth", "linear"] },
  { title: "Red Dead Redemption 2", axis: "Slow open world", atoms: ["story", "open-world", "slow", "realistic"] },
  { title: "The Witcher 3: Wild Hunt", axis: "Quest-heavy RPG", atoms: ["story", "choice", "open-world", "rpg"] },
  { title: "Cyberpunk 2077", axis: "Sci-fi systems", atoms: ["sci-fi", "choice", "systems", "action"] },
  { title: "God of War Ragnarok", axis: "Prestige action", atoms: ["cinematic", "action", "mythic", "medium"] },
  { title: "Elden Ring", axis: "Hard exploration", atoms: ["challenge", "exploration", "open-world", "soulslike"] },
  { title: "Baldur's Gate 3", axis: "Long turn-based RPG", atoms: ["choice", "turn-based", "systems", "long"] },
  { title: "Disco Elysium", axis: "Reading and dialogue", atoms: ["story", "choice", "slow", "reading"] },
  { title: "Hades", axis: "Short-run roguelike", atoms: ["action", "roguelike", "short", "systems"] },
  { title: "Resident Evil 4", axis: "Action horror", atoms: ["action", "horror", "medium", "tension"] },
  { title: "Alan Wake 2", axis: "Slow story horror", atoms: ["story", "horror", "cinematic", "slow"] },
  { title: "Grand Theft Auto V", axis: "Crime sandbox", atoms: ["open-world", "sandbox", "crime", "action"] },
  { title: "Minecraft", axis: "Creative survival", atoms: ["sandbox", "creative", "survival", "cozy"] },
  { title: "Stardew Valley", axis: "Cozy routine", atoms: ["cozy", "routine", "management", "social"] },
  { title: "It Takes Two", axis: "Co-op platforming", atoms: ["co-op", "platforming", "playful", "medium"] },
  { title: "Hollow Knight", axis: "Indie challenge", atoms: ["challenge", "metroidvania", "exploration", "indie"] },
  { title: "Fortnite", axis: "Competitive service", atoms: ["multiplayer", "competitive", "service", "short"] },
  { title: "Call of Duty: Modern Warfare", axis: "Mainstream shooter", atoms: ["shooter", "multiplayer", "adrenaline", "cinematic"] },
  { title: "EA Sports FC 26", axis: "Sports loop", atoms: ["sports", "competitive", "short", "annual"] },
  { title: "Civilization VI", axis: "Long strategy", atoms: ["strategy", "systems", "turn-based", "long"] },
  { title: "Death Stranding", axis: "Strange slow journey", atoms: ["story", "slow", "strange", "long"] },
  { title: "Dark Souls III", axis: "Punishing mastery", atoms: ["challenge", "soulslike", "action", "medium"] },
  { title: "DOOM (2016)", axis: "Pure shooter flow", atoms: ["shooter", "action", "adrenaline", "short"] },
  { title: "The Sims 4", axis: "Life sim sandbox", atoms: ["creative", "management", "social", "routine"] },
  { title: "Tetris Effect: Connected", axis: "Puzzle flow", atoms: ["puzzle", "short", "flow", "arcade"] },
  { title: "League of Legends", axis: "MOBA competition", atoms: ["multiplayer", "strategy", "competitive", "service"] },
  { title: "Apex Legends", axis: "Team battle royale", atoms: ["multiplayer", "shooter", "competitive", "short"] },
  { title: "Animal Crossing: New Horizons", axis: "Cozy collection", atoms: ["cozy", "routine", "social", "long"] },
  { title: "Persona 5 Royal", axis: "Anime social RPG", atoms: ["story", "turn-based", "social", "long"] },
  { title: "Gran Turismo 7", axis: "Racing simulation", atoms: ["racing", "simulation", "competitive", "systems"] },
];

const REQUIRED_ONBOARDING_ATOMS = [
  "story",
  "choice",
  "challenge",
  "horror",
  "cozy",
  "survival",
  "co-op",
  "multiplayer",
  "shooter",
  "sports",
  "strategy",
  "short",
  "long",
  "puzzle",
  "racing",
  "simulation",
  "creative",
  "social",
  "service",
];

let games = mergeStoreData(catalog, priceSnapshots, subscriptionAvailability, coverSnapshots, priceHistory);
let state = defaultState();

function readJson(path) {
  return readFile(new URL(path, ROOT), "utf8").then(JSON.parse);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeTitle(title) {
  return String(title || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

function aliasEntryForTitle(title) {
  const normalized = normalizeTitle(title);
  return titleAliases.find((entry) => {
    const keys = [entry.title, ...(entry.aliases || [])].map(normalizeTitle);
    return keys.includes(normalized);
  });
}

function titleKey(title) {
  const entry = aliasEntryForTitle(title);
  return normalizeTitle(entry?.title || title);
}

function titleMatches(a, b) {
  return Boolean(a && b && titleKey(a) === titleKey(b));
}

function mergeStoreData(catalogItems, prices, subscriptions, covers = [], history = []) {
  const byTitle = new Map(
    catalogItems.map((game) => [
      titleKey(game.title),
      {
        ...game,
        prices: { ...(game.prices || {}) },
        discount: { ...(game.discount || {}) },
        priceMeta: {},
        priceHistory: {},
        psPlus: [...(game.psPlus || [])],
        subscriptionMeta: {},
        coverMeta: null,
      },
    ]),
  );

  prices.forEach((snapshot) => {
    const game = byTitle.get(titleKey(snapshot.title));
    if (!game) return;
    game.prices[snapshot.region] = snapshot.price;
    game.discount[snapshot.region] = snapshot.discount || 0;
    game.priceMeta[snapshot.region] = snapshot;
  });

  // price-history can be object {title: {region: [{price,discount,checkedAt}]}} or legacy array
  if (Array.isArray(history)) {
    history.forEach((record) => {
      const game = byTitle.get(titleKey(record.title));
      if (!game) return;
      if (!game.priceHistory[record.region]) game.priceHistory[record.region] = [];
      game.priceHistory[record.region].push(record);
    });
  } else {
    Object.entries(history).forEach(([title, regions]) => {
      const game = byTitle.get(titleKey(title));
      if (!game) return;
      Object.entries(regions).forEach(([region, entries]) => {
        game.priceHistory[region] = entries;
      });
    });
  }

  subscriptions.forEach((record) => {
    const game = byTitle.get(titleKey(record.title));
    if (!game) return;
    if (!game.psPlus.includes(record.region)) game.psPlus.push(record.region);
    game.subscriptionMeta[record.region] = record;
  });

  covers.forEach((record) => {
    const game = byTitle.get(titleKey(record.title));
    if (!game) return;
    game.coverMeta = record;
  });

  return catalogItems.map((game) => byTitle.get(titleKey(game.title)));
}

function defaultState() {
  return {
    liked: new Set(),
    hidden: new Set(),
    saved: new Set(),
    snoozed: new Set(),
    userStates: {},
    userGames: {},
    activeRegion: "US",
    activeCluster: "play",
    mood: "story",
    session: "short",
    difficulty: "normal",
    psPlus: true,
    budget: 35,
    atomWeights: {},
    quickReactions: {},
    notebook: {
      wishlist: [],
      access: [],
      prices: [],
      completed: [],
      ranked: [],
      upcoming: [],
    },
    feedbackLog: [],
    dropDecisions: {},
  };
}

function selectedAtoms() {
  const atoms = [];
  profileGames.forEach((game) => {
    if (state.liked.has(game.title)) atoms.push(...game.atoms);
  });
  return atoms;
}

function quickReaction(title) {
  return state.quickReactions[titleKey(title)]?.reaction || (state.liked.has(title) ? "loved" : "");
}

function quickTasteSignalCount() {
  return profileGames.filter((game) => {
    const reaction = quickReaction(game.title);
    return reaction && reaction !== "unplayed";
  }).length;
}

function gameSignals(game) {
  return [
    ...(game.atoms || []),
    game.tone,
    game.content,
    game.adultTimeFit,
    game.commitment,
  ].filter(Boolean);
}

function combinedTasteWeight(signal) {
  return state.atomWeights[signal] || 0;
}

function addTasteWeight(weights, signal, value) {
  if (!signal || !value) return;
  weights[signal] = (weights[signal] || 0) + value;
}

function quickTasteWeights() {
  const weights = {};
  profileGames.forEach((game) => {
    const reaction = quickReaction(game.title);
    const weight = reaction === "loved" ? 2.5 : reaction === "played" ? 1 : reaction === "not_for_me" ? -2.5 : 0;
    if (!weight) return;
    gameSignals(game).forEach((signal) => addTasteWeight(weights, signal, weight));
  });
  return weights;
}

function quickTasteConflictReport() {
  const stats = {};
  profileGames.forEach((game) => {
    const reaction = quickReaction(game.title);
    if (!reaction || reaction === "unplayed") return;
    const direction = reaction === "not_for_me" ? "negative" : "positive";
    gameSignals(game).forEach((signal) => {
      stats[signal] ||= { positive: 0, negative: 0 };
      stats[signal][direction] += 1;
    });
  });
  const atoms = Object.entries(stats)
    .filter(([, item]) => item.positive > 0 && item.negative > 0)
    .map(([atom]) => atom)
    .slice(0, 3);
  return { atoms };
}

function tasteEngineProfile() {
  const combinedWeights = {};
  Object.entries(quickTasteWeights()).forEach(([signal, value]) => addTasteWeight(combinedWeights, signal, value));
  Object.entries(state.atomWeights).forEach(([signal, value]) => addTasteWeight(combinedWeights, signal, value * 0.9));
  const conflicts = quickTasteConflictReport();
  const positiveWeights = {};
  const negativeWeights = {};
  Object.entries(combinedWeights).forEach(([signal, value]) => {
    if (value > 0) positiveWeights[signal] = value;
    if (value < 0) negativeWeights[signal] = Math.abs(value);
  });
  const evidenceCount = quickTasteSignalCount() + Object.keys(state.atomWeights).length + state.notebook.ranked.length + state.notebook.completed.length;
  return {
    positiveWeights,
    negativeWeights,
    mixedAtoms: conflicts.atoms,
    evidenceCount,
    confidence: evidenceCount >= 18 ? "High" : evidenceCount >= 8 ? "Medium" : evidenceCount >= 3 ? "Starter" : "Early",
  };
}

function tasteEngineGameSignals(game, profile = tasteEngineProfile()) {
  const signals = gameSignals(game);
  return {
    positive: [...new Set(signals.filter((signal) => profile.positiveWeights[signal] > 0))],
    negative: [...new Set(signals.filter((signal) => profile.negativeWeights[signal] > 0))],
    mixed: [...new Set(signals.filter((signal) => profile.mixedAtoms.includes(signal)))],
  };
}

function tasteEngineScore(game, profile = tasteEngineProfile()) {
  const signals = tasteEngineGameSignals(game, profile);
  const pullRaw = signals.positive.reduce((sum, signal) => sum + profile.positiveWeights[signal], 0);
  const cautionRaw = signals.negative.reduce((sum, signal) => sum + profile.negativeWeights[signal], 0);
  return {
    pull: Math.min(70, Math.round(pullRaw * 6)),
    caution: -Math.min(55, Math.round(cautionRaw * 7)),
    uncertainty: signals.mixed.length ? -Math.min(12, signals.mixed.length * 4) : profile.confidence === "Early" ? -4 : 0,
  };
}

function notebookWishlistWeight(title) {
  const entry = state.notebook.wishlist.find((item) => titleMatches(item.title, title));
  return entry?.weight || 0;
}

function notebookAccessKind(title) {
  return state.notebook.access.find((item) => titleMatches(item.title, title))?.kind || "";
}

function notebookCompletedSet() {
  return new Set(state.notebook.completed.map((item) => titleKey(item.title)));
}

function gameUserState(title) {
  return state.userStates[titleKey(title)]?.state || state.userStates[normalizeTitle(title)]?.state || "";
}

function derivedNotebookState(title) {
  if (notebookCompletedSet().has(titleKey(title))) return "completed";
  const accessKind = notebookAccessKind(title);
  if (accessKind === "subscription") return "subscription";
  if (accessKind === "permanent") return "owned_forever";
  if (accessKind === "available") return "owned";
  return "";
}

function effectiveGameState(game) {
  return gameUserState(game.title) || derivedNotebookState(game.title) || (state.saved.has(game.title) ? "saved" : "");
}

function externalUserGameRecords() {
  return Object.values(state.userGames || {})
    .filter((record) => record?.title && !games.some((game) => titleMatches(game.title, record.title)))
    .filter((record) => record.saved || record.access || record.completionStatus || typeof record.rating === "number");
}

function externalGameFromUserGame(record) {
  return {
    title: record.title,
    atoms: record.atoms?.length ? record.atoms : record.inferredAtoms || [],
    vibe: record.vibe || record.enrichmentSummary || "External wishlist candidate",
    session: record.session || "medium",
    difficulty: "normal",
    length: "medium",
    commitment: "medium",
    tone: "strange",
    content: "low-violence",
    reviewBurden: "high",
    adultTimeFit: "weekend",
    backlog: false,
    wishlist: Boolean(record.saved),
    externalCandidate: true,
    prices: {},
    discount: {},
    priceMeta: {},
    priceHistory: {},
    psPlus: [],
    subscriptionMeta: {},
    externalMeta: record,
  };
}

function externalMemoryGames() {
  return externalUserGameRecords().map(externalGameFromUserGame);
}

function recommendationPool() {
  const byTitle = new Map();
  [...games, ...externalMemoryGames()].forEach((game) => {
    if (!byTitle.has(titleKey(game.title))) byTitle.set(titleKey(game.title), game);
  });
  return [...byTitle.values()];
}

function isAlreadyAvailable(game) {
  return PLAYABLE_STATES.includes(effectiveGameState(game));
}

function blocksPurchase(game) {
  return isAlreadyAvailable(game) || effectiveGameState(game) === "dropped";
}

function setGameState(title, userState) {
  const key = titleKey(title);
  state.hidden.delete(title);
  state.saved.delete(title);
  state.snoozed.delete(title);
  if (!userState) {
    delete state.userStates[key];
    return;
  }
  if (userState === "hidden") state.hidden.add(title);
  if (userState === "saved") state.saved.add(title);
  if (["completed", "dropped"].includes(userState)) {
    state.hidden.delete(title);
    state.saved.delete(title);
  }
  if (userState === "hidden") state.saved.delete(title);
  state.userStates[key] = { title, state: userState, updatedAt: "qa" };
}

function snapshotAgeHours(checkedAt) {
  if (!checkedAt) return Number.POSITIVE_INFINITY;
  const parsed = new Date(checkedAt);
  if (Number.isNaN(parsed.getTime())) return Number.POSITIVE_INFINITY;
  return Math.max(0, (Date.now() - parsed.getTime()) / 36e5);
}

function layerPolicy(layer) {
  return refreshPolicy?.layers?.[layer] || {
    freshHours: layer === "subscriptions" ? 24 : 12,
    staleHours: layer === "subscriptions" ? 72 : 48,
  };
}

function signalStatus(record, layer) {
  if (!record) {
    return { state: "missing", label: "missing", canConfirm: false };
  }
  const policy = layerPolicy(layer);
  const age = snapshotAgeHours(record.checkedAt);
  const hasTrustedConfidence = ["medium", "high"].includes(record.confidence);
  if (record.freshnessState === "sample") {
    return { state: "sample", label: "sample", canConfirm: false };
  }
  if (record.freshnessState === "stale" || age > policy.staleHours) {
    return { state: "stale", label: "stale", canConfirm: false };
  }
  if (!hasTrustedConfidence) {
    return { state: "verify", label: "verify", canConfirm: false };
  }
  if (age > policy.freshHours) {
    return { state: "aging", label: "aging", canConfirm: false };
  }
  return { state: "fresh", label: "fresh", canConfirm: true };
}

function priceStatus(game, region) {
  return signalStatus(game.priceMeta?.[region], "prices");
}

function subscriptionStatus(game, region) {
  return signalStatus(game.subscriptionMeta?.[region], "subscriptions");
}

function priceCanGuideBuy(game, region) {
  const status = priceStatus(game, region);
  return status.canConfirm || status.state === "sample" || status.state === "verify";
}

function importedTasteScore(game) {
  const raw = gameSignals(game).reduce((sum, signal) => sum + combinedTasteWeight(signal), 0);
  return Math.max(-30, Math.min(45, Math.round(raw * 3)));
}

function notebookTasteScore(game) {
  const matchedRank = state.notebook.ranked.find((entry) => titleMatches(entry.title, game.title));
  if (!matchedRank) return 0;
  if (matchedRank.rank <= 20) return 18;
  if (matchedRank.rank <= 60) return 8;
  return 2;
}

function scoreGame(game) {
  const tasteScore = tasteEngineScore(game);
  const notebookTaste = notebookTasteScore(game);
  const wishlistScore = notebookWishlistWeight(game.title) * 12;
  const accessKind = notebookAccessKind(game.title);
  const effectiveState = effectiveGameState(game);
  const accessScore =
    effectiveState === "want_to_finish" ? 20
      : effectiveState === "playing" ? 16
        : effectiveState === "owned_forever" ? 14
          : effectiveState === "owned" ? 12
            : effectiveState === "subscription" ? 10
              : effectiveState === "paused" ? 6
                : accessKind === "permanent" ? 14
                  : accessKind === "subscription" ? 10
                    : 0;
  const moodScore = game.atoms.includes(state.mood) || game.vibe.toLowerCase().includes(state.mood) ? 18 : 0;
  const sessionScore = game.session === state.session ? 14 : 0;
  const difficultyScore = game.difficulty === state.difficulty ? 12 : 0;
  const plusStatus = subscriptionStatus(game, state.activeRegion);
  const plusScore = state.psPlus && game.psPlus.includes(state.activeRegion)
    ? plusStatus.canConfirm ? 16 : 6
    : 0;
  const price = game.prices[state.activeRegion];
  const priceSignal = priceStatus(game, state.activeRegion);
  const buyScore = price <= Number(state.budget) ? priceSignal.canConfirm ? 8 : 3 : -8;
  const discountScore = Math.round((game.discount[state.activeRegion] || 0) / (priceSignal.canConfirm ? 8 : 16));
  const backlogScore = game.backlog ? 7 : 0;
  const savedScore = state.saved.has(game.title) ? 4 : 0;
  const externalScore = game.externalCandidate ? effectiveState === "saved" || game.wishlist ? 12 : 4 : 0;
  const adultTimeScore =
    (state.session === "short" && game.adultTimeFit === "weeknight")
      ? 12
      : (state.session === "medium" && game.adultTimeFit === "weekend")
        ? 6
        : (state.session === "long" && game.adultTimeFit === "vacation")
          ? 8
          : 0;
  const reviewBurdenScore =
    game.reviewBurden === "low" ? 8 : game.reviewBurden === "medium" ? 3 : game.reviewBurden === "high" ? -5 : 0;
  const commitmentScore =
    state.session === "short" && game.commitment === "low"
      ? 8
      : state.session === "short" && game.commitment === "high"
        ? -8
        : 0;
  return tasteScore.pull + tasteScore.caution + tasteScore.uncertainty + notebookTaste + wishlistScore + accessScore + moodScore + sessionScore
    + difficultyScore + adultTimeScore + reviewBurdenScore + commitmentScore + plusScore + buyScore
    + discountScore + backlogScore + savedScore + externalScore;
}

function rankedGames() {
  const completed = notebookCompletedSet();
  return recommendationPool()
    .filter((game) => !state.hidden.has(game.title))
    .filter((game) => !state.snoozed.has(game.title))
    .filter((game) => !RANK_EXCLUDED_STATES.includes(gameUserState(game.title)))
    .filter((game) => !completed.has(titleKey(game.title)))
    .map((game) => ({ ...game, score: scoreGame(game) }))
    .sort((a, b) => b.score - a.score);
}

function bestLibraryPick(ranked) {
  return ranked.find((game) => isAlreadyAvailable(game));
}

function primaryDecisionGame(ranked) {
  if (state.entryPath === "psn") return bestLibraryPick(ranked) || ranked[0];
  return ranked[0];
}

function buyCluster(ranked) {
  const region = state.activeRegion;
  return ranked
    .filter((game) => game.prices[region] <= Number(state.budget))
    .filter((game) => priceCanGuideBuy(game, region))
    .filter((game) => !blocksPurchase(game))
    .slice(0, 6);
}

function monthlyDropItem(title) {
  return monthlyDrop.find((item) => titleMatches(item.title, title));
}

function playLaterQueue() {
  return Object.values(state.dropDecisions)
    .filter((item) => item.decision === "play_later")
    .map((item) => {
      const dropItem = monthlyDropItem(item.title);
      return {
        title: item.title,
        source: "Drop inbox",
        detail: dropItem ? `${dropItem.trialWindow} / ${dropItem.predictedRank}` : "Saved for later",
        atoms: dropItem?.atoms || [],
        nextAction: dropItem?.nextAction || "Try when there is a matching evening slot.",
      };
    });
}

function libraryPlan(ranked) {
  const region = state.activeRegion;
  const pool = recommendationPool();
  const seen = new Set();
  const rows = [];
  const gameState = (game) => effectiveGameState(game);
  const completedCount = pool.filter((game) => gameState(game) === "completed").length;
  const playableCount = pool.filter((game) => PLAYABLE_STATES.includes(gameState(game))).length;
  const savedCount = pool.filter((game) => gameState(game) === "saved").length + playLaterQueue().length;

  function push(row) {
    if (row.title) {
      const key = titleKey(row.title);
      if (seen.has(key)) return;
      seen.add(key);
    }
    rows.push(row);
  }

  const finish = ranked.find((game) => gameState(game) === "want_to_finish");
  const playing = ranked.find((game) => gameState(game) === "playing");
  const paused = ranked.find((game) => gameState(game) === "paused");
  const access = ranked.find((game) => ACCESS_STATES.includes(gameState(game)));
  const plusSignal = ranked.find((game) => !gameState(game) && state.psPlus && game.psPlus.includes(region));
  const saved = ranked.find((game) => gameState(game) === "saved");

  if (finish) {
    push({ label: "Finish", title: finish.title, tag: "want to finish" });
  }

  if (playing) {
    push({ label: "Resume", title: playing.title, tag: "in progress" });
  }

  if (paused) {
    push({ label: "Return later", title: paused.title, tag: "paused" });
  }

  if (access) {
    const stateLabel = USER_STATE_LABELS[gameState(access)] || gameState(access);
    push({ label: "Use access", title: access.title, tag: stateLabel });
  }

  if (saved) {
    push({ label: "Wishlist", title: saved.title, tag: "hot intent" });
  }

  if (plusSignal) {
    push({ label: "Included", title: plusSignal.title, tag: "PS Plus" });
  }

  const memoryRow = {
    label: "Memory",
    title: `${completedCount} completed / ${playableCount} playable`,
    tag: `${savedCount} saved`,
  };

  if (rows.length === 0 && !completedCount && !playableCount && !savedCount) {
    rows.unshift({ label: "Next", title: "Import or mark 5 games", tag: "setup" });
  }

  return {
    rows: [...rows.slice(0, 5), memoryRow],
    summary: `${playableCount} playable / ${completedCount} done / ${savedCount} saved`,
    playableCount,
    completedCount,
    savedCount,
  };
}

function extractPsnDemoStates() {
  const match = appSource.match(/const PSN_DEMO_STATES = \[([\s\S]*?)\];/);
  assert(match, "Could not find PSN_DEMO_STATES in app.js");
  const entries = [...match[1].matchAll(/\{\s*title:\s*"([^"]+)",\s*state:\s*"([^"]+)"\s*\}/g)]
    .map((entry) => ({ title: entry[1], state: entry[2] }));
  assert(entries.length > 0, "PSN_DEMO_STATES should contain at least one state");
  return entries;
}

function applyPsnDemoEntry() {
  state = defaultState();
  // Mirror the real PSN entry path (app.js sets state.entryPath = "psn"); without
  // it primaryDecisionGame skips the library-first pick and returns ranked[0].
  // That gap was masked until a price refresh changed ranked[0] to a no-price game.
  state.entryPath = "psn";
  state.liked = new Set(["The Last of Us Part I", "God of War Ragnarok", "Hades", "Stardew Valley"]);
  extractPsnDemoStates().forEach((item) => setGameState(item.title, item.state));
  state.activeCluster = "library";
}

function createQaScoreTools() {
  const scoreWindow = {};
  const PlaySputnikScore = Function("window", `${appScoreSource}\nreturn window.PlaySputnikScore;`)(scoreWindow);
  return PlaySputnikScore.createScoreTools({
    getState: () => state,
    getProfileGames: () => profileGames,
    getQuickReaction: (title) => state.quickReactions?.[titleKey(title)] || "",
    getFeedbackSource: () => null,
    getTasteConflict: () => ({ atoms: [] }),
    getTasteSignalCount: () => quickTasteSignalCount(),
    titleMatches,
    titleKey,
    effectiveGameState,
    getSubscriptionStatus: () => ({ state: "missing" }),
    getPriceStatus: () => ({ state: "missing" }),
    QUICK_TASTE_FIRST_TARGET: 5,
  });
}

function checkChunkLabels() {
  const { gameChunkProfile } = createQaScoreTools();
  const stray = catalog.find((game) => game.title === "Stray");
  const hades = catalog.find((game) => game.title === "Hades");
  assert(stray, "Stray fixture is missing from catalog");
  assert(hades, "Hades fixture is missing from catalog");

  const strayChunk = gameChunkProfile(stray);
  const hadesChunk = gameChunkProfile(hades);

  assert(!/run/i.test(strayChunk.label), `Stray should not be described as a run: ${strayChunk.label}`);
  assert(/chapter|area|session|beat/i.test(strayChunk.label), `Stray should use narrative/session wording: ${strayChunk.label}`);
  assert(/run/i.test(hadesChunk.label), `Hades should keep run wording: ${hadesChunk.label}`);

  return { stray: strayChunk.label, hades: hadesChunk.label };
}

function checkSelectors() {
  const idSelectors = [
    ...new Set(
      [...appSource.matchAll(/document\.querySelector\("([^"]+)"\)/g)]
        .map((match) => match[1])
        .filter((selector) => /^#[A-Za-z0-9_-]+$/.test(selector))
        .map((selector) => selector.slice(1)),
    ),
  ];
  const missing = idSelectors.filter((id) => !new RegExp(`id=["']${id}["']`).test(html));
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];

  assert(missing.length === 0, `Missing DOM ids used by app.js: ${missing.join(", ")}`);
  assert(duplicateIds.length === 0, `Duplicate DOM ids in index.html: ${duplicateIds.join(", ")}`);
  assert(/data-entry-path="psn"/.test(html), "PSN entry button is missing");
  assert(/30-game swipe/.test(html), "Quick taste should be presented as a 30-game swipe");
  assert(/id="quick-swipe-deck"/.test(html), "Swipe-style quick taste deck is missing");
  assert(/id="taste-gate"/.test(html), "Known-games minimum prompt is missing");
  assert(/playsputnik\.prototype\.state\.v2/.test(appRuntimeSource), "Onboarding storage should reset stale seeded profiles");
  assert(/liked:\s*new Set\(\)/.test(appStateSource), "Default onboarding should not fake liked games before user input");
  assert(/quickReactions:\s*\{\}/.test(appStateSource), "Default onboarding should start with no quick reactions");
  assert(profileGames.length === 30, `Expected 30 quick onboarding games, got ${profileGames.length}`);
  assert(profileGames.every((game) => game.axis), "Each quick onboarding game should have a diagnostic axis");
  assert(new Set(profileGames.map((game) => game.axis)).size === profileGames.length, "Quick onboarding axes should be unique");
  const onboardingAtoms = new Set(profileGames.flatMap((game) => game.atoms || []));
  const missingAtoms = REQUIRED_ONBOARDING_ATOMS.filter((atom) => !onboardingAtoms.has(atom));
  assert(missingAtoms.length === 0, `Quick onboarding is missing taste axes: ${missingAtoms.join(", ")}`);
  assert(/const DIAGNOSTIC_ONBOARDING_ATOMS/.test(appSource), "Adaptive onboarding diagnostic atom set is missing");
  assert(/QUICK_TASTE_SHARP_TARGET/.test(appOnboardingSource), "Quick onboarding should expose a sharper-profile milestone");
  assert(/QUICK_TASTE_USABLE_TARGET/.test(appOnboardingSource), "Quick onboarding should expose a safer starter-profile milestone");
  assert(/function quickProfileMaturity/.test(appOnboardingSource), "Quick onboarding maturity ladder is missing");
  assert(/function quickPayoffStage/.test(appOnboardingSource), "Quick onboarding payoff stage copy is missing");
  assert(/function quickPayoffMilestones/.test(appOnboardingSource), "Quick onboarding payoff milestones are missing");
  assert(/taste-payoff/.test(appSource + css), "Quick onboarding should render a payoff block");
  assert(/taste-payoff-ladder/.test(appSource + css), "Quick onboarding should render a 3/6/10 payoff ladder");
  assert(/First spark/.test(appOnboardingSource + i18nEnSource) && /Safer read/.test(appOnboardingSource + i18nEnSource) && /Sharper picks/.test(appOnboardingSource + i18nEnSource), "Quick onboarding payoff should cover 3/6/10 moments");
  assert(/function quickTasteConflictReport/.test(appOnboardingSource), "Quick onboarding should detect mixed early taste signals");
  assert(/function conflictResolutionScore/.test(appOnboardingSource), "Quick onboarding should score conflict-resolution follow-ups");
  assert(/function tasteEngineProfile/.test(appScoreSource), "Taste Engine v2 profile builder is missing");
  assert(/function tasteEngineGameSignals/.test(appScoreSource), "Taste Engine v2 should expose per-game pull/caution/mixed signals");
  assert(/function tasteEngineScore/.test(appScoreSource), "Taste Engine v2 score adapter is missing");
  assert(/function classifyTasteVerdict/.test(appScoreSource), "Companion Intelligence should classify reliable and polarizing taste fit");
  assert(/tensionPenalty/.test(appScoreSource), "Companion Intelligence should penalize simultaneous strong pull and caution");
  assert(/function tasteCalibrationProfile/.test(appScoreSource), "Companion Intelligence should calibrate against personal ratings");
  assert(/function personalRatingForecast/.test(appScoreSource), "Companion Intelligence should forecast the user's rating scale");
  assert(/function calibrationQuestionGames/.test(appScoreSource), "Calibration should select high-information games to rate next");
  assert(/calibrationSkips/.test(appStateSource + appScoreSource), "Not-played calibration games should persist without becoming taste feedback");
  assert(/records\.filter\(\(candidate\) => candidate !== record\)/.test(appScoreSource), "Calibration should hold out the game being predicted");
  assert(/modelErrors/.test(appScoreSource) && /ensemble/.test(appScoreSource), "Calibration should compare several local models");
  assert(/feedbackTasteWeights\(\{ includeQuick: false \}\)/.test(appScoreSource), "Taste Engine should avoid double-counting quick swipe feedback");
  assert(/Taste engine pull/.test(appScoreSource), "Score breakdown should expose Taste Engine pull");
  assert(/Taste engine caution/.test(appScoreSource), "Score breakdown should expose Taste Engine caution");
  assert(/Taste uncertainty/.test(appScoreSource), "Score breakdown should expose Taste Engine uncertainty");
  assert(/narrative\.recommend\.watchNegative/.test(appRecommendSource), "Watch-outs should explain negative taste signals");
  assert(/narrative\.recommend\.watchMixed/.test(appRecommendSource), "Watch-outs should explain mixed taste signals");
  assert(/function quickTasteSignalAtoms/.test(appOnboardingSource), "Adaptive onboarding should track signaled atoms");
  assert(/function diagnosticNeedScore/.test(appOnboardingSource), "Adaptive onboarding need scoring is missing");
  assert(/function nextDiagnosticGame/.test(appOnboardingSource), "Adaptive next-game selector is missing");
  assert(/const nextGame = nextDiagnosticGame\(\);/.test(appSource), "Swipe deck should use adaptive next-game selection");
  assert(/function quickSwipeFocusLabel/.test(appOnboardingSource), "Swipe deck should expose a user-friendly follow-up label");
  assert(/function quickSwipeFollowUpHint/.test(appOnboardingSource), "Swipe deck should expose a light follow-up hint");
  assert(/Good follow-up/.test(appOnboardingSource + i18nEnSource), "Swipe deck should keep targeted follow-ups magical rather than mechanical");
  assert(/Clarifying/.test(appOnboardingSource), "Internal selector should still understand targeted conflict follow-ups");
  assert(/conflictScore: conflictResolutionScore/.test(appOnboardingSource), "Adaptive selector should keep a conflict-resolution score");
  assert(/10000 \+ .*conflictScore/.test(appOnboardingSource), "Conflict-resolution candidates should outrank ordinary coverage");
  assert(/function quickSwipeAtomChips/.test(appOnboardingSource), "Swipe deck atom chips are missing");
  assert(/is-conflict/.test(appOnboardingSource + css), "Swipe deck should mark conflict atoms visually");
  assert(/quick-swipe-proof small/.test(css), "Follow-up hint should be styled as quiet supporting copy");
  assert(/quick-swipe-main/.test(appSource), "Swipe deck should have a focused main area");
  assert(/quick-swipe-proof/.test(appSource), "Swipe deck should show why the first signals already create value");
  assert(/data-quick-swipe-contract/.test(appSource), "Swipe deck should show the 30-second value contract");
  assert(/click.*to first pick/.test(appSource + i18nEnSource), "Swipe deck should tell users how close they are to the first pick");
  assert(/data-onboarding-shortcut="ratings"/.test(html), "First screen should offer the fast ranked-list import path");
  assert(/quick-swipe-meters/.test(appSource), "Swipe deck should show progress meters");
  assert(/quick-swipe-track/.test(appSource), "Swipe deck should render progress tracks");
  assert(/quick-swipe-atom-row/.test(appSource), "Swipe deck atom row is missing");
  assert(/QUICK_REACTION_LABELS/.test(appSource), "Swipe reactions should have explicit undo labels");
  assert(/function stageQuickUndo/.test(appSource), "Swipe deck should stage undo for accidental answers");
  assert(/undo\.action === "quick_taste"/.test(appSource), "Undo handler should restore quick taste answers");
  assert(/quick-swipe-undo/.test(appSource), "Swipe deck should render an inline undo strip");
  const starterLiked = new Set(["The Last of Us Part I", "God of War Ragnarok", "Hades"]);
  const starterAtoms = new Set(profileGames.filter((game) => starterLiked.has(game.title)).flatMap((game) => game.atoms || []));
  const starterMissing = REQUIRED_ONBOARDING_ATOMS.filter((atom) => !starterAtoms.has(atom));
  const firstSequential = profileGames.find((game) => !starterLiked.has(game.title));
  const adaptiveCandidate = profileGames
    .filter((game) => !starterLiked.has(game.title))
    .map((game, index) => ({
      game,
      index,
      score: (game.atoms || []).filter((atom) => starterMissing.includes(atom)).length * 100
        + (game.atoms || []).filter((atom) => !starterAtoms.has(atom)).length,
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.game;
  assert(adaptiveCandidate?.title !== firstSequential?.title, "Adaptive onboarding should not fall back to first-unanswered order");
  assert(
    adaptiveCandidate?.atoms.some((atom) => starterMissing.includes(atom)),
    "Adaptive onboarding should pick a game that closes an uncovered taste axis",
  );
  const conflictAnswered = new Set(["The Witcher 3: Wild Hunt", "The Last of Us Part I", "Hades"]);
  const conflictAtoms = ["story"];
  const conflictAnsweredAtoms = new Set(profileGames.filter((game) => conflictAnswered.has(game.title)).flatMap((game) => game.atoms || []));
  const conflictCandidate = profileGames
    .filter((game) => !conflictAnswered.has(game.title))
    .map((game, index) => {
      const coverage = (game.atoms || []).filter((atom) => conflictAtoms.includes(atom));
      const newContext = (game.atoms || []).filter((atom) => !conflictAnsweredAtoms.has(atom) && !conflictAtoms.includes(atom));
      return {
        game,
        index,
        score: coverage.length ? 10000 + coverage.length * 500 + newContext.length * 25 : 0,
      };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.game;
  assert(conflictCandidate?.atoms.includes("story"), "Targeted onboarding follow-up should intersect the mixed atom");
  assert(conflictCandidate?.title === "Death Stranding", `Expected Death Stranding to clarify mixed story taste, got ${conflictCandidate?.title}`);
  assert(/class="app-view-nav"/.test(html), "Product area navigation is missing");
  assert(/id="app-view-status"/.test(html), "Product area status copy is missing");
  assert((html.match(/data-app-view="/g) || []).length >= 6, "Product area navigation should expose the main app views");
  assert(/data-app-view="today"/.test(html) && /data-app-view="library"/.test(html) && /data-app-view="discover"/.test(html), "Product area navigation should cover Today, Library, and Discover");
  assert(/data-app-view="wishlist"/.test(html) && /data-app-view="taste"/.test(html) && /data-app-view="data"/.test(html), "Product area navigation should cover Wishlist, Taste, and Data");
  assert(/aria-current/.test(appSource), "Active app view should expose aria-current for navigation");
  assert(/data-view-section="today/.test(html), "User-facing sections should declare app view visibility");
  assert(/data-view-section="data"/.test(html), "Technical sections should move into the Data area");
  // HLTB module (features 1, 3, 4)
  assert(/function valueScore/.test(appHltbSource), "Value score function is missing");
  assert(/function roiSummary/.test(appHltbSource), "ROI summary function is missing");
  assert(/function criticScoreLabel/.test(appHltbSource), "Critic score label is missing");
  assert(/function hltbProgress/.test(appHltbSource), "HLTB progress function is missing");
  assert(/function gameValueCard/.test(appHltbSource), "Game value card builder is missing");
  assert(/PlaySputnikHltb/.test(appHltbSource), "HLTB module must export PlaySputnikHltb");
  assert(/PlaySputnikHltb/.test(appSource), "app.js must reference PlaySputnikHltb");
  assert(/gameValueCard/.test(appSource), "app.js must call gameValueCard in detail drawer");
  assert(/hltbHours/.test(catalog[0] !== undefined ? JSON.stringify(catalog) : "hltbHours"), "games.json must have hltbHours");
  assert(/criticScore/.test(JSON.stringify(catalog)), "games.json must have criticScore");
  assert(/app-hltb\.js/.test(appLoadSource), "app-hltb.js must be in the load chain");

  // Session module (features 11 + 12)
  assert(/function createSessionTools/.test(appSessionSource), "Session tools factory is missing");
  assert(/IDLE_TIMEOUT_MS/.test(appSessionSource), "Idle timeout constant is missing");
  assert(/CONTINUITY_GAP_MS/.test(appSessionSource), "Continuity gap constant is missing");
  assert(/visibilitychange/.test(appSessionSource), "Page Visibility API listener is missing");
  assert(/mousemove/.test(appSessionSource), "Mouse activity listener is missing");
  assert(/function currentSessionMinutes/.test(appSessionSource), "Current session minutes helper is missing");
  assert(/function sessionSummary/.test(appSessionSource), "Session summary helper is missing");
  assert(/PlaySputnikSession/.test(appSessionSource), "Session module must export PlaySputnikSession");
  assert(/PlaySputnikSession/.test(appSource), "app.js must reference PlaySputnikSession");
  assert(/renderSessionStats/.test(appSource), "Session stats renderer must be in app.js");
  assert(/sessionLog/.test(appStateSource), "sessionLog must be in defaultState");
  assert(/app-session\.js/.test(appLoadSource), "app-session.js must be in the load chain");

  // AI explanation module (feature 6)
  assert(/function createAiTools/.test(appAiSource), "AI tools factory is missing from app-ai.js");
  assert(/function fetchExplanation/.test(appAiSource), "fetchExplanation is missing from app-ai.js");
  assert(/function cachedExplanation/.test(appAiSource), "cachedExplanation is missing from app-ai.js");
  assert(/function fetchNarrative/.test(appAiSource), "locale-aware fetchNarrative is missing from app-ai.js");
  assert(/function cachedNarrative/.test(appAiSource), "locale-aware cachedNarrative is missing from app-ai.js");
  assert(/CACHE_SCHEMA = "ai-narrative-v2"/.test(appAiSource), "AI cache schema version is missing");
  assert(/getLocale/.test(appAiSource) && /fingerprint/.test(appAiSource), "AI cache must include locale and context fingerprinting");
  assert(/PlaySputnikAi/.test(appAiSource), "AI module must export PlaySputnikAi");
  assert(/PlaySputnikAi/.test(appSource), "app.js must reference PlaySputnikAi");
  assert(/fetchExplanation/.test(appSource), "app.js must wire fetchExplanation into detail drawer");
  assert(/fetchNarrative\("companion"/.test(appSource), "app.js must hydrate the main companion answer with AI narrative");
  assert(/localNarrative\("companion"/.test(appSource), "Main companion answer must have a free localized narrative fallback");
  assert(/data-ai-companion-copy/.test(appSource + css), "Main companion answer fallback should render through a stable narrative slot");
  assert(/textContent = explanation/.test(appSource), "AI detail output must be inserted as text, not trusted HTML");
  assert(/app-ai\.js/.test(appLoadSource), "app-ai.js must be in the load chain");
  assert(/ANTHROPIC_API_KEY/.test(searchProviderSource), "Search provider server must read ANTHROPIC_API_KEY");
  assert(/\/api\/explain/.test(searchProviderSource), "Search provider server must expose /api/explain endpoint");
  assert(/\/api\/narrative/.test(searchProviderSource), "Search provider server must expose /api/narrative endpoint");
  assert(/GET, POST, OPTIONS/.test(searchProviderSource), "AI provider CORS must allow POST");
  assert(/Never invent prices/.test(searchProviderSource), "AI narrative prompt must forbid fabricated commerce facts");
  assert(/aiExplanations/.test(appStateSource), "aiExplanations must be in defaultState");
  assert(/detail-ai-btn/.test(appSource), "Detail drawer must have an AI explain button");

  // Cards module (pass 18)
  assert(/function createCardsTools/.test(appCardsSource), "createCardsTools factory is missing from app-cards.js");
  assert(/function renderCard/.test(appCardsSource), "renderCard is missing from app-cards.js");
  assert(/function renderHero/.test(appCardsSource), "renderHero is missing from app-cards.js");
  assert(/function renderProfileGameRow/.test(appCardsSource), "renderProfileGameRow is missing from app-cards.js");
  assert(/function applyCoverVisual/.test(appCardsSource), "applyCoverVisual is missing from app-cards.js");
  assert(/function renderCoverSourceInto/.test(appCardsSource), "renderCoverSourceInto is missing from app-cards.js");
  assert(/data\/editorial-ru\.json/.test(appSource), "App must load the Russian editorial overlay");
  assert(/getEditorialEntry\?\.\(game\)/.test(appRecommendSource), "Recommendation copy must use locale editorial entries");
  assert(/gameTagline\(game\)/.test(appCardsSource), "Cards must render localized editorial taglines");
  assert(/\.game-card:hover/.test(css) && /\.score/.test(css), "Recommendation cards should keep the premium visual polish layer");
  assert(/PlaySputnikCards/.test(appCardsSource), "Cards module must export PlaySputnikCards");
  assert(/PlaySputnikCards/.test(appSource), "app.js must reference PlaySputnikCards");
  assert(!/^function renderCard/.test(appSource), "renderCard must not remain as top-level function in app.js");
  assert(!/^function renderHero/.test(appSource), "renderHero must not remain as top-level function in app.js");
  assert(!/^function applyCoverVisual/.test(appSource), "applyCoverVisual must not remain as top-level function in app.js");
  assert(/app-cards\.js/.test(appLoadSource), "app-cards.js must be in the load chain");

  // Data panel module (pass 19)
  assert(/function createDataPanelTools/.test(appDataPanelSource), "createDataPanelTools factory is missing");
  assert(/function renderCatalogBackbone/.test(appDataPanelSource), "renderCatalogBackbone missing from app-data-panel.js");
  assert(/function renderDevHealth/.test(appDataPanelSource), "renderDevHealth missing from app-data-panel.js");
  assert(/function renderDataWorkbench/.test(appDataPanelSource), "renderDataWorkbench missing from app-data-panel.js");
  assert(/function renderSourceHealth/.test(appDataPanelSource), "renderSourceHealth missing from app-data-panel.js");
  assert(/function renderRefreshPolicy/.test(appDataPanelSource), "renderRefreshPolicy missing from app-data-panel.js");
  assert(/PlaySputnikDataPanel/.test(appDataPanelSource), "Data panel module must export PlaySputnikDataPanel");
  assert(/PlaySputnikDataPanel/.test(appSource), "app.js must reference PlaySputnikDataPanel");
  assert(/app-data-panel\.js/.test(appLoadSource), "app-data-panel.js must be in the load chain");

  // Smart library import module (Feature A + B)
  assert(/function detectFormat/.test(appImportSource), "detectFormat is missing from app-import.js");
  assert(/function parseBackloggdCsv/.test(appImportSource), "Backloggd CSV parser is missing");
  assert(/function parseHltbJson/.test(appImportSource), "HLTB JSON parser is missing");
  assert(/function parsePlainList/.test(appImportSource), "Plain list parser is missing");
  assert(/function parsePsnTrophyTitles/.test(appImportSource), "PSN trophy titles parser is missing");
  assert(/PlaySputnikImport/.test(appImportSource), "Import module must export PlaySputnikImport");
  assert(/PlaySputnikImport/.test(appSource), "app.js must reference PlaySputnikImport");
  assert(/app-import\.js/.test(appLoadSource), "app-import.js must be in the load chain");
  assert(/psn-npsso-input/.test(html), "PSN NPSSO input must be in index.html");
  assert(/library-import-file/.test(html), "Library import file input must be in index.html");
  assert(/\/api\/psn/.test(searchProviderSource), "Search provider server must expose /api/psn endpoint");
  assert(/fetchPsnLibrary/.test(searchProviderSource), "PSN library fetch function must be in server");
  assert(/npsso/.test(searchProviderSource), "Server must handle NPSSO token");

  // Export module (Pass 20)
  assert(/function createExportTools/.test(appExportSource), "createExportTools factory is missing from app-export.js");
  assert(/function exportStateJson/.test(appExportSource), "exportStateJson must be in app-export.js");
  assert(/function exportLibraryCsv/.test(appExportSource), "exportLibraryCsv must be in app-export.js");
  assert(/function importStateJson/.test(appExportSource), "importStateJson must be in app-export.js");
  assert(/function applyLibraryImportEntries/.test(appExportSource), "applyLibraryImportEntries must be in app-export.js");
  assert(/function showLibraryImportPreview/.test(appExportSource), "showLibraryImportPreview must be in app-export.js");
  assert(/function handleLibraryFileImport/.test(appExportSource), "handleLibraryFileImport must be in app-export.js");
  assert(/async function importFromPsn/.test(appExportSource), "importFromPsn must be in app-export.js");
  assert(/function bindExportListeners/.test(appExportSource), "bindExportListeners must be in app-export.js");
  assert(/PlaySputnikExport/.test(appExportSource), "Export module must expose PlaySputnikExport");
  assert(/PlaySputnikExport/.test(appSource), "app.js must reference PlaySputnikExport");
  assert(/bindExportListeners/.test(appSource), "app.js must call bindExportListeners");
  assert(/app-export\.js/.test(appLoadSource), "app-export.js must be in the load chain");
  assert(!/function exportStateJson/.test(appSource), "exportStateJson must NOT be in app.js (moved to app-export.js)");
  assert(!/function exportLibraryCsv/.test(appSource), "exportLibraryCsv must NOT be in app.js (moved to app-export.js)");
  assert(!/function importFromPsn/.test(appSource), "importFromPsn must NOT be in app.js (moved to app-export.js)");

  // Storage module
  assert(/function idbGet/.test(appStorageSource), "IDB get helper is missing from storage module");
  assert(/function idbSet/.test(appStorageSource), "IDB set helper is missing from storage module");
  assert(/function preload/.test(appStorageSource), "IDB preload function is missing from storage module");
  assert(/function createStorageAdapter/.test(appStorageSource), "Storage adapter factory is missing");
  assert(/PlaySputnikStorage/.test(appStorageSource), "Storage module must export PlaySputnikStorage");
  assert(/PlaySputnikStorage/.test(appSource), "app.js must reference PlaySputnikStorage");
  assert(/createStorageAdapter/.test(appSource), "app.js must use createStorageAdapter instead of localStorage directly");
  assert(!/storage: localStorage/.test(appSource), "app.js must not pass raw localStorage to createStateTools");
  assert(/preload.*STORAGE_KEY/.test(html) || /PlaySputnikStorage\.preload/.test(html), "index.html must call preload before loading app.js");
  assert(/app-storage\.js/.test(appLoadSource), "app-storage.js must be in the load chain");

  assert(/function handleScriptError/.test(html), "Script load error handler is missing from index.html");
  assert(/script\.onerror\s*=\s*\(\)\s*=>\s*reject\(new Error\(path\)\)/.test(html), "Dynamic script loader must reject failed module loads");
  assert(/catch \(error\)\s*{\s*handleScriptError/.test(html), "App boot must surface rejected module loads");
  assert(/src\/app-config\.js/.test(appLoadSource) && /PlaySputnikConfig/.test(appSource), "App config module is not wired into app.js");
  assert(/APP_VIEWS/.test(appConfigSource), "App view metadata is missing from app config");
  assert(/activeView: "today"/.test(appStateSource), "App view state should default to Today");
  assert(/function renderAppViewShell/.test(appSource), "App view renderer is missing");
  assert(/function openAppView/.test(appSource), "App view click handler is missing");
  assert(/is-view-hidden/.test(css), "Hidden app view sections should be styled");
  assert(/app-view-smoke/.test(appViewSmokeSource), "App view smoke test is missing");
  assert(/data-app-view="library"/.test(appViewSmokeSource), "App view smoke should verify Library navigation");
  assert(/data-app-view="wishlist"/.test(appViewSmokeSource), "App view smoke should verify Wishlist navigation");
  assert(/data-app-view="data"/.test(appViewSmokeSource), "App view smoke should verify Data navigation");
  assert(/data-cluster="library"/.test(html), "Library tab is missing");
  assert(/id="first-run-bridge"/.test(html), "First-run bridge is missing");
  assert(/id="library-plan-list"/.test(html), "Library plan list is missing");
  assert(/id="catalog-backbone-list"/.test(html), "Catalog backbone panel is missing");
  assert(/data\/catalog-backbone\.json/.test(appSource), "Catalog backbone data source is not loaded");
  assert(/function renderCatalogBackbone/.test(appSource + appDataPanelSource), "Catalog backbone renderer is missing");
  assert(/backbone-row/.test(appSource + appDataPanelSource), "Catalog backbone lane rows are missing");
  assert(/id="dev-health-list"/.test(html), "Dev health panel is missing");
  assert(/data\/dev-health\.json/.test(appSource), "Dev health data source is not loaded");
  assert(/function renderDevHealth/.test(appSource + appDataPanelSource), "Dev health renderer is missing");
  assert(/function devHealthChecks/.test(appDevSource), "Dev health live check builder is missing");
  assert(/dev-health-row/.test(appSource + appDataPanelSource), "Dev health rows are missing");
  assert(devHealth.checks.length >= 4, "Dev health should expose at least four checks");
  assert(
    ["preview_server", "data_health", "browser_smoke", "app_view_smoke", "library_wishlist_smoke", "game_detail_smoke", "visual_catalog_smoke", "provider_endpoint"].every((id) =>
      devHealth.checks.some((check) => check.id === id),
    ),
    "Dev health should track preview, data, browser smoke, app view smoke, library/wishlist smoke, game detail smoke, visual catalog smoke, and provider checks",
  );
  assert(
    devHealth.checks.some((check) => check.id === "library_wishlist_smoke" && check.status === "pass"),
    "Library/Wishlist smoke should be marked pass after stabilization",
  );
  assert(
    devHealth.checks.some((check) => check.id === "game_detail_smoke" && check.status === "pass"),
    "Game detail smoke should be marked pass",
  );
  assert(/design_smoke/.test(appDevSource) && devHealth.checks.some((check) => check.id === "design_smoke"), "Dev health should track visual design smoke checks");
  assert(/cover_resolver/.test(appDevSource) && devHealth.checks.some((check) => check.id === "cover_resolver"), "Dev health should track cover resolver checks");
  assert(catalogBackbone.records.length >= 80, `Expected at least 80 catalog backbone records, got ${catalogBackbone.records.length}`);
  assert(catalogBackbone.target.backboneRecords === catalogBackbone.records.length, "Catalog backbone target count should match records");
  assert(catalogBackbone.lanes.length >= 8, "Catalog backbone should have at least eight lanes");
  assert(/promoted_to_seed/.test(appSource + appDataPanelSource), "Catalog backbone UI should understand promoted records");
  assert(/function makeGameRecord/.test(catalogPromoterSource), "Catalog promotion game builder is missing");
  assert(/function makePriceSnapshots/.test(catalogPromoterSource), "Catalog promotion price snapshot builder is missing");
  assert(/--title/.test(catalogPromoterSource) && /selectRequestedCandidates/.test(catalogPromoterSource), "Catalog promotion should support explicit title-driven batches");
  assert(/promoted_to_seed/.test(catalogPromoterSource), "Catalog promotion should mark promoted backbone records");
  assert(catalog.length >= 48, `Expected promoted seed catalog to have at least 48 games, got ${catalog.length}`);
  assert(catalogBackbone.target.currentSeed === catalog.length, "Catalog backbone currentSeed should match seed catalog size");
  assert(
    catalogBackbone.records.filter((record) => record.status === "promoted_to_seed").length >= 24,
    "Catalog backbone should track the first promoted batch",
  );
  assert(/refinements/.test(catalogRefinerSource), "Seed catalog refinement map is missing");
  assert(!catalog.some((game) => /Upcoming wishlist radar|Large-world roleplay|Prestige narrative action/.test(game.vibe)), "Seed catalog should not keep generic promotion vibes");
  assert(catalog.find((game) => game.title === "Marvel's Spider-Man 2")?.length === "medium", "Spider-Man 2 should not be treated as a tiny short game");
  assert(catalog.find((game) => game.title === "The Last of Us Part I")?.tone === "melancholic", "The Last of Us Part I should carry a stronger tone signal");
  assert(catalog.find((game) => game.title === "The Outer Worlds")?.tone === "funny", "The Outer Worlds should preserve satire/comedy fit");
  assert(!catalog.find((game) => game.title === "God of War")?.wishlist, "Core catalog anchors should not become wishlist items by default");
  assert(catalog.find((game) => game.title === "Mafia: The Old Country")?.wishlist, "User-intent radar titles should keep wishlist intent");
  assert(/id="game-search-input"/.test(html), "Global game search input is missing");
  assert(/id="game-search-list"/.test(html), "Global game search result list is missing");
  assert(/data\/search-sources\.json/.test(appSource), "Search sources data source is not loaded");
  assert(/data\/global-search-fixtures\.json/.test(appSource), "Global search fixtures data source is not loaded");
  assert(/src\/app-search\.js/.test(appLoadSource) && /PlaySputnikSearch/.test(appSource), "Search module is not wired into app.js");
  assert(/function globalSearchResults/.test(appSearchSource), "Global search result builder is missing");
  assert(/function searchMatch/.test(appSearchSource), "Frontend search should expose match kind scoring");
  assert(/function compareSearchResults/.test(appSearchSource), "Frontend search should use stable result comparison");
  assert(/function tokenCoverageScore/.test(appSearchSource), "Frontend search should support token coverage matching");
  assert(/alias_manual/.test(appSearchSource), "Manual fallback should canonicalize known aliases");
  assert(/function tokenCoverageScore/.test(searchProviderSource), "Provider fallback search should support token coverage matching");
  assert(/function searchMatch/.test(searchProviderSource), "Provider search should expose match kind scoring");
  assert(/function compareSearchResults/.test(searchProviderSource), "Provider search should use stable result comparison");
  assert(/function runProviderSearch/.test(appSource), "Provider-backed search runner is missing");
  assert(/function scheduleProviderSearch/.test(appSource), "Provider-backed search should auto-run after typing");
  assert(/providerSearchMatchesQuery/.test(appSource), "Provider status should be scoped to the current query");
  assert(/PROVIDER_SEARCH_ENDPOINT:\s*`\$\{apiOrigin\}\/api\/search`/.test(appConfigSource), "Provider search endpoint is missing");
  assert(/PlaySputnikRuntime\?\.apiOrigin/.test(appConfigSource) && /runtime-config\.js/.test(html), "Production API runtime config is not wired");
  assert(/runtime-config\.js/.test(swSource) && /networkFirstWithCache\(request, DATA_CACHE\)/.test(swSource), "Runtime API config should use a network-first service-worker path");
  assert(/resultShapeVersion/.test(searchProviderSource + appSource), "Provider search should expose a result shape version");
  assert(/function providerSearchEnvelope/.test(searchProviderSource), "Provider search envelope is missing");
  assert(/function providerFailureInfo/.test(searchProviderSource), "Provider failure classifier is missing");
  assert(/rawg_rate_limited/.test(searchProviderSource), "Provider search should classify RAWG rate limits");
  assert(/fallbackUsed/.test(searchProviderSource + appSource), "Provider fallback state should be explicit");
  assert(/recoverable/.test(searchProviderSource + appSource), "Provider recoverability should be explicit");
  assert(/sourceHealthDetail/.test(searchProviderSource + appSource), "Provider source health details should be explicit");
  assert(/--force-fixture/.test(searchProviderSource), "Provider fixture fallback should be testable even when a key exists");
  assert(/searchIndexStatus/.test(appSource), "Frontend search should track deferred local index status");
  assert(/source-warning/.test(appSource + css), "Frontend search should warn while sources or providers are degraded");
  assert(/PlaySputnikSearchMemory/.test(moduleManifestSource + appSource), "Search memory workflow should be a runtime module");
  assert(/function applySearchResultState/.test(appSearchMemorySource), "Search results should persist to normalized memory states");
  assert(/function searchResultMemoryStatus/.test(appSource), "Search results should expose memory confirmation status");
  assert(/function addSearchResultToWishlist/.test(appSearchMemorySource), "Search wishlist add handler is missing");
  assert(/data-search-memory-panel/.test(appSource), "Search results should show direct add confirmation panels");
  assert(/game-search-cover/.test(appSource + css), "Search provider results should render an attributed cover preview");
  assert(/game-search-memory-checks/.test(appSource + css), "Search memory panel should show a result checklist");
  assert(/data-search-open-wishlist/.test(appSource), "Saved search results should expose a Wishlist next step");
  assert(/aria-pressed="\$\{saved\}"/.test(appSource), "Search Wishlist action should expose pressed state");
  assert(/data-search-detail/.test(appSource), "Search results should expose a Details path");
  assert(/data-search-state="owned"/.test(appSource), "Search results should support owned memory actions");
  assert(/data-search-state="subscription"/.test(appSource), "Search results should support subscription memory actions");
  assert(/function searchResultDetailGame/.test(appDetailSource), "Search results should open as rich detail drawer games");
  assert(/coverUrl: result\.coverUrl/.test(appSearchMemorySource), "Search wishlist memory should persist provider coverUrl");
  assert(/coverLicenseNote/.test(appSearchMemorySource + appProviderImportSource), "Search wishlist memory should persist provider cover license notes");
  assert(/Attribute RAWG/.test(appProviderImportSource), "RAWG wishlist covers should preserve attribution notes");
  assert(/providerImport/.test(appSearchMemorySource + appProviderImportSource + appStateSource), "RAWG search imports should persist provider import metadata");
  assert(/sourcePassport/.test(appSearchMemorySource + appStateSource), "Search imports should persist source passport metadata");
  assert(/--inject-rawg/.test(searchMemorySmokeSource), "Search-to-memory smoke should cover RAWG-shaped provider imports");
  assert(/licenseNote: record\.coverLicenseNote/.test(appSource), "External memory games should expose persisted cover license notes");
  assert(/manualSearchResult/.test(appSearchSource), "Manual unverified search fallback is missing");
  assert(/externalMemoryGames/.test(appSource), "External wishlist games should be visible in memory");
  assert(/function recommendationPool/.test(appSource), "External wishlist games should enter the recommendation pool");
  assert(/recommendationPool/.test(appSource + appRankingSource), "Ranked games should use the recommendation pool");
  assert(/plan-primary-action/.test(appSource + css), "Today command center should expose primary row actions");
  assert(/data-plan-action/.test(appSource), "Today command center should expose non-state commands");
  assert(/today\.planDoNotBuy/.test(appLibrarySource), "Today command center should include a no-buy command");
  assert(/today\.planSummary/.test(appSource + appLibrarySource), "Today command center should use localized summary copy");
  assert(/External discovery/.test(appScoreSource), "External discovery should have an explicit scoring line");
  assert(/Price missing/.test(appSource + i18nEnSource), "External recommendation cards should not fake missing prices");
  assert(/function gameSourcePassport/.test(appCoverSource), "External games should expose a source passport");
  assert(/function searchResultSourcePassport/.test(appEnrichmentSource), "Search results should expose source passport facts");
  assert(/matchKind/.test(appSearchSource + searchProviderSource + appSource), "Search results should keep match kind visible");
  assert(/function aiEnrichmentForGame/.test(appSource), "External games should get AI enrichment");
  assert(/AI inferred/.test(appSource + i18nEnSource), "AI enrichment should be visibly labeled as inferred");
  assert(/inferredAtoms/.test(appSource), "User-game memory should keep inferred atoms separate from source atoms");
  assert(/source-passport/.test(appEnrichmentSource + appSource) && /source-passport/.test(html + appSource + appEnrichmentSource), "Source passport renderer is missing");
  assert(/enrichmentCheckFact/.test(appSource + i18nEnSource), "AI enrichment should show a missing-facts checklist");
  assert(/rawgSearch/.test(searchProviderSource), "RAWG provider adapter is missing");
  assert(/story\.\?rich/.test(searchProviderSource) && /record\.genres \|\| \[\]\)\.flatMap/.test(searchProviderSource), "RAWG atom inference should use genre/tag names and slugs");
  assert(/loadLocalEnv/.test(searchProviderSource), "Search provider should read local env config");
  assert(/providerSearchPayload/.test(searchProviderSource), "Provider search payload builder is missing");
  assert(/fixtureSearch/.test(searchProviderSource), "Provider server fixture fallback is missing");
  assert(/function reconcileTitle/.test(searchProviderSource), "Provider search reconciliation is missing");
  assert(/withReconciliation/.test(searchProviderSource), "Provider results should carry reconciliation metadata");
  assert(/aliasTermsForTitle/.test(searchProviderSource), "Provider search should score aliases");
  assert(/reconciliation/.test(appSource), "Frontend search results should preserve reconciliation metadata");
  assert(/Access-Control-Allow-Origin/.test(searchProviderSource), "Provider server should allow static prototype CORS");
  assert(searchSources.sources.length >= 4, "Search sources should expose local, backbone, external, and manual layers");
  assert(searchSources.sources.some((source) => source.id === "manual_unverified" && source.canAddToWishlist), "Manual search source should allow wishlist adds");
  assert(searchSources.sources.some((source) => source.id === "rawg_provider_hook" && source.type === "provider_endpoint"), "RAWG provider endpoint source should be declared");
  assert(globalSearchFixtures.records.length >= 110, "Global search fixture index should have enough no-key discovery records");
  assert(globalSearchFixtures.records.some((record) => record.title === "Grand Theft Auto VI"), "Global search fixtures should include a recognizable external title");
  assert(globalSearchFixtures.records.some((record) => record.title === "God of War Ragnarök"), "Global search fixtures should include an intentional seed-duplicate reconciliation case");
  assert(globalSearchFixtures.records.some((record) => record.title === "Black Myth: Wukong"), "Global search fixtures should cover Wukong-style partial search");
  assert(globalSearchFixtures.records.some((record) => record.title === "Hollow Knight: Silksong"), "Global search fixtures should cover Silksong-style shorthand search");
  assert(globalSearchFixtures.records.some((record) => record.title === "Balatro"), "Global search fixtures should include short-session discovery records");
  assert(globalSearchFixtures.records.some((record) => record.title === "The Blood of Dawnwalker"), "Global search fixtures should include the expanded RPG radar batch");
  assert(globalSearchFixtures.records.some((record) => record.title === "L.A. Noire"), "Global search fixtures should include cinematic/story expansion records");
  assert(globalSearchFixtures.records.some((record) => record.title === "Commandos: Origins"), "Global search fixtures should include strategy/tactical expansion records");
  assert(!globalSearchFixtures.records.some((record) => /^(Cinematic \/ Story|RPG \/ Open World|Action \/ Challenge|Strategy \/ Sports \/ Racing)$/.test(record.title)), "Global search fixture importer should not import section headings as games");
  {
    const tlouRemastered = catalog.find((game) => game.title === "The Last of Us Part II Remastered");
    const tlouOriginal = catalog.find((game) => game.title === "The Last of Us Part II");
    assert(tlouRemastered?.editionRole === "primary", "TLOU Part II Remastered should be marked as the primary edition");
    assert(tlouOriginal?.editionRole === "legacy", "TLOU Part II original should be marked as a legacy related edition");
    assert(tlouOriginal?.priceCanonicalTitle === "The Last of Us Part II Remastered", "TLOU Part II original should point price tracking at Remastered");
    assert(/function editionNoteHtml/.test(appSource), "Edition note UI is missing from detail drawer");
    assert(/editionLabel/.test(appSearchSource), "Seed search results should preserve edition labels");
  }
  assert(titleAliases.some((entry) => entry.title === "Grand Theft Auto VI" && entry.aliases.includes("GTA 6")), "Title aliases should cover GTA 6");
  assert(titleAliases.some((entry) => entry.title === "Black Myth: Wukong" && entry.aliases.includes("Wukong")), "Title aliases should cover Wukong shorthand");
  assert(titleAliases.some((entry) => entry.title === "Baldur's Gate 3" && entry.aliases.includes("Baldur's Gate III")), "Title aliases should cover BG3 roman numeral provider names");
  assert(titleAliases.some((entry) => entry.title === "Sid Meier's Civilization VII" && entry.aliases.includes("Civ 7")), "Title aliases should cover Civ 7 shorthand");
  assert(titleAliases.some((entry) => entry.title === "OD" && entry.aliases.includes("Kojima horror")), "Title aliases should cover descriptive OD search");
  assert(titleAliases.some((entry) => entry.title === "Red Dead Redemption 2" && entry.aliases.includes("RDR2")), "Title aliases should cover RDR2 shorthand");
  assert(titleAliases.some((entry) => entry.title === "The Outer Worlds" && entry.aliases.includes("Внешние миры")), "Title aliases should cover Russian Outer Worlds");
  assert(titleAliases.some((entry) => entry.title === "L.A. Noire" && entry.aliases.includes("L. A. Noire")), "Title aliases should cover spaced L.A. Noire spelling");
  assert(/import-global-search-fixtures/.test(searchFixtureImporterSource) || /global-search-fixture-import-preview/.test(searchFixtureImporterSource), "Global search fixture importer is missing preview mode");
  assert(/writeMode/.test(searchFixtureImporterSource), "Global search fixture importer should support write mode");
  assert(/function makeRecord/.test(searchFixtureImporterSource), "Global search fixture importer record builder is missing");
  assert(/skippedDuplicates/.test(searchFixtureImporterSource), "Global search fixture importer should report duplicate skips");
  assert(/cinematic\|story\|narrative/.test(searchFixtureImporterSource), "Global search fixture importer should recognize genre section headings");
  assert(/Tides of Annihilation/.test(searchFixtureImportFixture), "Search fixture import test should include an existing duplicate");
  assert(/Cinematic \/ Story/.test(searchFixtureExpansionFixture), "Search fixture expansion test should cover genre section headings");
  assert(/Commandos: Origins/.test(searchFixtureExpansionFixture), "Search fixture expansion test should include the strategy/tactical lane");
  assert(/function parseImportText/.test(catalogImporterSource), "Catalog import parser is missing");
  assert(/function inferLane/.test(catalogImporterSource), "Catalog import lane inference is missing");
  assert(/function makeRecord/.test(catalogImporterSource), "Catalog import record builder is missing");
  assert(/catalog-import-preview/.test(catalogImporterSource), "Catalog import preview mode is missing");
  assert(/skippedDuplicates/.test(catalogImporterSource), "Catalog import duplicate reporting is missing");
  assert(/existingTitles\.set\(titleKey\(game\.title\), "seed_catalog"\)/.test(catalogImporterSource), "Catalog import should let seed catalog duplicates outrank backbone duplicates");
  assert(/Marvel's Wolverine/.test(catalogImportFixture), "Catalog import fixture should include a wishlist candidate");
  assert(/function personalEvidence/.test(appRecommendSource), "Personal evidence generator is missing");
  assert(/function decisionRationale/.test(appRecommendSource), "Shared decision rationale is missing");
  assert(/function personalRankForecast/.test(appRecommendSource), "Personal ranking forecast is missing");
  assert(/function tasteVerdict/.test(appRecommendSource), "Shared recommendation rationale should expose a taste verdict");
  assert(/narrative\.recommend\.evidenceVerdict/.test(appRecommendSource), "Taste verdict should be visible in personal evidence");
  assert(/narrative\.recommend\.evidenceRatingForecast/.test(appRecommendSource), "Calibrated personal rating should be visible in evidence");
  assert(/id="stats-calibration"/.test(html), "Stats should expose forecast calibration");
  assert(/data-calibration-rating/.test(appSource), "Stats should let users answer calibration questions immediately");
  assert(/data-calibration-skip/.test(appSource), "Calibration questions should support a neutral Not played replacement");
  assert(/function companionComparison/.test(appAnswerSource), "Companion answer should compare the primary pick with its alternative");
  assert(/function createDecisionTools/.test(appDecisionsSource), "Decision workflow module is missing");
  assert(/function comparisonPair/.test(appDecisionsSource) && /function ratingQueueItems/.test(appDecisionsSource), "Comparison and rate-later state should share the decision workflow module");
  assert(!/function (selectTitleForComparison|toggleRatingQueueTitle|removeRatingQueueGame|comparisonGameByTitle)/.test(appSource), "Decision state logic should stay out of the app composition root");
  assert(/class="answer-comparison"/.test(appSource), "Companion comparison renderer is missing");
  assert(/id="game-comparison-result"/.test(html) && /function renderGameComparison/.test(appSource), "Discover should compare any two selected games");
  assert(/comparePriceLabel/.test(appAnswerSource) && /compareTimeDetail/.test(appAnswerSource), "Game comparison should include price and time tradeoffs");
  assert(/data-comparison-cover/.test(appSource) && /data-rating-queue-cover/.test(appSource), "Comparison and rating queue should render cover visuals");
  assert(/data-search-compare/.test(appSource), "Search results should feed the manual comparison");
  assert(/search-trust-detail/.test(appSource + css) && /trustSeedDetail/.test(i18nEnSource), "Search results should explain source trust per row");
  assert(/id="rating-queue-list"/.test(html) && /function renderRatingQueue/.test(appSource), "Taste should expose a separate rate-later queue");
  assert(/data-search-rate-later/.test(appSource), "Search results should feed the rate-later queue");
  assert(/ratingQueue/.test(appStateSource), "Rate-later queue should persist in profile state");
  assert(/for \(const phase of window\.PlaySputnikModulePhases\)/.test(html) && /Promise\.all\(phase\.map/.test(html), "App modules should boot through dependency phases with parallel loading");
  assert(/src\/app-decisions\.js/.test(appLoadSource), "Decision workflow module should load before app.js");
  assert(/src\/module-manifest\.js/.test(html), "HTML should load the shared module manifest");
  assert(/importScripts\("\.\/src\/module-manifest\.js"\)/.test(swSource), "Service Worker should consume the shared module manifest");
  assert(/PlaySputnikModules\.map/.test(swSource), "Service Worker should derive module cache entries from the manifest");
  assert(/function personalRatingBadge/.test(appRecommendSource), "Cards and search should share an honest personal rating badge");
  assert(/if \(!forecast\.calibrated\) return null/.test(appRecommendSource), "Rating badges must stay hidden until the forecast is calibrated");
  assert(/personal-rating-badge/.test(appCardsSource + appSource + css), "Personal rating badges should render in cards and search");
  assert(/hasRankingBaseline/.test(appRecommendSource), "Ranking forecast should require a ranking baseline");
  assert(/narrative\.recommend\.forecastFitLabel/.test(appRecommendSource), "Ranking forecast should fall back to fit tier without a ranking");
  assert(/class="rank-forecast"/.test(appSource), "Ranking forecast renderer is missing");
  assert(/function firstRunBridge/.test(appAnswerSource), "First-run answer bridge is missing");
  assert(/function tasteGateState/.test(appOnboardingSource), "Known-games minimum gate is missing");
  assert(/function quickTasteSignalCount/.test(appOnboardingSource), "Known-games gate should distinguish taste signals from skipped games");
  assert(/function knownGamesTasteSummary/.test(appOnboardingSource), "Known-games taste summary is missing");
  assert(/id="entry-route-proof"/.test(html), "Entry route proof panel is missing");
  assert(/No account/.test(html), "Quick route should reassure that no account is needed");
  assert(/fewer duplicate buys/.test(html), "PSN route should explain purchase guardrails");
  assert(/Paste text/.test(html), "Deep route should accept pasted ratings");
  assert(/function entryLabel/.test(appEntrySource), "Entry label function is missing from entry module");
  assert(/function entryRouteProofCopy/.test(appEntrySource), "Entry route proof copy is missing from entry module");
  assert(/settings\.entry\.proofInitialLabel/.test(appEntrySource) && /Usable after \{target\} signals/.test(i18nEnSource), "Entry proof should communicate fast-start threshold");
  assert(/First hypothesis/.test(appAnswerSource + appEntrySource + html), "Quick onboarding should call the early payoff a hypothesis");
  assert(/PlaySputnikEntry/.test(appEntrySource), "Entry module must export PlaySputnikEntry");
  assert(/PlaySputnikEntry/.test(appSource), "app.js must reference PlaySputnikEntry");
  assert(!/function entryRouteProofCopy/.test(appSource), "entryRouteProofCopy must not remain in app.js");
  assert(/Mixed first hypothesis/.test(appAnswerSource + appOnboardingSource + appSource + i18nEnSource), "Quick onboarding should avoid overclaiming contradictory signals");
  assert(/function renderQuickSwipeDeck/.test(appSource), "Swipe-style quick taste deck renderer is missing");
  assert(/data-swipe-reaction="unplayed"/.test(appSource), "Swipe deck should support not-played answers");
  assert(/function renderTasteGate/.test(appSource), "Known-games gate renderer is missing");
  assert(/taste-maturity/.test(appSource), "Known-games maturity message is missing");
  assert(/taste-gate-insights/.test(appSource), "Known-games taste insights renderer is missing");
  assert(/data-first-run-action/.test(appAnswerSource + appSource), "First-run bridge actions are missing");
  assert(/first-run-mini-agenda/.test(appAnswerSource + appSource), "First-run mini answer agenda is missing");
  assert(/data-first-run-verdict/.test(appSource), "First-run payoff should render a visible verdict block");
  assert(/narrative\.firstRun\.verdictLearned/.test(appAnswerSource), "First-run payoff should explain what was learned");
  assert(/narrative\.firstRun\.verdictUse/.test(appAnswerSource), "First-run payoff should tell the user they can act now");
  assert(/narrative\.firstRun\.titleTaste/.test(appAnswerSource), "First-run payoff should name the first read as a concrete pick");
  assert(/titleTasteEarly/.test(appAnswerSource) && /summaryTasteEarlyDetail/.test(i18nEnSource), "Early first pick should be framed as a test, not a final ranking");
  assert(/data-first-run-journey/.test(appSource), "First-run payoff should expose the core journey rail");
  assert(/hero-decision-strip/.test(appCardsSource + css), "Top-pick hero should expose a scan-friendly decision strip");
  assert(/is-early-pick/.test(appCardsSource + css), "Top-pick hero should mark early 5-signal picks distinctly");
  assert(/narrative\.firstRun\.journeyHead/.test(appSource), "Core journey should tell the user what to do next");
  assert(/detail-pick/.test(appAnswerSource + appSource), "Core journey should open the recommended detail cockpit");
  assert(/discover-pick/.test(appAnswerSource + appSource), "Core journey should continue into Discover search");
  assert(/core-journey-smoke/.test(coreJourneySmokeSource), "Core journey smoke test is missing");
  assert(/data-first-run-journey/.test(coreJourneySmokeSource), "Core journey smoke should verify the journey rail");
  assert(/data-detail-cockpit/.test(coreJourneySmokeSource), "Core journey smoke should verify the detail cockpit");
  assert(/id="demo-continuity-panel"/.test(html), "Demo continuity panel is missing");
  assert(/id="demo-continuity-metrics"/.test(html), "Demo continuity metrics are missing");
  assert(/function applyDemoProfile/.test(appSource), "Demo profile loader is missing");
  assert(/continuityAction/.test(appSource), "Continuity actions are missing");
  assert(/Sample profile live/.test(appSource + i18nEnSource), "Demo profile should read like a product review mode");
  assert(/demo-profile-smoke/.test(demoProfileSmokeSource), "Demo profile smoke test is missing");
  assert(/data-continuity-action="load-demo"/.test(demoProfileSmokeSource), "Demo smoke should verify loading a demo profile through a stable hook");
  assert(/data-continuity-action="discover"/.test(demoProfileSmokeSource), "Demo smoke should verify Discover continuity");
  assert(/function firstRunTasteProof/.test(appAnswerSource), "First-run taste proof is missing");
  assert(/first-run-taste-proof/.test(appAnswerSource + appSource), "First-run taste proof renderer is missing");
  assert(/first-run-value-contract/.test(appSource + css), "First-run pre-swipe screen should expose a compact value contract");
  assert(/id: "more-signal"/.test(appAnswerSource), "First-run more-signal action is missing");
  assert(/function bestLibraryPick/.test(appLibrarySource), "Library-first primary pick is missing");
  assert(/function primaryDecisionGame/.test(appLibrarySource), "Primary decision game selector is missing");
  assert(/decisionRationale\(topGame\)/.test(appAnswerSource) && /decisionRationale\(topGame\)/.test(appLibrarySource), "Today and Library should share decision rationale");
  assert(/library-first/.test(appLibrarySource + appAnswerSource + appSource + i18nEnSource), "Companion answer should expose library-first mode");
  assert(/userGames/.test(appSource), "Normalized user-game memory store is missing");
  assert(/function effectiveUserGame/.test(appSource), "Effective user-game resolver is missing");
  assert(/src\/app-state\.js/.test(appLoadSource) && /PlaySputnikState/.test(appSource), "State module is not wired into app.js");
  assert(/CURRENT_STATE_VERSION = 4/.test(appStateMigrationsSource), "Persisted state schema version is missing");
  assert(/function migrateState/.test(appStateMigrationsSource), "Persisted state migration pipeline is missing");
  assert(/const migrations = stateMigrations \|\|/.test(appStateSource), "State hydration should tolerate a cached pre-migration HTML shell");
  assert(/migrations\.migrateState/.test(appStateSource), "State hydration must pass through schema migrations");
  assert(/stateVersion: migrations\.CURRENT_STATE_VERSION/.test(appStateSource), "State saves must record the active schema version");
  assert(/providerSearchCache/.test(appStateSource + appStateMigrationsSource + appSource), "Provider search cache should persist across reloads");
  assert(/providerSearchCacheRecord/.test(appSource) && /rememberProviderSearch/.test(appSource), "Provider search cache read/write helpers are missing");
  assert(/function userStateToUserGame/.test(appStateSource), "Legacy state to user-game mapper is missing");
  assert(/function recordUserEvent/.test(appStateSource), "User event log is missing");
  assert(/completionStatus/.test(appStateSource), "User-game memory should separate completion status");
  assert(/access/.test(appStateSource), "User-game memory should separate access state");
  assert(/function setGameRating/.test(appSource), "My Games should support personal rating updates");
  assert(/id="my-games-dashboard"/.test(html), "Library view should expose a My Games dashboard");
  assert(/data-library-filter="active"/.test(html) && /data-library-filter="access"/.test(html), "Library queue filters are missing");
  assert(dataHealth.issueTriage?.mode === "price_gap_only", "Data health should classify current issues as price gaps only");
  assert(dataHealth.issueTriage?.criticalIssueCount === 0, "Data health should expose zero critical issues for current catalog");
  assert(/Issue triage/.test(appDataPanelSource + i18nEnSource), "Data workbench should explain issue triage");
  assert(/provider-import-list/.test(html) && /renderProviderImports/.test(appDataPanelSource), "Data view should expose provider import review");
  assert(/data-provider-import-action/.test(appDataPanelSource) && /applyProviderImportAction/.test(appSource), "Provider imports should have review actions wired to persisted memory");
  assert(/providerImportFilter/.test(appDataPanelSource) && /providerImportFilterMatches/.test(appDataPanelSource), "Provider imports should expose working review filters");
  assert(/open-wishlist/.test(appDataPanelSource + appSource) && /providerWishlistPath/.test(searchMemorySmokeSource), "Accepted provider imports should guide users into Wishlist");
  assert(!/kind: "alias_partial"/.test(appSearchSource + searchProviderSource), "Search scoring should not accept broad alias_partial matches");
  assert(/Price gaps/i.test(appDataPanelSource + i18nEnSource), "Data workbench should distinguish price gaps from critical issues");
  assert(/function libraryDashboardCards/.test(appLibrarySource), "Library dashboard cards are missing");
  assert(/function libraryLaneForGame/.test(appLibrarySource), "Library queue lanes are missing");
  assert(/function libraryNextStep/.test(appLibrarySource), "Library rows should explain the next step");
  assert(/function libraryFilterMatches/.test(appLibrarySource), "Library queue filter logic is missing");
  assert(/function renderLibraryDashboard/.test(appSource), "Library dashboard renderer is missing");
  assert(/id="my-games-command"/.test(html), "Library view should expose a working command bar");
  assert(/function renderLibraryCommand/.test(appSource), "Library command bar renderer is missing");
  assert(/data-library-command-filter/.test(appSource), "Library command bar should switch queue lanes");
  assert(/library-command/.test(css), "Library command bar should be styled");
  assert(/my-game-facets/.test(appSource), "My Games should show separate access/progress/rating facets");
  assert(/library-next-step/.test(appSource + css), "My Games should show next-step guidance");
  assert(/library-plan-step/.test(appSource + css), "Library plan should read as ordered next steps");
  assert(/library-plan-primary/.test(appSource + css), "Library plan rows should expose a primary action");
  assert(/my-game-quick-actions/.test(appSource + css), "My Games should expose compact quick actions");
  assert(/my-game-more-actions/.test(appSource + css), "My Games should hide advanced states behind a disclosure");
  assert(/data-memory-rating/.test(appSource), "My Games rating controls are missing");
  assert(/id="wishlist-dashboard"/.test(html), "Wishlist view should expose a dashboard");
  assert(/data-wishlist-filter="verify"/.test(html) && /data-wishlist-filter="missing"/.test(html), "Wishlist queue filters are missing");
  assert(/function wishlistIntentRecords/.test(appWishlistSource), "Wishlist triage records are missing");
  assert(/function wishlistDecision/.test(appWishlistSource), "Wishlist decision labels are missing");
  assert(/function wishlistFilterMatches/.test(appWishlistSource), "Wishlist queue filter logic is missing");
  assert(/function wishlistExternalSourceHtml/.test(appSource) && /data-wishlist-source-note/.test(appSource + searchMemorySmokeSource), "Wishlist should explain external RAWG source trust");
  assert(/data-wishlist-state="owned_forever"/.test(appSource), "Wishlist rows should support bought-state actions");
  assert(/function priceWatchRecord/.test(appWishlistSource), "Price watch record normalizer is missing");
  assert(/function priceWatchRecords/.test(appWishlistSource), "Price watch queue builder is missing");
  assert(/function customPriceWatchTarget/.test(appWishlistSource), "Price watch should read per-game custom targets");
  assert(/function priceWatchTarget/.test(appWishlistSource), "Price watch should resolve custom-or-budget targets");
  assert(/targetPrice/.test(appWishlistSource), "Price watch should expose target price");
  assert(/isBelowTarget/.test(appWishlistSource), "Price watch should flag target hits");
  assert(/watchReason/.test(appWishlistSource), "Price watch should expose watch reason");
  assert(/data\/price-history\.json/.test(appSource), "Price history data source is missing");
  assert(/function historicalLowForGame/.test(appWishlistSource), "Historical low calculator is missing");
  assert(/function historicalLowCopy/.test(appWishlistSource), "Historical low display copy is missing");
  assert(/priceWatch: normalizePriceWatchRecord/.test(appStateSource), "User-game memory should persist price watch targets");
  assert(/function setPriceWatchTarget/.test(appSource), "App should support setting price watch targets");
  assert(/function clearPriceWatchTarget/.test(appSource), "App should support clearing price watch targets");
  assert(/data-price-target-input/.test(appSource), "Price target input is missing from Wishlist/detail UI");
  assert(/data-price-target-clear/.test(appSource), "Price target clear action is missing");
  assert(/price-alert/.test(css), "Price alert controls should be styled");
  assert(/price-alert-summary/.test(appSource + css), "Price alert should have a readable status summary");
  assert(/price-alert-input-wrap/.test(appSource + css), "Price alert should have a compact currency input wrapper");
  assert(/function waitForAppReady/.test(libraryWishlistSmokeSource), "Library/Wishlist smoke should wait for deferred render before seeding");
  assert(/function writeStoredState/.test(libraryWishlistSmokeSource), "Library/Wishlist smoke should seed localStorage and IndexedDB together");
  assert(/isHistoricalLow/.test(appWishlistSource), "Price watch should flag current historical lows");
  assert(/function restoreBacklogAmnesty/.test(appSource), "Backlog amnesty restore action is missing");
  assert(/data-amnesty-restore/.test(appSource), "Backlog amnesty restore UI is missing");
  assert(/BACKLOG_AMNESTY_KEEP_COOLDOWN_SKIPS/.test(appSource), "Backlog amnesty keep cooldown tuning is missing");
  assert(/stats-mini-action/.test(appSource + css), "Stats should expose an amnesty restore action");
  assert(/function undoLastAction/.test(appSource), "Undo handler is missing");
  assert(/data-undo-last/.test(appAnswerSource + appSource), "Undo action button is missing");
  assert(/http\.get/.test(previewServerSource), "Preview server health should use a real GET check");
  assert(/--restart/.test(previewServerSource), "Preview server script should support restart mode");
  assert(/lsof/.test(previewServerSource), "Preview server script should inspect the 4190 listener");
  assert(/http\.server/.test(previewServerSource), "Preview server script should restart Python http.server");
  assert(/empty_or_bad_response/.test(previewServerSource), "Preview server script should detect empty/bad GET responses");
  assert(/function companionAlternatives/.test(appAnswerSource), "Companion answer alternatives are missing");
  assert(/answer-agenda/.test(appSource), "Companion answer agenda renderer is missing");
  assert(/data-agenda-action/.test(appSource), "Companion answer agenda actions are missing");
  assert(/function runAnswerAction/.test(appSource), "Shared companion answer action handler is missing");
  assert(/narrative\.answer\.guardLabel/.test(appAnswerSource), "Companion buy guardrail is missing");
  assert(/class="personal-evidence card-evidence"/.test(html), "Card personal evidence slot is missing");
  assert(/id="visual-catalog-list"/.test(html), "Visual catalog panel is missing");
  assert(/id="visual-catalog-metrics"/.test(html), "Visual catalog metrics are missing");
  assert(/data-visual-shelf="smart"/.test(html), "Visual catalog shelf controls are missing");
  assert(/visualCatalogShelf/.test(appSource), "Visual catalog shelf state is missing");
  assert(/VISUAL_CATALOG_SHELVES/.test(appSource), "Visual catalog shelf labels are missing");
  assert(/function visualCatalogStats/.test(appVisualSource), "Visual catalog metrics builder is missing");
  assert(/dataset\.visualTitle/.test(appSource), "Visual catalog cards should expose stable game title metadata");
  assert(/aria-pressed/.test(appSource), "Visual catalog shelf and action buttons should expose pressed state");
  assert(/function posterTheme/.test(appCoverSource), "Generated poster theme classifier is missing");
  assert(/function generatedPosterBackground/.test(appCoverSource), "Generated poster background builder is missing");
  assert(/function renderVisualCatalog/.test(appSource), "Visual catalog renderer is missing");
  assert(/data-poster-theme/.test(css) || /dataset\.posterTheme/.test(appSource + appCardsSource), "Poster cards should expose generated poster theme");
  assert(/visual-catalog-card/.test(appSource + css), "Visual catalog poster cards are missing");
  assert(/data-visual-state="completed"/.test(appSource), "Visual catalog should support quick Done actions");
  assert(/visual-catalog-toolbar/.test(css), "Visual catalog shelf controls should be styled");
  assert(/visual-catalog-meta/.test(css), "Visual catalog cards should show library metadata");

  // Radar module
  assert(/function rankedRadar/.test(appRadarSource), "Taste radar ranker is missing");
  assert(/function rankedMonthlyDrop/.test(appRadarSource), "Monthly drop ranker is missing");
  assert(/function radarScore/.test(appRadarSource), "Radar scoring function is missing");
  assert(/function dropScore/.test(appRadarSource), "Drop scoring function is missing");
  assert(/function importedTasteScore/.test(appRadarSource), "Imported taste score function is missing");
  assert(/function stripNotebookMarker/.test(appRadarSource), "Notebook marker stripper is missing");
  assert(/function notebookSection/.test(appRadarSource), "Notebook section detector is missing");
  assert(/function parseRatingLine/.test(appRadarSource), "Rating line parser is missing");
  assert(/function cleanImportedTitle/.test(appRadarSource), "Taste import should clean noisy pasted rating lines");
  assert(/function findRatedGame/.test(appRadarSource), "Rated game lookup is missing");
  assert(/function rememberImportedRating/.test(appSource), "Rating imports should become persistent personal rating memory");
  assert(/taste-import-rank-shape/.test(appSource + css), "Ranked-list import preview should show top/middle/tail shape");
  assert(/taste-import-misses/.test(appSource + css), "Taste import preview should explain unresolved titles");
  assert(/taste-import-resolution/.test(appSource + css), "Taste import preview should split anchors, known-source hits, and lookup misses");
  assert(/id="taste-import-report"/.test(html), "Taste import should expose a separate post-import report panel");
  assert(/function renderTasteImportReport/.test(appSource), "Taste import report renderer is missing");
  assert(/taste-import-report-metrics/.test(css), "Taste import report should style coverage metrics");
  assert(/taste-import-report-bars/.test(css + appSource), "Taste import report should render visual coverage bars");
  assert(/taste-import-preview-story/.test(css + appSource), "Taste import preview should explain the practical import payoff");
  assert(/id="demo-ratings"/.test(html) && /DEMO_RATING_LINES/.test(appSource), "Taste import should expose a 10-game demo profile path");
  assert(/demoRatings\?\.[\s\S]*openAppView\("today"\)/.test(appSource), "Taste demo profile should land on Today after import");
  assert(/data-import-search-title/.test(appSource), "Taste import unresolved rows should offer one-click search");
  assert(/game-search-focus/.test(appSource + css), "Discover search should expose a best-match focus card");
  assert(/data-focus-state/.test(appSource), "Discover focus card should let users save the best match directly");
  assert(founderProviderCoverage.mode === "founder-ranking-provider-coverage", "Founder provider coverage report is missing");
  assert(founderProviderCoverage.summary?.total >= 100, "Founder provider coverage should use the full real ranking");
  assert(founderProviderCoverage.summary?.manualFallback === 0, "Founder provider coverage should have zero manual fallback rows");
  assert(founderProviderCoverage.summary?.rawgMatched === founderProviderCoverage.summary?.total, "Founder provider coverage should resolve every ranking row through RAWG when report is generated");
  assert(/function sourceForLayer/.test(appRadarSource), "Source-for-layer helper is missing");
  assert(/function freshnessLabel/.test(appRadarSource), "Freshness label helper is missing");
  assert(/PlaySputnikRadar/.test(appRadarSource), "Radar module must export PlaySputnikRadar");
  assert(/PlaySputnikRadar/.test(appSource), "app.js must reference PlaySputnikRadar");
  assert(!/function rankedRadar/.test(appSource), "rankedRadar must not remain in app.js");
  assert(!/function dropScore/.test(appSource), "dropScore must not remain in app.js");
  assert(!/function importedTasteScore/.test(appSource), "importedTasteScore must not remain in app.js");

  assert(/id="game-detail"/.test(html), "Game detail drawer markup is missing");
  assert(/function openGameDetail/.test(appSource), "Game detail opener is missing");
  assert(/function renderGameDetail/.test(appSource), "Game detail renderer is missing");
  assert(/function detailPrimaryMove/.test(appSource), "Game detail primary move helper is missing");
  assert(/function detailCockpitHtml/.test(appSource), "Game detail cockpit model renderer is missing");
  assert(/function detailBodyHtml/.test(appDetailViewSource), "Game detail markup should live in app-detail-view.js");
  assert(/detailBodyHtml\(\{/.test(appSource), "Game detail orchestration should delegate markup to the view module");
  assert(!/class="game-detail-status"/.test(appSource), "Large game-detail markup should stay out of app.js");
  assert(/narrative\.detail\.whyNow/.test(appSource) && /narrative\.detail\.sameLogic/.test(appDetailViewSource), "Detail cockpit should reuse the shared decision rationale");
  assert(/function detailTasteFitHtml/.test(appSource), "Game detail taste fit renderer is missing");
  assert(/function detailSourceTrustRows/.test(appSource), "Game detail source trust helper is missing");
  assert(/function detailProviderImportHtml/.test(appSource), "Game detail RAWG/provider import summary is missing");
  assert(/localNarrative/.test(appAiSource) && /localDetail/.test(i18nEnSource), "AI narrative should expose a free localized fallback");
  assert(/localCompanionRanked/.test(appAiSource + i18nEnSource), "Local companion fallback should use imported rankings when available");
  assert(/localCompanionRankedShort/.test(appAiSource + i18nEnSource) && /localCompanionRankedLong/.test(appAiSource + i18nEnSource), "Local companion fallback should vary wording by game commitment");
  assert(/function detailPrimaryCtaHtml/.test(appSource), "Game detail smart primary CTA renderer is missing");
  assert(/function runDetailPrimaryAction/.test(appSource), "Game detail smart primary CTA action handler is missing");
  assert(/function applyDetailState/.test(appSource), "Game detail shared state applier is missing");
  assert(/data-detail-cockpit/.test(appSource), "Game detail cockpit slot is missing");
  assert(/data-detail-primary-action/.test(appSource), "Game detail primary CTA is missing");
  assert(/data-primary-kind/.test(appSource), "Game detail primary CTA should expose its action kind");
  assert(/data-detail-taste-fit/.test(appSource), "Game detail taste fit slot is missing");
  assert(/data-detail-source-trust/.test(appDetailViewSource), "Game detail source trust slot is missing");
  assert(/data-detail-provider-import/.test(appDetailViewSource + appSource), "Game detail provider import slot is missing");
  assert(/detail-atom-signal/.test(appSource + appDetailViewSource + css), "Game detail atom signal chips are missing");
  assert(/\["subscription", t\("narrative\.detail\.actionPlus"\)\]/.test(appSource), "Game detail should support subscription-state actions");
  assert(/\["owned_forever", t\("narrative\.detail\.actionBought"\)\]/.test(appSource), "Game detail should support bought-state actions");
  assert(/data-hero-detail/.test(appSource + appCardsSource) && /data-visual-detail/.test(appSource + appVisualSource), "Game detail entry points are missing");
  assert(/game-detail-drawer/.test(css), "Game detail drawer should be styled");
  assert(/game-detail-header/.test(css) && /game-detail-ai/.test(css), "Game detail should keep the polished header and AI surface styled");
  assert(/\.game-detail-drawer/.test(css) && /var\(--shadow-lg\)/.test(css), "Game detail drawer should keep the premium shell polish");
  assert(/data-quality-panel/.test(css) && /provider-import-filters/.test(css), "Data view should keep the source-trust cockpit styling");
  assert(/data-guide-panel/.test(html + css), "Data view should expose a priority guide panel");
  assert(/data-guide-card/.test(html + css), "Data view priority guide cards should be styled");
  assert(/styles\/foundation\.css/.test(html) && /styles\/themes\.css/.test(html), "HTML should load split CSS directly");
  assert(/@import url\("styles\/foundation\.css"\)/.test(cssCompatSource), "styles.css should remain a cached-shell compatibility entrypoint");
  assert(/visual-catalog-smoke/.test(visualCatalogSmokeSource), "Visual catalog smoke test is missing");
  assert(/data-visual-shelf="catalog"/.test(visualCatalogSmokeSource), "Visual catalog smoke should verify shelf switching");
  assert(/data-visual-state="playing"/.test(visualCatalogSmokeSource), "Visual catalog smoke should verify quick Play actions");
  assert(/onboardingSurface/.test(appViewSmokeSource + visualCatalogSmokeSource + css + designSmokeSource) || /firstRun/.test(designSmokeSource), "Design smoke should tolerate the visible first-run onboarding surface");
  assert(/appNavOverflow/.test(designSmokeSource), "Design smoke should guard against mobile app nav overflow");
  assert(/json\/close/.test(cdpHarnessSource) && /await cdp\.close\(\)/.test(cdpHarnessSource), "Shared browser gates must close each Chrome target before opening the next");
  assert(/game-detail-smoke/.test(gameDetailSmokeSource), "Game detail smoke test is missing");
  assert(/data-detail-state="playing"/.test(gameDetailSmokeSource), "Game detail smoke should verify Play action persistence");
  assert(/data-detail-cockpit/.test(gameDetailSmokeSource), "Game detail smoke should verify decision cockpit");
  assert(/data-detail-primary-action/.test(gameDetailSmokeSource), "Game detail smoke should verify smart primary CTA");
  assert(/detail-source-row/.test(gameDetailSmokeSource), "Game detail smoke should verify source trust rows");
  assert(/search-memory-smoke/.test(searchMemorySmokeSource), "Search-to-memory smoke test is missing");
  assert(/data-search-detail/.test(searchMemorySmokeSource), "Search-to-memory smoke should verify Details from search");
  assert(/data-search-memory-panel/.test(searchMemorySmokeSource), "Search-to-memory smoke should verify search memory confirmation");
  assert(/data-search-state="saved"/.test(searchMemorySmokeSource), "Search-to-memory smoke should verify direct Wishlist from search");
  assert(/data-detail-state="subscription"/.test(searchMemorySmokeSource), "Search-to-memory smoke should verify Plus persistence");
  assert(/data-detail-provider-import/.test(searchMemorySmokeSource), "Search-to-memory smoke should verify RAWG provider detail");
  assert(/production-smoke/.test(productionSmokeSource), "Production smoke test is missing");
  assert(/data-search-memory-panel/.test(productionSmokeSource), "Production smoke should verify search memory UI");
  assert(/data-health\.json/.test(productionSmokeSource), "Production smoke should verify published data health");
  assert(/editorial-ru\.json/.test(productionSmokeSource), "Production smoke should verify published Russian editorial data");
  assert(/app-i18n\.js/.test(productionSmokeSource) && /i18n-ru\.js/.test(productionSmokeSource), "Production smoke should verify taxonomy localization assets");
  assert(/module-manifest/.test(productionSmokeSource) && /app-state-migrations/.test(productionSmokeSource), "Production smoke should verify manifest-backed state boot");
  assert(/CACHE_VERSION = "v\\d\+"/.test(productionSmokeSource), "Production smoke should verify versioned service worker");
  assert(/production-browser-smoke/.test(productionBrowserSmokeSource), "Production browser smoke test is missing");
  assert(/remote-debugging-port/.test(productionBrowserSmokeSource), "Production browser smoke should use a real headless browser");
  assert(/data-search-state="saved"/.test(productionBrowserSmokeSource), "Production browser smoke should verify direct search Wishlist");
  assert(/rawgCoverPreviews/.test(productionBrowserSmokeSource) && /data-detail-provider-import/.test(productionBrowserSmokeSource), "Production browser smoke should verify live RAWG search/detail flow");
  assert(/data-detail-cockpit/.test(productionBrowserSmokeSource), "Production browser smoke should verify the detail cockpit");
  assert(/production-smoke-test\.mjs/.test(deployPagesWorkflowSource), "Pages deploy should run production smoke after deployment");
  assert(/production-browser-smoke-test\.mjs/.test(deployPagesWorkflowSource), "Pages deploy should run production browser smoke after deployment");
  assert(/push:/.test(deployBackendWorkflowSource) && /backend\/\*\*/.test(deployBackendWorkflowSource), "Backend deploy should run automatically for backend changes");
  assert(/backend-worker-test\.mjs/.test(deployBackendWorkflowSource), "Backend deploy should run its contract test");
  assert(/backend-live-monitor\.mjs/.test(deployBackendWorkflowSource), "Backend deploy should verify the live Worker");
  assert(/CLOUDFLARE_API_TOKEN/.test(deployBackendWorkflowSource) && /CLOUDFLARE_ACCOUNT_ID/.test(deployBackendWorkflowSource), "Backend deploy credentials are not wired");
  assert(/schedule:/.test(monitorBackendWorkflowSource) && /23 \*\/6 \* \* \*/.test(monitorBackendWorkflowSource), "Backend monitor schedule is missing");
  assert(/issues: write/.test(monitorBackendWorkflowSource), "Backend monitor should manage incident issues");
  assert(/Backend health: failing/.test(monitorBackendWorkflowSource), "Backend monitor issue lifecycle is missing");
  assert(/sourceHealth/.test(backendLiveMonitorSource) && /x-playsputnik-cache/.test(backendLiveMonitorSource), "Backend monitor should verify provider health and edge cache");
  assert(/untrusted\.example/.test(backendLiveMonitorSource) && /403/.test(backendLiveMonitorSource), "Backend monitor should verify CORS rejection");
  assert(/search-quality-matrix/.test(searchQualityMatrixSource), "Search quality matrix is missing");
  assert(/alias-gta-6/.test(searchQualityMatrixSource), "Search quality matrix should cover GTA aliases");
  assert(/ru-tsushima/.test(searchQualityMatrixSource) && /ru-last-of-us/.test(searchQualityMatrixSource), "Search quality matrix should cover Russian aliases");
  assert(/ru-rdr2-short/.test(searchQualityMatrixSource) && /ru-outer-worlds/.test(searchQualityMatrixSource), "Search quality matrix should cover founder Russian/shorthand aliases");
  assert(/alias-kcd1/.test(searchQualityMatrixSource) && /alias-abzu/.test(searchQualityMatrixSource), "Search quality matrix should cover imported-rating shorthand aliases");
  assert(/ru-cyberpunk/.test(searchQualityMatrixSource) && /ru-metro-exodus/.test(searchQualityMatrixSource), "Search quality matrix should cover Russian imported-rating aliases");
  assert(/fixture-firewatch/.test(searchQualityMatrixSource) && /fixture-man-of-medan/.test(searchQualityMatrixSource), "Search quality matrix should cover founder RAWG-promoted search fixtures");
  assert(/fixture-sword-sea/.test(searchQualityMatrixSource) && /fixture-murdered/.test(searchQualityMatrixSource), "Search quality matrix should cover newly promoted founder lookup fixtures");
  assert(/fixture-fortnite/.test(searchQualityMatrixSource) && /fixture-factorio/.test(searchQualityMatrixSource), "Search quality matrix should cover mainstream diagnostic fixtures");
  assert(/alias-cs2/.test(searchQualityMatrixSource) && /alias-botw/.test(searchQualityMatrixSource), "Search quality matrix should cover short mainstream aliases");
  assert(/alias-totk/.test(searchQualityMatrixSource) && /alias-jedi-fallen-order/.test(searchQualityMatrixSource), "Search quality matrix should cover demo-quality shorthand aliases");
  assert(/Fortnite/.test(searchFixtureMainstreamDiagnosticFixture) && /Factorio/.test(searchFixtureMainstreamDiagnosticFixture), "Mainstream diagnostic search fixture import source is missing");
  assert(/typo-balders/.test(searchQualityMatrixSource), "Search quality matrix should cover typo tolerance");
  assert(/alias_manual/.test(searchQualityMatrixSource), "Search quality matrix should cover alias manual fallback");
  assert(/id="taste-understood-panel"/.test(html), "Today should expose an imported-taste understood panel");
  assert(/function renderTasteUnderstoodPanel/.test(appSource), "Imported taste understood panel should be rendered from real taste state");
  assert(/taste-understood-panel/.test(css), "Imported taste understood panel should be styled");
  assert(/library-wishlist-smoke/.test(libraryWishlistSmokeSource), "Library/Wishlist smoke test is missing");
  assert(/markBoughtThroughAppMemory/.test(libraryWishlistSmokeSource), "Library/Wishlist smoke should verify bought persistence");
  assert(/actionButtons/.test(libraryWishlistSmokeSource), "Library/Wishlist smoke should verify quick action buttons");
  assert(/libraryFiltered/.test(libraryWishlistSmokeSource) && /wishlistFiltered/.test(libraryWishlistSmokeSource), "Library/Wishlist smoke should verify filters");
  assert(/library-dashboard-card/.test(css) && /wishlist-dashboard-card/.test(css), "Library and Wishlist dashboards should be styled");
  assert(/queue-toolbar/.test(css) && /queue-lane/.test(css), "Queue filters and compact lane states should be styled");
  assert(/function coverSourceLabel/.test(appCoverSource), "Visual catalog should expose cover source labels");
  assert(/function renderCoverSourceInto/.test(appSource + appCardsSource), "Cover source attribution should render through a DOM helper");
  assert(/hero-cover-source/.test(appSource + appCardsSource + css), "Hero cover candidates should have source attribution");
  assert(/data-hero-primary/.test(appCardsSource) && /hero-primary-cta/.test(appCardsSource + css), "Top-pick hero should expose one primary CTA");
  assert(/card-cover-source/.test(html + appSource + appCardsSource + css), "Recommendation cards should have source attribution");
  assert((/target = "_blank"/.test(appSource) || /target = "_blank"/.test(appCardsSource)) && (/sourceUrl/.test(appSource) || /sourceUrl/.test(appCardsSource)), "RAWG source attribution should link to sourceUrl");
  assert(/narrative\.detail\.sourceNamed/.test(appCoverSource) && /RAWG/.test(appCoverSource), "RAWG cover candidates should be visibly attributed in localized UI copy");
  assert(catalogSources.coverPolicy.selectedPath.some((step) => step.id === "rawg_cover_candidate"), "Catalog source policy should select RAWG as the early cover candidate path");
  assert(catalogSources.coverPolicy.attribution.rawg.includes("sourceUrl"), "RAWG attribution policy should require sourceUrl links");
  assert(/RAWG_API_KEY/.test(coverResolverSource), "Cover resolver should use an optional RAWG_API_KEY");
  assert(/loadLocalEnv/.test(coverResolverSource), "Cover resolver should read local env config");
  assert(/function parseEnvText/.test(localEnvSource), "Local env loader should parse .env.local without dependencies");
  assert(/process\.env\[key\] === undefined/.test(localEnvSource), "Local env loader should not override explicit environment variables");
  assert(/function rawgCoverCandidate/.test(coverResolverSource), "Cover resolver RAWG candidate adapter is missing");
  assert(/function rawgSearchRecords/.test(coverResolverSource), "Cover resolver should query multiple alias terms");
  assert(/function hasCompatibleNumberTokens/.test(coverResolverSource), "Cover resolver should guard numbered-title matches");
  assert(/function hasCompatibleQualifiers/.test(coverResolverSource), "Cover resolver should reject toolkit/demo-style cover matches");
  assert(/page_size", "10"/.test(coverResolverSource), "Cover resolver should request enough RAWG candidates for numbered sequels");
  assert(/status: "candidate"/.test(coverResolverSource), "Cover resolver should write candidate, not verified, cover status");
  assert(/Attribute RAWG/.test(coverResolverSource), "Cover resolver should preserve RAWG attribution notes");
  assert(/generated_poster/.test(coverResolverSource), "Cover resolver should keep generated poster fallback records");
  assert(/--write/.test(coverResolverSource), "Cover resolver should support explicit write mode");

  state = defaultState();
  state.quickReactions[titleKey("The Last of Us Part I")] = { title: "The Last of Us Part I", reaction: "loved" };
  state.quickReactions[titleKey("Disco Elysium")] = { title: "Disco Elysium", reaction: "not_for_me" };
  const tasteProfile = tasteEngineProfile();
  const discoScore = tasteEngineScore(profileGames.find((game) => game.title === "Disco Elysium"));
  assert(tasteProfile.positiveWeights.cinematic > 0, "Taste Engine should learn positive quick-swipe signals");
  assert(tasteProfile.negativeWeights.reading > 0, "Taste Engine should learn negative quick-swipe signals");
  assert(discoScore.caution < 0, "Taste Engine should apply caution to games matching rejected signals");
  state = defaultState();

  return { checkedIds: idSelectors.length, duplicateIds: duplicateIds.length };
}

function checkPsnScenario() {
  applyPsnDemoEntry();

  const psnStates = extractPsnDemoStates();
  const ranked = rankedGames();
  const plan = libraryPlan(ranked);
  const labels = plan.rows.map((row) => row.label);
  const demoStateValues = new Set(psnStates.map((item) => item.state));
  const buyTitles = buyCluster(ranked).map((game) => game.title);
  const availableTitles = games.filter(isAlreadyAvailable).map((game) => game.title);
  const primaryPick = primaryDecisionGame(ranked);

  assert(psnStates.length === 8, `Expected 8 PSN demo states, got ${psnStates.length}`);
  ["want_to_finish", "paused", "owned_forever", "dropped"].forEach((stateName) => {
    assert(demoStateValues.has(stateName), `PSN demo is missing ${stateName}`);
  });
  assert(state.activeCluster === "library", "PSN demo should switch to the Library cluster");
  ["Finish", "Resume", "Return later", "Use access", "Wishlist", "Memory"].forEach((label) => {
    assert(labels.includes(label), `Library plan is missing ${label}`);
  });
  assert(plan.playableCount >= 3, `Expected at least 3 playable games, got ${plan.playableCount}`);
  assert(plan.completedCount >= 1, `Expected at least 1 completed game, got ${plan.completedCount}`);
  assert(
    psnStates.some((item) => item.state === "dropped") && !ranked.some((game) => effectiveGameState(game) === "dropped"),
    "Dropped games should stay in memory but leave active recommendations",
  );
  assert(plan.savedCount >= 1, `Expected at least 1 saved game, got ${plan.savedCount}`);
  assert(!/Loading/i.test(plan.summary), "Library plan summary should not stay in Loading state");
  assert(
    availableTitles.every((title) => !buyTitles.some((buyTitle) => titleMatches(title, buyTitle))),
    "Already available games should be guarded out of the buy cluster",
  );
  assert(primaryPick, "PSN demo should produce a primary decision pick");
  assert(isAlreadyAvailable(primaryPick), `PSN primary pick should be playable from library, got ${primaryPick.title}`);

  const accessRow = plan.rows.find((row) => row.label === "Use access");
  assert(accessRow, "Expected a Use access row before action");
  setGameState(accessRow.title, "playing");

  const afterAction = libraryPlan(rankedGames());
  const updatedGame = games.find((game) => titleMatches(game.title, accessRow.title));
  const playingTitles = games.filter((game) => effectiveGameState(game) === "playing").map((game) => game.title);

  assert(effectiveGameState(updatedGame) === "playing", `${accessRow.title} should become Playing after Start`);
  assert(playingTitles.length >= 2, "Starting an access game should increase the playing queue");
  assert(afterAction.rows.some((row) => row.label === "Resume"), "Library plan should still offer Resume after Start");
  assert(!/Loading/i.test(afterAction.summary), "Library plan should not regress to Loading after state action");

  return {
    psnStates: psnStates.length,
    planLabels: labels,
    summary: plan.summary,
    started: accessRow.title,
    primaryPick: primaryPick.title,
    afterActionSummary: afterAction.summary,
  };
}

function checkCorePanels() {
  const ranked = rankedGames();
  const plan = libraryPlan(ranked);
  const generatedStatuses = [
    `${ranked.length} games`,
    plan.summary,
    `${plan.rows.length} library plan rows`,
    `${buyCluster(ranked).length} buy candidates`,
  ];
  assert(ranked.length > 0, "Ranked games should not be empty");
  assert(plan.rows.length >= 2, "Library plan should have at least two rows");
  assert(generatedStatuses.every((text) => !/Loading/i.test(text)), "Generated panel statuses should not contain Loading");
  return generatedStatuses;
}

function checkExternalRecommendationScenario() {
  state = defaultState();
  state.liked = new Set(["The Last of Us Part I", "God of War Ragnarok", "Hades", "Elden Ring"]);
  const title = "Black Myth: Wukong";
  state.userGames[titleKey(title)] = {
    title,
    saved: true,
    atoms: ["action", "challenge", "mythic", "soulslike"],
    vibe: "Mythic action challenge candidate",
    catalogStatus: "external_fixture",
    matchConfidence: "low",
    coverStatus: "missing",
    priceStatus: "missing",
    source: "search_prototype_external_index",
  };
  state.saved.add(title);
  state.userStates[titleKey(title)] = { title, state: "saved", updatedAt: "qa" };

  const ranked = rankedGames();
  const external = ranked.find((game) => titleMatches(game.title, title));
  const buyTitles = buyCluster(ranked).map((game) => game.title);
  const plan = libraryPlan(ranked);

  assert(external, "Saved external wishlist game should enter ranked recommendations");
  assert(external.externalCandidate, "Saved external recommendation should carry externalCandidate flag");
  assert(external.score > 0, `Saved external recommendation should have positive fit, got ${external.score}`);
  assert(!buyTitles.some((item) => titleMatches(item, title)), "External game with missing price should not enter buy cluster");
  assert(plan.savedCount >= 1, "Library plan should count saved external wishlist games");

  return {
    title: external.title,
    score: external.score,
    buyCandidates: buyTitles.length,
    savedCount: plan.savedCount,
  };
}

const selectorCheck = checkSelectors();
const chunkLabels = checkChunkLabels();
const psnScenario = checkPsnScenario();
const generatedStatuses = checkCorePanels();
const externalScenario = checkExternalRecommendationScenario();

console.log("QA harness passed.");
console.log(`- selectors: ${selectorCheck.checkedIds} ids checked, ${selectorCheck.duplicateIds} duplicate ids`);
console.log(`- Chunk labels: Stray -> ${chunkLabels.stray}; Hades -> ${chunkLabels.hades}`);
console.log(`- PSN demo: ${psnScenario.psnStates} states -> ${psnScenario.summary}`);
console.log(`- PSN primary: ${psnScenario.primaryPick}`);
console.log(`- Library plan: ${psnScenario.planLabels.join(" / ")}`);
console.log(`- State action: Start ${psnScenario.started} -> ${psnScenario.afterActionSummary}`);
console.log(`- Panel statuses: ${generatedStatuses.join(" | ")}`);
console.log(`- External recommendation: ${externalScenario.title} score ${externalScenario.score}, ${externalScenario.savedCount} saved, ${externalScenario.buyCandidates} buy candidates`);
