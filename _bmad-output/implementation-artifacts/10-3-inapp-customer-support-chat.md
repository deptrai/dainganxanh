# Story 10.3: In-app Customer Support Chat

Status: ready-for-dev

## Story

As a **customer**,
I want to **chat trực tiếp với support team trong app**,
so that **tôi giải quyết vấn đề nhanh mà không cần email qua lại**.

## Acceptance Criteria

1. **Given** user đăng nhập
   **When** click chat icon trong CRM header
   **Then** mở chat widget với chat history (nếu có conversation trước đó)
   **And** hiển thị welcome message: "Xin chào! Chúng tôi có thể giúp gì cho bạn?"

2. **And** user nhập message và gửi
   **Then** message xuất hiện trong chat window với timestamp
   **And** message được delivered trong vòng 30 giây (Supabase Realtime)
   **And** hiển thị delivery status: sending → sent → delivered

3. **When** admin nhận message từ user
   **Then** notification xuất hiện trong admin panel (bell icon + badge count)
   **And** admin thấy user info trong chat context: full_name, email, registration_date
   **And** admin thấy order history của user: total orders, total trees, recent orders

4. **And** admin reply message
   **Then** user nhận realtime reply trong vòng 30 giây
   **And** chat scroll tự động đến message mới nhất
   **And** reply message hiển thị với admin avatar + name

5. **And** mobile responsive:
   - Chat widget có fixed position bottom-right trên desktop
   - Full-screen overlay trên mobile (<768px)
   - Smooth open/close animation
   - Auto-focus vào text input khi mở chat

## Tasks / Subtasks

- [ ] Task 1: Database Schema for Chat (AC: 1, 2, 3, 4)
  - [ ] 1.1 Tạo migration: `supabase/migrations/20260329_create_support_chat.sql`
  - [ ] 1.2 Table: `chat_conversations` với columns:
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key → auth.users)
    - `status` (enum: 'open', 'closed')
    - `created_at`, `updated_at` (timestamptz)
  - [ ] 1.3 Table: `chat_messages` với columns:
    - `id` (uuid, primary key)
    - `conversation_id` (uuid, foreign key → chat_conversations)
    - `sender_id` (uuid, foreign key → auth.users)
    - `sender_type` (enum: 'customer', 'admin')
    - `message` (text)
    - `read` (boolean, default false)
    - `created_at` (timestamptz)
  - [ ] 1.4 Enable Supabase Realtime:
    ```sql
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
    ```
  - [ ] 1.5 RLS Policies:
    - Users can view their own conversations
    - Users can insert messages to their conversations
    - Admins can view all conversations
    - Admins can insert messages to any conversation
    - Admins can update conversation status

- [ ] Task 2: Chat Widget UI Component (AC: 1, 5)
  - [ ] 2.1 Tạo `src/components/crm/SupportChatWidget.tsx` — main container
  - [ ] 2.2 State management:
    - `isOpen` (boolean) — widget open/closed
    - `messages` (array) — chat history
    - `inputValue` (string) — current message input
    - `isTyping` (boolean) — typing indicator
  - [ ] 2.3 UI structure:
    - Chat bubble icon button (fixed bottom-right)
    - Chat window: header + message list + input area
    - Desktop: 400px width, 600px height, bottom-right position
    - Mobile: full-screen overlay with close button
  - [ ] 2.4 Icons: `lucide-react` (MessageCircle, Send, X)
  - [ ] 2.5 Animation: framer-motion slide-up transition
  - [ ] 2.6 Integration: Add to `src/app/crm/layout.tsx` (conditionally render cho non-admin)

- [ ] Task 3: Message List Component (AC: 1, 2, 4)
  - [ ] 3.1 Tạo `src/components/crm/chat/MessageList.tsx`
  - [ ] 3.2 Render messages với layout:
    - Customer messages: align right, green bubble
    - Admin messages: align left, gray bubble, avatar
  - [ ] 3.3 Message display:
    - Avatar (admin only) — first letter of name in circle
    - Message text với word-wrap
    - Timestamp — format: `formatDistanceToNow` (date-fns)
  - [ ] 3.4 Auto-scroll: scroll to bottom on new message
    - Use `useEffect` + `scrollIntoView({ behavior: 'smooth' })`
  - [ ] 3.5 Loading state: skeleton loader khi fetching history

- [ ] Task 4: Message Input Component (AC: 2)
  - [ ] 4.1 Tạo `src/components/crm/chat/MessageInput.tsx`
  - [ ] 4.2 Textarea với:
    - Auto-resize khi nhập nhiều dòng (max 4 lines)
    - Placeholder: "Nhập tin nhắn..."
    - Enter to send, Shift+Enter for new line
  - [ ] 4.3 Send button:
    - Disabled khi input empty
    - Loading state khi sending
  - [ ] 4.4 Delivery status indicator:
    - Sending: ⏳ icon + text "Đang gửi..."
    - Sent: ✓ icon (gray)
    - Delivered: ✓✓ icon (green)

- [ ] Task 5: Chat Server Actions (AC: 1, 2, 3, 4)
  - [ ] 5.1 Tạo `src/actions/supportChat.ts`
  - [ ] 5.2 Function: `getOrCreateConversation(userId: string)`
    - Check if user has open conversation
    - If not, create new conversation with status='open'
    - Return conversation_id
  - [ ] 5.3 Function: `sendMessage(conversationId, senderId, senderType, message)`
    - Insert message to chat_messages table
    - Update conversation updated_at
    - Return message object
  - [ ] 5.4 Function: `getConversationMessages(conversationId)`
    - Query messages ordered by created_at ASC
    - Include sender info: full_name (join auth.users via metadata)
    - Return array of messages
  - [ ] 5.5 Function: `markMessagesAsRead(conversationId, userId)`
    - Update read=true for messages where sender_id != userId

- [ ] Task 6: Realtime Chat Subscription (AC: 2, 4)
  - [ ] 6.1 Extend `src/lib/supabase/realtime.ts`
  - [ ] 6.2 Function: `subscribeToChatMessages(conversationId, callback)`
  - [ ] 6.3 Subscribe to postgres_changes:
    ```typescript
    .channel(`chat:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      callback
    )
    .subscribe()
    ```
  - [ ] 6.4 Integrate in SupportChatWidget:
    - Subscribe on mount
    - Update messages state on new message
    - Unsubscribe on unmount

- [ ] Task 7: Admin Chat Panel (AC: 3, 4)
  - [ ] 7.1 Tạo `src/app/crm/admin/support/page.tsx` — admin chat dashboard
  - [ ] 7.2 Layout: sidebar + main chat area (2-column)
  - [ ] 7.3 Sidebar: list of active conversations
    - Show user avatar + name
    - Latest message preview
    - Timestamp (formatDistanceToNow)
    - Unread badge (red dot)
    - Sort by: unread first, then latest message
  - [ ] 7.4 Main chat area:
    - User info card at top:
      - Full name, email, registration date
      - Total orders, total trees
      - Link to order history: `/crm/admin/orders?userId={userId}`
    - Message history (reuse MessageList component)
    - Admin reply input (reuse MessageInput component)
  - [ ] 7.5 Empty state: "Chưa có tin nhắn support" với illustration

- [ ] Task 8: Admin Chat Notifications (AC: 3)
  - [ ] 8.1 Extend NotificationBell component: add 'support_message' type
  - [ ] 8.2 Create notification on new customer message:
    - Trigger: Database webhook hoặc Edge Function
    - Insert to notifications table:
      - type: 'support_message'
      - title: "Tin nhắn support mới từ {userName}"
      - body: Preview first 100 chars of message
      - data: { conversationId, userId }
  - [ ] 8.3 Notification click handler:
    - Navigate to `/crm/admin/support?conversation={conversationId}`
    - Mark notification as read

- [ ] Task 9: AdminSidebar Navigation (AC: 3)
  - [ ] 9.1 File: `src/components/admin/AdminSidebar.tsx`
  - [ ] 9.2 Add item:
    ```typescript
    { name: 'Support Chat', href: '/crm/admin/support', icon: ChatBubbleLeftRightIcon }
    ```
  - [ ] 9.3 Badge: show count of unread conversations (optional enhancement)

- [ ] Task 10: Chat Context & User Info (AC: 3)
  - [ ] 10.1 Function: `getUserChatContext(userId)`
  - [ ] 10.2 Query user info:
    ```sql
    SELECT
      u.full_name,
      u.email,
      u.created_at as registration_date,
      COUNT(DISTINCT o.id) as total_orders,
      SUM(o.quantity) as total_trees
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.id AND o.status = 'completed'
    WHERE u.id = :userId
    GROUP BY u.id, u.full_name, u.email, u.created_at
    ```
  - [ ] 10.3 Query recent orders (last 3):
    ```sql
    SELECT id, package_name, quantity, total_price, created_at
    FROM orders
    WHERE user_id = :userId
    ORDER BY created_at DESC
    LIMIT 3
    ```
  - [ ] 10.4 Return interface:
    ```typescript
    interface UserChatContext {
      fullName: string
      email: string
      registrationDate: string
      totalOrders: number
      totalTrees: number
      recentOrders: Array<{
        id: string
        packageName: string
        quantity: number
        totalPrice: number
        createdAt: string
      }>
    }
    ```

## Dev Notes

### Architecture Compliance

**Tech Stack:**
- Database: Supabase PostgreSQL với Realtime enabled
- Frontend: Next.js 16.1.1, React 19, Tailwind CSS
- Realtime: Supabase Realtime (postgres_changes subscription) — **đã có infrastructure từ Story 2.3**
- Icons: lucide-react
- Animation: framer-motion 12.24.11
- Date formatting: date-fns 4.1.0

**Route Structure:**
- User chat widget: Global component trong `/crm/layout.tsx`
- Admin chat panel: `/crm/admin/support/page.tsx`
- Middleware auth: đã có trong `/crm/admin/layout.tsx` (admin role check)

### Reusable Infrastructure from Previous Stories

**Story 2.3 (Quarterly Notifications) provides:**
- ✅ Supabase Realtime setup: `src/lib/supabase/realtime.ts`
  - `subscribeToNotifications()` pattern
  - Browser client helpers
  - Realtime channel subscription boilerplate
- ✅ Notification system:
  - `notifications` table với RLS policies
  - `NotificationBell` component trong CRM header
  - Database webhook triggers
- ✅ Date formatting utilities: `date-fns` with `vi` locale

**Adaptation for Chat:**
- Create separate `subscribeToChatMessages()` function (similar pattern)
- Reuse NotificationBell infrastructure — add 'support_message' type
- Follow same Realtime subscription cleanup pattern (unsubscribe on unmount)

### Admin Context Infrastructure

**Story 3.1 (Order Management Dashboard) provides:**
- ✅ Admin panel structure: `AdminShell`, `AdminSidebar`
- ✅ Admin route pattern: `/crm/admin/*`
- ✅ Admin role check middleware trong `admin/layout.tsx`
- ✅ User data aggregation patterns (join orders → users)

**Story 4.4 (Admin Settings Profile) provides:**
- ✅ Admin preferences table structure
- ✅ Notification preferences management pattern
- ✅ Server Actions for admin-specific queries

**Adaptation for Support Chat:**
- Follow admin page pattern: create `/crm/admin/support/page.tsx`
- Reuse AdminSidebar — add Support Chat navigation item
- Follow RLS policy pattern: admins can view all conversations
- Use Server Actions pattern for chat queries

### Database Schema Design

**Inspiration from existing notifications table:**
```sql
-- From Story 2.3 (notifications table)
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  type TEXT,
  title TEXT,
  body TEXT,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

**Chat schema follows similar pattern:**
- Conversations table: track conversation lifecycle (open/closed)
- Messages table: store individual messages với realtime enabled
- RLS policies: users view own conversations, admins view all
- Realtime publication: enable postgres_changes subscription

### Message Delivery Status Logic

**Implementation approach:**
- **Sending:** Optimistic UI update + loading state
- **Sent:** Server Action returns success
- **Delivered:** Confirmed via Supabase Realtime INSERT event received

**Code pattern:**
```typescript
// User sends message
const tempId = crypto.randomUUID()
setMessages(prev => [...prev, { id: tempId, status: 'sending', ... }])

try {
  const message = await sendMessage(...)
  setMessages(prev => prev.map(m =>
    m.id === tempId ? { ...message, status: 'sent' } : m
  ))
} catch (error) {
  setMessages(prev => prev.map(m =>
    m.id === tempId ? { ...m, status: 'failed' } : m
  ))
}

// Realtime subscription confirms delivery
subscription.on('INSERT', (payload) => {
  setMessages(prev => prev.map(m =>
    m.id === payload.new.id ? { ...m, status: 'delivered' } : m
  ))
})
```

### Chat Widget UX Patterns

**Desktop behavior:**
- Fixed position: `fixed bottom-4 right-4 z-50`
- Chat bubble icon: always visible, bouncing animation on new message
- Chat window: slides up from bottom, max-height 600px
- Click outside to close: `useOnClickOutside` hook

**Mobile behavior (<768px):**
- Full-screen overlay: `fixed inset-0 z-50 bg-white`
- Header with close button (X icon top-right)
- Message list: `flex-1 overflow-y-auto`
- Input area: `sticky bottom-0` với safe-area padding

**Animation pattern (framer-motion):**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 20 }}
  transition={{ duration: 0.2 }}
>
  {/* Chat window content */}
</motion.div>
```

### Auto-scroll Implementation

**Pattern from existing components:**
```typescript
const messagesEndRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
}, [messages])

return (
  <div className="overflow-y-auto">
    {messages.map(msg => <Message key={msg.id} {...msg} />)}
    <div ref={messagesEndRef} />
  </div>
)
```

### Admin User Context Display

**Data aggregation pattern:**
- Follow Story 10.2 CO2 Impact Dashboard aggregation logic
- Use LEFT JOIN to handle users with zero orders
- Calculate totals: COUNT orders, SUM quantities
- Recent orders: ORDER BY created_at DESC LIMIT 3

**UI layout:**
```tsx
<div className="border-b pb-4 mb-4">
  <div className="flex items-start gap-4">
    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
      <span className="text-2xl">{userInitials}</span>
    </div>
    <div className="flex-1">
      <h3 className="font-semibold">{fullName}</h3>
      <p className="text-sm text-gray-600">{email}</p>
      <p className="text-xs text-gray-500">Tham gia: {registrationDate}</p>
    </div>
  </div>
  <div className="grid grid-cols-3 gap-4 mt-4">
    <StatCard label="Đơn hàng" value={totalOrders} />
    <StatCard label="Cây trồng" value={totalTrees} />
    <Link href={`/crm/admin/orders?userId=${userId}`}>Xem lịch sử →</Link>
  </div>
</div>
```

### Testing Requirements

**Unit Tests:**
- `subscribeToChatMessages()` function — mock Supabase channel
- Message delivery status state transitions
- Auto-scroll behavior on new message
- Desktop/mobile responsive layout

**Integration Tests:**
- Send message → receives realtime delivery
- Admin notification on new customer message
- Mark messages as read when admin views conversation

**E2E Tests (Playwright):**
- User opens chat → sends message → receives reply
- Admin receives notification → clicks → navigates to chat
- Mobile full-screen overlay behavior

### Performance Considerations

**Realtime Subscription Optimization:**
- Unsubscribe on component unmount (prevent memory leaks)
- Debounce typing indicator (500ms delay)
- Lazy load old messages (pagination for long conversations)

**Message List Rendering:**
- Virtual scrolling for conversations with 100+ messages (optional enhancement)
- Optimize re-renders: use `React.memo` for Message components
- Batch message updates (don't setState on every keystroke)

### Security & Privacy

**RLS Policies ensure:**
- Users can only view their own conversations
- Users cannot insert messages to other users' conversations
- Admins can view all conversations but cannot impersonate users
- Message history is encrypted at rest (Supabase default encryption)

**Sensitive Data Handling:**
- Do NOT log message content in browser console (production)
- Admin context shows order summary only (no payment details)
- GDPR compliance: conversation deletion when user account deleted (CASCADE)

### Migration Checklist

**Pre-deployment:**
- [ ] Run migration: `supabase/migrations/20260329_create_support_chat.sql`
- [ ] Verify Realtime publication includes `chat_messages` table
- [ ] Test RLS policies: user access, admin access, cross-user isolation
- [ ] Seed test data: 2-3 sample conversations

**Post-deployment:**
- [ ] Monitor Supabase Realtime connections (check dashboard)
- [ ] Verify notification delivery to admins
- [ ] Test end-to-end chat flow on staging
- [ ] Load test: 10 concurrent conversations

### Vietnamese Text Handling

**Critical considerations (from Story 10.1 learnings):**
- ✅ No special handling needed for Vietnamese in messages (plain text)
- ✅ Use date-fns with `vi` locale for timestamp formatting
- ✅ Ensure UTF-8 encoding in database migration
- ✅ Test message display with Vietnamese diacritics: à, ạ, ả, ã, á, ă, ằ, ẳ, ẵ, ắ, â, ầ, ẩ, ẫ, ấ

### Libraries & Dependencies

**Already installed (no new package needed):**
- ✅ @supabase/supabase-js: 2.90.1
- ✅ @supabase/ssr: 0.8.0
- ✅ framer-motion: 12.24.11
- ✅ date-fns: 4.1.0
- ✅ lucide-react: 0.562.0

**Icons to use:**
- Chat bubble: `MessageCircle` (lucide-react)
- Send button: `Send` (lucide-react)
- Close button: `X` (lucide-react)
- Admin panel: `ChatBubbleLeftRightIcon` (@heroicons/react) — already used in AdminSidebar

### Edge Cases & Error Handling

**Network failures:**
- Show "Không thể gửi tin nhắn" toast
- Retry button for failed messages
- Cache unsent messages in localStorage (optional enhancement)

**Concurrent admin replies:**
- Multiple admins viewing same conversation
- Realtime updates ensure all admins see same message history
- No conflict resolution needed (append-only log)

**User closes chat with unread admin reply:**
- Next time user opens chat, show unread count badge
- Auto-scroll to first unread message (optional enhancement)

### Future Enhancements (Out of Scope for This Story)

- [ ] File attachments (images, PDFs)
- [ ] Rich text formatting (bold, italic, links)
- [ ] Typing indicator: "{Admin} đang nhập..."
- [ ] Read receipts: "Đã xem lúc {timestamp}"
- [ ] Chat history export for admins
- [ ] Auto-assign conversations to specific admin
- [ ] Conversation tagging (technical, billing, general)
- [ ] Canned responses for admins (quick replies)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Completion Notes List

Story created via BMad create-story workflow — comprehensive context provided for flawless implementation.

**Critical implementation insights:**
1. Reuse Supabase Realtime infrastructure from Story 2.3
2. Follow admin panel patterns from Story 3.1, 4.4
3. Vietnamese text requires UTF-8 encoding but no special handling in messages
4. Message delivery status: optimistic UI + Realtime confirmation
5. Auto-scroll pattern: useRef + useEffect + scrollIntoView
6. Mobile responsive: full-screen overlay vs fixed desktop widget
7. RLS policies critical: users view own conversations, admins view all
8. Admin context: user info + order summary for support context
9. Notification integration: extend existing NotificationBell with 'support_message' type
10. No new dependencies required — all libraries already installed

### File List

**Created Files:**
- `supabase/migrations/20260329_create_support_chat.sql` — Database schema
- `src/components/crm/SupportChatWidget.tsx` — Main chat widget
- `src/components/crm/chat/MessageList.tsx` — Message list component
- `src/components/crm/chat/MessageInput.tsx` — Message input component
- `src/actions/supportChat.ts` — Server Actions for chat operations
- `src/app/crm/admin/support/page.tsx` — Admin chat dashboard
- `src/lib/supabase/realtime.ts` — EXTENDED: add `subscribeToChatMessages()`

**Modified Files:**
- `src/app/crm/layout.tsx` — Add SupportChatWidget for non-admin users
- `src/components/admin/AdminSidebar.tsx` — Add Support Chat navigation
- `src/components/crm/NotificationBell.tsx` — Add 'support_message' type handler
- `src/lib/supabase/realtime.ts` — Add chat subscription function

**Test Files:**
- `src/lib/supabase/__tests__/chat-realtime.test.ts` — Chat subscription tests
- `src/components/crm/__tests__/SupportChatWidget.test.tsx` — Widget unit tests
- `e2e/support-chat.spec.ts` — E2E chat flow tests
