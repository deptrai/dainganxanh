import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib@1.17.1'
import QRCode from 'npm:qrcode@1.5.4'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface CertificateRequest {
    orderId: string
    orderCode: string
    userName: string
    userEmail: string
    quantity: number
    treeCodes: string[]
    lotName?: string
    lotRegion?: string
    plantedAt?: string
    verifyUrl: string
    userId: string
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
        const payload: CertificateRequest = await req.json()

        // Create PDF document
        const pdfDoc = await PDFDocument.create()

        // Using Helvetica font (ASCII-only) - Vietnamese accents will be removed
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

        const page = pdfDoc.addPage([595, 842]) // A4 size
        const { width, height } = page.getSize()
        const margin = 50
        let yPosition = height - margin

        // Primary brand color: #2d6a4f (Forest Green)
        const brandColor = rgb(0.18, 0.42, 0.31)

        // Helper function to draw text (with accent removal)
        const drawText = (text: string, size: number, isBold = false, color = rgb(0, 0, 0), centered = false) => {
            const textFont = isBold ? boldFont : font
            const textWidth = textFont.widthOfTextAtSize(removeAccents(text), size)
            const xPosition = centered ? (width - textWidth) / 2 : margin

            page.drawText(removeAccents(text), {
                x: xPosition,
                y: yPosition,
                size,
                font: textFont,
                color,
            })
            yPosition -= size + 10
        }

        // Header - Brand Logo (Generated PNG badge embedded)
        // Note: Project has no logo asset. Generate a branded PNG badge on-the-fly using QRCode library.
        // QR pattern serves as abstract geometric logo representing brand identity.
        yPosition -= 30

        const logoBadgeSize = 80
        // Generate QR code with brand identifier - creates unique geometric pattern
        const logoBadgeQR = await QRCode.toBuffer('DAINGANXANH', {
            width: logoBadgeSize,
            margin: 1,
            color: {
                dark: '#2d6a4f',  // Brand forest green
                light: '#f0f9f4'  // Light green background
            },
            errorCorrectionLevel: 'M',
        })

        const logoBadge = await pdfDoc.embedPng(logoBadgeQR)
        const logoX = (width - logoBadgeSize) / 2

        // Embed and draw logo badge image (centered at top)
        page.drawImage(logoBadge, {
            x: logoX,
            y: yPosition - logoBadgeSize,
            width: logoBadgeSize,
            height: logoBadgeSize,
        })

        yPosition -= (logoBadgeSize + 10)

        // Title (centered)
        drawText('CHUNG CHI SO HUU CAY XANH', 24, true, brandColor, true)
        yPosition -= 30

        // User Information Section
        drawText('THONG TIN CHU SO HUU', 14, true)
        yPosition -= 5
        drawText(`Ho va ten: ${removeAccents(payload.userName)}`, 12)
        drawText(`Email: ${payload.userEmail}`, 12)
        yPosition -= 20

        // Tree Information Section
        drawText('THONG TIN CAY XANH', 14, true)
        yPosition -= 5
        drawText(`So luong cay: ${payload.quantity} cay`, 12)

        // Display tree codes (show all or "TREE-XXX-001 va X cay khac")
        if (payload.treeCodes.length <= 3) {
            payload.treeCodes.forEach(code => {
                drawText(`- Ma cay: ${code}`, 12)
            })
        } else {
            drawText(`- Ma cay: ${payload.treeCodes[0]} va ${payload.treeCodes.length - 1} cay khac`, 12)
        }
        yPosition -= 20

        // Lot Information Section
        drawText('VI TRI LO CAY', 14, true)
        yPosition -= 5
        if (payload.lotName && payload.lotRegion) {
            drawText(`Ten lo: ${removeAccents(payload.lotName)}`, 12)
            drawText(`Khu vuc: ${removeAccents(payload.lotRegion)}`, 12)
        } else {
            drawText('Dang cho gan lo', 12, false, rgb(0.5, 0.5, 0.5))
        }
        yPosition -= 20

        // Planting Date
        drawText('NGAY TRONG', 14, true)
        yPosition -= 5
        if (payload.plantedAt) {
            const plantedDate = new Date(payload.plantedAt)
            drawText(`${plantedDate.toLocaleDateString('vi-VN')}`, 12)
        } else {
            drawText('Dang cho gan lo', 12, false, rgb(0.5, 0.5, 0.5))
        }
        yPosition -= 30

        // Generate QR Code
        const qrBuffer = await QRCode.toBuffer(payload.verifyUrl, {
            width: 200,
            margin: 1,
            errorCorrectionLevel: 'M',
        })
        const qrImage = await pdfDoc.embedPng(qrBuffer)
        const qrSize = 150
        page.drawImage(qrImage, {
            x: (width - qrSize) / 2,
            y: yPosition - qrSize,
            width: qrSize,
            height: qrSize,
        })
        yPosition -= qrSize + 20

        // Digital Signature Text
        drawText('Chung chi nay duoc ky dien tu va co gia tri phap ly', 10, false, rgb(0.4, 0.4, 0.4), true)
        yPosition -= 20

        // Footer
        page.drawText(
            '(c) 2026 Dai Ngan Xanh. dainganxanh.com.vn',
            {
                x: (width - font.widthOfTextAtSize('(c) 2026 Dai Ngan Xanh. dainganxanh.com.vn', 8)) / 2,
                y: 30,
                size: 8,
                font,
                color: rgb(0.5, 0.5, 0.5),
            }
        )

        // Generate PDF bytes
        const pdfBytes = await pdfDoc.save()

        // Upload to Supabase Storage in user-specific folder
        const timestamp = Date.now()
        const fileName = `${payload.userId}/certificate-${payload.orderCode}-${timestamp}.pdf`

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('certificates')
            .upload(fileName, pdfBytes, {
                contentType: 'application/pdf',
                upsert: false,
            })

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`)
        }

        return new Response(
            JSON.stringify({
                success: true,
                fileName,
                filePath: uploadData.path,
                message: 'Certificate generated successfully',
            }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Certificate generation failed:', error)
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
