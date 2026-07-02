/* PlaySputnik Ranking Module — rankedGames, clusterGames, deal/purchase scoring */
"use strict";
(function () {
  if (!window.PlaySputnikConfig) throw new Error("app-config must load before app-ranking");
  if (!window.PlaySputnikScore) throw new Error("app-score must load before app-ranking");
  if (!window.PlaySputnikRecommend) throw new Error("app-recommend must load before app-ranking");
  const t = window.PlaySputnikI18n.t;
  const SESSION_KEYS = {
    short: "narrative.recommend.sessionShort",
    medium: "narrative.recommend.sessionMedium",
    long: "narrative.recommend.sessionLong",
  };

  function createRankingTools({
    getState,
    getRecommendationPool,
    getGameUserState,
    getSelectedAtoms,
    getBlocksPurchase,
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
  }) {
    // Per-render cache: rankedGames is called ~11× per render (each ~60ms due to
    // scoring + object spread over the full catalog). Within one render pass the
    // ranking is stable, so we compute once. Cleared at render() start via
    // invalidateRankedGames(). Display-only filter changes (catalog/wishlist
    // filters) don't affect ranking, so reusing the cache there is correct.
    let _rankedCache = null;
    function invalidateRankedGames() {
      _rankedCache = null;
    }
    function rankedGames() {
      if (_rankedCache) return _rankedCache;
      const state = getState();
      const completed = notebookCompletedSet();
      const rankedKnown = notebookRankedSet ? notebookRankedSet() : new Set();
      _rankedCache = getRecommendationPool()
        .filter((game) => !state.hidden.has(game.title))
        .filter((game) => !state.snoozed.has(game.title))
        .filter((game) => !RANK_EXCLUDED_STATES.includes(getGameUserState(game.title)))
        .filter((game) => !completed.has(titleKey(game.title)))
        .filter((game) => !rankedKnown.has(titleKey(game.title)))
        .map((game) => ({ ...game, score: scoreGame(game) }))
        .sort((a, b) => b.score - a.score);
      return _rankedCache;
    }

    function dealScore(game) {
      const state = getState();
      const region = state.activeRegion;
      const confidenceMultiplier = priceStatus(game, region).canConfirm ? 1 : 0.55;
      return (game.discount[region] * confidenceMultiplier) + Math.max(scoreGame(game), 0) / 4 + (game.wishlist ? 10 : 0);
    }

    function clusterGames(ranked) {
      const state = getState();
      const region = state.activeRegion;
      return {
        play: ranked.slice(0, 6),
        plus: ranked.filter((game) => state.psPlus && game.psPlus.includes(region)).slice(0, 6),
        buy: ranked
          .filter((game) => game.prices[region] <= Number(state.budget))
          .filter((game) => priceCanGuideBuy(game, region))
          .filter((game) => !getBlocksPurchase(game))
          .sort((a, b) => dealScore(b) - dealScore(a))
          .slice(0, 6),
        backlog: ranked.filter((game) => game.backlog || LIBRARY_ACTIVE_STATES.includes(effectiveGameState(game))).slice(0, 6),
        library: ranked.filter((game) => LIBRARY_ACTIVE_STATES.includes(effectiveGameState(game))).slice(0, 6),
      };
    }

    function dealReason(game) {
      const state = getState();
      const region = state.activeRegion;
      const parts = [];
      const atoms = getSelectedAtoms();
      const shared = game.atoms.filter((atom) => atoms.includes(atom));
      if (shared.length) parts.push(t("wishlist.dealAtomFit", { atom: shared[0] }));
      if (game.wishlist) parts.push(t("wishlist.dealWishlist"));
      if (game.backlog) parts.push(t("wishlist.dealBacklog"));
      if (game.psPlus.includes(region) && state.psPlus) {
        parts.push(t(subscriptionStatus(game, region).canConfirm ? "wishlist.dealPlus" : "wishlist.dealPlusSignal"));
      }
      if (game.session === state.session) {
        parts.push(t("wishlist.dealSession", { session: t(SESSION_KEYS[state.session] || SESSION_KEYS.medium) }));
      }
      if (game.adultTimeFit === "weeknight") parts.push(t("wishlist.dealWeeknight"));
      if (game.reviewBurden === "low") parts.push(t("wishlist.dealLowReview"));
      const fallback = t(priceStatus(game, region).canConfirm ? "wishlist.dealFallback" : "wishlist.dealFallbackVerify");
      return parts.slice(0, 3).join(" / ") || fallback;
    }

    function purchaseRisk(game) {
      const state = getState();
      const region = state.activeRegion;
      const price = game.prices[region] || 0;
      const overBudget = Math.max(0, price - Number(state.budget));
      const freshnessRisk = priceStatus(game, region).canConfirm ? 0 : 10;
      const warningRisk = watchOuts(game).length * 7;
      const frictionRisk =
        game.reviewBurden === "high" ? 10
          : game.commitment === "high" && state.session === "short" ? 12
            : 0;
      return Math.round(overBudget * 0.6 + freshnessRisk + warningRisk + frictionRisk);
    }

    function purchaseScore(game) {
      const wishlistIntent = notebookWishlistWeight(game.title) * 14 + (game.wishlist ? 10 : 0);
      return Math.round(dealScore(game) + wishlistIntent + Math.max(scoreGame(game), 0) / 6 - purchaseRisk(game));
    }

    function purchaseCandidates(ranked) {
      const state = getState();
      const region = state.activeRegion;
      return ranked
        .filter((game) => typeof game.prices[region] === "number")
        .filter((game) => priceCanGuideBuy(game, region))
        .filter((game) => !getBlocksPurchase(game))
        .map((game) => ({ ...game, purchaseScore: purchaseScore(game), purchaseRisk: purchaseRisk(game) }))
        .sort((a, b) => b.purchaseScore - a.purchaseScore)
        .slice(0, 8);
    }

    return { rankedGames, invalidateRankedGames, clusterGames, dealReason, dealScore, purchaseRisk, purchaseScore, purchaseCandidates };
  }

  window.PlaySputnikRanking = { createRankingTools };
})();
