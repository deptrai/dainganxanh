import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Initialize Resend
        const resendApiKey = Deno.env.get('RESEND_API_KEY')
        if (!resendApiKey) {
            throw new Error('RESEND_API_KEY not configured')
        }
        const resend = new Resend(resendApiKey)
        const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@dainganxanh.com'
        const appUrl = Deno.env.get('NEXT_PUBLIC_BASE_URL') || 'http://localhost:3001'

        // Query harvest-ready trees (>= 60 months old, not yet notified)
        const { data: harvestReadyTrees, error: queryError } = await supabase.rpc('get_harvest_ready_trees')

        if (queryError) {
            throw queryError
        }

        console.log(`Found ${harvestReadyTrees?.length || 0} harvest-ready trees`)

        const results = []

        // Embedded email template
        const emailTemplate = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cây Sẵn Sàng Thu Hoạch</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0fdf4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 32px; font-weight: bold; }
        .header .emoji { font-size: 64px; margin-bottom: 16px; }
        .content { padding: 40px 30px; }
        .content h2 { color: #065f46; font-size: 24px; margin-bottom: 16px; }
        .content p { color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
        .tree-info { background-color: #fef3c7; border: 3px solid #fbbf24; border-radius: 12px; padding: 20px; margin: 24px 0; }
        .tree-info h3 { color: #92400e; font-size: 18px; margin: 0 0 16px 0; }
        .tree-info .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .tree-info .label { color: #78350f; font-weight: 600; }
        .tree-info .value { color: #92400e; font-weight: bold; }
        .option { background-color: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
        .option .icon { font-size: 24px; margin-right: 8px; }
        .option h4 { color: #1f2937; font-size: 16px; margin: 0 0 8px 0; }
        .option p { color: #6b7280; font-size: 14px; margin: 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #78350f; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 18px; font-weight: bold; text-align: center; margin: 24px 0; box-shadow: 0 4px 6px rgba(251, 191, 36, 0.3); }
        .footer { background-color: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }
        .footer a { color: #10b981; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emoji">🌟</div>
            <h1>Cây Sẵn Sàng Thu Hoạch!</h1>
        </div>
        <div class="content">
            <h2>Chúc mừng bạn!</h2>
            <p>Cây của bạn đã đạt 5 năm tuổi và sẵn sàng cho thu hoạch. Đây là một cột mốc quan trọng trong hành trình trồng cây của bạn!</p>
            <div class="tree-info">
                <h3>Thông Tin Cây</h3>
                <div class="info-row"><span class="label">Mã cây:</span><span class="value">{{tree_code}}</span></div>
                <div class="info-row"><span class="label">Tuổi cây:</span><span class="value">{{age_months}} tháng</span></div>
                <div class="info-row"><span class="label">CO₂ đã hấp thụ:</span><span class="value">{{co2_absorbed}} kg</span></div>
            </div>
            <h2>Lựa Chọn Thu Hoạch</h2>
            <p>Bạn có 3 lựa chọn để xử lý cây của mình:</p>
            <div class="option"><h4><span class="icon">💰</span> Bán lại cho Đại Ngàn Xanh</h4><p>Nhận thanh toán ngay theo giá thị trường hiện tại</p></div>
            <div class="option"><h4><span class="icon">🌳</span> Tiếp tục nuôi cây</h4><p>Giữ cây tiếp tục lớn để tăng giá trị và hấp thụ thêm CO₂</p></div>
            <div class="option"><h4><span class="icon">🎁</span> Chuyển nhượng quyền sở hữu</h4><p>Tặng hoặc bán cây cho người khác trong cộng đồng</p></div>
            <center><a href="{{harvest_url}}" class="cta-button">Xem Chi Tiết & Chọn Phương Án</a></center>
            <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">💡 <strong>Lưu ý:</strong> Vui lòng đăng nhập vào tài khoản của bạn để xem đầy đủ thông tin và thực hiện lựa chọn.</p>
        </div>
        <div class="footer">
            <p>Email này được gửi từ <strong>Đại Ngàn Xanh</strong><br><a href="https://dainganxanh.com">dainganxanh.com</a></p>
            <p style="margin-top: 16px; font-size: 12px;">Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email <a href="mailto:support@dainganxanh.com">support@dainganxanh.com</a></p>
        </div>
    </div>
</body>
</html>`

        // Process each harvest-ready tree
        for (const tree of harvestReadyTrees || []) {
            try {
                // Insert notification
                const { error: notifError } = await supabase.from('notifications').insert({
                    user_id: tree.user_id,
                    type: 'harvest_ready',
                    title: 'Cây sẵn sàng thu hoạch',
                    message: `Cây ${tree.tree_code} đã đạt 5 năm tuổi và sẵn sàng cho thu hoạch!`,
                    data: {
                        treeId: tree.id,
                        treeCode: tree.tree_code,
                        orderId: tree.order_id,
                        ageMonths: tree.age_months,
                    },
                    read: false,
                })

                if (notifError) {
                    console.error(`Failed to create notification for tree ${tree.id}:`, notifError)
                    results.push({ treeId: tree.id, status: 'notification_failed', error: notifError.message })
                    continue
                }

                // Prepare email HTML
                const harvestUrl = `${appUrl}/crm/my-garden/${tree.order_id}/harvest`
                const emailHtml = emailTemplate
                    .replace(/{{tree_code}}/g, tree.tree_code)
                    .replace(/{{age_months}}/g, tree.age_months.toString())
                    .replace(/{{co2_absorbed}}/g, (tree.co2_absorbed || 0).toFixed(1))
                    .replace(/{{harvest_url}}/g, harvestUrl)

                // Send email via Resend
                const { data, error } = await resend.emails.send({
                    from: `Đại Ngàn Xanh <${fromEmail}>`,
                    to: [tree.user_email],
                    subject: '🌟 Cây của bạn sẵn sàng thu hoạch!',
                    html: emailHtml,
                })

                if (error) {
                    console.error(`Failed to send email for tree ${tree.id}:`, error)
                    results.push({ treeId: tree.id, status: 'email_failed', error: error.message })
                } else {
                    console.log(`Successfully processed tree ${tree.id}, email ID: ${data?.id}`)
                    results.push({ treeId: tree.id, status: 'success', emailId: data?.id })
                }
            } catch (error) {
                console.error(`Error processing tree ${tree.id}:`, error)
                results.push({ treeId: tree.id, status: 'error', error: error.message })
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                processed: results.length,
                results,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Function error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})

