# CI Pipeline Guide

## Overview

Pipeline chạy trên **GitHub Actions** với 5 jobs song song:

| Job | Trigger | Duration (est.) |
|-----|---------|----------------|
| Lint | push / PR | ~1 min |
| Unit Tests (Jest × 3 shards) | push / PR | ~3 min |
| E2E Tests (Playwright × 2 shards) | push / PR | ~8 min |
| Burn-in (× 3 E2E repeat) | push to `main` only | ~20 min |
| Report + Quality Gate | always | ~1 min |

## Secrets cần cấu hình

Vào **GitHub → Repository Settings → Secrets and variables → Actions** và thêm:

| Secret | Mô tả | Bắt buộc |
|--------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (cho E2E) | ✅ |
| `SLACK_CI_WEBHOOK` | Slack Incoming Webhook URL | ⚪ optional |

## Local CI Simulation

```bash
# Chạy toàn bộ CI pipeline locally
./scripts/ci-local.sh

# Chạy tests chỉ cho files đã thay đổi
./scripts/test-changed.sh main

# Flaky detection (3 lần)
BURN_IN_COUNT=3 ./scripts/burn-in.sh

# Chỉ test 1 tính năng
TEST_GREP="orders/cancel" BURN_IN_COUNT=5 ./scripts/burn-in.sh
```

## Quality Gates

- **P0 (Lint + Unit + E2E)**: phải pass 100% — CI block nếu fail
- **Burn-in**: chạy trên push to `main`, failure upload artifact 14 ngày

## Sharding

- Jest: 3 shards (`--shard=N/3`) — tối ưu cho 436 tests hiện tại
- Playwright: 2 shards — tối ưu cho E2E suite hiện tại

Điều chỉnh số shards nếu suite tăng > 2x.

## Artifacts

- Jest: JUnit XML + coverage report (7 ngày)
- Playwright: HTML report + traces/videos khi fail (7 ngày)
- Burn-in failure: HTML report + traces (14 ngày)

## Troubleshooting

**Tests pass locally nhưng fail trên CI?**
→ Chạy `./scripts/ci-local.sh` để mirror môi trường CI.

**Cache không hit?**
→ Kiểm tra `package-lock.json` có được commit không.

**E2E timeout?**
→ Tăng `timeout` trong `playwright.config.ts` cho CI environment.

**Playwright browser install fail?**
→ Đảm bảo `npx playwright install --with-deps chromium` chạy trước test.

## Badges

Thêm vào README:

```markdown
[![CI](https://github.com/deptrai/dainganxanh/actions/workflows/test.yml/badge.svg)](https://github.com/deptrai/dainganxanh/actions/workflows/test.yml)
```
