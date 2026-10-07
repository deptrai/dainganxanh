'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Minus, Plus, Truck, Shield, ArrowLeft, Loader2 } from 'lucide-react'
import { originLabel, type ProductOriginType } from './originLabels'

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  compare_at_price: number | null
  stock_quantity: number
  sku: string | null
  images: string[] | null
  specifications?: Record<string, string> | null
  origin_type: ProductOriginType
  batch_certificate_url?: string | null
  product_categories?: { id?: string; name: string; slug?: string } | null
  lots?: { id?: string; name: string; region: string } | null
}

export interface RelatedProduct {
  id: string
  name: string
  slug: string
  price: number
  compare_at_price?: number | null
  stock_quantity?: number
  images?: string[] | null
  product_categories?: { name: string } | { name: string }[] | null
}

function formatPrice(amount: number) {
  return amount.toLocaleString('vi-VN') + 'đ'
}

export function ProductDetailClient({ product, related = [] }: { product: Product; related?: RelatedProduct[] }) {
  const router = useRouter()
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(product.images?.[0])
  const [buying, setBuying] = useState(false)

  useEffect(() => {
    setActiveImage(product.images?.[0])
    setQty(1)
    setBuying(false)
  }, [product.id])

  const outOfStock = product.stock_quantity <= 0
  const maxQty = Math.max(1, Math.min(product.stock_quantity, 10))

  const handleBuyNow = () => {
    if (outOfStock || buying || qty < 1) return
    setBuying(true)
    router.push(`/store/checkout?slug=${encodeURIComponent(product.slug)}&quantity=${qty}`)
    // ponytail: nếu điều hướng fail hoặc user quay lại qua bfcache, reset sau 5s
    setTimeout(() => setBuying(false), 5000)
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="container mx-auto px-4 py-4">
        <Link
          href="/store"
          className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại cửa hàng</span>
        </Link>
      </nav>

      <main className="container mx-auto px-4 pb-16">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Images */}
            <div className="p-6 bg-gradient-to-br from-amber-50/50 to-orange-50/30">
              <div className="aspect-square rounded-xl overflow-hidden bg-white border border-stone-100 mb-4">
                {activeImage ? (
                  <img src={activeImage} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl" aria-hidden="true">🌿</div>
                )}
              </div>
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(img)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 ${
                        activeImage === img ? 'border-emerald-600' : 'border-stone-200'
                      }`}
                      aria-label={`Ảnh ${i + 1}`}
                      aria-current={activeImage === img ? 'true' : undefined}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-6 md:p-10 flex flex-col">
              {product.product_categories && (
                <span className="text-sm text-emerald-700 font-medium mb-2">
                  {product.product_categories.name}
                </span>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>

              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-bold text-emerald-700">{formatPrice(product.price)}</span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <span className="text-lg text-gray-400 line-through">{formatPrice(product.compare_at_price)}</span>
                )}
              </div>

              {originLabel(product.origin_type) && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>{originLabel(product.origin_type)}</span>
                </div>
              )}

              {product.lots && (
                <p className="text-sm text-gray-500 mb-4">
                  Xuất xứ: <span className="text-gray-700">{product.lots.name} — {product.lots.region}</span>
                </p>
              )}

              <p className="text-gray-700 leading-relaxed mb-6">{product.description}</p>

              {product.sku && (
                <p className="text-xs text-gray-400 mb-4">SKU: {product.sku}</p>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-gray-700 font-medium">Số lượng:</span>
                <div className="flex items-center border border-stone-300 rounded-lg bg-white">
                  <button
                    type="button"
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    disabled={outOfStock || buying || qty <= 1}
                    className="p-2 hover:bg-stone-100 disabled:opacity-40"
                    aria-label="Giảm số lượng"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-semibold" aria-live="polite">{outOfStock ? 0 : qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                    disabled={outOfStock || buying || qty >= maxQty}
                    className="p-2 hover:bg-stone-100 disabled:opacity-40"
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className={`text-sm ${outOfStock ? 'text-red-600' : 'text-gray-500'}`}>
                  {outOfStock ? 'Hết hàng' : `Còn ${product.stock_quantity} sản phẩm`}
                </span>
              </div>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={outOfStock || buying}
                className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 text-white font-bold rounded-xl text-lg transition-colors flex items-center justify-center gap-2"
              >
                {buying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang chuyển đến thanh toán...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    {outOfStock ? 'Hết hàng' : 'Mua ngay'}
                  </>
                )}
              </button>

              <div className="mt-6 p-4 bg-stone-100 rounded-xl text-sm text-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4" />
                  <span className="font-medium">Giao hàng toàn quốc</span>
                </div>
                <p>Hỗ trợ thanh toán chuyển khoản hoặc COD. Đơn hàng sẽ được xử lý trong 24h làm việc.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        {product.specifications &&
        typeof product.specifications === 'object' &&
        !Array.isArray(product.specifications) &&
        Object.keys(product.specifications).length > 0 ? (
          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Thông số kỹ thuật</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {Object.entries(product.specifications).map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-stone-100 pb-2">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-gray-900">
                    {v == null ? '—' : Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Related */}
        {related && related.length > 0 ? (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={`/store/${p.slug}`}
                  className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-md transition-shadow"
                  prefetch={false}
                >
                  <div className="aspect-square bg-stone-100 flex items-center justify-center">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl" aria-hidden="true">🌿</span>
                    )}
                  </div>
                  <div className="p-3">
                    {(() => {
                      const cat = Array.isArray(p.product_categories) ? p.product_categories[0] : p.product_categories
                      return cat?.name ? <p className="text-xs text-gray-400 mb-1">{cat.name}</p> : null
                    })()}
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{p.name}</h3>
                    <p className="text-emerald-700 font-bold mt-1">{formatPrice(p.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
