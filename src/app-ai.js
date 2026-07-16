/* PlaySputnik AI Module — locale-aware narrative generation with safe fallback */
"use strict";
(function () {
  if (!window.PlaySputnikConfig) throw new Error("app-config must load before app-ai");

  const providerOrigin = window.__playsputnikAiOrigin
    || window.PlaySputnikConfig.API_ORIGIN
    || `http://127.0.0.1:${window.__playsputnikSearchPort || 4191}`;
  const NARRATIVE_ENDPOINT = `${providerOrigin}/api/narrative`;
  const TASTE_IMPORT_ENDPOINT = `${providerOrigin}/api/taste-import`;
  const RERANK_ENDPOINT = `${providerOrigin}/api/rerank`;
  const HEALTH_ENDPOINT = `${providerOrigin}/api/health`;
  // Only probe the backend when it's actually configured: a deployed Worker
  // (API_MODE "production") or an explicit dev/test override. Otherwise — a plain
  // static/offline open with no backend — skip the health fetch entirely so the
  // browser doesn't log net::ERR_CONNECTION_REFUSED on every detail open.
  const providerConfigured = Boolean(
    window.__playsputnikAiOrigin || window.PlaySputnikConfig.API_MODE === "production",
  );
  const CACHE_SCHEMA = "ai-narrative-v2";
  const IMPORT_SCHEMA = "ai-taste-import-v1";
  const RERANK_SCHEMA = "ai-rerank-v1";
  const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
  const RERANK_MAX_AGE_MS = 24 * 60 * 60 * 1000;

  function createAiTools({
    getState,
    getSourceGames,
    getLocale,
    gameSignals,
    combinedTasteWeight,
    titleKey,
  }) {
    const memoryCache = new Map();
    const inFlight = new Map();
    let availability = { checkedAt: 0, available: false };
    let availabilityFlight = null;

    function stableValue(value) {
      if (Array.isArray(value)) return value.map(stableValue);
      if (!value || typeof value !== "object") return value;
      return Object.fromEntries(
        Object.keys(value).sort().map((key) => [key, stableValue(value[key])]),
      );
    }

    function fingerprint(value) {
      const input = JSON.stringify(stableValue(value));
      let hash = 2166136261;
      for (let index = 0; index < input.length; index += 1) {
        hash ^= input.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return (hash >>> 0).toString(36);
    }

    function topTasteSignals() {
      const state = getState();
      return Object.entries(state.atomWeights || {})
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .slice(0, 6)
        .map(([atom, weight]) => ({
          atom,
          direction: weight > 0 ? "positive" : weight < 0 ? "negative" : "neutral",
          weight: Math.round(weight),
        }));
    }

    function topAtoms() {
      return topTasteSignals()
        .filter((item) => item.weight > 0)
        .slice(0, 5)
        .map((item) => item.atom);
    }

    function tasteContext() {
      const state = getState();
      return {
        topAtoms: topAtoms(),
        tasteSignals: topTasteSignals(),
        likedTitles: [...(state.liked || [])].slice(0, 8),
        importedRatings: (state.importedRatings || [])
          .filter((item) => Number(item.rating) >= 7)
          .slice(0, 8)
          .map((item) => ({ title: item.title, rating: item.rating })),
      };
    }

    function gameFacts(game) {
      const title = typeof game === "string" ? game : game?.title;
      const key = titleKey(title);
      const source = getSourceGames().find((item) => titleKey(item.title) === key)
        || (typeof game === "object" ? game : { title });
      return {
        title: source.title,
        atoms: (source.atoms || []).slice(0, 8),
        vibe: source.vibe || "",
        session: source.session || "",
        length: source.length || "",
        difficulty: source.difficulty || "",
        commitment: source.commitment || "",
        reviewBurden: source.reviewBurden || "",
        criticScore: typeof source.criticScore === "number" ? source.criticScore : null,
        hltbHours: typeof source.hltbHours === "number" ? source.hltbHours : null,
      };
    }

    function localizedAtomList(atoms) {
      return (atoms || []).slice(0, 4).filter(Boolean).join(" / ");
    }

    function localNarrative(kind, game, context = {}) {
      const t = window.PlaySputnikI18n?.t || ((key) => key);
      const facts = gameFacts(game);
      const taste = tasteContext();
      const atoms = localizedAtomList(facts.atoms) || t("narrative.ai.localNoAtoms");
      const likedTitles = taste.importedRatings?.length
        ? taste.importedRatings.slice(0, 3).map((item) => item.title)
        : taste.likedTitles;
      const liked = likedTitles?.length
        ? likedTitles.slice(0, 3).join(", ")
        : t("narrative.ai.localNoLikes");
      const reason = context.personalReason || context.decision || context.evidence || facts.vibe || t("narrative.ai.localReasonFallback", { title: facts.title });
      const risk = context.risk || t("narrative.ai.localRiskFallback");
      if (kind === "companion") {
        if ((taste.importedRatings || []).length >= 8) {
          const rankedKey = (facts.length === "long" || facts.commitment === "high" || facts.hltbHours >= 35)
            ? "narrative.ai.localCompanionRankedLong"
            : (facts.session === "short" || (facts.hltbHours && facts.hltbHours <= 12))
              ? "narrative.ai.localCompanionRankedShort"
              : "narrative.ai.localCompanionRanked";
          return t(rankedKey, {
            title: facts.title,
            atoms,
            reason,
            risk,
            liked,
            count: taste.importedRatings.length,
          });
        }
        return t("narrative.ai.localCompanion", {
          title: facts.title,
          atoms,
          reason,
          risk,
          liked,
        });
      }
      return t("narrative.ai.localDetail", {
        title: facts.title,
        atoms,
        reason,
        risk,
        liked,
      });
    }

    function requestDescriptor(kind, game, context = {}) {
      const locale = getLocale();
      const facts = gameFacts(game);
      const payload = {
        schemaVersion: CACHE_SCHEMA,
        kind,
        locale,
        game: facts,
        taste: tasteContext(),
        context,
      };
      const cacheId = `${kind}:${locale}:${titleKey(facts.title)}`;
      return {
        payload,
        cacheId,
        fingerprint: fingerprint(payload),
      };
    }

    async function postJson(endpoint, payload, timeoutMs = 20000) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }
      return response.json();
    }

    function persistedEntry(cacheId) {
      const entry = getState().aiExplanations?.[cacheId];
      if (!entry || entry.schemaVersion !== CACHE_SCHEMA) return null;
      const fetchedAt = Date.parse(entry.fetchedAt || "");
      if (Number.isNaN(fetchedAt) || Date.now() - fetchedAt > CACHE_MAX_AGE_MS) return null;
      return entry;
    }

    function cachedNarrative(kind, game, context = {}) {
      const descriptor = requestDescriptor(kind, game, context);
      const memory = memoryCache.get(descriptor.cacheId);
      if (memory?.fingerprint === descriptor.fingerprint) return memory.text;
      const persisted = persistedEntry(descriptor.cacheId);
      return persisted?.fingerprint === descriptor.fingerprint ? persisted.text : null;
    }

    async function narrativeAvailable() {
      if (!providerConfigured) return false; // no backend configured — don't hit the network
      if (Date.now() - availability.checkedAt < 5 * 60 * 1000) return availability.available;
      if (location.protocol === "https:" && providerOrigin.startsWith("http://")) {
        availability = { checkedAt: Date.now(), available: false };
        return false;
      }
      if (availabilityFlight) return availabilityFlight;
      availabilityFlight = (async () => {
        try {
          const response = await fetch(HEALTH_ENDPOINT, {
            signal: AbortSignal.timeout(1500),
            cache: "no-store",
          });
          const health = response.ok ? await response.json() : {};
          availability = { checkedAt: Date.now(), available: Boolean(health.aiConfigured) };
        } catch {
          availability = { checkedAt: Date.now(), available: false };
        }
        return availability.available;
      })().finally(() => {
        availabilityFlight = null;
      });
      return availabilityFlight;
    }

    async function fetchNarrative(kind, game, context = {}) {
      const descriptor = requestDescriptor(kind, game, context);
      const cached = cachedNarrative(kind, game, context);
      if (cached) return cached;

      const flightKey = `${descriptor.cacheId}:${descriptor.fingerprint}`;
      if (inFlight.has(flightKey)) return inFlight.get(flightKey);

      const request = (async () => {
        const response = await fetch(NARRATIVE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(descriptor.payload),
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(error.error || `HTTP ${response.status}`);
        }
        const data = await response.json();
        const text = String(data.text || data.explanation || "").trim();
        if (!text) throw new Error("AI provider returned an empty narrative");

        const entry = {
          schemaVersion: CACHE_SCHEMA,
          kind,
          locale: descriptor.payload.locale,
          fingerprint: descriptor.fingerprint,
          text: text.slice(0, 1800),
          fetchedAt: new Date().toISOString(),
        };
        memoryCache.set(descriptor.cacheId, entry);
        const state = getState();
        if (!state.aiExplanations) state.aiExplanations = {};
        state.aiExplanations[descriptor.cacheId] = entry;
        return entry.text;
      })().finally(() => inFlight.delete(flightKey));

      inFlight.set(flightKey, request);
      return request;
    }

    async function parseTasteImport(text) {
      const sourceText = String(text || "").trim();
      if (sourceText.length < 3) throw new Error("Taste import text is empty");
      const data = await postJson(TASTE_IMPORT_ENDPOINT, {
        schemaVersion: IMPORT_SCHEMA,
        locale: getLocale(),
        text: sourceText.slice(0, 20000),
      }, 25000);
      if (data.schemaVersion !== IMPORT_SCHEMA || !Array.isArray(data.entries)) {
        throw new Error("AI provider returned an invalid taste draft");
      }
      const seen = new Set();
      const entries = data.entries.map((entry) => {
        const title = String(entry?.title || "").trim().slice(0, 120);
        const key = titleKey(title);
        if (title.length < 2 || !key || seen.has(key)) return null;
        seen.add(key);
        const rating = Number.isFinite(Number(entry.rating)) ? Math.max(0, Math.min(10, Number(entry.rating))) : null;
        const rank = Number.isInteger(Number(entry.rank)) && Number(entry.rank) > 0 ? Number(entry.rank) : null;
        return {
          title,
          rating,
          rank,
          status: ["completed", "playing", "owned", "wishlist", "dropped"].includes(entry.status) ? entry.status : "unknown",
          sentiment: ["loved", "liked", "mixed", "disliked"].includes(entry.sentiment) ? entry.sentiment : "unknown",
          confidence: ["high", "medium", "low"].includes(entry.confidence) ? entry.confidence : "low",
        };
      }).filter(Boolean).slice(0, 120);
      if (!entries.length) throw new Error("AI provider found no reviewable games");
      return {
        schemaVersion: IMPORT_SCHEMA,
        entries,
        summary: String(data.summary || "").trim().slice(0, 600),
        warnings: (data.warnings || []).map((item) => String(item || "").trim()).filter(Boolean).slice(0, 8),
        provider: data.provider || "",
        model: data.model || "",
      };
    }

    function todayRerankDescriptor(candidates, context = {}) {
      const shortlist = (candidates || []).slice(0, 8).map((game) => ({
        title: game.title,
        score: Math.round(Number(game.score || 0) * 10) / 10,
        atoms: (game.atoms || []).slice(0, 8),
        session: game.session || "",
        length: game.length || "",
        difficulty: game.difficulty || "",
        commitment: game.commitment || "",
        access: context.accessByTitle?.[titleKey(game.title)] || "",
      }));
      const payload = {
        schemaVersion: RERANK_SCHEMA,
        locale: getLocale(),
        taste: tasteContext(),
        context: {
          mood: context.mood || "",
          session: context.session || "",
          sessionMinutes: Number(context.sessionMinutes) || 0,
          difficulty: context.difficulty || "",
        },
        candidates: shortlist,
      };
      return { payload, fingerprint: fingerprint(payload) };
    }

    function cachedTodayRerank(candidates, context = {}) {
      const descriptor = todayRerankDescriptor(candidates, context);
      const entry = getState().aiTodayRerank;
      if (!entry || entry.schemaVersion !== RERANK_SCHEMA || entry.fingerprint !== descriptor.fingerprint) return null;
      const fetchedAt = Date.parse(entry.fetchedAt || "");
      if (Number.isNaN(fetchedAt) || Date.now() - fetchedAt > RERANK_MAX_AGE_MS) return null;
      return entry;
    }

    function applyTodayRerank(candidates, context = {}) {
      const entry = cachedTodayRerank(candidates, context);
      if (!entry) return candidates || [];
      const head = (candidates || []).slice(0, 8);
      const topScore = Number(head[0]?.score || 0);
      const flexible = head.filter((game) => topScore - Number(game.score || 0) <= 12);
      const fixed = head.slice(flexible.length);
      const byKey = new Map(flexible.map((game) => [titleKey(game.title), game]));
      const used = new Set();
      const ordered = (entry.order || []).map((title) => {
        const key = titleKey(title);
        if (!byKey.has(key) || used.has(key)) return null;
        used.add(key);
        return byKey.get(key);
      }).filter(Boolean);
      flexible.forEach((game) => {
        const key = titleKey(game.title);
        if (!used.has(key)) ordered.push(game);
      });
      return [...ordered, ...fixed, ...(candidates || []).slice(8)];
    }

    async function fetchTodayRerank(candidates, context = {}) {
      const cached = cachedTodayRerank(candidates, context);
      if (cached) return cached;
      const descriptor = todayRerankDescriptor(candidates, context);
      if (descriptor.payload.candidates.length < 2) return null;
      const flightKey = `rerank:${descriptor.fingerprint}`;
      if (inFlight.has(flightKey)) return inFlight.get(flightKey);
      const request = (async () => {
        const data = await postJson(RERANK_ENDPOINT, descriptor.payload, 25000);
        if (data.schemaVersion !== RERANK_SCHEMA || !Array.isArray(data.order)) {
          throw new Error("AI provider returned an invalid rerank");
        }
        const allowed = new Map(descriptor.payload.candidates.map((candidate) => [titleKey(candidate.title), candidate.title]));
        const seen = new Set();
        const order = data.order.map((title) => {
          const key = titleKey(title);
          if (!allowed.has(key) || seen.has(key)) return null;
          seen.add(key);
          return allowed.get(key);
        }).filter(Boolean);
        descriptor.payload.candidates.forEach((candidate) => {
          const key = titleKey(candidate.title);
          if (!seen.has(key)) order.push(candidate.title);
        });
        const entry = {
          schemaVersion: RERANK_SCHEMA,
          fingerprint: descriptor.fingerprint,
          order,
          reasons: Array.isArray(data.reasons) ? data.reasons.slice(0, 8) : [],
          summary: String(data.summary || "").trim().slice(0, 600),
          provider: data.provider || "",
          model: data.model || "",
          guardrails: data.guardrails || {},
          fetchedAt: new Date().toISOString(),
        };
        getState().aiTodayRerank = entry;
        return entry;
      })().finally(() => inFlight.delete(flightKey));
      inFlight.set(flightKey, request);
      return request;
    }

    function cachedExplanation(title, context = {}) {
      return cachedNarrative("game_detail", title, context);
    }

    function fetchExplanation(game, context = {}) {
      return fetchNarrative("game_detail", game, context);
    }

    function clearExplanationCache(title) {
      const state = getState();
      const titleToken = title ? `:${titleKey(title)}` : "";
      [...memoryCache.keys()].forEach((key) => {
        if (!titleToken || key.endsWith(titleToken)) memoryCache.delete(key);
      });
      Object.keys(state.aiExplanations || {}).forEach((key) => {
        if (!titleToken || key.endsWith(titleToken)) delete state.aiExplanations[key];
      });
    }

    return {
      cachedNarrative,
      fetchNarrative,
      narrativeAvailable,
      localNarrative,
      cachedExplanation,
      fetchExplanation,
      clearExplanationCache,
      parseTasteImport,
      cachedTodayRerank,
      applyTodayRerank,
      fetchTodayRerank,
      topAtoms,
      topTasteSignals,
      narrativeFingerprint: fingerprint,
    };
  }

  window.PlaySputnikAi = { createAiTools };
})();
