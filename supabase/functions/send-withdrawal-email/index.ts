import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'npm:resend@2.0.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface WithdrawalEmailRequest {
    type: 'request_created' | 'request_approved' | 'request_rejected'
    to: string // Changed from 'email' to match server action
    fullName: string
    amount: number
    bankName: string
    bankAccountNumber: string
    withdrawalId: string
    // Optional fields depending on type
    rejectionReason?: string
    proofImageUrl?: string
}

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            },
        })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    let payload: WithdrawalEmailRequest | null = null

    try {
        payload = await req.json()

        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
        }

        let subject = ''
        let htmlContent = ''

        const commonStyles = `
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        `

        const headerStyle = `
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
        `

        const logoStyle = `
            font-size: 24px;
            font-weight: bold;
            color: #10b981;
            text-decoration: none;
        `

        const footerStyle = `
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 12px;
            color: #666;
        `

        switch (payload.type) {
            case 'request_created':
                subject = 'Yêu cầu rút tiền mới - Đại Ngàn Xanh'
                htmlContent = `
                    <div style="${commonStyles}">
                        <div style="${headerStyle}">
                            <div style="${logoStyle}">Đại Ngàn Xanh</div>
                        </div>
                        <h2>Yêu cầu rút tiền mới</h2>
                        <p>Có một yêu cầu rút tiền mới từ <strong>${payload.fullName}</strong>.</p>
                        
                        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Số tiền:</strong> ${formatCurrency(payload.amount)}</p>
                            <p><strong>Ngân hàng:</strong> ${payload.bankName}</p>
                            <p><strong>Số tài khoản:</strong> ${payload.bankAccountNumber}</p>
                            <p><strong>Người nhận:</strong> ${payload.fullName}</p>
                        </div>

                        <p>Vui lòng kiểm tra và xử lý tại trang quản trị.</p>
                        
                        <div style="${footerStyle}">
                            <p>Email này được gửi tự động từ hệ thống Đại Ngàn Xanh.</p>
                        </div>
                    </div>
                `
                break

            case 'request_approved':
                subject = 'Yêu cầu rút tiền đã được duyệt - Đại Ngàn Xanh'
                htmlContent = `
                    <div style="${commonStyles}">
                        <div style="${headerStyle}">
                            <div style="${logoStyle}">Đại Ngàn Xanh</div>
                        </div>
                        
                        <h2 style="color: #10b981;">Yêu cầu rút tiền thành công</h2>
                        <p>Xin chào <strong>${payload.fullName}</strong>,</p>
                        <p>Yêu cầu rút tiền của bạn đã được duyệt và chuyển khoản thành công.</p>
                        
                        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Số tiền:</strong> ${formatCurrency(payload.amount)}</p>
                            <p><strong>Ngân hàng:</strong> ${payload.bankName}</p>
                            <p><strong>Số tài khoản:</strong> ${payload.bankAccountNumber}</p>
                        </div>

                        ${payload.proofImageUrl ? `
                            <div style="margin-top: 20px;">
                                <p><strong>Hình ảnh chứng từ:</strong></p>
                                <img src="${payload.proofImageUrl}" alt="Chứng từ chuyển khoản" style="max-width: 100%; border-radius: 8px; border: 1px solid #eee;" />
                            </div>
                        ` : ''}
                        
                        <p>Cảm ơn bạn đã đồng hành cùng Đại Ngàn Xanh!</p>

                        <div style="${footerStyle}">
                            <p>Nếu bạn có thắc mắc, vui lòng liên hệ bộ phận hỗ trợ.</p>
                        </div>
                    </div>
                `
                break

            case 'request_rejected':
                subject = 'Thông báo về yêu cầu rút tiền - Đại Ngàn Xanh'
                htmlContent = `
                    <div style="${commonStyles}">
                        <div style="${headerStyle}">
                            <div style="${logoStyle}">Đại Ngàn Xanh</div>
                        </div>
                        
                        <h2 style="color: #ef4444;">Yêu cầu rút tiền bị từ chối</h2>
                        <p>Xin chào <strong>${payload.fullName}</strong>,</p>
                        <p>Rất tiếc, yêu cầu rút tiền của bạn đã không được chấp nhận.</p>
                        
                        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Số tiền:</strong> ${formatCurrency(payload.amount)}</p>
                            <p><strong>Lý do từ chối:</strong></p>
                            <p style="color: #ef4444; font-weight: 500;">${payload.rejectionReason || 'Không có lý do cụ thể'}</p>
                        </div>
                        
                        <p>Vui lòng kiểm tra lại thông tin hoặc liên hệ bộ phận hỗ trợ để được giải đáp.</p>

                        <div style="${footerStyle}">
                            <p>Email này được gửi tự động từ hệ thống Đại Ngàn Xanh.</p>
                        </div>
                    </div>
                `
                break
        }

        const { data, error } = await resend.emails.send({
            from: `Đại Ngàn Xanh <${Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@dainganxanh.com'}>`,
            to: [payload.to],
            subject: subject,
            html: htmlContent,
        })

        if (error) {
            throw new Error(`Resend error: ${error.message}`)
        }

        // Log to email_logs table just like the other function
        // Note: Using 'withdrawal_status' as email_type or generic 'notification'
        // We'll trust the existing schema allows flexible types or we use a standard one.
        // Let's assume 'system_notification' or similar if strictly typed, but for now 'withdrawal_notification'
        await supabase.from('email_logs').insert({
            // order_id is required (NOT NULL) but has no FK, so we store withdrawalId there
            order_id: payload.withdrawalId,
            email_type: 'withdrawal_notification',
            recipient: payload.to,
            status: 'sent',
            resend_id: data?.id,
            sent_at: new Date().toISOString()
        })

        return new Response(
            JSON.stringify({
                success: true,
                emailId: data?.id
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                status: 200
            }
        )

    } catch (error) {
        console.error('Email sending failed:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                status: 500
            }
        )
    }
})
