'use client'

import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="p-2 rounded-full hover:bg-white/20 transition-colors"
      aria-label="Sair"
    >
      <LogOut className="w-5 h-5 text-white" />
    </button>
  )
}
