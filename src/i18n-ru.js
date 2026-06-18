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
  };
})();
