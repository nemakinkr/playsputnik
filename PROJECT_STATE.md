# PlaySputnik Project State

Last updated: 2026-06-06 (session 2)

## Product

PlaySputnik is an AI gaming companion, not primarily a price tracker. The core loop:

1. Learn taste quickly.
2. Remember library, backlog, completed games, subscriptions, wishlist, and upcoming interest.
3. Tell the user what to play now and why.
4. Use prices, sales, and subscription drops as supporting signals.

Target user: adult players with money for games but limited time to browse reviews, catalogs, sale pages, and announcements.

## Current Prototype

- Static app: `index.html`, `styles.css`, `app.js`, with config in `src/app-config.js`, state/persistence in `src/app-state.js`, search normalization in `src/app-search.js`, enrichment utilities in `src/app-enrichment.js`, taste engine/scoring in `src/app-score.js`, and explain/evidence/price signals in `src/app-recommend.js`.
- Local preview: `http://127.0.0.1:4190/`.
- Current server check: `node scripts/preview-server.mjs --check`.
- Product areas: `Today`, `Library`, `Discover`, `Wishlist`, `Taste`, `Data`.
- First-run onboarding: 30 known-game swipe deck with `Liked`, `Not for me`, `Not played`, undo, and 3/6/10 signal milestones.
- First 30 seconds panel: quick value proof, current pick, backup, guardrail, and actions.
- Companion answer: short human verdict with personal evidence, alternatives, risk, and buy guardrail.
- Normalized user memory: access, completion status, saved, hidden, ratings, events.
- Library and Wishlist dashboards: filters, quick actions, purchase guardrails, and bought/save/hide persistence.
- Game detail drawer: opens from hero/cards/catalog/library/wishlist, shows cover/source, fit, status cards, facts, atoms, decision copy, and state actions.
- Search-to-memory flow: search results now expose `Details`, `Wishlist`, `Owned`, and `Plus`; external fixture/provider/manual candidates can open in the drawer and persist into normalized Library/Wishlist memory.
- Provider search hardening: frontend/provider scoring now exposes `matchKind`, provider responses use `search-result-v2`, RAWG live and fixture fallback share the same normalized shape, and provider fallback/offline/rate-limit states are recoverable in the UI.
- Search quality matrix: `scripts/search-quality-matrix.mjs` validates 22 high-signal queries across aliases, Roman numerals, diacritics, Russian names, fixture candidates, typo tolerance, and alias-manual fallback.
- Sixth modularization pass: explain/evidence/price signals/watch-outs/fact list extracted to `src/app-recommend.js` (18 functions: `snapshotAgeHours`, `layerPolicy`, `signalStatus`, `priceStatus`, `subscriptionStatus`, `coverLabel`, `formatMoney`, `formatPrice`, `priceCanGuideBuy`, `gameDescription`, `watchOuts`, `watchOutCopy`, `answerAccessLabel`, `explain`, `personalReferenceGames`, `personalRankForecast`, `personalEvidence`, `factList`); `app.js` now 5544 lines (was 5893).
- Fifth modularization pass: taste engine + scoring extracted to `src/app-score.js` (21 functions: `gameSignals`, `feedbackWeightForAction/ActionLabel/EffectLabel`, `feedbackTasteWeights`, `combinedTasteWeight`, `quickTasteWeights`, `legacyLikedTasteWeights`, `tasteEngineProfile/GameSignals/Score`, `notebookTitles/WishlistWeight/AccessKind/CompletedSet/TasteScore`, `scoreBreakdown`, `scoreGame`, `personalFitBand`, `rankRangeForScore`); `app.js` now 5850 lines (was 6300).
- Fourth modularization pass: enrichment utilities (`compactStatus`, `countValues`, `topEntries`, `uniqueCompact`, `enrichmentRuleForTitle`, `inferredAtomsForTitle`, `confidenceTone`, `sourcePassportItem`, `sourcePassportHtml`, `missingChecksForItem`, `searchResultSourcePassport`, `mergeStoreData`) extracted to `src/app-enrichment.js`; `TITLE_ENRICHMENT_RULES` moved to `src/app-config.js`; ~200 lines removed from `app.js`.
- First-30-seconds value pass: pre-swipe state now shows a clear CTA ("Swipe 3 games to see your first pick"); after 3 signals the bridge shows a confidence badge (Early read / Starter profile / Good profile) and a "Improve your profile" next-steps panel with 3 paths (swipe more, PSN import, paste ratings); mobile/tablet breakpoints hardened at 768px.

## Data And Catalog

- Seed catalog: `data/games.json`, currently 48 games.
- Catalog backbone: `data/catalog-backbone.json`, currently 101 candidates across 10 lanes.
- External no-key search fixtures: `data/global-search-fixtures.json`, currently 117 records.
- RAWG is optional through `.env.local` / `RAWG_API_KEY`; do not print the key.
- Cover candidates: `data/cover-snapshots.json`, RAWG attribution where resolved, generated posters as fallback.
- Store data is split into price snapshots, price history, and subscription availability.
- Prices/subscriptions are sample snapshots, not live ingestion.

## Current Verification

Fast checks for most code/data changes:

```sh
node --check app.js
node scripts/search-quality-matrix.mjs
node scripts/qa-harness.mjs
node scripts/validate-data.mjs
node scripts/preview-server.mjs --check
```

Targeted browser smokes, run sequentially:

```sh
node scripts/browser-smoke-test.mjs
node scripts/app-view-smoke-test.mjs
node scripts/library-wishlist-smoke-test.mjs
node scripts/game-detail-smoke-test.mjs
node scripts/search-memory-smoke-test.mjs
node scripts/visual-catalog-smoke-test.mjs
node scripts/design-smoke-test.mjs
```

Do not run all heavy Chrome smokes in parallel; it has caused false timeouts locally.

## Known Constraints

- PSN import is demo logic, not a real PSN integration.
- Search can now turn seed/backbone/fixture/provider/manual results into app memory with hardened provider fallback, but broad catalog quality still depends on RAWG/fixture coverage and does not include live PS Store price/subscription ingestion.
- The app is still mostly one large `app.js`; modularization has started with config, state/persistence, and search normalization extraction, but render/UI logic still needs splitting.
- Investor readiness is "strong prototype narrative", not yet a polished app.

## Next Recommended Task

Improve the first-30-seconds value proof:

`Open app -> mark a few games -> see a cautious useful read -> understand how to improve taste later without blocking usage`.

See `NEXT_TASKS.md` for acceptance criteria and `docs/development-protocol.md` for the token-saving workflow.
