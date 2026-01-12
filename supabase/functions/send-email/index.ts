import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'npm:resend@2.0.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface EmailRequest {
    orderId: string
    userId: string
    userEmail: string
    userName: string
    orderCode: string
    quantity: number
    totalAmount: number
    treeCodes: string[]
    contractPdfUrl: string
}

serve(async (req) => {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const payload: EmailRequest = await req.json()

        // Embedded email template (Edge Functions can't access file system)
        const emailTemplate = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác nhận đơn hàng - Đại Ngàn Xanh</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); padding: 40px 20px; text-align: center; }
    .logo { font-size: 32px; font-weight: bold; color: white; margin-bottom: 10px; }
    .header-subtitle { color: #d4edda; font-size: 14px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 24px; color: #2d5016; margin-bottom: 20px; }
    .message { font-size: 16px; color: #666; margin-bottom: 30px; line-height: 1.8; }
    .order-summary { background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
    .order-summary h3 { color: #2d5016; font-size: 18px; margin-bottom: 15px; }
    .order-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
    .order-row:last-child { border-bottom: none; font-weight: bold; color: #2d5016; }
    .tree-codes { background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); border-radius: 8px; padding: 25px; margin-bottom: 30px; color: white; }
    .tree-codes h3 { font-size: 18px; margin-bottom: 15px; color: #d4edda; }
    .code-list { display: flex; flex-wrap: wrap; gap: 10px; }
    .code-item { background: rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 20px; font-family: 'Courier New', monospace; font-size: 14px; font-weight: bold; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🌳 Đại Ngàn Xanh</div>
      <div class="header-subtitle">Gieo Hạt Lành, Gặt Phước Báu</div>
    </div>
    <div class="content">
      <h2 class="greeting">Xin chào {{user_name}}! 🎉</h2>
      <p class="message">Cảm ơn bạn đã chung tay cùng Đại Ngàn Xanh gieo mầm cho tương lai xanh! Đơn hàng của bạn đã được xác nhận thành công.</p>
      <div class="order-summary">
        <h3>📋 Chi tiết đơn hàng</h3>
        <div class="order-row"><span>Mã đơn hàng:</span><strong>{{order_code}}</strong></div>
        <div class="order-row"><span>Số cây:</span><strong>{{quantity}} cây</strong></div>
        <div class="order-row"><span>Tổng tiền:</span><strong>{{total_amount}} đ</strong></div>
        <div class="order-row"><span>Tác động môi trường:</span><strong>-{{co2_impact}} kg CO₂/năm</strong></div>
      </div>
      <div class="tree-codes">
        <h3>🌱 Mã cây của bạn</h3>
        <div class="code-list">{{#each tree_codes}}<div class="code-item">{{this}}</div>{{/each}}</div>
      </div>
      <center><a href="{{dashboard_url}}" class="cta-button">🌳 Xem Vườn Cây Của Bạn</a></center>
      <p class="message" style="margin-top: 30px;"><strong>Hợp đồng điện tử:</strong> Vui lòng xem file đính kèm để biết chi tiết về cam kết chăm sóc 5 năm và chính sách thu mua lại.</p>
    </div>
    <div class="footer">
      <p style="margin-top: 20px; color: #999; font-size: 12px;">© 2026 Đại Ngàn Xanh. Mọi quyền được bảo lưu.<br>Email này được gửi tự động, vui lòng không trả lời.</p>
    </div>
  </div>
</body>
</html>`

        // Replace template variables
        const co2Impact = payload.quantity * 100 // 100kg CO2/tree/year
        const dashboardUrl = `${Deno.env.get('NEXT_PUBLIC_BASE_URL')}/crm/my-garden`

        let emailHtml = emailTemplate
            .replace(/{{user_name}}/g, payload.userName)
            .replace(/{{order_code}}/g, payload.orderCode)
            .replace(/{{quantity}}/g, payload.quantity.toString())
            .replace(/{{total_amount}}/g, payload.totalAmount.toLocaleString('vi-VN'))
            .replace(/{{co2_impact}}/g, co2Impact.toString())
            .replace(/{{dashboard_url}}/g, dashboardUrl)

        // Replace tree codes (Handlebars-style)
        const treeCodesHtml = payload.treeCodes
            .map(code => `<div class="code-item">${code}</div>`)
            .join('\n          ')
        emailHtml = emailHtml.replace(
            /{{#each tree_codes}}[\s\S]*?{{\/each}}/,
            treeCodesHtml
        )

        // Download PDF from Supabase Storage
        const { data: pdfData, error: storageError } = await supabase.storage
            .from('contracts')
            .download(payload.contractPdfUrl)

        if (storageError) {
            throw new Error(`Failed to download PDF: ${storageError.message}`)
        }

        const pdfBuffer = await pdfData.arrayBuffer()
        const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)))

        // Send email via Resend
        const { data, error } = await resend.emails.send({
            from: `Đại Ngàn Xanh <${Deno.env.get('RESEND_FROM_EMAIL')}>`,
            to: [payload.userEmail],
            subject: `🌳 Xác nhận đơn hàng ${payload.orderCode}`,
            html: emailHtml,
            attachments: [{
                filename: `contract-${payload.orderCode}.pdf`,
                content: pdfBase64,
            }],
        })

        if (error) {
            throw new Error(`Resend error: ${error.message}`)
        }

        // Log email status
        await supabase.from('email_logs').insert({
            order_id: payload.orderId,
            email_type: 'order_confirmation',
            recipient: payload.userEmail,
            status: 'sent',
            resend_id: data?.id,
            sent_at: new Date().toISOString(),
        })

        return new Response(
            JSON.stringify({
                success: true,
                emailId: data?.id,
                message: 'Email sent successfully'
            }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        console.error('Email sending failed:', error)

        // Log failure
        try {
            const supabase = createClient(supabaseUrl, supabaseServiceKey)
            const payload: EmailRequest = await req.json()

            await supabase.from('email_logs').insert({
                order_id: payload.orderId,
                email_type: 'order_confirmation',
                recipient: payload.userEmail,
                status: 'failed',
                error_message: error.message,
            })
        } catch (logError) {
            console.error('Failed to log error:', logError)
        }

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 500
            }
        )
    }
})
