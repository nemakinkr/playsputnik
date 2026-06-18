# PlaySputnik Backlog

Last updated: 2026-06-17. Pick the next task here without rereading the
whole chat. Context: HANDOFF.md (what was done), PROJECT_STATE.md (state),
CLAUDE.md (dev workflow + perf rules). The user's decision: **polish before
showing the product to people** — retention/analytics tracks are
deliberately deferred until there are users.

Run `./scripts/check.sh` before claiming any task done.

## Current Operating Mode

Token budget is tight. Prefer small, contained polish tasks that touch one
surface, keep verification to fast gate + one relevant targeted check when
needed, then still run the required final `./scripts/check.sh`. Avoid catalog
expansion, broad redesigns, provider research, and multi-screen refactors until
the user explicitly switches back to deeper work.

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
- **Phase 4 — narrative engine — IN PROGRESS.** First two slices done: the main
  companion answer shell and recommendation-layer forecast/evidence/risk
  rationale now use locale-aware whole-sentence templates. Risk branching uses
  machine state instead of translated display text. Remaining: first-run bridge
  and narrative labels still owned by the top-level/detail renderers. SW v33.
- **Phase 5 — remaining views** (Library, Discover, Wishlist, Taste, Deals, Data,
  Stats) dynamic copy + the detail cockpit drawer.
- **Phase 6 — data editorial fields** (game summaries/taglines in data/*.json):
  decide approach (parallel ru fields vs. separate file).
- After each phase: re-run mobile-check (Russian is longer → 375px overflow risk).

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
profile. Next work here should be driven by real dogfooding notes, not more
abstract copy tuning.

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
selected-state accent bars, and more stable action-button layout. Design smoke
now accepts the visible first-run onboarding panel when the quick swipe card is
present but hidden.

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
