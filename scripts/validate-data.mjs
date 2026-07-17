import { readFile, writeFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const games = JSON.parse(await readFile(new URL("data/games.json", ROOT), "utf8"));
const priceSnapshots = JSON.parse(await readFile(new URL("data/price-snapshots.json", ROOT), "utf8"));
const priceHistory = JSON.parse(await readFile(new URL("data/price-history.json", ROOT), "utf8"));
const subscriptionAvailability = JSON.parse(await readFile(new URL("data/subscription-availability.json", ROOT), "utf8"));
const coverSnapshots = JSON.parse(await readFile(new URL("data/cover-snapshots.json", ROOT), "utf8"));
const refreshPolicy = JSON.parse(await readFile(new URL("data/refresh-policy.json", ROOT), "utf8"));
const tasteRadar = JSON.parse(await readFile(new URL("data/taste-radar.json", ROOT), "utf8"));
const monthlyDrop = JSON.parse(await readFile(new URL("data/monthly-drop.json", ROOT), "utf8"));
const dropCalendar = JSON.parse(await readFile(new URL("data/drop-calendar.json", ROOT), "utf8"));
const taxonomy = JSON.parse(await readFile(new URL("data/taxonomy.json", ROOT), "utf8"));
const sourceStatus = JSON.parse(await readFile(new URL("data/source-status.json", ROOT), "utf8"));
const catalogSources = JSON.parse(await readFile(new URL("data/catalog-sources.json", ROOT), "utf8"));
const catalogWorkbench = JSON.parse(await readFile(new URL("data/catalog-workbench.json", ROOT), "utf8"));
const catalogBackbone = JSON.parse(await readFile(new URL("data/catalog-backbone.json", ROOT), "utf8"));
const searchSources = JSON.parse(await readFile(new URL("data/search-sources.json", ROOT), "utf8"));
const globalSearchFixtures = JSON.parse(await readFile(new URL("data/global-search-fixtures.json", ROOT), "utf8"));
const titleAliases = JSON.parse(await readFile(new URL("data/title-aliases.json", ROOT), "utf8"));

const regions = sourceStatus.regions;
const taxonomySets = Object.fromEntries(
  Object.entries(taxonomy.axes).map(([axis, values]) => [axis, new Set(values)]),
);

const requiredFields = [
  "title",
  "atoms",
  "vibe",
  "session",
  "difficulty",
  "length",
];

function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function unique(values) {
  return [...new Set(values)].sort();
}

function latestTimestamp(records) {
  return records
    .map((record) => record?.checkedAt || "")
    .filter(Boolean)
    .sort()
    .at(-1) || "";
}

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
  return titleAliases.find((entry) => {
    const keys = [entry.title, ...(entry.aliases || [])].map(normalizeTitle);
    return keys.includes(normalized);
  });
}

function titleKey(title) {
  const entry = aliasEntryForTitle(title);
  return normalizeTitle(entry?.title || title);
}

function snapshotKey(title, region) {
  return `${titleKey(title)}::${region}`;
}

const knownTitles = new Set(games.map((game) => titleKey(game.title)));
const knownCoverTitles = new Set([
  ...knownTitles,
  ...(catalogBackbone.records || []).map((record) => titleKey(record.title)),
]);
const knownRegions = new Set(regions);
const coverSnapshotStatusValues = new Set(["verified", "candidate", "fallback", "missing", "blocked"]);
const priceIndex = new Map(priceSnapshots.map((snapshot) => [snapshotKey(snapshot.title || "", snapshot.region || ""), snapshot]));
const subscriptionIndex = new Map(
  subscriptionAvailability.map((record) => [snapshotKey(record.title || "", record.region || ""), record]),
);
const coverIndex = new Map(coverSnapshots.map((record) => [titleKey(record.title || ""), record]));

function validateGame(game) {
  const issues = [];
  requiredFields.forEach((field) => {
    if (game[field] === undefined || game[field] === null || game[field] === "") {
      issues.push(`Missing ${field}`);
    }
  });

  if (!Array.isArray(game.atoms) || game.atoms.length === 0) {
    issues.push("Missing atoms");
  } else {
    game.atoms.forEach((atom) => {
      if (!taxonomySets.atoms.has(atom)) issues.push(`Unknown atom: ${atom}`);
    });
  }

  ["session", "difficulty", "intensity", "commitment", "tone", "content", "reviewBurden", "adultTimeFit"].forEach((axis) => {
    if (game[axis] && taxonomySets[axis] && !taxonomySets[axis].has(game[axis])) {
      issues.push(`Unknown ${axis}: ${game[axis]}`);
    }
  });

  regions.forEach((region) => {
    const snapshot = priceIndex.get(snapshotKey(game.title, region));
    if (!snapshot) {
      issues.push(`Missing ${region} price snapshot`);
      return;
    }
    if (typeof snapshot.price !== "number") issues.push(`Missing ${region} price`);
    if (typeof snapshot.discount !== "number") issues.push(`Missing ${region} discount`);
    if (!snapshot.currency) issues.push(`Missing ${region} currency`);
    if (!snapshot.source) issues.push(`Missing ${region} price source`);
    if (!snapshot.checkedAt) issues.push(`Missing ${region} checkedAt`);
  });

  const cover = coverIndex.get(titleKey(game.title));
  if (!cover) {
    issues.push("Missing cover snapshot");
  } else {
    if (!cover.status) issues.push("Missing cover status");
    else if (!coverSnapshotStatusValues.has(cover.status)) issues.push(`Unknown cover status: ${cover.status}`);
    if (!cover.source) issues.push("Missing cover source");
    if (!cover.sourceUrl) issues.push("Missing cover sourceUrl");
    if (!cover.checkedAt) issues.push("Missing cover checkedAt");
    if (!cover.licenseNote) issues.push("Missing cover licenseNote");
  }

  return issues;
}

const issuesByGame = games
  .map((game) => ({ title: game.title || "Untitled", issues: validateGame(game) }))
  .filter((entry) => entry.issues.length > 0);

function issueKind(issue) {
  if (/Missing [A-Z]{2} price( snapshot)?/.test(issue)) return "price_gap";
  if (/Missing [A-Z]{2} (discount|currency|price source|checkedAt)/.test(issue)) return "price_integrity";
  if (/cover/i.test(issue)) return "cover";
  if (/atom|session|difficulty|commitment|tone|content|reviewBurden|adultTimeFit/i.test(issue)) return "metadata";
  return "other";
}

function issueTriageSummary(entries) {
  const flat = entries.flatMap((entry) => entry.issues.map((issue) => ({ title: entry.title, issue, kind: issueKind(issue) })));
  const counts = flat.reduce((acc, item) => {
    acc[item.kind] = (acc[item.kind] || 0) + 1;
    return acc;
  }, {});
  const critical = flat.filter((item) => !["price_gap"].includes(item.kind));
  const fullPriceGapGames = entries.filter((entry) => regions.every((region) => (
    entry.issues.includes(`Missing ${region} price`) || entry.issues.includes(`Missing ${region} price snapshot`)
  )));
  const partialPriceGapGames = entries.filter((entry) => (
    entry.issues.some((issue) => issueKind(issue) === "price_gap")
    && !fullPriceGapGames.some((full) => full.title === entry.title)
  ));
  return {
    mode: critical.length ? "fix_critical_first" : "price_gap_only",
    summary: critical.length
      ? `${critical.length} non-price issues need review before investor demos.`
      : "All current issues are missing regional price records; catalog metadata, covers, and adult signals pass.",
    criticalIssueCount: critical.length,
    priceGapIssueCount: counts.price_gap || 0,
    priceIntegrityIssueCount: counts.price_integrity || 0,
    coverIssueCount: counts.cover || 0,
    metadataIssueCount: counts.metadata || 0,
    otherIssueCount: counts.other || 0,
    affectedGameCount: entries.length,
    fullPriceGapGameCount: fullPriceGapGames.length,
    partialPriceGapGameCount: partialPriceGapGames.length,
    topPriceGapGames: entries
      .filter((entry) => entry.issues.some((issue) => issueKind(issue) === "price_gap"))
      .slice(0, 8)
      .map((entry) => ({
        title: entry.title,
        missingRegions: regions.filter((region) => (
          entry.issues.includes(`Missing ${region} price`) || entry.issues.includes(`Missing ${region} price snapshot`)
        )),
      })),
  };
}

const storeIssues = [
  ...priceSnapshots
    .filter((snapshot) => !knownTitles.has(titleKey(snapshot.title || "")))
    .map((snapshot) => `Orphan price snapshot: ${snapshot.title || "Untitled"}`),
  ...priceSnapshots
    .filter((snapshot) => !knownRegions.has(snapshot.region))
    .map((snapshot) => `Unknown price region: ${snapshot.title || "Untitled"} / ${snapshot.region || "none"}`),
  // price-history format: { title: { region: [{ price, discount, checkedAt }] } }
  ...Object.keys(priceHistory)
    .filter((title) => !knownTitles.has(titleKey(title)))
    .map((title) => `Orphan price history: ${title}`),
  ...Object.entries(priceHistory).flatMap(([title, regions]) =>
    Object.keys(regions)
      .filter((region) => !knownRegions.has(region))
      .map((region) => `Unknown price history region: ${title} / ${region}`)),
  ...Object.entries(priceHistory).flatMap(([title, regions]) =>
    Object.entries(regions).flatMap(([region, entries]) =>
      (Array.isArray(entries) ? entries : [])
        .filter((entry) => typeof entry.price !== "number" || !entry.checkedAt)
        .map(() => `Incomplete price history: ${title} / ${region}`))),
  ...subscriptionAvailability
    .filter((record) => !knownTitles.has(titleKey(record.title || "")))
    .map((record) => `Orphan subscription record: ${record.title || "Untitled"}`),
  ...subscriptionAvailability
    .filter((record) => !knownRegions.has(record.region))
    .map((record) => `Unknown subscription region: ${record.title || "Untitled"} / ${record.region || "none"}`),
  ...subscriptionAvailability
    .filter((record) => !record.tier || !record.source || !record.checkedAt)
    .map((record) => `Incomplete subscription record: ${record.title || "Untitled"} / ${record.region || "none"}`),
  ...coverSnapshots
    .filter((record) => !knownCoverTitles.has(titleKey(record.title || "")))
    .map((record) => `Orphan cover snapshot: ${record.title || "Untitled"}`),
];

const policyIssues = [];
if (!refreshPolicy.mode) policyIssues.push("Missing refresh policy mode");
if (!refreshPolicy.updatedAt) policyIssues.push("Missing refresh policy updatedAt");
if (typeof refreshPolicy.dailySnapshotCap !== "number") policyIssues.push("Missing daily snapshot cap");
if (!refreshPolicy.layers?.prices?.freshHours) policyIssues.push("Missing price freshHours");
if (!refreshPolicy.layers?.prices?.staleHours) policyIssues.push("Missing price staleHours");
if (!refreshPolicy.layers?.subscriptions?.freshHours) policyIssues.push("Missing subscription freshHours");
if (!refreshPolicy.layers?.subscriptions?.staleHours) policyIssues.push("Missing subscription staleHours");
if (!Array.isArray(refreshPolicy.priorityBands) || refreshPolicy.priorityBands.length < 3) {
  policyIssues.push("Refresh policy needs at least three priority bands");
}
["hot", "warm", "cold"].forEach((bandId) => {
  const band = refreshPolicy.priorityBands?.find((item) => item.id === bandId);
  if (!band) {
    policyIssues.push(`Missing ${bandId} priority band`);
  } else if (!band.cadence || !band.description) {
    policyIssues.push(`Incomplete ${bandId} priority band`);
  }
});

const radarIssues = [];
if (!Array.isArray(tasteRadar) || tasteRadar.length === 0) {
  radarIssues.push("Taste radar needs at least one item");
} else {
  tasteRadar.forEach((item) => {
    if (!item.title) radarIssues.push("Taste radar item is missing title");
    if (!item.window) radarIssues.push(`Taste radar item is missing window: ${item.title || "Untitled"}`);
    if (!item.reason) radarIssues.push(`Taste radar item is missing reason: ${item.title || "Untitled"}`);
    if (item.source !== "rawg") radarIssues.push(`Taste radar item needs RAWG source: ${item.title || "Untitled"}`);
    if (!/^https:\/\/rawg\.io\/games\//.test(item.sourceUrl || "")) radarIssues.push(`Taste radar item is missing RAWG sourceUrl: ${item.title || "Untitled"}`);
    if (!item.coverUrl) radarIssues.push(`Taste radar item is missing coverUrl: ${item.title || "Untitled"}`);
    if (!item.releaseDate) radarIssues.push(`Taste radar item is missing releaseDate: ${item.title || "Untitled"}`);
    if (!item.checkedAt) radarIssues.push(`Taste radar item is missing checkedAt: ${item.title || "Untitled"}`);
    if (!item.confidence || !item.releaseConfidence) radarIssues.push(`Taste radar item is missing confidence: ${item.title || "Untitled"}`);
    if (item.source === "sample_future_catalog") radarIssues.push(`Taste radar contains a sample title: ${item.title || "Untitled"}`);
    if (!Array.isArray(item.atoms) || item.atoms.length === 0) {
      radarIssues.push(`Taste radar item is missing atoms: ${item.title || "Untitled"}`);
    } else {
      item.atoms.forEach((atom) => {
        if (!taxonomySets.atoms.has(atom)) radarIssues.push(`Unknown radar atom: ${item.title || "Untitled"} / ${atom}`);
      });
    }
    if (item.tone && taxonomySets.tone && !taxonomySets.tone.has(item.tone)) {
      radarIssues.push(`Unknown radar tone: ${item.title || "Untitled"} / ${item.tone}`);
    }
    if (item.adultTimeFit && taxonomySets.adultTimeFit && !taxonomySets.adultTimeFit.has(item.adultTimeFit)) {
      radarIssues.push(`Unknown radar adultTimeFit: ${item.title || "Untitled"} / ${item.adultTimeFit}`);
    }
  });
}

const dropIssues = [];
if (!Array.isArray(monthlyDrop) || monthlyDrop.length === 0) {
  dropIssues.push("Monthly drop needs at least one item");
} else {
  monthlyDrop.forEach((item) => {
    if (!item.title) dropIssues.push("Monthly drop item is missing title");
    if (!item.verdict) dropIssues.push(`Monthly drop item is missing verdict: ${item.title || "Untitled"}`);
    if (!item.claimDecision) dropIssues.push(`Monthly drop item is missing claimDecision: ${item.title || "Untitled"}`);
    if (!item.installDecision) dropIssues.push(`Monthly drop item is missing installDecision: ${item.title || "Untitled"}`);
    if (!item.playDecision) dropIssues.push(`Monthly drop item is missing playDecision: ${item.title || "Untitled"}`);
    if (!item.nextAction) dropIssues.push(`Monthly drop item is missing nextAction: ${item.title || "Untitled"}`);
    if (!item.trialWindow) dropIssues.push(`Monthly drop item is missing trialWindow: ${item.title || "Untitled"}`);
    if (!item.predictedRank) dropIssues.push(`Monthly drop item is missing predictedRank: ${item.title || "Untitled"}`);
    if (!Array.isArray(item.whyItFits) || item.whyItFits.length === 0) {
      dropIssues.push(`Monthly drop item is missing fit reasons: ${item.title || "Untitled"}`);
    }
    if (!Array.isArray(item.friction) || item.friction.length === 0) {
      dropIssues.push(`Monthly drop item is missing friction reasons: ${item.title || "Untitled"}`);
    }
    if (!Array.isArray(item.atoms) || item.atoms.length === 0) {
      dropIssues.push(`Monthly drop item is missing atoms: ${item.title || "Untitled"}`);
    } else {
      item.atoms.forEach((atom) => {
        if (!taxonomySets.atoms.has(atom)) dropIssues.push(`Unknown monthly drop atom: ${item.title || "Untitled"} / ${atom}`);
      });
    }
  });
}

if (storeIssues.length) {
  issuesByGame.push({ title: "Store data", issues: storeIssues });
}
if (policyIssues.length) {
  issuesByGame.push({ title: "Refresh policy", issues: policyIssues });
}
if (radarIssues.length) {
  issuesByGame.push({ title: "Taste radar", issues: radarIssues });
}
if (dropIssues.length) {
  issuesByGame.push({ title: "Monthly drop", issues: dropIssues });
}

const calendarIssues = [];
if (!dropCalendar.mode) calendarIssues.push("Missing drop calendar mode");
if (!dropCalendar.updatedAt) calendarIssues.push("Missing drop calendar updatedAt");
if (!dropCalendar.lifecycle?.cooldownDays) calendarIssues.push("Missing drop calendar cooldownDays");
if (!dropCalendar.lifecycle?.afterDecision) calendarIssues.push("Missing drop calendar afterDecision rule");
if (!Array.isArray(dropCalendar.drops) || dropCalendar.drops.length < 2) {
  calendarIssues.push("Drop calendar needs at least two monthly checkpoints");
} else {
  dropCalendar.drops.forEach((drop) => {
    if (!drop.id) calendarIssues.push("Drop calendar item is missing id");
    if (!drop.label) calendarIssues.push(`Drop calendar item is missing label: ${drop.id || "Untitled"}`);
    if (!drop.cadence) calendarIssues.push(`Drop calendar item is missing cadence: ${drop.id || "Untitled"}`);
    if (!drop.dataNeed) calendarIssues.push(`Drop calendar item is missing dataNeed: ${drop.id || "Untitled"}`);
    if (!drop.userAction) calendarIssues.push(`Drop calendar item is missing userAction: ${drop.id || "Untitled"}`);
    if (!drop.sourceStatus) calendarIssues.push(`Drop calendar item is missing sourceStatus: ${drop.id || "Untitled"}`);
  });
}

if (calendarIssues.length) {
  issuesByGame.push({ title: "Drop calendar", issues: calendarIssues });
}

const catalogSourceIssues = [];
if (!catalogSources.mode) catalogSourceIssues.push("Missing catalog source mode");
if (!catalogSources.updatedAt) catalogSourceIssues.push("Missing catalog source updatedAt");
if (!catalogSources.targetCatalog?.seed) catalogSourceIssues.push("Missing seed catalog target");
if (!catalogSources.targetCatalog?.privateAlpha) catalogSourceIssues.push("Missing private alpha catalog target");
if (!Array.isArray(catalogSources.catalogTiers) || catalogSources.catalogTiers.length < 3) {
  catalogSourceIssues.push("Catalog source plan needs at least three tiers");
} else {
  catalogSources.catalogTiers.forEach((tier) => {
    if (!tier.id) catalogSourceIssues.push("Catalog tier is missing id");
    if (typeof tier.sizeTarget !== "number") catalogSourceIssues.push(`Catalog tier is missing sizeTarget: ${tier.id || "Untitled"}`);
    if (!tier.refreshCadence) catalogSourceIssues.push(`Catalog tier is missing refreshCadence: ${tier.id || "Untitled"}`);
    if (!tier.purpose) catalogSourceIssues.push(`Catalog tier is missing purpose: ${tier.id || "Untitled"}`);
  });
}
if (!Array.isArray(catalogSources.providers) || catalogSources.providers.length < 4) {
  catalogSourceIssues.push("Catalog source plan needs at least four provider options");
} else {
  catalogSources.providers.forEach((provider) => {
    if (!provider.id) catalogSourceIssues.push("Catalog provider is missing id");
    if (!provider.layer) catalogSourceIssues.push(`Catalog provider is missing layer: ${provider.id || "Untitled"}`);
    if (!provider.fit) catalogSourceIssues.push(`Catalog provider is missing fit: ${provider.id || "Untitled"}`);
    if (!provider.commercialUse) catalogSourceIssues.push(`Catalog provider is missing commercialUse: ${provider.id || "Untitled"}`);
    if (!provider.coverUse) catalogSourceIssues.push(`Catalog provider is missing coverUse: ${provider.id || "Untitled"}`);
  });
}
const requiredCoverFields = new Set(catalogSources.coverPolicy?.requiredFields || []);
["url", "source", "sourceUrl", "licenseNote", "checkedAt"].forEach((field) => {
  if (!requiredCoverFields.has(field)) catalogSourceIssues.push(`Cover policy missing required field: ${field}`);
});
if (!Array.isArray(catalogSources.trustRules) || catalogSources.trustRules.length < 3) {
  catalogSourceIssues.push("Catalog source plan needs trust rules");
}

if (catalogSourceIssues.length) {
  issuesByGame.push({ title: "Catalog sources", issues: catalogSourceIssues });
}

const titleAliasIssues = [];
const aliasKeys = new Map();
if (!Array.isArray(titleAliases)) {
  titleAliasIssues.push("Title aliases must be an array");
} else {
  titleAliases.forEach((entry) => {
    if (!entry.title) titleAliasIssues.push("Title alias entry is missing title");
    if (!Array.isArray(entry.aliases) || entry.aliases.length === 0) {
      titleAliasIssues.push(`Title alias entry needs aliases: ${entry.title || "Untitled"}`);
    }
    [entry.title, ...(entry.aliases || [])].forEach((value) => {
      const key = normalizeTitle(value);
      if (!key) {
        titleAliasIssues.push(`Empty alias key: ${entry.title || "Untitled"}`);
        return;
      }
      const owner = aliasKeys.get(key);
      if (owner && owner !== entry.title) {
        titleAliasIssues.push(`Alias collision: ${value} maps to both ${owner} and ${entry.title}`);
      }
      aliasKeys.set(key, entry.title);
    });
  });
}

if (titleAliasIssues.length) {
  issuesByGame.push({ title: "Title aliases", issues: titleAliasIssues });
}

const catalogWorkbenchIssues = [];
const matchConfidenceValues = new Set(["high", "medium", "low"]);
const coverStatusValues = new Set(["verified", "candidate", "missing", "blocked"]);
const atomStatusValues = new Set(["complete", "needs_review", "missing"]);
const intentValues = new Set(["hot", "warm", "cold"]);
const priceNeedValues = new Set(["hot", "warm", "watch_only", "none"]);
if (!catalogWorkbench.mode) catalogWorkbenchIssues.push("Missing catalog workbench mode");
if (!catalogWorkbench.updatedAt) catalogWorkbenchIssues.push("Missing catalog workbench updatedAt");
if (!Array.isArray(catalogWorkbench.records) || catalogWorkbench.records.length === 0) {
  catalogWorkbenchIssues.push("Catalog workbench needs at least one record");
} else {
  catalogWorkbench.records.forEach((record) => {
    if (!record.title) catalogWorkbenchIssues.push("Catalog workbench record is missing title");
    if (!record.source) catalogWorkbenchIssues.push(`Catalog workbench record is missing source: ${record.title || "Untitled"}`);
    if (!matchConfidenceValues.has(record.matchConfidence)) {
      catalogWorkbenchIssues.push(`Unknown match confidence: ${record.title || "Untitled"} / ${record.matchConfidence || "none"}`);
    }
    if (!coverStatusValues.has(record.coverStatus)) {
      catalogWorkbenchIssues.push(`Unknown cover status: ${record.title || "Untitled"} / ${record.coverStatus || "none"}`);
    }
    if (!record.coverSource) catalogWorkbenchIssues.push(`Catalog workbench record is missing coverSource: ${record.title || "Untitled"}`);
    if (!atomStatusValues.has(record.atomStatus)) {
      catalogWorkbenchIssues.push(`Unknown atom status: ${record.title || "Untitled"} / ${record.atomStatus || "none"}`);
    }
    if (!intentValues.has(record.intent)) {
      catalogWorkbenchIssues.push(`Unknown catalog intent: ${record.title || "Untitled"} / ${record.intent || "none"}`);
    }
    if (!priceNeedValues.has(record.priceNeed)) {
      catalogWorkbenchIssues.push(`Unknown price need: ${record.title || "Untitled"} / ${record.priceNeed || "none"}`);
    }
    if (!Array.isArray(record.manualReview)) {
      catalogWorkbenchIssues.push(`Catalog workbench record needs manualReview array: ${record.title || "Untitled"}`);
    }
    if (!Array.isArray(record.atoms) || record.atoms.length === 0) {
      catalogWorkbenchIssues.push(`Catalog workbench record is missing atoms: ${record.title || "Untitled"}`);
    } else {
      record.atoms.forEach((atom) => {
        if (!taxonomySets.atoms.has(atom)) catalogWorkbenchIssues.push(`Unknown catalog workbench atom: ${record.title || "Untitled"} / ${atom}`);
      });
    }
  });
}

if (catalogWorkbenchIssues.length) {
  issuesByGame.push({ title: "Catalog workbench", issues: catalogWorkbenchIssues });
}

const catalogBackboneIssues = [];
const backboneStatusValues = new Set(["candidate", "ready_for_atom_review", "ready_for_seed", "promoted_to_seed", "blocked_identity"]);
const backboneCoverStatusValues = new Set(["missing", "candidate", "verified", "fallback"]);
const backboneAtomStatusValues = new Set(["draft", "needs_review", "complete"]);
const backbonePriceNeedValues = new Set(["none", "watch_only", "warm", "hot"]);
const backboneLanes = new Set((catalogBackbone.lanes || []).map((lane) => lane.id));
const backboneRecords = catalogBackbone.records || [];

if (!catalogBackbone.mode) catalogBackboneIssues.push("Missing catalog backbone mode");
if (!catalogBackbone.updatedAt) catalogBackboneIssues.push("Missing catalog backbone updatedAt");
if (!catalogBackbone.target?.seedTarget) catalogBackboneIssues.push("Missing catalog backbone seed target");
if (catalogBackbone.target?.backboneRecords !== backboneRecords.length) {
  catalogBackboneIssues.push(`Catalog backbone target count mismatch: ${catalogBackbone.target?.backboneRecords || "none"} / ${backboneRecords.length}`);
}
if (!Array.isArray(catalogBackbone.lanes) || catalogBackbone.lanes.length < 8) {
  catalogBackboneIssues.push("Catalog backbone needs at least eight lanes");
} else {
  catalogBackbone.lanes.forEach((lane) => {
    if (!lane.id) catalogBackboneIssues.push("Catalog backbone lane is missing id");
    if (!lane.label) catalogBackboneIssues.push(`Catalog backbone lane is missing label: ${lane.id || "Untitled"}`);
    if (typeof lane.target !== "number") catalogBackboneIssues.push(`Catalog backbone lane is missing target: ${lane.id || "Untitled"}`);
    if (!lane.purpose) catalogBackboneIssues.push(`Catalog backbone lane is missing purpose: ${lane.id || "Untitled"}`);
  });
}
if (!Array.isArray(backboneRecords) || backboneRecords.length < 80) {
  catalogBackboneIssues.push("Catalog backbone needs at least 80 records for the first growth queue");
} else {
  const seenBackboneTitles = new Set();
  backboneRecords.forEach((record) => {
    const recordLabel = record.title || "Untitled";
    const key = titleKey(recordLabel);
    if (!record.title) catalogBackboneIssues.push("Catalog backbone record is missing title");
    if (seenBackboneTitles.has(key)) catalogBackboneIssues.push(`Duplicate catalog backbone title: ${recordLabel}`);
    seenBackboneTitles.add(key);
    if (!backboneLanes.has(record.lane)) catalogBackboneIssues.push(`Unknown catalog backbone lane: ${recordLabel} / ${record.lane || "none"}`);
    if (typeof record.priority !== "number") catalogBackboneIssues.push(`Catalog backbone record is missing priority: ${recordLabel}`);
    if (!backboneStatusValues.has(record.status)) catalogBackboneIssues.push(`Unknown catalog backbone status: ${recordLabel} / ${record.status || "none"}`);
    if (!record.source) catalogBackboneIssues.push(`Catalog backbone record is missing source: ${recordLabel}`);
    if (!Array.isArray(record.platforms) || record.platforms.length === 0) catalogBackboneIssues.push(`Catalog backbone record is missing platforms: ${recordLabel}`);
    if (!Array.isArray(record.atoms) || record.atoms.length < 3) {
      catalogBackboneIssues.push(`Catalog backbone record needs at least three atoms: ${recordLabel}`);
    } else {
      record.atoms.forEach((atom) => {
        if (!taxonomySets.atoms.has(atom)) catalogBackboneIssues.push(`Unknown catalog backbone atom: ${recordLabel} / ${atom}`);
      });
    }
    if (!taxonomySets.session.has(record.session)) catalogBackboneIssues.push(`Unknown catalog backbone session: ${recordLabel} / ${record.session || "none"}`);
    if (!taxonomySets.commitment.has(record.commitment)) catalogBackboneIssues.push(`Unknown catalog backbone commitment: ${recordLabel} / ${record.commitment || "none"}`);
    if (!taxonomySets.adultTimeFit.has(record.adultTimeFit)) catalogBackboneIssues.push(`Unknown catalog backbone adultTimeFit: ${recordLabel} / ${record.adultTimeFit || "none"}`);
    if (!backboneCoverStatusValues.has(record.coverStatus)) catalogBackboneIssues.push(`Unknown catalog backbone cover status: ${recordLabel} / ${record.coverStatus || "none"}`);
    if (!backboneAtomStatusValues.has(record.atomStatus)) catalogBackboneIssues.push(`Unknown catalog backbone atom status: ${recordLabel} / ${record.atomStatus || "none"}`);
    if (!backbonePriceNeedValues.has(record.priceNeed)) catalogBackboneIssues.push(`Unknown catalog backbone price need: ${recordLabel} / ${record.priceNeed || "none"}`);
    if (!record.reason) catalogBackboneIssues.push(`Catalog backbone record is missing reason: ${recordLabel}`);
  });
}

if (catalogBackboneIssues.length) {
  issuesByGame.push({ title: "Catalog backbone", issues: catalogBackboneIssues });
}

const searchIssues = [];
const searchSourceTypes = new Set(["local", "local_queue", "fixture", "manual", "future_provider", "provider_endpoint"]);
const searchConfidenceValues = new Set(["high", "medium", "low", "pending"]);
const searchCoverStatusValues = new Set(["missing", "candidate", "verified", "fallback"]);
const searchPriceStatusValues = new Set(["missing", "sample", "fresh", "stale", "not_needed"]);
const searchPriceNeedValues = new Set(["none", "watch_only", "warm", "hot"]);
const searchSourceIds = new Set((searchSources.sources || []).map((source) => source.id));

if (!searchSources.mode) searchIssues.push("Missing search sources mode");
if (!searchSources.updatedAt) searchIssues.push("Missing search sources updatedAt");
if (!Array.isArray(searchSources.sources) || searchSources.sources.length < 4) {
  searchIssues.push("Search sources need at least four source layers");
} else {
  searchSources.sources.forEach((source) => {
    if (!source.id) searchIssues.push("Search source is missing id");
    if (!source.label) searchIssues.push(`Search source is missing label: ${source.id || "Untitled"}`);
    if (!searchSourceTypes.has(source.type)) searchIssues.push(`Unknown search source type: ${source.id || "Untitled"} / ${source.type || "none"}`);
    if (!searchConfidenceValues.has(source.confidence)) searchIssues.push(`Unknown search source confidence: ${source.id || "Untitled"} / ${source.confidence || "none"}`);
    if (typeof source.canAddToWishlist !== "boolean") searchIssues.push(`Search source is missing wishlist flag: ${source.id || "Untitled"}`);
    if (!source.note) searchIssues.push(`Search source is missing note: ${source.id || "Untitled"}`);
    if (source.type === "provider_endpoint" && !source.endpoint) searchIssues.push(`Provider search source is missing endpoint: ${source.id || "Untitled"}`);
  });
}
["seed_catalog", "catalog_backbone", "prototype_external_index", "manual_unverified"].forEach((sourceId) => {
  if (!searchSourceIds.has(sourceId)) searchIssues.push(`Missing required search source: ${sourceId}`);
});

if (!globalSearchFixtures.mode) searchIssues.push("Missing global search fixture mode");
if (!globalSearchFixtures.updatedAt) searchIssues.push("Missing global search fixture updatedAt");
if (!Array.isArray(globalSearchFixtures.records) || globalSearchFixtures.records.length < 10) {
  searchIssues.push("Global search fixtures need at least ten records");
} else {
  const seenSearchTitles = new Set();
  globalSearchFixtures.records.forEach((record) => {
    const label = record.title || "Untitled";
    const key = titleKey(label);
    if (!record.title) searchIssues.push("Global search fixture is missing title");
    if (seenSearchTitles.has(key)) searchIssues.push(`Duplicate global search fixture: ${label}`);
    seenSearchTitles.add(key);
    if (!record.provider) searchIssues.push(`Global search fixture is missing provider: ${label}`);
    if (!record.sourceUrl) searchIssues.push(`Global search fixture is missing sourceUrl: ${label}`);
    if (!Array.isArray(record.platforms)) searchIssues.push(`Global search fixture platforms must be an array: ${label}`);
    if (!Array.isArray(record.atoms) || record.atoms.length < 3) {
      searchIssues.push(`Global search fixture needs at least three atoms: ${label}`);
    } else {
      record.atoms.forEach((atom) => {
        if (!taxonomySets.atoms.has(atom)) searchIssues.push(`Unknown global search fixture atom: ${label} / ${atom}`);
      });
    }
    if (!record.vibe) searchIssues.push(`Global search fixture is missing vibe: ${label}`);
    if (!searchConfidenceValues.has(record.matchConfidence)) searchIssues.push(`Unknown global search match confidence: ${label} / ${record.matchConfidence || "none"}`);
    if (!searchCoverStatusValues.has(record.coverStatus)) searchIssues.push(`Unknown global search cover status: ${label} / ${record.coverStatus || "none"}`);
    if (!searchPriceStatusValues.has(record.priceStatus)) searchIssues.push(`Unknown global search price status: ${label} / ${record.priceStatus || "none"}`);
    if (!searchPriceNeedValues.has(record.priceNeed)) searchIssues.push(`Unknown global search price need: ${label} / ${record.priceNeed || "none"}`);
    if (!record.reason) searchIssues.push(`Global search fixture is missing reason: ${label}`);
  });
}

if (searchIssues.length) {
  issuesByGame.push({ title: "Global search", issues: searchIssues });
}

const regionCoverage = Object.fromEntries(
  regions.map((region) => {
    const priceCount = games.filter((game) => typeof priceIndex.get(snapshotKey(game.title, region))?.price === "number").length;
    const discountCount = games.filter((game) => typeof priceIndex.get(snapshotKey(game.title, region))?.discount === "number").length;
    const psPlusCount = games.filter((game) => subscriptionIndex.has(snapshotKey(game.title, region))).length;
    return [
      region,
      {
        priceCount,
        discountCount,
        psPlusCount,
        priceCoverage: percent(priceCount, games.length),
        discountCoverage: percent(discountCount, games.length),
      },
    ];
  }),
);

const atomCoverage = Object.fromEntries(
  unique(games.flatMap((game) => game.atoms || [])).map((atom) => [
    atom,
    games.filter((game) => game.atoms?.includes(atom)).length,
  ]),
);

const adultSignals = {
  commitment: percent(games.filter((game) => game.commitment).length, games.length),
  tone: percent(games.filter((game) => game.tone).length, games.length),
  content: percent(games.filter((game) => game.content).length, games.length),
  reviewBurden: percent(games.filter((game) => game.reviewBurden).length, games.length),
  adultTimeFit: percent(games.filter((game) => game.adultTimeFit).length, games.length),
};

const coverCoverage = {
  coverCount: games.filter((game) => coverIndex.has(titleKey(game.title))).length,
  coverage: percent(games.filter((game) => coverIndex.has(titleKey(game.title))).length, games.length),
  realImageCount: coverSnapshots.filter((record) => Boolean(record.url)).length,
  fallbackCount: coverSnapshots.filter((record) => record.status === "fallback").length,
  candidateCount: coverSnapshots.filter((record) => record.status === "candidate").length,
  verifiedCount: coverSnapshots.filter((record) => record.status === "verified").length,
};

const refreshDigest = {
  generatedAt: new Date().toISOString(),
  priceSnapshotCount: priceSnapshots.length,
  subscriptionRecordCount: subscriptionAvailability.length,
  latestPriceCheckedAt: latestTimestamp(priceSnapshots),
  latestSubscriptionCheckedAt: latestTimestamp(subscriptionAvailability),
  priceSourceCount: unique(priceSnapshots.map((snapshot) => snapshot.source).filter(Boolean)).length,
  subscriptionSourceCount: unique(subscriptionAvailability.map((record) => record.source).filter(Boolean)).length,
  regionCount: regions.length,
  regions: regions.map((region) => ({
    region,
    priceCount: priceSnapshots.filter((snapshot) => snapshot.region === region).length,
    discountCount: priceSnapshots.filter((snapshot) => snapshot.region === region && Number(snapshot.discount || 0) > 0).length,
    subscriptionCount: subscriptionAvailability.filter((record) => record.region === region).length,
    latestPriceCheckedAt: latestTimestamp(priceSnapshots.filter((snapshot) => snapshot.region === region)),
    latestSubscriptionCheckedAt: latestTimestamp(subscriptionAvailability.filter((record) => record.region === region)),
  })),
};

const health = {
  generatedAt: new Date().toISOString(),
  mode: sourceStatus.mode,
  gameCount: games.length,
  regions,
  status: issuesByGame.length ? "needs_attention" : "pass",
  companionLayers: {
    tasteRadarCount: tasteRadar.length,
    monthlyDropCount: monthlyDrop.length,
    dropCalendarCount: dropCalendar.drops?.length || 0,
    catalogProviderCount: catalogSources.providers?.length || 0,
    catalogTierCount: catalogSources.catalogTiers?.length || 0,
    catalogWorkbenchCount: catalogWorkbench.records?.length || 0,
    catalogBackboneCount: backboneRecords.length,
    catalogBackboneReadyCount: backboneRecords.filter((record) => record.status === "ready_for_seed").length,
    catalogBackbonePromotedCount: backboneRecords.filter((record) => record.status === "promoted_to_seed").length,
    searchSourceCount: searchSources.sources?.length || 0,
    globalSearchFixtureCount: globalSearchFixtures.records?.length || 0,
    titleAliasCount: Array.isArray(titleAliases) ? titleAliases.reduce((sum, entry) => sum + (entry.aliases?.length || 0), 0) : 0,
    priceHistoryCount: Object.values(priceHistory).reduce(
      (sum, regions) => sum + Object.values(regions).reduce((s, entries) => s + (Array.isArray(entries) ? entries.length : 0), 0),
      0,
    ),
    priceHistoryGameCount: unique(Object.keys(priceHistory).map((title) => titleKey(title))).length,
    libraryStates: ["later", "saved", "owned", "subscription", "playing", "completed", "hidden"],
  },
  catalogPlan: {
    mode: catalogSources.mode,
    targetCatalog: catalogSources.targetCatalog,
    providers: (catalogSources.providers || []).map((provider) => ({
      id: provider.id,
      layer: provider.layer,
      fit: provider.fit,
    })),
  },
  catalogWorkbench: {
    mode: catalogWorkbench.mode,
    recordCount: catalogWorkbench.records?.length || 0,
    highConfidenceCount: (catalogWorkbench.records || []).filter((record) => record.matchConfidence === "high").length,
    coverReadyCount: (catalogWorkbench.records || []).filter((record) => record.coverStatus === "verified" || record.coverStatus === "candidate").length,
    atomReadyCount: (catalogWorkbench.records || []).filter((record) => record.atomStatus === "complete").length,
    manualReviewCount: (catalogWorkbench.records || []).filter((record) => (record.manualReview || []).length > 0).length,
    hotPriceNeedCount: (catalogWorkbench.records || []).filter((record) => record.priceNeed === "hot").length,
  },
  catalogBackbone: {
    mode: catalogBackbone.mode,
    recordCount: backboneRecords.length,
    laneCount: catalogBackbone.lanes?.length || 0,
    seedTarget: catalogBackbone.target?.seedTarget || 0,
    currentSeed: catalogBackbone.target?.currentSeed || games.length,
    promotedCount: backboneRecords.filter((record) => record.status === "promoted_to_seed").length,
    readyForSeedCount: backboneRecords.filter((record) => record.status === "ready_for_seed").length,
    atomReviewCount: backboneRecords.filter((record) => record.status === "ready_for_atom_review").length,
    blockedIdentityCount: backboneRecords.filter((record) => record.status === "blocked_identity").length,
    coverMissingCount: backboneRecords.filter((record) => record.coverStatus === "missing").length,
    hotPriceNeedCount: backboneRecords.filter((record) => record.priceNeed === "hot").length,
    laneCounts: (catalogBackbone.lanes || []).map((lane) => ({
      id: lane.id,
      label: lane.label,
      target: lane.target,
      count: backboneRecords.filter((record) => record.lane === lane.id).length,
      promoted: backboneRecords.filter((record) => record.lane === lane.id && record.status === "promoted_to_seed").length,
      ready: backboneRecords.filter((record) => record.lane === lane.id && record.status === "ready_for_seed").length,
    })),
  },
  globalSearch: {
    mode: searchSources.mode,
    sourceCount: searchSources.sources?.length || 0,
    fixtureMode: globalSearchFixtures.mode,
    fixtureCount: globalSearchFixtures.records?.length || 0,
    wishlistCapableSources: (searchSources.sources || []).filter((source) => source.canAddToWishlist).length,
    externalFixtureCount: (globalSearchFixtures.records || []).filter((record) => record.provider === "prototype_external_index").length,
    missingPriceCount: (globalSearchFixtures.records || []).filter((record) => record.priceStatus === "missing").length,
  },
  refreshPolicy: {
    mode: refreshPolicy.mode,
    dailySnapshotCap: refreshPolicy.dailySnapshotCap,
    priorityBands: (refreshPolicy.priorityBands || []).map((band) => ({
      id: band.id,
      label: band.label,
      cadence: band.cadence,
    })),
  },
  refreshDigest,
  regionCoverage,
  coverCoverage,
  adultSignals,
  topAtoms: Object.entries(atomCoverage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([atom, count]) => ({ atom, count })),
  issueCount: issuesByGame.reduce((sum, entry) => sum + entry.issues.length, 0),
  issueTriage: issueTriageSummary(issuesByGame),
  issuesByGame,
};

await writeFile(new URL("data/data-health.json", ROOT), `${JSON.stringify(health, null, 2)}\n`);
console.log(`Data health: ${health.status}. ${health.gameCount} games, ${health.issueCount} issues.`);
