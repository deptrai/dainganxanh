import type { Metadata } from 'next'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { StoreCheckoutClient } from '@/components/store/StoreCheckoutClient'

export const metadata: Metadata = {
  title: 'Thanh toán — Cửa Hàng Trầm Hương',
  description: 'Hoàn tất đơn hàng sản phẩm trầm hương.',
}

export default async function StoreCheckoutPage({ searchParams }: { searchParams: Promise<{ slug?: string; quantity?: string }> }) {
  const { slug, quantity } = await searchParams
  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Không tìm thấy sản phẩm. Vui lòng chọn sản phẩm từ cửa hàng.</p>
      </div>
    )
  }

  const qty = Math.max(1, Math.min(parseInt(quantity || '1', 10) || 1, 10))
  const supabase = createServiceRoleClient()

  const { data: product } = await supabase
    .from('products')
    .select('id, name, slug, price, stock_quantity, images')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Sản phẩm không tồn tại.</p>
      </div>
    )
  }

  if (product.stock_quantity < qty) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Sản phẩm không đủ tồn kho ({product.stock_quantity} còn lại, bạn yêu cầu {qty}).</p>
      </div>
    )
  }

  return (
    <StoreCheckoutClient
      product={product}
      quantity={qty}
    />
  )
}
