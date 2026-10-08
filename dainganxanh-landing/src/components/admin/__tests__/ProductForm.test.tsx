import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProductForm } from '../ProductForm'

const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        refresh: mockRefresh,
    }),
}))

jest.mock('next/image', () => ({
    __esModule: true,
    default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}))

const mockCreateProduct = jest.fn()
const mockUpdateProduct = jest.fn()
const mockUploadProductImage = jest.fn()

jest.mock('@/actions/adminProducts', () => ({
    createProduct: (...args: any[]) => mockCreateProduct(...args),
    updateProduct: (...args: any[]) => mockUpdateProduct(...args),
    uploadProductImage: (...args: any[]) => mockUploadProductImage(...args),
}))

jest.mock('@/lib/imageProcessing', () => ({
    compressImage: jest.fn((file) => Promise.resolve(file)),
}))

jest.mock('@/components/admin/PhotoUploader', () => ({
    PhotoUploader: ({ onPhotosSelected }: any) => (
        <div data-testid="mock-photo-uploader">
            <button
                type="button"
                data-testid="mock-select-photos-btn"
                onClick={() =>
                    onPhotosSelected([
                        {
                            id: 'p1',
                            file: new File(['dummy'], 'sample.webp', { type: 'image/webp' }),
                            preview: 'blob:sample',
                        },
                    ])
                }
            >
                Simulate Select Photo
            </button>
        </div>
    ),
}))

const mockCategories = [
    { id: 'cat-1', name: 'Trà thảo mộc' },
    { id: 'cat-2', name: 'Mật ong & Tinh dầu' },
]

describe('ProductForm', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    // ── SLUG_SUGGEST ────────────────────────────────────────────────────────
    describe('SLUG_SUGGEST', () => {
        it('auto-generates slug from product name when slug has not been touched', () => {
            render(<ProductForm categories={mockCategories} />)

            const nameInput = screen.getByLabelText(/Tên sản phẩm/i)
            const slugInput = screen.getByLabelText(/Slug/i) as HTMLInputElement

            fireEvent.change(nameInput, { target: { value: 'Trà Hoa Vàng Ba Vì' } })

            expect(slugInput.value).toBe('tra-hoa-vang-ba-vi')
        })

        it('does not overwrite slug if user has manually edited it', () => {
            render(<ProductForm categories={mockCategories} />)

            const nameInput = screen.getByLabelText(/Tên sản phẩm/i)
            const slugInput = screen.getByLabelText(/Slug/i) as HTMLInputElement

            // User manually types a custom slug
            fireEvent.change(slugInput, { target: { value: 'custom-tra-slug' } })

            // User changes name afterwards
            fireEvent.change(nameInput, { target: { value: 'Tên Sản Phẩm Mới' } })

            // Slug remains custom
            expect(slugInput.value).toBe('custom-tra-slug')
        })
    })

    // ── IMG_ARRAY add/remove ────────────────────────────────────────────────
    describe('IMG_ARRAY add/remove', () => {
        it('displays initial images and removes an image when clicking delete', () => {
            const initialData = {
                id: 'prod-1',
                name: 'Sản phẩm có ảnh',
                slug: 'san-pham-co-anh',
                images: ['https://example.com/photo1.webp', 'https://example.com/photo2.webp'],
            }

            render(<ProductForm initialData={initialData as any} categories={mockCategories} />)

            expect(screen.getByText('Đã có 2 ảnh')).toBeInTheDocument()
            expect(screen.getByAltText('Ảnh 1')).toBeInTheDocument()
            expect(screen.getByAltText('Ảnh 2')).toBeInTheDocument()

            // Click delete button for the first image
            const deleteButtons = screen.getAllByRole('button', { name: /Xóa ảnh/i })
            fireEvent.click(deleteButtons[0])

            // Only 1 image remains
            expect(screen.getByText('Đã có 1 ảnh')).toBeInTheDocument()
            expect(screen.queryByAltText('Ảnh 2')).not.toBeInTheDocument()
        })

        it('promotes an image to cover when clicking "Đặt làm chính"', () => {
            const initialData = {
                id: 'prod-1',
                name: 'Sản phẩm có ảnh',
                slug: 'san-pham-co-anh',
                images: ['https://example.com/photo1.webp', 'https://example.com/photo2.webp'],
            }

            render(<ProductForm initialData={initialData as any} categories={mockCategories} />)

            // Ảnh đầu tiên là ảnh chính ban đầu
            expect(screen.getByAltText('Ảnh 1')).toHaveAttribute('src', 'https://example.com/photo1.webp')

            fireEvent.click(screen.getByRole('button', { name: /Đặt làm chính/i }))

            // photo2 được đưa lên đầu làm ảnh chính
            expect(screen.getByAltText('Ảnh 1')).toHaveAttribute('src', 'https://example.com/photo2.webp')
            expect(screen.getByAltText('Ảnh 2')).toHaveAttribute('src', 'https://example.com/photo1.webp')
        })

        it('uploads image via PhotoUploader and appends URL to images list', async () => {
            mockUploadProductImage.mockResolvedValueOnce({
                success: true,
                url: 'https://example.com/uploaded-new.webp',
            })

            render(<ProductForm categories={mockCategories} />)

            const uploadBtn = screen.getByTestId('mock-select-photos-btn')
            fireEvent.click(uploadBtn)

            await waitFor(() => {
                expect(mockUploadProductImage).toHaveBeenCalled()
                expect(screen.getByText('Đã có 1 ảnh')).toBeInTheDocument()
            })
        })
    })

    // ── SPECS row add/remove ────────────────────────────────────────────────
    describe('SPECS row add/remove', () => {
        it('adds a spec row, allows editing, and removes it', () => {
            render(<ProductForm categories={mockCategories} />)

            expect(screen.getByText(/Chưa có thông số kỹ thuật nào/i)).toBeInTheDocument()

            // Click Add Spec
            const addSpecBtn = screen.getByRole('button', { name: /Thêm thông số/i })
            fireEvent.click(addSpecBtn)

            // Inputs appear
            const keyInput = screen.getByPlaceholderText(/Tên thông số/i)
            const valInput = screen.getByPlaceholderText(/Giá trị/i)

            fireEvent.change(keyInput, { target: { value: 'Khối lượng' } })
            fireEvent.change(valInput, { target: { value: '500g' } })

            // Add second spec row
            fireEvent.click(addSpecBtn)
            const allKeyInputs = screen.getAllByPlaceholderText(/Tên thông số/i)
            expect(allKeyInputs).toHaveLength(2)

            // Delete first spec row
            const removeBtns = screen.getAllByRole('button', { name: /Xóa thông số/i })
            fireEvent.click(removeBtns[0])

            // Only 1 spec row remains
            const remainingKeyInputs = screen.getAllByPlaceholderText(/Tên thông số/i)
            expect(remainingKeyInputs).toHaveLength(1)
        })
    })

    // ── SUBMIT ACTION ──────────────────────────────────────────────────────
    describe('SUBMIT ACTION', () => {
        it('calls createProduct on submit and redirects on success', async () => {
            mockCreateProduct.mockResolvedValueOnce({ success: true, id: 'new-id' })

            render(<ProductForm categories={mockCategories} />)

            // Fill required fields
            fireEvent.change(screen.getByLabelText(/Tên sản phẩm/i), {
                target: { value: 'Tinh dầu quế' },
            })
            fireEvent.change(screen.getByLabelText(/Giá bán/i), {
                target: { value: '150000' },
            })
            fireEvent.change(screen.getByLabelText(/Tồn kho/i), {
                target: { value: '25' },
            })

            // Add a spec row
            fireEvent.click(screen.getByRole('button', { name: /Thêm thông số/i }))
            fireEvent.change(screen.getByPlaceholderText(/Tên thông số/i), {
                target: { value: 'Dung tích' },
            })
            fireEvent.change(screen.getByPlaceholderText(/Giá trị/i), {
                target: { value: '100ml' },
            })

            // Submit
            const submitBtn = screen.getByRole('button', { name: /Lưu sản phẩm/i })
            fireEvent.click(submitBtn)

            await waitFor(() => {
                expect(mockCreateProduct).toHaveBeenCalledWith(
                    expect.objectContaining({
                        name: 'Tinh dầu quế',
                        slug: 'tinh-dau-que',
                        category_id: 'cat-1',
                        price: 150000,
                        stock_quantity: 25,
                        specifications: { 'Dung tích': '100ml' },
                    })
                )
                expect(mockPush).toHaveBeenCalledWith('/crm/admin/products')
                expect(mockRefresh).toHaveBeenCalled()
            })
        })

        it('calls updateProduct when editing existing product', async () => {
            mockUpdateProduct.mockResolvedValueOnce({ success: true, id: 'edit-id' })

            const initialData = {
                id: 'edit-id',
                name: 'Trà sâm',
                slug: 'tra-sam',
                category_id: 'cat-1',
                price: 120000,
                stock_quantity: 10,
                status: 'active' as const,
                origin_type: 'dainganxanh_harvest' as const,
            }

            render(<ProductForm initialData={initialData as any} categories={mockCategories} />)

            // Update price
            fireEvent.change(screen.getByLabelText(/Giá bán/i), {
                target: { value: '135000' },
            })

            // Submit
            const submitBtn = screen.getByRole('button', { name: /Cập nhật sản phẩm/i })
            fireEvent.click(submitBtn)

            await waitFor(() => {
                expect(mockUpdateProduct).toHaveBeenCalledWith(
                    'edit-id',
                    expect.objectContaining({
                        name: 'Trà sâm',
                        price: 135000,
                    })
                )
                expect(mockPush).toHaveBeenCalledWith('/crm/admin/products')
            })
        })

        it('displays error message when action returns failure', async () => {
            mockCreateProduct.mockResolvedValueOnce({
                success: false,
                error: 'Slug đã tồn tại, vui lòng chọn slug khác',
            })

            render(<ProductForm categories={mockCategories} />)

            fireEvent.change(screen.getByLabelText(/Tên sản phẩm/i), {
                target: { value: 'Trà Trùng Slug' },
            })
            fireEvent.change(screen.getByLabelText(/Giá bán/i), {
                target: { value: '200000' },
            })

            fireEvent.click(screen.getByRole('button', { name: /Lưu sản phẩm/i }))

            await waitFor(() => {
                expect(screen.getByText(/Slug đã tồn tại, vui lòng chọn slug khác/i)).toBeInTheDocument()
                expect(mockPush).not.toHaveBeenCalled()
            })
        })
    })
})
