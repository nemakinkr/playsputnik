/* Perf budget: render time with a POPULATED profile.
 *
 * Lesson learned the hard way: an empty profile hid two O(feedback × catalog ×
 * aliases) hotspots that made real-user renders take ~10s. This test seeds a
 * realistic profile (ratings + states + feedback log) BEFORE measuring, so
 * that bug class can never ship silently again.
 *
 * Usage: node scripts/perf-budget-test.mjs [url]   (default http://127.0.0.1:7432)
 * Fails (exit 1) if avg render exceeds BUDGET_MS.
 */
import { createRequire } from "node:module";

const BUDGET_MS = 800; // generous headroom over the ~53ms baseline
const DEFAULT_URL = "http://127.0.0.1:7432/?v=perf-budget";
const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BUNDLED_NODE_MODULES = "/Users/kirillnemakin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";

const targetUrl = process.argv.find((a) => a.startsWith("http")) || DEFAULT_URL;
const chromePath = process.env.PLAYSPUTNIK_CHROME || DEFAULT_CHROME;

const hardTimer = setTimeout(() => {
  console.error("Perf budget test timed out.");
  process.exit(124);
}, 60000);

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    return createRequire(`${BUNDLED_NODE_MODULES}/playwright/package.json`)("playwright");
  }
}

const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ executablePath: chromePath, headless: true });
try {
  const page = await browser.newPage();
  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#top-pick")?.innerHTML.trim().length > 0, { timeout: 20000 });

  const result = await page.evaluate(() => {
    // Seed a realistic profile: 8 graded ratings + 2 active states
    ["Hades", "Stray", "Bloodborne", "Celeste", "INSIDE", "Tunic", "Returnal", "Control Ultimate Edition"]
      .forEach((t, i) => setGameRating(t, ((i % 5) + 1) * 20));
    setGameState("Portal 2", "completed");
    setGameState("DOOM Eternal", "playing");
    render();

    // Warm, then measure
    render(); render();
    const t0 = performance.now();
    for (let i = 0; i < 5; i++) render();
    const avgMs = (performance.now() - t0) / 5;

    return {
      avgMs: Math.round(avgMs * 10) / 10,
      feedbackEvents: state.feedbackLog.length,
      poolSize: recommendationPool().length,
      errors: window.__playsputnikErrors || [],
    };
  });

  console.log(`Render with populated profile: ${result.avgMs}ms avg (budget ${BUDGET_MS}ms)`);
  console.log(`  feedback events: ${result.feedbackEvents}, pool: ${result.poolSize}`);
  if (result.errors.length) {
    console.error("  runtime errors:", result.errors);
    process.exit(1);
  }
  if (result.avgMs > BUDGET_MS) {
    console.error(`❌ PERF BUDGET EXCEEDED: ${result.avgMs}ms > ${BUDGET_MS}ms`);
    process.exit(1);
  }
  console.log("✅ Perf budget OK");
} finally {
  clearTimeout(hardTimer);
  await browser.close();
}
