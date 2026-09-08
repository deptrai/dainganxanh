import { TreeContractEmailProps } from '@/emails/TreeContractEmail'
import { EcoStayVoucherEmailProps } from '@/emails/EcoStayVoucherEmail'
import { StoreDispatchEmailProps } from '@/emails/StoreDispatchEmail'

export type EmailType = 'tree_contract' | 'ecostay_voucher' | 'store_dispatch'

export interface SendEmailResult {
  success: boolean
  resendId?: string // Also used as 'id' in dev fallback per AC
  error?: string
}

export interface SendTreeContractEmailParams extends TreeContractEmailProps {
  orderId: string // UUID for email_logs
  recipientEmail: string
}

export interface SendEcoStayVoucherEmailParams extends EcoStayVoucherEmailProps {
  bookingId: string // UUID for email_logs
  recipientEmail: string
}

export interface SendStoreDispatchEmailParams extends StoreDispatchEmailProps {
  storeOrderId: string // UUID for email_logs
  recipientEmail: string
}
