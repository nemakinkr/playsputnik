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
            source: "Drop inbox",
            detail: dropItem ? `${dropItem.trialWindow} / ${dropItem.predictedRank}` : "Saved for later",
            atoms: dropItem?.atoms || [],
            nextAction: dropItem?.nextAction || "Try when there is a matching evening slot.",
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
      const rows = [];

      if (topGame) {
        const rationale = decisionRationale(topGame);
        const topState = effectiveGameState(topGame);
        rows.push({
          id: `play-${topGame.title}`,
          label: "Tonight",
          title: topGame.title,
          tag: topState || `${topGame.session} session`,
          detail: rationale.headline,
        });
      }

      if (accessGame) {
        const rationale = decisionRationale(accessGame);
        rows.push({
          id: `access-${accessGame.title}`,
          label: getIsAlreadyAvailable(accessGame) ? "Use access" : "Subscription",
          title: accessGame.title,
          tag: effectiveGameState(accessGame) || "PS Plus signal",
          detail: rationale.headline,
        });
      }

      if (radarLead) {
        rows.push({
          id: `radar-${radarLead.title}`,
          label: "Watch",
          title: radarLead.title,
          tag: radarLead.window,
          detail: radarLead.reason,
        });
      }

      if (buyLater) {
        const status = priceStatus(buyLater, region);
        rows.push({
          id: `buy-${buyLater.title}`,
          label: "Buy later",
          title: buyLater.title,
          tag: status.canConfirm ? "price ok" : "verify price",
          detail: `${region} ${formatPrice(buyLater, region)} / ${buyLater.discount[region]}% ${status.canConfirm ? "off" : "signal"}. ${dealReason(buyLater)}.`,
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
          label: "Finish", title: finish.title, tag: "want to finish", tone: "finish",
          detail: "You already marked this as worth finishing, so it should outrank random browsing.",
          game: finish,
          actions: [{ label: "Start", state: "playing" }, { label: "Pause", state: "paused" }, { label: "Done", state: "completed" }],
        });
      }

      if (playing) {
        push({
          label: "Resume", title: playing.title, tag: "in progress", tone: "resume",
          detail: "Highest-fit active game. Keep momentum instead of starting a new long decision loop.",
          game: playing,
          actions: [{ label: "Done", state: "completed" }, { label: "Pause", state: "paused" }],
        });
      }

      if (paused) {
        push({
          label: "Return later", title: paused.title, tag: "paused", tone: "paused",
          detail: "Keep it visible, but below games you actively want to finish tonight.",
          game: paused,
          actions: [{ label: "Resume", state: "playing" }, { label: "Finish", state: "want_to_finish" }, { label: "Drop", state: "dropped" }],
        });
      }

      if (access) {
        const stateLabel = USER_STATE_LABELS[gameState(access)] || gameState(access);
        push({
          label: "Use access", title: access.title, tag: stateLabel, tone: "access",
          detail: `${stateLabel} and strong taste fit. Treat this as the default before checking sales.`,
          game: access,
          actions: [{ label: "Start", state: "playing" }, { label: "Finish", state: "want_to_finish" }, { label: "Drop", state: "dropped" }],
        });
      }

      if (saved) {
        push({
          label: "Wishlist", title: saved.title, tag: "hot intent", tone: "wishlist",
          detail: "Keep it in the hot list. Price checks should focus here, not on the whole store.",
          game: saved,
          actions: [{ label: "Owned", state: "owned" }, { label: "Forever", state: "owned_forever" }, { label: "Start", state: "playing" }, { label: "Clear", state: "" }],
        });
      }

      if (plusSignal) {
        push({
          label: "Included", title: plusSignal.title, tag: "PS Plus", tone: "included",
          detail: `Looks relevant and may be available through subscription context in ${region}. Try before buying.`,
          game: plusSignal,
          actions: [{ label: "Start", state: "playing" }, { label: "Plus", state: "subscription" }, { label: "No", state: "hidden" }],
        });
      }

      const memoryRow = {
        label: "Memory",
        title: `${completedCount} completed / ${playableCount} playable`,
        tag: `${savedCount} saved`,
        tone: "memory",
        detail: completedCount
          ? "Completed and dropped games stay as taste evidence; playable and saved games become the active queue."
          : "Mark a few finished games to make recommendations less generic.",
        facts: [`${completedCount} done`, `${playableCount} playable`, `${droppedCount} dropped`, "taste memory"],
      };

      if (rows.length === 0 && !completedCount && !playableCount && !savedCount) {
        rows.unshift({
          label: "Next", title: "Import or mark 3 games", tag: "setup", tone: "setup",
          detail: "A PSN import, quick manual states, or a pasted note is enough to build the first personal queue.",
          facts: ["quick setup", "manual ok", "PSN later"],
        });
      }

      return { rows: [...rows.slice(0, 5), memoryRow], playableCount, completedCount, savedCount };
    }

    function libraryPlanFacts(item) {
      if (item.facts) return item.facts.map((label) => ({ label, type: "access" }));
      if (!item.game) return [];
      const stateLabel = USER_STATE_LABELS[effectiveGameState(item.game)];
      return [
        stateLabel ? { label: stateLabel, type: "access" } : null,
        { label: `${item.game.session} session`, type: "time" },
        item.game.adultTimeFit ? { label: item.game.adultTimeFit, type: "time" } : null,
        ...item.game.atoms.slice(0, 2).map((atom) => ({ label: atom, type: "tone" })),
      ].filter(Boolean);
    }

    function importedRatingForGame(game) {
      const state = getState();
      return state.importedRatings.find((entry) => titleMatches(entry.title, game.title));
    }

    function personalRatingFacet(game) {
      const userGame = effectiveUserGame(game);
      if (typeof userGame?.rating === "number") return { label: `${userGame.rating}/100`, source: "Manual" };
      const imported = importedRatingForGame(game);
      if (imported) return { label: `${Math.round(imported.rating * 10)}/100`, source: "Import" };
      return { label: "No rating", source: "Taste only" };
    }

    function memoryFacets(game) {
      const userGame = effectiveUserGame(game) || {};
      const rating = personalRatingFacet(game);
      return [
        {
          label: "Access",
          value: userGame.access ? USER_STATE_LABELS[userGame.access] || userGame.access : userGame.saved ? "Wishlist" : "No access",
          tone: userGame.access ? "access" : userGame.saved ? "saved" : "empty",
        },
        {
          label: "Progress",
          value: userGame.completionStatus
            ? USER_STATE_LABELS[userGame.completionStatus] || userGame.completionStatus
            : userGame.hidden ? "Hidden" : "Not started",
          tone: userGame.completionStatus || userGame.hidden ? "progress" : "empty",
        },
        {
          label: "Rating",
          value: rating.label,
          tone: rating.source === "Manual" ? "rating" : rating.source === "Import" ? "imported" : "empty",
        },
      ];
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
      if (gameState) return USER_STATE_LABELS[gameState] || gameState;
      if (notebookWishlistWeight(game.title)) return `${notebookWishlistWeight(game.title)} wishlist hearts`;
      if (game.wishlist) return "Wishlist signal";
      if (index === 0) return "Top tonight";
      return `${game.session} session`;
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
              label: "Continue", title: resume.game.title,
              detail: `${USER_STATE_LABELS[resume.userGame.completionStatus]} / ${resume.game.session} session / ${Math.max(resume.score, 0)} fit.`,
              actionLabel: resume.userGame.completionStatus === "want_to_finish" ? "Finish" : "Play",
              actionState: resume.userGame.completionStatus === "want_to_finish" ? "completed" : "playing",
              actionTitle: resume.game.title, tone: "play",
            }
          : access
            ? {
                label: "Start", title: access.game.title,
                detail: `${USER_STATE_LABELS[access.userGame.access]} / no purchase needed / ${Math.max(access.score, 0)} fit.`,
                actionLabel: "Play", actionState: "playing", actionTitle: access.game.title, tone: "access",
              }
            : {
                label: "Start", title: "No active queue yet",
                detail: "Mark a few games as owned, subscription, playing, or play later to make this section useful.",
                actionLabel: "Discover", actionView: "discover", tone: "empty",
              },
        {
          label: "No-spend",
          title: access ? access.game.title : `${records.filter(({ userGame }) => ACCESS_STATES.includes(userGame.access)).length} access games`,
          detail: access
            ? `${USER_STATE_LABELS[access.userGame.access]} is the best library-first option before buying more.`
            : "Connect/import a library or mark owned games to unlock purchase guardrails.",
          actionLabel: access ? "Play" : "Taste",
          actionState: access ? "playing" : "",
          actionTitle: access?.game.title || "",
          actionView: access ? "" : "taste",
          tone: "access",
        },
        {
          label: "Wishlist", title: `${wishlistRecords.length} watched`,
          detail: `${wishlistBuyable} inside budget now. Use Wishlist to buy, wait, or mark as already owned.`,
          actionLabel: "Open", actionView: "wishlist", tone: "wishlist",
        },
        {
          label: "Taste memory", title: `${ratedCount} rated / ${completedCount} done`,
          detail: `${activeCount} active queue items. More ratings make rank forecasts less hand-wavy.`,
          actionLabel: "Refine", actionView: "taste", tone: "taste",
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
      const copy = LIBRARY_QUEUE_FILTERS[filter] || LIBRARY_QUEUE_FILTERS.all;
      return `${copy.label}: ${visibleCount}/${totalCount}. ${copy.summary}`;
    }

    function queueLaneLabel(lane) {
      if (lane === "queued") return "Play later";
      if (lane === "suggested") return "Suggested";
      return LIBRARY_QUEUE_FILTERS[lane]?.label || lane;
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
