/**
 * Script để tạo DOCX template hợp đồng và placeholder PNG assets
 * Chạy: node scripts/create-contract-assets.mjs
 *
 * Output:
 *   templates/contract-template.docx  — DOCX template với {{placeholders}}
 *   templates/signature.png            — Placeholder chữ ký (thay bằng ảnh thật trước khi deploy)
 *   templates/stamp.png                — Placeholder con dấu (thay bằng ảnh thật trước khi deploy)
 */

import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, HeightRule,
} from 'docx'
import { writeFileSync } from 'fs'
import { deflateSync } from 'zlib'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates')

// ─────────────────────────────────────────────────────────────────
// 1. DOCX TEMPLATE
// ─────────────────────────────────────────────────────────────────

function field(name) {
  return new TextRun({ text: `{{${name}}}`, bold: false })
}

function bold(text) {
  return new TextRun({ text, bold: true })
}

function txt(text) {
  return new TextRun({ text })
}

function heading(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text, bold: true, size: 26 })],
  })
}

function subheading(text) {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24 })],
  })
}

function para(children, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    ...opts,
    children: Array.isArray(children) ? children : [txt(children)],
  })
}

function signatureTable() {
  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0 },
    bottom: { style: BorderStyle.NONE, size: 0 },
    left: { style: BorderStyle.NONE, size: 0 },
    right: { style: BorderStyle.NONE, size: 0 },
  }

  const cell = (children) =>
    new TableCell({
      borders: noBorder,
      width: { size: 50, type: WidthType.PERCENTAGE },
      children: Array.isArray(children) ? children : [para(children)],
    })

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideH: { style: BorderStyle.NONE },
      insideV: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          cell([para([bold('BÊN A')], { alignment: AlignmentType.CENTER })]),
          cell([para([bold('BÊN B')], { alignment: AlignmentType.CENTER })]),
        ],
      }),
      new TableRow({
        children: [
          cell([para('(Ký và ghi rõ họ tên)', { alignment: AlignmentType.CENTER })]),
          cell([para('(Ký và ghi rõ họ tên)', { alignment: AlignmentType.CENTER })]),
        ],
      }),
      // Blank rows for signature space
      new TableRow({
        height: { value: 1200, rule: HeightRule.ATLEAST },
        children: [cell([para('')]), cell([para('')])],
      }),
      new TableRow({
        children: [
          cell([para([bold('CAO MẠNH HIẾU')], { alignment: AlignmentType.CENTER })]),
          cell([para([bold('{{ho_ten}}')], { alignment: AlignmentType.CENTER })]),
        ],
      }),
      new TableRow({
        children: [
          cell([para('Tổng Giám Đốc', { alignment: AlignmentType.CENTER })]),
          cell([para('')]),
        ],
      }),
    ],
  })
}

async function createDocxTemplate() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Times New Roman', size: 24 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1134, bottom: 1440, left: 1701 }, // A4: 2.54cm top/bottom, 2cm right, 3cm left
          },
        },
        children: [
          // Header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
            children: [new TextRun({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold: true, size: 26 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
            children: [new TextRun({ text: 'Độc lập - Tự do - Hạnh phúc', bold: true, size: 24 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [new TextRun({ text: '─────────────────────────────', size: 22 })],
          }),

          // Title
          heading('HỢP ĐỒNG TRỒNG VÀ CHĂM SÓC CÂY DÓ ĐEN'),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [txt('Số hợp đồng: DHNLN-'), field('so_hop_dong')],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 360 },
            children: [txt('Hà Nội, ngày '), field('ngay_ky')],
          }),

          para('Hôm nay, các bên gồm có:'),

          // BÊN A
          subheading('BÊN A (Bên cung cấp dịch vụ):'),
          para([bold('Tên đơn vị: '), txt('CÔNG TY CỔ PHẦN BIOCARE')]),
          para([bold('Địa chỉ: '), txt('141 Hoàng Diệu 2, Linh Chiểu, Thủ Đức, TP. Hồ Chí Minh')]),
          para([bold('Mã số thuế: '), txt('0317123456')]),
          para([bold('Đại diện: '), txt('Ông Cao Mạnh Hiếu')]),
          para([bold('Chức danh: '), txt('Tổng Giám Đốc')]),
          para([bold('Điện thoại: '), txt('0909 123 456')]),

          // BÊN B
          subheading('BÊN B (Bên khách hàng):'),
          para([bold('Họ và tên: '), field('ho_ten')]),
          para([bold('Ngày sinh: '), field('ngay_sinh')]),
          para([bold('Quốc tịch: '), field('quoc_tich')]),
          para([bold('Số CCCD: '), field('so_cccd')]),
          para([bold('Ngày cấp: '), field('ngay_cap')]),
          para([bold('Nơi cấp: '), field('noi_cap')]),
          para([bold('Địa chỉ thường trú: '), field('dia_chi')]),
          para([bold('Điện thoại: '), field('dien_thoai')]),

          para([
            txt('Sau khi thỏa thuận, hai bên đồng ý ký kết hợp đồng trồng và chăm sóc cây Dó đen với các điều khoản sau:'),
          ]),

          // Điều 1
          subheading('ĐIỀU 1: NỘI DUNG HỢP ĐỒNG'),
          para([
            txt('Bên B đồng ý mua và Bên A đồng ý cung cấp dịch vụ trồng, chăm sóc tổng số '),
            field('so_luong_cay'),
            txt(' cây Dó đen (Aquilaria crassna) tại vườn Đại Ngàn Xanh trong thời hạn 5 năm.'),
          ]),
          para('Bên A cam kết:'),
          para('1. Trồng cây tại vị trí theo quy hoạch, đảm bảo điều kiện đất đai và vi khí hậu phù hợp.', { indent: { left: 720 } }),
          para('2. Chăm sóc, bón phân, tưới nước định kỳ theo quy trình kỹ thuật.', { indent: { left: 720 } }),
          para('3. Cung cấp báo cáo tiến độ sinh trưởng theo quý (ảnh + số liệu).', { indent: { left: 720 } }),
          para('4. Bảo hiểm toàn diện cho cây trong suốt thời gian chăm sóc.', { indent: { left: 720 } }),
          para('5. Cam kết thu mua lại gỗ Dó đen sau năm thứ 5 theo giá thị trường tại thời điểm đó.', { indent: { left: 720 } }),

          // Điều 2
          subheading('ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN'),
          para([bold('Đơn giá: '), txt('260.000 đồng/cây')]),
          para([bold('Số lượng: '), field('so_luong_cay'), txt(' cây')]),
          para([bold('Tổng giá trị hợp đồng: '), field('tong_gia_tri'), txt(' đồng')]),
          para([bold('(Bằng chữ: '), field('tong_gia_tri_chu'), txt(')')]),
          para('Phương thức thanh toán: Chuyển khoản ngân hàng một lần.'),
          para([bold('Mã đơn hàng: '), field('so_hop_dong')]),

          // Điều 3
          subheading('ĐIỀU 3: QUYỀN VÀ NGHĨA VỤ CÁC BÊN'),
          para([bold('3.1. Quyền của Bên B:')]),
          para('- Sở hữu hợp pháp số cây Dó đen theo số lượng trong hợp đồng.', { indent: { left: 720 } }),
          para('- Nhận báo cáo sinh trưởng định kỳ.', { indent: { left: 720 } }),
          para('- Tham quan vườn theo lịch hẹn với Bên A.', { indent: { left: 720 } }),
          para('- Được ưu tiên thu mua lại khi đến kỳ khai thác.', { indent: { left: 720 } }),
          para([bold('3.2. Nghĩa vụ của Bên B:')]),
          para('- Thanh toán đầy đủ giá trị hợp đồng trong thời hạn quy định.', { indent: { left: 720 } }),
          para('- Thông báo kịp thời khi có thay đổi thông tin liên lạc.', { indent: { left: 720 } }),

          // Điều 4
          subheading('ĐIỀU 4: HIỆU LỰC HỢP ĐỒNG'),
          para([
            txt('Hợp đồng có hiệu lực kể từ ngày ký. Thời hạn hợp đồng là 5 năm, kể từ ngày '),
            field('ngay_ky'),
            txt('.'),
          ]),
          para('Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản.'),

          // Signature section
          new Paragraph({ spacing: { before: 480, after: 240 } }),
          signatureTable(),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  const outPath = `${TEMPLATES_DIR}/contract-template.docx`
  writeFileSync(outPath, buffer)
  console.log(`✅ Created: ${outPath}`)
}

// ─────────────────────────────────────────────────────────────────
// 2. PLACEHOLDER PNG FILES (replace với ảnh thật trước khi deploy)
// ─────────────────────────────────────────────────────────────────

function uint32BE(n) {
  const buf = Buffer.alloc(4)
  buf.writeUInt32BE(n, 0)
  return buf
}

function crc32(data) {
  const table = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const payload = Buffer.concat([typeBytes, data])
  return Buffer.concat([uint32BE(data.length), typeBytes, data, uint32BE(crc32(payload))])
}

/**
 * Create a minimal valid RGBA PNG with two horizontal bands (creates gradient-like look)
 * @param {number} width
 * @param {number} height
 * @param {number[]} topPixel   [R, G, B, A]
 * @param {number[]} bottomPixel [R, G, B, A]
 */
function createBandedPNG(width, height, topPixel, bottomPixel) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdrData = Buffer.concat([
    uint32BE(width),
    uint32BE(height),
    Buffer.from([8, 6, 0, 0, 0]), // 8-bit RGBA
  ])
  const ihdr = pngChunk('IHDR', ihdrData)

  const rows = []
  for (let y = 0; y < height; y++) {
    const pixel = y < height / 2 ? topPixel : bottomPixel
    rows.push(0) // filter byte: None
    for (let x = 0; x < width; x++) rows.push(...pixel)
  }
  const idat = pngChunk('IDAT', deflateSync(Buffer.from(rows)))
  const iend = pngChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([sig, ihdr, idat, iend])
}

function createPNGs() {
  // Signature placeholder: 220x80 semi-transparent blue-gray
  // (Thay bằng chữ ký thật của Tổng Giám Đốc trước khi deploy)
  const signaturePng = createBandedPNG(
    220, 80,
    [30, 60, 120, 180],   // dark blue, semi-transparent
    [20, 40, 90, 160],    // slightly darker
  )
  const sigPath = `${TEMPLATES_DIR}/signature.png`
  writeFileSync(sigPath, signaturePng)
  console.log(`✅ Created: ${sigPath} (PLACEHOLDER — replace with real signature image)`)

  // Stamp placeholder: 110x110 semi-transparent red
  // (Thay bằng con dấu công ty thật trước khi deploy)
  const stampPng = createBandedPNG(
    110, 110,
    [180, 20, 20, 150],  // dark red, semi-transparent
    [150, 15, 15, 140],  // slightly darker
  )
  const stampPath = `${TEMPLATES_DIR}/stamp.png`
  writeFileSync(stampPath, stampPng)
  console.log(`✅ Created: ${stampPath} (PLACEHOLDER — replace with real stamp image)`)
}

// ─────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────
console.log('🔧 Creating contract assets...\n')
await createDocxTemplate()
createPNGs()
console.log('\n⚠️  NOTE: signature.png and stamp.png are placeholders.')
console.log('   Replace them with real scanned images before deploying to production.\n')
