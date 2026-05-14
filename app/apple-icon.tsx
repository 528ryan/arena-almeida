import { ImageResponse } from 'next/og'

export const size        = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
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
          gap: 6,
        }}
      >
        {/* Faixa verde no topo */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '10px', background: '#009C3B',
          display: 'flex',
        }} />
        {/* Faixa amarela na base */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '10px', background: '#FFDF00',
          display: 'flex',
        }} />

        <span style={{ fontSize: 80, lineHeight: 1 }}>🏆</span>

        <span style={{
          color: '#FFDF00',
          fontSize: 26,
          fontWeight: 900,
          letterSpacing: 2,
          fontFamily: 'sans-serif',
        }}>
          ARENA
        </span>
        <span style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 3,
          fontFamily: 'sans-serif',
          marginTop: -4,
        }}>
          ALMEIDA
        </span>
      </div>
    ),
    { ...size },
  )
}
