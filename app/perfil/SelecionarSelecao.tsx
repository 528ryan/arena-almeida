'use client'

import { useState, useTransition } from 'react'
import { X, ChevronDown, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LISTA_SELECOES } from '@/lib/selecoes'
import FlagImg from '@/app/components/FlagImg'
import { atualizarSelecao } from '@/app/actions/perfil'

interface Props {
  selecaoAtual: string | null
  corAcento: string
  textoAcento: 'branco' | 'escuro'
}

export default function SelecionarSelecao({ selecaoAtual, corAcento, textoAcento }: Props) {
  const [aberto, setAberto]          = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function selecionar(nome: string | null) {
    startTransition(async () => {
      await atualizarSelecao(nome)
      setAberto(false)
      router.refresh()
    })
  }

  const atual = selecaoAtual ? LISTA_SELECOES.find(s => s.nome === selecaoAtual) : null

  return (
    <>
      {/* Botão exibindo a seleção atual */}
      <button
        type="button"
        onClick={() => setAberto(true)}
        disabled={isPending}
        className="flex items-center gap-2 rounded-full px-4 py-1.5 active:scale-95 transition-transform disabled:opacity-60"
        style={{
          backgroundColor: corAcento,
          color: textoAcento === 'escuro' ? '#1a1a1a' : '#ffffff',
        }}
      >
        {atual ? (
          <>
            <FlagImg nome={atual.nome} size={22} />
            <span className="font-bold text-sm">{atual.nome}</span>
          </>
        ) : (
          <span className="font-bold text-sm">Escolher seleção</span>
        )}
        <ChevronDown className="w-4 h-4 opacity-70" />
      </button>

      {/* Bottom sheet picker */}
      {aberto && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setAberto(false)}
          />

          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto flex flex-col"
            style={{ maxHeight: '85dvh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
              <p className="font-black text-[#002776] text-base">Sua Seleção Favorita</p>
              <button
                onClick={() => setAberto(false)}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Grid de seleções */}
            <div className="overflow-y-auto px-4 py-4 flex-1">
              <div className="grid grid-cols-3 gap-2">
                {/* Opção "nenhuma" */}
                <button
                  type="button"
                  onClick={() => selecionar(null)}
                  disabled={isPending}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-colors active:scale-95
                    ${!selecaoAtual ? 'border-[#009C3B] bg-green-50' : 'border-gray-100 bg-gray-50'}`}
                >
                  <span className="text-2xl">🏳️</span>
                  <span className="text-[10px] font-semibold text-gray-500 text-center leading-tight">Nenhuma</span>
                </button>

                {LISTA_SELECOES.map(s => {
                  const ativa = selecaoAtual === s.nome
                  return (
                    <button
                      key={s.nome}
                      type="button"
                      onClick={() => selecionar(s.nome)}
                      disabled={isPending}
                      className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all active:scale-95 relative"
                      style={{
                        borderColor: ativa ? s.cor1 : '#f3f4f6',
                        backgroundColor: ativa ? `${s.cor1}18` : '#fafafa',
                      }}
                    >
                      {/* Swatch de cor */}
                      <div
                        className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                        style={{ backgroundColor: s.cor1 }}
                      />
                      {ativa && (
                        <div className="absolute top-1 left-1">
                          <Check className="w-3 h-3" style={{ color: s.cor1 }} />
                        </div>
                      )}
                      <FlagImg nome={s.nome} size={30} />
                      <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight line-clamp-2">
                        {s.nome}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
