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

const DIAGNOSTIC_ONBOARDING_ATOMS = [
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
  "open-world",
  "sandbox",
  "rpg",
  "systems",
  "turn-based",
  "creative",
  "social",
  "service",
  "puzzle",
  "racing",
  "simulation",
];

let games = [];
let sourceStatus = null;
let dataHealth = null;
let devHealth = null;
let priceSnapshots = [];
let priceHistory = [];
let subscriptionAvailability = [];
let coverSnapshots = [];
let refreshPolicy = null;
let tasteRadar = [];
let monthlyDrop = [];
let dropCalendar = null;
let catalogWorkbench = null;
let catalogBackbone = null;
let searchSources = null;
let globalSearchFixtures = [];
let titleAliases = [];
let searchIndexStatus = "loading";
let deferredRenderTicket = 0;

if (!window.PlaySputnikStorage) {
  throw new Error("PlaySputnikStorage must load before app.js");
}

if (!window.PlaySputnikConfig) {
  throw new Error("PlaySputnikConfig must load before app.js");
}

if (!window.PlaySputnikState) {
  throw new Error("PlaySputnikState must load before app.js");
}

if (!window.PlaySputnikSearch) {
  throw new Error("PlaySputnikSearch must load before app.js");
}

if (!window.PlaySputnikEnrichment) {
  throw new Error("PlaySputnikEnrichment must load before app.js");
}

if (!window.PlaySputnikScore) {
  throw new Error("PlaySputnikScore must load before app.js");
}
if (!window.PlaySputnikRecommend) {
  throw new Error("PlaySputnikRecommend must load before app.js");
}
if (!window.PlaySputnikRanking) {
  throw new Error("PlaySputnikRanking must load before app.js");
}
if (!window.PlaySputnikAnswer) {
  throw new Error("PlaySputnikAnswer must load before app.js");
}
if (!window.PlaySputnikLibrary) {
  throw new Error("PlaySputnikLibrary must load before app.js");
}
if (!window.PlaySputnikVisual) {
  throw new Error("PlaySputnikVisual must load before app.js");
}
if (!window.PlaySputnikWishlist) {
  throw new Error("PlaySputnikWishlist must load before app.js");
}
if (!window.PlaySputnikDetail) {
  throw new Error("PlaySputnikDetail must load before app.js");
}
if (!window.PlaySputnikOnboarding) {
  throw new Error("PlaySputnikOnboarding must load before app.js");
}
if (!window.PlaySputnikEntry) {
  throw new Error("PlaySputnikEntry must load before app.js");
}
if (!window.PlaySputnikRadar) {
  throw new Error("PlaySputnikRadar must load before app.js");
}
if (!window.PlaySputnikCover) {
  throw new Error("PlaySputnikCover must load before app.js");
}
if (!window.PlaySputnikDev) {
  throw new Error("PlaySputnikDev must load before app.js");
}
if (!window.PlaySputnikSession) {
  throw new Error("PlaySputnikSession must load before app.js");
}
if (!window.PlaySputnikHltb) {
  throw new Error("PlaySputnikHltb must load before app.js");
}
if (!window.PlaySputnikAi) {
  throw new Error("PlaySputnikAi must load before app.js");
}
if (!window.PlaySputnikCards) {
  throw new Error("PlaySputnikCards must load before app.js");
}
if (!window.PlaySputnikDataPanel) {
  throw new Error("PlaySputnikDataPanel must load before app.js");
}
if (!window.PlaySputnikImport) {
  throw new Error("PlaySputnikImport must load before app.js");
}
if (!window.PlaySputnikExport) {
  throw new Error("PlaySputnikExport must load before app.js");
}

const {
  STORAGE_KEY,
  PROVIDER_SEARCH_ENDPOINT,
  APP_VIEWS,
  LIBRARY_QUEUE_FILTERS,
  WISHLIST_QUEUE_FILTERS,
  USER_STATE_LABELS,
  PLAYABLE_STATES,
  ACCESS_STATES,
  COMPLETION_STATUS_STATES,
  LIBRARY_ACTIVE_STATES,
  RANK_EXCLUDED_STATES,
  MEMORY_STATE_GROUPS,
  QUICK_REACTION_LABELS,
  QUICK_TASTE_FIRST_TARGET,
  QUICK_TASTE_USABLE_TARGET,
  QUICK_TASTE_SHARP_TARGET,
  RATING_ACTIONS,
  TITLE_ENRICHMENT_RULES,
} = window.PlaySputnikConfig;


const QUICK_RATING_LINES = [
  "Hades - 5/5",
  "The Last of Us Part I - 5/5",
  "Red Dead Redemption 2 - 10/10",
  "The Witcher 3: Wild Hunt - 10/10",
  "Cyberpunk 2077 - 9/10",
  "Elden Ring - 9/10",
  "Stray - 4/5",
  "Disco Elysium - 10/10",
  "Alan Wake 2 - 9/10",
  "Resident Evil 4 - 8/10",
  "Baldur's Gate 3 - 5/10",
  "Ghost of Tsushima - 8/10",
];

const DEEP_RATING_LINES = [
  ...QUICK_RATING_LINES,
  "Control Ultimate Edition - 9/10",
  "Outer Wilds - 10/10",
  "Sifu - 7/10",
  "Citizen Sleeper - 9/10",
  "Dave the Diver - 8/10",
  "Alan Wake 2 - 9/10",
  "Final Fantasy VII Rebirth - 6/10",
  "Marvel's Midnight Suns - 7/10",
];

const PSN_DEMO_STATES = [
  { title: "The Forgotten City", state: "playing" },
  { title: "Resident Evil 4", state: "want_to_finish" },
  { title: "Control Ultimate Edition", state: "owned_forever" },
  { title: "Kena: Bridge of Spirits", state: "completed" },
  { title: "Sifu", state: "dropped" },
  { title: "Dave the Diver", state: "subscription" },
  { title: "Cocoon", state: "paused" },
  { title: "Alan Wake 2", state: "saved" },
];

const {
  normalizeTitle,
  aliasEntryForTitle,
  titleKey,
  titleMatches,
  aliasTermsForTitle,
  titleIncludes,
  searchSourceById,
  knownSeedGame,
  searchTextBlob,
  searchTokens,
  tokenCoverageScore,
  searchScore,
  searchResultFromSeed,
  searchResultFromBackbone,
  searchResultFromFixture,
  manualSearchResult,
  searchResultFromProvider,
  providerSearchResultsForQuery,
  globalSearchResults,
} = window.PlaySputnikSearch.createSearchTools({
  getTitleAliases: () => titleAliases,
  getSearchSources: () => searchSources?.sources || [],
  getSeedGames: () => games,
  getCatalogBackboneRecords: () => catalogBackbone?.records || [],
  getGlobalSearchFixtureRecords: () => globalSearchFixtures?.records || [],
  getProviderSearch: () => state.providerSearch,
  getSearchQuery: () => state.gameSearchQuery,
  getActiveRegion: () => state.activeRegion,
  enrichManualTitle: (title) => aiEnrichmentForGame({ title, atoms: [] }),
});

const {
  compactStatus,
  countValues,
  topEntries,
  uniqueCompact,
  enrichmentRuleForTitle,
  inferredAtomsForTitle,
  confidenceTone,
  sourcePassportItem,
  sourcePassportHtml,
  missingChecksForItem,
  searchResultSourcePassport,
  mergeStoreData,
} = window.PlaySputnikEnrichment.createEnrichmentTools({
  normalizeTitle,
  titleKey,
  knownSeedGame,
  getTitleEnrichmentRules: () => TITLE_ENRICHMENT_RULES,
});

const {
  makeQuickReactions,
  makeQuickReactionMap,
  defaultState,
  loadState,
  saveState: persistState,
  userStateToUserGame,
  normalizeUserGameRecord,
  legacyStateFromUserGame,
  hydrateUserGames,
  explicitUserGame: explicitUserGameForState,
  recordUserEvent: recordUserEventForState,
  applyStateToUserGame,
  titleStateSnapshot: titleStateSnapshotForState,
  restoreSetMembership,
} = window.PlaySputnikState.createStateTools({
  config: window.PlaySputnikConfig,
  profileGames,
  titleMatches,
  titleKey,
  normalizeTitle,
  emptyNotebook,
  storage: window.PlaySputnikStorage.createStorageAdapter(),
});

let state = loadState();
let selectedGameTitle = "";

const {
  quickReaction,
  quickReactionCount,
  quickTasteSignalCount,
  quickTasteSignalAtoms,
  quickAnsweredAtoms,
  uncoveredDiagnosticAtoms,
  diagnosticNeedScore,
  conflictResolutionScore,
  diagnosticFocusForGame,
  quickSwipeFocusLabel,
  quickSwipeFollowUpHint,
  quickSwipeAtomChips,
  nextDiagnosticGame,
  quickReactionSummary,
  knownGamesTasteSummary,
  quickTasteAtomReactionStats,
  quickTasteConflictReport,
  quickProfileMaturity,
  quickPayoffStage,
  quickPayoffMilestones,
  tasteGateState,
} = window.PlaySputnikOnboarding.createOnboardingTools({
  getState: () => state,
  profileGames,
  diagnosticOnboardingAtoms: DIAGNOSTIC_ONBOARDING_ATOMS,
  titleKey,
  normalizeTitle,
  topEntries,
});

const {
  entryLabel,
  entryRouteProofCopy,
} = window.PlaySputnikEntry.createEntryTools({
  getState: () => state,
  quickTasteSignalCount,
  quickReactionCount,
  quickTasteConflictReport,
});

const {
  gameSignals,
  feedbackWeightForAction,
  feedbackActionLabel,
  feedbackEffectLabel,
  addTasteWeight,
  feedbackTasteWeights,
  combinedTasteWeight,
  quickTasteWeights,
  legacyLikedTasteWeights,
  tasteEngineProfile,
  invalidateTasteProfile,
  tasteEngineGameSignals,
  tasteEngineScore,
  notebookTitles,
  notebookWishlistWeight,
  notebookAccessKind,
  notebookCompletedSet,
  notebookTasteScore,
  scoreBreakdown,
  scoreGame,
  personalFitBand,
  rankRangeForScore,
} = window.PlaySputnikScore.createScoreTools({
  getState: () => state,
  getProfileGames: () => profileGames,
  getQuickReaction: (title) => state.quickReactions?.[titleKey(title)] || "",
  getFeedbackSource: (title) => feedbackSource(title),
  getTasteConflict: () => quickTasteConflictReport(),
  getTasteSignalCount: () => quickTasteSignalCount(),
  titleMatches,
  titleKey,
  effectiveGameState,
  getSubscriptionStatus: (game, region) => subscriptionStatus(game, region),
  getPriceStatus: (game, region) => priceStatus(game, region),
  QUICK_TASTE_FIRST_TARGET,
});

const {
  stripNotebookMarker,
  notebookSection,
  parseRatingLine,
  findRatedGame,
  importedTasteScore,
  radarScore,
  rankedRadar,
  dropScore,
  rankedMonthlyDrop,
  sourceForLayer,
  freshnessLabel,
} = window.PlaySputnikRadar.createRadarTools({
  getState: () => state,
  getSelectedAtoms: () => selectedAtoms(),
  getSourceGames: () => sourceGames(),
  getSourceStatus: () => sourceStatus,
  tasteRadar,
  monthlyDrop,
  normalizeTitle,
  titleMatches,
  titleIncludes,
  gameSignals,
  combinedTasteWeight,
});

const {
  snapshotAgeHours,
  layerPolicy,
  signalStatus,
  priceStatus,
  subscriptionStatus,
  coverLabel,
  formatMoney,
  formatPrice,
  priceCanGuideBuy,
  gameDescription,
  watchOuts,
  watchOutCopy,
  answerAccessLabel,
  explain,
  personalReferenceGames,
  personalRankForecast,
  personalEvidence,
  factList,
} = window.PlaySputnikRecommend.createRecommendTools({
  getState: () => state,
  getProfileGames: () => profileGames,
  getQuickReaction: (title) => state.quickReactions?.[titleKey(title)] || "",
  getSourceGames: () => sourceGames(),
  getRecommendationPool: () => recommendationPool(),
  getRefreshPolicy: () => refreshPolicy,
  tasteEngineProfile,
  tasteEngineGameSignals,
  scoreGame,
  personalFitBand,
  rankRangeForScore,
  notebookWishlistWeight,
  notebookAccessKind,
  effectiveGameState,
  effectiveUserGame,
  titleMatches,
  titleKey,
  USER_STATE_LABELS,
});

const {
  rankedGames,
  invalidateRankedGames,
  clusterGames,
  dealReason,
  dealScore,
  purchaseRisk,
  purchaseScore,
  purchaseCandidates,
} = window.PlaySputnikRanking.createRankingTools({
  getState: () => state,
  getRecommendationPool: () => recommendationPool(),
  getGameUserState: (title) => gameUserState(title),
  getSelectedAtoms: () => selectedAtoms(),
  getBlocksPurchase: (game) => blocksPurchase(game),
  RANK_EXCLUDED_STATES,
  LIBRARY_ACTIVE_STATES,
  notebookCompletedSet,
  scoreGame,
  notebookWishlistWeight,
  priceCanGuideBuy,
  priceStatus,
  subscriptionStatus,
  watchOuts,
  effectiveGameState,
  titleKey,
});

const {
  renderEvidenceRows,
  renderUndoStrip,
  isAnswerAccessible,
  answerFitLine,
  answerForecast,
  companionAgendaActions,
  companionAlternatives,
  companionBuyGuardrail,
  companionAnswerAgenda,
  invalidateCompanionAgenda,
  companionAnswer,
  firstRunTasteProof,
  firstRunNextSteps,
  firstRunBridge,
  firstValueReceipt,
} = window.PlaySputnikAnswer.createAnswerTools({
  getState: () => state,
  getQuickTasteSignalCount: () => quickTasteSignalCount(),
  getPrimaryDecisionGame: (ranked) => primaryDecisionGame(ranked),
  getIsLibraryFirstMode: (game) => isLibraryFirstMode(game),
  getPlayLaterQueue: () => playLaterQueue(),
  getBuyLaterCandidate: (ranked) => buyLaterCandidate(ranked),
  getTasteMemory: () => tasteMemory(),
  getKnownGamesTasteSummary: () => knownGamesTasteSummary(),
  getTasteGateState: () => tasteGateState(),
  getBlocksPurchase: (game) => blocksPurchase(game),
  getEntryLabel: () => entryLabel(),
  getSourceGames: () => sourceGames(),
  getSelectedAtoms: () => selectedAtoms(),
  getIsAlreadyAvailable: (game) => isAlreadyAvailable(game),
  explain,
  watchOutCopy,
  personalEvidence,
  personalRankForecast,
  answerAccessLabel,
  priceStatus,
  formatPrice,
  effectiveGameState,
  titleMatches,
  countValues,
  topEntries,
});

const {
  playLaterQueue,
  bestLibraryPick,
  primaryDecisionGame,
  isLibraryFirstMode,
  buyLaterCandidate,
  companionPlan,
  tasteMemory,
  invalidateTasteMemory,
  recentLearningEvents,
  libraryPlan,
  libraryPlanFacts,
  importedRatingForGame,
  personalRatingFacet,
  memoryFacets,
  isMemoryStateSelected,
  memoryHint,
  libraryMemoryRecords,
  bestLibraryRecord,
  libraryDashboardCards,
  memoryCandidates,
  libraryLaneForGame,
  libraryFilterMatches,
  libraryFilterSummary,
  queueLaneLabel,
} = window.PlaySputnikLibrary.createLibraryTools({
  getState: () => state,
  getRecommendationPool: () => recommendationPool(),
  getGames: () => games,
  getExternalMemoryGames: () => externalMemoryGames(),
  getMonthlyDropItem: (title) => monthlyDropItem(title),
  getGameUserState: (title) => gameUserState(title),
  getLegacyStateFromUserGame: (userGame) => legacyStateFromUserGame(userGame),
  getIsAlreadyAvailable: (game) => isAlreadyAvailable(game),
  getBlocksPurchase: (game) => blocksPurchase(game),
  getFeedbackSource: (title) => feedbackSource(title),
  getRankedRadar: () => rankedRadar(),
  getTopAtomEntries: (counts, limit) => topAtomEntries(counts, limit),
  getSourceGames: () => sourceGames(),
  tasteEngineProfile,
  notebookCompletedSet,
  notebookWishlistWeight,
  scoreGame,
  feedbackWeightForAction,
  feedbackEffectLabel,
  feedbackActionLabel,
  effectiveGameState,
  effectiveUserGame,
  explain,
  priceStatus,
  formatPrice,
  priceCanGuideBuy,
  dealScore,
  dealReason,
  titleMatches,
  titleKey,
  countValues,
  topEntries,
});

const {
  priceWatchReason,
  priceHistoryForGame,
  historicalLowForGame,
  priceWatchRecord,
  historicalLowCopy,
  priceWatchRecords,
  wishlistIntentRecords,
  wishlistDecision,
  wishlistDashboardCards,
  wishlistFilterSummary,
  wishlistFilterMatches,
} = window.PlaySputnikWishlist.createWishlistTools({
  getState: () => state,
  getRecommendationPool: () => recommendationPool(),
  getIsAlreadyAvailable: (game) => isAlreadyAvailable(game),
  getBlocksPurchase: (game) => blocksPurchase(game),
  getPurchaseCandidates: (ranked) => purchaseCandidates(ranked),
  notebookWishlistWeight,
  scoreGame,
  effectiveGameState,
  effectiveUserGame,
  priceStatus,
  formatPrice,
  formatMoney,
  priceCanGuideBuy,
  dealScore,
  purchaseRisk,
  purchaseScore,
  titleKey,
});

const {
  visualCatalogStats,
  visualCatalogReason,
  visualCatalogItems,
} = window.PlaySputnikVisual.createVisualTools({
  getState: () => state,
  getRecommendationPool: () => recommendationPool(),
  clusterGames,
  dealReason,
  primaryDecisionGame,
  scoreGame,
  personalFitBand,
  effectiveGameState,
  notebookWishlistWeight,
  titleKey,
});

const {
  normalizeDetailGame,
  searchResultDetailGame,
  detailGameForTitle,
  detailScoredGame,
  detailPriceSummary,
  detailStatusCards,
  detailActionClass,
} = window.PlaySputnikDetail.createDetailTools({
  getState: () => state,
  getRecommendationPool: () => recommendationPool(),
  getSourceGames: () => sourceGames(),
  getGlobalSearchResults: () => globalSearchResults(),
  getExplicitUserGame: (title) => explicitUserGame(title),
  getRankedGames: () => rankedGames(),
  getSearchResultMemoryRecord: (result) => searchResultMemoryRecord(result),
  getAiEnrichmentForGame: (item) => aiEnrichmentForGame(item),
  uniqueCompact,
  titleMatches,
  scoreGame,
  effectiveUserGame,
  priceStatus,
  priceCanGuideBuy,
  formatPrice,
  priceWatchRecord,
  historicalLowCopy,
  personalRatingFacet,
});

const {
  devHealthStatusClass,
  catalogStatusClass,
  recordedDevCheck,
  currentProviderDevCheck,
  devHealthChecks,
} = window.PlaySputnikDev.createDevTools({
  getState: () => state,
  getDevHealth: () => devHealth,
  getDataHealth: () => dataHealth,
  searchSourceById,
  compactStatus,
});

const {
  posterTheme,
  posterThemeLabel,
  generatedPosterBackground,
  coverBackground,
  coverReadinessLabel,
  coverSourceLabel,
  gameSourcePassport,
} = window.PlaySputnikCover.createCoverTools({
  getState: () => state,
  gameSignals,
  knownSeedGame,
  sourcePassportItem,
  confidenceTone,
  effectiveUserGame,
  priceStatus,
});

const {
  valueScore,
  valueScoreLabel,
  valueScoreBand,
  roiPerHour,
  roiLabel,
  roiSummary,
  criticScoreLabel,
  criticScoreBand,
  hltbHoursLabel,
  hltbProgress,
  gameValueCard,
} = window.PlaySputnikHltb.createHltbTools({
  getState: () => state,
  getSourceGames: () => sourceGames(),
  formatMoney,
  titleKey,
});

const {
  currentSessionMinutes,
  sessionLog,
  totalPlayMinutes,
  sessionSummary,
} = window.PlaySputnikSession.createSessionTools({
  getState: () => state,
  saveState: () => saveState(),
  onSessionUpdate: () => render(),
});

const {
  applyCoverVisual,
  renderCoverSourceInto,
  renderProfileGameRow,
  renderHero,
  renderCard,
  bindUndoButtons,
  focusKnownGames,
  focusAnswerAgenda,
  focusTasteImport,
} = window.PlaySputnikCards.createCardsTools({
  getState: () => state,
  explain,
  personalEvidence,
  gameDescription,
  watchOutCopy,
  factList,
  renderEvidenceRows,
  coverBackground,
  posterTheme,
  coverSourceLabel,
  quickReaction,
  setQuickReaction: (game, reaction) => setQuickReaction(game, reaction),
  openGameDetail: (title) => openGameDetail(title),
  setGameState: (title, userState) => { setGameState(title, userState); },
  gameUserState,
  recordFeedback: (action, title) => recordFeedback(action, title),
  undoLastAction: () => undoLastAction(),
  render: () => render(),
  profileGames,
});

const {
  detectFormat,
  parseBackloggdCsv,
  parseHltbJson,
  parsePlainList,
  parsePsnTrophyTitles,
  importSummaryLabel,
} = window.PlaySputnikImport;

// Data panel tools are wired after els is defined (requires DOM refs)
let renderRefreshPolicy, renderSourceHealth, renderDevHealth, renderDataWorkbench, renderCatalogBackbone, renderCatalogWorkbench, refreshQueue;

const {
  cachedExplanation,
  fetchExplanation,
  clearExplanationCache,
} = window.PlaySputnikAi.createAiTools({
  getState: () => state,
  getSourceGames: () => sourceGames(),
  gameSignals,
  combinedTasteWeight,
  titleKey,
});

const els = {
  likedGames: document.querySelector("#liked-games"),
  likedCount: document.querySelector("#liked-count"),
  quickSwipeDeck: document.querySelector("#quick-swipe-deck"),
  tasteGate: document.querySelector("#taste-gate"),
  entryStatus: document.querySelector("#entry-status"),
  entryRouteProof: document.querySelector("#entry-route-proof"),
  entryResult: document.querySelector("#entry-result"),
  entryCards: document.querySelectorAll("[data-entry-path]"),
  ratingImport: document.querySelector("#rating-import"),
  tasteSummary: document.querySelector("#taste-summary"),
  tasteAtoms: document.querySelector("#taste-atoms"),
  tasteProfileSummary: document.querySelector("#taste-profile-summary"),
  tasteProfileBadge: document.querySelector("#taste-profile-badge"),
  sampleRatings: document.querySelector("#sample-ratings"),
  analyzeRatings: document.querySelector("#analyze-ratings"),
  notebookImport: document.querySelector("#notebook-import"),
  notebookSummary: document.querySelector("#notebook-summary"),
  notebookPills: document.querySelector("#notebook-pills"),
  parseNotebook: document.querySelector("#parse-notebook"),
  clearNotebook: document.querySelector("#clear-notebook"),
  mood: document.querySelector("#mood"),
  session: document.querySelector("#session"),
  difficulty: document.querySelector("#difficulty"),
  plus: document.querySelector("#ps-plus"),
  budget: document.querySelector("#budget"),
  budgetLabel: document.querySelector("#budget-label"),
  appViewTabs: document.querySelectorAll("[data-app-view]"),
  appViewStatus: document.querySelector("#app-view-status"),
  viewSections: document.querySelectorAll("[data-view-section]"),
  activeRegion: document.querySelector("#active-region"),
  screenedCount: document.querySelector("#screened-count"),
  bestDeal: document.querySelector("#best-deal"),
  timeFit: document.querySelector("#time-fit"),
  libraryCount: document.querySelector("#library-count"),
  guardedCount: document.querySelector("#guarded-count"),
  firstRunStatus: document.querySelector("#first-run-status"),
  firstRunGrid: document.querySelector("#first-run-grid"),
  firstRunBridge: document.querySelector("#first-run-bridge"),
  answerStatus: document.querySelector("#answer-status"),
  answerCopy: document.querySelector("#answer-copy"),
  receiptSummary: document.querySelector("#receipt-summary"),
  receiptGrid: document.querySelector("#receipt-grid"),
  topPick: document.querySelector("#top-pick"),
  planSummary: document.querySelector("#plan-summary"),
  planList: document.querySelector("#plan-list"),
  libraryPlanSummary: document.querySelector("#library-plan-summary"),
  libraryPlanList: document.querySelector("#library-plan-list"),
  memoryStatus: document.querySelector("#memory-status"),
  memoryGrid: document.querySelector("#memory-grid"),
  learningStatus: document.querySelector("#learning-status"),
  learningList: document.querySelector("#learning-list"),
  myGamesSummary: document.querySelector("#my-games-summary"),
  myGamesDashboard: document.querySelector("#my-games-dashboard"),
  myGamesFilterSummary: document.querySelector("#my-games-filter-summary"),
  libraryFilterButtons: document.querySelectorAll("[data-library-filter]"),
  myGamesList: document.querySelector("#my-games-list"),
  gameSearchStatus: document.querySelector("#game-search-status"),
  gameSearchInput: document.querySelector("#game-search-input"),
  gameSearchSubmit: document.querySelector("#game-search-submit"),
  gameSearchSource: document.querySelector("#game-search-source"),
  gameSearchList: document.querySelector("#game-search-list"),
  catalogSearchInput: document.querySelector("#catalog-search-input"),
  catalogSearchCount: document.querySelector("#catalog-search-count"),
  visualCatalogStatus: document.querySelector("#visual-catalog-status"),
  visualCatalogMetrics: document.querySelector("#visual-catalog-metrics"),
  visualCatalogSummary: document.querySelector("#visual-catalog-summary"),
  visualCatalogList: document.querySelector("#visual-catalog-list"),
  visualCatalogLoadMore: document.querySelector("#visual-catalog-load-more"),
  clusterGrid: document.querySelector("#cluster-grid"),
  librarySummary: document.querySelector("#library-summary"),
  libraryGrid: document.querySelector("#library-grid"),
  dropStatus: document.querySelector("#drop-status"),
  dropCalendar: document.querySelector("#drop-calendar"),
  dropList: document.querySelector("#drop-list"),
  radarStatus: document.querySelector("#radar-status"),
  radarList: document.querySelector("#radar-list"),
  priceWatchRegion: document.querySelector("#price-watch-region"),
  wishlistDashboard: document.querySelector("#wishlist-dashboard"),
  wishlistFilterSummary: document.querySelector("#wishlist-filter-summary"),
  wishlistFilterButtons: document.querySelectorAll("[data-wishlist-filter]"),
  wishlistSortButtons: document.querySelectorAll("[data-wishlist-sort]"),
  wishlistShareBtn: document.querySelector("#wishlist-share-btn"),
  wishlistShareCopy: document.querySelector("#wishlist-share-copy"),
  wishlistShareUrl: document.querySelector("#wishlist-share-url"),
  wishlistShareStatus: document.querySelector("#wishlist-share-status"),
  wishlistImportBanner: document.querySelector("#wishlist-import-banner"),
  wishlistImportBannerTitle: document.querySelector("#wishlist-import-banner-title"),
  wishlistImportBannerSummary: document.querySelector("#wishlist-import-banner-summary"),
  wishlistImportConfirm: document.querySelector("#wishlist-import-confirm"),
  wishlistImportDismiss: document.querySelector("#wishlist-import-dismiss"),
  statsGrid: document.querySelector("#stats-grid"),
  statsAtoms: document.querySelector("#stats-atoms"),
  statsTimeline: document.querySelector("#stats-timeline"),
  statsBadge: document.querySelector("#stats-badge"),
  priceWatchList: document.querySelector("#price-watch-list"),
  buyDecisionStatus: document.querySelector("#buy-decision-status"),
  buyDecisionList: document.querySelector("#buy-decision-list"),
  tasteShareBtn: document.querySelector("#taste-share-btn"),
  tasteShareCopy: document.querySelector("#taste-share-copy"),
  tasteShareUrl: document.querySelector("#taste-share-url"),
  tasteShareStatus: document.querySelector("#taste-share-status"),
  tasteImportBanner: document.querySelector("#taste-import-banner"),
  tasteImportBannerDesc: document.querySelector("#taste-import-banner-desc"),
  tasteImportConfirm: document.querySelector("#taste-import-confirm"),
  tasteImportDismiss: document.querySelector("#taste-import-dismiss"),
  dealsStatus: document.querySelector("#deals-status"),
  dealsGrid: document.querySelector("#deals-grid"),
  appErrorOverlay: document.querySelector("#app-error-overlay"),
  appErrorMessage: document.querySelector("#app-error-message"),
  appErrorStack: document.querySelector("#app-error-stack"),
  appErrorRetry: document.querySelector("#app-error-retry"),
  appErrorOffline: document.querySelector("#app-error-offline"),
  dataErrorToast: document.querySelector("#data-error-toast"),
  dataErrorToastMsg: document.querySelector("#data-error-toast-msg"),
  dataErrorToastClose: document.querySelector("#data-error-toast-close"),
  dealsFooter: document.querySelector("#deals-footer"),
  dealsFilterBtns: document.querySelectorAll("[data-deals-filter]"),
  refreshPolicyStatus: document.querySelector("#refresh-policy-status"),
  refreshPolicySummary: document.querySelector("#refresh-policy-summary"),
  refreshPolicyList: document.querySelector("#refresh-policy-list"),
  sourceMode: document.querySelector("#source-mode"),
  sourceList: document.querySelector("#source-list"),
  devHealthStatus: document.querySelector("#dev-health-status"),
  devHealthSummary: document.querySelector("#dev-health-summary"),
  devHealthList: document.querySelector("#dev-health-list"),
  workbenchStatus: document.querySelector("#workbench-status"),
  workbenchGrid: document.querySelector("#workbench-grid"),
  topAtoms: document.querySelector("#top-atoms"),
  sessionCurrent: document.querySelector("#session-current"),
  sessionTotal: document.querySelector("#session-total"),
  sessionCount: document.querySelector("#session-count"),
  sessionAvg: document.querySelector("#session-avg"),
  sessionStatus: document.querySelector("#session-status"),
  exportJson: document.querySelector("#export-json"),
  exportCsv: document.querySelector("#export-csv"),
  exportStatus: document.querySelector("#export-status"),
  exportPreview: document.querySelector("#export-preview"),
  importFile: document.querySelector("#import-file"),
  libraryImportFile: document.querySelector("#library-import-file"),
  libraryImportPreview: document.querySelector("#library-import-preview"),
  libraryImportConfirmRow: document.querySelector("#library-import-confirm-row"),
  libraryImportConfirm: document.querySelector("#library-import-confirm"),
  libraryImportDiscard: document.querySelector("#library-import-discard"),
  psnConnectBtn: document.querySelector("#psn-connect-btn"),
  psnImportSection: document.querySelector("#psn-import-section"),
  psnImportStatus: document.querySelector("#psn-import-status"),
  psnImportBtn: document.querySelector("#psn-import-btn"),
  psnImportCancel: document.querySelector("#psn-import-cancel"),
  psnNpssoInput: document.querySelector("#psn-npsso-input"),
  psnImportResult: document.querySelector("#psn-import-result"),
  catalogBackboneStatus: document.querySelector("#catalog-backbone-status"),
  catalogBackboneSummary: document.querySelector("#catalog-backbone-summary"),
  catalogBackboneList: document.querySelector("#catalog-backbone-list"),
  catalogWorkbenchStatus: document.querySelector("#catalog-workbench-status"),
  catalogWorkbenchSummary: document.querySelector("#catalog-workbench-summary"),
  catalogWorkbenchList: document.querySelector("#catalog-workbench-list"),
  debugSummary: document.querySelector("#debug-summary"),
  debugList: document.querySelector("#debug-list"),
  gameDetail: document.querySelector("#game-detail"),
  gameDetailDrawer: document.querySelector(".game-detail-drawer"),
  gameDetailTitle: document.querySelector("#game-detail-title"),
  gameDetailMeta: document.querySelector("#game-detail-meta"),
  gameDetailVisual: document.querySelector(".game-detail-visual"),
  gameDetailCoverSource: document.querySelector(".game-detail-cover-source"),
  gameDetailBody: document.querySelector(".game-detail-body"),
  detailCloseButtons: document.querySelectorAll("[data-detail-close]"),
  refresh: document.querySelector("#refresh"),
  reset: document.querySelector("#reset-state"),
};

// Initialise data panel module now that els and all helper functions are in scope
({
  refreshQueue,
  renderRefreshPolicy,
  renderSourceHealth,
  renderDevHealth,
  renderDataWorkbench,
  renderCatalogBackbone,
  renderCatalogWorkbench,
} = window.PlaySputnikDataPanel.createDataPanelTools({
  getState: () => state,
  getGames: () => games,
  getRefreshPolicy: () => refreshPolicy,
  getSourceStatus: () => sourceStatus,
  getDataHealth: () => dataHealth,
  getDevHealth: () => devHealth,
  getCatalogBackbone: () => catalogBackbone,
  getCatalogWorkbench: () => catalogWorkbench,
  devHealthStatusClass,
  catalogStatusClass,
  compactStatus,
  devHealthChecks,
  priceStatus,
  effectiveGameState,
  notebookWishlistWeight,
  els,
}));

const { bindExportListeners } = window.PlaySputnikExport.createExportTools({
  getState: () => state,
  setState: (s) => { state = s; },
  defaultState,
  hydrateUserGames,
  emptyNotebook,
  legacyStateFromUserGame,
  titleKey,
  applyStateToUserGame,
  userStateToUserGame,
  saveState: () => persistState(state),
  render: () => render(),
  els,
});
bindExportListeners();

function explicitUserGame(title) {
  return explicitUserGameForState(state, title);
}

function saveState() {
  persistState(state);
}

function recordUserEvent(type, title, detail = {}) {
  recordUserEventForState(state, type, title, detail);
}

function setGameState(title, userState) {
  // Invalidate the per-render state cache immediately so any read between this
  // mutation and the next render() reflects the new state.
  invalidateEffectiveState();
  const key = titleKey(title);
  const previousState = gameUserState(title);
  state.hidden.delete(title);
  state.saved.delete(title);
  state.snoozed.delete(title);
  if (!userState) {
    delete state.userStates[key];
    delete state.userGames[key];
    recordUserEvent("user_game_cleared", title, { from: previousState });
    recordFeedback("clear_state", title);
    return;
  }
  const existingGame = explicitUserGame(title);
  const userGame = applyStateToUserGame(existingGame || userStateToUserGame(title, ""), userState);
  userGame.title = existingGame?.title || title;
  if (existingGame?.provider || existingGame?.catalogStatus || existingGame?.sourceUrl || existingGame?.coverUrl) {
    userGame.source = existingGame.source || userGame.source;
  }
  state.userGames[key] = userGame;
  if (userGame.hidden) state.hidden.add(title);
  if (userGame.saved) state.saved.add(title);
  state.userStates[key] = { title, state: legacyStateFromUserGame(userGame), updatedAt: userGame.updatedAt };
  recordUserEvent("user_game_state_changed", title, {
    from: previousState,
    to: legacyStateFromUserGame(userGame),
    access: userGame.access,
    completionStatus: userGame.completionStatus,
    saved: userGame.saved,
    hidden: userGame.hidden,
  });
  recordFeedback(userState, title);
}

function setGameRating(title, rating) {
  const key = titleKey(title);
  const current = explicitUserGame(title) || normalizeUserGameRecord({ title });
  const previousRating = current.rating;
  current.rating = typeof rating === "number" ? Math.max(0, Math.min(100, rating)) : null;
  current.updatedAt = new Date().toISOString();
  current.source = "manual";
  state.userGames[key] = current;
  state.userStates[key] = { title, state: legacyStateFromUserGame(current), updatedAt: current.updatedAt };
  recordUserEvent("user_game_rating_changed", title, { from: previousRating, to: current.rating });
  recordFeedback(current.rating === null ? "rating_clear" : "rating_set", title);
}

function snoozeGame(title) {
  state.snoozed.add(title);
  recordFeedback("snooze_tonight", title);
}

function titleStateSnapshot(title) {
  return titleStateSnapshotForState(state, title);
}

function stageLastUndo(action, title) {
  if (!title || !["play", "save", "snooze"].includes(action)) return;
  const labels = {
    play: "Marked Playing",
    save: "Saved",
    snooze: "Skipped tonight",
  };
  state.lastUndo = {
    action,
    label: labels[action] || "Updated",
    title,
    before: titleStateSnapshot(title),
    createdAt: new Date().toISOString(),
  };
}

function stageQuickUndo(game, label) {
  const key = titleKey(game.title);
  state.lastUndo = {
    action: "quick_taste",
    label,
    title: game.title,
    before: {
      key,
      title: game.title,
      quickReaction: state.quickReactions[key] ? { ...state.quickReactions[key] } : null,
      liked: state.liked.has(game.title),
      entryPath: state.entryPath,
      entryResult: state.entryResult,
    },
    createdAt: new Date().toISOString(),
  };
}

function undoLastAction() {
  const undo = state.lastUndo;
  if (!undo?.before) return;
  const { before } = undo;
  if (undo.action === "quick_taste") {
    if (before.quickReaction) state.quickReactions[before.key] = before.quickReaction;
    else delete state.quickReactions[before.key];
    restoreSetMembership(state.liked, before.title, before.liked);
    state.entryPath = before.entryPath || "quick";
    state.entryResult = before.entryResult || `Mark ${QUICK_TASTE_FIRST_TARGET}+ taste signals to unlock the first hypothesis`;
    state.lastUndo = null;
    recordFeedback("undo_quick_taste", undo.title);
    render();
    return;
  }
  if (before.userState) state.userStates[before.key] = before.userState;
  else delete state.userStates[before.key];
  if (before.userGame) state.userGames[before.key] = before.userGame;
  else delete state.userGames[before.key];
  restoreSetMembership(state.hidden, before.title, before.hidden);
  restoreSetMembership(state.saved, before.title, before.saved);
  restoreSetMembership(state.snoozed, before.title, before.snoozed);
  state.lastUndo = null;
  recordFeedback(`undo_${undo.action}`, undo.title);
  render();
}

function clearSnoozedGames() {
  if (!state.snoozed.size) return;
  state.snoozed.clear();
  recordFeedback("clear_snoozes", "Tonight skips");
}

function gameUserState(title) {
  return legacyStateFromUserGame(explicitUserGame(title));
}

function derivedNotebookUserGame(title) {
  if (notebookCompletedSet().has(titleKey(title))) return userStateToUserGame(title, "completed", "notebook", "notebook_import");
  const accessKind = notebookAccessKind(title);
  if (accessKind === "subscription") return userStateToUserGame(title, "subscription", "notebook", "notebook_import");
  if (accessKind === "permanent") return userStateToUserGame(title, "owned_forever", "notebook", "notebook_import");
  if (accessKind === "available") return userStateToUserGame(title, "owned", "notebook", "notebook_import");
  return null;
}

function derivedNotebookState(title) {
  return legacyStateFromUserGame(derivedNotebookUserGame(title));
}

function effectiveUserGame(game) {
  return explicitUserGame(game.title)
    || derivedNotebookUserGame(game.title)
    || (state.saved.has(game.title) ? userStateToUserGame(game.title, "saved", "legacy_set", "legacy_saved") : null);
}

// Per-render cache: effectiveGameState is called thousands of times per render
// (libraryPlan alone does ~2700 lookups). It maps a title → user state, which
// is invariant within a render. Cleared at render() start via
// invalidateEffectiveState().
const _effectiveStateCache = new Map();
function invalidateEffectiveState() {
  _effectiveStateCache.clear();
}
function effectiveGameState(game) {
  const key = game && game.title;
  if (key && _effectiveStateCache.has(key)) return _effectiveStateCache.get(key);
  const value = legacyStateFromUserGame(effectiveUserGame(game));
  if (key) _effectiveStateCache.set(key, value);
  return value;
}

function isAlreadyAvailable(game) {
  return PLAYABLE_STATES.includes(effectiveGameState(game));
}

function blocksPurchase(game) {
  return isAlreadyAvailable(game) || effectiveGameState(game) === "dropped";
}

function stateClassName(value) {
  return String(value || "none").replace(/[^a-z0-9]+/g, "-");
}

function stateCount() {
  const derived = games.filter((game) => effectiveGameState(game)).length;
  return derived + externalUserGameRecords().length + state.hidden.size + playLaterQueue().length;
}

function hydrateControls() {
  els.mood.value = state.mood;
  els.session.value = state.session;
  els.difficulty.value = state.difficulty;
  els.plus.checked = state.psPlus;
  els.budget.value = state.budget;
  els.ratingImport.value = state.ratingImport;
  els.notebookImport.value = state.notebookImport;
  els.gameSearchInput.value = state.gameSearchQuery || "";
}

function emptyNotebook() {
  return {
    wishlist: [],
    access: [],
    prices: [],
    completed: [],
    ranked: [],
    upcoming: [],
  };
}

function selectedAtoms() {
  const atoms = [];
  profileGames.forEach((game) => {
    if (state.liked.has(game.title)) atoms.push(...game.atoms);
  });
  return atoms;
}

function setQuickReaction(game, reaction) {
  const key = titleKey(game.title);
  const current = quickReaction(game.title);
  state.entryPath = "quick";
  const nextAction = current === reaction ? "clear" : reaction;
  stageQuickUndo(game, QUICK_REACTION_LABELS[nextAction] || "Answered");
  if (current === reaction) {
    delete state.quickReactions[key];
    state.liked.delete(game.title);
    recordFeedback("quick_clear", game.title);
  } else {
    state.quickReactions[key] = { title: game.title, reaction, updatedAt: new Date().toISOString() };
    state.liked.delete(game.title);
    if (reaction === "loved") state.liked.add(game.title);
    recordFeedback(`quick_${reaction}`, game.title);
  }
  const answered = quickReactionCount();
  const signalCount = quickTasteSignalCount();
  state.entryResult = answered
    ? `${answered}/${profileGames.length} answered, ${signalCount} taste signals`
    : `Mark ${QUICK_TASTE_FIRST_TARGET}+ taste signals, then keep swiping toward ${profileGames.length}`;
  render();
}



function atomVocabulary() {
  return new Set(
    [...profileGames, ...games, ...monthlyDrop, ...tasteRadar]
      .flatMap((item) => item.atoms || []),
  );
}

function topAtomEntries(counts, limit = 4) {
  const atoms = atomVocabulary();
  return topEntries(
    Object.fromEntries(Object.entries(counts).filter(([label]) => atoms.has(label))),
    limit,
  );
}








function aiEnrichmentForGame(item) {
  const explicitAtoms = Array.isArray(item.atoms) ? item.atoms : [];
  const inferredAtoms = Array.isArray(item.inferredAtoms) ? item.inferredAtoms : [];
  const rule = enrichmentRuleForTitle(item.title);
  const atoms = uniqueCompact([
    ...explicitAtoms,
    ...inferredAtoms,
    ...(explicitAtoms.length || inferredAtoms.length ? [] : rule?.atoms || []),
  ], 6);
  const positiveAtoms = atoms
    .filter((atom) => selectedAtoms().includes(atom) || combinedTasteWeight(atom) > 0)
    .slice(0, 3);
  const cautionAtoms = atoms
    .filter((atom) => combinedTasteWeight(atom) < 0)
    .slice(0, 2);
  const missing = missingChecksForItem(item);
  const status = explicitAtoms.length
    ? "AI supported by source tags"
    : inferredAtoms.length || rule
      ? "AI inferred"
      : "AI title-only";
  const fit = positiveAtoms.length >= 2
    ? "Promising fit"
    : positiveAtoms.length
      ? "Taste hint"
      : "Needs taste check";
  const summary = positiveAtoms.length
    ? `Touches ${positiveAtoms.join(" / ")} taste signals.`
    : rule?.summary || item.vibe || "Preliminary title-only read; metadata still needs a provider pass.";
  const risk = cautionAtoms.length
    ? `Possible friction: ${cautionAtoms.join(" / ")}.`
    : rule?.risk || "Price, subscription, language, cover, and exact platform facts are not verified yet.";

  return {
    status,
    fit,
    summary,
    risk,
    atoms,
    missing,
    session: rule?.session || item.session || "unknown",
  };
}

function aiEnrichmentHtml(item, modifier = "") {
  const enrichment = aiEnrichmentForGame(item);
  const missing = enrichment.missing.length ? enrichment.missing.slice(0, 4).join(" / ") : "nothing critical";
  const atoms = enrichment.atoms.slice(0, 4).map((atom) => `<span class="fact tone">${atom}</span>`).join("");
  return `
    <div class="ai-enrichment ${modifier}">
      <div>
        <span class="enrichment-status">${enrichment.status}</span>
        <strong>${enrichment.fit}</strong>
      </div>
      <p>${enrichment.summary} ${enrichment.risk}</p>
      <div class="facts">${atoms}<span class="fact warn">check ${missing}</span></div>
    </div>
  `;
}



function externalUserGameRecords() {
  return Object.values(state.userGames || {})
    .map((record) => normalizeUserGameRecord(record))
    .filter((record) => record?.title && !knownSeedGame(record.title))
    .filter((record) => record.saved || record.access || record.completionStatus || typeof record.rating === "number");
}

function externalGameFromUserGame(record) {
  const atoms = record.atoms.length ? record.atoms : record.inferredAtoms.length ? record.inferredAtoms : inferredAtomsForTitle(record.title);
  const rule = enrichmentRuleForTitle(record.title);
  const saved = Boolean(record.saved);
  return {
    title: record.title,
    atoms,
    vibe: record.vibe || record.enrichmentSummary || rule?.summary || "External wishlist candidate",
    session: rule?.session || "medium",
    difficulty: "normal",
    length: "medium",
    commitment: "medium",
    tone: "strange",
    content: "low-violence",
    reviewBurden: "high",
    adultTimeFit: rule?.session === "short" ? "weeknight" : rule?.session === "long" ? "vacation" : "weekend",
    backlog: false,
    wishlist: saved,
    externalCandidate: true,
    recommendationLane: saved ? "wishlist" : "external",
    color: "linear-gradient(135deg, #27313f, #7aa2ff)",
    prices: {},
    discount: {},
    priceMeta: {},
    priceHistory: {},
    psPlus: [],
    subscriptionMeta: {},
    coverMeta: record.coverStatus ? {
      title: record.title,
      status: record.coverStatus,
      source: record.provider || record.source || "search_memory",
      sourceUrl: record.sourceUrl || "local://search-memory",
      checkedAt: record.updatedAt,
      licenseNote: record.coverLicenseNote || "Search memory candidate; cover not resolved yet.",
      url: record.coverUrl || "",
    } : null,
    externalMeta: record,
  };
}

function externalMemoryGames() {
  return externalUserGameRecords().map(externalGameFromUserGame);
}

function recommendationPool() {
  const byTitle = new Map();
  [...games, ...externalMemoryGames()].forEach((game) => {
    const key = titleKey(game.title);
    if (!byTitle.has(key)) byTitle.set(key, game);
  });
  return [...byTitle.values()];
}

function sourceGames() {
  const byTitle = new Map();
  [...profileGames, ...games, ...externalMemoryGames()].forEach((game) => byTitle.set(titleKey(game.title), game));
  return [...byTitle.values()];
}

function canonicalSearchResultSeed(result) {
  if (!result?.title) return null;
  return knownSeedGame(result.title) || (result.duplicateOf ? knownSeedGame(result.duplicateOf) : null);
}

function canonicalSearchResultTitle(result) {
  const seed = canonicalSearchResultSeed(result);
  if (seed) return seed.title;
  const duplicateMemory = result?.duplicateOf ? explicitUserGame(result.duplicateOf) : null;
  return duplicateMemory?.title || result?.title || "";
}

function searchResultUserGame(result) {
  const canonicalTitle = canonicalSearchResultTitle(result);
  return canonicalTitle ? explicitUserGame(canonicalTitle) : null;
}

function resultStateSelected(result, userState) {
  const userGame = searchResultUserGame(result);
  if (!userGame) return false;
  if (ACCESS_STATES.includes(userState)) return userGame.access === userState;
  if (COMPLETION_STATUS_STATES.includes(userState)) return userGame.completionStatus === userState;
  if (userState === "saved") return Boolean(userGame.saved);
  if (userState === "hidden") return Boolean(userGame.hidden);
  return false;
}

function resultAlreadySaved(result) {
  return resultStateSelected(result, "saved");
}

function searchResultMemoryRecord(result) {
  const title = canonicalSearchResultTitle(result);
  const key = titleKey(title);
  const current = normalizeUserGameRecord(state.userGames[key], title) || normalizeUserGameRecord({ title });
  const enrichment = aiEnrichmentForGame(result);
  return {
    ...current,
    title,
    source: `search_${result.sourceId}`,
    updatedAt: new Date().toISOString(),
    catalogStatus: result.catalogStatus,
    matchConfidence: result.matchConfidence,
    coverStatus: result.coverStatus,
    priceStatus: result.priceStatus,
    provider: result.provider || result.sourceId,
    sourceUrl: result.sourceUrl || "",
    coverUrl: result.coverUrl || "",
    coverLicenseNote: result.coverUrl && result.provider === "rawg"
      ? "RAWG API image candidate. Attribute RAWG and link to the source page wherever this image is displayed."
      : current.coverLicenseNote || "",
    platforms: result.platforms?.length ? result.platforms : current.platforms || [],
    atoms: result.atoms?.length ? result.atoms : current.atoms || [],
    inferredAtoms: result.inferredAtoms?.length
      ? result.inferredAtoms
      : result.atoms?.length
        ? current.inferredAtoms || []
        : enrichment.atoms,
    vibe: result.vibe || result.reason || "External wishlist candidate",
    enrichmentStatus: enrichment.status,
    enrichmentSummary: enrichment.summary,
    enrichmentRisk: enrichment.risk,
    searchQuery: state.gameSearchQuery || result.title,
    reconciliation: result.reconciliation || null,
    duplicateOf: result.duplicateOf || "",
    duplicateSource: result.duplicateSource || "",
  };
}

function applySearchResultState(result, userState = "saved") {
  if (!result?.title) return;
  const seed = canonicalSearchResultSeed(result);
  if (seed) {
    setGameState(seed.title, userState);
    recordUserEvent("search_seed_state_changed", seed.title, { source: result.sourceId, state: userState });
    return explicitUserGame(seed.title);
  }

  const base = searchResultMemoryRecord(result);
  const key = titleKey(base.title);
  const next = applyStateToUserGame(base, userState);
  next.source = base.source;
  next.catalogStatus = base.catalogStatus;
  next.matchConfidence = base.matchConfidence;
  next.coverStatus = base.coverStatus;
  next.priceStatus = base.priceStatus;
  next.provider = base.provider;
  next.sourceUrl = base.sourceUrl;
  next.coverUrl = base.coverUrl;
  next.coverLicenseNote = base.coverLicenseNote;
  next.platforms = base.platforms;
  next.atoms = base.atoms;
  next.inferredAtoms = base.inferredAtoms;
  next.vibe = base.vibe;
  next.enrichmentStatus = base.enrichmentStatus;
  next.enrichmentSummary = base.enrichmentSummary;
  next.enrichmentRisk = base.enrichmentRisk;
  next.searchQuery = base.searchQuery;
  next.reconciliation = base.reconciliation;
  next.duplicateOf = base.duplicateOf;
  next.duplicateSource = base.duplicateSource;
  state.userGames[key] = next;
  state.userStates[key] = { title: next.title, state: legacyStateFromUserGame(next), updatedAt: next.updatedAt };
  state.hidden.delete(next.title);
  state.saved.delete(next.title);
  state.snoozed.delete(next.title);
  if (next.hidden) state.hidden.add(next.title);
  if (next.saved) state.saved.add(next.title);
  recordUserEvent("search_external_state_changed", result.title, {
    source: result.sourceId,
    canonicalTitle: next.title,
    state: userState,
    access: next.access,
    completionStatus: next.completionStatus,
    saved: next.saved,
    hidden: next.hidden,
    catalogStatus: result.catalogStatus,
    matchConfidence: result.matchConfidence,
    priceStatus: result.priceStatus,
    coverStatus: result.coverStatus,
    coverProvider: result.provider || result.sourceId,
  });
  recordFeedback(userState, next.title);
  return next;
}

function addSearchResultToMemory(result, userState = "saved") {
  return applySearchResultState(result, userState);
}

function addSearchResultToWishlist(result) {
  return applySearchResultState(result, "saved");
}

async function runProviderSearch() {
  const query = (els.gameSearchInput.value || state.gameSearchQuery || "").trim();
  state.gameSearchQuery = query;
  if (query.length < 2) {
    state.providerSearch = {
      query,
      status: "idle",
      provider: "",
      sourceHealth: "query_too_short",
      sourceHealthDetail: "",
      results: [],
      error: "",
      resultShapeVersion: "",
      fallbackUsed: false,
      recoverable: true,
      httpStatus: null,
      retryAfterSeconds: null,
    };
    render();
    return;
  }

  state.providerSearch = {
    query,
    status: "loading",
    provider: "",
    sourceHealth: "requesting",
    sourceHealthDetail: "Requesting optional provider metadata.",
    results: [],
    error: "",
    resultShapeVersion: "",
    fallbackUsed: false,
    recoverable: true,
    httpStatus: null,
    retryAfterSeconds: null,
  };
  render();

  try {
    const endpoint = new URL(PROVIDER_SEARCH_ENDPOINT);
    endpoint.searchParams.set("q", query);
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) throw new Error(`Provider search failed: ${response.status}`);
    const payload = await response.json();
    state.providerSearch = {
      query,
      status: payload.mode === "provider_live" ? "live" : "fallback",
      provider: payload.provider || "",
      sourceHealth: payload.sourceHealth || payload.mode || "unknown",
      sourceHealthDetail: payload.sourceHealthDetail || "",
      results: Array.isArray(payload.results) ? payload.results : [],
      error: payload.error || "",
      resultShapeVersion: payload.resultShapeVersion || "",
      fallbackUsed: Boolean(payload.fallbackUsed),
      recoverable: Boolean(payload.recoverable),
      httpStatus: payload.httpStatus || null,
      retryAfterSeconds: payload.retryAfterSeconds || null,
      checkedAt: payload.checkedAt || "",
    };
  } catch (error) {
    state.providerSearch = {
      query,
      status: "offline",
      provider: "",
      sourceHealth: "provider_unavailable",
      sourceHealthDetail: "Provider endpoint did not answer; local search and manual add are still usable.",
      results: [],
      error: error.message,
      resultShapeVersion: "",
      fallbackUsed: false,
      recoverable: true,
      httpStatus: null,
      retryAfterSeconds: null,
    };
  }
  render();
}



function feedbackSource(title) {
  return sourceGames().find((game) => titleMatches(game.title, title))
    || monthlyDrop.find((item) => titleMatches(item.title, title))
    || tasteRadar.find((item) => titleMatches(item.title, title));
}















function parseNotebook() {
  const notebook = emptyNotebook();
  let section = "wishlist";
  let wishlistWeight = 0;
  let rank = 0;

  state.notebookImport
    .split(/\n|\\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const nextSection = notebookSection(line);
      if (nextSection) {
        section = nextSection;
        wishlistWeight = 0;
        return;
      }

      const heartCount = (line.match(/\u2764/g) || []).length;
      if (heartCount) {
        section = "wishlist";
        wishlistWeight = heartCount;
        const title = stripNotebookMarker(line);
        if (title) notebook.wishlist.push({ title, hearts: wishlistWeight });
        return;
      }

      if (/^_+$/.test(line)) return;

      if (section === "wishlist" && wishlistWeight > 0) {
        notebook.wishlist.push({ title: stripNotebookMarker(line), hearts: wishlistWeight });
      } else if (section === "access") {
        const kind = line.includes("\u2795") ? "subscription" : line.includes("\u267B") ? "permanent" : "available";
        notebook.access.push({ title: stripNotebookMarker(line), kind });
      } else if (section === "prices") {
        const match = line.match(/^(.*?)\s*-\s*(\d+(?:[,.]\d+)?)\s*(?:\u20AC|EUR)?$/i);
        if (match) notebook.prices.push({ title: match[1].trim(), price: Number(match[2].replace(",", ".")), currency: "EUR" });
      } else if (section === "completed") {
        notebook.completed.push({ title: stripNotebookMarker(line) });
      } else if (section === "ranked") {
        rank += 1;
        notebook.ranked.push({ title: stripNotebookMarker(line), rank });
      } else if (section === "upcoming") {
        const [title, date] = line.split(/\s+-\s+/);
        notebook.upcoming.push({ title: title.trim(), date: date?.trim() || "" });
      }
    });

  state.notebook = notebook;
}

function analyzeTasteImport() {
  const weights = {};
  const matched = [];
  state.ratingImport
    .split(/\n|\\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const parsed = parseRatingLine(line);
      if (!parsed) return;
      const game = findRatedGame(parsed.title);
      if (!game) return;
      const polarity = parsed.rating >= 7 ? 1 : parsed.rating <= 5 ? -1 : 0;
      const strength = polarity > 0 ? parsed.rating - 6 : polarity < 0 ? 6 - parsed.rating : 0;
      if (strength === 0) return;
      gameSignals(game).forEach((signal) => {
        weights[signal] = (weights[signal] || 0) + polarity * strength;
      });
      matched.push({ title: game.title, rating: parsed.rating });
    });
  state.atomWeights = weights;
  state.importedRatings = matched;
}

function applyQuickEntry() {
  const quickProfile = [
    { title: "The Last of Us Part I", reaction: "loved" },
    { title: "Red Dead Redemption 2", reaction: "loved" },
    { title: "The Witcher 3: Wild Hunt", reaction: "loved" },
    { title: "Cyberpunk 2077", reaction: "loved" },
    { title: "God of War Ragnarok", reaction: "loved" },
    { title: "Hades", reaction: "loved" },
    { title: "Disco Elysium", reaction: "played" },
    { title: "Stardew Valley", reaction: "played" },
    { title: "Resident Evil 4", reaction: "played" },
    { title: "Baldur's Gate 3", reaction: "not_for_me" },
  ];
  const quickLiked = quickProfile.filter((item) => item.reaction === "loved").map((item) => item.title);
  state.entryPath = "quick";
  state.entryResult = `${quickProfile.length}/${profileGames.length} known games, taste weights, instant shortlist`;
  state.liked = new Set(quickLiked);
  state.quickReactions = makeQuickReactionMap(quickProfile);
  state.ratingImport = QUICK_RATING_LINES.join("\n");
  state.activeCluster = "play";
  analyzeTasteImport();
  recordFeedback("entry_quick", "Quick taste");
  render();
}

function applyPsnDemoEntry() {
  state.entryPath = "psn";
  state.entryResult = "Best available game first, purchase guardrails, PS Plus context";
  state.liked = new Set(["The Last of Us Part I", "God of War Ragnarok", "Hades", "Stardew Valley"]);
  state.quickReactions = makeQuickReactions([...state.liked]);
  PSN_DEMO_STATES.forEach((item) => setGameState(item.title, item.state));
  state.activeCluster = "library";
  recordFeedback("entry_psn_demo", "PSN library");
  render();
}

function applyDeepEntry() {
  state.entryPath = "deep";
  state.entryResult = "Batch ratings, stronger taste vector";
  state.liked = new Set(["The Last of Us Part I", "Disco Elysium", "Ghost of Tsushima", "Baldur's Gate 3", "Stray"]);
  state.quickReactions = makeQuickReactions([...state.liked]);
  state.ratingImport = DEEP_RATING_LINES.join("\n");
  state.activeCluster = "play";
  analyzeTasteImport();
  recordFeedback("entry_deep", "Deep rating");
  render();
}

function renderQuickSwipeDeck() {
  const answered = quickReactionCount();
  const signalCount = quickTasteSignalCount();
  const nextGame = nextDiagnosticGame();
  if (!nextGame) {
    els.quickSwipeDeck.innerHTML = `
      <div class="quick-swipe-card is-complete">
        <span>Quick profile complete</span>
        <strong>${answered}/${profileGames.length} games answered</strong>
        <p>You can still improve the profile later with PSN access or any pasted rating list.</p>
        ${state.lastUndo?.action === "quick_taste" ? renderUndoStrip("quick-swipe-undo") : ""}
      </div>
    `;
    bindUndoButtons(els.quickSwipeDeck);
    return;
  }

  const answeredProgress = Math.round((answered / profileGames.length) * 100);
  const signalProgress = Math.min(100, Math.round((signalCount / QUICK_TASTE_FIRST_TARGET) * 100));
  const sharpProgress = Math.min(100, Math.round((signalCount / QUICK_TASTE_SHARP_TARGET) * 100));
  const firstAnswerCopy = signalCount >= QUICK_TASTE_FIRST_TARGET ? "Ready" : `${Math.max(0, QUICK_TASTE_FIRST_TARGET - signalCount)} to go`;
  const sharpCopy = signalCount >= QUICK_TASTE_SHARP_TARGET ? "Sharp" : `${Math.max(0, QUICK_TASTE_SHARP_TARGET - signalCount)} to sharp`;
  const missingAtoms = uncoveredDiagnosticAtoms();
  const conflict = quickTasteConflictReport();
  const gate = tasteGateState();
  const followUpHint = quickSwipeFollowUpHint(nextGame, missingAtoms, conflict);
  const proofTitle = gate.ready ? `${gate.maturityLabel}: cautious answer ready` : `${QUICK_TASTE_FIRST_TARGET} taste signals unlock the first hypothesis`;
  const proofDetail = gate.ready
    ? gate.maturity
    : "Liked and Not for me both teach taste. Not played just moves on without pretending you rated it.";

  els.quickSwipeDeck.innerHTML = `
    <div class="quick-swipe-card">
      <div class="quick-swipe-top">
        <span class="quick-swipe-focus">${quickSwipeFocusLabel(nextGame, missingAtoms, conflict)}</span>
        <span class="quick-swipe-progress">${answered}/${profileGames.length}</span>
      </div>
      <div class="quick-swipe-main">
        <span class="quick-swipe-axis">${nextGame.axis || "Taste signal"}</span>
        <strong>${nextGame.title}</strong>
        <div class="quick-swipe-atom-row">${quickSwipeAtomChips(nextGame, missingAtoms, conflict)}</div>
      </div>
      <div class="quick-swipe-proof">
        <span>${proofTitle}</span>
        <p>${proofDetail}</p>
        <small>${followUpHint}</small>
      </div>
      <div class="quick-swipe-meters">
        <div>
          <span>Profile</span>
          <strong>${answered}/${profileGames.length}</strong>
          <span class="quick-swipe-track" aria-hidden="true"><span style="width:${answeredProgress}%"></span></span>
        </div>
        <div>
          <span>First hypothesis</span>
          <strong>${firstAnswerCopy}</strong>
          <span class="quick-swipe-track" aria-hidden="true"><span style="width:${signalProgress}%"></span></span>
        </div>
        <div>
          <span>Sharper profile</span>
          <strong>${sharpCopy}</strong>
          <span class="quick-swipe-track" aria-hidden="true"><span style="width:${sharpProgress}%"></span></span>
        </div>
      </div>
      <div class="quick-swipe-actions" role="group" aria-label="${nextGame.title} swipe reaction">
        <button data-swipe-reaction="not_for_me" type="button">Not for me</button>
        <button data-swipe-reaction="unplayed" type="button">Not played</button>
        <button data-swipe-reaction="loved" type="button">Liked</button>
      </div>
      ${state.lastUndo?.action === "quick_taste" ? renderUndoStrip("quick-swipe-undo") : ""}
    </div>
  `;

  els.quickSwipeDeck.querySelectorAll("[data-swipe-reaction]").forEach((button) => {
    button.addEventListener("click", () => setQuickReaction(nextGame, button.dataset.swipeReaction));
  });
  bindUndoButtons(els.quickSwipeDeck);
}

function renderTasteGate() {
  const gate = tasteGateState();
  els.tasteGate.className = `taste-gate ${gate.ready ? "is-ready" : "is-learning"}`;
  els.tasteGate.innerHTML = `
    <div>
      <strong>${gate.title}</strong>
      <p>${gate.detail}</p>
    </div>
    <span>${gate.count}/${profileGames.length}</span>
    <div class="taste-gate-track" aria-hidden="true">
      <span style="width:${gate.progress}%"></span>
    </div>
    <div class="taste-maturity">
      <strong>${gate.ready ? "Your taste profile has started" : "First opinion in progress"}</strong>
      <p>${gate.maturity}</p>
    </div>
    <div class="taste-payoff">
      <div class="taste-payoff-head">
        <span>${gate.payoff.label}</span>
        <strong>${gate.payoff.title}</strong>
        <small>${gate.payoff.detail}</small>
      </div>
      <div class="taste-payoff-ladder">
        ${gate.payoffMilestones.map((item) => `
          <div class="taste-payoff-step ${item.state}">
            <span>${item.target}</span>
            <strong>${item.label}</strong>
            <small>${item.state === "done" ? item.detail : `${item.remaining} more`}</small>
          </div>
        `).join("")}
      </div>
    </div>
    ${gate.insights.length ? `
      <div class="taste-gate-insights">
        ${gate.insights.map((item) => `
          <div class="taste-gate-insight">
            <span>${item.label}</span>
            <strong>${item.value}</strong>
          </div>
        `).join("")}
      </div>
    ` : ""}
  `;
}

function renderEntryPaths() {
  els.entryStatus.textContent = entryLabel();
  const reactionSummary = quickReactionSummary();
  const reactionCount = quickReactionCount();
  const signalCount = quickTasteSignalCount();
  const routeProof = entryRouteProofCopy();
  const quickResult = reactionCount
    ? `${reactionCount}/${profileGames.length} answered, ${signalCount} taste signals: ${reactionSummary.loved} liked / ${reactionSummary.notForMe} no / ${reactionSummary.unplayed} not played`
    : state.entryResult;
  els.entryRouteProof.innerHTML = `
    <span>${routeProof.label}</span>
    <strong>${routeProof.value}</strong>
  `;
  els.entryResult.textContent = state.entryPath === "quick"
    ? quickResult || `Mark ${QUICK_TASTE_FIRST_TARGET}+ taste signals, then keep swiping toward ${profileGames.length}`
    : state.entryResult || "Pick a start path";
  els.entryCards.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.entryPath === state.entryPath);
  });
}


function recordFeedback(action, title) {
  state.feedbackLog = [
    { action, title, at: new Date().toISOString() },
    ...state.feedbackLog,
  ].slice(0, 20);
}

function setDropDecision(title, decision) {
  const key = titleKey(title);
  if (!decision) {
    delete state.dropDecisions[key];
    recordFeedback("drop_clear", title);
    return;
  }
  state.dropDecisions[key] = { title, decision, updatedAt: new Date().toISOString() };
  recordFeedback(`drop_${decision}`, title);
}

function dropDecision(title) {
  return state.dropDecisions[titleKey(title)]?.decision || state.dropDecisions[normalizeTitle(title)]?.decision || "";
}

function monthlyDropItem(title) {
  return monthlyDrop.find((item) => titleMatches(item.title, title));
}
function renderDebug(game) {
  const breakdown = scoreBreakdown(game);
  const max = Math.max(...breakdown.map((item) => Math.abs(item.value)), 1);
  els.debugSummary.textContent = `${Math.max(game.score, 0)} fit / ${state.activeRegion}`;
  els.debugList.replaceChildren(
    ...breakdown.map((item) => {
      const row = document.createElement("div");
      const width = `${Math.round((Math.abs(item.value) / max) * 100)}%`;
      row.className = "debug-row";
      row.innerHTML = `
        <span>${item.label}</span>
        <span class="debug-bar"><span class="debug-fill ${item.value < 0 ? "negative" : ""}" style="width:${width}"></span></span>
        <strong>${item.value}</strong>
      `;
      return row;
    }),
  );
}

// ── Taste profile archetypes ─────────────────────────────────────────────────
const TASTE_ARCHETYPES = [
  { label: "Story Explorer",  atoms: ["story", "adventure", "narrative", "walking-sim"] },
  { label: "Action Hunter",   atoms: ["action", "combat", "shooter", "hack-and-slash"] },
  { label: "World Builder",   atoms: ["open-world", "rpg", "exploration", "sandbox"] },
  { label: "Thrill Seeker",   atoms: ["horror", "survival", "stealth", "tension"] },
  { label: "Puzzle Thinker",  atoms: ["puzzle", "indie", "logic", "mystery"] },
  { label: "System Master",   atoms: ["roguelike", "strategy", "tactics", "deck-builder"] },
  { label: "Souls Veteran",   atoms: ["souls-like", "hard", "precision", "boss-rush"] },
  { label: "Platformer Fan",  atoms: ["platformer", "metroidvania", "precision", "collectathon"] },
  { label: "Sport & Racing",  atoms: ["racing", "sports", "simulation", "driving"] },
];

function buildTasteProfileText() {
  // Gather signals: quickReactions + importedRatings
  const reactions = Object.values(state.quickReactions || {});
  const loved = reactions.filter((r) => r.reaction === "loved").map((r) => r.title);
  const avoided = reactions.filter((r) => r.reaction === "not_for_me").map((r) => r.title);
  const totalSignals = reactions.length + (state.importedRatings || []).length;

  // Atom weights: positive & negative
  const weights = state.atomWeights || {};
  const positiveAtoms = Object.entries(weights)
    .filter(([, w]) => w > 0.3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([a]) => a);
  const negativeAtoms = Object.entries(weights)
    .filter(([, w]) => w < -0.3)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([a]) => a);

  // Infer atoms from loved games (quickReactions)
  const pool = recommendationPool();
  const lovedAtomCounts = {};
  loved.forEach((title) => {
    const game = pool.find((g) => g.title === title);
    if (!game) return;
    (game.atoms || []).forEach((a) => { lovedAtomCounts[a] = (lovedAtomCounts[a] || 0) + 1; });
  });
  const topLovedAtoms = Object.entries(lovedAtomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([a]) => a);

  // Merge: atomWeights > lovedAtoms
  const allPositive = [...new Set([...positiveAtoms, ...topLovedAtoms])].slice(0, 5);

  // Profile strength
  const strength = totalSignals === 0 ? "none"
    : totalSignals < 5 ? "weak"
    : totalSignals < 15 ? "moderate"
    : "strong";

  // Archetype
  const archetypeScores = TASTE_ARCHETYPES.map((a) => ({
    label: a.label,
    score: a.atoms.filter((atom) => allPositive.includes(atom)).length
      - a.atoms.filter((atom) => negativeAtoms.includes(atom)).length,
  })).filter((a) => a.score > 0).sort((a, b) => b.score - a.score);
  const archetype = archetypeScores[0]?.label || null;

  // Sample liked game titles (up to 3, from loved quickReactions)
  const lovedSample = loved.slice(0, 3);

  return { totalSignals, strength, allPositive, negativeAtoms, archetype, lovedSample, loved, avoided };
}

function renderTasteProfile() {
  const sorted = Object.entries(state.atomWeights)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 8);
  els.tasteSummary.textContent = state.importedRatings.length
    ? `${state.importedRatings.length} ratings analyzed`
    : "Manual profile";
  els.tasteAtoms.replaceChildren(
    ...sorted.map(([signal, weight]) => {
      const item = document.createElement("span");
      item.className = `atom-pill ${weight < 0 ? "negative" : ""}`;
      item.textContent = `${signal} ${weight > 0 ? "+" : ""}${Math.round(weight)}`;
      return item;
    }),
  );

  // Rich profile summary
  if (!els.tasteProfileSummary) return;
  const { totalSignals, strength, allPositive, negativeAtoms, archetype, lovedSample } = buildTasteProfileText();

  if (els.tasteProfileBadge) {
    els.tasteProfileBadge.textContent = totalSignals === 0 ? "No signals yet"
      : strength === "weak" ? `${totalSignals} signals · Building…`
      : `${totalSignals} signals · ${strength === "strong" ? "Strong" : "Moderate"} profile`;
  }

  if (totalSignals === 0) {
    els.tasteProfileSummary.innerHTML = `<p class="taste-profile-empty">Rate a few games to see your taste profile here.</p>`;
    return;
  }

  // Build sentences
  const parts = [];

  if (archetype) {
    parts.push(`<strong class="taste-archetype">${archetype}</strong>`);
  }

  if (allPositive.length) {
    const listed = allPositive.slice(0, 4).join(", ");
    parts.push(`<p class="taste-line">You gravitate toward <em>${listed}</em> games.`
      + (negativeAtoms.length ? ` You tend to skip <em>${negativeAtoms.slice(0, 2).join(", ")}</em>.` : "")
      + `</p>`);
  }

  if (lovedSample.length) {
    parts.push(`<p class="taste-line taste-liked-games">Liked: ${lovedSample.map((t) => `<span>${t}</span>`).join("")}</p>`);
  }

  if (state.importedRatings?.length) {
    parts.push(`<p class="taste-line">Enriched with ${state.importedRatings.length} imported ratings.</p>`);
  }

  els.tasteProfileSummary.innerHTML = parts.join("\n");
}

function renderSessionStats() {
  const summary = sessionSummary();
  const fmt = (min) => min >= 60
    ? `${Math.floor(min / 60)}h ${min % 60}m`
    : `${min}m`;
  els.sessionCurrent.textContent = summary.currentMin > 0 ? fmt(summary.currentMin) : "—";
  els.sessionTotal.textContent = summary.totalMin > 0 ? fmt(summary.totalMin) : "—";
  els.sessionCount.textContent = summary.sessionCount || "—";
  els.sessionAvg.textContent = summary.avgMin > 0 ? fmt(summary.avgMin) : "—";
  els.sessionStatus.textContent = summary.currentMin > 0 ? "Active" : "Idle";
}

function renderNotebookProfile() {
  const notebook = state.notebook;
  const counts = [
    ["wish", notebook.wishlist.length],
    ["access", notebook.access.length],
    ["prices", notebook.prices.length],
    ["done", notebook.completed.length],
    ["ranked", notebook.ranked.length],
    ["upcoming", notebook.upcoming.length],
  ];
  const total = counts.reduce((sum, [, value]) => sum + value, 0);
  els.notebookSummary.textContent = total ? `${total} signals parsed` : "No note parsed";
  els.notebookPills.replaceChildren(
    ...counts.map(([label, value]) => {
      const item = document.createElement("span");
      item.className = "atom-pill";
      item.textContent = `${label} ${value}`;
      return item;
    }),
  );
}

// ── Stats page ────────────────────────────────────────────────────────────────

function renderStats() {
  if (!els.statsGrid) return;

  const pool = recommendationPool();
  const userGames = Object.values(state.userGames || {});
  const region = state.activeRegion || "US";

  // Library by status
  const byStatus = {
    playing:   userGames.filter((g) => g.access === "playing").length,
    completed: userGames.filter((g) => g.completionStatus === "completed").length,
    dropped:   userGames.filter((g) => g.completionStatus === "dropped").length,
    owned:     userGames.filter((g) => ["owned_forever", "owned_disc"].includes(g.access)).length,
    saved:     userGames.filter((g) => g.saved).length,
    psPlus:    userGames.filter((g) => g.access === "psplus").length,
  };
  const totalTracked = userGames.length;

  // Reactions
  const reactions = Object.values(state.quickReactions || {});
  const loved = reactions.filter((r) => r.reaction === "loved").length;
  const avoided = reactions.filter((r) => r.reaction === "not_for_me").length;

  // HLTB hours for library games
  const libraryTitles = new Set(userGames.map((g) => g.title));
  const hltbGames = pool.filter((g) => libraryTitles.has(g.title) && g.hltbHours);
  const hltbTotal = hltbGames.reduce((sum, g) => sum + (g.hltbHours || 0), 0);
  const completedTitles = new Set(userGames.filter((g) => g.completionStatus === "completed").map((g) => g.title));
  const hltbDone = pool.filter((g) => completedTitles.has(g.title) && g.hltbHours)
    .reduce((sum, g) => sum + (g.hltbHours || 0), 0);

  // Coverage
  const withPrice = pool.filter((g) => typeof g.prices?.[region] === "number").length;
  const withCover = pool.filter((g) => ["candidate","verified"].includes(g.coverMeta?.status)).length;
  const inPsPlus = pool.filter((g) => (g.psPlus || []).includes(region)).length;

  // Top atoms from liked games
  const atomCounts = {};
  reactions.filter((r) => r.reaction === "loved").forEach(({ title }) => {
    const game = pool.find((g) => g.title === title);
    (game?.atoms || []).forEach((a) => { atomCounts[a] = (atomCounts[a] || 0) + 1; });
  });
  Object.entries(state.atomWeights || {}).filter(([, w]) => w > 0).forEach(([a, w]) => {
    atomCounts[a] = (atomCounts[a] || 0) + Math.round(w);
  });
  const topAtoms = Object.entries(atomCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Badge
  if (els.statsBadge) {
    els.statsBadge.textContent = `${totalTracked} tracked`;
  }

  // Render stat tiles
  const tiles = [
    { label: "Tracked games", value: totalTracked, sub: `${loved} liked · ${avoided} skipped` },
    { label: "Playing now", value: byStatus.playing, sub: "active sessions" },
    { label: "Completed", value: byStatus.completed, sub: `~${Math.round(hltbDone)}h by HLTB` },
    { label: "Wishlist", value: byStatus.saved, sub: "buy-later queue" },
    { label: "Owned", value: byStatus.owned + byStatus.psPlus, sub: `${byStatus.psPlus} via PS Plus` },
    { label: "HLTB backlog", value: `~${Math.round(hltbTotal)}h`, sub: `${hltbGames.length} games estimated` },
    { label: `Prices (${region})`, value: withPrice, sub: `of ${pool.length} catalog games` },
    { label: "Cover images", value: withCover, sub: `of ${pool.length} in catalog` },
    { label: `PS Plus (${region})`, value: inPsPlus, sub: "titles included" },
  ];

  els.statsGrid.replaceChildren(...tiles.map(({ label, value, sub }) => {
    const tile = document.createElement("div");
    tile.className = "stats-tile";
    tile.innerHTML = `<strong>${value}</strong><span>${label}</span><small>${sub}</small>`;
    return tile;
  }));

  // Render top atoms
  if (topAtoms.length) {
    const heading = document.createElement("h3");
    heading.className = "stats-section-heading";
    heading.textContent = "Your taste atoms";
    const pills = topAtoms.map(([atom, count]) => {
      const pill = document.createElement("span");
      pill.className = "atom-pill";
      pill.textContent = `${atom} ×${count}`;
      return pill;
    });
    els.statsAtoms.replaceChildren(heading, ...pills);
  } else {
    els.statsAtoms.replaceChildren();
  }

  // Dropped games
  if (byStatus.dropped > 0 && els.statsTimeline) {
    const heading = document.createElement("h3");
    heading.className = "stats-section-heading";
    heading.textContent = "Dropped games";
    const droppedGames = userGames
      .filter((g) => g.completionStatus === "dropped")
      .map((g) => {
        const tag = document.createElement("span");
        tag.className = "atom-pill negative";
        tag.textContent = g.title;
        tag.style.cursor = "pointer";
        tag.addEventListener("click", () => openGameDetail(g.title));
        return tag;
      });
    els.statsTimeline.replaceChildren(heading, ...droppedGames);
  } else {
    els.statsTimeline?.replaceChildren();
  }
}

// ── Onboarding ────────────────────────────────────────────────────────────────

const ONBOARDING_SIGNAL_TARGET = 3;

function renderOnboardingHero() {
  const hero = document.querySelector("#onboarding-hero");
  if (!hero) return;

  const signals = quickReactionCount();
  const isNewUser = signals < ONBOARDING_SIGNAL_TARGET && Object.keys(state.userGames || {}).length === 0;

  if (!isNewUser) {
    if (!hero.classList.contains("is-hidden") && !hero.classList.contains("is-completing")) {
      // First time crossing the threshold — animate out
      hero.classList.add("is-completing");
      setTimeout(() => {
        hero.classList.add("is-hidden");
        hero.classList.remove("is-completing");
        const topPick = document.querySelector("#top-pick");
        if (topPick) topPick.scrollIntoView({ behavior: "smooth", block: "start" });
        // Show brief toast
        const toast = document.createElement("div");
        toast.className = "onboarding-toast";
        toast.textContent = "✓ Your first pick is ready!";
        document.body.append(toast);
        setTimeout(() => toast.remove(), 2800);
      }, 500);
    } else {
      hero.classList.add("is-hidden");
    }
    return;
  }
  hero.classList.remove("is-hidden", "is-completing");

  // Progress bar
  const pct = Math.min(100, Math.round((signals / ONBOARDING_SIGNAL_TARGET) * 100));
  const fill = document.querySelector("#onboarding-progress-fill");
  const label = document.querySelector("#onboarding-progress-label");
  if (fill) fill.style.width = `${pct}%`;
  if (label) label.textContent = signals === 0
    ? `Rate ${ONBOARDING_SIGNAL_TARGET} games to unlock your first pick`
    : `${signals} of ${ONBOARDING_SIGNAL_TARGET} — ${ONBOARDING_SIGNAL_TARGET - signals} more to go`;

  // Featured games — top by criticScore from full catalog
  const featured = document.querySelector("#onboarding-featured");
  if (!featured || featured.dataset.populated === "1") return;
  const pool = recommendationPool()
    .filter((g) => g.criticScore >= 85)
    .sort((a, b) => (b.criticScore || 0) - (a.criticScore || 0))
    .slice(0, 8);
  featured.dataset.populated = "1";
  featured.replaceChildren(...pool.map((game) => {
    const reaction = state.quickReactions[game.title];
    const btn = document.createElement("button");
    btn.className = `onboarding-game-tile ${reaction ? `is-${reaction}` : ""}`;
    btn.dataset.onboardingTitle = game.title;
    btn.innerHTML = `
      <div class="onboarding-tile-poster" style="background:${game.color || "var(--panel)"}"></div>
      <div class="onboarding-tile-body">
        <strong>${game.title}</strong>
        <span>${(game.atoms || []).slice(0, 2).join(" · ")}</span>
      </div>
      <div class="onboarding-tile-actions">
        <button class="onboarding-like ${reaction === "liked" ? "is-active" : ""}" data-onboard-react="liked" data-onboard-title="${game.title}" type="button">👍</button>
        <button class="onboarding-pass ${reaction === "not_for_me" ? "is-active" : ""}" data-onboard-react="not_for_me" data-onboard-title="${game.title}" type="button">👎</button>
      </div>
    `;
    return btn;
  }));
  featured.querySelectorAll("[data-onboard-react]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const title = btn.dataset.onboardTitle;
      const reaction = btn.dataset.onboardReact;
      const current = state.quickReactions[title];
      state.quickReactions[title] = current === reaction ? undefined : reaction;
      if (state.quickReactions[title] === undefined) delete state.quickReactions[title];
      featured.dataset.populated = "";
      render();
    });
  });
}

function renderValueStats(ranked) {
  const region = state.activeRegion;
  const radarLeads = rankedRadar().filter((item) => item.score >= 20).length;
  const timeFitCount = ranked.filter((game) => game.session === state.session || game.adultTimeFit === "weeknight").length;
  const guardedCount = ranked.filter((game) => game.prices[region] <= Number(state.budget) && blocksPurchase(game)).length;
  els.screenedCount.textContent = `${ranked.length} games`;
  els.bestDeal.textContent = `${radarLeads} leads`;
  els.timeFit.textContent = `${timeFitCount} picks`;
  els.libraryCount.textContent = `${stateCount()} states`;
  els.guardedCount.textContent = `${guardedCount} skips`;
}
function firstRunFlow(ranked) {
  const topGame = primaryDecisionGame(ranked);
  const reactions = quickReactionSummary();
  const signalCount = quickTasteSignalCount();
  const gate = tasteGateState();
  const confidence = topGame ? explain(topGame, topGame.score).confidence : "Need signal";
  const watchout = topGame ? watchOutCopy(topGame) : null;
  const access = topGame ? effectiveGameState(topGame) : "";
  const buyLater = buyLaterCandidate(ranked);
  const actionValue = topGame
    ? access ? "Play now"
      : buyLater && titleMatches(buyLater.title, topGame.title) ? "Watch price"
        : "Try tonight"
    : "Add taste";
  const actionDetail = topGame
    ? access ? USER_STATE_LABELS[access] || access
      : buyLater && titleMatches(buyLater.title, topGame.title) ? `${state.activeRegion} ${formatPrice(topGame, state.activeRegion)}`
        : `${state.session} session`
    : "No pick yet";

  return {
    status: `${isLibraryFirstMode(topGame) ? "library ready" : gate.ready ? gate.maturityLabel.toLowerCase() : "learning"} / ${confidence}`,
    steps: [
      {
        label: isLibraryFirstMode(topGame) ? "Library" : "Taste",
        value: isLibraryFirstMode(topGame) ? `${games.filter(isAlreadyAvailable).length} playable` : `${signalCount}/${QUICK_TASTE_FIRST_TARGET}`,
        detail: gate.conflict.hasConflict ? `mixed ${gate.conflict.atoms.join(" / ")}` : `${reactions.loved} loved / ${reactions.played} played / ${reactions.notForMe} no`,
        state: signalCount >= QUICK_TASTE_FIRST_TARGET ? "done" : "active",
      },
      {
        label: "Tonight",
        value: `${state.mood} / ${state.session}`,
        detail: `${state.difficulty} friction`,
        state: "done",
      },
      {
        label: "Pick",
        value: topGame ? topGame.title : "Waiting",
        detail: topGame
          ? `${isLibraryFirstMode(topGame) ? USER_STATE_LABELS[effectiveGameState(topGame)] || effectiveGameState(topGame) : confidence} / ${watchout.label}`
          : "need taste",
        state: topGame ? "done" : "active",
      },
      {
        label: "Action",
        value: actionValue,
        detail: actionDetail,
        state: topGame ? "done" : "active",
      },
    ],
  };
}
function runFirstRunAction(action, title) {
  if (action === "quick-entry") {
    applyQuickEntry();
    return;
  }
  if (action === "focus-answer") {
    focusAnswerAgenda();
    return;
  }
  if (action === "more-signal") {
    focusKnownGames();
    return;
  }
  if (action === "psn-demo") {
    applyPsnDemoEntry();
    return;
  }
  if (action === "open-taste-import") {
    focusTasteImport();
    return;
  }
  runAnswerAction(action, title);
  render();
}

function renderFirstRunFlow(ranked) {
  const flow = firstRunFlow(ranked);
  const bridge = firstRunBridge(ranked);
  els.firstRunStatus.textContent = flow.status;
  els.firstRunGrid.replaceChildren(
    ...flow.steps.map((step) => {
      const item = document.createElement("div");
      item.className = `first-run-step ${step.state}`;
      item.innerHTML = `
        <span>${step.label}</span>
        <strong>${step.value}</strong>
        <small>${step.detail}</small>
      `;
      return item;
    }),
  );
  if (bridge.preSwipe) {
    els.firstRunBridge.innerHTML = `
      <div class="first-run-pre-swipe">
        <div>
          <strong>${bridge.title}</strong>
          <p>${bridge.detail}</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="first-run-start-cta" data-first-run-action="more-signal" data-first-run-title="" type="button">Start swiping</button>
          <button data-first-run-action="quick-entry" data-first-run-title="" type="button" style="min-height:36px;border:1px solid var(--line);border-radius:8px;background:#fff;color:#334155;padding:0 14px;font-size:0.82rem;font-weight:850;cursor:pointer;">Quick fill (demo)</button>
        </div>
      </div>
    `;
    els.firstRunBridge.querySelectorAll("[data-first-run-action]").forEach((button) => {
      button.addEventListener("click", () => runFirstRunAction(button.dataset.firstRunAction, button.dataset.firstRunTitle));
    });
    return;
  }

  els.firstRunBridge.innerHTML = `
    <div class="first-run-copy">
      <span class="first-run-confidence ${bridge.confidenceReady ? "is-ready" : ""}">${bridge.confidenceLabel}</span>
      <span class="first-run-eyebrow">${bridge.eyebrow || "First answer"}</span>
      <strong>${bridge.title}</strong>
      <p>${bridge.detail}</p>
    </div>
    ${bridge.proof ? `
      <div class="first-run-taste-proof">
        <div>
          <span>${bridge.proof.status}</span>
          <strong>${bridge.proof.pull}</strong>
          <small>Current pull</small>
        </div>
        <div>
          <span>Caution</span>
          <strong>${bridge.proof.caution}</strong>
          <small>Known risk</small>
        </div>
        <div>
          <span>Why this pick</span>
          <strong>${bridge.proof.why}</strong>
          <small>${bridge.proof.next}</small>
        </div>
      </div>
    ` : ""}
    ${bridge.summary?.length ? `
      <div class="first-run-mini-agenda">
        ${bridge.summary.map((item) => `
          <div class="first-run-mini-row">
            <span>${item.label}</span>
            <strong>${item.value}</strong>
            <small>${item.detail}</small>
          </div>
        `).join("")}
      </div>
    ` : ""}
    <div class="first-run-actions">
      ${bridge.actions.map((action) => `<button data-first-run-action="${action.id}" data-first-run-title="${action.title}" type="button">${action.label}</button>`).join("")}
    </div>
    ${bridge.nextSteps ? `
      <div class="first-run-next-steps">
        ${bridge.nextSteps.map((step) => `
          <button class="first-run-next-step" data-first-run-action="${step.id}" data-first-run-title="" type="button">
            <span>${step.tag}</span>
            <strong>${step.label}</strong>
            <small>${step.detail}</small>
          </button>
        `).join("")}
      </div>
    ` : ""}
    ${renderUndoStrip("first-run-undo")}
  `;
  els.firstRunBridge.querySelectorAll("[data-first-run-action]").forEach((button) => {
    button.addEventListener("click", () => runFirstRunAction(button.dataset.firstRunAction, button.dataset.firstRunTitle));
  });
  bindUndoButtons(els.firstRunBridge);
}
function runAnswerAction(action, title) {
  stageLastUndo(action, title);
  if (action === "play") setGameState(title, "playing");
  if (action === "save") setGameState(title, "saved");
  if (action === "snooze") snoozeGame(title);
  if (action === "clear-snoozes") clearSnoozedGames();
}
function renderCompanionAnswer(ranked) {
  const answer = companionAnswer(ranked);
  els.answerStatus.textContent = answer.status;
  els.answerCopy.innerHTML = `
    <div class="answer-main">
      <strong>${answer.title}</strong>
      ${answer.paragraphs.map((item) => `<p>${item}</p>`).join("")}
    </div>
    ${answer.evidence ? `<div class="personal-evidence answer-evidence">${renderEvidenceRows(answer.evidence, 4)}</div>` : ""}
    ${answer.agenda?.length ? `
      <div class="answer-agenda" aria-label="Tonight decision agenda">
        ${answer.agenda.map((item) => `
          <div class="answer-agenda-row tone-${item.tone || "neutral"} ${item.actions?.length ? "is-actionable" : "is-static"}">
            <span>${item.label}</span>
            <div>
              <strong>${item.title}</strong>
              <p>${item.detail}</p>
              ${item.forecast ? `
                <div class="rank-forecast">
                  <span>${item.forecast.label}</span>
                  <p>${item.forecast.detail}</p>
                </div>
              ` : ""}
            </div>
            ${item.actions?.length ? `
              <div class="answer-agenda-actions" aria-label="${item.title} actions">
                ${item.actions.map((action) => `<button data-agenda-action="${action.id}" data-agenda-title="${action.title}" type="button">${action.label}</button>`).join("")}
              </div>
            ` : ""}
          </div>
        `).join("")}
      </div>
    ` : ""}
    <div class="answer-chips">
      ${answer.chips.map((chip) => `<span>${chip}</span>`).join("")}
    </div>
    <div class="answer-actions">
      ${(answer.actions || []).map((action) => `<button data-answer-action="${action.id}" data-answer-title="${action.title || ""}" type="button">${action.label}</button>`).join("")}
    </div>
    ${renderUndoStrip("answer-undo")}
  `;
  els.answerCopy.querySelectorAll("[data-answer-action]").forEach((button) => {
    button.addEventListener("click", () => {
      runAnswerAction(button.dataset.answerAction, button.dataset.answerTitle);
      render();
    });
  });
  els.answerCopy.querySelectorAll("[data-agenda-action]").forEach((button) => {
    button.addEventListener("click", () => {
      runAnswerAction(button.dataset.agendaAction, button.dataset.agendaTitle);
      render();
    });
  });
  bindUndoButtons(els.answerCopy);
}
function renderFirstValueReceipt(ranked) {
  const cards = firstValueReceipt(ranked);
  const memory = tasteMemory();
  els.receiptSummary.textContent = `${entryLabel()} / ${memory.confidence} confidence`;
  els.receiptGrid.replaceChildren(
    ...cards.map((card) => {
      const item = document.createElement("div");
      item.className = "receipt-card";
      item.innerHTML = `
        <span>${card.label}</span>
        <strong>${card.title}</strong>
        <p>${card.detail}</p>
      `;
      if (card.action && card.gameTitle && card.stateAction) {
        const button = document.createElement("button");
        button.className = "receipt-action";
        button.type = "button";
        button.textContent = card.action;
        button.addEventListener("click", () => {
          setGameState(card.gameTitle, card.stateAction);
          render();
        });
        item.appendChild(button);
      }
      return item;
    }),
  );
}

function renderLibrary() {
  const pool = recommendationPool();
  const buckets = {
    later: [],
    want_to_finish: [],
    playing: [],
    paused: [],
    saved: [],
    owned_forever: [],
    owned: [],
    subscription: [],
    completed: [],
    dropped: [],
    hidden: [],
  };

  pool.forEach((game) => {
    const gameState = effectiveGameState(game);
    if (gameState && buckets[gameState]) buckets[gameState].push(game.title);
  });
  state.hidden.forEach((title) => {
    if (!buckets.hidden.includes(title)) buckets.hidden.push(title);
  });
  playLaterQueue().forEach((item) => {
    if (!buckets.later.includes(item.title)) buckets.later.push(item.title);
  });

  const visibleBuckets = [
    "later",
    "want_to_finish",
    "playing",
    "paused",
    "saved",
    "owned_forever",
    "owned",
    "subscription",
    "completed",
    "dropped",
    "hidden",
  ];
  const total = visibleBuckets.reduce((sum, key) => sum + buckets[key].length, 0);
  els.librarySummary.textContent = `${total} states`;
  els.libraryGrid.replaceChildren(
    ...visibleBuckets.map((key) => {
      const item = document.createElement("div");
      item.className = `library-bucket state-${stateClassName(key)} ${buckets[key].length ? "has-items" : "is-empty"}`;
      const names = buckets[key].slice(0, 5);
      item.innerHTML = `
        <strong>${USER_STATE_LABELS[key]} (${buckets[key].length})</strong>
        ${names.length ? names.map((name) => `<span>${name}</span>`).join("") : "<span>Empty</span>"}
      `;
      return item;
    }),
  );
}
function renderCompanionPlan(ranked) {
  const plan = companionPlan(ranked);
  els.planSummary.textContent = `${plan.length} next actions`;
  els.planList.replaceChildren(
    ...plan.map((item) => {
      const row = document.createElement("div");
      row.className = "plan-row";
      row.innerHTML = `
        <span class="plan-label">${item.label}</span>
        <div>
          <strong>${item.title}</strong>
          <p>${item.detail}</p>
        </div>
        <span class="plan-tag">${item.tag}</span>
      `;
      return row;
    }),
  );
}
function renderLibraryPlan(ranked) {
  const plan = libraryPlan(ranked);
  els.libraryPlanSummary.textContent =
    `${plan.playableCount} playable / ${plan.completedCount} done / ${plan.savedCount} saved`;

  els.libraryPlanList.replaceChildren(
    ...plan.rows.map((item) => {
      const row = document.createElement("div");
      row.className = `library-plan-row tone-${stateClassName(item.tone || item.label)}`;
      const facts = libraryPlanFacts(item)
        .slice(0, 4)
        .map((fact) => `<span class="fact ${fact.type}">${fact.label}</span>`)
        .join("");
      row.innerHTML = `
        <span class="library-plan-label">${item.label}</span>
        <div>
          <strong>${item.title}</strong>
          <p>${item.detail}</p>
          <div class="facts">${facts}</div>
        </div>
      `;

      if (item.actions?.length && item.title) {
        const actions = document.createElement("div");
        actions.className = "library-plan-actions";
        item.actions.forEach((action) => {
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = action.label;
          button.addEventListener("click", () => {
            setGameState(item.title, action.state);
            render();
          });
          actions.appendChild(button);
        });
        row.appendChild(actions);
      } else {
        const tag = document.createElement("span");
        tag.className = "library-plan-tag";
        tag.textContent = item.tag;
        row.appendChild(tag);
      }

      return row;
    }),
  );
}
function renderTasteMemory() {
  const memory = tasteMemory();
  els.memoryStatus.textContent = `${memory.confidence} confidence / ${memory.evidenceCount} signals`;
  const cards = [
    {
      label: "Likes",
      value: memory.likes.length ? memory.likes.map((item) => item.label).join(" + ") : "story + action",
      sub: "Taste signals",
    },
    {
      label: "Careful with",
      value: memory.cautions.length ? memory.cautions.map((item) => item.label).join(" + ") : "none yet",
      sub: memory.mixed.length ? `Mixed: ${memory.mixed.slice(0, 2).join(" / ")}` : memory.feedbackCount ? `${memory.feedbackCount} button signals` : "Negative or weak signals",
    },
    {
      label: "Session shape",
      value: memory.session.length ? memory.session.map((item) => item.label).join(" / ") : state.session,
      sub: "Likely play window",
    },
    {
      label: "Adult fit",
      value: memory.timeFit.length ? memory.timeFit.map((item) => item.label).join(" / ") : "weeknight",
      sub: "When it fits life",
    },
  ];
  els.memoryGrid.replaceChildren(
    ...cards.map((card) => {
      const item = document.createElement("div");
      item.className = "memory-card";
      item.innerHTML = `
        <span>${card.label}</span>
        <strong>${card.value}</strong>
        <small>${card.sub}</small>
      `;
      return item;
    }),
  );
}
function renderRecentLearning() {
  const events = recentLearningEvents();
  els.learningStatus.textContent = events.length ? `${events.length} fresh signals` : "No button signals";
  if (!events.length) {
    const empty = document.createElement("div");
    empty.className = "learning-empty";
    empty.textContent = "Use Play now, Done, Not for me, or Play later to teach the companion.";
    els.learningList.replaceChildren(empty);
    return;
  }
  els.learningList.replaceChildren(
    ...events.map((event) => {
      const row = document.createElement("div");
      row.className = `learning-row ${feedbackWeightForAction(event.action) < 0 ? "negative" : ""}`;
      const atoms = event.atoms.map((atom) => `<span class="fact tone">${atom}</span>`).join("");
      row.innerHTML = `
        <span class="learning-effect">${event.effect}</span>
        <div>
          <strong>${event.title}</strong>
          <p>${event.actionLabel} -> ${event.effect} ${event.atoms.join(" + ") || "taste"}.</p>
          <div class="facts">${atoms}</div>
        </div>
      `;
      return row;
    }),
  );
}
function renderQueuedGame(item, lane = "queued") {
  const row = document.createElement("div");
  row.className = "my-game-row is-queued";
  const atoms = item.atoms
    .slice(0, 3)
    .map((atom) => `<span class="fact tone">${atom}</span>`)
    .join("");
  row.innerHTML = `
    <div>
      <div class="my-game-title-line">
        <strong>${item.title}</strong>
        <span class="queue-lane tone-${lane}">${queueLaneLabel(lane)}</span>
        <button class="queue-detail-button" data-queue-detail type="button">Details</button>
      </div>
      <span>Play later / ${item.source} / ${item.detail}</span>
      <div class="facts">${atoms}<span class="fact access">queued</span></div>
    </div>
    <div class="my-game-actions">
      <button data-queue-action="playing" type="button">Playing</button>
      <button data-queue-action="completed" type="button">Done</button>
      <button data-queue-action="not_for_me" type="button">No</button>
      <button data-queue-action="" type="button">Clear</button>
    </div>
  `;
  row.querySelector("[data-queue-detail]").addEventListener("click", () => openGameDetail(item.title));
  row.querySelectorAll("[data-queue-action]").forEach((button) => {
    button.addEventListener("click", () => {
      setDropDecision(item.title, button.dataset.queueAction);
      render();
    });
  });
  return row;
}
function runDashboardAction(action) {
  if (action.view) {
    openAppView(action.view);
    return;
  }
  if (action.title && action.state) {
    setGameState(action.title, action.state);
    render();
  }
}

function renderDashboardCards(root, cards, className, actionPrefix) {
  root.replaceChildren(
    ...cards.map((card, index) => {
      const item = document.createElement("article");
      item.className = `${className} tone-${card.tone || "neutral"}`;
      const label = document.createElement("span");
      label.textContent = card.label;
      const title = document.createElement("strong");
      title.textContent = card.title;
      const detail = document.createElement("p");
      detail.textContent = card.detail;
      item.append(label, title, detail);
      if (card.actionLabel) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset[`${actionPrefix}Action`] = String(index);
        button.textContent = card.actionLabel;
        button.addEventListener("click", () => {
          runDashboardAction({
            view: card.actionView,
            title: card.actionTitle,
            state: card.actionState,
          });
        });
        item.appendChild(button);
      }
      return item;
    }),
  );
}

function renderLibraryDashboard(ranked) {
  renderDashboardCards(els.myGamesDashboard, libraryDashboardCards(ranked), "library-dashboard-card", "libraryDashboard");
}

function normalizeFilter(value, filters) {
  return filters[value] ? value : "all";
}

function renderFilterButtons(buttons, activeValue, dataKey) {
  buttons.forEach((button) => {
    const isActive = button.dataset[dataKey] === activeValue;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}
function createQueueEmpty(title, detail) {
  const row = document.createElement("div");
  row.className = "queue-empty";
  row.innerHTML = `
    <strong>${title}</strong>
    <span>${detail}</span>
  `;
  return row;
}
function renderMyGames(ranked) {
  const candidates = memoryCandidates(ranked);
  const queued = playLaterQueue();
  const remembered = candidates.filter((game) => effectiveGameState(game) || typeof effectiveUserGame(game)?.rating === "number").length;
  const activeFilter = normalizeFilter(state.libraryFilter, LIBRARY_QUEUE_FILTERS);
  state.libraryFilter = activeFilter;
  const candidateRows = candidates.map((game, index) => ({
    type: "game",
    game,
    index,
    lane: libraryLaneForGame(game),
  }));
  const queuedRows = queued.map((item, index) => ({
    type: "queued",
    item,
    index,
    lane: "queued",
  }));
  const allRows = [...queuedRows, ...candidateRows];
  const visibleRows = allRows.filter((item) => libraryFilterMatches(item.lane, activeFilter));

  els.myGamesSummary.textContent = `${remembered + queued.length} remembered / ${visibleRows.length}/${allRows.length} shown`;
  els.myGamesFilterSummary.textContent = libraryFilterSummary(activeFilter, visibleRows.length, allRows.length);
  renderFilterButtons(els.libraryFilterButtons, activeFilter, "libraryFilter");
  renderLibraryDashboard(ranked);
  els.myGamesList.replaceChildren(
    ...(visibleRows.length
      ? visibleRows.map((item) => (item.type === "queued" ? renderQueuedGame(item.item, item.lane) : renderMyGameRow(item.game, item.index, item.lane)))
      : [createQueueEmpty("Nothing in this lane yet", "Change the filter or mark a few games as active, owned, saved, or finished.")]),
  );
}

function renderMyGameRow(game, index, lane = "suggested") {
      const row = document.createElement("div");
      const userGame = effectiveUserGame(game) || {};
      const facets = memoryFacets(game).map((facet) => `
        <span class="my-game-facet tone-${facet.tone}">
          <small>${facet.label}</small>
          <strong>${facet.value}</strong>
        </span>
      `).join("");
      row.className = "my-game-row";
      const atoms = game.atoms
        .slice(0, 3)
        .map((atom) => `<span class="fact tone">${atom}</span>`)
        .join("");
      const sourcePassport = game.externalMeta ? sourcePassportHtml(gameSourcePassport(game), "compact") : "";
      const enrichment = game.externalMeta ? aiEnrichmentHtml(game, "compact") : "";
      const actionGroups = MEMORY_STATE_GROUPS.map((group) => `
          <div class="my-game-action-group">
            <span>${group.label}</span>
            <div class="my-game-action-buttons">
              ${group.actions.map(([memoryState, label]) => `
                <button class="${isMemoryStateSelected(userGame, memoryState) ? "is-selected" : ""}" data-memory-state="${memoryState}" type="button">${label}</button>
              `).join("")}
            </div>
          </div>
        `).join("");
      const ratingGroup = `
        <div class="my-game-action-group rating-actions">
          <span>Rating</span>
          <div class="my-game-action-buttons">
            ${RATING_ACTIONS.map(([rating, label]) => `
              <button class="${userGame.rating === rating ? "is-selected" : ""}" data-memory-rating="${rating}" type="button">${label}</button>
            `).join("")}
          </div>
        </div>
      `;
      row.innerHTML = `
        <div>
          <div class="my-game-title-line">
            <strong>${game.title}</strong>
            <span class="queue-lane tone-${lane}">${queueLaneLabel(lane)}</span>
            <button class="queue-detail-button" data-memory-detail type="button">Details</button>
          </div>
          <span>${memoryHint(game, index)} / ${game.vibe}</span>
          <div class="my-game-facets">${facets}</div>
          <div class="facts">${atoms}</div>
          ${sourcePassport}
          ${enrichment}
        </div>
        <div class="my-game-actions">
          ${actionGroups}
          ${ratingGroup}
        </div>
      `;
      row.querySelector("[data-memory-detail]").addEventListener("click", () => openGameDetail(game.title));
      row.querySelectorAll("[data-memory-state]").forEach((button) => {
        button.addEventListener("click", () => {
          setGameState(game.title, button.dataset.memoryState);
          render();
        });
      });
      row.querySelectorAll("[data-memory-rating]").forEach((button) => {
        button.addEventListener("click", () => {
          setGameRating(game.title, button.dataset.memoryRating ? Number(button.dataset.memoryRating) : null);
          render();
        });
      });
      return row;
}

function renderGameSearch() {
  const query = (state.gameSearchQuery || "").trim();
  const results = globalSearchResults();
  const sourceCount = searchSources?.sources?.length || 0;
  const localIndexReady = searchIndexStatus === "ready";
  const localSourceCopy = localIndexReady
    ? `${sourceCount} sources`
    : searchIndexStatus === "failed"
      ? "source index failed"
      : `${sourceCount || "local"} sources loading`;
  const provider = state.providerSearch || {};
  const providerLabel = provider.status === "loading"
    ? "provider loading"
    : provider.status === "live"
      ? `live ${provider.provider}`
      : provider.status === "fallback"
        ? `fallback ${provider.provider}${provider.recoverable ? " / recoverable" : ""}`
        : provider.status === "offline"
          ? "provider offline / recoverable"
          : "provider idle";
  const localIndexCopy = localIndexReady ? "local index ready" : searchIndexStatus === "failed" ? "local index failed" : "local index loading";
  els.gameSearchStatus.textContent = query.length >= 2 ? `${results.length} results / ${providerLabel} / ${localIndexCopy}` : "Ready";
  els.gameSearchSubmit.textContent = provider.status === "loading" ? "Searching" : "Provider";
  els.gameSearchSource.textContent =
    `${localSourceCopy} / ${provider.sourceHealth || "local first"}${provider.sourceHealthDetail ? ` / ${provider.sourceHealthDetail}` : ""} / no live price or subscription claims for external results`;

  if (query.length < 2) {
    const empty = document.createElement("div");
    empty.className = "search-empty";
    empty.innerHTML = `
      <strong>Search seed, backbone, or add a title</strong>
      <span>External results can enter wishlist before metadata and prices are resolved.</span>
    `;
    els.gameSearchList.replaceChildren(empty);
    return;
  }

  const notices = [];
  if (!localIndexReady) {
    const notice = document.createElement("div");
    notice.className = "search-empty source-warning";
    notice.innerHTML = `
      <strong>${searchIndexStatus === "failed" ? "Search sources need refresh" : "Search sources are still loading"}</strong>
      <span>${searchIndexStatus === "failed"
        ? "Seed results and manual add still work, but external fixture ranking is unavailable."
        : "Early seed/backbone results can appear first; exact external matches may reorder in a moment."}</span>
    `;
    notices.push(notice);
  }
  if (provider.status === "offline" || provider.fallbackUsed || provider.sourceHealth === "rawg_rate_limited") {
    const notice = document.createElement("div");
    notice.className = "search-empty source-warning";
    notice.innerHTML = `
      <strong>${provider.sourceHealth === "rawg_rate_limited" ? "Provider rate-limited" : provider.status === "offline" ? "Provider endpoint offline" : "Provider fallback active"}</strong>
      <span>${provider.sourceHealthDetail || "Local search and manual add remain available; try provider again later."}</span>
    `;
    notices.push(notice);
  }

  const rows = results.map((result) => {
      const row = document.createElement("div");
      row.className = `game-search-row source-${stateClassName(result.sourceId)}`;
      const atoms = (result.atoms || []).slice(0, 4).map((atom) => `<span class="fact tone">${atom}</span>`).join("");
      const platforms = (result.platforms || []).slice(0, 3).map((platform) => `<span class="fact access">${platform}</span>`).join("");
      const reconciliation = result.reconciliation?.status || result.duplicateSource || "";
      const reconciliationFact = reconciliation
        ? `<span class="fact ${reconciliation === "new_external" ? "warn" : "access"}">${reconciliation}</span>`
        : "";
      const saved = resultAlreadySaved(result);
      const sourcePassport = sourcePassportHtml(searchResultSourcePassport(result), "compact");
      const enrichment = result.sourceId === "seed_catalog" ? "" : aiEnrichmentHtml(result, "compact");
      const owned = resultStateSelected(result, "owned");
      const subscription = resultStateSelected(result, "subscription");
      row.innerHTML = `
        <div>
          <strong>${result.title}</strong>
          <span>${result.sourceLabel} / ${result.matchConfidence} confidence</span>
          <p>${result.reason}</p>
          <div class="facts">
            ${atoms}
            ${platforms}
            <span class="fact access">${result.catalogStatus}</span>
            ${reconciliationFact}
            <span class="fact ${result.coverStatus === "missing" ? "warn" : "cover"}">cover ${result.coverStatus}</span>
            <span class="fact ${result.priceStatus === "missing" ? "warn" : "price"}">price ${result.priceStatus}</span>
          </div>
          ${sourcePassport}
          ${enrichment}
        </div>
        <div class="game-search-actions">
          <button class="memory-action" data-search-detail="${result.title}" type="button">Details</button>
          <button class="memory-action ${saved ? "is-selected" : ""}" data-search-state="saved" type="button">${saved ? "Saved" : "Wishlist"}</button>
          <button class="memory-action ${owned ? "is-selected" : ""}" data-search-state="owned" type="button">Owned</button>
          <button class="memory-action ${subscription ? "is-selected" : ""}" data-search-state="subscription" type="button">Plus</button>
        </div>
      `;
      row.querySelector("[data-search-detail]").addEventListener("click", () => openGameDetail(result.title));
      row.querySelectorAll("[data-search-state]").forEach((button) => {
        button.addEventListener("click", () => {
          applySearchResultState(result, button.dataset.searchState);
          render();
        });
      });
      return row;
    });

  els.gameSearchList.replaceChildren(...notices, ...rows);
}

const VISUAL_CATALOG_SHELVES = {
  smart: "Smart shelf",
  tonight: "Tonight",
  included: "Included",
  deals: "Deals",
  wishlist: "Wishlist",
  library: "Library",
  catalog: "Catalog",
};

let drawerReturnFocus = null;

function openGameDetail(title) {
  // Remember what had focus so we can restore it on close (a11y)
  if (document.activeElement && document.activeElement !== document.body) {
    drawerReturnFocus = document.activeElement;
  }
  selectedGameTitle = title;
  renderGameDetail(true);
}

function closeGameDetail() {
  selectedGameTitle = "";
  renderGameDetail();
  // Restore focus to the element that opened the drawer
  if (drawerReturnFocus && typeof drawerReturnFocus.focus === "function") {
    drawerReturnFocus.focus({ preventScroll: true });
  }
  drawerReturnFocus = null;
}

// Focus trap: keep Tab within the drawer while it's open
function trapDrawerFocus(event) {
  if (event.key !== "Tab") return;
  if (els.gameDetail.classList.contains("is-hidden")) return;
  const drawer = els.gameDetailDrawer;
  if (!drawer) return;
  const focusable = drawer.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  if (event.shiftKey) {
    if (active === first || active === drawer) {
      event.preventDefault();
      last.focus();
    }
  } else if (active === last) {
    event.preventDefault();
    first.focus();
  }
}

function findSimilarGames(game, { limit = 4 } = {}) {
  const ranked = rankedGames();
  const atoms = new Set(game.atoms || []);
  if (atoms.size === 0) return [];
  return ranked
    .filter((g) => g.title !== game.title)
    .filter((g) => !["completed", "hidden"].includes(effectiveGameState(g)))
    .map((g) => {
      const shared = (g.atoms || []).filter((a) => atoms.has(a));
      return { game: g, shared };
    })
    .filter(({ shared }) => shared.length >= 2)
    .sort((a, b) => b.shared.length - a.shared.length || (b.game.score || 0) - (a.game.score || 0))
    .slice(0, limit);
}

function renderGameDetail(shouldFocus = false) {
  const detailGame = detailGameForTitle(selectedGameTitle);
  if (!selectedGameTitle || !detailGame) {
    els.gameDetail.classList.add("is-hidden");
    els.gameDetail.setAttribute("aria-hidden", "true");
    return;
  }
  const game = detailScoredGame(detailGame);

  const { reason, confidence } = explain(game, game.score);
  const watchout = watchOutCopy(game);
  const forecast = personalRankForecast(game);
  const description = gameDescription(game);
  const statusCards = detailStatusCards(game);
  const atoms = (game.atoms || []).slice(0, 6);
  const passport = game.externalMeta ? sourcePassportHtml(gameSourcePassport(game), "compact") : "";
  const facts = factList(game).slice(0, 6);
  const valueCard = gameValueCard(game);

  els.gameDetail.classList.remove("is-hidden");
  els.gameDetail.setAttribute("aria-hidden", "false");
  els.gameDetailTitle.textContent = game.title;
  els.gameDetailMeta.textContent = `${confidence} confidence / ${Math.max(game.score, 0)} fit / ${game.session} session`;
  els.gameDetailVisual.replaceChildren();
  els.gameDetailVisual.innerHTML = `
    <span>${forecast.label}</span>
    <strong>${game.title}</strong>
  `;
  applyCoverVisual(els.gameDetailVisual, game);
  renderCoverSourceInto(els.gameDetailCoverSource, game);
  els.gameDetailBody.innerHTML = `
    <section class="game-detail-status" aria-label="Game state summary">
      ${statusCards.map((item) => `
        <div class="detail-status-card tone-${item.tone}">
          <span>${item.label}</span>
          <strong>${item.value}</strong>
          ${item.detail ? `<small>${item.detail}</small>` : ""}
        </div>
      `).join("")}
    </section>
    <section class="game-detail-section">
      <h3>Decision</h3>
      <p>${description}</p>
      <p><strong>Why:</strong> ${reason}</p>
      <p><strong>${watchout.label}:</strong> ${watchout.detail}.</p>
    </section>
    ${valueCard ? `
    <section class="game-detail-section game-detail-value">
      <h3>Value</h3>
      <div class="value-cards">
        ${valueCard.criticScore != null ? `
          <div class="value-chip band-${valueCard.criticScoreBand}">
            <span>Critic</span>
            <strong>${valueCard.criticScoreLabel}</strong>
          </div>` : ""}
        ${valueCard.hltbHours != null ? `
          <div class="value-chip">
            <span>Length</span>
            <strong>${valueCard.hltbHoursLabel}</strong>
          </div>` : ""}
        ${valueCard.valueScore != null ? `
          <div class="value-chip band-${valueCard.valueScoreBand}">
            <span>Value score</span>
            <strong>${valueCard.valueScore} · ${valueCard.valueScoreLabel}</strong>
          </div>` : ""}
        ${valueCard.progress != null ? `
          <div class="value-chip">
            <span>Progress</span>
            <strong>${valueCard.progress.label} (${valueCard.progress.pct}%)</strong>
          </div>` : ""}
        ${valueCard.roi?.perHourLabel != null ? `
          <div class="value-chip">
            <span>Cost per hour</span>
            <strong>${valueCard.roi.perHourLabel} · ${valueCard.roi.verdict}</strong>
          </div>` : ""}
        ${(() => {
          const region = state.activeRegion;
          const snap = priceSnapshots.find((s) => s.title === game.title && s.region === region);
          const hist = priceHistory?.[game.title]?.[region];
          const subMeta = game.subscriptionMeta?.[region];
          const inPlusList = (game.psPlus || []).includes(region);
          const plusHtml = inPlusList
            ? `<div class="value-chip value-chip--plus"><span>PS Plus ${subMeta?.tier || "Extra"}</span><strong>Included in subscription</strong></div>`
            : "";
          if (!snap || snap.price == null) return plusHtml;
          const spark = hist?.length >= 2 ? priceSparkline(game.title, region, { width: 64, height: 24, color: "var(--teal)" }) : "";
          const storeLink = snap.storeUrl ? ` <a class="detail-store-link" href="${snap.storeUrl}" target="_blank" rel="noopener">PS Store ↗</a>` : "";
          const discountBadge = snap.discount > 0 ? ` <span class="detail-discount-badge">-${snap.discount}%</span>` : "";
          return `${plusHtml}
          <div class="value-chip value-chip--price">
            <span>${region} price${discountBadge}</span>
            <strong>${snap.currency} ${snap.price.toFixed(2)}${storeLink}</strong>
            ${spark}
          </div>`;
        })()}
      </div>
    </section>` : ""}
    <section class="game-detail-section">
      <h3>Signals</h3>
      <div class="facts">${facts.map((fact) => `<span class="fact ${fact.type}">${fact.label}</span>`).join("")}</div>
      <div class="game-detail-atoms">${atoms.map((atom) => `<span>${atom}</span>`).join("")}</div>
      ${passport}
    </section>
    <section class="game-detail-section game-detail-ai" id="detail-ai-section">
      <h3>AI match</h3>
      <div id="detail-ai-body" class="detail-ai-body">${cachedExplanation(game.title) ? `<p>${cachedExplanation(game.title)}</p>` : `<p class="detail-ai-placeholder">Press "Why this game?" to get a personalised explanation.</p>`}</div>
      <button class="secondary-action detail-ai-btn" id="detail-ai-btn" type="button">Why this game?</button>
    </section>
    ${(() => {
      const similar = findSimilarGames(game);
      if (!similar.length) return "";
      const cards = similar.map(({ game: g, shared }) => `
        <button class="similar-game-card" data-similar-title="${g.title}" type="button">
          <strong>${g.title}</strong>
          <span>${shared.slice(0, 3).join(" · ")}</span>
        </button>`).join("");
      return `<section class="game-detail-section">
        <h3>You might also like</h3>
        <div class="similar-games-list">${cards}</div>
      </section>`;
    })()}
    <section class="game-detail-section">
      <h3>Actions</h3>
      <div class="game-detail-actions">
        <button class="${detailActionClass(game, "saved")}" data-detail-state="saved" type="button">Wishlist</button>
        <button class="${detailActionClass(game, "playing")}" data-detail-state="playing" type="button">Play</button>
        <button class="${detailActionClass(game, "owned")}" data-detail-state="owned" type="button">Owned</button>
        <button class="${detailActionClass(game, "subscription")}" data-detail-state="subscription" type="button">Plus</button>
        <button class="${detailActionClass(game, "owned_forever")}" data-detail-state="owned_forever" type="button">Bought</button>
        <button class="${detailActionClass(game, "completed")}" data-detail-state="completed" type="button">Done</button>
        <button class="${detailActionClass(game, "hidden")}" data-detail-state="hidden" type="button">Hide</button>
      </div>
    </section>
  `;
  // Wire "Why this game?" AI explain button
  const aiBtn = els.gameDetailBody.querySelector("#detail-ai-btn");
  const aiBody = els.gameDetailBody.querySelector("#detail-ai-body");
  if (aiBtn && aiBody) {
    aiBtn.addEventListener("click", async () => {
      aiBtn.disabled = true;
      aiBtn.textContent = "Thinking…";
      aiBody.innerHTML = `<p class="detail-ai-placeholder">Asking your personal AI companion…</p>`;
      try {
        const explanation = await fetchExplanation(game);
        aiBody.innerHTML = `<p>${explanation}</p>`;
        saveState();
      } catch (err) {
        aiBody.innerHTML = `<p class="detail-ai-error">Could not get explanation. Make sure the local server is running (<code>node scripts/search-provider-server.mjs</code>) and ANTHROPIC_API_KEY is set.</p>`;
        console.warn("[PlaySputnik] AI explain failed:", err);
      } finally {
        aiBtn.disabled = false;
        aiBtn.textContent = "Why this game?";
      }
    });
  }
  els.gameDetail.querySelectorAll("[data-detail-state]").forEach((button) => {
    button.addEventListener("click", () => {
      if (game.searchResult && !canonicalSearchResultSeed(game.searchResult)) {
        applySearchResultState(game.searchResult, button.dataset.detailState);
      } else {
        setGameState(game.title, button.dataset.detailState);
      }
      render();
    });
  });
  els.gameDetail.querySelectorAll("[data-similar-title]").forEach((button) => {
    button.addEventListener("click", () => {
      openGameDetail(button.dataset.similarTitle);
    });
  });
  if (shouldFocus) els.gameDetailDrawer.focus({ preventScroll: true });
}

function createVisualCatalogCard(item) {
  const { game, lane, reason } = item;
  const gameState = effectiveGameState(game);
  const price = game.prices?.[state.activeRegion];
  const priceCopy = typeof price === "number" ? formatMoney(price) : "No price";
  const inPsPlus = (game.psPlus || []).includes(state.activeRegion);
  const plusTier = inPsPlus ? (game.subscriptionMeta?.[state.activeRegion]?.tier || "Extra") : null;
  const stateCopy = gameState ? USER_STATE_LABELS[gameState] || gameState : "Unsorted";
  const article = document.createElement("article");
  article.className = `visual-catalog-card ${gameState ? "has-state" : ""}`;
  article.dataset.visualTitle = game.title;
  article.dataset.visualLane = lane;
  article.innerHTML = `
    <div class="visual-catalog-poster">
      <span>${lane}</span>
      <strong>${game.title}</strong>
    </div>
    <div class="visual-catalog-copy">
      <div>
        <span>${coverReadinessLabel(game)}</span>
        <strong>${game.title}</strong>
        <p>${reason}</p>
        <small class="visual-catalog-source"></small>
      </div>
      <div class="visual-catalog-meta">
        <span>${stateCopy}</span>
        <span>${inPsPlus ? `<span class="ps-plus-badge">PS+ ${plusTier}</span>` : priceCopy}</span>
      </div>
      <div class="visual-catalog-tags">
        ${(game.atoms || []).slice(0, 3).map((atom) => `<span>${atom}</span>`).join("")}
      </div>
      <div class="visual-catalog-actions">
        <button data-visual-detail type="button">Details</button>
        <button data-visual-state="saved" type="button">Wishlist</button>
        <button data-visual-state="playing" type="button">Play</button>
        <button data-visual-state="completed" type="button">Done</button>
      </div>
    </div>
  `;
  applyCoverVisual(article.querySelector(".visual-catalog-poster"), game);
  renderCoverSourceInto(article.querySelector(".visual-catalog-source"), game);
  article.querySelector("[data-visual-detail]").addEventListener("click", () => openGameDetail(game.title));
  article.querySelectorAll("[data-visual-state]").forEach((button) => {
    const active = button.dataset.visualState === gameState;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
    button.addEventListener("click", () => {
      setGameState(game.title, button.dataset.visualState);
      render();
    });
  });
  return article;
}

function renderVisualCatalog(ranked) {
  let items = visualCatalogItems(ranked);

  // Catalog search filter
  const searchQuery = (state.catalogSearch || "").trim().toLowerCase();
  if (searchQuery.length >= 2) {
    items = items.filter(({ game }) => {
      const titleMatch = game.title.toLowerCase().includes(searchQuery);
      const atomMatch = (game.atoms || []).some((a) => a.toLowerCase().includes(searchQuery));
      const vibeMatch = (game.vibe || "").toLowerCase().includes(searchQuery);
      return titleMatch || atomMatch || vibeMatch;
    });
  }

  // Catalog chip filters
  const atomFilter = state.catalogAtomFilter || "";
  const lengthFilter = state.catalogLengthFilter || "";
  const diffFilter = state.catalogDifficultyFilter || "";
  if (atomFilter) items = items.filter(({ game }) => (game.atoms || []).includes(atomFilter));
  if (lengthFilter) items = items.filter(({ game }) => game.length === lengthFilter);
  if (diffFilter) items = items.filter(({ game }) => game.difficulty === diffFilter);

  // Sync filter chips active state
  document.querySelectorAll("[data-catalog-filter-atom]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.catalogFilterAtom === atomFilter);
  });
  document.querySelectorAll("[data-catalog-filter-length]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.catalogFilterLength === lengthFilter);
  });
  document.querySelectorAll("[data-catalog-filter-difficulty]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.catalogFilterDifficulty === diffFilter);
  });

  // Sort
  const LENGTH_ORDER = { short: 0, medium: 1, long: 2, massive: 3 };
  const catalogSort = state.catalogSort || "score";
  if (catalogSort === "alpha") {
    items.sort((a, b) => a.game.title.localeCompare(b.game.title));
  } else if (catalogSort === "length") {
    items.sort((a, b) =>
      (LENGTH_ORDER[a.game.length] ?? 99) - (LENGTH_ORDER[b.game.length] ?? 99) ||
      a.game.title.localeCompare(b.game.title),
    );
  } else if (catalogSort === "price") {
    const region = state.activeRegion || "US";
    items.sort((a, b) => {
      const pa = a.game.prices?.[region] ?? Infinity;
      const pb = b.game.prices?.[region] ?? Infinity;
      return pa - pb || a.game.title.localeCompare(b.game.title);
    });
  }
  // Sync sort buttons
  document.querySelectorAll("[data-catalog-sort]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.catalogSort === catalogSort);
  });

  const PAGE_SIZE = 24;
  const page = state.catalogPage || 1;
  const totalFiltered = items.length;
  const pagedItems = items.slice(0, page * PAGE_SIZE);

  const fallbackCount = pagedItems.filter((item) => item.game.coverMeta?.status === "fallback").length;
  const realCount = pagedItems.filter((item) => ["verified", "candidate"].includes(item.game.coverMeta?.status)).length;
  const stats = visualCatalogStats();
  const shelf = VISUAL_CATALOG_SHELVES[state.visualCatalogShelf] || VISUAL_CATALOG_SHELVES.smart;
  document.querySelectorAll("[data-visual-shelf]").forEach((button) => {
    const active = button.dataset.visualShelf === (state.visualCatalogShelf || "smart");
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  // Sync search input
  if (els.catalogSearchInput && els.catalogSearchInput !== document.activeElement) {
    els.catalogSearchInput.value = state.catalogSearch || "";
  }
  els.catalogSearchCount.textContent = searchQuery.length >= 2 ? `${totalFiltered} results` : "";
  els.visualCatalogMetrics.replaceChildren(
    ...[
      [`${stats.coverCount}/${stats.totalCount}`, "covers"],
      [`${stats.playableCount}`, "playable"],
      [`${stats.wishlistCount}`, "wishlist"],
    ].map(([value, label]) => {
      const item = document.createElement("div");
      item.className = "visual-catalog-metric";
      item.innerHTML = `<strong>${value}</strong><span>${label}</span>`;
      return item;
    }),
  );
  els.visualCatalogStatus.textContent = searchQuery.length >= 2
    ? `${totalFiltered} found`
    : `${pagedItems.length} of ${totalFiltered} shown`;
  els.visualCatalogSummary.textContent =
    `${shelf} / ${realCount} image candidates / ${fallbackCount} generated posters / quick states update memory instantly.`;
  els.visualCatalogList.replaceChildren(...pagedItems.map(createVisualCatalogCard));

  // Load more button
  if (els.visualCatalogLoadMore) {
    els.visualCatalogLoadMore.replaceChildren();
    if (pagedItems.length < totalFiltered) {
      const btn = document.createElement("button");
      btn.className = "load-more-btn";
      btn.type = "button";
      btn.textContent = `Show more (${totalFiltered - pagedItems.length} left)`;
      btn.addEventListener("click", () => {
        state.catalogPage = (state.catalogPage || 1) + 1;
        renderVisualCatalog(rankedGames());
      });
      els.visualCatalogLoadMore.append(btn);
    }
  }
}

function renderDropCalendar() {
  if (!dropCalendar) return;
  const drops = dropCalendar.drops || [];
  els.dropCalendar.replaceChildren(
    ...drops.map((drop) => {
      const row = document.createElement("div");
      row.className = "calendar-row";
      row.innerHTML = `
        <div>
          <strong>${drop.label}</strong>
          <span>${drop.cadence}</span>
        </div>
        <p>${drop.userAction}</p>
        <span class="calendar-status">${drop.sourceStatus}</span>
      `;
      return row;
    }),
  );
}

function renderMonthlyDrop() {
  const drop = rankedMonthlyDrop();
  const savedForLater = drop.filter((item) => dropDecision(item.title) === "play_later").length;
  const undecided = drop.filter((item) => !dropDecision(item.title));
  const visibleDrop = undecided.slice(0, 3);
  const cooldownDays = dropCalendar?.lifecycle?.cooldownDays || 14;
  els.dropStatus.textContent = undecided.length
    ? `${undecided.length} open / ${savedForLater} saved / ${cooldownDays}d cooldown`
    : `handled / ${savedForLater} saved / ${cooldownDays}d cooldown`;
  renderDropCalendar();
  if (!visibleDrop.length) {
    const empty = document.createElement("div");
    empty.className = "drop-empty";
    empty.innerHTML = `
      <strong>Drop handled</strong>
      <span>Saved picks stay in memory. This inbox can stay quiet until the next checkpoint.</span>
    `;
    els.dropList.replaceChildren(empty);
    return;
  }
  els.dropList.replaceChildren(
    ...visibleDrop.map((item) => {
      const row = document.createElement("div");
      row.className = "drop-row";
      const decision = dropDecision(item.title);
      const fitClass = item.fit.includes("low") ? "warn" : item.fit.includes("plus") ? "price" : "time";
      row.innerHTML = `
        <div>
          <strong>${item.title}</strong>
          <span>${decision ? `Decided: ${decision.replace("_", " ")}` : `${item.access} / ${item.predictedRank}`}</span>
        </div>
        <span class="drop-verdict ${fitClass}">${item.verdict}</span>
        <p>${item.nextAction}</p>
        <div class="facts">
          <span class="fact access">${item.claimDecision}</span>
          <span class="fact ${item.installDecision.toLowerCase().includes("not") ? "warn" : "time"}">${item.installDecision}</span>
          <span class="fact ${item.playDecision.toLowerCase().includes("skip") ? "warn" : "tone"}">${item.playDecision}</span>
          <span class="fact ${fitClass}">${item.trialWindow}</span>
          <span class="fact tone">${item.fit}</span>
          <span class="fact warn">${item.freshnessState}</span>
        </div>
        <div class="drop-actions">
          <button class="${decision === "play_later" ? "is-selected" : ""}" data-drop-decision="play_later" type="button">Play later</button>
          <button class="${decision === "claim_only" ? "is-selected" : ""}" data-drop-decision="claim_only" type="button">Claim only</button>
          <button class="${decision === "not_for_me" ? "is-selected" : ""}" data-drop-decision="not_for_me" type="button">Not for me</button>
        </div>
      `;
      row.querySelectorAll("[data-drop-decision]").forEach((button) => {
        button.addEventListener("click", () => {
          setDropDecision(item.title, button.dataset.dropDecision);
          render();
        });
      });
      return row;
    }),
  );
}

function renderTasteRadar() {
  const allRadar = rankedRadar();
  const radar = allRadar.slice(0, 4);
  els.radarStatus.textContent = `Top ${radar.length} of ${allRadar.length} sample leads`;
  els.radarList.replaceChildren(
    ...radar.map((item) => {
      const row = document.createElement("div");
      row.className = "radar-row";
      const atoms = (item.atoms || []).slice(0, 3).map((atom) => `<span class="fact tone">${atom}</span>`).join("");
      row.innerHTML = `
        <div>
          <strong>${item.title}</strong>
          <span>${item.window} / ${item.freshnessState} ${item.confidence}</span>
        </div>
        <p>${item.reason}</p>
        <div class="facts">${atoms}<span class="fact time">${item.adultTimeFit}</span></div>
        <span class="score">${Math.max(item.score, 0)}</span>
      `;
      return row;
    }),
  );
}

function renderWishlistDashboard(ranked, records) {
  renderDashboardCards(els.wishlistDashboard, wishlistDashboardCards(ranked, records), "wishlist-dashboard-card", "wishlistDashboard");
}

function renderPriceWatch(ranked) {
  const region = state.activeRegion;
  const records = wishlistIntentRecords(ranked);
  const activeFilter = normalizeFilter(state.wishlistFilter, WISHLIST_QUEUE_FILTERS);
  state.wishlistFilter = activeFilter;
  let visibleRecords = records.filter((record) => wishlistFilterMatches(record, activeFilter));

  // Wishlist sort
  const wSort = state.wishlistSort || "score";
  if (wSort === "price") {
    visibleRecords.sort((a, b) => (a.game.prices?.[region] ?? Infinity) - (b.game.prices?.[region] ?? Infinity));
  } else if (wSort === "discount") {
    visibleRecords.sort((a, b) => (b.game.discount?.[region] || 0) - (a.game.discount?.[region] || 0));
  } else if (wSort === "alpha") {
    visibleRecords.sort((a, b) => a.game.title.localeCompare(b.game.title));
  }
  // Sync sort buttons
  document.querySelectorAll("[data-wishlist-sort]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.wishlistSort === wSort);
  });

  els.priceWatchRegion.textContent = `${region} ${freshnessLabel("Prices")}`;
  renderWishlistDashboard(ranked, records);
  els.wishlistFilterSummary.textContent = wishlistFilterSummary(activeFilter, visibleRecords.length, records.length);
  renderFilterButtons(els.wishlistFilterButtons, activeFilter, "wishlistFilter");
  els.priceWatchList.replaceChildren(
    ...(visibleRecords.length ? visibleRecords.map((record) => {
      const { game, watch } = record;
      const row = document.createElement("div");
      const decision = wishlistDecision(record);
      const status = record.status;
      const currency = game.priceMeta?.[region]?.currency || "USD";
      row.className = `deal-row wishlist-row tone-${decision.tone}`;
      row.innerHTML = `
        <span class="wishlist-decision">${decision.label}</span>
        <div>
          <strong>${game.title}</strong>
          <span class="deal-price ${status.canConfirm ? "" : "needs-verify"}">${record.hasPrice ? `${region} ${formatPrice(game, region)} / ${game.discount[region] || 0}% ${status.canConfirm ? "off" : "signal"}` : "Price missing"}</span>
          <span class="deal-reason">${decision.detail}${watch ? ` / target ${formatMoney(watch.targetPrice, currency)} / ${historicalLowCopy(watch, currency)}` : ""} / ${record.lanes.join(", ")}</span>
        </div>
        <div class="wishlist-actions">
          <button data-wishlist-detail type="button">Details</button>
          <button class="${record.saved ? "is-selected" : ""}" data-wishlist-state="saved" type="button">Wishlist</button>
          <button data-wishlist-state="owned_forever" type="button">Bought</button>
          <button data-wishlist-state="hidden" type="button">Hide</button>
        </div>
      `;
      row.querySelector("[data-wishlist-detail]").addEventListener("click", () => openGameDetail(game.title));
      row.querySelectorAll("[data-wishlist-state]").forEach((button) => {
        button.addEventListener("click", () => {
          setGameState(game.title, button.dataset.wishlistState);
          render();
        });
      });
      return row;
    }) : [createQueueEmpty("No watched games in this lane", "Change the filter or add more games from search and the visual catalog.")]),
  );
}

function renderBuyDecision(ranked) {
  const region = state.activeRegion;
  const candidates = purchaseCandidates(ranked);
  const accessOptions = ranked.filter((game) => isAlreadyAvailable(game));
  const accessCount = accessOptions.length;
  const first = candidates[0];
  const second = candidates[1];
  const waitCandidate = candidates.find((game) => (game.prices[region] || 0) > Number(state.budget) || game.purchaseRisk >= 24);
  const rows = [];

  if (first) {
    rows.push({
      label: "Buy one",
      title: first.title,
      detail: `${region} ${formatPrice(first, region)}. ${dealReason(first)}. Risk ${first.purchaseRisk}.`,
      tag: `${first.purchaseScore} value`,
    });
  }

  if (first && second) {
    const firstPrice = first.prices[region] || 0;
    const secondPrice = second.prices[region] || 0;
    const pairFitsBudget = firstPrice + secondPrice <= Number(state.budget);
    rows.push({
      label: pairFitsBudget ? "Buy two" : "Second pick",
      title: pairFitsBudget ? `${first.title} + ${second.title}` : second.title,
      detail: pairFitsBudget
        ? "Best bundle inside today's budget: one strong fit plus one backup instead of browsing sales."
        : `${second.title} is the backup if the top pick does not feel urgent today.`,
      tag: `${first.purchaseScore + second.purchaseScore} value`,
    });
  }

  const quietWait = accessCount > 0
    ? {
        title: `Play ${accessOptions[0].title} first`,
        detail: `${accessCount} owned, subscription, or play-later options can cover tonight before spending.`,
        tag: "no spend",
      }
    : {
        title: "Wait for a clearer signal",
        detail: "No owned or subscription option is active here, so only buy if the top pick feels urgent.",
        tag: "hold",
      };

  rows.push({
    label: "Maybe wait",
    title: waitCandidate ? waitCandidate.title : quietWait.title,
    detail: waitCandidate
      ? `${waitCandidate.title} has desire, but price/risk says wait for a better moment.`
      : quietWait.detail,
    tag: waitCandidate ? "watch price" : quietWait.tag,
  });

  els.buyDecisionStatus.textContent = `${candidates.length} buy candidates / ${accessCount ? `${accessCount} access options` : "no access options"}`;
  els.buyDecisionList.replaceChildren(
    ...rows.map((item) => {
      const row = document.createElement("div");
      row.className = "buy-decision-row";
      row.innerHTML = `
        <span class="decision-label">${item.label}</span>
        <div>
          <strong>${item.title}</strong>
          <p>${item.detail}</p>
        </div>
        <span class="decision-tag">${item.tag}</span>
      `;
      return row;
    }),
  );
}

// ── Price sparkline ───────────────────────────────────────────────────────────

function priceSparkline(title, region, { width = 80, height = 28, color = "var(--blue)" } = {}) {
  const history = priceHistory?.[title]?.[region];
  if (!history || history.length < 2) return "";
  const prices = history.map((e) => e.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const points = prices.map((p, i) => {
    const x = pad + (i / (prices.length - 1)) * w;
    const y = pad + (1 - (p - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  // Current price dot
  const last = prices[prices.length - 1];
  const cx = pad + w;
  const cy = (pad + (1 - (last - min) / range) * h).toFixed(1);
  const isLow = last === min;
  const dotColor = isLow ? "var(--green)" : color;
  return `<svg class="price-sparkline" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true">
    <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" opacity=".6"/>
    <circle cx="${cx}" cy="${cy}" r="2.5" fill="${dotColor}"/>
  </svg>`;
}

// ── Deals view ────────────────────────────────────────────────────────────────

const DEALS_FILTERS = {
  all:     { label: "All deals",   test: () => true },
  under10: { label: "Under $10",   test: (s, region) => (s.price ?? Infinity) < 10 },
  big:     { label: "50%+ off",    test: (s) => (s.discount ?? 0) >= 50 },
  top:     { label: "Top rated",   test: (s, region, game) => (game?.criticScore ?? 0) >= 80 },
};

let _dealsFilter = "all";

function renderDeals() {
  const region = state.activeRegion;
  const checkedAt = priceSnapshots.find((s) => s.region === region && s.checkedAt)?.checkedAt;
  const freshLabel = checkedAt
    ? `Updated ${new Date(checkedAt).toLocaleDateString()}`
    : "Prices may be outdated";

  // Build a map: title → game for quick lookup
  const gameMap = new Map(games.map((g) => [g.title, g]));

  // Pull all discounted snapshots for this region
  const snapsForRegion = priceSnapshots.filter(
    (s) => s.region === region && (s.discount ?? 0) > 0 && s.price !== null && s.freshnessState !== "missing"
  );

  const filterFn = DEALS_FILTERS[_dealsFilter]?.test ?? (() => true);
  const filtered = snapsForRegion.filter((s) => {
    const game = gameMap.get(s.title);
    return filterFn(s, region, game);
  });

  // Sort: highest discount first, then by price asc
  filtered.sort((a, b) => (b.discount - a.discount) || (a.price - b.price));

  // Status line
  const totalOnSale = snapsForRegion.length;
  els.dealsStatus.textContent = `${totalOnSale} on sale · ${freshLabel}`;

  // Filter buttons
  els.dealsFilterBtns.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.dealsFilter === _dealsFilter);
  });

  // Render cards
  if (filtered.length === 0) {
    els.dealsGrid.replaceChildren(createQueueEmpty("No deals match this filter", "Try a different filter or check back when new sales start."));
    els.dealsFooter.textContent = "";
    return;
  }

  const currency = filtered[0]?.currency || "USD";
  els.dealsGrid.replaceChildren(
    ...filtered.map((snap) => {
      const game = gameMap.get(snap.title);
      const card = document.createElement("div");
      card.className = "deal-card";
      const regularStr = snap.regular && snap.regular !== snap.price
        ? `<s class="deal-regular">${snap.currency} ${snap.regular.toFixed(2)}</s>`
        : "";
      const atoms = game?.atoms?.slice(0, 3).map((a) => `<span class="atom-pill">${a}</span>`).join("") ?? "";
      const score = game?.criticScore ? `<span class="deal-score">${game.criticScore}</span>` : "";
      const spark = priceSparkline(snap.title, region);
      card.innerHTML = `
        <div class="deal-badge">-${snap.discount}%</div>
        <div class="deal-card-body">
          <div class="deal-card-title">${snap.title}${score}</div>
          <div class="deal-atoms">${atoms}</div>
          <div class="deal-price-row">
            ${regularStr}
            <strong class="deal-price-now">${snap.currency} ${snap.price.toFixed(2)}</strong>
            ${spark}
          </div>
          ${snap.storeUrl ? `<a class="deal-store-link" href="${snap.storeUrl}" target="_blank" rel="noopener">PS Store ↗</a>` : ""}
        </div>
      `;
      card.addEventListener("click", (e) => {
        if (e.target.closest("a")) return;
        openGameDetail(snap.title);
      });
      return card;
    })
  );

  els.dealsFooter.textContent = `${filtered.length} deal${filtered.length !== 1 ? "s" : ""} · ${region} prices via IsThereAnyDeal`;
}

function renderDeferredPanels(ranked, primaryGame, ticket) {
  if (ticket !== deferredRenderTicket) return;
  renderTasteMemory();
  renderRecentLearning();
  renderMyGames(ranked);
  renderGameSearch();
  renderVisualCatalog(ranked);
  renderDebug(primaryGame);
  renderPriceWatch(ranked);
  renderBuyDecision(ranked);
  renderDeals();
  renderRefreshPolicy(ranked);
  renderLibrary();
  renderMonthlyDrop();
  renderTasteRadar();
  renderSourceHealth();
  renderDevHealth();
  renderDataWorkbench();
  renderCatalogBackbone();
  renderCatalogWorkbench();
  if (typeof window !== "undefined") {
    window.__playsputnikBoot = {
      ...(window.__playsputnikBoot || {}),
      deferredRenderedAt: new Date().toISOString(),
    };
  }
}

function scheduleDeferredRender(ranked, primaryGame) {
  const ticket = ++deferredRenderTicket;
  const run = () => renderDeferredPanels(ranked, primaryGame, ticket);
  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: 600 });
  } else {
    window.setTimeout(run, 0);
  }
}

function normalizedAppView(view) {
  return APP_VIEWS[view] ? view : "today";
}

function sectionVisibleInAppView(section, activeView) {
  return (section.dataset.viewSection || "")
    .split(/\s+/)
    .filter(Boolean)
    .includes(activeView);
}

function renderAppViewShell() {
  const activeView = normalizedAppView(state.activeView);
  if (state.activeView !== activeView) state.activeView = activeView;
  const view = APP_VIEWS[activeView];

  els.appViewStatus.textContent = view.summary;
  els.appViewTabs.forEach((button) => {
    const isActive = button.dataset.appView === activeView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  els.viewSections.forEach((section) => {
    const isVisible = sectionVisibleInAppView(section, activeView);
    section.classList.toggle("is-view-hidden", !isVisible);
    section.toggleAttribute("hidden", !isVisible);
  });
}

function openAppView(viewId) {
  const view = APP_VIEWS[viewId] || APP_VIEWS.today;
  state.activeView = APP_VIEWS[viewId] ? viewId : "today";
  state.activeCluster = view.cluster;
  state.visualCatalogShelf = view.shelf;
  render();
}

function render() {
  // Clear per-render memo caches so state changes are picked up, but the
  // expensive taste profile and game ranking are each computed only once per
  // render pass (they were previously recomputed 10–11× → ~3s renders).
  invalidateTasteProfile();
  invalidateRankedGames();
  invalidateTasteMemory();
  invalidateCompanionAgenda();
  invalidateEffectiveState();
  hydrateControls();
  renderEntryPaths();
  renderTasteProfile();
  renderNotebookProfile();
  renderSessionStats();
  renderQuickSwipeDeck();
  els.likedGames.replaceChildren(...profileGames.map(renderProfileGameRow));
  els.likedCount.textContent = `${quickReactionCount()}/${profileGames.length}`;
  renderTasteGate();
  els.budgetLabel.textContent = `$${state.budget}`;
  els.activeRegion.textContent = `${state.activeRegion} Store`;
  renderAppViewShell();

  document.querySelectorAll(".segment").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.region === state.activeRegion);
  });
  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.cluster === state.activeCluster);
  });

  const ranked = rankedGames();
  const clusters = clusterGames(ranked);
  const primaryGame = primaryDecisionGame(ranked);
  renderValueStats(ranked);
  renderOnboardingHero();

  // View-gating: the right-column sections are hidden via CSS on views they
  // don't belong to, yet their (heavy) DOM was rebuilt on every render —
  // ~1s wasted when sitting on Stats/Discover/etc. openAppView() always calls
  // render(), so a section is repopulated the moment its view becomes active.
  const inView = (...views) => views.includes(state.activeView);

  if (inView("today", "taste")) renderFirstRunFlow(ranked);
  if (inView("today")) renderCompanionAnswer(ranked);
  if (inView("today", "taste")) renderFirstValueReceipt(ranked);
  if (inView("today")) renderHero(primaryGame, els.topPick);
  if (inView("today")) renderCompanionPlan(ranked);
  if (inView("today", "library")) renderLibraryPlan(ranked);
  if (inView("stats")) renderStats();

  if (inView("today", "library", "discover", "wishlist")) {
    renderVisualCatalog(ranked);
    const visible = clusters[state.activeCluster].filter((game) => !titleMatches(game.title, primaryGame?.title)).slice(0, 6);
    els.clusterGrid.replaceChildren(...visible.map(renderCard));
  }
  renderGameDetail();
  if (typeof window !== "undefined") {
    window.__playsputnikBoot = {
      ...(window.__playsputnikBoot || {}),
      coreRenderedAt: new Date().toISOString(),
    };
  }
  scheduleDeferredRender(ranked, primaryGame);
  saveState();
}

els.appViewTabs.forEach((button) => {
  button.addEventListener("click", () => {
    openAppView(button.dataset.appView);
  });
});

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => {
    state.activeRegion = button.dataset.region;
    render();
  });
});

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    state.activeCluster = button.dataset.cluster;
    render();
  });
});

document.querySelectorAll("[data-visual-shelf]").forEach((button) => {
  button.addEventListener("click", () => {
    state.visualCatalogShelf = button.dataset.visualShelf || "smart";
    state.catalogPage = 1;
    render();
  });
});

els.catalogSearchInput.addEventListener("input", () => {
  state.catalogSearch = els.catalogSearchInput.value;
  state.catalogPage = 1;
  renderVisualCatalog(rankedGames());
});
els.catalogSearchInput.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    state.catalogSearch = "";
    state.catalogPage = 1;
    els.catalogSearchInput.value = "";
    renderVisualCatalog(rankedGames());
  }
});

document.querySelectorAll("[data-catalog-filter-atom]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.catalogAtomFilter = btn.dataset.catalogFilterAtom;
    state.catalogPage = 1;
    renderVisualCatalog(rankedGames());
  });
});
document.querySelectorAll("[data-catalog-filter-length]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.catalogLengthFilter = btn.dataset.catalogFilterLength;
    state.catalogPage = 1;
    renderVisualCatalog(rankedGames());
  });
});
document.querySelectorAll("[data-catalog-filter-difficulty]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.catalogDifficultyFilter = btn.dataset.catalogFilterDifficulty;
    state.catalogPage = 1;
    renderVisualCatalog(rankedGames());
  });
});
document.querySelectorAll("[data-catalog-sort]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.catalogSort = btn.dataset.catalogSort;
    state.catalogPage = 1;
    renderVisualCatalog(rankedGames());
  });
});

// ── Keyboard grid navigation in the visual catalog ────────────────────────────
// Arrow keys move focus between cards; Home/End jump to first/last. The number
// of columns is read from the live grid so it stays correct across breakpoints.
if (els.visualCatalogList) {
  els.visualCatalogList.addEventListener("keydown", (event) => {
    const NAV_KEYS = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"];
    if (!NAV_KEYS.includes(event.key)) return;
    const cards = Array.from(els.visualCatalogList.querySelectorAll(".visual-catalog-card"));
    if (!cards.length) return;
    const currentCard = document.activeElement?.closest(".visual-catalog-card");
    let index = currentCard ? cards.indexOf(currentCard) : -1;
    if (index === -1) index = 0;

    // Derive column count from the computed grid template.
    const cols = (getComputedStyle(els.visualCatalogList).gridTemplateColumns || "")
      .split(" ").filter(Boolean).length || 1;

    let target = index;
    if (event.key === "ArrowRight") target = Math.min(index + 1, cards.length - 1);
    else if (event.key === "ArrowLeft") target = Math.max(index - 1, 0);
    else if (event.key === "ArrowDown") target = Math.min(index + cols, cards.length - 1);
    else if (event.key === "ArrowUp") target = Math.max(index - cols, 0);
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = cards.length - 1;

    if (target === index && currentCard) return;
    event.preventDefault();
    const focusEl = cards[target].querySelector("[data-visual-detail]") || cards[target];
    focusEl.focus();
  });
}

els.libraryFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.libraryFilter = button.dataset.libraryFilter || "all";
    render();
  });
});

els.wishlistFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.wishlistFilter = button.dataset.wishlistFilter || "all";
    render();
  });
});

els.gameDetail.addEventListener("click", (event) => {
  if (event.target.closest("[data-detail-close]")) closeGameDetail();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && selectedGameTitle) closeGameDetail();
  trapDrawerFocus(event);
});

els.entryCards.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.entryPath === "psn") {
      applyPsnDemoEntry();
    } else if (button.dataset.entryPath === "deep") {
      applyDeepEntry();
    } else {
      applyQuickEntry();
    }
  });
});

els.mood.addEventListener("change", () => {
  state.mood = els.mood.value;
  render();
});
els.session.addEventListener("change", () => {
  state.session = els.session.value;
  render();
});
els.difficulty.addEventListener("change", () => {
  state.difficulty = els.difficulty.value;
  render();
});
els.plus.addEventListener("change", () => {
  state.psPlus = els.plus.checked;
  render();
});
els.budget.addEventListener("input", () => {
  state.budget = Number(els.budget.value);
  render();
});
els.ratingImport.addEventListener("input", () => {
  state.ratingImport = els.ratingImport.value;
  saveState();
});
els.sampleRatings.addEventListener("click", () => {
  state.ratingImport = QUICK_RATING_LINES.join("\n");
  analyzeTasteImport();
  render();
});
els.analyzeRatings.addEventListener("click", () => {
  state.ratingImport = els.ratingImport.value;
  analyzeTasteImport();
  render();
});
els.notebookImport.addEventListener("input", () => {
  state.notebookImport = els.notebookImport.value;
  saveState();
});
els.gameSearchInput.addEventListener("input", () => {
  state.gameSearchQuery = els.gameSearchInput.value;
  render();
});
els.gameSearchSubmit.addEventListener("click", () => {
  state.gameSearchQuery = els.gameSearchInput.value;
  runProviderSearch();
});
els.gameSearchInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  runProviderSearch();
});
els.parseNotebook.addEventListener("click", () => {
  state.notebookImport = els.notebookImport.value;
  parseNotebook();
  render();
});
els.clearNotebook.addEventListener("click", () => {
  state.notebookImport = "";
  state.notebook = emptyNotebook();
  render();
});

els.dealsFilterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    _dealsFilter = btn.dataset.dealsFilter || "all";
    renderDeals();
  });
});

// ── Taste share / import ──────────────────────────────────────────────────────

const TASTE_SHARE_VERSION = 1;
const TASTE_SHARE_PARAM = "taste";
const TASTE_SHARE_MAX_ATOMS = 20;
const TASTE_SHARE_MAX_REACTIONS = 30;

function encodeTastePayload() {
  const weights = state.atomWeights || {};
  const reactions = state.quickReactions || {};
  // Top atoms by absolute weight
  const topAtoms = Object.entries(weights)
    .filter(([, w]) => Math.abs(w) > 0.05)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, TASTE_SHARE_MAX_ATOMS)
    .reduce((acc, [k, v]) => { acc[k] = Math.round(v * 100) / 100; return acc; }, {});
  // Top reactions (loved / liked / skipped)
  const topReactions = Object.entries(reactions)
    .filter(([, r]) => r?.reaction)
    .sort((a, b) => new Date(b[1].updatedAt || 0) - new Date(a[1].updatedAt || 0))
    .slice(0, TASTE_SHARE_MAX_REACTIONS)
    .reduce((acc, [k, r]) => { acc[r.title || k] = r.reaction; return acc; }, {});
  const payload = { v: TASTE_SHARE_VERSION, atoms: topAtoms, reactions: topReactions };
  return btoa(JSON.stringify(payload));
}

function decodeTastePayload(encoded) {
  try {
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}

function tasteShareUrl() {
  const encoded = encodeTastePayload();
  const url = new URL(window.location.href);
  url.searchParams.set(TASTE_SHARE_PARAM, encoded);
  url.searchParams.delete("skipInit");
  return url.toString();
}

function tasteShareSummary(payload) {
  const atomCount = Object.keys(payload.atoms || {}).length;
  const reactionCount = Object.keys(payload.reactions || {}).length;
  const topAtoms = Object.entries(payload.atoms || {})
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k)
    .join(", ");
  return `${atomCount} atom weights · ${reactionCount} game reactions${topAtoms ? ` · loves ${topAtoms}` : ""}`;
}

function mergeTastePayload(payload) {
  const atoms = payload.atoms || {};
  const reactions = payload.reactions || {};
  // Merge atom weights (average with existing)
  Object.entries(atoms).forEach(([atom, weight]) => {
    const existing = state.atomWeights[atom] ?? 0;
    state.atomWeights[atom] = Math.round(((existing + weight) / 2) * 100) / 100;
  });
  // Merge reactions (add if not already reacted)
  Object.entries(reactions).forEach(([title, reaction]) => {
    const key = titleKey(title);
    if (!state.quickReactions[key]) {
      state.quickReactions[key] = { title, reaction, updatedAt: new Date().toISOString(), source: "shared" };
      if (reaction === "loved") state.liked.add(title);
    }
  });
  saveState();
  render();
}

// Generate share link
els.tasteShareBtn.addEventListener("click", () => {
  const url = tasteShareUrl();
  els.tasteShareUrl.textContent = url;
  els.tasteShareUrl.style.display = "";
  els.tasteShareCopy.style.display = "";
  els.tasteShareStatus.textContent = "Link ready";
  setTimeout(() => { els.tasteShareStatus.textContent = ""; }, 3000);
});

// Copy to clipboard
els.tasteShareCopy.addEventListener("click", async () => {
  const url = els.tasteShareUrl.textContent;
  try {
    await navigator.clipboard.writeText(url);
    els.tasteShareStatus.textContent = "Copied ✓";
  } catch {
    els.tasteShareStatus.textContent = "Select the link and copy manually";
  }
  setTimeout(() => { els.tasteShareStatus.textContent = ""; }, 3000);
});

// On load: detect ?taste= param and show import banner
(function checkTasteImportParam() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get(TASTE_SHARE_PARAM);
  if (!encoded) return;
  const payload = decodeTastePayload(encoded);
  if (!payload || payload.v !== TASTE_SHARE_VERSION) return;
  const summary = tasteShareSummary(payload);
  els.tasteImportBannerDesc.textContent = summary;
  els.tasteImportBanner.style.display = "";
  els.tasteImportConfirm.addEventListener("click", () => {
    mergeTastePayload(payload);
    els.tasteImportBanner.style.display = "none";
    // Clean URL
    const clean = new URL(window.location.href);
    clean.searchParams.delete(TASTE_SHARE_PARAM);
    history.replaceState(null, "", clean.toString());
    els.tasteShareStatus.textContent = "Taste merged ✓";
    setTimeout(() => { els.tasteShareStatus.textContent = ""; }, 4000);
  });
  els.tasteImportDismiss.addEventListener("click", () => {
    els.tasteImportBanner.style.display = "none";
    const clean = new URL(window.location.href);
    clean.searchParams.delete(TASTE_SHARE_PARAM);
    history.replaceState(null, "", clean.toString());
  });
})();

// ── Wishlist share ────────────────────────────────────────────────────────────

const WISHLIST_SHARE_PARAM = "wl";

function encodeWishlistPayload() {
  const saved = Object.values(state.userGames || {})
    .filter((g) => g.saved)
    .map((g) => g.title);
  const payload = { v: 1, titles: saved, at: new Date().toISOString().slice(0, 10) };
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(payload)))); } catch { return null; }
}

function decodeWishlistPayload(encoded) {
  try { return JSON.parse(decodeURIComponent(escape(atob(encoded)))); } catch { return null; }
}

if (els.wishlistShareBtn) {
  els.wishlistShareBtn.addEventListener("click", () => {
    const encoded = encodeWishlistPayload();
    if (!encoded) return;
    const url = new URL(window.location.href);
    url.searchParams.set(WISHLIST_SHARE_PARAM, encoded);
    url.searchParams.delete("skipInit");
    const urlStr = url.toString();
    els.wishlistShareUrl.textContent = urlStr;
    els.wishlistShareUrl.style.display = "";
    els.wishlistShareCopy.style.display = "";
    if (els.wishlistShareStatus) els.wishlistShareStatus.textContent = "Link ready";
    setTimeout(() => { if (els.wishlistShareStatus) els.wishlistShareStatus.textContent = ""; }, 3000);
  });
}

if (els.wishlistShareCopy) {
  els.wishlistShareCopy.addEventListener("click", async () => {
    const url = els.wishlistShareUrl?.textContent || "";
    try {
      await navigator.clipboard.writeText(url);
      if (els.wishlistShareStatus) els.wishlistShareStatus.textContent = "Copied ✓";
    } catch {
      if (els.wishlistShareStatus) els.wishlistShareStatus.textContent = "Select the link and copy manually";
    }
    setTimeout(() => { if (els.wishlistShareStatus) els.wishlistShareStatus.textContent = ""; }, 3000);
  });
}

// On load: detect ?wl= param and show wishlist import banner
(function checkWishlistImportParam() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get(WISHLIST_SHARE_PARAM);
  if (!encoded) return;
  const payload = decodeWishlistPayload(encoded);
  if (!payload?.titles?.length) return;
  if (els.wishlistImportBannerTitle) {
    els.wishlistImportBannerTitle.textContent = `Someone shared their wishlist with you`;
  }
  if (els.wishlistImportBannerSummary) {
    const sample = payload.titles.slice(0, 3).join(", ");
    const more = payload.titles.length > 3 ? ` and ${payload.titles.length - 3} more` : "";
    els.wishlistImportBannerSummary.textContent = `${payload.titles.length} games: ${sample}${more}`;
  }
  if (els.wishlistImportBanner) els.wishlistImportBanner.style.display = "";
  if (els.wishlistImportConfirm) {
    els.wishlistImportConfirm.addEventListener("click", () => {
      payload.titles.forEach((title) => {
        setGameState(title, "saved");
      });
      if (els.wishlistImportBanner) els.wishlistImportBanner.style.display = "none";
      const clean = new URL(window.location.href);
      clean.searchParams.delete(WISHLIST_SHARE_PARAM);
      history.replaceState(null, "", clean.toString());
      render();
    });
  }
  if (els.wishlistImportDismiss) {
    els.wishlistImportDismiss.addEventListener("click", () => {
      if (els.wishlistImportBanner) els.wishlistImportBanner.style.display = "none";
      const clean = new URL(window.location.href);
      clean.searchParams.delete(WISHLIST_SHARE_PARAM);
      history.replaceState(null, "", clean.toString());
    });
  }
})();

// ── Wishlist sort event listener ──────────────────────────────────────────────
document.querySelectorAll("[data-wishlist-sort]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.wishlistSort = btn.dataset.wishlistSort;
    renderPriceWatch(rankedGames());
  });
});

// ── Error overlay buttons ─────────────────────────────────────────────────────
if (els.appErrorRetry) {
  els.appErrorRetry.addEventListener("click", () => {
    els.appErrorOverlay?.classList.add("is-hidden");
    init();
  });
}
if (els.appErrorOffline) {
  els.appErrorOffline.addEventListener("click", () => {
    // Hide overlay — app will render with empty catalog, state still accessible
    els.appErrorOverlay?.classList.add("is-hidden");
    render();
  });
}
if (els.dataErrorToastClose) {
  els.dataErrorToastClose.addEventListener("click", () => {
    els.dataErrorToast?.classList.add("is-hidden");
  });
}

// ── Swipe-to-close drawer (mobile) ────────────────────────────────────────────
(function initDrawerSwipe() {
  const drawer = els.gameDetailDrawer;
  if (!drawer) return;

  let startY = 0;
  let currentY = 0;
  let dragging = false;

  drawer.addEventListener("touchstart", (e) => {
    // Only start swipe if at top of scroll
    if (drawer.scrollTop > 8) return;
    startY = e.touches[0].clientY;
    currentY = startY;
    dragging = true;
    drawer.style.transition = "none";
  }, { passive: true });

  drawer.addEventListener("touchmove", (e) => {
    if (!dragging) return;
    currentY = e.touches[0].clientY;
    const delta = Math.max(0, currentY - startY);
    drawer.style.transform = `translateY(${delta}px)`;
  }, { passive: true });

  drawer.addEventListener("touchend", () => {
    if (!dragging) return;
    dragging = false;
    const delta = currentY - startY;
    if (delta > 90) {
      // Dismiss
      drawer.classList.add("is-snapping");
      drawer.style.transform = `translateY(100%)`;
      setTimeout(() => {
        drawer.style.transform = "";
        drawer.classList.remove("is-snapping");
        closeGameDetail();
      }, 240);
    } else {
      // Snap back
      drawer.classList.add("is-snapping");
      drawer.style.transform = "";
      setTimeout(() => {
        drawer.classList.remove("is-snapping");
        drawer.style.transition = "";
      }, 240);
    }
  });
})();

// ── Dark mode toggle ──────────────────────────────────────────────────────────
(function initThemeToggle() {
  const btn = document.querySelector("#theme-toggle");
  if (!btn) return;
  const root = document.documentElement;

  function syncButton() {
    const isDark = root.getAttribute("data-theme") === "dark";
    btn.textContent = isDark ? "☀" : "🌙";
    btn.setAttribute("aria-pressed", String(isDark));
    btn.title = isDark ? "Switch to light mode" : "Switch to dark mode";
    // Keep meta theme-color in sync for mobile chrome
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", isDark ? "#0b1120" : "#003791");
  }

  syncButton();

  btn.addEventListener("click", () => {
    const isDark = root.getAttribute("data-theme") === "dark";
    if (isDark) {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", "dark");
    }
    try {
      localStorage.setItem("playsputnik-theme", isDark ? "light" : "dark");
    } catch { /* storage blocked */ }
    syncButton();
  });

  // Follow OS changes only if the user hasn't set an explicit preference
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      let stored = null;
      try { stored = localStorage.getItem("playsputnik-theme"); } catch { /* ignore */ }
      if (stored) return; // explicit choice wins
      if (e.matches) root.setAttribute("data-theme", "dark");
      else root.removeAttribute("data-theme");
      syncButton();
    });
  }
})();

els.refresh.addEventListener("click", render);
// Settings toggle (mobile)
const settingsToggle = document.querySelector("#settings-toggle");
const setupPanel = document.querySelector("#setup-panel");
if (settingsToggle && setupPanel) {
  settingsToggle.addEventListener("click", () => {
    const open = setupPanel.classList.toggle("is-open");
    settingsToggle.setAttribute("aria-expanded", String(open));
    settingsToggle.textContent = open ? "✕" : "⚙";
  });
}

els.reset.addEventListener("click", () => {
  window.PlaySputnikStorage.idbRemove(STORAGE_KEY).catch(() => {});
  localStorage.removeItem(STORAGE_KEY);
  state = defaultState();
  render();
});

function dataRequest(path) {
  return fetch(path, { cache: "no-store" });
}

async function readJsonResponse(path, label) {
  const response = await dataRequest(path);
  if (!response.ok) throw new Error(`${label} request failed: ${response.status}`);
  return response.json();
}

function assignDeferredData(payload) {
  if (payload.sourceStatus) sourceStatus = payload.sourceStatus;
  if (payload.dataHealth) dataHealth = payload.dataHealth;
  if (payload.devHealth) devHealth = payload.devHealth;
  if (payload.priceHistory) {
    priceHistory = payload.priceHistory;
    games = mergeStoreData(games, priceSnapshots, subscriptionAvailability, coverSnapshots, priceHistory);
  }
  if (payload.refreshPolicy) refreshPolicy = payload.refreshPolicy;
  if (payload.tasteRadar) tasteRadar = payload.tasteRadar;
  if (payload.monthlyDrop) monthlyDrop = payload.monthlyDrop;
  if (payload.dropCalendar) dropCalendar = payload.dropCalendar;
  if (payload.catalogWorkbench) catalogWorkbench = payload.catalogWorkbench;
  if (payload.catalogBackbone) catalogBackbone = payload.catalogBackbone;
  if (payload.searchSources) searchSources = payload.searchSources;
  if (payload.globalSearchFixtures) globalSearchFixtures = payload.globalSearchFixtures;
  if (payload.searchSources || payload.globalSearchFixtures) {
    searchIndexStatus = searchSources?.sources?.length && Array.isArray(globalSearchFixtures?.records) ? "ready" : "loading";
  }
}

async function hydrateDeferredData() {
  const groups = [
    {
      sourceStatus: ["data/source-status.json", "Source status"],
      dataHealth: ["data/data-health.json", "Data health"],
      devHealth: ["data/dev-health.json", "Dev health"],
      priceHistory: ["data/price-history.json", "Price history"],
      refreshPolicy: ["data/refresh-policy.json", "Refresh policy"],
    },
    {
      tasteRadar: ["data/taste-radar.json", "Taste radar"],
      monthlyDrop: ["data/monthly-drop.json", "Monthly drop"],
      dropCalendar: ["data/drop-calendar.json", "Drop calendar"],
    },
    {
      catalogWorkbench: ["data/catalog-workbench.json", "Catalog workbench"],
      catalogBackbone: ["data/catalog-backbone.json", "Catalog backbone"],
    },
    {
      searchSources: ["data/search-sources.json", "Search sources"],
      globalSearchFixtures: ["data/global-search-fixtures.json", "Global search"],
    },
  ];

  try {
    for (const group of groups) {
      const entries = await Promise.all(
        Object.entries(group).map(async ([key, [path, label]]) => [key, await readJsonResponse(path, label)]),
      );
      assignDeferredData(Object.fromEntries(entries));
      render();
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    }
  } catch (error) {
    if (!searchSources?.sources?.length || !Array.isArray(globalSearchFixtures?.records)) {
      searchIndexStatus = "failed";
    }
    if (typeof window !== "undefined") {
      window.__playsputnikErrors = [
        ...(window.__playsputnikErrors || []),
        { message: error.message, source: "deferred-data" },
      ];
    }
    showDataErrorToast(`Some data failed to load: ${error.message}`);
  }
}

async function init() {
  try {
    const [
      catalog,
      nextTitleAliases,
      nextPriceSnapshots,
      nextSubscriptionAvailability,
      nextCoverSnapshots,
    ] = await Promise.all([
      readJsonResponse("data/games.json", "Catalog"),
      readJsonResponse("data/title-aliases.json", "Title aliases"),
      readJsonResponse("data/price-snapshots.json", "Price snapshots"),
      readJsonResponse("data/subscription-availability.json", "Subscription availability"),
      readJsonResponse("data/cover-snapshots.json", "Cover snapshots"),
    ]);
    titleAliases = nextTitleAliases;
    priceSnapshots = nextPriceSnapshots;
    subscriptionAvailability = nextSubscriptionAvailability;
    coverSnapshots = nextCoverSnapshots;
    games = mergeStoreData(catalog, priceSnapshots, subscriptionAvailability, coverSnapshots, priceHistory);
    render();
    hydrateDeferredData();
  } catch (error) {
    showAppError(error);
  }
}

function showAppError(error) {
  if (els.appErrorOverlay) {
    els.appErrorOverlay.classList.remove("is-hidden");
    if (els.appErrorMessage) {
      const isNetwork = error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError");
      els.appErrorMessage.textContent = isNetwork
        ? "Network error — make sure the local preview server is running, or open the file directly."
        : error.message || "Something went wrong while loading game data.";
    }
    if (els.appErrorStack) els.appErrorStack.textContent = error.stack || error.message || "";
  } else {
    // Fallback to inline message
    els.topPick.innerHTML = `
      <article class="hero-card">
        <div class="hero-body">
          <p class="eyebrow">Catalog unavailable</p>
          <h3>Start the local preview server</h3>
          <p class="reason">${error.message}</p>
        </div>
      </article>
    `;
  }
}

function showDataErrorToast(message) {
  if (!els.dataErrorToast) return;
  if (els.dataErrorToastMsg) els.dataErrorToastMsg.textContent = message;
  els.dataErrorToast.classList.remove("is-hidden");
  // Auto-dismiss after 8s
  setTimeout(() => els.dataErrorToast?.classList.add("is-hidden"), 8000);
}

if (
  typeof window !== "undefined"
  && (window.PLAYSPUTNIK_SKIP_INIT || new URLSearchParams(window.location.search).has("skipInit"))
) {
  window.__playsputnikBoot = {
    skippedInit: true,
    appLoadedAt: new Date().toISOString(),
  };
} else {
  init();
}
