# PlaySputnik — working notes for Claude

PS-first gaming companion ("what should I play tonight?"). Static frontend,
no build step: `index.html` + `app.js` (~5k lines) + `src/app-*.js` (25 IIFE
modules, each sets `window.PlaySputnikXxx = { createXxxTools }`). State lives
in localStorage. Live at https://nemakinkr.github.io/playsputnik/ (repo
nemakinkr/playsputnik).

## Run & verify

```sh
python3 -m http.server 7432        # serve (or use .claude/launch.json "playsputnik")
./scripts/check.sh                 # full gate: data → qa-harness → browser smoke → perf budget
./scripts/check.sh --fast          # ~3s, skips browser stages
```

- `node` is NOT on PATH; bundled node lives at
  `~/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`
  (check.sh resolves it automatically). Playwright is in the bundled
  node_modules; Chrome at the default macOS path.
- **Service worker is disabled on localhost** (index.html guard) — dev
  iterations don't need cache clearing. In production bump `CACHE_VERSION`
  in sw.js whenever app.js/styles.css change, or returning users get stale code.
- gh CLI: `~/.local/gh-cli/gh_2.93.0_macOS_arm64/bin/gh` (authed as nemakinkr).

## Performance rules (hard-won)

`render()` re-renders everything; budget is <800ms with a POPULATED profile
(perf-budget-test.mjs enforces this — an empty profile hides O(feedback ×
catalog × aliases) blowups; one shipped as a ~10s render).

Per-render memo caches, all invalidated at the top of `render()`:
`invalidateTasteProfile` (+feedback weights), `invalidateRankedGames`,
`invalidateTasteMemory`, `invalidateCompanionAgenda`,
`invalidateEffectiveState`, `invalidateSourceLookups`. `titleKey` is memoized
in app-search.js and must be invalidated when title-aliases.json loads
(`invalidateTitleKeys`). **If you add an expensive helper called per-game or
per-feedback-event, memoize it per render and add it to that block.**

View-gating: right-column sections render only when their view is active
(`inView(...)` in render()); `openAppView()` always re-renders.

## Data pipeline

`data/*.json` refreshed daily by `.github/workflows/update-data.yml`
(ITAD prices / PS Store Plus / RAWG covers → `validate-data.mjs` gate →
bot commit → explicit Pages redeploy, since GITHUB_TOKEN pushes don't
trigger workflows). Source failures auto-open a `source-health` issue.
Secrets: `RAWG_API_KEY`, `ITAD_API_KEY` in Actions; locally in `.env.local`
(gitignored — never print or commit).

Titles dedupe through `titleKey` (alias-aware via title-aliases.json);
price-history format is `{title: {region: [...]}}` (object, not array).
Catalog: 456 games, full cover/price coverage.

## Constraints (carry-over)

- RAWG covers are candidates with attribution links, not official art.
- Never claim live prices/Plus status without source + freshness fields.
- PSN import is demo logic, not a real integration.
- Ratings are 1–5 "sputniks" stored as 20–100; they feed taste via
  `rated_1..rated_5` feedback events (graded weights −3..+3).
