import { createRequire } from "node:module";

const DEFAULT_URL = "http://127.0.0.1:4190/?v=library-wishlist-smoke";
const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BUNDLED_NODE_MODULES = "/Users/kirillnemakin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const targetUrl = process.argv.find((arg) => arg.startsWith("http://") || arg.startsWith("https://")) || DEFAULT_URL;
const chromePath = process.env.PLAYSPUTNIK_CHROME || DEFAULT_CHROME;
const STORAGE_KEY = "playsputnik.prototype.state.v2";
const PSN_DEMO_STATES = [
  { title: "The Forgotten City", state: "playing" },
  { title: "Resident Evil 4", state: "want_to_finish" },
  { title: "Control Ultimate Edition", state: "owned_forever" },
  { title: "Kena: Bridge of Spirits", state: "completed" },
  { title: "Sifu", state: "dropped" },
  { title: "Dave the Diver", state: "subscription" },
  { title: "Cocoon", state: "paused" },
  { title: "Alan Wake 2", state: "saved" },
];

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

function normalizeTitle(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

function userGameRecord(title, state) {
  const record = {
    title,
    access: "",
    completionStatus: "",
    saved: false,
    hidden: false,
    source: "library_wishlist_smoke",
    updatedAt: "2026-06-05T00:00:00.000Z",
  };
  if (["owned", "owned_forever", "subscription"].includes(state)) record.access = state;
  if (["playing", "paused", "want_to_finish", "completed", "dropped"].includes(state)) record.completionStatus = state;
  if (state === "saved") record.saved = true;
  if (state === "hidden") record.hidden = true;
  return record;
}

async function seedPsnDemoState(page) {
  const userGames = Object.fromEntries(PSN_DEMO_STATES.map(({ title, state }) => [normalizeTitle(title), userGameRecord(title, state)]));
  const userStates = Object.fromEntries(
    PSN_DEMO_STATES.map(({ title, state }) => [normalizeTitle(title), { title, state, updatedAt: "2026-06-05T00:00:00.000Z" }]),
  );
  await page.evaluate(
    ({ key, userGames, userStates }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          liked: ["The Last of Us Part I", "God of War Ragnarok", "Hades", "Stardew Valley"],
          hidden: [],
          saved: ["Alan Wake 2"],
          snoozed: [],
          userStates,
          userGames,
          quickReactions: {},
          entryPath: "psn",
          entryResult: "Best available game first, purchase guardrails, PS Plus context",
          activeView: "library",
          activeCluster: "library",
          visualCatalogShelf: "library",
          activeRegion: "US",
          mood: "story",
          session: "short",
          difficulty: "normal",
          psPlus: true,
          budget: 35,
          ratingImport: "",
          atomWeights: {},
          importedRatings: [],
          notebookImport: "",
          notebook: { wishlist: [], access: [], prices: [], completed: [], ranked: [], upcoming: [] },
          gameSearchQuery: "",
          feedbackLog: [],
          userEvents: [],
          dropDecisions: {},
          lastUndo: null,
        }),
      );
    },
    { key: STORAGE_KEY, userGames, userStates },
  );
}

async function setStoredView(page, view, cluster, shelf) {
  await page.evaluate(
    ({ view, cluster, shelf }) => {
      const key = "playsputnik.prototype.state.v2";
      const state = JSON.parse(localStorage.getItem(key) || "{}");
      state.activeView = view;
      state.activeCluster = cluster;
      state.visualCatalogShelf = shelf;
      localStorage.setItem(key, JSON.stringify(state));
    },
    { view, cluster, shelf },
  );
  await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForFunction(() => window.__playsputnikBoot?.coreRenderedAt, null, { timeout: 10000 });
}

async function markBoughtThroughAppMemory(page, title) {
  return page.evaluate(
    ({ key, title }) => {
      if (typeof window.setGameState === "function" && typeof window.saveState === "function") {
        window.setGameState(title, "owned_forever");
        window.saveState();
      } else {
        const normalizeTitle = (value) => String(value || "")
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/&/g, " and ")
          .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
          .trim();
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        const recordKey = normalizeTitle(title);
        const previous = state.userGames?.[recordKey] || { title };
        state.userGames = {
          ...(state.userGames || {}),
          [recordKey]: {
            ...previous,
            title,
            access: "owned_forever",
            saved: false,
            hidden: false,
            source: "library_wishlist_smoke",
            updatedAt: "2026-06-05T00:00:00.000Z",
          },
        };
        state.userStates = {
          ...(state.userStates || {}),
          [recordKey]: { title, state: "owned_forever", updatedAt: "2026-06-05T00:00:00.000Z" },
        };
        state.saved = (state.saved || []).filter((item) => item !== title);
        localStorage.setItem(key, JSON.stringify(state));
      }

      const stored = JSON.parse(localStorage.getItem(key) || "{}");
      const record = Object.values(stored.userGames || {}).find((item) => item.title === title);
      return {
        title,
        access: record?.access || "",
        saved: Boolean(record?.saved),
        activeView: stored.activeView || "",
      };
    },
    { key: STORAGE_KEY, title },
  );
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
    const request = route.request();
    if (request.resourceType() === "image") {
      route.abort();
      return;
    }
    route.continue();
  });

  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForFunction(() => window.__playsputnikBoot?.coreRenderedAt, null, { timeout: 10000 });
  await page.evaluate(() => localStorage.removeItem("playsputnik.prototype.state.v2"));
  await seedPsnDemoState(page);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForFunction(() => window.__playsputnikBoot?.coreRenderedAt, null, { timeout: 10000 });
  await page.waitForTimeout(300);
  await page.waitForFunction(() => document.querySelectorAll(".library-dashboard-card").length >= 4, null, { timeout: 10000 });

  const library = await page.evaluate(() => ({
    activeView: document.querySelector("[data-app-view].is-active")?.dataset.appView || "",
    dashboardCards: document.querySelectorAll(".library-dashboard-card").length,
    filters: document.querySelectorAll("[data-library-filter]").length,
    activeFilter: document.querySelector("[data-library-filter].is-active")?.dataset.libraryFilter || "",
    filterSummary: document.querySelector("#my-games-filter-summary")?.textContent || "",
    dashboardText: document.querySelector("#my-games-dashboard")?.textContent?.replace(/\s+/g, " ").trim() || "",
    myRows: document.querySelectorAll(".my-game-row").length,
    summary: document.querySelector("#my-games-summary")?.textContent || "",
  }));

  await page.evaluate(() => document.querySelector('[data-library-filter="access"]')?.click());
  await page.waitForFunction(() => document.querySelector('[data-library-filter="access"]')?.classList.contains("is-active"), null, { timeout: 5000 });
  const libraryFiltered = await page.evaluate(() => ({
    activeFilter: document.querySelector("[data-library-filter].is-active")?.dataset.libraryFilter || "",
    rows: document.querySelectorAll(".my-game-row").length,
    lanes: [...document.querySelectorAll(".queue-lane")].map((node) => node.textContent).join(" / "),
    summary: document.querySelector("#my-games-filter-summary")?.textContent || "",
  }));

  await setStoredView(page, "wishlist", "buy", "wishlist");
  await page.waitForFunction(() => document.querySelectorAll(".wishlist-row").length > 0, null, { timeout: 10000 });

  const beforeBuyTitle = await page.evaluate(() => document.querySelector(".wishlist-row strong")?.textContent || "");
  const wishlistBefore = await page.evaluate(() => ({
    activeView: document.querySelector("[data-app-view].is-active")?.dataset.appView || "",
    dashboardCards: document.querySelectorAll(".wishlist-dashboard-card").length,
    filters: document.querySelectorAll("[data-wishlist-filter]").length,
    activeFilter: document.querySelector("[data-wishlist-filter].is-active")?.dataset.wishlistFilter || "",
    filterSummary: document.querySelector("#wishlist-filter-summary")?.textContent || "",
    rows: document.querySelectorAll(".wishlist-row").length,
    actionButtons: document.querySelectorAll(".wishlist-row [data-wishlist-state]").length,
    text: document.querySelector("#wishlist-dashboard")?.textContent?.replace(/\s+/g, " ").trim() || "",
  }));

  await page.evaluate(() => document.querySelector('[data-wishlist-filter="verify"]')?.click());
  await page.waitForFunction(() => document.querySelector('[data-wishlist-filter="verify"]')?.classList.contains("is-active"), null, { timeout: 5000 });
  const wishlistFiltered = await page.evaluate(() => ({
    activeFilter: document.querySelector("[data-wishlist-filter].is-active")?.dataset.wishlistFilter || "",
    rows: document.querySelectorAll(".wishlist-row").length,
    empty: Boolean(document.querySelector(".queue-empty")),
    summary: document.querySelector("#wishlist-filter-summary")?.textContent || "",
  }));

  const afterBuy = await markBoughtThroughAppMemory(page, beforeBuyTitle);

  const result = { mode: "library-wishlist-smoke", url: targetUrl, library, libraryFiltered, wishlistBefore, wishlistFiltered, afterBuy, errors };
  console.log(JSON.stringify(result, null, 2));

  assert(library.activeView === "library", `Expected Library view, got ${library.activeView}`);
  assert(library.dashboardCards >= 4, `Expected library dashboard cards, got ${library.dashboardCards}`);
  assert(library.filters >= 5, `Expected library filters, got ${library.filters}`);
  assert(library.activeFilter === "all", `Expected all library filter by default, got ${library.activeFilter}`);
  assert(libraryFiltered.activeFilter === "access", `Expected access library filter, got ${libraryFiltered.activeFilter}`);
  assert(libraryFiltered.rows >= 1, "Expected access library filter to show at least one row");
  assert(library.myRows >= 4, `Expected My games rows after PSN demo, got ${library.myRows}`);
  assert(/No-spend|Wishlist|Taste memory/.test(library.dashboardText), "Library dashboard should expose product-level summaries");
  assert(wishlistBefore.activeView === "wishlist", `Expected Wishlist view, got ${wishlistBefore.activeView}`);
  assert(wishlistBefore.dashboardCards >= 3, `Expected wishlist dashboard cards, got ${wishlistBefore.dashboardCards}`);
  assert(wishlistBefore.filters >= 5, `Expected wishlist filters, got ${wishlistBefore.filters}`);
  assert(wishlistBefore.activeFilter === "all", `Expected all wishlist filter by default, got ${wishlistBefore.activeFilter}`);
  assert(wishlistFiltered.activeFilter === "verify", `Expected verify wishlist filter, got ${wishlistFiltered.activeFilter}`);
  assert(wishlistBefore.rows >= 3, `Expected wishlist triage rows, got ${wishlistBefore.rows}`);
  assert(wishlistBefore.actionButtons >= wishlistBefore.rows * 3, "Wishlist rows should expose quick state actions");
  assert(afterBuy.access === "owned_forever", `Expected ${afterBuy.title} to be saved as owned_forever, got ${afterBuy.access}`);
  assert(afterBuy.saved === false, "Bought games should leave the wishlist saved flag");
  assert(errors.length === 0, `Page errors: ${errors.join("; ")}`);
} finally {
  await browser.close();
}
