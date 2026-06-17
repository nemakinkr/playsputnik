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

## Core principle: invisible bug classes → automated gates

The single most important lesson here. **A bug class that is invisible during
normal development will rot silently across edits and agents.** Don't fight it
with discipline/memory — encode it as a deterministic gate that fails the build.
Three times now: performance (empty profile hid a ~10s render), dark mode
(hardcoded light colors look fine in the light theme you're viewing), mobile
(desktop viewport hides overflow). Each is now a gate run by check.sh + CI with
a SEEDED profile. When you fix a bug, ask whether the whole class can recur
invisibly; if so, add a gate (CDP template: contrast-check.mjs / mobile-check.mjs
— system Chrome, no install). Narrow high-confidence assertions only — a flaky
gate gets disabled. For colors: use tokens so the bug can't be written at all.

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

## Dark mode rules (hard-won — the #1 cross-agent regression)

Dark mode is `[data-theme="dark"]` on `<html>`, driven entirely by CSS
variables. The recurring bug: a new component ships a **hardcoded light
background** (`#fff`, `#f1f5f9`, `#f8fafc`, `#eaf0ff`, …) or a **hardcoded dark
text color** (`#334155`, `#475569`, …) with no dark override, so in dark mode
it renders light-on-light or dark-on-dark — often unreadable. Whole sessions
were spent finding these by hand.

**When you add or restyle any component:**
- Backgrounds → a theme token: `var(--card-bg)`, `--card-bg-soft`, `--chip-bg`,
  `--surface-2`, `--accent-bg`, `--panel`, `--surface`. Never a light hex.
- Text → `var(--text-strong)`, `--text-mid`, `--text-soft`, `--ink`. Never a
  dark slate hex.
- If a component must keep a semantic tint (green/amber/rose), give it a
  `[data-theme="dark"]` override with a translucent tint + a **light** text of
  that hue (a `var(--green)` text on a green tint reads at ~1.0 contrast — use
  e.g. `#86e8b6`).
- Beware specificity: tone/state variants (`.x.tone-buy`, `.x.is-active`,
  `.parent .x`) outrank a single-class dark override — match their specificity.
- Suffix selectors like `[class*="-panel"]` silently skip classes without the
  suffix (that's how the whole `.price-watch` panel stayed white).

**The gates** (deterministic, keep green): `scripts/contrast-check.mjs`
boots the app dark with a SEEDED profile and fails on any light solid
background OR dark-on-dark text (+ light-on-light in light mode);
`scripts/mobile-check.mjs` fails on 375px horizontal overflow or primary
controls < 24px; `scripts/a11y-check.mjs` fails on interactive controls with
no accessible name. Each is a `{ name, drive, analyze }` module over a shared
`scripts/lib/cdp.mjs` harness; `scripts/browser-gates.mjs` runs all three on ONE
headless Chrome (check.sh stage 5 + CI), and each `*-check.mjs` still runs
standalone for debugging.
All use system Chrome over CDP (no install), run locally and on the ubuntu
runner. Test dark mode with a
seeded/demo profile, never empty (empty profiles hide most components, same
lesson as the perf budget). Two shared light surfaces are already tokenized:
`#f1f5f9 → --chip-bg`, `#f8fafc → --surface-2` (prefer reusing/extending these
over adding more hardcoded hexes).

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
