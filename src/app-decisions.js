/* PlaySputnik Decisions Module — comparison selection and rate-later queue state */
"use strict";
(function () {
  function createDecisionTools({
    getState,
    titleKey,
    titleMatches,
    personalRatingForecast,
    recordUserEvent,
  }) {
    function comparisonState() {
      const state = getState();
      state.comparisonGames ||= { first: "", second: "" };
      return state.comparisonGames;
    }

    function ratingQueue() {
      const state = getState();
      state.ratingQueue ||= {};
      return state.ratingQueue;
    }

    function selectedDecisionTitles() {
      const comparison = comparisonState();
      return new Set([
        ...Object.keys(ratingQueue()),
        titleKey(comparison.first),
        titleKey(comparison.second),
      ].filter(Boolean));
    }

    function selectTitleForComparison(title, detail = {}) {
      if (!title) return;
      const comparison = comparisonState();
      if (!comparison.first || titleMatches(comparison.first, title)) comparison.first = title;
      else comparison.second = title;
      recordUserEvent("comparison_game_selected", title, detail);
    }

    function setComparisonGames(first, second) {
      const state = getState();
      state.comparisonGames = {
        first: String(first || "").trim(),
        second: String(second || "").trim(),
      };
    }

    function swapComparisonGames() {
      const comparison = comparisonState();
      setComparisonGames(comparison.second, comparison.first);
    }

    function isTitleCompared(title) {
      const comparison = comparisonState();
      return [comparison.first, comparison.second].some((value) => titleMatches(value, title));
    }

    function toggleRatingQueueTitle(title, detail = {}) {
      if (!title) return false;
      const queue = ratingQueue();
      const key = titleKey(title);
      if (queue[key]) {
        delete queue[key];
        recordUserEvent("rating_queue_removed", title);
        return false;
      }
      queue[key] = { title, addedAt: new Date().toISOString() };
      recordUserEvent("rating_queue_added", title, detail);
      return true;
    }

    function removeRatingQueueGame(title) {
      const queue = ratingQueue();
      const key = titleKey(title);
      if (!queue[key]) return false;
      delete queue[key];
      recordUserEvent("rating_queue_removed", title);
      return true;
    }

    function isTitleQueued(title) {
      return Boolean(ratingQueue()[titleKey(title)]);
    }

    function comparisonGameByTitle(title, ranked) {
      const query = String(title || "").trim();
      if (!query) return null;
      return ranked.find((game) => titleMatches(game.title, query))
        || ranked.find((game) => game.title.toLowerCase().includes(query.toLowerCase()))
        || null;
    }

    function comparisonPair(ranked) {
      const comparison = comparisonState();
      const first = comparisonGameByTitle(comparison.first, ranked);
      const second = comparisonGameByTitle(comparison.second, ranked);
      if (!first || !second || titleMatches(first.title, second.title)) return { first, second, primary: null, alternative: null };
      const primary = (first.score || 0) >= (second.score || 0) ? first : second;
      return { first, second, primary, alternative: primary === first ? second : first };
    }

    function ratingQueueItems(ranked) {
      const rankedByTitle = new Map(ranked.map((game) => [titleKey(game.title), game]));
      return Object.values(ratingQueue())
        .map((record) => ({ record, game: rankedByTitle.get(titleKey(record.title)) }))
        .filter((item) => item.game)
        .sort((a, b) => {
          const aForecast = personalRatingForecast(a.game);
          const bForecast = personalRatingForecast(b.game);
          return (bForecast.rating || 0) - (aForecast.rating || 0)
            || new Date(a.record.addedAt || 0) - new Date(b.record.addedAt || 0);
        });
    }

    return {
      comparisonState,
      selectedDecisionTitles,
      selectTitleForComparison,
      setComparisonGames,
      swapComparisonGames,
      isTitleCompared,
      toggleRatingQueueTitle,
      removeRatingQueueGame,
      isTitleQueued,
      comparisonGameByTitle,
      comparisonPair,
      ratingQueueItems,
    };
  }

  window.PlaySputnikDecisions = { createDecisionTools };
})();
