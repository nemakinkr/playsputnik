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
 * views plus the detail cockpit.
 *
 * Usage: node scripts/a11y-check.mjs [url]   (standalone; one Chrome)
 *        — or run via scripts/browser-gates.mjs with the other gates (one Chrome).
 */
import { APP_READY, evaluate, isMain, rootUrlFromArgv, runStandalone, waitFor } from "./lib/cdp.mjs";

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

export const gate = {
  name: "accessibility",
  defaultPort: 9343,
  async drive(cdp, rootUrl) {
    const pageUrl = `${rootUrl}?v=a11y-${Date.now()}`;
    await cdp.send("Page.navigate", { url: pageUrl });
    await waitFor(cdp, APP_READY);
    const raw = await evaluate(cdp, `(${scanInPage.toString()})()`);
    return JSON.parse(raw || "[]");
  },
  analyze(unnamed) {
    if (!unnamed.length) {
      return { ok: true, lines: ["✅ Accessibility OK (all interactive controls have accessible names across 8 views + cockpit)"] };
    }
    const lines = [`❌ Accessibility: ${unnamed.length} interactive control type(s) with no accessible name:`];
    unnamed.forEach((u) => lines.push(`   - ${u.el}  x${u.count}${u.id ? `  #${u.id}` : ""}${u.placeholder ? `  placeholder="${u.placeholder}"` : ""}`));
    lines.push("\nFix: give it a name — visible text, aria-label, a <label for=…>, or title.");
    lines.push("(A placeholder is NOT an accessible name.)");
    return { ok: false, lines };
  },
};

if (isMain(import.meta.url)) await runStandalone(gate, rootUrlFromArgv());
