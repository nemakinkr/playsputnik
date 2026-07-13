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
"$NODE" scripts/editorial-data-check.mjs
"$NODE" scripts/sw-version-check.mjs
"$NODE" scripts/manifest-cache-check.mjs

echo "── 2/7 i18n catalogs + usage ──────────────────"
"$NODE" scripts/i18n-check.mjs
"$NODE" scripts/i18n-startup-test.mjs
"$NODE" scripts/companion-intelligence-test.mjs
"$NODE" scripts/onboarding-diagnostic-test.mjs
"$NODE" scripts/ranking-dogfood-audit.mjs
"$NODE" scripts/search-quality-matrix.mjs
"$NODE" scripts/decision-workflow-test.mjs
"$NODE" scripts/detail-view-test.mjs
"$NODE" scripts/state-migrations-test.mjs
"$NODE" scripts/release-upgrade-test.mjs
"$NODE" scripts/state-class-check.mjs
"$NODE" scripts/architecture-map.mjs --check
"$NODE" scripts/ai-narrative-test.mjs
"$NODE" scripts/backend-worker-test.mjs
"$NODE" scripts/rawg-enrichment-test.mjs

echo "── 3/7 qa-harness ─────────────────────────────"
"$NODE" scripts/qa-harness.mjs

if [ "$1" = "--fast" ]; then
  echo "✅ fast check passed (browser stages skipped)"
  exit 0
fi

# Ensure a server is up on :7432
STARTED_SERVER=""
if ! curl -s -o /dev/null "http://127.0.0.1:7432/index.html"; then
  python3 scripts/serve-static.py 7432 >/dev/null 2>&1 &
  STARTED_SERVER=$!
  sleep 1
fi
trap '[ -n "$STARTED_SERVER" ] && kill $STARTED_SERVER 2>/dev/null' EXIT

echo "── 4/7 browser smoke ──────────────────────────"
"$NODE" scripts/browser-smoke-test.mjs "http://127.0.0.1:7432/?v=check" | tail -3

echo "── 5/7 perf budget (populated profile) ────────"
"$NODE" scripts/perf-budget-test.mjs "http://127.0.0.1:7432/?v=check-perf"

echo "── 6/7 browser gates (contrast + mobile + a11y + hidden, one Chrome) ──"
"$NODE" scripts/browser-gates.mjs "http://127.0.0.1:7432/"

echo "── 7/7 browser smoke suite (preview :4190 + fixture backend :4191) ──"
"$NODE" scripts/smoke-suite.mjs

echo "✅ all checks passed"
