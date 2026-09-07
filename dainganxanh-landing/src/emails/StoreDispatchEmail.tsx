import React from 'react'
import { EmailLayout } from './EmailLayout'

export interface StoreOrderItemDisplay {
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface StoreDispatchEmailProps {
  customerName: string
  orderCode: string
  carrier?: string
  trackingCode?: string
  shippingAddress: string
  shippingProvince: string
  recipientPhone?: string
  items: StoreOrderItemDisplay[]
  subtotal: number
  shippingFee: number
  totalAmount: number
  supportPhone?: string
}

export const StoreDispatchEmail: React.FC<StoreDispatchEmailProps> = ({
  customerName,
  orderCode,
  carrier = 'Giao Hàng Tiết Kiệm (GHTK)',
  trackingCode = 'Đang cập nhật',
  shippingAddress,
  shippingProvince,
  recipientPhone,
  items,
  subtotal,
  shippingFee,
  totalAmount,
  supportPhone = '1900 8888',
}) => {
  return (
    <EmailLayout previewText={`Đơn hàng ${orderCode} của bạn đã được gửi đi - Đại Ngàn Xanh Store`}>
      <h2 style={{ color: '#2d5016', fontSize: '20px', margin: '0 0 16px 0' }}>
        Kính chào Quý khách {customerName}! 📦
      </h2>
      <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: '#4b5563', lineHeight: '1.7' }}>
        Đơn hàng Trầm Hương <strong>{orderCode}</strong> của bạn đã được đóng gói cẩn thận và bàn giao cho đơn vị vận chuyển.
      </p>

      {/* Shipping details box */}
      <div
        style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#1d4ed8' }}>
          🚚 Thông tin vận chuyển
        </h3>
        <table width="100%" style={{ fontSize: '14px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '6px 0', color: '#4b5563' }}>Đơn vị vận chuyển:</td>
              <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 'bold' }}>{carrier}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px 0', color: '#4b5563' }}>Mã vận đơn:</td>
              <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', color: '#1d4ed8' }}>
                {trackingCode}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 0', color: '#4b5563' }}>Thời gian dự kiến:</td>
              <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>
                2-4 ngày làm việc
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 0', color: '#4b5563' }}>Địa chỉ nhận hàng:</td>
              <td style={{ padding: '6px 0', textAlign: 'right', color: '#374151' }}>
                {shippingAddress}, {shippingProvince}
              </td>
            </tr>
            {recipientPhone && (
              <tr>
                <td style={{ padding: '6px 0', color: '#4b5563' }}>Số điện thoại người nhận:</td>
                <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 'bold', color: '#374151' }}>
                  {recipientPhone}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Itemized Order Table */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#2d5016' }}>
          📋 Chi tiết sản phẩm trong kiện hàng
        </h3>
        <table
          width="100%"
          style={{
            fontSize: '13px',
            borderCollapse: 'collapse',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
              <th style={{ padding: '10px 12px' }}>Sản phẩm</th>
              <th style={{ padding: '10px 8px', textAlign: 'center' }}>SL</th>
              <th style={{ padding: '10px 8px', textAlign: 'right' }}>Đơn giá</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#374151' }}>{item.name}</td>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ padding: '10px 8px', textAlign: 'right', color: '#6b7280' }}>
                  {item.unitPrice.toLocaleString('vi-VN')} đ
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold' }}>
                  {item.lineTotal.toLocaleString('vi-VN')} đ
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ padding: '8px 12px', textAlign: 'right', color: '#6b7280' }}>
                Tạm tính:
              </td>
              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 'bold' }}>
                {subtotal.toLocaleString('vi-VN')} đ
              </td>
            </tr>
            <tr>
              <td colSpan={3} style={{ padding: '6px 12px', textAlign: 'right', color: '#6b7280' }}>
                Phí giao hàng:
              </td>
              <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 'bold', color: shippingFee === 0 ? '#059669' : '#374151' }}>
                {shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')} đ`}
              </td>
            </tr>
            <tr style={{ backgroundColor: '#f9fafb', borderTop: '2px solid #e5e7eb' }}>
              <td colSpan={3} style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#1f2937', fontSize: '14px' }}>
                Tổng cộng:
              </td>
              <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#2d5016', fontSize: '16px' }}>
                {totalAmount.toLocaleString('vi-VN')} đ
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
        Quý khách vui lòng kiểm tra tình trạng bao bì và mã vận đơn khi nhận hàng. Nếu có bất kỳ thắc mắc nào, xin vui lòng gọi hotline <strong>{supportPhone}</strong> để được hỗ trợ tức thời.
      </p>
    </EmailLayout>
  )
}
