import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PDFDocument } from 'pdf-lib'
import createReport from 'docx-templates'
import { createServiceRoleClient } from '@/lib/supabase/server'
import {
  formatDate,
  formatDateLong,
  formatContractVND,
  numberToVietnameseWords,
  formatContractNumber,
} from '@/lib/utils/contract-helpers'

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────

const CONVERTAPI_TIMEOUT_MS = 30_000

// Signature overlay positions (Bên B — right side, bottom of last page)
// Adjust after testing with real PDF output
const SIG_X = Number(process.env.CONTRACT_SIG_X) || 360
const SIG_Y = Number(process.env.CONTRACT_SIG_Y) || 85
const SIG_W = Number(process.env.CONTRACT_SIG_W) || 130
const SIG_H = Number(process.env.CONTRACT_SIG_H) || 55
const STAMP_X = Number(process.env.CONTRACT_STAMP_X) || 350
const STAMP_Y = Number(process.env.CONTRACT_STAMP_Y) || 70
const STAMP_W = Number(process.env.CONTRACT_STAMP_W) || 90
const STAMP_H = Number(process.env.CONTRACT_STAMP_H) || 90

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface OrderRow {
  id: string
  code: string
  user_name: string | null
  quantity: number
  total_amount: number
  created_at: string
  dob: string | null
  nationality: string | null
  id_number: string | null
  id_issue_date: string | null
  id_issue_place: string | null
  address: string | null
  phone: string | null
}

// ─────────────────────────────────────────────────────────────────
// Template / Asset helpers
// ─────────────────────────────────────────────────────────────────

async function readTemplateAsset(filename: string): Promise<Buffer> {
  const assetPath = path.join(process.cwd(), 'templates', filename)
  return fs.readFile(assetPath)
}

// ─────────────────────────────────────────────────────────────────
// Auth check
// ─────────────────────────────────────────────────────────────────

function verifyApiKey(req: NextRequest): boolean {
  const secret = process.env.CONTRACT_API_SECRET
  if (!secret) return false
  const provided = req.headers.get('x-api-key')
  return provided === secret
}

// ─────────────────────────────────────────────────────────────────
// Step 3: Fill DOCX template
// ─────────────────────────────────────────────────────────────────

async function fillDocxTemplate(order: OrderRow): Promise<Buffer> {
  const templateBuffer = await readTemplateAsset('contract-template.docx')

  const data = {
    so_hop_dong: formatContractNumber(order.code),
    ngay_ky: formatDateLong(order.created_at),
    ho_ten: order.user_name ?? '',
    ngay_sinh: formatDate(order.dob),
    quoc_tich: order.nationality ?? 'Việt Nam',
    so_cccd: order.id_number ?? '',
    ngay_cap: formatDate(order.id_issue_date),
    noi_cap: order.id_issue_place ?? '',
    dia_chi: order.address ?? '',
    dien_thoai: order.phone ?? '',
    so_luong_cay: order.quantity.toLocaleString('vi-VN'),
    tong_gia_tri: formatContractVND(order.total_amount),
    tong_gia_tri_chu: numberToVietnameseWords(order.total_amount),
  }

  const filledBuffer = await createReport({
    template: templateBuffer,
    data,
    cmdDelimiter: ['{{', '}}'],
    failFast: false,
  })

  return Buffer.from(filledBuffer)
}

// ─────────────────────────────────────────────────────────────────
// Step 4: Convert DOCX → PDF via ConvertAPI
// ─────────────────────────────────────────────────────────────────

async function convertDocxToPdf(docxBuffer: Buffer): Promise<Buffer> {
  const apiSecret = process.env.CONVERTAPI_SECRET
  if (!apiSecret) {
    throw new Error('CONVERTAPI_SECRET is not configured')
  }

  const formData = new FormData()
  formData.append('File', new Blob([new Uint8Array(docxBuffer)], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }), 'contract.docx')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), CONVERTAPI_TIMEOUT_MS)

  try {
    const res = await fetch('https://v2.convertapi.com/convert/docx/to/pdf', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiSecret}` },
      body: formData,
      signal: controller.signal,
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText)
      throw new Error(`ConvertAPI failed (${res.status}): ${errText}`)
    }

    const json = await res.json() as { Files?: { FileData: string }[] }
    const fileData = json.Files?.[0]?.FileData
    if (!fileData) {
      throw new Error('ConvertAPI returned no file data')
    }

    return Buffer.from(fileData, 'base64')
  } finally {
    clearTimeout(timeout)
  }
}

// ─────────────────────────────────────────────────────────────────
// Step 5: Overlay signature + stamp on last page
// ─────────────────────────────────────────────────────────────────

async function overlaySignature(pdfBytes: Buffer): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const pages = pdfDoc.getPages()
  const lastPage = pages[pages.length - 1]

  const signatureBytes = await readTemplateAsset('signature.png')
  const stampBytes = await readTemplateAsset('stamp.png')

  const sigImage = await pdfDoc.embedPng(signatureBytes)
  const stampImage = await pdfDoc.embedPng(stampBytes)

  lastPage.drawImage(sigImage, { x: SIG_X, y: SIG_Y, width: SIG_W, height: SIG_H })
  lastPage.drawImage(stampImage, { x: STAMP_X, y: STAMP_Y, width: STAMP_W, height: STAMP_H })

  const result = await pdfDoc.save()
  return Buffer.from(result)
}

// ─────────────────────────────────────────────────────────────────
// Step 6: Upload PDF to Supabase Storage
// ─────────────────────────────────────────────────────────────────

async function uploadPdf(pdfBytes: Buffer, orderCode: string): Promise<string> {
  const serviceSupabase = createServiceRoleClient()
  const fileName = `${orderCode}.pdf`

  const { error: uploadError } = await serviceSupabase.storage
    .from('contracts')
    .upload(fileName, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`)
  }

  const { data: { publicUrl } } = serviceSupabase.storage
    .from('contracts')
    .getPublicUrl(fileName)

  return publicUrl
}

// ─────────────────────────────────────────────────────────────────
// Step 7: Update orders.contract_url
// ─────────────────────────────────────────────────────────────────

async function updateContractUrl(orderId: string, contractUrl: string): Promise<void> {
  const serviceSupabase = createServiceRoleClient()
  const { error } = await serviceSupabase
    .from('orders')
    .update({ contract_url: contractUrl })
    .eq('id', orderId)

  if (error) {
    throw new Error(`Failed to update contract_url: ${error.message}`)
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /api/contracts/generate
// ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Auth: require internal API key
    if (!verifyApiKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await req.json() as { orderId?: string }

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    // Step 2: Fetch order + customer data
    const serviceSupabase = createServiceRoleClient()
    const { data: order, error: fetchError } = await serviceSupabase
      .from('orders')
      .select('id, code, user_name, quantity, total_amount, created_at, dob, nationality, id_number, id_issue_date, id_issue_place, address, phone')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Step 3: Fill DOCX template
    const filledDocx = await fillDocxTemplate(order as OrderRow)

    // Step 4: Convert DOCX → PDF via ConvertAPI
    const pdfBytes = await convertDocxToPdf(filledDocx)

    // Step 5: Overlay signature + stamp
    const signedPdfBytes = await overlaySignature(pdfBytes)

    // Step 6: Upload to Supabase Storage contracts/{orderCode}.pdf
    const contractUrl = await uploadPdf(signedPdfBytes, order.code)

    // Step 7: Update orders.contract_url
    await updateContractUrl(order.id, contractUrl)

    return NextResponse.json({ contractUrl, success: true })
  } catch (err) {
    console.error('[contracts/generate] Error:', err)
    return NextResponse.json(
      { error: 'Contract generation failed', success: false },
      { status: 500 },
    )
  }
}
