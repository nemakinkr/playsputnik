/* PlaySputnik Export Module — JSON/CSV export, PlaySputnik backup import, Backloggd/HLTB/PSN library import */
"use strict";
(function () {
  if (!window.PlaySputnikImport) throw new Error("app-import must load before app-export");
  if (!window.PlaySputnikState) throw new Error("app-state must load before app-export");

  const {
    detectFormat,
    parseBackloggdCsv,
    parseHltbJson,
    parsePlainList,
    parsePsnTrophyTitles,
    importSummaryLabel,
  } = window.PlaySputnikImport;

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
    saveState,
    render,
    els,
  }) {
    let _pendingImportEntries = null;

    // ── JSON Export ───────────────────────────────────────────────────────────
    function exportStateJson() {
      const state = getState();
      const snapshot = {
        _exported: new Date().toISOString(),
        _version: "1",
        ...state,
        liked: [...state.liked],
        hidden: [...state.hidden],
        saved: [...state.saved],
        snoozed: [...state.snoozed],
      };
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `playsputnik-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      els.exportStatus.textContent = "JSON exported ✓";
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
      els.exportStatus.textContent = "CSV exported ✓";
      setTimeout(() => { els.exportStatus.textContent = ""; }, 3000);
    }

    // ── PlaySputnik JSON Backup Import ────────────────────────────────────────
    function importStateJson(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (!parsed || typeof parsed !== "object") throw new Error("Invalid JSON structure");
          const imported = {
            ...defaultState(),
            ...parsed,
            liked: new Set(parsed.liked || []),
            hidden: new Set(parsed.hidden || []),
            saved: new Set(parsed.saved || []),
            snoozed: new Set(parsed.snoozed || []),
            userGames: hydrateUserGames(parsed),
            quickReactions: parsed.quickReactions || {},
            atomWeights: parsed.atomWeights || {},
            importedRatings: parsed.importedRatings || [],
            notebook: parsed.notebook || emptyNotebook(),
            feedbackLog: parsed.feedbackLog || [],
            userEvents: parsed.userEvents || [],
            dropDecisions: parsed.dropDecisions || {},
          };
          setState(imported);
          saveState();
          render();
          els.exportStatus.textContent = `Imported ${Object.keys(imported.userGames).length} games ✓`;
          setTimeout(() => { els.exportStatus.textContent = ""; }, 4000);
        } catch (err) {
          els.exportStatus.textContent = `Import failed: ${err.message}`;
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
        `<li><strong>${e.title}</strong> — <em>${e.status}</em>${e.hoursPlayed ? ` · ${e.hoursPlayed}h` : ""}</li>`
      ).join("");
      const more = result.entries.length > 8 ? `<li>…and ${result.entries.length - 8} more</li>` : "";
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
          els.exportStatus.textContent = "Unknown file format. Try Backloggd CSV, HLTB JSON, or a plain title list.";
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

      if (els.libraryImportFile) {
        els.libraryImportFile.addEventListener("change", (e) => {
          if (e.target.files[0]) handleLibraryFileImport(e.target.files[0]);
          e.target.value = "";
        });
      }

      if (els.libraryImportConfirm) {
        els.libraryImportConfirm.addEventListener("click", () => {
          if (!_pendingImportEntries) return;
          const added = applyLibraryImportEntries(_pendingImportEntries);
          _pendingImportEntries = null;
          saveState();
          render();
          if (els.libraryImportPreview) {
            els.libraryImportPreview.style.display = "none";
            els.libraryImportPreview.innerHTML = "";
          }
          if (els.libraryImportConfirmRow) els.libraryImportConfirmRow.style.display = "none";
          els.exportStatus.textContent = `Added ${added} games to library ✓`;
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
            if (els.psnImportResult) els.psnImportResult.innerHTML = `<p class="import-error">Please paste your NPSSO token first.</p>`;
            return;
          }
          els.psnImportBtn.disabled = true;
          els.psnImportBtn.textContent = "Importing…";
          if (els.psnImportStatus) els.psnImportStatus.textContent = "Connecting to PSN…";
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
            if (els.psnImportStatus) els.psnImportStatus.textContent = "Failed";
            console.warn("[PSN import]", err);
          } finally {
            els.psnImportBtn.disabled = false;
            els.psnImportBtn.textContent = "Import from PSN";
          }
        });
      }
    }

    return {
      exportStateJson,
      exportLibraryCsv,
      importStateJson,
      applyLibraryImportEntries,
      showLibraryImportPreview,
      handleLibraryFileImport,
      importFromPsn,
      bindExportListeners,
    };
  }

  window.PlaySputnikExport = { createExportTools };
})();
