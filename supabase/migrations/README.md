# Database Migrations

This directory contains all database migrations for the Đại Ngàn Xanh project.

## 📁 Structure

All migration files follow the naming convention:
```
YYYYMMDD[HHMMSS]_description.sql
```

Example: `20260115_add_role_column_to_users.sql`

## 🔄 Migration Categories

### Core Schema (2026-01-10)
- `20260110000000_create_users_table.sql` - Base users table
- `20260110010000_disable_trigger_temp.sql` - Temporary trigger fix
- `20260110020000_fix_trigger.sql` - Trigger fix

### Orders & Trees (2026-01-11)
- `20260111_create_orders_table.sql` - Orders table
- `20260111_create_lots_and_tree_photos.sql` - Lots and tree photos
- `20260111_package_based_garden.sql` - Package system
- `20260111_add_contract_pdf_path.sql` - Contract storage
- `20260111_create_notifications_table.sql` - Notifications
- `20260111_fix_notifications_rls.sql` - RLS policies

### Trees Management (2026-01-12)
- `20260112_create_trees_table.sql` - Trees table
- `20260112_fix_trees_table_schema.sql` - Schema fixes
- `20260112_add_trees_rls_policies.sql` - RLS policies
- `20260112_add_assigned_status.sql` - Order status
- `20260112_add_lots_planted_field.sql` - Lot tracking
- `20260112_fix_service_role_policies.sql` - Service role access

### Field Operations (2026-01-13)
- `20260113_add_gps_to_tree_photos.sql` - GPS tracking
- `20260113_add_tree_id_to_tree_photos.sql` - Photo linking
- `20260113_add_tree_health_status.sql` - Health tracking
- `20260113_create_tree_health_logs.sql` - Health logs
- `20260113_create_tree_health_logs_simple.sql` - Simplified version
- `20260113_create_follow_up_tasks.sql` - Task management
- `20260113_create_follow_up_tasks_simple.sql` - Simplified version
- `20260113_create_replacement_tasks.sql` - Tree replacement
- `20260113_create_replacement_tasks_simple.sql` - Simplified version
- `20260113_create_print_queue.sql` - Contract printing
- `20260113_create_contracts_bucket.sql` - Storage bucket
- `20260113_add_contract_url_to_orders.sql` - Contract URLs

### Admin & Features (2026-01-14)
- `20260114_add_referred_by_to_orders.sql` - Referral system
- `20260114_create_referral_clicks.sql` - Referral tracking
- `20260114_create_admin_preferences.sql` - Admin settings
- `20260114_create_email_templates.sql` - Email templates
- `20260114_create_field_checklists.sql` - Field checklists
- `20260114_create_system_config.sql` - System configuration
- `20260114154744_create_withdrawals_table.sql` - Withdrawals
- `20260114_add_trees_update_policy.sql` - Update policies

### User Management (2026-01-15)
- `20260115_add_role_column_to_users.sql` - Role-based access control

## 🚀 How to Apply Migrations

### Using Supabase CLI
```bash
# Apply all pending migrations
supabase db push

# Reset database and apply all migrations
supabase db reset
```

### Manual Application
```bash
# Connect to database
psql -h <host> -U <user> -d <database>

# Run migration file
\i supabase/migrations/YYYYMMDD_description.sql
```

## 📝 Creating New Migrations

1. **Use timestamp format**: `YYYYMMDD_description.sql`
2. **Be descriptive**: Use clear, concise descriptions
3. **Include comments**: Document what the migration does
4. **Use IF NOT EXISTS**: Make migrations idempotent when possible
5. **Test locally first**: Always test on local database before production

### Example Template
```sql
-- Migration: [Description]
-- Date: YYYY-MM-DD
-- Purpose: [Why this migration is needed]

-- Step 1: [Description]
ALTER TABLE table_name 
ADD COLUMN IF NOT EXISTS column_name TYPE;

-- Step 2: [Description]
CREATE INDEX IF NOT EXISTS idx_name ON table_name(column_name);

-- Verification query (optional)
SELECT * FROM table_name LIMIT 1;
```

## ⚠️ Important Notes

1. **Never modify existing migrations** - Create new ones to fix issues
2. **Migrations run in order** - Timestamp determines execution order
3. **RLS policies** - Always consider Row Level Security when creating tables
4. **Foreign keys** - Ensure referenced tables exist before creating FKs
5. **Indexes** - Add indexes for frequently queried columns

## 🔍 Related Files

- `/database_schema.sql` - Current schema reference (root level)
- `/supabase/tests/` - Test SQL scripts
- `/dainganxanh-landing/scripts/` - Migration helper scripts

## 📚 Resources

- [Supabase Migrations Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Project PRD](/docs/prd.md)

