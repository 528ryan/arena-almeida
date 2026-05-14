import { SELECOES } from '@/lib/selecoes'

export interface ShareCardParams {
  time_a:      string
  time_b:      string
  gols_a:      number
  gols_b:      number
  grupo:       string | null
  fase:        string | null
  data_hora:   string
  nomeUsuario?: string | null
  avatarUrl?:  string | null
}

const W = 600
const H = 300

// ── Carrega imagem com crossOrigin ────────────────────────────────────────
function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// ── URL da bandeira via proxy local ───────────────────────────────────────
function flagProxyUrl(nome: string): string | null {
  const iso = SELECOES[nome]?.iso
  return iso ? `/api/flag?iso=${iso}` : null
}

// ── Retângulo com cantos arredondados ────────────────────────────────────
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// ── Avatar circular ───────────────────────────────────────────────────────
function drawAvatar(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  cx: number, cy: number, r: number,
  initials: string
) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()

  if (img) {
    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2)
  } else {
    ctx.fillStyle = '#009C3B'
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${Math.round(r * 0.9)}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initials.slice(0, 2), cx, cy)
  }

  ctx.restore()

  // Borda do avatar
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
}

// ── Bandeira com fallback de cor ─────────────────────────────────────────
function drawFlag(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  nome: string,
  x: number, y: number, w: number, h: number
) {
  ctx.save()
  roundRect(ctx, x, y, w, h, 4)
  ctx.clip()

  if (img) {
    ctx.drawImage(img, x, y, w, h)
  } else {
    // Fallback: cor principal da seleção
    const cor = SELECOES[nome]?.cor1 ?? '#444'
    ctx.fillStyle = cor
    ctx.fillRect(x, y, w, h)
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = `bold 11px system-ui`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(nome.slice(0, 3).toUpperCase(), x + w / 2, y + h / 2)
  }

  ctx.restore()

  // Borda da bandeira
  ctx.save()
  roundRect(ctx, x, y, w, h, 4)
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.restore()
}

// ── Texto truncado ────────────────────────────────────────────────────────
function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text
  let t = text
  while (ctx.measureText(t + '…').width > maxW && t.length > 1) t = t.slice(0, -1)
  return t + '…'
}

// ── Gerador principal ─────────────────────────────────────────────────────
export async function gerarCardPalpite(p: ShareCardParams): Promise<Blob> {
  // Carrega imagens em paralelo
  const [flagA, flagB, avatar] = await Promise.all([
    flagProxyUrl(p.time_a) ? loadImg(flagProxyUrl(p.time_a)!) : Promise.resolve(null),
    flagProxyUrl(p.time_b) ? loadImg(flagProxyUrl(p.time_b)!) : Promise.resolve(null),
    p.avatarUrl            ? loadImg(p.avatarUrl)              : Promise.resolve(null),
  ])

  const canvas  = document.createElement('canvas')
  canvas.width  = W
  canvas.height = H
  const ctx     = canvas.getContext('2d')!

  // ── Fundo ───────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#002776')
  bg.addColorStop(1, '#001a5c')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Barras decorativas
  ctx.fillStyle = '#FFDF00'
  ctx.fillRect(0, 0, W, 7)
  ctx.fillStyle = '#009C3B'
  ctx.fillRect(0, H - 7, W, 7)

  // ── Cabeçalho ───────────────────────────────────────────────────────────
  ctx.textBaseline = 'alphabetic'

  ctx.font = 'bold 14px system-ui, sans-serif'
  ctx.fillStyle = '#FFDF00'
  ctx.textAlign = 'center'
  ctx.fillText('🏆  ARENA ALMEIDA', W / 2, 36)

  ctx.font = '11px system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.fillText('Copa do Mundo 2026  ·  Meu Palpite', W / 2, 53)

  // Divisor
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(50, 63); ctx.lineTo(W - 50, 63); ctx.stroke()

  // ── Seção de times ──────────────────────────────────────────────────────
  // Layout: [colL=105] ..... [center=300] ..... [colR=495]
  const colL = 105
  const colR = 495
  const FLAG_W = 64, FLAG_H = 44

  // Bandeiras
  drawFlag(ctx, flagA, p.time_a, colL - FLAG_W / 2, 74, FLAG_W, FLAG_H)
  drawFlag(ctx, flagB, p.time_b, colR - FLAG_W / 2, 74, FLAG_W, FLAG_H)

  // Nomes dos times
  ctx.font = 'bold 14px system-ui, sans-serif'
  ctx.fillStyle = '#ffffff'

  ctx.textAlign = 'center'
  ctx.fillText(truncate(ctx, p.time_a.toUpperCase(), 155), colL, 138)
  ctx.fillText(truncate(ctx, p.time_b.toUpperCase(), 155), colR, 138)

  // ── Placar ──────────────────────────────────────────────────────────────
  // Caixa de fundo do placar
  ctx.fillStyle = 'rgba(255,255,255,0.07)'
  roundRect(ctx, 210, 68, 180, 80, 18)
  ctx.fill()

  // Números
  ctx.font = 'bold 64px system-ui, sans-serif'
  ctx.fillStyle = '#FFDF00'

  ctx.textAlign = 'right'
  ctx.fillText(String(p.gols_a), W / 2 - 22, 143)

  ctx.textAlign = 'left'
  ctx.fillText(String(p.gols_b), W / 2 + 22, 143)

  // Separador ×
  ctx.font = 'bold 26px system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.textAlign = 'center'
  ctx.fillText('×', W / 2, 132)

  // Divisor
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(50, 160); ctx.lineTo(W - 50, 160); ctx.stroke()

  // ── Rodapé ──────────────────────────────────────────────────────────────
  const label = p.grupo
    ? `Grupo ${p.grupo}`
    : (p.fase ?? 'Eliminatória')

  const dataStr = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(p.data_hora))

  const initials = (p.nomeUsuario ?? 'U')
    .split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  const AVATAR_R  = 22
  const AVATAR_CX = 50
  const AVATAR_CY = 204

  drawAvatar(ctx, avatar, AVATAR_CX, AVATAR_CY, AVATAR_R, initials)

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  ctx.font = 'bold 13px system-ui, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(
    truncate(ctx, p.nomeUsuario ? `Palpite de ${p.nomeUsuario}` : 'Meu Palpite', 420),
    AVATAR_CX + AVATAR_R + 12, AVATAR_CY - 4
  )

  ctx.font = '11px system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.fillText(`${label}  ·  ${dataStr}`, AVATAR_CX + AVATAR_R + 12, AVATAR_CY + 13)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png')
  })
}

// ── Compartilhar ──────────────────────────────────────────────────────────
export async function compartilharCard(p: ShareCardParams): Promise<'shared' | 'downloaded'> {
  const blob = await gerarCardPalpite(p)
  const file = new File([blob], 'palpite-arena-almeida.png', { type: 'image/png' })

  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Meu palpite — Arena Almeida' })
    return 'shared'
  } else {
    const url = URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href     = url
    a.download = 'palpite-arena-almeida.png'
    a.click()
    URL.revokeObjectURL(url)
    return 'downloaded'
  }
}
