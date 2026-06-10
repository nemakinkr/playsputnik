/* PlaySputnik HLTB Module — value score, ROI, critic score, completion progress */
"use strict";
(function () {
  if (!window.PlaySputnikConfig) throw new Error("app-config must load before app-hltb");

  function createHltbTools({ getState, getSourceGames, formatPrice, formatMoney, titleKey }) {
    // ── Helpers ─────────────────────────────────────────────────────────────

    function sourceGame(title) {
      return getSourceGames().find((g) => titleKey(g.title) === titleKey(title));
    }

    function userGameFor(title) {
      const state = getState();
      return state.userGames[titleKey(title)] || null;
    }

    // ── Feature 1: Value Score = criticScore / hltbHours ────────────────────
    // A 96-score 15h game (6.4) beats an 82-score 40h game (2.05).
    // Higher is better — more quality per hour invested.

    function valueScore(game) {
      const src = typeof game === "string" ? sourceGame(game) : game;
      if (!src || !src.hltbHours || !src.criticScore) return null;
      return Math.round((src.criticScore / src.hltbHours) * 10) / 10;
    }

    function valueScoreLabel(game) {
      const score = valueScore(game);
      if (score === null) return null;
      if (score >= 7) return "Exceptional";
      if (score >= 5) return "Great";
      if (score >= 3.5) return "Good";
      if (score >= 2) return "Average";
      return "Long haul";
    }

    function valueScoreBand(game) {
      const score = valueScore(game);
      if (score === null) return "";
      if (score >= 7) return "exceptional";
      if (score >= 5) return "great";
      if (score >= 3.5) return "good";
      return "average";
    }

    // ── Feature 3: ROI = price paid ÷ hours played ──────────────────────────
    // Lower is better — the less you paid per hour of play, the better the ROI.

    function roiPerHour(title) {
      const state = getState();
      const ug = userGameFor(title);
      if (!ug || !ug.hoursPlayed || ug.hoursPlayed <= 0) return null;
      // Use price from userGame record, or fall back to state budget as proxy
      const price = typeof ug.pricePaid === "number" ? ug.pricePaid : null;
      if (price === null) return null;
      return Math.round((price / ug.hoursPlayed) * 100) / 100;
    }

    function roiLabel(title) {
      const roi = roiPerHour(title);
      if (roi === null) return null;
      const formatted = formatMoney ? formatMoney(roi) : `€${roi.toFixed(2)}`;
      return `${formatted}/h`;
    }

    function roiSummary(title) {
      const ug = userGameFor(title);
      if (!ug || !ug.hoursPlayed) return null;
      const roi = roiPerHour(title);
      return {
        hoursPlayed: ug.hoursPlayed,
        pricePaid: ug.pricePaid ?? null,
        perHour: roi,
        perHourLabel: roi !== null ? roiLabel(title) : null,
        verdict: roi === null ? null : roi <= 1 ? "Incredible value" : roi <= 3 ? "Good value" : roi <= 7 ? "Fair" : "Expensive per hour",
      };
    }

    // ── Feature 4: Critic score badge ───────────────────────────────────────

    function criticScoreLabel(game) {
      const src = typeof game === "string" ? sourceGame(game) : game;
      if (!src || src.criticScore == null) return null;
      return String(src.criticScore);
    }

    function criticScoreBand(game) {
      const src = typeof game === "string" ? sourceGame(game) : game;
      if (!src || src.criticScore == null) return "";
      if (src.criticScore >= 90) return "outstanding";
      if (src.criticScore >= 80) return "strong";
      if (src.criticScore >= 70) return "decent";
      return "mixed";
    }

    // ── Feature 4: HLTB completion progress ─────────────────────────────────

    function hltbHoursLabel(game) {
      const src = typeof game === "string" ? sourceGame(game) : game;
      if (!src || !src.hltbHours) return null;
      return `${src.hltbHours}h`;
    }

    function hltbProgress(title) {
      const src = sourceGame(title);
      const ug = userGameFor(title);
      if (!src || !src.hltbHours || !ug || !ug.hoursPlayed) return null;
      const pct = Math.min(100, Math.round((ug.hoursPlayed / src.hltbHours) * 100));
      return {
        played: ug.hoursPlayed,
        total: src.hltbHours,
        pct,
        label: `${ug.hoursPlayed}h of ${src.hltbHours}h`,
        remaining: Math.max(0, src.hltbHours - ug.hoursPlayed),
      };
    }

    // ── Combined summary card for detail drawer ──────────────────────────────

    function gameValueCard(game) {
      const src = typeof game === "string" ? sourceGame(game) : game;
      if (!src) return null;
      const title = src.title;
      return {
        criticScore: src.criticScore ?? null,
        criticScoreLabel: criticScoreLabel(src),
        criticScoreBand: criticScoreBand(src),
        hltbHours: src.hltbHours ?? null,
        hltbHoursLabel: hltbHoursLabel(src),
        valueScore: valueScore(src),
        valueScoreLabel: valueScoreLabel(src),
        valueScoreBand: valueScoreBand(src),
        roi: roiSummary(title),
        progress: hltbProgress(title),
      };
    }

    return {
      valueScore,
      valueScoreLabel,
      valueScoreBand,
      roiPerHour,
      roiLabel,
      roiSummary,
      criticScoreLabel,
      criticScoreBand,
      hltbHoursLabel,
      hltbProgress,
      gameValueCard,
    };
  }

  window.PlaySputnikHltb = { createHltbTools };
})();
