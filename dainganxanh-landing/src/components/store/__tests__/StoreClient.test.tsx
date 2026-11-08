import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { StoreClient, type Product } from '../StoreClient'

const categories = [
    { id: 'cat-1', name: 'Nước hoa', slug: 'nuoc-hoa' },
    { id: 'cat-2', name: 'Tinh dầu', slug: 'tinh-dau' },
]

const baseProduct: Product = {
    id: 'p-1',
    name: 'Nước hoa trầm A',
    slug: 'nuoc-hoa-tram-a',
    price: 500000,
    compare_at_price: null,
    stock_quantity: 10,
    images: [],
    is_featured: false,
    status: 'active',
    product_categories: { name: 'Nước hoa', slug: 'nuoc-hoa' },
}

function renderStore(overrides: { categories?: typeof categories; products?: Product[] } = {}) {
    return renderWithIntl(
        <StoreClient
            categories={overrides.categories ?? categories}
            products={overrides.products ?? [baseProduct]}
        />
    )
}

function searchInput() {
    return screen.getByPlaceholderText(/Tìm kiếm/i)
}

describe('StoreClient', () => {
    it('renders hero, category pills, and product grid', () => {
        renderStore()
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sản Phẩm Trầm Hương Thuần Việt')
        expect(screen.getByRole('button', { name: 'Tất cả' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Nước hoa' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Tinh dầu' })).toBeInTheDocument()
        expect(screen.getByText('Nước hoa trầm A')).toBeInTheDocument()
    })

    it('renders featured section for featured products', () => {
        renderStore({ products: [{ ...baseProduct, is_featured: true }] })
        expect(screen.getByRole('heading', { name: /Sản Phẩm Nổi Bật/i })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: /Tất Cả Sản Phẩm/i })).toBeInTheDocument()
        expect(screen.getAllByText('Nổi bật').length).toBeGreaterThan(0)
    })

    it('renders a featured product in both featured section and main grid', () => {
        renderStore({ products: [{ ...baseProduct, is_featured: true }] })
        expect(screen.getAllByText('Nước hoa trầm A')).toHaveLength(2)
    })

    describe('search', () => {
        it('matches product by name', () => {
            renderStore({
                products: [
                    baseProduct,
                    { ...baseProduct, id: 'p-2', name: 'Tinh dầu trầm B', slug: 'b' },
                ],
            })
            fireEvent.change(searchInput(), { target: { value: 'Nước hoa trầm A' } })
            expect(screen.getByText('Nước hoa trầm A')).toBeInTheDocument()
            expect(screen.queryByText('Tinh dầu trầm B')).not.toBeInTheDocument()
        })

        it('matches product by description', () => {
            renderStore({
                products: [
                    { ...baseProduct, description: 'Hương thơm gỗ quý hiếm' },
                    { ...baseProduct, id: 'p-2', name: 'Tinh dầu trầm B', slug: 'b' },
                ],
            })
            fireEvent.change(searchInput(), { target: { value: 'gỗ quý hiếm' } })
            expect(screen.getByText('Nước hoa trầm A')).toBeInTheDocument()
            expect(screen.queryByText('Tinh dầu trầm B')).not.toBeInTheDocument()
        })

        it('is case-insensitive', () => {
            renderStore()
            fireEvent.change(searchInput(), { target: { value: 'NƯỚC HOA TRẦM' } })
            expect(screen.getByText('Nước hoa trầm A')).toBeInTheDocument()
        })

        it('matches product by category name', () => {
            renderStore({
                products: [
                    baseProduct,
                    { ...baseProduct, id: 'p-2', name: 'Vòng tay trầm C', slug: 'c', product_categories: { name: 'Tinh dầu', slug: 'tinh-dau' } },
                ],
            })
            fireEvent.change(searchInput(), { target: { value: 'tinh dầu' } })
            expect(screen.queryByText('Nước hoa trầm A')).not.toBeInTheDocument()
            expect(screen.getByText('Vòng tay trầm C')).toBeInTheDocument()
        })

        it('shows empty state when nothing matches', () => {
            renderStore()
            fireEvent.change(searchInput(), { target: { value: 'không tồn tại xyz' } })
            expect(screen.getByText('Chưa có sản phẩm nào phù hợp.')).toBeInTheDocument()
            expect(screen.queryByText('Nước hoa trầm A')).not.toBeInTheDocument()
        })
    })

    describe('category filter', () => {
        it('filters products by selected category pill', () => {
            renderStore({
                products: [
                    baseProduct,
                    {
                        ...baseProduct,
                        id: 'p-2',
                        name: 'Tinh dầu trầm B',
                        slug: 'b',
                        product_categories: { name: 'Tinh dầu', slug: 'tinh-dau' },
                    },
                ],
            })
            fireEvent.click(screen.getByRole('button', { name: 'Tinh dầu' }))
            expect(screen.queryByText('Nước hoa trầm A')).not.toBeInTheDocument()
            expect(screen.getByText('Tinh dầu trầm B')).toBeInTheDocument()

            fireEvent.click(screen.getByRole('button', { name: 'Tất cả' }))
            expect(screen.getByText('Nước hoa trầm A')).toBeInTheDocument()
            expect(screen.getByText('Tinh dầu trầm B')).toBeInTheDocument()
        })
    })

    describe('product card', () => {
        it('renders origin badge when origin_type maps to a label', () => {
            renderStore({ products: [{ ...baseProduct, origin_type: 'cooperative_farm' }] })
            expect(screen.getByText('Hợp tác xã nông dân')).toBeInTheDocument()
        })

        it('does not render origin badge for null or unmapped origin_type', () => {
            renderStore({ products: [{ ...baseProduct, origin_type: null }] })
            expect(screen.queryByText(/Vườn đối tác|Hợp tác xã|Đại Ngàn Xanh/)).not.toBeInTheDocument()

            renderStore({ products: [{ ...baseProduct, origin_type: 'unknown_origin' as never }] })
            expect(screen.queryByText('unknown_origin')).not.toBeInTheDocument()
        })

        it('shows out-of-stock badge alongside origin badge', () => {
            renderStore({
                products: [{ ...baseProduct, stock_quantity: 0, origin_type: 'dainganxanh_harvest' }],
            })
            expect(screen.getByText('Hết hàng')).toBeInTheDocument()
            expect(screen.getByText('Thu hoạch từ vườn Đại Ngàn Xanh')).toBeInTheDocument()
        })

        it('hides badge silently for unmapped origin_type (drift safety)', () => {
            renderStore({ products: [{ ...baseProduct, origin_type: JSON.parse('"new_schema_value"') }] })
            expect(screen.queryByText('new_schema_value')).not.toBeInTheDocument()
            expect(screen.queryByText(/Vườn đối tác|Hợp tác xã|Đại Ngàn Xanh/)).not.toBeInTheDocument()
        })

        it('renders price and compare_at_price', () => {
            renderStore({ products: [{ ...baseProduct, compare_at_price: 700000 }] })
            expect(screen.getByText(/500\.000/)).toBeInTheDocument()
            expect(screen.getByText(/700\.000/)).toBeInTheDocument()
        })
    })

    describe('English localization (en)', () => {
        it('renders EN hero title, filter button, and search placeholder', () => {
            renderWithIntl(
                <StoreClient
                    categories={categories}
                    products={[{ ...baseProduct, is_featured: true }]}
                />,
                { locale: 'en' }
            )

            expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Pure Vietnamese Agarwood Products')
            expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
            expect(screen.getByRole('heading', { name: /Featured Products/i })).toBeInTheDocument()
            expect(screen.getByRole('heading', { name: /All Products/i })).toBeInTheDocument()
            expect(screen.getByPlaceholderText('Search by product name, description or category...')).toBeInTheDocument()
        })
    })
})
