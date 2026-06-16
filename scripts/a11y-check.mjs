/* Accessibility gate (dependency-free, CDP — runs locally AND in CI).
 *
 * The class it catches: an interactive control ships with NO accessible name
 * (icon-only button, search input with only a placeholder, etc.), so screen
 * readers announce nothing useful. Invisible during normal sighted development.
 *
 * Deterministic, low-false-positive: it only flags visible interactive controls
 * (button / a[href] / input / select / textarea / summary / role=button|radio)
 * whose accessible name is empty by the usual resolution (text, aria-label,
 * aria-labelledby, title, associated/wrapping <label>, child img alt / svg
 * label). It does NOT score colour or ARIA semantics — narrow on purpose.
 *
 * Boots a SEEDED profile (empty profiles hide most components) and walks all 8
 * views plus the detail cockpit. System Chrome over CDP — no install.
 *
 * Usage: node scripts/a11y-check.mjs [url]   (default http://127.0.0.1:7432)
 */
import { execFile, spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const DEFAULT_URL = "http://127.0.0.1:7432/";
const target = process.argv.find((a) => a.startsWith("http")) || DEFAULT_URL;
const rootUrl = target.endsWith("/") ? target : `${target}/`;
const pageUrl = `${rootUrl}?v=a11y-${Date.now()}`;
const port = Number(process.env.PLAYSPUTNIK_CHROME_PORT || 9343);

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

function scanInPage() {
  const demoBtn = [...document.querySelectorAll("button")].find((b) => /load demo profile/i.test(b.textContent));
  if (demoBtn) demoBtn.click();
  ["Hades", "Stray", "Bloodborne", "Celeste", "Returnal"].forEach((t, i) => { try { setGameRating(t, ((i % 5) + 1) * 20); } catch (e) {} });
  try { render(); } catch (e) {}

  function accName(el) {
    const a = el.getAttribute("aria-label"); if (a && a.trim()) return a.trim();
    const lb = el.getAttribute("aria-labelledby");
    if (lb) { const t = lb.split(/\s+/).map((id) => (document.getElementById(id)?.textContent || "")).join(" ").trim(); if (t) return t; }
    const ti = el.getAttribute("title"); if (ti && ti.trim()) return ti.trim();
    const tx = (el.textContent || "").trim(); if (tx) return tx;
    if (el.id) { try { const l = document.querySelector('label[for="' + (window.CSS && CSS.escape ? CSS.escape(el.id) : el.id) + '"]'); if (l && l.textContent.trim()) return l.textContent.trim(); } catch (e) {} }
    const wl = el.closest && el.closest("label"); if (wl && wl.textContent.trim()) return wl.textContent.trim();
    const img = el.querySelector && el.querySelector("img[alt]"); if (img && (img.getAttribute("alt") || "").trim()) return "img-alt";
    if (el.querySelector && el.querySelector("svg [aria-label], svg title, [aria-label]")) return "svg-label";
    return "";
  }

  const sel = 'button, a[href], input:not([type=hidden]), select, textarea, summary, [role="button"], [role="radio"]';
  const fullSel = ["main", ".game-detail-drawer"].flatMap((scope) => sel.split(", ").map((s) => `${scope} ${s}`)).join(", ");
  const unnamed = {};
  const collect = () => {
    document.querySelectorAll(fullSel).forEach((el) => {
      if (el.offsetParent === null) return;
      if (accName(el)) return;
      const cls = (typeof el.className === "string" && el.className) ? el.className.split(" ")[0] : el.tagName;
      const key = cls + " (" + el.tagName + (el.type ? `:${el.type}` : "") + ")";
      if (!unnamed[key]) unnamed[key] = { count: 0, id: el.id || "", placeholder: el.placeholder || "" };
      unnamed[key].count++;
    });
  };
  ["today", "library", "discover", "wishlist", "taste", "deals", "data", "stats"].forEach((v) => {
    try { openAppView(v); render(); } catch (e) {}
    collect();
  });
  try { openGameDetail("Hades"); collect(); closeGameDetail(); } catch (e) {}
  try { openAppView("today"); } catch (e) {}
  return JSON.stringify(Object.entries(unnamed).map(([k, val]) => ({ el: k, ...val })));
}

async function launchChrome() {
  const chromePath = await findChrome();
  userDataDir = await mkdtemp(join(tmpdir(), "playsputnik-a11y-"));
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

const hardTimer = setTimeout(() => { console.error("A11y check timed out."); cleanup().finally(() => process.exit(124)); }, 60000);

try {
  await launchChrome();
  const tab = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" }).then((r) => r.json());
  const cdp = new Cdp(tab.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Page.navigate", { url: pageUrl });
  await waitFor(cdp, "document.querySelector('#top-pick') && document.querySelector('#top-pick').innerHTML.trim().length > 0");

  const raw = await evaluate(cdp, `(${scanInPage.toString()})()`);
  const unnamed = JSON.parse(raw || "[]");

  cdp.close();
  await cleanup();
  clearTimeout(hardTimer);

  if (unnamed.length) {
    console.error(`❌ Accessibility: ${unnamed.length} interactive control type(s) with no accessible name:`);
    unnamed.forEach((u) => console.error(`   - ${u.el}  x${u.count}${u.id ? `  #${u.id}` : ""}${u.placeholder ? `  placeholder="${u.placeholder}"` : ""}`));
    console.error("\nFix: give it a name — visible text, aria-label, a <label for=…>, or title.");
    console.error("(A placeholder is NOT an accessible name.)");
    process.exit(1);
  }
  console.log("✅ Accessibility OK (all interactive controls have accessible names across 8 views + cockpit)");
} catch (error) {
  await cleanup();
  clearTimeout(hardTimer);
  console.error(`❌ A11y check failed to run: ${error.message}`);
  process.exit(1);
}
