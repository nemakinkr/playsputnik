import { readFile, writeFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const requestedTitles = valuesAfter("--title");
const limitArg = valueAfter("--limit") || args.find((arg) => /^\d+$/.test(arg));
const limit = Number(limitArg || 24);
const checkedAt = valueAfter("--checked-at") || "2026-06-02T12:30:00Z";

if (!Number.isFinite(limit) || limit < 1) {
  console.error("Usage: node scripts/promote-catalog-candidates.mjs [--limit 24] [--title EXACT_TITLE] [--dry-run] [--checked-at ISO_DATE]");
  process.exit(1);
}

const [
  games,
  priceSnapshots,
  coverSnapshots,
  catalogBackbone,
  taxonomy,
  sourceStatus,
  titleAliases,
] = await Promise.all([
  readJson("data/games.json"),
  readJson("data/price-snapshots.json"),
  readJson("data/cover-snapshots.json"),
  readJson("data/catalog-backbone.json"),
  readJson("data/taxonomy.json"),
  readJson("data/source-status.json"),
  readJson("data/title-aliases.json"),
]);

const taxonomyAtoms = new Set(taxonomy.axes.atoms || []);
const regions = sourceStatus.regions || ["US", "TR", "UK"];
const currencies = { US: "USD", TR: "TRY", UK: "GBP" };
const candidateRank = {
  ready_for_seed: 0,
  ready_for_atom_review: 1,
  candidate: 2,
  blocked_identity: 9,
  promoted_to_seed: 10,
};

const laneProfiles = {
  cinematic_story: {
    vibe: "Prestige narrative action",
    color: "linear-gradient(135deg, #233044, #d65f46)",
  },
  open_world_rpg: {
    vibe: "Large-world roleplay",
    color: "linear-gradient(135deg, #19302a, #5fb86d)",
  },
  systems_rpg: {
    vibe: "Choice-heavy systems RPG",
    color: "linear-gradient(135deg, #2b2747, #c28bff)",
  },
  action_challenge: {
    vibe: "Demanding action mastery",
    color: "linear-gradient(135deg, #211b1f, #f05454)",
  },
  horror_tension: {
    vibe: "Dark tension and pressure",
    color: "linear-gradient(135deg, #15151c, #8d2f45)",
  },
  cozy_short: {
    vibe: "Low-friction weeknight play",
    color: "linear-gradient(135deg, #1e3440, #71c7b6)",
  },
  co_op_multiplayer: {
    vibe: "Social repeatable play",
    color: "linear-gradient(135deg, #20314a, #4aa8ff)",
  },
  strategy_management: {
    vibe: "Long-form planning loop",
    color: "linear-gradient(135deg, #27332d, #d3b35f)",
  },
  sports_service: {
    vibe: "Competitive service loop",
    color: "linear-gradient(135deg, #24313a, #5ac778)",
  },
  upcoming_watch: {
    vibe: "Radar candidate with timing risk",
    color: "linear-gradient(135deg, #302743, #ff8b61)",
  },
};

const existingGameKeys = new Set(games.map((game) => titleKey(game.title)));
const priceKeys = new Set(priceSnapshots.map((snapshot) => snapshotKey(snapshot.title, snapshot.region)));
const coverKeys = new Set(coverSnapshots.map((record) => titleKey(record.title)));

const candidates = (catalogBackbone.records || [])
  .filter((record) => !existingGameKeys.has(titleKey(record.title)))
  .filter((record) => record.status !== "promoted_to_seed" && record.status !== "blocked_identity")
  .sort((a, b) => (candidateRank[a.status] ?? 5) - (candidateRank[b.status] ?? 5)
    || a.priority - b.priority
    || String(a.title).localeCompare(String(b.title)));

const requestedKeys = requestedTitles.map(titleKey);
const selected = requestedKeys.length ? selectRequestedCandidates(requestedKeys) : candidates.slice(0, limit);

if (selected.length === 0) {
  console.log("No catalog candidates to promote.");
  process.exit(0);
}

const promotedGames = selected.map(makeGameRecord);
const promotedPrices = selected.flatMap(makePriceSnapshots);
const promotedCovers = selected.map(makeCoverSnapshot);
const selectedKeys = new Set(selected.map((record) => titleKey(record.title)));

const nextGames = [...games, ...promotedGames];
const nextPriceSnapshots = [
  ...priceSnapshots,
  ...promotedPrices.filter((snapshot) => !priceKeys.has(snapshotKey(snapshot.title, snapshot.region))),
];
const nextCoverSnapshots = [
  ...coverSnapshots,
  ...promotedCovers.filter((record) => !coverKeys.has(titleKey(record.title))),
];
const nextCatalogBackbone = {
  ...catalogBackbone,
  updatedAt: checkedAt,
  target: {
    ...catalogBackbone.target,
    currentSeed: nextGames.length,
    nextPromotionBatch: selected.length,
    backboneRecords: catalogBackbone.records?.length || 0,
  },
  records: (catalogBackbone.records || []).map((record) => {
    if (!selectedKeys.has(titleKey(record.title))) return record;
    return {
      ...record,
      status: "promoted_to_seed",
      coverStatus: record.coverStatus === "verified" ? "verified" : "fallback",
      atomStatus: "complete",
      promotedAt: checkedAt,
      promotedSource: "promote-catalog-candidates",
    };
  }),
};

if (!dryRun) {
  await Promise.all([
    writeJson("data/games.json", nextGames),
    writeJson("data/price-snapshots.json", nextPriceSnapshots),
    writeJson("data/cover-snapshots.json", nextCoverSnapshots),
    writeJson("data/catalog-backbone.json", nextCatalogBackbone),
  ]);
}

console.log(`${dryRun ? "Would promote" : "Promoted"} ${selected.length} catalog candidates into seed catalog.`);
console.log(selected.map((record) => `- ${record.title} (${record.lane}, ${record.status})`).join("\n"));
console.log(`Seed catalog: ${games.length} -> ${nextGames.length}`);
console.log(`Price snapshots: ${priceSnapshots.length} -> ${nextPriceSnapshots.length}`);
console.log(`Cover snapshots: ${coverSnapshots.length} -> ${nextCoverSnapshots.length}`);

function valueAfter(flag) {
  const index = args.indexOf(flag);
  if (index === -1) return "";
  return args[index + 1] || "";
}

function valuesAfter(flag) {
  const values = [];
  args.forEach((arg, index) => {
    if (arg === flag && args[index + 1]) values.push(args[index + 1]);
  });
  return values;
}

function selectRequestedCandidates(keys) {
  const selectedByKey = new Map(candidates.map((record) => [titleKey(record.title), record]));
  const missing = keys.filter((key) => !selectedByKey.has(key));
  if (missing.length) {
    console.error(`Requested titles are not promotable: ${missing.join(", ")}`);
    process.exit(1);
  }
  return keys.map((key) => selectedByKey.get(key));
}

function readJson(path) {
  return readFile(new URL(path, ROOT), "utf8").then(JSON.parse);
}

function writeJson(path, value) {
  return writeFile(new URL(path, ROOT), `${JSON.stringify(value, null, 2)}\n`);
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

function uniqueAtoms(atoms) {
  const cleaned = (atoms || []).filter((atom) => taxonomyAtoms.has(atom));
  return [...new Set(cleaned)].slice(0, 5);
}

function makeGameRecord(record) {
  const atoms = uniqueAtoms(record.atoms);
  return {
    title: record.title,
    atoms,
    vibe: laneProfiles[record.lane]?.vibe || "Curated catalog candidate",
    session: record.session,
    difficulty: inferDifficulty(record, atoms),
    length: inferLength(record, atoms),
    commitment: record.commitment,
    tone: inferTone(record, atoms),
    content: inferContent(record, atoms),
    reviewBurden: inferReviewBurden(record, atoms),
    adultTimeFit: record.adultTimeFit,
    backlog: false,
    wishlist: record.source === "wishlist_note" || record.priceNeed === "hot" || record.lane === "upcoming_watch",
    color: laneProfiles[record.lane]?.color || "linear-gradient(135deg, #222831, #72a7ff)",
  };
}

function inferDifficulty(record, atoms) {
  if (record.lane === "action_challenge" || atoms.includes("challenge") || atoms.includes("soulslike")) return "high";
  if (record.lane === "cozy_short" || atoms.includes("cozy")) return "low";
  return "normal";
}

function inferLength(record, atoms) {
  if (record.session === "long" || record.commitment === "high" || atoms.includes("long")) return "long";
  if (record.session === "short" || record.commitment === "low" || atoms.includes("short")) return "short";
  return "medium";
}

function inferTone(record, atoms) {
  if (record.lane === "horror_tension" || atoms.includes("horror") || atoms.includes("tension")) return "tense";
  if (record.lane === "cozy_short" || atoms.includes("cozy") || atoms.includes("social")) return "warm";
  if (atoms.includes("funny") || atoms.includes("playful") || record.lane === "sports_service") return "funny";
  if (atoms.includes("strange") || record.lane === "systems_rpg") return "strange";
  if (atoms.includes("slow") || atoms.includes("reading")) return "melancholic";
  return "epic";
}

function inferContent(record, atoms) {
  if (record.lane === "horror_tension" || atoms.includes("horror")) return "horror";
  if (atoms.includes("crime") || atoms.includes("realistic") || atoms.includes("shooter") || atoms.includes("stealth")) return "realistic-violence";
  if (record.lane === "sports_service" || atoms.includes("sports")) return "family-safe";
  if (record.lane === "cozy_short" || atoms.includes("cozy")) return "low-violence";
  if (atoms.includes("action") || atoms.includes("challenge")) return "stylized-violence";
  return "low-violence";
}

function inferReviewBurden(record, atoms) {
  if (record.commitment === "high" || atoms.includes("systems") || atoms.includes("turn-based") || atoms.includes("strategy") || atoms.includes("long")) return "high";
  if (record.status !== "ready_for_seed" || record.commitment === "medium" || atoms.includes("open-world") || atoms.includes("rpg")) return "medium";
  return "low";
}

function makePriceSnapshots(record) {
  return regions.map((region) => {
    const { price, discount } = samplePrice(record, region);
    return {
      title: record.title,
      region,
      price,
      currency: currencies[region] || region,
      discount,
      source: "sample_prices",
      checkedAt,
      freshnessState: "sample",
      confidence: "low",
    };
  });
}

function samplePrice(record, region) {
  const title = normalizeTitle(record.title);
  const freeService = /marvel rivals|fortnite|warframe|rocket league|destiny 2|fall guys|efootball/.test(title);
  if (freeService) return { price: 0, discount: 0 };

  let usPrice = 39.99;
  if (record.lane === "upcoming_watch" || record.priceNeed === "watch_only") usPrice = 69.99;
  if (record.priceNeed === "hot") usPrice = 59.99;
  if (record.priceNeed === "warm") usPrice = 39.99;
  if (record.lane === "cozy_short") usPrice = Math.min(usPrice, 24.99);
  if (record.lane === "sports_service") usPrice = Math.max(usPrice, 49.99);
  if (record.lane === "strategy_management") usPrice = Math.max(usPrice, 29.99);

  const regionalPrice = region === "UK"
    ? usPrice * 0.82
    : region === "TR"
      ? usPrice * 0.68
      : usPrice;
  const discount = record.priceNeed === "hot"
    ? 15
    : record.priceNeed === "warm"
      ? 35
      : record.priceNeed === "watch_only"
        ? 0
        : 20;

  return {
    price: Number(regionalPrice.toFixed(2)),
    discount,
  };
}

function makeCoverSnapshot(record) {
  return {
    title: record.title,
    status: "fallback",
    source: "generated_color_poster",
    sourceUrl: "local://generated-color-poster",
    checkedAt,
    licenseNote: "Generated placeholder; no third-party image cached.",
    url: "",
  };
}
