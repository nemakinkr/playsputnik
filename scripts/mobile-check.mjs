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
 * mobile viewport and walks all 8 views plus the open settings sidebar in both
 * English and Russian (Russian copy is longer and catches different overflows).
 *
 * Usage: node scripts/mobile-check.mjs [url]   (standalone; one Chrome)
 *        — or run via scripts/browser-gates.mjs with the other gates (one Chrome).
 */
import { APP_READY, evaluate, isMain, rootUrlFromArgv, runStandalone, waitFor } from "./lib/cdp.mjs";

const MIN_TOUCH = 24; // px — primary controls shorter than this are cramped

function scanInPage(MIN_TOUCH, locale) {
  try { window.PlaySputnikI18n?.setLocale(locale); } catch (e) {}
  const demoBtn = document.querySelector('[data-continuity-action="load-demo"]');
  if (demoBtn) demoBtn.click();
  ["Hades", "Stray", "Bloodborne", "Celeste", "Returnal"].forEach((t, i) => { try { setGameRating(t, ((i % 5) + 1) * 20); } catch (e) {} });
  try { render(); } catch (e) {}

  const views = ["today", "library", "discover", "wishlist", "taste", "deals", "data", "stats"];
  const overflow = [];
  const cramped = {};
  const W = document.documentElement.clientWidth;
  const collect = (surface) => {
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
      overflow.push({ locale, surface, scrollW: document.documentElement.scrollWidth, viewportW: W, widest });
    }
    document.querySelectorAll("main button, main summary, main input, main select").forEach((el) => {
      if (el.offsetParent === null) return;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      if (r.height < MIN_TOUCH) {
        const cls = (typeof el.className === "string" && el.className) ? el.className.split(" ")[0] : el.tagName;
        const key = locale + "::" + cls + " (" + el.tagName + ")";
        if (!cramped[key]) cramped[key] = { locale, h: Math.round(r.height), text: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 16) };
      }
    });
  };

  views.forEach((v) => {
    try { openAppView(v); render(); } catch (e) {}
    collect(v);
  });

  const setupPanel = document.querySelector("#setup-panel");
  if (setupPanel) {
    setupPanel.classList.add("is-open");
    if (setupPanel.scrollWidth > setupPanel.clientWidth + 1) {
      overflow.push({
        locale,
        surface: "settings",
        scrollW: setupPanel.scrollWidth,
        viewportW: setupPanel.clientWidth,
        widest: { cls: "setup-panel", w: setupPanel.scrollWidth },
      });
    }
    collect("settings");
    setupPanel.classList.remove("is-open");
  }

  try { openAppView("today"); } catch (e) {}
  const answerTitle = (document.querySelector("#answer-copy .answer-main strong")?.textContent || "").trim();
  return JSON.stringify({
    locale,
    answerTitle,
    overflow,
    cramped: Object.entries(cramped).map(([key, val]) => ({ el: key.split("::").slice(1).join("::"), ...val })),
  });
}

export const gate = {
  name: "mobile layout (375px)",
  defaultPort: 9342,
  async drive(cdp, rootUrl) {
    const pageUrl = `${rootUrl}?v=mobile-${Date.now()}`;
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
    await cdp.send("Page.navigate", { url: pageUrl });
    await waitFor(cdp, APP_READY);
    const passes = [];
    for (const locale of ["en", "ru"]) {
      const raw = await evaluate(cdp, `(${scanInPage.toString()})(${MIN_TOUCH}, ${JSON.stringify(locale)})`);
      passes.push(JSON.parse(raw || "{}"));
    }
    return {
      overflow: passes.flatMap((pass) => pass.overflow || []),
      cramped: passes.flatMap((pass) => pass.cramped || []),
      localizedAnswers: passes.map((pass) => ({ locale: pass.locale, answerTitle: pass.answerTitle || "" })),
    };
  },
  analyze({ overflow, cramped, localizedAnswers }) {
    const lines = [];
    let ok = true;
    if (overflow && overflow.length) {
      ok = false;
      lines.push(`❌ Horizontal overflow at 375px on ${overflow.length} view(s):`);
      overflow.forEach((o) => lines.push(`   - ${o.locale}/${o.surface}: page ${o.scrollW}px > viewport ${o.viewportW}px${o.widest ? ` (widest: ${o.widest.cls} ${o.widest.w}px)` : ""}`));
    }
    if (cramped && cramped.length) {
      ok = false;
      lines.push(`❌ ${cramped.length} cramped touch target(s) (< ${MIN_TOUCH}px tall):`);
      cramped.forEach((c) => lines.push(`   - ${c.locale}/${c.el}  ${c.h}px  "${c.text}"`));
    }
    if (!ok) {
      lines.push("\nFix: ensure no element exceeds the viewport (wrap/scroll inner content), and give");
      lines.push(`primary controls a min-height >= ${MIN_TOUCH}px (often via the mobile @media block).`);
    }
    const answerByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.answerTitle]));
    const enOk = /^(I would play|I need)/.test(answerByLocale.en || "");
    const ruOk = /^(Сегодня я бы выбрал|Мне нужно)/.test(answerByLocale.ru || "");
    const leakedKey = Object.values(answerByLocale).some((value) => /^narrative\./.test(value));
    if (!enOk || !ruOk || leakedKey) {
      ok = false;
      lines.push("❌ Dynamic i18n answer title did not switch cleanly between EN and RU:");
      lines.push(`   - en: "${answerByLocale.en || "missing"}"`);
      lines.push(`   - ru: "${answerByLocale.ru || "missing"}"`);
    }
    if (!ok) return { ok, lines };
    return { ok: true, lines: [`✅ Mobile OK (EN + RU, 8 views + settings; no 375px overflow or controls under ${MIN_TOUCH}px)`] };
  },
};

if (isMain(import.meta.url)) await runStandalone(gate, rootUrlFromArgv());
