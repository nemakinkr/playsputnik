/* PlaySputnik Provider Import Module — RAWG/provider candidate metadata and review actions */
"use strict";
(function () {
  function createProviderImportTools({
    getState,
    titleKey,
    normalizeUserGameRecord,
    legacyStateFromUserGame,
    recordUserEvent,
    saveState,
    render,
    openWishlist,
  }) {
    function isProviderImportResult(result) {
      return result?.sourceId === "rawg_provider_hook" || result?.provider === "rawg";
    }

    function providerImportFromSearchResult(result, { query = "", current = {} } = {}) {
      if (!isProviderImportResult(result)) return current.providerImport || null;
      return {
        provider: "rawg",
        status: "candidate",
        importedAt: new Date().toISOString(),
        query: query || result.title,
        sourceUrl: result.sourceUrl || "",
        coverUrl: result.coverUrl || "",
        coverStatus: result.coverStatus || (result.coverUrl ? "candidate" : "missing"),
        priceStatus: result.priceStatus || "missing",
        matchConfidence: result.matchConfidence || "",
        matchKind: result.matchKind || "",
        inferenceVersion: result.inferenceProfile?.version || "",
        inferenceConfidence: result.inferenceProfile?.confidence || "",
        attributionRequired: Boolean(result.coverUrl),
      };
    }

    function providerCoverLicenseNote(result, current = {}) {
      if (result?.coverUrl && result?.provider === "rawg") {
        return "RAWG API image candidate. Attribute RAWG and link to the source page wherever this image is displayed.";
      }
      return current.coverLicenseNote || "";
    }

    function applyProviderImportAction(title, action) {
      if (action === "open-wishlist") {
        openWishlist?.(title);
        return;
      }

      const state = getState();
      const key = titleKey(title);
      const current = normalizeUserGameRecord(state.userGames[key], title);
      if (!current?.providerImport) return;

      const now = new Date().toISOString();
      const providerImport = {
        ...current.providerImport,
        reviewedAt: now,
        reviewAction: action,
      };
      const next = {
        ...current,
        providerImport,
        updatedAt: now,
      };

      if (action === "accept") {
        providerImport.status = "accepted";
        next.saved = true;
        next.catalogStatus = next.catalogStatus || "external_memory";
        state.saved.add(next.title);
        state.hidden.delete(next.title);
      } else if (action === "snooze") {
        providerImport.status = "snoozed";
        providerImport.snoozedUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      } else if (action === "hide") {
        providerImport.status = "hidden";
        providerImport.hiddenAt = now;
      }

      state.userGames[key] = next;
      state.userStates[key] = { title: next.title, state: legacyStateFromUserGame(next), updatedAt: now };
      recordUserEvent("provider_import_reviewed", next.title, {
        action,
        provider: providerImport.provider,
        status: providerImport.status,
      });
      saveState();
      render();
    }

    return {
      isProviderImportResult,
      providerImportFromSearchResult,
      providerCoverLicenseNote,
      applyProviderImportAction,
    };
  }

  window.PlaySputnikProviderImport = { createProviderImportTools };
})();
