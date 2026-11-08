"use client"

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useRouter, Link } from '@/i18n/navigation'
import LocaleTabs from './LocaleTabs'
import { generateSlug } from '@/lib/utils/formatters'
import { compressImage } from '@/lib/imageProcessing'
import { PhotoUploader, type PhotoFile } from '@/components/admin/PhotoUploader'
import {
    createProduct,
    updateProduct,
    uploadProductImage,
    type ProductInput,
} from '@/actions/adminProducts'
import {
    PlusIcon,
    TrashIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline'

export interface ProductFormProps {
    initialData?: Partial<ProductInput> & { id?: string } | null
    categories: Array<{ id: string; name: string }>
    lots?: Array<{ id: string; name: string }>
}

interface SpecRow {
    id: string
    key: string
    value: string
}

export function ProductForm({ initialData, categories, lots = [] }: ProductFormProps) {
    const t = useTranslations('admin.translation')
    const router = useRouter()
    const isEdit = Boolean(initialData?.id)

    const initialTranslations = ((initialData as any)?.translations as Record<string, Record<string, unknown>>) || {}
    const [langTab, setLangTab] = useState<'vi' | 'en'>('vi')
    const [nameEn, setNameEn] = useState<string>((initialTranslations.en?.name as string) || '')
    const [descriptionEn, setDescriptionEn] = useState<string>((initialTranslations.en?.description as string) || '')

    // Form states
    const [name, setName] = useState(initialData?.name || '')
    const [slug, setSlug] = useState(initialData?.slug || '')
    const [isSlugTouched, setIsSlugTouched] = useState(Boolean(initialData?.slug))
    const [categoryId, setCategoryId] = useState(initialData?.category_id || (categories[0]?.id ?? ''))
    const [price, setPrice] = useState<string | number>(initialData?.price ?? '')
    const [compareAtPrice, setCompareAtPrice] = useState<string | number>(initialData?.compare_at_price ?? '')
    const [stockQuantity, setStockQuantity] = useState<string | number>(initialData?.stock_quantity ?? 0)
    const [sku, setSku] = useState(initialData?.sku || '')
    const [status, setStatus] = useState<ProductInput['status']>(initialData?.status || 'active')
    const [originType, setOriginType] = useState<ProductInput['origin_type']>(
        initialData?.origin_type || 'mature_partner_plantation'
    )
    const [description, setDescription] = useState(initialData?.description || '')
    const [isFeatured, setIsFeatured] = useState(Boolean(initialData?.is_featured))
    const [lotId, setLotId] = useState(initialData?.lot_id || '')
    const [batchCertificateUrl, setBatchCertificateUrl] = useState(initialData?.batch_certificate_url || '')

    // Images
    const [images, setImages] = useState<string[]>(initialData?.images || [])
    const [uploaderPhotos, setUploaderPhotos] = useState<PhotoFile[]>([])
    const [isUploadingImage, setIsUploadingImage] = useState(false)

    // Specifications
    const [specs, setSpecs] = useState<SpecRow[]>(() => {
        if (initialData?.specifications && typeof initialData.specifications === 'object') {
            return Object.entries(initialData.specifications).map(([key, value]) => ({
                id: Math.random().toString(36).slice(2),
                key,
                value: String(value),
            }))
        }
        return []
    })

    // Submission & error
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Auto-generate slug when name changes (unless user manually touched slug)
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value
        setName(newName)
        if (!isSlugTouched) {
            setSlug(generateSlug(newName))
        }
    }

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsSlugTouched(true)
        setSlug(e.target.value)
    }

    // Specifications rows
    const handleAddSpecRow = () => {
        setSpecs((prev) => [...prev, { id: Math.random().toString(36).slice(2), key: '', value: '' }])
    }

    const handleRemoveSpecRow = (id: string) => {
        setSpecs((prev) => prev.filter((row) => row.id !== id))
    }

    const handleSpecChange = (id: string, field: 'key' | 'value', value: string) => {
        setSpecs((prev) =>
            prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
        )
    }

    // Image upload handler
    const handlePhotosSelected = async (newPhotos: PhotoFile[]) => {
        setUploaderPhotos(newPhotos)
        setIsUploadingImage(true)
        setErrorMessage(null)

        try {
            for (const photo of newPhotos) {
                // Compress client-side
                let fileToUpload = photo.file
                try {
                    fileToUpload = await compressImage(photo.file)
                } catch {
                    // Fallback to original file if compression fails
                }

                const formData = new FormData()
                formData.append('file', fileToUpload)
                if (slug) {
                    formData.append('slug', slug)
                }

                const res = await uploadProductImage(formData)
                if (res.success && res.url) {
                    setImages((prev) => [...prev, res.url!])
                } else if (res.error) {
                    setErrorMessage(`Lỗi upload ảnh (${photo.file.name}): ${res.error}`)
                }
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'Lỗi khi upload ảnh')
        } finally {
            setIsUploadingImage(false)
            setUploaderPhotos([])
        }
    }

    const handleRemoveImage = (indexToRemove: number) => {
        setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove))
    }

    const handleSetCoverImage = (indexToCover: number) => {
        if (indexToCover === 0) return
        setImages((prev) => {
            const copy = [...prev]
            const [selected] = copy.splice(indexToCover, 1)
            return [selected, ...copy]
        })
    }

    // Submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMessage(null)
        setSuccessMessage(null)
        setIsSubmitting(true)

        // Clean specifications: omit empty keys
        const cleanedSpecs: Record<string, string> = {}
        for (const spec of specs) {
            const trimmedKey = spec.key.trim()
            if (trimmedKey) {
                cleanedSpecs[trimmedKey] = spec.value.trim()
            }
        }

        const existingTranslations = ((initialData as any)?.translations as Record<string, Record<string, unknown>>) || {}
        const enObj: Record<string, string> = {
            ...((existingTranslations.en as Record<string, string>) || {}),
        }
        if (nameEn.trim()) {
            enObj.name = nameEn.trim()
        } else {
            delete enObj.name
        }
        if (descriptionEn.trim()) {
            enObj.description = descriptionEn.trim()
        } else {
            delete enObj.description
        }

        const translationsPayload: Record<string, unknown> = {
            ...existingTranslations,
            vi: {
                ...((existingTranslations.vi as Record<string, unknown>) || {}),
                name: name.trim(),
                description: description.trim() || null,
            },
        }
        if (Object.keys(enObj).length > 0) {
            translationsPayload.en = enObj
        } else {
            delete translationsPayload.en
        }

        const payload: ProductInput = {
            name: name.trim(),
            slug: slug.trim(),
            category_id: categoryId,
            price: Number(price),
            compare_at_price: compareAtPrice !== '' && compareAtPrice !== null ? Number(compareAtPrice) : null,
            stock_quantity: stockQuantity !== '' && stockQuantity !== null ? Number(stockQuantity) : 0,
            sku: sku.trim() || null,
            status,
            origin_type: originType,
            images,
            specifications: cleanedSpecs,
            description: description.trim() || null,
            is_featured: isFeatured,
            lot_id: lotId.trim() || null,
            batch_certificate_url: batchCertificateUrl.trim() || null,
            translations: translationsPayload,
        }

        try {
            const res = isEdit && initialData?.id
                ? await updateProduct(initialData.id, payload)
                : await createProduct(payload)

            if (!res.success) {
                setErrorMessage(res.error || 'Đã có lỗi xảy ra')
                setIsSubmitting(false)
                return
            }

            setSuccessMessage(isEdit ? 'Cập nhật sản phẩm thành công!' : 'Tạo sản phẩm thành công!')
            router.push('/crm/admin/products')
            router.refresh()
        } catch (err: any) {
            setErrorMessage(err.message || 'Lỗi kết nối')
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
            {/* Error / Success Alerts */}
            {errorMessage && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800">
                    <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                    <div>
                        <p className="font-medium text-sm">Có lỗi xảy ra</p>
                        <p className="text-sm mt-0.5">{errorMessage}</p>
                    </div>
                </div>
            )}

            {successMessage && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3 text-green-800">
                    <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
                    <p className="font-medium text-sm">{successMessage}</p>
                </div>
            )}

            {/* Thông tin cơ bản */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
                <h3 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center justify-between">
                    <span>Thông tin cơ bản</span>
                    <LocaleTabs
                        activeTab={langTab}
                        onChange={setLangTab}
                        hasEnContent={Boolean(nameEn.trim() || descriptionEn.trim())}
                        variant="pills"
                    />
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tên sản phẩm */}
                    {langTab === 'vi' ? (
                        <div className="md:col-span-2">
                            <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 mb-1">
                                Tên sản phẩm (Tiếng Việt) <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="product-name"
                                type="text"
                                required
                                value={name}
                                onChange={handleNameChange}
                                placeholder="Ví dụ: Trà Hoa Vàng Ba Vì"
                                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            />
                        </div>
                    ) : (
                        <div className="md:col-span-2">
                            <label htmlFor="product-name-en" className="block text-sm font-medium text-gray-700 mb-1">
                                {t('fieldName')}
                            </label>
                            <input
                                id="product-name-en"
                                type="text"
                                value={nameEn}
                                onChange={(e) => setNameEn(e.target.value)}
                                placeholder="e.g. Ba Vi Golden Camellia Tea"
                                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            />
                        </div>
                    )}

                    {/* Slug */}
                    <div className="md:col-span-2">
                        <label htmlFor="product-slug" className="block text-sm font-medium text-gray-700 mb-1">
                            Slug (Đường dẫn tĩnh) <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm hidden sm:inline">/store/</span>
                            <input
                                id="product-slug"
                                type="text"
                                required
                                value={slug}
                                onChange={handleSlugChange}
                                placeholder="tra-hoa-vang-ba-vi"
                                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-mono"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Chỉ chấp nhận chữ thường, số và dấu gạch ngang (ví dụ: san-pham-1). Tự động tạo theo tên sản phẩm.
                        </p>
                    </div>

                    {/* Danh mục */}
                    <div>
                        <label htmlFor="product-category" className="block text-sm font-medium text-gray-700 mb-1">
                            Danh mục <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="product-category"
                            required
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white"
                        >
                            <option value="" disabled>-- Chọn danh mục --</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* SKU */}
                    <div>
                        <label htmlFor="product-sku" className="block text-sm font-medium text-gray-700 mb-1">
                            Mã SKU (Mã quản lý kho)
                        </label>
                        <input
                            id="product-sku"
                            type="text"
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                            placeholder="THV-001"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-mono"
                        />
                    </div>

                    {/* Nguồn gốc */}
                    <div>
                        <label htmlFor="product-origin" className="block text-sm font-medium text-gray-700 mb-1">
                            Nguồn gốc
                        </label>
                        <select
                            id="product-origin"
                            value={originType}
                            onChange={(e) => setOriginType(e.target.value as any)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white"
                        >
                            <option value="mature_partner_plantation">Rừng đối tác trưởng thành</option>
                            <option value="cooperative_farm">Nông trại HTX liên kết</option>
                            <option value="dainganxanh_harvest">Thu hoạch Đại Ngàn Xanh</option>
                        </select>
                    </div>

                    {/* Trạng thái */}
                    <div>
                        <label htmlFor="product-status" className="block text-sm font-medium text-gray-700 mb-1">
                            Trạng thái
                        </label>
                        <select
                            id="product-status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white"
                        >
                            <option value="active">Đang bán</option>
                            <option value="inactive">Tạm ẩn</option>
                            <option value="out_of_stock">Hết hàng</option>
                        </select>
                    </div>
                </div>

                {/* Sản phẩm nổi bật checkbox */}
                <div className="pt-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isFeatured}
                            onChange={(e) => setIsFeatured(e.target.checked)}
                            className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Sản phẩm nổi bật</span>
                    </label>
                </div>
            </div>

            {/* Giá & Tồn kho */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
                <h3 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
                    Giá & Tồn kho
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Giá bán */}
                    <div>
                        <label htmlFor="product-price" className="block text-sm font-medium text-gray-700 mb-1">
                            Giá bán (VNĐ) <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="product-price"
                            type="number"
                            required
                            min="1"
                            step="1"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="250000"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        />
                    </div>

                    {/* Giá so sánh */}
                    <div>
                        <label htmlFor="product-compare-price" className="block text-sm font-medium text-gray-700 mb-1">
                            Giá so sánh / Giá gốc (VNĐ)
                        </label>
                        <input
                            id="product-compare-price"
                            type="number"
                            min="1"
                            step="1"
                            value={compareAtPrice}
                            onChange={(e) => setCompareAtPrice(e.target.value)}
                            placeholder="300000"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Để trống nếu không có giá khuyến mãi</p>
                    </div>

                    {/* Tồn kho */}
                    <div>
                        <label htmlFor="product-stock" className="block text-sm font-medium text-gray-700 mb-1">
                            Tồn kho <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="product-stock"
                            type="number"
                            required
                            min="0"
                            step="1"
                            value={stockQuantity}
                            onChange={(e) => setStockQuantity(e.target.value)}
                            placeholder="50"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Hình ảnh */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">Hình ảnh</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Ảnh đầu tiên sẽ là ảnh đại diện. Kéo hoặc chọn ảnh định dạng JPG, PNG, WebP (tối đa 5MB).
                        </p>
                    </div>
                    {images.length > 0 && (
                        <span className="text-xs font-medium text-gray-500">
                            Đã có {images.length} ảnh
                        </span>
                    )}
                </div>

                {/* Image List Preview */}
                {images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {images.map((imgUrl, idx) => (
                            <div
                                key={imgUrl}
                                className={`group relative aspect-square rounded-lg border overflow-hidden bg-gray-50 ${
                                    idx === 0 ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-200'
                                }`}
                            >
                                <Image
                                    src={imgUrl}
                                    alt={`Ảnh ${idx + 1}`}
                                    fill
                                    sizes="120px"
                                    className="object-cover"
                                />

                                {/* Cover indicator */}
                                {idx === 0 && (
                                    <span className="absolute top-1.5 left-1.5 bg-green-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow">
                                        Ảnh chính
                                    </span>
                                )}

                                {/* Action overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                                    {idx > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => handleSetCoverImage(idx)}
                                            className="px-2 py-1 bg-white/90 hover:bg-white text-gray-800 rounded text-[11px] font-medium shadow"
                                            title="Đặt làm ảnh chính"
                                        >
                                            Đặt làm chính
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(idx)}
                                        className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded shadow"
                                        title="Xóa ảnh"
                                        aria-label={`Xóa ảnh ${idx + 1}`}
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* PhotoUploader */}
                <div className="mt-4">
                    {images.length < 10 && (
                        <PhotoUploader
                            photos={uploaderPhotos}
                            onPhotosSelected={handlePhotosSelected}
                            onPhotoRemove={() => {}}
                            disabled={isUploadingImage || isSubmitting}
                            maxFiles={10 - images.length}
                        />
                    )}

                    {isUploadingImage && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-green-700">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent" />
                            <span>Đang nén WebP và tải ảnh lên hệ thống...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Thông số kỹ thuật */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">Thông số kỹ thuật</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Các cặp thông tin như Khối lượng, Xuất xứ, Hạn sử dụng, Tiêu chuẩn chất lượng...
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleAddSpecRow}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                    >
                        <PlusIcon className="w-3.5 h-3.5" />
                        Thêm thông số
                    </button>
                </div>

                {specs.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-2">
                        Chưa có thông số kỹ thuật nào. Bấm &quot;Thêm thông số&quot; để bổ sung.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {specs.map((row, index) => (
                            <div key={row.id} className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={row.key}
                                    onChange={(e) => handleSpecChange(row.id, 'key', e.target.value)}
                                    placeholder="Tên thông số (ví dụ: Khối lượng)"
                                    aria-label={`Tên thông số ${index + 1}`}
                                    className="flex-1 px-3.5 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                />
                                <input
                                    type="text"
                                    value={row.value}
                                    onChange={(e) => handleSpecChange(row.id, 'value', e.target.value)}
                                    placeholder="Giá trị (ví dụ: 500g)"
                                    aria-label={`Giá trị thông số ${index + 1}`}
                                    className="flex-1 px-3.5 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSpecRow(row.id)}
                                    aria-label={`Xóa thông số ${index + 1}`}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Xóa thông số"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Mô tả & Thông tin liên kết */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
                <h3 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
                    Mô tả & Chứng thực
                </h3>

                {langTab === 'vi' ? (
                    <div>
                        <label htmlFor="product-description" className="block text-sm font-medium text-gray-700 mb-1">
                            Mô tả chi tiết sản phẩm (Tiếng Việt)
                        </label>
                        <textarea
                            id="product-description"
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Mô tả công dụng, hương vị, hướng dẫn sử dụng sản phẩm..."
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        />
                    </div>
                ) : (
                    <div>
                        <label htmlFor="product-description-en" className="block text-sm font-medium text-gray-700 mb-1">
                            {t('fieldDescription')}
                        </label>
                        <textarea
                            id="product-description-en"
                            rows={4}
                            value={descriptionEn}
                            onChange={(e) => setDescriptionEn(e.target.value)}
                            placeholder="Product details, aroma notes, instructions in English..."
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Lô cây liên kết */}
                    <div>
                        <label htmlFor="product-lot" className="block text-sm font-medium text-gray-700 mb-1">
                            Lô cây liên kết (Tùy chọn)
                        </label>
                        <select
                            id="product-lot"
                            value={lotId}
                            onChange={(e) => setLotId(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white"
                        >
                            <option value="">-- Không liên kết --</option>
                            {lots.map((lot) => (
                                <option key={lot.id} value={lot.id}>
                                    {lot.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Chứng nhận lô / Batch certificate URL */}
                    <div>
                        <label htmlFor="product-certificate" className="block text-sm font-medium text-gray-700 mb-1">
                            Đường dẫn chứng nhận lô (Tùy chọn)
                        </label>
                        <input
                            id="product-certificate"
                            type="url"
                            value={batchCertificateUrl}
                            onChange={(e) => setBatchCertificateUrl(e.target.value)}
                            placeholder="https://example.com/certificate.pdf"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <Link
                    href="/crm/admin/products"
                    className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                    Hủy
                </Link>
                <button
                    type="submit"
                    disabled={isSubmitting || isUploadingImage}
                    className="px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSubmitting && (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    )}
                    {isEdit ? 'Cập nhật sản phẩm' : 'Lưu sản phẩm'}
                </button>
            </div>
        </form>
    )
}
