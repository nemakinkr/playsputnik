# Claude Code Handoff - PlaySputnik

Last updated: 2026-06-06  
Workspace: `/Users/kirillnemakin/Documents/Codex/2026-05-26/files-mentioned-by-the-user-playsputnik`

This document is the complete transition note for continuing PlaySputnik in Claude Code. It intentionally does not include any secret values.

## 1. User And Collaboration Context

The user is Kirill. Communicate in Russian unless there is a strong reason not to.

Working style:

- Kirill wants a serious, product-minded collaborator, not just small technical patches.
- After each completed step, offer 3 relevant next actions and recommend one.
- Do not rush to a raw MVP. The target is an "almost real app" that already feels coherent and professional.
- Prefer larger meaningful product tasks over endless tiny polish, while still keeping quality gates.
- Keep explanations practical and direct. Kirill appreciates clear criticism when the product idea needs it.
- Do not blindly copy Kirill's personal game note structure. Treat it as an example of one advanced user's data, not a universal onboarding assumption.

Important product preferences:

- The app must show value in the first 30 seconds, or users may delete it.
- User taste can be captured by quick buttons/swipes, optional PSN/library import later, or pasted rating/backlog text.
- The first experience must work even if the user gives only a few signals, but the app must be honest that confidence is still low.
- Subscription drops are not the center of the product. There are roughly two drops per month; the app should evaluate them, let the user confirm/reject, add good matches if useful, then move on.
- Avoid paid pricing APIs for now.
- The strategic focus shifted away from "price tracker first" toward "AI game companion": taste memory, wishlist, backlog, rating, subscription triage, release radar, and selective price awareness.

## 2. Product Thesis

PlaySputnik is an AI game companion for adult players who have money but limited time.

Core promise:

- Understand a player's taste quickly.
- Help decide what to play today.
- Keep a convenient personal game memory: wishlist, available games, completed games, rankings, backlog, future releases.
- Track only prices and subscription opportunities that matter to the user's taste, not the entire store.
- Explain recommendations in a way that feels personal, useful, and time-saving.

Positioning:

- Not a generic PS Store price tracker.
- Not a raw catalog browser.
- Not only a recommendation engine.
- It should feel like a personal gaming assistant that knows what the user likes, what they own, what they are waiting for, and what deserves attention now.

Minimum product value:

- "What should I play today?"
- "What new subscription games are worth my time?"
- "Which wishlist games are worth buying now?"
- "What upcoming games match my taste?"
- "Keep my backlog/rating/wishlist sane without spreadsheet pain."

## 3. Current State In One Screen

The project is a static frontend prototype with JSON data and local scripts.

It currently has:

- Multi-view app shell: Today, Library, Discover, Wishlist, Taste, Data.
- Local taste memory using `localStorage`.
- Quick taste/onboarding mechanics.
- Game search from local seed catalog, backbone, global fixtures, and optional provider endpoint.
- Search-to-memory flow: search results can be opened, added to Wishlist, Owned, or Plus/Subscription.
- Game detail drawer for catalog and search candidates.
- Manual/unverified game fallback when a title is not found.
- Optional RAWG provider support for search/cover candidates.
- Data QA scripts and browser smoke tests.
- Early modularization: config, state, and search logic moved into `src/`.

It does not yet have:

- Real PSN login/library import.
- Live PS Store catalog-wide pricing.
- Live PS Plus/Extra catalog sync.
- Production backend.
- User accounts.
- Real AI API integration in the app UI.
- Stable legal image pipeline beyond attribution-aware candidate covers.

## 4. Files And Folders

Root app files:

- `index.html` - static app entry. Loads scripts in order.
- `app.js` - main UI and app behavior. Still large; modularization started but not complete.
- `styles.css` - main visual system and responsive styles.
- `README.md` - setup, commands, and current app overview.
- `PROJECT_STATE.md` - current project state. Read this at the start of any task.
- `NEXT_TASKS.md` - task queue and recent work. Read this at the start of any task.
- `CLAUDE_HANDOFF.md` - this handoff.

Modular source:

- `src/app-config.js` - shared constants, routes/views, state labels, catalog constants.
- `src/app-state.js` - default state, persistence helpers, user-game normalization.
- `src/app-search.js` - title normalization, aliases, search scoring, manual results.

Data:

- `data/games.json` - curated seed catalog, currently 48 games.
- `data/catalog-backbone.json` - wider controlled catalog backbone, currently 101 games.
- `data/global-search-fixtures.json` - search fixtures, currently 117 games.
- `data/search-sources.json` - source metadata for search candidates.
- `data/title-aliases.json` - alias map, including Russian/common abbreviations.
- `data/cover-snapshots.json` - cover candidate snapshots.
- `data/price-snapshots.json` - sample price snapshots.
- `data/price-history.json` - sample historical prices.
- `data/subscription-availability.json` - sample subscription availability.
- `data/drop-calendar.json` - planned subscription drop dates.
- `data/monthly-drop.json` - sample monthly drop data.
- `data/taste-radar.json` - taste/release radar data.
- `data/taxonomy.json` - atoms/tags taxonomy.
- `data/catalog-workbench.json` - staging/workbench candidates.
- `data/catalog-sources.json` - catalog source metadata.
- `data/source-status.json` - source health metadata.
- `data/data-health.json` - data health summary.
- `data/dev-health.json` - dev health summary.
- `data/refresh-policy.json` - refresh policy notes/data.

Scripts:

- `scripts/preview-server.mjs` - preview server helper/check.
- `scripts/search-provider-server.mjs` - optional RAWG/fallback search provider.
- `scripts/resolve-cover-candidates.mjs` - cover candidate resolver.
- `scripts/search-quality-matrix.mjs` - search quality regression matrix.
- `scripts/search-memory-smoke-test.mjs` - browser smoke for search-to-memory.
- `scripts/browser-smoke-test.mjs` - general app smoke.
- `scripts/app-view-smoke-test.mjs` - view navigation smoke.
- `scripts/library-wishlist-smoke-test.mjs` - library/wishlist smoke.
- `scripts/game-detail-smoke-test.mjs` - game detail smoke.
- `scripts/visual-catalog-smoke-test.mjs` - visual catalog smoke.
- `scripts/design-smoke-test.mjs` - design/layout smoke.
- `scripts/qa-harness.mjs` - static QA harness.
- `scripts/validate-data.mjs` - data validation.
- `scripts/recommendation-smoke-test.mjs` - recommendation smoke.
- `scripts/import-catalog-backbone.mjs` - catalog import helper.
- `scripts/import-global-search-fixtures.mjs` - search fixture import helper.
- `scripts/promote-catalog-candidates.mjs` - promotes candidates.
- `scripts/refine-seed-catalog.mjs` - seed catalog refinement helper.
- `scripts/split-store-data.mjs` - data split helper.
- `scripts/local-env.mjs` - safe local env loader.

Docs:

- `docs/product-minimum.md` - product minimum and scope.
- `docs/catalog-and-covers.md` - catalog and covers strategy.
- `docs/taste-memory.md` - taste memory approach.
- `docs/import-strategy.md` - import strategy.
- `docs/onboarding-strategy.md` - onboarding strategy.
- `docs/demo-script.md` - demo script.
- `docs/companion-answer-pattern.md` - recommendation answer pattern.
- `docs/data-source-strategy.md` - data source strategy.
- `docs/decision-agenda.md` - product decisions.
- `docs/development-protocol.md` - working protocol.
- `docs/open-source-references.md` - competitor/open-source reference notes.

Original user-supplied source docs on Desktop:

- `/Users/kirillnemakin/Desktop/PlaySputnik_Pitch_Deck_v3.pdf`
- `/Users/kirillnemakin/Desktop/PlaySputnik_Pitch_Deck_v2.pdf`
- `/Users/kirillnemakin/Desktop/PlaySputnik_Pitch_Deck.pdf`
- `/Users/kirillnemakin/Desktop/AI_Game_Assistant_Technical_Brief_RU.docx`
- `/Users/kirillnemakin/Desktop/Unified_Competitor_Analysis_v5_6_RU_final.docx`
- `/Users/kirillnemakin/Desktop/Survey_Short_and_Long_v5_6_RU_final.docx`
- `/Users/kirillnemakin/Desktop/AI_Game_Assistant_TZ_v5_6_RU_final.docx`

## 5. Local Environment And Secrets

There is a `.env.local` file in the project root. Do not print, cat, paste, or commit its contents.

It likely contains the RAWG API key and local provider settings. Use `scripts/local-env.mjs` or existing scripts that already load it.

RAWG context:

- RAWG free plan was created by Kirill.
- App URL used during registration: `http://localhost:4190`.
- Use case described as: AI game companion prototype using RAWG for game search and cover image candidates with attribution/source links.
- RAWG is optional enrichment, not the canonical source for PS Store prices/subscription status.

Important:

- RAWG covers should be treated as candidate images with attribution/source links, not official verified covers.
- Do not use RAWG to make live PS Store price claims.
- No paid pricing APIs for now.

## 6. How To Run And Verify

Start/read local preview:

```bash
node scripts/preview-server.mjs --check
```

If no server is running, use a simple local static server:

```bash
python3 -m http.server 4190 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:4190/
```

Optional provider search endpoint:

```bash
node scripts/search-provider-server.mjs --port 4191
```

Provider one-off checks:

```bash
node scripts/search-provider-server.mjs --once "Grand Theft Auto"
node scripts/search-provider-server.mjs --once "Black Myth" --force-fixture
```

Fast verification:

```bash
node --check app.js
node --check src/app-search.js
node scripts/search-quality-matrix.mjs
node scripts/qa-harness.mjs
node scripts/validate-data.mjs
node scripts/preview-server.mjs --check
```

Targeted browser smokes:

```bash
node scripts/browser-smoke-test.mjs
node scripts/app-view-smoke-test.mjs
node scripts/library-wishlist-smoke-test.mjs
node scripts/game-detail-smoke-test.mjs
node scripts/search-memory-smoke-test.mjs
node scripts/visual-catalog-smoke-test.mjs
node scripts/design-smoke-test.mjs
```

Search memory smoke with alias:

```bash
node scripts/search-memory-smoke-test.mjs --query=KCD2 --expected="Kingdom Come: Deliverance II"
```

Run browser smokes sequentially. Parallel browser smokes can create false timeouts or server confusion.

## 7. Current Architecture

`index.html` loads:

1. `src/app-config.js`
2. `src/app-state.js`
3. `src/app-search.js`
4. `app.js`

`app.js` still owns most rendering and interactions. Do not begin a huge refactor unless the task explicitly calls for it.

State:

- Persisted in localStorage under `playsputnik.prototype.state.v2`.
- Main user-game memory is normalized through `src/app-state.js`.

Important user game fields:

- `title`
- `access`
- `completionStatus`
- `saved`
- `hidden`
- `rating`
- `hoursPlayed`
- `startedAt`
- `completedAt`
- `lastActivityAt`
- `source`
- `updatedAt`
- `catalogStatus`
- `matchConfidence`
- `coverStatus`
- `priceStatus`
- `provider`
- `sourceUrl`
- `coverUrl`
- `coverLicenseNote`
- `platforms`
- `atoms`
- `inferredAtoms`
- `vibe`
- search/reconciliation metadata

Common access/completion states include:

- Wishlist/saved
- Owned forever
- Subscription/Plus
- Playing
- Paused
- Want to finish
- Completed
- Dropped
- Hidden

Search:

- `src/app-search.js` handles normalization, title aliases, match scoring, result sorting, and manual fallback.
- Search combines curated seed catalog, backbone, fixtures, and optional provider results.
- Manual/unverified results are allowed so the user can add any title even when the catalog is incomplete.

## 8. Recently Completed Work

### Search-To-Memory Flow

Completed before this handoff:

- Search results have Details, Wishlist, Owned, and Plus actions.
- External/manual/fixture search candidates can open a details view.
- Saving a search candidate persists provider/source/match/cover/price/platform/atoms/inferred/reconciliation data.
- Saved external games enter recommendation and library memory.
- Added `scripts/search-memory-smoke-test.mjs`.

### Provider Search Hardening

Completed:

- `src/app-search.js`
  - Added `searchMatch`, `matchKind`, improved scoring, and stable result comparison.
- `scripts/search-provider-server.mjs`
  - Added `search-result-v2` provider envelope.
  - Added provider fallback metadata: `fallbackUsed`, `recoverable`, `providerFailureInfo`.
  - Added forced fixture fallback via `--force-fixture`.
- `app.js`
  - Captures provider fallback/recoverable/source health details.
  - Tracks local search index status.
  - Shows search warnings when source is loading, fallback, or offline.
- `styles.css`
  - Added `search-empty.source-warning`.
- QA updated.

Checks passed after this work:

```bash
node --check app.js
node --check src/app-search.js
node --check scripts/search-provider-server.mjs
node scripts/search-provider-server.mjs --once "Grand Theft Auto"
node scripts/search-provider-server.mjs --once "Black Myth" --force-fixture
node scripts/qa-harness.mjs
node scripts/validate-data.mjs
node scripts/preview-server.mjs --check
node scripts/search-memory-smoke-test.mjs
node scripts/browser-smoke-test.mjs
```

### Search Result Quality Matrix

Completed:

- Added `scripts/search-quality-matrix.mjs`.
- The matrix evaluates `src/app-search.js` under Node and checks alias/Russian/typo/manual search cases.
- Current matrix: 22/22 passing.

Important tested queries:

- `GTA 6`
- `GTA VI`
- `BG3`
- `Baldurs Gate III`
- `Ghost of Yōtei`
- `Ghost of Yotei`
- `Призрак Цусимы`
- `Одни из нас`
- `Hellblade II`
- `007`
- `Project 007`
- `Black Myth`
- `Wukong`
- `Expedition 33`
- `Clair Obscur Expedition 33`
- `KCD2`
- `Death Stranding 2 On the Beach`
- `Spider Man 2`
- `Great Circle`
- typo `Balders Gate 3`
- typo `Ghost of Yoteii`
- fully manual unknown title

Also completed:

- `src/app-search.js`
  - `manualSearchResult` now canonicalizes known aliases even when the title is not in seed/backbone/fixtures.
  - Examples: `KCD2` resolves to `Kingdom Come: Deliverance II`; `Hellblade II` resolves to `Senua's Saga: Hellblade II`.
  - Manual source is marked `manual_unverified`; match kind can be `alias_manual`.
- `app.js`
  - Added title enrichment rules for `kingdom come`/`kcd` and `hellblade`/`senua`.
  - Alias-manual memory now gets useful inferred atoms.
- `scripts/qa-harness.mjs`
  - Checks search quality matrix existence and important cases.

Checks passed:

```bash
node --check src/app-search.js
node --check scripts/search-quality-matrix.mjs
node scripts/search-quality-matrix.mjs
node scripts/qa-harness.mjs
node scripts/validate-data.mjs
node scripts/preview-server.mjs --check
node scripts/search-memory-smoke-test.mjs --query=KCD2 --expected="Kingdom Come: Deliverance II"
node scripts/browser-smoke-test.mjs
```

## 9. Known Constraints And Risks

### Catalog And Search

The app currently knows:

- 48 curated seed games.
- 101 controlled backbone games.
- 117 global search fixture games.

This is not "all games in PS Store." The app can still accept any user-entered title through manual/unverified search fallback.

To search "any game in the world" well, we need one or more of:

- RAWG/IGDB/provider search.
- A larger generated/imported search index.
- A backend cache of search/provider results.
- A legal strategy for covers and attribution.

Current practical strategy:

- Use local seed/backbone/fixtures for first-run speed and determinism.
- Use optional provider search for broader discovery.
- Always allow manual add.
- Reconcile and enrich later.

### Prices

No live mass PS Store pricing. This is intentional for now.

The product should not pretend to be a complete price tracker. Price awareness should focus on:

- Wishlist titles.
- Games likely to fit the user.
- Known sale snapshots.
- Manual/semi-automated update flows.

Data needs source/freshness labels.

### Subscription Catalog

No live PS Plus/Extra catalog sync yet.

Subscription drop flow should be lightweight:

- Drop happens.
- App evaluates games.
- User confirms/rejects.
- Good matches can be added to "worth playing."
- Then the drop is not over-emphasized for two weeks.

### AI Claims

AI can infer:

- Genre atoms.
- Mood/tone.
- Likely taste fit.
- Similarity to played games.
- Recommendation explanations.

AI should not invent:

- Current prices.
- Subscription availability.
- Release dates.
- Platform/language availability.

Those need sources or clear "unverified" labels.

### Personal Rating Forecast

Do not overstate confidence.

With only 3 swipes, the app should say:

- "We have a first taste signal."
- "Confidence is still low."
- "Rate 10/20 games, connect/import library, or paste ranking to improve."

Avoid showing precise personal ranking forecasts too early unless confidence is explained.

## 10. Most Important Next Task

Recommended next task: **First-30-Seconds Value Pass**.

Goal:

Make the first run feel valuable after only a few interactions, without pretending the app already fully knows the user.

Acceptance criteria:

- After 3 taste signals, the app shows a useful but cautious first read.
- It clearly says the model is starting to understand the user, not already fully confident.
- It offers next steps:
  - Rate more games with quick swipes.
  - Later connect/import PSN/library.
  - Paste an existing ranking/backlog/wishlist in any text format.
- It still lets the user use the app immediately.
- It surfaces a "what to play today" recommendation quickly.
- It keeps copy short and product-like.
- It avoids explaining too much of the algorithm; some "magic" is acceptable.
- It should not force the user into a long onboarding.
- It should work on mobile without text overlap, dead zones, or oversized cards.

Likely files:

- `app.js`
- `styles.css`
- maybe `src/app-state.js`
- maybe `scripts/browser-smoke-test.mjs`
- maybe `scripts/design-smoke-test.mjs`
- update `PROJECT_STATE.md`
- update `NEXT_TASKS.md`

Verification:

```bash
node --check app.js
node scripts/qa-harness.mjs
node scripts/validate-data.mjs
node scripts/preview-server.mjs --check
node scripts/browser-smoke-test.mjs
node scripts/design-smoke-test.mjs
```

## 11. Other Good Next Tasks

Option 1, recommended:

- First-30-Seconds Value Pass.
- Highest product impact.
- Directly addresses Kirill's concern that users may delete the app quickly.

Option 2:

- Search UI Polish and "Add Any Game" completion.
- Make search feel production-like: source badges, confidence labels, manual fallback copy, saved state feedback, cover placeholders.

Option 3:

- Catalog/Cover Pipeline Hardening.
- Improve legal/free cover candidate flow, attribution, snapshot freshness, and provider fallback.

Option 4:

- App Modularization Round.
- Extract another coherent slice from `app.js`, but only if it unlocks feature speed.

Option 5:

- Investor Demo Polish.
- Build a guided demo path and make screenshots/flows look intentional.

## 12. Development Protocol

At the start of any task, read:

1. `PROJECT_STATE.md`
2. `NEXT_TASKS.md`
3. `docs/development-protocol.md`
4. Only files relevant to the chosen task

After a completed task:

- Update `PROJECT_STATE.md`.
- Update `NEXT_TASKS.md`.
- Run the narrowest meaningful checks.
- Tell Kirill what changed and offer 3 next actions with one recommendation.

Do not:

- Print `.env.local`.
- Claim live prices/subscription status without source/freshness.
- Copy GPL/unlicensed competitor code.
- Rebuild the whole app unless requested.
- Treat Kirill's personal game note as a universal onboarding format.

## 13. Competitor/Open-Source Lessons Already Captured

Use `docs/open-source-references.md` for details.

Useful ideas to borrow conceptually:

- Separate canonical game data from user memory.
- Let user-game records store personal state independently of catalog entries.
- Support "manual add now, enrich later."
- Track source freshness and confidence.
- Make import flexible.
- Keep powerful user lists but avoid spreadsheet complexity.

Do not copy code blindly from competitors, especially GPL/unlicensed projects.

Open-source apps often get covers from:

- IGDB/Twitch APIs.
- RAWG-like metadata APIs.
- SteamGridDB or similar user-art services.
- User-provided/local images.
- Cached metadata providers.

For PlaySputnik, the current practical route is:

- RAWG for search/cover candidates.
- Local snapshots for deterministic prototype behavior.
- Attribution/source links.
- Later, backend caching and optional provider expansion.

## 14. Design Direction

Kirill asked for a more professional, designer-like app feel.

Design target:

- Mature, practical, premium companion.
- Not a marketing landing page.
- Dense enough for real use.
- Calm visual hierarchy.
- Strong first screen.
- Clear cards and actions.
- No cluttered onboarding essay.

Avoid:

- Overly playful toy UI.
- Giant marketing hero instead of the app.
- Excessive explanation of how the app works.
- One-note color palette.
- Text overlap on mobile.

Important UX principle:

- The user should be able to start with 3-5 swipes, see value, and continue later.

## 15. Suggested First Claude Code Move

Recommended first move:

1. Read `PROJECT_STATE.md`, `NEXT_TASKS.md`, and this handoff.
2. Inspect first-run/onboarding rendering in `app.js` and related styles in `styles.css`.
3. Implement the First-30-Seconds Value Pass.
4. Run targeted checks.
5. Update `PROJECT_STATE.md` and `NEXT_TASKS.md`.
6. Report to Kirill in Russian and offer 3 next options.

Suggested framing to Kirill after the task:

- What changed.
- What now feels better for a first-time user.
- What is still not production-ready.
- Three next options, with a recommended one.

## 16. Current Mental Model Of The App

Think of the product as three layers:

1. **Taste Memory**
   - Fast signals from swipes/buttons.
   - Deeper signals from rating, completed list, pasted text, future PSN/library import.
   - Confidence grows over time.

2. **Personal Game OS**
   - Wishlist.
   - Library/access.
   - Backlog.
   - Completed games.
   - Personal ranking.
   - Upcoming games.

3. **Opportunity Radar**
   - What to play today.
   - New subscription drops.
   - Wishlist sale opportunities.
   - Upcoming/recent games that fit.
   - Price/subscription awareness only where it matters.

This is the direction Kirill and Codex converged on.

