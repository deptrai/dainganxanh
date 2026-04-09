import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import createReport from 'docx-templates'
import { createServiceRoleClient } from '@/lib/supabase/server'
import {
  formatDate,
  formatDateLong,
  formatContractVND,
  numberToVietnameseWords,
  formatContractNumber,
} from '@/lib/utils/contract-helpers'

const execFileAsync = promisify(execFile)

// LibreOffice binary — macOS app bundle or system PATH (Linux/Docker)
const SOFFICE_BIN =
  process.env.SOFFICE_BIN ??
  (process.platform === 'darwin'
    ? '/Applications/LibreOffice.app/Contents/MacOS/soffice'
    : 'soffice')

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
  // Support both x-api-key (external) and x-internal-secret (internal callers)
  const contractSecret = process.env.CONTRACT_API_SECRET
  const internalSecret = process.env.INTERNAL_API_SECRET

  const providedApiKey = req.headers.get('x-api-key')
  const providedInternal = req.headers.get('x-internal-secret')

  if (contractSecret && providedApiKey === contractSecret) return true
  if (internalSecret && providedInternal === internalSecret) return true

  return false
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
// Step 4: Convert DOCX → PDF via LibreOffice (headless)
// ─────────────────────────────────────────────────────────────────

async function convertDocxToPdf(docxBuffer: Buffer): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'contract-'))
  const docxPath = path.join(tmpDir, 'contract.docx')

  try {
    await fs.writeFile(docxPath, docxBuffer)

    await execFileAsync(SOFFICE_BIN, [
      `-env:UserInstallation=file://${tmpDir}`,
      '--headless',
      '--norestore',
      '--convert-to', 'pdf',
      '--outdir', tmpDir,
      docxPath,
    ], { timeout: 45_000, killSignal: 'SIGKILL' })

    const pdfPath = path.join(tmpDir, 'contract.pdf')
    try {
      await fs.access(pdfPath)
    } catch {
      throw new Error('LibreOffice conversion produced no PDF output')
    }
    return await fs.readFile(pdfPath)
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
}

// ─────────────────────────────────────────────────────────────────
// Upload PDF to Supabase Storage
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

    // Step 4: Convert DOCX → PDF via LibreOffice
    const pdfBytes = await convertDocxToPdf(filledDocx)

    // Step 5: Upload to Supabase Storage contracts/{orderCode}.pdf
    const contractUrl = await uploadPdf(pdfBytes, order.code)

    // Step 6: Update orders.contract_url
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
