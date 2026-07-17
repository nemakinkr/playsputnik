/* PlaySputnik Continuity — repeatable started-game check-ins and progress */
"use strict";
(function () {
  const ACTIVE_STATES = new Set(["playing", "want_to_finish", "paused"]);
  const STATE_PRIORITY = { playing: 0, want_to_finish: 1, paused: 2 };
  const SESSION_HISTORY_LIMIT = 30;

  function finiteNonNegative(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
  }

  function normalizePlayProgress(record) {
    const source = record && typeof record === "object" ? record : {};
    const sessions = (Array.isArray(source.sessions) ? source.sessions : [])
      .map((session) => ({
        minutes: Math.max(1, Math.round(finiteNonNegative(session?.minutes))),
        playedAt: session?.playedAt || null,
      }))
      .filter((session) => session.playedAt)
      .sort((a, b) => (Date.parse(b.playedAt) || 0) - (Date.parse(a.playedAt) || 0))
      .slice(0, SESSION_HISTORY_LIMIT);
    return {
      sessionCount: Math.floor(finiteNonNegative(source.sessionCount)),
      totalMinutes: Math.round(finiteNonNegative(source.totalMinutes)),
      lastSessionMinutes: Math.round(finiteNonNegative(source.lastSessionMinutes)),
      lastPlayedAt: source.lastPlayedAt || null,
      lastOutcome: source.lastOutcome || "",
      sessions,
    };
  }

  function activeContinuityRecords(userGames = {}) {
    return Object.values(userGames || {})
      .filter((record) => record?.title && ACTIVE_STATES.has(record.completionStatus))
      .sort((a, b) => {
        const stateDelta = (STATE_PRIORITY[a.completionStatus] ?? 9) - (STATE_PRIORITY[b.completionStatus] ?? 9);
        if (stateDelta) return stateDelta;
        const aTime = Date.parse(a.lastActivityAt || a.playProgress?.lastPlayedAt || a.startedAt || 0) || 0;
        const bTime = Date.parse(b.lastActivityAt || b.playProgress?.lastPlayedAt || b.startedAt || 0) || 0;
        return bTime - aTime || a.title.localeCompare(b.title);
      });
  }

  function continuityFocus(userGames = {}, preferredTitle = "") {
    const records = activeContinuityRecords(userGames);
    const preferred = String(preferredTitle || "").trim().toLocaleLowerCase();
    return records.find((record) => record.title.toLocaleLowerCase() === preferred) || records[0] || null;
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
        sessions: [
          { minutes: duration, playedAt: at },
          ...progress.sessions,
        ].slice(0, SESSION_HISTORY_LIMIT),
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
      sessions: progress.sessions,
    };
  }

  function continuityHistory(userGames = {}, limit = 12) {
    return Object.values(userGames || {})
      .flatMap((record) => normalizePlayProgress(record?.playProgress).sessions.map((session) => ({
        ...session,
        title: record.title,
      })))
      .sort((a, b) => (Date.parse(b.playedAt) || 0) - (Date.parse(a.playedAt) || 0))
      .slice(0, Math.max(0, limit));
  }

  window.PlaySputnikContinuity = {
    normalizePlayProgress,
    activeContinuityRecords,
    continuityFocus,
    ensurePlaying,
    applyPlaySession,
    continuitySnapshot,
    continuityHistory,
  };
})();
