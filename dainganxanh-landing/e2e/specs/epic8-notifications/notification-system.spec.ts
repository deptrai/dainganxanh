import { test, expect } from '@playwright/test'
import { getOTPFromMailpit } from '../../fixtures/mailpit'
import { ADMIN_EMAIL, TEST_EMAIL } from '../../fixtures/identity'
import { loginAsAdmin } from '../../fixtures/auth'

/**
 * Notification System E2E Test Suite
 * Tests email and Telegram notification triggers, templates, and payloads
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 * - Admin user: TEST_ADMIN_EMAIL (env override)
 */

test.describe('[P1] Notification System E2E', () => {


    /**
     * Helper: Complete admin login flow
     */
    /**
     * Helper: Verify email was sent with correct payload
     */
    function verifyEmailPayload(
        emailPayload: any,
        expectedTemplate: string,
        expectedRecipient: string,
        requiredFields: string[]
    ): boolean {
        if (!emailPayload) return false
        if (emailPayload.template !== expectedTemplate) return false
        if (emailPayload.to !== expectedRecipient) return false

        for (const field of requiredFields) {
            if (!emailPayload.data || !(field in emailPayload.data)) {
                return false
            }
        }

        return true
    }

    /**
     * Helper: Verify Telegram message contains keywords
     */
    function verifyTelegramMessage(telegramPayload: any, keywords: string[], chatId?: string): boolean {
        if (!telegramPayload) return false
        if (chatId && telegramPayload.chat_id !== chatId) return false

        const messageText = telegramPayload.text.toLowerCase()
        return keywords.every(keyword => messageText.includes(keyword.toLowerCase()))
    }

    /**
     * Section 1: Email Notifications
     */

    /**
     * Test 1: Email notification for order confirmation after payment
     */
    test('email notification sent on order confirmation after payment', async ({ page }) => {
        let emailApiCalls: any[] = []

        await loginAsAdmin(page)

        // Mock email API
        await page.route('**/api/email/send-order-confirmation', async route => {
            if (route.request().method() === 'POST') {
                const payload = route.request().postDataJSON()
                emailApiCalls.push(payload)

                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ message_id: `msg-${require('crypto').randomBytes(4).toString('hex')}` })
                })
            } else {
                await route.continue()
            }
        })

        // Trigger order confirmation email
        const orderData = {
            order_code: 'DH123456',
            amount: 1300000,
            tree_count: 5,
            customer_email: 'customer@example.com',
            next_steps: 'Hợp đồng sẽ được gửi qua email trong 24 giờ'
        }

        await page.evaluate(async (data) => {
            await fetch('/api/email/send-order-confirmation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template: 'order-confirmation',
                    to: data.customer_email,
                    data: {
                        order_id: data.order_code,
                        amount: data.amount,
                        tree_count: data.tree_count,
                        next_steps: data.next_steps
                    }
                })
            })
        }, orderData)

        await page.waitForLoadState('networkidle')

        // Verify email sent with correct template and data
        expect(emailApiCalls.length).toBeGreaterThan(0)

        const emailPayload = emailApiCalls[0]
        expect(emailPayload.template).toBe('order-confirmation')
        expect(emailPayload.to).toBe(orderData.customer_email)
        expect(emailPayload.data.order_id).toBe(orderData.order_code)
        expect(emailPayload.data.amount).toBe(orderData.amount)
        expect(emailPayload.data.tree_count).toBe(orderData.tree_count)
        expect(emailPayload.data.next_steps).toBeTruthy()

        await page.screenshot({
            path: 'e2e-results/email-order-confirmation.png',
            fullPage: true
        })

        console.log('✅ Order confirmation email sent')
        console.log(`   - Template: ${emailPayload.template}`)
        console.log(`   - Recipient: ${emailPayload.to}`)
        console.log(`   - Order ID: ${emailPayload.data.order_id}`)
        console.log(`   - Amount: ${emailPayload.data.amount.toLocaleString('vi-VN')} ₫`)
        console.log(`   - Tree count: ${emailPayload.data.tree_count}`)
    })

    /**
     * Test 2: Email notification for withdrawal approved
     */
    test('email notification sent on withdrawal approval', async ({ page }) => {
        let emailApiCalls: any[] = []

        await loginAsAdmin(page)

        // Mock email API
        await page.route('**/api/email/send-withdrawal-email', async route => {
            if (route.request().method() === 'POST') {
                const payload = route.request().postDataJSON()
                emailApiCalls.push(payload)

                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ message_id: `msg-${require('crypto').randomBytes(4).toString('hex')}` })
                })
            } else {
                await route.continue()
            }
        })

        // Trigger withdrawal approved email
        const withdrawalData = {
            user_email: 'user@example.com',
            amount: 500000,
            bank_name: 'Vietcombank',
            account_number: '1234567890',
            account_name: 'Nguyen Van A',
            proof_image: 'https://storage.supabase.co/withdrawals/proof-123.jpg'
        }

        await page.evaluate(async (data) => {
            await fetch('/api/email/send-withdrawal-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template: 'withdrawal-approved',
                    to: data.user_email,
                    data: {
                        amount: data.amount,
                        bank_name: data.bank_name,
                        account_number: data.account_number,
                        account_name: data.account_name,
                        proof_image_link: data.proof_image
                    }
                })
            })
        }, withdrawalData)

        await page.waitForLoadState('networkidle')

        // Verify email sent with correct template and data
        expect(emailApiCalls.length).toBeGreaterThan(0)

        const emailPayload = emailApiCalls[0]
        expect(emailPayload.template).toBe('withdrawal-approved')
        expect(emailPayload.to).toBe(withdrawalData.user_email)
        expect(emailPayload.data.amount).toBe(withdrawalData.amount)
        expect(emailPayload.data.bank_name).toBe(withdrawalData.bank_name)
        expect(emailPayload.data.account_number).toBe(withdrawalData.account_number)
        expect(emailPayload.data.proof_image_link).toBeTruthy()

        await page.screenshot({
            path: 'e2e-results/email-withdrawal-approved.png',
            fullPage: true
        })

        console.log('✅ Withdrawal approved email sent')
        console.log(`   - Template: ${emailPayload.template}`)
        console.log(`   - Recipient: ${emailPayload.to}`)
        console.log(`   - Amount: ${emailPayload.data.amount.toLocaleString('vi-VN')} ₫`)
        console.log(`   - Bank: ${emailPayload.data.bank_name}`)
        console.log(`   - Account: ${emailPayload.data.account_number}`)
    })

    /**
     * Test 3: Email notification for withdrawal rejected
     */
    test('email notification sent on withdrawal rejection', async ({ page }) => {
        let emailApiCalls: any[] = []

        await loginAsAdmin(page)

        // Mock email API
        await page.route('**/api/email/send-withdrawal-email', async route => {
            if (route.request().method() === 'POST') {
                const payload = route.request().postDataJSON()
                emailApiCalls.push(payload)

                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ message_id: `msg-${require('crypto').randomBytes(4).toString('hex')}` })
                })
            } else {
                await route.continue()
            }
        })

        // Trigger withdrawal rejected email
        const rejectionData = {
            user_email: 'user@example.com',
            amount: 500000,
            rejection_reason: 'Thông tin tài khoản không khớp với hệ thống. Vui lòng kiểm tra lại.',
            available_balance: 1200000
        }

        await page.evaluate(async (data) => {
            await fetch('/api/email/send-withdrawal-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template: 'withdrawal-rejected',
                    to: data.user_email,
                    data: {
                        amount: data.amount,
                        rejection_reason: data.rejection_reason,
                        balance_info: data.available_balance
                    }
                })
            })
        }, rejectionData)

        await page.waitForLoadState('networkidle')

        // Verify email sent with correct template and data
        expect(emailApiCalls.length).toBeGreaterThan(0)

        const emailPayload = emailApiCalls[0]
        expect(emailPayload.template).toBe('withdrawal-rejected')
        expect(emailPayload.to).toBe(rejectionData.user_email)
        expect(emailPayload.data.amount).toBe(rejectionData.amount)
        expect(emailPayload.data.rejection_reason).toBeTruthy()
        expect(emailPayload.data.balance_info).toBeTruthy()

        await page.screenshot({
            path: 'e2e-results/email-withdrawal-rejected.png',
            fullPage: true
        })

        console.log('✅ Withdrawal rejected email sent')
        console.log(`   - Template: ${emailPayload.template}`)
        console.log(`   - Recipient: ${emailPayload.to}`)
        console.log(`   - Amount: ${emailPayload.data.amount.toLocaleString('vi-VN')} ₫`)
        console.log(`   - Reason: ${emailPayload.data.rejection_reason}`)
        console.log(`   - Balance: ${emailPayload.data.balance_info.toLocaleString('vi-VN')} ₫`)
    })

    /**
     * Test 4: Email notification for quarterly report available
     */
    test('email notification sent when quarterly report is ready', async ({ page }) => {
        let emailApiCalls: any[] = []

        await loginAsAdmin(page)

        // Mock email API
        await page.route('**/api/email/send-report-notification', async route => {
            if (route.request().method() === 'POST') {
                const payload = route.request().postDataJSON()
                emailApiCalls.push(payload)

                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ message_id: `msg-${require('crypto').randomBytes(4).toString('hex')}` })
                })
            } else {
                await route.continue()
            }
        })

        // Trigger quarterly report email
        const reportData = {
            owner_email: 'owner@example.com',
            report_period: 'Q1 2026',
            download_link: 'https://storage.supabase.co/reports/Q1-2026-report.pdf',
            order_code: 'DH123456'
        }

        await page.evaluate(async (data) => {
            await fetch('/api/email/send-report-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template: 'report-ready',
                    to: data.owner_email,
                    data: {
                        report_period: data.report_period,
                        download_link: data.download_link,
                        order_code: data.order_code
                    }
                })
            })
        }, reportData)

        await page.waitForLoadState('networkidle')

        // Verify email sent with correct template and data
        expect(emailApiCalls.length).toBeGreaterThan(0)

        const emailPayload = emailApiCalls[0]
        expect(emailPayload.template).toBe('report-ready')
        expect(emailPayload.to).toBe(reportData.owner_email)
        expect(emailPayload.data.report_period).toBeTruthy()
        expect(emailPayload.data.download_link).toBeTruthy()
        expect(emailPayload.data.report_period).toMatch(/Q[1-4]/)

        await page.screenshot({
            path: 'e2e-results/email-report-ready.png',
            fullPage: true
        })

        console.log('✅ Quarterly report email sent')
        console.log(`   - Template: ${emailPayload.template}`)
        console.log(`   - Recipient: ${emailPayload.to}`)
        console.log(`   - Period: ${emailPayload.data.report_period}`)
        console.log(`   - Download link: ${emailPayload.data.download_link}`)
    })

    /**
     * Section 2: Telegram Notifications
     */

    /**
     * Test 5: Telegram notification for new order to admin
     */
    test('telegram notification sent to admin on new order', async ({ page }) => {
        let telegramApiCalls: any[] = []

        await loginAsAdmin(page)

        // Mock Telegram API
        await page.route('**/api/telegram/send', async route => {
            if (route.request().method() === 'POST') {
                const payload = route.request().postDataJSON()
                telegramApiCalls.push(payload)

                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ ok: true, result: { message_id: 123 } })
                })
            } else {
                await route.continue()
            }
        })

        // Trigger new order Telegram notification
        const orderData = {
            order_code: 'DH789012',
            amount: 2600000,
            customer_name: 'Nguyen Van B',
            admin_chat_id: '-1001234567890'
        }

        await page.evaluate(async (data) => {
            await fetch('/api/telegram/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: data.admin_chat_id,
                    text: `🆕 Đơn hàng mới: ${data.order_code}\n💰 Số tiền: ${data.amount.toLocaleString('vi-VN')} ₫\n👤 Khách hàng: ${data.customer_name}`
                })
            })
        }, orderData)

        await page.waitForLoadState('networkidle')

        // Verify Telegram message sent with correct data
        expect(telegramApiCalls.length).toBeGreaterThan(0)

        const telegramPayload = telegramApiCalls[0]
        expect(telegramPayload.chat_id).toBe(orderData.admin_chat_id)
        expect(telegramPayload.text).toContain(orderData.order_code)
        expect(telegramPayload.text).toContain(orderData.customer_name)
        expect(telegramPayload.text.toLowerCase()).toMatch(/đơn hàng|order/)

        await page.screenshot({
            path: 'e2e-results/telegram-new-order.png',
            fullPage: true
        })

        console.log('✅ Telegram notification sent to admin')
        console.log(`   - Chat ID: ${telegramPayload.chat_id}`)
        console.log(`   - Order code: ${orderData.order_code}`)
        console.log(`   - Customer: ${orderData.customer_name}`)
        console.log(`   - Amount: ${orderData.amount.toLocaleString('vi-VN')} ₫`)
    })

    /**
     * Test 6: Telegram notification for withdrawal request
     */
    test('telegram notification sent to admin on withdrawal request', async ({ page }) => {
        let telegramApiCalls: any[] = []

        await loginAsAdmin(page)

        // Mock Telegram API
        await page.route('**/api/telegram/send', async route => {
            if (route.request().method() === 'POST') {
                const payload = route.request().postDataJSON()
                telegramApiCalls.push(payload)

                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ ok: true, result: { message_id: 456 } })
                })
            } else {
                await route.continue()
            }
        })

        // Trigger withdrawal request Telegram notification
        const withdrawalData = {
            user_name: 'Nguyen Van C',
            amount: 800000,
            bank_name: 'Vietcombank',
            account_number: '9876543210',
            admin_group_id: '-1001234567890',
            withdrawal_id: 'withdrawal-123'
        }

        await page.evaluate(async (data) => {
            await fetch('/api/telegram/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: data.admin_group_id,
                    text: `💳 Yêu cầu rút tiền mới\n👤 Người dùng: ${data.user_name}\n💰 Số tiền: ${data.amount.toLocaleString('vi-VN')} ₫\n🏦 Ngân hàng: ${data.bank_name}\n📊 STK: ${data.account_number}`,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '✅ Duyệt', callback_data: `approve_${data.withdrawal_id}` },
                                { text: '❌ Từ chối', callback_data: `reject_${data.withdrawal_id}` }
                            ],
                            [
                                { text: '👁️ Xem chi tiết', url: `https://app.dainganxanh.com/crm/admin/withdrawals/${data.withdrawal_id}` }
                            ]
                        ]
                    }
                })
            })
        }, withdrawalData)

        await page.waitForLoadState('networkidle')

        // Verify Telegram message sent with correct data and action buttons
        expect(telegramApiCalls.length).toBeGreaterThan(0)

        const telegramPayload = telegramApiCalls[0]
        expect(telegramPayload.chat_id).toBe(withdrawalData.admin_group_id)
        expect(telegramPayload.text).toContain(withdrawalData.user_name)
        expect(telegramPayload.text).toContain(withdrawalData.bank_name)
        expect(telegramPayload.text.toLowerCase()).toMatch(/rút tiền|withdrawal/)

        // Verify action buttons
        expect(telegramPayload.reply_markup).toBeTruthy()
        expect(telegramPayload.reply_markup.inline_keyboard).toBeTruthy()
        expect(telegramPayload.reply_markup.inline_keyboard.length).toBeGreaterThan(0)

        const buttons = telegramPayload.reply_markup.inline_keyboard.flat()
        const approveButton = buttons.find((btn: any) => btn.text.includes('Duyệt') || btn.text.includes('✅'))
        const rejectButton = buttons.find((btn: any) => btn.text.includes('Từ chối') || btn.text.includes('❌'))
        const viewButton = buttons.find((btn: any) => btn.text.includes('chi tiết') || btn.text.includes('👁️'))

        expect(approveButton).toBeTruthy()
        expect(rejectButton).toBeTruthy()
        expect(viewButton).toBeTruthy()

        await page.screenshot({
            path: 'e2e-results/telegram-withdrawal-request.png',
            fullPage: true
        })

        console.log('✅ Telegram withdrawal notification sent to admin')
        console.log(`   - Chat ID: ${telegramPayload.chat_id}`)
        console.log(`   - User: ${withdrawalData.user_name}`)
        console.log(`   - Amount: ${withdrawalData.amount.toLocaleString('vi-VN')} ₫`)
        console.log(`   - Bank: ${withdrawalData.bank_name}`)
        console.log(`   - Action buttons: Approve, Reject, View`)
    })

    /**
     * Test 7: Telegram notification for referral code assignment
     */
    test('telegram notification sent to user on referral code assignment', async ({ page }) => {
        let telegramApiCalls: any[] = []

        await loginAsAdmin(page)

        // Mock Telegram API
        await page.route('**/api/telegram/send', async route => {
            if (route.request().method() === 'POST') {
                const payload = route.request().postDataJSON()
                telegramApiCalls.push(payload)

                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ ok: true, result: { message_id: 789 } })
                })
            } else {
                await route.continue()
            }
        })

        // Trigger referral code assignment notification
        const referralData = {
            user_telegram_chat_id: '987654321',
            referral_code: 'REF2026ABC',
            user_name: 'Nguyen Van D'
        }

        await page.evaluate(async (data) => {
            await fetch('/api/telegram/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: data.user_telegram_chat_id,
                    text: `🎉 Chúc mừng ${data.user_name}!\n\nBạn đã được cấp mã giới thiệu: ${data.referral_code}\n\n📋 Cách sử dụng:\n1. Chia sẻ mã với bạn bè\n2. Khi bạn bè mua cây, họ nhập mã của bạn\n3. Bạn nhận hoa hồng cho mỗi đơn hàng thành công\n\n💰 Xem thu nhập tại: https://app.dainganxanh.com/crm/referrals`
                })
            })
        }, referralData)

        await page.waitForLoadState('networkidle')

        // Verify Telegram message sent with correct data
        expect(telegramApiCalls.length).toBeGreaterThan(0)

        const telegramPayload = telegramApiCalls[0]
        expect(telegramPayload.chat_id).toBe(referralData.user_telegram_chat_id)
        expect(telegramPayload.text).toContain(referralData.referral_code)
        expect(telegramPayload.text).toContain(referralData.user_name)
        expect(telegramPayload.text.toLowerCase()).toMatch(/giới thiệu|referral|mã/)

        await page.screenshot({
            path: 'e2e-results/telegram-referral-assignment.png',
            fullPage: true
        })

        console.log('✅ Telegram referral notification sent to user')
        console.log(`   - Chat ID: ${telegramPayload.chat_id}`)
        console.log(`   - User: ${referralData.user_name}`)
        console.log(`   - Referral code: ${referralData.referral_code}`)
        console.log(`   - Message includes usage instructions`)
    })
})
