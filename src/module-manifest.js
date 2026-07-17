/* PlaySputnik Module Manifest — one source of truth for boot and offline cache order */
"use strict";
(function (root) {
  const modules = [
    [0, "src/app-i18n.js", "PlaySputnikI18n", "Localization engine"],
    [1, "src/i18n-en.js", "", "English message catalog"],
    [1, "src/i18n-ru.js", "", "Russian message catalog"],
    [1, "src/app-storage.js", "PlaySputnikStorage", "IndexedDB and localStorage adapter"],
    [1, "src/app-config.js", "PlaySputnikConfig", "Application configuration and constants"],
    [1, "src/app-state-migrations.js", "PlaySputnikStateMigrations", "Persisted state schema migrations"],
    [1, "src/app-state.js", "PlaySputnikState", "State defaults, hydration, and persistence"],
    [1, "src/app-search.js", "PlaySputnikSearch", "Title identity and search normalization"],
    [1, "src/app-enrichment.js", "PlaySputnikEnrichment", "External metadata normalization"],
    [1, "src/app-score.js", "PlaySputnikScore", "Taste and session scoring"],
    [1, "src/app-decisions.js", "PlaySputnikDecisions", "Comparison and rate-later workflows"],
    [1, "src/app-import.js", "PlaySputnikImport", "Text import parsing"],
    [2, "src/app-onboarding.js", "PlaySputnikOnboarding", "Taste onboarding logic"],
    [2, "src/app-radar.js", "PlaySputnikRadar", "Taste radar calculations"],
    [2, "src/app-recommend.js", "PlaySputnikRecommend", "Recommendation evidence and forecasts"],
    [2, "src/app-session.js", "PlaySputnikSession", "Session tracking"],
    [2, "src/app-continuity.js", "PlaySputnikContinuity", "Started-game progress and return loop"],
    [2, "src/app-hltb.js", "PlaySputnikHltb", "Time and value calculations"],
    [2, "src/app-ai.js", "PlaySputnikAi", "Optional AI narrative client and cache"],
    [3, "src/app-entry.js", "PlaySputnikEntry", "Entry-route decisions"],
    [3, "src/app-ranking.js", "PlaySputnikRanking", "Catalog ranking"],
    [3, "src/app-answer.js", "PlaySputnikAnswer", "Companion answer composition"],
    [3, "src/app-cover.js", "PlaySputnikCover", "Cover resolution and attribution"],
    [3, "src/app-dev.js", "PlaySputnikDev", "Diagnostics and development health"],
    [3, "src/app-sync.js", "PlaySputnikSync", "Portable profile envelopes and sync conflict contracts"],
    [4, "src/app-library.js", "PlaySputnikLibrary", "Library queues and decisions"],
    [4, "src/app-briefing.js", "PlaySputnikBriefing", "Unified daily companion agenda"],
    [4, "src/app-events.js", "PlaySputnikEvents", "Companion event and future notification contracts"],
    [4, "src/app-visual.js", "PlaySputnikVisual", "Catalog filtering and visual state"],
    [4, "src/app-provider-import.js", "PlaySputnikProviderImport", "Provider import metadata and review actions"],
    [4, "src/app-search-memory.js", "PlaySputnikSearchMemory", "Search-result memory workflows"],
    [4, "src/app-import-resolution.js", "PlaySputnikImportResolution", "Batch provider resolution for imported titles"],
    [4, "src/app-memory-focus.js", "PlaySputnikMemoryFocus", "Search-to-library focus handoff"],
    [4, "src/app-wishlist.js", "PlaySputnikWishlist", "Wishlist and buy guardrails"],
    [4, "src/app-cards.js", "PlaySputnikCards", "Shared game-card rendering"],
    [4, "src/app-data-panel.js", "PlaySputnikDataPanel", "Data workbench rendering"],
    [4, "src/app-export.js", "PlaySputnikExport", "Profile import and export"],
    [5, "src/app-detail.js", "PlaySputnikDetail", "Game-detail decision logic"],
    [5, "src/app-detail-view.js", "PlaySputnikDetailView", "Game-detail markup composition"],
  ].map(([phase, path, global, role]) => Object.freeze({ phase, path, global, role }));

  root.PlaySputnikModules = Object.freeze(modules);
  root.PlaySputnikModulePhases = Object.freeze(
    [...new Set(modules.map(({ phase }) => phase))]
      .sort((a, b) => a - b)
      .map((phase) => Object.freeze(modules.filter((module) => module.phase === phase))),
  );
})(typeof self !== "undefined" ? self : globalThis);
