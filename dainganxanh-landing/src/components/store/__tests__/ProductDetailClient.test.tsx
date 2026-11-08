import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { ProductDetailClient, type Product, type RelatedProduct } from '../ProductDetailClient'

const pushMock = jest.fn()
jest.mock('@/i18n/navigation', () => {
  const React = require('react')
  return {
    Link: React.forwardRef(({ href, children, ...rest }: any, ref: any) =>
      React.createElement('a', { href, ref, ...rest }, children)
    ),
    useRouter: () => ({
      push: pushMock,
    }),
    usePathname: () => '/',
  }
})

const baseProduct: Product = {
  id: 'prod-1',
  name: 'Nước hoa trầm hương Hoàng Gia',
  slug: 'nuoc-hoa-tram-huong-hoang-gia',
  description: 'Mùi hương quý phái chiết xuất từ trầm tự nhiên lâu năm.',
  price: 1200000,
  compare_at_price: 1500000,
  stock_quantity: 5,
  sku: 'NH-HG-50',
  images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
  specifications: {
    'Dung tích': '50ml',
    'Nồng độ': 'Eau de Parfum',
  },
  origin_type: 'dainganxanh_harvest',
  batch_certificate_url: 'https://example.com/cert.pdf',
  product_categories: { id: 'cat-1', name: 'Nước hoa', slug: 'nuoc-hoa' },
  lots: { id: 'lot-1', name: 'Vườn Đắk Lắk', region: 'Tây Nguyên' },
}

const baseRelated: RelatedProduct[] = [
  {
    id: 'rel-1',
    name: 'Tinh dầu trầm tự nhiên',
    slug: 'tinh-dau-tram-tu-nhien',
    price: 800000,
    compare_at_price: null,
    stock_quantity: 10,
    images: ['https://example.com/rel1.jpg'],
    product_categories: { name: 'Tinh dầu' },
  },
]

function renderProductDetail(overrides: {
  product?: Partial<Product>
  related?: RelatedProduct[]
} = {}) {
  const product = { ...baseProduct, ...overrides.product } as Product
  const related = overrides.related ?? baseRelated
  return renderWithIntl(<ProductDetailClient product={product} related={related} />)
}

describe('ProductDetailClient', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  describe('HAPPY_PATH', () => {
    it('renders all product info, specifications, and related products', () => {
      renderProductDetail()

      // Header navigation
      expect(screen.getByRole('link', { name: /Quay lại cửa hàng/i })).toHaveAttribute('href', '/store')

      // Main product info
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Nước hoa trầm hương Hoàng Gia')
      expect(screen.getByText('Nước hoa')).toBeInTheDocument()
      expect(screen.getByText(/1\.200\.000/)).toBeInTheDocument()
      expect(screen.getByText(/1\.500\.000/)).toBeInTheDocument()
      expect(screen.getByText('Thu hoạch từ vườn Đại Ngàn Xanh')).toBeInTheDocument()
      expect(screen.getByText(/Vườn Đắk Lắk — Tây Nguyên/i)).toBeInTheDocument()
      expect(screen.getByText('Mùi hương quý phái chiết xuất từ trầm tự nhiên lâu năm.')).toBeInTheDocument()
      expect(screen.getByText('SKU: NH-HG-50')).toBeInTheDocument()
      expect(screen.getByText('Còn 5 sản phẩm')).toBeInTheDocument()

      // Specifications table
      expect(screen.getByRole('heading', { name: /Thông số kỹ thuật/i })).toBeInTheDocument()
      expect(screen.getByText('Dung tích')).toBeInTheDocument()
      expect(screen.getByText('50ml')).toBeInTheDocument()
      expect(screen.getByText('Nồng độ')).toBeInTheDocument()
      expect(screen.getByText('Eau de Parfum')).toBeInTheDocument()

      // Related products
      expect(screen.getByRole('heading', { name: /Sản phẩm liên quan/i })).toBeInTheDocument()
      expect(screen.getByText('Tinh dầu trầm tự nhiên')).toBeInTheDocument()
      expect(screen.getByText('Tinh dầu')).toBeInTheDocument()
      expect(screen.getByText(/800\.000/)).toBeInTheDocument()
    })
  })

  describe('NO_IMAGES fallback', () => {
    it('renders emoji fallback 🌿 when images is an empty array', () => {
      renderProductDetail({ product: { images: [] } })

      expect(screen.getByText('🌿')).toBeInTheDocument()
      // No thumbnail buttons should be rendered
      expect(screen.queryByRole('button', { name: /Ảnh/i })).not.toBeInTheDocument()
    })

    it('renders emoji fallback 🌿 when images is null', () => {
      renderProductDetail({ product: { images: null } })

      expect(screen.getByText('🌿')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Ảnh/i })).not.toBeInTheDocument()
    })

    it('renders main image without thumbnails when images has only 1 URL', () => {
      renderProductDetail({ product: { images: ['https://example.com/single.jpg'] } })

      const img = screen.getByAltText('Nước hoa trầm hương Hoàng Gia')
      expect(img).toHaveAttribute('src', 'https://example.com/single.jpg')
      expect(screen.queryByRole('button', { name: /Ảnh/i })).not.toBeInTheDocument()
    })
  })

  describe('MULTI_IMAGES gallery switch', () => {
    it('renders thumbnails and switches active image when a thumbnail is clicked', () => {
      renderProductDetail({
        product: {
          images: [
            'https://example.com/img1.jpg',
            'https://example.com/img2.jpg',
            'https://example.com/img3.jpg',
          ],
        },
      })

      const mainImg = screen.getByAltText('Nước hoa trầm hương Hoàng Gia')
      expect(mainImg).toHaveAttribute('src', 'https://example.com/img1.jpg')

      const thumb2 = screen.getByRole('button', { name: 'Ảnh 2' })
      fireEvent.click(thumb2)
      expect(mainImg).toHaveAttribute('src', 'https://example.com/img2.jpg')

      const thumb3 = screen.getByRole('button', { name: 'Ảnh 3' })
      fireEvent.click(thumb3)
      expect(mainImg).toHaveAttribute('src', 'https://example.com/img3.jpg')
    })
  })

  describe('COMPARE_PRICE display', () => {
    it('shows compare_at_price with line-through when compare_at_price > price', () => {
      renderProductDetail({
        product: {
          price: 500000,
          compare_at_price: 700000,
        },
      })

      expect(screen.getByText(/500\.000/)).toBeInTheDocument()
      const originalPrice = screen.getByText(/700\.000/)
      expect(originalPrice).toBeInTheDocument()
      expect(originalPrice).toHaveClass('line-through')
    })

    it('does not show compare price when compare_at_price is null', () => {
      const { container } = renderProductDetail({
        product: {
          price: 500000,
          compare_at_price: null,
        },
      })

      expect(screen.getByText(/500\.000/)).toBeInTheDocument()
      expect(container.querySelector('.line-through')).not.toBeInTheDocument()
    })

    it('does not show compare price when compare_at_price <= price', () => {
      renderProductDetail({
        product: {
          price: 500000,
          compare_at_price: 450000,
        },
      })

      expect(screen.getByText(/500\.000/)).toBeInTheDocument()
      expect(screen.queryByText(/450\.000/)).not.toBeInTheDocument()
    })
  })

  describe('NULL_SPECS guard', () => {
    it('does not render specifications section and does not crash when specifications is null', () => {
      renderProductDetail({ product: { specifications: null } })

      expect(screen.queryByRole('heading', { name: /Thông số kỹ thuật/i })).not.toBeInTheDocument()
    })

    it('does not render specifications section when specifications is an empty object', () => {
      renderProductDetail({ product: { specifications: {} } })

      expect(screen.queryByRole('heading', { name: /Thông số kỹ thuật/i })).not.toBeInTheDocument()
    })
  })

  describe('OUT_OF_STOCK handling', () => {
    it('renders out-of-stock badge, disables quantity selector and buy button', () => {
      renderProductDetail({ product: { stock_quantity: 0 } })

      expect(screen.getByText('Hết hàng', { selector: 'span' })).toBeInTheDocument()

      const minusBtn = screen.getByRole('button', { name: 'Giảm số lượng' })
      const plusBtn = screen.getByRole('button', { name: 'Tăng số lượng' })
      expect(minusBtn).toBeDisabled()
      expect(plusBtn).toBeDisabled()

      const buyBtn = screen.getByRole('button', { name: /Hết hàng/i })
      expect(buyBtn).toBeDisabled()

      fireEvent.click(buyBtn)
      expect(pushMock).not.toHaveBeenCalled()
    })
  })

  describe('QTY_CHANGE boundaries', () => {
    it('disables Minus button at min boundary (qty = 1) and updates within limits', () => {
      renderProductDetail({ product: { stock_quantity: 3 } })

      const minusBtn = screen.getByRole('button', { name: 'Giảm số lượng' })
      const plusBtn = screen.getByRole('button', { name: 'Tăng số lượng' })

      // Initially at 1: Minus disabled, Plus enabled
      expect(screen.getByText('1', { selector: 'span.w-12' })).toBeInTheDocument()
      expect(minusBtn).toBeDisabled()
      expect(plusBtn).not.toBeDisabled()

      // Increase to 2
      fireEvent.click(plusBtn)
      expect(screen.getByText('2', { selector: 'span.w-12' })).toBeInTheDocument()
      expect(minusBtn).not.toBeDisabled()
      expect(plusBtn).not.toBeDisabled()

      // Increase to 3 (stock_quantity limit)
      fireEvent.click(plusBtn)
      expect(screen.getByText('3', { selector: 'span.w-12' })).toBeInTheDocument()
      expect(minusBtn).not.toBeDisabled()
      expect(plusBtn).toBeDisabled()

      // Cannot increase beyond 3
      fireEvent.click(plusBtn)
      expect(screen.getByText('3', { selector: 'span.w-12' })).toBeInTheDocument()

      // Decrease back to 2
      fireEvent.click(minusBtn)
      expect(screen.getByText('2', { selector: 'span.w-12' })).toBeInTheDocument()
      expect(plusBtn).not.toBeDisabled()

      // Decrease back to 1
      fireEvent.click(minusBtn)
      expect(screen.getByText('1', { selector: 'span.w-12' })).toBeInTheDocument()
      expect(minusBtn).toBeDisabled()
    })

    it('caps max quantity at 10 even when stock_quantity is larger than 10', () => {
      renderProductDetail({ product: { stock_quantity: 20 } })

      const plusBtn = screen.getByRole('button', { name: 'Tăng số lượng' })

      for (let i = 1; i < 10; i++) {
        fireEvent.click(plusBtn)
      }

      expect(screen.getByText('10', { selector: 'span.w-12' })).toBeInTheDocument()
      expect(plusBtn).toBeDisabled()
    })
  })

  describe('BUY_NOW flow', () => {
    it('redirects to checkout with slug and selected quantity, and shows loading state', () => {
      renderProductDetail({ product: { slug: 'nuoc-hoa-tram-huong-hoang-gia', stock_quantity: 5 } })

      const plusBtn = screen.getByRole('button', { name: 'Tăng số lượng' })
      const minusBtn = screen.getByRole('button', { name: 'Giảm số lượng' })
      fireEvent.click(plusBtn) // qty = 2

      const buyBtn = screen.getByRole('button', { name: /Mua ngay/i })
      fireEvent.click(buyBtn)

      expect(pushMock).toHaveBeenCalledTimes(1)
      expect(pushMock).toHaveBeenCalledWith('/store/checkout?slug=nuoc-hoa-tram-huong-hoang-gia&quantity=2')

      // Second rapid click should not re-trigger push
      fireEvent.click(buyBtn)
      expect(pushMock).toHaveBeenCalledTimes(1)

      // Should show loading text and be disabled while navigating
      expect(screen.getByText(/Đang chuyển đến thanh toán.../i)).toBeInTheDocument()
      expect(buyBtn).toBeDisabled()
      expect(plusBtn).toBeDisabled()
      expect(minusBtn).toBeDisabled()
    })
  })

  describe('RELATED_EMPTY & related products display', () => {
    it('does not render related products section when related is empty', () => {
      renderProductDetail({ related: [] })

      expect(screen.queryByRole('heading', { name: /Sản phẩm liên quan/i })).not.toBeInTheDocument()
    })

    it('renders related products with category array format and fallback image', () => {
      const customRelated: RelatedProduct[] = [
        {
          id: 'rel-2',
          name: 'Nụ trầm cao cấp',
          slug: 'nu-tram-cao-cap',
          price: 350000,
          compare_at_price: null,
          stock_quantity: 15,
          images: [],
          product_categories: [{ name: 'Nụ trầm' }],
        },
      ]

      renderProductDetail({ related: customRelated })

      expect(screen.getByRole('heading', { name: /Sản phẩm liên quan/i })).toBeInTheDocument()
      expect(screen.getByText('Nụ trầm cao cấp')).toBeInTheDocument()
      expect(screen.getByText('Nụ trầm')).toBeInTheDocument()
      expect(screen.getByText(/350\.000/)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Nụ trầm cao cấp/i })).toHaveAttribute(
        'href',
        '/store/nu-tram-cao-cap'
      )
      expect(screen.getByText('🌿')).toBeInTheDocument()
    })

    it('handles optional props smoothly when lots or sku are null', () => {
      renderProductDetail({ product: { lots: null, sku: null } })
      expect(screen.queryByText(/Xuất xứ:/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/SKU:/i)).not.toBeInTheDocument()
    })

    it('disables both Minus and Plus on single item stock (stock_quantity = 1)', () => {
      renderProductDetail({ product: { stock_quantity: 1 } })
      expect(screen.getByRole('button', { name: 'Giảm số lượng' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Tăng số lượng' })).toBeDisabled()
    })

    it('renders correctly when related prop is omitted (undefined)', () => {
      const product = { ...baseProduct }
      renderWithIntl(<ProductDetailClient product={product} />)
      expect(screen.queryByRole('heading', { name: /Sản phẩm liên quan/i })).not.toBeInTheDocument()
    })

    it('does not render origin badge when origin_type is unmapped or returns null', () => {
      const { container } = renderProductDetail({ product: { origin_type: JSON.parse('"unknown_origin"') } })
      expect(container.querySelector('.lucide-shield')).not.toBeInTheDocument()
    })
  })

  describe('review patches', () => {
    it('resets state when product.id changes (rerender)', () => {
      const productA = { ...baseProduct, id: 'a', images: ['a1.jpg', 'a2.jpg'], stock_quantity: 5 }
      const { rerender } = renderWithIntl(
        <ProductDetailClient product={productA} related={[]} />
      )
      // đổi số lượng và chọn ảnh thứ 2
      const plusBtn = screen.getByRole('button', { name: 'Tăng số lượng' })
      fireEvent.click(plusBtn)
      expect(screen.getByText('2')).toBeInTheDocument()
      const thumb2 = screen.getByRole('button', { name: 'Ảnh 2' })
      fireEvent.click(thumb2)
      // rerender với product khác id → state phải reset
      const productB = { ...baseProduct, id: 'b', name: 'Sản phẩm B', images: ['b1.jpg'], stock_quantity: 5 }
      rerender(<ProductDetailClient product={productB} related={[]} />)
      expect(screen.getByText('Sản phẩm B')).toBeInTheDocument()
      // qty về 1 (span aria-live hiển thị số lượng)
      const qtySpan = screen.getByText('1', { selector: 'span.font-semibold' })
      expect(qtySpan).toBeInTheDocument()
      // không còn thumbnail vì images chỉ 1 phần tử
      expect(screen.queryByRole('button', { name: 'Ảnh 2' })).not.toBeInTheDocument()
    })

    it('renders nested object/array spec values via JSON.stringify', () => {
      renderProductDetail({
        product: {
          specifications: {
            'Kích thước': { 'Dài': '10cm' },
            'Thành phần': ['Trầm hương', 'Dầu dừa'],
            'Độ ẩm': null as string | null | undefined as never,
          } as never,
        },
      })
      // nested object → JSON.stringify
      expect(screen.getByText('{"Dài":"10cm"}')).toBeInTheDocument()
      // array → join(', ')
      expect(screen.getByText('Trầm hương, Dầu dừa')).toBeInTheDocument()
      // null → '—'
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('does not render specs section when specifications is an array', () => {
      renderProductDetail({ product: { specifications: ['a', 'b'] as never } })
      expect(screen.queryByText('Thông số kỹ thuật')).not.toBeInTheDocument()
    })

    it('negative stock renders Hết hàng and disables controls', () => {
      renderProductDetail({ product: { stock_quantity: -1 } })
      expect(screen.getByRole('button', { name: 'Giảm số lượng' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Tăng số lượng' })).toBeDisabled()
      const buyBtn = screen.getByRole('button', { name: /Hết hàng|Mua ngay/i })
      expect(buyBtn).toBeDisabled()
    })

    it('disables quantity buttons while buying', () => {
      pushMock.mockImplementation(() => new Promise(() => {}))
      renderProductDetail({ product: { stock_quantity: 5 } })
      const buyBtn = screen.getByRole('button', { name: /Mua ngay/i })
      fireEvent.click(buyBtn)
      expect(screen.getByRole('button', { name: 'Giảm số lượng' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Tăng số lượng' })).toBeDisabled()
      pushMock.mockReset()
    })
  })
})
