# Story 8.1: Web Push Notifications (PWA)

Status: ready-for-dev

## Story

As a **tree owner**,
I want to **nhận push notification trên browser khi có ảnh mới hoặc update về cây của tôi**,
so that **tôi không bỏ lỡ bất kỳ update nào mà không cần check email hay mở app**.

## Acceptance Criteria

1. **Given** user đã đăng nhập và vào trang `/crm/admin/settings` (hoặc `/crm/my-garden`)
   **When** user click "Bật thông báo"
   **Then** browser hiển thị permission prompt (Notification API)
   **And** nếu user chấp nhận → subscription được lưu vào bảng `push_subscriptions`

2. **Given** push subscription đã được lưu
   **When** admin upload ảnh mới cho một lô (trigger từ `photoUpload` action)
   **Then** web push notification xuất hiện trên desktop/mobile browser trong vòng 30 giây
   **And** notification body: "Cây của bạn có ảnh mới! 🌳"
   **And** click notification → navigate đến `/crm/my-garden/[orderId]`

3. **Given** push subscription đã được lưu
   **When** admin gán lô cây mới cho user (trigger từ `assignOrderToLot` action)
   **Then** push notification: "Cây của bạn đã được trồng! Xem vị trí ngay"

4. **Given** user đã subscribe push notifications
   **When** user vào tab Notifications trong Settings
   **Then** hiển thị status "Đang bật" + nút "Tắt thông báo"
   **And** click "Tắt thông báo" → unsubscribe + xóa subscription khỏi DB

5. **Given** user chưa subscribe
   **When** xem tab Notifications trong Settings
   **Then** hiển thị nút "Bật thông báo" + mô tả lợi ích

6. **Given** endpoint `/api/push/vapid-public-key`
   **When** GET request
   **Then** trả về `{ publicKey: "<VAPID_PUBLIC_KEY>" }` (không cần auth)

7. **Given** browser không hỗ trợ Push API hoặc user từ chối
   **When** subscribe thất bại
   **Then** hiển thị graceful error message (không crash)

## Tasks / Subtasks

- [ ] Task 1: Supabase migration — `push_subscriptions` table (AC: 1, 4)
  - [ ] 1.1 Tạo file migration `supabase/migrations/YYYYMMDD_push_subscriptions.sql`
  - [ ] 1.2 Schema: `id uuid pk`, `user_id uuid FK auth.users`, `endpoint text unique`, `p256dh text`, `auth text`, `user_agent text`, `created_at timestamptz`
  - [ ] 1.3 RLS: users chỉ đọc/xóa subscriptions của mình; server (service role) có thể insert + select

- [ ] Task 2: API Routes (AC: 1, 4, 6)
  - [ ] 2.1 `src/app/api/push/vapid-public-key/route.ts` — GET, return `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (no auth)
  - [ ] 2.2 `src/app/api/push/subscribe/route.ts` — POST, auth required, upsert subscription vào `push_subscriptions`
  - [ ] 2.3 `src/app/api/push/unsubscribe/route.ts` — DELETE, auth required, xóa subscription theo endpoint

- [ ] Task 3: Service Worker (AC: 2, 3, 7)
  - [ ] 3.1 Tạo `public/sw.js` — lắng nghe `push` event, hiển thị notification với `self.registration.showNotification()`
  - [ ] 3.2 Service worker lắng nghe `notificationclick` event → `clients.openWindow(url)` đến URL trong notification data
  - [ ] 3.3 Service worker handle `pushsubscriptionchange` event → re-subscribe tự động

- [ ] Task 4: Server Action `sendPushToUser` (AC: 2, 3)
  - [ ] 4.1 Tạo `src/actions/pushNotifications.ts` với `'use server'`
  - [ ] 4.2 Function `sendPushToUser(userId, payload)`: query `push_subscriptions` by `user_id`, gọi `webpush.sendNotification()` cho từng subscription
  - [ ] 4.3 Function `sendPushToLotOwners(lotId, payload)`: query orders linked to lot → gọi `sendPushToUser` cho mỗi user
  - [ ] 4.4 Xử lý lỗi: nếu endpoint expired (status 410) → xóa subscription khỏi DB tự động
  - [ ] 4.5 Cấu hình VAPID: `webpush.setVapidDetails(subject, publicKey, privateKey)` sử dụng env vars

- [ ] Task 5: Client hook `usePushNotifications` (AC: 1, 4, 5, 7)
  - [ ] 5.1 Tạo `src/hooks/usePushNotifications.ts`
  - [ ] 5.2 `registerServiceWorker()` — đăng ký `/sw.js`, return registration
  - [ ] 5.3 `subscribe()` — xin permission → `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) })` → POST `/api/push/subscribe`
  - [ ] 5.4 `unsubscribe()` — get current subscription → `subscription.unsubscribe()` → DELETE `/api/push/unsubscribe`
  - [ ] 5.5 `getPermissionStatus()` — return `'default' | 'granted' | 'denied'`
  - [ ] 5.6 Handle: browser không hỗ trợ (`'serviceWorker' in navigator`), iOS Safari quirks

- [ ] Task 6: NotificationSettings component (AC: 1, 4, 5)
  - [ ] 6.1 Tạo `src/components/crm/NotificationSettings.tsx` — "use client"
  - [ ] 6.2 Hiển thị 3 states: loading, subscribed (nút Tắt), unsubscribed (nút Bật)
  - [ ] 6.3 Tích hợp `usePushNotifications` hook
  - [ ] 6.4 Update tab "Notifications" trong `src/app/crm/admin/settings/page.tsx` để dùng component này

- [ ] Task 7: Integration với existing actions (AC: 2, 3)
  - [ ] 7.1 Trong `src/actions/photoUpload.ts`: sau khi upload ảnh thành công → gọi `sendPushToLotOwners(lotId, { title, body, url })`
  - [ ] 7.2 Trong `src/actions/assignOrderToLot.ts`: sau khi assign thành công → gọi `sendPushToUser(userId, { title, body, url })`

- [ ] Task 8: Tests (AC: 1–7)
  - [ ] 8.1 Unit test `src/actions/__tests__/pushNotifications.test.ts`: mock `web-push`, test `sendPushToUser` với subscription found/not found/expired
  - [ ] 8.2 Unit test `src/hooks/__tests__/usePushNotifications.test.ts`: mock navigator, test subscribe/unsubscribe/permission states
  - [ ] 8.3 Component test `src/components/crm/__tests__/NotificationSettings.test.tsx`: render các states, click handlers

## Dev Notes

### Architecture Overview

```
User Browser
  └─ sw.js (Service Worker) ← registered by usePushNotifications hook
  └─ /api/push/subscribe → push_subscriptions table (Supabase)

Admin Action (photoUpload / assignOrderToLot)
  └─ sendPushToUser(userId, payload)
       └─ SELECT push_subscriptions WHERE user_id = userId
       └─ webpush.sendNotification(subscription, JSON.stringify(payload))
            └─ Push Service (browser vendor: Google/Mozilla/Apple)
                 └─ sw.js: push event → showNotification()
                      └─ click → clients.openWindow(url)
```

### Key Technical Decisions

1. **`web-push` npm package** (server-side only) — thư viện chuẩn nhất cho Web Push Protocol với VAPID. Install: `npm install web-push @types/web-push`
2. **VAPID keys** — generate một lần: `npx web-push generate-vapid-keys`. Lưu vào `.env.local`:
   ```
   VAPID_SUBJECT=mailto:admin@dainganxanh.com.vn
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public_key>
   VAPID_PRIVATE_KEY=<private_key>
   ```
3. **Service Worker tại `/public/sw.js`** — Next.js serve static files từ `/public`, không cần config thêm. SW scope = root (`/`).
4. **`urlBase64ToUint8Array` helper** — cần thiết để convert VAPID public key từ base64 URL-safe sang Uint8Array cho `applicationServerKey`. Implement trong hook.
5. **iOS Safari hạn chế**: Web Push chỉ hoạt động trên iOS 16.4+ khi trang được Add to Home Screen (PWA). Cần show informational message cho iOS users.
6. **Upsert pattern**: dùng `supabase.from('push_subscriptions').upsert({ endpoint, ... }, { onConflict: 'endpoint' })` để handle duplicate subscriptions.
7. **Không dùng Supabase Edge Function** cho việc gửi push — gọi thẳng từ Server Action là đủ, đơn giản hơn.

### Existing Code Patterns — BẮT BUỘC Follow

- **Server Actions**: `'use server'` ở đầu file, export async functions, pattern giống `src/actions/assignOrderToLot.ts`
- **API Routes**: `import { createServerClient } from '@/lib/supabase/server'` cho auth; `createServiceRoleClient()` cho admin DB ops
- **Client hooks**: `'use client'` trong component/hook, dùng `createBrowserClient()` từ `@/lib/supabase/client`
- **Supabase client**: `createServerClient()` cho server-side auth check, `createServiceRoleClient()` cho DB writes không cần RLS
- **Error pattern**: return `{ success: false, error: string }` hoặc `{ success: true, data: T }` — xem `src/actions/withdrawals.ts`
- **Toast notifications**: dùng `useToast` hook từ `@/hooks/use-toast` cho user feedback

### DB Migration Template

```sql
-- push_subscriptions table
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.push_subscriptions enable row level security;

create policy "Users can manage own subscriptions"
  on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for fast lookup by user_id
create index idx_push_subscriptions_user_id on public.push_subscriptions(user_id);
```

### Service Worker Skeleton

```javascript
// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const { title = 'Đại Ngàn Xanh', body = '', url = '/crm/my-garden', icon = '/sapling-hands.png' } = data
  event.waitUntil(
    self.registration.showNotification(title, { body, icon, data: { url } })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data?.url ?? '/crm/my-garden')
  )
})
```

### Testing Approach

- **Unit tests dùng Jest** (không phải Vitest) — xem `src/actions/__tests__/assignOrderToLot.test.ts` để tham khảo pattern
- **Mock `web-push`**: `jest.mock('web-push', () => ({ setVapidDetails: jest.fn(), sendNotification: jest.fn() }))`
- **Mock `navigator.serviceWorker`**: dùng `Object.defineProperty(navigator, 'serviceWorker', { value: mockSW, configurable: true })`
- **Mock `Notification.permission`**: `Object.defineProperty(Notification, 'permission', { value: 'granted', configurable: true })`
- Coverage target: ≥ 80% cho `pushNotifications.ts` và `usePushNotifications.ts`

### File Locations

| File | Type | Note |
|------|------|------|
| `public/sw.js` | Service Worker | Static, no TS transpile |
| `src/app/api/push/vapid-public-key/route.ts` | API Route | No auth needed |
| `src/app/api/push/subscribe/route.ts` | API Route | Auth required |
| `src/app/api/push/unsubscribe/route.ts` | API Route | Auth required |
| `src/actions/pushNotifications.ts` | Server Action | `'use server'` |
| `src/hooks/usePushNotifications.ts` | Client Hook | `'use client'` |
| `src/components/crm/NotificationSettings.tsx` | Component | `'use client'` |
| `src/app/crm/admin/settings/page.tsx` | Page | MODIFY existing |
| `src/actions/photoUpload.ts` | Server Action | MODIFY — add push trigger |
| `src/actions/assignOrderToLot.ts` | Server Action | MODIFY — add push trigger |
| `supabase/migrations/YYYYMMDD_push_subscriptions.sql` | Migration | Apply via Supabase MCP |

### Environment Variables Required

```bash
# .env.local (add these)
VAPID_SUBJECT=mailto:admin@dainganxanh.com.vn
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<generate via: npx web-push generate-vapid-keys>
VAPID_PRIVATE_KEY=<from above command>
```

### References

- Web Push Protocol: [Source: _bmad-output/planning-artifacts/architecture.md#Technology Stack]
- Notifications table schema: [Source: src/lib/supabase/realtime.ts]
- Server Action pattern: [Source: src/actions/assignOrderToLot.ts]
- API Route pattern: [Source: src/app/api/camera/status/route.ts]
- Settings page: [Source: src/app/crm/admin/settings/page.tsx] — tab "notifications" already exists as placeholder

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
