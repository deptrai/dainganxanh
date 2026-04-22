#!/bin/bash
# scripts/burn-in.sh — Local flaky detection (repeat E2E N times)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")/dainganxanh-landing"
cd "$PROJECT_DIR"

COUNT=${BURN_IN_COUNT:-3}
GREP=${TEST_GREP:-""}

echo "=== Burn-in: $COUNT iterations ==="

for i in $(seq 1 "$COUNT"); do
  echo ""
  echo "--- Iteration $i/$COUNT ---"
  if [ -n "$GREP" ]; then
    npx playwright test --grep "$GREP" || { echo "❌ Failed on iteration $i"; exit 1; }
  else
    npx playwright test || { echo "❌ Failed on iteration $i"; exit 1; }
  fi
done

echo ""
echo "=== ✅ Burn-in passed: $COUNT/$COUNT iterations stable ==="
