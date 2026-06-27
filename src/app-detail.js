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
    formatMoney,
    // from wishlist module
    priceWatchRecord,
    historicalLowCopy,
    // from library module
    personalRatingFacet,
  }) {
    function localizedState(value) {
      const keys = {
        owned: "narrative.recommend.stateOwned",
        owned_forever: "narrative.recommend.stateForever",
        subscription: "narrative.recommend.stateSubscription",
        playing: "narrative.recommend.statePlaying",
        paused: "narrative.recommend.statePaused",
        want_to_finish: "narrative.recommend.stateFinish",
        completed: "narrative.recommend.stateCompleted",
        dropped: "narrative.recommend.stateDropped",
        saved: "narrative.recommend.stateSaved",
        hidden: "narrative.recommend.stateHidden",
      };
      return keys[value] ? t(keys[value]) : USER_STATE_LABELS[value] || value;
    }

    function normalizeDetailGame(game, title = "") {
      const base = {
        title: title || t("narrative.detail.gameFallback"),
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

    // Deterministic "don't pay full price now" guard (mirrors app.js / wishlist):
    // already in PS Plus, or tracked history shows it was meaningfully cheaper.
    function antiHypeGuard(game, watch, region, currency = "USD") {
      const sub = game.subscriptionMeta?.[region];
      if (sub && sub.tier) {
        return { kind: "plus", label: t("wishlist.guardPlusLabel"), detail: t("wishlist.guardPlus", { tier: sub.tier }) };
      }
      if (watch && watch.historyCount >= 2
          && typeof watch.historicalLow === "number" && typeof watch.currentPrice === "number"
          && !watch.isHistoricalLow && watch.historicalLow <= watch.currentPrice * 0.8) {
        return { kind: "wait", label: t("wishlist.guardWaitLabel"), detail: t("wishlist.guardWait", { low: formatMoney(watch.historicalLow, currency) }) };
      }
      return null;
    }

    function detailPriceSummary(game) {
      const state = getState();
      const region = state.activeRegion;
      const hasPrice = typeof game.prices?.[region] === "number";
      if (!hasPrice) {
        return {
          label: t("narrative.detail.price"),
          value: t("narrative.detail.missing"),
          detail: t("narrative.detail.noPriceSource"),
        };
      }
      const status = priceStatus(game, region);
      const discount = game.discount?.[region] || 0;
      const watch = priceCanGuideBuy(game, region) ? priceWatchRecord(game, region, 0) : null;
      const currency = game.priceMeta?.[region]?.currency || "USD";
      const editionPriceNote = game.priceCanonicalTitle && game.priceCanonicalTitle !== game.title
        ? ` / ${t("narrative.detail.trackedVia", { title: game.priceCanonicalTitle })}`
        : "";
      // Anti-hype buy guard, same signals as the wishlist rows: already in PS
      // Plus, or tracked history shows it was meaningfully cheaper.
      const guard = antiHypeGuard(game, watch, region, currency);
      const guardLine = guard
        ? `<span class="anti-hype-guard guard-${guard.kind}"><strong>${guard.label}</strong> ${guard.detail}</span>`
        : "";
      return {
        label: t("narrative.detail.regionPrice", { region }),
        value: formatPrice(game, region),
        detail: `${t("narrative.detail.discount", {
          discount,
          kind: status.canConfirm ? t("narrative.detail.discountOff") : t("narrative.detail.discountSignal"),
        })}${watch ? ` / ${historicalLowCopy(watch, currency)}` : ""}${editionPriceNote}${guardLine}`,
      };
    }

    function detailStatusCards(game) {
      const userGame = effectiveUserGame(game) || {};
      const rating = personalRatingFacet(game);
      const price = detailPriceSummary(game);
      return [
        {
          label: t("narrative.detail.access"),
          value: userGame.access
            ? localizedState(userGame.access)
            : userGame.saved
              ? t("narrative.detail.wishlist")
              : t("narrative.detail.noAccess"),
          tone: userGame.access ? "access" : userGame.saved ? "wishlist" : "empty",
        },
        {
          label: t("narrative.detail.progress"),
          value: userGame.completionStatus
            ? localizedState(userGame.completionStatus)
            : userGame.hidden
              ? t("narrative.detail.hidden")
              : t("narrative.detail.notStarted"),
          tone: userGame.completionStatus ? "progress" : userGame.hidden ? "hidden" : "empty",
        },
        {
          label: t("narrative.detail.rating"),
          value: rating.label === "No rating" ? t("narrative.detail.noRating") : rating.label,
          tone: rating.source === "Manual" ? "rating" : rating.source === "Import" ? "imported" : "empty",
        },
        {
          label: price.label,
          value: price.value,
          detail: price.detail,
          tone: price.value === t("narrative.detail.missing") ? "empty" : "price",
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
