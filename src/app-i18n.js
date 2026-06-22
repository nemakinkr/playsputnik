/* PlaySputnik i18n engine — dependency-free, loads FIRST so every module and
 * app.js can call the global `t()`.
 *
 * Design:
 *  - Dictionaries live in src/i18n-en.js / src/i18n-ru.js, each registering
 *    window.PlaySputnikMessages[locale] = { nested: { keys } }.
 *  - t("a.b.c", params) does dotted lookup with fallback en → key itself (a miss
 *    renders the key, never throws). A value may be a string or a plural object
 *    { one, few, many, other } selected by params.count.
 *  - Russian plural rule built in (one/few/many); English one/other.
 *  - applyStatic() localizes static HTML via [data-i18n] (textContent) and
 *    [data-i18n-attr="attr:key;attr2:key2"] (attributes like aria-label/title/
 *    placeholder). Runs on load and on every locale change.
 *
 * Locale precedence: saved choice (localStorage) → navigator.language (ru* → ru)
 * → "en". Switching re-renders the app (app.js subscribes via onLocaleChange).
 */
(function () {
  "use strict";

  const STORAGE_KEY = "ps_locale";
  const FALLBACK = "en";
  const messages = (window.PlaySputnikMessages = window.PlaySputnikMessages || {});
  const listeners = new Set();

  function detect() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // The engine loads before the catalogs, so catalog presence cannot be
      // used to validate a saved locale during startup.
      if (saved === "en" || saved === "ru") return saved;
    } catch (e) { /* ignore */ }
    const nav = (navigator.language || "en").toLowerCase();
    if (nav.startsWith("ru")) return "ru";
    return FALLBACK;
  }

  let current = detect();

  function getLocale() { return current; }

  function setLocale(loc) {
    if (!messages[loc]) loc = FALLBACK;
    if (loc === current) return;
    current = loc;
    try { localStorage.setItem(STORAGE_KEY, loc); } catch (e) { /* ignore */ }
    document.documentElement.setAttribute("lang", loc);
    applyStatic();
    listeners.forEach((fn) => { try { fn(loc); } catch (e) { /* ignore */ } });
  }

  function onLocaleChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  function lookup(loc, key) {
    const dict = messages[loc];
    if (!dict) return undefined;
    return key.split(".").reduce((o, k) => (o == null ? undefined : o[k]), dict);
  }

  function pluralCategory(loc, n) {
    n = Math.abs(Number(n) || 0);
    if (loc === "ru") {
      const m10 = n % 10, m100 = n % 100;
      if (m10 === 1 && m100 !== 11) return "one";
      if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "few";
      return "many";
    }
    return n === 1 ? "one" : "other";
  }

  function interpolate(str, params) {
    if (!params) return str;
    return String(str).replace(/\{(\w+)\}/g, (m, k) => (params[k] != null ? String(params[k]) : m));
  }

  function t(key, params) {
    let val = lookup(current, key);
    if (val === undefined) val = lookup(FALLBACK, key);
    if (val === undefined) return key; // visible miss, not a crash
    if (val && typeof val === "object") {
      const cat = pluralCategory(current, params && params.count != null ? params.count : 0);
      val = val[cat] != null ? val[cat] : (val.other != null ? val.other : val.many);
      if (val === undefined) return key;
    }
    return interpolate(val, params);
  }

  function taxonomyLabel(axis, value) {
    if (value == null || value === "") return "";
    const key = `taxonomy.${axis}.${value}`;
    const translated = t(key);
    return translated === key ? String(value) : translated;
  }

  function atomLabel(value) {
    const axes = ["atoms", "tone", "content", "adultTimeFit", "commitment", "difficulty", "session", "reviewBurden"];
    for (const axis of axes) {
      const key = `taxonomy.${axis}.${value}`;
      const translated = t(key);
      if (translated !== key) return translated;
    }
    return value == null ? "" : String(value);
  }

  function atomList(values, separator = " / ") {
    return (Array.isArray(values) ? values : []).map(atomLabel).join(separator);
  }

  // Localize static markup. [data-i18n] sets textContent; [data-i18n-attr] sets
  // attributes, format "aria-label:nav.today.aria;title:nav.today.title".
  function applyStatic(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (key) el.textContent = t(key);
    });
    scope.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      el.getAttribute("data-i18n-attr").split(";").forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
  }

  document.documentElement.setAttribute("lang", current);

  window.PlaySputnikI18n = {
    t,
    getLocale,
    setLocale,
    onLocaleChange,
    pluralCategory,
    taxonomyLabel,
    atomLabel,
    atomList,
    applyStatic,
  };
  // Heavily used in templates — keep it short. Modules with a local `t` (e.g.
  // forEach((t)=>…) over titles) shadow this in their scope; that's expected.
  window.t = t;
  window.labelTaxonomy = taxonomyLabel;
  window.labelAtom = atomLabel;
  window.labelAtoms = atomList;
})();
