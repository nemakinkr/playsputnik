import { createRequire } from "node:module";

const DEFAULT_URL = "http://127.0.0.1:4190/?v=game-detail-smoke";
const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BUNDLED_NODE_MODULES = "/Users/kirillnemakin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const targetUrl = process.argv.find((arg) => arg.startsWith("http://") || arg.startsWith("https://")) || DEFAULT_URL;
const chromePath = process.env.PLAYSPUTNIK_CHROME || DEFAULT_CHROME;
const STORAGE_KEY = "playsputnik.prototype.state.v2";

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const bundledRequire = createRequire(`${BUNDLED_NODE_MODULES}/playwright/package.json`);
    return bundledRequire("playwright");
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
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
  await page.route("**/*", (route) => {
    if (route.request().resourceType() === "image") {
      route.abort();
      return;
    }
    route.continue();
  });

  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForFunction(() => window.__playsputnikBoot?.coreRenderedAt, null, { timeout: 10000 });
  await page.waitForFunction(() => document.querySelector("[data-hero-detail]"), null, { timeout: 10000 });

  await page.evaluate(() => document.querySelector("[data-hero-detail]")?.click());
  await page.waitForFunction(() => document.querySelector("#game-detail")?.getAttribute("aria-hidden") === "false", null, { timeout: 5000 });

  const before = await page.evaluate(() => ({
    title: document.querySelector("#game-detail-title")?.textContent || "",
    meta: document.querySelector("#game-detail-meta")?.textContent || "",
    statusCards: document.querySelectorAll(".detail-status-card").length,
    cockpit: document.querySelectorAll("[data-detail-cockpit]").length,
    tasteFit: document.querySelectorAll("[data-detail-taste-fit]").length,
    atomMap: document.querySelectorAll("[data-detail-atom-map]").length,
    sourceTrust: document.querySelectorAll("[data-detail-source-trust]").length,
    playProfile: document.querySelectorAll("[data-detail-play-profile]").length,
    difficulty: document.querySelector("[data-detail-difficulty]")?.textContent?.trim() || "",
    intensity: document.querySelector("[data-detail-intensity]")?.textContent?.trim() || "",
    intensityConfidence: document.querySelector("[data-detail-intensity-confidence]")?.textContent?.trim() || "",
    sourceRows: document.querySelectorAll(".detail-source-row").length,
    atomSignals: document.querySelectorAll(".detail-atom-signal").length,
    primaryCta: document.querySelector("[data-detail-primary-action]")?.textContent?.trim() || "",
    primaryKind: document.querySelector("[data-detail-primary-action]")?.dataset.primaryKind || "",
    primaryState: document.querySelector("[data-detail-primary-action]")?.dataset.primaryState || "",
    actionButtons: document.querySelectorAll("[data-detail-state]").length,
    facts: document.querySelectorAll(".game-detail-section .fact").length,
    atoms: document.querySelectorAll(".game-detail-atoms span").length,
    source: document.querySelector(".game-detail-cover-source")?.textContent || "",
    hidden: document.querySelector("#game-detail")?.getAttribute("aria-hidden"),
    closeButtons: document.querySelectorAll("[data-detail-close]").length,
    entryPoints: {
      hero: document.querySelectorAll("[data-hero-detail]").length,
      cards: document.querySelectorAll('[data-action="detail"]').length,
      visual: document.querySelectorAll("[data-visual-detail]").length,
      memory: document.querySelectorAll("[data-memory-detail]").length,
      wishlist: document.querySelectorAll("[data-wishlist-detail]").length,
    },
  }));

  await page.evaluate(() => document.querySelector("[data-detail-primary-action]")?.click());
  await page.waitForTimeout(500);

  const afterPrimary = await page.evaluate((key) => {
    const title = document.querySelector("#game-detail-title")?.textContent || "";
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const record = Object.values(state.userGames || {}).find((item) => item.title === title);
    return {
      title,
      access: record?.access || "",
      completionStatus: record?.completionStatus || "",
      saved: Boolean(record?.saved),
      primaryCta: document.querySelector("[data-detail-primary-action]")?.textContent?.trim() || "",
    };
  }, STORAGE_KEY);

  await page.evaluate(() => document.querySelector('[data-detail-state="playing"]')?.click());
  await page.waitForTimeout(500);

  const afterAction = await page.evaluate((key) => {
    const title = document.querySelector("#game-detail-title")?.textContent || "";
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const record = Object.values(state.userGames || {}).find((item) => item.title === title);
    return {
      title,
      completionStatus: record?.completionStatus || "",
      activeButton: document.querySelector('[data-detail-state="playing"]')?.classList.contains("is-active") || false,
      hidden: document.querySelector("#game-detail")?.getAttribute("aria-hidden"),
    };
  }, STORAGE_KEY);

  await page.keyboard.press("Escape");
  await page.waitForTimeout(100);
  await page.evaluate(() => {
    const drawer = document.querySelector("#game-detail");
    if (drawer?.getAttribute("aria-hidden") !== "true") {
      document.querySelector("[data-detail-close]")?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    }
  });
  await page.waitForTimeout(300);
  const afterClose = await page.evaluate(() => ({
    hidden: document.querySelector("#game-detail")?.getAttribute("aria-hidden"),
    className: document.querySelector("#game-detail")?.className || "",
    closeButtons: document.querySelectorAll("[data-detail-close]").length,
    display: window.getComputedStyle(document.querySelector("#game-detail")).display,
  }));

  const result = { mode: "game-detail-smoke", url: targetUrl, before, afterPrimary, afterAction, afterClose, errors };
  console.log(JSON.stringify(result, null, 2));

  assert(before.title, "Expected detail drawer title");
  assert(/fit|совпадение/i.test(before.meta), `Expected localized fit metadata, got ${before.meta}`);
  assert(before.statusCards >= 4, `Expected status cards, got ${before.statusCards}`);
  assert(before.cockpit === 1, "Expected detail decision cockpit");
  assert(before.tasteFit === 1, "Expected detail taste fit block");
  assert(before.atomMap === 1, "Expected detail atom signal map");
  assert(before.sourceTrust === 1, "Expected detail data trust block");
  assert(before.playProfile === 1, "Expected difficulty/intensity play profile");
  assert(before.difficulty && before.intensity && before.intensityConfidence, "Expected localized difficulty, intensity and confidence values");
  assert(before.sourceRows >= 4, `Expected source trust rows, got ${before.sourceRows}`);
  assert(before.atomSignals >= 1, `Expected atom signal chips, got ${before.atomSignals}`);
  assert(before.primaryCta, "Expected smart primary CTA");
  assert(["state", "url"].includes(before.primaryKind), `Expected primary CTA kind, got ${before.primaryKind}`);
  assert(
    before.primaryKind === "url" || afterPrimary.access || afterPrimary.completionStatus || afterPrimary.saved,
    "Expected state primary CTA to update game memory",
  );
  assert(before.actionButtons >= 6, `Expected detail action buttons, got ${before.actionButtons}`);
  assert(before.facts >= 2, `Expected detail facts, got ${before.facts}`);
  assert(before.atoms >= 1, `Expected detail atoms, got ${before.atoms}`);
  assert(before.source, "Expected cover source copy");
  assert(before.closeButtons >= 2, `Expected close controls, got ${before.closeButtons}`);
  assert(before.entryPoints.hero >= 1, "Expected hero detail entry point");
  assert(afterAction.completionStatus === "playing", `Expected playing state, got ${afterAction.completionStatus}`);
  assert(afterAction.activeButton, "Expected Play action to become active");
  assert(afterClose.hidden === "true" && afterClose.display === "none", "Expected drawer to close");
  assert(errors.length === 0, `Page errors: ${errors.join("; ")}`);
} finally {
  await browser.close();
}
