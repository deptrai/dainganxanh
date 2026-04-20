---
stepsCompleted: ['step-01-preflight', 'step-02-generate-pipeline', 'step-03-configure-quality-gates', 'step-04-validate-and-summary']
lastStep: 'step-04-validate-and-summary'
lastSaved: '2026-04-21'
---

## Step 1: Preflight

- **Git**: origin https://github.com/deptrai/dainganxanh.git
- **Test stack**: fullstack (Next.js + Jest + Playwright)
- **Test framework**: Jest (unit/integration) + Playwright (E2E)
- **CI Platform**: github-actions
- **Node version**: v25.9.0 (no .nvmrc — using Node 20 LTS in CI)
- **Tests**: 436/436 pass (fixed missing rate-limit/monitoring mocks in `orders/cancel/__tests__/route.test.ts`)

## Step 2: Generate Pipeline

- **Output**: `.github/workflows/test.yml`
- **Template**: generated from first principles (no template file found)
- **Stages**:
  - `lint`: Next.js ESLint
  - `unit-tests`: Jest, 3 shards, JUnit XML + coverage artifacts
  - `e2e-tests`: Playwright, 2 shards, HTML report + traces on failure
  - `burn-in`: 3x E2E repeat on `main` push (flaky detection)
  - `report`: aggregate all artifacts, GitHub Step Summary
- **Dependencies added**: `jest-junit@^16.0.0`
- **Security**: all `${{ inputs.* }}` / `${{ github.event.* }}` routed through `env:` intermediaries
