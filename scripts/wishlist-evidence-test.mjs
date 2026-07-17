import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/app-wishlist.js", import.meta.url), "utf8");
const context = {
  window: {
    PlaySputnikConfig: { WISHLIST_QUEUE_FILTERS: { all: true } },
    PlaySputnikRecommend: {},
    PlaySputnikRanking: {},
    PlaySputnikI18n: { t: (key, values = {}) => `${key}:${JSON.stringify(values)}` },
  },
  Date,
  Map,
  Set,
};
vm.runInNewContext(source, context, { filename: "src/app-wishlist.js" });

const state = { activeRegion: "US", budget: 30 };
const tools = context.window.PlaySputnikWishlist.createWishlistTools({
  getState: () => state,
  getRecommendationPool: () => [],
  getIsAlreadyAvailable: () => false,
  getBlocksPurchase: () => false,
  getPurchaseCandidates: () => [],
  notebookWishlistWeight: () => 0,
  notebookRankedSet: () => new Set(),
  scoreGame: () => 80,
  effectiveGameState: () => "",
  effectiveUserGame: () => ({}),
  priceStatus: () => ({ state: "fresh", canConfirm: true }),
  formatPrice: () => "$19.99",
  formatMoney: (value) => `$${value}`,
  priceCanGuideBuy: () => true,
  dealScore: () => 0,
  purchaseRisk: () => 10,
  purchaseScore: () => 80,
  titleKey: (title) => String(title || "").toLowerCase(),
});

const record = {
  game: {
    title: "Control",
    prices: { US: 19.99 },
    discount: { US: 50 },
    priceMeta: { US: { source: "itad", storeUrl: "https://example.com/control", checkedAt: "2026-07-17T08:00:00.000Z", confidence: "high" } },
  },
  hasPrice: true,
  status: { state: "fresh", canConfirm: true },
  watch: { isBelowTarget: true, targetPrice: 30, hasCustomTarget: false },
  risk: 10,
};
const decision = tools.wishlistDecision(record);
assert.equal(decision.tone, "buy");
assert.deepEqual(JSON.parse(JSON.stringify(decision.evidence)), {
  region: "US",
  source: "itad",
  sourceUrl: "https://example.com/control",
  checkedAt: "2026-07-17T08:00:00.000Z",
  freshness: "fresh",
  confidence: "high",
  canConfirm: true,
});

const missing = tools.wishlistDecision({ game: { title: "Fable", priceMeta: {} }, hasPrice: false, status: {}, risk: 18 });
assert.equal(missing.tone, "missing");
assert.equal(missing.evidence.source, "missing");
assert.equal(missing.evidence.canConfirm, false);

console.log("✅ every wishlist decision carries source, checked date, freshness, confidence, and confirmation state");
