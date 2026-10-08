import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { StoreCheckoutClient } from '../StoreCheckoutClient'
import { VN_PROVINCES } from '@/lib/constants/provinces'

const pushMock = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

const mockProduct = {
  id: 'prod-1',
  name: 'Vòng tay Trầm Hương 108 hạt',
  slug: 'vong-tay-tram-huong-108-hat',
  price: 200000,
  stock_quantity: 10,
  images: ['https://example.com/vong-tram.jpg'],
}

describe('StoreCheckoutClient', () => {
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    jest.clearAllMocks()
    originalFetch = global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  describe('PROVINCES', () => {
    it('renders all 63 provinces from VN_PROVINCES plus placeholder option in order', () => {
      render(<StoreCheckoutClient product={mockProduct} quantity={1} />)

      const select = screen.getByLabelText(/Tỉnh \/ Thành phố/i) as HTMLSelectElement
      expect(select).toBeInTheDocument()

      const options = Array.from(select.options)
      expect(options).toHaveLength(64) // 1 placeholder + 63 provinces
      expect(options[0].value).toBe('')
      expect(options[0].text).toBe('Chọn tỉnh/thành phố')

      expect(options[1].value).toBe('Hà Giang')
      expect(options[options.length - 1].value).toBe('Cà Mau')

      VN_PROVINCES.forEach((province, index) => {
        expect(options[index + 1].value).toBe(province)
        expect(options[index + 1].text).toBe(province)
      })
    })
  })

  describe('PREFILL', () => {
    it('prefills customer_name and customer_email when prefill prop is provided for logged-in user', () => {
      render(
        <StoreCheckoutClient
          product={mockProduct}
          quantity={1}
          prefill={{ name: 'Nguyễn Văn B', email: 'b@example.com' }}
        />
      )

      const nameInput = screen.getByLabelText(/Họ và tên/i) as HTMLInputElement
      const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement
      const phoneInput = screen.getByLabelText(/Số điện thoại/i) as HTMLInputElement

      expect(nameInput.value).toBe('Nguyễn Văn B')
      expect(emailInput.value).toBe('b@example.com')
      expect(phoneInput.value).toBe('') // phone stays empty

      // User can still edit prefilled fields
      fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn C' } })
      expect(nameInput.value).toBe('Nguyễn Văn C')
    })

    it('renders empty form without crashing when prefill is undefined (guest)', () => {
      render(<StoreCheckoutClient product={mockProduct} quantity={1} />)

      const nameInput = screen.getByLabelText(/Họ và tên/i) as HTMLInputElement
      const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement
      const phoneInput = screen.getByLabelText(/Số điện thoại/i) as HTMLInputElement
      const addressInput = screen.getByLabelText(/Địa chỉ giao hàng/i) as HTMLTextAreaElement
      const provinceSelect = screen.getByLabelText(/Tỉnh \/ Thành phố/i) as HTMLSelectElement

      expect(nameInput.value).toBe('')
      expect(emailInput.value).toBe('')
      expect(phoneInput.value).toBe('')
      expect(addressInput.value).toBe('')
      expect(provinceSelect.value).toBe('')
    })
  })

  describe('VALIDATION', () => {
    it('shows inline errors and prevents submit when required fields are missing', async () => {
      const fetchMock = jest.fn()
      global.fetch = fetchMock

      render(<StoreCheckoutClient product={mockProduct} quantity={1} />)

      const submitBtn = screen.getByRole('button', { name: /Đặt hàng/i })
      fireEvent.click(submitBtn)

      expect(fetchMock).not.toHaveBeenCalled()

      expect(screen.getByText('Vui lòng nhập họ và tên')).toBeInTheDocument()
      expect(screen.getByText('Vui lòng nhập số điện thoại')).toBeInTheDocument()
      expect(screen.getByText('Vui lòng nhập địa chỉ giao hàng')).toBeInTheDocument()
      expect(screen.getByText('Vui lòng chọn tỉnh/thành phố')).toBeInTheDocument()

      expect(screen.getByLabelText(/Họ và tên/i)).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByLabelText(/Số điện thoại/i)).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByLabelText(/Địa chỉ giao hàng/i)).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByLabelText(/Tỉnh \/ Thành phố/i)).toHaveAttribute('aria-invalid', 'true')
    })

    it('blocks submit with inline error when phone number format does not match ^0\\d{9}$', async () => {
      const fetchMock = jest.fn()
      global.fetch = fetchMock

      render(
        <StoreCheckoutClient
          product={mockProduct}
          quantity={1}
          prefill={{ name: 'Trần Văn D', email: 'd@example.com' }}
        />
      )

      fireEvent.change(screen.getByLabelText(/Địa chỉ giao hàng/i), { target: { value: '123 Đường Láng' } })
      fireEvent.change(screen.getByLabelText(/Tỉnh \/ Thành phố/i), { target: { value: 'Hà Nội' } })

      const phoneInput = screen.getByLabelText(/Số điện thoại/i)
      const submitBtn = screen.getByRole('button', { name: /Đặt hàng/i })

      // Case 1: too short
      fireEvent.change(phoneInput, { target: { value: '0912345' } })
      fireEvent.click(submitBtn)
      expect(fetchMock).not.toHaveBeenCalled()
      expect(screen.getByText(/Số điện thoại không hợp lệ/i)).toBeInTheDocument()
      expect(phoneInput).toHaveAttribute('aria-invalid', 'true')

      // Case 2: 11 digits
      fireEvent.change(phoneInput, { target: { value: '09123456789' } })
      fireEvent.click(submitBtn)
      expect(fetchMock).not.toHaveBeenCalled()
      expect(screen.getByText(/Số điện thoại không hợp lệ/i)).toBeInTheDocument()

      // Case 3: does not start with 0
      fireEvent.change(phoneInput, { target: { value: '1234567890' } })
      fireEvent.click(submitBtn)
      expect(fetchMock).not.toHaveBeenCalled()
      expect(screen.getByText(/Số điện thoại không hợp lệ/i)).toBeInTheDocument()

      // Case 4: contains non-digits
      fireEvent.change(phoneInput, { target: { value: '091234567a' } })
      fireEvent.click(submitBtn)
      expect(fetchMock).not.toHaveBeenCalled()
      expect(screen.getByText(/Số điện thoại không hợp lệ/i)).toBeInTheDocument()
    })

    it('clears inline errors when valid input is typed', async () => {
      render(<StoreCheckoutClient product={mockProduct} quantity={1} />)

      const submitBtn = screen.getByRole('button', { name: /Đặt hàng/i })
      fireEvent.click(submitBtn)

      expect(screen.getByText('Vui lòng nhập họ và tên')).toBeInTheDocument()

      const nameInput = screen.getByLabelText(/Họ và tên/i)
      fireEvent.change(nameInput, { target: { value: 'Lê Văn E' } })
      expect(screen.queryByText('Vui lòng nhập họ và tên')).not.toBeInTheDocument()
    })
  })

  describe('PRICE_SUMMARY & FREESHIP', () => {
    it('charges standard shipping fee of 30,000đ when subtotal is below 500,000đ threshold', () => {
      // 200,000 * 2 = 400,000 < 500,000
      render(<StoreCheckoutClient product={mockProduct} quantity={2} />)

      expect(screen.getByText('400.000đ')).toBeInTheDocument() // subtotal
      expect(screen.getByText('30.000đ')).toBeInTheDocument() // shipping fee
      expect(screen.getByText('430.000đ')).toBeInTheDocument() // total
    })

    it('grants free shipping when subtotal reaches 500,000đ threshold', () => {
      // 200,000 * 3 = 600,000 >= 500,000
      render(<StoreCheckoutClient product={mockProduct} quantity={3} />)

      expect(screen.getByText('Miễn phí')).toBeInTheDocument() // free shipping
      // Total equals subtotal (600.000đ), which appears twice (subtotal and total)
      const matchingAmounts = screen.getAllByText('600.000đ')
      expect(matchingAmounts).toHaveLength(2)
    })
  })

  describe('HAPPY_PATH', () => {
    it('submits order with banking payment method and transitions to payment step', async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          orderId: 'ord-123',
          orderCode: 'STABC123',
          totalAmount: 230000,
          paymentMethod: 'banking',
          expiresAt: null,
        }),
      })
      global.fetch = fetchMock

      render(
        <StoreCheckoutClient
          product={mockProduct}
          quantity={1}
          prefill={{ name: 'Hoàng Nam', email: 'nam@example.com' }}
        />
      )

      fireEvent.change(screen.getByLabelText(/Số điện thoại/i), { target: { value: '0987654321' } })
      fireEvent.change(screen.getByLabelText(/Địa chỉ giao hàng/i), { target: { value: '12 Nguyễn Trãi' } })
      fireEvent.change(screen.getByLabelText(/Tỉnh \/ Thành phố/i), { target: { value: 'Hà Nội' } })

      fireEvent.click(screen.getByRole('button', { name: /Đặt hàng/i }))

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/store/orders/create',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"customer_phone":"0987654321"'),
          })
        )
      })

      // Should transition to payment step
      await waitFor(() => {
        expect(screen.getByText('Thanh toán chuyển khoản')).toBeInTheDocument()
        expect(screen.getByText('STABC123')).toBeInTheDocument()
        expect(screen.getByAltText('QR thanh toán')).toBeInTheDocument()
      })
    })

    it('submits order with COD payment method and transitions to cod-confirm step', async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          orderId: 'ord-456',
          orderCode: 'STCOD999',
          totalAmount: 230000,
          paymentMethod: 'cod',
          expiresAt: null,
        }),
      })
      global.fetch = fetchMock

      render(
        <StoreCheckoutClient
          product={mockProduct}
          quantity={1}
          prefill={{ name: 'Phạm Hương', email: 'huong@example.com' }}
        />
      )

      fireEvent.change(screen.getByLabelText(/Số điện thoại/i), { target: { value: '0901234567' } })
      fireEvent.change(screen.getByLabelText(/Địa chỉ giao hàng/i), { target: { value: '45 Lê Duẩn' } })
      fireEvent.change(screen.getByLabelText(/Tỉnh \/ Thành phố/i), { target: { value: 'Đà Nẵng' } })

      // Select COD
      fireEvent.click(screen.getByRole('button', { name: /COD/i }))

      fireEvent.click(screen.getByRole('button', { name: /Đặt hàng/i }))

      await waitFor(() => {
        expect(screen.getByText('Đặt hàng thành công!')).toBeInTheDocument()
        expect(screen.getByText('STCOD999')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Xem xác nhận đơn hàng/i })).toBeInTheDocument()
      })
    })
  })

  describe('ERROR_CASE', () => {
    it('displays error message and stays on form step when API returns 409 (out of stock)', async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Sản phẩm không đủ tồn kho' }),
      })
      global.fetch = fetchMock

      render(
        <StoreCheckoutClient
          product={mockProduct}
          quantity={1}
          prefill={{ name: 'Đỗ Minh', email: 'minh@example.com' }}
        />
      )

      fireEvent.change(screen.getByLabelText(/Số điện thoại/i), { target: { value: '0912345678' } })
      fireEvent.change(screen.getByLabelText(/Địa chỉ giao hàng/i), { target: { value: '78 Hai Bà Trưng' } })
      fireEvent.change(screen.getByLabelText(/Tỉnh \/ Thành phố/i), { target: { value: 'Hồ Chí Minh' } })

      fireEvent.click(screen.getByRole('button', { name: /Đặt hàng/i }))

      await waitFor(() => {
        expect(screen.getByText('Sản phẩm không đủ tồn kho')).toBeInTheDocument()
      })

      // Form remains visible
      expect(screen.getByRole('button', { name: /Đặt hàng/i })).toBeInTheDocument()
    })

    it('displays error message and stays on form step when API returns 500', async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Lỗi hệ thống khi tạo đơn hàng' }),
      })
      global.fetch = fetchMock

      render(
        <StoreCheckoutClient
          product={mockProduct}
          quantity={1}
          prefill={{ name: 'Đỗ Minh', email: 'minh@example.com' }}
        />
      )

      fireEvent.change(screen.getByLabelText(/Số điện thoại/i), { target: { value: '0912345678' } })
      fireEvent.change(screen.getByLabelText(/Địa chỉ giao hàng/i), { target: { value: '78 Hai Bà Trưng' } })
      fireEvent.change(screen.getByLabelText(/Tỉnh \/ Thành phố/i), { target: { value: 'Hồ Chí Minh' } })

      fireEvent.click(screen.getByRole('button', { name: /Đặt hàng/i }))

      await waitFor(() => {
        expect(screen.getByText('Lỗi hệ thống khi tạo đơn hàng')).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /Đặt hàng/i })).toBeInTheDocument()
    })

    it('displays error message and stays on form step when API returns 429', async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' }),
      })
      global.fetch = fetchMock

      render(
        <StoreCheckoutClient
          product={mockProduct}
          quantity={1}
          prefill={{ name: 'Đỗ Minh', email: 'minh@example.com' }}
        />
      )

      fireEvent.change(screen.getByLabelText(/Số điện thoại/i), { target: { value: '0912345678' } })
      fireEvent.change(screen.getByLabelText(/Địa chỉ giao hàng/i), { target: { value: '78 Hai Bà Trưng' } })
      fireEvent.change(screen.getByLabelText(/Tỉnh \/ Thành phố/i), { target: { value: 'Hồ Chí Minh' } })

      fireEvent.click(screen.getByRole('button', { name: /Đặt hàng/i }))

      await waitFor(() => {
        expect(screen.getByText('Quá nhiều yêu cầu. Vui lòng thử lại sau.')).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /Đặt hàng/i })).toBeInTheDocument()
    })
  })

  describe('FIELD VALIDATION', () => {
    it('blocks submit and focuses the email field when email is invalid', async () => {
      const fetchMock = jest.fn()
      global.fetch = fetchMock

      render(<StoreCheckoutClient product={mockProduct} quantity={1} />)
      fireEvent.change(screen.getByLabelText(/Họ và tên/i), { target: { value: 'Nguyễn Văn A' } })
      fireEvent.change(screen.getByLabelText(/Số điện thoại/i), { target: { value: '0912345678' } })
      fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'not-an-email' } })
      fireEvent.change(screen.getByLabelText(/Địa chỉ giao hàng/i), { target: { value: '78 Hai Bà Trưng' } })
      fireEvent.change(screen.getByLabelText(/Tỉnh \/ Thành phố/i), { target: { value: 'Hồ Chí Minh' } })

      fireEvent.click(screen.getByRole('button', { name: /Đặt hàng/i }))

      expect(await screen.findByText('Email không hợp lệ')).toBeInTheDocument()
      expect(fetchMock).not.toHaveBeenCalled()
      expect(document.activeElement).toBe(screen.getByLabelText(/Email/i))
    })

    it('trims whitespace from all text fields before submitting', async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          orderId: 'o1',
          orderCode: 'STABC123',
          totalAmount: 230000,
          paymentMethod: 'cod',
          expiresAt: null,
        }),
      })
      global.fetch = fetchMock

      render(<StoreCheckoutClient product={mockProduct} quantity={1} />)
      fireEvent.change(screen.getByLabelText(/Họ và tên/i), { target: { value: '  Nguyễn Văn A  ' } })
      fireEvent.change(screen.getByLabelText(/Số điện thoại/i), { target: { value: ' 0912345678 ' } })
      fireEvent.change(screen.getByLabelText(/Địa chỉ giao hàng/i), { target: { value: ' 78 Hai Bà Trưng ' } })
      fireEvent.change(screen.getByLabelText(/Tỉnh \/ Thành phố/i), { target: { value: 'Hồ Chí Minh' } })
      fireEvent.click(screen.getByRole('button', { name: /Đặt hàng/i }))

      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      const body = JSON.parse(fetchMock.mock.calls[0][1].body)
      expect(body.customer_name).toBe('Nguyễn Văn A')
      expect(body.customer_phone).toBe('0912345678')
      expect(body.shipping_address).toBe('78 Hai Bà Trưng')
    })
  })

  describe('POLLING', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })
    afterEach(() => {
      jest.useRealTimers()
    })

    const submitBankingOrder = async (orderOverrides = {}) => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          orderId: 'o1',
          orderCode: 'STABC123',
          totalAmount: 230000,
          paymentMethod: 'banking',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          ...orderOverrides,
        }),
      })
      global.fetch = fetchMock

      render(<StoreCheckoutClient product={mockProduct} quantity={1} />)
      fireEvent.change(screen.getByLabelText(/Họ và tên/i), { target: { value: 'Nguyễn Văn A' } })
      fireEvent.change(screen.getByLabelText(/Số điện thoại/i), { target: { value: '0912345678' } })
      fireEvent.change(screen.getByLabelText(/Địa chỉ giao hàng/i), { target: { value: '78 Hai Bà Trưng' } })
      fireEvent.change(screen.getByLabelText(/Tỉnh \/ Thành phố/i), { target: { value: 'Hồ Chí Minh' } })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Đặt hàng/i }))
      })
      expect(screen.getByText('Thanh toán chuyển khoản')).toBeInTheDocument()
      return fetchMock
    }

    it('transitions to confirmed and redirects when status returns confirmed', async () => {
      const fetchMock = await submitBankingOrder()
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ status: 'confirmed' }) })

      await act(async () => {
        jest.advanceTimersByTime(5000)
      })
      expect(screen.getByText('Thanh toán thành công!')).toBeInTheDocument()

      await act(async () => {
        jest.advanceTimersByTime(2000)
      })
      expect(pushMock).toHaveBeenCalledWith('/store/checkout/success?code=STABC123&total=230000')
    })

    it('shows expired notice and stops polling when status returns expired', async () => {
      const fetchMock = await submitBankingOrder()
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ status: 'expired' }) })

      await act(async () => {
        jest.advanceTimersByTime(5000)
      })
      expect(screen.getByText('Đơn hàng đã hết hạn thanh toán')).toBeInTheDocument()
      // QR and bank details must not stay payable after expiry
      expect(screen.queryByAltText('QR thanh toán')).not.toBeInTheDocument()
      expect(screen.queryByText('Số tài khoản')).not.toBeInTheDocument()

      fetchMock.mockClear()
      await act(async () => {
        jest.advanceTimersByTime(10000)
      })
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('shows expired notice and stops polling when status returns cancelled', async () => {
      const fetchMock = await submitBankingOrder()
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ status: 'cancelled' }) })

      await act(async () => {
        jest.advanceTimersByTime(5000)
      })
      expect(screen.getByText('Đơn hàng đã hết hạn thanh toán')).toBeInTheDocument()

      fetchMock.mockClear()
      await act(async () => {
        jest.advanceTimersByTime(10000)
      })
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('shows countdown remaining from expiresAt', async () => {
      const expiresAt = new Date(Date.now() + 14 * 60 * 1000).toISOString()
      await submitBankingOrder({ expiresAt })
      expect(screen.getByText(/Đang chờ xác nhận\.\.\. \(còn \d+ phút \d+ giây\)/)).toBeInTheDocument()
    })
  })
})
