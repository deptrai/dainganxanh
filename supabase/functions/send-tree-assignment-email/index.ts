import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../_shared/mailer.ts'
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface TreeAssignmentEmailRequest {
    orderId: string
    userId: string
    userEmail: string
    userName: string
    treeCodes: string[]
    lotName: string
    lotRegion: string
    lotDescription?: string
    lotLocationLat?: number
    lotLocationLng?: number
}

serve(async (req) => {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const payload: TreeAssignmentEmailRequest = await req.json()

        // Email template for tree assignment
        const emailTemplate = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cây của bạn đã được gán lô - Đại Ngàn Xanh</title>
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
    .lot-info { background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
    .lot-info h3 { color: #2d5016; font-size: 18px; margin-bottom: 15px; }
    .info-row { padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #666; font-size: 14px; }
    .info-value { color: #333; font-weight: 600; margin-top: 5px; }
    .tree-codes { background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); border-radius: 8px; padding: 25px; margin-bottom: 30px; color: white; }
    .tree-codes h3 { font-size: 18px; margin-bottom: 15px; color: #d4edda; }
    .code-list { display: flex; flex-wrap: wrap; gap: 10px; }
    .code-item { background: rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 20px; font-family: 'Courier New', monospace; font-size: 14px; font-weight: bold; }
    .map-link { display: inline-block; background: #4285f4; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; margin-top: 15px; }
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
      <p class="message">Tin vui! Những cây của bạn đã được gán vào lô cây và sẵn sàng để trồng. Đội ngũ của chúng tôi sẽ bắt đầu chăm sóc chúng ngay.</p>
      
      <div class="tree-codes">
        <h3>🌱 Mã cây của bạn</h3>
        <div class="code-list">{{tree_codes_html}}</div>
      </div>

      <div class="lot-info">
        <h3>📍 Thông tin lô cây</h3>
        <div class="info-row">
          <div class="info-label">Tên lô:</div>
          <div class="info-value">{{lot_name}}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Khu vực:</div>
          <div class="info-value">{{lot_region}}</div>
        </div>
        {{lot_description_html}}
        {{lot_location_html}}
      </div>

      <center><a href="{{dashboard_url}}" class="cta-button">🌳 Xem Vườn Cây Của Bạn</a></center>
      
      <p class="message" style="margin-top: 30px;">Bạn sẽ nhận được cập nhật định kỳ về tình trạng cây của mình qua email và có thể theo dõi chi tiết trên dashboard.</p>
    </div>
    <div class="footer">
      <p style="margin-top: 20px; color: #999; font-size: 12px;">© 2026 Đại Ngàn Xanh. Mọi quyền được bảo lưu.<br>Email này được gửi tự động, vui lòng không trả lời.</p>
    </div>
  </div>
</body>
</html>`

        const dashboardUrl = `${Deno.env.get('NEXT_PUBLIC_BASE_URL')}/crm/my-garden`

        // Replace basic variables
        let emailHtml = emailTemplate
            .replace(/{{user_name}}/g, payload.userName)
            .replace(/{{lot_name}}/g, payload.lotName)
            .replace(/{{lot_region}}/g, payload.lotRegion)
            .replace(/{{dashboard_url}}/g, dashboardUrl)

        // Replace tree codes
        const treeCodesHtml = payload.treeCodes
            .map(code => `<div class="code-item">${code}</div>`)
            .join('\n          ')
        emailHtml = emailHtml.replace(/{{tree_codes_html}}/g, treeCodesHtml)

        // Replace optional lot description
        const lotDescriptionHtml = payload.lotDescription
            ? `<div class="info-row">
          <div class="info-label">Mô tả:</div>
          <div class="info-value">${payload.lotDescription}</div>
        </div>`
            : ''
        emailHtml = emailHtml.replace(/{{lot_description_html}}/g, lotDescriptionHtml)

        // Replace optional GPS location
        const lotLocationHtml = payload.lotLocationLat && payload.lotLocationLng
            ? `<div class="info-row">
          <div class="info-label">Vị trí GPS:</div>
          <div class="info-value">
            ${payload.lotLocationLat.toFixed(6)}, ${payload.lotLocationLng.toFixed(6)}
            <br>
            <a href="https://www.google.com/maps?q=${payload.lotLocationLat},${payload.lotLocationLng}" class="map-link" target="_blank">
              📍 Xem trên Google Maps
            </a>
          </div>
        </div>`
            : ''
        emailHtml = emailHtml.replace(/{{lot_location_html}}/g, lotLocationHtml)

        await sendEmail({
            to: payload.userEmail,
            subject: `🌳 Cây của bạn đã được gán vào lô ${payload.lotName}`,
            html: emailHtml,
        })

        // Log email status
        await supabase.from('email_logs').insert({
            order_id: payload.orderId,
            email_type: 'tree_assignment',
            recipient: payload.userEmail,
            status: 'sent',
            sent_at: new Date().toISOString(),
        })

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Tree assignment email sent successfully'
            }),
            {
                headers: { 'Content-Type': 'application/json' },
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
                headers: { 'Content-Type': 'application/json' },
                status: 500
            }
        )
    }
})
