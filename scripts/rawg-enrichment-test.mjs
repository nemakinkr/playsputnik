import assert from "node:assert/strict";
import { inferRawgProfile, normalizeRawgResult, rawgTitleMatch } from "../backend/rawg-normalize.mjs";

const stray = normalizeRawgResult({
  id: 1,
  name: "Stray",
  slug: "stray",
  background_image: "https://example.test/stray.jpg",
  genres: [{ name: "Adventure" }, { name: "Indie" }],
  tags: [
    { name: "Atmospheric" },
    { name: "Story Rich" },
    { name: "Puzzle" },
    { name: "Cyberpunk" },
  ],
  playtime: 6,
  parent_platforms: [{ platform: { name: "PlayStation" } }],
}, "stray");

assert.equal(stray.resultShapeVersion, "search-result-v3");
assert.equal(stray.matchKind, "exact");
assert.equal(stray.length, "short");
assert.equal(stray.priceStatus, "missing");
assert.equal(stray.inferenceProfile.version, "rawg-inference-v1");
assert.equal(stray.inferenceProfile.fields.length.evidence[0].kind, "rawg_average_playtime");
assert(stray.atoms.includes("story") && stray.atoms.includes("puzzle"));
assert(!("prices" in stray), "RAWG metadata must never create store prices");
assert(!("psPlus" in stray), "RAWG metadata must never create subscription status");

const eldenRing = normalizeRawgResult({
  id: 2,
  name: "ELDEN RING",
  slug: "elden-ring",
  genres: [{ name: "RPG" }, { name: "Action" }],
  tags: [{ name: "Souls-like" }, { name: "Open World" }, { name: "Difficult" }],
  playtime: 58,
}, "Elden Ring™");
assert.equal(eldenRing.matchConfidence, "high", "punctuation must not reduce an exact title match");
assert.equal(eldenRing.difficulty, "high");
assert.equal(eldenRing.commitment, "high");
assert(eldenRing.atoms.includes("souls-like") && eldenRing.atoms.includes("open-world"));

const weakMatch = normalizeRawgResult({
  name: "Completely Different Game",
  genres: [{ name: "RPG" }],
  tags: [{ name: "Open World" }],
}, "Stray");
assert.equal(weakMatch.matchConfidence, "low");
assert.equal(weakMatch.inferenceProfile.confidence, "low");
assert(Object.values(weakMatch.inferenceProfile.fields).every((field) => field.confidence === "low"));

const sparse = inferRawgProfile({ name: "Unknown" });
assert.deepEqual(sparse.fields.atoms.value, [], "sparse metadata must stay empty instead of inventing generic atoms");
assert.equal(sparse.confidence, "low");
assert.deepEqual(rawgTitleMatch("Marvel's Spider-Man 2", "Marvel’s Spider Man 2"), {
  kind: "exact",
  confidence: "high",
  score: 96,
});

console.log("✅ RAWG enrichment is structured, provenance-aware, confidence-capped, and store-honest");
