import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendEmail({
    to,
    subject,
    html
}: {
    to: string
    subject: string
    html: string
}) {
    try {
        if (!resend) {
            console.warn('Resend API key not configured, skipping email send')
            return { success: false, error: 'Email service not configured' }
        }

        await resend.emails.send({
            from: 'Đại Ngàn Xanh <noreply@dainganxanh.com>',
            to,
            subject,
            html
        })
        return { success: true }
    } catch (error) {
        console.error('Email send error:', error)
        return { success: false, error }
    }
}
