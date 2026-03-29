import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { sendEmail } from '../_shared/mailer.ts'

// Environment validation
const BASE_URL = Deno.env.get('NEXT_PUBLIC_BASE_URL') || 'https://dainganxanh.com.vn'

interface QuarterlyUpdateRequest {
  userEmail: string
  userName: string
  lotName: string
  lotRegion: string
  photoUrl: string
  orderCodes: string[]
  totalTrees: number
}

serve(async (req) => {
  try {
    const payload: QuarterlyUpdateRequest = await req.json()

    // Embedded email template
    const emailTemplate = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cập nhật cây của bạn - Đại Ngàn Xanh</title>
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
    .photo-section { background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center; }
    .photo-section h3 { color: #2d5016; font-size: 18px; margin-bottom: 15px; }
    .photo-img { max-width: 100%; border-radius: 8px; margin: 15px 0; }
    .lot-info { background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); border-radius: 8px; padding: 25px; margin-bottom: 30px; color: white; }
    .lot-info h3 { font-size: 18px; margin-bottom: 15px; color: #d4edda; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.2); }
    .info-row:last-child { border-bottom: none; }
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
      <h2 class="greeting">Xin chào ${payload.userName}! 📸</h2>
      <p class="message">Chúng tôi vừa cập nhật ảnh mới cho cây của bạn! Hãy xem cây của bạn đang lớn lên như thế nào nhé.</p>
      
      <div class="photo-section">
        <h3>🌱 Ảnh mới nhất</h3>
        <img src="${payload.photoUrl}" alt="Ảnh cây mới" class="photo-img" />
        <p style="color: #666; font-size: 14px; margin-top: 10px;">Ảnh được chụp tại lô ${payload.lotName}</p>
      </div>

      <div class="lot-info">
        <h3>📍 Thông tin lô cây</h3>
        <div class="info-row"><span>Tên lô:</span><strong>${payload.lotName}</strong></div>
        <div class="info-row"><span>Khu vực:</span><strong>${payload.lotRegion}</strong></div>
        <div class="info-row"><span>Số cây của bạn:</span><strong>${payload.totalTrees} cây</strong></div>
        <div class="info-row"><span>Mã gói:</span><strong>${payload.orderCodes.join(', ')}</strong></div>
      </div>

      <center><a href="${BASE_URL}/crm/my-garden" class="cta-button">🌳 Xem Vườn Cây Của Bạn</a></center>
      
      <p class="message" style="margin-top: 30px;"><strong>💡 Lưu ý:</strong> Chúng tôi sẽ gửi ảnh cập nhật định kỳ mỗi quý để bạn theo dõi sự phát triển của cây.</p>
    </div>
    <div class="footer">
      <p style="margin-top: 20px; color: #999; font-size: 12px;">© 2026 Đại Ngàn Xanh. Mọi quyền được bảo lưu.<br>Email này được gửi tự động, vui lòng không trả lời.</p>
    </div>
  </div>
</body>
</html>`

    await sendEmail({
      to: payload.userEmail,
      subject: `🌳 Cây của bạn có ảnh mới tại lô ${payload.lotName}!`,
      html: emailTemplate,
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Quarterly update email sent successfully',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Email sending failed:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
