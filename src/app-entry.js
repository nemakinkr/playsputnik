/* PlaySputnik Entry Module — entry path label and proof-copy for profile maturity banner */
"use strict";
(function () {
  if (!window.PlaySputnikConfig) throw new Error("app-config must load before app-entry");
  if (!window.PlaySputnikOnboarding) throw new Error("app-onboarding must load before app-entry");

  const { QUICK_TASTE_FIRST_TARGET, QUICK_TASTE_USABLE_TARGET, QUICK_TASTE_SHARP_TARGET } =
    window.PlaySputnikConfig;

  function createEntryTools({
    getState,
    // from onboarding module
    quickTasteSignalCount,
    quickReactionCount,
    quickTasteConflictReport,
  }) {
    function entryLabel() {
      const state = getState();
      if (state.entryPath === "psn") return "Library guardrails";
      if (state.entryPath === "deep") return "Imported taste";
      return "Fast profile";
    }

    function entryRouteProofCopy() {
      const state = getState();
      const signalCount = quickTasteSignalCount();
      const answered = quickReactionCount();

      if (state.entryPath === "psn") {
        return {
          label: "Library-first",
          value: "Use owned and subscription games before any buy advice.",
        };
      }

      if (state.entryPath === "deep") {
        return {
          label: "Paste any format",
          value: "Long ratings sharpen forecasts, but the first hypothesis can come earlier.",
        };
      }

      const conflict = quickTasteConflictReport();

      if (signalCount >= QUICK_TASTE_SHARP_TARGET) {
        return {
          label: "Sharper profile",
          value: `${signalCount} taste signals already support better ranking forecasts.`,
        };
      }

      if (signalCount >= QUICK_TASTE_USABLE_TARGET) {
        return {
          label: conflict.hasConflict ? "Usable but mixed" : "Usable starter profile",
          value: conflict.hasConflict
            ? `Enough to suggest, but mixed around ${conflict.atoms.join(" / ")}.`
            : `${signalCount} signals are enough for a reasonable starter profile.`,
        };
      }

      if (signalCount >= QUICK_TASTE_FIRST_TARGET) {
        return {
          label: conflict.hasConflict ? "First hypothesis only" : "First hypothesis ready",
          value: `${signalCount} signals support a cautious first guess, not a final profile. ${QUICK_TASTE_USABLE_TARGET - signalCount} more make it safer.`,
        };
      }

      if (answered) {
        return {
          label: "Taste profile forming",
          value: `${signalCount}/${QUICK_TASTE_FIRST_TARGET} taste signals. Not played keeps setup moving without fake ratings.`,
        };
      }

      return {
        label: `Usable after ${QUICK_TASTE_FIRST_TARGET} signals`,
        value: "Start with like/dislike. PSN and pasted ratings can come later.",
      };
    }

    return {
      entryLabel,
      entryRouteProofCopy,
    };
  }

  window.PlaySputnikEntry = { createEntryTools };
})();
