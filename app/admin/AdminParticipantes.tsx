'use client'

import { useTransition } from 'react'
import Image from 'next/image'
import { ShieldCheck, DollarSign, Coffee } from 'lucide-react'
import { atualizarPago } from '@/app/actions/admin'
import type { Perfil } from '@/types'

function Avatar({ perfil }: { perfil: Perfil }) {
  const iniciais = perfil.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  if (perfil.foto_url) {
    return (
      <Image
        src={perfil.foto_url}
        alt={perfil.nome}
        width={44}
        height={44}
        className="w-11 h-11 rounded-full object-cover"
      />
    )
  }
  return (
    <div className="w-11 h-11 rounded-full bg-[#009C3B] flex items-center justify-center text-white font-black text-base">
      {iniciais}
    </div>
  )
}

function ParticipanteRow({ perfil }: { perfil: Perfil }) {
  const [isPending, start] = useTransition()

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
      <Avatar perfil={perfil} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-bold text-[#002776] truncate">{perfil.nome}</p>
          {perfil.is_admin && (
            <ShieldCheck className="w-3.5 h-3.5 text-[#FFDF00] shrink-0" />
          )}
        </div>
        <p className="text-xs text-gray-400 tabular-nums">{perfil.pontos} pts</p>
      </div>

      {/* Toggle pago */}
      <button
        disabled={isPending}
        onClick={() => start(() => atualizarPago(perfil.id, !perfil.pago))}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${
          perfil.pago
            ? 'bg-[#009C3B] text-white'
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        {perfil.pago
          ? <><DollarSign className="w-3.5 h-3.5" />Apostador</>
          : <><Coffee className="w-3.5 h-3.5" />Café com leite</>
        }
      </button>
    </div>
  )
}

export default function AdminParticipantes({ perfis }: { perfis: Perfil[] }) {
  const pagantes    = perfis.filter(p => p.pago).length
  const naoPagentes = perfis.length - pagantes

  return (
    <div className="flex flex-col gap-3">
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3 mb-1">
        <div className="bg-[#009C3B]/10 rounded-2xl p-3 text-center">
          <p className="font-black text-2xl text-[#009C3B]">{pagantes}</p>
          <p className="text-xs text-[#009C3B] font-semibold mt-0.5">Apostadores</p>
        </div>
        <div className="bg-gray-100 rounded-2xl p-3 text-center">
          <p className="font-black text-2xl text-gray-400">{naoPagentes}</p>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">Café com leite</p>
        </div>
      </div>

      {perfis.map(p => <ParticipanteRow key={p.id} perfil={p} />)}
    </div>
  )
}
