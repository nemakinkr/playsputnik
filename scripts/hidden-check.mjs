/* Stale-hidden gate (dependency-free, CDP — runs locally AND in CI).
 *
 * The class it catches (we just shipped one): an element carries the `is-hidden`
 * state class but there's no matching `.x.is-hidden { display:none }` CSS rule,
 * so the class is inert and the element shows anyway. Invisible during dev
 * unless you happen to view the exact state that's supposed to be hidden — e.g.
 * the onboarding hero rendered for EVERY returning/seeded user because
 * `.onboarding-hero.is-hidden` was never declared.
 *
 * Deterministic, low-false-positive: with a SEEDED profile (so the hide paths
 * actually fire) it walks all 8 views and flags any element that has `is-hidden`
 * yet still has its own layout box (own computed display !== none AND it renders).
 * An element hidden only by an ancestor is fine — that's genuinely off-screen.
 *
 * Usage: node scripts/hidden-check.mjs [url]   (standalone; one Chrome)
 *        — or run via scripts/browser-gates.mjs with the other gates (one Chrome).
 */
import { APP_READY, evaluate, isMain, rootUrlFromArgv, runStandalone, waitFor } from "./lib/cdp.mjs";

function scanInPage() {
  const demoBtn = document.querySelector('[data-continuity-action="load-demo"]');
  if (demoBtn) demoBtn.click();
  ["Hades", "Stray", "Bloodborne", "Celeste", "Returnal"].forEach((t, i) => { try { setGameRating(t, ((i % 5) + 1) * 20); } catch (e) {} });
  try { render(); } catch (e) {}

  const offenders = {};
  ["today", "library", "discover", "wishlist", "taste", "deals", "data", "stats"].forEach((v) => {
    try { openAppView(v); render(); } catch (e) {}
    document.querySelectorAll(".is-hidden").forEach((el) => {
      // its own box still renders → the is-hidden class is inert for this element
      if (getComputedStyle(el).display === "none") return;
      if (el.offsetParent === null && el.getClientRects().length === 0) return; // hidden by ancestor — fine
      const cls = (typeof el.className === "string" && el.className) ? el.className.replace(/\s+/g, ".") : el.tagName;
      const key = (el.id ? "#" + el.id : "." + cls);
      if (!offenders[key]) offenders[key] = { key, views: [] };
      if (!offenders[key].views.includes(v)) offenders[key].views.push(v);
    });
  });
  try { openAppView("today"); } catch (e) {}
  return JSON.stringify(Object.values(offenders).map((o) => ({ key: o.key, views: o.views.join(",") })));
}

export const gate = {
  name: "stale-hidden",
  defaultPort: 9344,
  async drive(cdp, rootUrl) {
    const pageUrl = `${rootUrl}?v=hidden-${Date.now()}`;
    await cdp.send("Page.navigate", { url: pageUrl });
    await waitFor(cdp, APP_READY);
    const raw = await evaluate(cdp, `(${scanInPage.toString()})()`);
    return JSON.parse(raw || "[]");
  },
  analyze(offenders) {
    if (!offenders.length) {
      return { ok: true, lines: ["✅ Stale-hidden OK (every .is-hidden element is actually display:none across 8 views)"] };
    }
    const lines = [`❌ Stale-hidden: ${offenders.length} element(s) with .is-hidden still visible:`];
    offenders.forEach((o) => lines.push(`   - ${o.key}  [views: ${o.views}]`));
    lines.push("\nFix: declare a matching CSS rule, e.g. `.your-component.is-hidden { display: none; }`");
    lines.push("(a bare `.is-hidden` is overridden by the component's own display rule).");
    return { ok: false, lines };
  },
};

if (isMain(import.meta.url)) await runStandalone(gate, rootUrlFromArgv());
