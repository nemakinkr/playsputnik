import { createRequire } from "node:module";

const ROOT = new URL("../", import.meta.url);
const DEFAULT_URL = "http://127.0.0.1:4190/?v=browser-smoke";
const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BUNDLED_NODE_MODULES = "/Users/kirillnemakin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const targetUrl = process.argv.find((arg) => arg.startsWith("http://") || arg.startsWith("https://")) || DEFAULT_URL;
const chromePath = process.env.PLAYSPUTNIK_CHROME || DEFAULT_CHROME;

let browser;
let hardExitCode = 124;
let currentStep = "starting";
const hardTimer = setTimeout(() => {
  console.error(`Browser smoke timed out at step: ${currentStep}.`);
  process.exit(hardExitCode);
}, 45000);

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const bundledRequire = createRequire(`${BUNDLED_NODE_MODULES}/playwright/package.json`);
    return bundledRequire("playwright");
  }
}

function compactText(value, limit = 180) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

async function readDevHealth(page) {
  return page.evaluate(() => ({
    status: document.querySelector("#dev-health-status")?.textContent || "",
    summary: document.querySelector("#dev-health-summary")?.textContent || "",
    rowCount: document.querySelectorAll(".dev-health-row").length,
    ids: [...document.querySelectorAll(".dev-health-row")].map((node) => node.dataset.checkId || ""),
    labels: [...document.querySelectorAll(".dev-health-row strong")].map((node) => node.textContent || ""),
  }));
}

async function waitForDevHealth(page) {
  let health = await readDevHealth(page);
  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (health.rowCount >= 4 && /\d{4}-\d{2}-\d{2}T/.test(health.summary)) return health;
    await page.waitForTimeout(500);
    health = await readDevHealth(page);
  }
  return health;
}

async function closeBrowser() {
  if (!browser) return;
  await Promise.race([
    browser.close().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 1000)),
  ]);
}

try {
  currentStep = "loading playwright";
  const { chromium } = await loadPlaywright();
  currentStep = "launching browser";
  browser = await chromium.launch({
    headless: true,
    executablePath: chromePath,
  });
  currentStep = "opening page";
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  currentStep = "navigating";
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
  currentStep = "settling app";
  await page.waitForTimeout(2500);

  currentStep = "reading dev health";
  const devHealth = await waitForDevHealth(page);
  currentStep = "reading before swipe";
  const before = await page.evaluate(() => ({
    likedCount: document.querySelector("#liked-count")?.textContent || "",
    nextTitle: document.querySelector(".quick-swipe-main strong")?.textContent || "",
    topPick: document.querySelector("#top-pick")?.textContent || "",
    buttons: document.querySelectorAll("[data-swipe-reaction]").length,
    onboardingHero: (() => {
      const hero = document.querySelector("#onboarding-hero");
      const buttons = [...document.querySelectorAll("#onboarding-featured [data-onboard-react]")];
      const valuePath = document.querySelector(".onboarding-value-path");
      if (!hero) return { visible: false, top: 9999, buttons: 0, visibleButtons: 0, valuePathItems: 0, valuePathText: "" };
      const rect = hero.getBoundingClientRect();
      return {
        visible: rect.width > 0 && rect.height > 0 && !hero.classList.contains("is-hidden"),
        top: Math.round(rect.top),
        buttons: buttons.length,
        visibleButtons: buttons.filter((button) => {
          const buttonRect = button.getBoundingClientRect();
          return buttonRect.width > 0 && buttonRect.height > 0;
        }).length,
        valuePathItems: valuePath?.querySelectorAll("span").length || 0,
        valuePathText: valuePath?.textContent?.replace(/\s+/g, " ").trim() || "",
      };
    })(),
    booting: document.body.classList.contains("is-app-booting"),
    bootOverlayHidden: document.querySelector("#app-boot-overlay")?.hidden === true,
  }));

  currentStep = "clicking swipe";
  await page.evaluate(() => document.querySelector('[data-swipe-reaction="loved"]')?.click());
  currentStep = "settling swipe";
  await page.waitForTimeout(500);

  currentStep = "reading after swipe";
  const after = await page.evaluate(() => ({
    likedCount: document.querySelector("#liked-count")?.textContent || "",
    undo: document.querySelector(".quick-swipe-undo")?.textContent || "",
    undoPresent: Boolean(document.querySelector(".quick-swipe-undo [data-undo-last]")),
    nextTitle: document.querySelector(".quick-swipe-main strong")?.textContent || "",
  }));

  const result = {
    mode: "browser-smoke",
    url: targetUrl,
    before: {
      ...before,
      topPick: compactText(before.topPick),
    },
    devHealth,
    after: {
      ...after,
      undo: compactText(after.undo),
    },
    errors,
  };

  currentStep = "asserting";
  if (before.buttons !== 3) throw new Error(`Expected 3 swipe buttons, got ${before.buttons}`);
  if (!before.onboardingHero.visible) throw new Error("Expected visible first-run onboarding hero on a clean profile");
  if (before.onboardingHero.top > 900) throw new Error(`Expected onboarding hero in first viewport, got top ${before.onboardingHero.top}`);
  if (before.onboardingHero.buttons !== 3 || before.onboardingHero.visibleButtons !== 3) {
    throw new Error(`Expected 3 visible onboarding reaction buttons, got ${JSON.stringify(before.onboardingHero)}`);
  }
  if (before.onboardingHero.valuePathItems !== 3 || !/Taste|Вкус/.test(before.onboardingHero.valuePathText)) {
    throw new Error(`Expected onboarding value path to explain first payoff, got ${JSON.stringify(before.onboardingHero)}`);
  }
  if (before.booting || !before.bootOverlayHidden) throw new Error("App should unlock only after runtime handlers are ready");
  if (before.likedCount !== "0/30") throw new Error(`Expected clean onboarding 0/30, got ${before.likedCount}`);
  if (devHealth.rowCount < 4) throw new Error(`Expected 4 dev health rows, got ${devHealth.rowCount}`);
  if (!/\d{4}-\d{2}-\d{2}T/.test(devHealth.summary)) throw new Error(`Dev health snapshot did not load: ${devHealth.summary}`);
  for (const id of ["preview_server", "data_health", "browser_smoke", "provider_endpoint"]) {
    if (!devHealth.ids.includes(id)) throw new Error(`Dev health is missing ${id}`);
  }
  if (after.likedCount !== "1/30") throw new Error(`Expected swipe to move count to 1/30, got ${after.likedCount}`);
  if (!after.undoPresent) throw new Error("Expected quick swipe undo after DOM click");
  if (errors.length) throw new Error(`Page errors: ${errors.join("; ")}`);

  currentStep = "printing result";
  console.log(JSON.stringify(result, null, 2));
  hardExitCode = 0;
  clearTimeout(hardTimer);
  currentStep = "closing browser";
  await closeBrowser();
  process.exit(0);
} catch (error) {
  console.error(error);
  hardExitCode = 1;
  clearTimeout(hardTimer);
  await closeBrowser();
  process.exit(1);
}
