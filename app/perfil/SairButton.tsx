'use client'

import { useState } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SairButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function sair() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={sair}
      disabled={loading}
      className="w-full py-3.5 rounded-2xl border-2 border-red-200 text-red-500 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
      {loading ? 'Saindo…' : 'Sair da conta'}
    </button>
  )
}
