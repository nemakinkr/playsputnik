/* PlaySputnik Activity — recent changes and weekly companion report */
"use strict";
(function () {
  const DAY_MS = 86400000;
  const RECENT_WINDOW_DAYS = 14;
  const WEEK_WINDOW_DAYS = 7;

  const DECISION_TYPES = new Set([
    "user_game_state_changed",
    "user_game_cleared",
    "user_game_rating_changed",
    "backlog_amnestied",
    "backlog_amnesty_restored",
    "price_watch_target_set",
    "price_watch_target_cleared",
    "provider_import_reviewed",
    "search_seed_state_changed",
    "search_external_state_changed",
  ]);

  function eventPayload(event) {
    return event?.payload && typeof event.payload === "object"
      ? event.payload
      : event?.detail && typeof event.detail === "object"
        ? event.detail
        : {};
  }

  function eventTime(event, preferSource = false) {
    const value = preferSource
      ? event?.source?.checkedAt || event?.occurredAt || event?.at
      : event?.occurredAt || event?.at;
    const time = Date.parse(value || "");
    return Number.isFinite(time) ? time : 0;
  }

  function recentUserChange(event) {
    const payload = eventPayload(event);
    if (event.type === "game_session_logged") return { kind: "progress", payload };
    if (event.type === "user_game_rating_changed") return { kind: "rating", payload };
    if (event.type === "backlog_amnestied") return { kind: "backlog", payload };
    if (event.type === "user_game_state_changed") {
      if (payload.completionStatus === "completed" || payload.to === "completed") return { kind: "completed", payload };
      if (payload.to === "playing") return { kind: "started", payload };
      if (payload.saved || payload.to === "saved" || payload.to === "play_later") return { kind: "saved", payload };
    }
    return null;
  }

  function trustedFactChange(event) {
    if (event?.delivery !== "eligible" || !event?.source?.checkedAt) return null;
    const kind = {
      "price.target_hit": "price",
      "release.upcoming": "release",
      "subscription.available": "subscription",
    }[event.type];
    return kind ? { kind, payload: eventPayload(event) } : null;
  }

  function buildRecentChanges({
    events = [],
    notificationEvents = [],
    recommendation = null,
    now = new Date(),
    windowDays = RECENT_WINDOW_DAYS,
    limit = 5,
  } = {}) {
    const nowTime = now instanceof Date ? now.getTime() : Date.parse(now);
    const cutoff = nowTime - Math.max(1, windowDays) * DAY_MS;
    const changes = [];
    let latestTasteSignal = null;

    events.forEach((event) => {
      const occurredAt = eventTime(event);
      if (!occurredAt || occurredAt < cutoff || occurredAt > nowTime + DAY_MS) return;
      const change = recentUserChange(event);
      if (change) changes.push({ ...change, title: event.title || "", occurredAt, source: null, type: event.type });
      if (/rating|taste|state_changed|briefing\.item_completed/.test(event.type || "")) {
        if (!latestTasteSignal || occurredAt > latestTasteSignal) latestTasteSignal = occurredAt;
      }
    });

    notificationEvents.forEach((event) => {
      const occurredAt = eventTime(event, true);
      if (!occurredAt || occurredAt < cutoff || occurredAt > nowTime + DAY_MS) return;
      const change = trustedFactChange(event);
      if (change) {
        changes.push({
          ...change,
          title: event.title || "",
          occurredAt,
          source: event.source,
          type: event.type,
        });
      }
    });

    if (recommendation?.title && latestTasteSignal) {
      changes.push({
        kind: "recommendation",
        title: recommendation.title,
        occurredAt: latestTasteSignal,
        payload: { score: Number(recommendation.score) || 0 },
        source: null,
        type: "recommendation.recalculated",
      });
    }

    const deduped = new Map();
    changes
      .sort((a, b) => b.occurredAt - a.occurredAt)
      .forEach((change) => {
        const key = `${change.kind}:${String(change.title).toLocaleLowerCase()}`;
        if (!deduped.has(key)) deduped.set(key, change);
      });
    return [...deduped.values()].slice(0, Math.max(1, limit));
  }

  function buildWeeklyReport({
    events = [],
    recommendation = null,
    now = new Date(),
    windowDays = WEEK_WINDOW_DAYS,
  } = {}) {
    const toAt = now instanceof Date ? now.getTime() : Date.parse(now);
    const fromAt = toAt - Math.max(1, windowDays) * DAY_MS;
    const weekly = events.filter((event) => {
      const time = eventTime(event);
      return time >= fromAt && time <= toAt + DAY_MS;
    });
    const playByTitle = new Map();
    let sessionMinutes = 0;
    let sessionCount = 0;
    let decisionCount = 0;
    let completedCount = 0;
    let releasedBacklogCount = 0;
    let ratingCount = 0;

    weekly.forEach((event) => {
      const payload = eventPayload(event);
      if (event.type === "game_session_logged") {
        const minutes = Math.max(0, Math.round(Number(payload.minutes) || 0));
        sessionMinutes += minutes;
        sessionCount += 1;
        if (event.title) playByTitle.set(event.title, (playByTitle.get(event.title) || 0) + minutes);
      }
      if (DECISION_TYPES.has(event.type)) decisionCount += 1;
      if (
        event.type === "user_game_state_changed"
        && (payload.completionStatus === "completed" || payload.to === "completed")
      ) completedCount += 1;
      if (event.type === "backlog_amnestied") releasedBacklogCount += 1;
      if (event.type === "user_game_rating_changed" && Number(payload.to) > 0) ratingCount += 1;
    });

    const topPlayed = [...playByTitle.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([title, minutes]) => ({ title, minutes }))[0] || null;

    return {
      fromAt,
      toAt,
      eventCount: weekly.length,
      sessionMinutes,
      sessionCount,
      playedGameCount: playByTitle.size,
      decisionCount,
      completedCount,
      releasedBacklogCount,
      ratingCount,
      topPlayed,
      recommendation: recommendation?.title
        ? { title: recommendation.title, score: Number(recommendation.score) || 0 }
        : null,
      hasActivity: weekly.length > 0,
    };
  }

  window.PlaySputnikActivity = {
    RECENT_WINDOW_DAYS,
    WEEK_WINDOW_DAYS,
    buildRecentChanges,
    buildWeeklyReport,
  };
})();
