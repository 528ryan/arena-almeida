'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { verificarENotificarRanking } from '@/lib/notifications'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const { data } = await supabase
    .from('perfis').select('is_admin').eq('id', user.id).single()
  if (!data?.is_admin) throw new Error('Acesso negado')
  return supabase
}

function revalidateAll() {
  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/mata-mata')
  revalidatePath('/ranking')
}

export async function fecharJogo(jogoId: number, placar_a: number, placar_b: number) {
  const supabase = await assertAdmin()
  const { error } = await supabase
    .from('jogos')
    .update({ placar_a, placar_b, status: 'encerrado' })
    .eq('id', jogoId)
  if (error) throw error
  revalidateAll()
  // Notifica se o top 3 mudou (fire-and-forget, não bloqueia a resposta)
  verificarENotificarRanking().catch(() => {})
}

export async function reabrirJogo(jogoId: number) {
  const supabase = await assertAdmin()
  const { error } = await supabase
    .from('jogos')
    .update({ placar_a: null, placar_b: null, status: 'pendente' })
    .eq('id', jogoId)
  if (error) throw error
  revalidateAll()
}

export async function atualizarTimes(jogoId: number, time_a: string, time_b: string) {
  const supabase = await assertAdmin()
  const { error } = await supabase
    .from('jogos')
    .update({ time_a, time_b })
    .eq('id', jogoId)
  if (error) throw error
  revalidatePath('/admin')
  revalidatePath('/mata-mata')
}

export async function atualizarPago(userId: string, pago: boolean) {
  const supabase = await assertAdmin()
  const { error } = await supabase
    .from('perfis')
    .update({ pago })
    .eq('id', userId)
  if (error) throw error
  revalidatePath('/admin')
  revalidatePath('/ranking')
}
