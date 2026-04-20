#!/bin/bash
# scripts/test-changed.sh — Run tests only for changed files
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")/dainganxanh-landing"
cd "$PROJECT_DIR"

BASE=${1:-main}
echo "=== Running tests for files changed vs $BASE ==="

CHANGED=$(git diff --name-only "$BASE"...HEAD -- 'dainganxanh-landing/src/**/*.ts' 'dainganxanh-landing/src/**/*.tsx' 2>/dev/null | sed 's|dainganxanh-landing/||g')

if [ -z "$CHANGED" ]; then
  echo "No source files changed — running full suite."
  npx jest --ci --forceExit --passWithNoTests
else
  echo "Changed files:"
  echo "$CHANGED"
  echo ""
  npx jest --ci --forceExit --findRelatedTests $CHANGED
fi
