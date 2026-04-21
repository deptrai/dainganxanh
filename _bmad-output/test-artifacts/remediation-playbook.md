---
workflowType: 'testarch-remediation-playbook'
lastSaved: '2026-04-21'
relatedReports:
  - test-review.md (Session 6 — 84/100 B+)
  - traceability-report.md (Step 8 — Gate 🟢 PASS)
targetScore: 86
---

# Remediation Playbook — Session 6 LOW Gaps (G11/G12/G13)

**Scope**: 3 LOW-severity gaps in `src/components/admin/blog/__tests__/BlogEditor.test.tsx` identified during Session 6 trace/review.

**Goal**: Promote test quality 84/100 (B+) → 86/100 (A-) and harden BlogEditor tests against future churn.

**Effort**: ~30 phút tổng (2 file changes production + 3 mock-pattern changes test).

---

## G13 — Toolbar Selector Coupling (SHOULD fix, A11y dual-benefit)

### Problem
```ts
// test file lines 344-360
await user.click(screen.getByTitle('Bold'))
await user.click(screen.getByTitle('Heading 2'))
await user.click(screen.getByTitle('Chèn ảnh từ URL'))
```

`getByTitle` couples tests to the HTML `title` attribute — a tooltip-only concern. Screen readers primarily rely on `aria-label`. An A11y audit that replaces `title` with `aria-label` silently breaks tests.

### Fix — Production (`src/components/admin/blog/BlogEditor.tsx`)

**Before**:
```tsx
<button type="button" title="Bold" onClick={...}>
  <BoldIcon />
</button>
```

**After**:
```tsx
<button
  type="button"
  aria-label="Bold"
  title="Bold"
  onClick={...}
>
  <BoldIcon />
</button>
```

Keep `title` for sighted users (tooltip); add `aria-label` for screen readers & test-friendly role queries. Apply to all toolbar buttons: Bold, Italic, Heading 2, Heading 3, Bullet List, Ordered List, Blockquote, Code Block, Link, Image upload, Image from URL.

### Fix — Test (AFTER production change)

**Before**:
```ts
await user.click(screen.getByTitle('Bold'))
```

**After**:
```ts
await user.click(screen.getByRole('button', { name: /bold/i }))
await user.click(screen.getByRole('button', { name: /heading 2/i }))
await user.click(screen.getByRole('button', { name: /chèn ảnh từ url/i }))
```

### Why this is better
- `getByRole` is Testing Library's top recommendation (queries by accessible name → reflects real user experience)
- Tests document & enforce A11y contract
- Resilient to `title` attr refactors

### Verification
```bash
npx jest src/components/admin/blog/__tests__/BlogEditor.test.tsx
```

---

## G11 — Positional File Input Selector (NICE fix)

### Problem
```ts
// test file lines 239-241
const fileInputs = document.querySelectorAll('input[type="file"]')
const coverFileInput = fileInputs[fileInputs.length - 1] as HTMLInputElement
```

Comment acknowledges the fragility: *"First is editor toolbar upload, second is cover upload"*. Adding a new file input (e.g., for attachments, gallery import) silently shifts index and tests target wrong element.

### Fix — Production (`src/components/admin/blog/BlogEditor.tsx`)

**Before**:
```tsx
<label className="cursor-pointer ...">
  <input type="file" accept="image/*" onChange={handleCoverUpload} hidden />
  <span>Upload cover</span>
</label>
```

**After**:
```tsx
<label className="cursor-pointer ...">
  <input
    type="file"
    accept="image/*"
    onChange={handleCoverUpload}
    data-testid="cover-file-input"
    hidden
  />
  <span>Upload cover</span>
</label>
```

### Fix — Test

**Before**:
```ts
const fileInputs = document.querySelectorAll('input[type="file"]')
const coverFileInput = fileInputs[fileInputs.length - 1] as HTMLInputElement
```

**After**:
```ts
const coverFileInput = screen.getByTestId('cover-file-input') as HTMLInputElement
```

### Why this is better
- Explicit contract between component and test
- Order-independent
- Diff-friendly (adding a new `input[type="file"]` no longer breaks unrelated tests)

---

## G12 — Runtime Monkey-Patch of StarterKit (NICE fix)

### Problem
```ts
// test file lines 74-78
beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sk = require('@tiptap/starter-kit').default as any
  sk.configure = () => ({})
})
```

Issues:
1. **Side-effect leak**: mutation persists across test files if they run in same worker
2. **Order-dependent**: if another test file imports StarterKit with `.configure()` expecting real behavior, it sees the stub
3. **Bypasses Jest's `jest.mock` hoisting** — the patch runs after modules load

### Fix — Move into `jest.mock` factory

**Before** (test file — 3 separate blocks at lines 59, 74-78):
```ts
jest.mock('@tiptap/starter-kit', () => ({ __esModule: true, default: {} }))

// ...

beforeAll(() => {
  const sk = require('@tiptap/starter-kit').default as any
  sk.configure = () => ({})
})
```

**After** (single hoisted mock):
```ts
jest.mock('@tiptap/starter-kit', () => ({
  __esModule: true,
  default: {
    configure: () => ({}),
  },
}))

// Remove the beforeAll block entirely
```

### Why this is better
- `jest.mock` is hoisted — the mock exists before any import resolves
- No mutation of shared module state
- Idiomatic Jest — matches how other Tiptap extensions are mocked in the same file (extension-image, extension-link, extension-placeholder)
- Test file runs same behavior whether alone or in suite

### Verification
```bash
# Run in isolation
npx jest BlogEditor.test.tsx

# Run alongside other Tiptap-consuming tests
npx jest --testPathPattern='tiptap|blog|editor'
```

---

## Projected Score Impact

| Dimension | Current (S6) | After G13 | After G11 | After G12 | Final |
|---|---|---|---|---|---|
| Determinism (30%) | 81 | 81 | 81 | 82 | 82 |
| Isolation (30%) | 84 | 84 | 84 | 86 | 86 |
| Maintainability (25%) | 83 | 86 | 88 | 88 | 88 |
| Performance (15%) | 89 | 89 | 89 | 89 | 89 |
| **Overall** | **84 (B+)** | 84.9 | 85.4 | 86.2 | **86 (A-)** |

**Grade promotion**: B+ → **A-** after all three fixes.

---

## Execution Checklist

- [ ] **G13a** — Add `aria-label` to 11 toolbar buttons in `BlogEditor.tsx` (keep `title` for tooltip)
- [ ] **G13b** — Replace 3 `getByTitle` calls with `getByRole` in `BlogEditor.test.tsx:344-360`
- [ ] **G11a** — Add `data-testid="cover-file-input"` to cover input in `BlogEditor.tsx`
- [ ] **G11b** — Replace `querySelectorAll` block with `getByTestId` in `BlogEditor.test.tsx:239-254`
- [ ] **G12** — Collapse `jest.mock('@tiptap/starter-kit')` + `beforeAll` patch into single factory mock
- [ ] Run `npx jest BlogEditor.test.tsx` — verify 28/28 pass
- [ ] Run full suite — verify no cross-file regressions
- [ ] Update `test-review.md` officialScore 84 → 86 + session 7 entry
- [ ] Update `traceability-report.md` — mark G11/G12/G13 closed

---

## Accessibility Bonus

The G13 fix delivers tangible A11y value beyond test-quality:

**Before**: Screen-reader users hear "button" for toolbar icons (no accessible name).

**After**: Screen-reader users hear "Bold button", "Heading 2 button", etc.

This aligns with WCAG 2.1 SC 4.1.2 (Name, Role, Value) and is a prerequisite for any future A11y audit.

---

**Next**: After executing this playbook, re-run `/bmad-testarch-test-review` with `reviewScope: delta` to confirm score 86/100 (A-).
