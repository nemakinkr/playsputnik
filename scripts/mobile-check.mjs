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
 * mobile viewport and walks all 8 views.
 *
 * Usage: node scripts/mobile-check.mjs [url]   (standalone; one Chrome)
 *        — or run via scripts/browser-gates.mjs with the other gates (one Chrome).
 */
import { APP_READY, evaluate, isMain, rootUrlFromArgv, runStandalone, waitFor } from "./lib/cdp.mjs";

const MIN_TOUCH = 24; // px — primary controls shorter than this are cramped

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

export const gate = {
  name: "mobile layout (375px)",
  defaultPort: 9342,
  async drive(cdp, rootUrl) {
    const pageUrl = `${rootUrl}?v=mobile-${Date.now()}`;
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
    await cdp.send("Page.navigate", { url: pageUrl });
    await waitFor(cdp, APP_READY);
    const raw = await evaluate(cdp, `(${scanInPage.toString()})(${MIN_TOUCH})`);
    return JSON.parse(raw || "{}");
  },
  analyze({ overflow, cramped }) {
    const lines = [];
    let ok = true;
    if (overflow && overflow.length) {
      ok = false;
      lines.push(`❌ Horizontal overflow at 375px on ${overflow.length} view(s):`);
      overflow.forEach((o) => lines.push(`   - ${o.view}: page ${o.scrollW}px > viewport ${o.viewportW}px${o.widest ? ` (widest: ${o.widest.cls} ${o.widest.w}px)` : ""}`));
    }
    if (cramped && cramped.length) {
      ok = false;
      lines.push(`❌ ${cramped.length} cramped touch target(s) (< ${MIN_TOUCH}px tall):`);
      cramped.forEach((c) => lines.push(`   - ${c.el}  ${c.h}px  "${c.text}"`));
    }
    if (!ok) {
      lines.push("\nFix: ensure no element exceeds the viewport (wrap/scroll inner content), and give");
      lines.push(`primary controls a min-height >= ${MIN_TOUCH}px (often via the mobile @media block).`);
      return { ok, lines };
    }
    return { ok: true, lines: [`✅ Mobile OK (no 375px overflow, no controls under ${MIN_TOUCH}px across 8 views)`] };
  },
};

if (isMain(import.meta.url)) await runStandalone(gate, rootUrlFromArgv());
