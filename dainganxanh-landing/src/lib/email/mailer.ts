import { Resend } from 'resend'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { EmailType, SendEmailResult } from './types'

const DEFAULT_FROM = process.env.EMAIL_FROM || 'Đại Ngàn Xanh <notifications@dainganxanh.com.vn>'

interface SendRawEmailOptions {
  orderId: string
  emailType: EmailType
  to: string
  subject: string
  html: string
  from?: string
}

let resendClient: Resend | null = null
function getResendClient(apiKey: string) {
  if (!resendClient) resendClient = new Resend(apiKey)
  return resendClient
}

export async function sendRawEmail(options: SendRawEmailOptions): Promise<SendEmailResult> {
  const { orderId, emailType, to, subject, html, from = DEFAULT_FROM } = options
  const apiKey = process.env.RESEND_API_KEY
  const supabase = createServiceRoleClient()

  // 1. Dev / Test fallback when RESEND_API_KEY is not configured
  if (!apiKey) {
    const mockResendId = 'dev-mock-id'
    console.log(`[Dev Mailer Mock] To: ${to} | Subject: ${subject} | (apiKey missing, mocked delivery)`)
    console.log(`[Dev Mailer Mock] HTML Payload:\n${html}`)

    try {
      const { error } = await supabase.from('email_logs').insert({
        order_id: orderId,
        email_type: emailType,
        recipient: to,
        status: 'sent',
        resend_id: mockResendId,
        sent_at: new Date().toISOString(),
      })
      if (error) console.error('[email_logs] Failed to log dev email attempt:', error)
    } catch (logErr) {
      console.error('[email_logs] Failed to log dev email attempt:', logErr)
    }

    return { success: true, resendId: mockResendId }
  }

  // 2. Production Resend delivery
  try {
    const resend = getResendClient(apiKey)
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('[Resend Error]:', error)
      try {
        const { error: logError } = await supabase.from('email_logs').insert({
          order_id: orderId,
          email_type: emailType,
          recipient: to,
          status: 'failed',
          error_message: error.message,
          sent_at: new Date().toISOString(),
        })
        if (logError) console.error('[email_logs] Failed to log email failure:', logError)
      } catch (logErr) {
        console.error('[email_logs] Failed to log email failure:', logErr)
      }

      return { success: false, error: error.message }
    }

    const resendId = data?.id ?? 'resend-sent'

    try {
      const { error: logError } = await supabase.from('email_logs').insert({
        order_id: orderId,
        email_type: emailType,
        recipient: to,
        status: 'sent',
        resend_id: resendId,
        sent_at: new Date().toISOString(),
      })
      if (logError) console.error('[email_logs] Failed to log email success:', logError)
    } catch (logErr) {
      console.error('[email_logs] Failed to log email success:', logErr)
    }

    return { success: true, resendId }
  } catch (err: any) {
    console.error('[Mailer Exception]:', err)
    try {
      const { error: logError } = await supabase.from('email_logs').insert({
        order_id: orderId,
        email_type: emailType,
        recipient: to,
        status: 'failed',
        error_message: err?.message || 'Unknown mailer exception',
        sent_at: new Date().toISOString(),
      })
      if (logError) console.error('[email_logs] Failed to log exception:', logError)
    } catch (logErr) {
      console.error('[email_logs] Failed to log exception:', logErr)
    }

    return { success: false, error: err?.message || 'Lỗi gửi email' }
  }
}
