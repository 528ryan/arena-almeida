'use client'

import { useState } from 'react'
import { Trophy, Mail, Lock, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import GoogleButton from '@/app/components/OAuthButtons'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      setErro('E-mail ou senha incorretos.')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#f0fdf4]">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-20 h-20 rounded-full bg-[#009C3B] flex items-center justify-center mb-4 shadow-lg">
          <Trophy className="w-10 h-10 text-[#FFDF00]" />
        </div>
        <h1 className="text-3xl font-black text-[#002776] tracking-tight">Arena Almeida</h1>
        <p className="text-[#009C3B] font-semibold mt-1">Bolão da Copa da Família</p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className="bg-white rounded-2xl p-8 shadow-md flex flex-col gap-4">
          <h2 className="text-lg font-bold text-[#002776] text-center">Entrar</h2>

          <GoogleButton />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-sm">ou</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                required
                autoComplete="email"
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 text-lg focus:outline-none focus:border-[#009C3B] transition-colors"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Senha"
                required
                autoComplete="current-password"
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 text-lg focus:outline-none focus:border-[#009C3B] transition-colors"
              />
            </div>

            {erro && <p className="text-red-500 text-sm text-center">{erro}</p>}

            <button
              type="submit"
              disabled={loading || !email || !senha}
              className="w-full py-4 rounded-xl bg-[#009C3B] text-white font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 transition-transform"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm">
          Ainda não tem conta?{' '}
          <Link href="/signup" className="text-[#009C3B] font-bold underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}
