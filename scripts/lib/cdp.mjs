/* Shared dependency-free CDP harness for the browser quality gates.
 *
 * One source of truth for the boilerplate that contrast-check / mobile-check /
 * a11y-check all repeated: find system Chrome, spawn it headless, talk DevTools
 * over a global WebSocket (Node 22+), evaluate expressions, poll for readiness.
 *
 * A "gate" is a tiny object: { name, defaultPort, drive(cdp, rootUrl), analyze(raw) }.
 *   - drive() navigates/emulates and returns a raw JSON-able result.
 *   - analyze() turns that into { ok, lines } (lines are printed verbatim).
 * runStandalone() runs one gate on its own Chrome (so each *-check.mjs still works
 * solo); runAll() launches Chrome ONCE and runs several gates on separate tabs.
 */
import { execFile, spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function rootUrlFromArgv(defaultUrl = "http://127.0.0.1:7432/") {
  const target = process.argv.find((a) => a.startsWith("http")) || defaultUrl;
  return target.endsWith("/") ? target : `${target}/`;
}

export function isMain(metaUrl) {
  return Boolean(process.argv[1]) && metaUrl === pathToFileURL(process.argv[1]).href;
}

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

class Cdp {
  constructor(wsUrl, closeTarget) {
    this.wsUrl = wsUrl;
    this.closeTarget = closeTarget;
    this.id = 0;
    this.pending = new Map();
  }
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
  async close() {
    try { this.ws?.close(); } catch { /* ignore */ }
    await this.closeTarget?.().catch(() => {});
  }
}

export async function evaluate(cdp, expression) {
  const r = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text || "evaluate exception");
  return r.result?.value;
}

export async function waitFor(cdp, expression, timeoutMs = 40000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(cdp, expression).catch(() => false)) return;
    await wait(200);
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

/* The expression that confirms the app has rendered its first pick. */
export const APP_READY =
  "document.querySelector('#top-pick') && document.querySelector('#top-pick').innerHTML.trim().length > 0";

/* Launch one headless Chrome and return a session with a tab factory + cleanup. */
export async function launchChrome({ label = "playsputnik", port }) {
  const chromePath = await findChrome();
  // Sanitize: gate names like "dark/light contrast" must not create subdirs.
  const safeLabel = String(label).replace(/[^a-z0-9]+/gi, "-");
  const userDataDir = await mkdtemp(join(tmpdir(), `playsputnik-${safeLabel}-`));
  const chromeProcess = spawn(chromePath, [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage",
    `--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`, "about:blank",
  ], { stdio: "ignore" });

  const getJson = async (path) => {
    const res = await fetch(`http://127.0.0.1:${port}${path}`);
    if (!res.ok) throw new Error(`DevTools ${path}: ${res.status}`);
    return res.json();
  };
  const deadline = Date.now() + 15000;
  let ready = false;
  while (Date.now() < deadline) { try { await getJson("/json/version"); ready = true; break; } catch { await wait(200); } }
  if (!ready) { try { chromeProcess.kill("SIGKILL"); } catch { /* ignore */ } throw new Error("Chrome DevTools did not become ready"); }

  return {
    port,
    async newTab() {
      const tab = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" }).then((r) => r.json());
      const cdp = new Cdp(
        tab.webSocketDebuggerUrl,
        () => fetch(`http://127.0.0.1:${port}/json/close/${tab.id}`),
      );
      await cdp.open();
      await cdp.send("Page.enable");
      await cdp.send("Runtime.enable");
      return cdp;
    },
    async cleanup() {
      try { chromeProcess.kill("SIGKILL"); } catch { /* ignore */ }
      await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
    },
  };
}

/* Drive a gate on a fresh tab, retrying once on a fresh tab if the first attempt
   throws (e.g. an app-ready timeout under a loaded CI runner — a hung tab load
   rarely repeats on a clean tab). */
async function driveWithRetry(session, gate, rootUrl) {
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const cdp = await session.newTab();
    try {
      const raw = await gate.drive(cdp, rootUrl);
      await cdp.close();
      return raw;
    } catch (error) {
      await cdp.close().catch(() => {});
      lastError = error;
      if (attempt === 1) console.error(`  ↻ ${gate.name}: retrying after "${error.message}"`);
    }
  }
  throw lastError;
}

/* Run a single gate on its own Chrome, print its report, exit with its status. */
export async function runStandalone(gate, rootUrl) {
  const session = await launchChrome({ label: gate.name, port: gate.defaultPort });
  const hard = setTimeout(() => { console.error(`${gate.name} check timed out.`); session.cleanup().finally(() => process.exit(124)); }, 60000);
  try {
    const raw = await driveWithRetry(session, gate, rootUrl);
    const { ok, lines } = gate.analyze(raw);
    clearTimeout(hard);
    await session.cleanup();
    lines.forEach((l) => (ok ? console.log(l) : console.error(l)));
    process.exit(ok ? 0 : 1);
  } catch (error) {
    clearTimeout(hard);
    await session.cleanup();
    console.error(`❌ ${gate.name} check failed to run: ${error.message}`);
    process.exit(1);
  }
}

/* Launch Chrome once and run several gates on fresh tabs; exit non-zero if any fail. */
export async function runAll(gates, rootUrl) {
  const port = Number(process.env.PLAYSPUTNIK_CHROME_PORT || 9350);
  const session = await launchChrome({ label: "gates", port });
  const hard = setTimeout(() => { console.error("Browser gates timed out."); session.cleanup().finally(() => process.exit(124)); }, 180000);
  let allOk = true;
  try {
    for (const gate of gates) {
      console.log(`\n── ${gate.name} ──────────────────────────────`);
      const raw = await driveWithRetry(session, gate, rootUrl);
      const { ok, lines } = gate.analyze(raw);
      lines.forEach((l) => (ok ? console.log(l) : console.error(l)));
      if (!ok) allOk = false;
    }
  } catch (error) {
    clearTimeout(hard);
    await session.cleanup();
    console.error(`❌ Browser gates failed to run: ${error.message}`);
    process.exit(1);
  }
  clearTimeout(hard);
  await session.cleanup();
  if (!allOk) { console.error("\n❌ One or more browser gates failed."); process.exit(1); }
  console.log("\n✅ All browser gates passed (contrast, mobile, a11y, stale-hidden) on one Chrome run.");
}
