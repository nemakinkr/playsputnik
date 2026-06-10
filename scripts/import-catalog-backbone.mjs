import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = new URL("../", import.meta.url);

const args = process.argv.slice(2);
const inputPath = args.find((arg) => !arg.startsWith("--"));
const jsonMode = args.includes("--json");
const writeIndex = args.indexOf("--write");
const writePath = writeIndex >= 0 ? args[writeIndex + 1] : "";
const sourceOverrideIndex = args.indexOf("--source");
const sourceOverride = sourceOverrideIndex >= 0 ? args[sourceOverrideIndex + 1] : "";

if (!inputPath) {
  console.log("Usage: node scripts/import-catalog-backbone.mjs <input.txt|input.csv> [--json] [--write output.json] [--source source_id]");
  process.exit(1);
}

const [
  inputText,
  games,
  catalogBackbone,
  taxonomy,
  titleAliases,
] = await Promise.all([
  readFile(resolve(process.cwd(), inputPath), "utf8"),
  readJson("data/games.json"),
  readJson("data/catalog-backbone.json"),
  readJson("data/taxonomy.json"),
  readJson("data/title-aliases.json"),
]);

const taxonomyAtoms = new Set(taxonomy.axes.atoms || []);
const laneIds = new Set((catalogBackbone.lanes || []).map((lane) => lane.id));
const existingTitles = new Map(
  (catalogBackbone.records || []).map((record) => [titleKey(record.title), "catalog_backbone"]),
);
games.forEach((game) => {
  existingTitles.set(titleKey(game.title), "seed_catalog");
});

const validStatus = new Set(["candidate", "ready_for_atom_review", "ready_for_seed", "blocked_identity"]);
const validCoverStatus = new Set(["missing", "candidate", "verified", "fallback"]);
const validAtomStatus = new Set(["draft", "needs_review", "complete"]);
const validPriceNeed = new Set(["none", "watch_only", "warm", "hot"]);
const validSession = new Set(taxonomy.axes.session || []);
const validCommitment = new Set(taxonomy.axes.commitment || []);
const validAdultTimeFit = new Set(taxonomy.axes.adultTimeFit || []);

const laneDefaults = {
  cinematic_story: ["story", "cinematic", "action"],
  open_world_rpg: ["open-world", "story", "action"],
  systems_rpg: ["systems", "choice", "rpg"],
  action_challenge: ["action", "challenge", "systems"],
  horror_tension: ["horror", "story", "tension"],
  cozy_short: ["cozy", "short", "story"],
  co_op_multiplayer: ["co-op", "multiplayer", "systems"],
  strategy_management: ["strategy", "systems", "management"],
  sports_service: ["sports", "competitive", "short"],
  upcoming_watch: ["story", "action", "cinematic"],
};

const titleRules = [
  [/wolverine|first light|james bond|007|mafia|uncharted|detroit|plague tale|indiana jones|spider-man|spider man/, "cinematic_story", ["story", "cinematic", "action"]],
  [/witcher|cyberpunk|red dead|ghost|horizon forbidden|horizon zero|kingdom come|assassin|hogwarts|crimson desert|outer worlds/, "open_world_rpg", ["open-world", "story", "action"]],
  [/baldur|divinity|persona|dragon age|yakuza|diablo|octopath|wasteland|clair obscur|expedition 33|fable|pathologic/, "systems_rpg", ["choice", "systems", "rpg"]],
  [/elden|sekiro|bloodborne|returnal|doom|sifu|armored core|dead cells|celeste|nioh|lies of p|hollow knight/, "action_challenge", ["action", "challenge", "systems"]],
  [/resident evil|silent hill|until dawn|quarry|bramble|cthulhu|dark pictures|alien|soma|directive|still wakes/, "horror_tension", ["horror", "story", "tension"]],
  [/stardew|spiritfarer|unpacking|goose|lake|coffee talk|short hike|harold|thank goodness|stray|dave the diver|neva|röki|roki/, "cozy_short", ["cozy", "short", "story"]],
  [/takes two|a way out|grounded|sea of thieves|deep rock|warframe|destiny|marvel rivals|overcooked|monster hunter|darktide|helldivers/, "co_op_multiplayer", ["co-op", "multiplayer", "systems"]],
  [/civilization|frostpunk|xcom|crusader kings|cities|two point|police|not for broadcast|against the storm/, "strategy_management", ["strategy", "systems", "management"]],
  [/fc|fifa|football|soccer|gran turismo|rocket league|crew|forza|f1|nba|efootball|tony hawk|riders republic|fall guys/, "sports_service", ["sports", "competitive", "short"]],
];

function readJson(path) {
  return readFile(new URL(path, ROOT), "utf8").then(JSON.parse);
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

function splitList(value) {
  return String(value || "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanTitle(value) {
  return String(value || "")
    .replace(/^[+\-*#\s]+/, "")
    .replace(/^[\u2705\u2795\u267B\uFE0F\u2764\s]+/u, "")
    .replace(/\s+-\s+(?:\d{1,2}\s+\S+|[\d,.]+\s*(?:EUR|USD|GBP|TRY|RUB|€|\$|£)?)$/i, "")
    .trim();
}

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseKeyValueSegments(line) {
  const [rawTitle, ...segments] = line.split("|").map((item) => item.trim()).filter(Boolean);
  const fields = {};
  segments.forEach((segment) => {
    const match = segment.match(/^([a-zA-Z][\w-]*)\s*=\s*(.+)$/);
    if (!match) return;
    fields[match[1].trim().toLowerCase()] = match[2].trim();
  });
  return { title: cleanTitle(rawTitle), fields };
}

function sectionFromLine(line, context) {
  const lower = normalizeTitle(line);
  const heartCount = (line.match(/\u2764/g) || []).length;
  if (heartCount) {
    return {
      source: "wishlist_note",
      priority: Math.max(1, 4 - Math.min(heartCount, 3)),
      priceNeed: heartCount >= 2 ? "hot" : "warm",
      laneHint: "",
    };
  }
  const wishlistMatch = lower.match(/wishlist\s*(\d)?/);
  if (wishlistMatch) {
    const level = Number(wishlistMatch[1] || 2);
    return {
      source: "wishlist_note",
      priority: Math.max(1, 4 - Math.min(level, 3)),
      priceNeed: level >= 2 ? "hot" : "warm",
      laneHint: "",
    };
  }
  if (/available|access|subscription|ps plus|extra|essential|v dostupe|dostup/.test(lower)) {
    return { source: "subscription_access", priority: 2, priceNeed: "none", laneHint: "" };
  }
  if (/price|prices|sale|discount|ceny|tseny/.test(lower)) {
    return { source: "price_note", priority: context.priority || 2, priceNeed: "warm", laneHint: "" };
  }
  if (/upcoming|future|radar|2026|wait|zhdem|coming/.test(lower)) {
    return { source: "upcoming_note", priority: 2, priceNeed: "watch_only", laneHint: "upcoming_watch" };
  }
  if (/completed|finished|played|history|rating|ranked|proydeno/.test(lower)) {
    return { source: "user_history", priority: 4, priceNeed: "none", laneHint: "" };
  }
  return null;
}

function parseCsvImport(lines) {
  const [headerLine, ...rows] = lines;
  const headers = splitCsvLine(headerLine).map((header) => header.trim().toLowerCase());
  return rows
    .map((line) => splitCsvLine(line))
    .filter((cells) => cells.some(Boolean))
    .map((cells) => {
      const fields = {};
      headers.forEach((header, index) => {
        fields[header] = cells[index] || "";
      });
      return {
        title: cleanTitle(fields.title || fields.name),
        fields,
        context: { source: sourceOverride || fields.source || "csv_import", priority: Number(fields.priority || 3), priceNeed: fields.priceneed || fields.price_need || "watch_only", laneHint: fields.lane || "" },
      };
    })
    .filter((item) => item.title);
}

function parseNoteImport(lines) {
  let context = { source: sourceOverride || "manual_import", priority: 3, priceNeed: "watch_only", laneHint: "" };
  const items = [];
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || /^[_=\s-]{5,}$/.test(trimmed)) return;
    const section = sectionFromLine(trimmed, context);
    if (section && !/[|:-]/.test(trimmed)) {
      context = { ...context, ...section, source: sourceOverride || section.source };
      return;
    }
    if (/^[_\s-]*[A-ZА-ЯЁ][^a-zа-яё]*[_\s-]*$/u.test(trimmed) && trimmed.length > 6) return;
    const parsed = parseKeyValueSegments(trimmed);
    if (!parsed.title) return;
    items.push({ ...parsed, context });
  });
  return items;
}

function parseImportText(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const firstLine = lines[0] || "";
  if (/^title\s*,/i.test(firstLine) || /^name\s*,/i.test(firstLine)) return parseCsvImport(lines);
  return parseNoteImport(lines);
}

function firstTitleRule(title) {
  const normalized = normalizeTitle(title);
  return titleRules.find(([pattern]) => pattern.test(normalized));
}

function inferLane(title, fields, context, atoms) {
  const explicit = fields.lane;
  if (explicit && laneIds.has(explicit)) return explicit;
  const atomSet = new Set(atoms);
  if (context.laneHint && laneIds.has(context.laneHint)) return context.laneHint;
  const rule = firstTitleRule(title);
  if (rule) return rule[1];
  if (atomSet.has("sports")) return "sports_service";
  if (atomSet.has("strategy") || atomSet.has("management")) return "strategy_management";
  if (atomSet.has("co-op") || atomSet.has("multiplayer") || atomSet.has("service")) return "co_op_multiplayer";
  if (atomSet.has("cozy") || atomSet.has("short")) return "cozy_short";
  if (atomSet.has("horror") || atomSet.has("tension")) return "horror_tension";
  if (atomSet.has("challenge") || atomSet.has("soulslike")) return "action_challenge";
  if (atomSet.has("turn-based") || atomSet.has("rpg") || atomSet.has("choice")) return "systems_rpg";
  if (atomSet.has("open-world")) return "open_world_rpg";
  if (context.source === "upcoming_note") return "upcoming_watch";
  return "cinematic_story";
}

function inferAtoms(title, fields, lane) {
  const atoms = new Set();
  const explicitAtoms = splitList(fields.atoms || fields.atom || fields.tags);
  explicitAtoms.forEach((atom) => {
    const normalized = atom.toLowerCase().replaceAll("_", "-");
    if (taxonomyAtoms.has(normalized)) atoms.add(normalized);
  });
  const rule = firstTitleRule(title);
  (rule?.[2] || []).forEach((atom) => atoms.add(atom));
  (laneDefaults[lane] || []).forEach((atom) => atoms.add(atom));
  return [...atoms].filter((atom) => taxonomyAtoms.has(atom)).slice(0, 5);
}

function inferPlatforms(title, fields) {
  const explicit = splitList(fields.platforms || fields.platform || "");
  if (explicit.length) return explicit;
  const normalized = normalizeTitle(title);
  if (/fable|forza|gears/.test(normalized)) return ["PC", "Xbox"];
  if (/bloodborne/.test(normalized)) return ["PS4"];
  if (/nintendo|zelda|mario/.test(normalized)) return ["Switch"];
  if (/stardew|hollow knight|civilization|coffee talk|unpacking|fall guys/.test(normalized)) return ["PS5", "PS4", "PC", "Switch"];
  return ["PS5", "PC"];
}

function inferSession(atoms, lane, fields) {
  if (validSession.has(fields.session)) return fields.session;
  const atomSet = new Set(atoms);
  if (atomSet.has("short") || lane === "sports_service" || lane === "cozy_short") return "short";
  if (atomSet.has("long") || lane === "strategy_management" || lane === "open_world_rpg") return "long";
  return "medium";
}

function inferCommitment(atoms, lane, session, fields) {
  if (validCommitment.has(fields.commitment)) return fields.commitment;
  const atomSet = new Set(atoms);
  if (atomSet.has("service") || atomSet.has("long") || lane === "strategy_management" || lane === "open_world_rpg") return "high";
  if (session === "short" && (atomSet.has("cozy") || atomSet.has("short"))) return "low";
  return "medium";
}

function inferAdultTimeFit(atoms, lane, session, commitment, fields) {
  if (validAdultTimeFit.has(fields.adulttimefit || fields.adult_time_fit)) return fields.adulttimefit || fields.adult_time_fit;
  const atomSet = new Set(atoms);
  if (atomSet.has("service") || lane === "sports_service") return "background";
  if (session === "short" || commitment === "low") return "weeknight";
  if (commitment === "high") return "vacation";
  return "weekend";
}

function fieldValue(fields, compactKey, values, fallback) {
  const raw = fields[compactKey] || fields[compactKey.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)] || "";
  return values.has(raw) ? raw : fallback;
}

function inferPriceNeed(fields, context, lane) {
  const explicit = fields.priceneed || fields.price_need;
  if (validPriceNeed.has(explicit)) return explicit;
  if (context.priceNeed && validPriceNeed.has(context.priceNeed)) return context.priceNeed;
  if (lane === "sports_service" || lane === "co_op_multiplayer") return "none";
  return "watch_only";
}

function makeRecord(item) {
  const fields = Object.fromEntries(
    Object.entries(item.fields || {}).map(([key, value]) => [key.toLowerCase().replace(/[^a-z0-9]/g, ""), value]),
  );
  const context = item.context || { source: sourceOverride || "manual_import", priority: 3, priceNeed: "watch_only", laneHint: "" };
  const manualReview = [];
  const explicitLane = fields.lane;
  if (explicitLane && !laneIds.has(explicitLane)) manualReview.push(`unknown lane: ${explicitLane}`);
  const initialAtoms = inferAtoms(item.title, fields, context.laneHint || "cinematic_story");
  const lane = inferLane(item.title, fields, context, initialAtoms);
  const atoms = inferAtoms(item.title, fields, lane);
  splitList(fields.atoms || fields.atom || fields.tags)
    .map((atom) => atom.toLowerCase().replaceAll("_", "-"))
    .filter((atom) => !taxonomyAtoms.has(atom))
    .forEach((atom) => manualReview.push(`unknown atom: ${atom}`));
  if (atoms.length < 3) manualReview.push("atom review");
  const session = inferSession(atoms, lane, fields);
  const commitment = inferCommitment(atoms, lane, session, fields);
  const adultTimeFit = inferAdultTimeFit(atoms, lane, session, commitment, fields);
  const platforms = inferPlatforms(item.title, fields);
  if (!(fields.platforms || fields.platform)) manualReview.push("platform mapping");
  const status = fieldValue(fields, "status", validStatus, atoms.length >= 3 && context.priority <= 2 ? "ready_for_atom_review" : "candidate");
  const coverStatus = fieldValue(fields, "coverstatus", validCoverStatus, "missing");
  const atomStatus = fieldValue(fields, "atomstatus", validAtomStatus, (fields.atoms || fields.atom || fields.tags) ? "needs_review" : "draft");
  const priceNeed = inferPriceNeed(fields, context, lane);
  if (coverStatus === "missing") manualReview.push("cover source");

  return {
    title: item.title,
    lane,
    priority: Number(fields.priority || context.priority || 3),
    status,
    source: sourceOverride || fields.source || context.source || "manual_import",
    sourceConfidence: (fields.sourceconfidence || fields.source_confidence || "").trim() || "low",
    platforms,
    atoms,
    session,
    commitment,
    adultTimeFit,
    coverStatus,
    atomStatus,
    priceNeed,
    reason: fields.reason || `Imported candidate for ${lane.replaceAll("_", " ")} catalog growth.`,
    manualReview: [...new Set(manualReview)],
  };
}

const parsedItems = parseImportText(inputText);
const seenImportTitles = new Set();
const skipped = [];
const records = [];

parsedItems.forEach((item) => {
  const key = titleKey(item.title);
  if (!key) return;
  if (existingTitles.has(key)) {
    skipped.push({ title: item.title, reason: existingTitles.get(key) });
    return;
  }
  if (seenImportTitles.has(key)) {
    skipped.push({ title: item.title, reason: "duplicate_import" });
    return;
  }
  seenImportTitles.add(key);
  records.push(makeRecord(item));
});

const laneCounts = records.reduce((counts, record) => {
  counts[record.lane] = (counts[record.lane] || 0) + 1;
  return counts;
}, {});

const preview = {
  mode: "catalog-import-preview",
  generatedAt: new Date().toISOString(),
  input: inputPath,
  summary: {
    parsedItems: parsedItems.length,
    newRecords: records.length,
    skippedDuplicates: skipped.length,
    needsManualReview: records.filter((record) => record.manualReview.length > 0).length,
    laneCounts,
  },
  skipped,
  records,
};

if (writePath) {
  await writeFile(resolve(process.cwd(), writePath), `${JSON.stringify(preview, null, 2)}\n`);
}

if (jsonMode || writePath) {
  console.log(JSON.stringify(preview, null, 2));
} else {
  console.log(`Catalog import preview: ${records.length} new records / ${skipped.length} skipped`);
  Object.entries(laneCounts).forEach(([lane, count]) => console.log(`- ${lane}: ${count}`));
  if (writePath) console.log(`Wrote ${writePath}`);
}
