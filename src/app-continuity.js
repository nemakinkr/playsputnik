/* PlaySputnik Continuity — repeatable started-game check-ins and progress */
"use strict";
(function () {
  const ACTIVE_STATES = new Set(["playing", "want_to_finish", "paused"]);
  const STATE_PRIORITY = { playing: 0, want_to_finish: 1, paused: 2 };

  function finiteNonNegative(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
  }

  function normalizePlayProgress(record) {
    const source = record && typeof record === "object" ? record : {};
    return {
      sessionCount: Math.floor(finiteNonNegative(source.sessionCount)),
      totalMinutes: Math.round(finiteNonNegative(source.totalMinutes)),
      lastSessionMinutes: Math.round(finiteNonNegative(source.lastSessionMinutes)),
      lastPlayedAt: source.lastPlayedAt || null,
      lastOutcome: source.lastOutcome || "",
    };
  }

  function continuityFocus(userGames = {}) {
    return Object.values(userGames || {})
      .filter((record) => record?.title && ACTIVE_STATES.has(record.completionStatus))
      .sort((a, b) => {
        const stateDelta = (STATE_PRIORITY[a.completionStatus] ?? 9) - (STATE_PRIORITY[b.completionStatus] ?? 9);
        if (stateDelta) return stateDelta;
        const aTime = Date.parse(a.lastActivityAt || a.playProgress?.lastPlayedAt || a.startedAt || 0) || 0;
        const bTime = Date.parse(b.lastActivityAt || b.playProgress?.lastPlayedAt || b.startedAt || 0) || 0;
        return bTime - aTime || a.title.localeCompare(b.title);
      })[0] || null;
  }

  function ensurePlaying(record, at) {
    const current = record && typeof record === "object" ? record : {};
    return {
      ...current,
      completionStatus: "playing",
      startedAt: current.startedAt || at,
      lastActivityAt: at,
      updatedAt: at,
    };
  }

  function applyPlaySession(record, minutes, at = new Date().toISOString()) {
    const duration = Math.max(1, Math.round(finiteNonNegative(minutes)));
    const current = ensurePlaying(record, at);
    const progress = normalizePlayProgress(current.playProgress);
    return {
      ...current,
      hoursPlayed: Math.round((finiteNonNegative(current.hoursPlayed) + duration / 60) * 100) / 100,
      playProgress: {
        sessionCount: progress.sessionCount + 1,
        totalMinutes: progress.totalMinutes + duration,
        lastSessionMinutes: duration,
        lastPlayedAt: at,
        lastOutcome: "continued",
      },
    };
  }

  function continuitySnapshot(record, expectedHours = null) {
    if (!record?.title) return null;
    const progress = normalizePlayProgress(record.playProgress);
    const hoursPlayed = finiteNonNegative(record.hoursPlayed);
    const total = Number(expectedHours);
    return {
      title: record.title,
      status: record.completionStatus || "",
      hoursPlayed,
      sessionCount: progress.sessionCount,
      totalMinutes: progress.totalMinutes,
      lastSessionMinutes: progress.lastSessionMinutes,
      lastPlayedAt: progress.lastPlayedAt || record.lastActivityAt || null,
      expectedHours: Number.isFinite(total) && total > 0 ? total : null,
      percent: Number.isFinite(total) && total > 0 ? Math.min(100, Math.round((hoursPlayed / total) * 100)) : null,
    };
  }

  window.PlaySputnikContinuity = {
    normalizePlayProgress,
    continuityFocus,
    ensurePlaying,
    applyPlaySession,
    continuitySnapshot,
  };
})();
