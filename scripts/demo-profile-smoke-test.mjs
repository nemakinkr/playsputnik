import { createRequire } from "node:module";

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
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.evaluate(() => localStorage.removeItem("playsputnik.prototype.state.v2"));
  await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll("[data-continuity-action]"))
      .some((button) => button.textContent.trim() === "Load demo profile"),
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
  assert(empty.actions.includes("Load demo profile"), "Demo panel should offer Load demo profile");
  assert(!empty.overflow, "Empty demo panel creates horizontal overflow");

  await page.evaluate(() => document.querySelector('[data-continuity-action="load-demo"]')?.click());
  await page.waitForTimeout(1200);
  const loaded = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem("playsputnik.prototype.state.v2") || "{}");
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
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });
  assert(loaded.activeView === "today", `Demo should land on Today, got ${loaded.activeView}`);
  assert(/Demo profile/.test(loaded.entryStatus), `Entry status should show demo profile, got ${loaded.entryStatus}`);
  assert(loaded.userGames >= 10, `Demo should seed at least 10 user games, got ${loaded.userGames}`);
  assert(loaded.saved >= 3, `Demo should seed wishlist games, got ${loaded.saved}`);
  assert(loaded.ratings >= 8, `Demo should seed ratings, got ${loaded.ratings}`);
  assert(loaded.priceTargets >= 3, `Demo should seed price targets, got ${loaded.priceTargets}`);
  assert(loaded.continuityActions.some((item) => item.action === "discover" && item.title), "Demo should expose a Discover continuation");
  assert(!loaded.overflow, "Loaded demo profile creates horizontal overflow");

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
    discover,
    back,
    errors,
  }, null, 2));
} finally {
  await browser.close();
}
