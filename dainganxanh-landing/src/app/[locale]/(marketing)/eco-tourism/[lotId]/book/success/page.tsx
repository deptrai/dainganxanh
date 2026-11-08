import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link, redirect } from '@/i18n/navigation'
import { CheckCircle2, Calendar, MapPin, Users, Moon, Receipt, Ticket } from 'lucide-react'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/format'
import type { RoomBookingWithJoinedRoom } from '@/types/database.types'

export const dynamic = 'force-dynamic'

interface BookingSuccessPageProps {
  params: Promise<{ locale: string; lotId: string }>
  searchParams: Promise<{ code?: string }>
}

export async function generateMetadata({ params }: BookingSuccessPageProps): Promise<Metadata> {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'eco.success' })
  return {
    title: `${t('title')} — Đại Ngàn Xanh`,
    description: t('subtitle'),
  }
}

export default async function BookingSuccessPage({ params, searchParams }: BookingSuccessPageProps) {
  const { locale, lotId } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'eco.success' })
  const { code } = await searchParams

  if (!code) {
    redirect({ href: `/eco-tourism/${lotId}`, locale })
    return null
  }

  const supabase = createServiceRoleClient()
  const { data: rawBooking, error } = await supabase
    .from('room_bookings')
    .select('id, code, status, check_in_date, check_out_date, nights_count, guests_count, total_amount, guest_name, guest_phone, rooms(name, lot_id, lots(name, region))')
    .eq('code', code)
    .maybeSingle()

  if (error || !rawBooking || (rawBooking.status !== 'confirmed' && rawBooking.status !== 'completed')) {
    redirect({ href: `/eco-tourism/${lotId}`, locale })
    return null
  }

  const bookingRow = rawBooking as RoomBookingWithJoinedRoom
  const room = Array.isArray(bookingRow.rooms) ? bookingRow.rooms[0] : bookingRow.rooms
  const roomName = room?.name ?? t('defaultRoom')
  const lotsData = room?.lots
  const lot = Array.isArray(lotsData) ? lotsData[0] : lotsData
  const lotName = lot?.name ?? t('defaultLot')
  const region = lot?.region ?? ''

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-white to-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden">
        {/* Header banner */}
        <div className="bg-gradient-to-br from-emerald-600 to-green-700 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-emerald-100 text-sm mt-1">{t('subtitle')}</p>
          <div className="mt-4 inline-block bg-white/15 backdrop-blur px-4 py-1.5 rounded-full">
            <span className="text-xs uppercase tracking-wider text-emerald-100 mr-2">{t('bookingCode')}</span>
            <span className="font-mono font-bold text-white tracking-wide">{bookingRow.code}</span>
          </div>
        </div>

        {/* Booking details card */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-4 text-sm text-gray-700">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">{roomName}</p>
                <p className="text-xs text-gray-500">{lotName}{region ? ` • ${t('region', { region })}` : ''}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>{t('checkIn')}</span>
                </div>
                <p className="font-medium text-gray-900">{formatDate(bookingRow.check_in_date, locale, { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' })}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>{t('checkOut')}</span>
                </div>
                <p className="font-medium text-gray-900">{formatDate(bookingRow.check_out_date, locale, { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-2">
                <Moon className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="text-xs text-gray-500">{t('duration')}</p>
                  <p className="font-medium text-gray-900">{t('nightsCount', { count: bookingRow.nights_count ?? 1 })}</p>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="text-xs text-gray-500">{t('guests')}</p>
                  <p className="font-medium text-gray-900">{t('guestsCount', { count: bookingRow.guests_count ?? 1 })}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-gray-900">{t('totalAmount')}</span>
              </div>
              <span className="text-xl font-bold text-emerald-700">{formatCurrency(bookingRow.total_amount, locale)}</span>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 leading-relaxed">
            <p className="font-semibold mb-1">{t('instructionsTitle')}</p>
            <p>
              {t.rich('instructionsDesc', {
                phone: bookingRow.guest_phone ?? '',
                phoneTag: (chunks) => <span className="font-semibold">{chunks}</span>,
              })}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href={`/eco-tourism/voucher/${encodeURIComponent(bookingRow.code)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 text-center rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Ticket className="w-4 h-4" />
              {t('viewVoucher')}
            </Link>
            <Link
              href={`/eco-tourism/${lotId}`}
              className="flex-1 py-3 px-4 text-center rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              {t('backToGarden')}
            </Link>
            <Link
              href="/eco-tourism"
              className="flex-1 py-3 px-4 text-center rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors text-sm"
            >
              {t('exploreMore')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
