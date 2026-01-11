import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface PaymentRequest {
    userId: string
    userEmail: string
    userName: string
    orderCode: string
    quantity: number
    totalAmount: number
    paymentMethod: 'banking' | 'usdt'
}

serve(async (req) => {
    // Handle CORS preflight
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
        const payload: PaymentRequest = await req.json()

        console.log('Processing payment:', payload.orderCode)

        // 1. Generate tree codes
        const treeCodes: string[] = []
        const year = new Date().getFullYear()

        for (let i = 0; i < payload.quantity; i++) {
            // Get next sequence number
            const { count } = await supabase
                .from('trees')
                .select('*', { count: 'exact', head: true })

            const sequence = (count || 0) + i + 1
            const code = `TREE-${year}-${sequence.toString().padStart(5, '0')}`
            treeCodes.push(code)
        }

        console.log('Generated tree codes:', treeCodes)

        // 2. Create order record (assuming orders table exists)
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                code: payload.orderCode,
                user_id: payload.userId || null, // Allow null for testing
                quantity: payload.quantity,
                total_amount: payload.totalAmount,
                payment_method: payload.paymentMethod,
                status: 'completed',
            })
            .select()
            .single()

        if (orderError) {
            console.error('Order creation failed:', orderError)
            throw new Error(`Order creation failed: ${orderError.message}`)
        }

        console.log('Order created:', order.id)

        // 3. Insert trees into database
        const treeRecords = treeCodes.map(code => ({
            code,
            order_id: order.id,
            user_id: payload.userId || null, // Allow null for testing
            status: 'active',
        }))

        const { error: treesError } = await supabase
            .from('trees')
            .insert(treeRecords)

        if (treesError) {
            console.error('Trees insertion failed:', treesError)
            throw new Error(`Trees insertion failed: ${treesError.message}`)
        }

        console.log('Trees inserted successfully')

        // 4. Generate PDF contract
        const contractResponse = await fetch(
            `${supabaseUrl}/functions/v1/generate-contract`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                    orderId: order.id,
                    userId: payload.userId,
                    userName: payload.userName,
                    userEmail: payload.userEmail,
                    orderCode: payload.orderCode,
                    quantity: payload.quantity,
                    totalAmount: payload.totalAmount,
                    treeCodes,
                }),
            }
        )

        if (!contractResponse.ok) {
            throw new Error('Contract generation failed')
        }

        const contractData = await contractResponse.json()
        console.log('Contract generated:', contractData.fileName)

        // 5. Send confirmation email
        const emailResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-email`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                    orderId: order.id,
                    userId: payload.userId,
                    userEmail: payload.userEmail,
                    userName: payload.userName,
                    orderCode: payload.orderCode,
                    quantity: payload.quantity,
                    totalAmount: payload.totalAmount,
                    treeCodes,
                    contractPdfUrl: contractData.filePath,
                }),
            }
        )

        if (!emailResponse.ok) {
            console.error('Email sending failed')
            // Don't throw - email failure shouldn't fail the whole payment
        } else {
            const emailData = await emailResponse.json()
            console.log('Email sent:', emailData.emailId)
        }

        return new Response(
            JSON.stringify({
                success: true,
                orderId: order.id,
                orderCode: payload.orderCode,
                treeCodes,
                contractUrl: contractData.filePath,
                message: 'Payment processed successfully',
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Payment processing failed:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                status: 500,
            }
        )
    }
})
