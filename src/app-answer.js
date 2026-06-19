/* PlaySputnik Answer Module — companion answer logic, first-run bridge, receipt */
"use strict";
(function () {
  if (!window.PlaySputnikConfig) throw new Error("app-config must load before app-answer");
  if (!window.PlaySputnikRecommend) throw new Error("app-recommend must load before app-answer");

  const {
    QUICK_TASTE_FIRST_TARGET,
    QUICK_TASTE_USABLE_TARGET,
    QUICK_TASTE_SHARP_TARGET,
  } = window.PlaySputnikConfig;
  const SESSION_KEYS = {
    short: "narrative.recommend.sessionShort",
    medium: "narrative.recommend.sessionMedium",
    long: "narrative.recommend.sessionLong",
  };
  const STATE_KEYS = {
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

  function createAnswerTools({
    getState,
    getQuickTasteSignalCount,
    getPrimaryDecisionGame,
    getIsLibraryFirstMode,
    getPlayLaterQueue,
    getBuyLaterCandidate,
    getTasteMemory,
    getKnownGamesTasteSummary,
    getTasteGateState,
    getBlocksPurchase,
    getEntryLabel,
    getSourceGames,
    getSelectedAtoms,
    getIsAlreadyAvailable,
    // from recommend module
    explain,
    watchOutCopy,
    personalEvidence,
    personalRankForecast,
    decisionRationale,
    answerAccessLabel,
    priceStatus,
    formatPrice,
    // from state module
    effectiveGameState,
    // from search module
    titleMatches,
    // from enrichment module
    countValues,
    topEntries,
  }) {
    function localizedConfidence(value) {
      const keys = { Low: "narrative.common.confidenceLow", Medium: "narrative.common.confidenceMedium", High: "narrative.common.confidenceHigh" };
      return keys[value] ? t(keys[value]) : value;
    }

    function localizedSession(value) {
      const keys = { short: "narrative.common.sessionShort", medium: "narrative.common.sessionMedium", long: "narrative.common.sessionLong" };
      return keys[value] ? t(keys[value]) : value;
    }

    function localizedSessionMode(value) {
      const keys = { short: "narrative.answer.modeShort", medium: "narrative.answer.modeMedium", long: "narrative.answer.modeLong" };
      return keys[value] ? t(keys[value]) : value;
    }

    function renderEvidenceRows(evidence, limit = 4) {
      return evidence.lines.slice(0, limit).map((item) => `
        <div class="evidence-row">
          <span>${item.label}</span>
          <p>${item.detail}</p>
        </div>
      `).join("");
    }

    function renderUndoStrip(extraClass = "") {
      const state = getState();
      const undo = state.lastUndo;
      if (!undo) return "";
      return `
        <div class="undo-strip ${extraClass}">
          <span>${undo.label} ${undo.title}</span>
          <button data-undo-last type="button">Undo</button>
        </div>
      `;
    }

    function isAnswerAccessible(game) {
      const state = getState();
      return Boolean(game && (getIsAlreadyAvailable(game) || (state.psPlus && game.psPlus.includes(state.activeRegion))));
    }

    function answerFitLine(game) {
      const evidence = personalEvidence(game);
      const { confidence } = explain(game, game.score);
      const access = answerAccessLabel(game);
      const accessPrefix = access ? `${access}. ` : "";
      return `${accessPrefix}${confidence} fit: ${evidence.summary}`;
    }

    function answerForecast(game) {
      return personalRankForecast(game);
    }

    function uniqueAnswerGames(items) {
      const seen = new Set();
      return items.filter((game) => {
        if (!game) return false;
        const key = game.title.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    function companionAgendaActions(game) {
      return [
        { id: "play", label: t("narrative.answer.agendaPlay"), title: game.title },
        { id: "save", label: t("narrative.answer.agendaSave"), title: game.title },
        { id: "snooze", label: t("narrative.answer.agendaSnooze"), title: game.title },
      ];
    }

    function companionAlternatives(ranked, topGame) {
      const state = getState();
      const isNotTop = (game) => !topGame || !titleMatches(game.title, topGame.title);
      const accessAlternative = ranked.find((game) => isNotTop(game) && isAnswerAccessible(game));
      const sessionAlternative = ranked.find((game) => (
        isNotTop(game)
        && !titleMatches(game.title, accessAlternative?.title)
        && (game.session === state.session || game.adultTimeFit === "weeknight")
      ));
      const pureTasteAlternative = ranked.find((game) => (
        isNotTop(game)
        && !titleMatches(game.title, accessAlternative?.title)
        && !titleMatches(game.title, sessionAlternative?.title)
      ));

      return uniqueAnswerGames([accessAlternative, sessionAlternative, pureTasteAlternative])
        .slice(0, 2)
        .map((game, index) => ({
          label: index === 0 && isAnswerAccessible(game)
            ? t("narrative.answer.alternativeAccess")
            : t("narrative.answer.alternative", { number: index + 1 }),
          title: game.title,
          detail: answerFitLine(game),
          tone: isAnswerAccessible(game) ? "access" : "neutral",
          forecast: answerForecast(game),
          actions: companionAgendaActions(game),
        }));
    }

    function companionBuyGuardrail(ranked, topGame, alternatives) {
      const state = getState();
      const region = state.activeRegion;
      const alternativeTitles = alternatives.map((item) => item.title);
      const availablePick = [topGame, ...ranked.filter((game) => alternativeTitles.some((title) => titleMatches(title, game.title)))]
        .find(isAnswerAccessible);
      const buyLater = getBuyLaterCandidate(ranked);

      if (availablePick) {
        return {
          label: t("narrative.answer.guardLabel"),
          title: t("narrative.answer.guardNoStoreTitle"),
          detail: t("narrative.answer.guardNoStoreDetail", { title: availablePick.title }),
          tone: "guard",
        };
      }

      if (buyLater) {
        return {
          label: t("narrative.answer.guardLabel"),
          title: t("narrative.answer.guardWatchTitle", { title: buyLater.title }),
          detail: t("narrative.answer.guardWatchDetail", { price: formatPrice(buyLater, region) }),
          tone: "guard",
        };
      }

      return {
        label: t("narrative.answer.guardLabel"),
        title: t("narrative.answer.guardQuietTitle"),
        detail: t("narrative.answer.guardQuietDetail"),
        tone: "guard",
      };
    }

    // Per-render cache: the agenda (~270ms — scans ranked + per-game forecasts)
    // is computed identically by both companionAnswer() and firstRunBridge() in
    // the same render. Key by topGame title; cleared at render() start.
    let _agendaCache = { key: null, value: null };
    function invalidateCompanionAgenda() {
      _agendaCache = { key: null, value: null };
    }
    function companionAnswerAgenda(ranked, topGame) {
      if (!topGame) return [];
      if (_agendaCache.key === topGame.title) return _agendaCache.value;
      const value = computeCompanionAnswerAgenda(ranked, topGame);
      _agendaCache = { key: topGame.title, value };
      return value;
    }
    function computeCompanionAnswerAgenda(ranked, topGame) {
      const alternatives = companionAlternatives(ranked, topGame);
      const primaryAccess = answerAccessLabel(topGame);
      return [
        {
          label: getIsLibraryFirstMode(topGame)
            ? t("narrative.answer.agendaLibrary")
            : primaryAccess
              ? t("narrative.answer.agendaAccess")
              : t("narrative.answer.agendaStart"),
          title: topGame.title,
          detail: decisionRationale(topGame).headline,
          tone: isAnswerAccessible(topGame) ? "access" : "primary",
          forecast: answerForecast(topGame),
          actions: companionAgendaActions(topGame),
        },
        ...alternatives,
        companionBuyGuardrail(ranked, topGame, alternatives),
      ];
    }

    function companionAnswer(ranked) {
      const state = getState();
      const topGame = getPrimaryDecisionGame(ranked);
      if (!topGame) {
        return {
          status: t("narrative.answer.noPickStatus"),
          title: t("narrative.answer.noPickTitle"),
          paragraphs: [t("narrative.answer.noPickDetail")],
          agenda: [],
          chips: [t("narrative.answer.tasteNeeded")],
          actions: state.snoozed.size ? [{ id: "clear-snoozes", label: t("narrative.answer.actionReset") }] : [],
        };
      }
      const { confidence } = explain(topGame, topGame.score);
      const watchout = watchOutCopy(topGame);
      const evidence = personalEvidence(topGame);
      const memory = getTasteMemory();
      const topLikes = memory.likes.map((item) => item.label).slice(0, 3);
      const libraryMode = getIsLibraryFirstMode(topGame);
      const queued = getPlayLaterQueue()[0];
      const fallback = ranked.find((game) => !titleMatches(game.title, topGame.title));
      const queueCopy = queued
        ? t("narrative.answer.queueSaved", { title: queued.title })
        : t("narrative.answer.queueEmpty");
      const riskKey = watchout.kind === "low"
        ? fallback ? "narrative.answer.lowRiskFallback" : "narrative.answer.lowRiskNoFallback"
        : fallback ? "narrative.answer.cautionFallback" : "narrative.answer.cautionNoFallback";
      const riskCopy = t(riskKey, { fallback: fallback?.title || "" });
      const session = localizedSession(state.session);
      const primaryCopy = libraryMode
        ? t("narrative.answer.primaryLibrary", { title: topGame.title, session })
        : topLikes.length
          ? t("narrative.answer.primaryTasteWithLikes", { title: topGame.title, session, likes: topLikes.join(" + ") })
          : t("narrative.answer.primaryTaste", { title: topGame.title, session });
      const mode = libraryMode ? t("narrative.answer.modeLibrary") : localizedSessionMode(state.session);
      const confidenceLabel = localizedConfidence(confidence);
      const status = state.snoozed.size
        ? t("narrative.answer.statusWithSkips", { confidence: confidenceLabel, mode, count: state.snoozed.size })
        : t("narrative.answer.status", { confidence: confidenceLabel, mode });
      return {
        gameTitle: topGame.title,
        status,
        title: libraryMode
          ? t("narrative.answer.titleLibrary", { title: topGame.title })
          : t("narrative.answer.titleGeneral", { title: topGame.title }),
        paragraphs: [
          primaryCopy,
          riskCopy,
          queueCopy,
        ],
        evidence,
        agenda: companionAnswerAgenda(ranked, topGame),
        chips: [topGame.session, confidence, watchout.label, state.activeRegion],
        actions: [
          { id: "play", label: t("narrative.answer.actionPlay"), title: topGame.title },
          { id: "save", label: t("narrative.answer.actionSave"), title: topGame.title },
          { id: "snooze", label: t("narrative.answer.actionSnooze"), title: topGame.title },
          ...(state.snoozed.size ? [{ id: "clear-snoozes", label: t("narrative.answer.actionReset") }] : []),
        ],
      };
    }

    function firstRunTasteProof(topGame) {
      const gate = getTasteGateState();
      const tasteSummary = getKnownGamesTasteSummary();
      const pull = tasteSummary.pull.length
        ? tasteSummary.pull.slice(0, 3).join(" / ")
        : t("narrative.firstRun.proofEarlyTaste");
      const caution = gate.conflict.hasConflict
        ? t("narrative.firstRun.proofMixed", { signals: gate.conflict.atoms.join(" / ") })
        : tasteSummary.caution.length
          ? tasteSummary.caution.slice(0, 2).join(" / ")
          : t("narrative.firstRun.proofNoDislikes");
      const matchingAtoms = (topGame?.atoms || []).filter((atom) => tasteSummary.pull.includes(atom)).slice(0, 3);
      const why = matchingAtoms.length
        ? t("narrative.firstRun.proofMatch", { title: topGame.title, signals: matchingAtoms.join(" + ") })
        : topGame
          ? t("narrative.firstRun.proofBestFit", { title: topGame.title })
          : t("narrative.firstRun.proofWaiting");
      return {
        status: gate.ready ? gate.maturityLabel : t("narrative.firstRun.proofLearning"),
        pull,
        caution,
        why,
        next: gate.ready
          ? t("narrative.firstRun.proofNextReady")
          : t("narrative.firstRun.proofNextLearning", {
              count: gate.count,
              minimum: gate.minimum,
            }),
      };
    }

    function firstRunNextSteps(signalCount) {
      const toUsable = Math.max(0, QUICK_TASTE_USABLE_TARGET - signalCount);
      return [
        {
          id: "more-signal",
          label: signalCount >= QUICK_TASTE_USABLE_TARGET
            ? t("narrative.firstRun.nextSwipeSharpLabel")
            : t("narrative.firstRun.nextSwipeAddLabel"),
          detail: signalCount >= QUICK_TASTE_USABLE_TARGET
            ? t("narrative.firstRun.nextSwipeSharpDetail")
            : t("narrative.firstRun.nextSwipeMoreDetail", { count: toUsable }),
          tag: t("narrative.firstRun.nextFastest"),
        },
        {
          id: "psn-demo",
          label: t("narrative.firstRun.nextLibraryLabel"),
          detail: t("narrative.firstRun.nextLibraryDetail"),
          tag: t("narrative.firstRun.nextLibraryTag"),
        },
        {
          id: "open-taste-import",
          label: t("narrative.firstRun.nextPasteLabel"),
          detail: t("narrative.firstRun.nextPasteDetail"),
          tag: t("narrative.firstRun.nextPasteTag"),
        },
      ];
    }

    function firstRunBridge(ranked) {
      const state = getState();
      const topGame = getPrimaryDecisionGame(ranked);
      const signalCount = getQuickTasteSignalCount();
      const libraryMode = topGame ? getIsLibraryFirstMode(topGame) : false;
      if (!topGame || (signalCount < QUICK_TASTE_FIRST_TARGET && !libraryMode)) {
        return {
          preSwipe: true,
          title: t("narrative.firstRun.preTitle"),
          detail: t("narrative.firstRun.preDetail"),
          actions: [{ id: "quick-entry", label: t("narrative.firstRun.actionQuickFill"), title: "" }],
        };
      }

      const { confidence } = explain(topGame, topGame.score);
      const watchout = watchOutCopy(topGame);
      const agenda = companionAnswerAgenda(ranked, topGame);
      const backup = agenda.find((item) => item.actions?.length && !titleMatches(item.title, topGame.title));
      const guardrail = agenda.find((item) => item.tone === "guard");
      const access = answerAccessLabel(topGame);
      const forecast = personalRankForecast(topGame);
      const proof = firstRunTasteProof(topGame);
      const gate = getTasteGateState();
      const earlyTasteNote = gate.maturityStage === "mixed"
        ? t("narrative.firstRun.noteMixed")
        : gate.maturityStage === "hypothesis"
          ? t("narrative.firstRun.noteHypothesis")
          : "";
      const detailParts = [
        libraryMode
          ? t("narrative.firstRun.detailLeadLibrary")
          : t("narrative.firstRun.detailLeadGame", { title: topGame.title }),
        libraryMode ? t("narrative.firstRun.detailState", { title: topGame.title, state: access }) : "",
        backup ? t("narrative.firstRun.detailBackup", { title: backup.title }) : "",
        guardrail ? guardrail.title : "",
      ].filter(Boolean);
      const summary = [
        {
          label: libraryMode
            ? t("narrative.firstRun.summaryOwned")
            : t("narrative.firstRun.summaryPlay"),
          value: topGame.title,
          detail: libraryMode
            ? t("narrative.firstRun.summaryOwnedDetail", { access, forecast: forecast.label })
            : t("narrative.firstRun.summaryTasteDetail", { forecast: forecast.label, confidence }),
        },
        backup ? {
          label: t("narrative.firstRun.summaryBackup"),
          value: backup.title,
          detail: `${backup.forecast?.label || t("narrative.firstRun.forecastReady")}. ${
            backup.tone === "access"
              ? t("narrative.firstRun.alsoAvailable")
              : t("narrative.firstRun.fallback")
          }.`,
        } : null,
        guardrail ? {
          label: t("narrative.firstRun.summaryGuardrail"),
          value: guardrail.title,
          detail: libraryMode ? t("narrative.firstRun.guardrailLibrary") : guardrail.detail,
        } : null,
      ].filter(Boolean);

      const isSharp = signalCount >= QUICK_TASTE_SHARP_TARGET;
      const isUsable = signalCount >= QUICK_TASTE_USABLE_TARGET;
      const confidenceLabel = isSharp
        ? t("narrative.firstRun.confidenceSharp")
        : isUsable
          ? t("narrative.firstRun.confidenceSafer")
          : t("narrative.firstRun.confidenceEnough");
      const confidenceReady = isUsable;
      const readiness = [
        {
          label: t("narrative.firstRun.readyNow"),
          value: t("narrative.firstRun.signalCount", { count: signalCount }),
          detail: signalCount >= QUICK_TASTE_FIRST_TARGET
            ? t("narrative.firstRun.readyEnough")
            : t("narrative.firstRun.readyLearning"),
        },
        {
          label: t("narrative.firstRun.readyBetter"),
          value: t("narrative.firstRun.readySwipes"),
          detail: t("narrative.firstRun.readySwipesDetail"),
        },
        {
          label: t("narrative.firstRun.readyBest"),
          value: t("narrative.firstRun.readyContext"),
          detail: t("narrative.firstRun.readyContextDetail"),
        },
      ];
      const verdict = [
        {
          label: t("narrative.firstRun.verdictLearned"),
          value: proof.pull,
          detail: t("narrative.firstRun.verdictLearnedDetail", { count: signalCount, confidence }),
        },
        {
          label: t("narrative.firstRun.verdictUse"),
          value: libraryMode
            ? t("narrative.firstRun.verdictStart", { title: topGame.title })
            : t("narrative.firstRun.verdictTry", { title: topGame.title }),
          detail: t("narrative.firstRun.verdictUseDetail", {
            forecast: forecast.label,
            risk: watchout.label,
          }),
        },
        {
          label: t("narrative.firstRun.verdictUncertain"),
          value: gate.conflict.hasConflict ? gate.conflict.atoms.join(" / ") : proof.caution,
          detail: isSharp
            ? t("narrative.firstRun.verdictSharp")
            : isUsable
              ? t("narrative.firstRun.verdictUsable")
              : t("narrative.firstRun.verdictMore", {
                  count: Math.max(0, QUICK_TASTE_USABLE_TARGET - signalCount),
                }),
        },
      ];
      const journey = [
        {
          step: "1",
          label: t("narrative.firstRun.journeyOpen"),
          detail: t("narrative.firstRun.journeyOpenDetail"),
          id: "detail-pick",
          title: topGame.title,
        },
        {
          step: "2",
          label: libraryMode
            ? t("narrative.firstRun.journeyStart")
            : t("narrative.firstRun.journeySave"),
          detail: libraryMode
            ? t("narrative.firstRun.journeyStartDetail")
            : t("narrative.firstRun.journeySaveDetail"),
          id: libraryMode ? "play" : "save",
          title: topGame.title,
        },
        {
          step: "3",
          label: t("narrative.firstRun.journeySearch"),
          detail: t("narrative.firstRun.journeySearchDetail"),
          id: "discover-pick",
          title: topGame.title,
        },
      ];

      return {
        eyebrow: libraryMode
          ? t("narrative.firstRun.eyebrowLibrary")
          : t("narrative.firstRun.eyebrowTaste"),
        title: libraryMode
          ? t("narrative.firstRun.titleLibrary", { title: topGame.title })
          : t("narrative.firstRun.titleTaste", { title: topGame.title }),
        detail: libraryMode
          ? t("narrative.firstRun.detailLibrary", {
              parts: detailParts.join(" / "),
              riskLabel: watchout.label,
              riskDetail: watchout.detail,
            })
          : t("narrative.firstRun.detailTaste", {
              count: signalCount,
              note: earlyTasteNote,
              title: topGame.title,
              riskLabel: watchout.label,
              riskDetail: watchout.detail,
            }),
        confidenceLabel,
        confidenceReady,
        verdict,
        proof,
        readiness,
        summary,
        journey,
        nextSteps: isSharp ? null : firstRunNextSteps(signalCount),
        actions: [
          { id: "focus-answer", label: t("narrative.firstRun.actionAgenda"), title: "" },
          {
            id: libraryMode ? "play" : "save",
            label: libraryMode
              ? t("narrative.firstRun.actionPlay")
              : t("narrative.firstRun.actionWishlist"),
            title: topGame.title,
          },
          { id: "snooze", label: t("narrative.firstRun.actionSkip"), title: topGame.title },
        ],
      };
    }

    function firstValueReceipt(ranked) {
      const state = getState();
      const region = state.activeRegion;
      const topGame = getPrimaryDecisionGame(ranked);
      const accessGame = ranked.find((game) => {
        const isDuplicateTop = topGame && titleMatches(game.title, topGame.title);
        return !isDuplicateTop && (getIsAlreadyAvailable(game) || (state.psPlus && game.psPlus.includes(region)));
      });
      const guardedGame = ranked.find((game) => game.prices[region] <= Number(state.budget) && getBlocksPurchase(game));
      const buyLater = getBuyLaterCandidate(ranked);
      const memory = getTasteMemory();
      const importedAtoms = state.importedRatings.flatMap((rating) => {
        const game = getSourceGames().find((item) => titleMatches(item.title, rating.title));
        return game?.atoms || [];
      });
      const tasteAtoms = topEntries(countValues([...getSelectedAtoms(), ...importedAtoms]), 3);
      const tasteLine = tasteAtoms.length
        ? tasteAtoms.map((item) => item.label).join(" + ")
        : t("taste.receiptEarlyTaste");
      const cards = [];
      const hasReceiptTitle = (title) => cards.some((card) => titleMatches(card.title, title));

      if (topGame) {
        cards.push({
          label: t(getIsLibraryFirstMode(topGame) ? "taste.receiptLibrary" : "taste.receiptTonight"),
          title: topGame.title,
          detail: t("taste.receiptGameDetail", {
            session: t(SESSION_KEYS[topGame.session] || SESSION_KEYS.medium),
            confidence: explain(topGame, topGame.score).confidence,
          }),
          action: t("taste.receiptPlayNow"),
          stateAction: "playing",
          gameTitle: topGame.title,
        });
      }

      if (accessGame) {
        const access = effectiveGameState(accessGame) || "PS Plus signal";
        cards.push({
          label: t("taste.receiptUseAccess"),
          title: accessGame.title,
          detail: t("taste.receiptAccessDetail", { access: t(STATE_KEYS[access] || "narrative.recommend.plusSignal") }),
          action: t("taste.receiptMarkPlaying"),
          stateAction: "playing",
          gameTitle: accessGame.title,
        });
      } else if (guardedGame) {
        cards.push({
          label: t("taste.receiptDoNotBuy"),
          title: guardedGame.title,
          detail: t("taste.receiptAlready", {
            state: t(STATE_KEYS[effectiveGameState(guardedGame)] || "narrative.recommend.stateSaved"),
          }),
          action: "",
        });
      }

      if (buyLater && !hasReceiptTitle(buyLater.title)) {
        const status = priceStatus(buyLater, region);
        cards.push({
          label: t("taste.receiptBuyLater"),
          title: buyLater.title,
          detail: t("taste.receiptPrice", {
            region,
            price: formatPrice(buyLater, region),
            freshness: t(status.canConfirm ? "taste.receiptFresh" : "taste.receiptVerify"),
          }),
          action: "",
        });
      }

      cards.push({
        label: t("taste.receiptLearned"),
        title: tasteLine,
        detail: t("taste.receiptConfidence", { confidence: memory.confidence, count: memory.evidenceCount }),
        action: "",
      });

      return cards.slice(0, 4);
    }

    return {
      renderEvidenceRows,
      renderUndoStrip,
      isAnswerAccessible,
      answerFitLine,
      answerForecast,
      companionAgendaActions,
      companionAlternatives,
      companionBuyGuardrail,
      companionAnswerAgenda,
      invalidateCompanionAgenda,
      companionAnswer,
      firstRunTasteProof,
      firstRunNextSteps,
      firstRunBridge,
      firstValueReceipt,
    };
  }

  window.PlaySputnikAnswer = { createAnswerTools };
})();
