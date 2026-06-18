/* English message catalog. Registered as window.PlaySputnikMessages.en.
 * Keys are namespaced by surface (header, nav, …). Plural values are objects
 * { one, other }. Keep en and ru (src/i18n-ru.js) structurally in sync. */
(function () {
  "use strict";
  const messages = (window.PlaySputnikMessages = window.PlaySputnikMessages || {});
  messages.en = {
    common: {
      language: "Language",
      languageEnglish: "English",
      languageRussian: "Russian",
      themeToggle: "Toggle dark mode",
      settings: "Settings",
      storeSuffix: "Store",
    },
    header: {
      eyebrow: "For players with money, not time",
      title: "What should I play tonight?",
    },
    nav: {
      todayTitle: "Today", todaySub: "Play now",
      libraryTitle: "Library", librarySub: "Owned queue",
      discoverTitle: "Discover", discoverSub: "Find games",
      wishlistTitle: "Wishlist", wishlistSub: "Buy smarter",
      tasteTitle: "Taste", tasteSub: "Profile",
      dealsTitle: "Deals", dealsSub: "On sale",
      dataTitle: "Data", dataSub: "Sources",
      statsTitle: "Stats", statsSub: "My library",
      ariaProductAreas: "Product areas",
    },
    views: {
      today: { summary: "Tonight pick, first value proof, and the short plan." },
      library: { summary: "Owned, subscription, playing, paused, completed, and saved games in one queue." },
      discover: { summary: "Search, broad catalog covers, taste radar, and subscription drops without turning the app into a price tracker." },
      wishlist: { summary: "Wishlist, deal candidates, buy guardrails, and games worth watching." },
      taste: { summary: "What the companion knows, what it learned recently, and how confident it should be." },
      deals: { summary: "Live PS Store discounts sorted by value. Filtered to your region and taste." },
      data: { summary: "Source health, refresh rules, catalog backbone, and prototype diagnostics." },
      stats: { summary: "Your library by status, top taste atoms, total HLTB hours, and catalog coverage." },
    },
  };
})();
