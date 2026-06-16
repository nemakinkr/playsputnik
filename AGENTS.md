# PlaySputnik — agent instructions

Start here, in this order:

1. **HANDOFF.md** — what was built and why (narrative through 2026-06-10).
2. **PROJECT_STATE.md** — compact current state.
3. **NEXT_TASKS.md** — prioritized backlog; pick work from here.
4. **CLAUDE.md** — dev workflow + performance rules (applies to ANY agent;
   named for the previous agent, content is agent-neutral).

## Non-negotiables

- Before claiming a task done: `./scripts/check.sh` (full gate: data →
  qa-harness → browser smoke → perf budget). `--fast` for quick loops.
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
  (~20s). CI (validate + qa-harness) runs on every push.
- Keep all app paths RELATIVE (the site lives under a /playsputnik/ subpath).
- Dark mode: every component must work in dark. Use theme tokens for
  backgrounds (`var(--card-bg)`/`--card-bg-soft`/`--chip-bg`/`--surface-2`/
  `--accent-bg`/`--panel`/`--surface`) and text (`--text-mid`/`--text-strong`/
  `--ink`) — NEVER a hardcoded light-hex background or dark-hex text color.
  `scripts/contrast-check.mjs` (check.sh stage 5) fails on any light solid
  background in dark mode; test dark with a SEEDED profile, not empty. See
  CLAUDE.md "Dark mode rules".
