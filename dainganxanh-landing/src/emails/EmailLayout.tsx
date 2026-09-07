import React from 'react'

export interface EmailLayoutProps {
  previewText?: string
  children: React.ReactNode
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({ previewText, children }) => {
  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      </head>
      <body
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          lineHeight: 1.6,
          color: '#1f2937',
          backgroundColor: '#f3f4f6',
          margin: 0,
          padding: '24px 0',
        }}
      >
      {previewText && (
        <div
          style={{
            display: 'none',
            fontSize: '1px',
            color: '#f3f4f6',
            lineHeight: '1px',
            maxHeight: 0,
            maxWidth: 0,
            opacity: 0,
            overflow: 'hidden',
          }}
        >
          {previewText}
        </div>
      )}

      <table
        align="center"
        border={0}
        cellPadding={0}
        cellSpacing={0}
        width="100%"
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header */}
        <tbody>
          <tr>
            <td
              style={{
                background: 'linear-gradient(135deg, #1e3a1e 0%, #2d5016 50%, #4a7c2c 100%)',
                backgroundColor: '#2d5016',
                padding: '36px 24px',
                textAlign: 'center',
              }}
            >
              <h1
                style={{
                  margin: '0 0 6px 0',
                  color: '#ffffff',
                  fontSize: '26px',
                  fontWeight: 'bold',
                  letterSpacing: '0.5px',
                }}
              >
                🌳 Đại Ngàn Xanh
              </h1>
              <p
                style={{
                  margin: 0,
                  color: '#d4edda',
                  fontSize: '14px',
                  letterSpacing: '0.3px',
                }}
              >
                Gieo Hạt Lành, Gặt Phước Báu
              </p>
            </td>
          </tr>

          {/* Main Content */}
          <tr>
            <td style={{ padding: '32px 28px' }}>{children}</td>
          </tr>

          {/* Footer */}
          <tr>
            <td
              style={{
                backgroundColor: '#f9fafb',
                padding: '24px',
                textAlign: 'center',
                borderTop: '1px solid #e5e7eb',
                fontSize: '13px',
                color: '#6b7280',
              }}
            >
              <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#374151' }}>
                Công ty Cổ phần Đại Ngàn Xanh Group
              </p>
              <p style={{ margin: '0 0 6px 0' }}>
                Hotline hỗ trợ: <strong>1900 8888</strong> | Email: <strong>hotro@dainganxanh.com.vn</strong>
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>
                © 2026 Đại Ngàn Xanh. Mọi quyền được bảo lưu. Email này được gửi tự động, vui lòng không trả lời trực tiếp.
              </p>
            </td>
          </tr>
        </tbody>
      </table>
      </body>
    </html>
  )
}
