import { createRequire } from "node:module";

const DEFAULT_URL = "http://127.0.0.1:4190/?v=import-resolution-smoke";
const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BUNDLED_NODE_MODULES = "/Users/kirillnemakin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const STORAGE_KEY = "playsputnik.prototype.state.v2";
const targetUrl = process.argv.find((arg) => arg.startsWith("http://") || arg.startsWith("https://")) || DEFAULT_URL;
const chromePath = process.env.PLAYSPUTNIK_CHROME || DEFAULT_CHROME;

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
const browser = await chromium.launch({ headless: true, executablePath: chromePath });

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/search**", async (route) => {
    const query = new URL(route.request().url()).searchParams.get("q") || "";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        mode: "provider_live",
        provider: "rawg",
        query,
        resultShapeVersion: "search-result-v3",
        sourceHealth: "live_results",
        checkedAt: "2026-07-13T12:00:00.000Z",
        results: [{
          title: "Codex Test Adventure",
          sourceId: "rawg_provider_hook",
          catalogStatus: "provider_result",
          matchConfidence: "high",
          matchKind: "exact",
          coverStatus: "candidate",
          priceStatus: "missing",
          provider: "rawg",
          sourceUrl: "https://rawg.io/games/codex-test-adventure",
          coverUrl: "https://media.rawg.io/media/games/test.jpg",
          platforms: ["PlayStation 5"],
          atoms: ["story", "exploration"],
          inferredAtoms: ["story", "exploration"],
          session: "medium",
          length: "short",
          difficulty: "normal",
          commitment: "low",
          tone: "moody",
          content: "low-violence",
          reviewBurden: "low",
          adultTimeFit: "weeknight",
          inferenceProfile: { version: "rawg-inference-v1", status: "inferred", confidence: "medium", fields: {} },
          vibe: "A short story adventure.",
          reason: "Provider metadata candidate.",
          score: 100,
        }],
      }),
    });
  });
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForFunction(() => window.__playsputnikBoot?.coreRenderedAt, null, { timeout: 10000 });
  await page.locator("#rating-import").fill("Codex Test Adventure - 9/10");
  await page.locator("#analyze-ratings").click();
  await page.waitForSelector("#confirm-ai-import:not([hidden])", { timeout: 15000 });
  await page.locator("#confirm-ai-import").click();
  await page.waitForFunction((key) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    return Object.values(state.userGames || {}).some((game) => game.title === "Codex Test Adventure" && game.rating === 90);
  }, STORAGE_KEY, { timeout: 15000 });

  const result = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const game = Object.values(state.userGames || {}).find((item) => item.title === "Codex Test Adventure");
    return {
      stateVersion: state.stateVersion,
      summary: state.importLookupBatchSummary,
      game,
      imported: (state.importedRatings || []).find((item) => item.title === "Codex Test Adventure"),
    };
  }, STORAGE_KEY);
  assert(errors.length === 0, `page errors: ${errors.join(" | ")}`);
  assert(result.stateVersion === 10, `expected schema v10, got ${result.stateVersion}`);
  assert(result.summary?.status === "complete", `expected complete batch, got ${result.summary?.status}`);
  assert(result.game?.providerImport?.provider === "rawg", "expected RAWG passport to persist");
  assert(result.game?.rating === 90, "expected imported rating semantics to persist");
  assert(result.game?.saved === false, "rating import must not silently become a wishlist item");
  assert(result.imported?.trusted, "resolved provider rating should enter the trusted imported baseline");
  console.log("✅ unknown ranked title auto-resolves through RAWG without becoming wishlist intent");
} finally {
  await browser.close();
}
