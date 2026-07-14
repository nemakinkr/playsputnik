# PlaySputnik Project State

Last updated: 2026-07-14 (Codex resumed after Claude polish/architecture
series; see HANDOFF.md for the full narrative and CLAUDE.md for dev workflow +
performance rules).

## Product

PlaySputnik is an AI gaming companion, not primarily a price tracker. The core loop:

1. Learn taste quickly.
2. Remember library, backlog, completed games, subscriptions, wishlist, and upcoming interest.
3. Tell the user what to play now and why.
4. Use prices, sales, and subscription drops as supporting signals.

Target user: adult players with money for games but limited time to browse
reviews, catalogs, sale pages, and announcements.

## Status: deployed product with self-updating data

- **Live:** https://nemakinkr.github.io/playsputnik/
- **Repo:** https://github.com/nemakinkr/playsputnik (public)
- Deploy on every push (`.github/workflows/deploy-pages.yml`) with
  post-deploy HTTP + headless-browser production smokes against the published
  Pages URL; daily data
  refresh at 06:17 UTC (`update-data.yml`: ITAD prices / PS Store Plus /
  RAWG covers → validate gate → bot commit → explicit Pages redeploy) with a
  `source-health` issue monitor; CI on push (`ci.yml`: validate + i18n
  catalogs/usage + qa-harness + browser gates).
- All six GitHub workflows run their own scripts on Node.js 24 and use the
  Node.js 24-compatible official action majors (`checkout/setup-node@v6`,
  Pages configure/upload/deploy `v6/v5/v5`). A local + CI runtime-policy gate
  prevents deprecated action majors or `node-version: 20` from returning.
- All app paths are RELATIVE (works under the /playsputnik/ subpath).
- Service worker v142 (cache-first static assets / network-first navigation and
  data), **disabled on localhost**; bump `CACHE_VERSION` in sw.js when shipping
  runtime code or styles.

## Current Prototype

- Static app, no build step: `index.html` + layered CSS in `styles/`
  (`foundation`, `components`, `polish`, `themes`, final `brand` overrides) +
  `app.js` + 32 runtime entries in `src/module-manifest.js`.
  Runtime modules load through six dependency phases, parallel inside each
  phase. A visible boot overlay blocks interaction until handlers are ready.
  Comparison selection and the rate-later queue live in `app-decisions.js`;
  search-result memory workflows live in `app-search-memory.js`;
  large game-detail markup lives in `app-detail-view.js` instead of the UI
  composition root.
  The same manifest now drives browser boot and Service Worker precaching.
  Persisted profiles carry a schema version and pass through deterministic
  migrations before hydration. `ARCHITECTURE.md` is generated from the
  manifest and gives agents a compact change-routing map.
  `release-upgrade-test.mjs` protects mixed old-shell/new-code releases, while
  Service Worker navigations are network-first to avoid stale HTML shells.
- Product areas: Today, Library, Discover, Wishlist, Taste, Deals, Data, Stats.
  The consumer navigation now keeps Today, Library, Discover, Wishlist, and
  Taste primary; Deals, Stats, and Data live in a compact secondary menu.
- Localization: EN/RU engine, complete settings sidebar, Today metrics/sample/
  time controls, and the main "what to play tonight" answer shell with
  locale-aware status, actions, alternatives, buy guardrails, personal
  forecast, evidence, and risk rationale. The complete first-run payoff is
  localized too: readiness, verdict, proof, next steps, and journey actions.
- Phase 5 localization is complete across all eight views, the game-detail
  cockpit, onboarding, recommendation hero, backlog amnesty, import/export,
  theme and system states. Data includes localized live health/workbench
  metrics and ranking explanations. A seeded mobile browser gate verifies
  dynamic copy in EN/RU. Phase 6 editorial localization is underway: a
  separate Russian overlay keeps authored taglines/summaries safe from
  provider refreshes, with the first 100 priority catalog games covered and a
  deterministic fallback for the rest. Atoms and related taste signals now render through complete EN/RU
  taxonomy labels while retaining stable machine keys. Phase 6 technical
  diagnostics are localized as a finite machine-state layer: source payloads,
  refresh bands, dev checks, runtime provider states, catalog lanes, import
  statuses, and review reasons switch cleanly between EN/RU while executable
  commands remain literal. The seeded mobile gate covers representative
  diagnostic values in both locales.
- Production EN/RU visual review now has a startup regression gate: a saved
  language wins even though the i18n engine loads before its catalogs. The
  mobile first-pick confirmation toast is width-constrained and wraps instead
  of covering the viewport.
- Production API foundation: `backend/worker.mjs` is a deployable Cloudflare
  Worker for `/api/health`, cached RAWG `/api/search`, and optional Anthropic
  `/api/narrative`. Secrets stay in Cloudflare; Pages receives only the public
  origin via `PLAYSPUTNIK_API_ORIGIN` and generated `runtime-config.js`.
  The public backend intentionally rejects PSN import until account-token
  security exists.
- RAWG search enrichment now uses one shared production/local normalizer.
  `search-result-v3` persists atoms, session, length, difficulty, commitment,
  tone, content, review burden, and adult-time fit with per-field RAWG evidence,
  an explicit inference version, and confidence capped at medium. Missing or
  weak metadata stays uncertain; RAWG never supplies price, Plus, or language
  claims. Saved external games retain this profile in recommendations and
  detail.
- Ranked-taste and smart-library imports now resolve unknown titles through a
  persisted RAWG batch queue instead of stopping at a manual Discover list.
  The queue deduplicates up to 120 titles, limits provider work to two
  concurrent requests, resumes after reload, and preserves the imported
  meaning: rank/rating stays a taste signal, while owned/completed/etc. stays
  a library state. Uncertain or failed matches remain explicit review items.
  The reusable workflow lives in `src/app-import-resolution.js`; schema v6 and
  deterministic unit/browser gates protect it.
- Production API is live at
  `https://playsputnik-api.playsputnik.workers.dev`. Pages receives this origin
  through the `PLAYSPUTNIK_API_ORIGIN` repository variable. RAWG search and
  attributed cover candidates are live and edge-cached; Anthropic narratives
  remain disabled because no `ANTHROPIC_API_KEY` has been configured.
- Backend operations: a six-hour GitHub Actions monitor covers health, CORS,
  live RAWG normalization, cover presence, edge-cache hits, and untrusted-origin
  rejection, with a single incident issue that closes on recovery. Backend
  changes have an active automatic contract-test/deploy/live-smoke workflow.
  The non-secret Account ID variable and scoped `CLOUDFLARE_API_TOKEN` secret
  are configured; a manual production deploy has passed end to end.
- AI Narrative Layer: `/api/narrative` can rewrite the main recommendation and
  produce a short game description/personal take directly in the selected
  language. Results are cached by locale + kind + taste-context fingerprint;
  deterministic narratives remain the instant fallback. The local proxy is
  implemented and gated. Enabling it publicly now requires deploying the Worker,
  adding its secrets, and setting the GitHub repository variable.
- Companion Intelligence 2.0 phase 1 is local and free: every candidate gets a
  reliable/promising/polarizing/cautious/exploratory taste verdict. Strong pull
  plus strong caution now creates an explicit contradiction penalty, caps
  confidence, and widens rank forecasts instead of producing false precision.
  Today, Library, and detail inherit the same EN/RU verdict through the shared
  recommendation rationale; a deterministic gate covers all five classes.
  Phase 2 calibrates forecasts against deduplicated personal ratings with
  leave-one-out evaluation, so a game cannot teach the prediction used to
  evaluate itself. The learned rating scale adjusts future rank ranges; Stats
  exposes sample size, holdout error, and recurring under/overestimation by
  atom. It activates after five ratings and stays fully local.
  A second honesty gate requires holdout error <=25 before calibration may
  alter forecasts; a larger error remains visible in Stats but pauses the
  correction.
  The estimator now selects per user among four fully local models: personal
  mean, weighted nearest games, regularized atom patterns, and an ensemble.
  Selection uses the same held-out evaluation and Stats names the winner.
- Onboarding: 30-game swipe deck, visible 30-second contract, honest 5/10/20
  confidence milestones, animated hero exit, and a cautious first-pick payoff
  after 5 real taste signals, with "use now / improve later" guidance for
  swipes, library access, or pasted ratings. The first payoff
  now shows a concrete verdict: what was learned, what to try now, and what is
  still uncertain, plus a "Next 3 clicks" journey into detail, memory, and
  Discover search. Clean profiles now get the one-question taste prompt in the
  first Today viewport; the 5-signal answer is explicitly framed as a test pick,
  and the top-pick hero shows why/risk/next-action before deeper evidence. The
  clean first-run hero now states the no-account / 5-tap /
  useful-before-setup value contract and shows a source-aware diagnostic game
  poster before deeper onboarding. The quick taste queue now balances broad
  recognizability with diagnostic axis coverage, so the first few swipes span
  different taste dimensions instead of drifting into three similar questions.
  Candidate ordering now also calculates Bayesian expected information gain
  across atom and diagnostic-axis reactions. Repeated evidence reduces a
  question's value, unresolved conflicts remain priority follow-ups, and the
  familiar-game ordering still acts as a recognizability guardrail.
- Ranking dogfood: a real 111-title ranked-favorites fixture now gates the
  import/taste and forecast baseline. `scripts/ranking-dogfood-audit.mjs` strips
  PlayStation-generation emoji markers, treats the ranking tail as weaker
  positive affinity rather than dislike, checks seed-catalog and broader
  search/backbone coverage separately, and prints weak spots. Current baseline:
  47/111 seed matches, 8/10 seed top-10 matches, 21/30 seed top-30 matches,
  111/111 known-corpus matches, 30/30 known top-30 matches, and 60/60 known
  top-60 matches. All 111 resolved records now participate in local forecast
  calibration without making fixture-only records visible recommendations.
  Deep profiles now choose a forecast model in two stages: stay within 1.5 MAE
  points of the numerically best model, then maximize held-out top-tier ranking
  quality. On the 111-game fixture this selects the signal model at 8.0/100 MAE,
  roughly 21 positions, instead of nearest-game at 7.1/100 MAE. Personal rank
  ranges are derived from
  that calibrated taste estimate and list length; budget, access, mood, and
  tonight's session affect the play-now decision but no longer move a game's
  long-term personal rank. Explicit user ranks also carry equal taste weight
  regardless of whether metadata came from seed, backbone, or search fixture.
  The held-out ordinal benchmark now also gates recommendation quality:
  P@10 0.90, top-quartile recall 0.61, zero tail intrusions in the predicted
  top 10, and 0.80 pairwise ordering accuracy. A separate 16-title explicit
  wishlist gold set gates candidate priority at NDCG@10 0.98, must-play
  recall@5 1.00, and high-intent precision@5 1.00. Assumed dislikes are kept
  out of pass/fail metrics until the founder confirms them. Wishlist hearts
  are now real intent tiers (12/44/84 points), not a weak linear nudge.
  Explicitly imported backbone/search wishlist records enter recommendations
  without exposing the rest of those corpora or pretending their store facts
  are verified. The atom-quality gate fixed and now protects six high-impact
  records; removing Battlefield 1's false open-world signal eliminated the
  only bottom-quartile intrusion from the forecast top 10.
  A second recommendation gate now runs eight deterministic fictional personas
  against the same 18 unseen candidates. Systems, competitive, cozy, narrative,
  open-world, short-form, horror, and finite-campaign profiles currently achieve
  mean NDCG@6 0.90, high-fit precision@3 0.92, zero avoid-title intrusions in
  any top 3, six distinct top choices, and mean top-3 overlap 0.10. The fixture
  explicitly forbids training/candidate title
  leakage. Its first run exposed score saturation from large imported profiles;
  taste scoring now normalizes by learning evidence and treats mechanics/genre
  atoms as stronger evidence than tone, content, time-fit, and commitment.
  Founder wishlist metrics remain unchanged after that correction. These
  personas are anti-overfitting hypotheses, not substitutes for future
  validation with independent real users.
  The same personas now have a separate five-signal gate that uses the actual
  quick-reaction contract (not imported numeric ratings), with mixed positive
  and negative answers. It currently achieves mean NDCG@6 0.91, high-fit
  precision@3 0.96, zero avoid intrusions, mean top-3 overlap 0.10, and a
  high-fit winner for every profile. This supports a useful first hypothesis
  after five answers without claiming the profile is complete. A deterministic
  stress layer also samples 20 unique random five-card sets per persona (160
  scenarios total): mean NDCG@6 0.86, high-fit winner rate 0.94, and avoid-free
  top-3 rate 0.96. The same work aligned profile confidence to 5 = hypothesis,
  10 = working read, and 20 = confident quick profile. Difficulty and derived
  intensity now use separate structured taste signals with lower importance
  than core mechanics; EN/RU explanations localize them without exposing
  machine keys. A catalog-wide gate now runs the same production normalizer
  over all 461 games: difficulty resolves to 28 low / 349 medium / 84 high,
  while intensity resolves to 35 low / 300 medium / 126 high. Eighteen
  high-impact recommendation/onboarding records now carry an explicit curated
  intensity, reducing low-confidence profiles from 292 to 274; the detail
  cockpit shows difficulty, intensity, confidence, source, and evidence without
  adding this diagnostic layer to the main recommendation surface. The taste
  profile now derives an honest calm/intense/balanced preference from positive
  and negative intensity evidence and cites it in EN/RU explanations only when
  confidence and candidate alignment justify the claim. The detail block uses
  an equal-column desktop grid and a one-column mobile grid, both browser-gated.
  Source
  aliases such as easy/low and hard/high remain accepted inputs but cannot leak
  into the taste model. The stress gate exposed and fixed incorrect DOOM
  Eternal atoms.
  A committed per-persona report at
  `reports/synthetic-profile-diagnostics.json` records overranked candidates,
  missed high-fit candidates, recurring stress mismatches, and each persona's
  three weakest five-signal scenarios; the evaluation gate fails if it is stale.
  Top recommendations now receive a controlled diversity rerank: the strongest
  game is fixed at #1, only candidates within 12 score points may trade places,
  and atom/session/tone similarity breaks near-ties. The gate proves that this
  reduces repeated top-3 experiences without promoting materially weaker games.
  The first follow-up closed the top-30 unknown search gaps by
  adding honest external-index records for Kingdom Come: Deliverance II, Days
  Gone, Atomic Heart, Dispatch, Marvel's Guardians of the Galaxy, Metro Exodus,
  Nobody Wants to Die, and Dying Light 2 Stay Human. The second follow-up
  promoted five high-value backbone favorites into seed catalog with generated
  cover fallbacks and sample prices: Kingdom Come: Deliverance, Mafia:
  Definitive Edition, Hogwarts Legacy, Until Dawn, and The Dark Pictures
  Anthology: House of Ashes. The third follow-up moved the remaining top-30
  external-only favorites into managed backbone candidates and gated source
  priority so seed promotion candidates cannot silently regress from backbone
  back to external-only. The fourth follow-up closed the 31-60 unknown queue by
  adding 13 more ranking-driven records to search + backbone, including
  Wolfenstein: The New Order, As Dusk Falls, The Invincible, Road 96, The Dark
  Pictures: The Devil in Me, Pentiment, Indika, Star Wars Outlaws, Banishers:
  Ghosts of New Eden, RoboCop: Rogue City, Little Hope, True Colors, and Dead
  Island 2.
- Provider coverage dogfood: `scripts/resolve-founder-ranking-provider-coverage.mjs`
  now runs the full 111-title founder ranking through the production-style
  source chain: seed catalog → catalog backbone → external fixtures → RAWG
  live search → manual fallback. The committed report at
  `reports/founder-ranking-provider-coverage.json` was generated with
  `--rawg-all` against the local RAWG key. Current baseline: 82/111 local known,
  29/29 local-missing titles resolved by RAWG, 111/111 RAWG matches, 111/111
  RAWG cover candidates, and 0/111 manual fallback. Three natural user-title
  variants were fixed at the alias layer, not by hand-adding game records:
  `The Dark Pictures: Man of Medan`, `Sherlock Holmes: Devil's Daughter`, and
  `Mafia 3`.
- Today: the companion answer and plan now read as a practical command center
  with a stronger primary answer surface, localized play/use-access/watch/
  buy-later rows, highlighted first action, detail links, and stateful
  Play/Wishlist CTAs. It can also surface explicit "do not buy now" guardrail
  commands and backlog-amnesty "let go" commands when those decisions are
  healthier than another purchase.
  The first populated viewport is decision-first: the game cover, concise
  why/risk proof, and one primary action precede metrics and taste diagnostics;
  deeper evidence stays available through progressive disclosure.
- Demo/review mode: a top product-path panel can load a stable filled profile
  with taste reactions, library/wishlist memory, ratings, price targets, and
  search context; the same panel connects Today, Discover, Wishlist, and the
  detail cockpit for review flows. The panel now reads as a product review
  mode with compact memory/taste/wishlist metrics instead of a dev-only switch.
- Edition handling: the TLOU Part II PS5 Remastered / PS4 original pair is
  kept as related editions. Remastered is the primary recommendation and price
  tracking edition; the PS4 original remains useful for owned/progress history.
- **Session planner:** "Tonight I have: 30m–evening" chips; chunk model
  (`gameChunkProfile` in src/app-score.js) scores complete-session fit and
  uses genre-aware labels (run vs match vs chapter/area) to avoid misleading
  copy on puzzle/platformer story games.
- **Sputnik ratings 1–5** in the game drawer (stored 20–100 in
  `userGames[key].rating`); feed taste via `rated_1..rated_5` feedback
  events (weights −3..+3).
- Game drawer: polished decision cockpit, mobile full-screen-feeling detail
  surface, shared "why now" rationale, hero
  badges for fit/time/value/next move, smart primary CTA, status cards,
  facts, "Get it" links (PS Store/RAWG/HLTB), price sparkline, PS Plus chip,
  polished per-region price alert target, similar games, rating,
  swipe-to-close, focus trap.
- Global search: local/provider/manual results can be added directly to
  Wishlist, Library, or Plus with an in-row memory confirmation panel and an
  explicit next-step card; external results keep source passport + cover
  attribution and avoid fake live price/Plus claims. Saved search results now
  expose an immediate "Open Wishlist" next step and a small checklist so the add
  action has visible follow-through: remembered, source kept, next destination.
  RAWG provider hits now persist as lazy-import memory records with
  `providerImport` and `sourcePassport` metadata, so user-searched games outside
  the seed/backbone catalog can immediately enter Wishlist/Library/Plus with
  attributed cover candidates and honest missing-price status. The browser
  smoke suite includes a deterministic `rawg-lazy-import-smoke` without live
  network or secrets.
- Visual catalog: search, filter chips, sort, pagination, keyboard grid nav.
- Mobile navigation: all 8 product areas are visible without horizontal
  scrolling; Today/Library/Discover/Wishlist get primary 2x2 slots and
  Taste/Deals/Data/Stats sit in a compact secondary row.
- Mobile polish: quick onboarding contract and My Games quick actions have
  tighter mobile spacing/touch targets without horizontal overflow.
- Library/My Games: queue rows separate access/progress/rating facets and now
  show a next-step cue (resume, no-spend, intent, or memory) plus compact
  quick actions, with advanced state/rating controls hidden behind a
  disclosure so state changes explain what should happen next without a button
  wall. My Games also has a working command bar above the queue: one current
  focus plus lane counters for All/Active/Access/Wishlist/Finished, with the
  same filters as the list. Library and Wishlist rows now share the stronger
  decision-card visual treatment used by Today/detail. Empty Library/Wishlist
  profiles now show explicit first-step cards instead of dead empty lists, and
  Wishlist decisions are ordered above search/catalog so buy/wait advice
  appears earlier.
- Backlog amnesty: repeated explicit skips are tracked per title; after 5
  skips Today can suggest letting a game go without guilt, archiving it as
  hidden with `source: "backlog_amnesty"` and counting it in Stats. Amnestied
  games can be restored to Wishlist from the drawer or Stats; "Keep it" has a
  small skip cooldown to avoid nagging after one more skip.
- Dark mode (`data-theme="dark"`, toggle, OS-follow, anti-flash); design
  tokens are PlayStation-clean (`--ps-blue #2563eb`, compact radii,
  border-led cards, soft shadows); file-based PlaySputnik mark/wordmark and
  PWA icons. The current visual direction is intentionally close to the
  provided design-system reference: white/blue PlayStation-clean surfaces,
  compact 6-8px card radii, calmer shadows, denser chips/buttons, and a final
  `styles/brand.css` layer that tightens older component CSS without broad
  rewrites. The latest pass also tightened mobile game-detail drawer rhythm:
  subtler bottom-sheet chrome, denser hero/status/cockpit spacing, and readable
  price guardrails on small screens.
- Taste/wishlist share links (`?taste=`, `?wl=`) with import banners.
- Error states: init overlay, deferred-data toast, offline indicator,
  SW update banner.

## Engineering principle

Invisible bug classes become automated gates, not memory: check.sh + CI run
perf, dark-mode contrast, and mobile-layout gates against a SEEDED profile.
See AGENTS.md "Core engineering principle" / CLAUDE.md.

## Performance contract (critical)

`render()` re-renders everything; budget <800ms WITH a populated profile
(enforced by `scripts/perf-budget-test.mjs`; recent checked runs are roughly
~60ms with a seeded profile, far below budget). Per-render memo
caches invalidated at the top of `render()`: tasteProfile (+feedback
weights), rankedGames, tasteMemory, companionAgenda, effectiveGameState,
sourceLookups. `titleKey` is memoized in src/app-search.js and invalidated
when title-aliases.json loads. Any new expensive per-game/per-event helper
MUST join this scheme. View-gating: right-column sections render only for
the active view.

## Data And Catalog

- `data/games.json`: 456 games, deduped (alias-aware via titleKey), 100%
  cover coverage and discount snapshots; regional price coverage is ~95-96%
  with honest missing-price issues for delisted/edge-case games.
- Prices: ITAD, 4 regions (US/GB/DE/TR), per-record source + `checkedAt` +
  freshness; price-history format is `{title: {region: [...]}}` (object).
- PS Plus: live Extra list from PS Store category pages; Premium category id
  unknown (3 manual records).
- Covers: RAWG candidates with attribution (`sourceUrl`, `licenseNote`).
- Provider-backed search coverage: the live RAWG layer can resolve all 111
  titles in the founder ranking when aliases are applied, while prices and
  subscription status remain separate store-backed freshness signals.
- Secrets in `.env.local` (gitignored) and Actions secrets: `RAWG_API_KEY`,
  `ITAD_API_KEY`. Never print them.

## Current Verification

```sh
./scripts/check.sh          # validate → i18n → qa → browser smoke → perf → browser gates
./scripts/check.sh --fast   # ~3s, skips browser stages
```

The full gate includes data validation, SW/cache manifest drift checks, i18n
catalog/usage checks, state-class QA, browser smoke, seeded performance budget,
dark-mode contrast, mobile layout, a11y, release-upgrade protection, and the
smoke-suite. The i18n stage validates EN/RU catalog structure and every literal
`data-i18n*` / `t("...")` reference. The mobile browser gate runs both locales
across all 8 views plus the open settings sidebar at 375px.

`node` is not on PATH; bundled node at
`~/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`
(check.sh resolves it). Targeted Chrome smokes still exist in `scripts/`
(run sequentially, not in parallel). `library-wishlist-smoke-test.mjs` seeds
both localStorage and IndexedDB after deferred render settles, so profile
fixtures are not overwritten by late dev renders. `scripts/production-smoke-test.mjs`
checks the live Pages URL after deployment for HTML/app/SW/data/search-source
contracts; `scripts/production-browser-smoke-test.mjs` opens the live site in
headless Chrome, clicks Discover search -> Wishlist -> detail, and checks for
runtime errors and desktop overflow.

## Known Constraints

- PSN import is demo logic, not a real PSN integration.
- RAWG covers are candidates, not official art; keep attribution.
- Never claim live prices/Plus without per-record source + freshness.
- validate-data reports 80 honest price-gap issues (delisted/edge-case games
  missing some regional prices), 0 critical catalog issues — expected.
- Dark-mode overrides live in `styles/themes.css`; check new components in
  dark mode.

## Next Recommended Task

User decision: polish before showing to people. Search-to-memory, production
smoke, Discover/search visual polish, mobile navigation, first-session payoff,
core journey, demo Today/Discover continuity, demo review-mode polish, TLOU
Part II edition decision, detail-drawer visual hierarchy, data-health issue
triage, Today/Library/detail recommendation coherence, architecture gates, and
final visual tightening are now strengthened. Top next candidates are real-user
onboarding dogfood, expanded catalog/data trust polish, Library queue
dogfooding, shareable investor/demo flow, and AI narrative activation when the
project is ready to spend paid tokens. See NEXT_TASKS.md and HANDOFF.md
"Backlog".
