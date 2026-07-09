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
let editorialRu = {};
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
if (!window.PlaySputnikDecisions) {
  throw new Error("PlaySputnikDecisions must load before app.js");
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
if (!window.PlaySputnikDetailView) {
  throw new Error("PlaySputnikDetailView must load before app.js");
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
if (!window.PlaySputnikSearchMemory) {
  throw new Error("PlaySputnikSearchMemory must load before app.js");
}

const {
  STORAGE_KEY,
  PROVIDER_SEARCH_ENDPOINT,
  APP_VIEWS,
  LIBRARY_QUEUE_FILTERS,
  WISHLIST_QUEUE_FILTERS,
  USER_STATE_LABELS,
  PLAYABLE_STATES,
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

const DEMO_PROFILE_REACTIONS = [
  { title: "The Last of Us Part I", reaction: "loved" },
  { title: "Red Dead Redemption 2", reaction: "loved" },
  { title: "The Witcher 3: Wild Hunt", reaction: "loved" },
  { title: "Cyberpunk 2077", reaction: "loved" },
  { title: "God of War Ragnarok", reaction: "loved" },
  { title: "Disco Elysium", reaction: "loved" },
  { title: "Alan Wake 2", reaction: "loved" },
  { title: "Resident Evil 4", reaction: "played" },
  { title: "Stray", reaction: "played" },
  { title: "Hades", reaction: "played" },
  { title: "Baldur's Gate 3", reaction: "not_for_me" },
  { title: "Fortnite", reaction: "not_for_me" },
  { title: "EA Sports FC 26", reaction: "not_for_me" },
  { title: "Civilization VI", reaction: "not_for_me" },
];

const DEMO_PROFILE_STATES = [
  { title: "The Forgotten City", state: "playing" },
  { title: "Resident Evil 4", state: "want_to_finish" },
  { title: "Control Ultimate Edition", state: "owned_forever" },
  { title: "Dave the Diver", state: "subscription" },
  { title: "Alan Wake 2", state: "saved" },
  { title: "Mafia: The Old Country", state: "saved" },
  { title: "The Alters", state: "saved" },
  { title: "Death Stranding 2", state: "saved" },
  { title: "Kena: Bridge of Spirits", state: "completed" },
  { title: "Sifu", state: "dropped" },
];

const DEMO_PROFILE_RATINGS = [
  { title: "Red Dead Redemption 2", rating: 100 },
  { title: "The Witcher 3: Wild Hunt", rating: 100 },
  { title: "Cyberpunk 2077", rating: 92 },
  { title: "Alan Wake 2", rating: 90 },
  { title: "Disco Elysium", rating: 90 },
  { title: "Control Ultimate Edition", rating: 88 },
  { title: "What Remains of Edith Finch", rating: 86 },
  { title: "Stray", rating: 78 },
  { title: "Baldur's Gate 3", rating: 42 },
  { title: "EA Sports FC 26", rating: 25 },
];

const DEMO_PROFILE_PRICE_TARGETS = [
  { title: "Mafia: The Old Country", region: "US", target: 38 },
  { title: "The Alters", region: "US", target: 25 },
  { title: "Death Stranding 2", region: "US", target: 45 },
];

const {
  normalizeTitle,
  aliasEntryForTitle,
  titleKey,
  invalidateTitleKeys,
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
  stateMigrations: window.PlaySputnikStateMigrations || null,
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
  classifyTasteVerdict,
  personalRatingRecords,
  tasteCalibrationProfile,
  personalRatingForecast,
  calibrationQuestionGames,
  notebookTitles,
  notebookWishlistWeight,
  notebookAccessKind,
  notebookCompletedSet,
  notebookRankedSet,
  notebookTasteScore,
  scoreBreakdown,
  scoreGame,
  gameChunkProfile,
  personalFitBand,
  rankRangeForScore,
} = window.PlaySputnikScore.createScoreTools({
  getState: () => state,
  getProfileGames: () => profileGames,
  getQuickReaction: (title) => state.quickReactions?.[titleKey(title)] || "",
  getFeedbackSource: (title) => feedbackSource(title),
  getTasteConflict: () => quickTasteConflictReport(),
  getTasteSignalCount: () => quickTasteSignalCount(),
  getRecommendationPool: () => recommendationPool(),
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
  parseRankedTasteLines,
  cleanImportedTitle,
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
  gameTagline,
  watchOuts,
  watchOutCopy,
  answerAccessLabel,
  explain,
  personalReferenceGames,
  personalRankForecast,
  personalEvidence,
  personalRatingBadge,
  tasteVerdict,
  decisionRationale,
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
  tasteEngineScore,
  classifyTasteVerdict,
  personalRatingForecast,
  tasteCalibrationProfile,
  scoreGame,
  personalFitBand,
  rankRangeForScore,
  notebookWishlistWeight,
  notebookAccessKind,
  effectiveGameState,
  effectiveUserGame,
  titleMatches,
  titleKey,
  getEditorialEntry: (game) => (
    window.PlaySputnikI18n.getLocale() === "ru" ? editorialRu[game?.title] || null : null
  ),
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
  notebookRankedSet,
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
  companionComparison,
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
  personalRatingForecast,
  decisionRationale,
  answerAccessLabel,
  priceStatus,
  formatPrice,
  gameChunkProfile,
  effectiveGameState,
  titleMatches,
  countValues,
  topEntries,
});

const {
  comparisonState,
  selectedDecisionTitles,
  selectTitleForComparison,
  setComparisonGames,
  swapComparisonGames,
  isTitleCompared,
  toggleRatingQueueTitle,
  removeRatingQueueGame,
  isTitleQueued,
  comparisonPair,
  ratingQueueItems,
} = window.PlaySputnikDecisions.createDecisionTools({
  getState: () => state,
  titleKey,
  titleMatches,
  personalRatingForecast,
  recordUserEvent: (type, title, detail) => recordUserEvent(type, title, detail),
});

const {
  canonicalSearchResultSeed,
  canonicalSearchResultTitle,
  searchResultUserGame,
  resultStateSelected,
  resultAlreadySaved,
  searchResultMemoryRecord,
  applySearchResultState,
  addSearchResultToMemory,
  addSearchResultToWishlist,
  rememberSearchResultWithoutState,
  selectSearchResultForComparison,
  toggleSearchResultRatingQueue,
} = window.PlaySputnikSearchMemory.createSearchMemoryTools({
  getState: () => state,
  knownSeedGame,
  titleKey,
  explicitUserGame: (title) => explicitUserGame(title),
  normalizeUserGameRecord,
  applyStateToUserGame,
  legacyStateFromUserGame,
  setGameState: (title, userState) => setGameState(title, userState),
  recordUserEvent: (type, title, detail) => recordUserEvent(type, title, detail),
  recordFeedback: (action, title) => recordFeedback(action, title),
  selectTitleForComparison,
  toggleRatingQueueTitle,
  aiEnrichmentForGame: (item) => aiEnrichmentForGame(item),
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
  libraryNextStep,
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
  decisionRationale,
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
  antiHypeGuard,
  priceWatchReason,
  priceHistoryForGame,
  historicalLowForGame,
  customPriceWatchTarget,
  priceWatchTarget,
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
  notebookRankedSet,
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
  antiHypeGuard,
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
  getAntiHypeGuard: (game) => {
    const region = state.activeRegion;
    const currency = game.priceMeta?.[region]?.currency || "USD";
    return antiHypeGuard(game, priceWatchRecord(game, region, 0), region, currency);
  },
  explain,
  personalEvidence,
  personalRatingBadge,
  gameDescription,
  gameTagline,
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
let renderDataQualitySnapshot, renderRefreshPolicy, renderSourceHealth, renderDevHealth, renderDataWorkbench, renderCatalogBackbone, renderCatalogWorkbench, refreshQueue;
let renderProviderImports;

const {
  cachedNarrative,
  fetchNarrative,
  narrativeAvailable,
  localNarrative,
  cachedExplanation,
  fetchExplanation,
  clearExplanationCache,
} = window.PlaySputnikAi.createAiTools({
  getState: () => state,
  getSourceGames: () => sourceGames(),
  getLocale: () => window.PlaySputnikI18n.getLocale(),
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
  tasteImportPreview: document.querySelector("#taste-import-preview"),
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
  demoContinuityPanel: document.querySelector("#demo-continuity-panel"),
  demoContinuityKicker: document.querySelector("#demo-continuity-kicker"),
  demoContinuityTitle: document.querySelector("#demo-continuity-title"),
  demoContinuityDetail: document.querySelector("#demo-continuity-detail"),
  demoContinuityMetrics: document.querySelector("#demo-continuity-metrics"),
  demoContinuityActions: document.querySelector("#demo-continuity-actions"),
  tasteUnderstoodPanel: document.querySelector("#taste-understood-panel"),
  tasteUnderstoodStatus: document.querySelector("#taste-understood-status"),
  tasteUnderstoodBody: document.querySelector("#taste-understood-body"),
  firstRunStatus: document.querySelector("#first-run-status"),
  firstRunGrid: document.querySelector("#first-run-grid"),
  firstRunBridge: document.querySelector("#first-run-bridge"),
  answerStatus: document.querySelector("#answer-status"),
  answerCopy: document.querySelector("#answer-copy"),
  amnestyPanel: document.querySelector("#amnesty-panel"),
  amnestyStatus: document.querySelector("#amnesty-status"),
  amnestyCard: document.querySelector("#amnesty-card"),
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
  ratingQueueStatus: document.querySelector("#rating-queue-status"),
  ratingQueueList: document.querySelector("#rating-queue-list"),
  myGamesSummary: document.querySelector("#my-games-summary"),
  myGamesDashboard: document.querySelector("#my-games-dashboard"),
  myGamesCommand: document.querySelector("#my-games-command"),
  myGamesFilterSummary: document.querySelector("#my-games-filter-summary"),
  libraryFilterButtons: document.querySelectorAll("[data-library-filter]"),
  myGamesList: document.querySelector("#my-games-list"),
  gameSearchStatus: document.querySelector("#game-search-status"),
  gameSearchInput: document.querySelector("#game-search-input"),
  gameSearchSubmit: document.querySelector("#game-search-submit"),
  gameSearchSource: document.querySelector("#game-search-source"),
  gameSearchTrust: document.querySelector("#game-search-trust"),
  gameSearchList: document.querySelector("#game-search-list"),
  comparisonFirst: document.querySelector("#comparison-first"),
  comparisonSecond: document.querySelector("#comparison-second"),
  comparisonSwap: document.querySelector("#comparison-swap"),
  comparisonRun: document.querySelector("#comparison-run"),
  comparisonGames: document.querySelector("#comparison-games"),
  comparisonStatus: document.querySelector("#game-comparison-status"),
  comparisonResult: document.querySelector("#game-comparison-result"),
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
  statsCalibration: document.querySelector("#stats-calibration"),
  statsAtoms: document.querySelector("#stats-atoms"),
  statsTimeline: document.querySelector("#stats-timeline"),
  statsBadge: document.querySelector("#stats-badge"),
  priceWatchList: document.querySelector("#price-watch-list"),
  buyDecisionStatus: document.querySelector("#buy-decision-status"),
  buyDecisionList: document.querySelector("#buy-decision-list"),
  tasteShareBtn: document.querySelector("#taste-share-btn"),
  tasteShareCopy: document.querySelector("#taste-share-copy"),
  tasteShareUrl: document.querySelector("#taste-share-url"),
  tasteShareSummaryEl: document.querySelector("#taste-share-summary"),
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
  dataQualityStatus: document.querySelector("#data-quality-status"),
  dataQualitySummary: document.querySelector("#data-quality-summary"),
  dataQualityList: document.querySelector("#data-quality-list"),
  providerImportStatus: document.querySelector("#provider-import-status"),
  providerImportList: document.querySelector("#provider-import-list"),
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
  renderDataQualitySnapshot,
  renderRefreshPolicy,
  renderSourceHealth,
  renderDevHealth,
  renderDataWorkbench,
  renderProviderImports,
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
  onProviderImportAction: (title, action) => applyProviderImportAction(title, action),
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

function applyProviderImportAction(title, action) {
  if (action === "open-wishlist") {
    state.activeView = "wishlist";
    saveState();
    render();
    return;
  }
  const key = titleKey(title);
  const current = normalizeUserGameRecord(state.userGames[key], title);
  if (!current?.providerImport) return;
  const now = new Date().toISOString();
  const providerImport = {
    ...current.providerImport,
    reviewedAt: now,
    reviewAction: action,
  };
  const next = {
    ...current,
    providerImport,
    updatedAt: now,
  };
  if (action === "accept") {
    providerImport.status = "accepted";
    next.saved = true;
    next.catalogStatus = next.catalogStatus || "external_memory";
    state.saved.add(next.title);
    state.hidden.delete(next.title);
  } else if (action === "snooze") {
    providerImport.status = "snoozed";
    providerImport.snoozedUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  } else if (action === "hide") {
    providerImport.status = "hidden";
    providerImport.hiddenAt = now;
  }
  state.userGames[key] = next;
  state.userStates[key] = { title: next.title, state: legacyStateFromUserGame(next), updatedAt: now };
  recordUserEvent("provider_import_reviewed", next.title, {
    action,
    provider: providerImport.provider,
    status: providerImport.status,
  });
  saveState();
  render();
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
  delete state.calibrationSkips?.[key];
  delete state.ratingQueue?.[key];
  state.userGames[key] = current;
  state.userStates[key] = { title, state: legacyStateFromUserGame(current), updatedAt: current.updatedAt };
  recordUserEvent("user_game_rating_changed", title, { from: previousRating, to: current.rating });
  // Feed the taste engine: rated_1..rated_5 carry graded weights (-3..+3),
  // unlike the old flavourless rating_set which had no weight at all.
  if (current.rating === null) {
    // Don't keep an empty shell record around if rating was its only content
    if (!current.access && !current.completionStatus && !current.saved && !current.hidden) {
      delete state.userGames[key];
      delete state.userStates[key];
    }
    recordFeedback("rating_cleared", title);
  } else {
    const sputniks = Math.max(1, Math.min(5, Math.round(current.rating / 20)));
    recordFeedback(`rated_${sputniks}`, title);
  }
}

function skipCalibrationGame(title) {
  const key = titleKey(title);
  state.calibrationSkips = state.calibrationSkips || {};
  state.calibrationSkips[key] = { title, skippedAt: new Date().toISOString() };
  delete state.ratingQueue?.[key];
  recordUserEvent("calibration_game_skipped", title);
}

function normalizePriceWatchTargetValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return Math.round(numeric * 100) / 100;
}

function syncLegacyStateFromUserGame(key, userGame) {
  const legacyState = legacyStateFromUserGame(userGame);
  if (legacyState) {
    state.userStates[key] = { title: userGame.title, state: legacyState, updatedAt: userGame.updatedAt };
  } else {
    delete state.userStates[key];
  }
}

function hasDurableUserGameMemory(userGame) {
  return Boolean(
    userGame.access
      || userGame.completionStatus
      || userGame.saved
      || userGame.hidden
      || typeof userGame.rating === "number"
      || userGame.amnesty
      || userGame.provider
      || userGame.catalogStatus
      || userGame.sourceUrl
      || userGame.coverUrl,
  );
}

function setPriceWatchTarget(title, rawValue, region = state.activeRegion) {
  const targetPrice = normalizePriceWatchTargetValue(rawValue);
  if (!title || !region || targetPrice === null) return false;
  const key = titleKey(title);
  const current = normalizeUserGameRecord(explicitUserGame(title), title) || normalizeUserGameRecord({ title });
  const now = new Date().toISOString();
  const next = {
    ...current,
    title: current.title || title,
    priceWatch: {
      targets: {
        ...(current.priceWatch?.targets || {}),
        [region]: targetPrice,
      },
      updatedAt: now,
    },
    source: current.source === "manual" && !hasDurableUserGameMemory(current) ? "price_watch" : current.source || "price_watch",
    updatedAt: now,
  };
  state.userGames[key] = next;
  syncLegacyStateFromUserGame(key, next);
  recordUserEvent("price_watch_target_set", title, { region, targetPrice });
  recordFeedback("price_watch_target", title);
  return true;
}

function clearPriceWatchTarget(title, region = state.activeRegion) {
  if (!title || !region) return false;
  const key = titleKey(title);
  const current = normalizeUserGameRecord(explicitUserGame(title), title);
  if (!current?.priceWatch?.targets?.[region]) return false;
  const now = new Date().toISOString();
  const targets = { ...(current.priceWatch.targets || {}) };
  delete targets[region];
  const next = {
    ...current,
    priceWatch: Object.keys(targets).length ? { targets, updatedAt: now } : null,
    updatedAt: now,
  };
  if (!next.priceWatch && !hasDurableUserGameMemory(next)) {
    delete state.userGames[key];
    delete state.userStates[key];
  } else {
    state.userGames[key] = next;
    syncLegacyStateFromUserGame(key, next);
  }
  recordUserEvent("price_watch_target_cleared", title, { region });
  recordFeedback("price_watch_clear", title);
  return true;
}

const BACKLOG_AMNESTY_SKIP_TARGET = 5;
const BACKLOG_AMNESTY_KEEP_COOLDOWN_SKIPS = 2;

function normalizeBacklogAmnestyMeta(meta = {}) {
  const safeMeta = meta && typeof meta === "object" ? meta : {};
  const numberOrZero = (value) => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
  return {
    impressions: numberOrZero(safeMeta.impressions),
    skips: numberOrZero(safeMeta.skips),
    dismissedSkips: numberOrZero(safeMeta.dismissedSkips),
    lastSeenAt: safeMeta.lastSeenAt || null,
    lastSkippedAt: safeMeta.lastSkippedAt || null,
    dismissedAt: safeMeta.dismissedAt || null,
    archivedAt: safeMeta.archivedAt || null,
    restoredAt: safeMeta.restoredAt || null,
  };
}

function backfillBacklogAmnestyMeta(title) {
  const key = titleKey(title);
  const current = normalizeUserGameRecord(state.userGames[key], title) || normalizeUserGameRecord({ title });
  return {
    key,
    current,
    meta: normalizeBacklogAmnestyMeta(current.amnesty),
  };
}

function writeBacklogAmnestyMeta(title, meta, source = "backlog_amnesty_signal") {
  const { key, current } = backfillBacklogAmnestyMeta(title);
  const isShellRecord = !current.access && !current.completionStatus && !current.saved && !current.hidden && typeof current.rating !== "number";
  const next = {
    ...current,
    title: current.title || title,
    amnesty: normalizeBacklogAmnestyMeta(meta),
    source: isShellRecord ? source : current.source || source,
    updatedAt: new Date().toISOString(),
  };
  state.userGames[key] = next;
  if (next.hidden) state.hidden.add(next.title);
  if (next.saved) state.saved.add(next.title);
  return next;
}

function trackBacklogSkip(title, source = "snooze_tonight") {
  const { meta } = backfillBacklogAmnestyMeta(title);
  const now = new Date().toISOString();
  const next = writeBacklogAmnestyMeta(title, {
    ...meta,
    skips: meta.skips + 1,
    lastSkippedAt: now,
  });
  recordUserEvent("backlog_skip", title, { source, skips: next.amnesty.skips });
}

function dismissBacklogAmnesty(title) {
  const { meta } = backfillBacklogAmnestyMeta(title);
  const now = new Date().toISOString();
  const next = writeBacklogAmnestyMeta(title, {
    ...meta,
    dismissedAt: now,
    dismissedSkips: meta.skips + BACKLOG_AMNESTY_KEEP_COOLDOWN_SKIPS,
  });
  recordUserEvent("backlog_amnesty_kept", title, { skips: next.amnesty.skips });
  recordFeedback("backlog_amnesty_keep", title);
}

function archiveBacklogCandidate(title) {
  if (!title) return;
  stageLastUndo("amnesty", title);
  invalidateEffectiveState();
  const key = titleKey(title);
  const { meta } = backfillBacklogAmnestyMeta(title);
  const current = explicitUserGame(title) || normalizeUserGameRecord({ title });
  const now = new Date().toISOString();
  const next = applyStateToUserGame(current, "hidden");
  next.title = current.title || title;
  next.source = "backlog_amnesty";
  next.amnesty = normalizeBacklogAmnestyMeta({
    ...meta,
    archivedAt: now,
    restoredAt: null,
    dismissedAt: now,
    dismissedSkips: Math.max(meta.dismissedSkips, meta.skips),
  });
  state.userGames[key] = next;
  state.userStates[key] = { title: next.title, state: legacyStateFromUserGame(next), updatedAt: next.updatedAt };
  state.hidden.add(next.title);
  state.saved.delete(next.title);
  state.snoozed.delete(next.title);
  recordUserEvent("backlog_amnestied", title, { skips: next.amnesty.skips });
  recordFeedback("backlog_amnesty", title);
}

function restoreBacklogAmnesty(title) {
  if (!title) return false;
  const current = normalizeUserGameRecord(explicitUserGame(title), title);
  if (!current?.hidden || !current.amnesty?.archivedAt) return false;
  stageLastUndo("restore_amnesty", title);
  invalidateEffectiveState();
  const key = titleKey(title);
  const now = new Date().toISOString();
  const next = {
    ...current,
    hidden: false,
    saved: true,
    source: "backlog_amnesty_restored",
    amnesty: normalizeBacklogAmnestyMeta({
      ...current.amnesty,
      archivedAt: null,
      restoredAt: now,
      dismissedAt: now,
      dismissedSkips: Math.max(current.amnesty.dismissedSkips, current.amnesty.skips + BACKLOG_AMNESTY_KEEP_COOLDOWN_SKIPS),
    }),
    updatedAt: now,
  };
  state.userGames[key] = next;
  syncLegacyStateFromUserGame(key, next);
  state.hidden.delete(next.title);
  state.saved.add(next.title);
  recordUserEvent("backlog_amnesty_restored", title, { skips: next.amnesty.skips });
  recordFeedback("backlog_amnesty_restore", title);
  return true;
}

function isAmnestiedUserGame(userGame) {
  return Boolean(userGame && (userGame.source === "backlog_amnesty" || (userGame.hidden && userGame.amnesty?.archivedAt)));
}

function snoozeGame(title) {
  trackBacklogSkip(title);
  state.snoozed.add(title);
  recordFeedback("snooze_tonight", title);
}

function titleStateSnapshot(title) {
  return titleStateSnapshotForState(state, title);
}

function stageLastUndo(action, title) {
  if (!title || !["play", "save", "snooze", "amnesty", "restore_amnesty"].includes(action)) return;
  const labels = {
    play: "Marked Playing",
    save: "Saved",
    snooze: "Skipped tonight",
    amnesty: "Let go",
    restore_amnesty: "Restored",
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
  const status = explicitAtoms.length || inferredAtoms.length || rule
    ? t("discover.enrichmentInferred")
    : t("discover.enrichmentTitleOnly");
  const fit = positiveAtoms.length >= 2
    ? t("discover.enrichmentPromising")
    : positiveAtoms.length
      ? t("discover.enrichmentHint")
      : t("discover.enrichmentCheck");
  const summary = positiveAtoms.length
    ? t("discover.enrichmentSignals", { signals: positiveAtoms.join(" / ") })
    : t("discover.enrichmentPreliminary");
  const risk = cautionAtoms.length
    ? t("discover.enrichmentFriction", { signals: cautionAtoms.join(" / ") })
    : t("discover.enrichmentRisk");

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

function aiEnrichmentHtml(item, modifier = "", precomputed = null) {
  const enrichment = precomputed || aiEnrichmentForGame(item);
  const missingKeys = {
    platforms: "discover.missingPlatforms",
    cover: "discover.missingCover",
    price: "discover.missingPrice",
    atoms: "discover.missingAtoms",
    "PS Plus": "discover.missingPlus",
  };
  const missing = enrichment.missing.length
    ? enrichment.missing.slice(0, 4).map((value) => t(missingKeys[value] || "discover.missingAtoms")).join(" / ")
    : t("discover.enrichmentNothing");
  const atoms = enrichment.atoms.slice(0, 4).map((atom) => `<span class="fact tone">${labelAtom(atom)}</span>`).join("");
  return `
    <div class="ai-enrichment ${modifier}">
      <div>
        <span class="enrichment-status">${enrichment.status}</span>
        <strong>${enrichment.fit}</strong>
      </div>
      <p>${enrichment.summary} ${enrichment.risk}</p>
      <div class="facts">${atoms}<span class="fact warn">${t("discover.enrichmentCheckFact", { missing })}</span></div>
    </div>
  `;
}



function externalUserGameRecords() {
  const rememberedTitles = selectedDecisionTitles();
  return Object.values(state.userGames || {})
    .map((record) => normalizeUserGameRecord(record))
    .filter((record) => record?.title && !knownSeedGame(record.title))
    .filter((record) => (
      record.saved
      || record.access
      || record.completionStatus
      || typeof record.rating === "number"
      || rememberedTitles.has(titleKey(record.title))
    ));
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

function backboneTone(record) {
  const lane = record.lane || "";
  if (lane.includes("horror")) return "tense";
  if (lane.includes("cozy")) return "warm";
  if (lane.includes("sports")) return "funny";
  if (lane.includes("cinematic")) return "dark";
  if (lane.includes("systems") || lane.includes("strategy")) return "strange";
  return "neutral";
}

function backboneContent(record) {
  const atoms = new Set(record.atoms || []);
  const lane = record.lane || "";
  if (lane.includes("cozy") || lane.includes("sports")) return "family-safe";
  if (atoms.has("crime") || atoms.has("shooter") || atoms.has("horror") || atoms.has("survival")) return "realistic-violence";
  if (atoms.has("action") || atoms.has("combat")) return "stylized-violence";
  return "low-violence";
}

function backboneTasteGameFromRecord(record) {
  const session = record.session || "medium";
  const commitment = record.commitment || (session === "long" ? "high" : "medium");
  return {
    title: record.title,
    atoms: record.atoms || [],
    vibe: record.reason || "Catalog backbone taste candidate",
    session,
    difficulty: "normal",
    length: session === "long" ? "long" : "medium",
    commitment,
    tone: backboneTone(record),
    content: backboneContent(record),
    reviewBurden: record.atomStatus === "complete" ? "medium" : "high",
    adultTimeFit: record.adultTimeFit || (session === "short" ? "weeknight" : session === "long" ? "vacation" : "weekend"),
    backlog: false,
    wishlist: record.lane === "upcoming_watch" || record.priceNeed === "hot",
    externalCandidate: true,
    catalogBackboneCandidate: true,
    recommendationLane: "catalog",
    color: "linear-gradient(135deg, #1d4ed8, #0f172a)",
    prices: {},
    discount: {},
    priceMeta: {},
    priceHistory: {},
    psPlus: [],
    subscriptionMeta: {},
    coverMeta: {
      title: record.title,
      status: record.coverStatus || "fallback",
      source: record.source || "catalog_backbone",
      sourceUrl: "local://catalog-backbone",
      checkedAt: catalogBackbone?.updatedAt || new Date().toISOString(),
      licenseNote: "Catalog backbone candidate; cover and store facts need promotion before price use.",
      url: "",
    },
    externalMeta: {
      provider: "catalog_backbone",
      source: record.source || "manual_backbone",
      catalogStatus: record.status || "backbone",
      platforms: record.platforms || [],
      priceNeed: record.priceNeed || "missing",
    },
  };
}

function catalogBackboneTasteGames() {
  return (catalogBackbone?.records || [])
    .filter((record) => record?.title && !knownSeedGame(record.title))
    .map(backboneTasteGameFromRecord);
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
  [...profileGames, ...games, ...catalogBackboneTasteGames(), ...externalMemoryGames()].forEach((game) => byTitle.set(titleKey(game.title), game));
  return [...byTitle.values()];
}

function providerSearchCacheKey(query) {
  return titleKey(query);
}

function providerSearchCacheRecord(query) {
  const record = state.providerSearchCache?.[providerSearchCacheKey(query)];
  if (!record || !Array.isArray(record.results)) return null;
  return {
    ...record,
    query,
    status: "cached",
    sourceHealth: "cached_results",
    sourceHealthDetail: "Using locally cached provider results. Refresh search later if source freshness matters.",
    cached: true,
  };
}

function rememberProviderSearch(query, record) {
  if (!record || record.status !== "live" || !Array.isArray(record.results) || !record.results.length) return;
  const key = providerSearchCacheKey(query);
  const nextCache = {
    ...(state.providerSearchCache || {}),
    [key]: {
      ...record,
      query,
      cached: true,
      cachedAt: new Date().toISOString(),
    },
  };
  const entries = Object.entries(nextCache)
    .sort((a, b) => String(b[1].cachedAt || b[1].checkedAt || "").localeCompare(String(a[1].cachedAt || a[1].checkedAt || "")))
    .slice(0, 24);
  state.providerSearchCache = Object.fromEntries(entries);
}

const PROVIDER_SEARCH_AUTO_DELAY_MS = 650;
const PROVIDER_SEARCH_AUTO_MIN_LENGTH = 3;
let providerSearchAutoTimer = null;
let providerSearchRequestSeq = 0;

function providerSearchMatchesQuery(provider, query) {
  return provider?.query && providerSearchCacheKey(provider.query) === providerSearchCacheKey(query);
}

function providerSearchSettledForQuery(query) {
  const provider = state.providerSearch || {};
  return providerSearchMatchesQuery(provider, query)
    && ["loading", "live", "cached", "fallback", "offline"].includes(provider.status);
}

function scheduleProviderSearch() {
  window.clearTimeout(providerSearchAutoTimer);
  const query = (state.gameSearchQuery || "").trim();
  if (query.length < PROVIDER_SEARCH_AUTO_MIN_LENGTH || providerSearchSettledForQuery(query)) return;
  providerSearchAutoTimer = window.setTimeout(() => {
    runProviderSearch({ force: false });
  }, PROVIDER_SEARCH_AUTO_DELAY_MS);
}

async function runProviderSearch({ force = false } = {}) {
  window.clearTimeout(providerSearchAutoTimer);
  const query = (els.gameSearchInput.value || state.gameSearchQuery || "").trim();
  state.gameSearchQuery = query;
  const requestSeq = ++providerSearchRequestSeq;
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

  const cached = force ? null : providerSearchCacheRecord(query);
  if (cached) {
    state.providerSearch = cached;
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
    if (requestSeq !== providerSearchRequestSeq || providerSearchCacheKey(state.gameSearchQuery) !== providerSearchCacheKey(query)) return;
    const nextProviderSearch = {
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
    state.providerSearch = nextProviderSearch;
    rememberProviderSearch(query, nextProviderSearch);
  } catch (error) {
    if (requestSeq !== providerSearchRequestSeq || providerSearchCacheKey(state.gameSearchQuery) !== providerSearchCacheKey(query)) return;
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



// Per-render caches: feedbackSource is called for every feedbackLog event on
// every taste-profile computation, and each call rebuilt the full sourceGames()
// array (~13ms) plus a linear titleMatches scan. With a populated feedback log
// (any real user) that alone cost ~500ms per render. Cleared in render().
let _sourceGamesCache = null;
const _feedbackSourceCache = new Map();
function invalidateSourceLookups() {
  _sourceGamesCache = null;
  _feedbackSourceCache.clear();
}
function feedbackSource(title) {
  if (_feedbackSourceCache.has(title)) return _feedbackSourceCache.get(title);
  if (!_sourceGamesCache) _sourceGamesCache = sourceGames();
  const result = _sourceGamesCache.find((game) => titleMatches(game.title, title))
    || monthlyDrop.find((item) => titleMatches(item.title, title))
    || tasteRadar.find((item) => titleMatches(item.title, title));
  _feedbackSourceCache.set(title, result);
  return result;
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

function derivedRatingFromRank(rank, total) {
  if (total <= 1) return 10;
  const bottomPositiveRating = 5.8;
  return Math.round((10 - ((rank - 1) / (total - 1)) * (10 - bottomPositiveRating)) * 10) / 10;
}

function ratingStrength(parsedRating) {
  const polarity = parsedRating >= 7 ? 1 : parsedRating <= 5 ? -1 : 0;
  const strength = polarity > 0 ? parsedRating - 6 : polarity < 0 ? 6 - parsedRating : 0;
  return { polarity, strength };
}

function applyRatingWeight(weights, game, parsedRating) {
  const { polarity, strength } = ratingStrength(parsedRating);
  if (strength === 0) return;
  gameSignals(game).forEach((signal) => {
    weights[signal] = (weights[signal] || 0) + polarity * strength;
  });
}

function rememberImportedRating(game, parsedRating) {
  if (!game || !Number.isFinite(Number(parsedRating))) return null;
  const key = titleKey(game.title);
  const current = normalizeUserGameRecord(state.userGames[key], game.title)
    || normalizeUserGameRecord({ title: game.title });
  current.title = game.title;
  current.rating = Math.max(0, Math.min(100, Math.round(Number(parsedRating) * 10)));
  current.source = current.source && current.source !== "manual" ? current.source : "rating_import";
  current.updatedAt = new Date().toISOString();
  state.userGames[key] = current;
  state.userStates[key] = { title: current.title, state: legacyStateFromUserGame(current), updatedAt: current.updatedAt };
  delete state.calibrationSkips?.[key];
  delete state.ratingQueue?.[key];
  return current;
}

function canMarkDeepTasteImport() {
  return !["demo", "psn", "quick"].includes(state.entryPath);
}

function knownImportRecord(rawTitle) {
  const cleanedTitle = cleanImportedTitle(rawTitle);
  const alias = aliasEntryForTitle(cleanedTitle);
  const title = alias?.title || cleanedTitle;
  return findRatedGame(title)
    || (catalogBackbone?.records || []).find((record) => titleMatches(record.title, title))
    || (globalSearchFixtures?.records || []).find((record) => titleMatches(record.title, title));
}

function analyzeRankedTasteImport(rankedEntries) {
  const weights = {};
  const matched = [];
  const total = rankedEntries.length;
  const ranked = rankedEntries.map((entry, index) => ({
    title: entry.title,
    rank: entry.rank || index + 1,
  }));

  ranked.forEach((entry) => {
    const game = findRatedGame(entry.title);
    if (!game) return;
    const rating = derivedRatingFromRank(entry.rank, total);
    applyRatingWeight(weights, game, rating);
    rememberImportedRating(game, rating);
    matched.push({ title: game.title, rating });
  });

  state.atomWeights = weights;
  state.importedRatings = matched;
  state.notebook = {
    ...state.notebook,
    ranked,
  };
  if (canMarkDeepTasteImport()) {
    state.entryPath = "deep";
    state.entryResult = t("settings.tasteImport.rankedResult", {
      matched: matched.length,
      total,
    });
  }
  return { matched, total };
}

function analyzeTasteImport() {
  const weights = {};
  const matched = [];
  const text = state.ratingImport || "";
  const rankedEntries = parseRankedTasteLines(text);
  const lines = text
    .split(/\n|\\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rankedEntries.length >= 8 && rankedEntries.length >= lines.length * 0.6) {
    analyzeRankedTasteImport(rankedEntries);
    return;
  }

  lines.forEach((line) => {
      const parsed = parseRatingLine(line);
      if (!parsed) return;
      const game = findRatedGame(parsed.title);
      if (!game) return;
      applyRatingWeight(weights, game, parsed.rating);
      rememberImportedRating(game, parsed.rating);
      matched.push({ title: game.title, rating: parsed.rating });
    });
  state.atomWeights = weights;
  state.importedRatings = matched;
  if (matched.length && canMarkDeepTasteImport()) {
    state.entryPath = matched.length >= 8 ? "deep" : state.entryPath;
    state.entryResult = t("settings.tasteImport.ratingResult", { count: matched.length });
  }
}

function tasteImportPreview() {
  const text = state.ratingImport || "";
  const lines = text
    .split(/\n|\\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const rankedEntries = parseRankedTasteLines(text);
  const isRanked = rankedEntries.length >= 8 && rankedEntries.length >= lines.length * 0.6;
  const explicitRatings = isRanked
    ? []
    : lines.map(parseRatingLine).filter(Boolean);
  const entries = isRanked
    ? rankedEntries
    : explicitRatings.map((entry, index) => ({ ...entry, rank: index + 1 }));
  const matched = entries
    .map((entry) => ({ entry, game: findRatedGame(entry.title) }))
    .filter((item) => item.game);
  const known = entries.filter((entry) => knownImportRecord(entry.title));
  const unmatched = entries
    .filter((entry) => !knownImportRecord(entry.title))
    .slice(0, 5)
    .map((entry) => entry.title);
  const weights = {};
  matched.forEach(({ entry, game }) => {
    const rating = isRanked ? derivedRatingFromRank(entry.rank, entries.length) : entry.rating;
    applyRatingWeight(weights, game, rating);
  });
  const topSignals = Object.entries(weights)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([signal]) => signal);
  const topMatched = matched.slice(0, 3).map(({ game }) => game.title);
  const rankedShape = isRanked && matched.length
    ? [
        {
          label: t("settings.tasteImport.previewRankTop"),
          titles: matched.slice(0, 3).map(({ game }) => game.title),
        },
        {
          label: t("settings.tasteImport.previewRankMid"),
          titles: matched.slice(Math.max(0, Math.floor(matched.length / 2) - 1), Math.floor(matched.length / 2) + 2).map(({ game }) => game.title),
        },
        {
          label: t("settings.tasteImport.previewRankTail"),
          titles: matched.slice(-3).map(({ game }) => game.title),
        },
      ].filter((item) => item.titles.length)
    : [];
  const matchRatio = entries.length ? matched.length / entries.length : 0;
  return {
    empty: !lines.length,
    mode: isRanked ? "ranked" : explicitRatings.length ? "ratings" : "unknown",
    total: entries.length,
    matched: matched.length,
    known: known.length,
    matchRatio,
    ready: matched.length >= 3,
    strong: isRanked ? matched.length >= 20 && matchRatio >= 0.5 : matched.length >= 8,
    topSignals,
    topMatched,
    rankedShape,
    unmatched,
  };
}

function renderTasteImportPreview() {
  if (!els.tasteImportPreview) return;
  const preview = tasteImportPreview();
  if (preview.empty) {
    els.tasteImportPreview.innerHTML = `
      <div class="taste-import-preview-empty">
        <strong>${t("settings.tasteImport.previewEmptyTitle")}</strong>
        <span>${t("settings.tasteImport.previewEmptyDetail")}</span>
      </div>
    `;
    return;
  }

  const modeLabel = preview.mode === "ranked"
    ? t("settings.tasteImport.previewModeRanked")
    : preview.mode === "ratings"
      ? t("settings.tasteImport.previewModeRatings")
      : t("settings.tasteImport.previewModeUnknown");
  const confidence = preview.strong
    ? t("settings.tasteImport.previewStrong")
    : preview.ready
      ? t("settings.tasteImport.previewReady")
      : t("settings.tasteImport.previewNeedsMore");
  const signals = preview.topSignals.length
    ? labelAtoms(preview.topSignals, " / ")
    : t("settings.tasteImport.previewNoSignals");
  const examples = preview.topMatched.length
    ? preview.topMatched.join(" / ")
    : t("settings.tasteImport.previewNoMatches");

  els.tasteImportPreview.innerHTML = `
    <div class="taste-import-preview-head">
      <span>${modeLabel}</span>
      <strong>${t("settings.tasteImport.previewMatched", { matched: preview.matched, total: preview.total })}</strong>
      <small>${t("settings.tasteImport.previewKnown", { known: preview.known, total: preview.total })} · ${confidence}</small>
    </div>
    <div class="taste-import-preview-grid">
      <div>
        <span>${t("settings.tasteImport.previewSignals")}</span>
        <strong>${signals}</strong>
      </div>
      <div>
        <span>${t("settings.tasteImport.previewExamples")}</span>
        <strong>${examples}</strong>
      </div>
      <div>
        <span>${t("settings.tasteImport.previewImpact")}</span>
        <strong>${preview.mode === "ranked" ? t("settings.tasteImport.previewRankedImpact") : t("settings.tasteImport.previewRatingsImpact")}</strong>
      </div>
    </div>
    ${preview.rankedShape?.length ? `
      <div class="taste-import-rank-shape" aria-label="${t("settings.tasteImport.previewRankShape")}">
        ${preview.rankedShape.map((item) => `
          <div>
            <span>${item.label}</span>
            <strong>${item.titles.join(" / ")}</strong>
          </div>
        `).join("")}
      </div>
    ` : ""}
    ${preview.unmatched?.length ? `
      <div class="taste-import-misses">
        <span>${t("settings.tasteImport.previewMisses")}</span>
        <strong>${preview.unmatched.join(" / ")}</strong>
        <small>${t("settings.tasteImport.previewMissesDetail")}</small>
      </div>
    ` : ""}
  `;
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

function applyDemoProfile() {
  state = defaultState();
  state.entryPath = "demo";
  state.entryResult = "Demo profile: taste, library, wishlist, ratings, and price alerts are filled";
  state.activeView = "today";
  state.activeRegion = "US";
  state.activeCluster = "play";
  state.visualCatalogShelf = "smart";
  state.mood = "story";
  state.session = "short";
  state.sessionMinutes = 45;
  state.difficulty = "normal";
  state.psPlus = true;
  state.budget = 45;
  state.gameSearchQuery = "Mafia: The Old Country";
  state.liked = new Set(DEMO_PROFILE_REACTIONS.filter((item) => item.reaction === "loved").map((item) => item.title));
  state.quickReactions = makeQuickReactionMap(DEMO_PROFILE_REACTIONS);
  state.ratingImport = DEMO_PROFILE_RATINGS
    .map((item) => `${item.title} - ${Math.max(1, Math.min(10, Math.round(item.rating / 10)))}/10`)
    .join("\n");
  analyzeTasteImport();

  DEMO_PROFILE_STATES.forEach((item) => setGameState(item.title, item.state));
  DEMO_PROFILE_RATINGS.forEach((item) => setGameRating(item.title, item.rating));
  DEMO_PROFILE_PRICE_TARGETS.forEach((item) => setPriceWatchTarget(item.title, item.target, item.region));
  recordFeedback("entry_demo_profile", "Demo profile");
  render();
}

function renderQuickSwipeDeck() {
  const answered = quickReactionCount();
  const signalCount = quickTasteSignalCount();
  const nextGame = nextDiagnosticGame();
  if (!nextGame) {
    els.quickSwipeDeck.innerHTML = `
      <div class="quick-swipe-card is-complete">
        <span>${t("settings.quickSwipe.complete")}</span>
        <strong>${t("settings.quickSwipe.answered", { answered, total: profileGames.length })}</strong>
        <p>${t("settings.quickSwipe.completeDetail")}</p>
        ${state.lastUndo?.action === "quick_taste" ? renderUndoStrip("quick-swipe-undo") : ""}
      </div>
    `;
    bindUndoButtons(els.quickSwipeDeck);
    return;
  }

  const answeredProgress = Math.round((answered / profileGames.length) * 100);
  const signalProgress = Math.min(100, Math.round((signalCount / QUICK_TASTE_FIRST_TARGET) * 100));
  const sharpProgress = Math.min(100, Math.round((signalCount / QUICK_TASTE_SHARP_TARGET) * 100));
  const firstAnswerCopy = signalCount >= QUICK_TASTE_FIRST_TARGET
    ? t("settings.quickSwipe.ready")
    : t("settings.quickSwipe.toGo", { count: Math.max(0, QUICK_TASTE_FIRST_TARGET - signalCount) });
  const sharpCopy = signalCount >= QUICK_TASTE_SHARP_TARGET
    ? t("settings.quickSwipe.sharp")
    : t("settings.quickSwipe.toSharp", { count: Math.max(0, QUICK_TASTE_SHARP_TARGET - signalCount) });
  const missingAtoms = uncoveredDiagnosticAtoms();
  const conflict = quickTasteConflictReport();
  const gate = tasteGateState();
  const followUpHint = quickSwipeFollowUpHint(nextGame, missingAtoms, conflict);
  const proofTitle = gate.ready
    ? t("settings.quickSwipe.proofReady", { label: gate.maturityLabel })
    : t("settings.quickSwipe.proofLocked", { count: QUICK_TASTE_FIRST_TARGET });
  const proofDetail = gate.ready
    ? gate.maturity
    : t("settings.quickSwipe.proofDetail");
  const firstRemaining = Math.max(0, QUICK_TASTE_FIRST_TARGET - signalCount);
  const usableRemaining = Math.max(0, QUICK_TASTE_USABLE_TARGET - signalCount);
  const sharpRemaining = Math.max(0, QUICK_TASTE_SHARP_TARGET - signalCount);
  const contractLabel = gate.ready
    ? t("settings.quickSwipe.firstPickUnlocked")
    : t("settings.quickSwipe.clicksToPick", { count: firstRemaining });
  const nextMilestoneCopy = signalCount >= QUICK_TASTE_SHARP_TARGET
    ? t("settings.quickSwipe.optionalCalibration")
    : signalCount >= QUICK_TASTE_USABLE_TARGET
      ? t("settings.quickSwipe.signalsToSharper", { count: sharpRemaining })
      : t("settings.quickSwipe.signalsToSafer", { count: usableRemaining });
  const contractDetail = gate.ready
    ? nextMilestoneCopy
    : t("settings.quickSwipe.contractDetail");

  els.quickSwipeDeck.innerHTML = `
    <div class="quick-swipe-card">
      <div class="quick-swipe-top">
        <span class="quick-swipe-focus">${quickSwipeFocusLabel(nextGame, missingAtoms, conflict)}</span>
        <span class="quick-swipe-progress">${answered}/${profileGames.length}</span>
      </div>
      <div class="quick-swipe-main">
        <span class="quick-swipe-axis">${labelAtoms((nextGame.atoms || []).slice(0, 2), " + ") || t("settings.quickSwipe.tasteSignal")}</span>
        <strong>${nextGame.title}</strong>
        <div class="quick-swipe-atom-row">${quickSwipeAtomChips(nextGame, missingAtoms, conflict)}</div>
      </div>
      <div class="quick-swipe-proof">
        <span>${proofTitle}</span>
        <p>${proofDetail}</p>
        <small>${followUpHint}</small>
      </div>
      <div class="quick-swipe-contract" data-quick-swipe-contract>
        <span>${contractLabel}</span>
        <p>${contractDetail}</p>
        <div>
          <strong>${signalCount}/${QUICK_TASTE_FIRST_TARGET}</strong>
          <strong>${signalCount}/${QUICK_TASTE_USABLE_TARGET}</strong>
          <strong>${signalCount}/${QUICK_TASTE_SHARP_TARGET}</strong>
        </div>
      </div>
      <div class="quick-swipe-meters">
        <div>
          <span>${t("settings.quickSwipe.profile")}</span>
          <strong>${answered}/${profileGames.length}</strong>
          <span class="quick-swipe-track" aria-hidden="true"><span style="width:${answeredProgress}%"></span></span>
        </div>
        <div>
          <span>${t("settings.quickSwipe.firstHypothesis")}</span>
          <strong>${firstAnswerCopy}</strong>
          <span class="quick-swipe-track" aria-hidden="true"><span style="width:${signalProgress}%"></span></span>
        </div>
        <div>
          <span>${t("settings.quickSwipe.sharperProfile")}</span>
          <strong>${sharpCopy}</strong>
          <span class="quick-swipe-track" aria-hidden="true"><span style="width:${sharpProgress}%"></span></span>
        </div>
      </div>
      <div class="quick-swipe-actions" role="group" aria-label="${t("settings.reactions.swipeAria", { title: nextGame.title })}">
        <button data-swipe-reaction="not_for_me" type="button">${t("settings.reactions.notForMe")}</button>
        <button data-swipe-reaction="unplayed" type="button">${t("settings.reactions.notPlayed")}</button>
        <button data-swipe-reaction="loved" type="button">${t("settings.reactions.liked")}</button>
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
      <strong>${gate.ready ? t("settings.onboarding.started") : t("settings.onboarding.inProgress")}</strong>
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
            <small>${item.state === "done" ? item.detail : t("settings.onboarding.more", { count: item.remaining })}</small>
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
    ? t("settings.entry.resultQuick", {
        answered: reactionCount,
        total: profileGames.length,
        signals: signalCount,
        liked: reactionSummary.loved,
        disliked: reactionSummary.notForMe,
        unplayed: reactionSummary.unplayed,
      })
    : t("settings.entry.resultQuickPrompt", {
        target: QUICK_TASTE_FIRST_TARGET,
        total: profileGames.length,
      });
  els.entryRouteProof.innerHTML = `
    <span>${routeProof.label}</span>
    <strong>${routeProof.value}</strong>
  `;
  els.entryResult.textContent = state.entryPath === "quick"
    ? quickResult
    : state.entryPath === "psn"
      ? t("settings.entry.resultPsn")
      : state.entryPath === "deep"
        ? t("settings.entry.resultDeep")
        : state.entryPath === "demo"
          ? t("settings.entry.resultDemo")
          : t("settings.entry.resultPick");
  els.entryCards.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.entryPath === state.entryPath);
  });
}


// feedbackLog is a capped RECENCY log (last 20 actions), powering only the
// transient feedback-weight boost in combinedTasteWeight. It is NOT the taste
// source of record: the persistent profile lives in atomWeights, and the full
// rating set drives the forecast/calibration model via personalRatingRecords()
// (which reads ALL of state.userGames). So a 120-rating user keeps every signal
// — verified: calibration sample shows 123/123. Do NOT raise this cap to
// "recover signal" (there's none to recover) — it would re-introduce the
// O(feedbackLog × catalog) render blow-up the cap exists to prevent.
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
  const scoreLabels = {
    "Taste engine pull": t("data.scorePull"),
    "Taste engine caution": t("data.scoreCaution"),
    "Taste uncertainty": t("data.scoreUncertainty"),
    "Notebook rank": t("data.scoreNotebook"),
    "Wishlist intent": t("data.scoreWishlist"),
    "Access now": t("data.scoreAccess"),
    "Mood fit": t("data.scoreMood"),
    "Session fit": t("data.scoreSession"),
    "Tonight time fit": t("data.scoreTonight"),
    "Difficulty fit": t("data.scoreDifficulty"),
    "Adult time fit": t("data.scoreAdult"),
    "Low review burden": t("data.scoreReview"),
    "Commitment fit": t("data.scoreCommitment"),
    "PS Plus context": t("data.scorePlus"),
    "Budget fit": t("data.scoreBudget"),
    "Discount signal": t("data.scoreDiscount"),
    "Backlog memory": t("data.scoreBacklog"),
    "Saved feedback": t("data.scoreSaved"),
    "External discovery": t("data.scoreExternal"),
  };
  els.debugSummary.textContent = t("data.debugSummary", {
    fit: Math.max(game.score, 0),
    region: state.activeRegion,
  });
  els.debugList.replaceChildren(
    ...breakdown.map((item) => {
      const row = document.createElement("div");
      const width = `${Math.round((Math.abs(item.value) / max) * 100)}%`;
      row.className = "debug-row";
      row.innerHTML = `
        <span>${scoreLabels[item.label] || item.label}</span>
        <span class="debug-bar"><span class="debug-fill ${item.value < 0 ? "negative" : ""}" style="width:${width}"></span></span>
        <strong>${item.value}</strong>
      `;
      return row;
    }),
  );
}

// ── Taste profile archetypes ─────────────────────────────────────────────────
const TASTE_ARCHETYPES = [
  { labelKey: "settings.tasteProfileDynamic.archetypeStory", atoms: ["story", "adventure", "narrative", "walking-sim"] },
  { labelKey: "settings.tasteProfileDynamic.archetypeAction", atoms: ["action", "combat", "shooter", "hack-and-slash"] },
  { labelKey: "settings.tasteProfileDynamic.archetypeWorld", atoms: ["open-world", "rpg", "exploration", "sandbox"] },
  { labelKey: "settings.tasteProfileDynamic.archetypeThrill", atoms: ["horror", "survival", "stealth", "tension"] },
  { labelKey: "settings.tasteProfileDynamic.archetypePuzzle", atoms: ["puzzle", "indie", "logic", "mystery"] },
  { labelKey: "settings.tasteProfileDynamic.archetypeSystem", atoms: ["roguelike", "strategy", "tactics", "deck-builder"] },
  { labelKey: "settings.tasteProfileDynamic.archetypeSouls", atoms: ["souls-like", "hard", "precision", "boss-rush"] },
  { labelKey: "settings.tasteProfileDynamic.archetypePlatformer", atoms: ["platformer", "metroidvania", "precision", "collectathon"] },
  { labelKey: "settings.tasteProfileDynamic.archetypeSport", atoms: ["racing", "sports", "simulation", "driving"] },
];

function buildTasteProfileText() {
  // Gather signals: quickReactions + importedRatings
  const reactions = Object.values(state.quickReactions || {});
  const loved = reactions.filter((r) => r.reaction === "loved").map((r) => r.title);
  const avoided = reactions.filter((r) => r.reaction === "not_for_me").map((r) => r.title);
  const importedLoved = (state.importedRatings || [])
    .filter((item) => item.rating >= 8.5)
    .map((item) => item.title);
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
    label: t(a.labelKey),
    score: a.atoms.filter((atom) => allPositive.includes(atom)).length
      - a.atoms.filter((atom) => negativeAtoms.includes(atom)).length,
  })).filter((a) => a.score > 0).sort((a, b) => b.score - a.score);
  const archetype = archetypeScores[0]?.label || null;

  // Sample liked game titles (up to 3, from loved quickReactions)
  const lovedSample = [...new Set([...loved, ...importedLoved])].slice(0, 3);

  return {
    totalSignals,
    strength,
    allPositive,
    negativeAtoms,
    archetype,
    lovedSample,
    loved,
    avoided,
    rankedCount: state.notebook?.ranked?.length || 0,
  };
}

function renderTasteProfile() {
  const sorted = Object.entries(state.atomWeights)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 8);
  els.tasteSummary.textContent = state.importedRatings.length
    ? t("settings.tasteImport.analyzed", { count: state.importedRatings.length })
    : t("settings.tasteImport.summary");
  els.tasteAtoms.replaceChildren(
    ...sorted.map(([signal, weight]) => {
      const item = document.createElement("span");
      item.className = `atom-pill ${weight < 0 ? "negative" : ""}`;
      item.textContent = `${labelAtom(signal)} ${weight > 0 ? "+" : ""}${Math.round(weight)}`;
      return item;
    }),
  );
  renderTasteImportPreview();

  // Rich profile summary
  if (!els.tasteProfileSummary) return;
  const { totalSignals, strength, allPositive, negativeAtoms, archetype, lovedSample, rankedCount } = buildTasteProfileText();

  if (els.tasteProfileBadge) {
    els.tasteProfileBadge.textContent = totalSignals === 0
      ? t("settings.tasteProfileDynamic.noSignals")
      : strength === "weak"
        ? t("settings.tasteProfileDynamic.building", { count: totalSignals })
        : t("settings.tasteProfileDynamic.strength", {
            count: totalSignals,
            strength: strength === "strong"
              ? t("settings.tasteProfileDynamic.strong")
              : t("settings.tasteProfileDynamic.moderate"),
          });
  }

  if (totalSignals === 0) {
    els.tasteProfileSummary.innerHTML = `<p class="taste-profile-empty">${t("settings.tasteProfileDynamic.empty")}</p>`;
    return;
  }

  // Build sentences
  const parts = [];

  if (archetype) {
    parts.push(`<strong class="taste-archetype">${archetype}</strong>`);
  }

  if (allPositive.length) {
    const listed = labelAtoms(allPositive.slice(0, 4), ", ");
    const positiveCopy = t("settings.tasteProfileDynamic.gravitates", { atoms: listed });
    const negativeCopy = negativeAtoms.length
      ? ` ${t("settings.tasteProfileDynamic.skips", { atoms: labelAtoms(negativeAtoms.slice(0, 2), ", ") })}`
      : "";
    parts.push(`<p class="taste-line">${positiveCopy}${negativeCopy}</p>`);
  }

  if (lovedSample.length) {
    parts.push(`<p class="taste-line taste-liked-games">${t("settings.tasteProfileDynamic.liked")} ${lovedSample.map((title) => `<span>${title}</span>`).join("")}</p>`);
  }

  if (state.importedRatings?.length) {
    parts.push(`<p class="taste-line">${t("settings.tasteProfileDynamic.enriched", { count: state.importedRatings.length })}</p>`);
  }

  if (rankedCount >= 8) {
    parts.push(`<p class="taste-line">${t("settings.tasteProfileDynamic.rankedBaseline", { count: rankedCount })}</p>`);
  }

  els.tasteProfileSummary.innerHTML = parts.join("\n");
}

function renderSessionStats() {
  const summary = sessionSummary();
  const fmt = (min) => min >= 60
    ? t("settings.sessionStats.hoursMinutes", { hours: Math.floor(min / 60), minutes: min % 60 })
    : t("settings.sessionStats.minutes", { minutes: min });
  els.sessionCurrent.textContent = summary.currentMin > 0 ? fmt(summary.currentMin) : "—";
  els.sessionTotal.textContent = summary.totalMin > 0 ? fmt(summary.totalMin) : "—";
  els.sessionCount.textContent = summary.sessionCount || "—";
  els.sessionAvg.textContent = summary.avgMin > 0 ? fmt(summary.avgMin) : "—";
  els.sessionStatus.textContent = summary.currentMin > 0
    ? t("settings.sessionStats.active")
    : t("settings.sessionStats.idle");
}

function renderNotebookProfile() {
  const notebook = state.notebook;
  const counts = [
    [t("settings.advanced.pillWish"), notebook.wishlist.length],
    [t("settings.advanced.pillAccess"), notebook.access.length],
    [t("settings.advanced.pillPrices"), notebook.prices.length],
    [t("settings.advanced.pillDone"), notebook.completed.length],
    [t("settings.advanced.pillRanked"), notebook.ranked.length],
    [t("settings.advanced.pillUpcoming"), notebook.upcoming.length],
  ];
  const total = counts.reduce((sum, [, value]) => sum + value, 0);
  els.notebookSummary.textContent = total
    ? t("settings.advanced.parsed", { count: total })
    : t("settings.advanced.noneParsed");
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
  const calibration = tasteCalibrationProfile();
  const calibrationModelLabels = {
    baseline: t("stats.calibrationModelBaseline"),
    neighbor: t("stats.calibrationModelNeighbor"),
    signal: t("stats.calibrationModelSignal"),
    ensemble: t("stats.calibrationModelEnsemble"),
  };

  // Library by status
  const byStatus = {
    playing:   userGames.filter((g) => g.access === "playing").length,
    completed: userGames.filter((g) => g.completionStatus === "completed").length,
    dropped:   userGames.filter((g) => g.completionStatus === "dropped").length,
    owned:     userGames.filter((g) => ["owned_forever", "owned_disc"].includes(g.access)).length,
    saved:     userGames.filter((g) => g.saved).length,
    psPlus:    userGames.filter((g) => g.access === "psplus").length,
  };
  const amnestiedGames = userGames.filter(isAmnestiedUserGame);
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
    els.statsBadge.textContent = t("stats.tracked", { count: totalTracked });
  }

  // Render stat tiles
  const tiles = [
    { label: t("stats.trackedGames"), value: totalTracked, sub: t("stats.reactions", { liked: loved, skipped: avoided }) },
    { label: t("stats.playing"), value: byStatus.playing, sub: t("stats.activeSessions") },
    { label: t("stats.completed"), value: byStatus.completed, sub: t("stats.hltbDone", { hours: Math.round(hltbDone) }) },
    { label: t("stats.wishlist"), value: byStatus.saved, sub: t("stats.buyLater") },
    { label: t("stats.owned"), value: byStatus.owned + byStatus.psPlus, sub: t("stats.viaPlus", { count: byStatus.psPlus }) },
    { label: t("stats.backlog"), value: t("stats.hoursValue", { hours: Math.round(hltbTotal) }), sub: t("stats.backlogGames", { count: hltbGames.length }) },
    { label: t("stats.amnestied"), value: amnestiedGames.length, sub: t("stats.amnestiedSub") },
    { label: t("stats.prices", { region }), value: withPrice, sub: t("stats.catalogGames", { count: pool.length }) },
    { label: t("stats.covers"), value: withCover, sub: t("stats.inCatalog", { count: pool.length }) },
    { label: t("stats.plus", { region }), value: inPsPlus, sub: t("stats.titlesIncluded") },
    {
      label: t("stats.calibration"),
      value: calibration.ready
        ? t("stats.calibrationError", { error: calibration.meanAbsoluteError })
        : t("stats.calibrationProgress", { count: calibration.count, target: 5 }),
      sub: calibration.trusted
        ? t("stats.calibrationRatings", { count: calibration.count })
        : calibration.ready
          ? t("stats.calibrationUnstable")
          : t("stats.calibrationNeed", { count: Math.max(0, 5 - calibration.count) }),
    },
  ];

  els.statsGrid.replaceChildren(...tiles.map(({ label, value, sub }) => {
    const tile = document.createElement("div");
    tile.className = "stats-tile";
    tile.innerHTML = `<strong>${value}</strong><span>${label}</span><small>${sub}</small>`;
    return tile;
  }));

  if (els.statsCalibration) {
    const heading = document.createElement("h3");
    heading.className = "stats-section-heading";
    heading.textContent = t("stats.calibrationTitle");
    const summary = document.createElement("p");
    summary.className = "stats-calibration-summary";
    summary.textContent = calibration.trusted
      ? t("stats.calibrationReady", {
          count: calibration.count,
          error: calibration.meanAbsoluteError,
        })
      : calibration.ready
        ? t("stats.calibrationUnstableDetail", {
            count: calibration.count,
            error: calibration.meanAbsoluteError,
          })
        : t("stats.calibrationBuilding", {
            count: calibration.count,
            target: 5,
          });
    if (calibration.ready) {
      summary.textContent += ` ${t("stats.calibrationModel", {
        model: calibrationModelLabels[calibration.model] || calibration.model,
      })}`;
    }
    const biases = [];
    calibration.underestimated.forEach(([signal, value]) => {
      const item = document.createElement("span");
      item.className = "calibration-signal is-under";
      item.textContent = t("stats.calibrationUnder", {
        signal: labelAtom(signal),
        value: Math.round(Math.abs(value)),
      });
      biases.push(item);
    });
    calibration.overestimated.forEach(([signal, value]) => {
      const item = document.createElement("span");
      item.className = "calibration-signal is-over";
      item.textContent = t("stats.calibrationOver", {
        signal: labelAtom(signal),
        value: Math.round(Math.abs(value)),
      });
      biases.push(item);
    });
    const signals = document.createElement("div");
    signals.className = "stats-calibration-signals";
    if (biases.length) signals.append(...biases);
    else {
      const balanced = document.createElement("span");
      balanced.className = "calibration-signal";
      balanced.textContent = calibration.ready
        ? t("stats.calibrationBalanced")
        : t("stats.calibrationMore");
      signals.append(balanced);
    }
    const questions = calibrationQuestionGames(3);
    const questionPanel = document.createElement("div");
    questionPanel.className = "calibration-questions";
    if (questions.length) {
      const questionHeading = document.createElement("strong");
      questionHeading.className = "calibration-questions-heading";
      questionHeading.textContent = t("stats.calibrationQuestionsTitle");
      const questionNote = document.createElement("p");
      questionNote.textContent = t("stats.calibrationQuestionsDetail");
      questionPanel.append(questionHeading, questionNote);
      questions.forEach(({ game, reason, signals: questionSignals, disagreement }) => {
        const row = document.createElement("div");
        row.className = "calibration-question";
        const reasonKey = {
          disagreement: "stats.calibrationQuestionDisagreement",
          bias: "stats.calibrationQuestionBias",
          coverage: "stats.calibrationQuestionCoverage",
        }[reason];
        row.innerHTML = `
          <div>
            <strong>${game.title}</strong>
            <span>${t(reasonKey, {
              signals: labelAtoms(questionSignals, " + ") || t("stats.calibrationQuestionNewSignals"),
              points: disagreement,
            })}</span>
          </div>
          <div class="calibration-answer" aria-label="${t("stats.calibrationRateAria", { title: game.title })}">
            <div class="calibration-rating">
              ${[1, 2, 3, 4, 5].map((rating) => `
                <button data-calibration-rating="${rating}" data-calibration-title="${detailAttr(game.title)}" type="button" aria-label="${t("stats.calibrationRateValue", { title: game.title, rating })}">${rating}</button>
              `).join("")}
            </div>
            <button class="calibration-skip" data-calibration-skip="${detailAttr(game.title)}" type="button">${t("stats.calibrationNotPlayed")}</button>
          </div>
        `;
        questionPanel.append(row);
      });
    }
    els.statsCalibration.replaceChildren(heading, summary, signals, questionPanel);
    els.statsCalibration.querySelectorAll("[data-calibration-rating]").forEach((button) => {
      button.addEventListener("click", () => {
        setGameRating(button.dataset.calibrationTitle, Number(button.dataset.calibrationRating) * 20);
        render();
      });
    });
    els.statsCalibration.querySelectorAll("[data-calibration-skip]").forEach((button) => {
      button.addEventListener("click", () => {
        skipCalibrationGame(button.dataset.calibrationSkip);
        render();
      });
    });
  }

  // Render top atoms
  if (topAtoms.length) {
    const heading = document.createElement("h3");
    heading.className = "stats-section-heading";
    heading.textContent = t("stats.atoms");
    const pills = topAtoms.map(([atom, count]) => {
      const pill = document.createElement("span");
      pill.className = "atom-pill";
      pill.textContent = `${labelAtom(atom)} ×${count}`;
      return pill;
    });
    els.statsAtoms.replaceChildren(heading, ...pills);
  } else {
    els.statsAtoms.replaceChildren();
  }

  // Closed-loop games: dropped and amnestied.
  if ((byStatus.dropped > 0 || amnestiedGames.length > 0) && els.statsTimeline) {
    const nodes = [];
    if (byStatus.dropped > 0) {
      const heading = document.createElement("h3");
      heading.className = "stats-section-heading";
      heading.textContent = t("stats.dropped");
      nodes.push(heading);
      userGames
        .filter((g) => g.completionStatus === "dropped")
        .forEach((g) => {
          const tag = document.createElement("span");
          tag.className = "atom-pill negative";
          tag.textContent = g.title;
          tag.style.cursor = "pointer";
          tag.addEventListener("click", () => openGameDetail(g.title));
          nodes.push(tag);
        });
    }
    if (amnestiedGames.length) {
      const heading = document.createElement("h3");
      heading.className = "stats-section-heading";
      heading.textContent = t("stats.amnestiedBacklog");
      nodes.push(heading);
      amnestiedGames.forEach((g) => {
        const tag = document.createElement("span");
        tag.className = "atom-pill amnesty";
        const skips = normalizeBacklogAmnestyMeta(g.amnesty).skips;
        tag.textContent = `${g.title} (${t("stats.skips", { count: skips })})`;
        tag.style.cursor = "pointer";
        tag.addEventListener("click", () => openGameDetail(g.title));
        const restore = document.createElement("button");
        restore.className = "stats-mini-action amnesty-restore";
        restore.type = "button";
        restore.textContent = t("stats.restore");
        restore.addEventListener("click", () => {
          restoreBacklogAmnesty(g.title);
          render();
        });
        nodes.push(tag, restore);
      });
    }
    els.statsTimeline.replaceChildren(...nodes);
  } else {
    els.statsTimeline?.replaceChildren();
  }
}

// ── Onboarding ────────────────────────────────────────────────────────────────

const ONBOARDING_SIGNAL_TARGET = 3;

function renderOnboardingHero() {
  const hero = document.querySelector("#onboarding-hero");
  if (!hero) return;

  const answered = quickReactionCount();
  const signals = quickTasteSignalCount();
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
        toast.textContent = t("today.onboarding.ready");
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
    ? t("today.onboarding.progressEmpty", { count: ONBOARDING_SIGNAL_TARGET })
    : t("today.onboarding.progress", {
        current: signals,
        target: ONBOARDING_SIGNAL_TARGET,
        remaining: Math.max(0, ONBOARDING_SIGNAL_TARGET - signals),
      });

  hero.dataset.answered = String(answered);
  hero.querySelectorAll("[data-onboarding-shortcut]").forEach((button) => {
    button.onclick = () => {
      const action = button.dataset.onboardingShortcut;
      if (action === "ratings") {
        focusTasteImport();
        return;
      }
      focusKnownGames();
    };
  });

  // One diagnostic question at a time keeps the first run focused while using
  // the same taste engine as the full quick-swipe deck in Settings.
  const featured = document.querySelector("#onboarding-featured");
  if (!featured) return;
  const game = nextDiagnosticGame() || profileGames.find((item) => !quickReaction(item.title)) || profileGames[0];
  if (!game) return;
  const title = detailAttr(game.title);
  featured.innerHTML = `
    <article class="onboarding-game-tile onboarding-game-tile--hero" data-onboarding-title="${title}">
      <div class="onboarding-tile-poster"><span>${title}</span></div>
      <div class="onboarding-tile-body">
        <span>${labelAtoms((game.atoms || []).slice(0, 2), " · ") || t("settings.quickSwipe.tasteSignal")}</span>
        <strong>${title}</strong>
        <small>${quickSwipeFollowUpHint(game)}</small>
      </div>
      <div class="onboarding-tile-actions" role="group" aria-label="${t("settings.reactions.swipeAria", { title: game.title })}">
        <button class="onboarding-pass" data-onboard-react="not_for_me" data-onboard-title="${title}" type="button">${t("settings.reactions.notForMe")}</button>
        <button class="onboarding-skip" data-onboard-react="unplayed" data-onboard-title="${title}" type="button">${t("settings.reactions.notPlayed")}</button>
        <button class="onboarding-like" data-onboard-react="loved" data-onboard-title="${title}" type="button">${t("settings.reactions.liked")}</button>
      </div>
    </article>
  `;
  featured.querySelector(".onboarding-tile-poster")?.style.setProperty("--poster", coverBackground(game));
  featured.querySelectorAll("[data-onboard-react]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const title = btn.dataset.onboardTitle;
      const reaction = btn.dataset.onboardReact;
      const game = profileGames.find((item) => titleMatches(item.title, title)) || { title };
      setQuickReaction(game, reaction);
    });
  });
}

function renderValueStats(ranked) {
  const region = state.activeRegion;
  const radarLeads = rankedRadar().filter((item) => item.score >= 20).length;
  const timeFitCount = ranked.filter((game) => game.session === state.session || game.adultTimeFit === "weeknight").length;
  const guardedCount = ranked.filter((game) => game.prices[region] <= Number(state.budget) && blocksPurchase(game)).length;
  els.screenedCount.textContent = t("today.metrics.games", { count: ranked.length });
  els.bestDeal.textContent = t("today.metrics.leads", { count: radarLeads });
  els.timeFit.textContent = t("today.metrics.picks", { count: timeFitCount });
  els.libraryCount.textContent = t("today.metrics.states", { count: stateCount() });
  els.guardedCount.textContent = t("today.metrics.skips", { count: guardedCount });
}

function renderTasteUnderstoodPanel(ranked) {
  if (!els.tasteUnderstoodPanel || !els.tasteUnderstoodBody) return;
  const imported = state.importedRatings || [];
  const rankedCount = state.notebook?.ranked?.length || 0;
  if (!imported.length && rankedCount < 5) {
    els.tasteUnderstoodPanel.hidden = true;
    return;
  }

  els.tasteUnderstoodPanel.hidden = false;
  const profile = tasteEngineProfile();
  const records = personalRatingRecords();
  const positiveAtoms = Object.entries(profile.positiveWeights || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([atom]) => atom);
  const cautionAtoms = Object.entries(profile.negativeWeights || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([atom]) => atom);
  const anchors = [...new Set(imported.map((item) => item.title).filter(Boolean))].slice(0, 3);
  const primary = primaryDecisionGame(ranked);
  const statusCount = Math.max(imported.length, rankedCount);
  if (els.tasteUnderstoodStatus) {
    els.tasteUnderstoodStatus.textContent = t("today.tasteUnderstood.status", { count: statusCount });
  }

  const signalCopy = positiveAtoms.length
    ? labelAtoms(positiveAtoms, " / ")
    : t("today.tasteUnderstood.signalFallback");
  const cautionCopy = cautionAtoms.length
    ? labelAtoms(cautionAtoms, " / ")
    : t("today.tasteUnderstood.cautionFallback");
  const anchorCopy = anchors.length
    ? anchors.map((title) => `<span>${detailAttr(title)}</span>`).join("")
    : `<span>${t("today.tasteUnderstood.anchorFallback")}</span>`;
  const forecastCopy = primary
    ? detailAttr(primary.title)
    : t("today.tasteUnderstood.forecastFallback");

  els.tasteUnderstoodBody.innerHTML = `
    <p class="taste-understood-lead">${t("today.tasteUnderstood.lead", { count: statusCount })}</p>
    <div class="taste-understood-grid">
      <div class="taste-understood-card">
        <span>${t("today.tasteUnderstood.signalsLabel")}</span>
        <strong>${signalCopy}</strong>
      </div>
      <div class="taste-understood-card">
        <span>${t("today.tasteUnderstood.anchorsLabel")}</span>
        <strong class="taste-understood-anchors">${anchorCopy}</strong>
      </div>
      <div class="taste-understood-card">
        <span>${t("today.tasteUnderstood.forecastLabel")}</span>
        <strong>${forecastCopy}</strong>
      </div>
      <div class="taste-understood-card">
        <span>${t("today.tasteUnderstood.cautionLabel")}</span>
        <strong>${cautionCopy}</strong>
      </div>
    </div>
    <div class="taste-understood-actions">
      <button class="primary-action" data-taste-understood-action="answer" type="button">${t("today.tasteUnderstood.actionAnswer")}</button>
      <button class="secondary-action" data-taste-understood-action="import" type="button">${t("today.tasteUnderstood.actionImport")}</button>
      <span>${t("today.tasteUnderstood.recordCount", { count: records.length })}</span>
    </div>
  `;
  els.tasteUnderstoodBody.querySelector("[data-taste-understood-action='answer']")?.addEventListener("click", () => {
    openAppView("today");
    requestAnimationFrame(() => els.topPick?.scrollIntoView({ behavior: "smooth", block: "start" }));
  });
  els.tasteUnderstoodBody.querySelector("[data-taste-understood-action='import']")?.addEventListener("click", focusTasteImport);
}

function firstRunFlow(ranked) {
  const topGame = primaryDecisionGame(ranked);
  const reactions = quickReactionSummary();
  const signalCount = quickTasteSignalCount();
  const gate = tasteGateState();
  const confidence = topGame ? explain(topGame, topGame.score).confidence : t("narrative.firstRun.flowNeedTaste");
  const watchout = topGame ? watchOutCopy(topGame) : null;
  const access = topGame ? effectiveGameState(topGame) : "";
  const buyLater = buyLaterCandidate(ranked);
  const contextKey = (group, value) => {
    const keys = {
      mood: {
        story: "settings.context.moodStory",
        energy: "settings.context.moodEnergy",
        cozy: "settings.context.moodCozy",
        systems: "settings.context.moodSystems",
      },
      session: {
        short: "settings.context.sessionShort",
        medium: "settings.context.sessionMedium",
        long: "settings.context.sessionLong",
      },
      difficulty: {
        normal: "settings.context.difficultyNormal",
        low: "settings.context.difficultyLow",
        high: "settings.context.difficultyHigh",
      },
    };
    return keys[group]?.[value] ? t(keys[group][value]) : value;
  };
  const actionValue = topGame
    ? access ? t("narrative.firstRun.flowPlayNow")
      : buyLater && titleMatches(buyLater.title, topGame.title) ? t("narrative.firstRun.flowWatchPrice")
        : t("narrative.firstRun.flowTryTonight")
    : t("narrative.firstRun.flowAddTaste");
  const actionDetail = topGame
    ? access ? answerAccessLabel(topGame)
      : buyLater && titleMatches(buyLater.title, topGame.title) ? `${state.activeRegion} ${formatPrice(topGame, state.activeRegion)}`
        : contextKey("session", state.session)
    : t("narrative.firstRun.flowNoPick");
  const mode = isLibraryFirstMode(topGame)
    ? t("narrative.firstRun.flowModeLibrary")
    : gate.ready
      ? gate.maturityLabel
      : t("narrative.firstRun.flowModeLearning");

  return {
    status: t("narrative.firstRun.flowStatus", { mode, confidence }),
    steps: [
      {
        label: isLibraryFirstMode(topGame)
          ? t("narrative.firstRun.flowLibrary")
          : t("narrative.firstRun.flowTaste"),
        value: isLibraryFirstMode(topGame)
          ? t("narrative.firstRun.flowPlayable", { count: games.filter(isAlreadyAvailable).length })
          : t("narrative.firstRun.flowSignalProgress", {
              count: signalCount,
              target: QUICK_TASTE_FIRST_TARGET,
            }),
        detail: gate.conflict.hasConflict
          ? t("narrative.firstRun.flowMixed", { signals: labelAtoms(gate.conflict.atoms) })
          : t("narrative.firstRun.flowReactions", {
              loved: reactions.loved,
              played: reactions.played,
              disliked: reactions.notForMe,
            }),
        state: signalCount >= QUICK_TASTE_FIRST_TARGET ? "done" : "active",
      },
      {
        label: t("narrative.firstRun.flowTonight"),
        value: t("narrative.firstRun.flowTonightValue", {
          mood: contextKey("mood", state.mood),
          session: contextKey("session", state.session),
        }),
        detail: t("narrative.firstRun.flowFriction", {
          difficulty: contextKey("difficulty", state.difficulty),
        }),
        state: "done",
      },
      {
        label: t("narrative.firstRun.flowPick"),
        value: topGame ? topGame.title : t("narrative.firstRun.flowWaiting"),
        detail: topGame
          ? `${isLibraryFirstMode(topGame) ? answerAccessLabel(topGame) : confidence} / ${watchout.label}`
          : t("narrative.firstRun.flowNeedTaste"),
        state: topGame ? "done" : "active",
      },
      {
        label: t("narrative.firstRun.flowAction"),
        value: actionValue,
        detail: actionDetail,
        state: topGame ? "done" : "active",
      },
    ],
  };
}
function openDiscoverForTitle(title) {
  if (title) state.gameSearchQuery = title;
  openAppView("discover");
  window.setTimeout(() => {
    els.gameSearchInput?.focus({ preventScroll: true });
    els.gameSearchInput?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 0);
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
  if (action === "detail-pick" && title) {
    openGameDetail(title);
    return;
  }
  if (action === "discover-pick" && title) {
    openDiscoverForTitle(title);
    return;
  }
  runAnswerAction(action, title);
  render();
}

function continuityActionLabel(action) {
  return action.label || action.id;
}

function runContinuityAction(action, title) {
  if (action === "load-demo") {
    applyDemoProfile();
    return;
  }
  if (action === "today") {
    openAppView("today");
    window.setTimeout(() => els.topPick?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    return;
  }
  if (action === "detail" && title) {
    openGameDetail(title);
    return;
  }
  if (action === "discover") {
    openDiscoverForTitle(title || state.gameSearchQuery);
    return;
  }
  if (action === "wishlist") {
    openAppView("wishlist");
    return;
  }
}

function renderDemoContinuity(ranked) {
  if (!els.demoContinuityPanel) return;
  const primaryGame = primaryDecisionGame(ranked);
  const isDemo = state.entryPath === "demo";
  const trackedCount = Object.keys(state.userGames || {}).length;
  const savedCount = Object.values(state.userGames || {}).filter((game) => game.saved).length;
  const searchTitle = state.gameSearchQuery || primaryGame?.title || "Mafia: The Old Country";
  const searchCopy = state.activeView === "discover" && state.gameSearchQuery
    ? t("today.sample.searchFocused", { query: state.gameSearchQuery })
    : t("today.sample.searchDefault");

  els.demoContinuityKicker.textContent = isDemo
    ? t("today.sample.kickerDemo")
    : t("today.sample.kickerReview");
  els.demoContinuityTitle.textContent = isDemo
    ? `${t("today.sample.remembered", { count: trackedCount })} / ${t("today.sample.wishlistCount", { count: savedCount })}`
    : t("today.sample.titleReview");
  els.demoContinuityDetail.textContent = isDemo
    ? t("today.sample.detailDemo", { title: primaryGame?.title || t("today.sample.anchorFallback"), search: searchCopy })
    : t("today.sample.detailReview");

  const metrics = isDemo
    ? [
        [t("today.sample.chipTaste"), t("today.sample.ratings", { count: 10 })],
        [t("today.sample.chipMemory"), t("today.metrics.games", { count: trackedCount })],
        [t("today.sample.chipWishlist"), t("today.sample.saved", { count: savedCount })],
      ]
    : [
        [t("today.sample.chipOneClick"), t("today.sample.valFullLoop")],
        [t("today.sample.chipTaste"), t("today.sample.valSeeded")],
        [t("today.sample.chipPrices"), t("today.sample.valWatchIntent")],
      ];
  els.demoContinuityMetrics?.replaceChildren(
    ...metrics.map(([label, value]) => {
      const item = document.createElement("span");
      item.className = "demo-continuity-metric";
      item.innerHTML = `<small>${label}</small><strong>${value}</strong>`;
      return item;
    }),
  );

  const actions = isDemo
    ? [
        { id: "detail", label: t("today.sample.actOpenPick"), title: primaryGame?.title || "" },
        { id: "discover", label: state.activeView === "discover" ? t("today.sample.actRefresh") : t("today.sample.actExplore"), title: primaryGame?.title || searchTitle },
        { id: "wishlist", label: t("today.sample.actWishlist"), title: "" },
        { id: "today", label: t("today.sample.actBackToday"), title: "" },
      ]
    : [
        { id: "load-demo", label: t("today.sample.actLoadDemo"), title: "" },
        { id: "discover", label: t("today.sample.actExploreCatalog"), title: searchTitle },
      ];

  els.demoContinuityActions.replaceChildren(
    ...actions.map((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.continuityAction = action.id;
      button.dataset.continuityTitle = action.title || "";
      button.textContent = continuityActionLabel(action);
      button.addEventListener("click", () => runContinuityAction(action.id, action.title || ""));
      return button;
    }),
  );
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
          <div class="first-run-value-contract">
            ${(bridge.valueChips || []).map((chip) => `<span>${chip}</span>`).join("")}
          </div>
        </div>
        <div class="first-run-pre-actions">
          <button class="first-run-start-cta" data-first-run-action="more-signal" data-first-run-title="" type="button">${t("narrative.firstRun.preStart")}</button>
          <button class="first-run-demo-cta" data-first-run-action="quick-entry" data-first-run-title="" type="button">${t("narrative.firstRun.preDemo")}</button>
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
      <span class="first-run-eyebrow">${bridge.eyebrow || t("narrative.firstRun.firstAnswer")}</span>
      <strong>${bridge.title}</strong>
      <p>${bridge.detail}</p>
    </div>
    ${bridge.verdict?.length ? `
      <div class="first-run-verdict" data-first-run-verdict>
        ${bridge.verdict.map((item) => `
          <div>
            <span>${item.label}</span>
            <strong>${item.value}</strong>
            <small>${item.detail}</small>
          </div>
        `).join("")}
      </div>
    ` : ""}
    ${bridge.proof ? `
      <div class="first-run-taste-proof">
        <div>
          <span>${bridge.proof.status}</span>
          <strong>${bridge.proof.pull}</strong>
          <small>${t("narrative.firstRun.proofCurrentPull")}</small>
        </div>
        <div>
          <span>${t("narrative.firstRun.proofCaution")}</span>
          <strong>${bridge.proof.caution}</strong>
          <small>${t("narrative.firstRun.proofKnownRisk")}</small>
        </div>
        <div>
          <span>${t("narrative.firstRun.proofWhy")}</span>
          <strong>${bridge.proof.why}</strong>
          <small>${bridge.proof.next}</small>
        </div>
      </div>
    ` : ""}
    ${bridge.readiness?.length ? `
      <div class="first-run-readiness" aria-label="${t("narrative.firstRun.readinessAria")}">
        ${bridge.readiness.map((item) => `
          <div>
            <span>${item.label}</span>
            <strong>${item.value}</strong>
            <small>${item.detail}</small>
          </div>
        `).join("")}
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
    ${bridge.journey?.length ? `
      <div class="first-run-journey" data-first-run-journey aria-label="${t("narrative.firstRun.journeyAria")}">
        <div class="first-run-journey-head">
          <span>${t("narrative.firstRun.journeyHead")}</span>
          <strong>${t("narrative.firstRun.journeyTitle")}</strong>
          <small>${t("narrative.firstRun.journeyDetail")}</small>
        </div>
        ${bridge.journey.map((step) => `
          <button class="first-run-journey-step" data-first-run-action="${step.id}" data-first-run-title="${detailAttr(step.title)}" type="button">
            <span>${step.step}</span>
            <strong>${step.label}</strong>
            <small>${step.detail}</small>
          </button>
        `).join("")}
      </div>
    ` : ""}
    <div class="first-run-actions">
      ${bridge.actions.map((action) => `<button data-first-run-action="${action.id}" data-first-run-title="${detailAttr(action.title)}" type="button">${action.label}</button>`).join("")}
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

function comparisonCardHtml(comparison) {
  if (!comparison) return "";
  return `
    <section class="answer-comparison" aria-label="${comparison.title}">
      <div class="comparison-covers">
        ${[comparison.primary, comparison.alternative].map((title) => `
          <div class="comparison-cover-card">
            <div class="comparison-cover" data-comparison-cover="${detailAttr(title)}">
              <strong>${title}</strong>
            </div>
            <small class="comparison-cover-source" data-comparison-cover-source="${detailAttr(title)}"></small>
          </div>
        `).join("")}
      </div>
      <div class="answer-comparison-head">
        <strong>${comparison.title}</strong>
        <p>${comparison.summary}</p>
      </div>
      <div class="answer-comparison-grid">
        ${comparison.rows.map((row) => `
          <div class="answer-comparison-row">
            <span>${row.label}</span>
            <p><strong>${comparison.primary}</strong>${row.primary}</p>
            <p><strong>${comparison.alternative}</strong>${row.alternative}</p>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function hydrateComparisonCovers(root) {
  root?.querySelectorAll("[data-comparison-cover]").forEach((element) => {
    const game = recommendationPool().find((item) => titleMatches(item.title, element.dataset.comparisonCover));
    if (!game) return;
    applyCoverVisual(element, game);
    const source = root.querySelector(`[data-comparison-cover-source="${CSS.escape(element.dataset.comparisonCover)}"]`);
    renderCoverSourceInto(source, game);
  });
}

function renderCompanionAnswer(ranked) {
  const answer = companionAnswer(ranked);
  const narrativeGame = answer.gameTitle
    ? ranked.find((game) => titleMatches(game.title, answer.gameTitle))
    : null;
  const narrativeContext = narrativeGame ? {
    fallback: answer.paragraphs.slice(0, 2),
    evidence: answer.evidence?.summary || "",
    forecast: answer.agenda?.[0]?.forecast?.label || "",
    decision: answer.agenda?.[0]?.detail || "",
    session: state.session,
  } : null;
  const cachedCompanionNarrative = narrativeGame
    ? cachedNarrative("companion", narrativeGame, narrativeContext)
    : null;
  const companionNarrative = cachedCompanionNarrative || (narrativeGame
    ? localNarrative("companion", narrativeGame, narrativeContext)
    : null);
  els.answerStatus.textContent = answer.status;
  els.answerCopy.innerHTML = `
    <div class="answer-main">
      <strong>${answer.title}</strong>
      <div class="answer-narrative" data-ai-companion-title="${detailAttr(answer.gameTitle || "")}" aria-live="polite">
        ${companionNarrative
          ? `<p data-ai-companion-copy></p>`
          : answer.paragraphs.slice(0, 2).map((item) => `<p>${item}</p>`).join("")}
      </div>
      ${answer.paragraphs.slice(2).map((item) => `<p>${item}</p>`).join("")}
    </div>
    ${answer.evidence ? `<div class="personal-evidence answer-evidence">${renderEvidenceRows(answer.evidence, 4)}</div>` : ""}
    ${comparisonCardHtml(answer.comparison)}
    ${answer.agenda?.length ? `
      <div class="answer-agenda" aria-label="${t("narrative.common.agendaAria")}">
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
              <div class="answer-agenda-actions" aria-label="${t("narrative.common.actionsAria", { title: item.title })}">
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
  hydrateComparisonCovers(els.answerCopy);
  if (companionNarrative) {
    const generated = els.answerCopy.querySelector("[data-ai-companion-copy]");
    if (generated) generated.textContent = companionNarrative;
  }
  if (narrativeGame && !cachedCompanionNarrative) {
    const requestedLocale = window.PlaySputnikI18n.getLocale();
    void (async () => {
      if (!await narrativeAvailable()) return;
      try {
        const text = await fetchNarrative("companion", narrativeGame, narrativeContext);
        saveState();
        if (window.PlaySputnikI18n.getLocale() !== requestedLocale) return;
        const container = els.answerCopy.querySelector("[data-ai-companion-title]");
        if (!container || container.dataset.aiCompanionTitle !== answer.gameTitle) return;
        container.replaceChildren();
        const paragraph = document.createElement("p");
        paragraph.dataset.aiCompanionCopy = "";
        paragraph.textContent = text;
        container.append(paragraph);
      } catch (error) {
        console.warn("[PlaySputnik] AI companion narrative unavailable:", error);
      }
    })();
  }
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

function backlogAmnestyMeta(title) {
  return normalizeBacklogAmnestyMeta(explicitUserGame(title)?.amnesty);
}

function isBacklogAmnestyCandidate(game) {
  const memoryState = effectiveGameState(game);
  if (["playing", "paused", "want_to_finish", "completed", "dropped", "hidden", "owned", "owned_forever", "subscription"].includes(memoryState)) {
    return false;
  }
  // A game the user rated highly (4–5 sputniks, stored as 80–100) is never
  // "let it go" material — repeated skips of a loved game are a timing deferral,
  // not a rejection, so don't nag to archive it.
  const rating = explicitUserGame(game.title)?.rating;
  if (typeof rating === "number" && rating >= 80) return false;
  const meta = backlogAmnestyMeta(game.title);
  if (meta.archivedAt) return false;
  if (meta.skips < BACKLOG_AMNESTY_SKIP_TARGET) return false;
  return meta.dismissedSkips < meta.skips;
}

function backlogAmnestyCandidate(ranked) {
  return ranked
    .filter(isBacklogAmnestyCandidate)
    .map((game) => ({ game, meta: backlogAmnestyMeta(game.title) }))
    .sort((a, b) => {
      const skippedAt = Date.parse(b.meta.lastSkippedAt || "") - Date.parse(a.meta.lastSkippedAt || "");
      return b.meta.skips - a.meta.skips || (Number.isNaN(skippedAt) ? 0 : skippedAt) || b.game.score - a.game.score;
    })[0] || null;
}

function makeAmnestyButton(label, action, title, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.amnestyAction = action;
  button.dataset.amnestyTitle = title;
  if (className) button.className = className;
  return button;
}

function renderBacklogAmnesty(ranked) {
  if (!els.amnestyPanel || !els.amnestyCard) return;
  const candidate = backlogAmnestyCandidate(ranked);
  els.amnestyPanel.hidden = !candidate;
  els.amnestyPanel.classList.toggle("is-empty", !candidate);
  if (!candidate) {
    if (els.amnestyStatus) els.amnestyStatus.textContent = t("today.amnesty.quiet");
    els.amnestyCard.replaceChildren();
    return;
  }

  const { game, meta } = candidate;
  if (els.amnestyStatus) els.amnestyStatus.textContent = t("today.amnesty.skips", { count: meta.skips });

  const card = document.createElement("div");
  card.className = "amnesty-card";

  const copy = document.createElement("div");
  copy.className = "amnesty-copy";
  const tag = document.createElement("span");
  tag.textContent = t("today.amnesty.tag");
  const title = document.createElement("strong");
  title.textContent = t("today.amnesty.question", { title: game.title });
  const detail = document.createElement("p");
  detail.textContent = t("today.amnesty.detail", { count: meta.skips });
  copy.append(tag, title, detail);

  const facts = document.createElement("div");
  facts.className = "amnesty-facts";
  [
    t("today.amnesty.skips", { count: meta.skips }),
    effectiveGameState(game) === "saved" ? t("today.amnesty.wishlist") : t("today.amnesty.notActive"),
    t("today.amnesty.keepHides", { count: BACKLOG_AMNESTY_KEEP_COOLDOWN_SKIPS + 1 }),
    t("today.amnesty.hidden"),
  ].forEach((text) => {
    const pill = document.createElement("span");
    pill.textContent = text;
    facts.appendChild(pill);
  });

  const actions = document.createElement("div");
  actions.className = "amnesty-actions";
  actions.append(
    makeAmnestyButton(t("today.amnesty.details"), "detail", game.title),
    makeAmnestyButton(t("today.amnesty.keep"), "keep", game.title),
    makeAmnestyButton(t("today.amnesty.letGo"), "archive", game.title, "is-primary"),
  );

  card.append(copy, facts, actions);
  els.amnestyCard.replaceChildren(card);
  els.amnestyCard.querySelectorAll("[data-amnesty-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.amnestyAction;
      const gameTitle = button.dataset.amnestyTitle;
      if (action === "detail") openGameDetail(gameTitle);
      if (action === "keep") dismissBacklogAmnesty(gameTitle);
      if (action === "archive") archiveBacklogCandidate(gameTitle);
      render();
    });
  });
}

function renderFirstValueReceipt(ranked) {
  const cards = firstValueReceipt(ranked);
  const memory = tasteMemory();
  els.receiptSummary.textContent = t("taste.proofStatus", {
    entry: entryLabel(),
    confidence: localizedConfidence(memory.confidence),
  });
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

function libraryStateLabel(value) {
  const keys = {
    later: "library.stateLater", saved: "library.stateSaved", want_to_finish: "library.stateFinish",
    paused: "library.statePaused", owned: "library.stateOwned", owned_forever: "library.stateForever",
    subscription: "library.stateSubscription", playing: "library.statePlaying", completed: "library.stateCompleted",
    dropped: "library.stateDropped", hidden: "library.stateHidden",
  };
  return keys[value] ? t(keys[value]) : value;
}

function librarySessionLabel(value) {
  const keys = {
    short: "narrative.recommend.sessionShort",
    medium: "narrative.recommend.sessionMedium",
    long: "narrative.recommend.sessionLong",
  };
  return keys[value] ? t(keys[value]) : value;
}

function libraryAdultFitLabel(value) {
  const keys = {
    anytime: "narrative.recommend.adultAnytime", background: "narrative.recommend.adultBackground",
    evening: "narrative.recommend.adultEvening", vacation: "narrative.recommend.adultVacation",
    weekend: "narrative.recommend.adultWeekend", weeknight: "narrative.recommend.adultWeeknight",
  };
  return keys[value] ? t(keys[value]) : value;
}

function localizedConfidence(value) {
  const key = {
    low: "narrative.common.confidenceLow",
    medium: "narrative.common.confidenceMedium",
    high: "narrative.common.confidenceHigh",
  }[String(value).toLowerCase()];
  return key ? t(key) : value;
}

function libraryActionGroupLabel(index) {
  return t(["library.groupPlay", "library.groupAccess", "library.groupOutcome"][index] || "library.groupOutcome");
}

function libraryMemoryActionLabel(memoryState) {
  const keys = {
    playing: "library.statePlaying", paused: "library.actionPause", want_to_finish: "library.actionFinish",
    saved: "library.actionWishlist", owned: "library.actionOwned", owned_forever: "library.actionForever",
    subscription: "library.actionPlus", completed: "library.actionDone", dropped: "library.actionDrop",
    hidden: "library.actionNo", "": "library.actionClear",
  };
  return t(keys[memoryState] || "library.actionClear");
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
  els.librarySummary.textContent = t("library.states", { count: total });
  els.libraryGrid.replaceChildren(
    ...visibleBuckets.map((key) => {
      const item = document.createElement("div");
      item.className = `library-bucket state-${stateClassName(key)} ${buckets[key].length ? "has-items" : "is-empty"}`;
      const names = buckets[key].slice(0, 5);
      item.innerHTML = `
        <strong>${libraryStateLabel(key)} (${buckets[key].length})</strong>
        ${names.length ? names.map((name) => `<span>${name}</span>`).join("") : `<span>${t("library.empty")}</span>`}
      `;
      return item;
    }),
  );
}
function renderCompanionPlan(ranked) {
  const plan = companionPlan(ranked);
  const amnesty = backlogAmnestyCandidate(ranked);
  const commandRows = [
    ...plan,
    amnesty ? {
      id: `amnesty-${amnesty.game.title}`,
      label: t("today.planLetGoLabel"),
      title: amnesty.game.title,
      tag: t("today.planNoGuilt"),
      detail: t("today.planLetGoDetail", { count: amnesty.meta.skips }),
      primaryAction: "archive",
      primaryLabel: t("today.planLetGo"),
    } : null,
  ].filter(Boolean);
  els.planSummary.textContent = t("today.planSummary", { count: commandRows.length });
  els.planList.replaceChildren(
    ...commandRows.map((item, index) => {
      const row = document.createElement("div");
      row.className = `plan-row ${index === 0 ? "is-primary" : ""}`;
      row.innerHTML = `
        <span class="plan-label">${item.label}</span>
        <div>
          <strong>${item.title}</strong>
          <p>${item.detail}</p>
        </div>
        <div class="plan-actions">
          <span class="plan-tag">${item.tag}</span>
          <button data-plan-detail type="button">${t("today.planDetails")}</button>
          ${item.primaryState ? `<button class="plan-primary-action" data-plan-state="${item.primaryState}" type="button">${item.primaryLabel}</button>` : ""}
          ${item.primaryAction ? `<button class="plan-primary-action" data-plan-action="${item.primaryAction}" type="button">${item.primaryLabel}</button>` : ""}
        </div>
      `;
      row.querySelector("[data-plan-detail]")?.addEventListener("click", () => openGameDetail(item.title));
      row.querySelector("[data-plan-state]")?.addEventListener("click", (event) => {
        setGameState(item.title, event.currentTarget.dataset.planState);
        render();
      });
      row.querySelector("[data-plan-action]")?.addEventListener("click", (event) => {
        const action = event.currentTarget.dataset.planAction;
        if (action === "snooze") {
          stageLastUndo("snooze", item.title);
          snoozeGame(item.title);
        }
        if (action === "archive") archiveBacklogCandidate(item.title);
        render();
      });
      return row;
    }),
  );
}
function renderLibraryPlan(ranked) {
  const plan = libraryPlan(ranked);
  els.libraryPlanSummary.textContent = t("library.planSummary", {
    playable: plan.playableCount,
    completed: plan.completedCount,
    saved: plan.savedCount,
  });

  els.libraryPlanList.replaceChildren(
    ...plan.rows.map((item, index) => {
      const row = document.createElement("div");
      row.className = `library-plan-row tone-${stateClassName(item.tone || item.label)} ${index === 0 ? "is-next-step" : ""}`;
      const facts = libraryPlanFacts(item)
        .slice(0, 4)
        .map((fact) => `<span class="fact ${fact.type}">${fact.label}</span>`)
        .join("");
      row.innerHTML = `
        <div class="library-plan-step">
          <span>${t("library.step", { count: index + 1 })}</span>
          <strong>${item.label}</strong>
        </div>
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
          if (actions.children.length === 0) button.className = "library-plan-primary";
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
  els.memoryStatus.textContent = t("library.confidence", {
    confidence: localizedConfidence(memory.confidence),
    count: memory.evidenceCount,
  });
  const cards = [
    {
      label: t("library.memoryLikes"),
      value: memory.likes.length ? memory.likes.map((item) => item.label).join(" + ") : t("library.memoryStoryAction"),
      sub: t("library.memoryTasteSignals"),
    },
    {
      label: t("library.memoryCareful"),
      value: memory.cautions.length ? memory.cautions.map((item) => item.label).join(" + ") : t("library.memoryNone"),
      sub: memory.mixed.length
        ? t("library.memoryMixed", { signals: memory.mixed.slice(0, 2).join(" / ") })
        : memory.feedbackCount
          ? t("library.memoryButtons", { count: memory.feedbackCount })
          : t("library.memoryWeak"),
    },
    {
      label: t("library.memorySession"),
      value: memory.session.length
        ? memory.session.map((item) => librarySessionLabel(item.label)).join(" / ")
        : librarySessionLabel(state.session),
      sub: t("library.memoryPlayWindow"),
    },
    {
      label: t("library.memoryAdult"),
      value: memory.timeFit.length
        ? memory.timeFit.map((item) => libraryAdultFitLabel(item.label)).join(" / ")
        : libraryAdultFitLabel("weeknight"),
      sub: t("library.memoryLifeFit"),
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
  els.learningStatus.textContent = events.length
    ? t("taste.learningFresh", { count: events.length })
    : t("taste.learningNone");
  if (!events.length) {
    const empty = document.createElement("div");
    empty.className = "learning-empty";
    empty.textContent = t("taste.learningEmpty");
    els.learningList.replaceChildren(empty);
    return;
  }
  els.learningList.replaceChildren(
    ...events.map((event) => {
      const row = document.createElement("div");
      row.className = `learning-row ${feedbackWeightForAction(event.action) < 0 ? "negative" : ""}`;
      const atoms = event.atoms.map((atom) => `<span class="fact tone">${labelAtom(atom)}</span>`).join("");
      row.innerHTML = `
        <span class="learning-effect">${event.effect}</span>
        <div>
          <strong>${event.title}</strong>
          <p>${t("taste.learningLine", {
            action: event.actionLabel,
            effect: event.effect,
            signals: labelAtoms(event.atoms, " + ") || t("taste.learningTaste"),
          })}</p>
          <div class="facts">${atoms}</div>
        </div>
      `;
      return row;
    }),
  );
}

function renderRatingQueue(ranked) {
  if (!els.ratingQueueList) return;
  const items = ratingQueueItems(ranked);
  els.ratingQueueStatus.textContent = t("taste.ratingQueueCount", { count: items.length });
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "rating-queue-empty";
    empty.innerHTML = `<strong>${t("taste.ratingQueueEmpty")}</strong><span>${t("taste.ratingQueueEmptyDetail")}</span>`;
    els.ratingQueueList.replaceChildren(empty);
    return;
  }
  els.ratingQueueList.replaceChildren(...items.map(({ game }) => {
    const row = document.createElement("div");
    const badge = personalRatingBadge(game);
    row.className = "rating-queue-row";
    row.innerHTML = `
      <div class="rating-queue-cover" data-rating-queue-cover></div>
      <div>
        <strong>${game.title}</strong>
        <span>${badge?.label || t("taste.ratingQueueNoForecast")}</span>
        <small class="rating-queue-cover-source"></small>
      </div>
      <div class="rating-queue-actions" aria-label="${t("taste.ratingQueueRateAria", { title: game.title })}">
        ${[1, 2, 3, 4, 5].map((rating) => `<button data-queue-rating="${rating}" type="button">${rating}</button>`).join("")}
        <button data-queue-unplayed type="button">${t("stats.calibrationNotPlayed")}</button>
        <button data-queue-remove type="button">${t("taste.ratingQueueRemove")}</button>
      </div>
    `;
    applyCoverVisual(row.querySelector("[data-rating-queue-cover]"), game);
    renderCoverSourceInto(row.querySelector(".rating-queue-cover-source"), game);
    row.querySelectorAll("[data-queue-rating]").forEach((button) => {
      button.addEventListener("click", () => {
        setGameRating(game.title, Number(button.dataset.queueRating) * 20);
        removeRatingQueueGame(game.title);
        render();
      });
    });
    row.querySelector("[data-queue-unplayed]").addEventListener("click", () => {
      skipCalibrationGame(game.title);
      removeRatingQueueGame(game.title);
      render();
    });
    row.querySelector("[data-queue-remove]").addEventListener("click", () => {
      removeRatingQueueGame(game.title);
      render();
    });
    return row;
  }));
}
function renderQueuedGame(item, lane = "queued") {
  const row = document.createElement("div");
  row.className = "my-game-row is-queued";
  const atoms = item.atoms
    .slice(0, 3)
    .map((atom) => `<span class="fact tone">${labelAtom(atom)}</span>`)
    .join("");
  row.innerHTML = `
    <div>
      <div class="my-game-title-line">
        <strong>${item.title}</strong>
        <span class="queue-lane tone-${lane}">${queueLaneLabel(lane)}</span>
        <button class="queue-detail-button" data-queue-detail type="button">${t("library.details")}</button>
      </div>
      <span>${t("library.queuedLine", { source: item.source, detail: item.detail })}</span>
      <div class="facts">${atoms}<span class="fact access">${t("library.queued")}</span></div>
    </div>
    <div class="my-game-actions">
      <button data-queue-action="playing" type="button">${t("library.statePlaying")}</button>
      <button data-queue-action="completed" type="button">${t("library.actionDone")}</button>
      <button data-queue-action="not_for_me" type="button">${t("library.actionNo")}</button>
      <button data-queue-action="" type="button">${t("library.actionClear")}</button>
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

function focusAfterRender(selector, focusSelector = selector) {
  window.setTimeout(() => {
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "start" });
    document.querySelector(focusSelector)?.focus?.({ preventScroll: true });
  }, 0);
}

function runFirstTimeAction(action) {
  if (action === "search") {
    openAppView("wishlist");
    focusAfterRender("#game-search-title", "#game-search-input");
    return;
  }
  if (action === "catalog") {
    const view = APP_VIEWS.wishlist;
    state.activeView = "wishlist";
    state.activeCluster = view.cluster;
    state.visualCatalogShelf = "catalog";
    state.catalogPage = 1;
    render();
    focusAfterRender("#visual-catalog-title", "#catalog-search-input");
    return;
  }
  if (action === "taste") {
    openAppView("taste");
    focusAfterRender("#first-run-title");
  }
}

function createFirstTimeCard(kind) {
  const content = kind === "wishlist" ? {
    prefix: "wishlist",
    kicker: t("wishlist.emptyStartKicker"),
    title: t("wishlist.emptyStartTitle"),
    detail: t("wishlist.emptyStartDetail"),
    search: t("wishlist.emptyActionSearch"),
    catalog: t("wishlist.emptyActionCatalog"),
    taste: t("wishlist.emptyActionTaste"),
  } : {
    prefix: "library",
    kicker: t("library.emptyStartKicker"),
    title: t("library.emptyStartTitle"),
    detail: t("library.emptyStartDetail"),
    search: t("library.emptyActionSearch"),
    catalog: t("library.emptyActionCatalog"),
    taste: t("library.emptyActionTaste"),
  };
  const card = document.createElement("div");
  card.className = `first-time-empty first-time-empty--${content.prefix}`;
  card.innerHTML = `
    <div>
      <span>${content.kicker}</span>
      <strong>${content.title}</strong>
      <p>${content.detail}</p>
    </div>
    <div class="first-time-empty-actions">
      <button data-first-time-action="search" type="button">${content.search}</button>
      <button data-first-time-action="catalog" type="button">${content.catalog}</button>
      <button data-first-time-action="taste" type="button">${content.taste}</button>
    </div>
  `;
  card.querySelectorAll("[data-first-time-action]").forEach((button) => {
    button.addEventListener("click", () => runFirstTimeAction(button.dataset.firstTimeAction));
  });
  return card;
}

function syncFirstTimeCard(anchor, kind, show) {
  const parent = anchor?.parentElement;
  if (!parent) return;
  const className = `first-time-empty--${kind}`;
  const existing = Array.from(parent.children).find((child) => child.classList?.contains(className));
  if (!show) {
    existing?.remove();
    return;
  }
  if (existing) {
    if (existing.nextElementSibling !== anchor) anchor.before(existing);
    return;
  }
  anchor.before(createFirstTimeCard(kind));
}

function libraryCommandFocus(rows, counts, activeFilter) {
  const active = rows.find((item) => item.lane === "active");
  const access = rows.find((item) => item.lane === "access");
  const wishlist = rows.find((item) => item.lane === "wishlist");
  const queued = rows.find((item) => item.lane === "queued");
  const pick = active || access || queued || wishlist;
  if (pick?.type === "game") {
    const step = libraryNextStep(pick.game);
    return {
      title: pick.game.title,
      label: step.label,
      detail: step.detail,
      tone: step.tone,
    };
  }
  if (pick?.type === "queued") {
    return {
      title: pick.item.title,
      label: t("library.commandQueued"),
      detail: pick.item.nextAction || pick.item.detail,
      tone: "active",
    };
  }
  return {
    title: t("library.commandEmptyTitle"),
    label: t("library.commandEmptyLabel"),
    detail: counts.all ? t("library.commandFilteredDetail", { filter: queueLaneLabel(activeFilter) }) : t("library.commandEmptyDetail"),
    tone: counts.all ? "suggested" : "empty",
  };
}

function renderLibraryCommand(rows, activeFilter) {
  if (!els.myGamesCommand) return;
  const counts = rows.reduce((acc, item) => {
    acc.all += 1;
    acc[item.lane] = (acc[item.lane] || 0) + 1;
    return acc;
  }, { all: 0, active: 0, queued: 0, access: 0, wishlist: 0, finished: 0, suggested: 0 });
  counts.active += counts.queued;
  const focus = libraryCommandFocus(rows, counts, activeFilter);
  const laneButtons = [
    ["all", t("library.filterAll"), counts.all],
    ["active", t("library.filterActive"), counts.active],
    ["access", t("library.filterAccess"), counts.access],
    ["wishlist", t("library.filterWishlist"), counts.wishlist],
    ["finished", t("library.filterFinished"), counts.finished],
  ];
  els.myGamesCommand.innerHTML = `
    <div class="library-command-focus tone-${focus.tone}">
      <span>${focus.label}</span>
      <strong>${focus.title}</strong>
      <p>${focus.detail}</p>
    </div>
    <div class="library-command-lanes" aria-label="${t("library.commandLanesAria")}">
      ${laneButtons.map(([filter, label, count]) => `
        <button class="${activeFilter === filter ? "is-active" : ""}" data-library-command-filter="${filter}" type="button" aria-pressed="${activeFilter === filter}">
          <span>${label}</span>
          <strong>${count}</strong>
        </button>
      `).join("")}
    </div>
  `;
  els.myGamesCommand.querySelectorAll("[data-library-command-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.libraryFilter = button.dataset.libraryCommandFilter || "all";
      render();
    });
  });
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

  els.myGamesSummary.textContent = t("library.rememberedSummary", {
    remembered: remembered + queued.length,
    visible: visibleRows.length,
    total: allRows.length,
  });
  els.myGamesFilterSummary.textContent = libraryFilterSummary(activeFilter, visibleRows.length, allRows.length);
  renderFilterButtons(els.libraryFilterButtons, activeFilter, "libraryFilter");
  const shouldShowFirstStep = activeFilter === "all" && remembered + queued.length === 0;
  syncFirstTimeCard(els.myGamesDashboard, "library", shouldShowFirstStep);
  renderLibraryDashboard(ranked);
  renderLibraryCommand(allRows, activeFilter);
  const rows = visibleRows.length
    ? visibleRows.map((item) => (item.type === "queued" ? renderQueuedGame(item.item, item.lane) : renderMyGameRow(item.game, item.index, item.lane)))
    : [createQueueEmpty(t("library.emptyLaneTitle"), t("library.emptyLaneDetail"))];
  els.myGamesList.replaceChildren(...rows);
}

function libraryQuickActions(game, userGame, lane) {
  if (userGame.completionStatus === "want_to_finish") {
    return [["playing", t("library.actionStart")], ["completed", t("library.actionDone")], ["paused", t("library.actionPause")]];
  }
  if (userGame.completionStatus === "playing") {
    return [["completed", t("library.actionDone")], ["paused", t("library.actionPause")], ["dropped", t("library.actionDrop")]];
  }
  if (userGame.completionStatus === "paused") {
    return [["playing", t("library.actionResume")], ["want_to_finish", t("library.actionFinish")], ["dropped", t("library.actionDrop")]];
  }
  if (["completed", "dropped"].includes(userGame.completionStatus) || userGame.hidden) {
    return [["playing", t("library.actionReplay")], ["saved", t("library.actionWishlist")], ["", t("library.actionClear")]];
  }
  if (userGame.access) {
    return [["playing", t("library.actionPlay")], ["want_to_finish", t("library.actionFinish")], ["saved", t("library.actionWishlist")]];
  }
  if (userGame.saved || game.wishlist || notebookWishlistWeight(game.title)) {
    return [["owned_forever", t("library.actionBought")], ["playing", t("library.actionStart")], ["", t("library.actionClear")]];
  }
  if (lane === "suggested") {
    return [["saved", t("library.actionWishlist")], ["owned", t("library.actionOwned")], ["subscription", t("library.actionPlus")]];
  }
  return [["playing", t("library.actionPlay")], ["saved", t("library.actionWishlist")], ["", t("library.actionClear")]];
}

function renderMyGameRow(game, index, lane = "suggested") {
      const row = document.createElement("div");
      const userGame = effectiveUserGame(game) || {};
      const nextStep = libraryNextStep(game);
      const quickActions = libraryQuickActions(game, userGame, lane);
      const facets = memoryFacets(game).map((facet) => `
        <span class="my-game-facet tone-${facet.tone}">
          <small>${facet.label}</small>
          <strong>${facet.value}</strong>
        </span>
      `).join("");
      row.className = "my-game-row";
      const atoms = game.atoms
        .slice(0, 3)
        .map((atom) => `<span class="fact tone">${labelAtom(atom)}</span>`)
        .join("");
      const sourcePassport = game.externalMeta ? sourcePassportHtml(gameSourcePassport(game), "compact") : "";
      const enrichment = game.externalMeta ? aiEnrichmentHtml(game, "compact") : "";
      const actionGroups = MEMORY_STATE_GROUPS.map((group, groupIndex) => `
          <div class="my-game-action-group">
            <span>${libraryActionGroupLabel(groupIndex)}</span>
            <div class="my-game-action-buttons">
              ${group.actions.map(([memoryState]) => `
                <button class="${isMemoryStateSelected(userGame, memoryState) ? "is-selected" : ""}" data-memory-state="${memoryState}" type="button">${libraryMemoryActionLabel(memoryState)}</button>
              `).join("")}
            </div>
          </div>
        `).join("");
      const ratingGroup = `
        <div class="my-game-action-group rating-actions">
          <span>${t("library.facetRating")}</span>
          <div class="my-game-action-buttons">
            ${RATING_ACTIONS.map(([rating, label]) => `
              <button class="${userGame.rating === rating ? "is-selected" : ""}" data-memory-rating="${rating}" type="button">${rating === "" ? t("library.actionClear") : label}</button>
            `).join("")}
          </div>
        </div>
      `;
      row.innerHTML = `
        <div>
          <div class="my-game-title-line">
            <strong>${game.title}</strong>
            <span class="queue-lane tone-${lane}">${queueLaneLabel(lane)}</span>
            <button class="queue-detail-button" data-memory-detail type="button">${t("library.details")}</button>
          </div>
          <span>${memoryHint(game, index)} / ${gameTagline(game)}</span>
          <div class="my-game-facets">${facets}</div>
          <div class="library-next-step tone-${nextStep.tone}">
            <span>${nextStep.label}</span>
            <p>${nextStep.detail}</p>
          </div>
          <div class="facts">${atoms}</div>
          ${sourcePassport}
          ${enrichment}
        </div>
        <div class="my-game-actions">
          <div class="my-game-quick-actions" aria-label="${t("library.quickActionsAria", { title: game.title })}">
            ${quickActions.map(([memoryState, label]) => `
              <button class="${isMemoryStateSelected(userGame, memoryState) ? "is-selected" : ""}" data-memory-state="${memoryState}" type="button">${label}</button>
            `).join("")}
          </div>
          <details class="my-game-more-actions">
            <summary>${t("library.moreStates")}</summary>
            <div class="my-game-action-matrix">
              ${actionGroups}
              ${ratingGroup}
            </div>
          </details>
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

function discoverConfidenceLabel(value) {
  const keys = {
    high: "discover.confidenceHigh",
    medium: "discover.confidenceMedium",
    low: "discover.confidenceLow",
    pending: "discover.confidencePending",
  };
  return t(keys[value] || "discover.confidenceLow");
}

function discoverCatalogStatus(value) {
  const keys = {
    seed: "discover.catalogSeed",
    backbone: "discover.catalogBackbone",
    ready_for_seed: "discover.catalogBackbone",
    external_fixture: "discover.catalogExternal",
    manual_unverified: "discover.catalogManual",
    provider_result: "discover.catalogExternal",
  };
  return t(keys[value] || "discover.catalogExternal");
}

function discoverAssetStatus(value) {
  const keys = {
    missing: "discover.statusMissing",
    fallback: "discover.statusFallback",
    candidate: "discover.statusCandidate",
    verified: "discover.statusVerified",
    fresh: "wishlist.freshnessFresh",
    sample: "wishlist.freshnessSample",
    stale: "wishlist.freshnessStale",
  };
  return t(keys[value] || "discover.statusMissing");
}

function searchResultMemoryStatus(result) {
  if (resultStateSelected(result, "subscription")) {
    return {
      tone: "access",
      label: t("discover.memoryPlus"),
      detail: t("discover.memoryPlusDetail"),
    };
  }
  if (resultStateSelected(result, "owned")) {
    return {
      tone: "owned",
      label: t("discover.memoryOwned"),
      detail: t("discover.memoryOwnedDetail"),
    };
  }
  if (resultAlreadySaved(result)) {
    return {
      tone: "saved",
      label: t("discover.memorySaved"),
      detail: t("discover.memorySavedDetail"),
    };
  }
  return {
    tone: "empty",
    label: t("discover.memoryReady"),
    detail: t("discover.memoryReadyDetail"),
  };
}

function searchResultMemoryChecks(result) {
  const saved = resultAlreadySaved(result);
  const owned = resultStateSelected(result, "owned");
  const subscription = resultStateSelected(result, "subscription");
  const remembered = saved || owned || subscription;
  const providerImported = result.sourceId === "rawg_provider_hook" || result.provider === "rawg";
  return [
    {
      done: remembered,
      label: remembered ? t("discover.memoryCheckRemembered") : t("discover.memoryCheckChoose"),
    },
    {
      done: Boolean(result.sourceId || result.sourceUrl),
      label: providerImported ? t("discover.memoryCheckProviderImport") : t("discover.memoryCheckSource"),
    },
    {
      done: saved,
      label: saved
        ? t("discover.memoryCheckWishlist")
        : remembered
          ? t("discover.memoryCheckLibrary")
          : t("discover.memoryCheckNext"),
    },
  ];
}

function editionLabelForItem(item) {
  if (!item?.editionLabel) return "";
  if (item.editionRole === "legacy") return `${item.editionLabel} / ${t("narrative.detail.legacyEdition")}`;
  if (item.editionRole === "primary") return `${item.editionLabel} / ${t("narrative.detail.primaryEdition")}`;
  return item.editionLabel;
}

function editionBadgeHtml(item, modifier = "") {
  const label = editionLabelForItem(item);
  if (!label) return "";
  return `<span class="fact edition ${modifier}">${label}</span>`;
}

function editionNoteHtml(game) {
  if (!game?.editionLabel && !game?.priceCanonicalTitle) return "";
  const priceNote = game.priceCanonicalTitle && game.priceCanonicalTitle !== game.title
    ? t("narrative.detail.editionPriceNote", { title: game.priceCanonicalTitle })
    : "";
  const editionNote = game.editionRole === "primary"
    ? t("narrative.detail.primaryEditionNote")
    : game.editionRole === "legacy"
      ? t("narrative.detail.legacyEditionNote")
      : t("narrative.detail.editionFallback");
  return `
    <section class="game-detail-section edition-note">
      <div>
        <span>${t("narrative.detail.edition")}</span>
        <strong>${editionLabelForItem(game) || t("narrative.detail.relatedEdition")}</strong>
        <p>${editionNote}${priceNote}</p>
      </div>
    </section>
  `;
}

function searchResultTrust(result) {
  if (result.sourceId === "seed_catalog") return { tone: "trusted", label: t("discover.trustSeed"), detail: t("discover.trustSeedDetail") };
  if (result.sourceId === "catalog_backbone") return { tone: "review", label: t("discover.trustBackbone"), detail: t("discover.trustBackboneDetail") };
  if (result.sourceId === "rawg_provider_hook" || result.provider === "rawg") return { tone: "provider", label: t("discover.trustProvider"), detail: t("discover.trustProviderDetail") };
  if (result.sourceId === "manual_unverified") return { tone: "manual", label: t("discover.trustManual"), detail: t("discover.trustManualDetail") };
  return { tone: "external", label: t("discover.trustExternal"), detail: t("discover.trustExternalDetail") };
}

function renderSearchTrustStrip(query, results, provider, localIndexReady) {
  if (!els.gameSearchTrust) return;
  const hasQuery = query.length >= 2;
  const localCount = results.filter((result) => ["seed_catalog", "catalog_backbone", "prototype_external_index"].includes(result.sourceId)).length;
  const providerCount = results.filter((result) => result.sourceId === "rawg_provider_hook" || result.provider === "rawg").length;
  const manualAvailable = hasQuery && results.some((result) => result.sourceId === "manual_unverified");
  const providerReady = ["live", "cached", "fallback"].includes(provider.status);
  const providerTone = provider.status === "offline"
    ? "warn"
    : providerReady || providerCount
      ? "good"
      : "neutral";
  const cards = [
    {
      tone: localIndexReady ? "good" : "neutral",
      label: t("discover.searchTrustLocalTitle"),
      value: hasQuery ? t("discover.searchTrustLocalValue", { count: localCount }) : t("discover.searchTrustReady"),
      detail: t("discover.searchTrustLocalDetail"),
    },
    {
      tone: providerTone,
      label: t("discover.searchTrustProviderTitle"),
      value: providerCount
        ? t("discover.searchTrustProviderValue", { count: providerCount })
        : provider.status === "offline"
          ? t("discover.searchTrustProviderOffline")
          : provider.status === "cached"
            ? t("discover.searchTrustProviderCached")
            : t("discover.searchTrustProviderReady"),
      detail: t("discover.searchTrustProviderDetail"),
    },
    {
      tone: manualAvailable ? "info" : "neutral",
      label: t("discover.searchTrustManualTitle"),
      value: manualAvailable ? t("discover.searchTrustManualValue") : t("discover.searchTrustManualReady"),
      detail: t("discover.searchTrustManualDetail"),
    },
  ];
  els.gameSearchTrust.replaceChildren(
    ...cards.map((card) => {
      const item = document.createElement("div");
      item.className = `search-trust-card tone-${card.tone}`;
      item.innerHTML = `
        <span>${card.label}</span>
        <strong>${card.value}</strong>
        <small>${card.detail}</small>
      `;
      return item;
    }),
  );
}

function renderGameSearch() {
  const query = (state.gameSearchQuery || "").trim();
  const results = globalSearchResults();
  const sourceCount = searchSources?.sources?.length || 0;
  const localIndexReady = searchIndexStatus === "ready";
  const localSourceCopy = localIndexReady
    ? t("discover.sources", { count: sourceCount })
    : searchIndexStatus === "failed"
      ? t("discover.sourceIndexFailed")
      : sourceCount
        ? t("discover.sourcesLoading", { count: sourceCount })
        : t("discover.localSourcesLoading");
  const currentProvider = state.providerSearch || {};
  const provider = providerSearchMatchesQuery(currentProvider, query) ? currentProvider : {};
  const providerLabel = provider.status === "loading"
    ? t("discover.providerLoading")
    : provider.status === "cached"
      ? t("discover.providerCached", { provider: provider.provider })
    : provider.status === "live"
      ? t("discover.providerLive", { provider: provider.provider })
      : provider.status === "fallback"
        ? `${t("discover.providerFallback", { provider: provider.provider })}${provider.recoverable ? ` / ${t("discover.providerRecoverable")}` : ""}`
        : provider.status === "offline"
          ? t("discover.providerOffline")
          : t("discover.providerIdle");
  const localIndexCopy = localIndexReady
    ? t("discover.localReady")
    : searchIndexStatus === "failed"
      ? t("discover.localFailed")
      : t("discover.localLoading");
  els.gameSearchStatus.textContent = query.length >= 2
    ? `${t("discover.results", { count: results.length })} / ${providerLabel} / ${localIndexCopy}`
    : t("discover.searchReady");
  els.gameSearchSubmit.textContent = provider.status === "loading" ? t("discover.searching") : t("discover.searchButton");
  const providerDetail = window.PlaySputnikI18n.getLocale() === "en" && provider.sourceHealthDetail
    ? ` / ${provider.sourceHealthDetail}`
    : "";
  els.gameSearchSource.textContent = t("discover.sourcePromise", {
    sources: localSourceCopy,
    health: provider.status ? providerLabel : t("discover.localFirst"),
    detail: providerDetail,
  });
  renderSearchTrustStrip(query, results, provider, localIndexReady);

  if (query.length < 2) {
    const empty = document.createElement("div");
    empty.className = "search-empty";
    empty.innerHTML = `
      <strong>${t("discover.emptySearchTitle")}</strong>
      <span>${t("discover.emptySearchDetail")}</span>
    `;
    els.gameSearchList.replaceChildren(empty);
    return;
  }

  const notices = [];
  if (!localIndexReady) {
    const notice = document.createElement("div");
    notice.className = "search-empty source-warning";
    notice.innerHTML = `
      <strong>${t(searchIndexStatus === "failed" ? "discover.sourcesRefresh" : "discover.sourcesStillLoading")}</strong>
      <span>${searchIndexStatus === "failed"
        ? t("discover.sourcesFailedDetail")
        : t("discover.sourcesLoadingDetail")}</span>
    `;
    notices.push(notice);
  }
  if (provider.status === "offline" || provider.fallbackUsed || provider.sourceHealth === "rawg_rate_limited") {
    const notice = document.createElement("div");
    notice.className = "search-empty source-warning";
    notice.innerHTML = `
      <strong>${t(provider.sourceHealth === "rawg_rate_limited"
        ? "discover.providerRateLimited"
        : provider.status === "offline"
          ? "discover.providerEndpointOffline"
          : "discover.providerFallbackActive")}</strong>
      <span>${window.PlaySputnikI18n.getLocale() === "en" && provider.sourceHealthDetail
        ? provider.sourceHealthDetail
        : t("discover.providerFallbackDetail")}</span>
    `;
    notices.push(notice);
  }

  const rows = results.map((result) => {
      const row = document.createElement("div");
      row.className = `game-search-row source-${stateClassName(result.sourceId)}`;
      const enrichmentModel = aiEnrichmentForGame(result);
      const displayAtoms = uniqueCompact([...(result.atoms || []), ...enrichmentModel.atoms], 5);
      const atoms = displayAtoms.slice(0, 5).map((atom) => `<span class="fact tone">${labelAtom(atom)}</span>`).join("");
      const platforms = (result.platforms || []).slice(0, 3).map((platform) => `<span class="fact access">${platform}</span>`).join("");
      const providerCover = result.coverUrl
        ? `
          <figure class="game-search-cover">
            <img src="${detailAttr(result.coverUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer" />
            <figcaption>${result.provider === "rawg" ? "RAWG" : compactStatus(result.coverStatus)}</figcaption>
          </figure>
        `
        : result.sourceId === "rawg_provider_hook"
          ? `<div class="game-search-cover is-empty" aria-hidden="true"><span>RAWG</span></div>`
          : "";
      const reconciliation = result.reconciliation?.status || result.duplicateSource || "";
      const reconciliationFact = reconciliation
        ? `<span class="fact ${reconciliation === "new_external" ? "warn" : "access"}">${compactStatus(reconciliation)}</span>`
        : "";
      const saved = resultAlreadySaved(result);
      const trust = searchResultTrust(result);
      const sourcePassport = sourcePassportHtml(searchResultSourcePassport(result), "compact");
      const enrichment = result.sourceId === "seed_catalog" ? "" : aiEnrichmentHtml(result, "compact", enrichmentModel);
      const owned = resultStateSelected(result, "owned");
      const subscription = resultStateSelected(result, "subscription");
      const memory = searchResultMemoryStatus(result);
      const memoryChecks = searchResultMemoryChecks(result);
      const remembered = saved || owned || subscription;
      const ratingBadge = personalRatingBadge(canonicalSearchResultSeed(result) || result);
      const canonicalTitle = canonicalSearchResultTitle(result);
      const queuedForRating = isTitleQueued(canonicalTitle);
      const compared = isTitleCompared(canonicalTitle);
      const followupLabel = saved
        ? t("discover.actionOpenWishlist")
        : remembered
          ? t("discover.actionDetails")
          : t("discover.actionWishlist");
      const followupDetail = remembered ? memory.detail : t("discover.memoryReadyDetail");
      row.innerHTML = `
        <div class="game-search-main">
          ${providerCover}
          <div class="game-search-copy">
            <div class="game-search-title-line">
              <strong>${result.title}</strong>
              <span class="search-source-pill tone-${trust.tone}">${trust.label}</span>
              ${remembered ? `<span class="search-memory-pill tone-${memory.tone}">${memory.label}</span>` : ""}
            </div>
            <span>${result.sourceLabel} / ${t("discover.confidence", { value: discoverConfidenceLabel(result.matchConfidence) })}</span>
            <small class="search-trust-detail">${trust.detail}</small>
            <p>${result.reason}</p>
            ${ratingBadge ? `<span class="personal-rating-badge ${ratingBadge.known ? "is-known" : ""}" title="${detailAttr(ratingBadge.detail)}">${ratingBadge.label}</span>` : ""}
            <div class="facts">
              ${atoms}
              ${platforms}
              ${editionBadgeHtml(result)}
              <span class="fact access">${t("discover.catalogFact", { value: discoverCatalogStatus(result.catalogStatus) })}</span>
              ${reconciliationFact}
              <span class="fact ${result.coverStatus === "missing" ? "warn" : "cover"}">${t("discover.coverFact", { value: discoverAssetStatus(result.coverStatus) })}</span>
              <span class="fact ${result.priceStatus === "missing" ? "warn" : "price"}">${t("discover.priceFact", { value: discoverAssetStatus(result.priceStatus) })}</span>
            </div>
            ${sourcePassport}
            ${enrichment}
          </div>
        </div>
        <div class="game-search-actions">
          <div class="game-search-followup tone-${memory.tone}" data-search-followup>
            <span>${t("discover.memoryCheckNext")}</span>
            <strong>${followupLabel}</strong>
            <small>${followupDetail}</small>
          </div>
          <div class="game-search-memory tone-${memory.tone}" data-search-memory-panel>
            <span>${t("discover.memory")}</span>
            <strong>${memory.label}</strong>
            <small>${memory.detail}</small>
            <div class="game-search-memory-checks">
              ${memoryChecks.map((check) => `<span class="${check.done ? "is-done" : ""}">${check.label}</span>`).join("")}
            </div>
          </div>
          <button class="memory-action search-primary-action ${saved ? "is-selected" : ""}" data-search-state="saved" aria-pressed="${saved}" type="button">${saved ? t("discover.actionSaved") : t("discover.actionWishlist")}</button>
          ${saved ? `<button class="memory-action search-next-action" data-search-open-wishlist type="button">${t("discover.actionOpenWishlist")}</button>` : ""}
          <button class="memory-action ${owned ? "is-selected" : ""}" data-search-state="owned" aria-pressed="${owned}" type="button">${t("discover.actionLibrary")}</button>
          <button class="memory-action ${subscription ? "is-selected" : ""}" data-search-state="subscription" aria-pressed="${subscription}" type="button">${t("discover.actionPlus")}</button>
          <button class="memory-action" data-search-detail="${detailAttr(result.title)}" type="button">${t("discover.actionDetails")}</button>
          <button class="memory-action ${compared ? "is-selected" : ""}" data-search-compare type="button">${t("discover.actionCompare")}</button>
          <button class="memory-action ${queuedForRating ? "is-selected" : ""}" data-search-rate-later type="button">${queuedForRating ? t("discover.actionRateQueued") : t("discover.actionRateLater")}</button>
        </div>
      `;
      row.querySelector("[data-search-detail]").addEventListener("click", () => openGameDetail(result.title));
      row.querySelectorAll("[data-search-state]").forEach((button) => {
        button.addEventListener("click", () => {
          applySearchResultState(result, button.dataset.searchState);
          render();
        });
      });
      row.querySelector("[data-search-open-wishlist]")?.addEventListener("click", () => openAppView("wishlist"));
      row.querySelector("[data-search-compare]").addEventListener("click", () => {
        selectSearchResultForComparison(result);
        render();
      });
      row.querySelector("[data-search-rate-later]").addEventListener("click", () => {
        toggleSearchResultRatingQueue(result);
        render();
      });
      return row;
    });

  els.gameSearchList.replaceChildren(...notices, ...rows);
}

function renderGameComparison(ranked) {
  if (!els.comparisonResult) return;
  const selected = comparisonState();
  els.comparisonFirst.value = selected.first || "";
  els.comparisonSecond.value = selected.second || "";
  els.comparisonGames.replaceChildren(...ranked
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((game) => {
      const option = document.createElement("option");
      option.value = game.title;
      return option;
    }));
  const { first, second, primary, alternative } = comparisonPair(ranked);
  if (!first || !second || titleMatches(first.title, second.title)) {
    els.comparisonStatus.textContent = first || second
      ? t("discover.compareNeedOther")
      : t("discover.compareWaiting");
    els.comparisonResult.replaceChildren();
    return;
  }
  const comparison = companionComparison(primary, alternative);
  els.comparisonStatus.textContent = t("discover.compareReady");
  els.comparisonResult.innerHTML = comparisonCardHtml(comparison);
  hydrateComparisonCovers(els.comparisonResult);
}

const VISUAL_CATALOG_SHELVES = {
  smart: "discover.shelfSmartSummary",
  tonight: "discover.shelfTonightSummary",
  included: "discover.shelfIncludedSummary",
  deals: "discover.shelfDealsSummary",
  wishlist: "discover.shelfWishlistSummary",
  library: "discover.shelfLibrarySummary",
  catalog: "discover.shelfCatalogSummary",
};

function discoverLaneLabel(lane) {
  const keys = {
    Tonight: "discover.laneTonight",
    Taste: "discover.laneTaste",
    Included: "discover.laneIncluded",
    Deal: "discover.laneDeal",
    Wishlist: "discover.laneWishlist",
    Library: "discover.laneLibrary",
    Catalog: "discover.laneCatalog",
    Memory: "discover.laneMemory",
  };
  return t(keys[lane] || "discover.laneCatalog");
}

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

function detailAttr(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

const {
  detailHeroHtml,
  detailBodyHtml,
} = window.PlaySputnikDetailView.createDetailViewTools({ detailAttr });

function applyDetailState(game, userState) {
  if (game.searchResult && !canonicalSearchResultSeed(game.searchResult)) {
    applySearchResultState(game.searchResult, userState);
  } else {
    setGameState(game.title, userState);
  }
}

function localizedSignalStatus(value) {
  const keys = {
    fresh: "narrative.detail.signalFresh",
    aging: "narrative.detail.signalAging",
    stale: "narrative.detail.signalStale",
    sample: "narrative.detail.signalSample",
    verify: "narrative.detail.signalVerify",
    missing: "narrative.detail.signalMissing",
  };
  return keys[value] ? t(keys[value]) : value;
}

function localizedCoverReadiness(game) {
  const keys = {
    verified: "narrative.detail.coverVerified",
    candidate: "narrative.detail.coverCandidate",
    fallback: "narrative.detail.coverGenerated",
    missing: "narrative.detail.coverMissing",
  };
  return t(keys[game.coverMeta?.status] || "narrative.detail.coverCheck");
}

function detailPrimaryMove(game) {
  const region = state.activeRegion;
  const accessState = effectiveGameState(game);
  const accessLabel = accessState ? answerAccessLabel(game) : "";
  const chunk = gameChunkProfile(game);
  const hasPrice = typeof game.prices?.[region] === "number";
  const priceFitsBudget = hasPrice && game.prices[region] <= Number(state.budget);
  const priceTrustedEnough = hasPrice && priceCanGuideBuy(game, region);
  const priceSnapshot = priceSnapshots.find((snapshot) => snapshot.region === region && titleMatches(snapshot.title, game.title));
  const plusListed = (game.psPlus || []).includes(region);
  const userGame = effectiveUserGame(game) || {};

  if (isAlreadyAvailable(game)) {
    return {
      tone: "play",
      label: accessState === "playing"
        ? t("narrative.detail.keepPlaying")
        : t("narrative.detail.playBeforeBuy"),
      detail: t("narrative.detail.accessDetail", {
        access: accessLabel,
        chunk: chunk.label,
        minutes: chunk.minutes,
      }),
      action: { kind: "state", state: "playing" },
      actionLabel: accessState === "playing"
        ? t("narrative.detail.keepPlaying")
        : t("narrative.detail.startPlaying"),
      actionHint: accessState === "playing"
        ? t("narrative.detail.keepPlayingHint")
        : t("narrative.detail.startPlayingHint"),
    };
  }

  if (plusListed && state.psPlus) {
    const status = subscriptionStatus(game, region);
    return {
      tone: status.canConfirm ? "plus" : "verify",
      label: status.canConfirm ? t("narrative.detail.tryPlus") : t("narrative.detail.verifyPlus"),
      detail: status.canConfirm
        ? t("narrative.detail.plusFresh", { region })
        : t("narrative.detail.plusVerify", { region }),
      action: { kind: "state", state: "subscription" },
      actionLabel: status.canConfirm ? t("narrative.detail.addPlus") : t("narrative.detail.markPlus"),
      actionHint: t("narrative.detail.plusHint"),
    };
  }

  if (priceFitsBudget && priceTrustedEnough) {
    const storeUrl = priceSnapshot?.storeUrl || "";
    return {
      tone: "buy",
      label: t("narrative.detail.buyCandidate"),
      detail: t("narrative.detail.buyDetail", {
        region,
        price: formatPrice(game, region),
        budget: formatMoney(Number(state.budget)),
        status: localizedSignalStatus(priceStatus(game, region).state),
      }),
      action: storeUrl ? { kind: "url", url: storeUrl } : { kind: "state", state: "saved" },
      actionLabel: storeUrl ? t("narrative.detail.openStore") : t("narrative.detail.watchPrice"),
      actionHint: storeUrl ? t("narrative.detail.openStoreHint") : t("narrative.detail.watchLinkHint"),
    };
  }

  if (userGame.saved || notebookWishlistWeight(game.title) || game.wishlist) {
    return {
      tone: "watch",
      label: t("narrative.detail.keepWatched"),
      detail: t("narrative.detail.keepWatchedDetail"),
      action: { kind: "state", state: "saved" },
      actionLabel: t("narrative.detail.watchPrice"),
      actionHint: t("narrative.detail.keepWatchedHint"),
    };
  }

  return {
    tone: "save",
    label: t("narrative.detail.addWishlist"),
    detail: t("narrative.detail.addWishlistDetail"),
    action: { kind: "state", state: "saved" },
    actionLabel: t("narrative.detail.wishlistAction"),
    actionHint: t("narrative.detail.wishlistHint"),
  };
}

function detailPrimaryCtaHtml(move) {
  const action = move.action || { kind: "state", state: "saved" };
  const actionAttrs = [
    `data-primary-kind="${detailAttr(action.kind)}"`,
    action.state ? `data-primary-state="${detailAttr(action.state)}"` : "",
    action.url ? `data-primary-url="${detailAttr(action.url)}"` : "",
  ].filter(Boolean).join(" ");
  return `
    <div class="detail-cockpit-actions">
      <button class="detail-primary-cta tone-${move.tone}" data-detail-primary-action ${actionAttrs} type="button">
        ${move.actionLabel || move.label}
      </button>
      <small>${move.actionHint || t("narrative.detail.memoryHint")}</small>
    </div>
  `;
}

function runDetailPrimaryAction(game, move) {
  const action = move.action || { kind: "state", state: "saved" };
  recordUserEvent("detail_primary_cta_used", game.title, {
    kind: action.kind,
    state: action.state || "",
    tone: move.tone,
    label: move.actionLabel || move.label,
  });
  if (action.kind === "url" && action.url) {
    window.open(action.url, "_blank", "noopener,noreferrer");
    return;
  }
  if (action.state) {
    applyDetailState(game, action.state);
    render();
  }
}

function detailAtomSignalHtml(game) {
  const signals = tasteEngineGameSignals(game, tasteEngineProfile());
  const atoms = uniqueCompact([
    ...signals.positive,
    ...signals.mixed,
    ...signals.negative,
    ...(game.atoms || []),
  ], 10);
  if (!atoms.length) {
    return `<span class="detail-atom-signal tone-neutral"><strong>${t("narrative.detail.needsTags")}</strong><small>${t("narrative.detail.noAtomEvidence")}</small></span>`;
  }
  return atoms.map((atom) => {
    const tone = signals.positive.includes(atom)
      ? "positive"
      : signals.negative.includes(atom)
        ? "negative"
        : signals.mixed.includes(atom)
          ? "mixed"
          : "neutral";
    const label = {
      positive: t("narrative.detail.atomPull"),
      negative: t("narrative.detail.atomCaution"),
      mixed: t("narrative.detail.atomMixed"),
      neutral: t("narrative.detail.atomNeutral"),
    }[tone];
    return `<span class="detail-atom-signal tone-${tone}"><strong>${labelAtom(atom)}</strong><small>${label}</small></span>`;
  }).join("");
}

function detailCockpitHtml(game, { move, forecast, evidence, watchout, valueCard }) {
  const primaryMove = move || detailPrimaryMove(game);
  const rationale = decisionRationale(game);
  const valueCopy = valueCard?.valueScore != null
    ? `${valueCard.valueScore} ${valueCard.valueScoreLabel}`
    : typeof game.prices?.[state.activeRegion] === "number"
      ? `${state.activeRegion} ${formatPrice(game, state.activeRegion)}`
      : t("narrative.detail.priceMissing");
  const rows = [
    { label: t("narrative.detail.whyNow"), value: rationale.label, detail: rationale.headline },
    { label: t("narrative.detail.forecast"), value: forecast.label, detail: forecast.detail },
    { label: t("narrative.detail.tasteProof"), value: evidence.lines[0]?.label || t("narrative.detail.earlySignal"), detail: evidence.summary },
    { label: watchout.label, value: watchout.kind === "low" ? t("narrative.detail.noBlocker") : t("narrative.detail.checkFirst"), detail: watchout.detail },
    {
      label: t("narrative.detail.value"),
      value: valueCopy,
      detail: valueCard?.roi?.perHourLabel
        ? t("narrative.detail.perHour", { price: valueCard.roi.perHourLabel })
        : t("narrative.detail.valueFallback"),
    },
  ];
  return `
    <section class="game-detail-section detail-cockpit" data-detail-cockpit>
      <div class="detail-cockpit-head tone-${primaryMove.tone}">
        <span>${t("narrative.detail.nextMove")}</span>
        <strong>${primaryMove.label}</strong>
        <p>${primaryMove.detail}</p>
        ${detailPrimaryCtaHtml(primaryMove)}
      </div>
      <div class="detail-cockpit-grid">
        ${rows.map((row) => `
          <div class="detail-signal-row">
            <span>${row.label}</span>
            <strong>${row.value}</strong>
            <small>${row.detail}</small>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function detailHeroBadgesHtml(game, { forecast, valueCard, move }) {
  const region = state.activeRegion;
  const price = typeof game.prices?.[region] === "number"
    ? `${region} ${formatPrice(game, region)}`
    : t("narrative.recommend.pricePending");
  const sessionKey = {
    short: "narrative.recommend.sessionShort",
    medium: "narrative.recommend.sessionMedium",
    long: "narrative.recommend.sessionLong",
  }[game.session] || "narrative.recommend.sessionMedium";
  const length = game.hltbHours
    ? `${game.hltbHours}h HLTB`
    : t("narrative.recommend.factSession", { session: t(sessionKey) });
  const next = move?.actionLabel || move?.label || t("narrative.detail.nextMove");
  const badges = [
    { label: forecast.label, tone: "fit" },
    { label: length, tone: "time" },
    { label: valueCard?.roi?.perHourLabel ? `${valueCard.roi.perHourLabel}/h` : price, tone: "price" },
    { label: next, tone: "move" },
  ];
  return `<div class="detail-hero-badges">${badges.map((badge) => `<span class="tone-${badge.tone}">${badge.label}</span>`).join("")}</div>`;
}

function detailTasteFitHtml(game, evidence) {
  const references = evidence.references || [];
  return `
    <section class="game-detail-section detail-taste-fit" data-detail-taste-fit>
      <h3>${t("narrative.detail.tasteFit")}</h3>
      <p>${evidence.summary}</p>
      <div class="detail-evidence-list">
        ${evidence.lines.map((line) => `
          <div class="detail-evidence-row">
            <span>${line.label}</span>
            <strong>${line.detail}</strong>
          </div>
        `).join("")}
      </div>
      ${references.length ? `
        <div class="detail-reference-list" aria-label="${t("narrative.detail.referenceGamesAria")}">
          ${references.map((reference) => `
            <button class="detail-reference-chip" data-similar-title="${reference.title}" type="button">
              <strong>${reference.title}</strong>
              <span>${reference.sourceLabel} / ${reference.shared.slice(0, 3).join(" + ")}</span>
            </button>
          `).join("")}
        </div>
      ` : ""}
      <div class="game-detail-atoms detail-atom-map" data-detail-atom-map>${detailAtomSignalHtml(game)}</div>
    </section>
  `;
}

function detailSourceTrustRows(game) {
  const region = state.activeRegion;
  const seed = knownSeedGame(game.title);
  const priceSignal = priceStatus(game, region);
  const plusSignal = subscriptionStatus(game, region);
  const priceMeta = game.priceMeta?.[region];
  const subMeta = game.subscriptionMeta?.[region];
  const hasPrice = typeof game.prices?.[region] === "number";
  const hasPlusSignal = (game.psPlus || []).includes(region);
  const atomSource = seed
    ? t("narrative.detail.seedAtoms")
    : game.externalMeta?.atoms?.length
      ? t("narrative.detail.sourceTags")
      : game.externalMeta?.inferredAtoms?.length
        ? t("narrative.detail.aiInferred")
        : (game.atoms || []).length
          ? t("narrative.detail.catalogAtoms")
          : t("narrative.detail.missing");
  return [
    {
      label: t("narrative.detail.catalog"),
      value: seed ? t("narrative.detail.seedCatalog") : game.externalMeta?.catalogStatus || t("narrative.detail.memoryCandidate"),
      detail: seed ? t("narrative.detail.curatedEntry") : t("narrative.detail.resolvedMemory"),
      tone: seed ? "good" : "verify",
    },
    {
      label: t("narrative.detail.cover"),
      value: localizedCoverReadiness(game),
      detail: coverSourceLabel(game),
      tone: ["verified", "candidate"].includes(game.coverMeta?.status) ? "good" : "verify",
    },
    {
      label: t("narrative.detail.price"),
      value: hasPrice ? localizedSignalStatus(priceSignal.state) : t("narrative.detail.signalMissing"),
      detail: hasPrice
        ? `${region} ${formatPrice(game, region)}${priceMeta?.checkedAt ? ` / ${priceMeta.checkedAt.slice(0, 10)}` : ""}`
        : t("narrative.detail.noPriceSource"),
      tone: priceSignal.canConfirm ? "good" : hasPrice ? "verify" : "warn",
    },
    ...(game.priceCanonicalTitle && game.priceCanonicalTitle !== game.title ? [{
      label: t("narrative.detail.editionPrice"),
      value: t("narrative.detail.canonicalLink"),
      detail: t("narrative.detail.canonicalDetail", { title: game.priceCanonicalTitle }),
      tone: "verify",
    }] : []),
    {
      label: t("narrative.detail.plus"),
      value: hasPlusSignal ? localizedSignalStatus(plusSignal.state) : t("narrative.detail.notListed"),
      detail: hasPlusSignal ? `${subMeta?.tier || "PS Plus"} / ${region}` : t("narrative.detail.noSubscription"),
      tone: hasPlusSignal && plusSignal.canConfirm ? "good" : hasPlusSignal ? "verify" : "neutral",
    },
    {
      label: t("narrative.detail.atoms"),
      value: atomSource,
      detail: `${labelAtoms((game.atoms || []).slice(0, 4)) || t("narrative.detail.needsEnrichment")}`,
      tone: atomSource === t("narrative.detail.missing") ? "warn" : "good",
    },
  ];
}

function detailProviderImportHtml(game) {
  const meta = game.externalMeta || {};
  const providerImport = meta.providerImport || null;
  const sourcePassport = meta.sourcePassport || {};
  const isRawg = providerImport?.provider === "rawg" || meta.provider === "rawg" || game.coverMeta?.source === "rawg";
  if (!isRawg) return "";
  const sourceUrl = providerImport?.sourceUrl || meta.sourceUrl || game.coverMeta?.sourceUrl || "";
  const coverUrl = providerImport?.coverUrl || meta.coverUrl || game.coverMeta?.url || "";
  const importedAt = providerImport?.importedAt || meta.updatedAt || sourcePassport.checkedAt || "";
  const reviewStatus = providerImport?.status || "candidate";
  const reviewStatusKeys = {
    candidate: "data.providerImportStatusLabel.candidate",
    accepted: "data.providerImportStatusLabel.accepted",
    snoozed: "data.providerImportStatusLabel.snoozed",
    hidden: "data.providerImportStatusLabel.hidden",
  };
  const reviewStatusLabel = t(reviewStatusKeys[reviewStatus] || "data.providerImportStatusLabel.candidate");
  const missing = [
    (providerImport?.priceStatus || meta.priceStatus || "missing") === "missing" ? t("narrative.detail.rawgMissingPrice") : "",
    !(game.psPlus || []).length ? t("narrative.detail.rawgMissingPlus") : "",
    !knownSeedGame(game.title) ? t("narrative.detail.rawgNeedsPromotion") : "",
  ].filter(Boolean);
  const chips = [
    reviewStatusLabel,
    t("narrative.detail.rawgCover", { state: localizedCoverReadiness(game) }),
    t("narrative.detail.rawgAtoms", { count: (game.atoms || []).length }),
    ...(meta.platforms?.length ? [t("narrative.detail.rawgPlatforms", { platforms: meta.platforms.slice(0, 3).join(" / ") })] : []),
    ...(importedAt ? [t("narrative.detail.rawgImported", { date: importedAt.slice(0, 10) })] : []),
  ];
  return `
    <section class="game-detail-section detail-provider-import" data-detail-provider-import>
      <h3>${t("narrative.detail.rawgImportTitle")}</h3>
      <p>${t("narrative.detail.rawgImportDetail")}</p>
      <div class="detail-provider-import-grid">
        ${coverUrl ? `<img src="${detailAttr(coverUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer" />` : `<div class="detail-provider-import-fallback" aria-hidden="true">RAWG</div>`}
        <div>
          <div class="facts">${chips.map((chip) => `<span class="fact access">${chip}</span>`).join("")}</div>
          <p>${missing.length ? t("narrative.detail.rawgMissingFacts", { facts: missing.join(" / ") }) : t("narrative.detail.rawgReadyFacts")}</p>
          ${sourceUrl ? `<a href="${detailAttr(sourceUrl)}" target="_blank" rel="noopener noreferrer">${t("narrative.detail.rawgOpenSource")}</a>` : ""}
        </div>
      </div>
    </section>
  `;
}

function renderGameDetail(shouldFocus = false) {
  const detailGame = detailGameForTitle(selectedGameTitle);
  if (!selectedGameTitle || !detailGame) {
    els.gameDetail.classList.add("is-hidden");
    els.gameDetail.setAttribute("aria-hidden", "true");
    return;
  }
  const game = detailScoredGame(detailGame);

  const { confidence } = explain(game, game.score);
  const watchout = watchOutCopy(game);
  const forecast = personalRankForecast(game);
  const evidence = personalEvidence(game);
  const rationale = decisionRationale(game);
  const primaryMove = detailPrimaryMove(game);
  const description = gameDescription(game);
  const statusCards = detailStatusCards(game);
  const passport = sourcePassportHtml(gameSourcePassport(game), "compact");
  const facts = factList(game).slice(0, 6);
  const valueCard = gameValueCard(game);
  const trustRows = detailSourceTrustRows(game);
  const providerImport = detailProviderImportHtml(game);
  const aiContext = {
    fallbackDescription: description,
    personalReason: rationale.detail,
    evidence: evidence.summary,
    forecast: forecast.label,
    risk: watchout.detail,
    access: answerAccessLabel(game),
  };
  const cachedAiExplanation = cachedExplanation(game.title, aiContext)
    || localNarrative("game_detail", game, aiContext);

  els.gameDetail.classList.remove("is-hidden");
  els.gameDetail.setAttribute("aria-hidden", "false");
  els.gameDetailTitle.textContent = game.title;
  const metaSessionKey = {
    short: "narrative.recommend.sessionShort",
    medium: "narrative.recommend.sessionMedium",
    long: "narrative.recommend.sessionLong",
  }[game.session] || "narrative.recommend.sessionMedium";
  els.gameDetailMeta.textContent = t("narrative.detail.meta", {
    confidence,
    fit: Math.max(game.score, 0),
    session: t(metaSessionKey),
  });
  els.gameDetailVisual.replaceChildren();
  // The fit tier already appears as a badge in detailHeroBadgesHtml; don't also
  // render it as a floating eyebrow (it duplicated the same text in the hero).
  els.gameDetailVisual.innerHTML = detailHeroHtml(
    game,
    detailHeroBadgesHtml(game, { forecast, valueCard, move: primaryMove }),
  );
  applyCoverVisual(els.gameDetailVisual, game);
  renderCoverSourceInto(els.gameDetailCoverSource, game);

  const userGame = explicitUserGame(game.title);
  const amnesty = isAmnestiedUserGame(userGame)
    ? normalizeBacklogAmnestyMeta(userGame.amnesty)
    : null;
  const region = state.activeRegion;
  const snap = priceSnapshots.find((item) => item.title === game.title && item.region === region);
  const history = priceHistory?.[game.title]?.[region];
  const subMeta = game.subscriptionMeta?.[region];
  const inPlusList = (game.psPlus || []).includes(region);
  const plusHtml = inPlusList
    ? `<div class="value-chip value-chip--plus"><span>PS Plus ${subMeta?.tier || "Extra"}</span><strong>${t("narrative.detail.included")}</strong></div>`
    : "";
  const market = snap?.price != null
    ? `${plusHtml}<div class="value-chip value-chip--price">
        <span>${t("narrative.detail.regionPriceLabel", { region })}${snap.discount > 0 ? ` <span class="detail-discount-badge">-${snap.discount}%</span>` : ""}</span>
        <strong>${snap.currency} ${snap.price.toFixed(2)}${snap.storeUrl ? ` <a class="detail-store-link" href="${snap.storeUrl}" target="_blank" rel="noopener">PS Store ↗</a>` : ""}</strong>
        ${history?.length >= 2 ? priceSparkline(game.title, region, { width: 64, height: 24, color: "var(--teal)" }) : ""}
      </div>`
    : plusHtml;
  const priceWatch = priceWatchControlHtml(game, { context: "detail" });
  const similar = findSimilarGames(game);
  const currentSputniks = typeof userGame?.rating === "number" ? Math.round(userGame.rating / 20) : 0;
  const sputnikSvg = `<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="13" rx="9" ry="4.2" transform="rotate(-24 12 13)" fill="none" stroke="currentColor" stroke-width="1.7" opacity="0.55"/><circle cx="12" cy="13" r="4.4" fill="currentColor"/><circle cx="19.2" cy="8.6" r="1.9" fill="currentColor"/></svg>`;
  const chunk = gameChunkProfile(game);
  const links = [
    snap?.storeUrl ? { href: snap.storeUrl, label: "PS Store", kind: "store" } : null,
    game.coverMeta?.sourceUrl ? { href: game.coverMeta.sourceUrl, label: t("narrative.detail.gameInfoRawg"), kind: "info" } : null,
    { href: `https://howlongtobeat.com/?q=${encodeURIComponent(game.title)}`, label: "HowLongToBeat", kind: "info" },
  ].filter(Boolean);
  const actions = [
    ["saved", t("narrative.detail.wishlist")],
    ["playing", t("narrative.detail.actionPlay")],
    ["owned", t("narrative.detail.actionOwned")],
    ["subscription", t("narrative.detail.actionPlus")],
    ["owned_forever", t("narrative.detail.actionBought")],
    ["completed", t("narrative.detail.actionDone")],
    ["hidden", t("narrative.detail.actionHide")],
  ].map(([actionState, label]) => ({
    state: actionState,
    label,
    className: detailActionClass(game, actionState),
  }));

  els.gameDetailBody.innerHTML = detailBodyHtml({
    game,
    statusCards,
    editionNote: editionNoteHtml(game),
    cockpit: detailCockpitHtml(game, { move: primaryMove, forecast, evidence, watchout, valueCard }),
    description,
    rationale,
    watchout,
    tasteFit: detailTasteFitHtml(game, evidence),
    amnesty,
    valueCard,
    market,
    priceWatch,
    trustRows,
    providerImport,
    facts,
    passport,
    cachedAiExplanation,
    similar,
    actions,
    queued: isTitleQueued(game.title),
    currentSputniks,
    sputnikSvg,
    chunk,
    links,
  });
  // Wire "Why this game?" AI explain button
  const aiBtn = els.gameDetailBody.querySelector("#detail-ai-btn");
  const aiBody = els.gameDetailBody.querySelector("#detail-ai-body");
  const aiSection = els.gameDetailBody.querySelector("#detail-ai-section");
  if (aiBtn && aiBody) {
    const cachedCopy = aiBody.querySelector("[data-ai-detail-copy]");
    if (cachedCopy && cachedAiExplanation) cachedCopy.textContent = cachedAiExplanation;
    if (!cachedAiExplanation && aiSection) {
      void narrativeAvailable().then((available) => {
        if (available && aiSection.isConnected) aiSection.hidden = false;
      });
    }
    aiBtn.addEventListener("click", async () => {
      aiBtn.disabled = true;
      aiBtn.textContent = `${t("narrative.ai.thinking")}…`;
      aiBody.replaceChildren();
      const pending = document.createElement("p");
      pending.className = "detail-ai-placeholder";
      pending.textContent = t("narrative.ai.asking");
      aiBody.append(pending);
      try {
        const explanation = await narrativeAvailable()
          ? await fetchExplanation(game, aiContext)
          : localNarrative("game_detail", game, aiContext);
        aiBody.replaceChildren();
        const paragraph = document.createElement("p");
        paragraph.dataset.aiDetailCopy = "";
        paragraph.textContent = explanation;
        aiBody.append(paragraph);
        saveState();
      } catch (err) {
        aiBody.replaceChildren();
        const error = document.createElement("p");
        error.className = "detail-ai-error";
        error.textContent = t("narrative.ai.unavailable");
        aiBody.append(error);
        console.warn("[PlaySputnik] AI explain failed:", err);
      } finally {
        aiBtn.disabled = false;
        aiBtn.textContent = t("narrative.ai.detailButton");
      }
    });
  }
  bindPriceWatchControls(els.gameDetailBody, game);
  els.gameDetailBody.querySelector("[data-amnesty-restore]")?.addEventListener("click", () => {
    restoreBacklogAmnesty(game.title);
    render();
  });
  els.gameDetailBody.querySelector("[data-detail-primary-action]")?.addEventListener("click", () => {
    runDetailPrimaryAction(game, primaryMove);
  });
  els.gameDetail.querySelectorAll("[data-detail-state]").forEach((button) => {
    button.addEventListener("click", () => {
      applyDetailState(game, button.dataset.detailState);
      render();
    });
  });
  els.gameDetail.querySelector("[data-detail-rate-later]")?.addEventListener("click", () => {
    toggleRatingQueueTitle(game.title, { source: "detail" });
    render();
  });
  els.gameDetail.querySelector("[data-detail-compare]")?.addEventListener("click", () => {
    selectTitleForComparison(game.title);
    state.activeView = "discover";
    render();
  });
  els.gameDetail.querySelectorAll("[data-rate-sputniks]").forEach((button) => {
    button.addEventListener("click", () => {
      const n = Number(button.dataset.rateSputniks);
      const current = explicitUserGame(game.title);
      const currentSputniks = typeof current?.rating === "number" ? Math.round(current.rating / 20) : 0;
      // Tapping the current rating clears it
      setGameRating(game.title, currentSputniks === n ? null : n * 20);
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
  const priceCopy = typeof price === "number" ? formatMoney(price) : t("discover.noPrice");
  const inPsPlus = (game.psPlus || []).includes(state.activeRegion);
  const plusTier = inPsPlus ? (game.subscriptionMeta?.[state.activeRegion]?.tier || "Extra") : null;
  const stateCopy = gameState ? libraryStateLabel(gameState) : t("discover.unsorted");
  const laneCopy = discoverLaneLabel(lane);
  const ratingBadge = personalRatingBadge(game);
  const article = document.createElement("article");
  article.className = `visual-catalog-card ${gameState ? "has-state" : ""}`;
  article.dataset.visualTitle = game.title;
  article.dataset.visualLane = lane;
  article.innerHTML = `
    <div class="visual-catalog-poster">
      <span>${laneCopy}</span>
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
        <span class="visual-state-pill">${stateCopy}</span>
        <span class="visual-value-pill ${inPsPlus ? "is-plus" : ""}">${inPsPlus ? `PS+ ${plusTier}` : priceCopy}</span>
        ${ratingBadge ? `<span class="personal-rating-badge ${ratingBadge.known ? "is-known" : ""}" title="${detailAttr(ratingBadge.detail)}">${ratingBadge.label}</span>` : ""}
      </div>
      <div class="visual-catalog-tags">
        ${(game.atoms || []).slice(0, 3).map((atom) => `<span>${labelAtom(atom)}</span>`).join("")}
      </div>
      <div class="visual-catalog-actions">
        <button data-visual-detail type="button">${t("discover.actionDetails")}</button>
        <button data-visual-state="saved" type="button">${t("discover.actionWishlist")}</button>
        <button data-visual-state="playing" type="button">${t("discover.actionPlay")}</button>
        <button data-visual-state="completed" type="button">${t("discover.actionDone")}</button>
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
  const shelf = t(VISUAL_CATALOG_SHELVES[state.visualCatalogShelf] || VISUAL_CATALOG_SHELVES.smart);
  document.querySelectorAll("[data-visual-shelf]").forEach((button) => {
    const active = button.dataset.visualShelf === (state.visualCatalogShelf || "smart");
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  // Sync search input
  if (els.catalogSearchInput && els.catalogSearchInput !== document.activeElement) {
    els.catalogSearchInput.value = state.catalogSearch || "";
  }
  els.catalogSearchCount.textContent = searchQuery.length >= 2 ? t("discover.results", { count: totalFiltered }) : "";
  els.visualCatalogMetrics.replaceChildren(
    ...[
      [`${stats.coverCount}/${stats.totalCount}`, t("discover.metricCovers")],
      [`${stats.playableCount}`, t("discover.metricPlayable")],
      [`${stats.wishlistCount}`, t("discover.metricWishlist")],
    ].map(([value, label]) => {
      const item = document.createElement("div");
      item.className = "visual-catalog-metric";
      item.innerHTML = `<strong>${value}</strong><span>${label}</span>`;
      return item;
    }),
  );
  els.visualCatalogStatus.textContent = searchQuery.length >= 2
    ? t("discover.found", { count: totalFiltered })
    : t("discover.shown", { shown: pagedItems.length, total: totalFiltered });
  els.visualCatalogSummary.textContent = t("discover.catalogSummary", {
    shelf,
    real: realCount,
    fallback: fallbackCount,
  });
  els.visualCatalogList.replaceChildren(...pagedItems.map(createVisualCatalogCard));

  // Load more button
  if (els.visualCatalogLoadMore) {
    els.visualCatalogLoadMore.replaceChildren();
    if (pagedItems.length < totalFiltered) {
      const btn = document.createElement("button");
      btn.className = "load-more-btn";
      btn.type = "button";
      btn.textContent = t("discover.showMore", { count: totalFiltered - pagedItems.length });
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
      const isMonthly = drop.id === "monthly-games";
      row.innerHTML = `
        <div>
          <strong>${t(isMonthly ? "discover.calendarMonthly" : "discover.calendarRefresh")}</strong>
          <span>${t(isMonthly ? "discover.calendarMonthlyCadence" : "discover.calendarRefreshCadence")}</span>
        </div>
        <p>${t(isMonthly ? "discover.calendarMonthlyAction" : "discover.calendarRefreshAction")}</p>
        <span class="calendar-status">${t("discover.calendarNeedsSource")}</span>
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
    ? t("discover.dropOpen", { open: undecided.length, saved: savedForLater, days: cooldownDays })
    : t("discover.dropHandledStatus", { saved: savedForLater, days: cooldownDays });
  renderDropCalendar();
  if (!visibleDrop.length) {
    const empty = document.createElement("div");
    empty.className = "drop-empty";
    empty.innerHTML = `
      <strong>${t("discover.dropHandled")}</strong>
      <span>${t("discover.dropHandledDetail")}</span>
    `;
    els.dropList.replaceChildren(empty);
    return;
  }
  els.dropList.replaceChildren(
    ...visibleDrop.map((item) => {
      const row = document.createElement("div");
      row.className = "drop-row";
      const decision = dropDecision(item.title);
      const decisionKeys = {
        play_later: "discover.decisionPlayLater",
        claim_only: "discover.decisionClaimOnly",
        not_for_me: "discover.decisionNotForMe",
      };
      const fitClass = item.fit.includes("low") ? "warn" : item.fit.includes("plus") ? "price" : "time";
      row.innerHTML = `
        <div>
          <strong>${item.title}</strong>
          <span>${decision
            ? t("discover.dropDecision", { decision: t(decisionKeys[decision] || "discover.decisionNotForMe") })
            : `${item.access} / ${item.predictedRank}`}</span>
        </div>
        <span class="drop-verdict ${fitClass}">${item.verdict}</span>
        <p>${item.nextAction}</p>
        <div class="facts">
          <span class="fact access">${item.claimDecision}</span>
          <span class="fact ${item.installDecision.toLowerCase().includes("not") ? "warn" : "time"}">${item.installDecision}</span>
          <span class="fact ${item.playDecision.toLowerCase().includes("skip") ? "warn" : "tone"}">${item.playDecision}</span>
          <span class="fact ${fitClass}">${item.trialWindow}</span>
          <span class="fact tone">${item.fit}</span>
          <span class="fact warn">${discoverAssetStatus(item.freshnessState)}</span>
        </div>
        <div class="drop-actions">
          <button class="${decision === "play_later" ? "is-selected" : ""}" data-drop-decision="play_later" type="button">${t("discover.actionPlayLater")}</button>
          <button class="${decision === "claim_only" ? "is-selected" : ""}" data-drop-decision="claim_only" type="button">${t("discover.actionClaimOnly")}</button>
          <button class="${decision === "not_for_me" ? "is-selected" : ""}" data-drop-decision="not_for_me" type="button">${t("discover.actionNotForMe")}</button>
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
  els.radarStatus.textContent = t("discover.radarStatus", { shown: radar.length, total: allRadar.length });
  els.radarList.replaceChildren(
    ...radar.map((item) => {
      const row = document.createElement("div");
      row.className = "radar-row";
      const atoms = (item.atoms || []).slice(0, 3).map((atom) => `<span class="fact tone">${labelAtom(atom)}</span>`).join("");
      row.innerHTML = `
        <div>
          <strong>${item.title}</strong>
          <span>${t("discover.radarMeta", {
            window: item.window,
            freshness: discoverAssetStatus(item.freshnessState),
            confidence: discoverConfidenceLabel(item.confidence),
          })}</span>
        </div>
        <p>${item.reason}</p>
        <div class="facts">${atoms}<span class="fact time">${libraryAdultFitLabel(item.adultTimeFit)}</span></div>
        <span class="score">${Math.max(item.score, 0)}</span>
      `;
      return row;
    }),
  );
}

function renderWishlistDashboard(ranked, records) {
  renderDashboardCards(els.wishlistDashboard, wishlistDashboardCards(ranked, records), "wishlist-dashboard-card", "wishlistDashboard");
}

function wishlistLaneLabel(lane) {
  const keys = {
    buy: "wishlist.laneBuy",
    deal: "wishlist.laneDeal",
    wishlist: "wishlist.laneWishlist",
  };
  return t(keys[lane] || "wishlist.laneWishlist");
}

function wishlistSourceStatus(region) {
  const source = sourceForLayer("Prices") || {};
  const freshnessKeys = {
    fresh: "wishlist.freshnessFresh",
    sample: "wishlist.freshnessSample",
    stale: "wishlist.freshnessStale",
    missing: "wishlist.freshnessMissing",
  };
  const confidenceKeys = {
    high: "wishlist.confidenceHigh",
    medium: "wishlist.confidenceMedium",
    low: "wishlist.confidenceLow",
    unknown: "wishlist.confidenceUnknown",
  };
  return t("wishlist.priceFreshness", {
    region,
    freshness: t(freshnessKeys[source.freshnessState] || "wishlist.freshnessMissing"),
    confidence: t(confidenceKeys[source.confidence] || "wishlist.confidenceUnknown"),
  });
}

function wishlistExternalSourceHtml(game, region) {
  const meta = game.externalMeta || {};
  const providerImport = meta.providerImport || null;
  const isExternal = game.externalCandidate || providerImport?.provider || meta.provider;
  if (!isExternal) return "";
  const source = providerImport?.provider === "rawg" || meta.provider === "rawg" ? "RAWG" : (meta.sourceLabel || meta.provider || t("wishlist.externalSourceFallback"));
  const status = providerImport?.status || meta.catalogStatus || "candidate";
  const statusKeys = {
    candidate: "data.providerImportStatusLabel.candidate",
    accepted: "data.providerImportStatusLabel.accepted",
    snoozed: "data.providerImportStatusLabel.snoozed",
    hidden: "data.providerImportStatusLabel.hidden",
  };
  const statusLabel = t(statusKeys[status] || "data.providerImportStatusLabel.candidate");
  const facts = [
    t("wishlist.externalSource", { source }),
    t("wishlist.externalReview", { status: statusLabel }),
    typeof game.prices?.[region] !== "number" ? t("wishlist.externalNoPrice") : "",
    !(game.psPlus || []).includes(region) ? t("wishlist.externalNoPlus") : "",
  ].filter(Boolean);
  const sourceUrl = providerImport?.sourceUrl || meta.sourceUrl || game.coverMeta?.sourceUrl || "";
  return `
    <div class="wishlist-source-note" data-wishlist-source-note>
      <div class="wishlist-source-facts">
        ${facts.map((fact) => `<span>${fact}</span>`).join("")}
      </div>
      ${sourceUrl ? `<a href="${detailAttr(sourceUrl)}" target="_blank" rel="noopener noreferrer">${t("wishlist.externalOpenSource")}</a>` : ""}
    </div>
  `;
}

function hasUserWishlistMemory() {
  if (state.saved?.size) return true;
  return Object.values(state.userGames || {}).some((game) =>
    game?.saved || Object.keys(game?.priceWatch?.targets || {}).length > 0,
  );
}

function priceTargetInputValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  return String(Math.round(numeric * 100) / 100);
}

function priceWatchControlHtml(game, { context = "row" } = {}) {
  const region = state.activeRegion;
  if (!game || typeof game.prices?.[region] !== "number") return "";
  const watch = priceWatchRecord(game, region, 0);
  const currency = game.priceMeta?.[region]?.currency || "USD";
  const customTarget = customPriceWatchTarget(game, region);
  const activeTarget = priceWatchTarget(game, region);
  const targetCopy = formatMoney(activeTarget, currency);
  const currentCopy = formatMoney(watch.currentPrice, currency);
  const deltaCopy = typeof watch.targetDelta === "number" && watch.targetDelta > 0
    ? t("narrative.detail.aboveTarget", { price: formatMoney(watch.targetDelta, currency) })
    : t("narrative.detail.atTarget");
  const statusCopy = watch.isBelowTarget
    ? t("narrative.detail.belowTargetNow", { price: currentCopy })
    : `${currentCopy} / ${deltaCopy}`;
  return `
    <div class="price-alert price-alert--${context} ${watch.isBelowTarget ? "is-triggered" : ""}" data-price-alert>
      <div class="price-alert-summary">
        <span class="price-alert-icon" aria-hidden="true">$</span>
        <div>
          <span>${watch.isBelowTarget ? t("narrative.detail.targetHit") : t("narrative.detail.priceAlert")}</span>
          <strong>${customTarget !== null
            ? t("narrative.detail.alertBelow", { price: targetCopy })
            : t("narrative.detail.usingBudget", { price: targetCopy })}</strong>
          <small>${statusCopy}</small>
        </div>
      </div>
      <div class="price-alert-edit">
        <label>
          <span>${t("narrative.detail.alertBelowLabel")}</span>
          <span class="price-alert-input-wrap">
            <span>${currency}</span>
            <input data-price-target-input type="number" min="1" step="0.01" inputmode="decimal" value="${customTarget !== null ? priceTargetInputValue(customTarget) : ""}" placeholder="${priceTargetInputValue(activeTarget)}" aria-label="${t("narrative.detail.alertInputAria", { title: game.title })}">
          </span>
        </label>
        <div class="price-alert-buttons">
          <button class="price-alert-save" data-price-target-save type="button">${t("narrative.detail.save")}</button>
          ${customTarget !== null ? `<button data-price-target-clear type="button">${t("narrative.detail.clear")}</button>` : ""}
        </div>
      </div>
    </div>
  `;
}

function bindPriceWatchControls(root, game) {
  root.querySelectorAll("[data-price-alert]").forEach((control) => {
    const input = control.querySelector("[data-price-target-input]");
    const saveButton = control.querySelector("[data-price-target-save]");
    const clearButton = control.querySelector("[data-price-target-clear]");
    const saveTarget = () => {
      if (setPriceWatchTarget(game.title, input?.value, state.activeRegion)) {
        render();
        return;
      }
      input?.classList.add("is-invalid");
      input?.focus();
    };
    input?.addEventListener("input", () => input.classList.remove("is-invalid"));
    input?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      saveTarget();
    });
    saveButton?.addEventListener("click", saveTarget);
    clearButton?.addEventListener("click", () => {
      clearPriceWatchTarget(game.title, state.activeRegion);
      render();
    });
  });
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

  els.priceWatchRegion.textContent = wishlistSourceStatus(region);
  const shouldShowFirstStep = activeFilter === "all" && !hasUserWishlistMemory();
  syncFirstTimeCard(els.wishlistDashboard, "wishlist", shouldShowFirstStep);
  renderWishlistDashboard(ranked, records);
  els.wishlistFilterSummary.textContent = wishlistFilterSummary(activeFilter, visibleRecords.length, records.length);
  renderFilterButtons(els.wishlistFilterButtons, activeFilter, "wishlistFilter");
  const priceWatchRows = visibleRecords.length ? visibleRecords.map((record) => {
      const { game, watch } = record;
      const row = document.createElement("div");
      const decision = wishlistDecision(record);
      const status = record.status;
      const currency = game.priceMeta?.[region]?.currency || "USD";
      row.className = `deal-row wishlist-row tone-${decision.tone}`;
      const priceLine = record.hasPrice
        ? `${region} ${formatPrice(game, region)} / ${game.discount[region] || 0}% ${t(status.canConfirm ? "wishlist.priceOff" : "wishlist.priceSignal")}`
        : t("wishlist.priceMissing");
      const watchLine = watch
        ? ` / ${t("wishlist.targetLine", { price: formatMoney(watch.targetPrice, currency) })} / ${historicalLowCopy(watch, currency)}`
        : "";
      const lanes = record.lanes.map(wishlistLaneLabel).join(", ");
      const guard = antiHypeGuard(game, watch, region, currency);
      const guardLine = guard
        ? `<span class="anti-hype-guard guard-${guard.kind}"><strong>${guard.label}</strong> ${guard.detail}</span>`
        : "";
      const sourceNote = wishlistExternalSourceHtml(game, region);
      row.innerHTML = `
        <span class="wishlist-decision">${decision.label}</span>
        <div>
          <strong>${game.title}</strong>
          <span class="deal-price ${status.canConfirm ? "" : "needs-verify"}">${priceLine}</span>
          <span class="deal-reason">${decision.detail}${watchLine} / ${t("wishlist.lanesLine", { lanes })}</span>
          ${guardLine}
          ${sourceNote}
          ${watch ? priceWatchControlHtml(game, { context: "row" }) : ""}
        </div>
        <div class="wishlist-actions">
          <button data-wishlist-detail type="button">${t("wishlist.details")}</button>
          <button class="${record.saved ? "is-selected" : ""}" data-wishlist-state="saved" type="button">${t("wishlist.actionWishlist")}</button>
          <button data-wishlist-state="owned_forever" type="button">${t("wishlist.actionBought")}</button>
          <button data-wishlist-state="hidden" type="button">${t("wishlist.actionHide")}</button>
        </div>
      `;
      row.querySelector("[data-wishlist-detail]").addEventListener("click", () => openGameDetail(game.title));
      row.querySelectorAll("[data-wishlist-state]").forEach((button) => {
        button.addEventListener("click", () => {
          setGameState(game.title, button.dataset.wishlistState);
          render();
        });
      });
      bindPriceWatchControls(row, game);
      return row;
    }) : [
      createQueueEmpty(t("wishlist.emptyTitle"), t("wishlist.emptyDetail")),
    ];
  els.priceWatchList.replaceChildren(...priceWatchRows);
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
      label: t("wishlist.buyOne"),
      title: first.title,
      detail: t("wishlist.buyDetail", {
        region,
        price: formatPrice(first, region),
        reason: dealReason(first),
        risk: first.purchaseRisk,
      }),
      tag: t("wishlist.value", { count: first.purchaseScore }),
    });
  }

  if (first && second) {
    const firstPrice = first.prices[region] || 0;
    const secondPrice = second.prices[region] || 0;
    const pairFitsBudget = firstPrice + secondPrice <= Number(state.budget);
    rows.push({
      label: t(pairFitsBudget ? "wishlist.buyTwo" : "wishlist.secondPick"),
      title: pairFitsBudget ? `${first.title} + ${second.title}` : second.title,
      detail: pairFitsBudget
        ? t("wishlist.bundleDetail")
        : t("wishlist.backupDetail", { title: second.title }),
      tag: t("wishlist.value", { count: first.purchaseScore + second.purchaseScore }),
    });
  }

  const quietWait = accessCount > 0
    ? {
        title: t("wishlist.playFirst", { title: accessOptions[0].title }),
        detail: t("wishlist.accessCover", { count: accessCount }),
        tag: t("wishlist.noSpend"),
      }
    : {
        title: t("wishlist.waitClearer"),
        detail: t("wishlist.waitClearerDetail"),
        tag: t("wishlist.hold"),
      };

  rows.push({
    label: t("wishlist.maybeWait"),
    title: waitCandidate ? waitCandidate.title : quietWait.title,
    detail: waitCandidate
      ? t("wishlist.waitCandidateDetail", { title: waitCandidate.title })
      : quietWait.detail,
    tag: waitCandidate ? t("wishlist.watchPrice") : quietWait.tag,
  });

  els.buyDecisionStatus.textContent = t("wishlist.status", {
    candidates: candidates.length,
    access: accessCount
      ? t("wishlist.accessOptions", { count: accessCount })
      : t("wishlist.noAccessOptions"),
  });
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
  all:     { test: () => true },
  under10: { test: (s) => (s.price ?? Infinity) < 10 },
  big:     { test: (s) => (s.discount ?? 0) >= 50 },
  top:     { test: (s, region, game) => (game?.criticScore ?? 0) >= 80 },
};

let _dealsFilter = "all";

function renderDeals() {
  const region = state.activeRegion;
  const checkedAt = priceSnapshots.find((s) => s.region === region && s.checkedAt)?.checkedAt;
  const freshLabel = checkedAt
    ? t("deals.updated", {
      date: new Date(checkedAt).toLocaleDateString(window.PlaySputnikI18n.getLocale() === "ru" ? "ru-RU" : "en-US"),
    })
    : t("deals.outdated");

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
  els.dealsStatus.textContent = t("deals.status", { count: totalOnSale, freshness: freshLabel });

  // Filter buttons
  els.dealsFilterBtns.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.dealsFilter === _dealsFilter);
  });

  // Render cards
  if (filtered.length === 0) {
    els.dealsGrid.replaceChildren(createQueueEmpty(t("deals.emptyTitle"), t("deals.emptyDetail")));
    els.dealsFooter.textContent = "";
    return;
  }

  els.dealsGrid.replaceChildren(
    ...filtered.map((snap) => {
      const game = gameMap.get(snap.title);
      const card = document.createElement("div");
      card.className = "deal-card";
      const regularStr = snap.regular && snap.regular !== snap.price
        ? `<s class="deal-regular">${snap.currency} ${snap.regular.toFixed(2)}</s>`
        : "";
      const atoms = game?.atoms?.slice(0, 3).map((a) => `<span class="atom-pill">${labelAtom(a)}</span>`).join("") ?? "";
      const score = game?.criticScore ? `<span class="deal-score">${game.criticScore}</span>` : "";
      const spark = priceSparkline(snap.title, region);
      // Anti-hype guard right where a sale tempts: already in PS Plus, or the
      // tracked history shows this "deal" isn't the real low.
      const guard = game ? antiHypeGuard(game, priceWatchRecord(game, region, 0), region, snap.currency) : null;
      // Compact pill in the dense deals grid (full sentence lives in wishlist /
      // the drawer where there's room); title = the full guard detail on hover.
      const guardLine = guard
        ? `<span class="deal-guard guard-${guard.kind}" title="${detailAttr(guard.detail)}">${guard.label}</span>`
        : "";
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
          ${guardLine}
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

  els.dealsFooter.textContent = t("deals.footer", { count: filtered.length, region });
}

function renderDeferredPanels(ranked, primaryGame, ticket) {
  if (ticket !== deferredRenderTicket) return;
  renderTasteMemory();
  renderRecentLearning();
  renderRatingQueue(ranked);
  renderMyGames(ranked);
  renderGameSearch();
  renderGameComparison(ranked);
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
  renderDataQualitySnapshot();
  renderDevHealth();
  renderDataWorkbench();
  renderProviderImports();
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
  document.body.dataset.appViewCurrent = activeView;

  // Localized per-view summary; fall back to the English config for any view
  // not yet in the catalog (t() returns the key on a miss).
  const summaryKey = `views.${activeView}.summary`;
  const localizedSummary = t(summaryKey);
  els.appViewStatus.textContent = localizedSummary === summaryKey ? view.summary : localizedSummary;
  els.appViewTabs.forEach((button) => {
    const isActive = button.dataset.appView === activeView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    button.toggleAttribute("aria-current", isActive);
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
  invalidateSourceLookups();
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

  if (inView("today", "discover")) renderDemoContinuity(ranked);
  if (inView("today", "taste")) renderTasteUnderstoodPanel(ranked);
  if (inView("today", "taste")) renderFirstRunFlow(ranked);
  if (inView("today")) renderTonightTime();
  if (inView("today")) renderCompanionAnswer(ranked);
  if (inView("today")) renderBacklogAmnesty(ranked);
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

// ── Tonight time chips (session planner) ─────────────────────────────────────
document.querySelectorAll("[data-session-minutes]").forEach((chip) => {
  chip.addEventListener("click", () => {
    const minutes = Number(chip.dataset.sessionMinutes) || 0;
    state.sessionMinutes = minutes;
    // Keep the coarse session select coherent with the minute budget
    if (minutes > 0) {
      state.session = minutes <= 45 ? "short" : minutes <= 120 ? "medium" : "long";
    }
    render();
  });
});

function renderTonightTime() {
  const minutes = Number(state.sessionMinutes) || 0;
  document.querySelectorAll("[data-session-minutes]").forEach((chip) => {
    chip.classList.toggle("is-active", Number(chip.dataset.sessionMinutes) === minutes);
  });
  const hint = document.querySelector("#tonight-time-hint");
  if (!hint) return;
  if (!minutes) {
    hint.textContent = "";
    return;
  }
  const ranked = rankedGames();
  const top = ranked[0];
  if (top) {
    const chunk = gameChunkProfile(top);
    hint.textContent = chunk.minutes <= minutes
      ? `${top.title}: ${chunk.label} in ~${chunk.minutes} min — fits.`
      : `${top.title} wants ~${chunk.minutes} min for ${chunk.label}.`;
  }
}

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
  renderTasteImportPreview();
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
  scheduleProviderSearch();
  render();
});
els.gameSearchSubmit.addEventListener("click", () => {
  state.gameSearchQuery = els.gameSearchInput.value;
  runProviderSearch({ force: true });
});
els.gameSearchInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  runProviderSearch({ force: true });
});
els.comparisonRun?.addEventListener("click", () => {
  setComparisonGames(els.comparisonFirst.value, els.comparisonSecond.value);
  render();
});
els.comparisonSwap?.addEventListener("click", () => {
  setComparisonGames(els.comparisonFirst.value, els.comparisonSecond.value);
  swapComparisonGames();
  render();
});
[els.comparisonFirst, els.comparisonSecond].forEach((input) => {
  input?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    setComparisonGames(els.comparisonFirst.value, els.comparisonSecond.value);
    render();
  });
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

function currentTastePayload() {
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
  return { v: TASTE_SHARE_VERSION, atoms: topAtoms, reactions: topReactions };
}

function encodeTastePayload() {
  return btoa(JSON.stringify(currentTastePayload()));
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
    .map(([k]) => (window.labelAtom ? window.labelAtom(k) : k))
    .join(", ");
  const lovedGames = Object.entries(payload.reactions || {})
    .filter(([, reaction]) => reaction === "loved")
    .slice(0, 2)
    .map(([title]) => title)
    .join(", ");
  const top = (topAtoms ? t("taste.shareTop", { atoms: topAtoms }) : "")
    + (lovedGames ? t("taste.shareGames", { games: lovedGames }) : "");
  return t("taste.shareSummary", {
    atoms: atomCount,
    reactions: reactionCount,
    top,
  });
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

// Generate share link + a friendly taste recap ("wrapped") to share alongside it
els.tasteShareBtn.addEventListener("click", () => {
  const url = tasteShareUrl();
  const summary = tasteShareSummary(currentTastePayload());
  if (els.tasteShareSummaryEl) {
    els.tasteShareSummaryEl.textContent = summary;
    els.tasteShareSummaryEl.style.display = "";
  }
  els.tasteShareUrl.textContent = url;
  els.tasteShareUrl.style.display = "";
  els.tasteShareCopy.style.display = "";
  els.tasteShareStatus.textContent = t("taste.shareReady");
  setTimeout(() => { els.tasteShareStatus.textContent = ""; }, 3000);
});

// Copy to clipboard: the recap + the link, ready to paste to a friend
els.tasteShareCopy.addEventListener("click", async () => {
  const url = els.tasteShareUrl.textContent;
  const summary = els.tasteShareSummaryEl?.textContent || "";
  const clip = summary ? `${summary}\n${url}` : url;
  try {
    await navigator.clipboard.writeText(clip);
    els.tasteShareStatus.textContent = `${t("taste.shareCopied")} ✓`;
  } catch {
    els.tasteShareStatus.textContent = t("taste.shareManual");
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
  const renderImportSummary = () => {
    els.tasteImportBannerDesc.textContent = tasteShareSummary(payload);
  };
  renderImportSummary();
  window.PlaySputnikI18n.onLocaleChange(renderImportSummary);
  els.tasteImportBanner.style.display = "";
  els.tasteImportConfirm.addEventListener("click", () => {
    mergeTastePayload(payload);
    els.tasteImportBanner.style.display = "none";
    // Clean URL
    const clean = new URL(window.location.href);
    clean.searchParams.delete(TASTE_SHARE_PARAM);
    history.replaceState(null, "", clean.toString());
    els.tasteShareStatus.textContent = `${t("taste.importMerged")} ✓`;
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
    if (els.wishlistShareStatus) els.wishlistShareStatus.textContent = t("wishlist.shareReady");
    setTimeout(() => { if (els.wishlistShareStatus) els.wishlistShareStatus.textContent = ""; }, 3000);
  });
}

if (els.wishlistShareCopy) {
  els.wishlistShareCopy.addEventListener("click", async () => {
    const url = els.wishlistShareUrl?.textContent || "";
    try {
      await navigator.clipboard.writeText(url);
      if (els.wishlistShareStatus) els.wishlistShareStatus.textContent = `${t("wishlist.shareCopied")} ✓`;
    } catch {
      if (els.wishlistShareStatus) els.wishlistShareStatus.textContent = t("wishlist.shareManual");
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
  const renderImportCopy = () => {
    const sample = payload.titles.slice(0, 3).join(", ");
    const more = payload.titles.length > 3
      ? t("wishlist.importMore", { count: payload.titles.length - 3 })
      : "";
    if (els.wishlistImportBannerSummary) {
      els.wishlistImportBannerSummary.textContent = t("wishlist.importSummary", {
        count: payload.titles.length,
        titles: sample,
        more,
      });
    }
  };
  renderImportCopy();
  window.PlaySputnikI18n.onLocaleChange(renderImportCopy);
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
    btn.title = isDark ? t("system.lightMode") : t("system.darkMode");
    // Keep meta theme-color in sync for mobile chrome
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", isDark ? "#07111f" : "#2563eb");
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

// ── Language toggle ───────────────────────────────────────────────────────────
(function initLanguageToggle() {
  const i18n = window.PlaySputnikI18n;
  const btn = document.querySelector("#lang-toggle");
  if (!i18n || !btn) return;
  // The button shows the language you'll switch TO.
  const sync = () => { btn.textContent = i18n.getLocale() === "ru" ? "EN" : "RU"; };
  sync();
  btn.addEventListener("click", () => {
    i18n.setLocale(i18n.getLocale() === "ru" ? "en" : "ru");
  });
  // setLocale() re-applies static markup; re-render dynamic content + re-sync.
  i18n.onLocaleChange(() => { sync(); try { render(); } catch (e) { /* ignore */ } });
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
  if (payload.editorialRu?.records) editorialRu = payload.editorialRu.records;
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
      editorialRu: ["data/editorial-ru.json", "Russian editorial copy"],
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
    showDataErrorToast(t("system.dataFailed", { message: error.message }));
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
    // titleKey results computed before the alias table arrived are stale
    invalidateTitleKeys();
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
        ? t("system.networkError")
        : error.message || t("system.errorMessage");
    }
    if (els.appErrorStack) els.appErrorStack.textContent = error.stack || error.message || "";
  } else {
    // Fallback to inline message
    els.topPick.innerHTML = `
      <article class="hero-card">
        <div class="hero-body">
          <p class="eyebrow">${t("system.catalogUnavailable")}</p>
          <h3>${t("system.startPreview")}</h3>
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

window.__playsputnikBoot = {
  ...(window.__playsputnikBoot || {}),
  appReadyAt: new Date().toISOString(),
};
document.body.classList.remove("is-app-booting");
document.body.setAttribute("aria-busy", "false");
document.querySelector("#app-boot-overlay")?.setAttribute("hidden", "");

if (
  typeof window !== "undefined"
  && (window.PLAYSPUTNIK_SKIP_INIT || new URLSearchParams(window.location.search).has("skipInit"))
) {
  window.__playsputnikBoot = {
    ...(window.__playsputnikBoot || {}),
    skippedInit: true,
    appLoadedAt: new Date().toISOString(),
  };
} else {
  init();
}
