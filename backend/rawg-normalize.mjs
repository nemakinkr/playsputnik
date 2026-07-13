export const SEARCH_RESULT_VERSION = "search-result-v3";
export const RAWG_INFERENCE_VERSION = "rawg-inference-v1";

const ATOM_RULES = [
  [/action|combat|hack and slash|beat.?em.?up/, ["action"]],
  [/fast.?paced|adrenaline|bullet hell/, ["adrenaline", "action"]],
  [/adventure/, ["exploration", "story"]],
  [/story rich|narrative|choices matter|multiple endings/, ["story", "choice"]],
  [/role.?playing|\brpg\b/, ["rpg", "choice", "systems"]],
  [/shooter|\bfps\b|third.person shooter/, ["shooter", "action"]],
  [/strategy/, ["strategy", "systems"]],
  [/tactical|turn.based tactics/, ["tactical", "systems"]],
  [/puzzle/, ["puzzle", "systems"]],
  [/horror/, ["horror", "tension"]],
  [/mystery|detective|investigation/, ["mystery", "story"]],
  [/crime/, ["crime", "realistic"]],
  [/sports|football|soccer/, ["sports", "competitive"]],
  [/racing/, ["racing", "competitive"]],
  [/simulation/, ["simulation", "systems"]],
  [/management/, ["management", "systems"]],
  [/platform/, ["platforming", "action"]],
  [/indie/, ["indie"]],
  [/multiplayer|massively multiplayer|\bmmo\b/, ["multiplayer", "competitive"]],
  [/co.?op|cooperative/, ["co-op", "multiplayer"]],
  [/survival/, ["survival", "systems"]],
  [/open.?world/, ["open-world", "exploration"]],
  [/stealth/, ["stealth", "tactical"]],
  [/souls.?like|difficult|hardcore/, ["souls-like", "challenge"]],
  [/turn.?based/, ["turn-based", "tactical"]],
  [/rogue.?like|rogue.?lite/, ["roguelike", "systems"]],
  [/atmospheric/, ["atmosphere"]],
  [/sci.?fi|cyberpunk|space/, ["sci-fi", "strange"]],
  [/fantasy|magic/, ["fantasy", "mythic"]],
  [/sandbox|crafting|building/, ["sandbox", "creative", "systems"]],
  [/cozy|farming|relaxing|wholesome/, ["cozy", "slow"]],
  [/music|rhythm/, ["music"]],
  [/metroidvania/, ["metroidvania", "exploration"]],
  [/visual novel|text.based/, ["reading", "story"]],
];

function unique(values, limit = Infinity) {
  return [...new Set(values.filter(Boolean))].slice(0, limit);
}

function textValues(record) {
  return [
    ...(record.genres || []).flatMap((item) => [item.name, item.slug]),
    ...(record.tags || []).flatMap((item) => [item.name, item.slug]),
  ].filter(Boolean).map(String);
}

function evidence(kind, values, limit = 4) {
  return unique(values, limit).map((value) => ({ kind, value }));
}

function inferredField(value, confidence, evidenceItems = []) {
  return { value, confidence, evidence: evidenceItems };
}

function matchingValues(values, pattern) {
  return values.filter((value) => pattern.test(value.toLowerCase()));
}

function fieldFromRules(values, rules, fallback = "unknown") {
  for (const [pattern, value, confidence = "medium"] of rules) {
    const matches = matchingValues(values, pattern);
    if (matches.length) return inferredField(value, confidence, evidence("rawg_tag_or_genre", matches));
  }
  return inferredField(fallback, "low", []);
}

export function normalizeSearchTitle(value) {
  return String(value || "")
    .replace(/[™®©]/g, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function rawgTitleMatch(title, query) {
  const normalizedTitle = normalizeSearchTitle(title);
  const normalizedQuery = normalizeSearchTitle(query);
  if (!normalizedTitle || !normalizedQuery) return { kind: "none", confidence: "low", score: 0 };
  if (normalizedTitle === normalizedQuery) return { kind: "exact", confidence: "high", score: 96 };
  if (normalizedTitle.startsWith(normalizedQuery) || normalizedQuery.startsWith(normalizedTitle)) {
    return { kind: "prefix", confidence: "medium", score: 82 };
  }
  const queryTokens = normalizedQuery.split(" ").filter((token) => token.length >= 2);
  const titleTokens = new Set(normalizedTitle.split(" "));
  const coverage = queryTokens.length
    ? queryTokens.filter((token) => titleTokens.has(token)).length / queryTokens.length
    : 0;
  if (coverage === 1) return { kind: "token", confidence: "medium", score: 74 };
  if (coverage >= 0.5) return { kind: "token", confidence: "low", score: 58 };
  return { kind: "provider", confidence: "low", score: 42 };
}

export function inferRawgProfile(record = {}) {
  const values = textValues(record);
  const atomEvidence = new Map();
  ATOM_RULES.forEach(([pattern, mapped]) => {
    const matches = matchingValues(values, pattern);
    if (!matches.length) return;
    mapped.forEach((atom) => atomEvidence.set(atom, unique([...(atomEvidence.get(atom) || []), ...matches], 4)));
  });
  const atoms = [...atomEvidence.keys()].slice(0, 10);
  const playtime = Number(record.playtime);
  const hasPlaytime = Number.isFinite(playtime) && playtime > 0;
  const playtimeEvidence = hasPlaytime ? [{ kind: "rawg_average_playtime", value: `${playtime}h` }] : [];

  const length = hasPlaytime
    ? inferredField(playtime <= 10 ? "short" : playtime <= 25 ? "medium" : playtime <= 60 ? "long" : "massive", "medium", playtimeEvidence)
    : inferredField("unknown", "low", []);
  const session = fieldFromRules(values, [
    [/rogue.?like|rogue.?lite|sports|racing|fighting|arcade|match.based/, "short"],
    [/grand strategy|4x|massively multiplayer|\bmmo\b/, "long"],
    [/story rich|adventure|shooter|platform|role.?playing|\brpg\b/, "medium"],
  ], "medium");
  const difficulty = fieldFromRules(values, [
    [/souls.?like|difficult|hardcore|precision platform/, "high"],
    [/casual|relaxing|cozy|family friendly/, "low"],
  ], "normal");
  const commitment = fieldFromRules(values, [
    [/massively multiplayer|\bmmo\b|open.?world|grand strategy|4x|management/, "high"],
    [/short|casual|arcade|walking simulator/, "low"],
  ], hasPlaytime && playtime > 40 ? "high" : hasPlaytime && playtime <= 10 ? "low" : "medium");
  if (!commitment.evidence.length && hasPlaytime) commitment.evidence = playtimeEvidence;
  const tone = fieldFromRules(values, [
    [/horror|dark|gore|violent|psychological/, "dark"],
    [/funny|comedy|humor/, "funny"],
    [/cozy|relaxing|wholesome|colorful/, "warm"],
    [/atmospheric|melancholic|emotional/, "moody"],
    [/sci.?fi|surreal|strange/, "strange"],
    [/epic|mythology/, "epic"],
  ], "neutral");
  const content = fieldFromRules(values, [
    [/gore|violent|blood/, "graphic-violence", "low"],
    [/horror/, "horror-themes"],
    [/romance/, "romance"],
    [/family friendly|wholesome/, "family-safe"],
  ], "unknown");
  const reviewBurden = fieldFromRules(values, [
    [/grand strategy|4x|massively multiplayer|\bmmo\b|management|complex/, "high"],
    [/linear|walking simulator|casual|arcade/, "low"],
  ], atoms.includes("systems") && atoms.includes("rpg") ? "high" : "medium");
  const adultTimeFit = inferredField(
    session.value === "short" ? "weeknight" : commitment.value === "high" ? "weekend" : "evening",
    session.confidence === "low" && commitment.confidence === "low" ? "low" : "medium",
    unique([...session.evidence, ...commitment.evidence], 4),
  );
  const atomField = inferredField(
    atoms,
    atoms.length >= 4 ? "medium" : "low",
    [...atomEvidence.entries()].slice(0, 6).flatMap(([atom, sources]) => (
      evidence("rawg_tag_or_genre", sources, 2).map((item) => ({ ...item, supports: atom }))
    )),
  );
  const evidencedFields = [atomField, session, length, difficulty, commitment, tone, content, reviewBurden, adultTimeFit]
    .filter((field) => field.evidence.length).length;
  const overallConfidence = evidencedFields >= 6 && atoms.length >= 4 ? "medium" : "low";

  return {
    version: RAWG_INFERENCE_VERSION,
    status: "inferred",
    confidence: overallConfidence,
    fields: {
      atoms: atomField,
      session,
      length,
      difficulty,
      commitment,
      tone,
      content,
      reviewBurden,
      adultTimeFit,
    },
    limitations: [
      "price_requires_store_source",
      "subscription_requires_store_source",
      "languages_not_verified",
      "playtime_is_provider_average",
    ],
    evidenceCount: evidencedFields,
    rawSignals: {
      genres: unique((record.genres || []).map((item) => item.name), 8),
      tags: unique((record.tags || []).map((item) => item.name), 16),
      playtimeHours: hasPlaytime ? playtime : null,
      esrb: record.esrb_rating?.name || "",
      released: record.released || "",
      rating: Number.isFinite(Number(record.rating)) ? Number(record.rating) : null,
      ratingsCount: Number.isFinite(Number(record.ratings_count)) ? Number(record.ratings_count) : null,
      metacritic: Number.isFinite(Number(record.metacritic)) ? Number(record.metacritic) : null,
    },
  };
}

export function normalizeRawgResult(record, query, overrides = {}) {
  if (!record?.name) return null;
  const match = overrides.match || rawgTitleMatch(record.name, query);
  const rawProfile = inferRawgProfile(record);
  const profile = match.confidence === "low"
    ? {
        ...rawProfile,
        confidence: "low",
        fields: Object.fromEntries(Object.entries(rawProfile.fields).map(([key, field]) => [
          key,
          { ...field, confidence: "low" },
        ])),
      }
    : rawProfile;
  const fields = profile.fields;
  const platforms = [
    ...(record.parent_platforms || []).map((item) => item.platform?.name),
    ...(record.platforms || []).map((item) => item.platform?.name),
  ].filter(Boolean);
  const genres = unique((record.genres || []).map((item) => item.name), 3);
  return {
    resultShapeVersion: SEARCH_RESULT_VERSION,
    title: record.name,
    sourceId: "rawg_provider_hook",
    sourceLabel: "RAWG provider",
    catalogStatus: "provider_result",
    matchConfidence: match.confidence,
    matchKind: match.kind,
    coverStatus: record.background_image ? "candidate" : "missing",
    priceStatus: "missing",
    provider: "rawg",
    providerRecordId: String(record.id || ""),
    sourceUrl: record.slug ? `https://rawg.io/games/${record.slug}` : "https://rawg.io/",
    coverUrl: record.background_image || "",
    platforms: unique(platforms, 8),
    atoms: fields.atoms.value,
    inferredAtoms: fields.atoms.value,
    session: fields.session.value,
    length: fields.length.value,
    difficulty: fields.difficulty.value,
    commitment: fields.commitment.value,
    tone: fields.tone.value,
    content: fields.content.value,
    reviewBurden: fields.reviewBurden.value,
    adultTimeFit: fields.adultTimeFit.value,
    inferenceProfile: profile,
    vibe: genres.length ? `${genres.join(" / ")} provider profile` : "RAWG provider profile",
    reason: "RAWG metadata profile; price and subscription still require store-backed checks.",
    score: match.score,
    reconciliation: overrides.reconciliation || null,
    duplicateOf: "",
    duplicateSource: "",
    canAddToWishlist: true,
  };
}
