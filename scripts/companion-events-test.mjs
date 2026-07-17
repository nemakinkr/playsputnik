import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/app-events.js", import.meta.url), "utf8");
const context = { window: {}, Date, Map };
vm.runInNewContext(source, context, { filename: "src/app-events.js" });
const {
  createCompanionEvent,
  appendCompanionEvent,
  priceNotificationEvent,
  buildNotificationEvents,
} = context.window.PlaySputnikEvents;

const freshPriceRecord = {
  game: {
    title: "Control",
    priceMeta: { US: { source: "itad", storeUrl: "https://example.com/control", checkedAt: "2026-07-17T08:00:00.000Z", freshnessState: "fresh", confidence: "high", currency: "USD" } },
  },
  hasPrice: true,
  status: { state: "fresh", canConfirm: true },
  watch: { currentPrice: 19.99, targetPrice: 25, isBelowTarget: true },
};
const priceEvent = priceNotificationEvent(freshPriceRecord, "US");
assert.equal(priceEvent.type, "price.target_hit");
assert.equal(priceEvent.delivery, "eligible");
assert.equal(priceEvent.source.name, "itad");
assert.equal(priceEvent.payload.targetPrice, 25);

const stalePriceEvent = priceNotificationEvent({
  ...freshPriceRecord,
  status: { state: "stale", canConfirm: false },
  game: { title: "Control", priceMeta: { US: { source: "itad", checkedAt: "2026-06-01T08:00:00.000Z", freshnessState: "stale", confidence: "high" } } },
}, "US");
assert.equal(stalePriceEvent.delivery, "blocked", "stale facts must never become deliverable notifications");

const events = buildNotificationEvents({
  wishlistRecords: [freshPriceRecord],
  radarItems: [{
    title: "Fable", releaseDate: "2026-08-10", source: "rawg", sourceUrl: "https://rawg.io/games/fable",
    freshnessState: "fresh", identityConfidence: "high", checkedAt: "2026-07-17T08:00:00.000Z",
  }],
  accessGames: [{
    title: "Bramble",
    subscriptionMeta: { US: { tier: "Extra", source: "ps_store", checkedAt: "2026-07-17T08:00:00.000Z", freshnessState: "fresh", confidence: "high" } },
  }],
  region: "US",
  now: new Date("2026-07-17T12:00:00.000Z"),
});
assert.deepEqual([...events].map((event) => event.type), ["price.target_hit", "release.upcoming", "subscription.available"]);
assert(events.every((event) => event.schemaVersion === 1 && event.source && event.action), "notification candidates need a stable source-aware contract");

const state = { userEvents: [] };
appendCompanionEvent(state, createCompanionEvent({ type: "briefing.item_completed", title: "Control", payload: { outcome: "continued" }, occurredAt: "2026-07-17T18:00:00.000Z" }));
assert.equal(state.userEvents[0].category, "briefing");
assert.equal(state.userEvents[0].detail.outcome, "continued");

console.log("✅ companion events keep user actions durable and block notification delivery without trustworthy facts");
