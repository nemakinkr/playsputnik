import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";

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

async function waitForAppReady(page) {
  await page.waitForFunction(() => window.__playsputnikBoot?.coreRenderedAt, null, { timeout: 10000 });
  await page.waitForFunction(() => window.__playsputnikBoot?.deferredRenderedAt, null, { timeout: 10000 });
}

async function clearStoredState(page) {
  await page.evaluate(async (key) => {
    window.__idbPreloadedState = undefined;
    localStorage.removeItem(key);
    await window.PlaySputnikStorage?.idbRemove?.(key);
  }, STORAGE_KEY);
}

async function writeStoredState(page, state) {
  await page.evaluate(
    async ({ key, state }) => {
      window.__idbPreloadedState = undefined;
      const serialized = JSON.stringify(state);
      localStorage.setItem(key, serialized);
      await window.PlaySputnikStorage?.idbSet?.(key, serialized);
    },
    { key: STORAGE_KEY, state },
  );
}

function smokeState(userGames, userStates) {
  return {
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
    sessionLog: [],
    aiExplanations: {},
    lastUndo: null,
  };
}

async function seedPsnDemoState(page) {
  const userGames = Object.fromEntries(PSN_DEMO_STATES.map(({ title, state }) => [normalizeTitle(title), userGameRecord(title, state)]));
  const userStates = Object.fromEntries(
    PSN_DEMO_STATES.map(({ title, state }) => [normalizeTitle(title), { title, state, updatedAt: "2026-06-05T00:00:00.000Z" }]),
  );
  await writeStoredState(page, smokeState(userGames, userStates));
}

async function setStoredView(page, view, cluster, shelf) {
  const state = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}"), STORAGE_KEY);
  state.activeView = view;
  state.activeCluster = cluster;
  state.visualCatalogShelf = shelf;
  await writeStoredState(page, state);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
  await waitForAppReady(page);
  await page.evaluate((targetView) => document.querySelector(`[data-app-view="${targetView}"]`)?.click(), view);
  await page.waitForFunction(
    (targetView) => document.querySelector("[data-app-view].is-active")?.dataset.appView === targetView,
    view,
    { timeout: 5000 },
  );
}

async function markBoughtThroughAppMemory(page, title) {
  return page.evaluate(
    async ({ key, title }) => {
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
        const serialized = JSON.stringify(state);
        localStorage.setItem(key, serialized);
        await window.PlaySputnikStorage?.idbSet?.(key, serialized);
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

async function runFounderRankingScenario(page) {
  const rankingText = await readFile(new URL("../test/fixtures/founder-ranking-ru.txt", import.meta.url), "utf8");
  await clearStoredState(page);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
  await waitForAppReady(page);
  await page.evaluate(() => window.PlaySputnikI18n?.setLocale("en"));
  await page.evaluate(() => document.querySelector('[data-app-view="taste"]')?.click());
  await page.waitForFunction(() => document.querySelector("[data-app-view].is-active")?.dataset.appView === "taste", null, { timeout: 5000 });
  await page.evaluate(() => {
    const input = document.querySelector("#notebook-import");
    if (!input) throw new Error("Notebook import textarea missing");
    input.value = "❤❤❤\nGhost of Yōtei";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    document.querySelector("#parse-notebook")?.click();
  });
  await page.evaluate((text) => {
    const input = document.querySelector("#rating-import");
    if (!input) throw new Error("Rating import textarea missing");
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, rankingText);
  await page.waitForTimeout(500);

  const preview = await page.evaluate(() => ({
    text: document.querySelector("#taste-import-preview")?.textContent?.replace(/\s+/g, " ").trim() || "",
    report: document.querySelector("#taste-import-report")?.textContent?.replace(/\s+/g, " ").trim() || "",
    batch: Boolean(document.querySelector("[data-import-report-batch]")),
    gapBrief: Boolean(document.querySelector("[data-import-gap-brief]")),
    gapText: document.querySelector("[data-import-gap-brief]")?.textContent?.replace(/\s+/g, " ").trim() || "",
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  await page.evaluate(() => document.querySelector("#analyze-ratings")?.click());
  await page.waitForSelector("#confirm-ai-import:not([hidden])", { timeout: 15000 });
  await page.evaluate(() => document.querySelector("#confirm-ai-import")?.click());
  await page.waitForFunction(() => /\d+/.test(document.querySelector("#taste-summary")?.textContent || ""), null, { timeout: 15000 });
  const taste = await page.evaluate(() => ({
    summary: document.querySelector("#taste-summary")?.textContent?.replace(/\s+/g, " ").trim() || "",
    profile: document.querySelector("#taste-profile-summary")?.textContent?.replace(/\s+/g, " ").trim() || "",
    screen: document.querySelector("#taste-profile-screen")?.textContent?.replace(/\s+/g, " ").trim() || "",
    intensity: document.querySelector(".taste-profile-pace")?.textContent?.replace(/\s+/g, " ").trim() || "",
    intensityKind: document.querySelector(".taste-profile-pace")?.dataset.tasteIntensity || "",
    atoms: [...document.querySelectorAll("#taste-atoms .atom-pill")].map((node) => node.textContent?.replace(/\s+/g, " ").trim() || ""),
  }));

  await page.evaluate(() => document.querySelector('[data-app-view="stats"]')?.click());
  await page.waitForFunction(() => document.querySelector("[data-app-view].is-active")?.dataset.appView === "stats", null, { timeout: 5000 });
  const calibration = await page.evaluate(() => (
    document.querySelector("#stats-calibration")?.textContent?.replace(/\s+/g, " ").trim() || ""
  ));

  await page.evaluate(() => document.querySelector('[data-app-view="wishlist"]')?.click());
  await page.waitForFunction(() => document.querySelector("[data-app-view].is-active")?.dataset.appView === "wishlist", null, { timeout: 5000 });
  await page.waitForFunction(() => document.querySelectorAll(".wishlist-row").length >= 3, null, { timeout: 10000 });
  const wishlist = await page.evaluate(() => ({
    rows: [...document.querySelectorAll(".wishlist-row > div:not(.wishlist-actions) > strong")].map((node) => node.textContent?.replace(/\s+/g, " ").trim() || "").slice(0, 10),
    dashboard: document.querySelector("#wishlist-dashboard")?.textContent?.replace(/\s+/g, " ").trim() || "",
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));

  return { preview, taste, calibration, wishlist };
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
  await waitForAppReady(page);
  await clearStoredState(page);
  await seedPsnDemoState(page);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
  await waitForAppReady(page);
  await page.evaluate(() => document.querySelector('[data-app-view="library"]')?.click());
  await page.waitForFunction(() => document.querySelector("[data-app-view].is-active")?.dataset.appView === "library", null, { timeout: 5000 });
  await page.waitForTimeout(300);
  await page.waitForFunction(() => document.querySelectorAll(".library-dashboard-card").length >= 4, null, { timeout: 10000 });

  const library = await page.evaluate(() => ({
    activeView: document.querySelector("[data-app-view].is-active")?.dataset.appView || "",
    dashboardCards: document.querySelectorAll(".library-dashboard-card").length,
    filters: document.querySelectorAll("[data-library-filter]").length,
    activeFilter: document.querySelector("[data-library-filter].is-active")?.dataset.libraryFilter || "",
    filterSummary: document.querySelector("#my-games-filter-summary")?.textContent || "",
    dashboardText: document.querySelector("#my-games-dashboard")?.textContent?.replace(/\s+/g, " ").trim() || "",
    commandText: document.querySelector("#my-games-command")?.textContent?.replace(/\s+/g, " ").trim() || "",
    commandButtons: document.querySelectorAll("[data-library-command-filter]").length,
    commandActive: document.querySelector("[data-library-command-filter].is-active")?.dataset.libraryCommandFilter || "",
    commandCounts: [...document.querySelectorAll("[data-library-command-filter] strong")].map((node) => Number(node.textContent.trim())),
    myRows: document.querySelectorAll(".my-game-row").length,
    nextSteps: document.querySelectorAll(".library-next-step").length,
    nextStepText: document.querySelector(".library-next-step")?.textContent?.replace(/\s+/g, " ").trim() || "",
    quickActions: document.querySelectorAll(".my-game-quick-actions").length,
    moreActions: document.querySelectorAll(".my-game-more-actions").length,
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

  await page.evaluate(() => document.querySelector('[data-library-command-filter="wishlist"]')?.click());
  await page.waitForFunction(() => document.querySelector('[data-library-filter="wishlist"]')?.classList.contains("is-active"), null, { timeout: 5000 });
  const libraryCommandFiltered = await page.evaluate(() => ({
    activeFilter: document.querySelector("[data-library-filter].is-active")?.dataset.libraryFilter || "",
    commandActive: document.querySelector("[data-library-command-filter].is-active")?.dataset.libraryCommandFilter || "",
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
    priceAlerts: document.querySelectorAll(".wishlist-row [data-price-alert]").length,
    text: document.querySelector("#wishlist-dashboard")?.textContent?.replace(/\s+/g, " ").trim() || "",
  }));

  const priceAlertTitle = await page.evaluate(() => document.querySelector(".wishlist-row [data-price-alert]")
    ?.closest(".wishlist-row")
    ?.querySelector("strong")
    ?.textContent || "");

  await page.evaluate((title) => {
    const row = [...document.querySelectorAll(".wishlist-row")]
      .find((node) => node.querySelector("strong")?.textContent === title);
    const input = row?.querySelector("[data-price-target-input]");
    if (!row || !input) throw new Error("Price target row/input missing");
    input.value = "12";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    row.querySelector("[data-price-target-save]")?.click();
  }, priceAlertTitle);
  await page.waitForFunction(
    (title) => [...document.querySelectorAll(".wishlist-row")]
      .some((node) => node.querySelector("strong")?.textContent === title && node.querySelector("[data-price-target-clear]")),
    priceAlertTitle,
    { timeout: 5000 },
  );
  const wishlistTargetSet = await page.evaluate((title) => {
    const row = [...document.querySelectorAll(".wishlist-row")]
      .find((node) => node.querySelector("strong")?.textContent === title);
    return {
      hasClear: Boolean(row?.querySelector("[data-price-target-clear]")),
      text: row?.textContent?.replace(/\s+/g, " ").trim() || "",
    };
  }, priceAlertTitle);

  await page.evaluate((title) => {
    const row = [...document.querySelectorAll(".wishlist-row")]
      .find((node) => node.querySelector("strong")?.textContent === title);
    row?.querySelector("[data-price-target-clear]")?.click();
  }, priceAlertTitle);
  await page.waitForFunction(
    (title) => [...document.querySelectorAll(".wishlist-row")]
      .some((node) => document.querySelector("[data-wishlist-filter].is-active")?.dataset.wishlistFilter === "all"
        && node.querySelector("strong")?.textContent === title
        && !node.querySelector("[data-price-target-clear]")),
    priceAlertTitle,
    { timeout: 5000 },
  );
  const wishlistTargetCleared = await page.evaluate((title) => {
    const row = [...document.querySelectorAll(".wishlist-row")]
      .find((node) => node.querySelector("strong")?.textContent === title);
    return {
      hasClear: Boolean(row?.querySelector("[data-price-target-clear]")),
      text: row?.textContent?.replace(/\s+/g, " ").trim() || "",
    };
  }, priceAlertTitle);

  await page.evaluate(() => document.querySelector('[data-wishlist-filter="verify"]')?.click());
  await page.waitForFunction(() => document.querySelector('[data-wishlist-filter="verify"]')?.classList.contains("is-active"), null, { timeout: 5000 });
  const wishlistFiltered = await page.evaluate(() => ({
    activeFilter: document.querySelector("[data-wishlist-filter].is-active")?.dataset.wishlistFilter || "",
    rows: document.querySelectorAll(".wishlist-row").length,
    empty: Boolean(document.querySelector(".queue-empty")),
    summary: document.querySelector("#wishlist-filter-summary")?.textContent || "",
  }));

  const afterBuy = await markBoughtThroughAppMemory(page, beforeBuyTitle);
  const founderRanking = await runFounderRankingScenario(page);

  const result = { mode: "library-wishlist-smoke", url: targetUrl, library, libraryFiltered, libraryCommandFiltered, wishlistBefore, priceAlertTitle, wishlistTargetSet, wishlistTargetCleared, wishlistFiltered, afterBuy, founderRanking, errors };
  console.log(JSON.stringify(result, null, 2));

  assert(library.activeView === "library", `Expected Library view, got ${library.activeView}`);
  assert(library.dashboardCards >= 4, `Expected library dashboard cards, got ${library.dashboardCards}`);
  assert(library.commandButtons >= 5, `Expected library command lane buttons, got ${library.commandButtons}`);
  assert(library.commandActive === "all", `Expected command bar to mirror all filter, got ${library.commandActive}`);
  assert(library.commandCounts.some((count) => count > 0), "Expected command bar to expose non-empty lane counts");
  assert(/Continue|Start|Queued|First memory|Next|No-spend|Intent|Продолжить|Начать|В очереди|Первая память|Дальше|Без трат|Намерение/.test(library.commandText), "Library command bar should expose a current working focus");
  assert(library.filters >= 5, `Expected library filters, got ${library.filters}`);
  assert(library.activeFilter === "all", `Expected all library filter by default, got ${library.activeFilter}`);
  assert(libraryFiltered.activeFilter === "access", `Expected access library filter, got ${libraryFiltered.activeFilter}`);
  assert(/Access:|Доступные:/.test(libraryFiltered.summary), "Expected access library filter summary to render");
  assert(/(?:Access|Доступные): \d+\/\d+/.test(libraryFiltered.summary), "Expected access filter to report visible/total rows");
  assert(libraryCommandFiltered.activeFilter === "wishlist", `Expected command bar to switch wishlist filter, got ${libraryCommandFiltered.activeFilter}`);
  assert(libraryCommandFiltered.commandActive === "wishlist", `Expected command bar active state to mirror wishlist, got ${libraryCommandFiltered.commandActive}`);
  assert(library.myRows >= 4, `Expected My games rows after PSN demo, got ${library.myRows}`);
  assert(library.nextSteps >= library.myRows, `Expected next-step guidance for each My games row, got ${library.nextSteps}/${library.myRows}`);
  assert(/Next|No-spend|Intent|Memory|Дальше|Без трат|Намерение|Память/.test(library.nextStepText), "Expected actionable next-step copy in Library rows");
  assert(library.quickActions >= library.myRows, `Expected compact quick actions for each My games row, got ${library.quickActions}/${library.myRows}`);
  assert(library.moreActions >= library.myRows, `Expected advanced state disclosure for each My games row, got ${library.moreActions}/${library.myRows}`);
  assert(/No-spend|Wishlist|Taste memory|Без трат|Желаемое|Память вкуса/.test(library.dashboardText), "Library dashboard should expose product-level summaries");
  assert(wishlistBefore.activeView === "wishlist", `Expected Wishlist view, got ${wishlistBefore.activeView}`);
  assert(wishlistBefore.dashboardCards >= 3, `Expected wishlist dashboard cards, got ${wishlistBefore.dashboardCards}`);
  assert(wishlistBefore.filters >= 5, `Expected wishlist filters, got ${wishlistBefore.filters}`);
  assert(wishlistBefore.activeFilter === "all", `Expected all wishlist filter by default, got ${wishlistBefore.activeFilter}`);
  assert(wishlistBefore.priceAlerts >= 1, "Expected wishlist rows to expose price alert controls");
  assert(priceAlertTitle, "Expected at least one wishlist row with a price alert target");
  assert(wishlistTargetSet.hasClear, "Expected saved target price to expose a Clear button");
  assert(/Alert below|target|Сообщить ниже|цель/i.test(wishlistTargetSet.text), "Expected saved target price copy in wishlist row");
  assert(!wishlistTargetCleared.hasClear, "Expected clearing target price to remove Clear button");
  assert(wishlistFiltered.activeFilter === "verify", `Expected verify wishlist filter, got ${wishlistFiltered.activeFilter}`);
  assert(wishlistBefore.rows >= 3, `Expected wishlist triage rows, got ${wishlistBefore.rows}`);
  assert(wishlistBefore.actionButtons >= wishlistBefore.rows * 3, "Wishlist rows should expose quick state actions");
  assert(afterBuy.access === "owned_forever", `Expected ${afterBuy.title} to be saved as owned_forever, got ${afterBuy.access}`);
  assert(afterBuy.saved === false, "Bought games should leave the wishlist saved flag");
  assert(/найдено (?:8\d|9\d|1\d\d)\/111|matched (?:8\d|9\d|1\d\d)\/111/i.test(founderRanking.preview.text), `Expected founder preview to recognize 80+ scoring matches, got: ${founderRanking.preview.text}`);
  assert(/Опоры вкуса|Taste anchors/.test(founderRanking.preview.text), `Expected founder preview to show trusted taste anchors, got: ${founderRanking.preview.text}`);
  assert(/известно в источниках: 111\/111|known (?:in|to) sources: 111\/111|111\/111 known in sources/i.test(founderRanking.preview.text), `Expected founder preview to show full known-source coverage, got: ${founderRanking.preview.text}`);
  assert(/Отчёт импорта|Import report/.test(founderRanking.preview.report) && /80/.test(founderRanking.preview.report) && /111/.test(founderRanking.preview.report), `Expected founder import report to summarize anchor and known-source coverage, got: ${founderRanking.preview.report}`);
  assert(!founderRanking.preview.batch, "A fully covered founder ranking should not create a redundant provider queue");
  assert(founderRanking.preview.gapBrief, "Expected founder import report to expose a coverage/gap brief");
  assert(/нет пробелов|no source gaps|coverage check|проверка покрытия/i.test(founderRanking.preview.gapText), `Expected complete-coverage copy, got: ${founderRanking.preview.gapText}`);
  assert(/(?:80|8[1-9]|9\d|1\d\d)/.test(founderRanking.taste.summary), `Expected founder taste summary to include 80+ imported ratings, got: ${founderRanking.taste.summary}`);
  assert(founderRanking.taste.profile.includes("111"), `Expected founder taste profile to include ranked baseline size, got: ${founderRanking.taste.profile}`);
  assert(/111/.test(founderRanking.calibration), `Expected forecast calibration to use all 111 resolved ranking records, got: ${founderRanking.calibration}`);
  assert(/(?:±\s*)?8(?:\D|$)|atom patterns|паттерны игровых атомов/i.test(founderRanking.calibration), `Expected founder calibration to expose measured rank-aware model quality, got: ${founderRanking.calibration}`);
  assert(/Taste profile|Профиль вкуса|gaming fingerprint|игровой отпечаток/i.test(founderRanking.taste.screen), `Expected founder taste profile screen to render, got: ${founderRanking.taste.screen}`);
  assert(["calm", "intense", "balanced"].includes(founderRanking.taste.intensityKind), `Expected founder intensity preference, got: ${founderRanking.taste.intensityKind}`);
  assert(/Preferred pace|Предпочтительный ритм/i.test(founderRanking.taste.intensity), `Expected localized intensity preference copy, got: ${founderRanking.taste.intensity}`);
  assert(founderRanking.taste.atoms.some((atom) => /сюжет|story/i.test(atom)), `Expected founder taste atoms to include story, got: ${founderRanking.taste.atoms.join(", ")}`);
  assert(founderRanking.wishlist.rows.some((title) => ["Mafia: The Old Country", "007 First Light", "The Alters", "Dead Space", "Final Fantasy VII Rebirth"].includes(title)), `Expected founder wishlist to surface story-forward next candidates, got: ${founderRanking.wishlist.rows.join(" / ")}`);
  assert(founderRanking.wishlist.rows.includes("Ghost of Yotei"), `An explicitly imported backbone wishlist game should become a recommendation candidate, got: ${founderRanking.wishlist.rows.join(" / ")}`);
  assert(!founderRanking.wishlist.rows.includes("Alan Wake 2"), `Imported ranked games should teach taste, not reappear as next wishlist picks: ${founderRanking.wishlist.rows.join(" / ")}`);
  assert(!founderRanking.wishlist.rows.slice(0, 8).includes("EA Sports FC 26"), `Sports service-loop game should not appear in founder wishlist top rows: ${founderRanking.wishlist.rows.join(" / ")}`);
  assert(founderRanking.preview.overflow <= 1 && founderRanking.wishlist.overflow <= 1, "Founder ranking UI should not introduce horizontal overflow");
  assert(errors.length === 0, `Page errors: ${errors.join("; ")}`);
} finally {
  await browser.close();
}
