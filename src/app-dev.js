/* PlaySputnik Dev Module — health check data, status classification, workbench helpers */
"use strict";
(function () {
  if (!window.PlaySputnikConfig) throw new Error("app-config must load before app-dev");
  if (!window.PlaySputnikEnrichment) throw new Error("app-enrichment must load before app-dev");

  const { PROVIDER_SEARCH_ENDPOINT } = window.PlaySputnikConfig;
  const t = window.PlaySputnikI18n.t;

  function createDevTools({
    getState,
    getDevHealth,
    getDataHealth,
    searchSourceById,
    compactStatus,
  }) {
    function devCheckLabel(id, fallback = "") {
      const key = `data.devCheck.${id}.label`;
      const value = t(key);
      return value === key ? fallback || id : value;
    }

    function devCheckDetail(id, fallback = "") {
      const key = `data.devCheck.${id}.detail`;
      const value = t(key);
      return value === key ? fallback : value;
    }

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
        label: devCheckLabel("provider_endpoint", recorded.label),
        command,
      };

      if (provider.status === "live") {
        return {
          ...base,
          status: "pass",
          detail: t("data.providerLive", {
            provider: provider.provider || endpoint,
            health: provider.sourceHealth || t("data.providerHealthy"),
          }),
        };
      }
      if (provider.status === "fallback") {
        return {
          ...base,
          status: "warning",
          detail: t("data.providerFallback", { provider: provider.provider || t("data.providerLocalFallback") }),
        };
      }
      if (provider.status === "loading") {
        return {
          ...base,
          status: "loading",
          detail: t("data.providerLoading", { query: provider.query || t("data.providerCurrentQuery") }),
        };
      }
      if (provider.status === "offline") {
        return {
          ...base,
          status: "warning",
          detail: t("data.providerOffline"),
        };
      }
      return {
        ...base,
        status: recorded.status || "optional",
        detail: devCheckDetail("provider_endpoint", recorded.detail || t("data.providerOptional", { endpoint })),
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
        ? t("data.clientRendered", { host, count: errors.length })
        : t("data.clientPending", { host, count: errors.length });

      return [
        {
          ...preview,
          id: "preview_server",
          label: devCheckLabel("preview_server", preview.label),
          status: errors.length ? "warning" : preview.status || "pass",
          detail: `${bootDetail} ${devCheckDetail("preview_server", preview.detail || "")}`.trim(),
          command: preview.command || "node scripts/preview-server.mjs --check",
          repairCommand: preview.repairCommand || "node scripts/preview-server.mjs --restart",
        },
        {
          ...data,
          id: "data_health",
          label: devCheckLabel("data_health", data.label),
          status: dataHealth?.status || data.status || "loading",
          detail: dataHealth
            ? t("data.dataHealthDetail", {
                games: dataHealth.gameCount,
                issues: dataHealth.issueCount,
                fixtures: dataHealth.companionLayers?.globalSearchFixtureCount || 0,
              })
            : devCheckDetail("data_health", data.detail || t("data.waitingDataHealth")),
          command: data.command || "node scripts/validate-data.mjs",
        },
        {
          ...smoke,
          id: "browser_smoke",
          label: devCheckLabel("browser_smoke", smoke.label),
          status: smoke.status || "optional",
          detail: devCheckDetail("browser_smoke", smoke.detail),
          command: smoke.command || "node scripts/browser-smoke-test.mjs",
        },
        {
          ...appViewSmoke,
          id: "app_view_smoke",
          label: devCheckLabel("app_view_smoke", appViewSmoke.label),
          status: appViewSmoke.status || "optional",
          detail: devCheckDetail("app_view_smoke", appViewSmoke.detail),
          command: appViewSmoke.command || "node scripts/app-view-smoke-test.mjs",
        },
        {
          ...libraryWishlistSmoke,
          id: "library_wishlist_smoke",
          label: devCheckLabel("library_wishlist_smoke", libraryWishlistSmoke.label),
          status: libraryWishlistSmoke.status || "optional",
          detail: devCheckDetail("library_wishlist_smoke", libraryWishlistSmoke.detail),
          command: libraryWishlistSmoke.command || "node scripts/library-wishlist-smoke-test.mjs",
        },
        {
          ...gameDetailSmoke,
          id: "game_detail_smoke",
          label: devCheckLabel("game_detail_smoke", gameDetailSmoke.label),
          status: gameDetailSmoke.status || "optional",
          detail: devCheckDetail("game_detail_smoke", gameDetailSmoke.detail),
          command: gameDetailSmoke.command || "node scripts/game-detail-smoke-test.mjs",
        },
        {
          ...designSmoke,
          id: "design_smoke",
          label: devCheckLabel("design_smoke", designSmoke.label),
          status: designSmoke.status || "optional",
          detail: devCheckDetail("design_smoke", designSmoke.detail),
          command: designSmoke.command || "node scripts/design-smoke-test.mjs",
        },
        {
          ...visualCatalogSmoke,
          id: "visual_catalog_smoke",
          label: devCheckLabel("visual_catalog_smoke", visualCatalogSmoke.label),
          status: visualCatalogSmoke.status || "optional",
          detail: devCheckDetail("visual_catalog_smoke", visualCatalogSmoke.detail),
          command: visualCatalogSmoke.command || "node scripts/visual-catalog-smoke-test.mjs",
        },
        {
          ...coverResolver,
          id: "cover_resolver",
          label: devCheckLabel("cover_resolver", coverResolver.label),
          status: coverResolver.status || "optional",
          detail: devCheckDetail("cover_resolver", coverResolver.detail),
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
