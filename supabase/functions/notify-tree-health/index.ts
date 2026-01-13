import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        const payload = await req.json()
        console.log('Tree health webhook payload:', payload)

        const { record } = payload

        // Only process if tree is marked as dead
        if (record.new_status !== 'dead') {
            return new Response(
                JSON.stringify({ message: 'Not a dead tree status, skipping notification' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Fetch tree details
        const { data: tree, error: treeError } = await supabase
            .from('trees')
            .select('id, code, user_id, order_id')
            .eq('id', record.tree_id)
            .single()

        if (treeError || !tree) {
            console.error('Error fetching tree:', treeError)
            throw new Error('Tree not found')
        }

        // Create in-app notification for tree owner
        const { error: notifError } = await supabase
            .from('notifications')
            .insert({
                user_id: tree.user_id,
                type: 'tree_health_alert',
                title: `Cây ${tree.code} đã chết`,
                message: `Cây ${tree.code} của bạn đã được đánh dấu là chết. ${record.notes || 'Chúng tôi sẽ sớm trồng cây thay thế.'}`,
                data: {
                    tree_id: tree.id,
                    tree_code: tree.code,
                    old_status: record.old_status,
                    new_status: record.new_status,
                    notes: record.notes,
                    health_log_id: record.id,
                },
                read: false,
            })

        if (notifError) {
            console.error('Error creating notification:', notifError)
            throw notifError
        }

        // TODO: Send email notification
        // This would integrate with your email service (SendGrid, Resend, etc.)
        console.log('Email notification would be sent to user:', tree.user_id)

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Tree health notification sent',
                tree_code: tree.code,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('Error in tree health notification:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
