# Database Schema (User Provided 2026-01-12)

## Tables
- **trees**: id, code (UNIQUE), order_id, user_id, status, created_at. (Missing lot_id, planted_at in this dump?? User dump might be partial or I misread? User dump has `order_id`, `user_id`, `code`, `status`.)
- **orders**: id, code, quantity, status, tree_status, lot_id, etc.
- **lots**: id, name, region, planted, total_trees.
- **email_logs**, **notifications**, **tree_photos**, **users**.

## Constraints & RLS
- **trees**: 
  - `code` UNIQUE
  - RLS: "Service role can manage trees" (ALL), "Users can view their own trees" (SELECT).
  - **CRITICAL**: No INSERT policy for authenticated users.

This schema is used for reference to avoid false negatives when checking table existence.