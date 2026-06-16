/* Dark-mode contrast gate (dependency-free, CDP — runs locally AND in CI).
 *
 * The recurring cross-agent bug: a new component ships a hardcoded LIGHT
 * background (#fff / #f1f5f9 / #f8fafc / #eaf0ff / …) with no dark override, so
 * in dark mode it renders as a light box (often unreadable). This gate encodes
 * the single high-confidence invariant that catches that whole class with
 * almost no false positives:
 *
 *   In dark mode, NO visible element may have a light SOLID background.
 *
 * It deliberately does NOT score text contrast (alpha compositing + cover-image
 * backgrounds make that heuristic and false-positive-prone). It boots the app
 * in dark mode with a SEEDED profile (empty profiles hide most components, same
 * lesson as the perf budget) and walks all 8 views.
 *
 * Uses system Chrome over the DevTools protocol (no Playwright/npm install), so
 * it works in check.sh locally and on a GitHub ubuntu runner unchanged.
 *
 * Usage: node scripts/contrast-check.mjs [url]   (default http://127.0.0.1:7432)
 * When adding a component: use theme tokens (var(--card-bg)/--card-bg-soft/
 * --chip-bg/--surface-2/--accent-bg/--panel/--surface) for backgrounds — never
 * a hardcoded light hex. See CLAUDE.md "Dark mode rules".
 */
import { execFile, spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const LUM_THRESHOLD = 225;
const DEFAULT_URL = "http://127.0.0.1:7432/";
const target = process.argv.find((a) => a.startsWith("http")) || DEFAULT_URL;
const rootUrl = target.endsWith("/") ? target : `${target}/`;
const pageUrl = `${rootUrl}?v=contrast-${Date.now()}`;
const port = Number(process.env.PLAYSPUTNIK_CHROME_PORT || 9341);

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
    if (c.startsWith("/")) {
      try { await access(c, constants.X_OK); return c; } catch { /* next */ }
    } else {
      try { const { stdout } = await execFileAsync("which", [c], { timeout: 2000 }); if (stdout.trim()) return stdout.trim(); } catch { /* next */ }
    }
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

// Runs in the page: seed a profile, force dark, scan all views for light bgs.
function scanInPage(LUM) {
  const demoBtn = [...document.querySelectorAll("button")].find((b) => /load demo profile/i.test(b.textContent));
  if (demoBtn) demoBtn.click();
  ["Hades", "Stray", "Bloodborne", "Celeste", "Returnal"].forEach((t, i) => { try { setGameRating(t, ((i % 5) + 1) * 20); } catch (e) {} });
  try { render(); } catch (e) {}
  document.documentElement.setAttribute("data-theme", "dark");
  try { render(); } catch (e) {}

  const parse = (s) => { const m = s.match(/[\d.]+/g); return m ? m.map(Number) : null; };
  const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const views = ["today", "library", "discover", "wishlist", "taste", "deals", "data", "stats"];
  const offenders = {};
  views.forEach((v) => {
    try { openAppView(v); render(); } catch (e) {}
    document.querySelectorAll("main *").forEach((el) => {
      if (el.offsetParent === null) return;
      const c = parse(getComputedStyle(el).backgroundColor);
      if (!c) return;
      if (!(c[3] === undefined || c[3] >= 0.9) || lum(c) <= LUM) return;
      const r = el.getBoundingClientRect();
      if (r.width < 30 || r.height < 10) return;
      const cls = (typeof el.className === "string" && el.className) ? el.className.split(" ")[0] : el.tagName;
      const key = cls + " | " + getComputedStyle(el).backgroundColor;
      if (!offenders[key]) offenders[key] = { views: [], sample: (el.textContent || "").trim().slice(0, 20) };
      if (!offenders[key].views.includes(v)) offenders[key].views.push(v);
    });
  });
  try { openAppView("today"); } catch (e) {}
  return JSON.stringify(Object.entries(offenders).map(([k, val]) => ({ key: k, views: val.views.join(","), sample: val.sample })));
}

async function launchChrome() {
  const chromePath = await findChrome();
  userDataDir = await mkdtemp(join(tmpdir(), "playsputnik-contrast-"));
  chromeProcess = spawn(chromePath, [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage",
    `--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`, "about:blank",
  ], { stdio: "ignore" });
  // wait for DevTools endpoint
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try { await getJson("/json/version"); return; } catch { await wait(200); }
  }
  throw new Error("Chrome DevTools did not become ready");
}

const hardTimer = setTimeout(() => { console.error("Contrast check timed out."); cleanup().finally(() => process.exit(124)); }, 60000);

async function cleanup() {
  try { chromeProcess?.kill("SIGKILL"); } catch { /* ignore */ }
  if (userDataDir) await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
}

try {
  await launchChrome();
  const tab = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" }).then((r) => r.json());
  const cdp = new Cdp(tab.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
  await cdp.send("Page.navigate", { url: pageUrl });
  await waitFor(cdp, "document.querySelector('#top-pick') && document.querySelector('#top-pick').innerHTML.trim().length > 0");

  const raw = await evaluate(cdp, `(${scanInPage.toString()})(${LUM_THRESHOLD})`);
  const offenders = JSON.parse(raw || "[]");

  cdp.close();
  await cleanup();
  clearTimeout(hardTimer);

  if (offenders.length) {
    console.error(`❌ Dark-mode contrast: ${offenders.length} element(s) have a LIGHT solid background in dark mode:`);
    offenders.forEach((o) => console.error(`   - ${o.key}  [views: ${o.views}]  "${o.sample}"`));
    console.error('\nFix: use a theme token for the background (var(--card-bg) / --card-bg-soft /');
    console.error('--chip-bg / --surface-2 / --accent-bg / --panel / --surface), or a [data-theme="dark"] override.');
    process.exit(1);
  }
  console.log("✅ Dark-mode contrast OK (no light solid backgrounds in dark mode across 8 views)");
} catch (error) {
  await cleanup();
  clearTimeout(hardTimer);
  console.error(`❌ Contrast check failed to run: ${error.message}`);
  process.exit(1);
}
