import {
  calculateEffectiveRoomPrice,
  calculateEffectiveRoomPrices,
  applyEffectiveRoomPrices,
  isPricingRuleApplicable,
  RoomForPricing,
  RoomPricingRule,
} from '../display'

describe('Effective Room Pricing Engine (TD-01)', () => {
  const baseRoom: RoomForPricing = {
    id: 'room-1',
    price_per_night: 1000000,
    name: 'Bungalow Rừng Trầm',
  }

  // Mốc tham chiếu cố định: Thứ Hai, 2026-06-01
  const referenceDate = '2026-06-01'
  // Cửa sổ 90 ngày: từ 2026-06-01 đến 2026-08-30

  describe('isPricingRuleApplicable', () => {
    it('áp dụng thành công khi rule giao với cửa sổ tham chiếu và không giới hạn days_of_week', () => {
      const rule: RoomPricingRule = {
        room_id: 'room-1',
        start_date: '2026-06-10',
        end_date: '2026-06-20',
        price_per_night: 800000,
      }
      expect(isPricingRuleApplicable(rule, '2026-06-01', '2026-08-30')).toBe(true)
    })

    it('không áp dụng khi rule đã kết thúc trong quá khứ', () => {
      const rule: RoomPricingRule = {
        room_id: 'room-1',
        start_date: '2026-05-01',
        end_date: '2026-05-25',
        price_per_night: 800000,
      }
      expect(isPricingRuleApplicable(rule, '2026-06-01', '2026-08-30')).toBe(false)
    })

    it('không áp dụng khi rule ở tương lai xa ngoài cửa sổ 90 ngày', () => {
      const rule: RoomPricingRule = {
        room_id: 'room-1',
        start_date: '2026-09-15',
        end_date: '2026-09-30',
        price_per_night: 800000,
      }
      expect(isPricingRuleApplicable(rule, '2026-06-01', '2026-08-30')).toBe(false)
    })

    it('áp dụng khi rule giao một phần ở đầu hoặc cuối cửa sổ tham chiếu', () => {
      // Bắt đầu trước cửa sổ, kết thúc trong cửa sổ
      const ruleBefore: RoomPricingRule = {
        room_id: 'room-1',
        start_date: '2026-05-15',
        end_date: '2026-06-05',
        price_per_night: 850000,
      }
      expect(isPricingRuleApplicable(ruleBefore, '2026-06-01', '2026-08-30')).toBe(true)

      // Bắt đầu trong cửa sổ, kết thúc sau cửa sổ
      const ruleAfter: RoomPricingRule = {
        room_id: 'room-1',
        start_date: '2026-08-25',
        end_date: '2026-09-10',
        price_per_night: 850000,
      }
      expect(isPricingRuleApplicable(ruleAfter, '2026-06-01', '2026-08-30')).toBe(true)
    })

    it('lọc chính xác theo days_of_week khi có ngày trong tuần trùng khớp', () => {
      // 2026-06-01 là Thứ 2, 2026-06-02 là Thứ 3
      // Rule chỉ áp dụng Thứ 2 (1): có khớp
      const ruleMonday: RoomPricingRule = {
        room_id: 'room-1',
        start_date: '2026-06-01',
        end_date: '2026-06-02',
        days_of_week: [1], // Thứ 2
        price_per_night: 750000,
      }
      expect(isPricingRuleApplicable(ruleMonday, '2026-06-01', '2026-08-30')).toBe(true)
    })

    it('loại trừ rule khi khoảng giao nhau không chứa bất kỳ thứ nào trong days_of_week', () => {
      // Khoảng 2026-06-01 (Thứ 2) đến 2026-06-02 (Thứ 3)
      // Rule chỉ áp dụng Chủ nhật (0) và Thứ 7 (6): không khớp ngày nào
      const ruleWeekendOnly: RoomPricingRule = {
        room_id: 'room-1',
        start_date: '2026-06-01',
        end_date: '2026-06-02',
        days_of_week: [0, 6],
        price_per_night: 750000,
      }
      expect(isPricingRuleApplicable(ruleWeekendOnly, '2026-06-01', '2026-08-30')).toBe(false)
    })

    it('bỏ qua rule có giá không hợp lệ hoặc khoảng ngày sai', () => {
      const invalidPriceRule: RoomPricingRule = {
        room_id: 'room-1',
        start_date: '2026-06-10',
        end_date: '2026-06-20',
        price_per_night: 0,
      }
      expect(isPricingRuleApplicable(invalidPriceRule, '2026-06-01', '2026-08-30')).toBe(false)

      const invalidDateRule: RoomPricingRule = {
        room_id: 'room-1',
        start_date: '2026-06-20',
        end_date: '2026-06-10',
        price_per_night: 800000,
      }
      expect(isPricingRuleApplicable(invalidDateRule, '2026-06-01', '2026-08-30')).toBe(false)
    })
  })

  describe('calculateEffectiveRoomPrice', () => {
    it('trả về base price khi phòng không có rule nào', () => {
      const price = calculateEffectiveRoomPrice(baseRoom, [], { referenceDate })
      expect(price).toBe(1000000)
    })

    it('trả về giá khuyến mãi thấp hơn base price khi có rule áp dụng', () => {
      const rules: RoomPricingRule[] = [
        {
          id: 'rule-promo',
          room_id: 'room-1',
          rule_name: 'Khuyến mãi hè',
          start_date: '2026-06-15',
          end_date: '2026-07-15',
          price_per_night: 750000,
        },
      ]
      const price = calculateEffectiveRoomPrice(baseRoom, rules, { referenceDate })
      expect(price).toBe(750000)
    })

    it('giữ nguyên base price khi rule chỉ có giá tăng cao hơn base price', () => {
      const rules: RoomPricingRule[] = [
        {
          id: 'rule-peak',
          room_id: 'room-1',
          rule_name: 'Phụ thu cuối tuần cao điểm',
          start_date: '2026-06-01',
          end_date: '2026-06-30',
          days_of_week: [5, 6],
          price_per_night: 1500000,
        },
      ]
      const price = calculateEffectiveRoomPrice(baseRoom, rules, { referenceDate })
      // min(1000000, 1500000) = 1000000
      expect(price).toBe(1000000)
    })

    it('lấy giá nhỏ nhất khi có nhiều rule khác nhau trong cửa sổ tham chiếu', () => {
      const rules: RoomPricingRule[] = [
        {
          id: 'rule-peak',
          room_id: 'room-1',
          rule_name: 'Mùa cao điểm',
          start_date: '2026-06-01',
          end_date: '2026-06-30',
          price_per_night: 1400000,
        },
        {
          id: 'rule-mid',
          room_id: 'room-1',
          rule_name: 'Flash sale tuần',
          start_date: '2026-06-10',
          end_date: '2026-06-15',
          price_per_night: 800000,
        },
        {
          id: 'rule-lowest',
          room_id: 'room-1',
          rule_name: 'Ưu đãi đặc biệt',
          start_date: '2026-07-01',
          end_date: '2026-07-10',
          price_per_night: 650000,
        },
      ]
      const price = calculateEffectiveRoomPrice(baseRoom, rules, { referenceDate })
      expect(price).toBe(650000)
    })

    it('bỏ qua rule của phòng khác (room_id không khớp)', () => {
      const rules: RoomPricingRule[] = [
        {
          id: 'rule-other',
          room_id: 'room-other',
          rule_name: 'Giảm giá phòng khác',
          start_date: '2026-06-01',
          end_date: '2026-06-30',
          price_per_night: 300000,
        },
      ]
      const price = calculateEffectiveRoomPrice(baseRoom, rules, { referenceDate })
      expect(price).toBe(1000000)
    })
  })

  describe('calculateEffectiveRoomPrices & applyEffectiveRoomPrices', () => {
    const rooms: RoomForPricing[] = [
      { id: 'room-1', price_per_night: 1000000, name: 'Bungalow 1' },
      { id: 'room-2', price_per_night: 1500000, name: 'Villa 2' },
      { id: 'room-3', price_per_night: 800000, name: 'Standard 3' },
    ]

    const rules: RoomPricingRule[] = [
      {
        room_id: 'room-1',
        start_date: '2026-06-10',
        end_date: '2026-06-20',
        price_per_night: 850000,
      },
      {
        room_id: 'room-2',
        start_date: '2026-06-01',
        end_date: '2026-06-30',
        price_per_night: 1200000,
      },
      // room-3 không có rule
    ]

    it('calculateEffectiveRoomPrices trả về Map giá cho từng phòng', () => {
      const priceMap = calculateEffectiveRoomPrices(rooms, rules, { referenceDate })
      expect(priceMap.get('room-1')).toBe(850000)
      expect(priceMap.get('room-2')).toBe(1200000)
      expect(priceMap.get('room-3')).toBe(800000)
    })

    it('applyEffectiveRoomPrices trả về mảng phòng mới với price_per_night cập nhật', () => {
      const updatedRooms = applyEffectiveRoomPrices(rooms, rules, { referenceDate })
      expect(updatedRooms).toHaveLength(3)
      expect(updatedRooms[0]).toEqual({
        id: 'room-1',
        price_per_night: 850000,
        name: 'Bungalow 1',
      })
      expect(updatedRooms[1]).toEqual({
        id: 'room-2',
        price_per_night: 1200000,
        name: 'Villa 2',
      })
      expect(updatedRooms[2]).toEqual({
        id: 'room-3',
        price_per_night: 800000,
        name: 'Standard 3',
      })
    })
  })
})
