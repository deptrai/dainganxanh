export class PricingError extends Error {
  statusCode: number
  constructor(message: string, statusCode = 400) {
    super(message)
    this.name = 'PricingError'
    this.statusCode = statusCode
  }
}

export interface BookingPriceItem {
  date: string // YYYY-MM-DD
  price: number
  isCustomRule: boolean
}

export interface BookingPriceResult {
  roomId: string
  roomName: string
  nights: number
  basePricePerNight: number
  nightBreakdown: BookingPriceItem[]
  totalAmount: number
}

export interface CalculateBookingPriceParams {
  roomId: string
  checkInDate: string
  checkOutDate: string
  guestsCount?: number
}

export interface StoreOrderItemInput {
  slug: string
  quantity: number
}

export interface StoreOrderPriceItem {
  slug: string
  productId: string
  name: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface StoreOrderPriceResult {
  items: StoreOrderPriceItem[]
  subtotal: number
  shippingFee: number
  totalAmount: number
}

export interface CalculateStoreOrderPriceParams {
  items: StoreOrderItemInput[]
  province?: string
}
