#!/bin/bash
# ci-watch.sh — Watch latest CI run; if it fails, feed log to Claude Code for auto-fix
# Usage: ./scripts/ci-watch.sh [run-id]
#        ./scripts/ci-watch.sh          # watches the latest run on current branch

set -euo pipefail

REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null || echo "")
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Get run ID: argument or latest on current branch
if [ -n "${1:-}" ]; then
  RUN_ID="$1"
else
  echo "🔍 Finding latest CI run on branch: $BRANCH"
  RUN_ID=$(gh run list --branch "$BRANCH" --limit 1 --json databaseId -q '.[0].databaseId')
fi

if [ -z "$RUN_ID" ]; then
  echo "❌ No CI run found on branch $BRANCH"
  exit 1
fi

echo "👀 Watching run #$RUN_ID on $REPO ($BRANCH)"
echo "   https://github.com/$REPO/actions/runs/$RUN_ID"
echo ""

# Watch until completion (exits 0 on success, non-zero on failure)
if gh run watch "$RUN_ID" --exit-status 2>/dev/null; then
  echo ""
  echo "✅ CI passed!"
  exit 0
fi

echo ""
echo "❌ CI failed — collecting logs..."

# Fetch only failed job logs (avoid token explosion)
FAILED_LOG=$(gh run view "$RUN_ID" --log-failed 2>&1 | head -500)

if [ -z "$FAILED_LOG" ]; then
  echo "⚠️  Could not retrieve failure logs. Open manually:"
  echo "   https://github.com/$REPO/actions/runs/$RUN_ID"
  exit 1
fi

echo ""
echo "📋 Failed log (first 500 lines):"
echo "─────────────────────────────────"
echo "$FAILED_LOG" | head -80
echo "─────────────────────────────────"
echo ""

# Build prompt for Claude Code
PROMPT="CI pipeline failed on branch \`$BRANCH\` (run #$RUN_ID).

Here are the failure logs:

\`\`\`
$FAILED_LOG
\`\`\`

Please:
1. Identify the root cause of the failure
2. Fix it in the codebase (edit files as needed)
3. Do NOT commit — just make the edits so I can review before pushing"

echo "🤖 Handing off to Claude Code..."
echo ""

# Pass to claude (non-interactive print mode pipes the prompt, interactive mode is default)
echo "$PROMPT" | claude --print || claude "$PROMPT"
