'use client'

import { useTransition } from 'react'
import { Lock, LockOpen } from 'lucide-react'
import { travarTodosPalpites, destravartodosPalpites } from '@/app/actions/admin'

interface Props {
  travado: boolean
  totalPendentes: number
}

export default function AdminLockToggle({ travado, totalPendentes }: Props) {
  const [isPending, start] = useTransition()

  if (totalPendentes === 0) return null

  return (
    <div className={`rounded-2xl border-2 px-4 py-3 flex items-center justify-between gap-3 mb-4 ${
      travado ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
    }`}>
      <div className="flex items-center gap-2 min-w-0">
        {travado
          ? <Lock className="w-4 h-4 text-red-500 shrink-0" />
          : <LockOpen className="w-4 h-4 text-green-600 shrink-0" />
        }
        <div className="min-w-0">
          <p className={`font-bold text-sm ${travado ? 'text-red-700' : 'text-green-700'}`}>
            {travado ? 'Palpites travados' : 'Palpites abertos'}
          </p>
          <p className="text-xs text-gray-400">
            {totalPendentes} {totalPendentes === 1 ? 'jogo sem resultado' : 'jogos sem resultado'}
          </p>
        </div>
      </div>

      <button
        disabled={isPending}
        onClick={() => start(() => travado ? destravartodosPalpites() : travarTodosPalpites())}
        className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${
          travado
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}
      >
        {isPending
          ? '...'
          : travado
            ? <><LockOpen className="w-3.5 h-3.5" /> Destravar</>
            : <><Lock className="w-3.5 h-3.5" /> Travar</>
        }
      </button>
    </div>
  )
}
