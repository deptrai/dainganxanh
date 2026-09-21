import { renderToStaticMarkup } from 'react-dom/server'
import { TreeContractEmail } from '../TreeContractEmail'
import { EcoStayVoucherEmail } from '../EcoStayVoucherEmail'
import { StoreDispatchEmail } from '../StoreDispatchEmail'

describe('Email Templates — Rendering & Content Verification', () => {
  test('TreeContractEmail renders tree contract details and download CTA', () => {
    const html = renderToStaticMarkup(
      <TreeContractEmail
        userName="Nguyễn Văn Đại"
        orderCode="DH123456"
        quantity={5}
        totalAmount={1300000}
        co2Impact={500}
        contractPdfUrl="https://example.com/contract.pdf"
        lotName="Lô Dó Đen A1 - Gia Lai"
        treeCodes={['TREE-001', 'TREE-002', 'TREE-003', 'TREE-004', 'TREE-005']}
      />
    )

    expect(html).toContain('Nguyễn Văn Đại')
    expect(html).toContain('DH123456')
    expect(html).toContain('5 cây')
    expect(html).toContain('1.300.000')
    expect(html).toContain('500 kg CO₂/năm')
    expect(html).toContain('Lô Dó Đen A1 - Gia Lai')
    expect(html).toContain('TREE-001')
    expect(html).toContain('Tải Hợp Đồng (PDF)')
    expect(html).toContain('Xem Vườn Cây Của Bạn')
  })

  test('EcoStayVoucherEmail renders booking voucher, dates, and check-in rules', () => {
    const html = renderToStaticMarkup(
      <EcoStayVoucherEmail
        guestName="Trần Thị Lan"
        bookingCode="BK987654"
        roomName="Bungalow Hương Rừng"
        gardenName="Vườn Trầm Đại Ngàn Ba Vì"
        gardenAddress="Xã Vân Hòa, Ba Vì, Hà Nội"
        checkInDate="2026-10-01"
        checkOutDate="2026-10-04"
        nightsCount={3}
        guestsCount={2}
        totalAmount={150000}
      />
    )

    expect(html).toContain('Trần Thị Lan')
    expect(html).toContain('BK987654')
    expect(html).toContain('Bungalow Hương Rừng')
    expect(html).toContain('Vườn Trầm Đại Ngàn Ba Vì')
    expect(html).toContain('Xã Vân Hòa, Ba Vì, Hà Nội')
    expect(html).toContain('01/10/2026')
    expect(html).toContain('04/10/2026')
    expect(html).toContain('3 đêm')
    expect(html).toContain('2 khách')
    expect(html).toContain('150.000')
    expect(html).toContain('14:00')
    expect(html).toContain('12:00')
    expect(html).toContain('Xem Vé Offline')
    expect(html).toContain('href="https://dainganxanh.com.vn/eco-tourism/voucher/BK987654"')
  })

  test('StoreDispatchEmail renders dispatch tracking and itemized table', () => {
    const html = renderToStaticMarkup(
      <StoreDispatchEmail
        customerName="Lê Văn Hùng"
        orderCode="ST555555"
        carrier="Giao Hàng Tiết Kiệm (GHTK)"
        trackingCode="GHTK-99887766"
        shippingAddress="123 Phố Huế, Phường Hàng Bài"
        shippingProvince="Hà Nội"
        subtotal={100000}
        shippingFee={30000}
        totalAmount={130000}
        items={[
          {
            name: 'Nhang Trầm Tự Nhiên',
            quantity: 2,
            unitPrice: 50000,
            lineTotal: 100000,
          },
        ]}
      />
    )

    expect(html).toContain('Lê Văn Hùng')
    expect(html).toContain('ST555555')
    expect(html).toContain('Giao Hàng Tiết Kiệm (GHTK)')
    expect(html).toContain('GHTK-99887766')
    expect(html).toContain('123 Phố Huế, Phường Hàng Bài')
    expect(html).toContain('Hà Nội')
    expect(html).toContain('Nhang Trầm Tự Nhiên')
    expect(html).toContain('100.000')
    expect(html).toContain('30.000')
    expect(html).toContain('130.000')
    expect(html).toContain('2-4 ngày làm việc')
  })
})
