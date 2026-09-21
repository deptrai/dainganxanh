'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ShoppingBag, Star, Search } from 'lucide-react'

interface Category {
    id: string
    name: string
    slug: string
}

interface Product {
    id: string
    name: string
    slug: string
    price: number
    compare_at_price: number | null
    stock_quantity: number
    images: string[]
    is_featured: boolean
    status: string
    product_categories: { name: string; slug: string } | null
}

function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                active
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-emerald-50 hover:border-emerald-300'
            }`}
        >
            {label}
        </button>
    )
}

function ProductCard({ product }: { product: Product }) {
    const outOfStock = product.stock_quantity === 0
    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <Link href={`/store/${product.slug}`}>
                <div className="relative aspect-square bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
                    {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-4xl">🌿</span>
                    )}
                    {product.is_featured && (
                        <span className="absolute top-2 left-2 bg-amber-400 text-amber-900 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" /> Nổi bật
                        </span>
                    )}
                    {outOfStock && (
                        <span className="absolute top-2 right-2 bg-gray-800/70 text-white text-xs px-2 py-0.5 rounded-full">
                            Hết hàng
                        </span>
                    )}
                </div>
            </Link>
            <div className="p-3">
                {product.product_categories && (
                    <p className="text-xs text-gray-400 mb-1">{product.product_categories.name}</p>
                )}
                <Link href={`/store/${product.slug}`}>
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-emerald-700 transition-colors">
                        {product.name}
                    </h3>
                </Link>
                <div className="mt-2">
                    <span className="text-base font-bold text-emerald-600">
                        {product.price.toLocaleString('vi-VN')}đ
                    </span>
                    {product.compare_at_price && (
                        <span className="text-xs text-gray-400 line-through ml-1.5">
                            {product.compare_at_price.toLocaleString('vi-VN')}đ
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

export function StoreClient({ categories, products }: { categories: Category[]; products: Product[] }) {
    const [activeSlug, setActiveSlug] = useState<string | null>(null)
    const [search, setSearch] = useState('')

    const filtered = useMemo(() => {
        return products.filter((p) => {
            const matchesCategory = activeSlug ? p.product_categories?.slug === activeSlug : true
            const query = search.trim().toLowerCase()
            const matchesSearch = !query
                ? true
                : p.name.toLowerCase().includes(query)
                    || p.product_categories?.name?.toLowerCase().includes(query)
            return matchesCategory && matchesSearch
        })
    }, [products, activeSlug, search])

    const featured = products.filter((p) => p.is_featured)

    return (
        <>
            {/* Hero */}
            <section className="bg-gradient-to-br from-[#3D2A10] to-[#1A3320] text-white py-16 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-200 text-sm mb-4">
                        ✨ Từ Rừng Trầm Đại Ngàn
                    </span>
                    <h1 className="font-serif text-3xl md:text-5xl font-bold mb-4">
                        Sản Phẩm Trầm Hương Thuần Việt
                    </h1>
                    <p className="text-white/70 text-lg max-w-xl mx-auto">
                        Tinh hoa trầm hương Dó Đen từ vườn cây do bạn góp phần tạo nên
                    </p>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 py-10">
                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm kiếm theo tên, mô tả hoặc danh mục sản phẩm..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>

                {/* Category filter */}
                {categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                        <FilterBtn label="Tất cả" active={!activeSlug} onClick={() => setActiveSlug(null)} />
                        {categories.map((c) => (
                            <FilterBtn key={c.id} label={c.name} active={activeSlug === c.slug} onClick={() => setActiveSlug(c.slug)} />
                        ))}
                    </div>
                )}

                {/* Featured (only on All tab and no search) */}
                {!activeSlug && !search.trim() && featured.length > 0 && (
                    <section className="mb-10">
                        <h2 className="font-serif text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Star className="w-6 h-6 text-amber-400 fill-current" /> Sản Phẩm Nổi Bật
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {featured.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
                        </div>
                    </section>
                )}

                {/* All products */}
                <section>
                    {!activeSlug && !search.trim() && featured.length > 0 && (
                        <h2 className="font-serif text-2xl font-bold text-gray-900 mb-4">Tất Cả Sản Phẩm</h2>
                    )}

                    {filtered.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Chưa có sản phẩm nào phù hợp.</p>
                            {search.trim() && (
                                <p className="text-sm mt-1">Thử từ khóa khác hoặc xóa bộ lọc tìm kiếm.</p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
                        </div>
                    )}
                </section>
            </div>
        </>
    )
}
