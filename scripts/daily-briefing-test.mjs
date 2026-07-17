import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/app-briefing.js", import.meta.url), "utf8");
const context = { window: {}, Date, Set };
vm.runInNewContext(source, context, { filename: "src/app-briefing.js" });
const {
  normalizeDailyBriefingProgress,
  recordBriefingAction,
  finishDailyBriefing,
  buildDailyBriefing,
} = context.window.PlaySputnikBriefing;
const titleKey = (title) => String(title || "").toLowerCase();

const briefing = buildDailyBriefing({
  date: "2026-07-17",
  activeRecords: [{ title: "Control", completionStatus: "playing" }, { title: "Alan Wake 2", completionStatus: "paused" }],
  focusRecord: { title: "Control", completionStatus: "playing", playProgress: { sessionCount: 3 } },
  libraryCandidates: [{ title: "Control", session: "medium" }, { title: "Bramble", session: "short", score: 80 }],
  radarItems: [{ title: "Fable", releaseDate: "2027-02-23", source: "rawg", evidence: { matchedAtoms: ["story", "rpg"] } }],
  wishlistRecords: [{ game: { title: "Mafia" }, briefingDecision: { tone: "wait", label: "Wait", detail: "Price is above target." } }],
  sessionMinutes: 45,
  titleKey,
});

assert.equal(briefing.date, "2026-07-17");
assert.equal(briefing.activeCount, 2);
assert.deepEqual([...briefing.items].map((item) => item.kind), ["continue", "library", "radar", "wishlist"]);
assert.deepEqual([...briefing.items].map((item) => item.title), ["Control", "Bramble", "Fable", "Mafia"]);
assert.equal(briefing.items[0].sessionMinutes, 45);
assert.equal(briefing.items[2].matchCount, 2);
assert.equal(new Set(briefing.items.map((item) => titleKey(item.title))).size, briefing.itemCount, "briefing must not duplicate a title across surfaces");

const afterControl = recordBriefingAction(null, briefing.items[0], "continued", {
  date: "2026-07-17", at: "2026-07-17T18:00:00.000Z", titleKey,
});
const adapted = buildDailyBriefing({
  date: "2026-07-17",
  activeRecords: [{ title: "Control", completionStatus: "playing" }, { title: "Alan Wake 2", completionStatus: "paused" }],
  focusRecord: { title: "Control", completionStatus: "playing" },
  libraryCandidates: [{ title: "Bramble", session: "short", score: 80 }],
  radarItems: [{ title: "Fable", releaseDate: "2027-02-23" }],
  wishlistRecords: [{ game: { title: "Mafia" }, briefingDecision: { tone: "wait", label: "Wait", detail: "Wait." } }],
  progress: afterControl,
  titleKey,
});
assert.equal(adapted.items[0].title, "Alan Wake 2", "completed active move should be replaced by the next active game");
assert.equal(adapted.completedCount, 1);

const afterLibrary = recordBriefingAction(afterControl, { kind: "library", title: "Bramble" }, "started", {
  date: "2026-07-17", at: "2026-07-17T18:30:00.000Z", titleKey,
});
const noSameDayRepeat = buildDailyBriefing({
  date: "2026-07-17",
  activeRecords: [{ title: "Bramble", completionStatus: "playing" }],
  focusRecord: { title: "Bramble", completionStatus: "playing" },
  libraryCandidates: [{ title: "Bramble", session: "short" }, { title: "Stray", session: "short" }],
  progress: afterLibrary,
  titleKey,
});
assert(!noSameDayRepeat.items.some((item) => item.title === "Bramble"), "a started library game must not immediately return as another move today");

const finishedProgress = finishDailyBriefing(afterControl, { date: "2026-07-17", at: "2026-07-17T20:00:00.000Z" });
const finished = buildDailyBriefing({ date: "2026-07-17", activeRecords: [], progress: finishedProgress, titleKey });
assert.equal(finished.items.length, 0);
assert.equal(finished.completedCount, 1);
assert.equal(finished.completedAt, "2026-07-17T20:00:00.000Z");
assert.deepEqual(
  JSON.parse(JSON.stringify(normalizeDailyBriefingProgress(finishedProgress, "2026-07-18"))),
  { date: "2026-07-18", actions: [], completedAt: null },
  "a new day must start with a clean agenda",
);

console.log("✅ daily briefing adapts after actions, wraps the day, and resets on the next date");
