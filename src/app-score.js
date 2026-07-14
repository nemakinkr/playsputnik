(() => {
  const t = window.PlaySputnikI18n?.t || ((key) => key);
  const HIGH_INTENSITY_ATOMS = [
    "adrenaline", "boss-rush", "challenge", "competitive", "horror",
    "precision", "souls-like", "soulslike", "tension",
  ];
  const LOW_INTENSITY_ATOMS = [
    "cozy", "routine", "slow",
  ];
  const LOW_INTENSITY_SUPPORT_ATOMS = [
    "creative", "logic", "management", "puzzle",
  ];
  const FEEDBACK_ACTION_KEYS = {
    playing: "taste.actionPlaying", want_to_finish: "taste.actionFinish", paused: "taste.actionPaused",
    completed: "taste.actionCompleted", good_fit: "taste.actionLiked", saved: "taste.actionSaved",
    owned: "taste.actionOwned", owned_forever: "taste.actionForever", subscription: "taste.actionPlus",
    dropped: "taste.actionDropped", hidden: "taste.actionHidden",
    quick_loved: "taste.actionQuickLoved", quick_played: "taste.actionQuickPlayed",
    quick_not_for_me: "taste.actionQuickRejected", rated_5: "taste.actionRated5",
    rated_4: "taste.actionRated4", rated_3: "taste.actionRated3", rated_2: "taste.actionRated2",
    rated_1: "taste.actionRated1", rating_cleared: "taste.actionRatingCleared",
    quick_clear: "taste.actionQuickCleared", drop_play_later: "taste.actionDropLater",
    drop_not_for_me: "taste.actionDropRejected", drop_claim_only: "taste.actionClaimOnly",
    not_for_me: "taste.actionHidden",
  };

  function normalizeDifficultyBand(value) {
    if (["easy", "low"].includes(value)) return "low";
    if (["hard", "high"].includes(value)) return "high";
    return "medium";
  }

  function gameDifficultyIntensityProfile(game = {}) {
    const atoms = new Set(game.atoms || []);
    const difficulty = normalizeDifficultyBand(game.difficulty);
    const explicitIntensity = ["low", "medium", "high"].includes(game.intensity)
      ? game.intensity
      : "";
    const highEvidence = HIGH_INTENSITY_ATOMS.filter((atom) => atoms.has(atom));
    const lowEvidence = LOW_INTENSITY_ATOMS.filter((atom) => atoms.has(atom));
    const lowSupport = LOW_INTENSITY_SUPPORT_ATOMS.filter((atom) => atoms.has(atom));
    const evidence = [
      game.difficulty ? `difficulty:${game.difficulty}` : "",
      explicitIntensity ? `intensity:${explicitIntensity}` : "",
      ...highEvidence.map((atom) => `atom:${atom}`),
      ...lowEvidence.map((atom) => `atom:${atom}`),
      ...lowSupport.map((atom) => `atom:${atom}`),
      game.tone === "tense" ? "tone:tense" : "",
    ].filter(Boolean);
    let intensity = explicitIntensity || "medium";
    if (!explicitIntensity && (
      difficulty === "high"
      || highEvidence.length
      || game.tone === "tense"
    )) intensity = "high";
    else if (!explicitIntensity && (
      difficulty === "low"
      || lowEvidence.length
      || lowSupport.length >= 2
    )) intensity = "low";
    return {
      difficulty,
      intensity,
      evidence,
      source: explicitIntensity ? "catalog" : "derived",
      confidence: explicitIntensity
        ? "high"
        : game.difficulty && game.difficulty !== "normal"
        ? "high"
        : evidence.length >= 3
          ? "high"
          : evidence.length >= 2
          ? "medium"
          : "low",
    };
  }

  function gameIntensityBand(game = {}) {
    return gameDifficultyIntensityProfile(game).intensity;
  }

  function gameSignalsForGame(game = {}) {
    const profile = gameDifficultyIntensityProfile(game);
    return [
      ...(game.atoms || []),
      game.tone,
      game.content,
      game.adultTimeFit,
      game.commitment,
      game.difficulty && `difficulty:${profile.difficulty}`,
      `intensity:${profile.intensity}`,
    ].filter(Boolean);
  }

  function classifyTasteVerdict({ pull = 0, caution = 0, uncertainty = 0, confidence = "Early" } = {}) {
    const cautionStrength = Math.abs(Math.min(0, caution));
    if (pull >= 24 && cautionStrength >= 14) {
      return { kind: "polarizing", confidenceCap: "Medium" };
    }
    if (cautionStrength >= 18 && cautionStrength >= pull * 0.75) {
      return { kind: "caution", confidenceCap: "Low" };
    }
    if (pull >= 30 && cautionStrength < 10 && uncertainty === 0 && confidence !== "Early") {
      return { kind: "strong", confidenceCap: "High" };
    }
    if (pull >= 16 && cautionStrength < 18) {
      return { kind: "promising", confidenceCap: confidence === "Early" ? "Low" : "Medium" };
    }
    return { kind: "exploratory", confidenceCap: "Low" };
  }

  function createScoreTools({
    getState,
    getProfileGames,
    getQuickReaction,
    getFeedbackSource,
    getTasteConflict,
    getTasteSignalCount,
    getRecommendationPool = () => [],
    getTasteReferencePool = getRecommendationPool,
    titleMatches,
    titleKey,
    effectiveGameState,
    getSubscriptionStatus,
    getPriceStatus,
    QUICK_TASTE_FIRST_TARGET,
  }) {
    function gameSignals(game) {
      return gameSignalsForGame(game);
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
      return FEEDBACK_ACTION_KEYS[action] ? t(FEEDBACK_ACTION_KEYS[action]) : action.replaceAll("_", " ");
    }

    function feedbackEffectLabel(action) {
      const weight = feedbackWeightForAction(action);
      if (weight > 1) return t("taste.effectBoosted");
      if (weight > 0) return t("taste.effectNudged");
      if (weight < -1) return t("taste.effectReduced");
      if (weight < 0) return t("taste.effectSoftReduced");
      return t("taste.effectNoted");
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
    let _calibrationCache = null;
    let _ratingRecordsCache = null;
    let _calibrationQuestionsCache = null;
    const _ratingForecastCache = new Map();
    function invalidateTasteProfile() {
      _tasteProfileCache = null;
      _calibrationCache = null;
      _ratingRecordsCache = null;
      _calibrationQuestionsCache = null;
      _ratingForecastCache.clear();
      _feedbackWeightsCache.withQuick = null;
      _feedbackWeightsCache.withoutQuick = null;
    }
    function tasteEngineProfile() {
      if (_tasteProfileCache) return _tasteProfileCache;
      _tasteProfileCache = computeTasteEngineProfile();
      return _tasteProfileCache;
    }

    function tasteIntensityPreference(profile = tasteEngineProfile()) {
      const positive = profile.positiveWeights || {};
      const negative = profile.negativeWeights || {};
      const calmScore = (positive["intensity:low"] || 0) + (negative["intensity:high"] || 0);
      const intenseScore = (positive["intensity:high"] || 0) + (negative["intensity:low"] || 0);
      const evidenceWeight = calmScore + intenseScore;
      const gap = Math.abs(calmScore - intenseScore);
      const separation = evidenceWeight ? gap / evidenceWeight : 0;
      const kind = evidenceWeight < 1.5
        ? "uncertain"
        : separation < 0.2
          ? "balanced"
          : calmScore > intenseScore
            ? "calm"
            : "intense";
      const confidence = kind === "uncertain" || separation < 0.25
        ? "low"
        : separation >= 0.5 && ["High", "Medium"].includes(profile.confidence)
          ? "high"
          : "medium";
      return {
        kind,
        confidence,
        calmScore: Math.round(calmScore * 10) / 10,
        intenseScore: Math.round(intenseScore * 10) / 10,
        evidenceWeight: Math.round(evidenceWeight * 10) / 10,
      };
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
      const confidence = evidenceCount >= 20 && mixedAtoms.length <= 2
        ? "High"
        : evidenceCount >= 10
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
      // Core atoms describe what the player does; tone/content/time metadata
      // are useful qualifiers, but must not outweigh genre and mechanics.
      // Imported profiles also accumulate larger raw weights than a five-card
      // onboarding, so normalize by evidence volume before applying caps.
      const atomSet = new Set(game.atoms || []);
      const signalImportance = (signal) => {
        if (atomSet.has(signal)) return 1;
        if (signal === game.tone) return 0.35;
        if (signal === game.content) return 0.3;
        if (signal === game.adultTimeFit) return 0.4;
        if (signal === game.commitment) return 0.35;
        if (signal.startsWith("difficulty:")) return 0.5;
        if (signal.startsWith("intensity:")) return 0.45;
        return 0.5;
      };
      const learningEvidence = Math.max(
        1,
        (profile.sources?.quick || 0)
          + (profile.sources?.imported || 0)
          + (profile.sources?.feedback || 0)
          + (profile.sources?.legacyLikes || 0),
      );
      const evidenceScale = Math.max(1, Math.sqrt(learningEvidence / QUICK_TASTE_FIRST_TARGET));
      const pullRaw = signals.positive.reduce(
        (sum, signal) => sum + profile.positiveWeights[signal] * signalImportance(signal),
        0,
      ) / evidenceScale;
      const cautionRaw = signals.negative.reduce(
        (sum, signal) => sum + profile.negativeWeights[signal] * signalImportance(signal),
        0,
      ) / evidenceScale;
      const pull = Math.min(70, Math.round(pullRaw * 6));
      const caution = -Math.min(55, Math.round(cautionRaw * 7));
      const mixedPenalty = signals.mixed.length ? Math.min(12, signals.mixed.length * 4) : 0;
      const tensionPenalty = pull >= 24 && Math.abs(caution) >= 14 ? 8 : 0;
      const earlyPenalty = profile.confidence === "Early" ? 4 : 0;
      const uncertainty = -Math.min(18, mixedPenalty + tensionPenalty + earlyPenalty);
      const verdict = classifyTasteVerdict({ pull, caution, uncertainty, confidence: profile.confidence });
      return {
        pull,
        caution,
        uncertainty,
        verdict,
        signals,
        confidence: profile.confidence,
      };
    }

    function personalRatingRecords() {
      if (_ratingRecordsCache) return _ratingRecordsCache;
      const state = getState();
      // Ratings may reference a resolved catalog/backbone/search record that
      // is intentionally not exposed as a recommendation candidate yet.
      const pool = getTasteReferencePool();
      const byTitle = new Map();
      (state.importedRatings || []).forEach((entry) => {
        const game = pool.find((candidate) => titleMatches(candidate.title, entry.title));
        if (!game || !Number.isFinite(Number(entry.rating))) return;
        byTitle.set(titleKey(game.title), {
          game,
          rating: Math.max(0, Math.min(100, Number(entry.rating) * 10)),
          source: "import",
        });
      });
      Object.values(state.userGames || {}).forEach((entry) => {
        if (!Number.isFinite(Number(entry.rating))) return;
        const game = pool.find((candidate) => titleMatches(candidate.title, entry.title));
        if (!game) return;
        byTitle.set(titleKey(game.title), {
          game,
          rating: Math.max(0, Math.min(100, Number(entry.rating))),
          source: "sputnik",
        });
      });
      _ratingRecordsCache = [...byTitle.values()];
      return _ratingRecordsCache;
    }

    function ratingFeatures(game) {
      return [
        ...(game.atoms || []).map((signal) => ({ signal, weight: 1 })),
        { signal: game.tone, weight: 0.35 },
        { signal: game.content, weight: 0.3 },
        { signal: game.adultTimeFit, weight: 0.4 },
        { signal: game.commitment, weight: 0.45 },
      ].filter((item) => item.signal);
    }

    function ratingSimilarity(a, b) {
      const aFeatures = new Map(ratingFeatures(a).map((item) => [item.signal, item.weight]));
      const bFeatures = new Map(ratingFeatures(b).map((item) => [item.signal, item.weight]));
      const union = new Set([...aFeatures.keys(), ...bFeatures.keys()]);
      const sharedWeight = [...union].reduce(
        (sum, signal) => sum + Math.min(aFeatures.get(signal) || 0, bFeatures.get(signal) || 0),
        0,
      );
      const unionWeight = [...union].reduce(
        (sum, signal) => sum + Math.max(aFeatures.get(signal) || 0, bFeatures.get(signal) || 0),
        0,
      );
      return unionWeight ? sharedWeight / unionWeight : 0;
    }

    function clampRating(value) {
      return Math.max(0, Math.min(100, value));
    }

    function rankingQualityFromHoldouts(holdouts, model) {
      const rows = holdouts.map(({ record, result }) => ({
        title: record.game.title,
        actual: record.rating,
        predicted: result.predictions[model],
      }));
      if (rows.length < 8) return null;
      const byActual = [...rows].sort((a, b) => b.actual - a.actual || a.title.localeCompare(b.title));
      const byPrediction = [...rows].sort((a, b) => b.predicted - a.predicted || a.title.localeCompare(b.title));
      const quartileSize = Math.max(1, Math.ceil(rows.length / 4));
      const topActual = new Set(byActual.slice(0, quartileSize).map((row) => row.title));
      const bottomActual = new Set(byActual.slice(-quartileSize).map((row) => row.title));
      const top10 = byPrediction.slice(0, Math.min(10, rows.length));
      const predictedTopQuartile = byPrediction.slice(0, quartileSize);
      const precisionAt10 = top10.filter((row) => topActual.has(row.title)).length / top10.length;
      const topQuartileRecall = predictedTopQuartile.filter((row) => topActual.has(row.title)).length / quartileSize;
      const bottomIntrusionsAt10 = top10.filter((row) => bottomActual.has(row.title)).length;
      let comparablePairs = 0;
      let correctlyOrderedPairs = 0;
      for (let left = 0; left < rows.length; left += 1) {
        for (let right = left + 1; right < rows.length; right += 1) {
          const actualDelta = rows[left].actual - rows[right].actual;
          if (Math.abs(actualDelta) < 4) continue;
          comparablePairs += 1;
          const predictedDelta = rows[left].predicted - rows[right].predicted;
          if (Math.sign(actualDelta) === Math.sign(predictedDelta)) correctlyOrderedPairs += 1;
          else if (predictedDelta === 0) correctlyOrderedPairs += 0.5;
        }
      }
      return {
        precisionAt10: Math.round(precisionAt10 * 100) / 100,
        topQuartileRecall: Math.round(topQuartileRecall * 100) / 100,
        bottomIntrusionsAt10,
        pairwiseAccuracy: comparablePairs
          ? Math.round((correctlyOrderedPairs / comparablePairs) * 100) / 100
          : null,
        top10: top10.map((row) => ({
          title: row.title,
          actual: Math.round(row.actual),
          predicted: Math.round(row.predicted),
          tier: topActual.has(row.title) ? "top" : bottomActual.has(row.title) ? "tail" : "middle",
        })),
      };
    }

    function ratingModelPredictions(game, records) {
      if (!records.length) return null;
      const neighbors = records
        .map((record) => ({ ...record, similarity: ratingSimilarity(game, record.game) }))
        .filter((record) => record.similarity >= 0.08)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 6);
      const baseline = records.reduce((sum, record) => sum + record.rating, 0) / records.length;
      const totalWeight = neighbors.reduce((sum, record) => sum + (record.similarity ** 2), 0);
      const rawNeighbor = totalWeight
        ? neighbors.reduce((sum, record) => sum + record.rating * (record.similarity ** 2), 0) / totalWeight
        : baseline;
      const neighborTrust = Math.min(0.82, totalWeight / 1.4);
      const neighbor = baseline + (rawNeighbor - baseline) * neighborTrust;

      const featureBiases = ratingFeatures(game)
        .map(({ signal, weight }) => {
          const matching = records.filter((record) => gameSignals(record.game).includes(signal));
          if (!matching.length) return null;
          const mean = matching.reduce((sum, record) => sum + record.rating, 0) / matching.length;
          const support = matching.length / (matching.length + 2.5);
          return { bias: (mean - baseline) * support, weight, count: matching.length };
        })
        .filter(Boolean)
        .sort((a, b) => Math.abs(b.bias * b.weight) - Math.abs(a.bias * a.weight))
        .slice(0, 5);
      const featureWeight = featureBiases.reduce((sum, item) => sum + item.weight, 0);
      const signalAdjustment = featureWeight
        ? featureBiases.reduce((sum, item) => sum + item.bias * item.weight, 0) / featureWeight
        : 0;
      const signal = baseline + Math.max(-28, Math.min(28, signalAdjustment * 1.35));
      const ensemble = neighbor * 0.55 + signal * 0.45;

      return {
        predictions: {
          baseline: clampRating(baseline),
          neighbor: clampRating(neighbor),
          signal: clampRating(signal),
          ensemble: clampRating(ensemble),
        },
        neighbors,
      };
    }

    function tasteCalibrationProfile() {
      if (_calibrationCache) return _calibrationCache;
      const records = personalRatingRecords();
      if (records.length < 3) {
        _calibrationCache = {
          count: records.length,
          ready: false,
          trusted: false,
          meanError: 0,
          meanAbsoluteError: null,
          model: "baseline",
          modelErrors: {},
          signalBias: {},
          underestimated: [],
          overestimated: [],
        };
        return _calibrationCache;
      }
      const modelResiduals = {
        baseline: [],
        neighbor: [],
        signal: [],
        ensemble: [],
      };
      const holdouts = records.map((record) => {
        const training = records.filter((candidate) => candidate !== record);
        const result = ratingModelPredictions(record.game, training);
        Object.entries(result.predictions).forEach(([model, prediction]) => {
          modelResiduals[model].push(record.rating - prediction);
        });
        return { record, result };
      });
      const modelErrors = Object.fromEntries(
        Object.entries(modelResiduals).map(([model, residuals]) => [
          model,
          Math.round((residuals.reduce((sum, value) => sum + Math.abs(value), 0) / residuals.length) * 10) / 10,
        ]),
      );
      const rankingQualityByModel = Object.fromEntries(
        Object.keys(modelResiduals).map((candidateModel) => [
          candidateModel,
          rankingQualityFromHoldouts(holdouts, candidateModel),
        ]),
      );
      const byError = Object.entries(modelErrors).sort((a, b) => a[1] - b[1]);
      const bestError = byError[0][1];
      const rankingUtility = (candidateModel) => {
        const quality = rankingQualityByModel[candidateModel];
        if (!quality) return -1;
        return quality.precisionAt10 * 0.55
          + quality.topQuartileRecall * 0.25
          + quality.pairwiseAccuracy * 0.2;
      };
      // For a deep profile, a tiny MAE win should not select a model that
      // reconstructs the user's favorite tier much worse. Keep numeric error
      // within 1.5 points of the best model, then optimize ranking quality.
      // With fewer than 20 ratings the top-10 holdout is too noisy, so retain
      // pure MAE selection for onboarding and early profiles.
      const model = records.length >= 20
        ? byError
          .filter(([, error]) => error <= bestError + 1.5)
          .sort((a, b) => rankingUtility(b[0]) - rankingUtility(a[0]) || a[1] - b[1])[0][0]
        : byError[0][0];
      const residuals = modelResiduals[model];
      const rankingQuality = rankingQualityByModel[model];
      const signalResiduals = {};
      holdouts.forEach(({ record }, index) => {
        const residual = residuals[index];
        gameSignals(record.game).forEach((signal) => {
          const current = signalResiduals[signal] || { sum: 0, count: 0 };
          current.sum += residual;
          current.count += 1;
          signalResiduals[signal] = current;
        });
      });
      const signalBias = Object.fromEntries(
        Object.entries(signalResiduals)
          .filter(([, value]) => value.count >= 2)
          .map(([signal, value]) => [signal, Math.round((value.sum / value.count) * 10) / 10]),
      );
      const rankedBias = Object.entries(signalBias).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
      const meanAbsoluteError = Math.round((residuals.reduce((sum, value) => sum + Math.abs(value), 0) / residuals.length) * 10) / 10;
      _calibrationCache = {
        count: records.length,
        ready: records.length >= 5,
        trusted: records.length >= 5 && meanAbsoluteError <= 25,
        meanError: Math.round((residuals.reduce((sum, value) => sum + value, 0) / residuals.length) * 10) / 10,
        meanAbsoluteError,
        model,
        bestError,
        modelErrors,
        rankingQualityByModel,
        rankingQuality,
        signalBias,
        underestimated: rankedBias.filter(([, value]) => value >= 4).slice(0, 3),
        overestimated: rankedBias.filter(([, value]) => value <= -4).slice(0, 3),
      };
      return _calibrationCache;
    }

    function personalRatingForecast(game) {
      const cacheKey = titleKey(game.title);
      if (_ratingForecastCache.has(cacheKey)) return _ratingForecastCache.get(cacheKey);
      const records = personalRatingRecords();
      const known = records.find((record) => titleMatches(record.game.title, game.title));
      if (known) {
        const result = { known: true, rating: Math.round(known.rating), count: records.length, neighbors: [] };
        _ratingForecastCache.set(cacheKey, result);
        return result;
      }
      const predictionSet = ratingModelPredictions(game, records);
      if (!predictionSet) {
        const result = { known: false, rating: null, count: 0, neighbors: [] };
        _ratingForecastCache.set(cacheKey, result);
        return result;
      }
      const calibration = tasteCalibrationProfile();
      const baseRating = predictionSet.predictions[calibration.model] ?? predictionSet.predictions.baseline;
      const biases = gameSignals(game)
        .map((signal) => calibration.signalBias[signal])
        .filter(Number.isFinite);
      const signalAdjustment = biases.length
        ? biases.reduce((sum, value) => sum + value, 0) / biases.length
        : 0;
      const adjustment = calibration.trusted
        ? Math.max(-12, Math.min(12, calibration.meanError * 0.35 + signalAdjustment * 0.65))
        : 0;
      const result = {
        known: false,
        rating: Math.round(clampRating(baseRating + adjustment)),
        count: records.length,
        neighbors: predictionSet.neighbors.slice(0, 3).map((record) => record.game.title),
        adjustment: Math.round(adjustment * 10) / 10,
        calibrated: calibration.trusted,
        model: calibration.model,
      };
      _ratingForecastCache.set(cacheKey, result);
      return result;
    }

    function calibrationQuestionGames(limit = 3) {
      if (_calibrationQuestionsCache) return _calibrationQuestionsCache.slice(0, limit);
      const records = personalRatingRecords();
      const ratedTitles = new Set(records.map((record) => titleKey(record.game.title)));
      const skippedTitles = new Set(Object.keys(getState().calibrationSkips || {}));
      const signalSupport = {};
      records.forEach((record) => {
        new Set(gameSignals(record.game)).forEach((signal) => {
          signalSupport[signal] = (signalSupport[signal] || 0) + 1;
        });
      });
      const calibration = tasteCalibrationProfile();
      const knownTitles = new Set(getProfileGames().map((game) => titleKey(game.title)));
      const candidates = getRecommendationPool()
        .filter((game) => (
          game?.title
          && !ratedTitles.has(titleKey(game.title))
          && !skippedTitles.has(titleKey(game.title))
        ))
        .map((game) => {
          const predictionSet = ratingModelPredictions(game, records);
          const predictions = predictionSet ? Object.values(predictionSet.predictions) : [];
          const disagreement = predictions.length ? Math.max(...predictions) - Math.min(...predictions) : 0;
          const signals = [...new Set(gameSignals(game))];
          const sparseSignals = signals.filter((signal) => (signalSupport[signal] || 0) < 2);
          const biasSignals = signals
            .filter((signal) => Number.isFinite(calibration.signalBias[signal]))
            .sort((a, b) => Math.abs(calibration.signalBias[b]) - Math.abs(calibration.signalBias[a]));
          const recognition = Math.max(0, Math.min(10, ((game.criticScore || 65) - 65) / 3));
          const informationScore = disagreement * 2.4
            + sparseSignals.length * 7
            + (biasSignals.length ? Math.abs(calibration.signalBias[biasSignals[0]]) * 1.4 : 0)
            + recognition
            + (knownTitles.has(titleKey(game.title)) ? 28 : 0);
          const reason = disagreement >= 12 ? "disagreement" : biasSignals.length ? "bias" : "coverage";
          return {
            game,
            reason,
            signals: reason === "bias" ? biasSignals.slice(0, 2) : sparseSignals.slice(0, 2),
            disagreement: Math.round(disagreement),
            informationScore,
          };
        })
        .sort((a, b) => b.informationScore - a.informationScore);

      const selected = [];
      const selectedSignals = new Set();
      while (selected.length < 3 && candidates.length) {
        candidates.sort((a, b) => {
          const penalty = (item) => gameSignals(item.game)
            .filter((signal) => selectedSignals.has(signal)).length * 8;
          return (b.informationScore - penalty(b)) - (a.informationScore - penalty(a));
        });
        const next = candidates.shift();
        selected.push(next);
        gameSignals(next.game).forEach((signal) => selectedSignals.add(signal));
      }
      _calibrationQuestionsCache = selected;
      return selected.slice(0, limit);
    }

    function notebookTitles(items) {
      return new Set((items || []).map((item) => titleKey(item.title)));
    }

    function notebookWishlistWeight(title) {
      const state = getState();
      const item = state.notebook.wishlist.find((entry) => titleMatches(entry.title, title));
      return item ? item.hearts : 0;
    }

    function wishlistIntentScore(hearts) {
      const weight = Math.max(0, Math.round(Number(hearts) || 0));
      if (weight >= 3) return 84 + (weight - 3) * 24;
      if (weight === 2) return 44;
      if (weight === 1) return 12;
      return 0;
    }

    function notebookAccessKind(title) {
      const state = getState();
      const item = state.notebook.access.find((entry) => titleMatches(entry.title, title));
      return item ? item.kind : "";
    }

    function notebookCompletedSet() {
      return notebookTitles(getState().notebook.completed);
    }

    function notebookRankedSet() {
      return notebookTitles(getState().notebook.ranked);
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
      const wishlistScore = wishlistIntentScore(notebookWishlistWeight(game.title));
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

    // Convert the calibrated personal rating back onto the user's own ranked
    // list. Unlike scoreGame(), this deliberately excludes tonight's budget,
    // access, mood, and session context: those choose what to play now, not
    // where a game belongs in the user's long-term taste ranking.
    function rankRangeForPersonalRating(rating, rankingSize, meanAbsoluteError = 10) {
      if (!Number.isFinite(rating) || !Number.isFinite(rankingSize) || rankingSize < 2) return null;
      const size = Math.round(rankingSize);
      const insertionPositions = size + 1;
      const topRating = 100;
      const tailRating = 58;
      const normalized = Math.max(0, Math.min(1, (topRating - rating) / (topRating - tailRating)));
      const center = 1 + Math.round(normalized * size);
      const boundedError = Number.isFinite(meanAbsoluteError)
        ? Math.max(3, Math.min(18, meanAbsoluteError))
        : 10;
      const spread = Math.max(5, Math.round((boundedError / (topRating - tailRating)) * size));
      return [
        Math.max(1, center - spread),
        Math.min(insertionPositions, center + spread),
      ];
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
      tasteIntensityPreference,
      invalidateTasteProfile,
      tasteEngineGameSignals,
      tasteEngineScore,
      classifyTasteVerdict,
      personalRatingRecords,
      tasteCalibrationProfile,
      personalRatingForecast,
      calibrationQuestionGames,
      notebookTitles,
      notebookWishlistWeight,
      wishlistIntentScore,
      notebookAccessKind,
      notebookCompletedSet,
      notebookRankedSet,
      notebookTasteScore,
      scoreBreakdown,
      scoreGame,
      gameChunkProfile,
      personalFitBand,
      rankRangeForScore,
      rankRangeForPersonalRating,
    };
  }

  window.PlaySputnikScore = {
    createScoreTools,
    classifyTasteVerdict,
    gameSignalsForGame,
    gameDifficultyIntensityProfile,
    normalizeDifficultyBand,
    gameIntensityBand,
  };
})();
