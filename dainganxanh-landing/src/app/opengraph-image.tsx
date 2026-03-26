import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Đại Ngàn Xanh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1a5c2e 0%, #2d8a4e 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'serif',
        }}
      >
        <div style={{ color: '#90ee90', fontSize: 28, marginBottom: 16 }}>🌿</div>
        <h1
          style={{
            color: 'white',
            fontSize: 64,
            margin: 0,
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          Đại Ngàn Xanh
        </h1>
        <p
          style={{
            color: '#b8f0c8',
            fontSize: 28,
            margin: '16px 0 0',
            textAlign: 'center',
          }}
        >
          Gieo một mầm xanh, dệt nên đại ngàn vĩnh cửu
        </p>
        <p
          style={{
            color: '#90ee90',
            fontSize: 20,
            margin: '24px 0 0',
          }}
        >
          dainganxanh.com.vn
        </p>
      </div>
    ),
    { ...size }
  )
}
