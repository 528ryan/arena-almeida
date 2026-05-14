import { NextRequest, NextResponse } from 'next/server'

// Proxy para flagcdn.com — evita CORS ao desenhar bandeiras no Canvas
export async function GET(req: NextRequest) {
  const iso = req.nextUrl.searchParams.get('iso') ?? ''
  if (!/^[a-z-]{2,6}$/.test(iso)) {
    return new NextResponse('Invalid', { status: 400 })
  }

  try {
    const res = await fetch(`https://flagcdn.com/w80/${iso}.png`)
    if (!res.ok) return new NextResponse('Not found', { status: 404 })

    const buf = await res.arrayBuffer()
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=604800, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return new NextResponse('Error', { status: 502 })
  }
}
