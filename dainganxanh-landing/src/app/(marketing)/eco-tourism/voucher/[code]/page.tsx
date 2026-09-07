import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { Calendar, MapPin, Moon, Phone, Receipt, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

const BOOKING_CODE_REGEX = /^BK[A-Z0-9]{6}$/

interface VoucherPageProps {
  params: Promise<{ code: string }>
}

function formatVND(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Vé đặt phòng - Đại Ngàn Xanh',
    description: 'Vé đặt phòng nghỉ dưỡng sinh thái Đại Ngàn Xanh.',
    robots: { index: false, follow: false },
  }
}

export default async function BookingVoucherPage({ params }: VoucherPageProps) {
  const { code } = await params

  if (!code || !BOOKING_CODE_REGEX.test(code)) {
    notFound()
  }

  const supabase = createServiceRoleClient()
  const { data: rawBooking, error } = await supabase
    .from('room_bookings')
    .select(
      'code, status, check_in_date, check_out_date, nights_count, guests_count, total_amount, guest_name, guest_phone, rooms(name, lots(name, region))'
    )
    .eq('code', code)
    .in('status', ['confirmed', 'completed'])
    .maybeSingle()

  if (error || !rawBooking) {
    notFound()
  }

  const rawRooms = rawBooking.rooms as unknown
  const room = (Array.isArray(rawRooms) ? rawRooms[0] : rawRooms) as {
    name?: string
    lots?: { name?: string; region?: string } | Array<{ name?: string; region?: string }> | null
  } | null
  const roomName = room?.name ?? 'Phòng nghỉ sinh thái'
  const lotsData = room?.lots
  const lot = Array.isArray(lotsData) ? lotsData[0] : lotsData
  const lotName = lot?.name ?? 'Khu nghỉ dưỡng'
  const region = lot?.region ?? ''

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://dainganxanh.com.vn').replace(/\/$/, '')
  const voucherUrl = `${baseUrl}/eco-tourism/voucher/${code}`

  let qrDataUrl = ''
  try {
    qrDataUrl = await QRCode.toDataURL(voucherUrl, { margin: 1, scale: 5 })
  } catch {
    qrDataUrl = ''
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:py-0">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg border border-emerald-200 overflow-hidden print:shadow-none print:border-gray-300">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-green-700 p-6 text-center text-white print:bg-emerald-700">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">
            Voucher nghỉ dưỡng sinh thái
          </p>
          <h1 className="text-2xl font-bold mt-2">Đại Ngàn Xanh</h1>
          <p className="text-emerald-100 text-sm mt-1">Vé điện tử / Offline Voucher</p>
        </div>

        {/* QR + Booking code */}
        <div className="p-6 flex flex-col items-center border-b border-dashed border-emerald-200">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt={`QR voucher ${code}`}
              className="w-40 h-40 rounded-lg border border-gray-200"
            />
          ) : null}
          <p className="mt-4 text-xs text-gray-500 uppercase tracking-widest">Mã đặt phòng</p>
          <p className="font-mono text-2xl font-bold text-emerald-700 tracking-wider">
            {rawBooking.code}
          </p>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4 text-sm text-gray-700">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Khách hàng</p>
              <p className="font-semibold text-gray-900">{rawBooking.guest_name}</p>
              <p className="text-xs text-gray-500">{rawBooking.guest_phone}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Phòng / Khu nghỉ dưỡng</p>
              <p className="font-semibold text-gray-900">{roomName}</p>
              <p className="text-xs text-gray-500">
                {lotName}
                {region ? ` • Vùng ${region}` : ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Nhận phòng</span>
              </div>
              <p className="font-medium text-gray-900">{formatDate(rawBooking.check_in_date)}</p>
              <p className="text-xs text-gray-500">Từ 14:00</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Trả phòng</span>
              </div>
              <p className="font-medium text-gray-900">{formatDate(rawBooking.check_out_date)}</p>
              <p className="text-xs text-gray-500">Trước 12:00</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-2">
              <Moon className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="text-xs text-gray-500">Thời gian</p>
                <p className="font-medium text-gray-900">{rawBooking.nights_count} đêm</p>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="text-xs text-gray-500">Khách lưu trú</p>
                <p className="font-medium text-gray-900">{rawBooking.guests_count} khách</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-gray-900">Đã thanh toán</span>
            </div>
            <span className="text-lg font-bold text-emerald-700">
              {formatVND(rawBooking.total_amount)}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-6 pt-0 text-xs text-gray-600 space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="font-semibold text-amber-800 mb-1">Hướng dẫn nhận phòng</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Xuất trình mã voucher <strong>{rawBooking.code}</strong> và CCCD/Hộ chiếu tại quầy lễ
                tân.
              </li>
              <li>
                Giờ nhận phòng: từ <strong>14:00</strong> | Giờ trả phòng: trước{' '}
                <strong>12:00</strong>.
              </li>
              <li>Nếu cần hỗ trợ đón hoặc nhận phòng muộn, vui lòng liên hệ hotline.</li>
            </ul>
          </div>
          <div className="flex items-center gap-2 text-emerald-700 font-semibold">
            <Phone className="w-4 h-4" />
            <span>Hotline: 1900 8888</span>
          </div>
          <p className="text-[11px] text-gray-400 text-center break-all">{voucherUrl}</p>
        </div>
      </div>
    </div>
  )
}
