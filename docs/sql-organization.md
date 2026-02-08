# SQL Files Organization Summary

## 📊 Current Structure (Updated: 2026-01-15)

### ✅ Organized Locations

#### 1. `/supabase/migrations/` (40 files)
**Purpose:** All database schema migrations
- Core schema migrations (users, orders, trees)
- Feature migrations (notifications, referrals, withdrawals)
- RLS policies and security
- See `/supabase/migrations/README.md` for detailed documentation

#### 2. `/supabase/tests/` (5 files)
**Purpose:** Test SQL scripts for development and QA
- `quick-test.sql` - Quick database tests
- `seed-notification-test-data.sql` - Seed test data
- `test-notification-e2e.sql` - End-to-end notification tests
- `test-notification-manual.sql` - Manual notification testing
- `test-notification-system.sql` - System notification tests

#### 3. `/supabase/webhooks/` (2 files)
**Purpose:** Database webhook/trigger SQL
- `tree-health-notification.sql` - Tree health notifications
- `tree-photo-notification.sql` - Photo upload notifications

#### 4. `/database_schema.sql` (Root level)
**Purpose:** Reference schema documentation
- **Note:** This is for documentation only, not meant to be executed
- Shows current database structure as reference

#### 5. `/dainganxanh-landing/scripts/` (1 file)
**Purpose:** Utility scripts for data manipulation
- `add-test-contract-urls.sql` - Add test contract URLs to orders

## 📁 Directory Structure

```
/
├── database_schema.sql (Reference only)
├── supabase/
│   ├── migrations/
│   │   ├── README.md (Documentation)
│   │   ├── 00_setup_execute_sql_function.sql
│   │   ├── 20260110000000_create_users_table.sql
│   │   ├── ... (40 migration files)
│   │   └── 20260115_add_role_column_to_users.sql
│   ├── tests/
│   │   ├── quick-test.sql
│   │   ├── seed-notification-test-data.sql
│   │   ├── test-notification-e2e.sql
│   │   ├── test-notification-manual.sql
│   │   └── test-notification-system.sql
│   └── webhooks/
│       ├── tree-health-notification.sql
│       └── tree-photo-notification.sql
└── dainganxanh-landing/
    └── scripts/
        └── add-test-contract-urls.sql
```

## 🎯 Organization Principles

1. **Migrations** → `/supabase/migrations/` with timestamp naming
2. **Tests** → `/supabase/tests/` for testing scripts
3. **Webhooks** → `/supabase/webhooks/` for triggers
4. **Utilities** → `/dainganxanh-landing/scripts/` for helper scripts
5. **Reference** → Root level for documentation

## 📝 Naming Conventions

### Migrations
- Format: `YYYYMMDD[HHMMSS]_description.sql`
- Example: `20260115_add_role_column_to_users.sql`

### Tests
- Format: `test-[feature]-[type].sql`
- Example: `test-notification-e2e.sql`

### Scripts
- Format: `[action]-[description].sql`
- Example: `add-test-contract-urls.sql`

## ✅ Changes Made (2026-01-15)

1. ✅ Moved `add_role_column_migration.sql` → `supabase/migrations/20260115_add_role_column_to_users.sql`
2. ✅ Moved `dainganxanh-landing/test-notification.sql` → `supabase/tests/test-notification-manual.sql`
3. ✅ Consolidated duplicate `20260114154744_create_withdrawals_table.sql` to main migrations folder
4. ✅ Created `supabase/migrations/README.md` with comprehensive documentation
5. ✅ Kept `database_schema.sql` at root as reference document

## 🔍 Quick Reference

- **Total SQL files:** 48
- **Migrations:** 40 files
- **Tests:** 5 files
- **Webhooks:** 2 files
- **Scripts:** 1 file
- **Reference:** 1 file

## 📚 Related Documentation

- [Migrations README](/supabase/migrations/README.md)
- [Project PRD](/docs/prd.md)
- [Supabase Setup Guide](/dainganxanh-landing/docs/supabase-setup-guide.md)

