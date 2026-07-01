(() => {
  const t = window.PlaySputnikI18n.t;
  const SOURCE_KEYS = {
    seed_catalog: "discover.sourceSeed",
    catalog_backbone: "discover.sourceBackbone",
    prototype_external_index: "discover.sourceExternal",
    manual_unverified: "discover.sourceManual",
    rawg_provider_hook: "discover.sourceProvider",
  };

  function localizedSourceLabel(id, fallback = "") {
    return SOURCE_KEYS[id] ? t(SOURCE_KEYS[id]) : fallback || t("discover.sourceProvider");
  }

  function createSearchTools({
    getTitleAliases,
    getSearchSources,
    getSeedGames,
    getCatalogBackboneRecords,
    getGlobalSearchFixtureRecords,
    getProviderSearch,
    getSearchQuery,
    getActiveRegion,
    enrichManualTitle,
  }) {
    function normalizeTitle(title) {
      return String(title || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
        .trim();
    }

    function aliasEntryForTitle(title) {
      const normalized = normalizeTitle(title);
      return (getTitleAliases() || []).find((entry) => {
        const keys = [entry.title, ...(entry.aliases || [])].map(normalizeTitle);
        return keys.includes(normalized);
      });
    }

    // titleKey is pure given the alias table, but each uncached call scans the
    // whole alias list with NFKD normalization — and titleKey sits inside every
    // titleMatches() in every linear catalog scan (456 × ~80 aliases × regex).
    // Memoizing it speeds up search, ranking, dedupe and evidence everywhere.
    // The cache MUST be cleared when title-aliases.json loads (keys computed
    // before the aliases arrive would be stale) — see invalidateTitleKeys().
    const _titleKeyCache = new Map();
    function invalidateTitleKeys() {
      _titleKeyCache.clear();
    }
    function titleKey(title) {
      const raw = String(title || "");
      const cached = _titleKeyCache.get(raw);
      if (cached !== undefined) return cached;
      const entry = aliasEntryForTitle(raw);
      const key = normalizeTitle(entry?.title || raw);
      _titleKeyCache.set(raw, key);
      return key;
    }

    function titleMatches(a, b) {
      if (!a || !b) return false;
      return titleKey(a) === titleKey(b);
    }

    function aliasTermsForTitle(title) {
      const entry = aliasEntryForTitle(title);
      return entry ? [entry.title, ...(entry.aliases || [])] : [title];
    }

    function titleIncludes(a, b) {
      const first = normalizeTitle(a);
      const second = normalizeTitle(b);
      return Boolean(first && second && (first.includes(second) || second.includes(first)));
    }

    function searchSourceById(id) {
      return (getSearchSources() || []).find((source) => source.id === id) || null;
    }

    function knownSeedGame(title) {
      return (getSeedGames() || []).find((game) => titleMatches(game.title, title));
    }

    function searchTextBlob(parts) {
      return normalizeTitle(parts.filter(Boolean).join(" "));
    }

    function searchTokens(value) {
      return normalizeTitle(value)
        .split(" ")
        .filter((token) => token.length >= 2);
    }

    function oneEditApart(a, b) {
      if (a === b) return true;
      if (Math.abs(a.length - b.length) > 1) return false;
      let edits = 0;
      let i = 0;
      let j = 0;
      while (i < a.length && j < b.length) {
        if (a[i] === b[j]) {
          i += 1;
          j += 1;
        } else {
          edits += 1;
          if (edits > 1) return false;
          if (a.length > b.length) i += 1;
          else if (b.length > a.length) j += 1;
          else {
            i += 1;
            j += 1;
          }
        }
      }
      return edits + (a.length - i) + (b.length - j) <= 1;
    }

    function tokenCoverageScore(blob, query) {
      const tokens = searchTokens(query).filter((token) => token.length >= 3);
      if (!tokens.length) return 0;
      const blobTokens = searchTokens(blob);
      const hits = tokens.filter((token) => blobTokens.some((candidate) => (
        candidate === token
        || candidate.startsWith(token)
        || (token.length >= 5 && token.startsWith(candidate))
        || (token.length >= 5 && candidate.length >= 5 && oneEditApart(candidate, token))
      )));
      if (!hits.length) return 0;
      const coverage = hits.length / tokens.length;
      if (coverage === 1) return tokens.length === 1 ? 52 : 62;
      if (coverage >= 0.5) return 42;
      return 0;
    }

    function searchMatch(title, blob, query) {
      const normalizedTitle = titleKey(title);
      const normalizedQuery = titleKey(query);
      const rawQuery = normalizeTitle(query);
      const aliasBlob = searchTextBlob(aliasTermsForTitle(title));
      if (!normalizedQuery) return { score: 0, kind: "none" };
      if (normalizedTitle === normalizedQuery) return { score: 100, kind: "exact" };
      if (rawQuery && aliasTermsForTitle(title).map(normalizeTitle).includes(rawQuery)) return { score: 96, kind: "alias" };
      if (rawQuery && normalizedTitle.startsWith(rawQuery)) return { score: 82, kind: "prefix" };
      if (rawQuery.length >= 3 && normalizedTitle.includes(rawQuery)) return { score: 70, kind: "contains" };
      if (rawQuery.length >= 3 && blob.includes(rawQuery)) return { score: 38, kind: "text" };
      const tokenScore = tokenCoverageScore(`${normalizedTitle} ${aliasBlob} ${blob}`, query);
      return { score: tokenScore, kind: tokenScore ? "token" : "none" };
    }

    function searchScore(title, blob, query) {
      return searchMatch(title, blob, query).score;
    }

    function sourcePriority(result) {
      return {
        seed_catalog: 50,
        rawg_provider_hook: 42,
        prototype_external_index: 36,
        catalog_backbone: 28,
        manual_unverified: 10,
      }[result.sourceId] || 20;
    }

    function confidencePriority(value) {
      return { high: 30, medium: 20, low: 10 }[value] || 0;
    }

    function compareSearchResults(a, b) {
      return b.score - a.score
        || sourcePriority(b) - sourcePriority(a)
        || confidencePriority(b.matchConfidence) - confidencePriority(a.matchConfidence)
        || a.title.localeCompare(b.title);
    }

    function searchResultFromSeed(game, query) {
      const blob = searchTextBlob([game.title, game.vibe, ...(game.atoms || [])]);
      const match = searchMatch(game.title, blob, query);
      if (!match.score) return null;
      return {
        title: game.title,
        sourceId: "seed_catalog",
        sourceLabel: localizedSourceLabel("seed_catalog"),
        catalogStatus: "seed",
        matchConfidence: "high",
        coverStatus: game.coverMeta?.status || "fallback",
        priceStatus: game.priceMeta?.[getActiveRegion()]?.freshnessState || "sample",
        platforms: [],
        atoms: game.atoms || [],
        vibe: game.vibe,
        reason: t("discover.reasonSeed"),
        editionGroup: game.editionGroup || "",
        editionRole: game.editionRole || "",
        editionLabel: game.editionLabel || "",
        editionNote: game.editionNote || "",
        priceCanonicalTitle: game.priceCanonicalTitle || "",
        relatedEditions: game.relatedEditions || [],
        score: match.score,
        matchKind: match.kind,
      };
    }

    function searchResultFromBackbone(record, query) {
      const blob = searchTextBlob([record.title, record.reason, record.lane, ...(record.atoms || []), ...(record.platforms || [])]);
      const match = searchMatch(record.title, blob, query);
      if (!match.score || knownSeedGame(record.title)) return null;
      return {
        title: record.title,
        sourceId: "catalog_backbone",
        sourceLabel: localizedSourceLabel("catalog_backbone"),
        catalogStatus: record.status || "backbone",
        matchConfidence: record.status === "ready_for_seed" ? "medium" : "low",
        coverStatus: record.coverStatus || "missing",
        priceStatus: record.priceNeed === "none" ? "not_needed" : "missing",
        platforms: record.platforms || [],
        atoms: record.atoms || [],
        vibe: record.reason || "Curated backbone candidate.",
        reason: record.reason || t("discover.reasonBackbone"),
        score: match.score - 5,
        matchKind: match.kind,
      };
    }

    function searchResultFromFixture(record, query) {
      const blob = searchTextBlob([record.title, record.vibe, record.reason, ...(record.atoms || []), ...(record.platforms || [])]);
      const match = searchMatch(record.title, blob, query);
      if (!match.score || knownSeedGame(record.title)) return null;
      return {
        title: record.title,
        sourceId: "prototype_external_index",
        sourceLabel: localizedSourceLabel("prototype_external_index"),
        catalogStatus: "external_fixture",
        matchConfidence: record.matchConfidence || "low",
        coverStatus: record.coverStatus || "missing",
        priceStatus: record.priceStatus || "missing",
        provider: record.provider || "prototype_external_index",
        sourceUrl: record.sourceUrl || "",
        platforms: record.platforms || [],
        atoms: record.atoms || [],
        vibe: record.vibe || "External search candidate",
        reason: record.reason || t("discover.reasonExternal"),
        score: match.score - 12,
        matchKind: match.kind,
      };
    }

    function manualSearchResult(query) {
      const typedTitle = query.trim();
      const alias = aliasEntryForTitle(typedTitle);
      const title = alias?.title || typedTitle;
      if (!title || knownSeedGame(title)) return null;
      const enrichment = enrichManualTitle(title);
      return {
        title,
        sourceId: "manual_unverified",
        sourceLabel: localizedSourceLabel("manual_unverified"),
        catalogStatus: "manual_unverified",
        matchConfidence: "low",
        coverStatus: "missing",
        priceStatus: "missing",
        provider: "manual",
        sourceUrl: "local://manual-search",
        platforms: [],
        atoms: [],
        inferredAtoms: enrichment.atoms,
        vibe: enrichment.summary || "Unverified wishlist candidate",
        reason: alias
          ? t("discover.reasonManualAlias")
          : t("discover.reasonManual"),
        score: alias ? 90 : 56,
        matchKind: alias ? "alias_manual" : "manual",
      };
    }

    function searchResultFromProvider(record, query) {
      if (!record?.title || knownSeedGame(record.title)) return null;
      const reconciliation = record.reconciliation || null;
      const match = searchMatch(record.title, searchTextBlob([record.title, record.vibe, record.reason]), query);
      return {
        title: record.title,
        sourceId: record.sourceId || "rawg_provider_hook",
        sourceLabel: localizedSourceLabel(record.sourceId || "rawg_provider_hook", record.sourceLabel),
        catalogStatus: record.catalogStatus || "provider_result",
        matchConfidence: record.matchConfidence || "medium",
        coverStatus: record.coverStatus || (record.coverUrl ? "candidate" : "missing"),
        priceStatus: record.priceStatus || "missing",
        provider: record.provider || "provider",
        sourceUrl: record.sourceUrl || "",
        coverUrl: record.coverUrl || "",
        platforms: Array.isArray(record.platforms) ? record.platforms : [],
        atoms: Array.isArray(record.atoms) ? record.atoms : [],
        vibe: record.vibe || "Provider search candidate",
        reason: record.reason || t("discover.reasonProvider"),
        reconciliation,
        duplicateOf: record.duplicateOf || reconciliation?.duplicateOf || "",
        duplicateSource: record.duplicateSource || reconciliation?.duplicateSource || "",
        canAddToWishlist: record.canAddToWishlist !== false,
        score: typeof record.score === "number" ? record.score : match.score - 8,
        matchKind: record.matchKind || match.kind,
      };
    }

    function providerSearchResultsForQuery(query) {
      const providerSearch = getProviderSearch();
      if (!providerSearch || normalizeTitle(providerSearch.query) !== normalizeTitle(query)) return [];
      return (providerSearch.results || [])
        .map((record) => searchResultFromProvider(record, query))
        .filter(Boolean);
    }

    function globalSearchResults() {
      const query = (getSearchQuery() || "").trim();
      if (query.length < 2) return [];
      const results = [
        ...(getSeedGames() || []).map((game) => searchResultFromSeed(game, query)),
        ...(getCatalogBackboneRecords() || []).map((record) => searchResultFromBackbone(record, query)),
        ...providerSearchResultsForQuery(query),
        ...(getGlobalSearchFixtureRecords() || []).map((record) => searchResultFromFixture(record, query)),
      ].filter(Boolean);
      const byTitle = new Map();
      results
        .sort(compareSearchResults)
        .forEach((result) => {
          const key = titleKey(result.title);
          if (!byTitle.has(key)) byTitle.set(key, result);
        });
      const deduped = [...byTitle.values()];
      const exact = deduped.some((result) => titleMatches(result.title, query));
      const manual = manualSearchResult(query);
      if (manual && !exact) deduped.push(manual);
      return deduped.sort(compareSearchResults).slice(0, 8);
    }

    return {
      normalizeTitle,
      aliasEntryForTitle,
      titleKey,
      invalidateTitleKeys,
      titleMatches,
      aliasTermsForTitle,
      titleIncludes,
      searchSourceById,
      knownSeedGame,
      searchTextBlob,
      searchTokens,
      tokenCoverageScore,
      searchMatch,
      searchScore,
      compareSearchResults,
      searchResultFromSeed,
      searchResultFromBackbone,
      searchResultFromFixture,
      manualSearchResult,
      searchResultFromProvider,
      providerSearchResultsForQuery,
      globalSearchResults,
    };
  }

  window.PlaySputnikSearch = { createSearchTools };
})();
