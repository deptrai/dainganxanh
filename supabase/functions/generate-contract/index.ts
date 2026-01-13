import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib@1.17.1'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

// Comprehensive Vietnamese accent removal for Helvetica/WinAnsi compatibility
const removeAccents = (str: string): string => {
    return str
        // Vietnamese special characters (must be before normalization)
        .replace(/Đ/g, 'D').replace(/đ/g, 'd')
        .replace(/Ơ/g, 'O').replace(/ơ/g, 'o')
        .replace(/Ư/g, 'U').replace(/ư/g, 'u')
        // Subscript numbers (CO₂ → CO2)
        .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (m) => '0123456789'['₀₁₂₃₄₅₆₇₈₉'.indexOf(m)])
        // Normalize and remove combining diacritics
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
}

serve(async (req) => {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const payload: ContractRequest = await req.json()

        // Create PDF document
        const pdfDoc = await PDFDocument.create()

        // Using Helvetica font (ASCII-only) - Vietnamese accents will be removed
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

        const page = pdfDoc.addPage([595, 842]) // A4 size

        const { width, height } = page.getSize()
        const margin = 50
        let yPosition = height - margin

        // Helper function to draw text (with accent removal)
        const drawText = (text: string, size: number, isBold = false, color = rgb(0, 0, 0)) => {
            page.drawText(removeAccents(text), {
                x: margin,
                y: yPosition,
                size,
                font,
                color,
            })
            yPosition -= size + 10
        }

        // Header
        drawText('DAI NGAN XANH', 24, true, rgb(0.18, 0.31, 0.09))
        drawText('Gieo Hat Lanh, Gat Phuoc Bau', 12, false, rgb(0.4, 0.4, 0.4))
        yPosition -= 20

        // Title
        drawText('HOP DONG CHAM SOC CAY XANH', 18, true)
        yPosition -= 10

        // Contract Info
        drawText(`Ma hop dong: ${payload.orderCode}`, 12)
        drawText(`Ngay tao: ${new Date().toLocaleDateString('en-US')}`, 12)
        yPosition -= 20

        // Customer Info
        drawText('THONG TIN KHACH HANG', 14, true)
        yPosition -= 5
        drawText(`Ho va ten: ${removeAccents(payload.userName)}`, 12)
        drawText(`Email: ${payload.userEmail}`, 12)
        drawText(`Ma khach hang: ${payload.userId ? payload.userId.substring(0, 8) : 'N/A'}`, 12)
        yPosition -= 20

        // Order Details
        drawText('CHI TIET DON HANG', 14, true)
        yPosition -= 5
        drawText(`So luong cay: ${payload.quantity} cay`, 12)
        drawText(`Tong gia tri: ${payload.totalAmount.toLocaleString('vi-VN')} VND`, 12)
        drawText(`Tac dong moi truong: -${payload.quantity * 100} kg CO2/nam`, 12)
        yPosition -= 20

        // Tree Codes
        drawText('MA CAY', 14, true)
        yPosition -= 5
        payload.treeCodes.forEach((code, index) => {
            drawText(`${index + 1}. ${code}`, 12)
        })
        yPosition -= 20

        // Terms
        drawText('DIEU KHOAN HOP DONG', 14, true)
        yPosition -= 5

        const terms = [
            '1. Cam ket cham soc: Dai Ngan Xanh cam ket cham soc cay trong vong 5 nam.',
            '2. Bao cao dinh ky: Khach hang se nhan bao cao tinh trang cay hang quy.',
            '3. Quyen so huu: Khach hang so huu cay va co quyen tham vuon.',
            '4. Thu mua lai: Sau 5 nam, cam ket thu mua lai go voi gia thi truong.',
            '5. Bao hiem: Cay duoc bao hiem toan dien trong suot thoi gian cham soc.',
        ]

        terms.forEach(term => {
            const lines = splitTextToFitWidth(removeAccents(term), width - 2 * margin, font, 11)
            lines.forEach(line => {
                page.drawText(line, {
                    x: margin,
                    y: yPosition,
                    size: 11,
                    font,
                })
                yPosition -= 18
            })
        })

        yPosition -= 20

        // Signature
        drawText('CHU KY DIEN TU', 14, true)
        yPosition -= 5
        drawText('Hop dong nay duoc ky dien tu va co gia tri phap ly.', 10, false, rgb(0.4, 0.4, 0.4))
        drawText(`Ma xac thuc: ${payload.orderCode}-${Date.now().toString(36)}`, 10, false, rgb(0.4, 0.4, 0.4))

        yPosition -= 40
        drawText('___________________________', 12)
        drawText('Dai dien Dai Ngan Xanh', 10)

        // Footer
        page.drawText(
            '(c) 2026 Dai Ngan Xanh. Moi quyen duoc bao luu.',
            {
                x: margin,
                y: 30,
                size: 8,
                font,
                color: rgb(0.5, 0.5, 0.5),
            }
        )

        // Generate PDF bytes
        const pdfBytes = await pdfDoc.save()

        // Upload to Supabase Storage
        const fileName = `${payload.orderCode}-${Date.now()}.pdf`
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('contracts')
            .upload(fileName, pdfBytes, {
                contentType: 'application/pdf',
                upsert: false,
            })

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`)
        }

        // Get public URL (even though bucket is private, we need the path)
        const { data: { publicUrl } } = supabase.storage
            .from('contracts')
            .getPublicUrl(fileName)

        return new Response(
            JSON.stringify({
                success: true,
                fileName,
                filePath: uploadData.path,
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
                error: error.message,
            }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})

// Helper function to split text into lines - ALREADY USES ASCII TEXT
function splitTextToFitWidth(
    text: string,
    maxWidth: number,
    font: any,
    fontSize: number
): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const testWidth = font.widthOfTextAtSize(testLine, fontSize)

        if (testWidth > maxWidth && currentLine) {
            lines.push(currentLine)
            currentLine = word
        } else {
            currentLine = testLine
        }
    })

    if (currentLine) {
        lines.push(currentLine)
    }

    return lines
}
