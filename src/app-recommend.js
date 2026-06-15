/* PlaySputnik Recommend Module — explain, evidence, price signals, access labels */
"use strict";
(function () {
  if (!window.PlaySputnikConfig) throw new Error("app-config must load before app-recommend");
  if (!window.PlaySputnikState) throw new Error("app-state must load before app-recommend");
  if (!window.PlaySputnikSearch) throw new Error("app-search must load before app-recommend");
  if (!window.PlaySputnikScore) throw new Error("app-score must load before app-recommend");

  function createRecommendTools({
    getState,
    getProfileGames,
    getQuickReaction,
    getSourceGames,
    getRecommendationPool,
    getRefreshPolicy,
    tasteEngineProfile,
    tasteEngineGameSignals,
    scoreGame,
    personalFitBand,
    rankRangeForScore,
    notebookWishlistWeight,
    notebookAccessKind,
    effectiveGameState,
    effectiveUserGame,
    titleMatches,
    titleKey,
    USER_STATE_LABELS,
  }) {
    function snapshotAgeHours(checkedAt) {
      const timestamp = Date.parse(checkedAt);
      if (Number.isNaN(timestamp)) return Infinity;
      return Math.max(0, (Date.now() - timestamp) / 3600000);
    }

    function layerPolicy(layer) {
      const policy = getRefreshPolicy();
      return policy?.layers?.[layer] || {
        freshHours: layer === "subscriptions" ? 24 : 12,
        staleHours: layer === "subscriptions" ? 72 : 48,
      };
    }

    function signalStatus(record, layer) {
      if (!record) return { state: "missing", label: "missing", canConfirm: false };
      const policy = layerPolicy(layer);
      const age = snapshotAgeHours(record.checkedAt);
      const hasTrustedConfidence = ["medium", "high"].includes(record.confidence);
      if (record.freshnessState === "sample") return { state: "sample", label: "sample", canConfirm: false };
      if (record.freshnessState === "stale" || age > policy.staleHours) return { state: "stale", label: "stale", canConfirm: false };
      if (!hasTrustedConfidence) return { state: "verify", label: "verify", canConfirm: false };
      if (age > policy.freshHours) return { state: "aging", label: "aging", canConfirm: false };
      return { state: "fresh", label: "fresh", canConfirm: true };
    }

    function priceStatus(game, region) {
      return signalStatus(game.priceMeta?.[region], "prices");
    }

    function subscriptionStatus(game, region) {
      return signalStatus(game.subscriptionMeta?.[region], "subscriptions");
    }

    function coverLabel(game) {
      const cover = game.coverMeta;
      if (!cover) return "Cover missing";
      if (cover.status === "verified") return "Cover verified";
      if (cover.status === "candidate") return "Cover candidate";
      if (cover.status === "fallback") return "Generated poster";
      return "Cover check";
    }

    function formatMoney(amount, currency = "USD") {
      if (typeof amount !== "number") return "No target";
      try {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
        }).format(amount);
      } catch {
        return `$${amount}`;
      }
    }

    function formatPrice(game, region) {
      const snapshot = game.priceMeta?.[region];
      const price = game.prices?.[region];
      if (typeof price !== "number") return "No price";
      return formatMoney(price, snapshot?.currency || "USD");
    }

    function priceCanGuideBuy(game, region) {
      const status = priceStatus(game, region);
      return status.canConfirm || status.state === "sample" || status.state === "verify";
    }

    function gameDescription(game) {
      const atoms = (game.atoms || []).slice(0, 2).join(" + ");
      const timeFit = game.adultTimeFit ? `Best fit: ${game.adultTimeFit}` : "Flexible session fit";
      return `${game.vibe}. ${atoms} pick with ${game.length} length and ${game.reviewBurden || "unknown"} review burden. ${timeFit}.`;
    }

    function watchOuts(game) {
      const state = getState();
      const warnings = [];
      const tasteSignals = tasteEngineGameSignals(game);
      const negativeSignals = tasteSignals.negative.slice(0, 2);
      const mixedSignals = tasteSignals.mixed.slice(0, 2);
      if (negativeSignals.length) warnings.push(`your taste model is cautious about ${negativeSignals.join(" + ")}`);
      if (mixedSignals.length && !negativeSignals.length) warnings.push(`early signals are still mixed around ${mixedSignals.join(" + ")}`);
      if (state.session === "short" && game.commitment === "high") warnings.push("may be too heavy for a short evening");
      if (game.session !== state.session && game.session === "long") warnings.push("wants a longer session");
      if (game.reviewBurden === "high") warnings.push("needs more review/context before starting");
      if (game.difficulty === "high" && state.difficulty === "low") warnings.push("may be more demanding than today's mood");
      if (game.content === "dark" && state.mood === "cozy") warnings.push("tone may be darker than the current mood");
      if (!warnings.length && game.commitment === "medium") warnings.push("not a pure low-commitment snack");
      return warnings.slice(0, 2);
    }

    function watchOutCopy(game) {
      const warnings = watchOuts(game);
      return warnings.length
        ? { label: "Watch out", detail: warnings.join("; ") }
        : { label: "Low risk", detail: "no major warning from current memory" };
    }

    function answerAccessLabel(game) {
      const state = getState();
      const access = effectiveGameState(game);
      if (access) return USER_STATE_LABELS[access] || access;
      if (state.psPlus && game.psPlus.includes(state.activeRegion)) return "PS Plus signal";
      return "";
    }

    function explain(game, score) {
      const state = getState();
      const region = state.activeRegion;
      const facts = [];
      const tasteProfile = tasteEngineProfile();
      const tasteSignals = tasteEngineGameSignals(game, tasteProfile);
      if (tasteSignals.positive.length) facts.push(`matches your ${tasteSignals.positive.slice(0, 2).join(" + ")} taste`);
      if (tasteSignals.mixed.length) facts.push(`is still a calibration pick around ${tasteSignals.mixed.slice(0, 2).join(" + ")}`);
      if (notebookWishlistWeight(game.title)) facts.push(`has ${notebookWishlistWeight(game.title)} wishlist hearts`);
      if (notebookAccessKind(game.title)) facts.push(`${notebookAccessKind(game.title)} access`);
      if (game.session === state.session) facts.push(`fits a ${state.session} session`);
      if (game.psPlus.includes(region) && state.psPlus) {
        const status = subscriptionStatus(game, region);
        facts.push(status.canConfirm ? `available in PS Plus for ${region}` : `has a PS Plus signal for ${region}`);
      }
      if (game.adultTimeFit === "weeknight") facts.push("easy to choose on a weeknight");
      if (game.reviewBurden === "low") facts.push("low review burden");
      if (game.backlog) facts.push("already in your backlog");
      if (game.wishlist) facts.push("already on your wishlist");
      if (game.prices[region] <= Number(state.budget)) {
        const status = priceStatus(game, region);
        facts.push(status.canConfirm ? `under your $${state.budget} ceiling` : `last price signal is under your $${state.budget} ceiling`);
      }
      const reason = facts.length
        ? `Recommended because it ${facts.slice(0, 3).join(", ")}.`
        : "Recommended as a diversified pick while the profile is still sparse.";
      const confidence = tasteProfile.confidence === "Early"
        ? "Low"
        : score > 80 && tasteProfile.confidence !== "Starter"
          ? "High"
          : score > 55
            ? "Medium"
            : "Low";
      return { reason, confidence };
    }

    function personalReferenceGames(game) {
      const state = getState();
      const profileGames = getProfileGames();
      const byTitle = new Map();
      const add = (title, strength, sourceLabel) => {
        const source = getSourceGames().find((item) => titleMatches(item.title, title));
        if (!source || titleMatches(source.title, game.title)) return;
        const shared = (source.atoms || []).filter((atom) => game.atoms.includes(atom));
        if (!shared.length) return;
        const key = titleKey(source.title);
        const current = byTitle.get(key);
        const entry = { title: source.title, shared, strength, sourceLabel, score: shared.length * 10 + strength };
        if (!current || entry.score > current.score) byTitle.set(key, entry);
      };

      profileGames.forEach((profileGame) => {
        const reaction = getQuickReaction(profileGame.title);
        if (state.liked.has(profileGame.title) || reaction === "loved") add(profileGame.title, 10, "loved");
        else if (reaction === "played") add(profileGame.title, 4, "played");
      });

      state.importedRatings.forEach((rating) => {
        if (rating.rating >= 8) add(rating.title, Math.round(rating.rating), `${Math.round(rating.rating)}/10`);
      });

      state.notebook.ranked
        .filter((entry) => entry.rank <= 30)
        .forEach((entry) => add(entry.title, Math.max(2, 12 - Math.floor(entry.rank / 4)), `rank #${entry.rank}`));

      getRecommendationPool()
        .filter((item) => ["completed", "want_to_finish", "playing"].includes(effectiveGameState(item)))
        .forEach((item) => add(item.title, effectiveGameState(item) === "completed" ? 8 : 6, USER_STATE_LABELS[effectiveGameState(item)]));

      return [...byTitle.values()].sort((a, b) => b.score - a.score).slice(0, 3);
    }

    function personalRankForecast(game) {
      const state = getState();
      const rankedEntry = state.notebook.ranked.find((entry) => titleMatches(entry.title, game.title));
      const hasRankingBaseline = state.notebook.ranked.length >= 10;
      const references = personalReferenceGames(game);
      const tasteProfile = tasteEngineProfile();
      const tasteSignals = tasteEngineGameSignals(game, tasteProfile);
      const positiveAtoms = tasteSignals.positive.slice(0, 2);
      const warning = watchOuts(game)[0];
      const score = scoreGame(game);
      const signalCount = tasteProfile.evidenceCount;
      const confidence = rankedEntry
        ? "Known"
        : hasRankingBaseline
          ? "Ranking estimate"
          : signalCount >= 12 || references.length >= 2
            ? "High"
            : signalCount >= 5 || references.length
              ? "Medium"
              : "Low";

      const reasons = [];
      if (rankedEntry) reasons.push(`already in imported ranking at #${rankedEntry.rank}`);
      if (references.length) reasons.push(`near ${references.map((item) => item.title).slice(0, 2).join(" + ")}`);
      if (positiveAtoms.length) reasons.push(`strong ${positiveAtoms.join(" + ")} signal`);
      if (answerAccessLabel(game)) reasons.push(`${answerAccessLabel(game)} lowers friction`);
      if (!reasons.length) reasons.push(personalFitBand(score));

      if (rankedEntry) {
        return {
          label: `Known rank #${rankedEntry.rank}`,
          confidence,
          detail: `${confidence}: ${reasons.slice(0, 2).join("; ")}${warning ? `. Risk: ${warning}` : "."}`,
        };
      }

      if (hasRankingBaseline) {
        const [low, high] = rankRangeForScore(score);
        return {
          label: `Forecast #${low}-${high}`,
          confidence,
          detail: `${confidence}: ${reasons.slice(0, 2).join("; ")}${warning ? `. Risk: ${warning}` : "."}`,
        };
      }

      return {
        label: `Fit tier: ${personalFitBand(score)}`,
        confidence,
        detail: `${confidence} fit estimate, not a rank: ${reasons.slice(0, 2).join("; ")}${warning ? `. Risk: ${warning}` : "."}`,
      };
    }

    function personalEvidence(game) {
      const state = getState();
      const references = personalReferenceGames(game);
      const tasteProfile = tasteEngineProfile();
      const tasteSignals = tasteEngineGameSignals(game, tasteProfile);
      const sharedAtoms = tasteSignals.positive.slice(0, 3);
      const stateLabel = USER_STATE_LABELS[effectiveGameState(game)];
      const wishlistHearts = notebookWishlistWeight(game.title);
      const rankedEntry = state.notebook.ranked.find((entry) => titleMatches(entry.title, game.title));
      const warning = watchOuts(game)[0];
      const lines = [];

      if (references.length) {
        const names = references.map((item) => item.title).slice(0, 2).join(" + ");
        const atoms = [...new Set(references.flatMap((item) => item.shared))].slice(0, 3).join(" / ");
        lines.push({ label: "Taste bridge", detail: `Closest to your ${names}; shared signals: ${atoms}.` });
      } else if (sharedAtoms.length) {
        lines.push({ label: "Taste bridge", detail: `Matches the taste engine's strongest current signals: ${sharedAtoms.join(" / ")}.` });
      }

      if (stateLabel) {
        lines.push({ label: "Library logic", detail: `${stateLabel} means this can become a decision, not another store-browsing loop.` });
      } else if (wishlistHearts) {
        lines.push({ label: "Intent", detail: `${wishlistHearts} wishlist hearts make it a hot personal candidate.` });
      } else if (game.wishlist) {
        lines.push({ label: "Intent", detail: "Already carries wishlist intent in the seed catalog." });
      }

      if (rankedEntry) {
        lines.push({ label: "Ranking memory", detail: `Your imported ranking already places it at #${rankedEntry.rank}.` });
      } else {
        lines.push({ label: "Fit band", detail: `${personalFitBand(scoreGame(game))}; best shape is ${game.session} / ${game.adultTimeFit || "flexible"}.` });
      }

      lines.push({
        label: warning ? "Personal risk" : "Friction",
        detail: warning || `${game.reviewBurden || "unknown"} review burden, ${game.commitment || "unknown"} commitment.`,
      });

      return {
        summary: lines[0]?.detail || `${personalFitBand(scoreGame(game))} from current taste memory.`,
        references,
        lines: lines.slice(0, 4),
      };
    }

    function decisionRationale(game) {
      const state = getState();
      const region = state.activeRegion;
      const { reason, confidence } = explain(game, scoreGame(game));
      const forecast = personalRankForecast(game);
      const evidence = personalEvidence(game);
      const watchout = watchOutCopy(game);
      const accessState = effectiveGameState(game);
      const accessLabel = answerAccessLabel(game);
      const accessCopy = accessState
        ? `${USER_STATE_LABELS[accessState] || accessState}: use memory before browsing.`
        : accessLabel
          ? `${accessLabel}: test access before buying.`
          : "No access shortcut: use taste fit before opening the store.";
      const sessionCopy = {
        short: "short evening",
        medium: "1-2 hour session",
        long: "long session",
      }[state.session] || `${state.session} session`;
      const priceCopy = typeof game.prices?.[region] === "number"
        ? `${region} ${formatPrice(game, region)}`
        : "price pending";

      return {
        label: accessState || accessLabel ? "Same logic: play before buy" : "Same logic: taste before store",
        headline: `${accessCopy} ${forecast.label}; ${game.session} game for a ${sessionCopy}.`,
        detail: `${reason} ${evidence.summary}`,
        proof: evidence.summary,
        risk: `${watchout.label}: ${watchout.detail}.`,
        price: priceCopy,
        confidence,
        forecast,
        watchout,
        evidence,
        chips: [confidence, forecast.label, accessState ? USER_STATE_LABELS[accessState] || accessState : accessLabel || priceCopy].filter(Boolean),
      };
    }

    function factList(game) {
      const state = getState();
      const region = state.activeRegion;
      const priceSignal = priceStatus(game, region);
      const plusSignal = subscriptionStatus(game, region);
      const discount = game.discount[region] || 0;
      const isPlusListed = game.psPlus.includes(region);
      const hasPrice = typeof game.prices?.[region] === "number";
      const facts = hasPrice
        ? [
            { label: `${region} ${formatPrice(game, region)}`, type: priceSignal.canConfirm ? "price" : "warn" },
            { label: `${discount}% ${priceSignal.canConfirm ? "off" : "signal"}`, type: priceSignal.canConfirm ? "price" : "warn" },
          ]
        : [
            { label: "Price missing", type: "warn" },
            { label: "Store verify", type: "warn" },
          ];

      facts.push({
        label: isPlusListed ? plusSignal.canConfirm ? "PS Plus" : "Plus signal" : game.externalCandidate ? "Plus unknown" : "Not in Plus",
        type: isPlusListed ? plusSignal.canConfirm ? "plus" : "warn" : "warn",
      });
      facts.push({ label: game.length, type: "" });
      if (game.backlog) facts.push({ label: "Backlog", type: "" });
      if (game.wishlist) facts.push({ label: "Wishlist", type: "" });
      if (game.externalCandidate) {
        const userGame = effectiveUserGame(game) || {};
        facts.push({ label: userGame.atoms?.length ? "Source tags" : "AI inferred", type: "tone" });
      }
      const notebookHearts = notebookWishlistWeight(game.title);
      const access = notebookAccessKind(game.title);
      const userState = effectiveGameState(game);
      if (notebookHearts) facts.push({ label: `${notebookHearts} hearts`, type: "intent" });
      if (userState) facts.push({ label: USER_STATE_LABELS[userState] || userState, type: "access" });
      else if (access) facts.push({ label: access, type: "access" });
      facts.push({ label: coverLabel(game), type: game.coverMeta?.status === "fallback" ? "cover" : "price" });
      if (game.adultTimeFit) facts.push({ label: game.adultTimeFit, type: "time" });
      if (game.tone) facts.push({ label: game.tone, type: "tone" });
      return facts;
    }

    return {
      snapshotAgeHours,
      layerPolicy,
      signalStatus,
      priceStatus,
      subscriptionStatus,
      coverLabel,
      formatMoney,
      formatPrice,
      priceCanGuideBuy,
      gameDescription,
      watchOuts,
      watchOutCopy,
      answerAccessLabel,
      explain,
      personalReferenceGames,
      personalRankForecast,
      personalEvidence,
      decisionRationale,
      factList,
    };
  }

  window.PlaySputnikRecommend = { createRecommendTools };
})();
