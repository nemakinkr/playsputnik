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
      stateVersion: 9, activeView: "today", liked: [], hidden: [], saved: [], snoozed: [], userStates: {},
      userGames: {
        control: {
          title: "Control", completionStatus: "playing", hoursPlayed: 1, startedAt: "2026-07-17T10:00:00.000Z",
          lastActivityAt: "2026-07-17T10:00:00.000Z", playProgress: { sessionCount: 1, totalMinutes: 60, lastSessionMinutes: 60 },
        },
        "alan wake 2": {
          title: "Alan Wake 2", completionStatus: "paused", hoursPlayed: 2, startedAt: "2026-07-16T10:00:00.000Z",
          lastActivityAt: "2026-07-16T10:00:00.000Z", playProgress: { sessionCount: 0, totalMinutes: 0, lastSessionMinutes: 0, sessions: [] },
        },
      },
    }));
  });
  await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForSelector("#continuity-panel:not([hidden]) [data-continuity-log]", { timeout: 10000 });
  const initial = await page.evaluate(() => ({
    activeGames: document.querySelectorAll("[data-continuity-select]").length,
    briefingKinds: [...document.querySelectorAll("[data-briefing-action]")].map((button) => button.dataset.briefingAction),
  }));
  assert(initial.activeGames === 2, `expected two manageable active games, got ${initial.activeGames}`);
  assert(initial.briefingKinds[0] === "continue", `daily briefing should lead with active play: ${initial.briefingKinds}`);

  await page.click('[data-continuity-select="Alan Wake 2"]');
  await page.click("[data-continuity-log]");
  await page.waitForFunction(() => {
    const state = JSON.parse(localStorage.getItem("playsputnik.prototype.state.v2") || "{}");
    return Object.values(state.userGames || {}).some((record) => record.title === "Alan Wake 2" && record.playProgress?.sessionCount === 1);
  }, null, { timeout: 5000 });
  const afterSession = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("playsputnik.prototype.state.v2") || "{}");
    return {
      game: Object.values(state.userGames || {}).find((record) => record.title === "Alan Wake 2"),
      historyRows: document.querySelectorAll(".continuity-history li").length,
    };
  });
  assert(afterSession.game.playProgress.sessionCount === 1, "selected game check-in should increment its session count");
  assert(afterSession.game.hoursPlayed > 2, "selected game check-in should increment its hours played");
  assert(afterSession.game.playProgress.sessions.length === 1 && afterSession.historyRows === 1, "session history should persist and render");

  await page.click("[data-continuity-finish]");
  const afterFirstFinish = await page.evaluate(() => ({
    hidden: document.querySelector("#continuity-panel")?.hidden,
    status: Object.values(JSON.parse(localStorage.getItem("playsputnik.prototype.state.v2") || "{}").userGames || {})
      .find((record) => record.title === "Alan Wake 2")?.completionStatus,
    focus: document.querySelector(".continuity-copy strong")?.textContent,
  }));
  assert(!afterFirstFinish.hidden && afterFirstFinish.status === "completed" && /Control/.test(afterFirstFinish.focus), "finishing one game should hand focus to the next active game");
  await page.click("[data-continuity-finish]");
  const allFinished = await page.evaluate(() => document.querySelector("#continuity-panel")?.hidden);
  assert(allFinished, "continuity panel should close after the final active game is completed");

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
  console.log("✅ multi-game continuity, session history, daily briefing, and sourced radar save work in browser");
} finally {
  await browser.close();
}
