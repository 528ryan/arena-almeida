'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
  await assertAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('jogos')
    .update({ placar_a, placar_b, status: 'encerrado' })
    .eq('id', jogoId)
  if (error) throw error
  revalidateAll()
  // Notifica se o top 3 mudou (fire-and-forget, não bloqueia a resposta)
  verificarENotificarRanking().catch(() => {})
}

export async function reabrirJogo(jogoId: number) {
  await assertAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('jogos')
    .update({ placar_a: null, placar_b: null, status: 'pendente' })
    .eq('id', jogoId)
  if (error) throw error
  revalidateAll()
}

export async function atualizarTimes(jogoId: number, time_a: string, time_b: string) {
  await assertAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('jogos')
    .update({ time_a, time_b })
    .eq('id', jogoId)
  if (error) throw error
  revalidatePath('/admin')
  revalidatePath('/mata-mata')
}

export async function atualizarPago(userId: string, pago: boolean) {
  await assertAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('perfis')
    .update({ pago })
    .eq('id', userId)
  if (error) throw error
  revalidatePath('/admin')
  revalidatePath('/ranking')
}
