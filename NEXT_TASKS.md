# PlaySputnik Backlog

Last updated: 2026-06-23. Pick the next task here without rereading the
whole chat. Context: HANDOFF.md (what was done), PROJECT_STATE.md (state),
ARCHITECTURE.md (generated ownership map), CLAUDE.md (dev workflow + perf
rules). The user's decision remains **polish before showing the product to
people**; architectural cleanup is now an active supporting track.

Run `./scripts/check.sh` before claiming any task done.

## Track: Architecture

- Shared runtime manifest for browser boot and Service Worker cache: done.
- Dependency-phased parallel module boot with explicit loading surface: done.
- Versioned persisted-state migration pipeline: done.
- Generated compact architecture map with a CI freshness gate: done.
- Game-detail markup extracted into a dedicated view module: done.
- Search-result memory workflows extracted from `app.js` into
  `src/app-search-memory.js`: done. This keeps Discover result persistence,
  duplicate canonicalization, Wishlist/Library/Plus state changes, comparison,
  and rate-later hooks reusable for future search polish.
- CSS split into foundation/components/polish/themes with cached-shell
  compatibility: done.
- Old Service Worker / mixed-release upgrade regression gate: done.
- Continue extracting domain workflows from `app.js` only when a concrete
  product task touches that area; keep DOM orchestration in the composition
  root and reusable decisions in `src/app-*.js`.

## Track: Localization (EN + RU) — ACTIVE, large multi-phase project

Decision (2026-06-18): ship a full EN + RU app (more languages later); target
both audiences. This is a deliberate large project, done in phases with a commit
+ green gates after each. See CLAUDE.md "i18n / localization" for the pattern.

- **Phase 1 — foundation + first screen — DONE.** `src/app-i18n.js` engine
  (global `t()`, plural rules, `applyStatic()`), `src/i18n-en.js`/`i18n-ru.js`
  catalogs, header `#lang-toggle`, SW v28. Localized: header eyebrow/title, the
  8 nav tabs + subs, all 8 view summaries (graceful EN fallback for untranslated
  views). All gates green. Switch verified both directions.
- **Phase 2 — Today dynamic copy — DONE.** Metric cards (5 labels + plural
  counts via `t(..,{count})`), sample-profile panel (kicker/title/detail/chips/
  actions), time selector (label + 6 chips). Russian plural forms verified
  (454 игры / 18 запомненных игр / 210 вариантов / 4 пропуска). qa-harness now
  also scans the i18n-en catalog for moved copy. No 375px overflow in RU across
  8 views. SW v29. (Top-recommendation block left to Phase 4 — it's narrative.)
- **Phase 3 — settings sidebar — DONE.** Localized the complete `⚙` panel:
  section titles, fields, start-path cards and proof copy, known-games swipe
  flow, taste/session/notebook statuses, PSN import states, and demo profile
  continuity. Browser gates now seed through the stable
  `data-continuity-action="load-demo"` hook instead of English button text.
  Verified at 375px in RU with no horizontal overflow. SW v30.
- **Phase 4 — narrative engine — DONE.** The main companion answer,
  recommendation-layer forecast/evidence/risk rationale, and complete
  first-run payoff now use locale-aware whole-sentence templates. The first-run
  flow includes localized readiness, verdict, proof, journey, actions, and
  accessibility labels; browser gates assert the live EN/RU verdict. Risk
  branching uses machine state instead of translated display text. Remaining
  top-level/detail labels belong to Phase 5. SW v34.
- **Phase 5 — remaining views — DONE.** Game-detail decision cockpit, Library,
  Wishlist, Discover, Taste, Deals, Stats, and Data are localized. Data includes
  live health/workbench metrics, import/export feedback, and ranking breakdowns.
  The final interface audit also closed the recommendation hero, onboarding,
  backlog amnesty, undo controls, theme labels, and offline/error/update states.
  The seeded mobile gate asserts dynamic EN/RU copy across all eight views.
  Editorial game descriptions and raw diagnostic payloads remain Phase 6.
  A production visual review fixed saved-locale startup before catalogs load
  and made the mobile first-pick toast compact; the startup contract is now
  gated locally and in CI. Production API runtime config followed in SW v44.
- **Phase 6 — data editorial fields — IN PROGRESS.** Chosen architecture:
  a separate `data/editorial-ru.json` overlay, so daily catalog/provider
  refreshes cannot overwrite authored Russian copy. The first 25 key catalog
  games now have Russian taglines and summaries; missing records fall back to
  the existing localized deterministic description. `editorial-data-check.mjs`
  gates exact catalog-title links, Cyrillic content, and usable text lengths.
  Taxonomy localization is also complete: atoms and related taste signals keep
  stable English machine keys but render through synchronized EN/RU labels
  across onboarding, Taste, cards, search, Library, detail, Deals, and Stats.
  The catalog gate requires labels for every value in `data/taxonomy.json`.
  Technical diagnostics are now complete too: source-health payloads, refresh
  bands, dev checks, provider runtime states, data-workbench modes/statuses,
  catalog lanes, import states, and manual-review reasons render in EN/RU while
  commands and machine identifiers stay literal. The seeded mobile gate opens
  Data in both locales and asserts representative dynamic diagnostics, so raw
  English payloads cannot silently return.
  Continue coverage by product priority rather than translating all 456 titles
  mechanically.
- After each phase: re-run mobile-check (Russian is longer → 375px overflow risk).

## Track: AI Narrative Layer

Status: local architecture done. `src/app-ai.js` now generates/cache-isolates
localized narratives by language, kind, and taste-context fingerprint.
`POST /api/narrative` rewrites the main companion recommendation and generates
a short description + personal fit explanation in the game drawer. Prompts
accept only structured facts and explicitly forbid invented price, Plus,
platform, language, release, and ranking claims. Existing deterministic EN/RU
copy is the instant fallback. `ai-narrative-test.mjs` prevents locale-cache
leaks and stale-context reuse.

Production foundation and RAWG activation are done. The live Cloudflare Worker
protects provider secrets, caches public search, validates CORS/input, and
excludes PSN tokens; Pages is connected through `PLAYSPUTNIK_API_ORIGIN`.
Remaining backend activation: add `ANTHROPIC_API_KEY` when paid AI narratives
are ready. Monitoring and automatic backend deploys are active: the six-hour
monitor manages incident issues, and backend changes run contract tests,
Cloudflare deploy, and a live post-deploy probe.

## Track: Companion Intelligence 2.0

Status: phase 1 done, fully local. The taste engine now classifies every game
as a reliable, promising, polarizing, cautious, or exploratory fit. A game with
simultaneously strong pull and strong caution receives an explicit tension
penalty instead of hiding the contradiction inside a high total score.
Polarizing/cautious verdicts cap displayed confidence and widen personal rank
forecasts; the shared Today/Library/detail evidence now names the verdict in
EN/RU. `companion-intelligence-test.mjs` gates all five classes and the
contradiction threshold in local checks and CI.

Phase 2 is also done: personal 1–5 ratings and imported 1–10 ratings are
deduplicated into one calibration set. The model predicts each rated game with
that game held out, reports mean absolute error and repeatable atom-level bias,
then uses the learned scale to adjust future personal rank ranges. Stats shows
calibration progress, honest holdout error, and what the model tends to
under/overestimate. Five ratings unlock active calibration; fewer remain
visible as a forming profile. Forecast correction only activates when the
holdout error is also acceptable (<=25 points); otherwise Stats shows the
diagnosis but explicitly keeps correction paused.

Phase 3 improves the local estimator without paid AI: leave-one-out now
compares the user's average rating, nearest-game similarity, regularized atom
patterns, and a similarity/atom ensemble. The lowest-error model wins for that
specific user, so the old nearest-game method remains a baseline that the new
logic cannot silently underperform. Stats names the winning model in EN/RU.

## Track: Polish

### 1. Wishlist price alerts UI

Status: done. Users can set/change/clear per-region target prices from
Wishlist rows and the game drawer. Targets persist in
`userGames[key].priceWatch.targets[region]`; wishlist decisions now compare
against the custom target instead of only the global budget and show a
"Below target" buy-zone when a watched price reaches the alert. Follow-up
polish done: the control now renders as a compact status + currency-input
widget in both Wishlist and drawer, with desktop/mobile layout smoke checks.

### 2. Backlog amnesty dogfood

Status: follow-up. P0 is done: explicit Skip/Snooze actions increment a
stable per-title `userGames[title].amnesty.skips` counter; after 5 skips the
Today view can show a "Let it go" card; archive sets hidden with
`source: "backlog_amnesty"` and Stats counts/list amnestied games. Follow-up
done: amnestied games can be restored to Wishlist from the detail drawer or
Stats, and "Keep it" now uses a small skip cooldown before prompting again.

Next work should come from dogfooding: tune the threshold, decide whether
owned/subscription games should ever be eligible, and consider a "restore"
flow if amnestied games feel too buried.

### 3. Onboarding dogfood pass

Status: follow-up. The first polish pass is done: the 3-signal payoff no
longer appears on an empty profile, the hero cards use the same quick-reaction
format as the main swipe deck, and the first-run bridge now says "use now,
improve later" with swipes / library / pasted-rating paths. Follow-up done:
the quick swipe card now states the 30-second value contract, and the first
payoff copy frames 3 signals as the first useful read rather than a final
profile. Follow-up done: the clean-profile Today screen now surfaces the
one-question quick onboarding hero in the first viewport, with three visible
reaction buttons backed by the same diagnostic taste logic as the full swipe
deck. `browser-smoke-test.mjs` gates that the first-run entry cannot slip below
the fold again. Follow-up done: the 3-signal result is framed as a "test pick"
rather than a personal ranking, and the top-pick hero now shows a compact
decision strip for why/risk/next action. `core-journey-smoke-test.mjs` gates
the early framing, hero strip, detail, and Discover path. Follow-up done: the
top-pick hero now has one context-aware primary CTA before secondary actions,
and Library plan rows read as ordered next steps with a primary action per row.
Follow-up done: the clean first-run hero now makes the first-60-second value
contract explicit before setup: no account required, three taps to a first
pick, and usable before PSN/library/rating import. The diagnostic game card now
uses the same source-aware cover treatment as the rest of the product instead
of a blank color tile, with compact mobile spacing so the reaction buttons
remain in the first screen.
Next work here should be driven by real dogfooding notes, not more abstract copy
tuning.

### 4. Chunk-label copy refinement

Status: done. `gameChunkProfile` now reserves "one full run" for true
run-based games (roguelike/deck-builder/card-battler), uses match wording for
sports/racing/fighting/arcade cases, and keeps puzzle/platformer story games
on chapter/area/session wording. QA harness has a Stray/Hades regression.

### 5. Game Detail 2.0

Status: done. The drawer now opens as a decision cockpit: next move, forecast,
taste proof, risk, value, taste-fit evidence, atom signal map, data trust rows,
source passport, actions, rating, price alert, similar games, and Get it links
live in one scan-friendly flow. `game-detail-smoke-test.mjs` now asserts the
cockpit/taste/source-trust contract instead of only checking that the drawer
opens.

Follow-up done: the cockpit now has a smart primary CTA. It changes by game
context: playable games move to Playing, Plus signals add subscription access,
buy-zone games open the PS Store when a source URL exists, watched games stay
price-watched, and unknown games go to Wishlist. The smoke test now clicks the
CTA and verifies stateful actions update memory.

Follow-up done: visual hierarchy is stronger. The drawer has a wider polished
surface, richer hero image treatment, scan-friendly fit/time/value/next-move
badges, a clearer cockpit card, and desktop/mobile/dark-mode-safe layout
guards.

Follow-up done: Today, Library, and detail now share a single decision
rationale from `app-recommend.js`, so "what to play tonight", the Library next
action, and the detail cockpit explain the same play-before-buy /
taste-before-store logic instead of drifting into three separate copies.

Follow-up done: the Today companion answer now has a stronger decision-center
visual hierarchy, and the mobile game drawer behaves more like a focused game
screen with a sticky title bar, compact sections, and a clearer primary CTA.

Follow-up done: Library/Wishlist rows now share a stronger decision-card polish
with clearer primary actions, and search results show an explicit next-step
card after a game is remembered in Wishlist/Library/Plus.

Follow-up done: Wishlist now prioritizes buy/wait decisions above search and
catalog, while empty Library/Wishlist profiles show first-step cards for search,
catalog, or taste refinement instead of blank queues.

## Track: Data

### 6. PS Plus Premium category id

Status: blocked/parked. 8 UUID candidates from the PS Store hub page all
returned 0 products. 3 manual Premium records remain in
subscription-availability.json. Revisit occasionally.

### 7. TLOU Part II SKU merge decision

Status: done. "The Last of Us Part II Remastered" and "The Last of Us Part
II" now stay as deliberate related editions instead of accidental duplicates.
Remastered is marked as the primary PS5 recommendation / price-tracking entry;
the PS4 original is marked legacy and kept for owned/progress history, with a
canonical price pointer back to Remastered and visible edition notes in search
and detail.

### 8. Data-health issue triage

Status: done. `validate-data.mjs` now classifies issues into price gaps,
price integrity, covers, metadata, and other critical buckets. The current
catalog is explicitly `price_gap_only`: 80 missing regional price records,
0 critical catalog issues. The Data workbench separates "critical" from
"price gaps" so missing prices for delisted/edge-case games do not look like
broken covers, atoms, or adult-fit metadata.

### 9. Catalog expansion +100

Status: todo, low priority. scripts/expand-catalog.mjs +
apply-atom-corrections.mjs pipeline exists; mind RAWG rate limits.

## Track: Dev Loop

### 10. Library/Wishlist smoke seed hardening

Status: done. `scripts/library-wishlist-smoke-test.mjs` now waits for the
deferred render before mutating storage, writes localStorage + IndexedDB
together, clears stale preloaded IDB state, and restored the strict Access-row
assertion. This prevents old deferred saves from clobbering the seeded profile.

### 11. Production smoke after Pages deploy

Status: done. `.github/workflows/deploy-pages.yml` now runs
`scripts/production-smoke-test.mjs` after deploy against the published Pages
URL. The smoke checks HTML, `app.js`, `sw.js`, `data-health.json`, and
`search-sources.json`, including the search-memory panel and versioned service
worker contract. Follow-up done: the deploy workflow also runs
`scripts/production-browser-smoke-test.mjs`, a dependency-free headless Chrome
CDP smoke that opens live Pages, searches Black Myth, saves it to Wishlist,
opens the detail cockpit, and checks runtime errors/desktop overflow.

### 12. Discover/search visual polish

Status: done. Search result rows now render as compact action cards with
clear memory confirmation, stronger selected button states, and dark-mode-safe
surfaces. Visual catalog cards have cleaner state/value pills, hover affordance,
selected-state accent bars, and more stable action-button layout. Follow-up
done: after a Discover result is saved, the row exposes an "Open Wishlist" next
step while keeping the selected Wishlist state pressed and source-attributed.
Follow-up done: the memory panel now shows a compact checklist for remembered
state, retained source, and next destination, so add-to-Wishlist has visible
follow-through.
Design smoke now accepts the visible first-run onboarding panel when the quick
swipe card is present but hidden.

### 13. Mobile navigation polish

Status: done. The mobile product-area nav no longer relies on horizontal
scroll. Today/Library/Discover/Wishlist render as a 2x2 primary grid with
short helper labels; Taste/Deals/Data/Stats render as a compact secondary row.
Active tabs now expose `aria-current`, and `design-smoke-test.mjs` guards
against app-nav horizontal overflow.

### 14. First-session payoff polish

Status: done. After 3 real taste signals, the first-run bridge now names a
concrete first read ("try X"), then shows a visible verdict block:
"What I learned", "Use it now", and "Still uncertain". This makes the first
payoff feel like a useful companion answer instead of a generic unlock.

### 15. Core user journey polish

Status: done. The first-session payoff now exposes a "Next 3 clicks" rail:
open the recommended detail cockpit, save/start the pick, then continue into
Discover search with the recommended title prefilled. This makes the prototype
feel guided from first taste signal to product memory instead of leaving the
user with disconnected screens.

Follow-up done: Today companion plan now behaves like a command center: the
first row is highlighted, rows have detail links, and play/watch/buy-later
commands have localized stateful CTAs instead of passive text only.

Follow-up done: the command center can now surface explicit "do not buy now"
guardrail commands and backlog-amnesty "let go" commands, so avoiding a bad
purchase or dropping a repeatedly skipped game becomes a first-class action.

### 16. Demo profile + Today/Discover continuity

Status: done. A stable demo profile can now be loaded from the top product
path panel: it seeds taste reactions, normalized library/wishlist memory,
personal ratings, price targets, and search context. The same panel stays
visible in Today and Discover so a reviewer can open the current pick, continue
into Discover with search prefilled, jump to Wishlist, and return to Today.
`scripts/demo-profile-smoke-test.mjs` verifies the loop on mobile.

Follow-up done: the panel now reads as review mode rather than a dev-only
switch, with compact metrics for taste, memory, wishlist, and price intent.

## Track: Deferred (until there are users)

- Web Push "evening ritual" (HTTPS + SW already in place).
- Analytics (GoatCounter or similar) — deliberately not yet.
- "Wrapped" year summary, gift mode (taste/wishlist share links exist).
- Anti-hype buy guard (price-history + Plus-drop prediction).

## Quality gates (the systemic fix for cross-agent regressions)

The recurring dark-mode regression across handoffs is now structurally
prevented, not memory-managed. `check.sh` is a 6-stage gate (validate-data,
**i18n catalogs + usage**, qa-harness, browser smoke, perf budget,
**browser gates**) and CI independently runs validate-data, i18n
catalogs/usage, qa-harness, and the browser gates.
The browser gates — **dark/light contrast**, **mobile 375px**, **a11y**,
**stale-hidden** — are
dependency-free CDP (system Chrome, no install), seed a demo profile (empty
profiles hide most components), and run on ONE headless Chrome via
`scripts/browser-gates.mjs` (shared `scripts/lib/cdp.mjs` harness; each
`*-check.mjs` still runs standalone). check.sh prefers the bundled Node 24
(PATH may be nvm Node 20 without global WebSocket). When fixing a bug, ask if
the class can recur invisibly → if so add a gate (see CLAUDE.md "Core principle").
EN/RU catalog structure has the same protection:
`scripts/i18n-catalog-check.mjs` checks logical keys, plural schemas, message
types, empty values, and interpolation placeholders locally and in CI.
`scripts/i18n-usage-check.mjs` catches missing literal keys referenced from
HTML attributes or `t()` calls. The mobile gate now checks both EN and RU
across all 8 views plus the open settings sidebar at 375px. Its first expanded
run found real 18px settings controls; advanced import, the PS Plus checkbox,
and the budget range now have mobile-safe touch heights. SW v31.

## Done (this session series — see HANDOFF.md for detail)

- Quality-gate quartet (perf/contrast/mobile/a11y) wired into check.sh + CI as
  deterministic CDP gates; the systemic fix for the recurring dark-mode-across-
  handoffs regression. Light-mode contrast added as symmetric backstop.
- Browser gates unified onto ONE Chrome run via shared scripts/lib/cdp.mjs +
  scripts/browser-gates.mjs (check.sh 7→5 stages, CI 3 gate steps → 1; each
  *-check.mjs still standalone). Faster CI, no assertion change.
- Desktop light/dark dogfood found+fixed a real bug: the onboarding hero
  ("Rate 3 games") showed to every seeded/returning user because
  .onboarding-hero.is-hidden had no display:none rule (the class was inert).
  Added the rule + a new stale-hidden gate (scripts/hidden-check.mjs) that flags
  any .is-hidden element still rendering; verified it catches the bug.
- Mobile visual dogfood (375px) found+fixed a real bug: game-detail hero
  rendered the fit-tier string twice (floating span + fit badge); removed the
  floating span. Fixed check.sh node-resolution footgun (nvm Node 20 →
  "WebSocket is not defined"); now prefers bundled Node 24.

- Onboarding polish: 3 real taste signals unlock the first-pick payoff; empty
  profiles see a start prompt instead of a premature recommendation; hero
  tiles write canonical quick reactions; first-run bridge now explains that
  the app is usable now and can be sharpened later with more swipes, library
  access, or pasted ratings.
- Global search memory flow: search/provider/manual results can be added
  directly to Wishlist, Library, or Plus from the result row, with an in-row
  confirmation state and a smoke test covering direct Wishlist plus detail
  Plus persistence.
- Production browser smoke: live Pages is opened in headless Chrome after
  deploy, then Discover search, direct Wishlist, and detail cockpit are
  exercised against the actual published site.
- Mobile navigation polish: all 8 product areas are visible on a 390px mobile
  viewport without horizontal scrolling, with primary/secondary hierarchy.
- First-session payoff polish: after 3 real onboarding signals, the product
  states what it learned, what to try now, and what remains uncertain.
- Core user journey polish: first read now leads directly into detail,
  memory action, and Discover search through a compact guided rail.
- Demo profile + Today/Discover continuity: one click seeds a complete review
  profile and keeps the demo path connected across Today, Discover, and
  Wishlist.
- Demo review-mode polish + TLOU edition cleanup: the filled-profile rail now
  feels product-facing, and The Last of Us Part II versions are explicit related
  editions rather than muddy duplicate-looking records.
- Detail drawer + data-health polish: the decision cockpit now reads more like
  a professional product surface, and current data issues are classified as
  price gaps only with 0 critical catalog issues.
- Recommendation coherence: Today, Library, and detail now reuse one shared
  decision rationale, keeping the primary pick explanation consistent across
  the main journey.
- Library queue dogfooding: My Games rows now show next-step cues for active,
  access, wishlist, and finished/memory states so changing a state immediately
  explains what the user should do next.
- Onboarding dogfood: the quick swipe card now shows a visible 30-second
  contract ("clicks to first pick" plus 3/6/10 progress), making the value
  promise obvious before the user has answered enough games.
- Library action polish: My Games rows now show 2-3 contextual quick actions
  first and move the full state/rating matrix into a `More states` disclosure.
- Mobile polish pass: tightened mobile spacing for the quick onboarding
  contract and My Games quick actions while preserving touch-friendly controls.
- Backlog amnesty P0: repeated explicit skips are tracked per title; Today can
  suggest archiving a repeatedly skipped game without guilt; amnestied games
  are hidden with a dedicated source and counted/listed in Stats.
- Catalog 456, dedupe, 100% cover coverage, discount snapshots, regional
  price coverage with honest missing-price issues, HLTB, reference-data fixes.
- GitHub repo + Pages deploy + daily data workflows + source-health monitor + CI.
- Session planner (chunk model), sputnik ratings 1–5 feeding taste,
  "Get it" links, Stats view, dark mode, design system + logo + PWA icons,
  catalog UX (search/filters/sort/pagination/keyboard), share links,
  error states, a11y (focus trap, skip-link), swipe-to-close.
- Perf: 3657ms → 33ms render (memoization contract + view-gating +
  titleKey cache); perf budget test with populated profile.
- Dev loop: SW off on localhost, scripts/check.sh one-command gate.
