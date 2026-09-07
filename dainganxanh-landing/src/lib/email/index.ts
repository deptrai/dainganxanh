import React from 'react'
import { renderEmail } from './render'
import { TreeContractEmail } from '@/emails/TreeContractEmail'
import { EcoStayVoucherEmail } from '@/emails/EcoStayVoucherEmail'
import { StoreDispatchEmail } from '@/emails/StoreDispatchEmail'
import { sendRawEmail } from './mailer'
import {
  SendEmailResult,
  SendTreeContractEmailParams,
  SendEcoStayVoucherEmailParams,
  SendStoreDispatchEmailParams,
} from './types'

export * from './types'
export * from './mailer'

export async function sendTreeContractEmail(
  params: SendTreeContractEmailParams
): Promise<SendEmailResult> {
  const { orderId, recipientEmail, ...props } = params
  const html = await renderEmail(React.createElement(TreeContractEmail, props))

  return sendRawEmail({
    orderId,
    emailType: 'tree_contract',
    to: recipientEmail,
    subject: `🌳 Hợp đồng điện tử đầu tư cây ${props.orderCode} - Đại Ngàn Xanh`,
    html,
  })
}

export async function sendEcoStayVoucherEmail(
  params: SendEcoStayVoucherEmailParams
): Promise<SendEmailResult> {
  const { bookingId, recipientEmail, ...props } = params
  const html = await renderEmail(React.createElement(EcoStayVoucherEmail, props))

  return sendRawEmail({
    orderId: bookingId,
    emailType: 'ecostay_voucher',
    to: recipientEmail,
    subject: `🏡 Voucher xác nhận đặt phòng ${props.bookingCode} - ${props.roomName}`,
    html,
  })
}

export async function sendStoreDispatchEmail(
  params: SendStoreDispatchEmailParams
): Promise<SendEmailResult> {
  const { storeOrderId, recipientEmail, ...props } = params
  const html = await renderEmail(React.createElement(StoreDispatchEmail, props))

  return sendRawEmail({
    orderId: storeOrderId,
    emailType: 'store_dispatch',
    to: recipientEmail,
    subject: `📦 Đơn hàng ${props.orderCode} đã được gửi đi - Đại Ngàn Xanh Store`,
    html,
  })
}
