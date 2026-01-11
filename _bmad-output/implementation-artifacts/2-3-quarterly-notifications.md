# Story 2.3: Quarterly Update Notifications

Status: done

## Story

As a **tree owner**,
I want to **nhận thông báo khi có ảnh mới**,
so that **tôi luôn engaged với cây của mình**.

## Acceptance Criteria

1. **Given** admin upload ảnh cho lô cây của tôi  
   **When** ảnh được tag đến cây của tôi  
   **Then** nhận push notification "Cây của bạn có ảnh mới!"

2. **And** nhận email với embedded photos

3. **When** click notification  
   **Then** land on tree detail page với ảnh mới

4. **And** In-app notification center hiển thị unread count

## Tasks / Subtasks

- [x] Task 1: Database Schema & Webhook (AC: 1)
  - [x] 1.1 Tạo `notifications` table
  - [x] 1.2 Enable Realtime for notifications table
  - [ ] 1.3 Configure Database Webhook for tree_photos INSERT (Manual step - see docs)
  - [x] 1.4 Tạo migration files (notifications, lots, tree_photos, RLS fix)

- [x] Task 2: Edge Function - Notification Trigger (AC: 1, 2)
  - [x] 2.1 Tạo `supabase/functions/notify-tree-update/index.ts`
  - [x] 2.2 Fetch affected users từ lot → orders → users
  - [x] 2.3 Create notification record in database
  - [x] 2.4 Send email via send-quarterly-update function

- [x] Task 3: Email Template (AC: 2)
  - [x] 3.1 Embed HTML template in send-quarterly-update function
  - [x] 3.2 Embed photo thumbnails
  - [x] 3.3 CTA: "Xem cây của bạn"

- [x] Task 4: Frontend - Realtime Subscription (AC: 1, 4)
  - [x] 4.1 Tạo `lib/supabase/client.ts` - browser client helper
  - [x] 4.2 Tạo `lib/supabase/realtime.ts` - subscription helper
  - [x] 4.3 Tạo `components/crm/NotificationBell.tsx` (with inline dropdown)
  - [x] 4.4 Subscribe to notifications channel on mount
  - [x] 4.5 Mark as read on click

- [x] Task 5: Deep Link Handling (AC: 3)
  - [x] 5.1 Parse notification data for orderId
  - [x] 5.2 Navigate to `/crm/my-garden/[orderId]`
  - [x] 5.3 Scroll to photos section (Added id="photos" anchor)

## Review Follow-ups (Code Review Findings)
- [x] [HIGH] Add scroll-to-photos anchor navigation (AC #3) - DONE
- [x] [MEDIUM] Add request body validation in notify-tree-update - DONE
- [x] [MEDIUM] Remove/guard console.log statements in realtime.ts - DONE
- [x] [LOW] Remove unused userId state in NotificationBell - DONE
- [x] [LOW] Add TypeScript error type guard in notify-tree-update - DONE

## Quality Improvements (Completed)
- [x] Use date-fns for formatTimeAgo instead of custom logic
- [x] Add unit tests for notification components (NotificationBell, realtime helpers)
- [x] Add E2E test for notification flow (Playwright)

## Dev Notes

### Architecture Compliance
- **Real-time Notifications:** Supabase Realtime (postgres_changes subscription)
- **Email:** Resend (existing `send-email` Edge Function)
- **Database:** New `notifications` table + Database Webhook
- **Edge Function:** `notify-tree-update` triggered by webhook

### Supabase Realtime Setup
```typescript
// lib/supabase/realtime.ts
import { createBrowserClient } from '@/lib/supabase/client'

export function subscribeToNotifications(userId: string, callback: (notification: any) => void) {
  const supabase = createBrowserClient()
  
  return supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe()
}
```

### Database Schema Addition
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL, -- 'tree_update', 'order_status', etc.
  title TEXT NOT NULL,
  body TEXT,
  data JSONB, -- { orderId: '...', photoUrl: '...', lotName: '...' }
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);

-- Enable Realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### Database Webhook Configuration
```sql
-- Configure in Supabase Dashboard → Database → Webhooks
-- Webhook URL: https://[project-ref].supabase.co/functions/v1/notify-tree-update
-- Events: INSERT on tree_photos table
-- HTTP Headers: Authorization: Bearer [service_role_key]
```

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#External-Services]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.3]
- [Source: docs/prd.md#FR-10]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
**Implementation Files:**
- src/lib/supabase/client.ts (NEW - Supabase browser client helper)
- src/lib/supabase/realtime.ts (NEW - Realtime subscription helpers)
- src/components/crm/NotificationBell.tsx (NEW - Bell icon with inline dropdown, uses date-fns)
- src/components/crm/PhotoGallery.tsx (MODIFIED - Added id="photos" anchor)
- supabase/functions/notify-tree-update/index.ts (NEW - Webhook handler with validation)
- supabase/functions/send-quarterly-update/index.ts (NEW - Email sender with embedded template)
- supabase/migrations/20260111_create_notifications_table.sql (NEW)
- supabase/migrations/20260111_create_lots_and_tree_photos.sql (NEW)
- supabase/migrations/20260111_fix_notifications_rls.sql (NEW - RLS policy fix)

**Test Files:**
- src/components/crm/__tests__/NotificationBell.test.tsx (NEW - Unit tests)
- src/lib/supabase/__tests__/realtime.test.ts (NEW - Unit tests)
- e2e/notification-flow.spec.ts (NEW - E2E tests)
- jest.config.ts (NEW - Jest configuration)
- jest.setup.ts (NEW - Jest setup)
- playwright.config.ts (NEW - Playwright configuration)
- package.json (MODIFIED - Added test scripts)
