import { calculateBookingPrice, calculateStoreOrderPrice, PricingError } from '../index'

describe('Server-Side Pricing Engine — calculateBookingPrice', () => {
  const mockSupabase: any = {
    from: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calculates standard booking price across nights without custom rules', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'rooms') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'room-1',
                    name: 'Bungalow Rừng Trầm',
                    price_per_night: 1000000,
                    capacity: 4,
                    status: 'active',
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'room_pricing_rules') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }
      }
      return { select: jest.fn() }
    })

    const result = await calculateBookingPrice(mockSupabase, {
      roomId: 'room-1',
      checkInDate: '2026-10-10',
      checkOutDate: '2026-10-12',
      guestsCount: 2,
    })

    expect(result.roomId).toBe('room-1')
    expect(result.roomName).toBe('Bungalow Rừng Trầm')
    expect(result.nights).toBe(2)
    expect(result.basePricePerNight).toBe(1000000)
    expect(result.totalAmount).toBe(2000000)
    expect(result.nightBreakdown).toHaveLength(2)
    expect(result.nightBreakdown[0]).toEqual({
      date: '2026-10-10',
      price: 1000000,
      isCustomRule: false,
    })
    expect(result.nightBreakdown[1]).toEqual({
      date: '2026-10-11',
      price: 1000000,
      isCustomRule: false,
    })
  })

  test('applies custom room_pricing_rules for holiday/weekend dates', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'rooms') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'room-1',
                    name: 'Bungalow Rừng Trầm',
                    price_per_night: 1000000,
                    capacity: 4,
                    status: 'active',
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'room_pricing_rules') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'rule-holiday',
                  room_id: 'room-1',
                  start_date: '2026-10-11',
                  end_date: '2026-10-11',
                  price_per_night: 1500000,
                  min_nights: 1,
                },
              ],
              error: null,
            }),
          }),
        }
      }
      return { select: jest.fn() }
    })

    const result = await calculateBookingPrice(mockSupabase, {
      roomId: 'room-1',
      checkInDate: '2026-10-10',
      checkOutDate: '2026-10-12',
      guestsCount: 2,
    })

    expect(result.nights).toBe(2)
    expect(result.totalAmount).toBe(2500000) // 1,000,000 + 1,500,000
    expect(result.nightBreakdown[0].price).toBe(1000000)
    expect(result.nightBreakdown[0].isCustomRule).toBe(false)
    expect(result.nightBreakdown[1].price).toBe(1500000)
    expect(result.nightBreakdown[1].isCustomRule).toBe(true)
  })

  test('throws PricingError when min_nights requirement is violated', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'rooms') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'room-1',
                    name: 'Bungalow Rừng Trầm',
                    price_per_night: 1000000,
                    capacity: 4,
                    status: 'active',
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'room_pricing_rules') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'rule-tet',
                  room_id: 'room-1',
                  start_date: '2026-10-10',
                  end_date: '2026-10-15',
                  price_per_night: 2000000,
                  min_nights: 3,
                },
              ],
              error: null,
            }),
          }),
        }
      }
      return { select: jest.fn() }
    })

    await expect(
      calculateBookingPrice(mockSupabase, {
        roomId: 'room-1',
        checkInDate: '2026-10-10',
        checkOutDate: '2026-10-12', // 2 nights, but rule requires 3
        guestsCount: 2,
      })
    ).rejects.toThrow('Yêu cầu đặt tối thiểu 3 đêm')
  })

  test('throws PricingError when guestsCount exceeds capacity', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'rooms') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'room-1',
                    name: 'Phòng Đơn',
                    price_per_night: 500000,
                    capacity: 2,
                    status: 'active',
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      return { select: jest.fn() }
    })

    await expect(
      calculateBookingPrice(mockSupabase, {
        roomId: 'room-1',
        checkInDate: '2026-10-10',
        checkOutDate: '2026-10-11',
        guestsCount: 3, // exceeds capacity 2
      })
    ).rejects.toThrow('Số lượng khách vượt quá sức chứa')
  })
})

describe('Server-Side Pricing Engine — calculateStoreOrderPrice', () => {
  const mockSupabase: any = {
    from: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calculates subtotal and adds 30k shipping fee for orders under 500k', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'prod-1',
                slug: 'nhang-tram-tu-nhien',
                name: 'Nhang Trầm Tự Nhiên',
                price: 50000,
                stock_quantity: 10,
                status: 'active',
              },
            ],
            error: null,
          }),
        }),
      }),
    }))

    const result = await calculateStoreOrderPrice(mockSupabase, {
      items: [{ slug: 'nhang-tram-tu-nhien', quantity: 2 }],
      province: 'Hà Nội',
    })

    expect(result.subtotal).toBe(100000)
    expect(result.shippingFee).toBe(30000)
    expect(result.totalAmount).toBe(130000)
    expect(result.items[0]).toEqual({
      slug: 'nhang-tram-tu-nhien',
      productId: 'prod-1',
      name: 'Nhang Trầm Tự Nhiên',
      unitPrice: 50000,
      quantity: 2,
      lineTotal: 100000,
    })
  })

  test('applies free shipping (0 VND) for orders >= 500k', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'prod-1',
                slug: 'tinh-dau-tram',
                name: 'Tinh Dầu Trầm Cao Cấp',
                price: 600000,
                stock_quantity: 5,
                status: 'active',
              },
            ],
            error: null,
          }),
        }),
      }),
    }))

    const result = await calculateStoreOrderPrice(mockSupabase, {
      items: [{ slug: 'tinh-dau-tram', quantity: 1 }],
      province: 'TP. Hồ Chí Minh',
    })

    expect(result.subtotal).toBe(600000)
    expect(result.shippingFee).toBe(0) // Free shipping
    expect(result.totalAmount).toBe(600000)
  })

  test('throws PricingError if product does not exist or is inactive', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    }))

    await expect(
      calculateStoreOrderPrice(mockSupabase, {
        items: [{ slug: 'non-existent', quantity: 1 }],
        province: 'Đà Nẵng',
      })
    ).rejects.toThrow('Sản phẩm không tồn tại hoặc đã ngừng bán')
  })
})
