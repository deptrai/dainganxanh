/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import StoreSuccessPage from '../page'
import { notFound } from 'next/navigation'

const mockMaybeSingle = jest.fn()
const mockEq = jest.fn()
const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockRpc = jest.fn().mockResolvedValue({ data: 1, error: null })

jest.mock('next/navigation', () => ({
  notFound: jest.fn().mockImplementation(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: () => ({
    from: mockFrom,
    rpc: mockRpc,
  }),
}))

describe('StoreSuccessPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle })
  })

  it('triggers notFound if code searchParam is missing', async () => {
    const searchParams = Promise.resolve({})
    await expect(StoreSuccessPage({ searchParams })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })

  it('triggers notFound if order does not exist in DB', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const searchParams = Promise.resolve({ code: 'STNOTFOUND' })
    await expect(StoreSuccessPage({ searchParams })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })

  it('renders "Chờ xác nhận" for COD order with pending status', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'ord-1',
        code: 'ST123456',
        status: 'pending',
        customer_name: 'Nguyễn Văn A',
        total_amount: 500000,
        payment_method: 'cod',
        created_at: new Date().toISOString(),
      },
      error: null,
    })

    const searchParams = Promise.resolve({ code: 'ST123456' })
    const element = await StoreSuccessPage({ searchParams })
    render(element as React.ReactElement)

    expect(screen.getByText('Đặt hàng thành công!')).toBeInTheDocument()
    expect(screen.getByText('ST123456')).toBeInTheDocument()
    expect(screen.getByText('Chờ xác nhận')).toBeInTheDocument()
    expect(screen.getByText('COD')).toBeInTheDocument()
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument()
    expect(screen.getByText('500.000đ')).toBeInTheDocument()
  })

  it('renders "Đơn hàng đang chờ thanh toán" for banking order still pending', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'ord-4',
        code: 'STPEND1',
        status: 'pending',
        customer_name: 'Phạm Thị D',
        total_amount: 420000,
        payment_method: 'banking',
        created_at: new Date().toISOString(),
      },
      error: null,
    })

    const searchParams = Promise.resolve({ code: 'STPEND1' })
    const element = await StoreSuccessPage({ searchParams })
    render(element as React.ReactElement)

    expect(screen.getByText('Đơn hàng đang chờ thanh toán')).toBeInTheDocument()
    expect(screen.getByText('Chờ xác nhận')).toBeInTheDocument()
    expect(screen.queryByText('Thanh toán thành công!')).not.toBeInTheDocument()
  })

  it('renders "Đơn hàng đã bị hủy" for cancelled banking order', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'ord-5',
        code: 'STCANCEL',
        status: 'cancelled',
        customer_name: 'Phạm Thị D',
        total_amount: 420000,
        payment_method: 'banking',
        created_at: new Date().toISOString(),
      },
      error: null,
    })

    const searchParams = Promise.resolve({ code: 'STCANCEL' })
    const element = await StoreSuccessPage({ searchParams })
    render(element as React.ReactElement)

    expect(screen.getByText('Đơn hàng đã bị hủy')).toBeInTheDocument()
    expect(screen.queryByText('Thanh toán thành công!')).not.toBeInTheDocument()
  })

  it('renders "Đơn hàng đã bị hủy" (not success) for a cancelled COD order', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'ord-cod-cancel',
        code: 'STCODCAN',
        status: 'cancelled',
        customer_name: 'Nguyễn Thị H',
        total_amount: 500000,
        payment_method: 'cod',
        cancellation_reason: 'Admin cancelled',
        created_at: new Date().toISOString(),
      },
      error: null,
    })

    const searchParams = Promise.resolve({ code: 'STCODCAN' })
    const element = await StoreSuccessPage({ searchParams })
    render(element as React.ReactElement)

    expect(screen.getByText('Đơn hàng đã bị hủy')).toBeInTheDocument()
    expect(screen.queryByText('Đặt hàng thành công!')).not.toBeInTheDocument()
  })

  it('renders raw status as fallback for unknown/custom status', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'ord-2',
        code: 'STUNKNOWN',
        status: 'custom_state',
        customer_name: 'Trần Thị B',
        total_amount: 300000,
        payment_method: 'cod',
        created_at: new Date().toISOString(),
      },
      error: null,
    })

    const searchParams = Promise.resolve({ code: 'STUNKNOWN' })
    const element = await StoreSuccessPage({ searchParams })
    render(element as React.ReactElement)

    expect(screen.getByText('custom_state')).toBeInTheDocument()
  })

  it('renders "Đã xác nhận" for confirmed banking order', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'ord-3',
        code: 'STBANK12',
        status: 'confirmed',
        customer_name: 'Lê Văn C',
        total_amount: 750000,
        payment_method: 'banking',
        created_at: new Date().toISOString(),
      },
      error: null,
    })

    const searchParams = Promise.resolve({ code: 'STBANK12' })
    const element = await StoreSuccessPage({ searchParams })
    render(element as React.ReactElement)

    expect(screen.getByText('Thanh toán thành công!')).toBeInTheDocument()
    expect(screen.getByText('Đã xác nhận')).toBeInTheDocument()
    expect(screen.getByText('Chuyển khoản')).toBeInTheDocument()
  })

  it('renders "Đơn hàng đã hết hạn" and reorder button with product slug when cancelled due to timeout', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'ord-6',
        code: 'STEXPIRE1',
        status: 'cancelled',
        customer_name: 'Nguyễn Văn E',
        total_amount: 500000,
        payment_method: 'banking',
        cancellation_reason: 'Payment timeout (15 mins)',
        expires_at: new Date(Date.now() - 300000).toISOString(),
        created_at: new Date(Date.now() - 1200000).toISOString(),
        store_order_items: [
          {
            product_id: 'prod-1',
            products: { slug: 'vong-tay-tram-huong' },
          },
        ],
      },
      error: null,
    })

    const searchParams = Promise.resolve({ code: 'STEXPIRE1' })
    const element = await StoreSuccessPage({ searchParams })
    render(element as React.ReactElement)

    expect(screen.getByText('Đơn hàng đã hết hạn')).toBeInTheDocument()
    // Status chip reflects the expired state, not the raw cancelled status
    expect(screen.getByText('Hết hạn')).toBeInTheDocument()
    const reorderLink = screen.getByRole('link', { name: 'Đặt hàng lại' })
    expect(reorderLink).toBeInTheDocument()
    expect(reorderLink).toHaveAttribute('href', '/store/vong-tay-tram-huong')
  })

  it('renders "Đơn hàng đã hết hạn" and reorder button with fallback /store when pending order is overdue', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'ord-7',
        code: 'STEXPIRE2',
        status: 'pending',
        customer_name: 'Hoàng Văn F',
        total_amount: 300000,
        payment_method: 'banking',
        expires_at: new Date(Date.now() - 60000).toISOString(),
        created_at: new Date(Date.now() - 960000).toISOString(),
        store_order_items: [],
      },
      error: null,
    })

    const searchParams = Promise.resolve({ code: 'STEXPIRE2' })
    const element = await StoreSuccessPage({ searchParams })
    render(element as React.ReactElement)

    expect(screen.getByText('Đơn hàng đã hết hạn')).toBeInTheDocument()
    const reorderLink = screen.getByRole('link', { name: 'Đặt hàng lại' })
    expect(reorderLink).toBeInTheDocument()
    expect(reorderLink).toHaveAttribute('href', '/store')
    // Lazily expires the pending order so reserved stock frees before a reorder
    expect(mockRpc).toHaveBeenCalledWith('expire_pending_store_orders')
  })

  it('renders "Đơn hàng đã bị hủy" and no reorder button when cancelled for reason other than timeout', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'ord-8',
        code: 'STCANCEL2',
        status: 'cancelled',
        customer_name: 'Đỗ Thị G',
        total_amount: 450000,
        payment_method: 'banking',
        cancellation_reason: 'Khách yêu cầu đổi sản phẩm',
        created_at: new Date().toISOString(),
        store_order_items: [
          {
            product_id: 'prod-2',
            products: { slug: 'tinh-dau-tram' },
          },
        ],
      },
      error: null,
    })

    const searchParams = Promise.resolve({ code: 'STCANCEL2' })
    const element = await StoreSuccessPage({ searchParams })
    render(element as React.ReactElement)

    expect(screen.getByText('Đơn hàng đã bị hủy')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Đặt hàng lại' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tiếp tục mua sắm' })).toBeInTheDocument()
  })
})
