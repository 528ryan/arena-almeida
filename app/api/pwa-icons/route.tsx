import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const size = Math.min(512, Math.max(32, Number(request.nextUrl.searchParams.get('size') ?? 192)))
  const bar  = Math.round(size * 0.055)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #002776 0%, #001a5c 100%)',
          gap: Math.round(size * 0.033),
        }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: `${bar}px`, background: '#009C3B', display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: `${bar}px`, background: '#FFDF00', display: 'flex',
        }} />

        <span style={{ fontSize: Math.round(size * 0.44), lineHeight: 1 }}>🏆</span>

        <span style={{
          color: '#FFDF00',
          fontSize: Math.round(size * 0.145),
          fontWeight: 900,
          letterSpacing: Math.round(size * 0.011),
          fontFamily: 'sans-serif',
          marginTop: Math.round(size * 0.01),
        }}>
          ARENA
        </span>

        <span style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: Math.round(size * 0.078),
          fontWeight: 600,
          letterSpacing: Math.round(size * 0.017),
          fontFamily: 'sans-serif',
          marginTop: -Math.round(size * 0.022),
        }}>
          ALMEIDA
        </span>
      </div>
    ),
    { width: size, height: size },
  )
}
