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
      if (state.entryPath === "demo") return t("settings.entry.labelDemo");
      if (state.entryPath === "psn") return t("settings.entry.labelPsn");
      if (state.entryPath === "deep") return t("settings.entry.labelDeep");
      return t("settings.entry.labelQuick");
    }

    function entryRouteProofCopy() {
      const state = getState();
      const signalCount = quickTasteSignalCount();
      const answered = quickReactionCount();

      if (state.entryPath === "demo") {
        return {
          label: t("settings.entry.proofDemoLabel"),
          value: t("settings.entry.proofDemoValue"),
        };
      }

      if (state.entryPath === "psn") {
        return {
          label: t("settings.entry.proofPsnLabel"),
          value: t("settings.entry.proofPsnValue"),
        };
      }

      if (state.entryPath === "deep") {
        return {
          label: t("settings.entry.proofDeepLabel"),
          value: t("settings.entry.proofDeepValue"),
        };
      }

      const conflict = quickTasteConflictReport();

      if (signalCount >= QUICK_TASTE_SHARP_TARGET) {
        return {
          label: t("settings.entry.proofSharpLabel"),
          value: t("settings.entry.proofSharpValue", { count: signalCount }),
        };
      }

      if (signalCount >= QUICK_TASTE_USABLE_TARGET) {
        return {
          label: conflict.hasConflict
            ? t("settings.entry.proofUsableMixedLabel")
            : t("settings.entry.proofUsableLabel"),
          value: conflict.hasConflict
            ? t("settings.entry.proofUsableMixedValue", { atoms: labelAtoms(conflict.atoms) })
            : t("settings.entry.proofUsableValue", { count: signalCount }),
        };
      }

      if (signalCount >= QUICK_TASTE_FIRST_TARGET) {
        return {
          label: conflict.hasConflict
            ? t("settings.entry.proofFirstMixedLabel")
            : t("settings.entry.proofFirstReadyLabel"),
          value: t("settings.entry.proofFirstValue", {
            count: signalCount,
            remaining: QUICK_TASTE_USABLE_TARGET - signalCount,
          }),
        };
      }

      if (answered) {
        return {
          label: t("settings.entry.proofFormingLabel"),
          value: t("settings.entry.proofFormingValue", {
            count: signalCount,
            target: QUICK_TASTE_FIRST_TARGET,
          }),
        };
      }

      return {
        label: t("settings.entry.proofInitialLabel", { target: QUICK_TASTE_FIRST_TARGET }),
        value: t("settings.entry.proofInitialValue"),
      };
    }

    return {
      entryLabel,
      entryRouteProofCopy,
    };
  }

  window.PlaySputnikEntry = { createEntryTools };
})();
