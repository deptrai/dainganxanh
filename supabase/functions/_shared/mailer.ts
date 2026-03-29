/**
 * Shared mailer utility
 * - Local dev: uses SMTP → Mailpit (inbucket:1025 on Docker network)
 * - Production: uses Resend API
 *
 * Detection: if SMTP_HOST is set → SMTP mode, otherwise → Resend mode
 */

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
  attachments?: Array<{
    filename: string
    content: string // base64
    contentType: string
  }>
}

const DEFAULT_FROM = Deno.env.get('EMAIL_FROM') || 'Đại Ngàn Xanh <noreply@dainganxanh.com.vn>'

export async function sendEmail(opts: EmailOptions): Promise<void> {
  const smtpHost = Deno.env.get('SMTP_HOST')

  if (smtpHost) {
    await sendViaSMTP(opts, smtpHost)
  } else {
    await sendViaResend(opts)
  }
}

async function sendViaResend(opts: EmailOptions): Promise<void> {
  const { Resend } = await import('npm:resend@2.0.0')
  const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

  const payload: Record<string, unknown> = {
    from: opts.from || DEFAULT_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  }

  if (opts.attachments && opts.attachments.length > 0) {
    payload.attachments = opts.attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
    }))
  }

  const { error } = await resend.emails.send(payload as Parameters<typeof resend.emails.send>[0])
  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }
}

async function sendViaSMTP(opts: EmailOptions, smtpHost: string): Promise<void> {
  const smtpPort = Number(Deno.env.get('SMTP_PORT') || '1025')
  const from = opts.from || DEFAULT_FROM

  // Build a minimal raw SMTP email via fetch to Mailpit's HTTP API
  // Mailpit exposes a REST API at :8025/api/v1/send
  // But from within Docker, we use the web UI port (8025) via service name
  const mailpitApiUrl = `http://inbucket:8025/api/v1/send`

  // Try Mailpit REST API first (v1.22+)
  const body: Record<string, unknown> = {
    From: { Email: extractEmail(from), Name: extractName(from) },
    To: [{ Email: opts.to }],
    Subject: opts.subject,
    HTML: opts.html,
  }

  if (opts.attachments && opts.attachments.length > 0) {
    body.Attachments = opts.attachments.map((a) => ({
      Filename: a.filename,
      Content: a.content,
      ContentType: a.contentType,
    }))
  }

  const res = await fetch(mailpitApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Mailpit API error ${res.status}: ${text}`)
  }
}

function extractEmail(from: string): string {
  const match = from.match(/<(.+)>/)
  return match ? match[1] : from
}

function extractName(from: string): string {
  const match = from.match(/^(.+?)\s*</)
  return match ? match[1].trim() : ''
}
