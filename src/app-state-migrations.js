/* PlaySputnik State Migrations — deterministic upgrades for persisted user profiles */
"use strict";
(function () {
  const CURRENT_STATE_VERSION = 11;

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
    5(state) {
      const currentShape = "search-result-v3";
      const providerSearch = state.providerSearch && typeof state.providerSearch === "object"
        ? state.providerSearch
        : {};
      const providerSearchCache = Object.fromEntries(
        Object.entries(state.providerSearchCache || {}).filter(([, record]) => (
          record?.resultShapeVersion === currentShape && Array.isArray(record.results)
        )),
      );
      return {
        ...state,
        providerSearch: providerSearch.resultShapeVersion === currentShape
          ? providerSearch
          : { query: "", status: "idle", provider: "", sourceHealth: "", results: [], error: "" },
        providerSearchCache,
      };
    },
    6(state) {
      const legacyTitleKey = (title) => String(title || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
        .trim();
      const queue = Array.isArray(state.importLookupQueue)
        ? state.importLookupQueue.map((title) => String(title || "").trim()).filter(Boolean)
        : [];
      const resolved = state.importLookupResolved && typeof state.importLookupResolved === "object" && !Array.isArray(state.importLookupResolved)
        ? state.importLookupResolved
        : {};
      const existingItems = state.importLookupItems && typeof state.importLookupItems === "object" && !Array.isArray(state.importLookupItems)
        ? state.importLookupItems
        : {};
      const importLookupItems = { ...existingItems };
      queue.forEach((title) => {
        const legacyKey = legacyTitleKey(title);
        const matchingKey = Object.keys(resolved).find((key) => key === legacyKey);
        if (!importLookupItems[legacyKey]) {
          importLookupItems[legacyKey] = {
            title,
            kind: "lookup",
            status: matchingKey && resolved[matchingKey] ? "resolved" : "pending",
            attempts: 0,
            updatedAt: null,
          };
        }
      });
      return {
        ...state,
        importLookupQueue: queue,
        importLookupResolved: resolved,
        importLookupItems,
        importLookupBatchSummary: state.importLookupBatchSummary && typeof state.importLookupBatchSummary === "object"
          ? state.importLookupBatchSummary
          : null,
      };
    },
    7(state) {
      return {
        ...state,
        aiImportDraft: state.aiImportDraft && typeof state.aiImportDraft === "object" && !Array.isArray(state.aiImportDraft)
          ? state.aiImportDraft
          : null,
        aiTodayRerank: state.aiTodayRerank && typeof state.aiTodayRerank === "object" && !Array.isArray(state.aiTodayRerank)
          ? state.aiTodayRerank
          : null,
      };
    },
    8(state) {
      const userGames = Object.fromEntries(Object.entries(state.userGames || {}).map(([key, record]) => {
        if (!record || typeof record !== "object" || Array.isArray(record)) return [key, record];
        const progress = record.playProgress && typeof record.playProgress === "object" && !Array.isArray(record.playProgress)
          ? record.playProgress
          : {};
        return [key, {
          ...record,
          playProgress: {
            sessionCount: Math.max(0, Math.floor(Number(progress.sessionCount) || 0)),
            totalMinutes: Math.max(0, Math.round(Number(progress.totalMinutes) || 0)),
            lastSessionMinutes: Math.max(0, Math.round(Number(progress.lastSessionMinutes) || 0)),
            lastPlayedAt: progress.lastPlayedAt || null,
            lastOutcome: progress.lastOutcome || "",
          },
        }];
      }));
      return {
        ...state,
        userGames,
        providerEnrichmentQueue: Array.isArray(state.providerEnrichmentQueue) ? state.providerEnrichmentQueue : [],
        providerEnrichmentResolved: state.providerEnrichmentResolved && typeof state.providerEnrichmentResolved === "object" ? state.providerEnrichmentResolved : {},
        providerEnrichmentItems: state.providerEnrichmentItems && typeof state.providerEnrichmentItems === "object" ? state.providerEnrichmentItems : {},
        providerEnrichmentSummary: state.providerEnrichmentSummary && typeof state.providerEnrichmentSummary === "object" ? state.providerEnrichmentSummary : null,
        providerEnrichmentBudget: state.providerEnrichmentBudget && typeof state.providerEnrichmentBudget === "object"
          ? state.providerEnrichmentBudget
          : { date: "", used: 0, cap: 20 },
      };
    },
    9(state) {
      const userGames = Object.fromEntries(Object.entries(state.userGames || {}).map(([key, record]) => {
        if (!record || typeof record !== "object" || Array.isArray(record)) return [key, record];
        const progress = record.playProgress && typeof record.playProgress === "object" && !Array.isArray(record.playProgress)
          ? record.playProgress
          : {};
        const sessions = (Array.isArray(progress.sessions) ? progress.sessions : [])
          .map((session) => ({
            minutes: Math.max(1, Math.round(Number(session?.minutes) || 0)),
            playedAt: session?.playedAt || null,
          }))
          .filter((session) => session.playedAt)
          .slice(0, 30);
        return [key, { ...record, playProgress: { ...progress, sessions } }];
      }));
      return {
        ...state,
        userGames,
        continuityFocusTitle: String(state.continuityFocusTitle || ""),
      };
    },
    10(state) {
      const userEvents = (Array.isArray(state.userEvents) ? state.userEvents : [])
        .filter((event) => event && typeof event === "object")
        .map((event, index) => {
          const occurredAt = event.occurredAt || event.at || new Date(0).toISOString();
          const detail = event.payload && typeof event.payload === "object"
            ? event.payload
            : event.detail && typeof event.detail === "object" ? event.detail : {};
          return {
            schemaVersion: 1,
            id: event.id || `legacy:${event.type || "event"}:${index}:${occurredAt}`,
            type: event.type || "memory.updated",
            category: event.category || "memory",
            title: String(event.title || ""),
            occurredAt,
            at: occurredAt,
            source: event.source && typeof event.source === "object"
              ? event.source
              : { kind: "user", name: "", url: "", checkedAt: null },
            payload: detail,
            detail,
            action: event.action && typeof event.action === "object" ? event.action : null,
            delivery: event.delivery || "internal",
          };
        })
        .slice(0, 100);
      const daily = state.dailyBriefing && typeof state.dailyBriefing === "object" ? state.dailyBriefing : {};
      return {
        ...state,
        userEvents,
        dailyBriefing: {
          date: String(daily.date || ""),
          actions: Array.isArray(daily.actions) ? daily.actions.slice(0, 20) : [],
          completedAt: daily.completedAt || null,
        },
      };
    },
    11(state) {
      const meta = state.syncMeta && typeof state.syncMeta === "object" ? state.syncMeta : {};
      return {
        ...state,
        syncMeta: {
          profileId: String(meta.profileId || ""),
          revision: Math.max(0, Math.floor(Number(meta.revision) || 0)),
          baseRevision: Math.max(0, Math.floor(Number(meta.baseRevision) || 0)),
          updatedAt: meta.updatedAt || null,
          lastPayloadHash: String(meta.lastPayloadHash || ""),
          lastSyncedRevision: Math.max(0, Math.floor(Number(meta.lastSyncedRevision) || 0)),
          lastSyncedAt: meta.lastSyncedAt || null,
        },
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
