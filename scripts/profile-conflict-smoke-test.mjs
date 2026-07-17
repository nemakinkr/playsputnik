import { createRequire } from "node:module";

const DEFAULT_URL = "http://127.0.0.1:4190/?v=profile-conflict-smoke";
const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BUNDLED_NODE_MODULES = "/Users/kirillnemakin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const targetUrl = process.argv.find((arg) => arg.startsWith("http://") || arg.startsWith("https://")) || DEFAULT_URL;
const chromePath = process.env.PLAYSPUTNIK_CHROME || DEFAULT_CHROME;

async function loadPlaywright() {
  try { return await import("playwright"); }
  catch { return createRequire(`${BUNDLED_NODE_MODULES}/playwright/package.json`)("playwright"); }
}
function assert(condition, message) { if (!condition) throw new Error(message); }

const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ headless: true, executablePath: chromePath });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.evaluate(async () => {
    localStorage.removeItem("playsputnik.prototype.state.v2");
    await window.PlaySputnikStorage?.idbRemove?.("playsputnik.prototype.state.v2");
  });
  await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForFunction(() => window.__playsputnikBoot?.deferredRenderedAt, null, { timeout: 10000 });

  await page.click("#app-view-more > summary");
  await page.click('[data-app-view="data"]');
  const divergent = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("playsputnik.prototype.state.v2") || "{}");
    const local = window.PlaySputnikSync.createProfileEnvelope(state, { deviceId: "device_local" });
    return {
      ...local,
      revision: local.revision + 1,
      baseRevision: 0,
      fingerprint: "fnv1a-browser-other",
      sourceDeviceId: "device_remote",
      profile: {
        ...local.profile,
        userGames: { ...(local.profile.userGames || {}), "sync test": { title: "Sync Test", rating: 95 } },
        syncMeta: { ...local.profile.syncMeta, revision: local.revision + 1 },
      },
    };
  });
  const file = { name: "two-device-backup.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(divergent)) };

  await page.setInputFiles("#import-file", file);
  await page.waitForFunction(() => !document.querySelector("#profile-conflict")?.hidden, null, { timeout: 5000 });
  let snapshot = await page.evaluate(() => ({
    conflictVisible: !document.querySelector("#profile-conflict")?.hidden,
    facts: document.querySelector("#profile-conflict-facts")?.textContent || "",
    hasRemoteGame: Boolean(JSON.parse(localStorage.getItem("playsputnik.prototype.state.v2") || "{}").userGames?.["sync test"]),
  }));
  assert(snapshot.conflictVisible, "divergent backup review must be visible");
  assert(!snapshot.hasRemoteGame, "divergent backup must not change local memory before review");
  assert(/1|2/.test(snapshot.facts), "review should show device revisions");

  await page.click("#profile-conflict-keep");
  assert(await page.locator("#profile-conflict").evaluate((node) => node.hidden), "keep-local should close review");

  await page.setInputFiles("#import-file", file);
  await page.waitForFunction(() => !document.querySelector("#profile-conflict")?.hidden, null, { timeout: 5000 });
  await page.click("#profile-conflict-use");
  await page.waitForFunction(() => Boolean(JSON.parse(localStorage.getItem("playsputnik.prototype.state.v2") || "{}").userGames?.["sync test"]), null, { timeout: 5000 });
  snapshot = await page.evaluate(() => ({
    conflictHidden: document.querySelector("#profile-conflict")?.hidden,
    rating: JSON.parse(localStorage.getItem("playsputnik.prototype.state.v2") || "{}").userGames?.["sync test"]?.rating,
  }));
  assert(snapshot.conflictHidden, "confirmed import should close review");
  assert(snapshot.rating === 95, "confirmed import should apply the selected backup");
  assert(errors.length === 0, `Page errors: ${errors.join("; ")}`);
  console.log(JSON.stringify({ mode: "profile-conflict-smoke", ...snapshot, errors }, null, 2));
} finally {
  await browser.close();
}
