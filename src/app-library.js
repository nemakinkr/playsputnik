/* PlaySputnik Library Module — library plan, companion plan, taste memory, dashboard data */
"use strict";
(function () {
  if (!window.PlaySputnikConfig) throw new Error("app-config must load before app-library");
  if (!window.PlaySputnikScore) throw new Error("app-score must load before app-library");
  if (!window.PlaySputnikRecommend) throw new Error("app-recommend must load before app-library");
  if (!window.PlaySputnikRanking) throw new Error("app-ranking must load before app-library");

  const {
    ACCESS_STATES,
    PLAYABLE_STATES,
    USER_STATE_LABELS,
    LIBRARY_ACTIVE_STATES,
    LIBRARY_QUEUE_FILTERS,
    COMPLETION_STATUS_STATES,
  } = window.PlaySputnikConfig;
  const t = window.PlaySputnikI18n.t;

  const STATE_KEYS = {
    later: "library.stateLater", saved: "library.stateSaved", want_to_finish: "library.stateFinish",
    paused: "library.statePaused", owned: "library.stateOwned", owned_forever: "library.stateForever",
    subscription: "library.stateSubscription", playing: "library.statePlaying", completed: "library.stateCompleted",
    dropped: "library.stateDropped", hidden: "library.stateHidden",
  };
  const SESSION_KEYS = {
    short: "narrative.recommend.sessionShort",
    medium: "narrative.recommend.sessionMedium",
    long: "narrative.recommend.sessionLong",
  };
  const ADULT_FIT_KEYS = {
    anytime: "narrative.recommend.adultAnytime", background: "narrative.recommend.adultBackground",
    evening: "narrative.recommend.adultEvening", vacation: "narrative.recommend.adultVacation",
    weekend: "narrative.recommend.adultWeekend", weeknight: "narrative.recommend.adultWeeknight",
  };
  const ACTION_KEYS = {
    Start: "library.actionStart", Pause: "library.actionPause", Done: "library.actionDone",
    Resume: "library.actionResume", Finish: "library.actionFinish", Drop: "library.actionDrop",
    Owned: "library.actionOwned", Forever: "library.actionForever", Clear: "library.actionClear",
    Plus: "library.actionPlus", No: "library.actionNo",
  };
  const FILTER_KEYS = {
    all: ["library.filterAll", "library.filterAllSummary"],
    active: ["library.filterActive", "library.filterActiveSummary"],
    access: ["library.filterAccess", "library.filterAccessSummary"],
    wishlist: ["library.filterWishlist", "library.filterWishlistSummary"],
    finished: ["library.filterFinished", "library.filterFinishedSummary"],
  };

  function localizedState(value) {
    return STATE_KEYS[value] ? t(STATE_KEYS[value]) : value;
  }

  function localizedSession(value) {
    return SESSION_KEYS[value] ? t(SESSION_KEYS[value]) : value;
  }

  function localizedAdultFit(value) {
    return ADULT_FIT_KEYS[value] ? t(ADULT_FIT_KEYS[value]) : value;
  }

  function action(label, state) {
    return { label: t(ACTION_KEYS[label]), state };
  }

  function createLibraryTools({
    // app.js data/state
    getState,
    getRecommendationPool,
    getGames,
    getExternalMemoryGames,
    getMonthlyDropItem,
    // app.js functions
    getGameUserState,
    getLegacyStateFromUserGame,
    getIsAlreadyAvailable,
    getBlocksPurchase,
    getFeedbackSource,
    getRankedRadar,
    getTopAtomEntries,
    getSourceGames,
    // from score module
    tasteEngineProfile,
    notebookCompletedSet,
    notebookWishlistWeight,
    scoreGame,
    feedbackWeightForAction,
    feedbackEffectLabel,
    feedbackActionLabel,
    // from recommend module
    effectiveGameState,
    effectiveUserGame,
    priceStatus,
    formatPrice,
    priceCanGuideBuy,
    // from recommend module (additional)
    decisionRationale,
    // from ranking module
    dealScore,
    dealReason,
    // from search module
    titleMatches,
    titleKey,
    // from enrichment module
    countValues,
    topEntries,
  }) {
    function playLaterQueue() {
      const state = getState();
      return Object.values(state.dropDecisions)
        .filter((item) => item.decision === "play_later")
        .map((item) => {
          const dropItem = getMonthlyDropItem(item.title);
          return {
            title: item.title,
            source: t("library.dropInbox"),
            detail: dropItem ? `${dropItem.trialWindow} / ${dropItem.predictedRank}` : t("library.savedForLater"),
            atoms: dropItem?.atoms || [],
            nextAction: dropItem?.nextAction || t("library.matchingEvening"),
          };
        });
    }

    function bestLibraryPick(ranked) {
      return ranked.find((game) => getIsAlreadyAvailable(game));
    }

    function primaryDecisionGame(ranked) {
      const state = getState();
      if (state.entryPath === "psn") return bestLibraryPick(ranked) || ranked[0];
      return ranked[0];
    }

    function isLibraryFirstMode(game) {
      const state = getState();
      return state.entryPath === "psn" && game && getIsAlreadyAvailable(game);
    }

    function buyLaterCandidate(ranked) {
      const state = getState();
      const region = state.activeRegion;
      return ranked
        .filter((game) => game.prices[region] <= Number(state.budget))
        .filter((game) => priceCanGuideBuy(game, region))
        .filter((game) => !getBlocksPurchase(game))
        .sort((a, b) => dealScore(b) - dealScore(a))[0];
    }

    function companionPlan(ranked) {
      const state = getState();
      const region = state.activeRegion;
      const topGame = ranked[0];
      const accessGame = ranked.find((game) => getIsAlreadyAvailable(game) || (state.psPlus && game.psPlus.includes(region)));
      const radarLead = getRankedRadar()[0];
      const buyLater = buyLaterCandidate(ranked);
      const guardGame = ranked.find((game) => (
        getBlocksPurchase(game)
        && ![topGame, accessGame, buyLater].some((item) => item && titleKey(item.title) === titleKey(game.title))
      ));
      const rows = [];

      if (topGame) {
        const rationale = decisionRationale(topGame);
        const topState = effectiveGameState(topGame);
        rows.push({
          id: `play-${topGame.title}`,
          label: t("today.planTonight"),
          title: topGame.title,
          tag: topState ? localizedState(topState) : t("library.factSession", { session: localizedSession(topGame.session) }),
          detail: rationale.headline,
          primaryState: "playing",
          primaryLabel: t("today.planPlay"),
        });
      }

      if (accessGame) {
        const rationale = decisionRationale(accessGame);
        const accessState = effectiveGameState(accessGame);
        rows.push({
          id: `access-${accessGame.title}`,
          label: getIsAlreadyAvailable(accessGame) ? t("today.planUseAccess") : t("today.planSubscription"),
          title: accessGame.title,
          tag: accessState ? localizedState(accessState) : t("today.planPlusSignal"),
          detail: rationale.headline,
          primaryState: "playing",
          primaryLabel: t("today.planPlay"),
        });
      }

      if (radarLead) {
        rows.push({
          id: `radar-${radarLead.title}`,
          label: t("today.planWatch"),
          title: radarLead.title,
          tag: radarLead.window,
          detail: radarLead.reason,
          primaryState: "saved",
          primaryLabel: t("today.planSave"),
        });
      }

      if (buyLater) {
        const status = priceStatus(buyLater, region);
        rows.push({
          id: `buy-${buyLater.title}`,
          label: t("today.planBuyLater"),
          title: buyLater.title,
          tag: status.canConfirm ? t("today.planPriceOk") : t("today.planVerifyPrice"),
          detail: status.canConfirm
            ? t("today.planDiscountDetail", {
              region,
              price: formatPrice(buyLater, region),
              discount: buyLater.discount[region],
              freshness: t("today.planOff"),
              reason: dealReason(buyLater),
            })
            : t("today.planVerifyDetail", { reason: dealReason(buyLater) }),
          primaryState: "saved",
          primaryLabel: t("today.planSave"),
        });
      }

      if (guardGame) {
        const rationale = decisionRationale(guardGame);
        rows.push({
          id: `guard-${guardGame.title}`,
          label: t("today.planDoNotBuy"),
          title: guardGame.title,
          tag: t("today.planGuardrail"),
          detail: t("today.planDoNotBuyDetail", { reason: rationale.headline }),
          primaryAction: "snooze",
          primaryLabel: t("today.planNotNow"),
        });
      }

      const seen = new Set();
      return rows.filter((row) => {
        const key = titleKey(row.title);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 5);
    }

    // Per-render cache: tasteMemory scans the full catalog twice and is called
    // ~6× per render (~58ms each). It depends only on taste signals + library
    // state, both invariant within a render. Cleared at render() start.
    let _tasteMemoryCache = null;
    function invalidateTasteMemory() {
      _tasteMemoryCache = null;
    }
    function tasteMemory() {
      if (_tasteMemoryCache) return _tasteMemoryCache;
      _tasteMemoryCache = computeTasteMemory();
      return _tasteMemoryCache;
    }
    function computeTasteMemory() {
      const state = getState();
      const tasteProfile = tasteEngineProfile();
      const completedTitles = notebookCompletedSet();
      const pool = getRecommendationPool();
      const completedGames = pool.filter((game) => completedTitles.has(titleKey(game.title)) || getGameUserState(game.title) === "completed");
      const libraryGames = pool.filter((game) => effectiveGameState(game));
      const sessionCounts = countValues([
        ...state.importedRatings
          .map((rating) => getSourceGames().find((game) => titleMatches(game.title, rating.title))?.session)
          .filter(Boolean),
        ...libraryGames.map((game) => game.session),
      ]);
      const timeCounts = countValues([
        ...completedGames.map((game) => game.adultTimeFit).filter(Boolean),
        ...libraryGames.map((game) => game.adultTimeFit).filter(Boolean),
      ]);
      return {
        confidence: tasteProfile.confidence,
        evidenceCount: tasteProfile.evidenceCount,
        feedbackCount: tasteProfile.sources.quick + tasteProfile.sources.feedback,
        likes: getTopAtomEntries(tasteProfile.positiveWeights, 5),
        cautions: getTopAtomEntries(tasteProfile.negativeWeights, 4),
        mixed: tasteProfile.mixedAtoms,
        session: topEntries(sessionCounts, 2),
        timeFit: topEntries(timeCounts, 2),
      };
    }

    function recentLearningEvents() {
      const state = getState();
      const seen = new Set();
      return state.feedbackLog
        .map((event) => {
          const normalized = titleKey(event.title);
          if (!normalized || seen.has(normalized)) return null;
          const source = getFeedbackSource(event.title);
          const weight = feedbackWeightForAction(event.action);
          if (!source || !weight) return null;
          seen.add(normalized);
          return {
            ...event,
            effect: feedbackEffectLabel(event.action),
            actionLabel: feedbackActionLabel(event.action),
            atoms: (source.atoms || []).slice(0, 3),
          };
        })
        .filter(Boolean)
        .slice(0, 4);
    }

    function libraryPlan(ranked) {
      const state = getState();
      const region = state.activeRegion;
      const pool = getRecommendationPool();
      const seen = new Set();
      const rows = [];
      const gameState = (game) => effectiveGameState(game);
      const completedCount = pool.filter((game) => gameState(game) === "completed").length;
      const playableCount = pool.filter((game) => PLAYABLE_STATES.includes(gameState(game))).length;
      const savedCount = pool.filter((game) => gameState(game) === "saved").length + playLaterQueue().length;
      const droppedCount = pool.filter((game) => gameState(game) === "dropped").length;

      function push(row) {
        if (row.title) {
          const key = titleKey(row.title);
          if (seen.has(key)) return;
          seen.add(key);
        }
        rows.push(row);
      }

      const finish = ranked.find((game) => gameState(game) === "want_to_finish");
      const playing = ranked.find((game) => gameState(game) === "playing");
      const paused = ranked.find((game) => gameState(game) === "paused");
      const access = ranked.find((game) => ACCESS_STATES.includes(gameState(game)));
      const plusSignal = ranked.find((game) => !gameState(game) && state.psPlus && game.psPlus.includes(region));
      const saved = ranked.find((game) => gameState(game) === "saved");

      if (finish) {
        push({
          label: t("library.planFinish"), title: finish.title, tag: t("library.tagWantFinish"), tone: "finish",
          detail: t("library.detailFinish"),
          game: finish,
          actions: [action("Start", "playing"), action("Pause", "paused"), action("Done", "completed")],
        });
      }

      if (playing) {
        push({
          label: t("library.planResume"), title: playing.title, tag: t("library.tagInProgress"), tone: "resume",
          detail: t("library.detailResume"),
          game: playing,
          actions: [action("Done", "completed"), action("Pause", "paused")],
        });
      }

      if (paused) {
        push({
          label: t("library.planReturn"), title: paused.title, tag: t("library.tagPaused"), tone: "paused",
          detail: t("library.detailReturn"),
          game: paused,
          actions: [action("Resume", "playing"), action("Finish", "want_to_finish"), action("Drop", "dropped")],
        });
      }

      if (access) {
        const stateLabel = localizedState(gameState(access));
        push({
          label: t("library.planUseAccess"), title: access.title, tag: stateLabel, tone: "access",
          detail: t("library.detailAccess", { state: stateLabel }),
          game: access,
          actions: [action("Start", "playing"), action("Finish", "want_to_finish"), action("Drop", "dropped")],
        });
      }

      if (saved) {
        push({
          label: t("library.planWishlist"), title: saved.title, tag: t("library.tagHotIntent"), tone: "wishlist",
          detail: t("library.detailWishlist"),
          game: saved,
          actions: [action("Owned", "owned"), action("Forever", "owned_forever"), action("Start", "playing"), action("Clear", "")],
        });
      }

      if (plusSignal) {
        push({
          label: t("library.planIncluded"), title: plusSignal.title, tag: "PS Plus", tone: "included",
          detail: t("library.detailIncluded", { region }),
          game: plusSignal,
          actions: [action("Start", "playing"), action("Plus", "subscription"), action("No", "hidden")],
        });
      }

      const memoryRow = {
        label: t("library.planMemory"),
        title: t("library.memoryTitle", { completed: completedCount, playable: playableCount }),
        tag: t("library.memoryTag", { saved: savedCount }),
        tone: "memory",
        detail: completedCount
          ? t("library.memoryWithHistory")
          : t("library.memoryWithoutHistory"),
        facts: [
          t("library.factDone", { count: completedCount }),
          t("library.factPlayable", { count: playableCount }),
          t("library.factDropped", { count: droppedCount }),
          t("library.factTasteMemory"),
        ],
      };

      if (rows.length === 0 && !completedCount && !playableCount && !savedCount) {
        rows.unshift({
          label: t("library.planNext"), title: t("library.setupTitle"), tag: t("library.tagSetup"), tone: "setup",
          detail: t("library.setupDetail"),
          facts: [t("library.factQuickSetup"), t("library.factManualOk"), t("library.factPsnLater")],
        });
      }

      return { rows: [...rows.slice(0, 5), memoryRow], playableCount, completedCount, savedCount };
    }

    function libraryPlanFacts(item) {
      if (item.facts) return item.facts.map((label) => ({ label, type: "access" }));
      if (!item.game) return [];
      const stateLabel = localizedState(effectiveGameState(item.game));
      return [
        stateLabel ? { label: stateLabel, type: "access" } : null,
        { label: t("library.factSession", { session: localizedSession(item.game.session) }), type: "time" },
        item.game.adultTimeFit ? { label: localizedAdultFit(item.game.adultTimeFit), type: "time" } : null,
        ...item.game.atoms.slice(0, 2).map((atom) => ({ label: labelAtom(atom), type: "tone" })),
      ].filter(Boolean);
    }

    function importedRatingForGame(game) {
      const state = getState();
      return state.importedRatings.find((entry) => titleMatches(entry.title, game.title));
    }

    function personalRatingFacet(game) {
      const userGame = effectiveUserGame(game);
      if (typeof userGame?.rating === "number") return { label: `${userGame.rating}/100`, source: "manual" };
      const imported = importedRatingForGame(game);
      if (imported) return { label: `${Math.round(imported.rating * 10)}/100`, source: "import" };
      return { label: t("library.noRating"), source: "taste" };
    }

    function memoryFacets(game) {
      const userGame = effectiveUserGame(game) || {};
      const rating = personalRatingFacet(game);
      return [
        {
          label: t("library.facetAccess"),
          value: userGame.access ? localizedState(userGame.access) : userGame.saved ? t("library.planWishlist") : t("library.noAccess"),
          tone: userGame.access ? "access" : userGame.saved ? "saved" : "empty",
        },
        {
          label: t("library.facetProgress"),
          value: userGame.completionStatus
            ? localizedState(userGame.completionStatus)
            : userGame.hidden ? localizedState("hidden") : t("library.notStarted"),
          tone: userGame.completionStatus || userGame.hidden ? "progress" : "empty",
        },
        {
          label: t("library.facetRating"),
          value: rating.label,
          tone: rating.source === "manual" ? "rating" : rating.source === "import" ? "imported" : "empty",
        },
      ];
    }

    function libraryNextStep(game) {
      const userGame = effectiveUserGame(game) || {};
      const lane = libraryLaneForGame(game);
      if (userGame.completionStatus === "want_to_finish") {
        return { label: t("library.next"), detail: t("library.nextFinish"), tone: "active" };
      }
      if (userGame.completionStatus === "playing") {
        return { label: t("library.next"), detail: t("library.nextPlaying"), tone: "active" };
      }
      if (userGame.completionStatus === "paused") {
        return { label: t("library.next"), detail: t("library.nextPaused"), tone: "active" };
      }
      if (ACCESS_STATES.includes(userGame.access)) {
        return { label: t("library.noSpend"), detail: t("library.nextAccess"), tone: "access" };
      }
      if (userGame.saved || game.wishlist || notebookWishlistWeight(game.title)) {
        return { label: t("library.intent"), detail: t("library.nextWishlist"), tone: "wishlist" };
      }
      if (userGame.completionStatus === "completed") {
        return { label: t("library.memory"), detail: t("library.nextCompleted"), tone: "finished" };
      }
      if (userGame.completionStatus === "dropped" || userGame.hidden) {
        return { label: t("library.memory"), detail: t("library.nextDropped"), tone: "finished" };
      }
      return {
        label: lane === "suggested" ? t("library.tryLater") : t("library.next"),
        detail: t("library.nextUnknown"),
        tone: lane,
      };
    }

    function isMemoryStateSelected(userGame, memoryState) {
      if (!memoryState) return false;
      if (ACCESS_STATES.includes(memoryState)) return userGame?.access === memoryState;
      if (COMPLETION_STATUS_STATES.includes(memoryState)) return userGame?.completionStatus === memoryState;
      if (memoryState === "saved") return Boolean(userGame?.saved);
      if (memoryState === "hidden") return Boolean(userGame?.hidden);
      return false;
    }

    function memoryHint(game, index) {
      const gameState = effectiveGameState(game);
      if (gameState) return localizedState(gameState);
      if (notebookWishlistWeight(game.title)) return t("library.wishlistHearts", { count: notebookWishlistWeight(game.title) });
      if (game.wishlist) return t("library.wishlistSignal");
      if (index === 0) return t("library.topTonight");
      return t("library.factSession", { session: localizedSession(game.session) });
    }

    function libraryMemoryRecords(ranked) {
      const rankedScores = new Map(ranked.map((game) => [titleKey(game.title), game.score]));
      const byTitle = new Map();
      [...getRecommendationPool(), ...ranked].forEach((game) => {
        const key = titleKey(game.title);
        if (!byTitle.has(key)) byTitle.set(key, game);
      });
      return [...byTitle.values()].map((game) => {
        const userGame = effectiveUserGame(game) || {};
        return {
          game,
          userGame,
          state: getLegacyStateFromUserGame(userGame),
          score: rankedScores.get(titleKey(game.title)) ?? scoreGame(game),
        };
      });
    }

    function bestLibraryRecord(records, predicate) {
      return records.filter(predicate).sort((a, b) => b.score - a.score)[0] || null;
    }

    function libraryDashboardCards(ranked) {
      const state = getState();
      const records = libraryMemoryRecords(ranked);
      const resume = bestLibraryRecord(records, ({ userGame }) => ["playing", "paused", "want_to_finish"].includes(userGame.completionStatus));
      const access = bestLibraryRecord(
        records,
        ({ userGame }) => ACCESS_STATES.includes(userGame.access) && !["completed", "dropped"].includes(userGame.completionStatus),
      );
      const wishlistRecords = records.filter(({ game, userGame }) => userGame.saved || game.wishlist || notebookWishlistWeight(game.title));
      const ratedCount = records.filter(({ game, userGame }) => typeof userGame.rating === "number" || importedRatingForGame(game)).length;
      const completedCount = records.filter(({ userGame }) => userGame.completionStatus === "completed").length;
      const activeCount = records.filter(({ userGame }) => ["playing", "paused", "want_to_finish"].includes(userGame.completionStatus)).length;
      const region = state.activeRegion;
      const wishlistBuyable = wishlistRecords.filter(({ game }) =>
        typeof game.prices?.[region] === "number" && game.prices[region] <= Number(state.budget) && priceCanGuideBuy(game, region),
      ).length;

      return [
        resume
          ? {
              label: t("library.dashboardContinue"), title: resume.game.title,
              detail: t("library.dashboardContinueDetail", {
                state: localizedState(resume.userGame.completionStatus),
                session: localizedSession(resume.game.session),
                fit: Math.max(resume.score, 0),
              }),
              actionLabel: resume.userGame.completionStatus === "want_to_finish" ? t("library.actionFinish") : t("library.actionPlay"),
              actionState: resume.userGame.completionStatus === "want_to_finish" ? "completed" : "playing",
              actionTitle: resume.game.title, tone: "play",
            }
          : access
            ? {
                label: t("library.dashboardStart"), title: access.game.title,
                detail: t("library.dashboardStartDetail", {
                  state: localizedState(access.userGame.access),
                  session: localizedSession(access.game.session),
                  fit: Math.max(access.score, 0),
                }),
                actionLabel: t("library.actionPlay"), actionState: "playing", actionTitle: access.game.title, tone: "access",
              }
            : {
                label: t("library.dashboardStart"), title: t("library.dashboardNoQueue"),
                detail: t("library.dashboardNoQueueDetail"),
                actionLabel: t("library.actionDiscover"), actionView: "discover", tone: "empty",
              },
        {
          label: t("library.dashboardNoSpend"),
          title: access ? access.game.title : t("library.dashboardAccessGames", { count: records.filter(({ userGame }) => ACCESS_STATES.includes(userGame.access)).length }),
          detail: access
            ? t("library.dashboardAccessDetail", { state: localizedState(access.userGame.access) })
            : t("library.dashboardNoAccessDetail"),
          actionLabel: access ? t("library.actionPlay") : t("library.actionTaste"),
          actionState: access ? "playing" : "",
          actionTitle: access?.game.title || "",
          actionView: access ? "" : "taste",
          tone: "access",
        },
        {
          label: t("library.dashboardWishlist"), title: t("library.dashboardWatched", { count: wishlistRecords.length }),
          detail: t("library.dashboardWishlistDetail", { count: wishlistBuyable }),
          actionLabel: t("library.actionOpen"), actionView: "wishlist", tone: "wishlist",
        },
        {
          label: t("library.dashboardTaste"), title: t("library.dashboardRated", { rated: ratedCount, completed: completedCount }),
          detail: t("library.dashboardTasteDetail", { count: activeCount }),
          actionLabel: t("library.actionRefine"), actionView: "taste", tone: "taste",
        },
      ];
    }

    function memoryCandidates(ranked) {
      const games = getGames();
      const stateful = games.filter((game) => effectiveGameState(game));
      const rated = games.filter((game) => typeof effectiveUserGame(game)?.rating === "number");
      const savedWishlist = games.filter((game) => game.wishlist || notebookWishlistWeight(game.title));
      const candidates = [...getExternalMemoryGames(), ...stateful, ...rated, ...savedWishlist, ...ranked.slice(0, 8)];
      const byTitle = new Map();
      candidates.forEach((game) => {
        if (!byTitle.has(titleKey(game.title))) byTitle.set(titleKey(game.title), game);
      });
      return [...byTitle.values()].slice(0, 8);
    }

    function libraryLaneForGame(game) {
      const userGame = effectiveUserGame(game) || {};
      if (["playing", "paused", "want_to_finish"].includes(userGame.completionStatus)) return "active";
      if (["completed", "dropped"].includes(userGame.completionStatus) || userGame.hidden) return "finished";
      if (ACCESS_STATES.includes(userGame.access)) return "access";
      if (userGame.saved || game.wishlist || notebookWishlistWeight(game.title)) return "wishlist";
      return "suggested";
    }

    function libraryFilterMatches(lane, filter) {
      if (filter === "all") return true;
      if (filter === "active") return lane === "active" || lane === "queued";
      if (filter === "finished") return lane === "finished";
      return lane === filter;
    }

    function libraryFilterSummary(filter, visibleCount, totalCount) {
      const key = LIBRARY_QUEUE_FILTERS[filter] ? filter : "all";
      return `${t(FILTER_KEYS[key][0])}: ${visibleCount}/${totalCount}. ${t(FILTER_KEYS[key][1])}`;
    }

    function queueLaneLabel(lane) {
      if (lane === "queued") return t("library.laneQueued");
      if (lane === "suggested") return t("library.laneSuggested");
      return LIBRARY_QUEUE_FILTERS[lane] ? t(FILTER_KEYS[lane][0]) : lane;
    }

    return {
      playLaterQueue,
      bestLibraryPick,
      primaryDecisionGame,
      isLibraryFirstMode,
      buyLaterCandidate,
      companionPlan,
      tasteMemory,
      invalidateTasteMemory,
      recentLearningEvents,
      libraryPlan,
      libraryPlanFacts,
      importedRatingForGame,
      personalRatingFacet,
      memoryFacets,
      libraryNextStep,
      isMemoryStateSelected,
      memoryHint,
      libraryMemoryRecords,
      bestLibraryRecord,
      libraryDashboardCards,
      memoryCandidates,
      libraryLaneForGame,
      libraryFilterMatches,
      libraryFilterSummary,
      queueLaneLabel,
    };
  }

  window.PlaySputnikLibrary = { createLibraryTools };
})();
