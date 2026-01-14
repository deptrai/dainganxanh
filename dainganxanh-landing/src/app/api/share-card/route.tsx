import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const context = searchParams.get('context') || 'purchase'
    const trees = searchParams.get('trees') || '1'
    const months = searchParams.get('months') || '0'
    const userName = searchParams.get('userName') || 'Người dùng'
    const refCode = searchParams.get('refCode') || ''

    const co2Impact = parseInt(trees) * 20

    let title = ''
    let subtitle = ''

    switch (context) {
      case 'purchase':
        title = `${userName} đã trồng ${trees} cây! 🌳`
        subtitle = `Hấp thụ ~${co2Impact}kg CO₂/năm`
        break
      case 'progress':
        title = `Cây của ${userName} đã ${months} tháng tuổi! 🌲`
        subtitle = 'Đang lớn mạnh từng ngày'
        break
      case 'harvest':
        title = `${userName} sắp thu hoạch trầm hương! 🎉`
        subtitle = 'Sau 5 năm chăm sóc'
        break
      default:
        title = `${userName} đã tham gia Đại Ngàn Xanh! 🌳`
        subtitle = 'Cùng bảo vệ rừng Việt Nam'
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            backgroundImage: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 40,
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontWeight: 'bold',
                color: 'white',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              }}
            >
              🌳 Đại Ngàn Xanh
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              borderRadius: 24,
              padding: '60px 80px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              maxWidth: '80%',
            }}
          >
            <div
              style={{
                fontSize: 52,
                fontWeight: 'bold',
                color: '#1f2937',
                textAlign: 'center',
                marginBottom: 20,
                lineHeight: 1.2,
              }}
            >
              {title}
            </div>

            <div
              style={{
                fontSize: 32,
                color: '#10b981',
                textAlign: 'center',
                marginBottom: 40,
              }}
            >
              {subtitle}
            </div>

            {refCode && (
              <div
                style={{
                  fontSize: 24,
                  color: '#6b7280',
                  fontFamily: 'monospace',
                  backgroundColor: '#f3f4f6',
                  padding: '12px 24px',
                  borderRadius: 12,
                }}
              >
                Mã giới thiệu: {refCode}
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 40,
              fontSize: 24,
              color: 'white',
              opacity: 0.9,
            }}
          >
            dainganxanh.com.vn
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('Share card generation error:', error)
    return new Response('Failed to generate share card', { status: 500 })
  }
}
