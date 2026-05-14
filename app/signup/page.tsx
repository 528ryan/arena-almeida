'use client'

import { useState, useTransition } from 'react'
import { Trophy, Lock, Mail, User, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { verificarConvite } from '@/app/actions/auth'
import GoogleButton from '@/app/components/OAuthButtons'
import Link from 'next/link'

function mapErroSupabase(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('rate limit') || m.includes('too many') || m.includes('email rate'))
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
  if (m.includes('already registered') || m.includes('already exists'))
    return 'Este e-mail já está cadastrado. Tente fazer login.'
  if (m.includes('invalid email'))
    return 'E-mail inválido. Verifique e tente novamente.'
  if (m.includes('password') && m.includes('weak'))
    return 'Senha muito fraca. Use pelo menos 6 caracteres variados.'
  if (m.includes('network') || m.includes('fetch'))
    return 'Erro de conexão. Verifique sua internet e tente novamente.'
  return 'Erro ao criar conta. Tente novamente mais tarde.'
}

export default function SignupPage() {
  const [etapa, setEtapa]               = useState<'convite' | 'cadastro'>('convite')
  const [codigoConvite, setCodigoConvite] = useState('')
  const [nome, setNome]                 = useState('')
  const [email, setEmail]               = useState('')
  const [senha, setSenha]               = useState('')
  const [erro, setErro]                 = useState('')
  const [loading, setLoading]           = useState(false)
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [isPending, startTransition]    = useTransition()

  // Erros de validação inline
  const erroNome  = tentouEnviar && !nome.trim()  ? 'Informe seu nome'    : ''
  const erroEmail = tentouEnviar && !email.trim() ? 'Informe seu e-mail'  : ''
  const erroSenha = tentouEnviar && !senha        ? 'Informe uma senha'
                  : tentouEnviar && senha.length < 6 ? 'Mínimo 6 caracteres' : ''

  function handleConvite(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    startTransition(async () => {
      const valido = await verificarConvite(codigoConvite)
      if (!valido) setErro('Código incorreto. Peça para quem te convidou.')
      else         setEtapa('cadastro')
    })
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault()
    setTentouEnviar(true)
    setErro('')

    if (!nome.trim() || !email.trim() || !senha || senha.length < 6) return

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { full_name: nome.trim() } },
    })

    if (error) {
      setErro(mapErroSupabase(error.message))
    } else {
      window.location.href = '/'
    }
    setLoading(false)
  }

  const inputBase = 'w-full px-4 py-4 rounded-xl border-2 text-lg focus:outline-none transition-colors'

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

      <div className="w-full max-w-sm">

        {/* ── Etapa 1: Código de convite ─────────────────────────── */}
        {etapa === 'convite' && (
          <>
            <form onSubmit={handleConvite}>
              <div className="bg-white rounded-2xl p-8 shadow-md flex flex-col gap-5">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-[#FFDF00] flex items-center justify-center">
                    <Lock className="w-7 h-7 text-[#002776]" />
                  </div>
                  <h2 className="text-lg font-bold text-[#002776] text-center">Código de convite</h2>
                  <p className="text-gray-500 text-sm text-center">
                    O bolão é exclusivo para a família.<br />Peça o código para quem te convidou.
                  </p>
                </div>

                <input
                  type="text"
                  value={codigoConvite}
                  onChange={e => setCodigoConvite(e.target.value.toUpperCase())}
                  placeholder="Digite o código"
                  required
                  maxLength={20}
                  autoComplete="off"
                  autoCapitalize="characters"
                  className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 text-xl text-center font-black tracking-widest uppercase focus:outline-none focus:border-[#FFDF00] transition-colors"
                />

                {erro && <p className="text-red-500 text-sm text-center">{erro}</p>}

                <button
                  type="submit"
                  disabled={isPending || !codigoConvite}
                  className="w-full py-4 rounded-xl bg-[#FFDF00] text-[#002776] font-black text-lg flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 transition-transform"
                >
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar código'}
                </button>
              </div>
            </form>

            <p className="text-center text-gray-500 text-sm mt-6">
              Já tem conta?{' '}
              <Link href="/login" className="text-[#009C3B] font-bold underline">
                Entrar
              </Link>
            </p>
          </>
        )}

        {/* ── Etapa 2: Cadastro ──────────────────────────────────── */}
        {etapa === 'cadastro' && (
          <div className="bg-white rounded-2xl p-8 shadow-md flex flex-col gap-4">
            <div className="flex items-center gap-2 justify-center mb-1">
              <CheckCircle className="w-5 h-5 text-[#009C3B]" />
              <span className="text-[#009C3B] font-semibold text-sm">Código confirmado!</span>
            </div>

            <h2 className="text-lg font-bold text-[#002776] text-center">Criar conta</h2>

            <GoogleButton />

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-400 text-sm">ou</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form onSubmit={handleEmailSignup} className="flex flex-col gap-3" noValidate>
              {/* Nome */}
              <div className="flex flex-col gap-1">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Seu nome"
                    maxLength={60}
                    autoComplete="name"
                    className={`${inputBase} pl-12 ${erroNome ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-[#009C3B]'}`}
                  />
                </div>
                {erroNome && <p className="text-red-500 text-xs pl-1">{erroNome}</p>}
              </div>

              {/* E-mail */}
              <div className="flex flex-col gap-1">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="E-mail"
                    maxLength={100}
                    autoComplete="email"
                    className={`${inputBase} pl-12 ${erroEmail ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-[#009C3B]'}`}
                  />
                </div>
                {erroEmail && <p className="text-red-500 text-xs pl-1">{erroEmail}</p>}
              </div>

              {/* Senha */}
              <div className="flex flex-col gap-1">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="Senha (mín. 6 caracteres)"
                    maxLength={100}
                    autoComplete="new-password"
                    className={`${inputBase} pl-12 ${erroSenha ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-[#009C3B]'}`}
                  />
                </div>
                {erroSenha && <p className="text-red-500 text-xs pl-1">{erroSenha}</p>}
              </div>

              {/* Erro geral */}
              {erro && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-red-600 text-sm text-center">{erro}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-[#002776] text-white font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 transition-transform mt-1"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar conta'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => { setEtapa('convite'); setErro(''); setTentouEnviar(false) }}
              className="text-gray-400 text-sm text-center"
            >
              ← Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
