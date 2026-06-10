# PlaySputnik Backlog

Use this file to pick the next task without rereading the whole chat or README. Keep each task short and update only the relevant lines after work is done.

## Global Tasks

### 1. Search-To-Memory Flow

Status: done

Goal: make search feel like a real product flow, not a debug panel.

User flow:

`Search title -> compare result/source -> open game detail -> add to Wishlist or Library -> see it in recommendations/dashboards`.

Likely files:

- `app.js`
- `index.html`
- `styles.css`
- `scripts/qa-harness.mjs`
- one focused browser smoke if needed

Acceptance criteria:

- Search result has a clear primary action and a `Details` path.
- Detail drawer works for seed, backbone, fixture, RAWG provider, and manual fallback candidates.
- Adding to Wishlist persists normalized user-game fields: title, saved, source, match confidence, cover status, price status, provider metadata when available.
- Adding as owned/subscription/completed routes the game into Library memory, not only Wishlist.
- Duplicate/alias handling prevents obvious duplicate saves.
- The saved external game appears in at least one relevant recommendation surface or dashboard.
- Missing facts stay visibly unverified.

Checks:

```sh
node --check app.js
node scripts/qa-harness.mjs
node scripts/validate-data.mjs
node scripts/search-memory-smoke-test.mjs
node scripts/game-detail-smoke-test.mjs
node scripts/browser-smoke-test.mjs
```

### 2. First-30-Seconds Value Pass

Status: done

Goal: make the first screen impossible to dismiss in the first 30 seconds.

Acceptance criteria:

- After 3 taste signals, the app says it has a cautious first read, not a full profile.
- The user sees that 6/10/30 signals, PSN/library, or pasted rankings can improve the profile later.
- The first recommendation explains one pull signal, one caution signal, and one no-spend/library guardrail.
- Copy stays short and product-like, not tutorial-like.
- Mobile first screen has no overlap or huge dead zones.

Checks:

```sh
node scripts/browser-smoke-test.mjs
node scripts/design-smoke-test.mjs
```

### 3. Provider Search Hardening

Status: done

Goal: make optional RAWG/provider search reliable enough for broad discovery.

Acceptance criteria:

- RAWG live search and fixture fallback return the same normalized shape.
- Provider errors and rate limits show a recoverable state.
- Deferred search sources do not create misleading early rankings while fixture/provider data is still loading.
- Result ranking handles sequels, aliases, punctuation, diacritics, and localized names.
- RAWG cover/source attribution remains visible wherever cover candidates render.
- Provider results do not create duplicate wishlist/library records.

Checks:

```sh
node scripts/search-provider-server.mjs --once "Grand Theft Auto"
node scripts/search-provider-server.mjs --once "Black Myth" --force-fixture
node scripts/search-quality-matrix.mjs
node scripts/qa-harness.mjs
```

### 4. App Modularization

Status: tenth pass done (wishlist + price-watch logic)

Goal: reduce future token and bug cost by splitting the large `app.js`.

Suggested modules:

- app config: started in `src/app-config.js`
- state and persistence: started in `src/app-state.js`
- scoring and recommendation helpers
- search/provider normalization: started in `src/app-search.js`
- game detail drawer
- Library/Wishlist rendering
- onboarding swipe
- dev health/data workbench

Acceptance criteria:

- No behavior changes in the first pass.
- Public helper boundaries are documented with small comments.
- Existing smoke tests pass.
- Future task analysis can inspect one module instead of all `app.js`.

Checks:

```sh
node --check app.js
node scripts/qa-harness.mjs
node scripts/browser-smoke-test.mjs
```

### 5. Investor Demo Polish

Status: open

Goal: make the prototype feel like a coherent early app, not a pile of validated systems.

Acceptance criteria:

- A 2-3 minute route exists in `docs/demo-script.md`.
- The demo shows quick taste, first pick, library-first mode, wishlist/buy guardrail, and search-to-memory.
- Internal/debug panels stay out of the default demo path.
- Visual hierarchy feels professional on desktop and mobile.

Checks:

```sh
node scripts/app-view-smoke-test.mjs
node scripts/design-smoke-test.mjs
```

## Important Refinements

### A. Personal Ranking Forecast Honesty

Only show a personal rank range when the user has enough ranked history. With only a few swipe signals, show fit tier and uncertainty instead.

### B. Onboarding Game Set Review

Keep the swipe deck taste-diagnostic: story, action, challenge, horror, cozy, multiplayer, sports, strategy, sandbox, service, short-session, long-session.

### C. Data Contract Cleanup

Document persisted `userGames`, cover metadata, price freshness, subscription availability, and source passport fields before the catalog grows much larger.

### D. Browser QA Discipline

Run heavy Chrome smokes sequentially. Parallel Chrome runs have caused false local timeouts.

## Done Recently

- Tenth modularization pass: `src/app-wishlist.js` — price watch, wishlist intent, triage decisions, dashboard cards, filters (11 функций: `priceWatchReason`, `priceHistoryForGame`, `historicalLowForGame`, `priceWatchRecord`, `historicalLowCopy`, `priceWatchRecords`, `wishlistIntentRecords`, `wishlistDecision`, `wishlistDashboardCards`, `wishlistFilterSummary`, `wishlistFilterMatches`); app.js теперь 4515 строк (−179).
- Ninth modularization pass: `src/app-library.js` — library plan, companion plan, taste memory, dashboard data (23 функции: `playLaterQueue`, `bestLibraryPick`, `primaryDecisionGame`, `isLibraryFirstMode`, `buyLaterCandidate`, `companionPlan`, `tasteMemory`, `recentLearningEvents`, `libraryPlan`, `libraryPlanFacts`, `importedRatingForGame`, `personalRatingFacet`, `memoryFacets`, `isMemoryStateSelected`, `memoryHint`, `libraryMemoryRecords`, `bestLibraryRecord`, `libraryDashboardCards`, `memoryCandidates`, `libraryLaneForGame`, `libraryFilterMatches`, `libraryFilterSummary`, `queueLaneLabel`); app.js теперь 4694 строки (−520).
- Eighth modularization pass: `src/app-answer.js` — companion answer logic + first-run bridge + receipt (15 функций: `renderEvidenceRows`, `renderUndoStrip`, `isAnswerAccessible`, `answerFitLine`, `answerForecast`, `companionAgendaActions`, `companionAlternatives`, `companionBuyGuardrail`, `companionAnswerAgenda`, `companionAnswer`, `firstRunTasteProof`, `firstRunNextSteps`, `firstRunBridge`, `firstValueReceipt`, `uniqueAnswerGames`); app.js теперь 5152 строки.
- Seventh modularization pass: `src/app-ranking.js` — ranking + deal/purchase logic (7 functions: `rankedGames`, `clusterGames`, `dealReason`, `dealScore`, `purchaseRisk`, `purchaseScore`, `purchaseCandidates`); app.js теперь 5495 строк.
- Sixth modularization pass: `src/app-recommend.js` — explain, evidence, price/subscription signals, access labels, watch-outs, fact list (18 functions, ~350 lines removed from app.js); app.js now 5544 lines; qa-harness updated.
- Fifth modularization pass: `src/app-score.js` — taste engine core (21 functions, ~390 lines); `app.js` shrunk from 6300 → 5850 lines; qa-harness updated.
- Fourth modularization pass: `src/app-enrichment.js` with 12 utility functions + `TITLE_ENRICHMENT_RULES` to config; ~200 lines out of `app.js`; QA harness updated for new module.
- First-30-seconds value pass: pre-swipe CTA, confidence badge (Early read / Starter profile / Good profile), 3-path next-steps panel (swipe / PSN / paste), 768px layout breakpoint for first-run bridge.
- Search-to-memory flow: result actions for Details/Wishlist/Owned/Plus, search-result detail drawer, external provider/fixture/manual persistence into Library memory, and `scripts/search-memory-smoke-test.mjs`.
- Provider search hardening: shared match-kind scoring, stable result comparison, `search-result-v2` provider envelope, recoverable RAWG fallback states, forced fixture QA mode, and local search-index loading warnings.
- Search result quality matrix: 22 CLI-checked queries for GTA/BG3/Yotei/Russian aliases/Hellblade/KCD2/typos/manual fallback, plus alias canonicalization for manual search results.
- Game detail drawer with source attribution, facts, atoms, status cards, state actions, and smoke coverage.
- First modularization pass: app config/constants extracted to `src/app-config.js` and loaded before `app.js`.
- Second modularization pass: state defaults, persistence serialization, user-game normalization, and user-event helpers extracted to `src/app-state.js`.
- Third modularization pass: title/alias normalization, token search scoring, source lookup, and search-result builders extracted to `src/app-search.js`.
- Library/Wishlist dashboards and filters.
- RAWG cover candidates for the 48-game seed catalog.
- Search source passport and AI enrichment for external/unverified candidates.
