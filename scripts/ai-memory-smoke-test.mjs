import { createRequire } from "node:module";

const DEFAULT_URL = "http://127.0.0.1:4190/?v=ai-memory-smoke";
const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BUNDLED_NODE_MODULES = "/Users/kirillnemakin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const targetUrl = process.argv.find((arg) => arg.startsWith("http://") || arg.startsWith("https://")) || DEFAULT_URL;

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    return createRequire(`${BUNDLED_NODE_MODULES}/playwright/package.json`)("playwright");
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const { chromium } = await loadPlaywright();
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYSPUTNIK_CHROME || DEFAULT_CHROME,
});

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.evaluate(() => localStorage.removeItem("playsputnik.prototype.state.v2"));
  await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForSelector("#top-pick:not(:empty)", { timeout: 15000 });

  await page.click("#settings-toggle");
  await page.fill("#rating-import", "Control - 9/10\nStray - completed");
  const before = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("playsputnik.prototype.state.v2") || "{}");
    return { ratings: state.importedRatings?.length || 0, games: Object.keys(state.userGames || {}).length };
  });
  await page.click("#analyze-ratings");
  await page.waitForSelector("[data-ai-import-draft]", { timeout: 15000 });

  const draft = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("playsputnik.prototype.state.v2") || "{}");
    return {
      ratings: state.importedRatings?.length || 0,
      games: Object.keys(state.userGames || {}).length,
      draftCount: state.aiImportDraft?.entries?.length || 0,
      confirmVisible: !document.querySelector("#confirm-ai-import")?.hidden,
    };
  });
  assert(draft.ratings === before.ratings && draft.games === before.games, "AI draft mutated confirmed memory before review");
  assert(draft.draftCount === 2 && draft.confirmVisible, "AI review draft did not expose both parsed games and confirmation");

  await page.uncheck('[data-ai-import-entry="1"]');
  await page.click("#confirm-ai-import");
  await page.waitForFunction(() => {
    const state = JSON.parse(localStorage.getItem("playsputnik.prototype.state.v2") || "{}");
    return !state.aiImportDraft && Object.values(state.userGames || {}).some((game) => game.title === "Control" && game.rating === 90);
  }, null, { timeout: 15000 });

  const confirmed = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("playsputnik.prototype.state.v2") || "{}");
    return {
      control: Object.values(state.userGames || {}).find((game) => game.title === "Control") || null,
      stray: Object.values(state.userGames || {}).find((game) => game.title === "Stray") || null,
      draft: state.aiImportDraft,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });
  assert(confirmed.control?.rating === 90, "Confirmed AI rating was not stored");
  assert(!confirmed.stray, "An excluded AI draft row entered confirmed memory");
  assert(confirmed.draft === null, "Confirmed AI draft was not cleared");
  assert(!confirmed.overflow, "AI import review creates horizontal overflow at 390px");
  assert(errors.length === 0, `Browser errors: ${errors.join("; ")}`);

  console.log(JSON.stringify({ mode: "ai-memory-smoke", before, draft, confirmed, errors }, null, 2));
} finally {
  await browser.close();
}
