/* PlaySputnik Data Panel Module — Source Health, Dev Health, Workbench, Catalog Backbone/Workbench, Refresh Policy */
"use strict";
(function () {
  if (!window.PlaySputnikDev) throw new Error("app-dev must load before app-data-panel");
  if (!window.PlaySputnikEnrichment) throw new Error("app-enrichment must load before app-data-panel");
  const t = window.PlaySputnikI18n.t;

  function createDataPanelTools({
    getState,
    getGames,
    getRefreshPolicy,
    getSourceStatus,
    getDataHealth,
    getDevHealth,
    getCatalogBackbone,
    getCatalogWorkbench,
    devHealthStatusClass,
    catalogStatusClass,
    compactStatus,
    devHealthChecks,
    priceStatus,
    effectiveGameState,
    notebookWishlistWeight,
    onProviderImportAction,
    els,
  }) {
    let providerImportFilter = "candidate";

    function dataLabel(group, value, fallback = "") {
      const key = `data.${group}.${value}`;
      const translated = t(key);
      return translated === key ? fallback || String(value || "") : translated;
    }

    function localizedDiagnosticStatus(value) {
      return dataLabel("status", value, compactStatus(value));
    }

    function localizedSourceField(source, field) {
      return dataLabel(`source.${source.id}`, field, source[field]);
    }

    function localizedRefreshBand(band, field) {
      return dataLabel(`refreshBand.${band.id}`, field, band[field]);
    }

    function localizedLane(lane) {
      return dataLabel("lane", lane.id, lane.label);
    }

    function localizedManualReview(value) {
      return dataLabel("manualReview", String(value || "").replaceAll(" ", "_"), value);
    }

    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;",
      }[char]));
    }

    // ── Refresh Policy ──────────────────────────────────────────────────────
    function refreshBandForGame(game, rankIndex) {
      const state = getState();
      const region = state.activeRegion;
      const currentState = effectiveGameState(game);
      const wishlistIntent = game.wishlist || notebookWishlistWeight(game.title) > 0 || currentState === "saved";
      const strongDeal = (game.discount[region] || 0) >= 55;
      const closeToBudget = Math.abs((game.prices[region] || 0) - Number(state.budget)) <= 10;
      if (wishlistIntent || rankIndex < 5 || strongDeal) return "hot";
      if (game.backlog || rankIndex < 15 || closeToBudget || (game.discount[region] || 0) >= 30) return "warm";
      return "cold";
    }

    function refreshQueue(ranked) {
      const sourceStatus = getSourceStatus();
      const refreshPolicy = getRefreshPolicy();
      const regions = sourceStatus?.regions || ["US", "TR", "UK"];
      const buckets = { hot: [], warm: [], cold: [] };
      ranked.forEach((game, index) => buckets[refreshBandForGame(game, index)].push(game));
      return (refreshPolicy?.priorityBands || []).map((band) => {
        const gamesInBand = buckets[band.id] || [];
        const staleSignals = gamesInBand.reduce(
          (sum, game) => sum + regions.filter((region) => !priceStatus(game, region).canConfirm).length,
          0,
        );
        return { ...band, games: gamesInBand, priceChecks: gamesInBand.length * regions.length, staleSignals };
      });
    }

    function renderRefreshPolicy(ranked) {
      const refreshPolicy = getRefreshPolicy();
      if (!refreshPolicy) return;
      const queue = refreshQueue(ranked);
      const hot = queue.find((band) => band.id === "hot");
      const state = getState();
      els.refreshPolicyStatus.textContent = dataLabel("mode", refreshPolicy.mode, refreshPolicy.label);
      els.refreshPolicySummary.textContent = t("data.refreshSummary", {
        used: hot?.priceChecks || 0,
        cap: refreshPolicy.dailySnapshotCap,
        region: state.activeRegion,
      });
      els.refreshPolicyList.replaceChildren(
        ...queue.map((band) => {
          const row = document.createElement("div");
          row.className = "policy-row";
          const percentage = Math.min(100, Math.round((band.priceChecks / refreshPolicy.dailySnapshotCap) * 100));
          row.innerHTML = `
            <div>
              <strong>${localizedRefreshBand(band, "label")}</strong>
              <span>${localizedRefreshBand(band, "description")}</span>
            </div>
            <span class="policy-cadence">${localizedRefreshBand(band, "cadence")}</span>
            <span>${t("data.games", { count: band.games.length })}</span>
            <span>${t("data.checks", { count: band.priceChecks })}</span>
            <span>${t("data.verify", { count: band.staleSignals })}</span>
            <span class="policy-meter"><span style="width:${percentage}%"></span></span>
          `;
          return row;
        }),
      );
    }

    // ── Source Health ───────────────────────────────────────────────────────
    function renderSourceHealth() {
      const sourceStatus = getSourceStatus();
      if (!sourceStatus) return;
      const freshnessLabels = {
        fresh: t("data.sourceFresh"),
        sample: t("data.sourceSample"),
        stale: t("data.sourceStale"),
        missing: t("data.sourceMissing"),
      };
      const confidenceLabels = {
        high: t("data.confidenceHigh"),
        medium: t("data.confidenceMedium"),
        low: t("data.confidenceLow"),
        unknown: t("data.confidenceUnknown"),
      };
      els.sourceMode.textContent = dataLabel("mode", sourceStatus.mode, sourceStatus.label);
      els.sourceList.replaceChildren(
        ...sourceStatus.sources.map((source) => {
          const row = document.createElement("div");
          row.className = "source-row";
          row.innerHTML = `
            <div>
              <strong>${localizedSourceField(source, "layer")}</strong>
              <span>${localizedSourceField(source, "kind")}</span>
            </div>
            <span class="source-state ${source.freshnessState}">${freshnessLabels[source.freshnessState] || source.freshnessState}</span>
            <span>${confidenceLabels[source.confidence] || source.confidence}</span>
            <span>${localizedSourceField(source, "note")}</span>
          `;
          return row;
        }),
      );
    }

    // ── Dev Health ──────────────────────────────────────────────────────────
    function createDevHealthRow(check) {
      const row = document.createElement("div");
      row.className = "dev-health-row";
      row.dataset.checkId = check.id || "";

      const label = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = check.label || check.id || t("data.checkFallback");
      const detail = document.createElement("span");
      detail.textContent = check.detail || t("data.noDetail");
      label.append(title, detail);

      const statusEl = document.createElement("span");
      statusEl.className = `dev-health-state ${devHealthStatusClass(check.status)}`;
      statusEl.textContent = localizedDiagnosticStatus(check.status || "unknown");

      const command = document.createElement("code");
      command.textContent = check.command || t("data.noCommand");

      const repair = document.createElement("small");
      repair.textContent = check.repairCommand
        ? t("data.repair", { command: check.repairCommand })
        : t("data.noRepair");

      row.append(label, statusEl, command, repair);
      return row;
    }

    function renderDevHealth() {
      const devHealth = getDevHealth();
      const checks = devHealthChecks();
      const okCount = checks.filter((check) => devHealthStatusClass(check.status) === "pass").length;
      const attentionCount = checks.filter((check) => ["warning", "fail", "loading"].includes(devHealthStatusClass(check.status))).length;
      const snapshot = devHealth?.updatedAt
        ? t("data.cliSnapshot", { date: devHealth.updatedAt })
        : t("data.noCliSnapshot");
      els.devHealthStatus.textContent = attentionCount
        ? t("data.devStatusAttention", { ok: okCount, total: checks.length, attention: attentionCount })
        : t("data.devStatus", { ok: okCount, total: checks.length });
      els.devHealthSummary.textContent = `${snapshot}. ${dataLabel("devSummary", devHealth?.mode, devHealth?.summary || t("data.healthLoading"))}`;
      els.devHealthList.replaceChildren(...checks.map(createDevHealthRow));
    }

    function providerImportRecords() {
      const state = getState();
      return Object.values(state.userGames || {})
        .filter((record) => record?.providerImport?.provider === "rawg")
        .filter((record) => record.providerImport?.status !== "hidden")
        .sort((a, b) => String(b.providerImport?.importedAt || b.updatedAt || "").localeCompare(String(a.providerImport?.importedAt || a.updatedAt || "")));
    }

    function providerImportStatus(record) {
      return record?.providerImport?.status || "candidate";
    }

    function providerImportFilterMatches(record, filter) {
      const status = providerImportStatus(record);
      if (filter === "all") return true;
      return status === filter;
    }

    function providerImportFilterBar(records) {
      const counts = records.reduce((acc, record) => {
        const status = providerImportStatus(record);
        acc[status] = (acc[status] || 0) + 1;
        acc.all += 1;
        return acc;
      }, { all: 0, candidate: 0, accepted: 0, snoozed: 0 });
      const filters = [
        ["candidate", t("data.providerImportFilterCandidate", { count: counts.candidate })],
        ["accepted", t("data.providerImportFilterAccepted", { count: counts.accepted })],
        ["snoozed", t("data.providerImportFilterSnoozed", { count: counts.snoozed })],
        ["all", t("data.providerImportFilterAll", { count: counts.all })],
      ];
      const bar = document.createElement("div");
      bar.className = "provider-import-filters";
      bar.setAttribute("aria-label", t("data.providerImportFilterAria"));
      filters.forEach(([id, label]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.providerImportFilter = id;
        button.className = id === providerImportFilter ? "is-active" : "";
        button.setAttribute("aria-pressed", id === providerImportFilter ? "true" : "false");
        button.textContent = label;
        button.addEventListener("click", () => {
          providerImportFilter = id;
          renderProviderImports();
        });
        bar.appendChild(button);
      });
      return bar;
    }

    function averagePriceCoverage(dataHealth) {
      const coverages = (dataHealth?.regions || [])
        .map((region) => dataHealth.regionCoverage?.[region]?.priceCoverage)
        .filter((value) => typeof value === "number");
      if (!coverages.length) return 0;
      return Math.round(coverages.reduce((sum, value) => sum + value, 0) / coverages.length);
    }

    function renderDataQualitySnapshot() {
      if (!els.dataQualityStatus || !els.dataQualitySummary || !els.dataQualityList) return;
      const dataHealth = getDataHealth();
      if (!dataHealth) return;
      const triage = dataHealth.issueTriage || {};
      const sourceStatus = getSourceStatus();
      const catalogBackbone = getCatalogBackbone();
      const catalogWorkbench = getCatalogWorkbench();
      const providerImports = providerImportRecords();
      const priceCoverage = averagePriceCoverage(dataHealth);
      const freshSources = (sourceStatus?.sources || []).filter((source) => source.freshnessState === "fresh").length;
      const sourceCount = (sourceStatus?.sources || []).length;
      const backboneRecords = catalogBackbone?.records || [];
      const promotedBackbone = backboneRecords.filter((record) => record.status === "promoted_to_seed").length;
      const readyWorkbench = (catalogWorkbench?.records || []).filter((record) => record.matchConfidence === "high" && record.coverStatus !== "missing").length;
      const critical = triage.criticalIssueCount || 0;
      els.dataQualityStatus.textContent = t(critical ? "data.qualityStatusAttention" : "data.qualityStatusReady", {
        critical,
        issues: dataHealth.issueCount || 0,
      });
      els.dataQualitySummary.textContent = t("data.qualitySummary", {
        games: dataHealth.gameCount || 0,
        critical,
        priceIssues: triage.priceGapIssueCount ?? dataHealth.issueCount ?? 0,
      });
      const cards = [
        {
          tone: critical ? "warn" : "good",
          label: t("data.qualityCatalogLabel"),
          value: t("data.gameCount", { count: dataHealth.gameCount || 0 }),
          sub: t("data.qualityCriticalSub", { count: critical }),
        },
        {
          tone: (dataHealth.coverCoverage?.coverage || 0) >= 95 ? "good" : "warn",
          label: t("data.qualityCoversLabel"),
          value: `${dataHealth.coverCoverage?.coverage || 0}%`,
          sub: t("data.qualityCoversSub", {
            images: dataHealth.coverCoverage?.realImageCount || 0,
            fallback: dataHealth.coverCoverage?.fallbackCount || 0,
          }),
        },
        {
          tone: priceCoverage >= 95 ? "good" : "warn",
          label: t("data.qualityPricesLabel"),
          value: `${priceCoverage}%`,
          sub: t("data.qualityPricesSub", {
            regions: (dataHealth.regions || []).length,
            issues: triage.priceGapIssueCount ?? dataHealth.issueCount ?? 0,
          }),
        },
        {
          tone: freshSources >= Math.max(1, Math.ceil(sourceCount / 3)) ? "good" : "info",
          label: t("data.qualitySourcesLabel"),
          value: t("data.qualitySourcesValue", { fresh: freshSources, total: sourceCount }),
          sub: t("data.qualitySourcesSub", {
            aliases: dataHealth.companionLayers?.titleAliasCount || 0,
            fixtures: dataHealth.companionLayers?.globalSearchFixtureCount || 0,
          }),
        },
        {
          tone: providerImports.length ? "info" : "neutral",
          label: t("data.qualityProviderLabel"),
          value: t("data.qualityProviderValue", { count: providerImports.length }),
          sub: t("data.qualityProviderSub", {
            missing: providerImports.filter((record) => (record.providerImport?.priceStatus || record.priceStatus) === "missing").length,
          }),
        },
        {
          tone: readyWorkbench || promotedBackbone ? "info" : "neutral",
          label: t("data.qualityBackboneLabel"),
          value: t("data.qualityBackboneValue", { promoted: promotedBackbone, queued: backboneRecords.length }),
          sub: t("data.qualityBackboneSub", { ready: readyWorkbench }),
        },
      ];
      els.dataQualityList.replaceChildren(
        ...cards.map((card) => {
          const item = document.createElement("div");
          item.className = `data-quality-card tone-${card.tone}`;
          item.innerHTML = `<span>${card.label}</span><strong>${card.value}</strong><small>${card.sub}</small>`;
          return item;
        }),
      );
    }

    // ── Data Workbench ──────────────────────────────────────────────────────
    function renderDataWorkbench() {
      const dataHealth = getDataHealth();
      if (!dataHealth) return;
      const triage = dataHealth.issueTriage || {};
      els.workbenchStatus.textContent = t("data.workbenchStatus", {
        status: localizedDiagnosticStatus(dataHealth.status),
        issues: dataHealth.issueCount,
        critical: triage.criticalIssueCount || 0,
      });
      const regionCards = dataHealth.regions.map((region) => {
        const coverage = dataHealth.regionCoverage[region];
        return {
          label: t("data.regionCoverage", { region }),
          value: t("data.priceCoverage", { count: coverage.priceCoverage }),
          sub: t("data.plusPicks", { count: coverage.psPlusCount }),
        };
      });
      const adultCards = Object.entries(dataHealth.adultSignals).map(([signal, value]) => ({
        label: dataLabel("adultSignal", signal, signal), value: `${value}%`, sub: t("data.adultCoverage"),
      }));
      const cards = [
        {
          label: t("data.catalog"),
          value: t("data.gameCount", { count: dataHealth.gameCount }),
          sub: dataLabel("mode", dataHealth.mode, dataHealth.mode),
        },
        {
          label: t("data.titleAliases"),
          value: t("data.aliases", { count: dataHealth.companionLayers?.titleAliasCount || 0 }),
          sub: t("data.importMatching"),
        },
        {
          label: t("data.covers"),
          value: t("data.coverReady", { count: dataHealth.coverCoverage?.coverage || 0 }),
          sub: t("data.coverDetail", {
            fallback: dataHealth.coverCoverage?.fallbackCount || 0,
            images: dataHealth.coverCoverage?.realImageCount || 0,
          }),
        },
        {
          label: t("data.issueTriage"),
          value: t("data.critical", { count: triage.criticalIssueCount || 0 }),
          sub: dataLabel("triageSummary", triage.mode, triage.summary || t("data.waitingHealth")),
        },
        {
          label: t("data.priceGaps"),
          value: t("data.records", { count: triage.priceGapIssueCount ?? dataHealth.issueCount }),
          sub: t("data.gapDetail", {
            full: triage.fullPriceGapGameCount || 0,
            partial: triage.partialPriceGapGameCount || 0,
          }),
        },
        ...regionCards,
        ...adultCards,
      ];
      els.workbenchGrid.replaceChildren(
        ...cards.map((card) => {
          const item = document.createElement("div");
          item.className = "workbench-card";
          item.innerHTML = `<span>${card.label}</span><strong>${card.value}</strong><small>${card.sub}</small>`;
          return item;
        }),
      );
      els.topAtoms.replaceChildren(
        ...dataHealth.topAtoms.slice(0, 10).map(({ atom, count }) => {
          const item = document.createElement("span");
          item.className = "atom-pill";
          item.textContent = `${labelAtom(atom)} ${count}`;
          return item;
        }),
      );
    }

    // ── Provider Imports ────────────────────────────────────────────────────
    function renderProviderImports() {
      if (!els.providerImportStatus || !els.providerImportList) return;
      const records = providerImportRecords();
      const missingPrice = records.filter((record) => (record.providerImport?.priceStatus || record.priceStatus) === "missing").length;
      els.providerImportStatus.textContent = t("data.providerImportStatus", { count: records.length, missing: missingPrice });
      const controls = providerImportFilterBar(records);
      if (!records.length) {
        const empty = document.createElement("div");
        empty.className = "catalog-import-row is-empty";
        empty.innerHTML = `
          <div>
            <strong>${t("data.providerImportEmptyTitle")}</strong>
            <span>${t("data.providerImportEmptyDetail")}</span>
          </div>
        `;
        els.providerImportList.replaceChildren(controls, empty);
        return;
      }
      const filteredRecords = records.filter((record) => providerImportFilterMatches(record, providerImportFilter));
      if (!filteredRecords.length) {
        const empty = document.createElement("div");
        empty.className = "catalog-import-row is-empty";
        empty.innerHTML = `
          <div>
            <strong>${t("data.providerImportFilterEmptyTitle")}</strong>
            <span>${t("data.providerImportFilterEmptyDetail")}</span>
          </div>
        `;
        els.providerImportList.replaceChildren(controls, empty);
        return;
      }
      els.providerImportList.replaceChildren(
        controls,
        ...filteredRecords.slice(0, 12).map((record) => {
          const row = document.createElement("div");
          row.className = "provider-import-row";
          const importedAt = record.providerImport?.importedAt || record.updatedAt || "";
          const reviewStatus = record.providerImport?.status || "candidate";
          const coverUrl = record.providerImport?.coverUrl || record.coverUrl || "";
          const sourceUrl = record.providerImport?.sourceUrl || record.sourceUrl || "";
          const atoms = [...new Set([...(record.atoms || []), ...(record.inferredAtoms || [])])];
          const platforms = record.platforms || [];
          const gaps = [
            (record.providerImport?.priceStatus || record.priceStatus) === "missing" ? t("data.providerImportGapPrice") : "",
            !platforms.length ? t("data.providerImportGapPlatforms") : "",
            !atoms.length ? t("data.providerImportGapAtoms") : "",
          ].filter(Boolean);
          row.innerHTML = `
            ${coverUrl ? `
              <img class="provider-import-cover" src="${escapeHtml(coverUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer">
            ` : `<div class="provider-import-cover is-empty" aria-hidden="true">RAWG</div>`}
            <div class="provider-import-main">
              <div>
                <strong>${escapeHtml(record.title)}</strong>
                <span>${sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${t("data.providerImportOpenSource")}</a>` : t("data.providerImportNoSource")}</span>
              </div>
              <div class="provider-import-pills">
                <span class="catalog-pill ${catalogStatusClass(record.providerImport?.matchConfidence || record.matchConfidence)}">${localizedDiagnosticStatus(record.providerImport?.matchConfidence || record.matchConfidence || "unknown")}</span>
                <span class="catalog-pill ${catalogStatusClass(record.providerImport?.coverStatus || record.coverStatus)}">${localizedDiagnosticStatus(record.providerImport?.coverStatus || record.coverStatus || "missing")}</span>
                <span class="catalog-pill ${catalogStatusClass(record.providerImport?.priceStatus || record.priceStatus)}">${localizedDiagnosticStatus(record.providerImport?.priceStatus || record.priceStatus || "missing")}</span>
                <span class="catalog-pill">${t("data.providerImportAtoms", { count: atoms.length })}</span>
                <span class="catalog-pill">${platforms.length ? platforms.slice(0, 3).join(" / ") : t("data.providerImportNoPlatforms")}</span>
              </div>
              <small>${gaps.length ? t("data.providerImportGaps", { gaps: gaps.join(" / ") }) : t("data.providerImportReady")}</small>
            </div>
            <div class="provider-import-review">
              <span>${record.saved ? t("data.providerImportSaved") : t("data.providerImportReview")}</span>
              <strong>${record.providerImport?.attributionRequired ? t("data.providerImportAttribution") : t("data.providerImportNoCover")}</strong>
              <span class="provider-import-status tone-${escapeHtml(reviewStatus)}">${dataLabel("providerImportStatusLabel", reviewStatus, reviewStatus)}</span>
              <small>${importedAt ? t("data.providerImportImportedAt", { date: importedAt.slice(0, 10) }) : t("data.providerImportReview")}</small>
              <div class="provider-import-actions" aria-label="${t("data.providerImportActionsAria", { title: record.title })}">
                <button data-provider-import-action="accept" data-provider-import-title="${escapeHtml(record.title)}" type="button">${t("data.providerImportAccept")}</button>
                <button data-provider-import-action="snooze" data-provider-import-title="${escapeHtml(record.title)}" type="button">${t("data.providerImportSnooze")}</button>
                <button data-provider-import-action="hide" data-provider-import-title="${escapeHtml(record.title)}" type="button">${t("data.providerImportHide")}</button>
                ${reviewStatus === "accepted" ? `<button data-provider-import-action="open-wishlist" data-provider-import-title="${escapeHtml(record.title)}" type="button">${t("data.providerImportOpenWishlist")}</button>` : ""}
              </div>
            </div>
          `;
          row.querySelectorAll("[data-provider-import-action]").forEach((button) => {
            button.addEventListener("click", () => {
              onProviderImportAction?.(button.dataset.providerImportTitle, button.dataset.providerImportAction);
            });
          });
          return row;
        }),
      );
    }

    // ── Catalog Backbone ────────────────────────────────────────────────────
    function renderCatalogBackbone() {
      const catalogBackbone = getCatalogBackbone();
      if (!catalogBackbone) return;
      const records = catalogBackbone.records || [];
      const lanes = catalogBackbone.lanes || [];
      const seedTarget = catalogBackbone.target?.seedTarget || records.length;
      const currentSeed = catalogBackbone.target?.currentSeed || getGames().length;
      const promoted = records.filter((r) => r.status === "promoted_to_seed");
      const ready = records.filter((r) => r.status === "ready_for_seed");
      const review = records.filter((r) => r.status === "ready_for_atom_review");
      const coverMissing = records.filter((r) => r.coverStatus === "missing");
      const hotPrice = records.filter((r) => r.priceNeed === "hot");
      const statusPriority = {
        ready_for_seed: 0, ready_for_atom_review: 1, candidate: 2, blocked_identity: 9, promoted_to_seed: 10,
      };

      els.catalogBackboneStatus.textContent = t("data.backboneStatus", {
        current: currentSeed,
        target: seedTarget,
        queued: records.length,
      });
      els.catalogBackboneSummary.textContent = t("data.backboneSummary", {
        promoted: promoted.length,
        ready: ready.length,
        review: review.length,
        covers: coverMissing.length,
        hot: hotPrice.length,
      });

      els.catalogBackboneList.replaceChildren(
        ...lanes.map((lane) => {
          const laneRecords = records.filter((r) => r.lane === lane.id);
          const lanePromoted = laneRecords.filter((r) => r.status === "promoted_to_seed").length;
          const laneReady = laneRecords.filter((r) => r.status === "ready_for_seed").length;
          const next = laneRecords
            .filter((r) => r.status !== "promoted_to_seed")
            .sort((a, b) => (statusPriority[a.status] ?? 5) - (statusPriority[b.status] ?? 5) || a.priority - b.priority)[0];
          const row = document.createElement("div");
          row.className = "backbone-row";
          row.innerHTML = `
            <div>
              <strong>${localizedLane(lane)}</strong>
              <span>${t("data.laneRecords", { count: laneRecords.length, target: lane.target })}</span>
            </div>
            <span class="backbone-pill">${t("data.seeded", { count: lanePromoted })}</span>
            <span>${t("data.ready", { count: laneReady })}</span>
            <span>${t("data.coverCount", { count: laneRecords.filter((r) => r.coverStatus === "missing").length })}</span>
            <span>${t("data.hot", { count: laneRecords.filter((r) => r.priceNeed === "hot").length })}</span>
            <span>${next ? next.title : t("data.noCandidate")}</span>
          `;
          return row;
        }),
      );
    }

    // ── Catalog Workbench ───────────────────────────────────────────────────
    function renderCatalogWorkbench() {
      const catalogWorkbench = getCatalogWorkbench();
      if (!catalogWorkbench) return;
      const records = catalogWorkbench.records || [];
      const highConfidence = records.filter((r) => r.matchConfidence === "high").length;
      const coverReady = records.filter((r) => ["verified", "candidate"].includes(r.coverStatus)).length;
      const atomReady = records.filter((r) => r.atomStatus === "complete").length;
      const manualReview = records.filter((r) => (r.manualReview || []).length > 0).length;
      const hotPrice = records.filter((r) => r.priceNeed === "hot").length;

      els.catalogWorkbenchStatus.textContent = t("data.imports", { count: records.length, review: manualReview });
      els.catalogWorkbenchSummary.textContent = t("data.importSummary", {
        matches: highConfidence,
        covers: coverReady,
        atoms: atomReady,
        hot: hotPrice,
      });

      els.catalogWorkbenchList.replaceChildren(
        ...records.map((record) => {
          const row = document.createElement("div");
          row.className = "catalog-import-row";
          const reviewText = (record.manualReview || []).length
            ? record.manualReview.map(localizedManualReview).join(", ")
            : t("data.readyState");
          row.innerHTML = `
            <div>
              <strong>${record.title}</strong>
              <span>${dataLabel("workbenchSource", record.source, record.source)}</span>
            </div>
            <span class="catalog-pill ${catalogStatusClass(record.matchConfidence)}">${localizedDiagnosticStatus(record.matchConfidence)}</span>
            <span class="catalog-pill ${catalogStatusClass(record.coverStatus)}">${localizedDiagnosticStatus(record.coverStatus)}</span>
            <span class="catalog-pill ${catalogStatusClass(record.atomStatus)}">${localizedDiagnosticStatus(record.atomStatus)}</span>
            <span class="catalog-pill ${catalogStatusClass(record.priceNeed)}">${localizedDiagnosticStatus(record.priceNeed)}</span>
            <span>${reviewText}</span>
          `;
          return row;
        }),
      );
    }

    return {
      refreshQueue,
      refreshBandForGame,
      renderDataQualitySnapshot,
      renderRefreshPolicy,
      renderSourceHealth,
      renderDevHealth,
      renderDataWorkbench,
      renderProviderImports,
      renderCatalogBackbone,
      renderCatalogWorkbench,
    };
  }

  window.PlaySputnikDataPanel = { createDataPanelTools };
})();
