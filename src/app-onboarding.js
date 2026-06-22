/* PlaySputnik Onboarding Module — quick taste signals, conflict detection, profile maturity, payoff milestones */
"use strict";
(function () {
  if (!window.PlaySputnikConfig) throw new Error("app-config must load before app-onboarding");
  if (!window.PlaySputnikSearch) throw new Error("app-search must load before app-onboarding");
  if (!window.PlaySputnikEnrichment) throw new Error("app-enrichment must load before app-onboarding");

  const {
    QUICK_TASTE_FIRST_TARGET,
    QUICK_TASTE_USABLE_TARGET,
    QUICK_TASTE_SHARP_TARGET,
  } = window.PlaySputnikConfig;

  function createOnboardingTools({
    getState,
    profileGames,
    diagnosticOnboardingAtoms,
    // from search module
    titleKey,
    normalizeTitle,
    // from enrichment module
    topEntries,
  }) {
    function quickReaction(title) {
      const state = getState();
      return state.quickReactions[titleKey(title)]?.reaction
        || state.quickReactions[normalizeTitle(title)]?.reaction
        || (state.liked.has(title) ? "loved" : "");
    }

    function quickReactionCount() {
      return profileGames.filter((game) => quickReaction(game.title)).length;
    }

    function quickTasteSignalCount() {
      return profileGames.filter((game) => {
        const reaction = quickReaction(game.title);
        return reaction && reaction !== "unplayed";
      }).length;
    }

    function quickTasteSignalAtoms() {
      const atoms = new Set();
      profileGames.forEach((game) => {
        const reaction = quickReaction(game.title);
        if (!reaction || reaction === "unplayed") return;
        (game.atoms || []).forEach((atom) => atoms.add(atom));
      });
      return atoms;
    }

    function quickAnsweredAtoms() {
      const atoms = new Set();
      profileGames.forEach((game) => {
        if (!quickReaction(game.title)) return;
        (game.atoms || []).forEach((atom) => atoms.add(atom));
      });
      return atoms;
    }

    function uncoveredDiagnosticAtoms() {
      const signaledAtoms = quickTasteSignalAtoms();
      return diagnosticOnboardingAtoms.filter((atom) => !signaledAtoms.has(atom));
    }

    function diagnosticNeedScore(game, missingAtoms = uncoveredDiagnosticAtoms(), answeredAtoms = quickAnsweredAtoms()) {
      const atoms = new Set(game.atoms || []);
      const missingCoverage = missingAtoms.filter((atom) => atoms.has(atom)).length;
      const newAtomCoverage = [...atoms].filter((atom) => !answeredAtoms.has(atom)).length;
      return missingCoverage * 100 + newAtomCoverage;
    }

    function conflictResolutionScore(game, conflict = quickTasteConflictReport(), answeredAtoms = quickAnsweredAtoms()) {
      if (!conflict.hasConflict) return 0;
      const atoms = new Set(game.atoms || []);
      const conflictCoverage = conflict.atoms.filter((atom) => atoms.has(atom));
      if (!conflictCoverage.length) return 0;
      const newContextCoverage = [...atoms].filter((atom) => !answeredAtoms.has(atom) && !conflict.atoms.includes(atom)).length;
      const focusedEnough = Math.round((conflictCoverage.length / Math.max(1, atoms.size)) * 10);
      return conflictCoverage.length * 500 + newContextCoverage * 25 + focusedEnough;
    }

    function diagnosticFocusForGame(game, missingAtoms = uncoveredDiagnosticAtoms(), conflict = quickTasteConflictReport()) {
      const conflictFocus = conflict.hasConflict ? (game.atoms || []).filter((atom) => conflict.atoms.includes(atom)) : [];
      if (conflictFocus.length) return `Clarifying ${conflictFocus.slice(0, 3).join(" / ")}`;
      const focus = (game.atoms || []).filter((atom) => missingAtoms.includes(atom));
      if (focus.length) return `Checking ${focus.slice(0, 3).join(" / ")}`;
      return `Refining ${game.axis || "taste"}`;
    }

    function quickSwipeFocusLabel(game, missingAtoms = uncoveredDiagnosticAtoms(), conflict = quickTasteConflictReport()) {
      const focus = diagnosticFocusForGame(game, missingAtoms, conflict);
      if (focus.startsWith("Clarifying")) return t("settings.onboarding.focusFollowUp");
      if (focus.startsWith("Checking")) return t("settings.onboarding.focusFresh");
      return t("settings.onboarding.focusNext");
    }

    function quickSwipeFollowUpHint(game, missingAtoms = uncoveredDiagnosticAtoms(), conflict = quickTasteConflictReport()) {
      const focus = diagnosticFocusForGame(game, missingAtoms, conflict);
      if (focus.startsWith("Clarifying")) return t("settings.onboarding.hintFollowUp");
      if (focus.startsWith("Checking")) return t("settings.onboarding.hintFresh");
      return t("settings.onboarding.hintNext");
    }

    function quickSwipeAtomChips(game, missingAtoms = uncoveredDiagnosticAtoms(), conflict = quickTasteConflictReport()) {
      return (game.atoms || []).slice(0, 5).map((atom) => {
        const classNames = [
          missingAtoms.includes(atom) ? "is-needed" : "",
          conflict.atoms?.includes(atom) ? "is-conflict" : "",
        ].filter(Boolean).join(" ");
        return `\n    <span class="${classNames}">${labelAtom(atom)}</span>\n  `;
      }).join("");
    }

    function nextDiagnosticGame() {
      const missingAtoms = uncoveredDiagnosticAtoms();
      const answeredAtoms = quickAnsweredAtoms();
      const conflict = quickTasteConflictReport();
      return profileGames
        .filter((game) => !quickReaction(game.title))
        .map((game, index) => ({
          game,
          index,
          conflictScore: conflictResolutionScore(game, conflict, answeredAtoms),
          score: diagnosticNeedScore(game, missingAtoms, answeredAtoms),
        }))
        .sort((a, b) => {
          const aScore = conflict.hasConflict && a.conflictScore ? 10000 + a.conflictScore : a.score;
          const bScore = conflict.hasConflict && b.conflictScore ? 10000 + b.conflictScore : b.score;
          return bScore - aScore || a.index - b.index;
        })[0]?.game;
    }

    function quickReactionSummary() {
      const counts = profileGames.reduce((acc, game) => {
        const reaction = quickReaction(game.title);
        if (reaction) acc[reaction] = (acc[reaction] || 0) + 1;
        return acc;
      }, {});
      return {
        loved: counts.loved || 0,
        played: counts.played || 0,
        notForMe: counts.not_for_me || 0,
        unplayed: counts.unplayed || 0,
      };
    }

    function knownGamesTasteSummary() {
      const weights = {};
      profileGames.forEach((game) => {
        const reaction = quickReaction(game.title);
        const weight = reaction === "loved" ? 2 : reaction === "played" ? 1 : reaction === "not_for_me" ? -2 : 0;
        if (!weight) return;
        (game.atoms || []).forEach((atom) => {
          weights[atom] = (weights[atom] || 0) + weight;
        });
      });
      const positive = Object.fromEntries(Object.entries(weights).filter(([, value]) => value > 0));
      const negative = Object.fromEntries(Object.entries(weights).filter(([, value]) => value < 0).map(([key, value]) => [key, Math.abs(value)]));
      return {
        pull: topEntries(positive, 3).map((item) => item.label),
        caution: topEntries(negative, 2).map((item) => item.label),
      };
    }

    function quickTasteAtomReactionStats() {
      const stats = {};
      profileGames.forEach((game) => {
        const reaction = quickReaction(game.title);
        if (!reaction || reaction === "unplayed") return;
        const direction = reaction === "not_for_me" ? "negative" : "positive";
        (game.atoms || []).forEach((atom) => {
          if (!stats[atom]) stats[atom] = { atom, positive: 0, negative: 0 };
          stats[atom][direction] += 1;
        });
      });
      return stats;
    }

    function quickTasteConflictReport() {
      const mixed = Object.values(quickTasteAtomReactionStats())
        .filter((item) => item.positive > 0 && item.negative > 0)
        .sort((a, b) => Math.min(b.positive, b.negative) - Math.min(a.positive, a.negative) || b.positive + b.negative - (a.positive + a.negative));
      const atoms = mixed.slice(0, 3).map((item) => item.atom);
      return {
        hasConflict: atoms.length > 0,
        atoms,
        detail: atoms.length
          ? t("settings.onboarding.conflictMixed", { atoms: labelAtoms(atoms) })
          : t("settings.onboarding.conflictNone"),
      };
    }

    function quickProfileMaturity(count, answered) {
      const fullTarget = profileGames.length;
      const conflict = quickTasteConflictReport();
      if (answered >= fullTarget && count >= QUICK_TASTE_SHARP_TARGET) {
        return {
          stage: "complete",
          label: t("settings.onboarding.fullLabel"),
          title: t("settings.onboarding.fullTitle"),
          detail: t("settings.onboarding.fullDetail", { answered, total: fullTarget }),
          next: t("settings.onboarding.fullNext"),
        };
      }
      if (count >= QUICK_TASTE_SHARP_TARGET) {
        return {
          stage: "sharp",
          label: t("settings.onboarding.sharpLabel"),
          title: t("settings.onboarding.sharpTitle"),
          detail: t("settings.onboarding.sharpDetail", { count }),
          next: t("settings.onboarding.sharpNext", { count: fullTarget - answered }),
        };
      }
      if (count >= QUICK_TASTE_USABLE_TARGET) {
        return {
          stage: conflict.hasConflict ? "usable-mixed" : "usable",
          label: conflict.hasConflict ? t("settings.onboarding.usableMixedLabel") : t("settings.onboarding.usableLabel"),
          title: conflict.hasConflict ? t("settings.onboarding.usableMixedTitle") : t("settings.onboarding.usableTitle"),
          detail: conflict.hasConflict
            ? t("settings.onboarding.usableMixedDetail", { count, conflict: conflict.detail })
            : t("settings.onboarding.usableDetail", { count }),
          next: t("settings.onboarding.usableNext", { count: QUICK_TASTE_SHARP_TARGET - count }),
        };
      }
      if (count >= QUICK_TASTE_FIRST_TARGET) {
        return {
          stage: conflict.hasConflict ? "mixed" : "hypothesis",
          label: conflict.hasConflict ? t("settings.onboarding.firstMixedLabel") : t("settings.onboarding.firstLabel"),
          title: conflict.hasConflict ? t("settings.onboarding.firstMixedTitle") : t("settings.onboarding.firstTitle"),
          detail: conflict.hasConflict
            ? t("settings.onboarding.firstMixedDetail", { count, conflict: conflict.detail })
            : t("settings.onboarding.firstDetail", { count }),
          next: t("settings.onboarding.firstNext", { count: QUICK_TASTE_USABLE_TARGET - count }),
        };
      }
      return {
        stage: "learning",
        label: t("settings.onboarding.learningLabel"),
        title: t("settings.onboarding.learningTitle", { count: Math.max(0, QUICK_TASTE_FIRST_TARGET - count) }),
        detail: t("settings.onboarding.learningDetail"),
        next: t("settings.onboarding.learningNext"),
      };
    }

    function quickPayoffStage(count) {
      if (count >= QUICK_TASTE_SHARP_TARGET) {
        return {
          label: t("settings.onboarding.payoffSharpLabel"),
          title: t("settings.onboarding.payoffSharpTitle"),
          detail: t("settings.onboarding.payoffSharpDetail"),
        };
      }
      if (count >= QUICK_TASTE_USABLE_TARGET) {
        return {
          label: t("settings.onboarding.payoffUsableLabel"),
          title: t("settings.onboarding.payoffUsableTitle"),
          detail: t("settings.onboarding.payoffUsableDetail"),
        };
      }
      if (count >= QUICK_TASTE_FIRST_TARGET) {
        return {
          label: t("settings.onboarding.payoffFirstLabel"),
          title: t("settings.onboarding.payoffFirstTitle"),
          detail: t("settings.onboarding.payoffFirstDetail"),
        };
      }
      return {
        label: t("settings.onboarding.payoffSparkLabel"),
        title: t("settings.onboarding.payoffSparkTitle"),
        detail: t("settings.onboarding.payoffSparkDetail"),
      };
    }

    function quickPayoffMilestones(count) {
      return [
        { target: QUICK_TASTE_FIRST_TARGET, label: t("settings.onboarding.milestoneFirst"), detail: t("settings.onboarding.milestoneFirstDetail") },
        { target: QUICK_TASTE_USABLE_TARGET, label: t("settings.onboarding.milestoneUsable"), detail: t("settings.onboarding.milestoneUsableDetail") },
        { target: QUICK_TASTE_SHARP_TARGET, label: t("settings.onboarding.milestoneSharp"), detail: t("settings.onboarding.milestoneSharpDetail") },
      ].map((item) => ({
        ...item,
        state: count >= item.target ? "done" : "next",
        remaining: Math.max(0, item.target - count),
      }));
    }

    function tasteGateState() {
      const minimum = QUICK_TASTE_FIRST_TARGET;
      const sharpTarget = QUICK_TASTE_SHARP_TARGET;
      const strongTarget = profileGames.length;
      const answered = quickReactionCount();
      const count = quickTasteSignalCount();
      const summary = quickReactionSummary();
      const tasteSummary = knownGamesTasteSummary();
      const maturity = quickProfileMaturity(count, answered);
      const payoff = quickPayoffStage(count);
      const conflict = quickTasteConflictReport();
      const remaining = Math.max(0, minimum - count);
      const nextGame = nextDiagnosticGame();
      const missingAtoms = uncoveredDiagnosticAtoms();
      const nextFocus = nextGame ? quickSwipeFocusLabel(nextGame, missingAtoms, conflict) : "";
      return {
        count,
        answered,
        minimum,
        sharpTarget,
        strongTarget,
        maturityStage: maturity.stage,
        maturityLabel: maturity.label,
        payoff,
        payoffMilestones: quickPayoffMilestones(count),
        conflict,
        ready: count >= minimum,
        progress: Math.min(100, Math.round((count / minimum) * 100)),
        title: count >= minimum ? maturity.title : `Mark ${remaining} more taste signal${remaining === 1 ? "" : "s"}`,
        detail: count >= minimum
          ? t("settings.onboarding.summary", {
              liked: summary.loved,
              disliked: summary.notForMe,
              unplayed: summary.unplayed,
              detail: maturity.detail,
            })
          : maturity.detail,
        maturity: count >= minimum
          ? t("settings.onboarding.maturityMore", { next: maturity.next })
          : maturity.next,
        insights: count >= minimum ? [
          { label: t("settings.onboarding.confidence"), value: maturity.label },
          { label: t("settings.onboarding.pull"), value: tasteSummary.pull.length ? labelAtoms(tasteSummary.pull) : t("settings.onboarding.earlyTaste") },
          { label: conflict.hasConflict ? t("settings.onboarding.mixed") : t("settings.onboarding.caution"), value: conflict.hasConflict ? labelAtoms(conflict.atoms) : tasteSummary.caution.length ? labelAtoms(tasteSummary.caution) : t("settings.onboarding.noDislikes") },
          { label: t("settings.onboarding.next"), value: nextGame ? `${nextFocus}: ${nextGame.title}` : t("settings.onboarding.strongProfile") },
        ] : [],
      };
    }

    return {
      quickReaction,
      quickReactionCount,
      quickTasteSignalCount,
      quickTasteSignalAtoms,
      quickAnsweredAtoms,
      uncoveredDiagnosticAtoms,
      diagnosticNeedScore,
      conflictResolutionScore,
      diagnosticFocusForGame,
      quickSwipeFocusLabel,
      quickSwipeFollowUpHint,
      quickSwipeAtomChips,
      nextDiagnosticGame,
      quickReactionSummary,
      knownGamesTasteSummary,
      quickTasteAtomReactionStats,
      quickTasteConflictReport,
      quickProfileMaturity,
      quickPayoffStage,
      quickPayoffMilestones,
      tasteGateState,
    };
  }

  window.PlaySputnikOnboarding = { createOnboardingTools };
})();
