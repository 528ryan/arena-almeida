'use client'

import { useState } from 'react'
import Link from 'next/link'

type GrupoInfo = {
  letra: string
  total: number
  cravados: number
  semPalpite: number
  aoVivo: boolean
}

export default function GruposFiltro({ grupos }: { grupos: GrupoInfo[] }) {
  const [filtro, setFiltro] = useState<'todos' | 'pendentes'>('todos')

  const lista = filtro === 'pendentes'
    ? grupos.filter(g => g.semPalpite > 0)
    : grupos

  const temPendentes = grupos.some(g => g.semPalpite > 0)

  return (
    <div>
      {/* Filtro */}
      {temPendentes && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              filtro === 'todos'
                ? 'bg-[#002776] text-white'
                : 'bg-white text-gray-400 border border-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltro('pendentes')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              filtro === 'pendentes'
                ? 'bg-[#009C3B] text-white'
                : 'bg-white text-gray-400 border border-gray-200'
            }`}
          >
            Faltam palpites
            <span className="ml-1.5 bg-white/30 px-1.5 py-0.5 rounded-full text-[10px]">
              {grupos.filter(g => g.semPalpite > 0).length}
            </span>
          </button>
        </div>
      )}

      {lista.length === 0 ? (
        <p className="text-center text-gray-400 py-6 text-sm">Todos os palpites feitos!</p>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          {lista.map(({ letra, total, cravados, semPalpite, aoVivo }) => {
            const progresso = total > 0 ? Math.round((cravados / total) * 100) : 0
            return (
              <Link key={letra} href={`/grupo/${letra}`}>
                <div className={`rounded-2xl bg-white border p-3 shadow-sm active:scale-95 transition-transform flex flex-col items-center gap-2 relative overflow-hidden ${
                  aoVivo ? 'border-red-300' : 'border-gray-200'
                }`}>
                  {/* Banner ao vivo */}
                  {aoVivo && (
                    <div className="absolute top-0 left-0 right-0 bg-red-500 py-[3px] flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span className="text-[9px] text-white font-black tracking-wide">AO VIVO</span>
                    </div>
                  )}

                  {/* Missing palpite badge */}
                  {semPalpite > 0 && (
                    <span className={`absolute right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center ${aoVivo ? 'top-7' : 'top-2'}`}>
                      {semPalpite}
                    </span>
                  )}

                  <div className={`w-10 h-10 rounded-full text-white font-black text-base flex items-center justify-center ${aoVivo ? 'mt-4 bg-red-500' : 'bg-[#002776]'}`}>
                    {letra}
                  </div>
                  <p className="font-black text-[#002776] text-sm leading-none">Grupo {letra}</p>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#009C3B] rounded-full transition-all"
                      style={{ width: `${progresso}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">
                    {cravados}/{total} cravados
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
