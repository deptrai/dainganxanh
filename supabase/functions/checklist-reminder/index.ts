import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

// Environment validation
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@dainganxanh.com.vn'
const BASE_URL = Deno.env.get('NEXT_PUBLIC_BASE_URL') || 'https://dainganxanh.com.vn'

if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const resend = new Resend(RESEND_API_KEY)

interface ChecklistItem {
    id: string
    label: string
    completed: boolean
}

interface ChecklistWithLot {
    id: string
    lot_id: string
    quarter: string
    checklist_items: ChecklistItem[]
    overall_status: string
    due_date: string
    lot: {
        name: string
        region: string
    }
}

serve(async (req) => {
    try {
        console.log('🔔 Starting checklist reminder job...')

        // Calculate target date (7 days from now)
        const targetDate = new Date()
        targetDate.setDate(targetDate.getDate() + 7)
        const targetDateStr = targetDate.toISOString().split('T')[0]

        console.log(`📅 Looking for checklists due on: ${targetDateStr}`)

        // Query checklists due in 7 days that are not completed
        const { data: checklists, error: checklistsError } = await supabase
            .from('field_checklists')
            .select(`
        id,
        lot_id,
        quarter,
        checklist_items,
        overall_status,
        due_date,
        lots (
          name,
          region
        )
      `)
            .eq('due_date', targetDateStr)
            .neq('overall_status', 'completed')

        if (checklistsError) {
            throw new Error(`Error fetching checklists: ${checklistsError.message}`)
        }

        if (!checklists || checklists.length === 0) {
            console.log('✅ No checklists due in 7 days')
            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'No checklists due in 7 days',
                    count: 0,
                }),
                {
                    headers: { 'Content-Type': 'application/json' },
                    status: 200,
                }
            )
        }

        console.log(`📋 Found ${checklists.length} checklists to remind`)

        // Get admin emails
        const { data: admins, error: adminsError } = await supabase
            .from('users')
            .select('email, full_name')
            .in('role', ['admin', 'super_admin', 'field_operator'])

        if (adminsError) {
            throw new Error(`Error fetching admins: ${adminsError.message}`)
        }

        if (!admins || admins.length === 0) {
            console.log('⚠️ No admin users found')
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'No admin users found',
                }),
                {
                    headers: { 'Content-Type': 'application/json' },
                    status: 400,
                }
            )
        }

        console.log(`👥 Found ${admins.length} admin users`)

        // Send reminders for each checklist
        const results = []
        for (const checklist of checklists as ChecklistWithLot[]) {
            const lot = Array.isArray(checklist.lot) ? checklist.lot[0] : checklist.lot
            const items = checklist.checklist_items as ChecklistItem[]
            const completedCount = items.filter((i) => i.completed).length
            const totalCount = items.length
            const completionPercentage = Math.round((completedCount / totalCount) * 100)
            const incompleteItems = items.filter((i) => !i.completed)

            // Generate email HTML
            const emailHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nhắc nhở Checklist - Đại Ngàn Xanh</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); padding: 40px 20px; text-align: center; }
    .logo { font-size: 32px; font-weight: bold; color: white; margin-bottom: 10px; }
    .header-subtitle { color: #d4edda; font-size: 14px; }
    .content { padding: 40px 30px; }
    .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
    .alert-title { font-weight: bold; color: #856404; margin-bottom: 5px; }
    .lot-info { background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .progress-bar { background: #e9ecef; border-radius: 10px; height: 20px; overflow: hidden; margin: 15px 0; }
    .progress-fill { background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); height: 100%; border-radius: 10px; }
    .checklist { background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
    .checklist-item { padding: 8px 0; border-bottom: 1px solid #f1f3f5; }
    .checklist-item:last-child { border-bottom: none; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🌳 Đại Ngàn Xanh</div>
      <div class="header-subtitle">Hệ Thống Quản Lý Vườn Cây</div>
    </div>
    <div class="content">
      <div class="alert">
        <div class="alert-title">🔔 Nhắc nhở: Checklist sắp đến hạn</div>
        <p>Checklist cho lô <strong>${lot.name}</strong> sẽ đến hạn vào <strong>${new Date(checklist.due_date).toLocaleDateString('vi-VN')}</strong></p>
      </div>
      
      <div class="lot-info">
        <h3 style="color: #2d5016; margin-bottom: 15px;">📍 Thông tin lô</h3>
        <div class="info-row"><span>Tên lô:</span><strong>${lot.name}</strong></div>
        <div class="info-row"><span>Khu vực:</span><strong>${lot.region}</strong></div>
        <div class="info-row"><span>Quý:</span><strong>${checklist.quarter}</strong></div>
        <div class="info-row"><span>Hạn chót:</span><strong>${new Date(checklist.due_date).toLocaleDateString('vi-VN')}</strong></div>
      </div>

      <h3 style="color: #2d5016; margin-bottom: 10px;">📊 Tiến độ hiện tại</h3>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${completionPercentage}%"></div>
      </div>
      <p style="text-align: center; color: #666; margin-bottom: 20px;">${completedCount}/${totalCount} công việc hoàn thành (${completionPercentage}%)</p>

      <div class="checklist">
        <h4 style="color: #2d5016; margin-bottom: 10px;">❌ Công việc chưa hoàn thành:</h4>
        ${incompleteItems.map(item => `<div class="checklist-item">☐ ${item.label}</div>`).join('')}
      </div>

      <p style="margin-bottom: 20px;">Vui lòng hoàn thành checklist trước ngày <strong>${new Date(checklist.due_date).toLocaleDateString('vi-VN')}</strong> để đảm bảo quy trình trồng cây được thực hiện đúng tiến độ.</p>

      <center><a href="${BASE_URL}/crm/admin/checklist" class="cta-button">📋 Xem Checklist</a></center>
    </div>
    <div class="footer">
      <p style="margin-top: 20px; color: #999; font-size: 12px;">© 2026 Đại Ngàn Xanh. Mọi quyền được bảo lưu.<br>Email này được gửi tự động, vui lòng không trả lời.</p>
    </div>
  </div>
</body>
</html>`

            // Send email to all admins
            for (const admin of admins) {
                try {
                    const { data, error } = await resend.emails.send({
                        from: `Đại Ngàn Xanh <${RESEND_FROM_EMAIL}>`,
                        to: [admin.email],
                        subject: `🔔 Nhắc nhở: Checklist lô ${lot.name} sắp đến hạn (${checklist.quarter})`,
                        html: emailHtml,
                    })

                    if (error) {
                        console.error(`❌ Failed to send email to ${admin.email}:`, error)
                        results.push({ admin: admin.email, success: false, error: error.message })
                    } else {
                        console.log(`✅ Email sent to ${admin.email}`)
                        results.push({ admin: admin.email, success: true, emailId: data?.id })
                    }
                } catch (error) {
                    console.error(`❌ Error sending email to ${admin.email}:`, error)
                    results.push({
                        admin: admin.email,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    })
                }
            }

            // Create in-app notification for admins
            for (const admin of admins) {
                try {
                    const { error: notifError } = await supabase.from('notifications').insert({
                        user_id: admin.id,
                        title: `Checklist lô ${lot.name} sắp đến hạn`,
                        message: `Checklist cho quý ${checklist.quarter} sẽ đến hạn vào ${new Date(checklist.due_date).toLocaleDateString('vi-VN')}. Tiến độ hiện tại: ${completionPercentage}%`,
                        type: 'checklist_reminder',
                        link: '/crm/admin/checklist',
                    })

                    if (notifError) {
                        console.error(`❌ Failed to create notification for ${admin.email}:`, notifError)
                    } else {
                        console.log(`✅ Notification created for ${admin.email}`)
                    }
                } catch (error) {
                    console.error(`❌ Error creating notification for ${admin.email}:`, error)
                }
            }
        }

        console.log('✅ Checklist reminder job completed')

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Checklist reminders sent successfully',
                checklistsProcessed: checklists.length,
                results,
            }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('❌ Checklist reminder job failed:', error)
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
