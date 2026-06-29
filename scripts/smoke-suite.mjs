/* Browser smoke suite orchestrator.
 *
 * The Playwright smoke tests (app-view, core-journey, demo-profile, design,
 * game-detail, library-wishlist, search-memory, visual-catalog) default to the
 * app on :4190 and the provider backend on :4191. Run on their own they fail
 * (no servers) and silently rot — exactly what bit search-memory-smoke after a
 * search-row markup refactor. This brings them under one command: serve the
 * static app (4190) from an in-process server we fully control, boot the
 * provider backend in deterministic fixture mode (4191, --force-fixture, no live
 * RAWG/network), run every smoke against it, and exit non-zero if any fail.
 * (preview-server.mjs is intentionally NOT used here — it daemonizes a detached
 * server, which would leak between gate runs.) Wired into scripts/check.sh.
 *
 * Usage: node scripts/smoke-suite.mjs
 */
import { spawn } from "node:child_process";
import http from "node:http";
import { fileURLToPath } from "node:url";

const NODE = process.execPath;
const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SMOKES = [
  "app-view-smoke", "core-journey-smoke", "demo-profile-smoke", "design-smoke",
  "game-detail-smoke", "library-wishlist-smoke", "search-memory-smoke", "visual-catalog-smoke",
];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function start(script, args = []) {
  return spawn(NODE, [`scripts/${script}`, ...args], { stdio: "ignore" });
}

// node:http (not fetch) — undici's fetch blocks "bad ports" like 4190 (ManageSieve),
// which Chromium/curl happily serve, so fetch can't probe the preview server.
function probe(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 2000 }, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("timeout", () => { req.destroy(); resolve(false); });
    req.on("error", () => resolve(false));
  });
}

async function waitForHttp(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probe(url)) return true;
    await wait(250);
  }
  return false;
}

function run(script) {
  return new Promise((resolve) => {
    const child = spawn(NODE, [`scripts/${script}.mjs`], { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (d) => { stderr += d; });
    child.on("close", (code) => resolve({ code, stderr }));
  });
}

const preview = spawn("python3", ["scripts/serve-static.py", "4190"], { cwd: ROOT, stdio: "ignore" });
const provider = start("search-provider-server.mjs", ["--force-fixture"]);
const cleanup = () => { try { preview.kill("SIGKILL"); } catch {} try { provider.kill("SIGKILL"); } catch {} };
process.on("exit", cleanup);

const hardTimer = setTimeout(() => { console.error("Smoke suite timed out."); cleanup(); process.exit(124); }, 240000);

const previewUp = await waitForHttp("http://127.0.0.1:4190/index.html");
const providerUp = await waitForHttp("http://127.0.0.1:4191/api/health");
if (!previewUp || !providerUp) {
  console.error(`❌ Smoke servers did not start (preview=${previewUp} provider=${providerUp})`);
  cleanup();
  process.exit(1);
}

let failed = 0;
for (const smoke of SMOKES) {
  const { code, stderr } = await run(`${smoke}-test`);
  if (code === 0) {
    console.log(`  ✅ ${smoke}`);
  } else {
    failed += 1;
    const firstError = (stderr.match(/Error:.*/m) || ["(no Error line; see stderr)"])[0];
    console.error(`  ❌ ${smoke} (exit ${code}) — ${firstError}`);
  }
}

clearTimeout(hardTimer);
cleanup();
if (failed) { console.error(`\n❌ ${failed}/${SMOKES.length} browser smoke test(s) failed.`); process.exit(1); }
console.log(`\n✅ All ${SMOKES.length} browser smoke tests passed (preview :4190 + fixture backend :4191).`);
