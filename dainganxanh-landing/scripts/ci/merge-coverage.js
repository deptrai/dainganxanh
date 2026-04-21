#!/usr/bin/env node
/**
 * merge-coverage.js
 *
 * Merges coverage-summary.json files from Jest shards into a single
 * coverage-summary.json, summing covered/total counts then recomputing pct.
 *
 * Usage:
 *   node scripts/ci/merge-coverage.js \
 *     --input all-artifacts/jest-results-shard-1/coverage-summary.json [...] \
 *     --output merged-coverage-summary.json
 *
 * Output shape matches jest's native coverage-summary.json:
 *   { total: { lines: { total, covered, skipped, pct }, branches: {...}, ... } }
 */

const fs = require('fs')
const path = require('path')

// ── Parse CLI args ────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const inputIdx = args.indexOf('--input')
const outputIdx = args.indexOf('--output')

if (inputIdx === -1 || outputIdx === -1) {
  console.error('Usage: merge-coverage.js --input <glob-expanded-files...> --output <file>')
  process.exit(1)
}

// Everything between --input and --output (or end) is treated as input files
const outputFile = args[outputIdx + 1]
const inputFiles = args.slice(inputIdx + 1, outputIdx === inputIdx + 1 ? undefined : outputIdx)
  .filter((a) => !a.startsWith('--'))

if (inputFiles.length === 0) {
  console.error('No input files provided.')
  process.exit(1)
}

// ── Merge ─────────────────────────────────────────────────────────────────────
const DIMS = ['lines', 'branches', 'functions', 'statements']

const merged = { total: {} }
for (const dim of DIMS) {
  merged.total[dim] = { total: 0, covered: 0, skipped: 0, pct: 0 }
}

let fileCount = 0
for (const file of inputFiles) {
  if (!fs.existsSync(file)) {
    console.warn(`⚠️  File not found, skipping: ${file}`)
    continue
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  const totals = data.total
  if (!totals) {
    console.warn(`⚠️  No .total key in ${file}, skipping`)
    continue
  }
  for (const dim of DIMS) {
    if (!totals[dim]) continue
    merged.total[dim].total += totals[dim].total ?? 0
    merged.total[dim].covered += totals[dim].covered ?? 0
    merged.total[dim].skipped += totals[dim].skipped ?? 0
  }
  fileCount++
}

if (fileCount === 0) {
  console.error('No valid coverage-summary.json files found.')
  process.exit(1)
}

// Recompute pct
for (const dim of DIMS) {
  const { total, covered } = merged.total[dim]
  merged.total[dim].pct = total > 0 ? parseFloat(((covered / total) * 100).toFixed(2)) : 100
}

// ── Write output ──────────────────────────────────────────────────────────────
fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true })
fs.writeFileSync(outputFile, JSON.stringify(merged, null, 2))

console.log(`✅ Merged ${fileCount} shard(s) → ${outputFile}`)
for (const dim of DIMS) {
  const { covered, total, pct } = merged.total[dim]
  console.log(`   ${dim.padEnd(12)}: ${covered}/${total} (${pct}%)`)
}
