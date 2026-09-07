import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CheckCircle2, Calendar, MapPin, Users, Moon, Receipt, Ticket } from 'lucide-react'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface BookingSuccessPageProps {
  params: Promise<{ lotId: string }>
  searchParams: Promise<{ code?: string }>
}

function formatVND(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const cleanDate = dateStr.split('T')[0]
  const d = new Date(cleanDate + 'T00:00:00')
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' })
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Đặt phòng thành công — Đại Ngàn Xanh',
    description: 'Xác nhận đặt phòng nghỉ dưỡng sinh thái thành công.',
  }
}

export default async function BookingSuccessPage({ params, searchParams }: BookingSuccessPageProps) {
  const { lotId } = await params
  const { code } = await searchParams

  if (!code) {
    redirect(`/eco-tourism/${lotId}`)
    return null
  }

  const supabase = createServiceRoleClient()
  const { data: rawBooking, error } = await supabase
    .from('room_bookings')
    .select('id, code, status, check_in_date, check_out_date, nights_count, guests_count, total_amount, guest_name, guest_phone, rooms(name, lot_id, lots(name, region))')
    .eq('code', code)
    .maybeSingle()

  if (error || !rawBooking || (rawBooking.status !== 'confirmed' && rawBooking.status !== 'completed')) {
    redirect(`/eco-tourism/${lotId}`)
    return null
  }

  const rawRooms = rawBooking.rooms as unknown
  const room = (Array.isArray(rawRooms) ? rawRooms[0] : rawRooms) as {
    name?: string
    lot_id?: string
    lots?: { name?: string; region?: string } | Array<{ name?: string; region?: string }> | null
  } | null
  const roomName = room?.name ?? 'Phòng nghỉ'
  const lotsData = room?.lots
  const lot = Array.isArray(lotsData) ? lotsData[0] : lotsData
  const lotName = lot?.name ?? 'Khu nghỉ dưỡng'
  const region = lot?.region ?? ''

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-white to-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden">
        {/* Header banner */}
        <div className="bg-gradient-to-br from-emerald-600 to-green-700 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Đặt phòng thành công!</h1>
          <p className="text-emerald-100 text-sm mt-1">Cảm ơn bạn đã lựa chọn nghỉ dưỡng cùng Đại Ngàn Xanh</p>
          <div className="mt-4 inline-block bg-white/15 backdrop-blur px-4 py-1.5 rounded-full">
            <span className="text-xs uppercase tracking-wider text-emerald-100 mr-2">Mã đặt phòng</span>
            <span className="font-mono font-bold text-white tracking-wide">{rawBooking.code}</span>
          </div>
        </div>

        {/* Booking details card */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-4 text-sm text-gray-700">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">{roomName}</p>
                <p className="text-xs text-gray-500">{lotName} • Vùng {region}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Nhận phòng</span>
                </div>
                <p className="font-medium text-gray-900">{formatDate(rawBooking.check_in_date)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Trả phòng</span>
                </div>
                <p className="font-medium text-gray-900">{formatDate(rawBooking.check_out_date)}</p>
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

            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-gray-900">Tổng thanh toán</span>
              </div>
              <span className="text-xl font-bold text-emerald-700">{formatVND(rawBooking.total_amount)}</span>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 leading-relaxed">
            <p className="font-semibold mb-1">Hướng dẫn nhận phòng:</p>
            <p>
              Nhân viên khu nghỉ dưỡng sẽ liên hệ với quý khách theo số điện thoại{' '}
              <span className="font-semibold">{rawBooking.guest_phone}</span> trước ngày nhận phòng để hỗ trợ thủ tục.
              Vui lòng mang theo CMND/CCCD khi làm thủ tục check-in.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href={`/eco-tourism/voucher/${encodeURIComponent(rawBooking.code)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 text-center rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Ticket className="w-4 h-4" />
              Xem vé offline
            </Link>
            <Link
              href={`/eco-tourism/${lotId}`}
              className="flex-1 py-3 px-4 text-center rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Về trang vườn
            </Link>
            <Link
              href="/eco-tourism"
              className="flex-1 py-3 px-4 text-center rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors text-sm"
            >
              Khám phá thêm vườn
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
