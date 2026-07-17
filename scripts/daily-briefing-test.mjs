import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/app-briefing.js", import.meta.url), "utf8");
const context = { window: {}, Date, Set };
vm.runInNewContext(source, context, { filename: "src/app-briefing.js" });
const { buildDailyBriefing } = context.window.PlaySputnikBriefing;
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

console.log("✅ daily briefing combines active play, library, radar, and wishlist without duplicate decisions");
