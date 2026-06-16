/* Mobile layout gate (dependency-free, CDP — runs locally AND in CI).
 *
 * Catches the two mobile regression classes we kept fixing by hand:
 *   1. Horizontal overflow at 375px (a panel/row/control wider than the phone
 *      viewport → the page scrolls sideways).
 *   2. Cramped touch targets — primary controls (button/summary/input/select)
 *      shorter than MIN_TOUCH px are hard to tap.
 *
 * Both are deterministic and low-false-positive. Pure attribution <a> links are
 * intentionally small and are not treated as primary touch targets.
 *
 * Boots a SEEDED profile (empty profiles hide most components) at a 375px
 * mobile viewport and walks all 8 views. Uses system Chrome over CDP — no
 * Playwright/npm install — so it runs in check.sh and on a GitHub ubuntu runner.
 *
 * Usage: node scripts/mobile-check.mjs [url]   (default http://127.0.0.1:7432)
 */
import { execFile, spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const MIN_TOUCH = 24; // px — primary controls shorter than this are cramped
const DEFAULT_URL = "http://127.0.0.1:7432/";
const target = process.argv.find((a) => a.startsWith("http")) || DEFAULT_URL;
const rootUrl = target.endsWith("/") ? target : `${target}/`;
const pageUrl = `${rootUrl}?v=mobile-${Date.now()}`;
const port = Number(process.env.PLAYSPUTNIK_CHROME_PORT || 9342);

let chromeProcess;
let userDataDir = "";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function findChrome() {
  if (process.env.PLAYSPUTNIK_CHROME) return process.env.PLAYSPUTNIK_CHROME;
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "google-chrome", "google-chrome-stable", "chromium-browser", "chromium",
  ];
  for (const c of candidates) {
    if (c.startsWith("/")) { try { await access(c, constants.X_OK); return c; } catch { /* next */ } }
    else { try { const { stdout } = await execFileAsync("which", [c], { timeout: 2000 }); if (stdout.trim()) return stdout.trim(); } catch { /* next */ } }
  }
  throw new Error("Chrome/Chromium executable not found");
}

async function getJson(path) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`);
  if (!res.ok) throw new Error(`DevTools ${path}: ${res.status}`);
  return res.json();
}

class Cdp {
  constructor(wsUrl) { this.wsUrl = wsUrl; this.id = 0; this.pending = new Map(); }
  async open() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("CDP open timeout")), 10000);
      this.ws.addEventListener("open", () => { clearTimeout(t); resolve(); }, { once: true });
      this.ws.addEventListener("error", () => { clearTimeout(t); reject(new Error("CDP open error")); }, { once: true });
    });
    this.ws.addEventListener("message", (e) => {
      const m = JSON.parse(String(e.data));
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        m.error ? reject(new Error(m.error.message || "CDP error")) : resolve(m.result || {});
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 20000);
      this.pending.set(id, { resolve: (v) => { clearTimeout(t); resolve(v); }, reject: (e) => { clearTimeout(t); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  close() { try { this.ws?.close(); } catch { /* ignore */ } }
}

async function evaluate(cdp, expression) {
  const r = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text || "evaluate exception");
  return r.result?.value;
}

async function waitFor(cdp, expression, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(cdp, expression).catch(() => false)) return;
    await wait(200);
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

function scanInPage(MIN_TOUCH) {
  const demoBtn = [...document.querySelectorAll("button")].find((b) => /load demo profile/i.test(b.textContent));
  if (demoBtn) demoBtn.click();
  ["Hades", "Stray", "Bloodborne", "Celeste", "Returnal"].forEach((t, i) => { try { setGameRating(t, ((i % 5) + 1) * 20); } catch (e) {} });
  try { render(); } catch (e) {}

  const views = ["today", "library", "discover", "wishlist", "taste", "deals", "data", "stats"];
  const overflow = [];
  const cramped = {};
  const W = document.documentElement.clientWidth;
  views.forEach((v) => {
    try { openAppView(v); render(); } catch (e) {}
    if (document.documentElement.scrollWidth > W + 1) {
      // find the widest offending element for the message
      let widest = null;
      document.querySelectorAll("main *").forEach((el) => {
        if (el.offsetParent === null) return;
        const r = el.getBoundingClientRect();
        if (r.right > W + 1 && r.width > W + 1 && (!widest || r.width > widest.w)) {
          widest = { cls: (typeof el.className === "string" && el.className) ? el.className.split(" ")[0] : el.tagName, w: Math.round(r.width) };
        }
      });
      overflow.push({ view: v, scrollW: document.documentElement.scrollWidth, viewportW: W, widest });
    }
    document.querySelectorAll("main button, main summary, main input, main select").forEach((el) => {
      if (el.offsetParent === null) return;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      if (r.height < MIN_TOUCH) {
        const cls = (typeof el.className === "string" && el.className) ? el.className.split(" ")[0] : el.tagName;
        const key = cls + " (" + el.tagName + ")";
        if (!cramped[key]) cramped[key] = { h: Math.round(r.height), text: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 16) };
      }
    });
  });
  try { openAppView("today"); } catch (e) {}
  return JSON.stringify({ overflow, cramped: Object.entries(cramped).map(([k, val]) => ({ el: k, ...val })) });
}

async function launchChrome() {
  const chromePath = await findChrome();
  userDataDir = await mkdtemp(join(tmpdir(), "playsputnik-mobile-"));
  chromeProcess = spawn(chromePath, [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage",
    `--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`, "about:blank",
  ], { stdio: "ignore" });
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) { try { await getJson("/json/version"); return; } catch { await wait(200); } }
  throw new Error("Chrome DevTools did not become ready");
}

async function cleanup() {
  try { chromeProcess?.kill("SIGKILL"); } catch { /* ignore */ }
  if (userDataDir) await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
}

const hardTimer = setTimeout(() => { console.error("Mobile check timed out."); cleanup().finally(() => process.exit(124)); }, 60000);

try {
  await launchChrome();
  const tab = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" }).then((r) => r.json());
  const cdp = new Cdp(tab.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  await cdp.send("Page.navigate", { url: pageUrl });
  await waitFor(cdp, "document.querySelector('#top-pick') && document.querySelector('#top-pick').innerHTML.trim().length > 0");

  const raw = await evaluate(cdp, `(${scanInPage.toString()})(${MIN_TOUCH})`);
  const { overflow, cramped } = JSON.parse(raw || "{}");

  cdp.close();
  await cleanup();
  clearTimeout(hardTimer);

  let failed = false;
  if (overflow && overflow.length) {
    failed = true;
    console.error(`❌ Horizontal overflow at 375px on ${overflow.length} view(s):`);
    overflow.forEach((o) => console.error(`   - ${o.view}: page ${o.scrollW}px > viewport ${o.viewportW}px${o.widest ? ` (widest: ${o.widest.cls} ${o.widest.w}px)` : ""}`));
  }
  if (cramped && cramped.length) {
    failed = true;
    console.error(`❌ ${cramped.length} cramped touch target(s) (< ${MIN_TOUCH}px tall):`);
    cramped.forEach((c) => console.error(`   - ${c.el}  ${c.h}px  "${c.text}"`));
  }
  if (failed) {
    console.error("\nFix: ensure no element exceeds the viewport (wrap/scroll inner content), and give");
    console.error(`primary controls a min-height >= ${MIN_TOUCH}px (often via the mobile @media block).`);
    process.exit(1);
  }
  console.log(`✅ Mobile OK (no 375px overflow, no controls under ${MIN_TOUCH}px across 8 views)`);
} catch (error) {
  await cleanup();
  clearTimeout(hardTimer);
  console.error(`❌ Mobile check failed to run: ${error.message}`);
  process.exit(1);
}
