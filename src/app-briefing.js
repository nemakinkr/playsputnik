/* PlaySputnik Daily Briefing — one compact agenda across product surfaces */
"use strict";
(function () {
  function buildDailyBriefing({
    date,
    activeRecords = [],
    focusRecord = null,
    libraryCandidates = [],
    radarItems = [],
    wishlistRecords = [],
    sessionMinutes = 0,
    titleKey = (title) => String(title || "").toLocaleLowerCase(),
  } = {}) {
    const items = [];
    const used = new Set();
    const add = (item) => {
      const key = titleKey(item?.title);
      if (!item?.title || !key || used.has(key)) return false;
      used.add(key);
      items.push(item);
      return true;
    };

    if (focusRecord) {
      add({
        kind: "continue",
        title: focusRecord.title,
        status: focusRecord.completionStatus || "playing",
        sessionMinutes: Number(sessionMinutes) || 60,
        sessionCount: Number(focusRecord.playProgress?.sessionCount) || 0,
      });
    }
    activeRecords.forEach((record) => used.add(titleKey(record?.title)));

    const library = libraryCandidates.find((game) => !used.has(titleKey(game?.title)));
    if (library) {
      add({
        kind: "library",
        title: library.title,
        status: library.userState || "",
        session: library.session || "",
        score: Number(library.score) || 0,
      });
    }

    const radar = radarItems.find((item) => !used.has(titleKey(item?.title)));
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

    const wishlist = wishlistRecords.find((record) => !used.has(titleKey(record?.game?.title)));
    if (wishlist?.game) {
      add({
        kind: "wishlist",
        title: wishlist.game.title,
        decisionTone: wishlist.briefingDecision?.tone || "",
        decisionLabel: wishlist.briefingDecision?.label || "",
        decisionDetail: wishlist.briefingDecision?.detail || "",
      });
    }

    return {
      date: date || new Date().toISOString().slice(0, 10),
      activeCount: activeRecords.length,
      itemCount: items.length,
      primaryKind: items[0]?.kind || "empty",
      items,
    };
  }

  window.PlaySputnikBriefing = { buildDailyBriefing };
})();
