/* PlaySputnik Wishlist Module — price watch, wishlist intent, purchase decisions */
"use strict";
(function () {
  if (!window.PlaySputnikConfig) throw new Error("app-config must load before app-wishlist");
  if (!window.PlaySputnikRecommend) throw new Error("app-recommend must load before app-wishlist");
  if (!window.PlaySputnikRanking) throw new Error("app-ranking must load before app-wishlist");

  const { USER_STATE_LABELS, WISHLIST_QUEUE_FILTERS } = window.PlaySputnikConfig;

  function createWishlistTools({
    getState,
    getRecommendationPool,
    getIsAlreadyAvailable,
    getBlocksPurchase,
    getPurchaseCandidates,
    // from score module
    notebookWishlistWeight,
    scoreGame,
    // from recommend module
    effectiveGameState,
    effectiveUserGame,
    priceStatus,
    formatPrice,
    formatMoney,
    priceCanGuideBuy,
    // from ranking module
    dealScore,
    purchaseRisk,
    purchaseScore,
    // from search module
    titleKey,
  }) {
    function priceWatchReason(game, region, rankIndex = 0) {
      const state = getState();
      const currentState = effectiveGameState(game);
      if (currentState === "saved" || game.wishlist || notebookWishlistWeight(game.title) > 0) return "wishlist";
      if (rankIndex < 5) return "recommendation";
      if (Math.abs((game.prices[region] || 0) - Number(state.budget)) <= 10) return "near_budget";
      return "discount";
    }

    function priceHistoryForGame(game, region) {
      const records = [...(game.priceHistory?.[region] || [])];
      const current = game.priceMeta?.[region];
      if (current) records.push(current);
      return records
        .filter((record) => typeof record.price === "number")
        .sort((a, b) => new Date(b.checkedAt || 0) - new Date(a.checkedAt || 0));
    }

    function historicalLowForGame(game, region) {
      const records = priceHistoryForGame(game, region);
      if (!records.length) return null;
      const low = records.reduce((best, record) => (record.price < best.price ? record : best), records[0]);
      const currentPrice = game.prices[region];
      return {
        price: low.price,
        currency: low.currency || game.priceMeta?.[region]?.currency || "USD",
        checkedAt: low.checkedAt || null,
        source: low.source || "unknown",
        historyCount: records.length,
        isCurrentLow: typeof currentPrice === "number" && currentPrice <= low.price,
      };
    }

    function customPriceWatchTarget(game, region) {
      const target = Number(effectiveUserGame(game)?.priceWatch?.targets?.[region]);
      return Number.isFinite(target) && target > 0 ? target : null;
    }

    function priceWatchTarget(game, region) {
      return customPriceWatchTarget(game, region) || Number(getState().budget);
    }

    function priceWatchRecord(game, region, rankIndex = 0) {
      const snapshot = game.priceMeta?.[region] || {};
      const historicalLow = historicalLowForGame(game, region);
      const targetPrice = priceWatchTarget(game, region);
      const currentPrice = typeof game.prices[region] === "number" ? game.prices[region] : null;
      const hasCustomTarget = customPriceWatchTarget(game, region) !== null;
      return {
        gameId: titleKey(game.title),
        title: game.title,
        region,
        targetPrice,
        hasCustomTarget,
        watchReason: priceWatchReason(game, region, rankIndex),
        currentPrice,
        discountPercent: game.discount[region] || 0,
        checkedAt: snapshot.checkedAt || null,
        freshnessState: snapshot.freshnessState || "missing",
        source: snapshot.source || "missing",
        historicalLow: historicalLow?.price || null,
        historicalLowAt: historicalLow?.checkedAt || null,
        historyCount: historicalLow?.historyCount || 0,
        isHistoricalLow: Boolean(historicalLow?.isCurrentLow),
        isBelowTarget: typeof currentPrice === "number" && currentPrice <= targetPrice,
        targetDelta: typeof currentPrice === "number" ? Math.round((currentPrice - targetPrice) * 100) / 100 : null,
      };
    }

    function historicalLowCopy(watch, currency = "USD") {
      if (!watch.historyCount || typeof watch.historicalLow !== "number") return t("narrative.detail.noHistory");
      const low = formatMoney(watch.historicalLow, currency);
      return watch.isHistoricalLow
        ? t("narrative.detail.matchesLow", { price: low })
        : t("narrative.detail.lowWas", { price: low });
    }

    function priceWatchRecords(ranked) {
      const state = getState();
      const region = state.activeRegion;
      return ranked
        .filter((game) => game.discount[region] >= 30)
        .filter((game) => priceCanGuideBuy(game, region))
        .filter((game) => !getBlocksPurchase(game))
        .sort((a, b) => dealScore(b) - dealScore(a))
        .slice(0, 5)
        .map((game, index) => ({
          game,
          watch: priceWatchRecord(game, region, index),
        }));
    }

    function wishlistIntentRecords(ranked) {
      const state = getState();
      const region = state.activeRegion;
      const byTitle = new Map();
      const add = (game, lane = "Wishlist") => {
        if (!game) return;
        const key = titleKey(game.title);
        if (!byTitle.has(key)) byTitle.set(key, { game, lanes: new Set() });
        byTitle.get(key).lanes.add(lane);
      };

      getPurchaseCandidates(ranked).forEach((game) => add(game, "Buy candidate"));
      priceWatchRecords(ranked).forEach(({ game }) => add(game, "Deal watch"));
      getRecommendationPool()
        .filter((game) => {
          const memory = effectiveUserGame(game) || {};
          return memory.saved || game.wishlist || notebookWishlistWeight(game.title);
        })
        .forEach((game) => add(game, "Wishlist"));

      return [...byTitle.values()]
        .map(({ game, lanes }) => {
          const hasPrice = typeof game.prices?.[region] === "number";
          const status = hasPrice ? priceStatus(game, region) : { canConfirm: false };
          const risk = hasPrice ? purchaseRisk(game) : 18;
          const score = hasPrice ? purchaseScore(game) : scoreGame(game) - 8;
          const memory = effectiveUserGame(game) || {};
          const watch = hasPrice ? priceWatchRecord(game, region, 0) : null;
          return {
            game,
            lanes: [...lanes],
            hasPrice,
            status,
            risk,
            score,
            watch,
            saved: Boolean(memory.saved || game.wishlist || notebookWishlistWeight(game.title)),
          };
        })
        .filter((record) => !getBlocksPurchase(record.game))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
    }

    function wishlistDecision(record) {
      const state = getState();
      const region = state.activeRegion;
      if (!record.hasPrice) {
        return { label: "Missing price", tone: "missing", detail: "Keep it watched, but do not fake a buy recommendation until a source resolves price." };
      }
      if (!record.status.canConfirm) {
        return { label: "Verify", tone: "verify", detail: "Price signal exists, but the source needs confirmation before this becomes a confident buy." };
      }
      if (record.watch?.isBelowTarget && record.risk < 24) {
        return {
          label: "Below target",
          tone: "buy",
          detail: `${formatPrice(record.game, region)} is at or under your ${record.watch.hasCustomTarget ? "custom" : "budget"} alert.`,
        };
      }
      if ((record.game.prices[region] || 0) > (record.watch?.targetPrice ?? Number(state.budget)) || record.risk >= 24) {
        return {
          label: "Wait",
          tone: "wait",
          detail: `Good fit, but price/risk says wait. ${record.watch ? historicalLowCopy(record.watch, record.game.priceMeta?.[region]?.currency || "USD") : "Watch next sale."}`,
        };
      }
      return {
        label: "Buy zone",
        tone: "buy",
        detail: `${formatPrice(record.game, region)} / ${record.game.discount[region] || 0}% off / ${record.risk} risk.`,
      };
    }

    function wishlistDashboardCards(ranked, records) {
      const state = getState();
      const region = state.activeRegion;
      const best = records[0];
      const access = ranked.find((game) => getIsAlreadyAvailable(game));
      const buyNow = records.filter((record) => wishlistDecision(record).tone === "buy").length;
      const waiting = records.filter((record) => ["wait", "verify"].includes(wishlistDecision(record).tone)).length;
      const missing = records.filter((record) => !record.hasPrice).length;

      return [
        best
          ? {
              label: "Best now",
              title: best.game.title,
              detail: best.hasPrice
                ? `${region} ${formatPrice(best.game, region)} / ${best.game.discount[region] || 0}% off / ${best.score} value.`
                : "Strong intent, but price is not resolved yet.",
              actionLabel: best.hasPrice ? "Bought" : "Save",
              actionState: best.hasPrice ? "owned_forever" : "saved",
              actionTitle: best.game.title,
              tone: wishlistDecision(best).tone,
            }
          : {
              label: "Best now",
              title: "No watched games yet",
              detail: "Add games from search or catalog; wishlist becomes a purchase cockpit after that.",
              actionLabel: "Discover",
              actionView: "discover",
              tone: "empty",
            },
        {
          label: "Queue",
          title: `${records.length} watched`,
          detail: `${buyNow} buy-zone / ${waiting} wait-or-verify / ${missing} missing price.`,
          actionLabel: "Discover",
          actionView: "discover",
          tone: "wishlist",
        },
        access
          ? {
              label: "Before buying",
              title: access.title,
              detail: `${USER_STATE_LABELS[effectiveGameState(access)] || effectiveGameState(access)} can cover tonight with no spend.`,
              actionLabel: "Play",
              actionState: "playing",
              actionTitle: access.title,
              tone: "access",
            }
          : {
              label: "Before buying",
              title: "No library alternative",
              detail: "Wishlist can still guide a purchase, but library import will make guardrails much stronger.",
              actionLabel: "Library",
              actionView: "library",
              tone: "empty",
            },
      ];
    }

    function wishlistFilterSummary(filter, visibleCount, totalCount) {
      const copy = WISHLIST_QUEUE_FILTERS[filter] || WISHLIST_QUEUE_FILTERS.all;
      return `${copy.label}: ${visibleCount}/${totalCount}. ${copy.summary}`;
    }

    function wishlistFilterMatches(record, filter) {
      if (filter === "all") return true;
      return wishlistDecision(record).tone === filter;
    }

    return {
      priceWatchReason,
      priceHistoryForGame,
      historicalLowForGame,
      customPriceWatchTarget,
      priceWatchTarget,
      priceWatchRecord,
      historicalLowCopy,
      priceWatchRecords,
      wishlistIntentRecords,
      wishlistDecision,
      wishlistDashboardCards,
      wishlistFilterSummary,
      wishlistFilterMatches,
    };
  }

  window.PlaySputnikWishlist = { createWishlistTools };
})();
