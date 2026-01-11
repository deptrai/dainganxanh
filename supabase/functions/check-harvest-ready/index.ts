import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

        // Query harvest-ready trees (>= 60 months old, not yet notified)
        const { data: harvestReadyTrees, error: queryError } = await supabase.rpc('get_harvest_ready_trees')

        if (queryError) {
            throw queryError
        }

        console.log(`Found ${harvestReadyTrees?.length || 0} harvest-ready trees`)

        const results = []

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

                // Send email via SendGrid
                const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
                if (sendGridApiKey) {
                    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${sendGridApiKey}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            personalizations: [{
                                to: [{ email: tree.user_email }],
                                dynamic_template_data: {
                                    tree_code: tree.tree_code,
                                    age_months: tree.age_months,
                                    co2_absorbed: tree.co2_absorbed?.toFixed(1) || '0',
                                    harvest_url: `${Deno.env.get('APP_URL')}/crm/my-garden/${tree.order_id}/harvest`,
                                },
                            }],
                            from: {
                                email: 'noreply@dainganxanh.com',
                                name: 'Đại Ngàn Xanh',
                            },
                            template_id: Deno.env.get('SENDGRID_HARVEST_TEMPLATE_ID'),
                        }),
                    })

                    if (!emailResponse.ok) {
                        console.error(`Failed to send email for tree ${tree.id}:`, await emailResponse.text())
                        results.push({ treeId: tree.id, status: 'email_failed' })
                    } else {
                        results.push({ treeId: tree.id, status: 'success' })
                    }
                } else {
                    console.warn('SendGrid API key not configured, skipping email')
                    results.push({ treeId: tree.id, status: 'success_no_email' })
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
