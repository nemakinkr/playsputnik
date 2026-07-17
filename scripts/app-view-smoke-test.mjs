import { createRequire } from "node:module";

const DEFAULT_URL = "http://127.0.0.1:4190/?v=app-view-smoke";
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.evaluate(() => localStorage.removeItem("playsputnik.prototype.state.v2"));
  await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(1500);

  const snapshot = async () =>
    page.evaluate(() => {
      const visible = (selector) => {
        const node = document.querySelector(selector);
        if (!node) return false;
        const style = window.getComputedStyle(node);
        return !node.hidden && style.display !== "none" && style.visibility !== "hidden";
      };
      const state = JSON.parse(localStorage.getItem("playsputnik.prototype.state.v2") || "{}");
      return {
        activeView: document.querySelector("[data-app-view].is-active")?.dataset.appView || "",
        activeShelf: document.querySelector("[data-visual-shelf].is-active")?.dataset.visualShelf || "",
        activeCluster: document.querySelector("[data-cluster].is-active")?.dataset.cluster || "",
        status: document.querySelector("#app-view-status")?.textContent?.replace(/\s+/g, " ").trim() || "",
        topPickVisible: visible("#top-pick"),
        searchVisible: visible(".game-search-panel"),
        myGamesVisible: visible(".my-games-panel"),
        priceWatchVisible: visible(".price-watch"),
        devHealthVisible: visible(".dev-health-panel"),
        syncProfileVisible: visible("#sync-profile-status"),
        syncProfileText: document.querySelector("#sync-profile-status")?.textContent?.replace(/\s+/g, " ").trim() || "",
        dropVisible: visible(".drop-panel"),
        persistedView: state.activeView || "",
        profileId: state.syncMeta?.profileId || "",
        profileRevision: state.syncMeta?.revision || 0,
      };
    });

  const today = await snapshot();

  await page.click('[data-app-view="library"]');
  await page.waitForFunction(() => document.querySelector('[data-app-view="library"]')?.classList.contains("is-active"), null, { timeout: 5000 });
  const library = await snapshot();

  await page.click('[data-app-view="discover"]');
  await page.waitForFunction(() => document.querySelector('[data-app-view="discover"]')?.classList.contains("is-active"), null, { timeout: 5000 });
  const discover = await snapshot();

  await page.click('[data-app-view="wishlist"]');
  await page.waitForFunction(() => document.querySelector('[data-app-view="wishlist"]')?.classList.contains("is-active"), null, { timeout: 5000 });
  const wishlist = await snapshot();

  await page.click("#app-view-more > summary");
  await page.click('[data-app-view="data"]');
  await page.waitForFunction(() => document.querySelector('[data-app-view="data"]')?.classList.contains("is-active"), null, { timeout: 5000 });
  const data = await snapshot();

  const result = { mode: "app-view-smoke", url: targetUrl, today, library, discover, wishlist, data, errors };
  console.log(JSON.stringify(result, null, 2));

  assert(today.activeView === "today", `Expected Today as default view, got ${today.activeView}`);
  assert(today.topPickVisible, "Today view should show the top pick");
  assert(library.activeView === "library", `Expected Library view, got ${library.activeView}`);
  assert(library.activeShelf === "library", `Expected Library shelf, got ${library.activeShelf}`);
  assert(library.activeCluster === "library", `Expected Library cluster, got ${library.activeCluster}`);
  assert(library.myGamesVisible, "Library view should show My games");
  assert(!library.searchVisible, "Library view should hide search");
  assert(discover.activeShelf === "catalog", `Expected Discover to open Catalog shelf, got ${discover.activeShelf}`);
  assert(discover.searchVisible, "Discover view should show search");
  assert(discover.dropVisible, "Discover view should show the drop inbox");
  assert(wishlist.activeShelf === "wishlist", `Expected Wishlist shelf, got ${wishlist.activeShelf}`);
  assert(wishlist.activeCluster === "buy", `Expected Wishlist to open Buy cluster, got ${wishlist.activeCluster}`);
  assert(wishlist.priceWatchVisible, "Wishlist view should show price watch");
  assert(data.devHealthVisible, "Data view should show dev health");
  assert(data.syncProfileVisible, "Data view should show the local profile identity");
  assert(data.syncProfileText.length > 20, "Sync readiness card should explain the current profile status");
  assert(data.profileId.startsWith("profile_"), "Persisted state should have a stable profile identity");
  assert(data.profileRevision >= 1, "Persisted profile should have an initial revision");
  assert(!data.topPickVisible, "Data view should hide Today recommendation");
  assert(data.persistedView === "data", `Expected active view to persist, got ${data.persistedView}`);
  assert(errors.length === 0, `Page errors: ${errors.join("; ")}`);
} finally {
  await browser.close();
}
