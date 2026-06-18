# PlaySputnik Project State

Last updated: 2026-06-15 (Codex resumed after Claude session series; see
HANDOFF.md for the full narrative and CLAUDE.md for dev workflow +
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
- All app paths are RELATIVE (works under the /playsputnik/ subpath).
- Service worker v31 (cache-first static / network-first data), **disabled on
  localhost**; bump `CACHE_VERSION` in sw.js when shipping app.js/styles.css.

## Current Prototype

- Static app, no build step: `index.html` + `styles.css` + `app.js` (~5.1k
  lines) + 25 IIFE modules in `src/` (`window.PlaySputnikXxx = { createXxxTools }`).
- Product areas: Today, Library, Discover, Wishlist, Taste, Deals, Data, Stats.
- Onboarding: 30-game swipe deck, visible 30-second contract, 3/6/10
  milestones, animated hero exit, first-pick payoff after 3 real taste
  signals, and "use now / improve later" guidance for swipes, library access,
  or pasted ratings. The first payoff
  now shows a concrete verdict: what was learned, what to try now, and what is
  still uncertain, plus a "Next 3 clicks" journey into detail, memory, and
  Discover search.
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
- Game drawer: polished decision cockpit, shared "why now" rationale, hero
  badges for fit/time/value/next move, smart primary CTA, status cards,
  facts, "Get it" links (PS Store/RAWG/HLTB), price sparkline, PS Plus chip,
  polished per-region price alert target, similar games, rating,
  swipe-to-close, focus trap.
- Global search: local/provider/manual results can be added directly to
  Wishlist, Library, or Plus with an in-row memory confirmation panel; external
  results keep source passport + cover attribution and avoid fake live
  price/Plus claims.
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
  wall.
- Backlog amnesty: repeated explicit skips are tracked per title; after 5
  skips Today can suggest letting a game go without guilt, archiving it as
  hidden with `source: "backlog_amnesty"` and counting it in Stats. Amnestied
  games can be restored to Wishlist from the drawer or Stats; "Keep it" has a
  small skip cooldown to avoid nagging after one more skip.
- Dark mode (`data-theme="dark"`, toggle, OS-follow, anti-flash); design
  tokens are PlayStation-bold (`--blue #0064d2`, `--cta-gradient`, etc.);
  wordmark logo with orbit/satellite tittle; PWA icons.
- Taste/wishlist share links (`?taste=`, `?wl=`) with import banners.
- Error states: init overlay, deferred-data toast, offline indicator,
  SW update banner.

## Engineering principle

Invisible bug classes become automated gates, not memory: check.sh + CI run
perf, dark-mode contrast, and mobile-layout gates against a SEEDED profile.
See AGENTS.md "Core engineering principle" / CLAUDE.md.

## Performance contract (critical)

`render()` re-renders everything; budget <800ms WITH a populated profile
(enforced by `scripts/perf-budget-test.mjs`; current ~33ms). Per-render memo
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
- Secrets in `.env.local` (gitignored) and Actions secrets: `RAWG_API_KEY`,
  `ITAD_API_KEY`. Never print them.

## Current Verification

```sh
./scripts/check.sh          # validate → i18n → qa → browser smoke → perf → browser gates (~45s)
./scripts/check.sh --fast   # ~3s, skips browser stages
```

The i18n stage validates EN/RU catalog structure and every literal
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
- Dark-mode overrides are suffix-selector passes at the end of styles.css —
  check new components in dark mode.

## Next Recommended Task

User decision: polish before showing to people. Search-to-memory, production
smoke, Discover/search visual polish, mobile navigation, first-session payoff,
core journey, demo Today/Discover continuity, demo review-mode polish, TLOU
Part II edition decision, detail-drawer visual hierarchy, data-health issue
triage, and Today/Library/detail recommendation coherence are now
strengthened. Top next candidates are onboarding dogfood, expanded catalog/data
trust polish, and Library queue dogfooding. See NEXT_TASKS.md and HANDOFF.md
"Backlog".
