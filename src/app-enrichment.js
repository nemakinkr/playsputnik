(() => {
  const t = window.PlaySputnikI18n.t;
  const STATUS_KEYS = {
    missing: "discover.statusMissing",
    fallback: "discover.statusFallback",
    candidate: "discover.statusCandidate",
    verified: "discover.statusVerified",
    seed: "discover.catalogSeed",
    backbone: "discover.catalogBackbone",
    external_fixture: "discover.catalogExternal",
    manual_unverified: "discover.catalogManual",
    exact: "discover.matchExact",
    alias: "discover.matchAlias",
    alias_manual: "discover.matchAlias",
    prefix: "discover.matchPrefix",
    contains: "discover.matchContains",
    alias_partial: "discover.matchAlias",
    text: "discover.matchText",
    token: "discover.matchToken",
    manual: "discover.matchManual",
    high: "discover.confidenceHigh",
    medium: "discover.confidenceMedium",
    low: "discover.confidenceLow",
    pending: "discover.confidencePending",
  };

  function createEnrichmentTools({
    normalizeTitle,
    titleKey,
    knownSeedGame,
    getTitleEnrichmentRules,
  }) {
    function compactStatus(value) {
      const normalized = String(value || "missing");
      return STATUS_KEYS[normalized] ? t(STATUS_KEYS[normalized]) : normalized.replaceAll("_", " ");
    }

    function countValues(values) {
      return values.reduce((counts, value) => {
        counts[value] = (counts[value] || 0) + 1;
        return counts;
      }, {});
    }

    function topEntries(counts, limit = 4) {
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, limit)
        .map(([label, count]) => ({ label, count }));
    }

    function uniqueCompact(items, limit = 5) {
      return [...new Set((items || []).filter(Boolean))].slice(0, limit);
    }

    function enrichmentRuleForTitle(title) {
      const normalized = normalizeTitle(title);
      if (!normalized) return null;
      return (getTitleEnrichmentRules() || []).find((rule) => (
        rule.terms || []
      ).some((term) => {
        const normalizedTerm = normalizeTitle(term);
        if (normalizedTerm.length <= 2) return normalized === normalizedTerm;
        return normalized.includes(normalizedTerm);
      }));
    }

    function inferredAtomsForTitle(title, explicitAtoms = []) {
      if (explicitAtoms.length) return uniqueCompact(explicitAtoms, 6);
      const rule = enrichmentRuleForTitle(title);
      return uniqueCompact(rule?.atoms || [], 6);
    }

    function confidenceTone(value) {
      const normalized = normalizeTitle(value);
      if (["fresh", "verified", "candidate", "high", "medium", "seed", "source tags", "provider tags"].includes(normalized)) return "good";
      if (["missing", "stale", "low", "manual unverified", "manual", "sample", "pending"].includes(normalized)) return "warn";
      return "neutral";
    }

    function sourcePassportItem(label, value, tone = "") {
      return {
        label,
        value: compactStatus(value || "missing"),
        tone: tone || confidenceTone(value),
      };
    }

    function sourcePassportHtml(items, modifier = "") {
      return `
        <div class="source-passport ${modifier}">
          ${items.map((item) => `
            <span class="source-check tone-${item.tone}">
              <small>${item.label}</small>
              <strong>${item.value}</strong>
            </span>
          `).join("")}
        </div>
      `;
    }

    function missingChecksForItem(item) {
      const checks = [];
      const known = knownSeedGame(item.title);
      const cover = item.coverStatus || item.coverMeta?.status || "";
      const price = item.priceStatus || "";
      const platforms = item.platforms || [];
      const atoms = item.atoms || [];

      if (!platforms.length && !known) checks.push("platforms");
      if (!cover || cover === "missing") checks.push("cover");
      if (!price || price === "missing") checks.push("price");
      if (!atoms.length && !inferredAtomsForTitle(item.title).length) checks.push("atoms");
      if (!known && !(item.psPlus || []).length) checks.push("PS Plus");
      return checks;
    }

    function searchResultSourcePassport(result) {
      return [
        sourcePassportItem(t("narrative.detail.catalog"), result.catalogStatus, result.sourceId === "seed_catalog" ? "good" : confidenceTone(result.catalogStatus)),
        sourcePassportItem(
          t("discover.passportMatch"),
          result.matchKind ? `${compactStatus(result.matchConfidence)} / ${compactStatus(result.matchKind)}` : compactStatus(result.matchConfidence),
        ),
        sourcePassportItem(t("narrative.detail.cover"), result.coverStatus),
        sourcePassportItem(t("narrative.detail.price"), result.priceStatus),
        sourcePassportItem(
          t("discover.passportInference"),
          result.inferenceProfile?.confidence || "pending",
          result.inferenceProfile?.confidence === "medium" ? "good" : "warn",
        ),
        sourcePassportItem(
          t("narrative.detail.platform"),
          result.platforms?.length ? result.platforms.slice(0, 3).join(" / ") : t("discover.statusMissing"),
          result.platforms?.length ? "neutral" : "warn",
        ),
      ];
    }

    function mergeStoreData(catalog, prices, subscriptions, covers = [], history = []) {
      const byTitle = new Map(
        catalog.map((game) => [
          titleKey(game.title),
          {
            ...game,
            prices: { ...(game.prices || {}) },
            discount: { ...(game.discount || {}) },
            priceMeta: {},
            priceHistory: {},
            psPlus: [...(game.psPlus || [])],
            subscriptionMeta: {},
            coverMeta: null,
          },
        ]),
      );

      prices.forEach((snapshot) => {
        const game = byTitle.get(titleKey(snapshot.title));
        if (!game) return;
        game.prices[snapshot.region] = snapshot.price;
        game.discount[snapshot.region] = snapshot.discount || 0;
        game.priceMeta[snapshot.region] = snapshot;
      });

      // price-history: object {title: {region: [{price,discount,checkedAt}]}} or legacy array
      if (Array.isArray(history)) {
        history.forEach((record) => {
          const game = byTitle.get(titleKey(record.title));
          if (!game) return;
          if (!game.priceHistory[record.region]) game.priceHistory[record.region] = [];
          game.priceHistory[record.region].push(record);
        });
      } else {
        Object.entries(history).forEach(([title, regions]) => {
          const game = byTitle.get(titleKey(title));
          if (!game) return;
          Object.entries(regions).forEach(([region, entries]) => {
            game.priceHistory[region] = entries;
          });
        });
      }

      subscriptions.forEach((record) => {
        const game = byTitle.get(titleKey(record.title));
        if (!game) return;
        if (!game.psPlus.includes(record.region)) game.psPlus.push(record.region);
        game.subscriptionMeta[record.region] = record;
      });

      covers.forEach((record) => {
        const game = byTitle.get(titleKey(record.title));
        if (!game) return;
        game.coverMeta = record;
      });

      return catalog.map((game) => byTitle.get(titleKey(game.title)));
    }

    return {
      compactStatus,
      countValues,
      topEntries,
      uniqueCompact,
      enrichmentRuleForTitle,
      inferredAtomsForTitle,
      confidenceTone,
      sourcePassportItem,
      sourcePassportHtml,
      missingChecksForItem,
      searchResultSourcePassport,
      mergeStoreData,
    };
  }

  window.PlaySputnikEnrichment = { createEnrichmentTools };
})();
