# PlaySputnik Project State

Last updated: 2026-06-10 (Claude session series; see HANDOFF.md for the full
narrative and CLAUDE.md for dev workflow + performance rules).

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
- Deploy on every push (`.github/workflows/deploy-pages.yml`); daily data
  refresh at 06:17 UTC (`update-data.yml`: ITAD prices / PS Store Plus /
  RAWG covers → validate gate → bot commit → explicit Pages redeploy) with a
  `source-health` issue monitor; CI on push (`ci.yml`: validate + qa-harness).
- All app paths are RELATIVE (works under the /playsputnik/ subpath).
- Service worker v3 (cache-first static / network-first data), **disabled on
  localhost**; bump `CACHE_VERSION` in sw.js when shipping app.js/styles.css.

## Current Prototype

- Static app, no build step: `index.html` + `styles.css` + `app.js` (~5.1k
  lines) + 25 IIFE modules in `src/` (`window.PlaySputnikXxx = { createXxxTools }`).
- Product areas: Today, Library, Discover, Wishlist, Taste, Deals, Data, Stats.
- Onboarding: 30-game swipe deck, 3/6/10 milestones, animated hero exit.
- **Session planner:** "Tonight I have: 30m–evening" chips; chunk model
  (`gameChunkProfile` in src/app-score.js) scores complete-session fit.
- **Sputnik ratings 1–5** in the game drawer (stored 20–100 in
  `userGames[key].rating`); feed taste via `rated_1..rated_5` feedback
  events (weights −3..+3).
- Game drawer: status cards, facts, "Get it" links (PS Store/RAWG/HLTB),
  price sparkline, PS Plus chip, similar games, rating, swipe-to-close,
  focus trap.
- Visual catalog: search, filter chips, sort, pagination, keyboard grid nav.
- Dark mode (`data-theme="dark"`, toggle, OS-follow, anti-flash); design
  tokens are PlayStation-bold (`--blue #0064d2`, `--cta-gradient`, etc.);
  wordmark logo with orbit/satellite tittle; PWA icons.
- Taste/wishlist share links (`?taste=`, `?wl=`) with import banners.
- Error states: init overlay, deferred-data toast, offline indicator,
  SW update banner.

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
  cover and price coverage, HLTB filled where applicable.
- Prices: ITAD, 4 regions (US/GB/DE/TR), per-record source + `checkedAt` +
  freshness; price-history format is `{title: {region: [...]}}` (object).
- PS Plus: live Extra list from PS Store category pages; Premium category id
  unknown (3 manual records).
- Covers: RAWG candidates with attribution (`sourceUrl`, `licenseNote`).
- Secrets in `.env.local` (gitignored) and Actions secrets: `RAWG_API_KEY`,
  `ITAD_API_KEY`. Never print them.

## Current Verification

```sh
./scripts/check.sh          # validate → qa-harness → browser smoke → perf budget (~40s)
./scripts/check.sh --fast   # ~3s, skips browser stages
```

`node` is not on PATH; bundled node at
`~/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`
(check.sh resolves it). Targeted Chrome smokes still exist in `scripts/`
(run sequentially, not in parallel).

## Known Constraints

- PSN import is demo logic, not a real PSN integration.
- RAWG covers are candidates, not official art; keep attribution.
- Never claim live prices/Plus without per-record source + freshness.
- validate-data reports 80 honest issues (delisted games missing some
  regional prices) — expected.
- Dark-mode overrides are suffix-selector passes at the end of styles.css —
  check new components in dark mode.

## Next Recommended Task

User decision: polish before showing to people. Top candidates: wishlist
price alerts UI (`watch.targetPrice` backend exists), backlog amnesty,
onboarding polish. See NEXT_TASKS.md and HANDOFF.md "Backlog".
