import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/app-activity.js", import.meta.url), "utf8");
const context = { window: {}, Date, Map, Set };
vm.runInNewContext(source, context, { filename: "src/app-activity.js" });
const { buildRecentChanges, buildWeeklyReport } = context.window.PlaySputnikActivity;

const now = new Date("2026-07-27T12:00:00.000Z");
const events = [
  {
    type: "game_session_logged",
    title: "Control",
    occurredAt: "2026-07-26T18:00:00.000Z",
    payload: { minutes: 45 },
  },
  {
    type: "game_session_logged",
    title: "Control",
    occurredAt: "2026-07-25T18:00:00.000Z",
    detail: { minutes: 30 },
  },
  {
    type: "game_session_logged",
    title: "Stray",
    occurredAt: "2026-07-24T18:00:00.000Z",
    payload: { minutes: 20 },
  },
  {
    type: "user_game_state_changed",
    title: "Stray",
    occurredAt: "2026-07-24T19:00:00.000Z",
    payload: { to: "completed", completionStatus: "completed" },
  },
  {
    type: "user_game_rating_changed",
    title: "Stray",
    occurredAt: "2026-07-24T19:05:00.000Z",
    payload: { to: 80 },
  },
  {
    type: "backlog_amnestied",
    title: "Long Game",
    occurredAt: "2026-07-23T19:00:00.000Z",
    payload: { skips: 3 },
  },
  {
    type: "briefing.item_completed",
    title: "Control",
    occurredAt: "2026-07-26T18:01:00.000Z",
    payload: { outcome: "continued" },
  },
  {
    type: "game_session_logged",
    title: "Old Game",
    occurredAt: "2026-07-10T18:00:00.000Z",
    payload: { minutes: 500 },
  },
];

const notificationEvents = [
  {
    type: "price.target_hit",
    title: "Alan Wake 2",
    occurredAt: now.toISOString(),
    delivery: "eligible",
    source: { name: "itad", url: "https://example.com/alan", checkedAt: "2026-07-26T08:00:00.000Z" },
    payload: { price: 20, targetPrice: 25, currency: "EUR" },
  },
  {
    type: "subscription.available",
    title: "Bramble",
    occurredAt: now.toISOString(),
    delivery: "blocked",
    source: { name: "ps_store", checkedAt: "2026-07-26T08:00:00.000Z" },
    payload: { tier: "Extra" },
  },
  {
    type: "release.upcoming",
    title: "Old Release Fact",
    occurredAt: now.toISOString(),
    delivery: "eligible",
    source: { name: "rawg", url: "https://example.com/old", checkedAt: "2026-06-01T08:00:00.000Z" },
    payload: { daysAway: 10 },
  },
];

const changes = buildRecentChanges({
  events,
  notificationEvents,
  recommendation: { title: "Alan Wake 2", score: 91 },
  now,
  limit: 10,
});
assert(changes.some((change) => change.kind === "price" && change.title === "Alan Wake 2"));
assert(changes.some((change) => change.kind === "recommendation" && change.title === "Alan Wake 2"));
assert(changes.some((change) => change.kind === "progress" && change.title === "Control"));
assert(!changes.some((change) => change.title === "Bramble"), "blocked provider facts must stay out of the digest");
assert(!changes.some((change) => change.title === "Old Release Fact"), "stale source checks must stay out of the digest");
assert(!changes.some((change) => change.title === "Old Game"), "old personal activity must stay out of the digest");

const report = buildWeeklyReport({
  events,
  recommendation: { title: "Alan Wake 2", score: 91 },
  now,
});
assert.equal(report.sessionMinutes, 95);
assert.equal(report.sessionCount, 3);
assert.equal(report.playedGameCount, 2);
assert.equal(report.decisionCount, 3, "state, rating, and amnesty are decisions; briefing UI actions are not double-counted");
assert.equal(report.completedCount, 1);
assert.equal(report.releasedBacklogCount, 1);
assert.equal(report.ratingCount, 1);
assert.equal(report.topPlayed.title, "Control");
assert.equal(report.topPlayed.minutes, 75);
assert.equal(report.recommendation.title, "Alan Wake 2");

console.log("✅ activity digest trusts sourced changes and summarizes a real seven-day play loop");
