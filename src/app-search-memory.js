/* PlaySputnik Search Memory Module — turns search results into persisted user memory */
"use strict";
(function () {
  if (!window.PlaySputnikConfig) throw new Error("app-config must load before app-search-memory");

  const { ACCESS_STATES, COMPLETION_STATUS_STATES } = window.PlaySputnikConfig;

  function createSearchMemoryTools({
    getState,
    knownSeedGame,
    titleKey,
    explicitUserGame,
    normalizeUserGameRecord,
    applyStateToUserGame,
    legacyStateFromUserGame,
    setGameState,
    recordUserEvent,
    recordFeedback,
    selectTitleForComparison,
    toggleRatingQueueTitle,
    aiEnrichmentForGame,
  }) {
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
      const state = getState();
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

    function copySearchResultMetadata(target, base) {
      target.source = base.source;
      target.catalogStatus = base.catalogStatus;
      target.matchConfidence = base.matchConfidence;
      target.coverStatus = base.coverStatus;
      target.priceStatus = base.priceStatus;
      target.provider = base.provider;
      target.sourceUrl = base.sourceUrl;
      target.coverUrl = base.coverUrl;
      target.coverLicenseNote = base.coverLicenseNote;
      target.platforms = base.platforms;
      target.atoms = base.atoms;
      target.inferredAtoms = base.inferredAtoms;
      target.vibe = base.vibe;
      target.enrichmentStatus = base.enrichmentStatus;
      target.enrichmentSummary = base.enrichmentSummary;
      target.enrichmentRisk = base.enrichmentRisk;
      target.searchQuery = base.searchQuery;
      target.reconciliation = base.reconciliation;
      target.duplicateOf = base.duplicateOf;
      target.duplicateSource = base.duplicateSource;
      return target;
    }

    function applySearchResultState(result, userState = "saved") {
      if (!result?.title) return null;
      const seed = canonicalSearchResultSeed(result);
      if (seed) {
        setGameState(seed.title, userState);
        recordUserEvent("search_seed_state_changed", seed.title, { source: result.sourceId, state: userState });
        return explicitUserGame(seed.title);
      }

      const state = getState();
      const base = searchResultMemoryRecord(result);
      const key = titleKey(base.title);
      const next = copySearchResultMetadata(applyStateToUserGame(base, userState), base);
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

    function rememberSearchResultWithoutState(result) {
      const seed = canonicalSearchResultSeed(result);
      if (seed) return seed.title;
      const state = getState();
      const record = searchResultMemoryRecord(result);
      state.userGames[titleKey(record.title)] = record;
      return record.title;
    }

    function selectSearchResultForComparison(result) {
      const title = rememberSearchResultWithoutState(result);
      selectTitleForComparison(title, { source: result.sourceId });
    }

    function toggleSearchResultRatingQueue(result) {
      const title = rememberSearchResultWithoutState(result);
      toggleRatingQueueTitle(title, { source: result.sourceId });
    }

    return {
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
    };
  }

  window.PlaySputnikSearchMemory = { createSearchMemoryTools };
})();
