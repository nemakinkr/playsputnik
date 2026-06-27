import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

const DEFAULT_URL = "http://127.0.0.1:4190/?v=design-smoke";
const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BUNDLED_NODE_MODULES = "/Users/kirillnemakin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const targetUrl = process.argv.find((arg) => arg.startsWith("http://") || arg.startsWith("https://")) || DEFAULT_URL;
const chromePath = process.env.PLAYSPUTNIK_CHROME || DEFAULT_CHROME;

let browser;
let hardExitCode = 124;
let currentStep = "starting";
const hardTimer = setTimeout(() => {
  console.error(`Design smoke timed out at step: ${currentStep}.`);
  process.exit(hardExitCode);
}, 90000);

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const bundledRequire = createRequire(`${BUNDLED_NODE_MODULES}/playwright/package.json`);
    return bundledRequire("playwright");
  }
}

async function closeBrowser() {
  if (!browser) return;
  await Promise.race([
    browser.close().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 1000)),
  ]);
}

const viewports = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "mobile", width: 390, height: 900 },
];
const results = [];

try {
  currentStep = "loading playwright";
  const { chromium } = await loadPlaywright();
  currentStep = "launching browser";
  browser = await chromium.launch({
    headless: true,
    executablePath: chromePath,
  });

  for (const viewport of viewports) {
    currentStep = `opening ${viewport.name}`;
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    currentStep = `navigating ${viewport.name}`;
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    currentStep = `settling ${viewport.name}`;
    await page.waitForTimeout(2500);

    const screenshot = join(tmpdir(), `playsputnik-design-${viewport.name}.png`);
    currentStep = `screenshot ${viewport.name}`;
    await page.screenshot({ path: screenshot, fullPage: false, timeout: 20000 });
    currentStep = `metrics ${viewport.name}`;
    const metrics = await page.evaluate(() => {
      const rectFrom = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          top: Math.round(rect.top),
          left: Math.round(rect.left),
        };
      };
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        hero: rectFrom(".hero-card"),
        quickSwipe: rectFrom(".quick-swipe-card"),
        appNav: rectFrom(".app-view-nav"),
        visualCatalog: rectFrom(".visual-catalog-panel"),
        decisionSurface: rectFrom(".decision-surface"),
        firstRun: rectFrom(".first-run-panel"),
        visualCards: document.querySelectorAll(".visual-catalog-card").length,
        appNavButtons: document.querySelectorAll(".app-view-nav [data-app-view]").length,
        appNavOverflow: (() => {
          const nav = document.querySelector(".app-view-nav");
          return nav ? nav.scrollWidth > nav.clientWidth + 1 : true;
        })(),
      };
    });

    if (metrics.scrollWidth > metrics.clientWidth + 1) {
      throw new Error(`${viewport.name} has horizontal overflow: ${metrics.scrollWidth} > ${metrics.clientWidth}`);
    }
    if (!metrics.hero || metrics.hero.height < 220) {
      throw new Error(`${viewport.name} top recommendation is too small or missing`);
    }
    const onboardingSurface = [metrics.quickSwipe, metrics.firstRun].find((item) => item && item.height > 0);
    if (!onboardingSurface || onboardingSurface.height < 180) {
      throw new Error(`${viewport.name} onboarding surface is too small or missing`);
    }
    if (!metrics.appNav || metrics.appNavButtons < 8) {
      throw new Error(`${viewport.name} app navigation is missing tabs`);
    }
    if (metrics.appNavOverflow) {
      throw new Error(`${viewport.name} app navigation has horizontal overflow`);
    }
    if (!metrics.visualCatalog || metrics.visualCards < 6) {
      throw new Error(`${viewport.name} visual catalog is missing poster cards`);
    }
    if (errors.length) throw new Error(`${viewport.name} page errors: ${errors.join("; ")}`);

    const visualCatalogScreenshot = join(tmpdir(), `playsputnik-visual-catalog-${viewport.name}.png`);
    currentStep = `visual catalog screenshot ${viewport.name}`;
    await page.locator(".visual-catalog-panel").screenshot({ path: visualCatalogScreenshot, timeout: 30000 });

    results.push({ viewport, screenshot, visualCatalogScreenshot, metrics, errors });
    await page.close();
  }

  currentStep = "printing result";
  console.log(JSON.stringify({ mode: "design-smoke", url: targetUrl, results }, null, 2));
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
