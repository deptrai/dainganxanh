import { SupabaseClient } from '@supabase/supabase-js'
import {
  BookingPriceItem,
  BookingPriceResult,
  CalculateBookingPriceParams,
  PricingError,
} from './types'

export async function calculateBookingPrice(
  supabase: SupabaseClient,
  params: CalculateBookingPriceParams
): Promise<BookingPriceResult> {
  const { roomId, checkInDate, checkOutDate, guestsCount } = params

  const checkIn = new Date(checkInDate + 'T00:00:00Z')
  const checkOut = new Date(checkOutDate + 'T00:00:00Z')

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    throw new PricingError('Ngày nhận hoặc trả phòng không hợp lệ')
  }

  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  if (nights <= 0) {
    throw new PricingError('Ngày trả phòng phải sau ngày nhận phòng')
  }
  if (nights > 30) {
    throw new PricingError('Thời gian lưu trú tối đa là 30 đêm')
  }

  // 1. Fetch authoritative room info
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id, name, price_per_night, capacity, status')
    .eq('id', roomId)
    .eq('status', 'active')
    .single()

  if (roomError || !room) {
    throw new PricingError('Phòng không tồn tại hoặc tạm ngừng phục vụ', 404)
  }

  // 2. Validate capacity
  if (guestsCount && guestsCount > room.capacity) {
    throw new PricingError(
      `Số lượng khách vượt quá sức chứa tối đa của phòng (${room.capacity} người)`
    )
  }

  // 3. Fetch applicable pricing rules for this room
  const { data: rules } = await supabase
    .from('room_pricing_rules')
    .select('id, room_id, start_date, end_date, price_per_night, min_nights')
    .eq('room_id', roomId)

  const pricingRules = rules ?? []

  // 4. Per-night resolution
  const nightBreakdown: BookingPriceItem[] = []
  let totalAmount = 0

  const iterDate = new Date(checkIn)
  while (iterDate < checkOut) {
    const dateStr = iterDate.toISOString().split('T')[0]

    // Find any matching rule covering this night
    const matchedRule = pricingRules.find(
      (r) => dateStr >= r.start_date && dateStr <= r.end_date
    )

    if (matchedRule) {
      if (matchedRule.min_nights && nights < matchedRule.min_nights) {
        throw new PricingError(
          `Yêu cầu đặt tối thiểu ${matchedRule.min_nights} đêm cho giai đoạn này.`
        )
      }
      const price = Number(matchedRule.price_per_night)
      nightBreakdown.push({
        date: dateStr,
        price,
        isCustomRule: true,
      })
      totalAmount += price
    } else {
      const price = Number(room.price_per_night)
      nightBreakdown.push({
        date: dateStr,
        price,
        isCustomRule: false,
      })
      totalAmount += price
    }

    iterDate.setUTCDate(iterDate.getUTCDate() + 1)
  }

  return {
    roomId: room.id,
    roomName: room.name,
    nights,
    basePricePerNight: Number(room.price_per_night),
    nightBreakdown,
    totalAmount,
  }
}
