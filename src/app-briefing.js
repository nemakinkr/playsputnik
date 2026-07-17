/* PlaySputnik Daily Briefing — one compact agenda across product surfaces */
"use strict";
(function () {
  const DAILY_ACTION_LIMIT = 20;

  function normalizeDailyBriefingProgress(progress, date) {
    const safeDate = date || new Date().toISOString().slice(0, 10);
    if (!progress || typeof progress !== "object" || progress.date !== safeDate) {
      return { date: safeDate, actions: [], completedAt: null };
    }
    return {
      date: safeDate,
      actions: (Array.isArray(progress.actions) ? progress.actions : [])
        .filter((action) => action && action.key && action.title && action.kind)
        .slice(0, DAILY_ACTION_LIMIT),
      completedAt: progress.completedAt || null,
    };
  }

  function briefingItemKey(item, titleKey = (title) => String(title || "").toLocaleLowerCase()) {
    return `${item?.kind || "item"}:${titleKey(item?.title)}`;
  }

  function recordBriefingAction(progress, item, outcome, {
    date,
    at = new Date().toISOString(),
    titleKey = (title) => String(title || "").toLocaleLowerCase(),
  } = {}) {
    const normalized = normalizeDailyBriefingProgress(progress, date);
    const key = briefingItemKey(item, titleKey);
    const action = { key, kind: item.kind, title: item.title, outcome: outcome || "opened", at };
    return {
      ...normalized,
      actions: [action, ...normalized.actions.filter((entry) => entry.key !== key)].slice(0, DAILY_ACTION_LIMIT),
      completedAt: null,
    };
  }

  function finishDailyBriefing(progress, { date, at = new Date().toISOString() } = {}) {
    return { ...normalizeDailyBriefingProgress(progress, date), completedAt: at };
  }

  function buildDailyBriefing({
    date,
    activeRecords = [],
    focusRecord = null,
    libraryCandidates = [],
    radarItems = [],
    wishlistRecords = [],
    progress = null,
    sessionMinutes = 0,
    titleKey = (title) => String(title || "").toLocaleLowerCase(),
  } = {}) {
    const briefingDate = date || new Date().toISOString().slice(0, 10);
    const dailyProgress = normalizeDailyBriefingProgress(progress, briefingDate);
    const items = [];
    const used = new Set();
    const completedKeys = new Set(dailyProgress.actions.map((action) => action.key));
    const completedTitles = new Set(dailyProgress.actions.map((action) => titleKey(action.title)));
    const add = (item) => {
      const key = titleKey(item?.title);
      if (!item?.title || !key || used.has(key) || completedTitles.has(key) || completedKeys.has(briefingItemKey(item, titleKey))) return false;
      used.add(key);
      items.push(item);
      return true;
    };

    const activeCandidates = [focusRecord, ...activeRecords]
      .filter(Boolean)
      .filter((record, index, records) => records.findIndex((candidate) => titleKey(candidate.title) === titleKey(record.title)) === index);
    activeCandidates.some((record) => add({
      kind: "continue",
      title: record.title,
      status: record.completionStatus || "playing",
      sessionMinutes: Number(sessionMinutes) || 60,
      sessionCount: Number(record.playProgress?.sessionCount) || 0,
    }));
    activeRecords.forEach((record) => used.add(titleKey(record?.title)));

    const library = libraryCandidates.find((game) => (
      !used.has(titleKey(game?.title))
      && !completedKeys.has(briefingItemKey({ kind: "library", title: game?.title }, titleKey))
    ));
    if (library) {
      add({
        kind: "library",
        title: library.title,
        status: library.userState || "",
        session: library.session || "",
        score: Number(library.score) || 0,
      });
    }

    const radar = radarItems.find((item) => (
      !used.has(titleKey(item?.title))
      && !completedKeys.has(briefingItemKey({ kind: "radar", title: item?.title }, titleKey))
    ));
    if (radar) {
      add({
        kind: "radar",
        title: radar.title,
        releaseDate: radar.releaseDate || "",
        sourceUrl: radar.sourceUrl || "",
        coverUrl: radar.coverUrl || "",
        source: radar.source || "",
        matchCount: radar.evidence?.matchedAtoms?.length || 0,
        sourceItem: radar,
      });
    }

    const wishlist = wishlistRecords.find((record) => (
      !used.has(titleKey(record?.game?.title))
      && !completedKeys.has(briefingItemKey({ kind: "wishlist", title: record?.game?.title }, titleKey))
    ));
    if (wishlist?.game) {
      add({
        kind: "wishlist",
        title: wishlist.game.title,
        decisionTone: wishlist.briefingDecision?.tone || "",
        decisionLabel: wishlist.briefingDecision?.label || "",
        decisionDetail: wishlist.briefingDecision?.detail || "",
        decisionEvidence: wishlist.briefingDecision?.evidence || null,
      });
    }

    return {
      date: briefingDate,
      activeCount: activeRecords.length,
      itemCount: dailyProgress.completedAt ? 0 : items.length,
      primaryKind: items[0]?.kind || "empty",
      items: dailyProgress.completedAt ? [] : items,
      completedCount: dailyProgress.actions.length,
      completedAt: dailyProgress.completedAt,
      receipt: dailyProgress.actions,
      progress: dailyProgress,
    };
  }

  window.PlaySputnikBriefing = {
    DAILY_ACTION_LIMIT,
    normalizeDailyBriefingProgress,
    briefingItemKey,
    recordBriefingAction,
    finishDailyBriefing,
    buildDailyBriefing,
  };
})();
