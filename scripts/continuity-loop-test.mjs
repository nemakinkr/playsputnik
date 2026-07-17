import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/app-continuity.js", import.meta.url), "utf8");
const context = { window: {}, Date, Set };
vm.runInNewContext(source, context, { filename: "src/app-continuity.js" });
const { activeContinuityRecords, continuityFocus, applyPlaySession, continuitySnapshot, continuityHistory } = context.window.PlaySputnikContinuity;

const first = applyPlaySession({ title: "Control", completionStatus: "paused", hoursPlayed: 1 }, 45, "2026-07-17T10:00:00.000Z");
assert.equal(first.completionStatus, "playing");
assert.equal(first.hoursPlayed, 1.75);
assert.equal(first.playProgress.sessionCount, 1);
assert.equal(first.playProgress.totalMinutes, 45);
assert.equal(first.playProgress.sessions.length, 1);
assert.equal(first.playProgress.sessions[0].minutes, 45);

const second = applyPlaySession(first, 30, "2026-07-18T10:00:00.000Z");
assert.equal(second.hoursPlayed, 2.25);
assert.equal(second.playProgress.sessionCount, 2);
assert.equal(second.playProgress.totalMinutes, 75);
assert.deepEqual([...second.playProgress.sessions].map((session) => session.minutes), [30, 45]);
assert.equal(continuitySnapshot(second, 9).percent, 25);

const focus = continuityFocus({
  paused: { title: "Alan Wake 2", completionStatus: "paused", lastActivityAt: "2026-07-18T00:00:00Z" },
  playing: second,
  done: { title: "Stray", completionStatus: "completed", lastActivityAt: "2026-07-19T00:00:00Z" },
});
assert.equal(focus.title, "Control", "playing always wins over paused and completed records");
const pausedRecord = { title: "Alan Wake 2", completionStatus: "paused", lastActivityAt: "2026-07-18T00:00:00Z" };
assert.equal(continuityFocus({ paused: pausedRecord, playing: second }, "Alan Wake 2").title, "Alan Wake 2", "explicit active focus should override state priority");
assert.equal(activeContinuityRecords({ paused: pausedRecord, playing: second }).length, 2);
assert.deepEqual([...continuityHistory({ control: second })].map((session) => session.minutes), [30, 45]);
assert.equal(continuityFocus({ done: { title: "Stray", completionStatus: "completed" } }), null);

console.log("✅ started-game continuity keeps sessions, progress, and the next active focus deterministic");
