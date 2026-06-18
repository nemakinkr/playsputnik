/* Russian message catalog. Registered as window.PlaySputnikMessages.ru.
 * Mirrors src/i18n-en.js structurally. Plural values use { one, few, many }. */
(function () {
  "use strict";
  const messages = (window.PlaySputnikMessages = window.PlaySputnikMessages || {});
  messages.ru = {
    common: {
      language: "Язык",
      languageEnglish: "Английский",
      languageRussian: "Русский",
      themeToggle: "Переключить тёмную тему",
      settings: "Настройки",
      storeSuffix: "Store",
    },
    header: {
      eyebrow: "Для тех, у кого есть деньги, но мало времени",
      title: "Во что поиграть сегодня?",
    },
    nav: {
      todayTitle: "Сегодня", todaySub: "Играть сейчас",
      libraryTitle: "Библиотека", librarySub: "Купленное",
      discoverTitle: "Обзор", discoverSub: "Найти игры",
      wishlistTitle: "Желаемое", wishlistSub: "Покупать умнее",
      tasteTitle: "Вкус", tasteSub: "Профиль",
      dealsTitle: "Скидки", dealsSub: "Распродажа",
      dataTitle: "Данные", dataSub: "Источники",
      statsTitle: "Статистика", statsSub: "Моя коллекция",
      ariaProductAreas: "Разделы продукта",
    },
    views: {
      today: { summary: "Выбор на вечер, первое доказательство ценности и короткий план." },
      library: { summary: "Купленные, по подписке, в процессе, на паузе, пройденные и сохранённые игры в одной очереди." },
      discover: { summary: "Поиск, обложки каталога, радар вкуса и новинки подписки — без превращения приложения в трекер цен." },
      wishlist: { summary: "Желаемое, кандидаты на скидку, ограничители покупки и игры, за которыми стоит следить." },
      taste: { summary: "Что знает компаньон, что он узнал недавно и насколько уверенным ему стоит быть." },
      deals: { summary: "Живые скидки PS Store по убыванию выгоды. Отфильтровано под ваш регион и вкус." },
      data: { summary: "Состояние источников, правила обновления, основа каталога и диагностика прототипа." },
      stats: { summary: "Ваша коллекция по статусам, главные атомы вкуса, суммарные часы HLTB и покрытие каталога." },
    },
    today: {
      metrics: {
        screenedLabel: "Просмотрено", radarLabel: "Радар", timeFitLabel: "По времени",
        libraryLabel: "Библиотека", guardedLabel: "Защита",
        games: { one: "{count} игра", few: "{count} игры", many: "{count} игр" },
        leads: { one: "{count} наводка", few: "{count} наводки", many: "{count} наводок" },
        picks: { one: "{count} вариант", few: "{count} варианта", many: "{count} вариантов" },
        states: { one: "{count} статус", few: "{count} статуса", many: "{count} статусов" },
        skips: { one: "{count} пропуск", few: "{count} пропуска", many: "{count} пропусков" },
      },
      sample: {
        kickerDemo: "Демо-профиль активен",
        kickerReview: "Режим обзора",
        remembered: { one: "{count} запомненная игра", few: "{count} запомненные игры", many: "{count} запомненных игр" },
        wishlistCount: "{count} в желаемом",
        titleReview: "Посмотрите компаньона с памятью",
        detailDemo: "{title} — основа на сегодня. {search}",
        detailReview: "Загрузите реалистичный демо-профиль, чтобы увидеть рекомендации, желаемое, оценки и ценовые намерения как единый цикл.",
        searchFocused: "Обзор сфокусирован на «{query}».",
        searchDefault: "Перейдите в Обзор с текущей рекомендацией как контекстом.",
        anchorFallback: "Первый выбор",
        chipTaste: "Вкус", chipMemory: "Память", chipWishlist: "Желаемое",
        chipOneClick: "Один клик", chipPrices: "Цены",
        ratings: { one: "{count} оценка", few: "{count} оценки", many: "{count} оценок" },
        saved: "{count} сохранено",
        valFullLoop: "полный цикл", valSeeded: "заполнен", valWatchIntent: "слежу за ценой",
        actOpenPick: "Открыть выбор", actExplore: "В Обзор", actRefresh: "Обновить поиск",
        actWishlist: "Желаемое", actBackToday: "Назад к Сегодня",
        actLoadDemo: "Загрузить демо-профиль", actExploreCatalog: "Открыть каталог",
      },
      time: {
        label: "Сегодня у меня:", aria: "Выберите доступное время",
        min30: "30 мин", min45: "45 мин", hour1: "1 час", hour2: "2 часа",
        longEvening: "Долгий вечер", any: "Любое",
      },
    },
  };
})();
