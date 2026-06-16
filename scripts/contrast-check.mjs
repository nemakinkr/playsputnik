/* Dark-mode contrast gate.
 *
 * The recurring cross-agent bug: a new component ships with a hardcoded LIGHT
 * background (e.g. #fff / #f1f5f9 / #eef6ff) and no dark override, so in dark
 * mode it renders as a light box (often with light text -> unreadable). Whole
 * sessions were spent finding these one by one.
 *
 * This gate encodes the single high-confidence invariant that catches that
 * whole class with almost no false positives:
 *
 *   In dark mode, NO visible element may have a light SOLID background.
 *
 * It deliberately does NOT try to score text contrast (alpha compositing,
 * cover-image backgrounds and light-text-on-dark-parent make that heuristic
 * and false-positive-prone). "No light solid bg in dark" is deterministic.
 *
 * It runs against a SEEDED profile — empty profiles hide most components
 * (same lesson as the perf budget).
 *
 * Usage: node scripts/contrast-check.mjs [url]   (default http://127.0.0.1:7432)
 * Fails (exit 1) and lists offenders if any light solid background is found.
 *
 * When you add a component: use theme tokens (var(--card-bg), --card-bg-soft,
 * --chip-bg, --accent-bg, --panel, --surface) for backgrounds and
 * var(--text-mid/--text-strong/--ink) for text. Never hardcode a light hex
 * background or a dark hex text color. See CLAUDE.md "Dark mode".
 */
import { createRequire } from "node:module";

const LUM_THRESHOLD = 225; // backgrounds brighter than this are "light"
const DEFAULT_URL = "http://127.0.0.1:7432/?v=contrast-check";
const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BUNDLED_NODE_MODULES = "/Users/kirillnemakin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";

const targetUrl = process.argv.find((a) => a.startsWith("http")) || DEFAULT_URL;
const chromePath = process.env.PLAYSPUTNIK_CHROME || DEFAULT_CHROME;

const hardTimer = setTimeout(() => {
  console.error("Contrast check timed out.");
  process.exit(124);
}, 60000);

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    return createRequire(`${BUNDLED_NODE_MODULES}/playwright/package.json`)("playwright");
  }
}

const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ executablePath: chromePath, headless: true });
try {
  // Boot the app in dark mode the way a real dark user does: persist the theme
  // preference before any app code runs, and emulate a dark OS color scheme.
  const context = await browser.newContext({ colorScheme: "dark" });
  await context.addInitScript(() => {
    try { localStorage.setItem("playsputnik-theme", "dark"); } catch {}
  });
  const page = await context.newPage();
  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#top-pick")?.innerHTML.trim().length > 0, { timeout: 20000 });

  const result = await page.evaluate((LUM) => {
    // Seed a rich profile so library/wishlist/stats/evidence surfaces render.
    const demoBtn = [...document.querySelectorAll("button")].find((b) => /load demo profile/i.test(b.textContent));
    if (demoBtn) demoBtn.click();
    ["Hades", "Stray", "Bloodborne", "Celeste", "Returnal"].forEach((t, i) => {
      try { setGameRating(t, ((i % 5) + 1) * 20); } catch {}
    });
    try { render(); } catch {}

    document.documentElement.setAttribute("data-theme", "dark");
    try { render(); } catch {}

    const parse = (s) => { const m = s.match(/[\d.]+/g); return m ? m.map(Number) : null; };
    const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

    const views = ["today", "library", "discover", "wishlist", "taste", "deals", "data", "stats"];
    const offenders = {};
    views.forEach((v) => {
      try { openAppView(v); render(); } catch {}
      document.querySelectorAll("main *").forEach((el) => {
        if (el.offsetParent === null) return;
        const c = parse(getComputedStyle(el).backgroundColor);
        if (!c) return;
        const opaque = c[3] === undefined || c[3] >= 0.9;
        if (!opaque || lum(c) <= LUM) return;
        const r = el.getBoundingClientRect();
        if (r.width < 30 || r.height < 10) return;
        const cls = (typeof el.className === "string" && el.className) ? el.className.split(" ")[0] : el.tagName;
        const key = `${cls} | ${getComputedStyle(el).backgroundColor}`;
        if (!offenders[key]) offenders[key] = { views: new Set(), sample: (el.textContent || "").trim().slice(0, 20) };
        offenders[key].views.add(v);
      });
    });
    try { openAppView("today"); } catch {}
    return Object.entries(offenders).map(([k, val]) => ({ key: k, views: [...val.views].join(","), sample: val.sample }));
  }, LUM_THRESHOLD);

  if (result.length) {
    console.error(`❌ Dark-mode contrast: ${result.length} element(s) have a LIGHT solid background in dark mode:`);
    result.forEach((o) => console.error(`   - ${o.key}  [views: ${o.views}]  "${o.sample}"`));
    console.error("\nFix: use a theme token for the background (var(--card-bg) / --card-bg-soft /");
    console.error("--chip-bg / --accent-bg / --panel / --surface), or add a [data-theme=\"dark\"] override.");
    process.exit(1);
  }
  console.log("✅ Dark-mode contrast OK (no light solid backgrounds in dark mode across 8 views)");
} finally {
  clearTimeout(hardTimer);
  await browser.close();
}
