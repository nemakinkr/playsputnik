# PlaySputnik — agent instructions

Start here, in this order:

1. **HANDOFF.md** — what was built and why (narrative through 2026-06-10).
2. **PROJECT_STATE.md** — compact current state.
3. **NEXT_TASKS.md** — prioritized backlog; pick work from here.
4. **CLAUDE.md** — dev workflow + performance rules (applies to ANY agent;
   named for the previous agent, content is agent-neutral).

## Core engineering principle (learned the hard way — read this)

**Any class of bug that is INVISIBLE during normal development must become an
automated gate, not a thing you remember to check.** Memory — human or agent —
is unreliable across handoffs; a gate is not. We relearned this three times:

- Performance: an empty profile hid O(n) blowups → a ~10s render shipped.
  Fix: `perf-budget-test.mjs` measures with a SEEDED profile.
- Dark mode: components ship hardcoded light colors that look fine in the
  light theme you're staring at; the dark breakage is invisible until someone
  manually checks dark with real data. Dozens accumulated across agents.
  Fix: `contrast-check.mjs` fails on light-bg / dark-on-dark text in dark.
- Mobile: overflow/cramped targets invisible on a desktop viewport.
  Fix: `mobile-check.mjs` at 375px.

So: when you fix a bug, ask "could this whole CLASS recur invisibly?" If yes,
**encode it as a deterministic gate in check.sh + ci.yml** (use the CDP harness
in `scripts/contrast-check.mjs` / `mobile-check.mjs` as a template — system
Chrome, no install, seeded profile). Prefer a narrow high-confidence assertion
over a heuristic one (a flaky gate gets disabled). Don't rely on a future
agent remembering — make it impossible to merge the regression.

The deeper fix for colors specifically: use theme TOKENS, never hardcoded
hexes (so the bug can't be written in the first place). We can't cheaply
retrofit every hex, but the gate + tokens-for-new-code gets ~90% of the way.

## Non-negotiables

- Before claiming a task done: `./scripts/check.sh` (full gate: data → i18n
  catalogs → qa-harness → browser smoke → perf budget → browser gates).
  `--fast` for quick loops.
- After a completed checked task, commit and push to `main` immediately unless
  the user explicitly asks not to. Do not ask for a separate "commit + push"
  confirmation; the user wants to choose the next practical product step.
- `node` is NOT on PATH. Bundled node:
  `~/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`
  (check.sh resolves it automatically).
- Performance contract: `render()` re-renders everything; budget <800ms
  WITH a populated profile. Any expensive helper called per-game or
  per-feedback-event must be memoized per render and invalidated in the
  block at the top of `render()` (see CLAUDE.md for the cache list).
  Empty-profile measurements LIE — always test with seeded ratings/states.
- Service worker is disabled on localhost; in production bump
  `CACHE_VERSION` in sw.js whenever app.js/styles.css change.
- Secrets (`RAWG_API_KEY`, `ITAD_API_KEY`) live in `.env.local` (gitignored)
  and GitHub Actions secrets. Never print or commit them.
- Data honesty: RAWG covers are attributed candidates; never show
  prices/Plus status without per-record source + freshness; PSN import is
  demo logic.
- Pushing to `main` auto-deploys to https://nemakinkr.github.io/playsputnik/
  (~20s). CI (validate + i18n catalogs + qa-harness + browser gates) runs on
  every push.
- Keep all app paths RELATIVE (the site lives under a /playsputnik/ subpath).
- Dark mode: every component must work in dark. Use theme tokens for
  backgrounds (`var(--card-bg)`/`--card-bg-soft`/`--chip-bg`/`--surface-2`/
  `--accent-bg`/`--panel`/`--surface`) and text (`--text-mid`/`--text-strong`/
  `--ink`) — NEVER a hardcoded light-hex background or dark-hex text color.
  `scripts/contrast-check.mjs` (check.sh + CI) fails on any light background or
  dark-on-dark text in dark mode; `scripts/mobile-check.mjs` fails on 375px
  overflow or controls < 24px; `scripts/a11y-check.mjs` fails on unnamed
  interactive controls. Test with a SEEDED profile, not empty. See
  CLAUDE.md "Dark mode rules".
