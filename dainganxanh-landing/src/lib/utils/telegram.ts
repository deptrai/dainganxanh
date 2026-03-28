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
        chat_id: Number(chatId),
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

export async function notifyWithdrawalRequest(params: {
  userName: string
  userEmail: string
  amount: number
  bankName: string
  bankAccountNumber: string
}): Promise<void> {
  const message =
    `💸 <b>Yêu cầu rút tiền mới!</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 Người dùng: ${params.userName}\n` +
    `📧 Email: ${params.userEmail}\n` +
    `💰 Số tiền: <b>${formatVND(params.amount)}</b>\n` +
    `🏦 Ngân hàng: ${params.bankName}\n` +
    `💳 STK: <code>${params.bankAccountNumber}</code>\n` +
    `⏳ Trạng thái: Chờ duyệt`

  await sendTelegramMessage(message)
}

export async function notifyTreeAssigned(params: {
  orderCode: string
  userName: string
  userEmail: string
  quantity: number
  lotName: string
  lotRegion: string
  treeCodes: string[]
}): Promise<void> {
  const treeList = params.treeCodes.slice(0, 3).join(', ') +
    (params.treeCodes.length > 3 ? ` +${params.treeCodes.length - 3} cây` : '')

  const message =
    `🌲 <b>Gán lô cây thành công!</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📋 Mã đơn: <code>${params.orderCode}</code>\n` +
    `👤 Khách hàng: ${params.userName}\n` +
    `📧 Email: ${params.userEmail}\n` +
    `🌳 Số cây: <b>${params.quantity} cây</b>\n` +
    `📍 Lô: ${params.lotName} — ${params.lotRegion}\n` +
    `🔖 Mã cây: <code>${treeList}</code>`

  await sendTelegramMessage(message)
}

export async function notifyReferralAssigned(params: {
  targetEmail: string
  targetName?: string | null
  referrerEmail: string | null
  referrerName?: string | null
  refCode: string
  retroOrders: number
  retroCommission: number
  adminEmail: string
}): Promise<void> {
  const retroInfo = params.retroOrders > 0
    ? `\n💸 Hoa hồng hồi tố: <b>${formatVND(params.retroCommission)}</b> (${params.retroOrders} đơn cũ)`
    : `\n📭 Không có đơn hàng cũ nào`

  const message =
    `🤝 <b>Admin gán mã giới thiệu!</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 User: ${params.targetName || params.targetEmail}\n` +
    `📧 Email: ${params.targetEmail}\n` +
    `🎁 Người giới thiệu: ${params.referrerName || params.referrerEmail}\n` +
    `🔑 Mã: <code>${params.refCode}</code>${retroInfo}\n` +
    `👨‍💼 Admin thực hiện: ${params.adminEmail}`

  await sendTelegramMessage(message)
}
