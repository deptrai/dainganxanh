import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminStoreOrdersTable, { AdminStoreOrder } from '../AdminStoreOrdersTable'
import { updateStoreOrderStatus } from '@/actions/adminStoreOrders'

jest.mock('@/actions/adminStoreOrders', () => ({
    updateStoreOrderStatus: jest.fn(),
}))

const mockOrders: AdminStoreOrder[] = [
    {
        id: 'order-1',
        code: 'ORD-PENDING-001',
        customer_name: 'Nguyễn Văn A',
        customer_phone: '0901234567',
        customer_email: 'a@example.com',
        shipping_address: '123 Lê Lợi, P. Bến Nghé, Quận 1',
        shipping_province: 'Hồ Chí Minh',
        shipping_note: 'Giao giờ hành chính',
        subtotal: 150000,
        shipping_fee: 0,
        total_amount: 150000,
        payment_method: 'banking',
        payment_ref: 'REF999',
        status: 'pending',
        created_at: '2026-04-10T10:00:00Z',
        store_order_items: [
            {
                id: 'item-1',
                product_id: 'prod-1',
                quantity: 2,
                unit_price: 75000,
                products: {
                    id: 'prod-1',
                    name: 'Mật ong hoa rừng',
                    slug: 'mat-ong-hoa-rung',
                    images: ['/images/honey.jpg'],
                },
            },
        ],
    },
    {
        id: 'order-2',
        code: 'ORD-CONFIRMED-002',
        customer_name: 'Trần Thị B',
        customer_phone: '0987654321',
        shipping_address: '456 Trần Phú, TP Đà Nẵng',
        shipping_province: 'Đà Nẵng',
        subtotal: 300000,
        shipping_fee: 0,
        total_amount: 300000,
        payment_method: 'COD',
        status: 'confirmed',
        created_at: '2026-04-10T11:00:00Z',
        store_order_items: [
            {
                id: 'item-2',
                product_id: 'prod-2',
                quantity: 1,
                unit_price: 300000,
                products: {
                    id: 'prod-2',
                    name: 'Trà ô long',
                    slug: 'tra-o-long',
                },
            },
        ],
    },
    {
        id: 'order-3',
        code: 'ORD-PROCESSING-003',
        customer_name: 'Lê Văn C',
        customer_phone: '0912345678',
        shipping_address: '789 Nguyễn Huệ, Huế',
        subtotal: 500000,
        shipping_fee: 0,
        total_amount: 500000,
        payment_method: 'banking',
        status: 'processing',
        created_at: '2026-04-10T12:00:00Z',
        store_order_items: [],
    },
    {
        id: 'order-4',
        code: 'ORD-SHIPPED-004',
        customer_name: 'Phạm Thị D',
        customer_phone: '0933445566',
        shipping_address: '101 Hai Bà Trưng, Hà Nội',
        subtotal: 250000,
        shipping_fee: 0,
        total_amount: 250000,
        payment_method: 'COD',
        status: 'shipped',
        tracking_number: 'VN-TRACK-888',
        created_at: '2026-04-10T13:00:00Z',
        store_order_items: [],
    },
    {
        id: 'order-5',
        code: 'ORD-DELIVERED-005',
        customer_name: 'Võ Văn E',
        customer_phone: '0944556677',
        shipping_address: '202 Hoàng Diệu, Cần Thơ',
        subtotal: 400000,
        shipping_fee: 0,
        total_amount: 400000,
        payment_method: 'banking',
        status: 'delivered',
        created_at: '2026-04-10T14:00:00Z',
        store_order_items: [],
    },
    {
        id: 'order-6',
        code: 'ORD-CANCELLED-006',
        customer_name: 'Đặng Văn F',
        customer_phone: '0955667788',
        shipping_address: '303 Hùng Vương, Nha Trang',
        subtotal: 100000,
        shipping_fee: 0,
        total_amount: 100000,
        payment_method: 'COD',
        status: 'cancelled',
        cancellation_reason: 'Khách đổi ý',
        created_at: '2026-04-10T15:00:00Z',
        store_order_items: [],
    },
]

describe('AdminStoreOrdersTable', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders empty state when no orders provided', () => {
        render(<AdminStoreOrdersTable orders={[]} />)
        expect(screen.getByText('Chưa có đơn hàng nào')).toBeInTheDocument()
    })

    it('renders table headers and filter tabs', () => {
        render(<AdminStoreOrdersTable orders={mockOrders} currentStatus="pending" />)

        // Filter tab links
        expect(screen.getByRole('link', { name: 'Tất cả' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Chờ xác nhận' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Đã xác nhận' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Đang xử lý' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Đang giao' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Đã giao' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Đã hủy' })).toBeInTheDocument()

        // Table column headers
        expect(screen.getByText('Mã đơn')).toBeInTheDocument()
        expect(screen.getByText('Khách hàng')).toBeInTheDocument()
        expect(screen.getByText('Sản phẩm')).toBeInTheDocument()
        expect(screen.getByText('Tổng tiền')).toBeInTheDocument()
        expect(screen.getByText('Địa chỉ')).toBeInTheDocument()
        expect(screen.getByText('Trạng thái')).toBeInTheDocument()
        expect(screen.getByText('Ngày tạo')).toBeInTheDocument()
        expect(screen.getByText('Thao tác')).toBeInTheDocument()
    })

    it('renders order summary details correctly in table rows', () => {
        render(<AdminStoreOrdersTable orders={mockOrders} />)

        expect(screen.getByText('ORD-PENDING-001')).toBeInTheDocument()
        expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument()
        expect(screen.getByText('0901234567')).toBeInTheDocument()
        expect(screen.getByText('Mật ong hoa rừng (x2)')).toBeInTheDocument()
        expect(screen.getByText('ORD-CONFIRMED-002')).toBeInTheDocument()
        expect(screen.getByText('Trần Thị B')).toBeInTheDocument()
    })

    it('expands and collapses row details on accordion button click', () => {
        render(<AdminStoreOrdersTable orders={[mockOrders[0]]} />)

        const toggleBtn = screen.getByRole('button', { name: 'Xem chi tiết đơn hàng' })
        expect(toggleBtn).toHaveAttribute('aria-expanded', 'false')

        // Details should not be in the document before expansion
        expect(screen.queryByText('Chi tiết sản phẩm (1)')).not.toBeInTheDocument()

        // Click to expand
        fireEvent.click(toggleBtn)
        expect(toggleBtn).toHaveAttribute('aria-expanded', 'true')
        expect(screen.getByText('Chi tiết sản phẩm (1)')).toBeInTheDocument()
        expect(screen.getByText('123 Lê Lợi, P. Bến Nghé, Quận 1')).toBeInTheDocument()
        expect(screen.getByText('Tỉnh/Thành phố: Hồ Chí Minh')).toBeInTheDocument()
        expect(screen.getByText('Ghi chú: Giao giờ hành chính')).toBeInTheDocument()
        expect(screen.getByText('Chuyển khoản ngân hàng')).toBeInTheDocument()
        expect(screen.getByText('Mã GD: REF999')).toBeInTheDocument()

        // Click again to collapse
        fireEvent.click(toggleBtn)
        expect(toggleBtn).toHaveAttribute('aria-expanded', 'false')
        expect(screen.queryByText('Chi tiết sản phẩm (1)')).not.toBeInTheDocument()
    })

    it('renders tracking number and cancellation reason in expanded details when available', () => {
        render(<AdminStoreOrdersTable orders={[mockOrders[3], mockOrders[5]]} />)

        // Expand shipped order
        const expandButtons = screen.getAllByRole('button', { name: 'Xem chi tiết đơn hàng' })
        fireEvent.click(expandButtons[0])
        expect(screen.getByText('Mã vận đơn: VN-TRACK-888')).toBeInTheDocument()

        // Expand cancelled order
        fireEvent.click(expandButtons[1])
        expect(screen.getByText('Khách đổi ý')).toBeInTheDocument()
    })

    describe('Action buttons based on order status', () => {
        beforeEach(() => {
            jest.spyOn(window, 'confirm').mockReturnValue(true)
        })

        afterEach(() => {
            ;(window.confirm as jest.Mock).mockRestore()
        })

        it('pending order: allows confirming order', async () => {
            ;(updateStoreOrderStatus as jest.Mock).mockResolvedValue({ success: true })

            render(<AdminStoreOrdersTable orders={[mockOrders[0]]} />)

            const confirmBtn = screen.getByRole('button', { name: 'Xác nhận đơn' })
            expect(confirmBtn).toBeInTheDocument()
            fireEvent.click(confirmBtn)

            await waitFor(() => {
                expect(updateStoreOrderStatus).toHaveBeenCalledWith('order-1', 'confirmed', undefined)
            })
        })

        it('pending banking order: requires window.confirm before confirming', async () => {
            ;(updateStoreOrderStatus as jest.Mock).mockResolvedValue({ success: true })
            ;(window.confirm as jest.Mock).mockReturnValue(false)

            render(<AdminStoreOrdersTable orders={[mockOrders[0]]} />)

            fireEvent.click(screen.getByRole('button', { name: 'Xác nhận đơn' }))

            expect(window.confirm).toHaveBeenCalledWith(
                'Xác nhận đã nhận thanh toán chuyển khoản cho đơn này?'
            )
            expect(updateStoreOrderStatus).not.toHaveBeenCalled()
        })

        it('pending order: allows canceling with reason', async () => {
            ;(updateStoreOrderStatus as jest.Mock).mockResolvedValue({ success: true })

            render(<AdminStoreOrdersTable orders={[mockOrders[0]]} />)

            // Cancel order modal flow
            const cancelBtn = screen.getByRole('button', { name: 'Hủy đơn' })
            fireEvent.click(cancelBtn)

            // Dialog opens
            expect(screen.getByRole('dialog')).toBeInTheDocument()
            expect(screen.getByText('Hủy đơn hàng #ORD-PENDING-001')).toBeInTheDocument()

            const input = screen.getByPlaceholderText('Nhập lý do hủy...')
            fireEvent.change(input, { target: { value: 'Khách hết nhu cầu' } })

            const confirmCancelBtn = screen.getByRole('button', { name: 'Xác nhận hủy' })
            fireEvent.click(confirmCancelBtn)

            await waitFor(() => {
                expect(updateStoreOrderStatus).toHaveBeenCalledWith('order-1', 'cancelled', {
                    cancellationReason: 'Khách hết nhu cầu',
                })
            })
        })

        it('pending order: canceling with empty reason omits cancellationReason and closes modal on success', async () => {
            ;(updateStoreOrderStatus as jest.Mock).mockResolvedValue({ success: true })

            render(<AdminStoreOrdersTable orders={[mockOrders[0]]} />)

            fireEvent.click(screen.getByRole('button', { name: 'Hủy đơn' }))
            expect(screen.getByRole('dialog')).toBeInTheDocument()

            // Leave the reason empty
            fireEvent.click(screen.getByRole('button', { name: 'Xác nhận hủy' }))

            await waitFor(() => {
                expect(updateStoreOrderStatus).toHaveBeenCalledWith('order-1', 'cancelled', {
                    cancellationReason: undefined,
                })
            })

            // Modal only closes after the action succeeds
            await waitFor(() => {
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
            })
        })

        it('pending order: keeps modal open when cancel action fails', async () => {
            ;(updateStoreOrderStatus as jest.Mock).mockResolvedValue({
                success: false,
                error: 'Trạng thái đơn hàng đã thay đổi',
            })

            render(<AdminStoreOrdersTable orders={[mockOrders[0]]} />)

            fireEvent.click(screen.getByRole('button', { name: 'Hủy đơn' }))
            fireEvent.click(screen.getByRole('button', { name: 'Xác nhận hủy' }))

            await waitFor(() => {
                expect(screen.getByText('Trạng thái đơn hàng đã thay đổi')).toBeInTheDocument()
            })
            expect(screen.getByRole('dialog')).toBeInTheDocument()
        })

        it('confirmed order: allows moving to processing and canceling', async () => {
            ;(updateStoreOrderStatus as jest.Mock).mockResolvedValue({ success: true })

            render(<AdminStoreOrdersTable orders={[mockOrders[1]]} />)

            const processBtn = screen.getByRole('button', { name: 'Bắt đầu xử lý' })
            expect(processBtn).toBeInTheDocument()
            expect(screen.getByRole('button', { name: 'Hủy đơn' })).toBeInTheDocument()

            fireEvent.click(processBtn)

            await waitFor(() => {
                expect(updateStoreOrderStatus).toHaveBeenCalledWith('order-2', 'processing', undefined)
            })
        })

        it('processing order: requires tracking number to ship and does not have cancel button', async () => {
            ;(updateStoreOrderStatus as jest.Mock).mockResolvedValue({ success: true })

            render(<AdminStoreOrdersTable orders={[mockOrders[2]]} />)

            expect(screen.queryByRole('button', { name: 'Hủy đơn' })).not.toBeInTheDocument()

            const shipBtn = screen.getByRole('button', { name: 'Giao hàng' })
            const trackingInput = screen.getByPlaceholderText('Mã vận đơn')

            // Click without tracking number
            fireEvent.click(shipBtn)
            expect(screen.getByText('Vui lòng nhập mã vận đơn')).toBeInTheDocument()
            expect(updateStoreOrderStatus).not.toHaveBeenCalled()

            // Enter tracking number and click ship
            fireEvent.change(trackingInput, { target: { value: 'VN123456789' } })
            fireEvent.click(shipBtn)

            await waitFor(() => {
                expect(updateStoreOrderStatus).toHaveBeenCalledWith('order-3', 'shipped', {
                    trackingNumber: 'VN123456789',
                })
            })
        })

        it('shipped order: allows completing to delivered and does not have cancel button', async () => {
            ;(updateStoreOrderStatus as jest.Mock).mockResolvedValue({ success: true })

            render(<AdminStoreOrdersTable orders={[mockOrders[3]]} />)

            expect(screen.queryByRole('button', { name: 'Hủy đơn' })).not.toBeInTheDocument()

            const completeBtn = screen.getByRole('button', { name: 'Hoàn tất' })
            fireEvent.click(completeBtn)

            await waitFor(() => {
                expect(updateStoreOrderStatus).toHaveBeenCalledWith('order-4', 'delivered', undefined)
            })
        })

        it('delivered and cancelled orders: are terminal and show no action buttons', () => {
            render(<AdminStoreOrdersTable orders={[mockOrders[4], mockOrders[5]]} />)

            expect(screen.queryByRole('button', { name: 'Xác nhận đơn' })).not.toBeInTheDocument()
            expect(screen.queryByRole('button', { name: 'Bắt đầu xử lý' })).not.toBeInTheDocument()
            expect(screen.queryByRole('button', { name: 'Giao hàng' })).not.toBeInTheDocument()
            expect(screen.queryByRole('button', { name: 'Hoàn tất' })).not.toBeInTheDocument()
            expect(screen.queryByRole('button', { name: 'Hủy đơn' })).not.toBeInTheDocument()
        })

        it('displays error banner when action returns failure', async () => {
            ;(updateStoreOrderStatus as jest.Mock).mockResolvedValue({
                success: false,
                error: 'Trạng thái đơn hàng đã thay đổi',
            })

            render(<AdminStoreOrdersTable orders={[mockOrders[0]]} />)

            const confirmBtn = screen.getByRole('button', { name: 'Xác nhận đơn' })
            fireEvent.click(confirmBtn)

            await waitFor(() => {
                expect(screen.getByText('Trạng thái đơn hàng đã thay đổi')).toBeInTheDocument()
            })

            // Dismiss error banner
            const closeBtn = screen.getByRole('button', { name: 'Đóng thông báo lỗi' })
            fireEvent.click(closeBtn)
            expect(screen.queryByText('Trạng thái đơn hàng đã thay đổi')).not.toBeInTheDocument()
        })
    })
})
