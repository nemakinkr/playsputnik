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
      if (focus.startsWith("Clarifying")) return "Good follow-up";
      if (focus.startsWith("Checking")) return "Fresh angle";
      return "Next question";
    }

    function quickSwipeFollowUpHint(game, missingAtoms = uncoveredDiagnosticAtoms(), conflict = quickTasteConflictReport()) {
      const focus = diagnosticFocusForGame(game, missingAtoms, conflict);
      if (focus.startsWith("Clarifying")) return "A small calibration pick. It should make the early mixed signal clearer.";
      if (focus.startsWith("Checking")) return "A different kind of game keeps the first read from getting too narrow.";
      return "One more signal makes the next suggestion feel less random.";
    }

    function quickSwipeAtomChips(game, missingAtoms = uncoveredDiagnosticAtoms(), conflict = quickTasteConflictReport()) {
      return (game.atoms || []).slice(0, 5).map((atom) => {
        const classNames = [
          missingAtoms.includes(atom) ? "is-needed" : "",
          conflict.atoms?.includes(atom) ? "is-conflict" : "",
        ].filter(Boolean).join(" ");
        return `\n    <span class="${classNames}">${atom}</span>\n  `;
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
        detail: atoms.length ? `mixed signal around ${atoms.join(" / ")}` : "no mixed atom signals yet",
      };
    }

    function quickProfileMaturity(count, answered) {
      const fullTarget = profileGames.length;
      const conflict = quickTasteConflictReport();
      if (answered >= fullTarget && count >= QUICK_TASTE_SHARP_TARGET) {
        return {
          stage: "complete",
          label: "Full quick profile",
          title: "Quick profile complete",
          detail: `${answered}/${fullTarget} games answered. PSN access or pasted ratings can now add library context, not rescue onboarding.`,
          next: "Use the companion, then refine with real play history later.",
        };
      }
      if (count >= QUICK_TASTE_SHARP_TARGET) {
        return {
          stage: "sharp",
          label: "Sharper profile",
          title: "Sharper profile ready",
          detail: `${count} like/dislike signals are enough for stronger personal ranking forecasts.`,
          next: `The remaining ${fullTarget - answered} swipes are optional calibration.`,
        };
      }
      if (count >= QUICK_TASTE_USABLE_TARGET) {
        return {
          stage: conflict.hasConflict ? "usable-mixed" : "usable",
          label: conflict.hasConflict ? "Usable but mixed" : "Usable starter profile",
          title: conflict.hasConflict ? "Usable, with mixed signals" : "Starter profile ready",
          detail: conflict.hasConflict
            ? `${count} taste signals are enough to suggest, but ${conflict.detail}.`
            : `${count} taste signals are enough for a reasonable starter profile.`,
          next: `${QUICK_TASTE_SHARP_TARGET - count} more like/dislike signals make ranking forecasts sharper.`,
        };
      }
      if (count >= QUICK_TASTE_FIRST_TARGET) {
        return {
          stage: conflict.hasConflict ? "mixed" : "hypothesis",
          label: conflict.hasConflict ? "Mixed first hypothesis" : "First hypothesis",
          title: conflict.hasConflict ? "First hypothesis is mixed" : "First hypothesis is ready",
          detail: conflict.hasConflict
            ? `${count} taste signals are enough for a cautious guess, but ${conflict.detail}.`
            : `${count} taste signals are enough for a cautious first guess, not a final profile.`,
          next: `${QUICK_TASTE_USABLE_TARGET - count} more like/dislike signals make the answer safer.`,
        };
      }
      return {
        stage: "learning",
        label: "Learning",
        title: `Mark ${Math.max(0, QUICK_TASTE_FIRST_TARGET - count)} more taste signal${QUICK_TASTE_FIRST_TARGET - count === 1 ? "" : "s"}`,
        detail: "Like and Not for me both teach taste. Not played skips without inventing a rating.",
        next: `You do not need PSN or a long rating list to get the first answer.`,
      };
    }

    function quickPayoffStage(count) {
      if (count >= QUICK_TASTE_SHARP_TARGET) {
        return {
          label: "Sharper picks",
          title: "The companion can be bolder now.",
          detail: "Enough signal for stronger ranking and tradeoff calls.",
        };
      }
      if (count >= QUICK_TASTE_USABLE_TARGET) {
        return {
          label: "Safer read",
          title: "The first profile feels less fragile.",
          detail: "A few patterns are repeating, so the next pick can carry more confidence.",
        };
      }
      if (count >= QUICK_TASTE_FIRST_TARGET) {
        return {
          label: "First hypothesis",
          title: "There is enough signal for a cautious first pick.",
          detail: "Still early, but no longer a blank slate.",
        };
      }
      return {
        label: "First spark",
        title: "Three real signals unlock the first read.",
        detail: "A like or a dislike both count. Skips stay honest.",
      };
    }

    function quickPayoffMilestones(count) {
      return [
        { target: QUICK_TASTE_FIRST_TARGET, label: "First hypothesis", detail: "cautious pick" },
        { target: QUICK_TASTE_USABLE_TARGET, label: "Safer read", detail: "less fragile" },
        { target: QUICK_TASTE_SHARP_TARGET, label: "Sharper picks", detail: "better ranking" },
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
          ? `${summary.loved} liked / ${summary.notForMe} no / ${summary.unplayed} not played. ${maturity.detail}`
          : maturity.detail,
        maturity: count >= minimum
          ? `${maturity.next} PSN library access or a pasted rating list can improve confidence later.`
          : maturity.next,
        insights: count >= minimum ? [
          { label: "Confidence", value: maturity.label },
          { label: "Pull", value: tasteSummary.pull.length ? tasteSummary.pull.join(" / ") : "early taste" },
          { label: conflict.hasConflict ? "Mixed" : "Caution", value: conflict.hasConflict ? conflict.atoms.join(" / ") : tasteSummary.caution.length ? tasteSummary.caution.join(" / ") : "no strong dislikes yet" },
          { label: "Next", value: nextGame ? `${nextFocus}: ${nextGame.title}` : "strong quick profile" },
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
