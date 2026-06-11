'use client'

import { useState, useEffect } from 'react'
import { X, Share } from 'lucide-react'

export default function IOSInstallBanner() {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isStandalone =
      ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true) ||
      window.matchMedia('(display-mode: standalone)').matches
    const dispensado = sessionStorage.getItem('ios-banner-dispensado')

    if (isIOS && !isStandalone && !dispensado) {
      // Pequeno delay para não aparecer antes da página carregar
      const t = setTimeout(() => setVisivel(true), 1500)
      return () => clearTimeout(t)
    }
  }, [])

  function dispensar() {
    sessionStorage.setItem('ios-banner-dispensado', '1')
    setVisivel(false)
  }

  if (!visivel) return null

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 bg-[#002776] text-white rounded-2xl shadow-2xl px-4 py-3 flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm leading-tight mb-0.5">Instale o Arena Almeida</p>
        <p className="text-xs text-white/70 leading-snug flex items-center gap-1 flex-wrap">
          Toque em
          <span className="inline-flex items-center gap-0.5 bg-white/15 rounded px-1 py-0.5 font-semibold">
            <Share className="w-3 h-3" /> Compartilhar
          </span>
          e depois em
          <span className="bg-white/15 rounded px-1 py-0.5 font-semibold">
            Adicionar à Tela de Início
          </span>
        </p>
      </div>
      <button
        onClick={dispensar}
        className="shrink-0 w-7 h-7 rounded-full bg-white/15 flex items-center justify-center active:bg-white/25 mt-0.5"
        aria-label="Fechar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
