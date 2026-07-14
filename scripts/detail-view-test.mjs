import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/app-detail-view.js", import.meta.url), "utf8");
const context = {
  window: {},
  t: (key, params = {}) => `${key}${params.count ? `:${params.count}` : ""}`,
};
vm.runInNewContext(source, context, { filename: "src/app-detail-view.js" });

const { detailHeroHtml, detailBodyHtml } = context.window.PlaySputnikDetailView.createDetailViewTools({
  detailAttr: (value) => String(value || "").replace(/"/g, "&quot;"),
});
const game = { title: "Control" };
const html = detailBodyHtml({
  game,
  statusCards: [{ tone: "access", label: "Access", value: "Owned", detail: "" }],
  editionNote: "",
  cockpit: '<section data-detail-cockpit></section>',
  description: "A strange action game.",
  rationale: { detail: "Strong personal fit." },
  watchout: { label: "Risk", detail: "Can feel opaque" },
  tasteFit: '<section data-detail-taste-fit></section>',
  amnesty: null,
  valueCard: null,
  market: "",
  priceWatch: "",
  trustRows: [{ tone: "good", label: "Catalog", value: "Seed", detail: "Curated" }],
  playProfile: {
    difficulty: "Normal",
    intensity: "Moderate",
    confidence: "High",
    source: "Curated catalog value",
    evidence: ["difficulty: normal"],
  },
  facts: [{ type: "session", label: "Medium" }],
  passport: '<div class="source-passport"></div>',
  cachedAiExplanation: "",
  similar: [{ game: { title: 'Alan Wake "2"' }, shared: ["story", "strange"] }],
  actions: [{ state: "saved", label: "Wishlist", className: "is-active" }],
  queued: true,
  currentSputniks: 4,
  sputnikSvg: "<svg></svg>",
  chunk: { label: "chapter", minutes: 60 },
  links: [{ href: "https://example.com/game", label: "Store", kind: "store" }],
});

assert(detailHeroHtml(game, "<span>Fit</span>").includes("Control"));
assert(/data-detail-cockpit/.test(html));
assert(/data-detail-source-trust/.test(html));
assert(/data-detail-play-profile/.test(html));
assert(/data-detail-intensity-confidence>High</.test(html));
assert(/data-detail-state="saved"/.test(html));
assert(/data-detail-rate-later/.test(html) && /is-selected/.test(html));
assert(/data-rate-sputniks="5"/.test(html));
assert(/Alan Wake &quot;2&quot;/.test(html), "similar-game data attributes should be escaped");
assert(/detail-get-link--store/.test(html));

console.log("✅ game-detail view composes cockpit, play profile, trust, actions, ratings, and links");
