# PlaySputnik — Handoff (Claude → Codex), 2026-06-10

Read this first, then `PROJECT_STATE.md` (current state), `NEXT_TASKS.md`
(backlog), `CLAUDE.md` (dev workflow + perf rules — applies to any agent,
not just Claude). This file is the narrative: what was done after 2026-06-06
and why, plus everything operational you need.

## TL;DR

The prototype became a **deployed product with self-updating data**:

- **Live:** https://nemakinkr.github.io/playsputnik/
- **Repo:** https://github.com/nemakinkr/playsputnik (public, GitHub Pages)
- Daily data refresh via GitHub Actions (prices/PS Plus/covers) with a
  validation gate and a source-health monitor (auto-opens issues).
- Catalog: 456 games, 100% cover and price coverage, deduped.
- Render perf: ~33ms (was ~10s with a populated profile before fixes).
- One-command quality gate: `./scripts/check.sh`.

## What was built (chronologically compressed, by area)

### Catalog & data
- Grew catalog to 456 games (RAWG expansion + 26 manual adds), then deduped:
  removed curly-apostrophe Uncharted 4 dupe, `The Last Of Us` (kept
  `The Last of Us Part I`), `DOOM` (kept `Doom (2016)` — its vibe was wrong).
  `data/catalog-backbone.json` currentSeed = 456.
- Prices: full ITAD coverage, 4 regions (US/GB/DE/TR), with price-history
  (object format `{title: {region: [...]}}` — NOT the legacy array).
- PS Plus: live from PS Store category pages (`scripts/update-psplus.mjs`,
  Extra category id `30e3fe35-...`; Premium category id never found — 3 manual
  records remain, see backlog).
- Covers: 456/456 from RAWG (candidates with attribution; 7 non-PS titles
  fetched without platform filter; Disgaea 4 found under its western name).
- HLTB hours filled for 42 games (8 remain null — live-service/sports, N/A).
- Fixed stale reference data: `source-status.json` regions were US/TR/UK →
  now US/GB/DE/TR; `taxonomy.json` extended with 24 in-use values. This took
  validate-data from 3765 false issues to 80 honest ones (delisted games
  missing regional prices).
- `scripts/validate-data.mjs` was crashing on the new price-history format —
  fixed; it now works as the CI/pipeline gate.

### Features
- **Catalog UX:** search, atom/length/difficulty filter chips, sort
  (best fit / A–Z / length / price), pagination (24 + Load more), shelf
  switcher, keyboard grid navigation (arrows/Home/End, column-count read
  from live grid).
- **Session planner:** "Tonight I have: 30m/45m/1h/2h/evening" chips above
  the top pick. `gameChunkProfile(game)` (src/app-score.js) estimates the
  natural complete-session length (roguelike run ~30m, story beat ~60m, deep
  RPG ~90m; commitment adjusts). With a minute budget set, `tonightFitScore`
  replaces the coarse short/medium/long match (+18 perfect fit / −14 won't
  finish a chunk). Hint line under chips names the top pick's chunk.
- **Sputnik ratings (1–5):** "Your rating" in the game drawer — five
  orbit+dot SVG buttons. Stored 20–100 in `userGames[key].rating`
  (compatible with imported "9/10" ratings). Feeds taste via graded feedback
  events `rated_1..rated_5` (weights −3..+3) — previously ratings existed
  but had zero taste effect. Tap current rating to clear; clearing deletes
  empty shell records. My-games rows use the same 1–5 scale
  (RATING_ACTIONS in src/app-config.js).
- **Drawer:** "Get it" links (PS Store via ITAD redirect, RAWG info, HLTB),
  natural-session note, price sparkline, PS Plus chip, similar games,
  swipe-to-close on mobile (drag handle, 90px threshold), focus trap +
  focus restore (a11y).
- **Stats view:** 9 tiles (tracked/playing/completed/wishlist/owned/HLTB
  backlog/prices/covers/PS Plus) + top taste atoms + dropped games.
- **Taste profile summary** (sidebar): archetype (Story Explorer etc.),
  gravitates-toward / tends-to-skip lines, liked-games chips.
- **Sharing:** taste share link (`?taste=`) and wishlist share (`?wl=`)
  with import banners.
- **Onboarding:** hero with progress bar; animated exit + toast + scroll to
  first pick when the 3rd signal lands.
- **Wishlist:** sort row (best fit / price / discount / A–Z).
- **Dark mode:** `data-theme="dark"` on <html>, toggle in header, persisted,
  follows OS if unset, anti-flash inline script in <head>. Dark overrides
  live at the end of styles.css as attribute-suffix selectors
  (`[class*="-panel"]` etc., several passes) — fragile by design; new
  components with odd class suffixes may need another rule.
- **Error states:** full-screen overlay for init failure (Retry / Work
  offline / details), toast for deferred-data failures, offline indicator,
  SW update banner ("New version available → Reload").
- **PWA:** manifest (theme #003791, relative start_url), favicon.svg,
  PNG icons 192/512 + maskable (quantized PNG-8, 3–8KB).

### Design system & brand
- PlayStation-bold tokens in `:root` + `[data-theme="dark"]`: `--blue
  #0064d2`, `--blue-deep`, `--blue-bright`, `--cta-gradient`,
  `--hero-gradient`, `--shadow-cta`, `--radius-sm/md/lg`, semantic
  `--card-bg/--card-border/--text-*/--accent-*`.
- Wordmark logo: "Play" (ink) + "Sputnik" (blue), dotless ı with an orbit
  ring + glowing satellite dot (`.brand-logo`, `.bl-i::before/::after`,
  beacon animation, reduced-motion respected).
- Icon: blue tile + white play-core planet + orbit + satellite
  (favicon.svg, icons/*.png).
- Active nav tabs and primary CTAs use `--cta-gradient` with white text.

### Performance (critical knowledge)
`render()` re-renders everything. Two waves of fixes:

1. Empty-profile wave (3657ms → 466ms): per-render memoization of
   `tasteEngineProfile`, `rankedGames`, `tasteMemory`,
   `companionAnswerAgenda`, `effectiveGameState` (Map by title), plus
   view-gating (right-column sections render only for their active view —
   `inView(...)` block in render()).
2. Populated-profile wave (~10,000ms → 33ms): with feedback history,
   `feedbackSource` rebuilt the catalog per event and — the real monster —
   `titleKey` rescanned the alias table with NFKD normalization inside
   every `titleMatches` (456 × ~80 aliases × regex per lookup;
   `personalEvidence` cost 568ms PER GAME). Fixed: `feedbackSource` +
   `feedbackTasteWeights` memoized per render; **`titleKey` memoized in
   src/app-search.js** with `invalidateTitleKeys()` called after
   title-aliases.json loads (REQUIRED — keys computed before aliases arrive
   are stale).

**The contract:** all per-render caches are invalidated at the top of
`render()`: `invalidateTasteProfile`, `invalidateRankedGames`,
`invalidateTasteMemory`, `invalidateCompanionAgenda`,
`invalidateEffectiveState`, `invalidateSourceLookups`. If you add an
expensive helper called per-game or per-feedback-event, memoize it per
render and add it to that block. `scripts/perf-budget-test.mjs` enforces
<800ms with a POPULATED profile (empty profiles hide this bug class).

### Infrastructure
- **git/GitHub:** repo `nemakinkr/playsputnik`, branch `main`. gh CLI binary
  at `~/.local/gh-cli/gh_2.93.0_macOS_arm64/bin/gh`, authed as `nemakinkr`
  (scopes: repo, workflow, gist, read:org), git credential helper wired.
- **Pages:** build_type=workflow; `.github/workflows/deploy-pages.yml`
  deploys on every push (~20s). All app paths are RELATIVE (sw.js precache,
  routing via `pathname.includes(...)`, manifest start_url "./", SW
  registered as "sw.js") so the app works under the /playsputnik/ subpath.
- **Daily data:** `.github/workflows/update-data.yml`, cron 06:17 UTC:
  prices → psplus → covers (each `continue-on-error` so one dead API doesn't
  block others) → validate-data gate → bot commit → **explicit Pages
  redeploy** (`gh workflow run deploy-pages.yml` — GITHUB_TOKEN pushes don't
  trigger workflows). On any source failure it opens/comments a
  `source-health` issue and fails the run.
- **CI:** `.github/workflows/ci.yml` on push/PR: validate-data + qa-harness
  (~22s).
- **Secrets:** `RAWG_API_KEY`, `ITAD_API_KEY` in Actions secrets; locally in
  `.env.local` (gitignored). NEVER print or commit them. `.env.example` has
  placeholders.
- **Service worker:** v3, cache-first static / network-first data.
  **Disabled on localhost** (guard in index.html also self-cleans leftover
  registrations) — dev reloads always serve fresh code. In production, bump
  `CACHE_VERSION` in sw.js when app.js/styles.css change, or returning
  visitors get stale code (update banner exists, but version bump is what
  invalidates).

## Dev workflow (how to work on this)

```sh
python3 -m http.server 7432      # serve; node is NOT on PATH
./scripts/check.sh               # full gate: validate → qa-harness → browser smoke → perf budget (~40s)
./scripts/check.sh --fast        # ~3s, no browser
```

- Bundled node:
  `~/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`
  (check.sh resolves it; Playwright lives in the bundled node_modules,
  Chrome at the default macOS path).
- Local AI explain ("Why this game?") needs
  `node scripts/search-provider-server.mjs` + `ANTHROPIC_API_KEY` in
  .env.local — optional, UI degrades gracefully.
- After changing data scripts, run them with `--dry-run` first where
  supported (update-prices/update-covers support it).

## Known issues / open observations

1. validate-data reports 80 honest issues: ~22 delisted games (NBA 2K17 era)
   missing some regional prices. Expected; not a bug.
2. `The Last of Us Part II` and `... Part II Remastered` coexist (different
   SKUs/prices, same content) — decide whether to alias-merge.
3. PS Plus Premium category id on PS Store was never found (8 UUID attempts);
   3 manual Premium records remain in subscription-availability.json.
4. Dark-mode CSS is suffix-selector based (three override passes at the end
   of styles.css) — check new components in dark mode.
5. Chunk-model labels can be slightly off ("one full run" for Stray via its
   platformer atom) — scoring is right, copy could be refined.
6. The Pages site is public; the app is a prototype with PSN import as demo
   logic only (clearly labeled).
7. `window.__playsputnikErrors` collects runtime errors; error overlay covers
   init failure. Deferred-data failures show a toast.

## Backlog (user-prioritized)

The user deliberately decided NOT to show the product to people yet —
polish first. Recently discussed next candidates:

- Wishlist price alerts UI (backend `watch.targetPrice` already exists).
- "Backlog amnesty" — games seen/skipped 5+ times get a "let it go" prompt.
- Onboarding flow polish.
- Retention track (Web Push "evening ritual") — deferred until there are users.
- Analytics — deliberately deferred (MVP, no users yet).
- PS Plus Premium category, catalog expansion (+100 games), price-history
  chart in drawer, "Wrapped"-style year summary, gift mode via taste links.

## Constraints (do not violate)

- RAWG covers are candidates with attribution + source links, not official
  art. Keep `licenseNote`/`sourceUrl` on records.
- Never claim live prices/Plus status without per-record source + freshness
  (`checkedAt`, `freshnessState`, `confidence`).
- PSN import is demo logic, not a real PSN integration.
- PlayStation/PS Plus are Sony trademarks; this is an unofficial prototype
  (stated in README).
- Don't put secrets in code, logs, commits, or chat output.
