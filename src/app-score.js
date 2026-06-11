(() => {
  function createScoreTools({
    getState,
    getProfileGames,
    getQuickReaction,
    getFeedbackSource,
    getTasteConflict,
    getTasteSignalCount,
    titleMatches,
    titleKey,
    effectiveGameState,
    getSubscriptionStatus,
    getPriceStatus,
    QUICK_TASTE_FIRST_TARGET,
  }) {
    function gameSignals(game) {
      return [
        ...(game.atoms || []),
        game.tone,
        game.content,
        game.adultTimeFit,
        game.commitment,
      ].filter(Boolean);
    }

    function feedbackWeightForAction(action) {
      return {
        playing: 2,
        want_to_finish: 2.25,
        paused: 0.5,
        completed: 3,
        good_fit: 2,
        saved: 1,
        owned: 0.5,
        owned_forever: 0.75,
        subscription: 0.5,
        dropped: -2,
        hidden: -3,
        quick_loved: 2.5,
        quick_played: 0.75,
        quick_not_for_me: -2.5,
        rated_5: 3,
        rated_4: 1.5,
        rated_3: 0.25,
        rated_2: -1.5,
        rated_1: -3,
        rating_cleared: 0,
        drop_play_later: 2,
        drop_not_for_me: -2.5,
        drop_claim_only: -0.5,
        not_for_me: -2.5,
        quick_clear: 0,
        snooze_tonight: 0,
        clear_snoozes: 0,
        clear_state: 0,
        drop_clear: 0,
      }[action] || 0;
    }

    function feedbackActionLabel(action) {
      return {
        playing: "started playing",
        want_to_finish: "wants to finish",
        paused: "paused",
        completed: "finished",
        good_fit: "liked",
        saved: "saved",
        owned: "owns",
        owned_forever: "owns forever",
        subscription: "has in Plus",
        dropped: "dropped",
        hidden: "not for me",
        quick_loved: "loved in quick check",
        quick_played: "played in quick check",
        quick_not_for_me: "rejected in quick check",
        rated_5: "rated 5/5 sputniks",
        rated_4: "rated 4/5 sputniks",
        rated_3: "rated 3/5 sputniks",
        rated_2: "rated 2/5 sputniks",
        rated_1: "rated 1/5 sputniks",
        rating_cleared: "cleared rating",
        quick_clear: "cleared quick check",
        drop_play_later: "saved for later",
        drop_not_for_me: "rejected drop pick",
        drop_claim_only: "claim only",
        not_for_me: "not for me",
      }[action] || action.replaceAll("_", " ");
    }

    function feedbackEffectLabel(action) {
      const weight = feedbackWeightForAction(action);
      if (weight > 1) return "boosted";
      if (weight > 0) return "nudged";
      if (weight < -1) return "reduced";
      if (weight < 0) return "soft reduced";
      return "noted";
    }

    function addTasteWeight(weights, signal, value) {
      if (!signal || !value) return;
      weights[signal] = (weights[signal] || 0) + value;
    }

    // Per-render cache: feedbackTasteWeights iterates the feedback log with a
    // catalog lookup per event, and is hit per-signal-per-game through
    // combinedTasteWeight in evidence/explain paths — thousands of calls per
    // render once the log is populated (~10s renders). Cleared together with
    // the taste profile in invalidateTasteProfile().
    const _feedbackWeightsCache = { withQuick: null, withoutQuick: null };
    function feedbackTasteWeights({ includeQuick = true } = {}) {
      const slot = includeQuick ? "withQuick" : "withoutQuick";
      if (_feedbackWeightsCache[slot]) return _feedbackWeightsCache[slot];
      _feedbackWeightsCache[slot] = computeFeedbackTasteWeights({ includeQuick });
      return _feedbackWeightsCache[slot];
    }
    function computeFeedbackTasteWeights({ includeQuick = true } = {}) {
      const state = getState();
      const weights = {};
      const seen = new Set();
      state.feedbackLog.forEach((event) => {
        if (!includeQuick && String(event.action || "").startsWith("quick_")) return;
        const normalized = titleKey(event.title);
        if (!normalized || seen.has(normalized)) return;
        const source = getFeedbackSource(event.title);
        if (!source) return;
        seen.add(normalized);
        const weight = feedbackWeightForAction(event.action);
        if (!weight) return;
        gameSignals(source).forEach((signal) => {
          weights[signal] = (weights[signal] || 0) + weight;
        });
      });
      return weights;
    }

    function combinedTasteWeight(signal) {
      const state = getState();
      const feedbackWeights = feedbackTasteWeights();
      return (state.atomWeights[signal] || 0) + (feedbackWeights[signal] || 0);
    }

    function quickTasteWeights() {
      const weights = {};
      getProfileGames().forEach((game) => {
        const reaction = getQuickReaction(game.title);
        const weight = reaction === "loved" ? 2.5 : reaction === "played" ? 1 : reaction === "not_for_me" ? -2.5 : 0;
        if (!weight) return;
        gameSignals(game).forEach((signal) => addTasteWeight(weights, signal, weight));
      });
      return weights;
    }

    function legacyLikedTasteWeights() {
      const state = getState();
      const weights = {};
      getProfileGames().forEach((game) => {
        if (!state.liked.has(game.title) || getQuickReaction(game.title)) return;
        gameSignals(game).forEach((signal) => addTasteWeight(weights, signal, 1.5));
      });
      return weights;
    }

    // Per-render cache: tasteEngineProfile is invariant across all games in a
    // single ranking pass (depends only on taste signals, not region/mood/etc).
    // Computing it 456× per render cost ~850ms; cache collapses that to one call.
    // The cache is cleared at the start of every render() via invalidateTasteProfile().
    let _tasteProfileCache = null;
    function invalidateTasteProfile() {
      _tasteProfileCache = null;
      _feedbackWeightsCache.withQuick = null;
      _feedbackWeightsCache.withoutQuick = null;
    }
    function tasteEngineProfile() {
      if (_tasteProfileCache) return _tasteProfileCache;
      _tasteProfileCache = computeTasteEngineProfile();
      return _tasteProfileCache;
    }
    function computeTasteEngineProfile() {
      const state = getState();
      const combinedWeights = {};
      const sources = {
        quick: 0,
        imported: state.importedRatings.length,
        feedback: 0,
        legacyLikes: 0,
      };
      const merge = (weights, multiplier = 1) => {
        Object.entries(weights).forEach(([signal, value]) => {
          addTasteWeight(combinedWeights, signal, value * multiplier);
        });
      };

      const quickWeights = quickTasteWeights();
      const legacyWeights = legacyLikedTasteWeights();
      const nonQuickFeedbackWeights = feedbackTasteWeights({ includeQuick: false });

      merge(quickWeights);
      merge(legacyWeights);
      merge(state.atomWeights, 0.9);
      merge(nonQuickFeedbackWeights);

      sources.quick = getTasteSignalCount();
      sources.legacyLikes = Object.keys(legacyWeights).length ? state.liked.size : 0;
      sources.feedback = new Set(
        state.feedbackLog
          .filter((event) => !String(event.action || "").startsWith("quick_"))
          .filter((event) => feedbackWeightForAction(event.action))
          .map((event) => titleKey(event.title))
          .filter(Boolean),
      ).size;

      const positiveWeights = {};
      const negativeWeights = {};
      const mixedAtoms = [];
      const quickConflicts = getTasteConflict();
      Object.entries(combinedWeights).forEach(([signal, value]) => {
        const rounded = Math.round(value * 10) / 10;
        if (rounded > 0) positiveWeights[signal] = rounded;
        if (rounded < 0) negativeWeights[signal] = Math.abs(rounded);
        if (quickConflicts.atoms.includes(signal)) mixedAtoms.push(signal);
      });

      const evidenceCount = sources.quick + sources.imported + sources.feedback + state.notebook.ranked.length + state.notebook.completed.length;
      const confidence = evidenceCount >= 18 && mixedAtoms.length <= 2
        ? "High"
        : evidenceCount >= 8
          ? "Medium"
          : evidenceCount >= QUICK_TASTE_FIRST_TARGET
            ? "Starter"
            : "Early";

      return {
        positiveWeights,
        negativeWeights,
        mixedAtoms: [...new Set(mixedAtoms)].slice(0, 6),
        evidenceCount,
        confidence,
        sources,
      };
    }

    function tasteEngineGameSignals(game, profile = tasteEngineProfile()) {
      const signals = gameSignals(game);
      const positive = signals
        .filter((signal) => profile.positiveWeights[signal] > 0)
        .sort((a, b) => profile.positiveWeights[b] - profile.positiveWeights[a]);
      const negative = signals
        .filter((signal) => profile.negativeWeights[signal] > 0)
        .sort((a, b) => profile.negativeWeights[b] - profile.negativeWeights[a]);
      const mixed = signals.filter((signal) => profile.mixedAtoms.includes(signal));
      return {
        positive: [...new Set(positive)],
        negative: [...new Set(negative)],
        mixed: [...new Set(mixed)],
      };
    }

    function tasteEngineScore(game, profile = tasteEngineProfile()) {
      const signals = tasteEngineGameSignals(game, profile);
      const pullRaw = signals.positive.reduce((sum, signal) => sum + profile.positiveWeights[signal], 0);
      const cautionRaw = signals.negative.reduce((sum, signal) => sum + profile.negativeWeights[signal], 0);
      const pull = Math.min(70, Math.round(pullRaw * 6));
      const caution = -Math.min(55, Math.round(cautionRaw * 7));
      const uncertainty = signals.mixed.length
        ? -Math.min(12, signals.mixed.length * 4)
        : profile.confidence === "Early"
          ? -4
          : 0;
      return {
        pull,
        caution,
        uncertainty,
        signals,
        confidence: profile.confidence,
      };
    }

    function notebookTitles(items) {
      return new Set((items || []).map((item) => titleKey(item.title)));
    }

    function notebookWishlistWeight(title) {
      const state = getState();
      const item = state.notebook.wishlist.find((entry) => titleMatches(entry.title, title));
      return item ? item.hearts : 0;
    }

    function notebookAccessKind(title) {
      const state = getState();
      const item = state.notebook.access.find((entry) => titleMatches(entry.title, title));
      return item ? item.kind : "";
    }

    function notebookCompletedSet() {
      return notebookTitles(getState().notebook.completed);
    }

    function notebookTasteScore(game) {
      const state = getState();
      const matchedRank = state.notebook.ranked.find((entry) => titleMatches(entry.title, game.title));
      if (!matchedRank) return 0;
      if (matchedRank.rank <= 20) return 18;
      if (matchedRank.rank <= 60) return 8;
      return 2;
    }

    // ── Session chunk model ──────────────────────────────────────────────────
    // Estimates the natural "complete chunk" of a game in minutes: the shortest
    // play session after which you stop with a sense of completion (a run, a
    // race series, a story beat) rather than mid-task.
    const RUN_LABEL_ATOMS = new Set(["roguelike", "card-battler", "deck-builder"]);
    const MATCH_LABEL_ATOMS = new Set(["sports", "fighting", "racing", "party", "music", "arcade"]);
    const SHORT_SESSION_ATOMS = new Set(["puzzle", "platformer"]);
    const SLOW_BURN_ATOMS = new Set(["open-world", "rpg", "simulation", "strategy", "grind"]);

    function gameChunkProfile(game) {
      const atoms = new Set(game.atoms || []);
      const runBased = [...atoms].some((a) => RUN_LABEL_ATOMS.has(a));
      const matchBased = [...atoms].some((a) => MATCH_LABEL_ATOMS.has(a));
      const compactSession = [...atoms].some((a) => SHORT_SESSION_ATOMS.has(a));
      const slowBurn = [...atoms].some((a) => SLOW_BURN_ATOMS.has(a));
      let minutes;
      let label;
      if (runBased && !slowBurn) {
        minutes = 30;
        label = "one full run";
      } else if (matchBased && !slowBurn) {
        minutes = 30;
        label = "one complete match";
      } else if (game.session === "short") {
        minutes = 40;
        label = compactSession ? "one chapter or area" : "a complete short session";
      } else if (game.session === "medium" && !slowBurn) {
        minutes = 60;
        label = "a satisfying story beat";
      } else if (slowBurn || game.length === "massive" || game.session === "long") {
        minutes = 90;
        label = "a proper deep session";
      } else {
        minutes = 60;
        label = "a solid session";
      }
      if (game.commitment === "low") minutes = Math.min(minutes, 45);
      if (game.commitment === "high") minutes = Math.max(minutes, 75);
      return { minutes, label };
    }

    // Score how well the game's natural chunk fits the minutes available tonight.
    function tonightFitScore(game, available) {
      const { minutes } = gameChunkProfile(game);
      if (minutes <= available && minutes >= available * 0.4) return 18; // perfect fit
      if (minutes <= available) return 8;   // fits with room to spare
      if (minutes <= available * 1.3) return 0; // tight but possible
      return -14; // you'd have to stop mid-chunk
    }

    function scoreBreakdown(game) {
      const state = getState();
      const tasteProfile = tasteEngineProfile();
      const tasteScore = tasteEngineScore(game, tasteProfile);
      const notebookTaste = notebookTasteScore(game);
      const wishlistScore = notebookWishlistWeight(game.title) * 12;
      const accessKind = notebookAccessKind(game.title);
      const effectiveState = effectiveGameState(game);
      const externalScore = game.externalCandidate
        ? effectiveState === "saved" || game.wishlist
          ? 12
          : 4
        : 0;
      const accessScore =
        effectiveState === "want_to_finish" ? 20
          : effectiveState === "playing" ? 16
            : effectiveState === "owned_forever" ? 14
              : effectiveState === "owned" ? 12
                : effectiveState === "subscription" ? 10
                  : effectiveState === "paused" ? 6
                    : accessKind === "permanent" ? 14
                      : accessKind === "subscription" ? 10
                        : 0;
      const moodScore = game.atoms.includes(state.mood) || game.vibe.toLowerCase().includes(state.mood) ? 18 : 0;
      // With an explicit minute budget, the precise chunk model replaces the
      // coarse short/medium/long match (halved to avoid double counting).
      const tonightMinutes = Number(state.sessionMinutes) || 0;
      const tonightScore = tonightMinutes > 0 ? tonightFitScore(game, tonightMinutes) : 0;
      const sessionScore = (game.session === state.session ? 14 : 0) * (tonightMinutes > 0 ? 0.5 : 1);
      const difficultyScore = game.difficulty === state.difficulty ? 12 : 0;
      const plusStatus = getSubscriptionStatus(game, state.activeRegion);
      const plusScore = state.psPlus && game.psPlus.includes(state.activeRegion)
        ? plusStatus.canConfirm ? 16 : 6
        : 0;
      const price = game.prices[state.activeRegion];
      const priceSignal = getPriceStatus(game, state.activeRegion);
      const buyScore = price <= Number(state.budget) ? priceSignal.canConfirm ? 8 : 3 : -8;
      const discountScore = Math.round((game.discount[state.activeRegion] || 0) / (priceSignal.canConfirm ? 8 : 16));
      const backlogScore = game.backlog ? 7 : 0;
      const savedScore = state.saved.has(game.title) ? 4 : 0;
      const adultTimeScore =
        (state.session === "short" && game.adultTimeFit === "weeknight")
          ? 12
          : (state.session === "medium" && game.adultTimeFit === "weekend")
            ? 6
            : (state.session === "long" && game.adultTimeFit === "vacation")
              ? 8
              : 0;
      const reviewBurdenScore =
        game.reviewBurden === "low" ? 8 : game.reviewBurden === "medium" ? 3 : game.reviewBurden === "high" ? -5 : 0;
      const commitmentScore =
        state.session === "short" && game.commitment === "low"
          ? 8
          : state.session === "short" && game.commitment === "high"
            ? -8
            : 0;
      return [
        { label: "Taste engine pull", value: tasteScore.pull },
        { label: "Taste engine caution", value: tasteScore.caution },
        { label: "Taste uncertainty", value: tasteScore.uncertainty },
        { label: "Notebook rank", value: notebookTaste },
        { label: "Wishlist intent", value: wishlistScore },
        { label: "Access now", value: accessScore },
        { label: "Mood fit", value: moodScore },
        { label: "Session fit", value: sessionScore },
        { label: "Tonight time fit", value: tonightScore },
        { label: "Difficulty fit", value: difficultyScore },
        { label: "Adult time fit", value: adultTimeScore },
        { label: "Low review burden", value: reviewBurdenScore },
        { label: "Commitment fit", value: commitmentScore },
        { label: "PS Plus context", value: plusScore },
        { label: "Budget fit", value: buyScore },
        { label: "Discount signal", value: discountScore },
        { label: "Backlog memory", value: backlogScore },
        { label: "Saved feedback", value: savedScore },
        { label: "External discovery", value: externalScore },
      ];
    }

    function scoreGame(game) {
      return scoreBreakdown(game).reduce((sum, item) => sum + item.value, 0);
    }

    function personalFitBand(score) {
      if (score >= 90) return "very strong personal fit";
      if (score >= 65) return "strong personal fit";
      if (score >= 45) return "promising but not automatic";
      return "taste experiment";
    }

    function rankRangeForScore(score) {
      if (score >= 115) return [5, 12];
      if (score >= 95) return [8, 18];
      if (score >= 75) return [14, 28];
      if (score >= 55) return [24, 45];
      if (score >= 35) return [42, 70];
      return [70, 110];
    }

    return {
      gameSignals,
      feedbackWeightForAction,
      feedbackActionLabel,
      feedbackEffectLabel,
      addTasteWeight,
      feedbackTasteWeights,
      combinedTasteWeight,
      quickTasteWeights,
      legacyLikedTasteWeights,
      tasteEngineProfile,
      invalidateTasteProfile,
      tasteEngineGameSignals,
      tasteEngineScore,
      notebookTitles,
      notebookWishlistWeight,
      notebookAccessKind,
      notebookCompletedSet,
      notebookTasteScore,
      scoreBreakdown,
      scoreGame,
      gameChunkProfile,
      personalFitBand,
      rankRangeForScore,
    };
  }

  window.PlaySputnikScore = { createScoreTools };
})();
