/* PlaySputnik Export Module — JSON/CSV export, PlaySputnik backup import, Backloggd/HLTB/PSN library import */
"use strict";
(function () {
  if (!window.PlaySputnikImport) throw new Error("app-import must load before app-export");
  if (!window.PlaySputnikState) throw new Error("app-state must load before app-export");
  if (!window.PlaySputnikSync) throw new Error("app-sync must load before app-export");
  const t = window.PlaySputnikI18n.t;

  const {
    detectFormat,
    parseBackloggdCsv,
    parseHltbJson,
    parsePlainList,
    parsePsnTrophyTitles,
    importSummaryLabel,
  } = window.PlaySputnikImport;
  const { createProfileEnvelope, unwrapProfileEnvelope, compareProfileEnvelopes } = window.PlaySputnikSync;

  function createExportTools({
    getState,
    setState,
    defaultState,
    hydrateUserGames,
    emptyNotebook,
    legacyStateFromUserGame,
    titleKey,
    applyStateToUserGame,
    userStateToUserGame,
    stateMigrations,
    getDeviceId = () => "",
    saveState,
    render,
    onLibraryEntriesImported = () => {},
    els,
  }) {
    let _pendingImportEntries = null;
    let _pendingProfileImport = null;

    // ── JSON Export ───────────────────────────────────────────────────────────
    function exportStateJson() {
      const state = getState();
      const snapshot = createProfileEnvelope(state, { deviceId: getDeviceId() });
      saveState();
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `playsputnik-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      els.exportStatus.textContent = `${t("data.profileBackupExported")} ✓`;
      setTimeout(() => { els.exportStatus.textContent = ""; }, 3000);
    }

    // ── CSV Export ────────────────────────────────────────────────────────────
    function exportLibraryCsv() {
      const state = getState();
      const rows = [["Title", "Status", "Access", "Completion", "Rating", "Hours Played", "Saved", "Updated"]];
      Object.values(state.userGames).forEach((g) => {
        rows.push([
          `"${(g.title || "").replace(/"/g, '""')}"`,
          legacyStateFromUserGame(g),
          g.access || "",
          g.completionStatus || "",
          g.rating != null ? g.rating : "",
          g.hoursPlayed != null ? g.hoursPlayed : "",
          g.saved ? "yes" : "no",
          g.updatedAt || "",
        ]);
      });
      const csv = rows.map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `playsputnik-library-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      els.exportStatus.textContent = `${t("data.csvExported")} ✓`;
      setTimeout(() => { els.exportStatus.textContent = ""; }, 3000);
    }

    // ── PlaySputnik JSON Backup Import ────────────────────────────────────────
    function hydrateImportedProfile(profile) {
      const migrated = stateMigrations?.migrateState
        ? stateMigrations.migrateState(profile)
        : profile;
      return {
        ...defaultState(),
        ...migrated,
        liked: new Set(migrated.liked || []),
        hidden: new Set(migrated.hidden || []),
        saved: new Set(migrated.saved || []),
        snoozed: new Set(migrated.snoozed || []),
        userGames: hydrateUserGames(migrated),
        quickReactions: migrated.quickReactions || {},
        atomWeights: migrated.atomWeights || {},
        importedRatings: migrated.importedRatings || [],
        notebook: migrated.notebook || emptyNotebook(),
        feedbackLog: migrated.feedbackLog || [],
        userEvents: migrated.userEvents || [],
        dropDecisions: migrated.dropDecisions || {},
      };
    }

    function hideProfileConflict() {
      _pendingProfileImport = null;
      if (els.profileConflict) els.profileConflict.hidden = true;
    }

    function applyProfileImport(pending = _pendingProfileImport) {
      if (!pending) return false;
      const imported = hydrateImportedProfile(pending.unpacked.profile);
      setState(imported);
      saveState();
      render();
      hideProfileConflict();
      els.exportStatus.textContent = `${t(pending.unpacked.legacy ? "data.legacyBackupImported" : "data.profileBackupImported", { count: Object.keys(imported.userGames).length })} ✓`;
      setTimeout(() => { els.exportStatus.textContent = ""; }, 4000);
      return true;
    }

    function profileConflictCopy(status) {
      if (status === "legacy") return { title: t("data.syncLegacyTitle"), detail: t("data.syncLegacyDetail") };
      if (status === "remote_ahead") return { title: t("data.syncRemoteAheadTitle"), detail: t("data.syncRemoteAheadDetail") };
      if (status === "local_ahead") return { title: t("data.syncLocalAheadTitle"), detail: t("data.syncLocalAheadDetail") };
      if (status === "different_profile") return { title: t("data.syncDifferentProfileTitle"), detail: t("data.syncDifferentProfileDetail") };
      return { title: t("data.syncDivergedTitle"), detail: t("data.syncDivergedDetail") };
    }

    function showProfileConflict(unpacked, comparison) {
      _pendingProfileImport = { unpacked, comparison };
      if (!els.profileConflict) return applyProfileImport(_pendingProfileImport);
      const localEnvelope = createProfileEnvelope(getState(), { deviceId: getDeviceId() });
      const incoming = unpacked.envelope;
      const copy = profileConflictCopy(comparison.status);
      els.profileConflictTitle.textContent = copy.title;
      els.profileConflictDetail.textContent = copy.detail;
      els.profileConflictFacts.innerHTML = `
        <span><small>${t("data.syncThisDevice")}</small><strong>${t("data.syncRevisionValue", { revision: localEnvelope.revision })}</strong></span>
        <span><small>${t("data.syncBackupDevice")}</small><strong>${t("data.syncRevisionValue", { revision: incoming.revision })}</strong></span>
      `;
      els.profileConflict.hidden = false;
      els.profileConflict.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
      els.profileConflictUse?.focus?.();
      return false;
    }

    function resolveProfileImport(action) {
      if (action === "use_backup") return applyProfileImport();
      hideProfileConflict();
      if (action === "keep_local") {
        els.exportStatus.textContent = t("data.syncKeptDevice");
        setTimeout(() => { els.exportStatus.textContent = ""; }, 3000);
      }
      return false;
    }

    function importStateJson(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          const unpacked = unwrapProfileEnvelope(parsed);
          if (unpacked.legacy) {
            showProfileConflict(unpacked, { status: "legacy", safeAction: "confirm_replace" });
            return;
          }
          const localEnvelope = createProfileEnvelope(getState(), { deviceId: getDeviceId() });
          const comparison = compareProfileEnvelopes(localEnvelope, unpacked.envelope);
          if (comparison.status === "identical") {
            hideProfileConflict();
            els.exportStatus.textContent = t("data.syncAlreadyCurrent");
            return;
          }
          showProfileConflict(unpacked, comparison);
        } catch (err) {
          els.exportStatus.textContent = t("data.importFailed", { message: err.message });
        }
      };
      reader.readAsText(file);
    }

    // ── Smart Library Import (Backloggd / HLTB / plain list / PSN) ───────────
    function applyLibraryImportEntries(entries) {
      const state = getState();
      let added = 0;
      entries.forEach(({ title, status, hoursPlayed, rating }) => {
        if (!title) return;
        const key = titleKey(title);
        const existing = state.userGames[key];
        const resolvedState = status || "owned";
        const userGame = applyStateToUserGame(
          existing || userStateToUserGame(title, ""),
          resolvedState
        );
        userGame.title = existing?.title || title;
        if (typeof hoursPlayed === "number" && !isNaN(hoursPlayed)) {
          userGame.hoursPlayed = hoursPlayed;
        }
        if (typeof rating === "number" && !isNaN(rating)) {
          userGame.importedRating = rating;
        }
        state.userGames[key] = userGame;
        if (userGame.hidden) state.hidden.add(title);
        if (userGame.saved) state.saved.add(title);
        state.userStates[key] = { title, state: resolvedState, updatedAt: userGame.updatedAt };
        added++;
      });
      return added;
    }

    function showLibraryImportPreview(result) {
      _pendingImportEntries = result.entries;
      if (!els.libraryImportPreview || !els.libraryImportConfirmRow) return;
      const summary = importSummaryLabel(result);
      const sample = result.entries.slice(0, 8).map((e) =>
        `<li><strong>${e.title}</strong> — <em>${e.status}</em>${e.hoursPlayed ? ` · ${t("data.hours", { count: e.hoursPlayed })}` : ""}</li>`
      ).join("");
      const more = result.entries.length > 8
        ? `<li>${t("data.importMore", { count: result.entries.length - 8 })}</li>`
        : "";
      els.libraryImportPreview.innerHTML = `<p><strong>${summary}</strong></p><ul>${sample}${more}</ul>`;
      els.libraryImportPreview.style.display = "";
      els.libraryImportConfirmRow.style.display = "";
    }

    function handleLibraryFileImport(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const detected = detectFormat(text);
        let result;
        if (detected.type === "playsputnik-json") {
          importStateJson(file);
          return;
        } else if (detected.type === "backloggd-csv") {
          result = parseBackloggdCsv(detected.data);
        } else if (detected.type === "hltb-json") {
          result = parseHltbJson(detected.data);
        } else if (detected.type === "plain-list") {
          result = parsePlainList(detected.data);
        } else {
          els.exportStatus.textContent = t("data.unknownFormat");
          return;
        }
        showLibraryImportPreview(result);
      };
      reader.readAsText(file);
    }

    async function importFromPsn(npsso) {
      const endpoint = `http://127.0.0.1:${window.__playsputnikSearchPort || 4191}/api/psn`;
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ npsso }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Server error ${resp.status}`);
      return data.games || [];
    }

    // ── Wire event listeners ──────────────────────────────────────────────────
    function bindExportListeners() {
      els.exportJson.addEventListener("click", exportStateJson);
      els.exportCsv.addEventListener("click", exportLibraryCsv);
      els.importFile.addEventListener("change", (e) => {
        if (e.target.files[0]) importStateJson(e.target.files[0]);
        e.target.value = "";
      });
      els.profileConflictUse?.addEventListener("click", () => resolveProfileImport("use_backup"));
      els.profileConflictKeep?.addEventListener("click", () => resolveProfileImport("keep_local"));
      els.profileConflictCancel?.addEventListener("click", () => resolveProfileImport("cancel"));

      if (els.libraryImportFile) {
        els.libraryImportFile.addEventListener("change", (e) => {
          if (e.target.files[0]) handleLibraryFileImport(e.target.files[0]);
          e.target.value = "";
        });
      }

      if (els.libraryImportConfirm) {
        els.libraryImportConfirm.addEventListener("click", () => {
          if (!_pendingImportEntries) return;
          const importedEntries = _pendingImportEntries;
          const added = applyLibraryImportEntries(importedEntries);
          _pendingImportEntries = null;
          saveState();
          render();
          onLibraryEntriesImported(importedEntries);
          if (els.libraryImportPreview) {
            els.libraryImportPreview.style.display = "none";
            els.libraryImportPreview.innerHTML = "";
          }
          if (els.libraryImportConfirmRow) els.libraryImportConfirmRow.style.display = "none";
          els.exportStatus.textContent = `${t("data.gamesAdded", { count: added })} ✓`;
          setTimeout(() => { els.exportStatus.textContent = ""; }, 4000);
        });
      }

      if (els.libraryImportDiscard) {
        els.libraryImportDiscard.addEventListener("click", () => {
          _pendingImportEntries = null;
          if (els.libraryImportPreview) {
            els.libraryImportPreview.style.display = "none";
            els.libraryImportPreview.innerHTML = "";
          }
          if (els.libraryImportConfirmRow) els.libraryImportConfirmRow.style.display = "none";
        });
      }

      if (els.psnConnectBtn) {
        els.psnConnectBtn.addEventListener("click", () => {
          if (els.psnImportSection) {
            els.psnImportSection.style.display = "";
            els.psnImportSection.scrollIntoView({ behavior: "smooth" });
          }
        });
      }

      if (els.psnImportCancel) {
        els.psnImportCancel.addEventListener("click", () => {
          if (els.psnImportSection) els.psnImportSection.style.display = "none";
          if (els.psnNpssoInput) els.psnNpssoInput.value = "";
          if (els.psnImportResult) els.psnImportResult.innerHTML = "";
          if (els.psnImportStatus) els.psnImportStatus.textContent = "";
        });
      }

      if (els.psnImportBtn) {
        els.psnImportBtn.addEventListener("click", async () => {
          const npsso = els.psnNpssoInput?.value.trim() || "";
          if (npsso.length < 20) {
            if (els.psnImportResult) els.psnImportResult.innerHTML = `<p class="import-error">${t("settings.psn.tokenRequired")}</p>`;
            return;
          }
          els.psnImportBtn.disabled = true;
          els.psnImportBtn.textContent = t("settings.psn.importing");
          if (els.psnImportStatus) els.psnImportStatus.textContent = t("settings.psn.connecting");
          if (els.psnImportResult) els.psnImportResult.innerHTML = "";
          try {
            const trophyTitles = await importFromPsn(npsso);
            const result = parsePsnTrophyTitles(trophyTitles);
            if (els.psnImportSection) els.psnImportSection.style.display = "none";
            if (els.psnNpssoInput) els.psnNpssoInput.value = "";
            showLibraryImportPreview(result);
            if (els.psnImportStatus) els.psnImportStatus.textContent = "";
          } catch (err) {
            if (els.psnImportResult) {
              els.psnImportResult.innerHTML = `<p class="import-error">${err.message}</p>`;
            }
            if (els.psnImportStatus) els.psnImportStatus.textContent = t("settings.psn.failed");
            console.warn("[PSN import]", err);
          } finally {
            els.psnImportBtn.disabled = false;
            els.psnImportBtn.textContent = t("settings.psn.import");
          }
        });
      }
    }

    return {
      exportStateJson,
      exportLibraryCsv,
      importStateJson,
      resolveProfileImport,
      applyLibraryImportEntries,
      showLibraryImportPreview,
      handleLibraryFileImport,
      importFromPsn,
      bindExportListeners,
    };
  }

  window.PlaySputnikExport = { createExportTools };
})();
