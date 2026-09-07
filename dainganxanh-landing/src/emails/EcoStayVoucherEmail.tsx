import React from 'react'
import { EmailLayout } from './EmailLayout'

export interface EcoStayVoucherEmailProps {
  guestName: string
  bookingCode: string
  roomName: string
  gardenName?: string
  gardenAddress?: string
  checkInDate: string
  checkOutDate: string
  nightsCount: number
  guestsCount: number
  totalAmount: number
  voucherUrl?: string
}

function formatDateVN(dateStr: string): string {
  if (!dateStr) return ''
  const [dayPart] = dateStr.split('T')
  const [y, m, d] = dayPart.split('-')
  if (y && m && d) {
    return `${d}/${m}/${y}`
  }
  return dateStr
}

export const EcoStayVoucherEmail: React.FC<EcoStayVoucherEmailProps> = ({
  guestName,
  bookingCode,
  roomName,
  gardenName = 'Khu Nghỉ Dưỡng Sinh Thái Đại Ngàn Xanh',
  gardenAddress = 'Thôn Hợp Nhất, Xã Ba Vì, TP. Hà Nội',
  checkInDate,
  checkOutDate,
  nightsCount,
  guestsCount,
  totalAmount,
  voucherUrl = `https://dainganxanh.com.vn/eco-tourism/voucher/${bookingCode}`,
}) => {
  return (
    <EmailLayout previewText={`Voucher xác nhận đặt phòng ${bookingCode} - ${roomName}`}>
      <h2 style={{ color: '#2d5016', fontSize: '20px', margin: '0 0 16px 0' }}>
        Kính chào Quý khách {guestName}! 🏡
      </h2>
      <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: '#4b5563', lineHeight: '1.7' }}>
        Yêu cầu đặt phòng của bạn tại <strong>{gardenName}</strong> đã được thanh toán thành công và xác nhận chính thức. Dưới đây là thông tin chi tiết voucher nghỉ dưỡng của bạn.
      </p>

      {/* Voucher Box */}
      <div
        style={{
          border: '2px dashed #059669',
          backgroundColor: '#f0fdf4',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <div style={{ textAlign: 'center', borderBottom: '1px dashed #a7f3d0', paddingBottom: '16px', marginBottom: '16px' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#047857', textTransform: 'uppercase', letterSpacing: '1px' }}>
            VOUCHER NGHỈ DƯỠNG SINH THÁI
          </p>
          <h3 style={{ margin: 0, fontSize: '24px', color: '#065f46', fontFamily: 'monospace', letterSpacing: '2px' }}>
            {bookingCode}
          </h3>
        </div>

        <table width="100%" style={{ fontSize: '14px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 0', color: '#374151' }}>Hạng phòng:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold', color: '#065f46' }}>{roomName}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#374151' }}>Địa điểm:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>{gardenName}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280', fontSize: '12px' }}>Địa chỉ:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', color: '#4b5563', fontSize: '12px' }}>{gardenAddress}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#374151' }}>Ngày nhận phòng:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>{formatDateVN(checkInDate)} (từ 14:00)</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#374151' }}>Ngày trả phòng:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>{formatDateVN(checkOutDate)} (trước 12:00)</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#374151' }}>Thời gian lưu trú:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>{nightsCount} đêm</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#374151' }}>Số lượng khách:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>{guestsCount} khách</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#374151', borderTop: '1px solid #d1fae5' }}>Đã thanh toán:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold', color: '#047857', fontSize: '16px', borderTop: '1px solid #d1fae5' }}>
                {totalAmount.toLocaleString('vi-VN')} đ
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#374151' }}>Phương thức:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>Chuyển khoản</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Guidelines Box */}
      <div
        style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          fontSize: '13px',
          color: '#4b5563',
          lineHeight: '1.6',
        }}
      >
        <strong style={{ color: '#1f2937' }}>📌 Hướng dẫn khi nhận phòng:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
          <li>Xuất trình mã voucher <strong>{bookingCode}</strong> và CCCD/Hộ chiếu tại quầy lễ tân vườn.</li>
          <li>Giờ nhận phòng: từ <strong>14:00</strong> | Giờ trả phòng: trước <strong>12:00</strong>.</li>
          <li>Nếu cần hỗ trợ đón hoặc nhận phòng muộn, vui lòng liên hệ hotline: <strong>1900 8888</strong>.</li>
        </ul>
      </div>

      <div style={{ textAlign: 'center', margin: '28px 0' }}>
        <a
          href={voucherUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            backgroundColor: '#059669',
            color: '#ffffff',
            padding: '12px 28px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '15px',
            textDecoration: 'none',
          }}
        >
          🎫 Xem Vé Offline
        </a>
      </div>
    </EmailLayout>
  )
}
