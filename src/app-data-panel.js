/* PlaySputnik Data Panel Module — Source Health, Dev Health, Workbench, Catalog Backbone/Workbench, Refresh Policy */
"use strict";
(function () {
  if (!window.PlaySputnikDev) throw new Error("app-dev must load before app-data-panel");
  if (!window.PlaySputnikEnrichment) throw new Error("app-enrichment must load before app-data-panel");

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
    els,
  }) {

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
      els.refreshPolicyStatus.textContent = refreshPolicy.label;
      els.refreshPolicySummary.textContent =
        `${hot?.priceChecks || 0}/${refreshPolicy.dailySnapshotCap} daily snapshot budget used by hot intent in ${state.activeRegion}.`;
      els.refreshPolicyList.replaceChildren(
        ...queue.map((band) => {
          const row = document.createElement("div");
          row.className = "policy-row";
          const percentage = Math.min(100, Math.round((band.priceChecks / refreshPolicy.dailySnapshotCap) * 100));
          row.innerHTML = `
            <div>
              <strong>${band.label}</strong>
              <span>${band.description}</span>
            </div>
            <span class="policy-cadence">${band.cadence}</span>
            <span>${band.games.length} games</span>
            <span>${band.priceChecks} checks</span>
            <span>${band.staleSignals} verify</span>
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
      els.sourceMode.textContent = sourceStatus.label;
      els.sourceList.replaceChildren(
        ...sourceStatus.sources.map((source) => {
          const row = document.createElement("div");
          row.className = "source-row";
          row.innerHTML = `
            <div>
              <strong>${source.layer}</strong>
              <span>${source.kind}</span>
            </div>
            <span class="source-state ${source.freshnessState}">${source.freshnessState}</span>
            <span>${source.confidence}</span>
            <span>${source.note}</span>
          `;
          return row;
        }),
      );
    }

    // ── Dev Health ──────────────────────────────────────────────────────────
    function createDevHealthRow(check) {
      const row = document.createElement("div");
      row.className = "dev-health-row";

      const label = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = check.label || check.id || "Check";
      const detail = document.createElement("span");
      detail.textContent = check.detail || "No detail recorded.";
      label.append(title, detail);

      const statusEl = document.createElement("span");
      statusEl.className = `dev-health-state ${devHealthStatusClass(check.status)}`;
      statusEl.textContent = compactStatus(check.status || "unknown");

      const command = document.createElement("code");
      command.textContent = check.command || "No command";

      const repair = document.createElement("small");
      repair.textContent = check.repairCommand ? `Repair: ${check.repairCommand}` : "No repair command";

      row.append(label, statusEl, command, repair);
      return row;
    }

    function renderDevHealth() {
      const devHealth = getDevHealth();
      const checks = devHealthChecks();
      const okCount = checks.filter((check) => devHealthStatusClass(check.status) === "pass").length;
      const attentionCount = checks.filter((check) => ["warning", "fail", "loading"].includes(devHealthStatusClass(check.status))).length;
      const snapshot = devHealth?.updatedAt ? `Last CLI snapshot ${devHealth.updatedAt}` : "No CLI snapshot loaded";
      els.devHealthStatus.textContent = attentionCount
        ? `${okCount}/${checks.length} ok / ${attentionCount} attention`
        : `${okCount}/${checks.length} ok`;
      els.devHealthSummary.textContent = `${snapshot}. ${devHealth?.summary || "Local health checks are loading."}`;
      els.devHealthList.replaceChildren(...checks.map(createDevHealthRow));
    }

    // ── Data Workbench ──────────────────────────────────────────────────────
    function renderDataWorkbench() {
      const dataHealth = getDataHealth();
      if (!dataHealth) return;
      els.workbenchStatus.textContent = `${dataHealth.status} / ${dataHealth.issueCount} issues`;
      const regionCards = dataHealth.regions.map((region) => {
        const coverage = dataHealth.regionCoverage[region];
        return { label: `${region} coverage`, value: `${coverage.priceCoverage}% price`, sub: `${coverage.psPlusCount} PS Plus picks` };
      });
      const adultCards = Object.entries(dataHealth.adultSignals).map(([signal, value]) => ({
        label: signal, value: `${value}%`, sub: "adult signal coverage",
      }));
      const cards = [
        { label: "Catalog", value: `${dataHealth.gameCount} games`, sub: dataHealth.mode },
        { label: "Title aliases", value: `${dataHealth.companionLayers?.titleAliasCount || 0} aliases`, sub: "import matching" },
        {
          label: "Covers",
          value: `${dataHealth.coverCoverage?.coverage || 0}% ready`,
          sub: `${dataHealth.coverCoverage?.fallbackCount || 0} fallback / ${dataHealth.coverCoverage?.realImageCount || 0} images`,
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
          item.textContent = `${atom} ${count}`;
          return item;
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

      els.catalogBackboneStatus.textContent = `${currentSeed}/${seedTarget} seed / ${records.length} queued`;
      els.catalogBackboneSummary.textContent =
        `${promoted.length} promoted, ${ready.length} ready for seed, ${review.length} need atom review, ${coverMissing.length} cover gaps, ${hotPrice.length} hot price-watch candidates.`;

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
              <strong>${lane.label}</strong>
              <span>${laneRecords.length}/${lane.target} records</span>
            </div>
            <span class="backbone-pill">${lanePromoted} seeded</span>
            <span>${laneReady} ready</span>
            <span>${laneRecords.filter((r) => r.coverStatus === "missing").length} covers</span>
            <span>${laneRecords.filter((r) => r.priceNeed === "hot").length} hot</span>
            <span>${next ? next.title : "No candidate"}</span>
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

      els.catalogWorkbenchStatus.textContent = `${records.length} imports / ${manualReview} review`;
      els.catalogWorkbenchSummary.textContent =
        `${highConfidence} high-confidence matches, ${coverReady} cover candidates, ${atomReady} atom-ready, ${hotPrice} hot price checks.`;

      els.catalogWorkbenchList.replaceChildren(
        ...records.map((record) => {
          const row = document.createElement("div");
          row.className = "catalog-import-row";
          const reviewText = (record.manualReview || []).length ? record.manualReview.join(", ") : "ready";
          row.innerHTML = `
            <div>
              <strong>${record.title}</strong>
              <span>${record.source}</span>
            </div>
            <span class="catalog-pill ${catalogStatusClass(record.matchConfidence)}">${compactStatus(record.matchConfidence)}</span>
            <span class="catalog-pill ${catalogStatusClass(record.coverStatus)}">${compactStatus(record.coverStatus)}</span>
            <span class="catalog-pill ${catalogStatusClass(record.atomStatus)}">${compactStatus(record.atomStatus)}</span>
            <span class="catalog-pill ${catalogStatusClass(record.priceNeed)}">${compactStatus(record.priceNeed)}</span>
            <span>${reviewText}</span>
          `;
          return row;
        }),
      );
    }

    return {
      refreshQueue,
      refreshBandForGame,
      renderRefreshPolicy,
      renderSourceHealth,
      renderDevHealth,
      renderDataWorkbench,
      renderCatalogBackbone,
      renderCatalogWorkbench,
    };
  }

  window.PlaySputnikDataPanel = { createDataPanelTools };
})();
