# Development Protocol

This file keeps PlaySputnik work token-light as the app grows.

## Start Of Each Task

Read in this order:

1. `PROJECT_STATE.md`
2. `NEXT_TASKS.md`
3. only the files directly related to the selected task

Do not reread the full README or old conversation unless the task specifically needs historical detail.

## Task Shape

Before editing, identify:

- goal;
- files likely touched;
- acceptance criteria;
- minimum useful checks.

For normal work, avoid long planning in chat. Implement the selected task, then report concise results.

## Verification Levels

### Fast

Use for markdown, data, and small logic edits:

```sh
node --check app.js
node scripts/qa-harness.mjs
node scripts/validate-data.mjs
node scripts/preview-server.mjs --check
```

### Targeted

Use when touching a product surface:

```sh
node scripts/browser-smoke-test.mjs
node scripts/app-view-smoke-test.mjs
node scripts/library-wishlist-smoke-test.mjs
node scripts/game-detail-smoke-test.mjs
node scripts/visual-catalog-smoke-test.mjs
node scripts/design-smoke-test.mjs
```

Run only the relevant smoke for the touched surface unless the change is cross-cutting.

### Full

Use before a demo/pause after major frontend changes:

```sh
node --check app.js
node scripts/qa-harness.mjs
node scripts/validate-data.mjs
node scripts/preview-server.mjs --check
node scripts/browser-smoke-test.mjs
node scripts/app-view-smoke-test.mjs
node scripts/library-wishlist-smoke-test.mjs
node scripts/game-detail-smoke-test.mjs
node scripts/visual-catalog-smoke-test.mjs
node scripts/design-smoke-test.mjs
```

Run Chrome smokes sequentially. Do not parallelize them locally.

## Update Rules

After a completed task:

- update `PROJECT_STATE.md` only if the product state changed;
- update `NEXT_TASKS.md` only if a task moved, changed, or was completed;
- keep updates to 5-10 lines when possible;
- avoid copying long implementation detail into chat if it is already in these files.

## Final Response Shape

Keep final responses short:

- what changed;
- what was verified;
- any known risk;
- three next options, with one recommendation.

## Secrets

`.env.local` can contain provider keys. Do not print secrets into chat, docs, logs, or test output.
