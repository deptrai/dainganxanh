"use client"

import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { formatVND } from '@/lib/utils/formatters'
import {
    PencilSquareIcon,
    ArrowTopRightOnSquareIcon,
    ShoppingBagIcon,
    PlusIcon,
} from '@heroicons/react/24/outline'
import { TranslationBadge } from '@/components/admin/TranslationBadge'
import { hasEnTranslation } from '@/lib/translations'

export interface AdminProductRow {
    id: string
    name: string
    slug: string
    category_id: string
    price: number
    compare_at_price?: number | null
    stock_quantity: number
    sku?: string | null
    status: 'active' | 'inactive' | 'out_of_stock' | string
    origin_type?: 'mature_partner_plantation' | 'cooperative_farm' | 'dainganxanh_harvest' | string | null
    images?: string[] | null
    is_featured?: boolean | null
    translations?: Record<string, unknown> | null
    created_at?: string
    product_categories?: {
        name: string
    } | {
        name: string
    }[] | null
}

interface AdminProductsTableProps {
    products: AdminProductRow[]
}

const statusConfig: Record<string, { label: string; className: string }> = {
    active: {
        label: 'Đang bán',
        className: 'bg-green-100 text-green-800 border-green-200',
    },
    inactive: {
        label: 'Tạm ẩn',
        className: 'bg-gray-100 text-gray-700 border-gray-200',
    },
    out_of_stock: {
        label: 'Hết hàng',
        className: 'bg-amber-100 text-amber-800 border-amber-200',
    },
}

export default function AdminProductsTable({ products }: AdminProductsTableProps) {
    if (!products || products.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-4">
                    <ShoppingBagIcon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Chưa có sản phẩm nào</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                    Bắt đầu mở rộng cửa hàng bằng cách thêm sản phẩm đầu tiên của bạn vào hệ thống.
                </p>
                <Link
                    href="/crm/admin/products/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    <PlusIcon className="w-4 h-4" />
                    Thêm sản phẩm mới
                </Link>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <th className="py-3.5 px-4">Sản phẩm</th>
                            <th className="py-3.5 px-4">SKU</th>
                            <th className="py-3.5 px-4">Danh mục</th>
                            <th className="py-3.5 px-4 text-right">Giá bán</th>
                            <th className="py-3.5 px-4 text-center">Tồn kho</th>
                            <th className="py-3.5 px-4 text-center">Trạng thái</th>
                            <th className="py-3.5 px-4 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {products.map((product) => {
                            const categoryName = (Array.isArray(product.product_categories)
                                ? product.product_categories[0]?.name
                                : product.product_categories?.name) || 'Chưa phân loại'

                            const coverImage = product.images && product.images.length > 0 ? product.images[0] : null
                            const statusInfo = statusConfig[product.status] || {
                                label: product.status,
                                className: 'bg-gray-100 text-gray-700 border-gray-200',
                            }

                            return (
                                <tr key={product.id} className="hover:bg-gray-50/80 transition-colors">
                                    {/* Sản phẩm */}
                                    <td className="py-3.5 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 relative">
                                                {coverImage ? (
                                                    <Image
                                                        src={coverImage}
                                                        alt={product.name}
                                                        fill
                                                        sizes="48px"
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <ShoppingBagIcon className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900 truncate">
                                                        {product.name}
                                                    </span>
                                                    <TranslationBadge hasEn={hasEnTranslation(product)} />
                                                    {product.is_featured && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                                                            Nổi bật
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 truncate">{product.slug}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* SKU */}
                                    <td className="py-3.5 px-4 text-gray-600 font-mono text-xs">
                                        {product.sku || '—'}
                                    </td>

                                    {/* Danh mục */}
                                    <td className="py-3.5 px-4 text-gray-600">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">
                                            {categoryName}
                                        </span>
                                    </td>

                                    {/* Giá bán */}
                                    <td className="py-3.5 px-4 text-right">
                                        <div className="font-medium text-gray-900">{formatVND(product.price)}</div>
                                        {product.compare_at_price && (
                                            <div className="text-xs text-gray-400 line-through">
                                                {formatVND(product.compare_at_price)}
                                            </div>
                                        )}
                                    </td>

                                    {/* Tồn kho */}
                                    <td className="py-3.5 px-4 text-center">
                                        <span
                                            className={`font-medium ${
                                                product.stock_quantity === 0
                                                    ? 'text-red-600'
                                                    : product.stock_quantity < 10
                                                    ? 'text-amber-600'
                                                    : 'text-gray-900'
                                            }`}
                                        >
                                            {product.stock_quantity}
                                        </span>
                                    </td>

                                    {/* Trạng thái */}
                                    <td className="py-3.5 px-4 text-center">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.className}`}
                                        >
                                            {statusInfo.label}
                                        </span>
                                    </td>

                                    {/* Thao tác */}
                                    <td className="py-3.5 px-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/store/${product.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                                title="Xem ngoài cửa hàng"
                                            >
                                                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                            </Link>
                                            <Link
                                                href={`/crm/admin/products/${product.id}/edit`}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                                            >
                                                <PencilSquareIcon className="w-3.5 h-3.5" />
                                                Sửa
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
