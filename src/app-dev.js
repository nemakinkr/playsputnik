/* PlaySputnik Dev Module — health check data, status classification, workbench helpers */
"use strict";
(function () {
  if (!window.PlaySputnikConfig) throw new Error("app-config must load before app-dev");
  if (!window.PlaySputnikEnrichment) throw new Error("app-enrichment must load before app-dev");

  const { PROVIDER_SEARCH_ENDPOINT } = window.PlaySputnikConfig;

  function createDevTools({
    getState,
    getDevHealth,
    getDataHealth,
    searchSourceById,
    compactStatus,
  }) {
    function devHealthStatusClass(status) {
      const normalized = String(status || "unknown").replace(/[^a-z0-9]+/g, "-");
      if (["pass", "ok", "healthy", "live"].includes(normalized)) return "pass";
      if (["warning", "warn", "fallback", "attention"].includes(normalized)) return "warning";
      if (["fail", "error", "offline", "blocked"].includes(normalized)) return "fail";
      if (["loading", "requesting", "pending"].includes(normalized)) return "loading";
      return "optional";
    }

    function catalogStatusClass(value) {
      return String(value || "unknown").replace(/[^a-z0-9]+/g, "-");
    }

    function recordedDevCheck(id) {
      const devHealth = getDevHealth();
      return (devHealth?.checks || []).find((check) => check.id === id) || {};
    }

    function currentProviderDevCheck(recorded) {
      const state = getState();
      const provider = state.providerSearch || {};
      const source = searchSourceById("rawg_provider_hook");
      const command = recorded.command || "node scripts/search-provider-server.mjs --once \"Grand Theft Auto\"";
      const endpoint = source?.endpoint || PROVIDER_SEARCH_ENDPOINT;
      const base = {
        ...recorded,
        id: "provider_endpoint",
        label: recorded.label || "Provider endpoint",
        command,
      };

      if (provider.status === "live") {
        return {
          ...base,
          status: "pass",
          detail: `Live provider answered via ${provider.provider || endpoint}; ${provider.sourceHealth || "source health ok"}.`,
        };
      }
      if (provider.status === "fallback") {
        return {
          ...base,
          status: "warning",
          detail: `Provider returned fixture fallback via ${provider.provider || "local fallback"}; no-key search is still usable.`,
        };
      }
      if (provider.status === "loading") {
        return {
          ...base,
          status: "loading",
          detail: `Provider request is in progress for "${provider.query || "current query"}".`,
        };
      }
      if (provider.status === "offline") {
        return {
          ...base,
          status: "warning",
          detail: `Provider endpoint is unavailable; seed, backbone, fixture, and manual search still work.`,
        };
      }
      return {
        ...base,
        status: recorded.status || "optional",
        detail: recorded.detail || `Optional endpoint ${endpoint}; local search works without it.`,
      };
    }

    function devHealthChecks() {
      const devHealth = getDevHealth();
      const dataHealth = getDataHealth();
      const boot = typeof window !== "undefined" ? window.__playsputnikBoot || {} : {};
      const errors = typeof window !== "undefined" ? window.__playsputnikErrors || [] : [];
      const host = typeof window !== "undefined" ? window.location.host || "local file" : "local runtime";
      const preview = recordedDevCheck("preview_server");
      const data = recordedDevCheck("data_health");
      const smoke = recordedDevCheck("browser_smoke");
      const appViewSmoke = recordedDevCheck("app_view_smoke");
      const libraryWishlistSmoke = recordedDevCheck("library_wishlist_smoke");
      const gameDetailSmoke = recordedDevCheck("game_detail_smoke");
      const designSmoke = recordedDevCheck("design_smoke");
      const visualCatalogSmoke = recordedDevCheck("visual_catalog_smoke");
      const coverResolver = recordedDevCheck("cover_resolver");
      const provider = recordedDevCheck("provider_endpoint");
      const bootDetail = boot.coreRenderedAt
        ? `Current client rendered from ${host}; ${errors.length} captured errors.`
        : `Current client boot is pending on ${host}; ${errors.length} captured errors.`;

      return [
        {
          ...preview,
          id: "preview_server",
          label: preview.label || "Preview server",
          status: errors.length ? "warning" : preview.status || "pass",
          detail: `${bootDetail} ${preview.detail || ""}`.trim(),
          command: preview.command || "node scripts/preview-server.mjs --check",
          repairCommand: preview.repairCommand || "node scripts/preview-server.mjs --restart",
        },
        {
          ...data,
          id: "data_health",
          label: data.label || "Data health",
          status: dataHealth?.status || data.status || "loading",
          detail: dataHealth
            ? `${dataHealth.gameCount} seed games, ${dataHealth.issueCount} issues, ${dataHealth.companionLayers?.globalSearchFixtureCount || 0} no-key search fixtures.`
            : data.detail || "Waiting for data/data-health.json.",
          command: data.command || "node scripts/validate-data.mjs",
        },
        {
          ...smoke,
          id: "browser_smoke",
          label: smoke.label || "Browser smoke",
          status: smoke.status || "optional",
          detail: smoke.detail || "Run the CLI smoke test after frontend changes.",
          command: smoke.command || "node scripts/browser-smoke-test.mjs",
        },
        {
          ...appViewSmoke,
          id: "app_view_smoke",
          label: appViewSmoke.label || "App view smoke",
          status: appViewSmoke.status || "optional",
          detail: appViewSmoke.detail || "Run the product-area navigation smoke test after IA changes.",
          command: appViewSmoke.command || "node scripts/app-view-smoke-test.mjs",
        },
        {
          ...libraryWishlistSmoke,
          id: "library_wishlist_smoke",
          label: libraryWishlistSmoke.label || "Library/Wishlist smoke",
          status: libraryWishlistSmoke.status || "optional",
          detail: libraryWishlistSmoke.detail || "Run after changing library memory, wishlist, or purchase triage flows.",
          command: libraryWishlistSmoke.command || "node scripts/library-wishlist-smoke-test.mjs",
        },
        {
          ...gameDetailSmoke,
          id: "game_detail_smoke",
          label: gameDetailSmoke.label || "Game detail smoke",
          status: gameDetailSmoke.status || "optional",
          detail: gameDetailSmoke.detail || "Run after changing the game detail drawer, status cards, or detail actions.",
          command: gameDetailSmoke.command || "node scripts/game-detail-smoke-test.mjs",
        },
        {
          ...designSmoke,
          id: "design_smoke",
          label: designSmoke.label || "Design smoke",
          status: designSmoke.status || "optional",
          detail: designSmoke.detail || "Run the visual smoke test after layout or responsive design changes.",
          command: designSmoke.command || "node scripts/design-smoke-test.mjs",
        },
        {
          ...visualCatalogSmoke,
          id: "visual_catalog_smoke",
          label: visualCatalogSmoke.label || "Visual catalog smoke",
          status: visualCatalogSmoke.status || "optional",
          detail: visualCatalogSmoke.detail || "Run the library-shelf smoke test after visual catalog changes.",
          command: visualCatalogSmoke.command || "node scripts/visual-catalog-smoke-test.mjs",
        },
        {
          ...coverResolver,
          id: "cover_resolver",
          label: coverResolver.label || "Cover resolver",
          status: coverResolver.status || "optional",
          detail: coverResolver.detail || "Run cover candidate preview before writing any external images.",
          command: coverResolver.command || "node scripts/resolve-cover-candidates.mjs --limit 3",
        },
        currentProviderDevCheck(provider),
      ];
    }

    return {
      devHealthStatusClass,
      catalogStatusClass,
      recordedDevCheck,
      currentProviderDevCheck,
      devHealthChecks,
    };
  }

  window.PlaySputnikDev = { createDevTools };
})();
