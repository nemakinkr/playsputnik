#!/bin/sh
# One-command quality gate: data → logic → browser → perf.
# Usage: ./scripts/check.sh [--fast]   (--fast skips browser tests, ~3s)
# Needs a static server on :7432 for the browser stages (scripts/check.sh
# starts a temporary one if nothing is listening).
set -e
cd "$(dirname "$0")/.."

# Resolve node: PATH first, then the bundled codex runtime
NODE="$(command -v node || true)"
[ -z "$NODE" ] && NODE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
if [ ! -x "$NODE" ]; then
  echo "❌ node not found"; exit 1
fi

echo "── 1/4 validate-data ──────────────────────────"
"$NODE" scripts/validate-data.mjs

echo "── 2/4 qa-harness ─────────────────────────────"
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

echo "── 3/4 browser smoke ──────────────────────────"
"$NODE" scripts/browser-smoke-test.mjs "http://127.0.0.1:7432/?v=check" | tail -3

echo "── 4/4 perf budget (populated profile) ────────"
"$NODE" scripts/perf-budget-test.mjs "http://127.0.0.1:7432/?v=check-perf"

echo "✅ all checks passed"
