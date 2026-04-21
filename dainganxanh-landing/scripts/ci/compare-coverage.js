#!/usr/bin/env node
/**
 * compare-coverage.js
 *
 * Compares two coverage-summary.json files and fails if coverage regresses
 * more than the given threshold in any dimension.
 *
 * Usage:
 *   node scripts/ci/compare-coverage.js \
 *     --baseline baseline/coverage-summary.json \
 *     --current  current/coverage-summary.json \
 *     --threshold 2.0
 *
 * Exit codes:
 *   0 — no regression beyond threshold
 *   1 — regression detected (or bad input)
 */

const fs = require('fs')

// ── Parse CLI args ────────────────────────────────────────────────────────────
function arg(name) {
  const idx = process.argv.indexOf(name)
  return idx !== -1 ? process.argv[idx + 1] : null
}

const baselineFile = arg('--baseline')
const currentFile = arg('--current')
const threshold = parseFloat(arg('--threshold') ?? '2.0')

if (!baselineFile || !currentFile) {
  console.error('Usage: compare-coverage.js --baseline <file> --current <file> [--threshold <pct>]')
  process.exit(1)
}

for (const file of [baselineFile, currentFile]) {
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`)
    process.exit(1)
  }
}

// ── Compare ───────────────────────────────────────────────────────────────────
const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'))
const current = JSON.parse(fs.readFileSync(currentFile, 'utf8'))

const DIMS = ['lines', 'branches', 'functions', 'statements']

console.log(`\nCoverage comparison (threshold: -${threshold}%)\n`)
console.log(`${'Dimension'.padEnd(14)} ${'Baseline'.padStart(8)} ${'Current'.padStart(8)} ${'Delta'.padStart(8)}`)
console.log('─'.repeat(44))

const regressions = []

for (const dim of DIMS) {
  const base = baseline.total?.[dim]?.pct ?? 0
  const curr = current.total?.[dim]?.pct ?? 0
  const delta = curr - base
  const sign = delta >= 0 ? '+' : ''
  const flag = delta < -threshold ? ' ← REGRESSION ❌' : delta < 0 ? ' ← warning ⚠️' : ''
  console.log(
    `${dim.padEnd(14)} ${String(base).padStart(8)}% ${String(curr).padStart(8)}% ${(sign + delta.toFixed(2)).padStart(7)}%${flag}`
  )
  if (delta < -threshold) {
    regressions.push({ dim, base, curr, delta })
  }
}

console.log()

if (regressions.length > 0) {
  console.error(`❌ Coverage regression detected (threshold: -${threshold}%):`)
  for (const r of regressions) {
    console.error(`   ${r.dim}: ${r.base}% → ${r.curr}% (${r.delta.toFixed(2)}%)`)
  }
  console.error('\nFix: add tests to recover coverage before merging.')
  process.exit(1)
}

console.log(`✅ Coverage gate passed — no dimension dropped more than ${threshold}%`)
