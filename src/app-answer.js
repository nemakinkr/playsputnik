/* PlaySputnik Answer Module — companion answer logic, first-run bridge, receipt */
"use strict";
(function () {
  if (!window.PlaySputnikConfig) throw new Error("app-config must load before app-answer");
  if (!window.PlaySputnikRecommend) throw new Error("app-recommend must load before app-answer");

  const {
    QUICK_TASTE_FIRST_TARGET,
    QUICK_TASTE_USABLE_TARGET,
    QUICK_TASTE_SHARP_TARGET,
    USER_STATE_LABELS,
  } = window.PlaySputnikConfig;

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
        { id: "play", label: "Play", title: game.title },
        { id: "save", label: "Save", title: game.title },
        { id: "snooze", label: "Not tonight", title: game.title },
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
          label: index === 0 && isAnswerAccessible(game) ? "Access alt" : `Alt ${index + 1}`,
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
        const access = answerAccessLabel(availablePick);
        return {
          label: "Buy guardrail",
          title: "No store needed tonight",
          detail: `${availablePick.title} is ${access || "already available"}. Start there before turning this into a purchase decision.`,
          tone: "guard",
        };
      }

      if (buyLater) {
        const status = priceStatus(buyLater, region);
        return {
          label: "Buy guardrail",
          title: `Watch ${buyLater.title}`,
          detail: `${formatPrice(buyLater, region)} is inside the budget, but the ${status.label} price signal should be verified before buying.`,
          tone: "guard",
        };
      }

      return {
        label: "Buy guardrail",
        title: "Keep the store quiet",
        detail: "Make one play decision first. Price hunting should wait until the evening pick fails or the wishlist gets a real discount signal.",
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
          label: getIsLibraryFirstMode(topGame) ? "Library start" : primaryAccess ? "Start from access" : "Start",
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
          status: "No pick",
          title: "I need a little more signal.",
          paragraphs: ["Choose a few liked games or import ratings, then I can make a sharper call."],
          agenda: [],
          chips: ["taste needed"],
          actions: state.snoozed.size ? [{ id: "clear-snoozes", label: "Reset tonight" }] : [],
        };
      }
      const { confidence } = explain(topGame, topGame.score);
      const watchout = watchOutCopy(topGame);
      const evidence = personalEvidence(topGame);
      const rationale = decisionRationale(topGame);
      const memory = getTasteMemory();
      const topLikes = memory.likes.map((item) => item.label).slice(0, 3);
      const libraryMode = getIsLibraryFirstMode(topGame);
      const queued = getPlayLaterQueue()[0];
      const fallback = ranked.find((game) => !titleMatches(game.title, topGame.title));
      const fallbackCopy = fallback
        ? `If that does not click, switch to ${fallback.title} instead of browsing the store.`
        : "If that does not click, mark it Not for me and I will adjust.";
      const queueCopy = queued
        ? `${queued.title} is safely parked in Play later, so the drop can stay quiet for now.`
        : "Subscription drops can stay in the inbox until a real decision is needed.";
      return {
        status: `${confidence} confidence / ${libraryMode ? "library-first" : state.session}${state.snoozed.size ? ` / ${state.snoozed.size} skipped` : ""}`,
        title: `I would play ${topGame.title}${libraryMode ? " from your library" : ""} tonight.`,
        paragraphs: [
          `${rationale.headline}${topLikes.length ? ` It also follows your ${topLikes.join(" + ")} taste.` : ""}`,
          `${rationale.risk} ${fallbackCopy}`,
          queueCopy,
        ],
        evidence,
        agenda: companionAnswerAgenda(ranked, topGame),
        chips: [topGame.session, confidence, watchout.label, state.activeRegion],
        actions: [
          { id: "play", label: "Play now", title: topGame.title },
          { id: "save", label: "Save", title: topGame.title },
          { id: "snooze", label: "Not tonight", title: topGame.title },
          ...(state.snoozed.size ? [{ id: "clear-snoozes", label: "Reset tonight" }] : []),
        ],
      };
    }

    function firstRunTasteProof(topGame) {
      const gate = getTasteGateState();
      const tasteSummary = getKnownGamesTasteSummary();
      const pull = tasteSummary.pull.length ? tasteSummary.pull.slice(0, 3).join(" / ") : "early taste";
      const caution = gate.conflict.hasConflict
        ? `mixed ${gate.conflict.atoms.join(" / ")}`
        : tasteSummary.caution.length ? tasteSummary.caution.slice(0, 2).join(" / ") : "no strong dislikes yet";
      const matchingAtoms = (topGame?.atoms || []).filter((atom) => tasteSummary.pull.includes(atom)).slice(0, 3);
      const why = matchingAtoms.length
        ? `${topGame.title} matches ${matchingAtoms.join(" + ")}`
        : topGame ? `${topGame.title} is the best current fit` : "waiting for a pick";
      return {
        status: gate.ready ? gate.maturityLabel : "Learning",
        pull,
        caution,
        why,
        next: gate.ready
          ? `Use the app now. More swipes, PSN access, or a pasted list can sharpen it later.`
          : `${gate.count}/${gate.minimum} taste signals. ${gate.minimum} unlock a first hypothesis.`,
      };
    }

    function firstRunNextSteps(signalCount) {
      const toUsable = Math.max(0, QUICK_TASTE_USABLE_TARGET - signalCount);
      return [
        {
          id: "more-signal",
          label: signalCount >= QUICK_TASTE_USABLE_TARGET ? "Sharpen with swipes" : "Add a few swipes",
          detail: signalCount >= QUICK_TASTE_USABLE_TARGET
            ? "20+ quick calls make rankings feel personal"
            : `${toUsable} more like/dislike signals make this less fragile`,
          tag: "Fastest",
        },
        {
          id: "psn-demo",
          label: "Add library later",
          detail: "PSN/library context turns picks into play-before-buy decisions",
          tag: "Library",
        },
        {
          id: "open-taste-import",
          label: "Paste ratings",
          detail: "Any messy text works: rankings, backlog, wishlist, notes",
          tag: "Strongest",
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
          title: `Three quick calls are enough to start`,
          detail: "Like or dislike a few known games and PlaySputnik will make a cautious first pick. You can keep using it immediately; library access or a pasted rating list can wait.",
          actions: [{ id: "quick-entry", label: "Quick fill", title: "" }],
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
        ? "The signals are mixed, so this is deliberately cautious. "
        : gate.maturityStage === "hypothesis"
          ? "This is an early read, not a final profile. "
          : "";
      const detailParts = [
        `${libraryMode ? "Library" : topGame.title} first`,
        libraryMode ? `${topGame.title} is ${USER_STATE_LABELS[effectiveGameState(topGame)] || effectiveGameState(topGame)}` : "",
        backup ? `${backup.title} backup` : "",
        guardrail ? guardrail.title : "",
      ].filter(Boolean);
      const summary = [
        {
          label: libraryMode ? "Owned pick" : "Play first",
          value: topGame.title,
          detail: libraryMode ? `${access}. ${forecast.label}.` : `${forecast.label}. ${confidence} fit.`,
        },
        backup ? {
          label: "Backup",
          value: backup.title,
          detail: `${backup.forecast?.label || "Forecast ready"}. ${backup.tone === "access" ? "Also available." : "Fallback."}`,
        } : null,
        guardrail ? {
          label: "Guardrail",
          value: guardrail.title,
          detail: libraryMode ? "Use what is already playable first." : guardrail.detail,
        } : null,
      ].filter(Boolean);

      const isSharp = signalCount >= QUICK_TASTE_SHARP_TARGET;
      const isUsable = signalCount >= QUICK_TASTE_USABLE_TARGET;
      const confidenceLabel = isSharp ? "Sharper profile" : isUsable ? "Safer read" : "Enough to start";
      const confidenceReady = isUsable;
      const readiness = [
        {
          label: "Now",
          value: `${signalCount} signals`,
          detail: signalCount >= QUICK_TASTE_FIRST_TARGET ? "enough for a cautious pick" : "still learning",
        },
        {
          label: "Better",
          value: "6-10 swipes",
          detail: "fewer random misses",
        },
        {
          label: "Best",
          value: "PSN or ratings",
          detail: "library and ranking context",
        },
      ];
      const verdict = [
        {
          label: "What I learned",
          value: proof.pull,
          detail: `${signalCount} taste signals / ${confidence} fit`,
        },
        {
          label: "Use it now",
          value: libraryMode ? `Start ${topGame.title}` : `Try ${topGame.title}`,
          detail: `${forecast.label}. ${watchout.label}.`,
        },
        {
          label: "Still uncertain",
          value: gate.conflict.hasConflict ? gate.conflict.atoms.join(" / ") : proof.caution,
          detail: isSharp
            ? "Profile is strong enough for bolder calls."
            : isUsable
              ? "Keep using it; more signals will tune rankings."
              : `${Math.max(0, QUICK_TASTE_USABLE_TARGET - signalCount)} more swipes make the read safer.`,
        },
      ];
      const journey = [
        {
          step: "1",
          label: "Open the pick",
          detail: "See the cockpit: fit, risk, value, sources",
          id: "detail-pick",
          title: topGame.title,
        },
        {
          step: "2",
          label: libraryMode ? "Start it" : "Save intent",
          detail: libraryMode ? "Move it into the active play queue" : "Put it in memory before browsing more",
          id: libraryMode ? "play" : "save",
          title: topGame.title,
        },
        {
          step: "3",
          label: "Search next",
          detail: "Jump to Discover with this title as context",
          id: "discover-pick",
          title: topGame.title,
        },
      ];

      return {
        eyebrow: libraryMode ? "Library-first answer" : "First taste read",
        title: libraryMode ? `${topGame.title} is already ready.` : `First read: try ${topGame.title}.`,
        detail: libraryMode
          ? `${detailParts.join(" / ")}. ${watchout.label}: ${watchout.detail}.`
          : `${earlyTasteNote}${signalCount} signals are enough to stop browsing and test one direction: ${topGame.title}. The read will get sharper, but the first useful answer is already here. ${watchout.label}: ${watchout.detail}.`,
        confidenceLabel,
        confidenceReady,
        verdict,
        proof,
        readiness,
        summary,
        journey,
        nextSteps: isSharp ? null : firstRunNextSteps(signalCount),
        actions: [
          { id: "focus-answer", label: "Agenda", title: "" },
          { id: libraryMode ? "play" : "save", label: libraryMode ? "Play" : "Wishlist", title: topGame.title },
          { id: "snooze", label: "Skip", title: topGame.title },
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
        : "early taste";
      const cards = [];
      const hasReceiptTitle = (title) => cards.some((card) => titleMatches(card.title, title));

      if (topGame) {
        cards.push({
          label: getIsLibraryFirstMode(topGame) ? "Play from library" : "Play tonight",
          title: topGame.title,
          detail: `${topGame.session} session / ${explain(topGame, topGame.score).confidence} confidence`,
          action: "Play now",
          stateAction: "playing",
          gameTitle: topGame.title,
        });
      }

      if (accessGame) {
        const access = effectiveGameState(accessGame) || "PS Plus signal";
        cards.push({
          label: "Use access",
          title: accessGame.title,
          detail: `${access}. Try what is already available before buying more.`,
          action: "Mark playing",
          stateAction: "playing",
          gameTitle: accessGame.title,
        });
      } else if (guardedGame) {
        cards.push({
          label: "Do not buy",
          title: guardedGame.title,
          detail: `Already ${effectiveGameState(guardedGame)} in your memory.`,
          action: "",
        });
      }

      if (buyLater && !hasReceiptTitle(buyLater.title)) {
        const status = priceStatus(buyLater, region);
        cards.push({
          label: "Buy later",
          title: buyLater.title,
          detail: `${region} ${formatPrice(buyLater, region)} / ${status.canConfirm ? "fresh" : "verify"} price signal.`,
          action: "",
        });
      }

      cards.push({
        label: "Taste learned",
        title: tasteLine,
        detail: `${memory.confidence} confidence from ${memory.evidenceCount} signals.`,
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
