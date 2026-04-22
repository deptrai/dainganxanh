---
workflowType: 'testarch-ci-recommendations'
lastSaved: '2026-04-21'
relatedReports:
  - test-review.md (officialScore 84 B+)
  - traceability-report.md (Gate 🟢 PASS)
  - nfr-assessment.md (Epic 7 Blog delta)
  - remediation-playbook.md (G11/G12/G13)
existingWorkflow: .github/workflows/test.yml (384 lines)
---

# CI Quality Pipeline Recommendations — Augment, Don't Replace

**Context**: `test.yml` đã có coverage sharding, burn-in flaky detection, coverage aggregation. Tài liệu này đề xuất **bổ sung** chứ không thay thế.

**Current state (test.yml)**:
- ✅ Jest shard matrix `--coverage --coverageDirectory=coverage/shard-${{ matrix.shard }}` (L64-65)
- ✅ Coverage artifact upload (L80)
- ✅ Burn-in / flaky detection section (L189)
- ✅ `find all-artifacts -name "coverage-summary.json"` aggregation (L320)

**Gaps** (derived from NFR appendix + remediation playbook):
1. Không có coverage **gate** — tests pass nhưng coverage có thể tụt mà PR vẫn merge
2. Chưa có Lighthouse CI → SEO/Perf NFR (LCP ≤ 2.5s) không được enforce (P1 action từ BNR-2)
3. Flaky burn-in metrics không được surface lên PR comment
4. Score trajectory (82→84→86) phải update manual — không có automation
5. Gate thresholds của trace report (P1 ≥ 90%, NONE ≤ 15%) chưa được CI enforce

---

## R1 — Coverage Ratchet Gate (P1, ~2h setup)

### Problem
Coverage có thể drop 84% → 70% mà CI vẫn green nếu tests pass.

### Recommendation
Add job `coverage-gate` sau step aggregation (~L320):

```yaml
coverage-gate:
  needs: test
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
      with: { ref: ${{ github.base_ref }} }
    - name: Fetch baseline coverage from main
      run: |
        gh api repos/${{ github.repository }}/actions/artifacts \
          --jq '.artifacts[] | select(.name=="coverage-summary-main") | .archive_download_url' \
          | head -1 | xargs curl -L -o baseline.zip
        unzip baseline.zip -d baseline/
    - uses: actions/download-artifact@v4
      with: { name: coverage-summary, path: current/ }
    - name: Compare and fail if regression > 2%
      run: |
        node scripts/ci/compare-coverage.js \
          --baseline baseline/coverage-summary.json \
          --current current/coverage-summary.json \
          --threshold 2.0
```

### `scripts/ci/compare-coverage.js` (new file sketch)
```js
// Fail if lines/branches/functions coverage drops > threshold %
const baseline = require(args.baseline)
const current = require(args.current)
const dims = ['lines', 'branches', 'functions', 'statements']
const regressions = dims
  .map(d => ({ d, delta: current.total[d].pct - baseline.total[d].pct }))
  .filter(r => r.delta < -args.threshold)
if (regressions.length) {
  console.error('Coverage regressions:', regressions)
  process.exit(1)
}
```

### Success criteria
- PR khối nếu branch coverage tụt > 2%
- Baseline auto-update khi merge main

---

## R2 — Lighthouse CI for Blog (P1, ~3h setup)

**Links NFR**: BNR-2 (SEO Performance risk), FR-30 SEO Core, LCP ≤ 2.5s target.

### Recommendation
New job `lighthouse-blog` triggered on PR touching `src/app/(public)/blog/**` or `src/components/blog/**`:

```yaml
lighthouse-blog:
  runs-on: ubuntu-latest
  if: contains(github.event.pull_request.changed_files, 'blog')
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: 22 }
    - run: npm ci && npm run build
    - run: npm install -g @lhci/cli@0.14
    - name: Run Lighthouse CI
      run: lhci autorun
      env:
        LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

### `lighthouserc.js` (new file sketch)
```js
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      url: [
        'http://localhost:3000/blog',
        'http://localhost:3000/blog/cay-do-den-la-gi', // sample slug
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
}
```

### Success criteria
- Block merge nếu LCP > 2.5s trên `/blog/[slug]`
- SEO score < 95 → error
- A11y score < 90 → warn (không block, Epic 7 chưa full A11y audit)

---

## R3 — Flaky Test Dashboard (P2, ~4h setup)

### Problem
Burn-in section (L189) detect flaky nhưng không visualize → dev không biết test nào flaky nhất.

### Recommendation
Append to burn-in job:

```yaml
- name: Aggregate burn-in results
  run: |
    node scripts/ci/flaky-report.js \
      --runs burn-in-results/ \
      --output flaky-report.md
- name: Post flaky report as PR comment
  if: github.event_name == 'pull_request'
  uses: marocchino/sticky-pull-request-comment@v2
  with:
    header: flaky-tests
    path: flaky-report.md
```

### `scripts/ci/flaky-report.js` output format
```markdown
## 🎲 Flaky Test Report (last 5 burn-in runs)

| Test | Pass Rate | Trend | Severity |
|---|---|---|---|
| BlogEditor > uploads cover | 3/5 | ⬇️ | 🔴 HIGH |
| createPost > slug conflict | 4/5 | ➡️ | 🟡 MED |

**Recommendation**: Quarantine tests with < 80% pass rate (`test.skip` + GitHub issue).
```

### Success criteria
- PR comment auto-update mỗi run
- Link GitHub issue cho mỗi flaky test (auto-create via `gh issue create`)

---

## R4 — Score Trajectory Automation (P3, ~2h setup)

### Problem
`test-review.md` score trajectory table phải update manual mỗi session.

### Recommendation
New workflow `.github/workflows/quality-score-update.yml` on push to main:

```yaml
name: Quality Score Trajectory
on:
  push:
    branches: [main]
    paths: ['src/**', '**/*.test.*', '**/*.spec.*']

jobs:
  update-trajectory:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run quality scorer
        run: node scripts/ci/calculate-quality-score.js
      - name: Append to trajectory table
        run: |
          node scripts/ci/update-review-trajectory.js \
            --review _bmad-output/test-artifacts/test-review.md \
            --score $(cat quality-score.json | jq .overall)
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: 'chore(quality): update score trajectory [skip ci]'
          file_pattern: '_bmad-output/test-artifacts/test-review.md'
```

### Quality scorer formula (matches RV methodology)
```js
score = det * 0.30 + iso * 0.30 + maint * 0.25 + perf * 0.15
// det: pass rate of last 5 runs
// iso: % tests without shared state leaks (static analysis)
// maint: avg tests per file + assertion density
// perf: p95 test duration / target
```

### Success criteria
- Trajectory table tự bump mỗi merge
- Alert Slack nếu score drop > 3 points

---

## R5 — Trace Gate Enforcement (P2, ~3h setup)

### Problem
Gate criteria từ `traceability-report.md`:
- P1 tests ≥ 90% coverage
- P0 FULL/STRONG ≥ 85%
- NONE ≤ 15%

Không có CI check.

### Recommendation
Parse test file tags `[P0]`, `[P1]`, `[P2]` và enforce ratios:

```yaml
trace-gate:
  needs: test
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Parse priority tags
      run: node scripts/ci/parse-priority-tags.js > tags.json
    - name: Enforce gate thresholds
      run: |
        node scripts/ci/enforce-trace-gate.js \
          --tags tags.json \
          --p0-full-strong 85 \
          --p1-coverage 90 \
          --none-max 15
```

### `scripts/ci/parse-priority-tags.js` sketch
```js
// Scan *.test.{ts,tsx} for `[P0]`, `[P1]`, `[P2]` markers
// Count per priority
// Cross-ref with coverage report to compute FULL/PARTIAL/NONE per FR-ID
```

### Success criteria
- PR fail nếu NONE > 15%
- PR fail nếu P1 < 90%
- Auto-comment breakdown trên PR

---

## Priority Roadmap

| Week | Recommendation | Effort | ROI |
|---|---|---|---|
| W1 | R1 Coverage Ratchet | 2h | 🔥 High — prevent silent regressions |
| W1 | R2 Lighthouse CI | 3h | 🔥 High — BNR-2 blocker |
| W2 | R5 Trace Gate | 3h | 🟡 Med — enforce existing contract |
| W3 | R3 Flaky Dashboard | 4h | 🟡 Med — quality-of-life |
| W4 | R4 Score Automation | 2h | 🟢 Low — nice-to-have |

**Total**: ~14h — spread across 4 weeks.

---

## Integration Points

### With `remediation-playbook.md`
- R2 Lighthouse runs after G13 A11y fix → validates aria-label improves accessibility score
- R1 Coverage Ratchet captures 84→86 lift once G11/G12/G13 applied

### With `nfr-assessment.md` (Epic 7 delta)
- R2 directly addresses **BNR-2** (Perf), partially addresses **BNR-3** (A11y)
- R5 enforces **BNR-6** (test coverage drift for blog domain)

### With `test-review.md`
- R4 auto-updates the score trajectory table — no more manual RV session entries
- R3 flaky dashboard feeds into Determinism dimension (30% weight)

---

## Non-Goals

- ❌ **Replace** existing test.yml — all recommendations are **additive**
- ❌ Add Cypress or Playwright E2E CI (Playwright E2E is already out-of-scope per PRD Epic 7)
- ❌ Auto-merge on green — PR still needs human approval
- ❌ Block on Lighthouse A11y score < 90 (warn only until full A11y audit done)

---

## Success Metrics (after 4 weeks)

- Coverage regressions caught pre-merge: **100%**
- Blog LCP violations blocked: **100%**
- Flaky test median resolution time: **< 7 days** (from surfacing in dashboard)
- Manual score update overhead: **0 min/session** (was ~10 min)
- False positive rate on gate: **< 5%** (critical — too many false fails erodes trust)

---

**Next**: After R1 + R2 land, re-run `/bmad-testarch-test-review` to verify CI automation itself doesn't introduce flakiness; then proceed with remediation-playbook.md execution to lock in 86/A-.
