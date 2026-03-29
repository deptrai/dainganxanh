import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface ContractRequest {
    orderId: string
    userId: string
    userName: string
    userEmail: string
    orderCode: string
    quantity: number
    totalAmount: number
    treeCodes: string[]
}

serve(async (req) => {
    try {
        const payload: ContractRequest = await req.json()

        const baseUrl = Deno.env.get('NEXT_PUBLIC_BASE_URL')
        const contractApiSecret = Deno.env.get('CONTRACT_API_SECRET')

        if (!baseUrl) {
            throw new Error('NEXT_PUBLIC_BASE_URL is not configured')
        }
        if (!contractApiSecret) {
            throw new Error('CONTRACT_API_SECRET is not configured')
        }

        // Delegate to the Next.js API route (Story 10.2)
        // The API route handles: fill DOCX → ConvertAPI → pdf-lib overlay → upload → update DB
        const res = await fetch(
            `${baseUrl}/api/contracts/generate`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': contractApiSecret,
                },
                body: JSON.stringify({ orderId: payload.orderId }),
                signal: AbortSignal.timeout(45000),
            }
        )

        if (!res.ok) {
            const errText = await res.text().catch(() => res.statusText)
            throw new Error(`Contract API failed (${res.status}): ${errText}`)
        }

        const data = await res.json() as { contractUrl?: string; success: boolean; error?: string }

        if (!data.success) {
            throw new Error(data.error || 'Contract generation failed')
        }

        // API route stores file as {orderCode}.pdf in the contracts bucket.
        // send-email EF uses filePath as a Supabase Storage path to download the PDF.
        const fileName = `${payload.orderCode}.pdf`

        return new Response(
            JSON.stringify({
                success: true,
                fileName,
                filePath: fileName,
                message: 'Contract generated successfully',
            }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Contract generation failed:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Contract generation failed',
            }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
