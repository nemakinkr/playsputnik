/* PlaySputnik Radar Module — notebook parsing helpers, taste radar scoring, monthly drop ranking, source health */
"use strict";
(function () {
  if (!window.PlaySputnikConfig) throw new Error("app-config must load before app-radar");
  if (!window.PlaySputnikSearch) throw new Error("app-search must load before app-radar");
  if (!window.PlaySputnikScore) throw new Error("app-score must load before app-radar");

  function createRadarTools({
    getState,
    getSelectedAtoms,
    getSourceGames,
    getSourceStatus,
    tasteRadar,
    monthlyDrop,
    // from search module
    normalizeTitle,
    titleMatches,
    titleIncludes,
    // from score module
    gameSignals,
    combinedTasteWeight,
  }) {
    function stripNotebookMarker(line) {
      return line
        .replace(/[❤️]/g, "")
        .replace(/[♻➕✅]/g, "")
        .replace(/^[0-9]️?⃣/g, "")
        .replace(/^[0-9]️?⃣/g, "")
        .trim();
    }

    function notebookSection(line) {
      const normalized = line.toLowerCase().replace(/[_\s]+/g, " ");
      if (normalized.includes("доступ")) return "access";
      if (normalized.includes("цен")) return "prices";
      if (normalized.includes("пройд")) return "completed";
      if (normalized.includes("рейтинг")) return "ranked";
      if (normalized.includes("жд") || normalized.includes("2026")) return "upcoming";
      return "";
    }

    function parseRatingLine(line) {
      const match = line.trim().match(/^(.*?)[\s,:-]+(\d+(?:\.\d+)?)\s*(?:\/\s*(5|10))?$/);
      if (!match) return null;
      const rawRating = Number(match[2]);
      const divisor = match[3] ? Number(match[3]) : rawRating <= 5 ? 5 : 10;
      const rating = Math.max(0, Math.min(10, (rawRating / divisor) * 10));
      return { title: match[1].trim(), rating };
    }

    function stripRankingMarker(line) {
      return stripNotebookMarker(line)
        .replace(/^(?:[0-9]\uFE0F?\u20E3)+\s*/u, "")
        .replace(/^\d+[.)]\s*/, "")
        .trim();
    }

    function parseRankedTasteLines(textOrLines) {
      const lines = Array.isArray(textOrLines)
        ? textOrLines
        : String(textOrLines || "").split(/\n|\\n/);
      const entries = [];
      const looksLikeExplicitRating = (line) => {
        if (/\/\s*(?:5|10)\s*$/i.test(line)) return true;
        const match = line.match(/[,:-]\s*(\d+(?:\.\d+)?)\s*$/i);
        return match ? Number(match[1]) <= 10 : false;
      };
      lines
        .map((line) => String(line || "").trim())
        .filter(Boolean)
        .forEach((line) => {
          if (notebookSection(line) || /^_+$/.test(line)) return;
          if (looksLikeExplicitRating(line)) return;
          const title = stripRankingMarker(line);
          if (!title || title.length < 2 || title.length > 120) return;
          entries.push({ title, rank: entries.length + 1 });
        });
      return entries;
    }

    function findRatedGame(rawTitle) {
      const needle = normalizeTitle(rawTitle);
      return getSourceGames().find((game) => titleMatches(game.title, rawTitle))
        || getSourceGames().find((game) => titleIncludes(game.title, needle));
    }

    function importedTasteScore(game) {
      const state = getState();
      const raw = gameSignals(game).reduce((sum, signal) => sum + (state.atomWeights[signal] || 0), 0);
      return Math.max(-30, Math.min(45, Math.round(raw * 3)));
    }

    function radarScore(item) {
      const state = getState();
      const atoms = getSelectedAtoms();
      const atomScore = (item.atoms || []).reduce((sum, atom) => sum + (atoms.includes(atom) ? 16 : 0), 0);
      const importedScore = (item.atoms || []).reduce((sum, atom) => sum + Math.max(combinedTasteWeight(atom), 0), 0) * 3;
      const timeScore = item.adultTimeFit === "weeknight" && state.session === "short" ? 12 : item.adultTimeFit === "weekend" ? 6 : 0;
      return Math.round(atomScore + importedScore + timeScore);
    }

    function rankedRadar() {
      return tasteRadar
        .map((item) => ({ ...item, score: radarScore(item) }))
        .sort((a, b) => b.score - a.score);
    }

    function dropScore(item) {
      const atoms = getSelectedAtoms();
      const atomScore = (item.atoms || []).reduce((sum, atom) => sum + (atoms.includes(atom) ? 14 : 0), 0);
      const importedScore = (item.atoms || []).reduce((sum, atom) => sum + Math.max(combinedTasteWeight(atom), 0), 0) * 2;
      const fitScore = item.fit === "medium-plus" ? 18 : item.fit === "medium" ? 10 : item.fit === "low-medium" ? 4 : -4;
      const frictionPenalty = (item.friction || []).length * 2;
      return Math.round(atomScore + importedScore + fitScore - frictionPenalty);
    }

    function rankedMonthlyDrop() {
      return monthlyDrop
        .map((item) => ({ ...item, score: dropScore(item) }))
        .sort((a, b) => b.score - a.score);
    }

    function sourceForLayer(layer) {
      const sourceStatus = getSourceStatus();
      return sourceStatus?.sources?.find((source) => source.layer === layer);
    }

    function freshnessLabel(layer) {
      const source = sourceForLayer(layer);
      return source ? `${source.freshnessState} / ${source.confidence}` : "unknown";
    }

    return {
      stripNotebookMarker,
      notebookSection,
      parseRatingLine,
      parseRankedTasteLines,
      findRatedGame,
      importedTasteScore,
      radarScore,
      rankedRadar,
      dropScore,
      rankedMonthlyDrop,
      sourceForLayer,
      freshnessLabel,
    };
  }

  window.PlaySputnikRadar = { createRadarTools };
})();
