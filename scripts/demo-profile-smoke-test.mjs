import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

const DEFAULT_URL = "http://127.0.0.1:4190/?v=demo-profile-smoke";
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const { chromium } = await loadPlaywright();
const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
});

try {
  const context = await browser.newContext({
    serviceWorkers: "block",
    viewport: { width: 390, height: 900 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (/ERR_CONNECTION_REFUSED|ERR_INTERNET_DISCONNECTED/.test(text)) return;
    errors.push(text);
  });

  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.evaluate(() => localStorage.removeItem("playsputnik.prototype.state.v2"));
  await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForFunction(
    () => Boolean(document.querySelector('[data-continuity-action="load-demo"]')),
    null,
    { timeout: 10000 },
  );

  const empty = await page.evaluate(() => ({
    panel: Boolean(document.querySelector("#demo-continuity-panel")),
    title: document.querySelector("#demo-continuity-title")?.textContent || "",
    actions: Array.from(document.querySelectorAll("[data-continuity-action]")).map((button) => button.textContent.trim()),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  }));
  assert(empty.panel, "Demo continuity panel is missing");
  assert(empty.actions.length >= 2, "Demo panel should offer its primary actions");
  assert(!empty.overflow, "Empty demo panel creates horizontal overflow");

  await page.evaluate(() => document.querySelector('[data-continuity-action="load-demo"]')?.click());
  await page.waitForTimeout(1200);
  const loaded = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem("playsputnik.prototype.state.v2") || "{}");
    const rect = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const bounds = node.getBoundingClientRect();
      return { top: Math.round(bounds.top), width: Math.round(bounds.width), height: Math.round(bounds.height) };
    };
    return {
      activeView: document.querySelector("[data-app-view].is-active")?.dataset.appView || "",
      entryStatus: document.querySelector("#entry-status")?.textContent || "",
      continuityTitle: document.querySelector("#demo-continuity-title")?.textContent || "",
      continuityActions: Array.from(document.querySelectorAll("[data-continuity-action]")).map((button) => ({
        action: button.dataset.continuityAction,
        title: button.dataset.continuityTitle,
        text: button.textContent.trim(),
      })),
      topPick: document.querySelector("#top-pick")?.textContent?.replace(/\s+/g, " ").trim().slice(0, 160) || "",
      userGames: Object.keys(stored.userGames || {}).length,
      saved: Object.values(stored.userGames || {}).filter((game) => game.saved).length,
      ratings: Object.values(stored.userGames || {}).filter((game) => typeof game.rating === "number").length,
      priceTargets: Object.values(stored.userGames || {}).filter((game) => game.priceWatch?.targets?.US).length,
      searchQuery: stored.gameSearchQuery || "",
      hero: rect("#top-pick"),
      tastePanel: rect("#taste-understood-panel"),
      quickProof: rect(".hero-quick-proof"),
      primaryCta: rect(".hero-primary-cta"),
      proofDetails: Boolean(document.querySelector(".hero-proof-details")),
      primaryNavButtons: document.querySelectorAll(".app-view-nav > [data-app-view]").length,
      secondaryNavMenu: Boolean(document.querySelector("#app-view-more .app-view-more-menu")),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });
  assert(loaded.activeView === "today", `Demo should land on Today, got ${loaded.activeView}`);
  assert(/Demo profile|Демо-профиль/.test(loaded.entryStatus), `Entry status should show demo profile, got ${loaded.entryStatus}`);
  assert(loaded.userGames >= 10, `Demo should seed at least 10 user games, got ${loaded.userGames}`);
  assert(loaded.saved >= 3, `Demo should seed wishlist games, got ${loaded.saved}`);
  assert(loaded.ratings >= 8, `Demo should seed ratings, got ${loaded.ratings}`);
  assert(loaded.priceTargets >= 3, `Demo should seed price targets, got ${loaded.priceTargets}`);
  assert(loaded.continuityActions.some((item) => item.action === "discover" && item.title), "Demo should expose a Discover continuation");
  assert(loaded.hero?.height >= 300, "Demo Today should show a substantial top recommendation");
  assert(loaded.quickProof?.height >= 40 && loaded.primaryCta?.height >= 40, "Demo Today should expose decision proof and a primary action");
  assert(!loaded.tastePanel || loaded.hero.top < loaded.tastePanel.top, "Top recommendation must appear before taste diagnostics");
  assert(loaded.proofDetails, "Top recommendation should keep deeper evidence in progressive disclosure");
  assert(loaded.primaryNavButtons === 5 && loaded.secondaryNavMenu, "Product navigation should expose five primary areas plus More");
  assert(!loaded.overflow, "Loaded demo profile creates horizontal overflow");

  const todayScreenshot = join(tmpdir(), "playsputnik-demo-today-mobile.png");
  await page.screenshot({ path: todayScreenshot, fullPage: false, timeout: 20000 });

  await page.locator("#app-view-more > summary").click();
  const moreMenuVisible = await page.locator("#app-view-more .app-view-more-menu").isVisible();
  assert(moreMenuVisible, "More navigation menu should open on mobile");
  await page.locator("#app-view-more > summary").click();

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(150);
  const desktopToday = await page.evaluate(() => {
    const hero = document.querySelector("#top-pick")?.getBoundingClientRect();
    const nav = document.querySelector(".app-view-nav")?.getBoundingClientRect();
    return {
      hero: hero ? { top: Math.round(hero.top), width: Math.round(hero.width), height: Math.round(hero.height) } : null,
      nav: nav ? { top: Math.round(nav.top), width: Math.round(nav.width), height: Math.round(nav.height) } : null,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });
  assert(desktopToday.hero?.width >= 700 && desktopToday.hero.height >= 300, "Desktop Today should give the recommendation visual priority");
  assert(!desktopToday.overflow, "Desktop Today creates horizontal overflow");
  const desktopTodayScreenshot = join(tmpdir(), "playsputnik-demo-today-desktop.png");
  await page.screenshot({ path: desktopTodayScreenshot, fullPage: false, timeout: 20000 });
  await page.setViewportSize({ width: 390, height: 900 });

  await page.evaluate(() => document.querySelector('[data-continuity-action="discover"]')?.click());
  await page.waitForTimeout(900);
  const discover = await page.evaluate(() => ({
    activeView: document.querySelector("[data-app-view].is-active")?.dataset.appView || "",
    query: document.querySelector("#game-search-input")?.value || "",
    rows: document.querySelectorAll(".game-search-row").length,
    actions: Array.from(document.querySelectorAll("[data-continuity-action]")).map((button) => button.dataset.continuityAction),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  }));
  assert(discover.activeView === "discover", `Expected Discover after continuation, got ${discover.activeView}`);
  assert(discover.query.length >= 2, "Discover continuation should prefill search");
  assert(discover.rows > 0, "Discover continuation should show search rows");
  assert(discover.actions.includes("today"), "Discover continuity should offer Back to Today");
  assert(!discover.overflow, "Discover continuity creates horizontal overflow");

  await page.evaluate(() => document.querySelector('[data-continuity-action="today"]')?.click());
  await page.waitForTimeout(700);
  const back = await page.evaluate(() => ({
    activeView: document.querySelector("[data-app-view].is-active")?.dataset.appView || "",
    topPickVisible: (() => {
      const node = document.querySelector("#top-pick");
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    })(),
  }));
  assert(back.activeView === "today", `Expected Back to Today to return Today, got ${back.activeView}`);
  assert(back.topPickVisible, "Top pick should be visible after returning to Today");
  assert(errors.length === 0, `Browser errors: ${errors.join("; ")}`);

  console.log(JSON.stringify({
    mode: "demo-profile-smoke",
    url: targetUrl,
    empty,
    loaded,
    todayScreenshot,
    desktopToday,
    desktopTodayScreenshot,
    moreMenuVisible,
    discover,
    back,
    errors,
  }, null, 2));
} finally {
  await browser.close();
}
