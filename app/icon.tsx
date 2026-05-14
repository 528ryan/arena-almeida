import { ImageResponse } from 'next/og'

export const size        = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #002776 0%, #001a5c 100%)',
          borderRadius: '7px',
        }}
      >
        {/* Faixa verde no topo */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '4px', background: '#009C3B', borderRadius: '7px 7px 0 0',
          display: 'flex',
        }} />
        {/* Faixa amarela na base */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '4px', background: '#FFDF00', borderRadius: '0 0 7px 7px',
          display: 'flex',
        }} />
        <span style={{ fontSize: 18, lineHeight: 1 }}>🏆</span>
      </div>
    ),
    { ...size },
  )
}
