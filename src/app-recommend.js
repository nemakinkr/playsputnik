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
    getEditorialEntry,
    USER_STATE_LABELS,
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

    function localizedSession(value) {
      const keys = {
        short: "narrative.recommend.sessionShort",
        medium: "narrative.recommend.sessionMedium",
        long: "narrative.recommend.sessionLong",
      };
      return keys[value] ? t(keys[value]) : value;
    }

    function localizedUserSession(value) {
      const keys = {
        short: "narrative.recommend.userSessionShort",
        medium: "narrative.recommend.userSessionMedium",
        long: "narrative.recommend.userSessionLong",
      };
      return keys[value] ? t(keys[value]) : value;
    }

    function localizedAdultFit(value) {
      const keys = {
        anytime: "narrative.recommend.adultAnytime",
        background: "narrative.recommend.adultBackground",
        evening: "narrative.recommend.adultEvening",
        vacation: "narrative.recommend.adultVacation",
        weekend: "narrative.recommend.adultWeekend",
        weeknight: "narrative.recommend.adultWeeknight",
      };
      return keys[value] ? t(keys[value]) : value || t("narrative.recommend.adultAnytime");
    }

    function localizedBurden(value) {
      const keys = {
        low: "narrative.recommend.burdenLow",
        medium: "narrative.recommend.burdenMedium",
        high: "narrative.recommend.burdenHigh",
      };
      return keys[value] ? t(keys[value]) : t("narrative.recommend.burdenUnknown");
    }

    function localizedCommitment(value) {
      const keys = {
        low: "narrative.recommend.commitmentLow",
        medium: "narrative.recommend.commitmentMedium",
        high: "narrative.recommend.commitmentHigh",
      };
      return keys[value] ? t(keys[value]) : t("narrative.recommend.commitmentUnknown");
    }

    function localizedFitBand(score) {
      if (score >= 90) return t("narrative.recommend.fitVeryStrong");
      if (score >= 65) return t("narrative.recommend.fitStrong");
      if (score >= 45) return t("narrative.recommend.fitPromising");
      return t("narrative.recommend.fitExperiment");
    }

    function localizedConfidence(value) {
      const keys = {
        Low: "narrative.common.confidenceLow",
        Medium: "narrative.common.confidenceMedium",
        High: "narrative.common.confidenceHigh",
        Known: "narrative.recommend.forecastKnownConfidence",
        "Ranking estimate": "narrative.recommend.forecastEstimateConfidence",
      };
      return keys[value] ? t(keys[value]) : value;
    }

    function localizedLength(value) {
      const keys = {
        short: "narrative.detail.lengthShort",
        medium: "narrative.detail.lengthMedium",
        long: "narrative.detail.lengthLong",
        massive: "narrative.detail.lengthMassive",
      };
      return keys[value] ? t(keys[value]) : value;
    }

    function localizedTone(value) {
      const keys = {
        dark: "narrative.detail.toneDark",
        epic: "narrative.detail.toneEpic",
        funny: "narrative.detail.toneFunny",
        grim: "narrative.detail.toneGrim",
        light: "narrative.detail.toneLight",
        melancholic: "narrative.detail.toneMelancholic",
        moody: "narrative.detail.toneMoody",
        neutral: "narrative.detail.toneNeutral",
        strange: "narrative.detail.toneStrange",
        tense: "narrative.detail.toneTense",
        warm: "narrative.detail.toneWarm",
      };
      return keys[value] ? t(keys[value]) : value;
    }

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
      const editorial = getEditorialEntry?.(game);
      if (editorial?.summary) return editorial.summary;
      const atoms = labelAtoms((game.atoms || []).slice(0, 2), " + ") || t("narrative.detail.needsTags");
      const timeFit = game.adultTimeFit
        ? t("narrative.recommend.descriptionBestFit", { fit: localizedAdultFit(game.adultTimeFit) })
        : t("narrative.recommend.descriptionFlexible");
      return t("narrative.recommend.description", {
        vibe: game.vibe,
        atoms,
        length: localizedLength(game.length),
        burden: localizedBurden(game.reviewBurden),
        timeFit,
      });
    }

    function gameTagline(game) {
      return getEditorialEntry?.(game)?.tagline || game.vibe;
    }

    function watchOuts(game) {
      const state = getState();
      const warnings = [];
      const tasteSignals = tasteEngineGameSignals(game);
      const negativeSignals = tasteSignals.negative.slice(0, 2);
      const mixedSignals = tasteSignals.mixed.slice(0, 2);
      if (negativeSignals.length) warnings.push(t("narrative.recommend.watchNegative", { signals: labelAtoms(negativeSignals, " + ") }));
      if (mixedSignals.length && !negativeSignals.length) warnings.push(t("narrative.recommend.watchMixed", { signals: labelAtoms(mixedSignals, " + ") }));
      if (state.session === "short" && game.commitment === "high") warnings.push(t("narrative.recommend.watchHeavyShort"));
      if (game.session !== state.session && game.session === "long") warnings.push(t("narrative.recommend.watchLongSession"));
      if (game.reviewBurden === "high") warnings.push(t("narrative.recommend.watchReview"));
      if (game.difficulty === "high" && state.difficulty === "low") warnings.push(t("narrative.recommend.watchDifficulty"));
      if (game.content === "dark" && state.mood === "cozy") warnings.push(t("narrative.recommend.watchDark"));
      if (!warnings.length && game.commitment === "medium") warnings.push(t("narrative.recommend.watchMediumCommitment"));
      return warnings.slice(0, 2);
    }

    function watchOutCopy(game) {
      const warnings = watchOuts(game);
      return warnings.length
        ? { kind: "warning", label: t("narrative.recommend.watchLabel"), detail: warnings.join("; ") }
        : { kind: "low", label: t("narrative.recommend.lowRiskLabel"), detail: t("narrative.recommend.lowRiskDetail") };
    }

    function answerAccessLabel(game) {
      const state = getState();
      const access = effectiveGameState(game);
      if (access) return localizedState(access);
      if (state.psPlus && game.psPlus.includes(state.activeRegion)) return t("narrative.recommend.plusSignal");
      return "";
    }

    function explain(game, score) {
      const state = getState();
      const region = state.activeRegion;
      const facts = [];
      const tasteProfile = tasteEngineProfile();
      const tasteSignals = tasteEngineGameSignals(game, tasteProfile);
      if (tasteSignals.positive.length) facts.push(t("narrative.recommend.factTaste", { signals: labelAtoms(tasteSignals.positive.slice(0, 2), " + ") }));
      if (tasteSignals.mixed.length) facts.push(t("narrative.recommend.factMixed", { signals: labelAtoms(tasteSignals.mixed.slice(0, 2), " + ") }));
      if (notebookWishlistWeight(game.title)) facts.push(t("narrative.recommend.factWishlist", { count: notebookWishlistWeight(game.title) }));
      if (notebookAccessKind(game.title)) facts.push(t("narrative.recommend.factAccess", { access: notebookAccessKind(game.title) }));
      if (game.session === state.session) facts.push(t("narrative.recommend.factSession", { session: localizedSession(state.session) }));
      if (game.psPlus.includes(region) && state.psPlus) {
        const status = subscriptionStatus(game, region);
        facts.push(status.canConfirm
          ? t("narrative.recommend.factPlus", { region })
          : t("narrative.recommend.factPlusSignal", { region }));
      }
      if (game.adultTimeFit === "weeknight") facts.push(t("narrative.recommend.factWeeknight"));
      if (game.reviewBurden === "low") facts.push(t("narrative.recommend.factReview"));
      if (game.backlog) facts.push(t("narrative.recommend.factBacklog"));
      if (game.wishlist) facts.push(t("narrative.recommend.factWishlistSeed"));
      if (game.prices[region] <= Number(state.budget)) {
        const status = priceStatus(game, region);
        const budget = formatMoney(Number(state.budget));
        facts.push(status.canConfirm
          ? t("narrative.recommend.factBudget", { budget })
          : t("narrative.recommend.factBudgetSignal", { budget }));
      }
      const reason = facts.length
        ? t("narrative.recommend.reasonFacts", { facts: facts.slice(0, 3).join(" · ") })
        : t("narrative.recommend.reasonSparse");
      const rawConfidence = tasteProfile.confidence === "Early"
        ? "Low"
        : score > 80 && tasteProfile.confidence !== "Starter"
          ? "High"
          : score > 55
            ? "Medium"
            : "Low";
      return { reason, confidence: localizedConfidence(rawConfidence), confidenceKind: rawConfidence.toLowerCase() };
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
        if (state.liked.has(profileGame.title) || reaction === "loved") {
          add(profileGame.title, 10, t("narrative.recommend.referenceLoved"));
        } else if (reaction === "played") {
          add(profileGame.title, 4, t("narrative.recommend.referencePlayed"));
        }
      });

      state.importedRatings.forEach((rating) => {
        if (rating.rating >= 8) add(rating.title, Math.round(rating.rating), `${Math.round(rating.rating)}/10`);
      });

      state.notebook.ranked
        .filter((entry) => entry.rank <= 30)
        .forEach((entry) => add(
          entry.title,
          Math.max(2, 12 - Math.floor(entry.rank / 4)),
          t("narrative.recommend.referenceRank", { rank: entry.rank }),
        ));

      getRecommendationPool()
        .filter((item) => ["completed", "want_to_finish", "playing"].includes(effectiveGameState(item)))
        .forEach((item) => {
          const userState = effectiveGameState(item);
          add(item.title, userState === "completed" ? 8 : 6, localizedState(userState));
        });

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
      const confidenceKind = rankedEntry
        ? "Known"
        : hasRankingBaseline
          ? "Ranking estimate"
          : signalCount >= 12 || references.length >= 2
            ? "High"
            : signalCount >= 5 || references.length
              ? "Medium"
              : "Low";
      const confidence = localizedConfidence(confidenceKind);

      const reasons = [];
      if (rankedEntry) reasons.push(t("narrative.recommend.forecastReasonRank", { rank: rankedEntry.rank }));
      if (references.length) {
        reasons.push(t("narrative.recommend.forecastReasonNear", {
          titles: references.map((item) => item.title).slice(0, 2).join(" + "),
        }));
      }
      if (positiveAtoms.length) {
        reasons.push(t("narrative.recommend.forecastReasonSignal", { signals: positiveAtoms.join(" + ") }));
      }
      const accessLabel = answerAccessLabel(game);
      if (accessLabel) reasons.push(t("narrative.recommend.forecastReasonAccess", { access: accessLabel }));
      if (!reasons.length) reasons.push(t("narrative.recommend.forecastReasonFit", { fit: localizedFitBand(score) }));

      const detail = warning
        ? t("narrative.recommend.forecastDetailRisk", {
            confidence,
            reasons: reasons.slice(0, 2).join("; "),
            risk: warning,
          })
        : t("narrative.recommend.forecastDetail", {
            confidence,
            reasons: reasons.slice(0, 2).join("; "),
          });

      if (rankedEntry) {
        return {
          label: t("narrative.recommend.forecastKnownLabel", { rank: rankedEntry.rank }),
          confidence,
          confidenceKind,
          detail,
        };
      }

      if (hasRankingBaseline) {
        const [low, high] = rankRangeForScore(score);
        return {
          label: t("narrative.recommend.forecastLabel", { low, high }),
          confidence,
          confidenceKind,
          detail,
        };
      }

      const fit = localizedFitBand(score);
      return {
        label: t("narrative.recommend.forecastFitLabel", { fit }),
        confidence,
        confidenceKind,
        detail: warning
          ? t("narrative.recommend.forecastFitDetailRisk", {
              confidence,
              reasons: reasons.slice(0, 2).join("; "),
              risk: warning,
            })
          : t("narrative.recommend.forecastFitDetail", {
              confidence,
              reasons: reasons.slice(0, 2).join("; "),
            }),
      };
    }

    function personalEvidence(game) {
      const state = getState();
      const references = personalReferenceGames(game);
      const tasteProfile = tasteEngineProfile();
      const tasteSignals = tasteEngineGameSignals(game, tasteProfile);
      const sharedAtoms = tasteSignals.positive.slice(0, 3);
      const userState = effectiveGameState(game);
      const stateLabel = userState ? localizedState(userState) : "";
      const wishlistHearts = notebookWishlistWeight(game.title);
      const rankedEntry = state.notebook.ranked.find((entry) => titleMatches(entry.title, game.title));
      const warning = watchOuts(game)[0];
      const lines = [];

      if (references.length) {
        const names = references.map((item) => item.title).slice(0, 2).join(" + ");
        const atoms = labelAtoms([...new Set(references.flatMap((item) => item.shared))].slice(0, 3));
        lines.push({
          label: t("narrative.recommend.evidenceTaste"),
          detail: t("narrative.recommend.evidenceTasteReferences", { titles: names, signals: atoms }),
        });
      } else if (sharedAtoms.length) {
        lines.push({
          label: t("narrative.recommend.evidenceTaste"),
          detail: t("narrative.recommend.evidenceTasteSignals", { signals: labelAtoms(sharedAtoms) }),
        });
      }

      if (stateLabel) {
        lines.push({
          label: t("narrative.recommend.evidenceLibrary"),
          detail: t("narrative.recommend.evidenceLibraryDetail", { state: stateLabel }),
        });
      } else if (wishlistHearts) {
        lines.push({
          label: t("narrative.recommend.evidenceIntent"),
          detail: t("narrative.recommend.evidenceHearts", { count: wishlistHearts }),
        });
      } else if (game.wishlist) {
        lines.push({
          label: t("narrative.recommend.evidenceIntent"),
          detail: t("narrative.recommend.evidenceSeedWishlist"),
        });
      }

      if (rankedEntry) {
        lines.push({
          label: t("narrative.recommend.evidenceRanking"),
          detail: t("narrative.recommend.evidenceRankingDetail", { rank: rankedEntry.rank }),
        });
      } else {
        lines.push({
          label: t("narrative.recommend.evidenceFit"),
          detail: t("narrative.recommend.evidenceFitDetail", {
            fit: localizedFitBand(scoreGame(game)),
            session: localizedSession(game.session),
            adultFit: localizedAdultFit(game.adultTimeFit),
          }),
        });
      }

      lines.push({
        label: warning
          ? t("narrative.recommend.evidenceRisk")
          : t("narrative.recommend.evidenceFriction"),
        detail: warning || t("narrative.recommend.evidenceFrictionDetail", {
          burden: localizedBurden(game.reviewBurden),
          commitment: localizedCommitment(game.commitment),
        }),
      });

      return {
        summary: lines[0]?.detail || t("narrative.recommend.evidenceFallback", {
          fit: localizedFitBand(scoreGame(game)),
        }),
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
      const headline = accessState
        ? t("narrative.recommend.rationaleState", {
            state: localizedState(accessState),
            forecast: forecast.label,
            gameSession: localizedSession(game.session),
            session: localizedUserSession(state.session),
          })
        : accessLabel
          ? t("narrative.recommend.rationaleAccess", {
              access: accessLabel,
              forecast: forecast.label,
              gameSession: localizedSession(game.session),
              session: localizedUserSession(state.session),
            })
          : t("narrative.recommend.rationaleNoAccess", {
              forecast: forecast.label,
              gameSession: localizedSession(game.session),
              session: localizedUserSession(state.session),
            });
      const priceCopy = typeof game.prices?.[region] === "number"
        ? `${region} ${formatPrice(game, region)}`
        : t("narrative.recommend.pricePending");

      return {
        label: accessState || accessLabel
          ? t("narrative.recommend.rationalePlay")
          : t("narrative.recommend.rationaleTaste"),
        headline,
        detail: t("narrative.recommend.rationaleDetail", { reason, evidence: evidence.summary }),
        proof: evidence.summary,
        risk: t("narrative.recommend.rationaleRisk", {
          label: watchout.label,
          detail: watchout.detail,
        }),
        price: priceCopy,
        confidence,
        forecast,
        watchout,
        evidence,
        chips: [
          confidence,
          forecast.label,
          accessState ? localizedState(accessState) : accessLabel || priceCopy,
        ].filter(Boolean),
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
            {
              label: t("narrative.detail.discount", {
                discount,
                kind: priceSignal.canConfirm
                  ? t("narrative.detail.discountOff")
                  : t("narrative.detail.discountSignal"),
              }),
              type: priceSignal.canConfirm ? "price" : "warn",
            },
          ]
        : [
            { label: t("narrative.detail.priceMissing"), type: "warn" },
            { label: t("narrative.detail.storeVerify"), type: "warn" },
          ];

      facts.push({
        label: isPlusListed
          ? plusSignal.canConfirm ? "PS Plus" : t("narrative.detail.plusSignal")
          : game.externalCandidate ? t("narrative.detail.plusUnknown") : t("narrative.detail.notInPlus"),
        type: isPlusListed ? plusSignal.canConfirm ? "plus" : "warn" : "warn",
      });
      facts.push({ label: localizedLength(game.length), type: "" });
      if (game.backlog) facts.push({ label: t("narrative.detail.backlog"), type: "" });
      if (game.wishlist) facts.push({ label: t("narrative.detail.wishlist"), type: "" });
      if (game.externalCandidate) {
        const userGame = effectiveUserGame(game) || {};
        facts.push({
          label: userGame.atoms?.length
            ? t("narrative.detail.sourceTags")
            : t("narrative.detail.aiInferred"),
          type: "tone",
        });
      }
      const notebookHearts = notebookWishlistWeight(game.title);
      const access = notebookAccessKind(game.title);
      const userState = effectiveGameState(game);
      if (notebookHearts) facts.push({ label: t("narrative.detail.hearts", { count: notebookHearts }), type: "intent" });
      if (userState) facts.push({ label: localizedState(userState), type: "access" });
      else if (access) facts.push({ label: access, type: "access" });
      const coverKeys = {
        verified: "narrative.detail.coverVerified",
        candidate: "narrative.detail.coverCandidate",
        fallback: "narrative.detail.coverGenerated",
      };
      facts.push({
        label: t(coverKeys[game.coverMeta?.status] || "narrative.detail.coverCheck"),
        type: game.coverMeta?.status === "fallback" ? "cover" : "price",
      });
      if (game.adultTimeFit) facts.push({ label: localizedAdultFit(game.adultTimeFit), type: "time" });
      if (game.tone) facts.push({ label: localizedTone(game.tone), type: "tone" });
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
      gameTagline,
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
