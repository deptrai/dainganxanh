import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * cleanup-pending-orders
 *
 * Deletes orders with status='pending' that are older than 24 hours.
 * Intended to be scheduled via Supabase Dashboard → Cron (pg_cron).
 *
 * Suggested cron schedule: every hour
 *   CRON: 0 * * * *
 *
 * To register this as a scheduled function in Supabase Dashboard:
 *   Dashboard → Database → Extensions → enable pg_cron
 *   Then in SQL editor:
 *     SELECT cron.schedule(
 *       'cleanup-pending-orders',
 *       '0 * * * *',
 *       $$
 *         SELECT net.http_post(
 *           url := '<SUPABASE_URL>/functions/v1/cleanup-pending-orders',
 *           headers := '{"Authorization": "Bearer <SUPABASE_SERVICE_ROLE_KEY>", "Content-Type": "application/json"}'::jsonb,
 *           body := '{}'::jsonb
 *         );
 *       $$
 *     );
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Allow only POST (called by cron scheduler)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Delete pending orders older than 24 hours
    const { data, error } = await supabase
      .from('orders')
      .delete()
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .select('id')

    if (error) {
      console.error('Failed to cleanup pending orders:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const deletedCount = data?.length ?? 0
    console.log(`Cleaned up ${deletedCount} stale pending orders`)

    return new Response(
      JSON.stringify({
        success: true,
        deleted: deletedCount,
        message: `Deleted ${deletedCount} pending orders older than 24 hours`,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 200,
      }
    )
  } catch (err) {
    console.error('Unexpected error in cleanup-pending-orders:', err)
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
