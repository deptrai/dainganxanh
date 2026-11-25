import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { RoomBookingWithJoinedRoom } from '@/types/database.types'
import { AlertCircle, Calendar, MapPin, Moon, Phone, Receipt, Users } from 'lucide-react'
import { VoucherPrintButton } from '@/components/eco-tourism/VoucherPrintButton'
import { rateLimitByKey } from '@/lib/rate-limit'
import { SUPPORT_HOTLINE } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

const BOOKING_CODE_REGEX = /^BK[A-Z0-9]{6}$/

interface VoucherPageProps {
  params: Promise<{ locale: string; code: string }>
}

export async function generateMetadata({ params }: VoucherPageProps): Promise<Metadata> {
  const { locale, code } = await params
  setRequestLocale(locale)
  const cleanCode = code?.trim().toUpperCase()
  const t = await getTranslations({ locale, namespace: 'eco.voucher' })
  return {
    title: cleanCode ? t('bookingVoucher', { code: cleanCode }) : t('bookingVoucherDefault'),
    description: t('metaDesc'),
    robots: { index: false, follow: false },
  }
}

export default async function BookingVoucherPage({ params }: VoucherPageProps) {
  const { locale, code: rawCode } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'eco.voucher' })
  const headerStore = await headers()
  const forwarded = headerStore.get('x-forwarded-for')
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : (headerStore.get('x-real-ip') ?? 'unknown')

  const rlResult = rateLimitByKey(clientIp, {
    limit: 20,
    windowMs: 60_000,
    keyPrefix: 'voucher-page',
  })

  if (!rlResult.ok) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-amber-200 p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t('tooManyRequests')}</h1>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            {t('tooManyRequestsDesc')}
          </p>
          <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700">
            <Phone className="w-4 h-4" />
            <span>{t('hotline', { hotline: SUPPORT_HOTLINE })}</span>
          </div>
        </div>
      </div>
    )
  }

  const code = rawCode?.trim().toUpperCase()

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

  if (error) {
    console.error('[Voucher] Failed to load booking:', error)
    notFound()
  }

  if (!rawBooking) {
    notFound()
  }

  const bookingRow = rawBooking as RoomBookingWithJoinedRoom
  const room = Array.isArray(bookingRow.rooms) ? bookingRow.rooms[0] : bookingRow.rooms
  const roomName = room?.name ?? t('defaultRoomName')
  const lotsData = room?.lots
  const lot = Array.isArray(lotsData) ? lotsData[0] : lotsData
  const lotName = lot?.name ?? t('defaultLotName')
  const region = lot?.region ?? ''

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://dainganxanh.com.vn').replace(/\/$/, '')
  const voucherUrl = `${baseUrl}/${locale}/eco-tourism/voucher/${code}`

  let qrDataUrl = ''
  try {
    qrDataUrl = await QRCode.toDataURL(voucherUrl, { margin: 1, scale: 5 })
  } catch (qrErr) {
    console.error('[Voucher] Failed to generate QR code:', qrErr)
    qrDataUrl = ''
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:py-0">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg border border-emerald-200 overflow-hidden print:shadow-none print:border-gray-300">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-green-700 p-6 text-center text-white print:bg-emerald-700">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">
            {t('bannerSubtitle')}
          </p>
          <h1 className="text-2xl font-bold mt-2">Đại Ngàn Xanh</h1>
          <p className="text-emerald-100 text-sm mt-1">{t('bannerType')}</p>
        </div>

        {/* QR + Booking code */}
        <div className="p-6 flex flex-col items-center border-b border-dashed border-emerald-200">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt={t('qrAlt', { code })}
              className="w-40 h-40 rounded-lg border border-gray-200"
            />
          ) : null}
          <p className="mt-4 text-xs text-gray-500 uppercase tracking-widest">{t('bookingCode')}</p>
          <p className="font-mono text-2xl font-bold text-emerald-700 tracking-wider">
            {rawBooking.code}
          </p>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4 text-sm text-gray-700">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">{t('customer')}</p>
              <p className="font-semibold text-gray-900">{rawBooking.guest_name}</p>
              <p className="text-xs text-gray-500">{rawBooking.guest_phone}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">{t('roomAndLot')}</p>
              <p className="font-semibold text-gray-900">{roomName}</p>
              <p className="text-xs text-gray-500">
                {lotName}
                {region ? t('regionFormat', { region }) : ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>{t('checkIn')}</span>
              </div>
              <p className="font-medium text-gray-900">{formatDate(rawBooking.check_in_date, locale, { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' })}</p>
              <p className="text-xs text-gray-500">{t('checkInTime')}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>{t('checkOut')}</span>
              </div>
              <p className="font-medium text-gray-900">{formatDate(rawBooking.check_out_date, locale, { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' })}</p>
              <p className="text-xs text-gray-500">{t('checkOutTime')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-2">
              <Moon className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="text-xs text-gray-500">{t('nights')}</p>
                <p className="font-medium text-gray-900">{t('nightsCount', { count: rawBooking.nights_count ?? 1 })}</p>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="text-xs text-gray-500">{t('guests')}</p>
                <p className="font-medium text-gray-900">{t('guestsCount', { count: rawBooking.guests_count ?? 1 })}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-gray-900">{t('paidAmount')}</span>
            </div>
            <span className="text-lg font-bold text-emerald-700">
              {formatCurrency(rawBooking.total_amount, locale)}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-6 pt-0 text-xs text-gray-600 space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="font-semibold text-amber-800 mb-1">{t('instructionsTitle')}</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                {t.rich('instructionsRule1', {
                  code: rawBooking.code,
                  codeTag: (chunks) => <strong>{chunks}</strong>,
                })}
              </li>
              <li>
                {t.rich('instructionsRule2', {
                  checkInTag: (chunks) => <strong>{chunks}</strong>,
                  checkOutTag: (chunks) => <strong>{chunks}</strong>,
                })}
              </li>
              <li>{t('instructionsRule3')}</li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <Phone className="w-4 h-4" />
              <span>{t('hotline', { hotline: SUPPORT_HOTLINE })}</span>
            </div>
            <VoucherPrintButton />
          </div>
          <p className="text-[11px] text-gray-400 text-center break-all">{voucherUrl}</p>
        </div>
      </div>
    </div>
  )
}
