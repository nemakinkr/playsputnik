/* PlaySputnik Cover Module — poster themes, cover background, source labels, game source passport */
"use strict";
(function () {
  if (!window.PlaySputnikConfig) throw new Error("app-config must load before app-cover");
  if (!window.PlaySputnikScore) throw new Error("app-score must load before app-cover");
  if (!window.PlaySputnikEnrichment) throw new Error("app-enrichment must load before app-cover");
  if (!window.PlaySputnikRecommend) throw new Error("app-recommend must load before app-cover");

  function createCoverTools({
    getState,
    // from score module
    gameSignals,
    // from search module
    knownSeedGame,
    // from enrichment module
    sourcePassportItem,
    confidenceTone,
    // from recommend module
    effectiveUserGame,
    priceStatus,
  }) {
    function posterTheme(game) {
      const signals = gameSignals(game).join(" ");
      if (/horror|dark|tense|tension|crime|violent/i.test(signals)) return "noir";
      if (/cozy|warm|playful|routine|social/i.test(signals)) return "warm";
      if (/sci-fi|strange|systems|tactical|simulation/i.test(signals)) return "signal";
      if (/action|adrenaline|shooter|challenge|soulslike/i.test(signals)) return "kinetic";
      if (/rpg|open-world|exploration|mythic/i.test(signals)) return "expedition";
      return "studio";
    }

    function posterThemeLabel(theme) {
      return {
        noir: "Noir poster",
        warm: "Warm poster",
        signal: "Signal poster",
        kinetic: "Kinetic poster",
        expedition: "Expedition poster",
        studio: "Studio poster",
      }[theme] || "Studio poster";
    }

    function generatedPosterBackground(game) {
      const theme = posterTheme(game);
      const themes = {
        noir: ["#111827", "#2f1724", "#6b2838"],
        warm: ["#173d35", "#0f766e", "#d89b33"],
        signal: ["#17202b", "#263a8f", "#0b7c85"],
        kinetic: ["#151b25", "#6e2134", "#d66b2d"],
        expedition: ["#18324b", "#245f73", "#987c39"],
        studio: ["#17202b", "#314156", "#667085"],
      };
      const [a, b, c] = themes[theme] || themes.studio;
      return [
        "linear-gradient(180deg, rgba(8, 14, 23, 0.05) 0%, rgba(8, 14, 23, 0.82) 100%)",
        "repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0 1px, transparent 1px 18px)",
        `linear-gradient(135deg, ${a} 0%, ${b} 56%, ${c} 100%)`,
      ].join(", ");
    }

    function coverBackground(game) {
      const fallback = generatedPosterBackground(game);
      const cover = game.coverMeta;
      if (!cover?.url || cover.status === "blocked") return fallback;
      const escapedUrl = String(cover.url).replace(/["\\]/g, "\\$&");
      return `linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.72)), url(\"${escapedUrl}\")`;
    }

    function coverReadinessLabel(game) {
      const status = game.coverMeta?.status || "missing";
      if (status === "verified") return "real cover";
      if (status === "candidate") return "cover candidate";
      if (status === "fallback") return posterThemeLabel(posterTheme(game));
      return "needs cover";
    }

    function coverSourceLabel(game) {
      const cover = game.coverMeta;
      if (!cover) return t("narrative.detail.sourcePending");
      if (cover.source === "rawg") return t("narrative.detail.sourceNamed", { source: "RAWG" });
      if (cover.source === "igdb") return t("narrative.detail.sourceNamed", { source: "IGDB" });
      if (cover.source === "official_store") return t("narrative.detail.sourceOfficial");
      if (cover.source === "generated_poster" || cover.status === "fallback") return t("narrative.detail.sourceGenerated");
      return cover.source
        ? t("narrative.detail.sourceNamed", { source: cover.source })
        : t("narrative.detail.sourcePending");
    }

    function gameSourcePassport(game) {
      const state = getState();
      const userGame = effectiveUserGame(game) || game.externalMeta || {};
      const seed = knownSeedGame(game.title);
      const region = state.activeRegion;
      const catalog = seed ? t("narrative.detail.passportSeed") : userGame.catalogStatus || t("narrative.detail.catalogManual");
      const cover = seed ? game.coverMeta?.status || "fallback" : userGame.coverStatus || game.coverMeta?.status || "missing";
      const priceState = seed ? priceStatus(game, region).state : userGame.priceStatus || "missing";
      const statusKeys = {
        fresh: "narrative.detail.signalFresh",
        aging: "narrative.detail.signalAging",
        stale: "narrative.detail.signalStale",
        sample: "narrative.detail.signalSample",
        verify: "narrative.detail.signalVerify",
        missing: "narrative.detail.signalMissing",
      };
      const price = t(statusKeys[priceState] || "narrative.detail.signalMissing");
      const platforms = seed
        ? t("narrative.detail.passportSeed")
        : userGame.platforms?.length
          ? userGame.platforms.slice(0, 3).join(" / ")
          : t("narrative.detail.passportMissing");
      const atomStatus = (game.atoms || []).length
        ? userGame.atoms?.length
          ? t("narrative.detail.passportSourceTags")
          : userGame.inferredAtoms?.length
            ? t("narrative.detail.passportAi")
            : t("narrative.detail.passportSeedAtoms")
        : t("narrative.detail.passportMissing");
      const coverKeys = {
        verified: "narrative.detail.coverVerified",
        candidate: "narrative.detail.coverCandidate",
        fallback: "narrative.detail.coverGenerated",
        missing: "narrative.detail.coverMissing",
      };
      const coverValue = t(coverKeys[cover] || "narrative.detail.coverCheck");

      return [
        sourcePassportItem(t("narrative.detail.catalog"), catalog, seed ? "good" : confidenceTone(catalog)),
        sourcePassportItem(t("narrative.detail.cover"), coverValue),
        sourcePassportItem(t("narrative.detail.price"), price),
        sourcePassportItem(t("narrative.detail.atoms"), atomStatus, atomStatus === t("narrative.detail.passportMissing") ? "warn" : "good"),
        sourcePassportItem(t("narrative.detail.platform"), platforms, platforms === t("narrative.detail.passportMissing") ? "warn" : "neutral"),
      ];
    }

    return {
      posterTheme,
      posterThemeLabel,
      generatedPosterBackground,
      coverBackground,
      coverReadinessLabel,
      coverSourceLabel,
      gameSourcePassport,
    };
  }

  window.PlaySputnikCover = { createCoverTools };
})();
