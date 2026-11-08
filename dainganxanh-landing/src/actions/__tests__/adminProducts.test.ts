import {
    createProduct,
    updateProduct,
    uploadProductImage,
    verifyAdmin,
    type ProductInput,
} from '../adminProducts'
import { revalidatePath } from 'next/cache'

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

const mockGetUser = jest.fn()
const mockFrom = jest.fn()
const mockServiceFrom = jest.fn()
const mockStorageFrom = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
    createServerClient: jest.fn(() => ({
        auth: { getUser: mockGetUser },
        from: mockFrom,
    })),
    createServiceRoleClient: jest.fn(() => ({
        from: mockServiceFrom,
        storage: {
            from: mockStorageFrom,
        },
    })),
}))

function createQueryChain(result: { data?: any; error?: any; count?: number | null }) {
    const chain: any = {
        select: jest.fn(() => chain),
        insert: jest.fn(() => chain),
        update: jest.fn(() => chain),
        eq: jest.fn(() => chain),
        neq: jest.fn(() => chain),
        single: jest.fn(() => Promise.resolve(result)),
        maybeSingle: jest.fn(() => Promise.resolve(result)),
        then: (resolve: any) => Promise.resolve(result).then(resolve),
    }
    return chain
}

describe('adminProducts server actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        // Default admin auth
        mockGetUser.mockResolvedValue({
            data: { user: { id: 'admin-user-id' } },
            error: null,
        })
        mockFrom.mockImplementation((table: string) => {
            if (table === 'users') {
                return createQueryChain({ data: { role: 'admin' }, error: null })
            }
            return createQueryChain({ data: null, error: null })
        })
    })

    const validProductInput: ProductInput = {
        name: 'Trà Hoa Vàng Ba Vì',
        slug: 'tra-hoa-vang-ba-vi',
        category_id: 'cat-123',
        price: 250000,
        compare_at_price: 300000,
        stock_quantity: 50,
        sku: 'THV-001',
        status: 'active',
        origin_type: 'dainganxanh_harvest',
        images: ['https://example.com/img1.webp'],
        specifications: { 'Khối lượng': '500g', '': 'bỏ qua' },
        description: 'Mô tả trà hoa vàng chất lượng cao',
        is_featured: true,
    }

    // ── AUTH_DENY ──────────────────────────────────────────────────────────
    describe('AUTH_DENY guards', () => {
        it('rejects createProduct when user is not authenticated', async () => {
            mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('No user') })

            const result = await createProduct(validProductInput)
            expect(result.success).toBe(false)
            expect(result.error).toMatch(/unauthorized/i)
        })

        it('rejects updateProduct when user role is not admin', async () => {
            mockFrom.mockImplementationOnce(() =>
                createQueryChain({ data: { role: 'user' }, error: null })
            )

            const result = await updateProduct('prod-1', validProductInput)
            expect(result.success).toBe(false)
            expect(result.error).toMatch(/forbidden/i)
        })

        it('rejects uploadProductImage when user is resort_manager', async () => {
            mockFrom.mockImplementationOnce(() =>
                createQueryChain({ data: { role: 'resort_manager' }, error: null })
            )

            const formData = new FormData()
            formData.append('file', new File(['dummy'], 'img.webp', { type: 'image/webp' }))

            const result = await uploadProductImage(formData)
            expect(result.success).toBe(false)
            expect(result.error).toMatch(/forbidden/i)
        })

        it('verifyAdmin throws when not admin', async () => {
            mockFrom.mockImplementationOnce(() =>
                createQueryChain({ data: { role: 'user' }, error: null })
            )
            await expect(verifyAdmin()).rejects.toThrow('Forbidden')
        })
    })

    // ── VALIDATION ─────────────────────────────────────────────────────────
    describe('VALIDATION rules', () => {
        it('rejects empty name', async () => {
            const result = await createProduct({ ...validProductInput, name: '   ' })
            expect(result.success).toBe(false)
            expect(result.error).toBe('Tên sản phẩm không được để trống')
        })

        it('rejects empty slug', async () => {
            const result = await createProduct({ ...validProductInput, slug: '' })
            expect(result.success).toBe(false)
            expect(result.error).toBe('Slug không được để trống')
        })

        it('rejects invalid slug format', async () => {
            const badSlugs = ['Tra Hoa Vang', 'tra--hoa', '-tra-hoa', 'tra-hoa-', 'trà-hoa-vàng']
            for (const badSlug of badSlugs) {
                const result = await createProduct({ ...validProductInput, slug: badSlug })
                expect(result.success).toBe(false)
                expect(result.error).toBe('Slug chỉ được chứa chữ thường, số và dấu gạch ngang')
            }
        })

        it('rejects empty category_id', async () => {
            const result = await createProduct({ ...validProductInput, category_id: '' })
            expect(result.success).toBe(false)
            expect(result.error).toBe('Danh mục sản phẩm không được để trống')
        })

        it('rejects non-existent category_id', async () => {
            mockServiceFrom.mockImplementationOnce((table: string) => {
                if (table === 'product_categories') {
                    return createQueryChain({ data: null, error: { message: 'Not found' } })
                }
                return createQueryChain({ data: null, error: null })
            })

            const result = await createProduct(validProductInput)
            expect(result.success).toBe(false)
            expect(result.error).toBe('Danh mục sản phẩm không tồn tại')
        })

        it('rejects duplicate slug when creating product', async () => {
            mockServiceFrom.mockImplementation((table: string) => {
                if (table === 'product_categories') {
                    return createQueryChain({ data: { id: 'cat-123' }, error: null })
                }
                if (table === 'products') {
                    // Slug check finds existing product
                    return createQueryChain({ data: { id: 'existing-prod-id' }, error: null })
                }
                return createQueryChain({ data: null, error: null })
            })

            const result = await createProduct(validProductInput)
            expect(result.success).toBe(false)
            expect(result.error).toBe('Slug đã tồn tại, vui lòng chọn slug khác')
        })

        it('rejects invalid price (<= 0 or not integer)', async () => {
            mockServiceFrom.mockImplementation((table: string) => {
                if (table === 'product_categories') {
                    return createQueryChain({ data: { id: 'cat-123' }, error: null })
                }
                if (table === 'products') {
                    return createQueryChain({ data: null, error: null })
                }
                return createQueryChain({ data: null, error: null })
            })

            const invalidPrices = [0, -1000, 150.5, NaN]
            for (const badPrice of invalidPrices) {
                const result = await createProduct({ ...validProductInput, price: badPrice })
                expect(result.success).toBe(false)
                expect(result.error).toBe('Giá sản phẩm phải là số nguyên dương')
            }
        })

        it('rejects invalid compare_at_price (<= 0 or non-integer)', async () => {
            mockServiceFrom.mockImplementation((table: string) => {
                if (table === 'product_categories') {
                    return createQueryChain({ data: { id: 'cat-123' }, error: null })
                }
                if (table === 'products') {
                    return createQueryChain({ data: null, error: null })
                }
                return createQueryChain({ data: null, error: null })
            })

            const result = await createProduct({ ...validProductInput, compare_at_price: -500 })
            expect(result.success).toBe(false)
            expect(result.error).toBe('Giá so sánh phải là số nguyên dương')
        })

        it('rejects invalid stock_quantity (< 0 or non-integer)', async () => {
            mockServiceFrom.mockImplementation((table: string) => {
                if (table === 'product_categories') {
                    return createQueryChain({ data: { id: 'cat-123' }, error: null })
                }
                if (table === 'products') {
                    return createQueryChain({ data: null, error: null })
                }
                return createQueryChain({ data: null, error: null })
            })

            const result = await createProduct({ ...validProductInput, stock_quantity: -1 })
            expect(result.success).toBe(false)
            expect(result.error).toBe('Số lượng tồn kho phải là số nguyên không âm')
        })

        it('rejects invalid status', async () => {
            mockServiceFrom.mockImplementation((table: string) => {
                if (table === 'product_categories') {
                    return createQueryChain({ data: { id: 'cat-123' }, error: null })
                }
                if (table === 'products') {
                    return createQueryChain({ data: null, error: null })
                }
                return createQueryChain({ data: null, error: null })
            })

            const result = await createProduct({ ...validProductInput, status: 'invalid_status' as any })
            expect(result.success).toBe(false)
            expect(result.error).toBe('Trạng thái không hợp lệ')
        })

        it('rejects invalid origin_type', async () => {
            mockServiceFrom.mockImplementation((table: string) => {
                if (table === 'product_categories') {
                    return createQueryChain({ data: { id: 'cat-123' }, error: null })
                }
                if (table === 'products') {
                    return createQueryChain({ data: null, error: null })
                }
                return createQueryChain({ data: null, error: null })
            })

            const result = await createProduct({ ...validProductInput, origin_type: 'unknown_origin' as any })
            expect(result.success).toBe(false)
            expect(result.error).toBe('Nguồn gốc không hợp lệ')
        })

        it('rejects updateProduct with invalid id', async () => {
            const result = await updateProduct('   ', validProductInput)
            expect(result.success).toBe(false)
            expect(result.error).toBe('ID sản phẩm không hợp lệ')
        })
    })

    // ── SKU_DUP ────────────────────────────────────────────────────────────
    describe('SKU_DUP constraint error', () => {
        it('catches unique constraint 23505 on SKU during create', async () => {
            let callCount = 0
            mockServiceFrom.mockImplementation((table: string) => {
                if (table === 'product_categories') {
                    return createQueryChain({ data: { id: 'cat-123' }, error: null })
                }
                if (table === 'products') {
                    callCount++
                    if (callCount === 1) {
                        // Slug uniqueness check
                        return createQueryChain({ data: null, error: null })
                    }
                    // Insert call fails with 23505 duplicate key
                    return createQueryChain({
                        data: null,
                        error: { code: '23505', message: 'duplicate key value violates unique constraint "products_sku_key"' },
                    })
                }
                return createQueryChain({ data: null, error: null })
            })

            const result = await createProduct(validProductInput)
            expect(result.success).toBe(false)
            expect(result.error).toBe('Mã SKU đã tồn tại')
        })
    })

    // ── UPLOAD_BAD ─────────────────────────────────────────────────────────
    describe('UPLOAD_BAD error handling', () => {
        it('rejects when no file is provided', async () => {
            const formData = new FormData()
            const result = await uploadProductImage(formData)
            expect(result.success).toBe(false)
            expect(result.error).toBe('Không có file được chọn')
        })

        it('rejects unsupported file type', async () => {
            const formData = new FormData()
            const file = new File(['hello text'], 'test.txt', { type: 'text/plain' })
            formData.append('file', file)

            const result = await uploadProductImage(formData)
            expect(result.success).toBe(false)
            expect(result.error).toBe('Định dạng ảnh không hợp lệ (chỉ chấp nhận JPG, PNG, WebP)')
        })

        it('rejects file larger than 5MB', async () => {
            const formData = new FormData()
            const bigBuffer = new Uint8Array(5 * 1024 * 1024 + 1)
            const file = new File([bigBuffer], 'big.png', { type: 'image/png' })
            formData.append('file', file)

            const result = await uploadProductImage(formData)
            expect(result.success).toBe(false)
            expect(result.error).toBe('File quá lớn, tối đa 5MB')
        })
    })

    // ── CREATE_OK ──────────────────────────────────────────────────────────
    describe('CREATE_OK happy path', () => {
        it('creates product via object input and revalidates paths', async () => {
            let insertedPayload: any = null
            let productQueryCount = 0

            mockServiceFrom.mockImplementation((table: string) => {
                if (table === 'product_categories') {
                    return createQueryChain({ data: { id: 'cat-123' }, error: null })
                }
                if (table === 'products') {
                    productQueryCount++
                    if (productQueryCount === 1) {
                        // Slug uniqueness check: no existing product with this slug
                        return createQueryChain({ data: null, error: null })
                    }
                    const chain = createQueryChain({ data: { id: 'new-product-id' }, error: null })
                    chain.insert = jest.fn((payload) => {
                        insertedPayload = payload
                        return chain
                    })
                    return chain
                }
                return createQueryChain({ data: null, error: null })
            })

            const result = await createProduct(validProductInput)
            expect(result.success).toBe(true)
            expect(result.id).toBe('new-product-id')

            // Verify payload structure
            expect(insertedPayload).toMatchObject({
                name: 'Trà Hoa Vàng Ba Vì',
                slug: 'tra-hoa-vang-ba-vi',
                category_id: 'cat-123',
                price: 250000,
                compare_at_price: 300000,
                stock_quantity: 50,
                sku: 'THV-001',
                status: 'active',
                origin_type: 'dainganxanh_harvest',
                is_featured: true,
            })
            // Empty key pruned from specifications
            expect(insertedPayload.specifications).toEqual({ 'Khối lượng': '500g' })

            // Verify revalidatePath calls
            expect(revalidatePath).toHaveBeenCalledWith('/store')
            expect(revalidatePath).toHaveBeenCalledWith('/crm/admin/products')
            expect(revalidatePath).toHaveBeenCalledWith('/store/tra-hoa-vang-ba-vi')
        })

        it('creates product via FormData input with sku empty as null', async () => {
            let insertedPayload: any = null
            let productQueryCount = 0

            mockServiceFrom.mockImplementation((table: string) => {
                if (table === 'product_categories') {
                    return createQueryChain({ data: { id: 'cat-456' }, error: null })
                }
                if (table === 'products') {
                    productQueryCount++
                    if (productQueryCount === 1) {
                        // Slug uniqueness check
                        return createQueryChain({ data: null, error: null })
                    }
                    const chain = createQueryChain({ data: { id: 'form-prod-id' }, error: null })
                    chain.insert = jest.fn((payload) => {
                        insertedPayload = payload
                        return chain
                    })
                    return chain
                }
                return createQueryChain({ data: null, error: null })
            })

            const formData = new FormData()
            formData.append('name', 'Mật ong rừng')
            formData.append('slug', 'mat-ong-rung')
            formData.append('category_id', 'cat-456')
            formData.append('price', '180000')
            formData.append('stock_quantity', '20')
            formData.append('sku', '   ') // Whitespace should convert to null
            formData.append('images', JSON.stringify(['https://example.com/honey.webp']))
            formData.append('specifications', JSON.stringify({ 'Dung tích': '500ml' }))
            formData.append('is_featured', '1')

            const result = await createProduct(formData)
            expect(result.success).toBe(true)
            expect(result.id).toBe('form-prod-id')
            expect(insertedPayload.sku).toBeNull()
            expect(insertedPayload.price).toBe(180000)
            expect(insertedPayload.stock_quantity).toBe(20)
            expect(insertedPayload.compare_at_price).toBeNull()
            expect(insertedPayload.images).toEqual(['https://example.com/honey.webp'])
        })
    })

    // ── UPDATE_OK ──────────────────────────────────────────────────────────
    describe('UPDATE_OK happy path', () => {
        it('updates product and revalidates paths', async () => {
            let updatedPayload: any = null
            let productQueryCount = 0
            let slugCheckChain: any = null

            mockServiceFrom.mockImplementation((table: string) => {
                if (table === 'product_categories') {
                    return createQueryChain({ data: { id: 'cat-123' }, error: null })
                }
                if (table === 'products') {
                    productQueryCount++
                    if (productQueryCount === 1) {
                        // Slug uniqueness check
                        slugCheckChain = createQueryChain({ data: null, error: null })
                        return slugCheckChain
                    }
                    const chain = createQueryChain({ data: { id: 'prod-to-update' }, error: null })
                    chain.update = jest.fn((payload) => {
                        updatedPayload = payload
                        return chain
                    })
                    return chain
                }
                return createQueryChain({ data: null, error: null })
            })

            const result = await updateProduct('prod-to-update', {
                ...validProductInput,
                name: 'Trà Hoa Vàng Cập Nhật',
                price: 270000,
            })

            expect(result.success).toBe(true)
            expect(result.id).toBe('prod-to-update')
            expect(updatedPayload.name).toBe('Trà Hoa Vàng Cập Nhật')
            expect(updatedPayload.price).toBe(270000)
            expect(slugCheckChain.neq).toHaveBeenCalledWith('id', 'prod-to-update')
            expect(revalidatePath).toHaveBeenCalledWith('/crm/admin/products')
            expect(revalidatePath).toHaveBeenCalledWith('/store/[slug]', 'page')
        })

        it('rejects duplicate slug on update', async () => {
            mockServiceFrom.mockImplementation((table: string) => {
                if (table === 'product_categories') {
                    return createQueryChain({ data: { id: 'cat-123' }, error: null })
                }
                if (table === 'products') {
                    // Slug uniqueness check finds another product with same slug
                    return createQueryChain({ data: { id: 'other-product-id' }, error: null })
                }
                return createQueryChain({ data: null, error: null })
            })

            const result = await updateProduct('prod-to-update', validProductInput)

            expect(result.success).toBe(false)
            expect(result.error).toBe('Slug đã tồn tại, vui lòng chọn slug khác')
        })
    })

    // ── UPLOAD_OK ──────────────────────────────────────────────────────────
    describe('UPLOAD_OK happy path', () => {
        it('uploads valid webp image and returns public URL', async () => {
            const mockUpload = jest.fn().mockResolvedValue({ data: { path: 'products/file.webp' }, error: null })
            const mockGetPublicUrl = jest.fn().mockReturnValue({
                data: { publicUrl: 'https://storage.example.com/product-images/test-folder/uuid.webp' },
            })

            mockStorageFrom.mockReturnValue({
                upload: mockUpload,
                getPublicUrl: mockGetPublicUrl,
            })

            const formData = new FormData()
            const file = new File(['binary content'], 'photo.webp', { type: 'image/webp' })
            formData.append('file', file)
            formData.append('slug', 'tra-hoa-vang')

            const result = await uploadProductImage(formData)
            expect(result.success).toBe(true)
            expect(result.url).toBe('https://storage.example.com/product-images/test-folder/uuid.webp')
            expect(mockUpload).toHaveBeenCalledWith(
                expect.stringMatching(/^tra-hoa-vang\/[0-9a-f-]+\.webp$/),
                file,
                { contentType: 'image/webp' }
            )
        })
    })

    describe('i18n translations support', () => {
        it('persists translations in createProduct', async () => {
            let insertedData: any = null
            let productQueryCount = 0
            mockServiceFrom.mockImplementation((table: string) => {
                if (table === 'product_categories') {
                    return createQueryChain({ data: { id: 'cat-123' }, error: null })
                }
                if (table === 'products') {
                    productQueryCount++
                    if (productQueryCount === 1) {
                        return createQueryChain({ data: null, error: null })
                    }
                    const chain = createQueryChain({ data: { id: 'prod-i18n-1', slug: 'tra-hoa-vang-ba-vi' }, error: null })
                    chain.insert = jest.fn((payload) => {
                        insertedData = payload
                        return chain
                    })
                    return chain
                }
                return createQueryChain({ data: null, error: null })
            })

            const inputWithTranslations: ProductInput = {
                ...validProductInput,
                translations: {
                    en: {
                        name: 'Ba Vi Golden Camellia Tea',
                        description: 'Herbal tea from Ba Vi mountain',
                    },
                },
            }

            const result = await createProduct(inputWithTranslations)
            expect(result.success).toBe(true)
            expect(insertedData.translations).toEqual({
                vi: {
                    name: 'Trà Hoa Vàng Ba Vì',
                    description: 'Mô tả trà hoa vàng chất lượng cao',
                },
                en: {
                    name: 'Ba Vi Golden Camellia Tea',
                    description: 'Herbal tea from Ba Vi mountain',
                },
            })
        })

        it('persists translations in updateProduct', async () => {
            let updatedData: any = null
            let productQueryCount = 0
            mockServiceFrom.mockImplementation((table: string) => {
                if (table === 'product_categories') {
                    return createQueryChain({ data: { id: 'cat-123' }, error: null })
                }
                if (table === 'products') {
                    productQueryCount++
                    if (productQueryCount === 1) {
                        return createQueryChain({ data: null, error: null })
                    }
                    const chain = createQueryChain({ data: { id: 'prod-123', slug: 'tra-hoa-vang-ba-vi' }, error: null })
                    chain.update = jest.fn((payload) => {
                        updatedData = payload
                        return chain
                    })
                    return chain
                }
                return createQueryChain({ data: null, error: null })
            })

            const inputWithTranslations: ProductInput = {
                ...validProductInput,
                translations: {
                    en: {
                        name: 'Updated English Name',
                        description: 'Updated English Description',
                    },
                },
            }

            const result = await updateProduct('prod-123', inputWithTranslations)
            expect(result.success).toBe(true)
            expect(updatedData.translations).toEqual({
                vi: {
                    name: 'Trà Hoa Vàng Ba Vì',
                    description: 'Mô tả trà hoa vàng chất lượng cao',
                },
                en: {
                    name: 'Updated English Name',
                    description: 'Updated English Description',
                },
            })
        })

        it('[SAVE_EMPTY_EN] does not include en key when en fields are empty/whitespace, but keeps vi mirror', async () => {
            let insertedData: any = null
            let productQueryCount = 0
            mockServiceFrom.mockImplementation((table: string) => {
                if (table === 'product_categories') {
                    return createQueryChain({ data: { id: 'cat-123' }, error: null })
                }
                if (table === 'products') {
                    productQueryCount++
                    if (productQueryCount === 1) {
                        return createQueryChain({ data: null, error: null })
                    }
                    const chain = createQueryChain({ data: { id: 'prod-i18n-2', slug: 'tra-hoa-vang-ba-vi' }, error: null })
                    chain.insert = jest.fn((payload) => {
                        insertedData = payload
                        return chain
                    })
                    return chain
                }
                return createQueryChain({ data: null, error: null })
            })

            const inputWithBlankEn: ProductInput = {
                ...validProductInput,
                translations: {
                    en: {
                        name: '   ',
                        description: '',
                    },
                },
            }

            const result = await createProduct(inputWithBlankEn)
            expect(result.success).toBe(true)
            expect(insertedData.translations).toEqual({
                vi: {
                    name: 'Trà Hoa Vàng Ba Vì',
                    description: 'Mô tả trà hoa vàng chất lượng cao',
                },
            })
            expect(insertedData.translations).not.toHaveProperty('en')
        })

        it('strips empty-string fields from translations.en while keeping non-empty fields trimmed', async () => {
            let insertedData: any = null
            let productQueryCount = 0

            mockServiceFrom.mockImplementation((table: string) => {
                if (table === 'product_categories') {
                    return createQueryChain({ data: { id: 'cat-123' }, error: null })
                }
                if (table === 'products') {
                    productQueryCount++
                    if (productQueryCount === 1) {
                        return createQueryChain({ data: null, error: null })
                    }
                    const chain = createQueryChain({ data: { id: 'prod-i18n-3', slug: 'tra-hoa-vang-ba-vi' }, error: null })
                    chain.insert = jest.fn((payload) => {
                        insertedData = payload
                        return chain
                    })
                    return chain
                }
                return createQueryChain({ data: null, error: null })
            })

            const inputWithPartialEn: ProductInput = {
                ...validProductInput,
                translations: {
                    en: {
                        name: '  Golden Tea  ',
                        description: '   ',
                    },
                },
            }

            const result = await createProduct(inputWithPartialEn)
            expect(result.success).toBe(true)
            expect(insertedData.translations.en).toEqual({
                name: 'Golden Tea',
            })
            expect(insertedData.translations.en).not.toHaveProperty('description')
        })
    })
})
