/* PlaySputnik Module Manifest — one source of truth for boot and offline cache order */
"use strict";
(function (root) {
  const modules = [
    ["src/app-i18n.js", "PlaySputnikI18n", "Localization engine"],
    ["src/i18n-en.js", "", "English message catalog"],
    ["src/i18n-ru.js", "", "Russian message catalog"],
    ["src/app-storage.js", "PlaySputnikStorage", "IndexedDB and localStorage adapter"],
    ["src/app-config.js", "PlaySputnikConfig", "Application configuration and constants"],
    ["src/app-state-migrations.js", "PlaySputnikStateMigrations", "Persisted state schema migrations"],
    ["src/app-state.js", "PlaySputnikState", "State defaults, hydration, and persistence"],
    ["src/app-search.js", "PlaySputnikSearch", "Title identity and search normalization"],
    ["src/app-enrichment.js", "PlaySputnikEnrichment", "External metadata normalization"],
    ["src/app-onboarding.js", "PlaySputnikOnboarding", "Taste onboarding logic"],
    ["src/app-entry.js", "PlaySputnikEntry", "Entry-route decisions"],
    ["src/app-score.js", "PlaySputnikScore", "Taste and session scoring"],
    ["src/app-radar.js", "PlaySputnikRadar", "Taste radar calculations"],
    ["src/app-recommend.js", "PlaySputnikRecommend", "Recommendation evidence and forecasts"],
    ["src/app-ranking.js", "PlaySputnikRanking", "Catalog ranking"],
    ["src/app-answer.js", "PlaySputnikAnswer", "Companion answer composition"],
    ["src/app-decisions.js", "PlaySputnikDecisions", "Comparison and rate-later workflows"],
    ["src/app-library.js", "PlaySputnikLibrary", "Library queues and decisions"],
    ["src/app-visual.js", "PlaySputnikVisual", "Catalog filtering and visual state"],
    ["src/app-wishlist.js", "PlaySputnikWishlist", "Wishlist and buy guardrails"],
    ["src/app-detail.js", "PlaySputnikDetail", "Game-detail decision logic"],
    ["src/app-cover.js", "PlaySputnikCover", "Cover resolution and attribution"],
    ["src/app-dev.js", "PlaySputnikDev", "Diagnostics and development health"],
    ["src/app-session.js", "PlaySputnikSession", "Session tracking"],
    ["src/app-hltb.js", "PlaySputnikHltb", "Time and value calculations"],
    ["src/app-ai.js", "PlaySputnikAi", "Optional AI narrative client and cache"],
    ["src/app-cards.js", "PlaySputnikCards", "Shared game-card rendering"],
    ["src/app-data-panel.js", "PlaySputnikDataPanel", "Data workbench rendering"],
    ["src/app-import.js", "PlaySputnikImport", "Text import parsing"],
    ["src/app-export.js", "PlaySputnikExport", "Profile import and export"],
  ].map(([path, global, role]) => Object.freeze({ path, global, role }));

  root.PlaySputnikModules = Object.freeze(modules);
})(typeof self !== "undefined" ? self : globalThis);
