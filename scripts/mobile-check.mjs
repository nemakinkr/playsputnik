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
  try {
    openAppView("deals");
    render();
    renderDeals();
  } catch (e) {}
  const dealsTitle = (document.querySelector("#deals-title")?.textContent || "").trim();
  const dealsStatus = (document.querySelector("#deals-status")?.textContent || "").trim();
  const dealsFilter = (document.querySelector('[data-deals-filter="all"]')?.textContent || "").trim();
  try {
    openAppView("stats");
    render();
    renderStats();
  } catch (e) {}
  const statsTitle = (document.querySelector("#stats-title")?.textContent || "").trim();
  const statsBadge = (document.querySelector("#stats-badge")?.textContent || "").trim();
  const statsFirstLabel = (document.querySelector(".stats-tile span")?.textContent || "").trim();
  const statsCalibrationTitle = (document.querySelector("#stats-calibration .stats-section-heading")?.textContent || "").trim();
  const statsCalibrationText = (document.querySelector("#stats-calibration .stats-calibration-summary")?.textContent || "").trim();
  try {
    openAppView("data");
    render();
    renderRefreshPolicy(rankedGames());
    renderSourceHealth();
    renderDevHealth();
    renderDataWorkbench();
    renderCatalogBackbone();
    renderCatalogWorkbench();
    renderDebug(rankedGames()[0]);
  } catch (e) {}
  const dataRefreshTitle = (document.querySelector("#refresh-policy-title")?.textContent || "").trim();
  const dataRefreshMode = (document.querySelector("#refresh-policy-status")?.textContent || "").trim();
  const dataRefreshBand = (document.querySelector("#refresh-policy-list .policy-row strong")?.textContent || "").trim();
  const dataRefreshCadence = (document.querySelector("#refresh-policy-list .policy-cadence")?.textContent || "").trim();
  const dataSourceMode = (document.querySelector("#source-mode")?.textContent || "").trim();
  const dataSourceLayer = (document.querySelector("#source-list .source-row strong")?.textContent || "").trim();
  const dataSourceKind = (document.querySelector("#source-list .source-row div span")?.textContent || "").trim();
  const dataSourceNote = (document.querySelector("#source-list .source-row > span:last-child")?.textContent || "").trim();
  const dataDevLabel = (document.querySelector("#dev-health-list .dev-health-row strong")?.textContent || "").trim();
  const dataDevDetail = (document.querySelector("#dev-health-list .dev-health-row div span")?.textContent || "").trim();
  const dataDevStatus = (document.querySelector("#dev-health-list .dev-health-state")?.textContent || "").trim();
  const dataWorkbenchTitle = (document.querySelector("#workbench-title")?.textContent || "").trim();
  const dataWorkbenchStatus = (document.querySelector("#workbench-status")?.textContent || "").trim();
  const dataAdultSignal = (document.querySelector("#workbench-grid .workbench-card:nth-last-child(5) > span")?.textContent || "").trim();
  const dataCatalogLabel = (document.querySelector(".workbench-card > span")?.textContent || "").trim();
  const dataBackboneLane = (document.querySelector("#catalog-backbone-list .backbone-row strong")?.textContent || "").trim();
  const dataImportSource = (document.querySelector("#catalog-workbench-list .catalog-import-row div span")?.textContent || "").trim();
  const dataImportPills = Array.from(document.querySelectorAll("#catalog-workbench-list .catalog-import-row:first-child .catalog-pill"))
    .map((element) => (element.textContent || "").trim()).join("|");
  const dataImportReview = (document.querySelector("#catalog-workbench-list .catalog-import-row > span:last-child")?.textContent || "").trim();
  const dataExportTitle = (document.querySelector("#export-title")?.textContent || "").trim();
  const dataDebugTitle = (document.querySelector("#debug-title")?.textContent || "").trim();
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
    dealsTitle,
    dealsStatus,
    dealsFilter,
    statsTitle,
    statsBadge,
    statsFirstLabel,
    statsCalibrationTitle,
    statsCalibrationText,
    dataRefreshTitle,
    dataRefreshMode,
    dataRefreshBand,
    dataRefreshCadence,
    dataSourceMode,
    dataSourceLayer,
    dataSourceKind,
    dataSourceNote,
    dataDevLabel,
    dataDevDetail,
    dataDevStatus,
    dataWorkbenchTitle,
    dataWorkbenchStatus,
    dataAdultSignal,
    dataCatalogLabel,
    dataBackboneLane,
    dataImportSource,
    dataImportPills,
    dataImportReview,
    dataExportTitle,
    dataDebugTitle,
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
    await waitFor(cdp, "typeof dataHealth !== 'undefined' && dataHealth && dataHealth.gameCount > 0");
    await waitFor(cdp, "typeof catalogBackbone !== 'undefined' && catalogBackbone && typeof catalogWorkbench !== 'undefined' && catalogWorkbench");
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
        dealsTitle: pass.dealsTitle || "",
        dealsStatus: pass.dealsStatus || "",
        dealsFilter: pass.dealsFilter || "",
        statsTitle: pass.statsTitle || "",
        statsBadge: pass.statsBadge || "",
        statsFirstLabel: pass.statsFirstLabel || "",
        statsCalibrationTitle: pass.statsCalibrationTitle || "",
        statsCalibrationText: pass.statsCalibrationText || "",
        dataRefreshTitle: pass.dataRefreshTitle || "",
        dataRefreshMode: pass.dataRefreshMode || "",
        dataRefreshBand: pass.dataRefreshBand || "",
        dataRefreshCadence: pass.dataRefreshCadence || "",
        dataSourceMode: pass.dataSourceMode || "",
        dataSourceLayer: pass.dataSourceLayer || "",
        dataSourceKind: pass.dataSourceKind || "",
        dataSourceNote: pass.dataSourceNote || "",
        dataDevLabel: pass.dataDevLabel || "",
        dataDevDetail: pass.dataDevDetail || "",
        dataDevStatus: pass.dataDevStatus || "",
        dataWorkbenchTitle: pass.dataWorkbenchTitle || "",
        dataWorkbenchStatus: pass.dataWorkbenchStatus || "",
        dataAdultSignal: pass.dataAdultSignal || "",
        dataCatalogLabel: pass.dataCatalogLabel || "",
        dataBackboneLane: pass.dataBackboneLane || "",
        dataImportSource: pass.dataImportSource || "",
        dataImportPills: pass.dataImportPills || "",
        dataImportReview: pass.dataImportReview || "",
        dataExportTitle: pass.dataExportTitle || "",
        dataDebugTitle: pass.dataDebugTitle || "",
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
    const dealsTitleByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dealsTitle]));
    const dealsStatusByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dealsStatus]));
    const dealsFilterByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dealsFilter]));
    const statsTitleByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.statsTitle]));
    const statsBadgeByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.statsBadge]));
    const statsFirstByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.statsFirstLabel]));
    const statsCalibrationTitleByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.statsCalibrationTitle]));
    const statsCalibrationTextByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.statsCalibrationText]));
    const dataRefreshByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dataRefreshTitle]));
    const dataRefreshModeByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dataRefreshMode]));
    const dataRefreshBandByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dataRefreshBand]));
    const dataRefreshCadenceByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dataRefreshCadence]));
    const dataSourceModeByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dataSourceMode]));
    const dataSourceLayerByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dataSourceLayer]));
    const dataSourceKindByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dataSourceKind]));
    const dataSourceNoteByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dataSourceNote]));
    const dataDevLabelByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dataDevLabel]));
    const dataDevDetailByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dataDevDetail]));
    const dataDevStatusByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dataDevStatus]));
    const dataWorkbenchByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dataWorkbenchTitle]));
    const dataWorkbenchStatusByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dataWorkbenchStatus]));
    const dataAdultSignalByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dataAdultSignal]));
    const dataCatalogByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dataCatalogLabel]));
    const dataBackboneLaneByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dataBackboneLane]));
    const dataImportSourceByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dataImportSource]));
    const dataImportPillsByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dataImportPills]));
    const dataImportReviewByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dataImportReview]));
    const dataExportByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dataExportTitle]));
    const dataDebugByLocale = Object.fromEntries((localizedAnswers || []).map((item) => [item.locale, item.dataDebugTitle]));
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
    const dealsEnOk = dealsTitleByLocale.en === "On sale now"
      && /on sale/i.test(dealsStatusByLocale.en || "")
      && dealsFilterByLocale.en === "All deals";
    const dealsRuOk = dealsTitleByLocale.ru === "Скидки сейчас"
      && /со скидкой/i.test(dealsStatusByLocale.ru || "")
      && dealsFilterByLocale.ru === "Все скидки";
    const statsEnOk = statsTitleByLocale.en === "My Library stats"
      && /tracked/i.test(statsBadgeByLocale.en || "")
      && statsFirstByLocale.en === "Tracked games"
      && statsCalibrationTitleByLocale.en === "How well the companion knows my scale"
      && /ratings|Calibration is forming/.test(statsCalibrationTextByLocale.en || "");
    const statsRuOk = statsTitleByLocale.ru === "Статистика моей библиотеки"
      && /отслеживается/i.test(statsBadgeByLocale.ru || "")
      && statsFirstByLocale.ru === "Игры в памяти"
      && statsCalibrationTitleByLocale.ru === "Насколько компаньон понимает мою шкалу"
      && /оценок|Калибровка формируется/.test(statsCalibrationTextByLocale.ru || "");
    const dataEnOk = dataRefreshByLocale.en === "Refresh policy"
      && dataRefreshModeByLocale.en === "Intent-weighted refresh"
      && dataRefreshBandByLocale.en === "Hot intent"
      && dataRefreshCadenceByLocale.en === "6-12h"
      && dataSourceModeByLocale.en === "No paid API mode"
      && dataSourceLayerByLocale.en === "Game catalog"
      && dataSourceKindByLocale.en === "Curated seed JSON"
      && /recommendation validation/.test(dataSourceNoteByLocale.en || "")
      && dataDevLabelByLocale.en === "Preview server"
      && /Current client rendered/.test(dataDevDetailByLocale.en || "")
      && dataDevStatusByLocale.en === "pass"
      && dataWorkbenchByLocale.en === "Data workbench"
      && /needs attention/.test(dataWorkbenchStatusByLocale.en || "")
      && dataAdultSignalByLocale.en === "Commitment"
      && dataCatalogByLocale.en === "Catalog"
      && dataBackboneLaneByLocale.en === "Cinematic story"
      && dataImportSourceByLocale.en === "wishlist note"
      && dataImportPillsByLocale.en === "high|candidate|needs review|hot"
      && dataImportReviewByLocale.en === "cover rights, release metadata"
      && dataExportByLocale.en === "Export & Import"
      && dataDebugByLocale.en === "Why this ranking";
    const dataRuOk = dataRefreshByLocale.ru === "Правила обновления"
      && dataRefreshModeByLocale.ru === "Обновление по намерению"
      && dataRefreshBandByLocale.ru === "Горячее намерение"
      && dataRefreshCadenceByLocale.ru === "каждые 6–12 ч"
      && dataSourceModeByLocale.ru === "Режим без платных API"
      && dataSourceLayerByLocale.ru === "Каталог игр"
      && dataSourceKindByLocale.ru === "Отобранный вручную JSON"
      && /проверки рекомендаций/.test(dataSourceNoteByLocale.ru || "")
      && dataDevLabelByLocale.ru === "Сервер предпросмотра"
      && /Клиент отрисован/.test(dataDevDetailByLocale.ru || "")
      && dataDevStatusByLocale.ru === "успешно"
      && dataWorkbenchByLocale.ru === "Рабочая область данных"
      && /требует внимания/.test(dataWorkbenchStatusByLocale.ru || "")
      && dataAdultSignalByLocale.ru === "Обязательства"
      && dataCatalogByLocale.ru === "Каталог"
      && dataBackboneLaneByLocale.ru === "Кинематографичный сюжет"
      && dataImportSourceByLocale.ru === "заметка из Желаемого"
      && dataImportPillsByLocale.ru === "высокая|кандидат|нужна проверка|горячая"
      && dataImportReviewByLocale.ru === "права на обложку, метаданные релиза"
      && dataExportByLocale.ru === "Экспорт и импорт"
      && dataDebugByLocale.ru === "Почему такой рейтинг";
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
      ...Object.values(dealsTitleByLocale),
      ...Object.values(dealsStatusByLocale),
      ...Object.values(dealsFilterByLocale),
      ...Object.values(statsTitleByLocale),
      ...Object.values(statsBadgeByLocale),
      ...Object.values(statsFirstByLocale),
      ...Object.values(statsCalibrationTitleByLocale),
      ...Object.values(statsCalibrationTextByLocale),
      ...Object.values(dataRefreshByLocale),
      ...Object.values(dataRefreshModeByLocale),
      ...Object.values(dataRefreshBandByLocale),
      ...Object.values(dataRefreshCadenceByLocale),
      ...Object.values(dataSourceModeByLocale),
      ...Object.values(dataSourceLayerByLocale),
      ...Object.values(dataSourceKindByLocale),
      ...Object.values(dataSourceNoteByLocale),
      ...Object.values(dataDevLabelByLocale),
      ...Object.values(dataDevDetailByLocale),
      ...Object.values(dataDevStatusByLocale),
      ...Object.values(dataWorkbenchByLocale),
      ...Object.values(dataWorkbenchStatusByLocale),
      ...Object.values(dataAdultSignalByLocale),
      ...Object.values(dataCatalogByLocale),
      ...Object.values(dataBackboneLaneByLocale),
      ...Object.values(dataImportSourceByLocale),
      ...Object.values(dataImportPillsByLocale),
      ...Object.values(dataImportReviewByLocale),
      ...Object.values(dataExportByLocale),
      ...Object.values(dataDebugByLocale),
    ]
      .some((value) => /^(narrative|library|wishlist|discover|taste|deals|stats|data)\./.test(value));
    if (!enOk || !ruOk || !evidenceEnOk || !evidenceRuOk || !firstRunEnOk || !firstRunRuOk || !detailEnOk || !detailRuOk || !libraryEnOk || !libraryRuOk || !wishlistEnOk || !wishlistRuOk || !discoverEnOk || !discoverRuOk || !tasteEnOk || !tasteRuOk || !dealsEnOk || !dealsRuOk || !statsEnOk || !statsRuOk || !dataEnOk || !dataRuOk || leakedKey) {
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
      lines.push(`   - en deals: "${dealsTitleByLocale.en || "missing"}" / "${dealsStatusByLocale.en || "missing"}" / "${dealsFilterByLocale.en || "missing"}"`);
      lines.push(`   - en stats: "${statsTitleByLocale.en || "missing"}" / "${statsBadgeByLocale.en || "missing"}" / "${statsFirstByLocale.en || "missing"}" / "${statsCalibrationTitleByLocale.en || "missing"}"`);
      lines.push(`   - en data: "${dataRefreshByLocale.en || "missing"}" / "${dataRefreshModeByLocale.en || "missing"}" / "${dataSourceLayerByLocale.en || "missing"}" / "${dataDevLabelByLocale.en || "missing"}" / "${dataWorkbenchByLocale.en || "missing"}" / "${dataBackboneLaneByLocale.en || "missing"}" / "${dataImportPillsByLocale.en || "missing"}"`);
      lines.push(`   - ru title: "${answerByLocale.ru || "missing"}"`);
      lines.push(`   - ru evidence: "${evidenceByLocale.ru || "missing"}"`);
      lines.push(`   - ru first run: "${firstRunByLocale.ru || "missing"}"`);
      lines.push(`   - ru detail: "${detailHeadingByLocale.ru || "missing"}" / "${detailMoveByLocale.ru || "missing"}"`);
      lines.push(`   - ru library: "${libraryPlanByLocale.ru || "missing"}" / "${libraryGamesByLocale.ru || "missing"}" / "${libraryDashboardByLocale.ru || "missing"}"`);
      lines.push(`   - ru wishlist: "${wishlistTitleByLocale.ru || "missing"}" / "${wishlistDecisionByLocale.ru || "missing"}" / "${wishlistDashboardByLocale.ru || "missing"}"`);
      lines.push(`   - ru discover: "${discoverSearchByLocale.ru || "missing"}" / "${discoverMemoryByLocale.ru || "missing"}" / "${discoverCatalogByLocale.ru || "missing"}" / "${discoverMetricByLocale.ru || "missing"}"`);
      lines.push(`   - ru taste: "${tasteLearningByLocale.ru || "missing"}" / "${tasteStatusByLocale.ru || "missing"}" / "${tasteShareByLocale.ru || "missing"}" / "${tasteReceiptByLocale.ru || "missing"}"`);
      lines.push(`   - ru deals: "${dealsTitleByLocale.ru || "missing"}" / "${dealsStatusByLocale.ru || "missing"}" / "${dealsFilterByLocale.ru || "missing"}"`);
      lines.push(`   - ru stats: "${statsTitleByLocale.ru || "missing"}" / "${statsBadgeByLocale.ru || "missing"}" / "${statsFirstByLocale.ru || "missing"}" / "${statsCalibrationTitleByLocale.ru || "missing"}"`);
      lines.push(`   - ru data: "${dataRefreshByLocale.ru || "missing"}" / "${dataRefreshModeByLocale.ru || "missing"}" / "${dataSourceLayerByLocale.ru || "missing"}" / "${dataDevLabelByLocale.ru || "missing"}" / "${dataWorkbenchByLocale.ru || "missing"}" / "${dataBackboneLaneByLocale.ru || "missing"}" / "${dataImportPillsByLocale.ru || "missing"}"`);
    }
    if (!ok) return { ok, lines };
    return { ok: true, lines: [`✅ Mobile OK (EN + RU, 8 views + settings; no 375px overflow or controls under ${MIN_TOUCH}px)`] };
  },
};

if (isMain(import.meta.url)) await runStandalone(gate, rootUrlFromArgv());
