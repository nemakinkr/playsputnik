/* Dark-mode contrast gate (dependency-free, CDP — runs locally AND in CI).
 *
 * The recurring cross-agent bug: a new component ships a hardcoded LIGHT
 * background (#fff / #f1f5f9 / #f8fafc / #eaf0ff / …) with no dark override, so
 * in dark mode it renders as a light box (often unreadable). This gate encodes
 * the single high-confidence invariant that catches that whole class with
 * almost no false positives:
 *
 *   In dark mode, NO visible element may have a light SOLID background.
 *
 * It also flags dark-on-dark text (dark) and light-on-light text (light), but
 * deliberately does NOT score general text contrast (alpha compositing +
 * cover-image backgrounds make that heuristic and false-positive-prone). It
 * boots the app with a SEEDED profile (empty profiles hide most components,
 * same lesson as the perf budget) and walks all 8 views, dark then light.
 *
 * Usage: node scripts/contrast-check.mjs [url]   (standalone; one Chrome)
 *        — or run via scripts/browser-gates.mjs with the other gates (one Chrome).
 * When adding a component: use theme tokens (var(--card-bg)/--card-bg-soft/
 * --chip-bg/--surface-2/--accent-bg/--panel/--surface) for backgrounds — never
 * a hardcoded light hex. See CLAUDE.md "Dark mode rules".
 */
import { APP_READY, evaluate, isMain, rootUrlFromArgv, runStandalone, waitFor } from "./lib/cdp.mjs";

const LUM_THRESHOLD = 225;

// Runs in the page: seed a profile, set theme, scan all views.
function scanInPage(LUM, mode) {
  const demoBtn = document.querySelector('[data-continuity-action="load-demo"]');
  if (demoBtn) demoBtn.click();
  ["Hades", "Stray", "Bloodborne", "Celeste", "Returnal"].forEach((t, i) => { try { setGameRating(t, ((i % 5) + 1) * 20); } catch (e) {} });
  try { render(); } catch (e) {}
  if (mode === "light") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", "dark");
  try { render(); } catch (e) {}

  const parse = (s) => { const m = s.match(/[\d.]+/g); return m ? m.map(Number) : null; };
  const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const pageBase = mode === "light" ? [244, 247, 251] : [10, 16, 24];
  // nearest opaque SOLID background up the tree; null if an image background is
  // encountered first (can't measure cover-art-backed text — skip it).
  const nearestOpaque = (el) => {
    let e = el;
    while (e) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage !== "none") return null;
      const m = parse(cs.backgroundColor);
      if (m && (m[3] === undefined || m[3] >= 0.95)) return m.slice(0, 3);
      e = e.parentElement;
    }
    return pageBase;
  };
  const views = ["today", "library", "discover", "wishlist", "taste", "deals", "data", "stats"];
  const offenders = {};
  const add = (kind, key, sample, v) => {
    const k = kind + "::" + key;
    if (!offenders[k]) offenders[k] = { kind, key, views: [], sample };
    if (!offenders[k].views.includes(v)) offenders[k].views.push(v);
  };
  views.forEach((v) => {
    try { openAppView(v); render(); } catch (e) {}
    document.querySelectorAll("main *").forEach((el) => {
      if (el.offsetParent === null) return;
      const cls = (typeof el.className === "string" && el.className) ? el.className.split(" ")[0] : el.tagName;

      if (mode === "light") {
        // light-on-light text in light mode (leaf text on a near-white solid bg)
        if (el.children.length === 0) {
          const t = (el.textContent || "").trim();
          if (t) {
            const bg = nearestOpaque(el);
            const fg = parse(getComputedStyle(el).color);
            if (bg && fg && lum(bg) > 200 && lum(fg) > 175) {
              add("light-text", cls + " | " + getComputedStyle(el).color + " on rgb(" + bg.map(Math.round).join(",") + ")", t.slice(0, 20), v);
            }
          }
        }
        return;
      }

      // dark mode — (1) light SOLID background
      const c = parse(getComputedStyle(el).backgroundColor);
      if (c && (c[3] === undefined || c[3] >= 0.9) && lum(c) > LUM) {
        const r = el.getBoundingClientRect();
        if (r.width >= 30 && r.height >= 10) {
          add("light-bg", cls + " | " + getComputedStyle(el).backgroundColor, (el.textContent || "").trim().slice(0, 20), v);
        }
      }
      // dark mode — (2) dark text on a dark solid background (leaf text; skip image-backed)
      if (el.children.length === 0) {
        const t = (el.textContent || "").trim();
        if (t) {
          const bg = nearestOpaque(el);
          const fg = parse(getComputedStyle(el).color);
          if (bg && fg && lum(bg) < 70 && lum(fg) < 95) {
            add("dark-text", cls + " | " + getComputedStyle(el).color + " on rgb(" + bg.map(Math.round).join(",") + ")", t.slice(0, 20), v);
          }
        }
      }
    });
  });
  try { openAppView("today"); } catch (e) {}
  return JSON.stringify(Object.values(offenders).map((o) => ({ kind: o.kind, key: o.key, views: o.views.join(","), sample: o.sample })));
}

export const gate = {
  name: "dark/light contrast",
  defaultPort: 9341,
  async drive(cdp, rootUrl) {
    const pageUrl = `${rootUrl}?v=contrast-${Date.now()}`;
    // Emulate the OS color scheme so the app boots into the right theme at load
    // (its inline head script reads prefers-color-scheme as the default). Dark
    // pass first, then reload under light emulation for the light pass.
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
    await cdp.send("Page.navigate", { url: pageUrl });
    await waitFor(cdp, APP_READY);
    const darkRaw = await evaluate(cdp, `(${scanInPage.toString()})(${LUM_THRESHOLD}, "dark")`);

    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitFor(cdp, APP_READY);
    const lightRaw = await evaluate(cdp, `(${scanInPage.toString()})(${LUM_THRESHOLD}, "light")`);

    return [...JSON.parse(darkRaw || "[]"), ...JSON.parse(lightRaw || "[]")];
  },
  analyze(offenders) {
    if (!offenders.length) {
      return { ok: true, lines: ["✅ Contrast OK (dark: no light-bg/dark-on-dark; light: no light-on-light) across 8 views"] };
    }
    const lightBg = offenders.filter((o) => o.kind === "light-bg");
    const darkText = offenders.filter((o) => o.kind === "dark-text");
    const lightText = offenders.filter((o) => o.kind === "light-text");
    const lines = [`❌ Contrast: ${offenders.length} issue(s):`];
    if (lightBg.length) {
      lines.push(`  ${lightBg.length} LIGHT solid background(s) in DARK mode:`);
      lightBg.forEach((o) => lines.push(`   - ${o.key}  [views: ${o.views}]  "${o.sample}"`));
    }
    if (darkText.length) {
      lines.push(`  ${darkText.length} DARK text on dark bg in DARK mode:`);
      darkText.forEach((o) => lines.push(`   - ${o.key}  [views: ${o.views}]  "${o.sample}"`));
    }
    if (lightText.length) {
      lines.push(`  ${lightText.length} LIGHT text on light bg in LIGHT mode:`);
      lightText.forEach((o) => lines.push(`   - ${o.key}  [views: ${o.views}]  "${o.sample}"`));
    }
    lines.push('\nFix: use theme tokens — backgrounds via var(--card-bg)/--card-bg-soft/');
    lines.push('--chip-bg/--surface-2/--accent-bg/--panel/--surface, text via var(--text-mid)/');
    lines.push('--text-strong/--ink — or add a [data-theme="dark"] override. See CLAUDE.md.');
    return { ok: false, lines };
  },
};

if (isMain(import.meta.url)) await runStandalone(gate, rootUrlFromArgv());
