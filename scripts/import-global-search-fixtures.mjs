import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = new URL("../", import.meta.url);
const args = process.argv.slice(2);
const inputPath = args.find((arg) => !arg.startsWith("--"));
const jsonMode = args.includes("--json");
const writeMode = args.includes("--write");
const sourceIndex = args.indexOf("--source");
const sourceLabel = sourceIndex >= 0 ? args[sourceIndex + 1] : "manual_fixture_import";

if (!inputPath) {
  console.log("Usage: node scripts/import-global-search-fixtures.mjs <input.txt|input.csv> [--json] [--write] [--source label]");
  process.exit(1);
}

const [inputText, fixtures, games, catalogBackbone, taxonomy, titleAliases] = await Promise.all([
  readFile(resolve(process.cwd(), inputPath), "utf8"),
  readJson("data/global-search-fixtures.json"),
  readJson("data/games.json"),
  readJson("data/catalog-backbone.json"),
  readJson("data/taxonomy.json"),
  readJson("data/title-aliases.json"),
]);

const taxonomyAtoms = new Set(taxonomy.axes.atoms || []);
const validPriceNeeds = new Set(["none", "watch_only", "warm", "hot"]);
const existingTitles = new Map();

games.forEach((game) => existingTitles.set(titleKey(game.title), "seed_catalog"));
(catalogBackbone.records || []).forEach((record) => existingTitles.set(titleKey(record.title), "catalog_backbone"));
(fixtures.records || []).forEach((record) => existingTitles.set(titleKey(record.title), "global_search_fixture"));

const titleRules = [
  [/007|bond|wolverine|mafia|indiana|spider.?man|intergalactic|replaced/, ["story", "cinematic", "action"], "Cinematic story/action candidate"],
  [/gta|grand theft|starfield|outer worlds|avowed|fable|dragon age|witcher|kingdom come/, ["rpg", "choice", "open-world"], "Open-world or RPG discovery candidate"],
  [/metaphor|final fantasy|baldur|expedition|clair obscur|persona|civilization|civ/, ["rpg", "turn-based", "systems"], "Long systems or turn-based candidate"],
  [/wukong|elden|nightreign|silksong|hollow knight|prince of persia|sifu|lies of p/, ["action", "challenge", "systems"], "Action challenge candidate"],
  [/silent hill|little nightmares|horror|\bod\b|kojima od|resident evil|directive|alien/, ["horror", "tension", "story"], "Horror or tension candidate"],
  [/balatro|animal well|blue prince|astro bot|stray|unpacking|dave the diver/, ["short", "indie", "systems"], "Short-session discovery candidate"],
  [/helldivers|marathon|arc raiders|ready or not|split fiction|monster hunter|grounded|darktide/, ["co-op", "multiplayer", "systems"], "Co-op or multiplayer candidate"],
  [/fc|fifa|football|soccer|gran turismo|forza|f1|nba|racing/, ["sports", "competitive", "short"], "Sports or competitive loop candidate"],
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

function slugForTitle(title) {
  return normalizeTitle(title).replace(/\s+/g, "-") || "untitled";
}

function splitList(value) {
  return String(value || "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values, limit = Infinity) {
  return [...new Set(values.filter(Boolean))].slice(0, limit);
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

function parseKeyValueLine(line) {
  const [rawTitle, ...segments] = line.split("|").map((item) => item.trim()).filter(Boolean);
  const fields = {};
  segments.forEach((segment) => {
    const match = segment.match(/^([a-zA-Z][\w-]*)\s*=\s*(.+)$/);
    if (match) fields[match[1].toLowerCase()] = match[2].trim();
  });
  return { title: cleanTitle(rawTitle), fields };
}

function sectionContext(line, current) {
  const normalized = normalizeTitle(line);
  const heartCount = (line.match(/\u2764/g) || []).length;
  if (heartCount || /wishlist|wish/.test(normalized)) {
    return { ...current, priceNeed: heartCount >= 2 ? "hot" : "warm", reasonType: "wishlist" };
  }
  if (/upcoming|radar|2026|coming|wait/.test(normalized)) {
    return { ...current, priceNeed: "watch_only", reasonType: "radar" };
  }
  if (/plus|subscription|available|access|essential|extra/.test(normalized)) {
    return { ...current, priceNeed: "none", reasonType: "access" };
  }
  if (/cozy|short|indie/.test(normalized)) {
    return { ...current, reasonType: "short" };
  }
  if (/horror|tension/.test(normalized)) {
    return { ...current, reasonType: "horror" };
  }
  if (/co op|coop|multiplayer|service/.test(normalized)) {
    return { ...current, reasonType: "co-op" };
  }
  if (/cinematic|story|narrative|action|challenge|shooter|stealth|rpg|roleplay|open world|strategy|sports|racing|management/.test(normalized)) {
    return { ...current, reasonType: "discovery" };
  }
  return null;
}

function parseCsv(lines) {
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
      return { title: cleanTitle(fields.title || fields.name), fields };
    })
    .filter((item) => item.title);
}

function parseNote(lines) {
  let context = { priceNeed: "watch_only", reasonType: "discovery" };
  const items = [];
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || /^[_=\s-]{5,}$/.test(trimmed)) return;
    const nextContext = sectionContext(trimmed, context);
    if (nextContext && !trimmed.includes("|") && !/\s[-:]\s/.test(trimmed)) {
      context = nextContext;
      return;
    }
    const parsed = parseKeyValueLine(trimmed);
    if (!parsed.title) return;
    items.push({ ...parsed, context });
  });
  return items;
}

function parseInput(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const firstLine = lines[0] || "";
  if (/^title\s*,/i.test(firstLine) || /^name\s*,/i.test(firstLine)) return parseCsv(lines);
  return parseNote(lines);
}

function titleRule(title) {
  const normalized = normalizeTitle(title);
  return titleRules.find(([pattern]) => pattern.test(normalized));
}

function inferAtoms(title, fields) {
  const explicit = splitList(fields.atoms || fields.atom || fields.tags)
    .filter((atom) => taxonomyAtoms.has(atom));
  if (explicit.length >= 3) return unique(explicit, 5);
  const rule = titleRule(title);
  const inferred = rule?.[1] || ["story", "action", "systems"];
  return unique([...explicit, ...inferred].filter((atom) => taxonomyAtoms.has(atom)), 5);
}

function inferPlatforms(title, fields) {
  const explicit = splitList(fields.platforms || fields.platform || fields.systems);
  if (explicit.length) return unique(explicit, 5);
  const normalized = normalizeTitle(title);
  if (/nintendo|mario|zelda|pokemon|switch/.test(normalized)) return ["Switch"];
  if (/fable|avowed|starfield|od|forza/.test(normalized)) return ["PC", "Xbox"];
  if (/astro bot|wolverine|intergalactic/.test(normalized)) return ["PS5"];
  return ["PS5", "PC", "Xbox"];
}

function inferPriceNeed(fields, context = {}) {
  const value = fields.priceneed || fields.price_need || fields.price || context.priceNeed || "watch_only";
  return validPriceNeeds.has(value) ? value : "watch_only";
}

function inferVibe(title, fields, atoms) {
  if (fields.vibe) return fields.vibe;
  const rule = titleRule(title);
  if (rule) return rule[2];
  if (atoms.includes("horror")) return "Horror/tension discovery candidate";
  if (atoms.includes("co-op")) return "Co-op discovery candidate";
  if (atoms.includes("short")) return "Short-session discovery candidate";
  if (atoms.includes("rpg")) return "RPG discovery candidate";
  return "External discovery candidate";
}

function inferReason(title, fields, context = {}, atoms = []) {
  if (fields.reason) return fields.reason;
  const type = context.reasonType || "discovery";
  const atomCopy = atoms.slice(0, 2).join(" and ") || "taste";
  if (type === "wishlist") return `Imported as a wishlist/search candidate; use ${atomCopy} fit, but verify provider metadata before price or subscription claims.`;
  if (type === "radar") return `Imported as a radar candidate; keep in discovery until release/platform/store facts are verified.`;
  if (type === "access") return `Imported as an access/subscription candidate; subscription status still needs a source-backed check.`;
  return `Imported into the no-key search index for ${atomCopy} discovery; price, cover, and subscription status remain unverified.`;
}

function makeRecord(item) {
  const fields = item.fields || {};
  const atoms = inferAtoms(item.title, fields);
  return {
    title: item.title,
    provider: "prototype_external_index",
    sourceUrl: fields.sourceurl || fields.source_url || `local://prototype-external-index/${slugForTitle(item.title)}`,
    platforms: inferPlatforms(item.title, fields),
    atoms,
    vibe: inferVibe(item.title, fields, atoms),
    matchConfidence: fields.matchconfidence || fields.match_confidence || "low",
    coverStatus: fields.coverstatus || fields.cover_status || "missing",
    priceStatus: fields.pricestatus || fields.price_status || "missing",
    priceNeed: inferPriceNeed(fields, item.context),
    reason: inferReason(item.title, fields, item.context, atoms),
  };
}

const parsed = parseInput(inputText);
const records = [];
const skippedDuplicates = [];
const seenIncoming = new Set();

parsed.forEach((item) => {
  const key = titleKey(item.title);
  if (!key) return;
  if (seenIncoming.has(key)) {
    skippedDuplicates.push({ title: item.title, source: "input_duplicate" });
    return;
  }
  seenIncoming.add(key);
  const existing = existingTitles.get(key);
  if (existing) {
    skippedDuplicates.push({ title: item.title, source: existing });
    return;
  }
  records.push(makeRecord(item));
});

const payload = {
  mode: "global-search-fixture-import-preview",
  source: sourceLabel,
  inputCount: parsed.length,
  importableCount: records.length,
  skippedDuplicates,
  records,
};

if (writeMode && records.length) {
  const nextFixtures = {
    ...fixtures,
    updatedAt: new Date().toISOString(),
    records: [...fixtures.records, ...records],
  };
  await writeFile(new URL("data/global-search-fixtures.json", ROOT), `${JSON.stringify(nextFixtures, null, 2)}\n`);
}

if (jsonMode) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
} else {
  console.log(`${writeMode ? "Imported" : "Preview"} ${records.length}/${parsed.length} global search fixture records.`);
  if (skippedDuplicates.length) {
    console.log(`Skipped ${skippedDuplicates.length} duplicates: ${skippedDuplicates.map((item) => `${item.title} (${item.source})`).join(", ")}`);
  }
  records.slice(0, 12).forEach((record) => {
    console.log(`- ${record.title}: ${record.platforms.join("/")} / ${record.atoms.join(", ")} / ${record.priceNeed}`);
  });
}
