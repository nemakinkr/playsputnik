import { createRequire } from "node:module";

const DEFAULT_URL = "http://127.0.0.1:4190/?v=visual-catalog-smoke";
const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BUNDLED_NODE_MODULES = "/Users/kirillnemakin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const targetUrl = process.argv.find((arg) => arg.startsWith("http://") || arg.startsWith("https://")) || DEFAULT_URL;
const chromePath = process.env.PLAYSPUTNIK_CHROME || DEFAULT_CHROME;

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const bundledRequire = createRequire(`${BUNDLED_NODE_MODULES}/playwright/package.json`);
    return bundledRequire("playwright");
  }
}

const { chromium } = await loadPlaywright();
const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
});

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.evaluate(() => localStorage.removeItem("playsputnik.prototype.state.v2"));
  await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(1500);

  const before = await page.evaluate(() => ({
    activeShelf: document.querySelector("[data-visual-shelf].is-active")?.dataset.visualShelf,
    cards: document.querySelectorAll(".visual-catalog-card").length,
    metrics: document.querySelector("#visual-catalog-metrics")?.textContent?.replace(/\s+/g, " ").trim(),
    status: document.querySelector("#visual-catalog-status")?.textContent,
  }));

  await page.click('[data-visual-shelf="catalog"]');
  await page.waitForFunction(() => document.querySelector('[data-visual-shelf="catalog"]')?.classList.contains("is-active"), null, { timeout: 5000 });

  const firstTitle = await page.locator(".visual-catalog-card").first().evaluate((node) => node.dataset.visualTitle);
  const catalog = await page.evaluate(() => ({
    activeShelf: document.querySelector("[data-visual-shelf].is-active")?.dataset.visualShelf,
    cards: document.querySelectorAll(".visual-catalog-card").length,
    summary: document.querySelector("#visual-catalog-summary")?.textContent,
  }));

  await page.locator(".visual-catalog-card").first().locator('[data-visual-state="playing"]').click();
  await page.waitForTimeout(500);

  const after = await page.evaluate((title) => {
    const state = JSON.parse(localStorage.getItem("playsputnik.prototype.state.v2") || "{}");
    const record = Object.values(state.userGames || {}).find((item) => item.title === title);
    const legacy = Object.values(state.userStates || {}).find((item) => item.title === title);
    const card = [...document.querySelectorAll(".visual-catalog-card")].find((node) => node.dataset.visualTitle === title);
    return {
      title,
      savedRecord: Boolean(record),
      legacyState: legacy?.state || "",
      activeButton: card?.querySelector('[data-visual-state="playing"]')?.getAttribute("aria-pressed") || "",
    };
  }, firstTitle);

  const result = { mode: "visual-catalog-smoke", url: targetUrl, before, catalog, firstTitle, after, errors };
  console.log(JSON.stringify(result, null, 2));

  if (before.activeShelf !== "smart") throw new Error(`Expected smart shelf before click, got ${before.activeShelf}`);
  if (catalog.activeShelf !== "catalog") throw new Error(`Expected catalog shelf after click, got ${catalog.activeShelf}`);
  if (catalog.cards < 18) throw new Error(`Expected at least 18 catalog cards, got ${catalog.cards}`);
  if (!after.savedRecord || after.legacyState !== "playing") throw new Error(`Expected ${firstTitle} to be saved as playing`);
  if (after.activeButton !== "true") throw new Error("Expected Playing action to become active");
  if (errors.length) throw new Error(`Page errors: ${errors.join("; ")}`);
} finally {
  await browser.close();
}
