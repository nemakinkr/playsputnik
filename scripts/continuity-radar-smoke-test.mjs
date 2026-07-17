import { createRequire } from "node:module";

const DEFAULT_URL = "http://127.0.0.1:4190/?v=continuity-radar-smoke";
const CHROME = process.env.PLAYSPUTNIK_CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const MODULES = "/Users/kirillnemakin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const targetUrl = process.argv.find((arg) => /^https?:/.test(arg)) || DEFAULT_URL;
const require = createRequire(`${MODULES}/playwright/package.json`);
const { chromium } = require("playwright");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const browser = await chromium.launch({ headless: true, executablePath: CHROME });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.evaluate(() => {
    localStorage.setItem("playsputnik.prototype.state.v2", JSON.stringify({
      stateVersion: 8, activeView: "today", liked: [], hidden: [], saved: [], snoozed: [], userStates: {},
      userGames: {
        control: {
          title: "Control", completionStatus: "playing", hoursPlayed: 1, startedAt: "2026-07-17T10:00:00.000Z",
          lastActivityAt: "2026-07-17T10:00:00.000Z", playProgress: { sessionCount: 1, totalMinutes: 60, lastSessionMinutes: 60 },
        },
      },
    }));
  });
  await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForSelector("#continuity-panel:not([hidden]) [data-continuity-log]", { timeout: 10000 });
  await page.click("[data-continuity-log]");
  await page.waitForFunction(() => {
    const state = JSON.parse(localStorage.getItem("playsputnik.prototype.state.v2") || "{}");
    return Object.values(state.userGames || {}).some((record) => record.title === "Control" && record.playProgress?.sessionCount === 2);
  }, null, { timeout: 5000 });
  const afterSession = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("playsputnik.prototype.state.v2") || "{}");
    return Object.values(state.userGames || {}).find((record) => record.title === "Control");
  });
  assert(afterSession.playProgress.sessionCount === 2, "continuity check-in should increment session count");
  assert(afterSession.hoursPlayed > 1, "continuity check-in should increment hours played");

  await page.click("[data-continuity-finish]");
  const afterFinish = await page.evaluate(() => ({
    hidden: document.querySelector("#continuity-panel")?.hidden,
    status: Object.values(JSON.parse(localStorage.getItem("playsputnik.prototype.state.v2") || "{}").userGames || {})
      .find((record) => record.title === "Control")?.completionStatus,
  }));
  assert(afterFinish.hidden && afterFinish.status === "completed", "finished game should leave the active continuity slot");

  await page.click('[data-app-view="discover"]');
  await page.waitForTimeout(2500);
  const radarReady = await page.evaluate(() => ({
    activeView: document.querySelector("[data-app-view].is-active")?.dataset.appView,
    rows: document.querySelectorAll(".radar-row [data-radar-save]").length,
    status: document.querySelector("#radar-status")?.textContent,
  }));
  assert(radarReady.rows > 0, `sourced radar should render in Discover: ${JSON.stringify(radarReady)}; errors=${errors.join(" | ")}`);
  const radarTitle = await page.locator(".radar-row .radar-main strong").first().textContent();
  await page.locator(".radar-row [data-radar-save]").first().click();
  const radarMemory = await page.evaluate((title) => {
    const state = JSON.parse(localStorage.getItem("playsputnik.prototype.state.v2") || "{}");
    return Object.values(state.userGames || {}).find((record) => record.title === title);
  }, radarTitle);
  assert(radarMemory?.saved, "radar watch action should persist wishlist intent");
  assert(radarMemory?.provider === "rawg" && radarMemory?.sourceUrl, "radar memory should retain RAWG source passport");
  assert(errors.length === 0, `Page errors: ${errors.join("; ")}`);
  console.log("✅ continuity check-in, completion handoff, and sourced radar save work in browser");
} finally {
  await browser.close();
}
