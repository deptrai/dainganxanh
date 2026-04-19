/**
 * Mailpit OTP Fixture
 *
 * Replaces 21 duplicated `getOTPFromMailpit` implementations across the e2e suite.
 *
 * Key improvements over the inline version:
 * - Condition-based polling (no hardcoded setTimeout)
 * - Configurable retry count and poll interval
 * - Supports both 6-digit and 8-digit OTP codes
 * - Reads MAILPIT_URL from env with fallback
 * - Typed exports for use in Playwright fixtures and standalone helpers
 */

const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://127.0.0.1:54334'
const DEFAULT_POLL_INTERVAL_MS = 500
const DEFAULT_MAX_RETRIES = 20  // 20 × 500ms = 10s max wait

export interface MailpitMessage {
    ID: string
    To: Array<{ Address: string }>
    Subject: string
}

/**
 * Poll Mailpit until an email arrives for the given address.
 * Throws if no email found after maxRetries.
 */
export async function waitForMailpitEmail(
    email: string,
    options: { maxRetries?: number; pollIntervalMs?: number } = {}
): Promise<MailpitMessage> {
    const { maxRetries = DEFAULT_MAX_RETRIES, pollIntervalMs = DEFAULT_POLL_INTERVAL_MS } = options

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const response = await fetch(`${MAILPIT_URL}/api/v1/messages`)
        if (!response.ok) {
            throw new Error(`Mailpit API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        const messages: MailpitMessage[] = data.messages ?? []

        const match = messages.find(
            (msg) => msg.To?.some((to) => to.Address === email)
        )

        if (match) return match

        await new Promise<void>((resolve) => setTimeout(resolve, pollIntervalMs))
    }

    throw new Error(
        `[mailpit] No email found for <${email}> after ${maxRetries} attempts (${(maxRetries * pollIntervalMs) / 1000}s)`
    )
}

/**
 * Extract OTP code from a Mailpit message body.
 * Supports 6-digit and 8-digit codes.
 */
export async function extractOTPFromMessage(messageId: string): Promise<string> {
    const response = await fetch(`${MAILPIT_URL}/api/v1/message/${messageId}`)
    if (!response.ok) {
        throw new Error(`Mailpit message fetch error: ${response.status}`)
    }

    const msgData = await response.json()
    const text: string = msgData.Text ?? ''

    // Try 8-digit first (Supabase OTP), then 6-digit
    const otpMatch = text.match(/\b\d{8}\b/) ?? text.match(/\b\d{6}\b/)

    if (!otpMatch) {
        throw new Error(`[mailpit] Could not extract OTP from email body. Text: ${text.slice(0, 200)}`)
    }

    return otpMatch[0]
}

/**
 * Convenience wrapper: wait for email and extract OTP in one call.
 *
 * Usage (replaces all 21 inline getOTPFromMailpit calls):
 *
 *   import { getOTPFromMailpit } from '../fixtures/mailpit'
 *   const otp = await getOTPFromMailpit(email)
 */
export async function getOTPFromMailpit(
    email: string,
    options: { maxRetries?: number; pollIntervalMs?: number } = {}
): Promise<string> {
    const message = await waitForMailpitEmail(email, options)
    return extractOTPFromMessage(message.ID)
}
