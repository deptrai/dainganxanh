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

- [ ] Task 1: Push Notification Setup (AC: 1, 3)
  - [ ] 1.1 Setup Firebase Cloud Messaging (FCM)
  - [ ] 1.2 Request notification permission on login
  - [ ] 1.3 Store FCM token trong user profile
  - [ ] 1.4 Service worker cho background notifications

- [ ] Task 2: Notification Trigger (AC: 1)
  - [ ] 2.1 Database trigger khi tree_photos insert
  - [ ] 2.2 Tạo `supabase/functions/notify-tree-update/index.ts`
  - [ ] 2.3 Fetch affected users từ trees → orders → users
  - [ ] 2.4 Send FCM push notification

- [ ] Task 3: Email Notification (AC: 2)
  - [ ] 3.1 Update `supabase/functions/send-email/index.ts`
  - [ ] 3.2 Template: `quarterly-update.html`
  - [ ] 3.3 Embed photo thumbnails
  - [ ] 3.4 CTA: "Xem cây của bạn"

- [ ] Task 4: In-App Notification Center (AC: 4)
  - [ ] 4.1 Tạo `notifications` table trong database
  - [ ] 4.2 Tạo `components/crm/NotificationBell.tsx`
  - [ ] 4.3 Tạo `components/crm/NotificationDropdown.tsx`
  - [ ] 4.4 Mark as read on click

- [ ] Task 5: Deep Link Handling (AC: 3)
  - [ ] 5.1 Parse notification data for treeId
  - [ ] 5.2 Navigate to `/crm/my-garden/[treeId]`
  - [ ] 5.3 Scroll to new photos section

## Dev Notes

### Architecture Compliance
- **Push:** Firebase Cloud Messaging (FCM)
- **Email:** SendGrid (existing)
- **Database:** New `notifications` table

### FCM Setup
```bash
npm install firebase
```

```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app'
import { getMessaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // ...
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
  data JSONB, -- { treeId: '...', photoUrl: '...' }
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
```

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#External-Services]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.3]
- [Source: docs/prd.md#FR-10]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- src/lib/firebase.ts
- src/components/crm/NotificationBell.tsx
- src/components/crm/NotificationDropdown.tsx
- supabase/functions/notify-tree-update/index.ts
- supabase/migrations/[timestamp]_create_notifications_table.sql
- email-templates/quarterly-update.html
- public/firebase-messaging-sw.js
