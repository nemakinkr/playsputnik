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
const injectRawg = process.argv.includes("--inject-rawg");

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
  if (injectRawg) {
    await page.evaluate(({ key, query, title }) => {
      localStorage.setItem(key, JSON.stringify({
        stateVersion: 3,
        liked: [],
        hidden: [],
        saved: [],
        snoozed: [],
        userStates: {},
        userGames: {},
        quickReactions: {},
        calibrationSkips: {},
        comparisonGames: { first: "", second: "" },
        ratingQueue: {},
        activeView: "discover",
        gameSearchQuery: query,
        providerSearch: {
          query: "",
          status: "idle",
          provider: "",
          sourceHealth: "",
          results: [],
          error: "",
        },
        providerSearchCache: {
          [query.toLowerCase()]: {
          query,
          status: "cached",
          provider: "rawg",
          sourceHealth: "cached_results",
          sourceHealthDetail: "Using locally cached provider results.",
          resultShapeVersion: "search-result-v3",
          checkedAt: "2026-07-01T11:30:00Z",
          cachedAt: "2026-07-01T11:35:00Z",
          results: [{
            resultShapeVersion: "search-result-v3",
            title,
            sourceId: "rawg_provider_hook",
            sourceLabel: "RAWG provider",
            catalogStatus: "provider_result",
            matchConfidence: "high",
            matchKind: "exact",
            coverStatus: "candidate",
            priceStatus: "missing",
            provider: "rawg",
            sourceUrl: "https://rawg.io/games/firewatch",
            coverUrl: "https://media.rawg.io/media/games/firewatch-test.jpg",
            platforms: ["PC", "PlayStation", "Xbox", "Nintendo"],
            atoms: ["exploration", "story", "mystery"],
            inferredAtoms: ["exploration", "story", "mystery"],
            session: "medium",
            length: "short",
            difficulty: "normal",
            commitment: "low",
            tone: "moody",
            content: "low-violence",
            reviewBurden: "low",
            adultTimeFit: "weeknight",
            inferenceProfile: {
              version: "rawg-inference-v1",
              status: "inferred",
              confidence: "medium",
              fields: {
                atoms: { value: ["exploration", "story", "mystery"], confidence: "medium", evidence: [] },
                session: { value: "medium", confidence: "medium", evidence: [] },
                length: { value: "short", confidence: "medium", evidence: [{ kind: "rawg_average_playtime", value: "4h" }] },
              },
              limitations: ["price_requires_store_source", "subscription_requires_store_source"],
            },
            vibe: "Adventure provider result",
            reason: "Live metadata provider result; price and subscription status still need store-backed checks.",
            score: 96,
            canAddToWishlist: true,
          }],
        },
        },
      }));
    }, { key: STORAGE_KEY, query: searchQuery, title: expectedTitle });
  }
  await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForFunction(() => window.__playsputnikBoot?.coreRenderedAt, null, { timeout: 10000 });

  await page.evaluate(() => document.querySelector('[data-app-view="discover"]')?.click());
  let suggestion = { value: "", rows: 0, suggestions: 0, skipped: true };
  if (!injectRawg) {
    await page.locator('[data-search-suggestion="Stray"]').click();
    await page.waitForTimeout(300);
    suggestion = await page.evaluate(() => ({
      value: document.querySelector("#game-search-input")?.value || "",
      rows: document.querySelectorAll(".game-search-row").length,
      suggestions: document.querySelectorAll("[data-search-suggestion]").length,
      skipped: false,
    }));
  }
  await page.locator("#game-search-input").fill(searchQuery);
  if (injectRawg) {
    await page.waitForFunction((title) => {
      const rows = Array.from(document.querySelectorAll(".game-search-row"));
      return rows.some((row) => (row.querySelector("strong")?.textContent || "").trim() === title);
    }, expectedTitle, { timeout: 15000 });
  } else {
    await page.waitForTimeout(500);
  }
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
    firstTitle: document.querySelector(".game-search-row")?.firstElementChild?.querySelector("strong")?.textContent || "",
    allTitles: Array.from(document.querySelectorAll(".game-search-row"))
      .map((row) => row.firstElementChild?.querySelector("strong")?.textContent || ""),
    coverPreviews: document.querySelectorAll(".game-search-cover").length,
    rawgCoverPreviews: Array.from(document.querySelectorAll(".game-search-cover figcaption, .game-search-cover span"))
      .filter((item) => /RAWG/i.test(item.textContent || "")).length,
    firstRowFacts: document.querySelector(".game-search-row")?.querySelectorAll(".facts .fact").length || 0,
    detailButtons: document.querySelectorAll("[data-search-detail]").length,
    memoryPanels: document.querySelectorAll("[data-search-memory-panel]").length,
    savedButtons: document.querySelectorAll('[data-search-state="saved"]').length,
    ownedButtons: document.querySelectorAll('[data-search-state="owned"]').length,
    subscriptionButtons: document.querySelectorAll('[data-search-state="subscription"]').length,
    pressedButtons: document.querySelectorAll('[data-search-state][aria-pressed]').length,
    focusCards: document.querySelectorAll(".game-search-focus").length,
    focusTitle: document.querySelector(".game-search-focus strong")?.textContent?.trim() || "",
    focusButtons: document.querySelectorAll("[data-focus-state]").length,
    focusSavedPressed: document.querySelector('[data-focus-state="saved"]')?.getAttribute("aria-pressed") || "",
    passportChecks: document.querySelectorAll(".game-search-row .source-check").length,
  }));
  before.suggestion = suggestion;

  await page.evaluate(() => document.querySelector('[data-focus-state="saved"]')?.click());
  await page.waitForTimeout(500);

  const afterFocusSave = await page.evaluate(({ key, expectedTitle }) => {
    const stored = JSON.parse(localStorage.getItem(key) || "{}");
    const record = Object.values(stored.userGames || {}).find((item) => item.title === expectedTitle);
    const userState = Object.values(stored.userStates || {}).find((item) => item.title === expectedTitle);
    return {
      activeSaved: document.querySelector('[data-focus-state="saved"]')?.classList.contains("is-selected") || false,
      pressedSaved: document.querySelector('[data-focus-state="saved"]')?.getAttribute("aria-pressed") || "",
      nextSteps: document.querySelector("[data-focus-next-steps]")?.textContent?.replace(/\s+/g, " ").trim() || "",
      nextStepButtons: document.querySelectorAll("[data-focus-open-wishlist], [data-focus-open-library], [data-focus-rate-later]").length,
      record: record ? {
        title: record.title,
        access: record.access || "",
        saved: Boolean(record.saved),
        source: record.source || "",
      } : null,
      userState: userState?.state || "",
    };
  }, { key: STORAGE_KEY, expectedTitle });

  await page.evaluate(() => document.querySelector("[data-focus-open-wishlist]")?.click());
  await page.waitForTimeout(500);
  const focusedWishlistFromSearch = await page.evaluate((expectedTitle) => ({
    activeView: document.querySelector("[data-app-view].is-active")?.dataset.appView || "",
    hasFocusedRow: Array.from(document.querySelectorAll(".wishlist-row.is-focused-memory"))
      .some((item) => (item.querySelector("strong")?.textContent || "").trim() === expectedTitle),
    banner: document.querySelector(".focused-memory-banner")?.textContent?.replace(/\s+/g, " ").trim() || "",
    pill: document.querySelector(".wishlist-row.is-focused-memory .focused-memory-pill")?.textContent?.trim() || "",
  }), expectedTitle);
  await page.evaluate(() => document.querySelector('[data-app-view="discover"]')?.click());
  await page.waitForFunction(() => document.querySelector("[data-app-view].is-active")?.dataset.appView === "discover", null, { timeout: 5000 });

  let afterFocusOwned = null;
  let focusedLibraryFromSearch = null;
  if (!injectRawg) {
    await page.evaluate(() => document.querySelector('[data-focus-state="owned"]')?.click());
    await page.waitForTimeout(500);

    afterFocusOwned = await page.evaluate(({ key, expectedTitle }) => {
      const stored = JSON.parse(localStorage.getItem(key) || "{}");
      const record = Object.values(stored.userGames || {}).find((item) => item.title === expectedTitle);
      const userState = Object.values(stored.userStates || {}).find((item) => item.title === expectedTitle);
      return {
        activeOwned: document.querySelector('[data-focus-state="owned"]')?.classList.contains("is-selected") || false,
        pressedOwned: document.querySelector('[data-focus-state="owned"]')?.getAttribute("aria-pressed") || "",
        nextSteps: document.querySelector("[data-focus-next-steps]")?.textContent?.replace(/\s+/g, " ").trim() || "",
        openLibraryButtons: document.querySelectorAll("[data-focus-open-library]").length,
        record: record ? {
          title: record.title,
          access: record.access || "",
          saved: Boolean(record.saved),
          source: record.source || "",
        } : null,
        userState: userState?.state || "",
      };
    }, { key: STORAGE_KEY, expectedTitle });

    await page.evaluate(() => document.querySelector("[data-focus-open-library]")?.click());
    await page.waitForTimeout(500);
    focusedLibraryFromSearch = await page.evaluate((expectedTitle) => ({
      activeView: document.querySelector("[data-app-view].is-active")?.dataset.appView || "",
      hasFocusedRow: Array.from(document.querySelectorAll(".my-game-row.is-focused-memory"))
        .some((item) => (item.querySelector("strong")?.textContent || "").trim() === expectedTitle),
      banner: document.querySelector(".focused-memory-banner")?.textContent?.replace(/\s+/g, " ").trim() || "",
      pill: document.querySelector(".my-game-row.is-focused-memory .focused-memory-pill")?.textContent?.trim() || "",
    }), expectedTitle);
    await page.evaluate(() => document.querySelector('[data-app-view="discover"]')?.click());
    await page.waitForFunction(() => document.querySelector("[data-app-view].is-active")?.dataset.appView === "discover", null, { timeout: 5000 });
  }

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
      checklist: Array.from(row?.querySelectorAll(".game-search-memory-checks span") || []).map((item) => ({
        text: item.textContent.trim(),
        done: item.classList.contains("is-done"),
      })),
      confirmation: row?.querySelector("[data-search-saved-confirmation]")?.textContent?.replace(/\s+/g, " ").trim() || "",
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
    providerImportSections: document.querySelectorAll("[data-detail-provider-import]").length,
    providerImportSourceLinks: document.querySelectorAll("[data-detail-provider-import] a[href]").length,
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
        session: record.session || "",
        length: record.length || "",
        commitment: record.commitment || "",
        inferenceVersion: record.inferenceProfile?.version || "",
        inferenceConfidence: record.inferenceProfile?.confidence || "",
        providerImport: record.providerImport || null,
        sourcePassport: record.sourcePassport || null,
        coverUrl: record.coverUrl || "",
        sourceUrl: record.sourceUrl || "",
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

  await page.evaluate(() => document.querySelector('[data-app-view="data"]')?.click());
  await page.waitForTimeout(500);
  const dataProviderImports = await page.evaluate((expectedTitle) => ({
    activeView: document.querySelector("[data-app-view].is-active")?.dataset.appView || "",
    status: document.querySelector("#provider-import-status")?.textContent || "",
    rows: document.querySelectorAll("#provider-import-list .provider-import-row").length,
    covers: document.querySelectorAll("#provider-import-list .provider-import-cover").length,
    sourceLinks: document.querySelectorAll("#provider-import-list .provider-import-row a[href]").length,
    actionButtons: document.querySelectorAll("#provider-import-list [data-provider-import-action]").length,
    filters: Array.from(document.querySelectorAll("#provider-import-list [data-provider-import-filter]")).map((button) => ({
      id: button.dataset.providerImportFilter,
      pressed: button.getAttribute("aria-pressed"),
      text: button.textContent.trim(),
    })),
    reviewStatus: document.querySelector("#provider-import-list .provider-import-status")?.textContent || "",
    gapText: document.querySelector("#provider-import-list .provider-import-row small")?.textContent || "",
    hasGame: Array.from(document.querySelectorAll("#provider-import-list .provider-import-row strong"))
      .some((item) => (item.textContent || "").trim() === expectedTitle),
  }), expectedTitle);

  await page.evaluate((expectedTitle) => {
    const row = Array.from(document.querySelectorAll("#provider-import-list .provider-import-row"))
      .find((item) => Array.from(item.querySelectorAll("strong")).some((strong) => (strong.textContent || "").trim() === expectedTitle));
    row?.querySelector('[data-provider-import-action="accept"]')?.click();
  }, expectedTitle);
  await page.waitForTimeout(300);
  const providerReviewAction = await page.evaluate(({ key, expectedTitle }) => {
    const stored = JSON.parse(localStorage.getItem(key) || "{}");
    const record = Object.values(stored.userGames || {}).find((item) => item.title === expectedTitle);
    return {
      status: record?.providerImport?.status || "",
      reviewAction: record?.providerImport?.reviewAction || "",
      saved: Boolean(record?.saved),
      userState: Object.values(stored.userStates || {}).find((item) => item.title === expectedTitle)?.state || "",
    };
  }, { key: STORAGE_KEY, expectedTitle });

  await page.evaluate(() => document.querySelector('[data-provider-import-filter="accepted"]')?.click());
  await page.waitForTimeout(300);
  const acceptedProviderImports = await page.evaluate((expectedTitle) => ({
    rows: document.querySelectorAll("#provider-import-list .provider-import-row").length,
    reviewStatus: document.querySelector("#provider-import-list .provider-import-status")?.textContent || "",
    hasOpenWishlist: Boolean(document.querySelector('[data-provider-import-action="open-wishlist"]')),
    hasGame: Array.from(document.querySelectorAll("#provider-import-list .provider-import-row strong"))
      .some((item) => (item.textContent || "").trim() === expectedTitle),
  }), expectedTitle);

  await page.evaluate(() => document.querySelector('[data-provider-import-action="open-wishlist"]')?.click());
  await page.waitForTimeout(300);
  const providerWishlistPath = await page.evaluate((expectedTitle) => ({
    activeView: document.querySelector("[data-app-view].is-active")?.dataset.appView || "",
    hasGame: Array.from(document.querySelectorAll(".wishlist-row strong, #wishlist-dashboard strong, .wishlist-card strong"))
      .some((item) => (item.textContent || "").trim() === expectedTitle),
    hasFocusedRow: Array.from(document.querySelectorAll(".wishlist-row.is-focused-memory"))
      .some((item) => (item.querySelector("strong")?.textContent || "").trim() === expectedTitle),
    focusBanner: document.querySelector(".focused-memory-banner")?.textContent?.replace(/\s+/g, " ").trim() || "",
    sourceNotes: document.querySelectorAll("[data-wishlist-source-note]").length,
    sourceNoteText: document.querySelector("[data-wishlist-source-note]")?.textContent?.replace(/\s+/g, " ").trim() || "",
  }), expectedTitle);

  const result = { mode: "search-memory-smoke", url: targetUrl, searchQuery, expectedTitle, targetState, before, afterFocusOwned, focusedLibraryFromSearch, afterFocusSave, focusedWishlistFromSearch, afterSearchSave, detail, after, library, dataProviderImports, providerReviewAction, acceptedProviderImports, providerWishlistPath, errors };
  console.log(JSON.stringify(result, null, 2));

  if (!injectRawg) {
    assert(before.suggestion.suggestions >= 4, `Expected quick search suggestions, got ${before.suggestion.suggestions}`);
    assert(before.suggestion.value === "Stray", `Expected suggestion click to set Stray search, got ${before.suggestion.value}`);
    assert(before.suggestion.rows >= 1, `Expected suggestion click to render at least one search row, got ${before.suggestion.rows}`);
  }
  assert(before.rows >= 1, `Expected search rows, got ${before.rows}`);
  assert(before.firstTitle === expectedTitle, `Expected ${expectedTitle} as first result, got ${before.firstTitle}`);
  if (injectRawg) assert(/match|Найдено|result|совпад/i.test(before.searchStatus), `Expected user-facing search result status, got ${before.searchStatus}`);
  assert(before.detailButtons >= 1, "Expected search Details action");
  if (injectRawg) {
    assert(before.rows >= 1, "Expected RAWG-backed search to render at least one candidate row");
    assert(before.firstRowFacts >= 4, `Expected source facts in the first search row, got ${before.firstRowFacts}`);
  }
  assert(before.memoryPanels >= 1, "Expected search memory confirmation panels");
  assert(before.savedButtons >= 1, "Expected search Wishlist action");
  assert(before.ownedButtons >= 1, "Expected search Owned action");
  assert(before.subscriptionButtons >= 1, "Expected search Plus action");
  assert(before.pressedButtons >= 3, "Expected search memory actions to expose pressed state");
  assert(before.focusCards >= 1, "Expected best-match focus card");
  assert(before.focusTitle === expectedTitle, `Expected focus card for ${expectedTitle}, got ${before.focusTitle}`);
  assert(before.focusButtons >= 3, `Expected focus card state actions, got ${before.focusButtons}`);
  if (!injectRawg) {
    assert(afterFocusOwned?.record?.access === "owned", `Expected focus Library action to save owned access, got ${afterFocusOwned?.record?.access}`);
    assert(afterFocusOwned.activeOwned, "Expected focus Library button to become selected");
    assert(afterFocusOwned.pressedOwned === "true", `Expected focus Library aria-pressed=true, got ${afterFocusOwned.pressedOwned}`);
    assert(afterFocusOwned.userState === "owned", `Expected owned userState after focus action, got ${afterFocusOwned.userState}`);
    assert(afterFocusOwned.openLibraryButtons >= 1, `Expected focus Library next-step action, got ${afterFocusOwned.openLibraryButtons}`);
    assert(focusedLibraryFromSearch?.activeView === "library", `Expected focus next step to open Library, got ${focusedLibraryFromSearch?.activeView}`);
    assert(focusedLibraryFromSearch.hasFocusedRow, "Expected Library next step to focus the owned game row");
    assert(/Library|Библиотек|available|доступ/i.test(focusedLibraryFromSearch.banner), `Expected Library focus banner, got ${focusedLibraryFromSearch.banner}`);
    assert(/search|поиск/i.test(focusedLibraryFromSearch.pill), `Expected focused Library row to show source pill, got ${focusedLibraryFromSearch.pill}`);
  }
  assert(afterFocusSave.record?.saved, "Expected focus card Wishlist action to save the external game");
  assert(afterFocusSave.record?.source?.startsWith("search_"), `Expected focus save source memory, got ${afterFocusSave.record?.source}`);
  assert(afterFocusSave.activeSaved, "Expected focus Wishlist button to become selected");
  assert(afterFocusSave.pressedSaved === "true", `Expected focus Wishlist aria-pressed=true, got ${afterFocusSave.pressedSaved}`);
  assert(["saved", "owned"].includes(afterFocusSave.userState), `Expected saved/owned userState after focus action, got ${afterFocusSave.userState}`);
  assert(/Wishlist|Желаемое|контур|loop/i.test(afterFocusSave.nextSteps), `Expected focus next-step handoff after save, got ${afterFocusSave.nextSteps}`);
  assert(afterFocusSave.nextStepButtons >= 2, `Expected focus next-step buttons after save, got ${afterFocusSave.nextStepButtons}`);
  assert(focusedWishlistFromSearch.activeView === "wishlist", `Expected focus next step to open Wishlist, got ${focusedWishlistFromSearch.activeView}`);
  assert(focusedWishlistFromSearch.hasFocusedRow, "Expected Wishlist next step to focus the saved game row");
  assert(/Wishlist|Желаем|saved|сохранили|добавили/i.test(focusedWishlistFromSearch.banner), `Expected Wishlist focus banner, got ${focusedWishlistFromSearch.banner}`);
  assert(/search|поиск/i.test(focusedWishlistFromSearch.pill), `Expected focused Wishlist row to show source pill, got ${focusedWishlistFromSearch.pill}`);
  assert(before.passportChecks >= 5, `Expected search source passport checks, got ${before.passportChecks}`);
  assert(afterSearchSave.record?.saved, "Expected direct search Wishlist action to save the external game");
  assert(afterSearchSave.record?.source?.startsWith("search_"), `Expected direct search save source memory, got ${afterSearchSave.record?.source}`);
  assert(afterSearchSave.activeSaved, "Expected direct Wishlist button to become selected");
  assert(afterSearchSave.pressedSaved === "true", `Expected Wishlist aria-pressed=true, got ${afterSearchSave.pressedSaved}`);
  assert(afterSearchSave.openWishlistButtons >= 1, "Expected saved search result to expose an Open Wishlist next step");
  assert(/Wishlist|Желаемое/i.test(afterSearchSave.confirmation), `Expected saved search result confirmation, got ${afterSearchSave.confirmation}`);
  assert(afterSearchSave.checklist.length >= 3, "Expected search memory confirmation checklist");
  assert(afterSearchSave.checklist.filter((item) => item.done).length >= 2, "Expected checklist to mark remembered/source steps as done");
  assert(/Saved to Wishlist|Added to Library|Добавлено в Желаемое|Добавлено в Библиотеку/i.test(afterSearchSave.memoryStatus), `Expected search memory confirmation, got ${afterSearchSave.memoryStatus}`);
  assert(["saved", "owned"].includes(afterSearchSave.userState), `Expected saved/owned userState after direct search action, got ${afterSearchSave.userState}`);
  assert(detail.title === expectedTitle, `Expected ${expectedTitle} detail drawer, got ${detail.title}`);
  assert(/fit|совпадение/i.test(detail.meta), `Expected detail fit metadata, got ${detail.meta}`);
  assert(detail.actions >= 7, `Expected detail actions including Plus, got ${detail.actions}`);
  assert(detail.plusAction, "Expected detail Plus action");
  assert(detail.passportChecks >= 5, `Expected detail source passport checks, got ${detail.passportChecks}`);
  if (injectRawg) {
    assert(detail.providerImportSections >= 1, "Expected RAWG detail drawer to expose provider import section");
    assert(detail.providerImportSourceLinks >= 1, "Expected RAWG detail drawer to link back to source");
  }
  if (targetState === "saved") {
    assert(after.record?.saved, "Expected saved target state to persist as Wishlist memory");
  } else {
    assert(after.record?.access === targetState, `Expected ${targetState} access, got ${after.record?.access}`);
  }
  assert(after.record?.source?.startsWith("search_"), `Expected search source memory, got ${after.record?.source}`);
  assert(after.record?.catalogStatus, "Expected catalog status to persist");
  assert(after.record?.matchConfidence, "Expected match confidence to persist");
  assert(after.record?.coverStatus, "Expected cover status to persist");
  assert(after.record?.priceStatus, "Expected price status to persist");
  assert(after.record?.provider, "Expected provider metadata to persist");
  assert(after.record.atoms + after.record.inferredAtoms > 0, "Expected source or inferred atoms to persist");
  if (injectRawg) {
    assert(after.record?.provider === "rawg", `Expected RAWG provider memory, got ${after.record?.provider}`);
    assert(after.record?.providerImport?.provider === "rawg", "Expected RAWG provider import passport to persist");
    assert(after.record?.providerImport?.status === "candidate", `Expected RAWG provider import candidate status, got ${after.record?.providerImport?.status}`);
    assert(after.record?.providerImport?.attributionRequired, "Expected RAWG cover attribution flag");
    assert(after.record?.sourcePassport?.sourceId === "rawg_provider_hook", `Expected source passport rawg hook, got ${after.record?.sourcePassport?.sourceId}`);
    assert(after.record?.sourcePassport?.resultShapeVersion === "search-result-v3", "Expected provider result shape version to persist");
    assert(after.record?.sourcePassport?.inferenceVersion === "rawg-inference-v1", "Expected inference version in the source passport");
    assert(after.record?.session === "medium" && after.record?.length === "short", "Expected inferred time profile to persist");
    assert(after.record?.commitment === "low", "Expected inferred commitment to persist");
    assert(after.record?.inferenceVersion === "rawg-inference-v1", "Expected structured inference profile to persist");
    assert(after.record?.inferenceConfidence === "medium", "Expected capped inference confidence to persist");
    assert(after.record?.coverUrl && after.record?.sourceUrl, "Expected RAWG cover/source URLs to persist");
    assert(after.record.atoms >= 3, `Expected RAWG/imported candidate atoms to feed taste, got ${after.record.atoms}`);
    assert(dataProviderImports.activeView === "data", `Expected Data view for provider import review, got ${dataProviderImports.activeView}`);
    assert(dataProviderImports.rows >= 1, "Expected provider import review rows in Data");
    assert(dataProviderImports.covers >= 1, "Expected provider import review to show cover previews");
    assert(dataProviderImports.sourceLinks >= 1, "Expected provider import review to expose source links");
    assert(dataProviderImports.actionButtons >= 3, "Expected provider import review actions");
    assert(dataProviderImports.filters.length >= 4, "Expected provider import filter controls");
    assert(dataProviderImports.filters.some((item) => item.id === "candidate" && item.pressed === "true"), "Expected candidate provider import filter to be active by default");
    assert(/Candidate|Кандидат/i.test(dataProviderImports.reviewStatus), `Expected provider import candidate status, got ${dataProviderImports.reviewStatus}`);
    assert(/price|цена|Ready|Готово/i.test(dataProviderImports.gapText), `Expected provider import review gap/readiness copy, got ${dataProviderImports.gapText}`);
    assert(dataProviderImports.hasGame, "Expected RAWG imported game in Data provider import review");
    assert(providerReviewAction.status === "accepted", `Expected provider import accept action to persist, got ${providerReviewAction.status}`);
    assert(providerReviewAction.reviewAction === "accept", `Expected provider import review action, got ${providerReviewAction.reviewAction}`);
    assert(providerReviewAction.saved, "Expected accepted provider import to remain saved");
    assert(acceptedProviderImports.rows >= 1, "Expected accepted provider import filter to show accepted row");
    assert(/Accepted|Принято/i.test(acceptedProviderImports.reviewStatus), `Expected accepted status copy, got ${acceptedProviderImports.reviewStatus}`);
    assert(acceptedProviderImports.hasOpenWishlist, "Expected accepted provider import to expose Open Wishlist path");
    assert(acceptedProviderImports.hasGame, "Expected accepted provider import row to retain game title");
    assert(providerWishlistPath.activeView === "wishlist", `Expected provider import path to open Wishlist, got ${providerWishlistPath.activeView}`);
    assert(providerWishlistPath.hasGame, "Expected accepted RAWG import to be visible in Wishlist path");
    assert(providerWishlistPath.hasFocusedRow, "Expected provider import Open Wishlist path to focus the accepted game row");
    assert(/RAWG|Wishlist|Желаем|сохранили|добавили/i.test(providerWishlistPath.focusBanner), `Expected provider import focus banner, got ${providerWishlistPath.focusBanner}`);
    assert(providerWishlistPath.sourceNotes >= 1, "Expected Wishlist to expose source note for accepted RAWG import");
    assert(/RAWG|цена|price|Plus/i.test(providerWishlistPath.sourceNoteText), `Expected Wishlist source note to explain RAWG/missing facts, got ${providerWishlistPath.sourceNoteText}`);
  }
  assert(after.userState === targetState, `Expected ${targetState} userState, got ${after.userState}`);
  assert(after.activeState, `Expected ${targetState} action to become active`);
  assert(library.activeView === "library", `Expected Library view, got ${library.activeView}`);
  assert(library.hasGame, "Expected saved external game to appear in Library memory");
  assert(errors.length === 0, `Page errors: ${errors.join("; ")}`);
} finally {
  await browser.close();
}
