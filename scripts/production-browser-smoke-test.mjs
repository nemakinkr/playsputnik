import { execFile, spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const DEFAULT_URL = "https://nemakinkr.github.io/playsputnik/";
const target = process.argv.find((arg) => arg.startsWith("http://") || arg.startsWith("https://")) || DEFAULT_URL;
const rootUrl = target.endsWith("/") ? target : `${target}/`;
const pageUrl = withCacheBust(rootUrl);
const port = Number(process.env.PLAYSPUTNIK_CHROME_PORT || 9338);
const searchQuery = "Black Myth";
const expectedTitle = "Black Myth: Wukong";

let chromeProcess;
let userDataDir = "";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function withCacheBust(url) {
  const next = new URL(url);
  next.searchParams.set("v", `production-browser-smoke-${Date.now()}`);
  return next.href;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function localReleaseMarkers() {
  const [swSource, htmlSource, appSource] = await Promise.all([
    readFile(new URL("../sw.js", import.meta.url), "utf8"),
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../app.js", import.meta.url), "utf8"),
  ]);
  const cacheVersion = swSource.match(/CACHE_VERSION\s*=\s*"([^"]+)"/)?.[1] || "";
  return [
    { path: "sw.js", marker: `CACHE_VERSION = "${cacheVersion}"`, label: `service worker ${cacheVersion}` },
    { path: "index.html", marker: htmlSource.includes("demo-continuity-metrics") ? "demo-continuity-metrics" : "<main", label: "HTML shell" },
    { path: "app.js", marker: appSource.includes("editionNoteHtml") ? "editionNoteHtml" : "function render", label: "app bundle" },
  ];
}

async function waitForPublishedRelease(timeoutMs = 45000) {
  const markers = await localReleaseMarkers();
  const deadline = Date.now() + timeoutMs;
  let lastStatus = "";
  while (Date.now() < deadline) {
    const checks = await Promise.all(markers.map(async ({ path, marker, label }) => {
      const url = new URL(path, rootUrl);
      url.searchParams.set("v", `production-browser-release-${Date.now()}`);
      try {
        const response = await fetch(url, { cache: "no-store" });
        const text = await response.text();
        return { label, ok: response.ok && text.includes(marker), status: `${response.status} ${label}` };
      } catch (error) {
        return { label, ok: false, status: `${label}: ${error.message}` };
      }
    }));
    if (checks.every((check) => check.ok)) return checks.map((check) => check.label);
    lastStatus = checks.map((check) => `${check.label}=${check.ok ? "ok" : check.status}`).join(", ");
    await wait(1000);
  }
  throw new Error(`Published release did not reach Pages edge in time: ${lastStatus}`);
}

async function findChrome() {
  const envPath = process.env.PLAYSPUTNIK_CHROME;
  if (envPath) return envPath;
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "google-chrome",
    "google-chrome-stable",
    "chromium-browser",
    "chromium",
  ];
  for (const candidate of candidates) {
    if (candidate.startsWith("/")) {
      try {
        await access(candidate, constants.X_OK);
        return candidate;
      } catch {
        continue;
      }
    }
    try {
      const { stdout } = await execFileAsync("which", [candidate], { timeout: 2000 });
      if (stdout.trim()) return stdout.trim();
    } catch {
      // Try the next candidate.
    }
  }
  throw new Error("Chrome/Chromium executable not found for production browser smoke");
}

async function waitForJson(path, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = "";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}${path}`);
      if (response.ok) return response.json();
      lastError = `${response.status} ${response.statusText}`;
    } catch (error) {
      lastError = error.message;
    }
    await wait(150);
  }
  throw new Error(`Chrome DevTools did not become ready: ${lastError}`);
}

async function createPageTarget() {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?about%3Ablank`, { method: "PUT" });
  assert(response.ok, `Could not create Chrome target: ${response.status}`);
  return response.json();
}

class CdpConnection {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 0;
    this.pending = new Map();
    this.handlers = new Map();
  }

  async open() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("CDP WebSocket open timeout")), 10000);
      this.ws.addEventListener("open", () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      this.ws.addEventListener("error", () => {
        clearTimeout(timer);
        reject(new Error("CDP WebSocket failed to open"));
      }, { once: true });
    });
    this.ws.addEventListener("message", (event) => this.handleMessage(event.data));
  }

  handleMessage(data) {
    const message = JSON.parse(String(data));
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(`${message.error.message || "CDP error"} (${message.error.code || "unknown"})`));
      else resolve(message.result || {});
      return;
    }
    const handlers = this.handlers.get(message.method) || [];
    for (const handler of handlers) handler(message.params || {});
  }

  on(method, handler) {
    const handlers = this.handlers.get(method) || [];
    handlers.push(handler);
    this.handlers.set(method, handlers);
  }

  send(method, params = {}, timeoutMs = 15000) {
    const id = ++this.id;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP command timed out: ${method}`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
      this.ws.send(payload);
    });
  }

  waitForEvent(method, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeoutMs);
      const handler = (params) => {
        clearTimeout(timer);
        resolve(params);
      };
      this.on(method, handler);
    });
  }

  close() {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.close();
  }
}

async function evaluate(cdp, expression, timeoutMs = 15000) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    timeout: timeoutMs,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Runtime.evaluate exception");
  }
  return result.result?.value;
}

async function waitForExpression(cdp, expression, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(cdp, expression).catch(() => false)) return true;
    await wait(200);
  }
  throw new Error(`Timed out waiting for expression: ${expression}`);
}

async function launchChrome() {
  const chromePath = await findChrome();
  userDataDir = await mkdtemp(join(tmpdir(), "playsputnik-production-browser-"));
  chromeProcess = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-background-networking",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank",
  ], {
    stdio: ["ignore", "ignore", "pipe"],
  });
  let stderr = "";
  chromeProcess.stderr.on("data", (chunk) => {
    stderr += String(chunk).slice(-2000);
  });
  chromeProcess.on("exit", (code) => {
    if (code && code !== 0) stderr += `\nChrome exited with ${code}`;
  });
  await waitForJson("/json/version").catch((error) => {
    throw new Error(`${error.message}\n${stderr.trim()}`);
  });
  return chromePath;
}

async function cleanup(cdp) {
  cdp?.close();
  if (chromeProcess && !chromeProcess.killed) chromeProcess.kill("SIGTERM");
  await wait(300);
  if (chromeProcess && !chromeProcess.killed) chromeProcess.kill("SIGKILL");
  if (userDataDir) await rm(userDataDir, { recursive: true, force: true });
}

let cdp;

try {
  const releaseMarkers = await waitForPublishedRelease();
  const chromePath = await launchChrome();
  const targetInfo = await createPageTarget();
  cdp = new CdpConnection(targetInfo.webSocketDebuggerUrl);
  await cdp.open();

  const pageErrors = [];
  const consoleErrors = [];
  cdp.on("Runtime.exceptionThrown", (params) => {
    pageErrors.push(params.exceptionDetails?.text || params.exceptionDetails?.exception?.description || "Runtime exception");
  });
  cdp.on("Log.entryAdded", (params) => {
    if (params.entry?.level === "error") consoleErrors.push(params.entry.text || "Console error");
  });

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");
  await cdp.send("Network.enable");
  await cdp.send("Network.setBypassServiceWorker", { bypass: true });
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const loaded = cdp.waitForEvent("Page.loadEventFired");
  await cdp.send("Page.navigate", { url: pageUrl });
  await loaded;
  await waitForExpression(cdp, "Boolean(window.__playsputnikBoot?.coreRenderedAt && document.querySelector('#game-search-input'))");

  await evaluate(cdp, "document.querySelector('[data-app-view=\"discover\"]')?.click()");
  await waitForExpression(cdp, "document.querySelector('[data-app-view=\"discover\"]')?.classList.contains('is-active')");
  await evaluate(cdp, `
    (() => {
      const input = document.querySelector('#game-search-input');
      input.value = '${searchQuery}';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()
  `);
  await waitForExpression(cdp, `
    [...document.querySelectorAll('.game-search-row')]
      .some((item) => (item.querySelector('strong')?.textContent || '').trim() === '${expectedTitle}')
  `);

  const before = await evaluate(cdp, `
    (() => ({
      activeView: document.querySelector('[data-app-view].is-active')?.dataset.appView || '',
      searchValue: document.querySelector('#game-search-input')?.value || '',
      rows: document.querySelectorAll('.game-search-row').length,
      memoryPanels: document.querySelectorAll('[data-search-memory-panel]').length,
      firstTitle: document.querySelector('.game-search-row strong')?.textContent || '',
      visualCards: document.querySelectorAll('.visual-catalog-card').length,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    }))()
  `);

  const clickResult = await evaluate(cdp, `
    (() => {
      const row = [...document.querySelectorAll('.game-search-row')]
        .find((item) => (item.querySelector('strong')?.textContent || '').trim() === '${expectedTitle}');
      const targetRow = row || document.querySelector('.game-search-row');
      const button = targetRow?.querySelector('[data-search-state="saved"]');
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      return {
        clicked: Boolean(button),
        title: targetRow?.querySelector('strong')?.textContent?.trim() || '',
        statusBefore: targetRow?.querySelector('[data-search-memory-panel]')?.textContent?.replace(/\\s+/g, ' ').trim() || '',
      };
    })()
  `);
  assert(clickResult.clicked, "Expected to click a search Wishlist button");
  await waitForExpression(cdp, `
    [...document.querySelectorAll('.game-search-row')].some((row) => (
      row.querySelector('[data-search-state="saved"]')?.classList.contains('is-selected') &&
      /Saved to wishlist/.test(row.querySelector('[data-search-memory-panel]')?.textContent || '')
    ))
  `);

  const afterSave = await evaluate(cdp, `
    (() => {
      const row = [...document.querySelectorAll('.game-search-row')]
        .find((item) => item.querySelector('[data-search-state="saved"]')?.classList.contains('is-selected'));
      return {
        title: row?.querySelector('strong')?.textContent?.trim() || '',
        activeSaved: row?.querySelector('[data-search-state="saved"]')?.classList.contains('is-selected') || false,
        memoryStatus: row?.querySelector('[data-search-memory-panel]')?.textContent?.replace(/\\s+/g, ' ').trim() || '',
      };
    })()
  `);

  await evaluate(cdp, `
    (() => {
      const row = [...document.querySelectorAll('.game-search-row')]
        .find((item) => item.querySelector('[data-search-state="saved"]')?.classList.contains('is-selected'));
      (row || document.querySelector('.game-search-row'))?.querySelector('[data-search-detail]')?.click();
    })()
  `);
  await waitForExpression(cdp, "document.querySelector('#game-detail')?.getAttribute('aria-hidden') === 'false'");
  const detail = await evaluate(cdp, `
    (() => ({
      title: document.querySelector('#game-detail-title')?.textContent || '',
      primaryCta: document.querySelector('[data-detail-primary-action]')?.textContent?.replace(/\\s+/g, ' ').trim() || '',
      cockpit: Boolean(document.querySelector('[data-detail-cockpit]')),
    }))()
  `);

  let screenshotBytes = 0;
  try {
    const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }, 3000);
    screenshotBytes = Math.round((screenshot.data || "").length * 0.75);
  } catch {
    // CDP screenshots can be flaky on long, image-heavy production pages; DOM
    // checks and runtime errors remain the pass/fail contract.
  }

  assert(before.activeView === "discover", `Expected Discover view, got ${before.activeView}`);
  assert(before.searchValue === searchQuery, `Expected search value ${searchQuery}, got ${before.searchValue}`);
  assert(before.rows >= 1, `Expected at least one search row, got ${before.rows}`);
  assert(before.firstTitle === expectedTitle, `Expected ${expectedTitle} as first live search result, got ${before.firstTitle}`);
  assert(before.memoryPanels >= 1, `Expected search memory panels, got ${before.memoryPanels}`);
  assert(before.visualCards >= 6, `Expected visual catalog cards, got ${before.visualCards}`);
  assert(!before.horizontalOverflow, "Published page has horizontal overflow at desktop viewport");
  assert(afterSave.activeSaved, "Expected direct search Wishlist action to become active");
  assert(afterSave.title === expectedTitle, `Expected saved row ${expectedTitle}, got ${afterSave.title}`);
  assert(/Saved to wishlist/.test(afterSave.memoryStatus), `Expected saved confirmation, got ${afterSave.memoryStatus}`);
  assert(detail.title === afterSave.title, `Expected ${afterSave.title} detail drawer, got ${detail.title}`);
  assert(detail.primaryCta, "Expected smart detail primary CTA on live site");
  assert(detail.cockpit, "Expected detail cockpit on live site");
  assert(pageErrors.length === 0, `Live page errors: ${pageErrors.join("; ")}`);

  console.log(JSON.stringify({
    mode: "production-browser-smoke",
    url: rootUrl,
    chromePath,
    releaseMarkers,
    before,
    clickResult,
    afterSave,
    detail,
    screenshotBytes,
    pageErrors,
    consoleErrors,
  }, null, 2));
  await cleanup(cdp);
} catch (error) {
  await cleanup(cdp).catch(() => {});
  console.error(error);
  process.exit(1);
}
