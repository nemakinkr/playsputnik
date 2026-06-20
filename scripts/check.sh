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

echo "── 1/6 validate-data ──────────────────────────"
"$NODE" scripts/validate-data.mjs

echo "── 2/6 i18n catalogs + usage ──────────────────"
"$NODE" scripts/i18n-catalog-check.mjs
"$NODE" scripts/i18n-usage-check.mjs
"$NODE" scripts/i18n-startup-test.mjs
"$NODE" scripts/ai-narrative-test.mjs
"$NODE" scripts/backend-worker-test.mjs

echo "── 3/6 qa-harness ─────────────────────────────"
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

echo "── 4/6 browser smoke ──────────────────────────"
"$NODE" scripts/browser-smoke-test.mjs "http://127.0.0.1:7432/?v=check" | tail -3

echo "── 5/6 perf budget (populated profile) ────────"
"$NODE" scripts/perf-budget-test.mjs "http://127.0.0.1:7432/?v=check-perf"

echo "── 6/6 browser gates (contrast + mobile + a11y + hidden, one Chrome) ──"
"$NODE" scripts/browser-gates.mjs "http://127.0.0.1:7432/"

echo "✅ all checks passed"
