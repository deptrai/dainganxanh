const TELEGRAM_API = 'https://api.telegram.org'

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
}

async function sendTelegramMessage(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured, skipping notification')
    return
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[Telegram] Failed to send message:', err)
    }
  } catch (err) {
    console.error('[Telegram] Error sending notification:', err)
  }
}

export async function notifyNewOrder(params: {
  orderCode: string
  userName: string
  userEmail: string
  quantity: number
  totalAmount: number
}): Promise<void> {
  const message =
    `🌱 <b>Đơn hàng mới!</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📋 Mã đơn: <code>${params.orderCode}</code>\n` +
    `👤 Khách hàng: ${params.userName}\n` +
    `📧 Email: ${params.userEmail}\n` +
    `🌳 Số cây: <b>${params.quantity} cây</b>\n` +
    `💰 Số tiền: <b>${formatVND(params.totalAmount)}</b>\n` +
    `⏳ Trạng thái: Chờ thanh toán`

  await sendTelegramMessage(message)
}

export async function notifyPaymentSuccess(params: {
  orderCode: string
  userName: string
  userEmail: string
  quantity: number
  totalAmount: number
  treeCodes?: string[]
}): Promise<void> {
  const treeList =
    params.treeCodes && params.treeCodes.length > 0
      ? `\n🌲 Mã cây: <code>${params.treeCodes.slice(0, 3).join(', ')}${params.treeCodes.length > 3 ? ` +${params.treeCodes.length - 3} cây` : ''}</code>`
      : ''

  const message =
    `✅ <b>Thanh toán thành công!</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📋 Mã đơn: <code>${params.orderCode}</code>\n` +
    `👤 Khách hàng: ${params.userName}\n` +
    `📧 Email: ${params.userEmail}\n` +
    `🌳 Số cây: <b>${params.quantity} cây</b>\n` +
    `💰 Số tiền: <b>${formatVND(params.totalAmount)}</b>${treeList}\n` +
    `🎉 Đơn hàng đã hoàn tất!`

  await sendTelegramMessage(message)
}
