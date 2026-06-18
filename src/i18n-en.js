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
    today: {
      metrics: {
        screenedLabel: "Screened", radarLabel: "Radar", timeFitLabel: "Time fit",
        libraryLabel: "Library", guardedLabel: "Guarded",
        games: { one: "{count} game", other: "{count} games" },
        leads: { one: "{count} lead", other: "{count} leads" },
        picks: { one: "{count} pick", other: "{count} picks" },
        states: { one: "{count} state", other: "{count} states" },
        skips: { one: "{count} skip", other: "{count} skips" },
      },
      sample: {
        kickerDemo: "Sample profile live",
        kickerReview: "Review mode",
        remembered: { one: "{count} remembered game", other: "{count} remembered games" },
        wishlistCount: "{count} wishlist",
        titleReview: "See the companion with memory",
        detailDemo: "{title} anchors Today. {search}",
        detailReview: "Load a realistic sample profile to inspect recommendations, wishlist, ratings, and price intent as one loop.",
        searchFocused: "Discover is focused on {query}.",
        searchDefault: "Jump into Discover with the current recommendation as context.",
        anchorFallback: "A first pick",
        chipTaste: "Taste", chipMemory: "Memory", chipWishlist: "Wishlist",
        chipOneClick: "One click", chipPrices: "Prices",
        ratings: { one: "{count} rating", other: "{count} ratings" },
        saved: "{count} saved",
        valFullLoop: "full loop", valSeeded: "seeded", valWatchIntent: "watch intent",
        actOpenPick: "Open pick", actExplore: "Explore in Discover", actRefresh: "Refresh search",
        actWishlist: "Wishlist", actBackToday: "Back to Today",
        actLoadDemo: "Load demo profile", actExploreCatalog: "Explore catalog",
      },
      time: {
        label: "Tonight I have:", aria: "Pick your available time",
        min30: "30 min", min45: "45 min", hour1: "1 hour", hour2: "2 hours",
        longEvening: "Long evening", any: "Any",
      },
    },
  };
})();
