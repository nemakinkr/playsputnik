#!/bin/sh
# One-command quality gate: data → logic → browser → perf.
# Usage: ./scripts/check.sh [--fast]   (--fast skips browser tests, ~3s)
# Needs a static server on :7432 for the browser stages (scripts/check.sh
# starts a temporary one if nothing is listening).
set -e
cd "$(dirname "$0")/.."

# Resolve node. Prefer the bundled codex runtime (Node 24) because the browser
# gates use the global WebSocket (Node 22+); a PATH node may be older (e.g. an
# nvm Node 20 has no global WebSocket). On CI the bundled path is absent, so we
# fall back to the runner's node (setup-node pins 24).
NODE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
[ -x "$NODE" ] || NODE="$(command -v node || true)"
if [ ! -x "$NODE" ]; then
  echo "❌ node not found"; exit 1
fi

echo "── 1/7 validate-data ──────────────────────────"
"$NODE" scripts/validate-data.mjs

echo "── 2/7 qa-harness ─────────────────────────────"
"$NODE" scripts/qa-harness.mjs

if [ "$1" = "--fast" ]; then
  echo "✅ fast check passed (browser stages skipped)"
  exit 0
fi

# Ensure a server is up on :7432
STARTED_SERVER=""
if ! curl -s -o /dev/null "http://127.0.0.1:7432/index.html"; then
  python3 -m http.server 7432 >/dev/null 2>&1 &
  STARTED_SERVER=$!
  sleep 1
fi
trap '[ -n "$STARTED_SERVER" ] && kill $STARTED_SERVER 2>/dev/null' EXIT

echo "── 3/7 browser smoke ──────────────────────────"
"$NODE" scripts/browser-smoke-test.mjs "http://127.0.0.1:7432/?v=check" | tail -3

echo "── 4/7 perf budget (populated profile) ────────"
"$NODE" scripts/perf-budget-test.mjs "http://127.0.0.1:7432/?v=check-perf"

echo "── 5/7 dark-mode contrast gate ────────────────"
"$NODE" scripts/contrast-check.mjs "http://127.0.0.1:7432/?v=check-contrast"

echo "── 6/7 mobile layout gate (375px) ─────────────"
"$NODE" scripts/mobile-check.mjs "http://127.0.0.1:7432/?v=check-mobile"

echo "── 7/7 accessibility gate ─────────────────────"
"$NODE" scripts/a11y-check.mjs "http://127.0.0.1:7432/?v=check-a11y"

echo "✅ all checks passed"
