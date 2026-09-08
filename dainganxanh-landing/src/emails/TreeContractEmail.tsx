import React from 'react'
import { EmailLayout } from './EmailLayout'

export interface TreeContractEmailProps {
  userName: string
  orderCode: string
  quantity: number
  totalAmount: number
  co2Impact?: number
  contractPdfUrl?: string
  lotName?: string
  treeCodes?: string[]
  dashboardUrl?: string
}

export const TreeContractEmail: React.FC<TreeContractEmailProps> = ({
  userName,
  orderCode,
  quantity,
  totalAmount,
  co2Impact = quantity * 100,
  contractPdfUrl,
  lotName,
  treeCodes = [],
  dashboardUrl = 'https://dainganxanh.com.vn/crm/my-garden',
}) => {
  return (
    <EmailLayout previewText={`Xác nhận hợp đồng đầu tư cây ${orderCode} - Đại Ngàn Xanh`}>
      <h2 style={{ color: '#2d5016', fontSize: '20px', margin: '0 0 16px 0' }}>
        Kính chào Quý khách {userName}! 🎉
      </h2>
      <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: '#4b5563', lineHeight: '1.7' }}>
        Cảm ơn bạn đã tin tưởng đồng hành cùng Đại Ngàn Xanh. Đơn hàng đầu tư cây xanh của bạn đã được thanh toán thành công và hợp đồng điện tử đã được phát hành chính thức.
      </p>

      {/* Summary Box */}
      <div
        style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#2d5016' }}>
          📋 Chi tiết hợp đồng đầu tư
        </h3>
        <table width="100%" style={{ fontSize: '14px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Mã đơn hàng:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>{orderCode}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Số lượng cây:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>{quantity} cây</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Tổng số tiền:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold', color: '#2d5016' }}>
                {totalAmount.toLocaleString('vi-VN')} đ
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Giảm phát thải dự kiến:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>
                ~{co2Impact} kg CO₂/năm
              </td>
            </tr>
            {lotName && (
              <tr>
                <td style={{ padding: '8px 0', color: '#6b7280' }}>Vườn / Lô cây:</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>{lotName}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tree Codes if available */}
      {treeCodes.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #1e3a1e 0%, #2d5016 100%)',
            color: '#ffffff',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#d4edda' }}>
            🌱 Danh sách mã định danh cây của bạn:
          </h3>
          <div>
            {treeCodes.map((code) => (
              <span
                key={code}
                style={{
                  display: 'inline-block',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  margin: '3px',
                }}
              >
                {code}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTAs */}
      <div style={{ textAlign: 'center', margin: '28px 0' }}>
        {contractPdfUrl && (
          <a
            href={contractPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              backgroundColor: '#d97706',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
              textDecoration: 'none',
              margin: '6px',
            }}
          >
            📄 Tải Hợp Đồng (PDF)
          </a>
        )}
        <a
          href={dashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            backgroundColor: '#2d5016',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            textDecoration: 'none',
            margin: '6px',
          }}
        >
          🌳 Xem Vườn Cây Của Bạn
        </a>
      </div>

      <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
        * Hợp đồng điện tử có giá trị pháp lý tương đương hợp đồng giấy theo Luật Giao dịch Điện tử. Bạn có thể yêu cầu gửi bản in giấy có dấu mộc đỏ về tận nhà tại mục Cài đặt trong trang quản trị cá nhân.
      </p>
    </EmailLayout>
  )
}
