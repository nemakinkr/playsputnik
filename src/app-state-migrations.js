/* PlaySputnik State Migrations — deterministic upgrades for persisted user profiles */
"use strict";
(function () {
  const CURRENT_STATE_VERSION = 4;

  const migrations = {
    1(state) {
      return {
        ...state,
        quickReactions: state.quickReactions || {},
        calibrationSkips: state.calibrationSkips || {},
      };
    },
    2(state) {
      return {
        ...state,
        comparisonGames: state.comparisonGames || { first: "", second: "" },
        ratingQueue: state.ratingQueue || {},
      };
    },
    3(state) {
      const providerSearch = state.providerSearch && typeof state.providerSearch === "object"
        ? state.providerSearch
        : {};
      return {
        ...state,
        activeView: state.activeView || "today",
        providerSearch: {
          query: "",
          status: "idle",
          provider: "",
          sourceHealth: "",
          results: [],
          error: "",
          ...providerSearch,
          results: Array.isArray(providerSearch.results) ? providerSearch.results : [],
        },
      };
    },
    4(state) {
      const providerSearchCache = state.providerSearchCache && typeof state.providerSearchCache === "object" && !Array.isArray(state.providerSearchCache)
        ? Object.fromEntries(
            Object.entries(state.providerSearchCache).filter(([, record]) => record && typeof record === "object" && Array.isArray(record.results)),
          )
        : {};
      return {
        ...state,
        providerSearchCache,
      };
    },
  };

  function migrateState(savedState) {
    if (!savedState || typeof savedState !== "object" || Array.isArray(savedState)) {
      return { stateVersion: CURRENT_STATE_VERSION };
    }
    let next = { ...savedState };
    let version = Number.isInteger(next.stateVersion) && next.stateVersion >= 0
      ? next.stateVersion
      : 0;
    while (version < CURRENT_STATE_VERSION) {
      const targetVersion = version + 1;
      next = migrations[targetVersion](next);
      next.stateVersion = targetVersion;
      version = targetVersion;
    }
    return next;
  }

  window.PlaySputnikStateMigrations = {
    CURRENT_STATE_VERSION,
    migrateState,
  };
})();
