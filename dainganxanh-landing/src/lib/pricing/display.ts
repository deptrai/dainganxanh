/**
 * Helper tính toán "Giá từ" hiệu dụng (effective starting price) cho phòng và khu vườn
 * TD-01: Kết hợp giá cơ bản (base price) từ bảng rooms và các quy tắc giá (pricing rules)
 * từ bảng room_pricing_rules để phản ánh đúng giá mùa vụ, khuyến mãi hoặc ngày trong tuần.
 */

export interface RoomForPricing {
  id: string
  price_per_night: number
}

export interface RoomPricingRule {
  id?: string
  room_id: string
  rule_name?: string
  start_date: string // Định dạng 'YYYY-MM-DD'
  end_date: string   // Định dạng 'YYYY-MM-DD'
  days_of_week?: number[] | null // 0=Chủ nhật, 1=Thứ 2, ..., 6=Thứ 7
  price_per_night: number
  min_nights?: number | null
}

export interface EffectivePriceOptions {
  /**
   * Ngày mốc bắt đầu cửa sổ tham chiếu (mặc định: ngày hiện tại)
   */
  referenceDate?: Date | string
  /**
   * Số ngày của cửa sổ tham chiếu để quét quy tắc giá mùa vụ sắp tới (mặc định: 90 ngày)
   */
  windowDays?: number
}

/**
 * Chuyển đổi Date hoặc chuỗi ngày sang định dạng 'YYYY-MM-DD'
 */
function formatDateToYMD(d: Date | string): string {
  if (typeof d === 'string') {
    return d.split('T')[0]
  }
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Kiểm tra một quy tắc giá (pricing rule) có áp dụng được trong cửa sổ tham chiếu hay không.
 *
 * Điều kiện áp dụng:
 * 1. Khoảng ngày của rule [start_date, end_date] giao nhau với cửa sổ tham chiếu [windowStart, windowEnd].
 * 2. Khoảng giao nhau có ít nhất một ngày trùng với days_of_week của rule (nếu rule có cấu hình days_of_week).
 * 3. Giá phòng hợp lệ (số dương).
 */
export function isPricingRuleApplicable(
  rule: RoomPricingRule,
  windowStartStr: string,
  windowEndStr: string
): boolean {
  const rulePrice = Number(rule.price_per_night)
  if (Number.isNaN(rulePrice) || rulePrice <= 0) {
    return false
  }

  const ruleStart = rule.start_date.split('T')[0]
  const ruleEnd = rule.end_date.split('T')[0]

  if (ruleStart > ruleEnd) {
    return false
  }

  // Kiểm tra 2 khoảng thời gian có giao nhau không
  // [ruleStart, ruleEnd] giao [windowStartStr, windowEndStr]
  if (ruleStart > windowEndStr || ruleEnd < windowStartStr) {
    return false
  }

  // Xác định khoảng giao nhau
  const intersectStart = ruleStart > windowStartStr ? ruleStart : windowStartStr
  const intersectEnd = ruleEnd < windowEndStr ? ruleEnd : windowEndStr

  // Nếu rule không giới hạn days_of_week hoặc mảng rỗng -> áp dụng mọi ngày trong tuần
  if (!rule.days_of_week || rule.days_of_week.length === 0) {
    return true
  }

  // Duyệt qua các ngày trong khoảng giao nhau để kiểm tra có ngày nào trùng thứ quy định không
  // Lưu ý: Duyệt tối đa 7 ngày là có thể kiểm tra đủ toàn bộ các thứ trong tuần
  const cur = new Date(`${intersectStart}T00:00:00Z`)
  const stop = new Date(`${intersectEnd}T00:00:00Z`)

  let stepCount = 0
  while (cur <= stop && stepCount < 7) {
    const dow = cur.getUTCDay() // 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7
    if (rule.days_of_week.includes(dow)) {
      return true
    }
    cur.setUTCDate(cur.getUTCDate() + 1)
    stepCount++
  }

  return false
}

/**
 * Tính "Giá từ" hiệu dụng cho 1 phòng cụ thể:
 * Trả về giá nhỏ nhất giữa giá cơ bản (base price) và các giá mùa vụ áp dụng được trong cửa sổ tham chiếu (+90 ngày).
 * Nếu phòng không có rule nào áp dụng được -> trả về giá cơ bản price_per_night.
 */
export function calculateEffectiveRoomPrice(
  room: { id: string; price_per_night: number },
  rules: RoomPricingRule[],
  options?: EffectivePriceOptions
): number {
  const windowDays = options?.windowDays ?? 90
  const referenceDate = options?.referenceDate ?? new Date()

  const windowStartStr = formatDateToYMD(referenceDate)
  const startUtc = new Date(`${windowStartStr}T00:00:00Z`)
  const endUtc = new Date(startUtc)
  endUtc.setUTCDate(endUtc.getUTCDate() + windowDays)
  const windowEndStr = endUtc.toISOString().split('T')[0]

  const basePrice = Number(room.price_per_night)
  const candidatePrices: number[] = []

  if (!Number.isNaN(basePrice) && basePrice > 0) {
    candidatePrices.push(basePrice)
  }

  // Lọc các rule thuộc về phòng này và thỏa mãn điều kiện áp dụng
  const roomRules = rules.filter((r) => r.room_id === room.id)
  for (const rule of roomRules) {
    if (isPricingRuleApplicable(rule, windowStartStr, windowEndStr)) {
      candidatePrices.push(Number(rule.price_per_night))
    }
  }

  if (candidatePrices.length === 0) {
    return Math.max(basePrice, 0)
  }

  return Math.min(...candidatePrices)
}

/**
 * Tính "Giá từ" hiệu dụng cho danh sách các phòng:
 * Trả về Map<roomId, effectivePrice> ánh xạ từ ID phòng sang giá hiệu dụng.
 */
export function calculateEffectiveRoomPrices(
  rooms: Array<{ id: string; price_per_night: number }>,
  rules: RoomPricingRule[],
  options?: EffectivePriceOptions
): Map<string, number> {
  const result = new Map<string, number>()
  for (const room of rooms) {
    const effectivePrice = calculateEffectiveRoomPrice(room, rules, options)
    result.set(room.id, effectivePrice)
  }
  return result
}

/**
 * Cập nhật danh sách phòng với price_per_night mới là giá từ hiệu dụng.
 * Giữ nguyên các trường khác của đối tượng room.
 */
export function applyEffectiveRoomPrices<T extends { id: string; price_per_night: number }>(
  rooms: T[],
  rules: RoomPricingRule[],
  options?: EffectivePriceOptions
): T[] {
  const priceMap = calculateEffectiveRoomPrices(rooms, rules, options)
  return rooms.map((room) => ({
    ...room,
    price_per_night: priceMap.get(room.id) ?? room.price_per_night,
  }))
}
