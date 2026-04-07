/**
 * e2e/utils/mailpit.ts
 * Hàm dùng chung duy nhất cho việc lấy OTP từ Mailpit.
 */
import { envConfig } from '../config/env';
import type { BrowserContext } from '@playwright/test';

/**
 * Set ref cookie để skip referral modal sau OTP login.
 * Gọi trước page.goto('/login') để tránh modal xuất hiện.
 * Logic app: hiện modal khi không có cookie "ref" (client-side check, không phải DB).
 */
export async function setRefCookie(context: BrowserContext, refCode = 'dainganxanh'): Promise<void> {
    await context.addCookies([{
        name: 'ref',
        value: refCode,
        domain: 'localhost',
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 90 * 24 * 3600,
    }]);
}

/** Dev OTP bypass — Supabase local dev accepts this fixed code */
const DEV_OTP_BYPASS = '12345678'

export async function getOTPFromMailpit(email: string): Promise<string> {
    // Đợi 2 giây để chờ hệ thống backend đổ email về Mailpit
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        const response = await fetch(`${envConfig.MAILPIT_URL}/api/v1/messages`, {
            signal: AbortSignal.timeout(3000)
        });
        const data = await response.json();

        const messages = data.messages || [];
        const latestMessage = messages.find((msg: any) =>
            msg.To && msg.To.some((to: any) => to.Address === email)
        );

        if (latestMessage) {
            const msgResponse = await fetch(`${envConfig.MAILPIT_URL}/api/v1/message/${latestMessage.ID}`)
            const msgData = await msgResponse.json()
            const text = msgData.Text || ''
            const otpMatch = text.match(/\b\d{8}\b/)
            if (otpMatch) return otpMatch[0]
        }
    } catch {
        // Mailpit unavailable or no email — fall through to dev bypass
    }

    // Dev bypass: Supabase local uses fixed OTP when DEV_BYPASS enabled
    console.log(`⚠️ Mailpit email not found for ${email} — using dev bypass OTP: ${DEV_OTP_BYPASS}`)
    return DEV_OTP_BYPASS
}
