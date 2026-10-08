'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ProductInput {
    name: string
    slug: string
    category_id: string
    price: number
    compare_at_price?: number | null
    stock_quantity?: number
    sku?: string | null
    status?: 'active' | 'inactive' | 'out_of_stock'
    origin_type?: 'mature_partner_plantation' | 'cooperative_farm' | 'dainganxanh_harvest'
    images?: string[]
    specifications?: Record<string, string>
    description?: string | null
    is_featured?: boolean
    lot_id?: string | null
    batch_certificate_url?: string | null
}

export type ProductActionResult = {
    success: boolean
    id?: string
    error?: string
}

export type UploadProductImageResult = {
    success: boolean
    url?: string
    error?: string
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ALLOWED_STATUSES = ['active', 'inactive', 'out_of_stock']
const ALLOWED_ORIGIN_TYPES = ['mature_partner_plantation', 'cooperative_farm', 'dainganxanh_harvest']
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function verifyAdmin() {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    let role: string | undefined
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role) {
        role = profile.role
    } else {
        try {
            const serviceSupabase = createServiceRoleClient()
            const { data: serviceProfile } = await serviceSupabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single()
            role = serviceProfile?.role
        } catch {
            // ignore
        }
    }

    if (!role || !['admin', 'super_admin'].includes(role)) {
        throw new Error('Forbidden')
    }

    return { supabase, user }
}

function parseInput(input: FormData | Partial<ProductInput>): Partial<ProductInput> {
    if (input instanceof FormData) {
        const rawPrice = input.get('price')
        const rawCompare = input.get('compare_at_price')
        const rawStock = input.get('stock_quantity')
        const rawImages = input.get('images')
        const rawSpecs = input.get('specifications')
        const rawIsFeatured = input.get('is_featured')

        let images: string[] = []
        if (typeof rawImages === 'string' && rawImages.trim()) {
            try {
                const parsed = JSON.parse(rawImages)
                if (Array.isArray(parsed)) images = parsed
            } catch {
                images = [rawImages.trim()]
            }
        } else {
            const allImages = input.getAll('images')
            if (allImages.length > 0) {
                images = allImages.filter((x): x is string => typeof x === 'string')
            }
        }

        let specifications: Record<string, string> = {}
        if (typeof rawSpecs === 'string' && rawSpecs.trim()) {
            try {
                const parsed = JSON.parse(rawSpecs)
                if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                    specifications = parsed
                }
            } catch {
                specifications = {}
            }
        }

        return {
            name: (input.get('name') as string) ?? '',
            slug: (input.get('slug') as string) ?? '',
            category_id: (input.get('category_id') as string) ?? '',
            price: rawPrice !== null && rawPrice !== '' ? Number(rawPrice) : NaN,
            compare_at_price: rawCompare !== null && rawCompare !== '' ? Number(rawCompare) : null,
            stock_quantity: rawStock !== null && rawStock !== '' ? Number(rawStock) : 0,
            sku: (input.get('sku') as string) ?? null,
            status: (input.get('status') as any) || 'active',
            origin_type: (input.get('origin_type') as any) || 'mature_partner_plantation',
            images,
            specifications,
            description: (input.get('description') as string) ?? null,
            is_featured: rawIsFeatured === 'true' || rawIsFeatured === '1' || rawIsFeatured === 'on',
            lot_id: (input.get('lot_id') as string) ?? null,
            batch_certificate_url: (input.get('batch_certificate_url') as string) ?? null,
        }
    }

    return input ?? {}
}

export async function createProduct(rawInput: FormData | Partial<ProductInput>): Promise<ProductActionResult> {
    try {
        await verifyAdmin()
    } catch (authError: any) {
        return { success: false, error: authError.message || 'Unauthorized' }
    }

    const input = parseInput(rawInput)

    const name = input.name?.trim()
    if (!name) {
        return { success: false, error: 'Tên sản phẩm không được để trống' }
    }

    const slug = input.slug?.trim()
    if (!slug) {
        return { success: false, error: 'Slug không được để trống' }
    }

    if (!SLUG_REGEX.test(slug)) {
        return { success: false, error: 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang' }
    }

    const category_id = input.category_id?.trim()
    if (!category_id) {
        return { success: false, error: 'Danh mục sản phẩm không được để trống' }
    }

    const serviceSupabase = createServiceRoleClient()

    // Check category exists
    const { data: category, error: catError } = await serviceSupabase
        .from('product_categories')
        .select('id')
        .eq('id', category_id)
        .maybeSingle()

    if (catError || !category) {
        return { success: false, error: 'Danh mục sản phẩm không tồn tại' }
    }

    // Check slug uniqueness
    const { data: existingProduct } = await serviceSupabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

    if (existingProduct) {
        return { success: false, error: 'Slug đã tồn tại, vui lòng chọn slug khác' }
    }

    // Validate price
    const price = typeof input.price === 'string' ? Number(input.price) : input.price
    if (typeof price !== 'number' || isNaN(price) || !Number.isInteger(price) || price <= 0) {
        return { success: false, error: 'Giá sản phẩm phải là số nguyên dương' }
    }

    // Validate compare_at_price
    let compare_at_price: number | null = null
    if (input.compare_at_price !== undefined && input.compare_at_price !== null && input.compare_at_price !== ('' as any)) {
        const cap = typeof input.compare_at_price === 'string' ? Number(input.compare_at_price) : input.compare_at_price
        if (typeof cap !== 'number' || isNaN(cap) || !Number.isInteger(cap) || cap <= 0) {
            return { success: false, error: 'Giá so sánh phải là số nguyên dương' }
        }
        if (cap <= price) {
            return { success: false, error: 'Giá so sánh phải lớn hơn giá bán' }
        }
        compare_at_price = cap
    }

    // Validate stock_quantity
    let stock_quantity = 0
    if (input.stock_quantity !== undefined && input.stock_quantity !== null && input.stock_quantity !== ('' as any)) {
        const sq = typeof input.stock_quantity === 'string' ? Number(input.stock_quantity) : input.stock_quantity
        if (typeof sq !== 'number' || isNaN(sq) || !Number.isInteger(sq) || sq < 0) {
            return { success: false, error: 'Số lượng tồn kho phải là số nguyên không âm' }
        }
        stock_quantity = sq
    }

    // Validate sku (empty string -> null)
    const sku = input.sku && typeof input.sku === 'string' && input.sku.trim() ? input.sku.trim() : null

    // Validate status
    const status = input.status || 'active'
    if (!ALLOWED_STATUSES.includes(status)) {
        return { success: false, error: 'Trạng thái không hợp lệ' }
    }

    // Validate origin_type
    const origin_type = input.origin_type || 'mature_partner_plantation'
    if (!ALLOWED_ORIGIN_TYPES.includes(origin_type)) {
        return { success: false, error: 'Nguồn gốc không hợp lệ' }
    }

    // Images
    const images = Array.isArray(input.images)
        ? input.images.filter((img) => typeof img === 'string' && img.trim().length > 0)
        : []

    // Specifications: omit empty keys
    const specifications: Record<string, string> = {}
    if (input.specifications && typeof input.specifications === 'object') {
        for (const [k, v] of Object.entries(input.specifications)) {
            const key = k.trim()
            if (key) {
                specifications[key] = typeof v === 'string' ? v.trim() : String(v ?? '')
            }
        }
    }

    const payload = {
        name,
        slug,
        category_id,
        price,
        compare_at_price,
        stock_quantity,
        sku,
        status,
        origin_type,
        images,
        specifications,
        description: input.description?.trim() || null,
        is_featured: Boolean(input.is_featured),
        lot_id: input.lot_id?.trim() || null,
        batch_certificate_url: input.batch_certificate_url?.trim() || null,
    }

    const { data: created, error: insertError } = await serviceSupabase
        .from('products')
        .insert(payload)
        .select('id')
        .single()

    if (insertError) {
        if (insertError.code === '23505') {
            const dupMsg = insertError.message?.toLowerCase() || ''
            if (dupMsg.includes('slug')) {
                return { success: false, error: 'Slug đã tồn tại, vui lòng chọn slug khác' }
            }
            if (dupMsg.includes('sku')) {
                return { success: false, error: 'Mã SKU đã tồn tại' }
            }
            return { success: false, error: 'Dữ liệu trùng lặp, vui lòng kiểm tra lại' }
        }
        return { success: false, error: insertError.message || 'Không thể tạo sản phẩm' }
    }

    revalidatePath('/store')
    revalidatePath('/crm/admin/products')
    revalidatePath(`/store/${slug}`)

    return { success: true, id: created?.id }
}

export async function updateProduct(id: string, rawInput: FormData | Partial<ProductInput>): Promise<ProductActionResult> {
    try {
        await verifyAdmin()
    } catch (authError: any) {
        return { success: false, error: authError.message || 'Unauthorized' }
    }

    if (!id || !id.trim()) {
        return { success: false, error: 'ID sản phẩm không hợp lệ' }
    }

    const input = parseInput(rawInput)

    const name = input.name?.trim()
    if (!name) {
        return { success: false, error: 'Tên sản phẩm không được để trống' }
    }

    const slug = input.slug?.trim()
    if (!slug) {
        return { success: false, error: 'Slug không được để trống' }
    }

    if (!SLUG_REGEX.test(slug)) {
        return { success: false, error: 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang' }
    }

    const category_id = input.category_id?.trim()
    if (!category_id) {
        return { success: false, error: 'Danh mục sản phẩm không được để trống' }
    }

    const serviceSupabase = createServiceRoleClient()

    // Check category exists
    const { data: category, error: catError } = await serviceSupabase
        .from('product_categories')
        .select('id')
        .eq('id', category_id)
        .maybeSingle()

    if (catError || !category) {
        return { success: false, error: 'Danh mục sản phẩm không tồn tại' }
    }

    // Check slug uniqueness excluding this product
    const { data: existingSlug } = await serviceSupabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .maybeSingle()

    if (existingSlug) {
        return { success: false, error: 'Slug đã tồn tại, vui lòng chọn slug khác' }
    }

    // Validate price
    const price = typeof input.price === 'string' ? Number(input.price) : input.price
    if (typeof price !== 'number' || isNaN(price) || !Number.isInteger(price) || price <= 0) {
        return { success: false, error: 'Giá sản phẩm phải là số nguyên dương' }
    }

    // Validate compare_at_price
    let compare_at_price: number | null = null
    if (input.compare_at_price !== undefined && input.compare_at_price !== null && input.compare_at_price !== ('' as any)) {
        const cap = typeof input.compare_at_price === 'string' ? Number(input.compare_at_price) : input.compare_at_price
        if (typeof cap !== 'number' || isNaN(cap) || !Number.isInteger(cap) || cap <= 0) {
            return { success: false, error: 'Giá so sánh phải là số nguyên dương' }
        }
        if (cap <= price) {
            return { success: false, error: 'Giá so sánh phải lớn hơn giá bán' }
        }
        compare_at_price = cap
    }

    // Validate stock_quantity
    let stock_quantity = 0
    if (input.stock_quantity !== undefined && input.stock_quantity !== null && input.stock_quantity !== ('' as any)) {
        const sq = typeof input.stock_quantity === 'string' ? Number(input.stock_quantity) : input.stock_quantity
        if (typeof sq !== 'number' || isNaN(sq) || !Number.isInteger(sq) || sq < 0) {
            return { success: false, error: 'Số lượng tồn kho phải là số nguyên không âm' }
        }
        stock_quantity = sq
    }

    // Validate sku (empty string -> null)
    const sku = input.sku && typeof input.sku === 'string' && input.sku.trim() ? input.sku.trim() : null

    // Validate status
    const status = input.status || 'active'
    if (!ALLOWED_STATUSES.includes(status)) {
        return { success: false, error: 'Trạng thái không hợp lệ' }
    }

    // Validate origin_type
    const origin_type = input.origin_type || 'mature_partner_plantation'
    if (!ALLOWED_ORIGIN_TYPES.includes(origin_type)) {
        return { success: false, error: 'Nguồn gốc không hợp lệ' }
    }

    // Images
    const images = Array.isArray(input.images)
        ? input.images.filter((img) => typeof img === 'string' && img.trim().length > 0)
        : []

    // Specifications: omit empty keys
    const specifications: Record<string, string> = {}
    if (input.specifications && typeof input.specifications === 'object') {
        for (const [k, v] of Object.entries(input.specifications)) {
            const key = k.trim()
            if (key) {
                specifications[key] = typeof v === 'string' ? v.trim() : String(v ?? '')
            }
        }
    }

    const payload = {
        name,
        slug,
        category_id,
        price,
        compare_at_price,
        stock_quantity,
        sku,
        status,
        origin_type,
        images,
        specifications,
        description: input.description?.trim() || null,
        is_featured: Boolean(input.is_featured),
        lot_id: input.lot_id?.trim() || null,
        batch_certificate_url: input.batch_certificate_url?.trim() || null,
        updated_at: new Date().toISOString(),
    }

    const { data: updated, error: updateError } = await serviceSupabase
        .from('products')
        .update(payload)
        .eq('id', id)
        .select('id')
        .single()

    if (!updateError && !updated) {
        return { success: false, error: 'Sản phẩm không tồn tại' }
    }
    if (updateError) {
        if (updateError.code === 'PGRST116') {
            return { success: false, error: 'Sản phẩm không tồn tại' }
        }
        if (updateError.code === '23505') {
            const dupMsg = updateError.message?.toLowerCase() || ''
            if (dupMsg.includes('slug')) {
                return { success: false, error: 'Slug đã tồn tại, vui lòng chọn slug khác' }
            }
            if (dupMsg.includes('sku')) {
                return { success: false, error: 'Mã SKU đã tồn tại' }
            }
            return { success: false, error: 'Dữ liệu trùng lặp, vui lòng kiểm tra lại' }
        }
        return { success: false, error: updateError.message || 'Không thể cập nhật sản phẩm' }
    }

    revalidatePath('/store')
    revalidatePath('/crm/admin/products')
    revalidatePath('/store/[slug]', 'page')

    return { success: true, id: updated?.id || id }
}

export async function uploadProductImage(formData: FormData): Promise<UploadProductImageResult> {
    try {
        await verifyAdmin()
    } catch (authError: any) {
        return { success: false, error: authError.message || 'Unauthorized' }
    }

    const file = formData.get('file') as File | null
    if (!file || file.size === 0) {
        return { success: false, error: 'Không có file được chọn' }
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return { success: false, error: 'Định dạng ảnh không hợp lệ (chỉ chấp nhận JPG, PNG, WebP)' }
    }

    if (file.size > MAX_FILE_SIZE) {
        return { success: false, error: 'File quá lớn, tối đa 5MB' }
    }

    const rawFolder = (formData.get('folder') as string) || (formData.get('slug') as string) || (formData.get('id') as string) || 'products'
    const folder = rawFolder.replace(/[^a-z0-9_-]/gi, '') || 'products'
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/jpeg' ? 'jpg' : 'webp'
    const fileName = `${folder}/${crypto.randomUUID()}.${ext}`

    const serviceSupabase = createServiceRoleClient()
    const { error: uploadError } = await serviceSupabase.storage
        .from('product-images')
        .upload(fileName, file, { contentType: file.type || 'image/webp' })

    if (uploadError) {
        return { success: false, error: uploadError.message }
    }

    const { data: { publicUrl } } = serviceSupabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

    return { success: true, url: publicUrl }
}
