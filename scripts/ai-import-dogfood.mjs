import { readFile, writeFile } from "node:fs/promises";

const origin = String(
  process.env.PLAYSPUTNIK_API_ORIGIN
    || process.argv.find((argument) => argument.startsWith("https://"))
    || "https://playsputnik-api.playsputnik.workers.dev",
).replace(/\/+$/, "");
const writeReport = process.argv.includes("--write");
const appOrigin = "https://nemakinkr.github.io";

function titleKey(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

function cleanRankedTitle(line) {
  return String(line || "")
    .replace(/[❤️]/gu, "")
    .replace(/[♻➕✅]/gu, "")
    .replace(/^(?:[0-9]\uFE0F?\u20E3)+\s*/u, "")
    .replace(/^\s*#?\d{1,3}[.)]\s+/, "")
    .trim();
}

async function requestImport(testCase) {
  const startedAt = Date.now();
  const response = await fetch(`${origin}/api/taste-import`, {
    method: "POST",
    headers: { Origin: appOrigin, "Content-Type": "application/json" },
    body: JSON.stringify({
      schemaVersion: "ai-taste-import-v1",
      locale: "ru",
      text: testCase.text,
      context: { orderedRanking: Boolean(testCase.orderedRanking) },
    }),
    signal: AbortSignal.timeout(35000),
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, durationMs: Date.now() - startedAt, data };
}

function entryMap(entries) {
  return new Map((entries || []).map((entry) => [titleKey(entry.title), entry]));
}

function check(condition, message, failures) {
  if (!condition) failures.push(message);
}

const founderText = await readFile(new URL("../test/fixtures/founder-ranking-ru.txt", import.meta.url), "utf8");
const founderTitles = founderText.split(/\n/).map(cleanRankedTitle).filter(Boolean);
const cases = [
  { id: "founder-111", text: founderText, orderedRanking: true },
  {
    id: "mixed-memory",
    text: "Прошел Control, очень понравилось, 9/10. Сейчас играю в Stray. Baldur's Gate 3 лежит в вишлисте, но пока не покупал. Death Stranding бросил, не мое.",
  },
  {
    id: "ambiguous-discussion",
    text: "Вчера обсуждали Alan Wake 2 и Control. В Control я играл и люблю ее, а Alan Wake 2 только советовали друзья. Цена 40 евро относилась вообще к ужину, не к игре.",
  },
  {
    id: "contradictory-sentiment",
    text: "В Cyberpunk 2077 мне понравилась история, но не понравился геймплей; оценку не ставлю. Elden Ring не играл.",
  },
];

const results = [];
for (const testCase of cases) {
  const response = await requestImport(testCase);
  const failures = [];
  const entries = response.data.entries || [];
  const byTitle = entryMap(entries);
  check(response.status === 200, `HTTP ${response.status}: ${response.data.error || "unknown error"}`, failures);

  if (testCase.id === "founder-111") {
    check(entries.length === founderTitles.length, `expected ${founderTitles.length} entries, got ${entries.length}`, failures);
    check(entries.every((entry, index) => entry.rank === index + 1), "ranking order was not preserved", failures);
    check(entries.every((entry) => entry.rating === null && entry.status === "unknown" && entry.sentiment === "unknown"), "platform markers became invented taste facts", failures);
    check(titleKey(entries[0]?.title) === titleKey(founderTitles[0]), "first ranked title changed", failures);
    check(titleKey(entries.at(-1)?.title) === titleKey(founderTitles.at(-1)), "last ranked title changed", failures);
  }

  if (testCase.id === "mixed-memory") {
    const control = byTitle.get(titleKey("Control"));
    const stray = byTitle.get(titleKey("Stray"));
    const baldursGate = byTitle.get(titleKey("Baldur's Gate 3"));
    const deathStranding = byTitle.get(titleKey("Death Stranding"));
    check(entries.length === 4, `expected four explicit games, got ${entries.length}`, failures);
    check(control?.rating === 9 && control?.status === "completed", "Control rating/completion was lost", failures);
    check(stray?.status === "playing", "Stray playing state was lost", failures);
    check(baldursGate?.status === "wishlist", "Baldur's Gate 3 wishlist state was lost", failures);
    check(deathStranding?.status === "dropped" && deathStranding?.sentiment === "disliked", "Death Stranding drop/dislike was lost", failures);
    check(entries.every((entry) => entry.rank === null), "mention order became a fabricated ranking", failures);
  }

  if (testCase.id === "ambiguous-discussion") {
    const control = byTitle.get(titleKey("Control"));
    check(entries.length === 1 && Boolean(control), `expected only explicit Control sentiment, got ${entries.map((entry) => entry.title).join(", ")}`, failures);
    check(control?.rating === null && control?.status === "unknown" && control?.rank === null, "discussion invented Control rating, ownership, or rank", failures);
    check(control?.sentiment === "loved", "explicit love for Control was lost", failures);
    check(!byTitle.has(titleKey("Alan Wake 2")), "a friend's Alan Wake 2 recommendation became player memory", failures);
  }

  if (testCase.id === "contradictory-sentiment") {
    const cyberpunk = byTitle.get(titleKey("Cyberpunk 2077"));
    check(entries.length === 1 && Boolean(cyberpunk), `expected only Cyberpunk 2077, got ${entries.map((entry) => entry.title).join(", ")}`, failures);
    check(cyberpunk?.sentiment === "mixed", "explicitly contradictory Cyberpunk sentiment was not preserved", failures);
    check(cyberpunk?.rating === null && cyberpunk?.rank === null, "no-rating statement became a numeric rating or rank", failures);
    check(!byTitle.has(titleKey("Elden Ring")), "an unplayed game became taste memory", failures);
  }

  results.push({
    id: testCase.id,
    status: response.status,
    durationMs: response.durationMs,
    provider: response.data.provider || "",
    model: response.data.model || "",
    entryCount: entries.length,
    failures,
  });
}

const report = {
  mode: "ai-import-production-dogfood",
  generatedAt: new Date().toISOString(),
  origin,
  summary: {
    cases: results.length,
    passed: results.filter((result) => result.failures.length === 0).length,
    failed: results.filter((result) => result.failures.length > 0).length,
    maxDurationMs: Math.max(...results.map((result) => result.durationMs)),
  },
  results,
};

if (writeReport) {
  await writeFile(new URL("../reports/ai-import-dogfood.json", import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
}

console.log(JSON.stringify(report, null, 2));
if (report.summary.failed) process.exitCode = 1;
