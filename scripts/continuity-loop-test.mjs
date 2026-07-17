import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/app-continuity.js", import.meta.url), "utf8");
const context = { window: {}, Date, Set };
vm.runInNewContext(source, context, { filename: "src/app-continuity.js" });
const { continuityFocus, applyPlaySession, continuitySnapshot } = context.window.PlaySputnikContinuity;

const first = applyPlaySession({ title: "Control", completionStatus: "paused", hoursPlayed: 1 }, 45, "2026-07-17T10:00:00.000Z");
assert.equal(first.completionStatus, "playing");
assert.equal(first.hoursPlayed, 1.75);
assert.equal(first.playProgress.sessionCount, 1);
assert.equal(first.playProgress.totalMinutes, 45);

const second = applyPlaySession(first, 30, "2026-07-18T10:00:00.000Z");
assert.equal(second.hoursPlayed, 2.25);
assert.equal(second.playProgress.sessionCount, 2);
assert.equal(second.playProgress.totalMinutes, 75);
assert.equal(continuitySnapshot(second, 9).percent, 25);

const focus = continuityFocus({
  paused: { title: "Alan Wake 2", completionStatus: "paused", lastActivityAt: "2026-07-18T00:00:00Z" },
  playing: second,
  done: { title: "Stray", completionStatus: "completed", lastActivityAt: "2026-07-19T00:00:00Z" },
});
assert.equal(focus.title, "Control", "playing always wins over paused and completed records");
assert.equal(continuityFocus({ done: { title: "Stray", completionStatus: "completed" } }), null);

console.log("✅ started-game continuity keeps sessions, progress, and the next active focus deterministic");
