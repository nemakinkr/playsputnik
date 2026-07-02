/* PlaySputnik Wishlist Module — price watch, wishlist intent, purchase decisions */
"use strict";
(function () {
  if (!window.PlaySputnikConfig) throw new Error("app-config must load before app-wishlist");
  if (!window.PlaySputnikRecommend) throw new Error("app-recommend must load before app-wishlist");
  if (!window.PlaySputnikRanking) throw new Error("app-ranking must load before app-wishlist");

  const { WISHLIST_QUEUE_FILTERS } = window.PlaySputnikConfig;
  const t = window.PlaySputnikI18n.t;
  const FILTER_KEYS = {
    all: ["wishlist.filterAll", "wishlist.filterAllSummary"],
    buy: ["wishlist.filterBuy", "wishlist.filterBuySummary"],
    wait: ["wishlist.filterWait", "wishlist.filterWaitSummary"],
    verify: ["wishlist.filterVerify", "wishlist.filterVerifySummary"],
    missing: ["wishlist.filterMissing", "wishlist.filterMissingSummary"],
  };
  const STATE_KEYS = {
    owned: "wishlist.stateOwned",
    owned_forever: "wishlist.stateForever",
    subscription: "wishlist.stateSubscription",
  };

  function wishlistStateLabel(value) {
    return STATE_KEYS[value] ? t(STATE_KEYS[value]) : value;
  }

  function createWishlistTools({
    getState,
    getRecommendationPool,
    getIsAlreadyAvailable,
    getBlocksPurchase,
    getPurchaseCandidates,
    // from score module
    notebookWishlistWeight,
    notebookRankedSet,
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
      const rankedKnown = notebookRankedSet ? notebookRankedSet() : new Set();
      const byTitle = new Map();
      const add = (game, lane = "wishlist") => {
        if (!game) return;
        const key = titleKey(game.title);
        if (!byTitle.has(key)) byTitle.set(key, { game, lanes: new Set() });
        byTitle.get(key).lanes.add(lane);
      };

      getPurchaseCandidates(ranked).forEach((game) => add(game, "buy"));
      priceWatchRecords(ranked).forEach(({ game }) => add(game, "deal"));
      getRecommendationPool()
        .filter((game) => {
          if (rankedKnown.has(titleKey(game.title))) return false;
          const memory = effectiveUserGame(game) || {};
          return memory.saved || game.wishlist || notebookWishlistWeight(game.title);
        })
        .forEach((game) => add(game, "wishlist"));

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
        return { label: t("wishlist.decisionMissing"), tone: "missing", detail: t("wishlist.decisionMissingDetail") };
      }
      if (!record.status.canConfirm) {
        return { label: t("wishlist.decisionVerify"), tone: "verify", detail: t("wishlist.decisionVerifyDetail") };
      }
      if (record.watch?.isBelowTarget && record.risk < 24) {
        return {
          label: t("wishlist.decisionBelow"),
          tone: "buy",
          detail: t("wishlist.decisionBelowDetail", {
            price: formatPrice(record.game, region),
            target: t(record.watch.hasCustomTarget ? "wishlist.targetCustom" : "wishlist.targetBudget"),
          }),
        };
      }
      if ((record.game.prices[region] || 0) > (record.watch?.targetPrice ?? Number(state.budget)) || record.risk >= 24) {
        return {
          label: t("wishlist.decisionWait"),
          tone: "wait",
          detail: t("wishlist.decisionWaitDetail", {
            history: record.watch
              ? historicalLowCopy(record.watch, record.game.priceMeta?.[region]?.currency || "USD")
              : t("wishlist.watchNextSale"),
          }),
        };
      }
      return {
        label: t("wishlist.decisionBuy"),
        tone: "buy",
        detail: t("wishlist.decisionBuyDetail", {
          price: formatPrice(record.game, region),
          discount: record.game.discount[region] || 0,
          risk: record.risk,
        }),
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
              label: t("wishlist.dashboardBest"),
              title: best.game.title,
              detail: best.hasPrice
                ? t("wishlist.valueDetail", {
                  region,
                  price: formatPrice(best.game, region),
                  discount: best.game.discount[region] || 0,
                  score: best.score,
                })
                : t("wishlist.dashboardStrongIntent"),
              actionLabel: best.hasPrice ? t("wishlist.dashboardBought") : t("wishlist.dashboardSave"),
              actionState: best.hasPrice ? "owned_forever" : "saved",
              actionTitle: best.game.title,
              tone: wishlistDecision(best).tone,
            }
          : {
              label: t("wishlist.dashboardBest"),
              title: t("wishlist.dashboardNoGames"),
              detail: t("wishlist.dashboardNoGamesDetail"),
              actionLabel: t("wishlist.dashboardDiscover"),
              actionView: "discover",
              tone: "empty",
            },
        {
          label: t("wishlist.dashboardQueue"),
          title: t("wishlist.dashboardWatched", { count: records.length }),
          detail: t("wishlist.dashboardQueueDetail", { buy: buyNow, waiting, missing }),
          actionLabel: t("wishlist.dashboardDiscover"),
          actionView: "discover",
          tone: "wishlist",
        },
        access
          ? {
              label: t("wishlist.dashboardBefore"),
              title: access.title,
              detail: t("wishlist.dashboardAccessDetail", { state: wishlistStateLabel(effectiveGameState(access)) }),
              actionLabel: t("wishlist.dashboardPlay"),
              actionState: "playing",
              actionTitle: access.title,
              tone: "access",
            }
          : {
              label: t("wishlist.dashboardBefore"),
              title: t("wishlist.dashboardNoAlternative"),
              detail: t("wishlist.dashboardNoAlternativeDetail"),
              actionLabel: t("wishlist.dashboardLibrary"),
              actionView: "library",
              tone: "empty",
            },
      ];
    }

    function wishlistFilterSummary(filter, visibleCount, totalCount) {
      const key = WISHLIST_QUEUE_FILTERS[filter] ? filter : "all";
      return `${t(FILTER_KEYS[key][0])}: ${visibleCount}/${totalCount}. ${t(FILTER_KEYS[key][1])}`;
    }

    function wishlistFilterMatches(record, filter) {
      if (filter === "all") return true;
      return wishlistDecision(record).tone === filter;
    }

    // Anti-hype buy guard — single source of truth, used by both the wishlist
    // rows (app.js) and the detail cockpit (app-detail.js). Deterministic "don't
    // pay full price now" signals: already in PS Plus, or tracked history shows
    // it was meaningfully cheaper. Returns null for genuine buy-zone items.
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

    return {
      antiHypeGuard,
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
