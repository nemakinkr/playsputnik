/* PlaySputnik Detail Module — game detail data, price summary, status cards, action classes */
"use strict";
(function () {
  if (!window.PlaySputnikConfig) throw new Error("app-config must load before app-detail");
  if (!window.PlaySputnikEnrichment) throw new Error("app-enrichment must load before app-detail");
  if (!window.PlaySputnikRecommend) throw new Error("app-recommend must load before app-detail");
  if (!window.PlaySputnikRanking) throw new Error("app-ranking must load before app-detail");
  if (!window.PlaySputnikWishlist) throw new Error("app-wishlist must load before app-detail");
  if (!window.PlaySputnikLibrary) throw new Error("app-library must load before app-detail");

  const { USER_STATE_LABELS, ACCESS_STATES, COMPLETION_STATUS_STATES } = window.PlaySputnikConfig;

  function createDetailTools({
    getState,
    getRecommendationPool,
    getSourceGames,
    getGlobalSearchResults,
    getExplicitUserGame,
    getRankedGames,
    getSearchResultMemoryRecord,
    getAiEnrichmentForGame,
    // from enrichment module
    uniqueCompact,
    // from search module
    titleMatches,
    // from score module
    scoreGame,
    // from recommend module
    effectiveUserGame,
    priceStatus,
    priceCanGuideBuy,
    formatPrice,
    // from wishlist module
    priceWatchRecord,
    historicalLowCopy,
    // from library module
    personalRatingFacet,
  }) {
    function normalizeDetailGame(game, title = "") {
      const base = {
        title: title || "Unknown game",
        atoms: [],
        vibe: "Game memory item",
        session: "medium",
        difficulty: "normal",
        length: "unknown",
        commitment: "medium",
        tone: "unknown",
        content: "unknown",
        reviewBurden: "unknown",
        adultTimeFit: "flexible",
        prices: {},
        discount: {},
        priceMeta: {},
        priceHistory: {},
        psPlus: [],
        subscriptionMeta: {},
        coverMeta: null,
        color: "linear-gradient(135deg, #27313f, #7aa2ff)",
      };
      const merged = { ...base, ...(game || {}) };
      return {
        ...merged,
        atoms: Array.isArray(merged.atoms) ? merged.atoms : [],
        prices: merged.prices || {},
        discount: merged.discount || {},
        priceMeta: merged.priceMeta || {},
        priceHistory: merged.priceHistory || {},
        psPlus: Array.isArray(merged.psPlus) ? merged.psPlus : [],
        subscriptionMeta: merged.subscriptionMeta || {},
      };
    }

    function searchResultDetailGame(result) {
      const memory = getSearchResultMemoryRecord(result);
      const enrichment = getAiEnrichmentForGame({ ...result, ...memory });
      const session = enrichment.session === "unknown" ? "medium" : enrichment.session;
      const atoms = uniqueCompact([
        ...(memory.atoms || []),
        ...(memory.inferredAtoms || []),
        ...enrichment.atoms,
      ], 6);
      return normalizeDetailGame({
        title: memory.title,
        atoms,
        vibe: result.vibe || enrichment.summary || result.reason || "Search candidate",
        session,
        difficulty: "normal",
        length: session === "short" ? "short" : session === "long" ? "long" : "medium",
        commitment: session === "long" ? "long" : "medium",
        tone: result.sourceId === "seed_catalog" ? "known" : "unverified",
        content: "unknown",
        reviewBurden: result.sourceId === "manual_unverified" ? "high" : "medium",
        adultTimeFit: session === "short" ? "weeknight" : "flexible",
        recommendationLane: result.sourceId === "catalog_backbone" ? "catalog" : "external",
        externalCandidate: result.sourceId !== "seed_catalog",
        externalMeta: memory,
        searchResult: result,
        coverMeta: {
          title: memory.title,
          status: result.coverStatus || memory.coverStatus || "missing",
          source: memory.provider || memory.source || result.sourceId || "search_result",
          sourceUrl: memory.sourceUrl,
          url: memory.coverUrl,
          checkedAt: memory.updatedAt,
          licenseNote: memory.coverLicenseNote || "Search result candidate; verify source before production use.",
        },
      }, memory.title);
    }

    function detailGameForTitle(title) {
      if (!title) return null;
      const pool = [...getRecommendationPool(), ...getSourceGames()];
      const found = pool.find((game) => titleMatches(game.title, title));
      const memory = getExplicitUserGame(title);
      const searchResult = getGlobalSearchResults().find((result) => titleMatches(result.title, title));
      if (found) return normalizeDetailGame(found, title);
      if (memory) {
        return normalizeDetailGame({
          title: memory.title,
          atoms: memory.atoms.length ? memory.atoms : memory.inferredAtoms,
          vibe: memory.vibe || memory.enrichmentSummary || "Saved game memory",
          externalMeta: memory,
          coverMeta: memory.coverUrl ? {
            title: memory.title,
            status: memory.coverStatus || "candidate",
            source: memory.provider || memory.source || "search_memory",
            sourceUrl: memory.sourceUrl,
            url: memory.coverUrl,
            licenseNote: memory.coverLicenseNote,
          } : null,
        }, title);
      }
      if (searchResult) return searchResultDetailGame(searchResult);
      return normalizeDetailGame({ title }, title);
    }

    function detailScoredGame(game) {
      const ranked = getRankedGames();
      const rankedMatch = ranked.find((item) => titleMatches(item.title, game.title));
      return { ...game, score: rankedMatch?.score ?? scoreGame(game) };
    }

    function detailPriceSummary(game) {
      const state = getState();
      const region = state.activeRegion;
      const hasPrice = typeof game.prices?.[region] === "number";
      if (!hasPrice) return { label: "Price", value: "Missing", detail: "No usable price source yet." };
      const status = priceStatus(game, region);
      const discount = game.discount?.[region] || 0;
      const watch = priceCanGuideBuy(game, region) ? priceWatchRecord(game, region, 0) : null;
      const currency = game.priceMeta?.[region]?.currency || "USD";
      const editionPriceNote = game.priceCanonicalTitle && game.priceCanonicalTitle !== game.title
        ? ` / tracked via ${game.priceCanonicalTitle}`
        : "";
      return {
        label: `${region} price`,
        value: formatPrice(game, region),
        detail: `${discount}% ${status.canConfirm ? "off" : "signal"}${watch ? ` / ${historicalLowCopy(watch, currency)}` : ""}${editionPriceNote}`,
      };
    }

    function detailStatusCards(game) {
      const userGame = effectiveUserGame(game) || {};
      const rating = personalRatingFacet(game);
      const price = detailPriceSummary(game);
      return [
        {
          label: "Access",
          value: userGame.access ? USER_STATE_LABELS[userGame.access] || userGame.access : userGame.saved ? "Wishlist" : "No access",
          tone: userGame.access ? "access" : userGame.saved ? "wishlist" : "empty",
        },
        {
          label: "Progress",
          value: userGame.completionStatus
            ? USER_STATE_LABELS[userGame.completionStatus] || userGame.completionStatus
            : userGame.hidden ? "Hidden" : "Not started",
          tone: userGame.completionStatus ? "progress" : userGame.hidden ? "hidden" : "empty",
        },
        {
          label: "Rating",
          value: rating.label,
          tone: rating.source === "Manual" ? "rating" : rating.source === "Import" ? "imported" : "empty",
        },
        {
          label: price.label,
          value: price.value,
          detail: price.detail,
          tone: price.value === "Missing" ? "empty" : "price",
        },
      ];
    }

    function detailActionClass(game, actionState) {
      const userGame = effectiveUserGame(game) || {};
      if (ACCESS_STATES.includes(actionState)) return userGame.access === actionState ? "is-active" : "";
      if (COMPLETION_STATUS_STATES.includes(actionState)) return userGame.completionStatus === actionState ? "is-active" : "";
      if (actionState === "saved") return userGame.saved ? "is-active" : "";
      if (actionState === "hidden") return userGame.hidden ? "is-active" : "";
      return "";
    }

    return {
      normalizeDetailGame,
      searchResultDetailGame,
      detailGameForTitle,
      detailScoredGame,
      detailPriceSummary,
      detailStatusCards,
      detailActionClass,
    };
  }

  window.PlaySputnikDetail = { createDetailTools };
})();
