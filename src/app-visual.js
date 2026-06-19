/* PlaySputnik Visual Module — visual catalog shelf data: stats, lane reasons, item list */
"use strict";
(function () {
  if (!window.PlaySputnikConfig) throw new Error("app-config must load before app-visual");
  if (!window.PlaySputnikRecommend) throw new Error("app-recommend must load before app-visual");
  if (!window.PlaySputnikRanking) throw new Error("app-ranking must load before app-visual");

  const { PLAYABLE_STATES } = window.PlaySputnikConfig;
  const t = window.PlaySputnikI18n.t;
  const STATE_KEYS = {
    saved: "discover.stateSaved", playing: "discover.statePlaying", paused: "discover.statePaused",
    want_to_finish: "discover.stateFinish", owned: "discover.stateOwned",
    owned_forever: "discover.stateForever", subscription: "discover.stateSubscription",
    completed: "discover.stateCompleted", dropped: "discover.stateDropped", hidden: "discover.stateHidden",
  };

  function localizedState(value) {
    return STATE_KEYS[value] ? t(STATE_KEYS[value]) : value;
  }

  function createVisualTools({
    getState,
    getRecommendationPool,
    // from ranking module
    clusterGames,
    dealReason,
    primaryDecisionGame,
    // from score module
    scoreGame,
    personalFitBand,
    // from recommend module
    effectiveGameState,
    // from library module (score module exports notebookWishlistWeight via score)
    notebookWishlistWeight,
    // from search module
    titleKey,
  }) {
    function visualCatalogStats() {
      const pool = getRecommendationPool();
      const playableCount = pool.filter((game) => PLAYABLE_STATES.includes(effectiveGameState(game))).length;
      const wishlistCount = pool.filter((game) => effectiveGameState(game) === "saved" || game.wishlist || notebookWishlistWeight(game.title) > 0).length;
      const coverCount = pool.filter((game) => ["candidate", "verified"].includes(game.coverMeta?.status)).length;
      return {
        coverCount,
        playableCount,
        wishlistCount,
        totalCount: pool.length,
      };
    }

    function visualCatalogReason(game, lane = "") {
      if (lane === "Deal") return dealReason(game);
      if (lane === "Included") return t("discover.reasonIncluded");
      if (lane === "Wishlist") {
        return notebookWishlistWeight(game.title)
          ? t("discover.reasonHearts", { count: notebookWishlistWeight(game.title) })
          : t("discover.reasonSaved");
      }
      if (lane === "Library") return localizedState(effectiveGameState(game)) || t("discover.reasonMemory");
      if (lane === "Catalog") return game.vibe;
      return personalFitBand(game.score || scoreGame(game));
    }

    function visualCatalogItems(ranked) {
      const state = getState();
      const clusters = clusterGames(ranked);
      const items = [];
      const seen = new Set();
      const add = (game, lane, reason = visualCatalogReason(game, lane)) => {
        if (!game) return;
        const key = titleKey(game.title);
        if (seen.has(key)) return;
        seen.add(key);
        items.push({ game, lane, reason });
      };
      const shelf = state.visualCatalogShelf || "smart";
      const pool = getRecommendationPool()
        .map((game) => ({ ...game, score: typeof game.score === "number" ? game.score : scoreGame(game) }))
        .filter((game) => !state.hidden.has(game.title))
        .sort((a, b) => b.score - a.score);

      if (shelf === "tonight") {
        ranked.slice(0, 18).forEach((game) => add(game, "Tonight"));
        return items;
      }
      if (shelf === "included") {
        [...clusters.plus, ...pool.filter((game) => PLAYABLE_STATES.includes(effectiveGameState(game)))]
          .slice(0, 18)
          .forEach((game) => add(game, "Included"));
        return items;
      }
      if (shelf === "deals") {
        clusters.buy.slice(0, 18).forEach((game) => add(game, "Deal"));
        return items;
      }
      if (shelf === "wishlist") {
        pool
          .filter((game) => effectiveGameState(game) === "saved" || game.wishlist || notebookWishlistWeight(game.title) > 0)
          .slice(0, 18)
          .forEach((game) => add(game, "Wishlist"));
        return items;
      }
      if (shelf === "library") {
        pool
          .filter((game) => Boolean(effectiveGameState(game)))
          .slice(0, 18)
          .forEach((game) => add(game, "Library"));
        return items;
      }
      if (shelf === "catalog") {
        pool.slice(0, 24).forEach((game) => add(game, "Catalog"));
        return items;
      }

      add(primaryDecisionGame(ranked), "Tonight", t("discover.reasonTop"));
      clusters.play.slice(0, 5).forEach((game) => add(game, "Taste", personalFitBand(game.score)));
      clusters.plus.slice(0, 4).forEach((game) => add(game, "Included", t("discover.reasonTryBeforeBuy")));
      clusters.buy.slice(0, 4).forEach((game) => add(game, "Deal", dealReason(game)));
      clusters.backlog.slice(0, 4).forEach((game) => add(game, "Memory", localizedState(effectiveGameState(game)) || t("discover.reasonRemembered")));

      return items.slice(0, 18);
    }

    return {
      visualCatalogStats,
      visualCatalogReason,
      visualCatalogItems,
    };
  }

  window.PlaySputnikVisual = { createVisualTools };
})();
