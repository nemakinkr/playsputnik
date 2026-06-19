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

  try {
    openAppView("library");
    render();
    renderMyGames(rankedGames());
  } catch (e) {}
  const libraryPlanTitle = (document.querySelector("#library-plan-title")?.textContent || "").trim();
  const libraryGamesTitle = (document.querySelector("#my-games-title")?.textContent || "").trim();
  const libraryDashboardLabel = (document.querySelector(".library-dashboard-card > span")?.textContent || "").trim();
  try {
    openAppView("wishlist");
    render();
    renderPriceWatch(rankedGames());
    renderBuyDecision(rankedGames());
  } catch (e) {}
  const wishlistTitle = (document.querySelector("#price-watch-title")?.textContent || "").trim();
  const wishlistDecision = (document.querySelector(".wishlist-decision")?.textContent || "").trim();
  const wishlistDashboardLabel = (document.querySelector(".wishlist-dashboard-card > span")?.textContent || "").trim();
  try {
    state.gameSearchQuery = "Black Myth";
    openAppView("discover");
    render();
    renderGameSearch();
    renderVisualCatalog(rankedGames());
  } catch (e) {}
  const discoverSearchTitle = (document.querySelector("#game-search-title")?.textContent || "").trim();
  const discoverMemoryLabel = (document.querySelector("[data-search-memory-panel] strong")?.textContent || "").trim();
  const discoverCatalogTitle = (document.querySelector("#visual-catalog-title")?.textContent || "").trim();
  const discoverMetricLabel = (document.querySelector("#visual-catalog-metrics span")?.textContent || "").trim();
  try {
    openAppView("taste");
    render();
    renderRecentLearning();
    renderFirstValueReceipt(rankedGames());
  } catch (e) {}
  const tasteLearningTitle = (document.querySelector("#learning-title")?.textContent || "").trim();
  const tasteLearningStatus = (document.querySelector("#learning-status")?.textContent || "").trim();
  const tasteShareTitle = (document.querySelector("#taste-share-title")?.textContent || "").trim();
  const tasteReceiptLabel = (document.querySelector(".receipt-card > span")?.textContent || "").trim();
  try { openAppView("today"); } catch (e) {}
  const answerTitle = (document.querySelector("#answer-copy .answer-main strong")?.textContent || "").trim();
  const evidenceLabel = (document.querySelector("#answer-copy .answer-evidence .evidence-row span")?.textContent || "").trim();
  const firstRunVerdict = (document.querySelector("#first-run-bridge .first-run-verdict span")?.textContent || "").trim();
  try { document.querySelector("[data-hero-detail]")?.click(); } catch (e) {}
  const detailHeading = (document.querySelector(".detail-decision-copy h3")?.textContent || "").trim();
  const detailMove = (document.querySelector(".detail-cockpit-head > span")?.textContent || "").trim();
  try { document.querySelector("[data-detail-close]")?.click(); } catch (e) {}
  return JSON.stringify({
    locale,
    answerTitle,
    evidenceLabel,
    firstRunVerdict,
    detailHeading,
    detailMove,
    libraryPlanTitle,
    libraryGamesTitle,
    libraryDashboardLabel,
    wishlistTitle,
    wishlistDecision,
    wishlistDashboardLabel,
    discoverSearchTitle,
    discoverMemoryLabel,
    discoverCatalogTitle,
    discoverMetricLabel,
    tasteLearningTitle,
    tasteLearningStatus,
    tasteShareTitle,
    tasteReceiptLabel,
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
      localizedAnswers: passes.map((pass) => ({
        locale: pass.locale,
        answerTitle: pass.answerTitle || "",
        evidenceLabel: pass.evidenceLabel || "",
        firstRunVerdict: pass.firstRunVerdict || "",
        detailHeading: pass.detailHeading || "",
        detailMove: pass.detailMove || "",
        libraryPlanTitle: pass.libraryPlanTitle || "",
        libraryGamesTitle: pass.libraryGamesTitle || "",
        libraryDashboardLabel: pass.libraryDashboardLabel || "",
        wishlistTitle: pass.wishlistTitle || "",
        wishlistDecision: pass.wishlistDecision || "",
        wishlistDashboardLabel: pass.wishlistDashboardLabel || "",
        discoverSearchTitle: pass.discoverSearchTitle || "",
        discoverMemoryLabel: pass.discoverMemoryLabel || "",
        discoverCatalogTitle: pass.discoverCatalogTitle || "",
        discoverMetricLabel: pass.discoverMetricLabel || "",
        tasteLearningTitle: pass.tasteLearningTitle || "",
        tasteLearningStatus: pass.tasteLearningStatus || "",
        tasteShareTitle: pass.tasteShareTitle || "",
        tasteReceiptLabel: pass.tasteReceiptLabel || "",
      })),
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
    const evidenceByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.evidenceLabel]));
    const firstRunByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.firstRunVerdict]));
    const detailHeadingByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.detailHeading]));
    const detailMoveByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.detailMove]));
    const libraryPlanByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.libraryPlanTitle]));
    const libraryGamesByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.libraryGamesTitle]));
    const libraryDashboardByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.libraryDashboardLabel]));
    const wishlistTitleByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.wishlistTitle]));
    const wishlistDecisionByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.wishlistDecision]));
    const wishlistDashboardByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.wishlistDashboardLabel]));
    const discoverSearchByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.discoverSearchTitle]));
    const discoverMemoryByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.discoverMemoryLabel]));
    const discoverCatalogByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.discoverCatalogTitle]));
    const discoverMetricByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.discoverMetricLabel]));
    const tasteLearningByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.tasteLearningTitle]));
    const tasteStatusByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.tasteLearningStatus]));
    const tasteShareByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.tasteShareTitle]));
    const tasteReceiptByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.tasteReceiptLabel]));
    const enOk = /^(I would play|I need)/.test(answerByLocale.en || "");
    const ruOk = /^(Сегодня я бы выбрал|Мне нужно)/.test(answerByLocale.ru || "");
    const evidenceEnOk = /[A-Za-z]/.test(evidenceByLocale.en || "") && !/[А-Яа-яЁё]/.test(evidenceByLocale.en || "");
    const evidenceRuOk = /[А-Яа-яЁё]/.test(evidenceByLocale.ru || "");
    const firstRunEnOk = firstRunByLocale.en === "What I learned";
    const firstRunRuOk = firstRunByLocale.ru === "Что я понял";
    const detailEnOk = detailHeadingByLocale.en === "Why this pick" && detailMoveByLocale.en === "Next move";
    const detailRuOk = detailHeadingByLocale.ru === "Почему эта игра" && detailMoveByLocale.ru === "Следующий шаг";
    const libraryEnOk = libraryPlanByLocale.en === "Library plan"
      && libraryGamesByLocale.en === "My games"
      && /^(Continue|Start)$/.test(libraryDashboardByLocale.en || "");
    const libraryRuOk = libraryPlanByLocale.ru === "План библиотеки"
      && libraryGamesByLocale.ru === "Мои игры"
      && /^(Продолжить|Начать)$/.test(libraryDashboardByLocale.ru || "");
    const wishlistEnOk = wishlistTitleByLocale.en === "Buy-later watch"
      && /^(Missing price|Verify|Below target|Wait|Buy zone)$/.test(wishlistDecisionByLocale.en || "")
      && wishlistDashboardByLocale.en === "Best now";
    const wishlistRuOk = wishlistTitleByLocale.ru === "Желаемое и цены"
      && /^(Нет цены|Проверить|Ниже цели|Подождать|Можно покупать)$/.test(wishlistDecisionByLocale.ru || "")
      && wishlistDashboardByLocale.ru === "Лучший вариант";
    const discoverEnOk = discoverSearchByLocale.en === "Game search"
      && /^(Ready to add|Saved to Wishlist|Added to Library|Plus access added)$/.test(discoverMemoryByLocale.en || "")
      && discoverCatalogByLocale.en === "Visual catalog"
      && discoverMetricByLocale.en === "covers";
    const discoverRuOk = discoverSearchByLocale.ru === "Поиск игр"
      && /^(Можно добавить|Добавлено в Желаемое|Добавлено в Библиотеку|Добавлен доступ Plus)$/.test(discoverMemoryByLocale.ru || "")
      && discoverCatalogByLocale.ru === "Каталог игр"
      && discoverMetricByLocale.ru === "обложек";
    const tasteEnOk = tasteLearningByLocale.en === "Recently learned"
      && /signal/i.test(tasteStatusByLocale.en || "")
      && tasteShareByLocale.en === "Share taste"
      && /^(Play from Library|Play tonight)$/.test(tasteReceiptByLocale.en || "");
    const tasteRuOk = tasteLearningByLocale.ru === "Что изучено недавно"
      && /сигнал/i.test(tasteStatusByLocale.ru || "")
      && tasteShareByLocale.ru === "Поделиться вкусом"
      && /^(Играть из Библиотеки|Играть сегодня)$/.test(tasteReceiptByLocale.ru || "");
    const leakedKey = [
      ...Object.values(answerByLocale),
      ...Object.values(evidenceByLocale),
      ...Object.values(firstRunByLocale),
      ...Object.values(detailHeadingByLocale),
      ...Object.values(detailMoveByLocale),
      ...Object.values(libraryPlanByLocale),
      ...Object.values(libraryGamesByLocale),
      ...Object.values(libraryDashboardByLocale),
      ...Object.values(wishlistTitleByLocale),
      ...Object.values(wishlistDecisionByLocale),
      ...Object.values(wishlistDashboardByLocale),
      ...Object.values(discoverSearchByLocale),
      ...Object.values(discoverMemoryByLocale),
      ...Object.values(discoverCatalogByLocale),
      ...Object.values(discoverMetricByLocale),
      ...Object.values(tasteLearningByLocale),
      ...Object.values(tasteStatusByLocale),
      ...Object.values(tasteShareByLocale),
      ...Object.values(tasteReceiptByLocale),
    ]
      .some((value) => /^(narrative|library|wishlist|discover|taste)\./.test(value));
    if (!enOk || !ruOk || !evidenceEnOk || !evidenceRuOk || !firstRunEnOk || !firstRunRuOk || !detailEnOk || !detailRuOk || !libraryEnOk || !libraryRuOk || !wishlistEnOk || !wishlistRuOk || !discoverEnOk || !discoverRuOk || !tasteEnOk || !tasteRuOk || leakedKey) {
      ok = false;
      lines.push("❌ Dynamic i18n answer narrative did not switch cleanly between EN and RU:");
      lines.push(`   - en title: "${answerByLocale.en || "missing"}"`);
      lines.push(`   - en evidence: "${evidenceByLocale.en || "missing"}"`);
      lines.push(`   - en first run: "${firstRunByLocale.en || "missing"}"`);
      lines.push(`   - en detail: "${detailHeadingByLocale.en || "missing"}" / "${detailMoveByLocale.en || "missing"}"`);
      lines.push(`   - en library: "${libraryPlanByLocale.en || "missing"}" / "${libraryGamesByLocale.en || "missing"}" / "${libraryDashboardByLocale.en || "missing"}"`);
      lines.push(`   - en wishlist: "${wishlistTitleByLocale.en || "missing"}" / "${wishlistDecisionByLocale.en || "missing"}" / "${wishlistDashboardByLocale.en || "missing"}"`);
      lines.push(`   - en discover: "${discoverSearchByLocale.en || "missing"}" / "${discoverMemoryByLocale.en || "missing"}" / "${discoverCatalogByLocale.en || "missing"}" / "${discoverMetricByLocale.en || "missing"}"`);
      lines.push(`   - en taste: "${tasteLearningByLocale.en || "missing"}" / "${tasteStatusByLocale.en || "missing"}" / "${tasteShareByLocale.en || "missing"}" / "${tasteReceiptByLocale.en || "missing"}"`);
      lines.push(`   - ru title: "${answerByLocale.ru || "missing"}"`);
      lines.push(`   - ru evidence: "${evidenceByLocale.ru || "missing"}"`);
      lines.push(`   - ru first run: "${firstRunByLocale.ru || "missing"}"`);
      lines.push(`   - ru detail: "${detailHeadingByLocale.ru || "missing"}" / "${detailMoveByLocale.ru || "missing"}"`);
      lines.push(`   - ru library: "${libraryPlanByLocale.ru || "missing"}" / "${libraryGamesByLocale.ru || "missing"}" / "${libraryDashboardByLocale.ru || "missing"}"`);
      lines.push(`   - ru wishlist: "${wishlistTitleByLocale.ru || "missing"}" / "${wishlistDecisionByLocale.ru || "missing"}" / "${wishlistDashboardByLocale.ru || "missing"}"`);
      lines.push(`   - ru discover: "${discoverSearchByLocale.ru || "missing"}" / "${discoverMemoryByLocale.ru || "missing"}" / "${discoverCatalogByLocale.ru || "missing"}" / "${discoverMetricByLocale.ru || "missing"}"`);
      lines.push(`   - ru taste: "${tasteLearningByLocale.ru || "missing"}" / "${tasteStatusByLocale.ru || "missing"}" / "${tasteShareByLocale.ru || "missing"}" / "${tasteReceiptByLocale.ru || "missing"}"`);
    }
    if (!ok) return { ok, lines };
    return { ok: true, lines: [`✅ Mobile OK (EN + RU, 8 views + settings; no 375px overflow or controls under ${MIN_TOUCH}px)`] };
  },
};

if (isMain(import.meta.url)) await runStandalone(gate, rootUrlFromArgv());
