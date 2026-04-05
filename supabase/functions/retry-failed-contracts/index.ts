import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * retry-failed-contracts
 *
 * Tự động tạo lại hợp đồng cho các đơn hàng đã hoàn thành nhưng chưa có contract_url.
 * Chạy qua pg_cron mỗi ngày lúc 2h sáng.
 *
 * Cron schedule: 0 2 * * *
 *
 * Để đăng ký cron:
 *   SELECT cron.schedule(
 *     'retry-failed-contracts',
 *     '0 2 * * *',
 *     $$
 *       SELECT net.http_post(
 *         url := '<SUPABASE_URL>/functions/v1/retry-failed-contracts',
 *         headers := jsonb_build_object(
 *           'Authorization', 'Bearer ' || current_setting('supabase.service_role_key'),
 *           'Content-Type', 'application/json'
 *         ),
 *         body := '{}'::jsonb
 *       );
 *     $$
 *   );
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  // Verify Authorization header
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Lấy các đơn completed chưa có contract, trong vòng 30 ngày
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: orders, error: fetchError } = await supabase
      .from('orders')
      .select('id, code')
      .eq('status', 'completed')
      .is('contract_url', null)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Failed to fetch orders:', fetchError)
      return new Response(JSON.stringify({ success: false, error: fetchError.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    if (!orders || orders.length === 0) {
      console.log('No orders missing contracts')
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'Không có đơn nào thiếu hợp đồng' }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log(`Found ${orders.length} orders missing contracts, retrying...`)

    const results = { success: 0, failed: 0, errors: [] as string[] }

    for (const order of orders) {
      try {
        const res = await fetch(
          `${supabaseUrl}/functions/v1/generate-contract`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ orderId: order.id }),
            signal: AbortSignal.timeout(55000),
          }
        )

        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            console.log(`Contract generated for order ${order.code}`)
            results.success++
          } else {
            console.error(`Contract generation failed for ${order.code}:`, data.error)
            results.failed++
            results.errors.push(`${order.code}: ${data.error}`)
          }
        } else {
          const errText = await res.text().catch(() => res.statusText)
          console.error(`generate-contract ${res.status} for ${order.code}:`, errText)
          results.failed++
          results.errors.push(`${order.code}: HTTP ${res.status}`)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`Error processing ${order.code}:`, msg)
        results.failed++
        results.errors.push(`${order.code}: ${msg}`)
      }

      // Delay nhỏ giữa các request để tránh quá tải
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    console.log(`Retry complete — success: ${results.success}, failed: ${results.failed}`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: orders.length,
        ...results,
      }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 200 }
    )
  } catch (err) {
    console.error('Unexpected error in retry-failed-contracts:', err)
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
