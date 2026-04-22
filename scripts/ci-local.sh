#!/bin/bash
# scripts/ci-local.sh — Mirror CI environment locally
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")/dainganxanh-landing"

echo "=== CI Local Runner ==="
echo "Working dir: $PROJECT_DIR"
cd "$PROJECT_DIR"

echo ""
echo "--- Step 1: Install dependencies ---"
npm ci

echo ""
echo "--- Step 2: Lint ---"
npm run lint

echo ""
echo "--- Step 3: Unit tests (Jest) ---"
npx jest --ci --forceExit --passWithNoTests

echo ""
echo "--- Step 4: E2E tests (Playwright) ---"
npx playwright install --with-deps chromium
npm run build
npx playwright test

echo ""
echo "=== ✅ All CI checks passed locally ==="
