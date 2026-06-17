/* All browser quality gates in ONE Chrome launch (faster than 3 separate spawns).
 *
 * Runs the dark/light contrast, mobile-layout (375px), and accessibility gates
 * sequentially on fresh tabs of a single headless Chrome, then exits non-zero if
 * any failed. Each gate's logic lives in its own *-check.mjs (single source of
 * truth, still runnable standalone for debugging); this just composes them.
 *
 * Usage: node scripts/browser-gates.mjs [url]   (default http://127.0.0.1:7432)
 */
import { isMain, rootUrlFromArgv, runAll } from "./lib/cdp.mjs";
import { gate as contrastGate } from "./contrast-check.mjs";
import { gate as mobileGate } from "./mobile-check.mjs";
import { gate as a11yGate } from "./a11y-check.mjs";
import { gate as hiddenGate } from "./hidden-check.mjs";

if (isMain(import.meta.url)) {
  await runAll([contrastGate, mobileGate, a11yGate, hiddenGate], rootUrlFromArgv());
}
