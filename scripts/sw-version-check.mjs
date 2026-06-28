/* Service-worker cache-bump gate (local pre-commit; git-based).
 *
 * Easy to forget: edit app.js/styles/index.html/a src module but leave
 * sw.js CACHE_VERSION unchanged → returning users get the new HTML shell paired
 * with stale cached JS/CSS. This compares the working tree to HEAD: if any
 * precached static asset changed but sw.js's CACHE_VERSION line did not, fail.
 *
 * Runs in check.sh (pre-commit) only — in CI the tree equals HEAD so there is no
 * diff and it's a no-op. Skips cleanly outside a git repo / with no diff.
 *
 * Usage: node scripts/sw-version-check.mjs
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function git(args) {
  try { return (await execFileAsync("git", args, { cwd: new URL("../", import.meta.url) })).stdout; }
  catch { return null; }
}

const nameStatus = await git(["diff", "HEAD", "--name-only"]);
if (nameStatus === null) { console.log("✅ SW version check skipped (not a git repo)"); process.exit(0); }

const changed = nameStatus.split("\n").map((s) => s.trim()).filter(Boolean);
// Precached static assets whose change requires a cache bump.
const isCachedAsset = (f) =>
  f === "app.js" || f === "index.html" || f === "manifest.json" ||
  f.startsWith("styles/") || (f.startsWith("src/") && f.endsWith(".js")) ||
  (f.startsWith("icons/") && f.endsWith(".png"));
const cachedChanged = changed.filter(isCachedAsset);

if (!cachedChanged.length) { console.log("✅ SW version OK (no cached static assets changed)"); process.exit(0); }

const swDiff = await git(["diff", "HEAD", "--", "sw.js"]);
const bumped = swDiff && /^[+-]const CACHE_VERSION =/m.test(swDiff);

if (!bumped) {
  console.error(`❌ ${cachedChanged.length} cached static asset(s) changed but sw.js CACHE_VERSION was not bumped:`);
  cachedChanged.slice(0, 12).forEach((f) => console.error(`   - ${f}`));
  console.error("\nFix: bump CACHE_VERSION in sw.js, or returning users get stale cached JS/CSS.");
  process.exit(1);
}
console.log(`✅ SW version OK (CACHE_VERSION bumped for ${cachedChanged.length} changed asset(s))`);
