import { SupabaseClient } from '@supabase/supabase-js'
import {
  CalculateStoreOrderPriceParams,
  PricingError,
  StoreOrderPriceItem,
  StoreOrderPriceResult,
} from './types'

export const FREE_SHIPPING_THRESHOLD = 500000
export const STANDARD_SHIPPING_FEE = 30000

export async function calculateStoreOrderPrice(
  supabase: SupabaseClient,
  params: CalculateStoreOrderPriceParams
): Promise<StoreOrderPriceResult> {
  const { items } = params

  if (!items || items.length === 0) {
    throw new PricingError('Giỏ hàng không có sản phẩm')
  }

  for (const item of items) {
    if (!item.quantity || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      throw new PricingError('Số lượng sản phẩm không hợp lệ')
    }
  }

  const slugs = Array.from(new Set(items.map((i) => i.slug)))

  // 1. Fetch active products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, slug, name, price, stock_quantity, status')
    .in('slug', slugs)
    .eq('status', 'active')

  if (error || !products) {
    throw new PricingError('Không thể lấy thông tin sản phẩm', 500)
  }

  const productMap = new Map(products.map((p) => [p.slug, p]))

  // 2. Validate all items exist
  const pricedItems: StoreOrderPriceItem[] = []
  let subtotal = 0

  for (const item of items) {
    const product = productMap.get(item.slug)
    if (!product) {
      throw new PricingError('Sản phẩm không tồn tại hoặc đã ngừng bán', 404)
    }

    const unitPrice = Number(product.price)
    const lineTotal = unitPrice * item.quantity
    subtotal += lineTotal

    pricedItems.push({
      slug: product.slug,
      productId: product.id,
      name: product.name,
      unitPrice,
      quantity: item.quantity,
      lineTotal,
    })
  }

  // 3. Shipping fee calculation
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE
  const totalAmount = subtotal + shippingFee

  return {
    items: pricedItems,
    subtotal,
    shippingFee,
    totalAmount,
  }
}
