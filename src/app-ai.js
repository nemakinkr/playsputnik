/* PlaySputnik AI Module — LLM-powered taste explanations via local provider proxy */
"use strict";
(function () {
  if (!window.PlaySputnikConfig) throw new Error("app-config must load before app-ai");

  const EXPLAIN_ENDPOINT = `http://127.0.0.1:${
    window.__playsputnikSearchPort || 4191
  }/api/explain`;

  function createAiTools({ getState, getSourceGames, gameSignals, combinedTasteWeight, titleKey }) {
    // Cache: titleKey → { explanation, fetchedAt }
    const _cache = {};

    function cachedExplanation(title) {
      const state = getState();
      const key = titleKey(title);
      // Check in-memory cache first (session)
      if (_cache[key]) return _cache[key].explanation;
      // Check persisted state cache
      return state.aiExplanations?.[key]?.explanation || null;
    }

    function topTasteSignals() {
      const state = getState();
      return Object.entries(state.atomWeights || {})
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .slice(0, 6)
        .map(([atom, w]) => `${atom} (${w > 0 ? "+" : ""}${Math.round(w)})`);
    }

    function topAtoms() {
      const state = getState();
      return Object.entries(state.atomWeights || {})
        .filter(([, w]) => w > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([atom]) => atom);
    }

    async function fetchExplanation(game) {
      const title = typeof game === "string" ? game : game.title;
      const key = titleKey(title);

      // Return cached result
      if (_cache[key]) return _cache[key].explanation;

      const src = getSourceGames().find((g) => titleKey(g.title) === key) || game;
      const payload = {
        game: { title: src.title, atoms: src.atoms, criticScore: src.criticScore, hltbHours: src.hltbHours },
        topAtoms: topAtoms(),
        tasteSignals: topTasteSignals(),
      };

      const resp = await fetch(EXPLAIN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: resp.statusText }));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }

      const { explanation } = await resp.json();
      _cache[key] = { explanation, fetchedAt: Date.now() };

      // Persist to state for cross-session cache
      const state = getState();
      if (!state.aiExplanations) state.aiExplanations = {};
      state.aiExplanations[key] = { explanation, fetchedAt: new Date().toISOString() };

      return explanation;
    }

    function clearExplanationCache(title) {
      if (title) {
        delete _cache[titleKey(title)];
      } else {
        Object.keys(_cache).forEach((k) => delete _cache[k]);
      }
    }

    return {
      cachedExplanation,
      fetchExplanation,
      clearExplanationCache,
      topAtoms,
      topTasteSignals,
    };
  }

  window.PlaySputnikAi = { createAiTools };
})();
