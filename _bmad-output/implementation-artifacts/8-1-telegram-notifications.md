# Story 8.1: Telegram Group Notifications

Status: completed

## Story

As an **admin/operator**,
I want to **receive real-time Telegram notifications**,
so that **tôi biết ngay khi có đơn hàng mới và thanh toán thành công mà không cần phải F5 dashboard**.

## Acceptance Criteria

1. **Given** user submit đơn mua cây
   **When** đơn được tạo thành công
   **Then** gửi thông báo vào Telegram group với thông tin đơn hàng

2. **Given** Casso webhook nhận payment confirmation
   **When** `process-payment` Edge Function xử lý thành công
   **Then** gửi thông báo thanh toán thành công vào Telegram group

3. **Given** admin gán mã giới thiệu cho user
   **When** `assignUserReferral()` thành công
   **Then** gửi thông báo vào Telegram group với thông tin assignment + hoa hồng hồi tố

4. **And** Nếu env vars thiếu (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`), hệ thống hoạt động bình thường (không gây lỗi)

## Tasks / Subtasks

- [x] Task 1: Telegram utility (AC: 1, 2, 3, 4)
  - [x] 1.1 Tạo `src/lib/utils/telegram.ts`
  - [x] 1.2 `sendTelegramMessage()` internal helper (non-blocking)
  - [x] 1.3 `notifyNewOrder()` - đơn hàng mới
  - [x] 1.4 `notifyPaymentSuccess()` - thanh toán thành công
  - [x] 1.5 `notifyReferralAssigned()` - admin gán mã giới thiệu
  - [x] 1.6 Graceful skip nếu env vars không có

- [x] Task 2: Integration vào order flow (AC: 1)
  - [x] 2.1 Import và gọi `notifyNewOrder()` trong `src/app/api/orders/pending/route.ts`
  - [x] 2.2 Fire-and-forget (non-blocking) - không ảnh hưởng response time

- [x] Task 3: Integration vào payment webhook (AC: 2)
  - [x] 3.1 Import và gọi `notifyPaymentSuccess()` trong `src/app/api/webhooks/casso/route.ts`
  - [x] 3.2 Fire-and-forget sau khi Edge Function xử lý thành công

- [x] Task 4: Integration vào admin assign referral (AC: 3)
  - [x] 4.1 Import và gọi `notifyReferralAssigned()` trong `src/actions/adminUsers.ts`
  - [x] 4.2 Bao gồm số đơn hồi tố và tổng hoa hồng

- [x] Task 5: Environment configuration (AC: 4)
  - [x] 5.1 Thêm `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID` vào `.env.example`

## Dev Notes

### Architecture

```
New Order / Payment / Admin Action
        ↓
Server Action / Route Handler
        ↓
notifyXxx() (fire-and-forget, void)
        ↓
sendTelegramMessage() → fetch POST to Telegram Bot API
        ↓
Telegram Group (HTML parse_mode)
```

### File: `src/lib/utils/telegram.ts`

```typescript
const TELEGRAM_API = 'https://api.telegram.org'

async function sendTelegramMessage(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) { console.warn('[Telegram] env vars missing'); return }

  await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
  })
}

export async function notifyNewOrder(params: {
  orderCode: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  quantity: number
  totalAmount: number
  referredByCode?: string
}): Promise<void>

export async function notifyPaymentSuccess(params: {
  orderCode: string
  amount: number
  bankAccount?: string
  transactionId?: string
}): Promise<void>

export async function notifyReferralAssigned(params: {
  targetUserEmail: string
  referrerCode: string
  retroOrders: number
  retroCommission: number
  adminId: string
}): Promise<void>
```

### Message Format (HTML)

**Đơn hàng mới:**
```
🌱 <b>Đơn hàng mới!</b>
📋 Mã đơn: <code>DNX123456</code>
👤 Khách: Nguyễn Văn A
📱 SĐT: 0909123456
🌲 Số cây: 10
💰 Tổng tiền: 1,300,000đ
🤝 Giới thiệu: nguyenvana
```

**Thanh toán thành công:**
```
✅ <b>Thanh toán thành công!</b>
📋 Đơn hàng: <code>DNX123456</code>
💵 Số tiền: 1,300,000đ
🏦 TK: 771368999999
```

**Admin gán mã giới thiệu:**
```
🤝 <b>Admin gán mã giới thiệu</b>
👤 User: user@email.com
🎫 Mã GT: nguyenvana
📦 Hồi tố: 3 đơn
💰 Hoa hồng hồi tố: 390,000đ
```

### Environment Variables

```env
TELEGRAM_BOT_TOKEN=<bot token từ @BotFather>
TELEGRAM_CHAT_ID=<group chat ID, thường là số âm VD: -1001234567890>
```

### How to get Chat ID
1. Add bot vào group
2. Send 1 tin nhắn trong group
3. Gọi `https://api.telegram.org/bot<TOKEN>/getUpdates`
4. Tìm `chat.id` trong response

### References
- File: `src/lib/utils/telegram.ts`
- Integration: `src/app/api/orders/pending/route.ts`
- Integration: `src/app/api/webhooks/casso/route.ts`
- Integration: `src/actions/adminUsers.ts`

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6

### Implementation Notes
- Non-blocking: tất cả notify functions đều `void` và không throw errors ra ngoài
- Graceful degradation: thiếu env vars → warn + return, không crash
- HTML parse_mode: format message với bold, code, emoji
- Fire-and-forget pattern: gọi notifyXxx() không cần await ở caller

### Change Log
- 2026-03-28: Implemented Telegram notification utility và integrations
