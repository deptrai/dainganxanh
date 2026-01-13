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

        // Input validation
        if (!payload.userEmail || !payload.userEmail.includes('@')) {
            throw new Error('Invalid email address')
        }
        if (!payload.quantity || payload.quantity < 1 || payload.quantity > 1000) {
            throw new Error('Quantity must be between 1 and 1000')
        }
        if (!payload.totalAmount || payload.totalAmount <= 0) {
            throw new Error('Total amount must be positive')
        }
        if (!payload.orderCode || payload.orderCode.length < 3) {
            throw new Error('Invalid order code')
        }

        console.log('Processing payment:', payload.orderCode)

        // 1. Generate unique tree codes (timestamp + random to avoid race conditions)
        const treeCodes: string[] = []
        const year = new Date().getFullYear()
        const timestamp = Date.now()

        for (let i = 0; i < payload.quantity; i++) {
            // Use timestamp + index + random suffix for uniqueness
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
            const code = `TREE-${year}-${timestamp}-${i.toString().padStart(2, '0')}${random}`
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

        // 4. Generate PDF contract with 30s timeout
        const contractPayload = {
            orderId: order.id,
            userId: payload.userId,
            userName: payload.userName,
            userEmail: payload.userEmail,
            orderCode: payload.orderCode,
            quantity: payload.quantity,
            totalAmount: payload.totalAmount,
            treeCodes,
        }

        const contractController = new AbortController()
        const contractTimeout = setTimeout(() => contractController.abort(), 30000)

        const contractResponse = await fetch(
            `${supabaseUrl}/functions/v1/generate-contract`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify(contractPayload),
                signal: contractController.signal,
            }
        )
        clearTimeout(contractTimeout)

        console.log('Contract response status:', contractResponse.status)

        if (!contractResponse.ok) {
            const errorBody = await contractResponse.text()
            console.error('Contract generation failed. Status:', contractResponse.status)
            console.error('Error body:', errorBody)
            throw new Error(`Contract generation failed: ${contractResponse.status} - ${errorBody}`)
        }

        const contractData = await contractResponse.json()

        // 5. Send confirmation email with 30s timeout (non-blocking)
        const emailController = new AbortController()
        const emailTimeout = setTimeout(() => emailController.abort(), 30000)

        try {
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
                    signal: emailController.signal,
                }
            )
            clearTimeout(emailTimeout)

            if (!emailResponse.ok) {
                console.error('Email sending failed - non-blocking')
            }
        } catch (emailError) {
            clearTimeout(emailTimeout)
            console.error('Email sending error (non-blocking):', emailError)
            // Don't throw - email failure shouldn't fail the payment
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
