'use client'

import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'

const PRAZO  = new Date('2026-06-11T18:00:00Z') // 15h BRT
const SUMIR  = new Date('2026-06-11T19:00:00Z') // 16h BRT — some depois disso

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function ContadorRegressivo() {
  const [agora, setAgora] = useState<Date | null>(null)

  useEffect(() => {
    setAgora(new Date())
    const id = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Antes de hidratar: não renderiza nada para evitar mismatch
  if (!agora) return null

  // Depois de 16h BRT some completamente
  if (agora >= SUMIR) return null

  // Entre 15h e 16h BRT: mostra aviso de travado
  if (agora >= PRAZO) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3">
        <Lock className="w-4 h-4 text-red-500 shrink-0" />
        <p className="text-red-700 font-bold text-sm">
          Palpites travados — prazo encerrado às 15h
        </p>
      </div>
    )
  }

  // Antes de 15h: contagem regressiva
  const diff   = PRAZO.getTime() - agora.getTime()
  const horas  = Math.floor(diff / 3_600_000)
  const mins   = Math.floor((diff % 3_600_000) / 60_000)
  const segs   = Math.floor((diff % 60_000) / 1_000)

  const urgente = diff < 60 * 60 * 1000 // menos de 1h

  return (
    <div className={`rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 ${
      urgente
        ? 'bg-red-50 border-red-200'
        : 'bg-yellow-50 border-yellow-200'
    }`}>
      <div className="flex items-center gap-2">
        <Lock className={`w-4 h-4 shrink-0 ${urgente ? 'text-red-500' : 'text-yellow-600'}`} />
        <p className={`font-bold text-sm ${urgente ? 'text-red-700' : 'text-yellow-700'}`}>
          Palpites travam às 15h
        </p>
      </div>
      <span className={`font-black text-lg tabular-nums tracking-tight ${
        urgente ? 'text-red-600' : 'text-yellow-700'
      }`}>
        {pad(horas)}:{pad(mins)}:{pad(segs)}
      </span>
    </div>
  )
}
