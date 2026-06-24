import { createRequire } from "node:module";

const DEFAULT_URL = "http://127.0.0.1:4190/?v=search-memory-smoke";
const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BUNDLED_NODE_MODULES = "/Users/kirillnemakin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const targetUrl = process.argv.find((arg) => arg.startsWith("http://") || arg.startsWith("https://")) || DEFAULT_URL;
const chromePath = process.env.PLAYSPUTNIK_CHROME || DEFAULT_CHROME;
const STORAGE_KEY = "playsputnik.prototype.state.v2";
const searchQuery = argValue("query", "Black Myth");
const expectedTitle = argValue("expected", "Black Myth: Wukong");
const targetState = argValue("state", "subscription");

function argValue(name, fallback) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) || fallback;
}

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

  await page.evaluate(() => document.querySelector('[data-app-view="discover"]')?.click());
  await page.locator("#game-search-input").fill(searchQuery);
  await page.waitForTimeout(500);
  await page.waitForFunction((title) => {
    const rows = Array.from(document.querySelectorAll(".game-search-row"));
    return rows.some((row) => (row.querySelector("strong")?.textContent || "").trim() === title);
  }, expectedTitle, { timeout: 15000 }).catch(() => null);

  const before = await page.evaluate(() => ({
    activeView: document.querySelector("[data-app-view].is-active")?.dataset.appView || "",
    searchValue: document.querySelector("#game-search-input")?.value || "",
    searchStatus: document.querySelector("#game-search-status")?.textContent || "",
    searchSource: document.querySelector("#game-search-source")?.textContent || "",
    rows: document.querySelectorAll(".game-search-row").length,
    firstTitle: document.querySelector(".game-search-row > div > strong")?.textContent || "",
    allTitles: Array.from(document.querySelectorAll(".game-search-row"))
      .map((row) => row.firstElementChild?.querySelector("strong")?.textContent || ""),
    detailButtons: document.querySelectorAll("[data-search-detail]").length,
    memoryPanels: document.querySelectorAll("[data-search-memory-panel]").length,
    savedButtons: document.querySelectorAll('[data-search-state="saved"]').length,
    ownedButtons: document.querySelectorAll('[data-search-state="owned"]').length,
    subscriptionButtons: document.querySelectorAll('[data-search-state="subscription"]').length,
    pressedButtons: document.querySelectorAll('[data-search-state][aria-pressed]').length,
    passportChecks: document.querySelectorAll(".game-search-row .source-check").length,
  }));

  await page.evaluate((title) => {
    const row = Array.from(document.querySelectorAll(".game-search-row"))
      .find((item) => (item.querySelector("strong")?.textContent || "").trim() === title);
    (row || document.querySelector(".game-search-row"))?.querySelector('[data-search-state="saved"]')?.click();
  }, expectedTitle);
  await page.waitForTimeout(500);

  const afterSearchSave = await page.evaluate(({ key, expectedTitle }) => {
    const stored = JSON.parse(localStorage.getItem(key) || "{}");
    const record = Object.values(stored.userGames || {}).find((item) => item.title === expectedTitle);
    const userState = Object.values(stored.userStates || {}).find((item) => item.title === expectedTitle);
    const row = Array.from(document.querySelectorAll(".game-search-row"))
      .find((item) => (item.querySelector("strong")?.textContent || "").trim() === expectedTitle);
    return {
      activeSaved: row?.querySelector('[data-search-state="saved"]')?.classList.contains("is-selected") || false,
      pressedSaved: row?.querySelector('[data-search-state="saved"]')?.getAttribute("aria-pressed") || "",
      openWishlistButtons: row?.querySelectorAll("[data-search-open-wishlist]").length || 0,
      memoryStatus: row?.querySelector("[data-search-memory-panel]")?.textContent?.replace(/\s+/g, " ").trim() || "",
      record: record ? {
        title: record.title,
        access: record.access || "",
        saved: Boolean(record.saved),
        source: record.source || "",
      } : null,
      userState: userState?.state || "",
    };
  }, { key: STORAGE_KEY, expectedTitle });

  await page.evaluate((title) => {
    const row = Array.from(document.querySelectorAll(".game-search-row"))
      .find((item) => (item.querySelector("strong")?.textContent || "").trim() === title);
    (row || document.querySelector(".game-search-row"))?.querySelector("[data-search-detail]")?.click();
  }, expectedTitle);
  await page.waitForFunction(() => document.querySelector("#game-detail")?.getAttribute("aria-hidden") === "false", null, { timeout: 5000 });

  const detail = await page.evaluate(() => ({
    title: document.querySelector("#game-detail-title")?.textContent || "",
    meta: document.querySelector("#game-detail-meta")?.textContent || "",
    actions: document.querySelectorAll("[data-detail-state]").length,
    plusAction: Boolean(document.querySelector('[data-detail-state="subscription"]')),
    passportChecks: document.querySelectorAll("#game-detail .source-check").length,
    source: document.querySelector(".game-detail-cover-source")?.textContent || "",
    missingFacts: Array.from(document.querySelectorAll("#game-detail .fact")).filter((item) => /missing|check/i.test(item.textContent || "")).length,
  }));

  await page.evaluate((state) => document.querySelector(`[data-detail-state="${state}"]`)?.click(), targetState);
  await page.waitForTimeout(500);

  const after = await page.evaluate(({ key, expectedTitle, targetState }) => {
    const stored = JSON.parse(localStorage.getItem(key) || "{}");
    const record = Object.values(stored.userGames || {}).find((item) => item.title === expectedTitle);
    const userState = Object.values(stored.userStates || {}).find((item) => item.title === expectedTitle);
    return {
      activeState: document.querySelector(`[data-detail-state="${targetState}"]`)?.classList.contains("is-active") || false,
      record: record ? {
        title: record.title,
        access: record.access || "",
        saved: Boolean(record.saved),
        source: record.source || "",
        provider: record.provider || "",
        catalogStatus: record.catalogStatus || "",
        matchConfidence: record.matchConfidence || "",
        coverStatus: record.coverStatus || "",
        priceStatus: record.priceStatus || "",
        atoms: Array.isArray(record.atoms) ? record.atoms.length : 0,
        inferredAtoms: Array.isArray(record.inferredAtoms) ? record.inferredAtoms.length : 0,
      } : null,
      userState: userState?.state || "",
    };
  }, { key: STORAGE_KEY, expectedTitle, targetState });

  await page.evaluate(() => document.querySelector("[data-detail-close]")?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await page.evaluate(() => document.querySelector('[data-app-view="library"]')?.click());
  await page.waitForTimeout(500);

  const library = await page.evaluate((expectedTitle) => ({
    activeView: document.querySelector("[data-app-view].is-active")?.dataset.appView || "",
    hasGame: Array.from(document.querySelectorAll(".my-game-row strong, .library-dashboard-card strong"))
      .some((item) => (item.textContent || "").trim() === expectedTitle),
    subscriptionFacts: Array.from(document.querySelectorAll(".my-game-row .fact, .library-dashboard-card"))
      .filter((item) => /Subscription|Plus/i.test(item.textContent || "")).length,
  }), expectedTitle);

  const result = { mode: "search-memory-smoke", url: targetUrl, searchQuery, expectedTitle, targetState, before, afterSearchSave, detail, after, library, errors };
  console.log(JSON.stringify(result, null, 2));

  assert(before.rows >= 1, `Expected search rows, got ${before.rows}`);
  assert(before.firstTitle === expectedTitle, `Expected ${expectedTitle} as first result, got ${before.firstTitle}`);
  assert(before.detailButtons >= 1, "Expected search Details action");
  assert(before.memoryPanels >= 1, "Expected search memory confirmation panels");
  assert(before.savedButtons >= 1, "Expected search Wishlist action");
  assert(before.ownedButtons >= 1, "Expected search Owned action");
  assert(before.subscriptionButtons >= 1, "Expected search Plus action");
  assert(before.pressedButtons >= 3, "Expected search memory actions to expose pressed state");
  assert(before.passportChecks >= 5, `Expected search source passport checks, got ${before.passportChecks}`);
  assert(afterSearchSave.record?.saved, "Expected direct search Wishlist action to save the external game");
  assert(afterSearchSave.record?.source?.startsWith("search_"), `Expected direct search save source memory, got ${afterSearchSave.record?.source}`);
  assert(afterSearchSave.activeSaved, "Expected direct Wishlist button to become selected");
  assert(afterSearchSave.pressedSaved === "true", `Expected Wishlist aria-pressed=true, got ${afterSearchSave.pressedSaved}`);
  assert(afterSearchSave.openWishlistButtons >= 1, "Expected saved search result to expose an Open Wishlist next step");
  assert(/Saved to Wishlist|Добавлено в Желаемое/i.test(afterSearchSave.memoryStatus), `Expected search memory confirmation, got ${afterSearchSave.memoryStatus}`);
  assert(afterSearchSave.userState === "saved", `Expected saved userState after direct search action, got ${afterSearchSave.userState}`);
  assert(detail.title === expectedTitle, `Expected ${expectedTitle} detail drawer, got ${detail.title}`);
  assert(/fit|совпадение/i.test(detail.meta), `Expected detail fit metadata, got ${detail.meta}`);
  assert(detail.actions >= 7, `Expected detail actions including Plus, got ${detail.actions}`);
  assert(detail.plusAction, "Expected detail Plus action");
  assert(detail.passportChecks >= 5, `Expected detail source passport checks, got ${detail.passportChecks}`);
  assert(after.record?.access === targetState, `Expected ${targetState} access, got ${after.record?.access}`);
  assert(after.record?.source?.startsWith("search_"), `Expected search source memory, got ${after.record?.source}`);
  assert(after.record?.catalogStatus, "Expected catalog status to persist");
  assert(after.record?.matchConfidence, "Expected match confidence to persist");
  assert(after.record?.coverStatus, "Expected cover status to persist");
  assert(after.record?.priceStatus, "Expected price status to persist");
  assert(after.record?.provider, "Expected provider metadata to persist");
  assert(after.record.atoms + after.record.inferredAtoms > 0, "Expected source or inferred atoms to persist");
  assert(after.userState === targetState, `Expected ${targetState} userState, got ${after.userState}`);
  assert(after.activeState, `Expected ${targetState} action to become active`);
  assert(library.activeView === "library", `Expected Library view, got ${library.activeView}`);
  assert(library.hasGame, "Expected saved external game to appear in Library memory");
  assert(errors.length === 0, `Page errors: ${errors.join("; ")}`);
} finally {
  await browser.close();
}
