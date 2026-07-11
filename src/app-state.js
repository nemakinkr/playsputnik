(() => {
  function createStateTools({
    config,
    profileGames,
    titleMatches,
    titleKey,
    normalizeTitle,
    emptyNotebook,
    storage,
    stateMigrations,
  }) {
    // Returning users can briefly run a cached HTML shell whose module list
    // predates app-state-migrations.js. Keep that mixed release interactive;
    // the next fresh boot will apply the full migration chain.
    const migrations = stateMigrations || {
      CURRENT_STATE_VERSION: 0,
      migrateState: (savedState) => savedState,
    };
    const {
      STORAGE_KEY,
      QUICK_TASTE_FIRST_TARGET,
      ACCESS_STATES,
      COMPLETION_STATUS_STATES,
    } = config;

    function makeQuickReactions(titles, reaction = "loved") {
      return Object.fromEntries(
        titles
          .filter((title) => profileGames.some((game) => titleMatches(game.title, title)))
          .map((title) => [titleKey(title), { title, reaction, updatedAt: "seed" }]),
      );
    }

    function makeQuickReactionMap(entries) {
      return Object.fromEntries(
        entries
          .filter(({ title }) => profileGames.some((game) => titleMatches(game.title, title)))
          .map(({ title, reaction }) => [titleKey(title), { title, reaction, updatedAt: "seed" }]),
      );
    }

    function defaultState() {
      return {
        stateVersion: migrations.CURRENT_STATE_VERSION,
        liked: new Set(),
        hidden: new Set(),
        saved: new Set(),
        snoozed: new Set(),
        userStates: {},
        userGames: {},
        quickReactions: {},
        calibrationSkips: {},
        comparisonGames: { first: "", second: "" },
        ratingQueue: {},
        entryPath: "quick",
        entryResult: `Mark ${QUICK_TASTE_FIRST_TARGET}+ taste signals to unlock the first hypothesis`,
        activeView: "today",
        activeRegion: "US",
        activeCluster: "play",
        mood: "story",
        session: "short",
        sessionMinutes: 0,
        difficulty: "normal",
        psPlus: true,
        budget: 35,
        ratingImport: "",
        atomWeights: {},
        importedRatings: [],
        notebookImport: "",
        notebook: emptyNotebook(),
        gameSearchQuery: "",
        importLookupQueue: [],
        importLookupResolved: {},
        importLookupBatchSummary: null,
        focusedMemoryTitle: "",
        focusedMemorySurface: "",
        catalogSearch: "",
        catalogAtomFilter: "",
        catalogLengthFilter: "",
        catalogDifficultyFilter: "",
        catalogSort: "score",
        catalogPage: 1,
        visualCatalogShelf: "smart",
        wishlistSort: "score",
        libraryFilter: "all",
        wishlistFilter: "all",
        providerSearch: {
          query: "",
          status: "idle",
          provider: "",
          sourceHealth: "",
          results: [],
          error: "",
        },
        providerSearchCache: {},
        feedbackLog: [],
        userEvents: [],
        dropDecisions: {},
        sessionLog: [],
        aiExplanations: {},
        lastUndo: null,
      };
    }

    function userStateToUserGame(title, userState, updatedAt = new Date().toISOString(), source = "manual") {
      const record = {
        title,
        access: "",
        completionStatus: "",
        saved: false,
        hidden: false,
        source,
        updatedAt,
      };

      if (ACCESS_STATES.includes(userState)) record.access = userState;
      if (COMPLETION_STATUS_STATES.includes(userState)) record.completionStatus = userState;
      if (userState === "saved") record.saved = true;
      if (userState === "hidden") record.hidden = true;
      return record;
    }

    function normalizeAmnestyRecord(record) {
      if (!record || typeof record !== "object") return null;
      const numberOrZero = (value) => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
      return {
        impressions: numberOrZero(record.impressions),
        skips: numberOrZero(record.skips),
        dismissedSkips: numberOrZero(record.dismissedSkips),
        lastSeenAt: record.lastSeenAt || null,
        lastSkippedAt: record.lastSkippedAt || null,
        dismissedAt: record.dismissedAt || null,
        archivedAt: record.archivedAt || null,
        restoredAt: record.restoredAt || null,
      };
    }

    function normalizePriceWatchRecord(record) {
      if (!record || typeof record !== "object") return null;
      const targets = {};
      if (record.targets && typeof record.targets === "object") {
        Object.entries(record.targets).forEach(([region, value]) => {
          const numeric = Number(value);
          if (region && Number.isFinite(numeric) && numeric > 0) {
            targets[region] = Math.round(numeric * 100) / 100;
          }
        });
      }
      const legacyTarget = Number(record.targetPrice);
      if (record.region && Number.isFinite(legacyTarget) && legacyTarget > 0) {
        targets[record.region] = Math.round(legacyTarget * 100) / 100;
      }
      if (!Object.keys(targets).length) return null;
      return {
        targets,
        updatedAt: record.updatedAt || null,
      };
    }

    function normalizePlainObject(record) {
      return record && typeof record === "object" && !Array.isArray(record) ? record : null;
    }

    function normalizeUserGameRecord(record, fallbackTitle = "") {
      if (!record) return null;
      const title = record.title || fallbackTitle;
      if (!title) return null;
      const legacyState = record.state || "";
      const legacyRecord = legacyState ? userStateToUserGame(title, legacyState, record.updatedAt, record.source || "legacy_state") : {};
      return {
        title,
        access: ACCESS_STATES.includes(record.access) ? record.access : legacyRecord.access || "",
        completionStatus: COMPLETION_STATUS_STATES.includes(record.completionStatus)
          ? record.completionStatus
          : legacyRecord.completionStatus || "",
        saved: Boolean(record.saved || legacyRecord.saved),
        hidden: Boolean(record.hidden || legacyRecord.hidden),
        rating: typeof record.rating === "number" ? record.rating : null,
        hoursPlayed: typeof record.hoursPlayed === "number" ? record.hoursPlayed : null,
        startedAt: record.startedAt || null,
        completedAt: record.completedAt || null,
        lastActivityAt: record.lastActivityAt || null,
        catalogStatus: record.catalogStatus || "",
        matchConfidence: record.matchConfidence || "",
        coverStatus: record.coverStatus || "",
        priceStatus: record.priceStatus || "",
        provider: record.provider || "",
        sourceUrl: record.sourceUrl || "",
        coverUrl: record.coverUrl || "",
        coverLicenseNote: record.coverLicenseNote || "",
        platforms: Array.isArray(record.platforms) ? record.platforms : [],
        atoms: Array.isArray(record.atoms) ? record.atoms : [],
        inferredAtoms: Array.isArray(record.inferredAtoms) ? record.inferredAtoms : [],
        vibe: record.vibe || "",
        enrichmentStatus: record.enrichmentStatus || "",
        enrichmentSummary: record.enrichmentSummary || "",
        enrichmentRisk: record.enrichmentRisk || "",
        searchQuery: record.searchQuery || "",
        reconciliation: record.reconciliation || null,
        duplicateOf: record.duplicateOf || "",
        duplicateSource: record.duplicateSource || "",
        sourcePassport: normalizePlainObject(record.sourcePassport),
        providerImport: normalizePlainObject(record.providerImport),
        amnesty: normalizeAmnestyRecord(record.amnesty),
        priceWatch: normalizePriceWatchRecord(record.priceWatch),
        source: record.source || legacyRecord.source || "manual",
        updatedAt: record.updatedAt || legacyRecord.updatedAt || new Date().toISOString(),
      };
    }

    function legacyStateFromUserGame(record) {
      if (!record) return "";
      if (record.hidden) return "hidden";
      if (record.completionStatus) return record.completionStatus;
      if (record.access) return record.access;
      if (record.saved) return "saved";
      return "";
    }

    function hydrateUserGames(savedState = {}) {
      const records = {};
      Object.entries(savedState.userGames || {}).forEach(([key, record]) => {
        const normalized = normalizeUserGameRecord(record);
        if (normalized) records[key] = normalized;
      });

      Object.values(savedState.userStates || {}).forEach((entry) => {
        const key = titleKey(entry.title);
        if (!records[key]) {
          records[key] = normalizeUserGameRecord(entry, entry.title);
        }
      });

      (savedState.saved || []).forEach((title) => {
        const key = titleKey(title);
        if (!records[key]) records[key] = userStateToUserGame(title, "saved", "legacy_set", "legacy_saved");
      });

      (savedState.hidden || []).forEach((title) => {
        const key = titleKey(title);
        if (!records[key]) records[key] = userStateToUserGame(title, "hidden", "legacy_set", "legacy_hidden");
      });

      return records;
    }

    function loadState() {
      try {
        const rawSaved = JSON.parse(storage.getItem(STORAGE_KEY));
        if (!rawSaved) return defaultState();
        const saved = migrations.migrateState(rawSaved);
        return {
          ...defaultState(),
          ...saved,
          liked: new Set(saved.liked || []),
          hidden: new Set(saved.hidden || []),
          saved: new Set(saved.saved || []),
          snoozed: new Set(saved.snoozed || []),
          userStates: saved.userStates || {},
          userGames: hydrateUserGames(saved),
          quickReactions: saved.quickReactions || makeQuickReactions(saved.liked || []),
          calibrationSkips: saved.calibrationSkips || {},
          comparisonGames: saved.comparisonGames || { first: "", second: "" },
          ratingQueue: saved.ratingQueue || {},
          providerSearchCache: saved.providerSearchCache && typeof saved.providerSearchCache === "object" && !Array.isArray(saved.providerSearchCache)
            ? saved.providerSearchCache
            : {},
          atomWeights: saved.atomWeights || {},
          importedRatings: saved.importedRatings || [],
          notebook: saved.notebook || emptyNotebook(),
          feedbackLog: saved.feedbackLog || [],
          userEvents: saved.userEvents || [],
          dropDecisions: saved.dropDecisions || {},
          sessionLog: saved.sessionLog || [],
          aiExplanations: saved.aiExplanations || {},
          lastUndo: saved.lastUndo || null,
        };
      } catch {
        return defaultState();
      }
    }

    function saveState(state) {
      storage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...state,
          stateVersion: migrations.CURRENT_STATE_VERSION,
          liked: [...state.liked],
          hidden: [...state.hidden],
          saved: [...state.saved],
          snoozed: [...state.snoozed],
        }),
      );
    }

    function explicitUserGame(state, title) {
      const key = titleKey(title);
      return state.userGames[key]
        || state.userGames[normalizeTitle(title)]
        || normalizeUserGameRecord(state.userStates[key], title)
        || normalizeUserGameRecord(state.userStates[normalizeTitle(title)], title);
    }

    function recordUserEvent(state, type, title, detail = {}) {
      state.userEvents = [
        { type, title, detail, at: new Date().toISOString() },
        ...(state.userEvents || []),
      ].slice(0, 50);
    }

    function applyStateToUserGame(record, userState) {
      const next = normalizeUserGameRecord(record) || {};
      if (ACCESS_STATES.includes(userState)) {
        next.access = userState;
        next.saved = false;
        next.hidden = false;
      } else if (COMPLETION_STATUS_STATES.includes(userState)) {
        next.completionStatus = userState;
        next.hidden = false;
        if (["completed", "dropped"].includes(userState)) {
          next.saved = false;
          if (userState === "completed" && !next.completedAt) next.completedAt = new Date().toISOString();
        }
      } else if (userState === "saved") {
        next.saved = true;
        next.hidden = false;
      } else if (userState === "hidden") {
        next.hidden = true;
        next.saved = false;
      }
      next.updatedAt = new Date().toISOString();
      next.source = "manual";
      return next;
    }

    function titleStateSnapshot(state, title) {
      const key = titleKey(title);
      return {
        key,
        title,
        userState: state.userStates[key] ? { ...state.userStates[key] } : null,
        userGame: state.userGames[key] ? { ...state.userGames[key] } : null,
        hidden: state.hidden.has(title),
        saved: state.saved.has(title),
        snoozed: state.snoozed.has(title),
      };
    }

    function restoreSetMembership(collection, title, shouldHave) {
      if (shouldHave) collection.add(title);
      else collection.delete(title);
    }

    return {
      makeQuickReactions,
      makeQuickReactionMap,
      defaultState,
      loadState,
      saveState,
      userStateToUserGame,
      normalizeUserGameRecord,
      legacyStateFromUserGame,
      hydrateUserGames,
      explicitUserGame,
      recordUserEvent,
      applyStateToUserGame,
      titleStateSnapshot,
      restoreSetMembership,
    };
  }

  window.PlaySputnikState = { createStateTools };
})();
