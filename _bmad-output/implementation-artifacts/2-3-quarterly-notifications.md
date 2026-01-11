# Story 2.3: Quarterly Update Notifications

Status: ready-for-dev

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

- [ ] Task 1: Database Schema & Webhook (AC: 1)
  - [ ] 1.1 Tạo `notifications` table
  - [ ] 1.2 Enable Realtime for notifications table
  - [ ] 1.3 Configure Database Webhook for tree_photos INSERT
  - [ ] 1.4 Tạo migration file

- [ ] Task 2: Edge Function - Notification Trigger (AC: 1, 2)
  - [ ] 2.1 Tạo `supabase/functions/notify-tree-update/index.ts`
  - [ ] 2.2 Fetch affected users từ lot → orders → users
  - [ ] 2.3 Create notification record in database
  - [ ] 2.4 Send email via existing send-email function

- [ ] Task 3: Email Template (AC: 2)
  - [ ] 3.1 Tạo `email-templates/quarterly-update.html`
  - [ ] 3.2 Embed photo thumbnails
  - [ ] 3.3 CTA: "Xem cây của bạn"
  - [ ] 3.4 Update send-email function to support new template

- [ ] Task 4: Frontend - Realtime Subscription (AC: 1, 4)
  - [ ] 4.1 Tạo `lib/supabase/realtime.ts` - subscription helper
  - [ ] 4.2 Tạo `components/crm/NotificationBell.tsx`
  - [ ] 4.3 Tạo `components/crm/NotificationDropdown.tsx`
  - [ ] 4.4 Subscribe to notifications channel on mount
  - [ ] 4.5 Mark as read on click

- [ ] Task 5: Deep Link Handling (AC: 3)
  - [ ] 5.1 Parse notification data for orderId
  - [ ] 5.2 Navigate to `/crm/my-garden/[orderId]`
  - [ ] 5.3 Scroll to photos section

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
- src/lib/supabase/realtime.ts (NEW)
- src/components/crm/NotificationBell.tsx (NEW)
- src/components/crm/NotificationDropdown.tsx (NEW)
- supabase/functions/notify-tree-update/index.ts (NEW)
- supabase/migrations/[timestamp]_create_notifications_table.sql (NEW)
- email-templates/quarterly-update.html (NEW)
- supabase/functions/send-email/index.ts (MODIFY - add template support)
