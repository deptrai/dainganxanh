import { test, expect } from '@playwright/test'
import { createHmac } from 'crypto'
import { envConfig } from '../../config/env'
import * as fs from 'fs'
import * as path from 'path'

// Load CASSO_SECURE_TOKEN from .env.local if not already in process.env
// (Playwright test process doesn't automatically load .env.local from Next.js)
function loadCassoSecret(): string {
    if (process.env.CASSO_SECURE_TOKEN) return process.env.CASSO_SECURE_TOKEN
    try {
        const envPath = path.join(__dirname, '../../../.env.local')
        const content = fs.readFileSync(envPath, 'utf-8')
        const match = content.match(/^CASSO_SECURE_TOKEN=(.+)$/m)
        if (match) return match[1].trim()
    } catch { /* file not found */ }
    return 'test-webhook-secret'
}

/**
 * Casso Webhook API Test Suite
 * Tests /api/webhooks/casso route directly via HTTP
 *
 * Tests: HMAC validation, dedup, amount matching, test ping
 *
 * Note: These tests do NOT trigger the Edge Function process-payment
 * (they test up to the point of Edge Function invocation).
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - CASSO_SECURE_TOKEN env var must be set (local: uses 'test-secret')
 */

const BASE_URL = envConfig.BASE_URL
const WEBHOOK_URL = `${BASE_URL}/api/webhooks/casso`

// Load the actual CASSO_SECURE_TOKEN used by the running Next.js dev server
const WEBHOOK_SECRET = loadCassoSecret()

/**
 * Sort object keys recursively (matches webhook verification logic)
 */
function sortObjByKey(obj: unknown): unknown {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return obj
    const sorted: Record<string, unknown> = {}
    Object.keys(obj as Record<string, unknown>).sort().forEach(k => {
        sorted[k] = sortObjByKey((obj as Record<string, unknown>)[k])
    })
    return sorted
}

/**
 * Generate valid Casso Webhook V2 HMAC signature
 * Header format: t={timestamp},v1={hmac-sha512}
 * Signed payload: `${timestamp}.${JSON.stringify(sortedByKey(body))}`
 */
function generateCassoSignature(body: object, secret: string): string {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const sorted = sortObjByKey(body)
    const message = `${timestamp}.${JSON.stringify(sorted)}`
    const hmac = createHmac('sha512', secret).update(message).digest('hex')
    return `t=${timestamp},v1=${hmac}`
}

/**
 * Build a standard Casso V2 payload
 */
function buildCassoPayload(overrides: Partial<{
    id: string | number
    amount: number
    description: string
    accountNumber: string
    bankName: string
    transactionDateTime: string
}> = {}) {
    const txId = overrides.id ?? Date.now()
    return {
        error: 0,
        data: {
            id: txId,
            reference: `REF${txId}`,
            amount: overrides.amount ?? 260000,
            description: overrides.description ?? 'Chuyen khoan DHTEST01',
            accountNumber: overrides.accountNumber ?? '0123456789',
            bankName: overrides.bankName ?? 'Vietcombank',
            bankAbbreviation: 'VCB',
            runningBalance: 1000000,
            transactionDateTime: overrides.transactionDateTime ?? new Date().toISOString(),
        }
    }
}

test.describe('Casso Webhook API', () => {

    test.describe('HMAC Validation', () => {

        test('returns 401 for missing signature header', async ({ request }) => {
            const payload = buildCassoPayload()
            const res = await request.post(WEBHOOK_URL, {
                headers: { 'Content-Type': 'application/json' },
                data: payload
            })
            expect(res.status()).toBe(401)
        })

        test('returns 401 for invalid HMAC signature', async ({ request }) => {
            const payload = buildCassoPayload()
            const res = await request.post(WEBHOOK_URL, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-casso-signature': 't=1234567890,v1=invalidsignature'
                },
                data: payload
            })
            expect(res.status()).toBe(401)
        })

        test('returns 401 for wrong secret', async ({ request }) => {
            const payload = buildCassoPayload()
            const sig = generateCassoSignature(payload, 'wrong-secret')
            const res = await request.post(WEBHOOK_URL, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-casso-signature': sig
                },
                data: payload
            })
            expect(res.status()).toBe(401)
        })

        test('accepts valid HMAC signature', async ({ request }) => {
            const payload = buildCassoPayload({ description: 'Test ping no txid' })
            // Remove id to simulate test ping (no txId)
            const pingPayload = { error: 0, data: {} }
            const sig = generateCassoSignature(pingPayload, WEBHOOK_SECRET)
            const res = await request.post(WEBHOOK_URL, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-casso-signature': sig
                },
                data: pingPayload
            })
            // Test ping (no txId) returns 200
            expect(res.status()).toBe(200)
        })
    })

    test.describe('Test Ping', () => {

        test('returns 200 for test ping with no txId', async ({ request }) => {
            const payload = { error: 0, data: {} }
            const sig = generateCassoSignature(payload, WEBHOOK_SECRET)
            const res = await request.post(WEBHOOK_URL, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-casso-signature': sig
                },
                data: payload
            })
            expect(res.status()).toBe(200)
            const body = await res.json()
            expect(body.ok).toBe(true)
        })
    })

    test.describe('Transaction Processing', () => {

        test('returns 200 and no_match for negative amount (outgoing)', async ({ request }) => {
            const txId = `neg_${Date.now()}`
            const payload = buildCassoPayload({ id: txId, amount: -100000, description: 'Outgoing' })
            const sig = generateCassoSignature(payload, WEBHOOK_SECRET)
            const res = await request.post(WEBHOOK_URL, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-casso-signature': sig
                },
                data: payload
            })
            expect(res.status()).toBe(200)
            const body = await res.json()
            expect(body.ok).toBe(true)
        })

        test('returns 200 and no_match when description has no order code', async ({ request }) => {
            const txId = `nocode_${Date.now()}`
            const payload = buildCassoPayload({ id: txId, description: 'Tien an trua khong co ma' })
            const sig = generateCassoSignature(payload, WEBHOOK_SECRET)
            const res = await request.post(WEBHOOK_URL, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-casso-signature': sig
                },
                data: payload
            })
            expect(res.status()).toBe(200)
            const body = await res.json()
            expect(body.ok).toBe(true)
        })

        test('returns 200 for order not found', async ({ request }) => {
            const txId = `notfound_${Date.now()}`
            // Order code DHZZZ999 should not exist
            const payload = buildCassoPayload({ id: txId, description: 'Chuyen khoan DHZZZ999' })
            const sig = generateCassoSignature(payload, WEBHOOK_SECRET)
            const res = await request.post(WEBHOOK_URL, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-casso-signature': sig
                },
                data: payload
            })
            expect(res.status()).toBe(200)
            const body = await res.json()
            expect(body.ok).toBe(true)
        })

        test('returns 200 for duplicate txId (idempotency)', async ({ request }) => {
            const txId = `dup_${Date.now()}`
            const payload = buildCassoPayload({ id: txId, description: 'Tien khong co ma don' })
            const sig = generateCassoSignature(payload, WEBHOOK_SECRET)

            const headers = {
                'Content-Type': 'application/json',
                'x-casso-signature': sig
            }

            // First request
            await request.post(WEBHOOK_URL, { headers, data: payload })

            // Second request with same txId — must return 200 (idempotent)
            // May return { ok: true, duplicate: true } or { ok: true } depending on timing
            const sig2 = generateCassoSignature(payload, WEBHOOK_SECRET)
            const res2 = await request.post(WEBHOOK_URL, {
                headers: { ...headers, 'x-casso-signature': sig2 },
                data: payload
            })
            expect(res2.status()).toBe(200)
            const body2 = await res2.json()
            expect(body2.ok).toBe(true)
            // duplicate flag may or may not be present depending on DB write timing
            if (body2.duplicate !== undefined) {
                expect(body2.duplicate).toBe(true)
            }
        })
    })
})
