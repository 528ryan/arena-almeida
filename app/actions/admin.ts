'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { verificarENotificarRanking } from '@/lib/notifications'
import { calcularClassificacao } from '@/lib/classificacao'
import type { Jogo } from '@/types'

// ─── Auto-resolução de slots ────────────────────────────────────────────────
// Quando um grupo encerra, atualiza jogos do mata-mata que têm "1º Grupo X"
// ou "2º Grupo X" no nome do time, substituindo pelo nome real da seleção.
async function _resolverSlots(adminClient: ReturnType<typeof createAdminClient>) {
  const { data } = await adminClient.from('jogos').select('*')
  if (!data) return

  const jogos = data as Jogo[]
  const grupoJogos   = jogos.filter(j => j.grupo)
  const knockoutJogos = jogos.filter(j => !j.grupo)

  const grupos = [...new Set(grupoJogos.map(j => j.grupo!))]

  for (const grupo of grupos) {
    const jogosGrupo = grupoJogos.filter(j => j.grupo === grupo)
    // Só resolve quando TODOS os jogos do grupo estão encerrados
    if (!jogosGrupo.every(j => j.status === 'encerrado')) continue

    const classificacao = calcularClassificacao(jogosGrupo)
    const primeiro = classificacao[0]?.nome
    const segundo  = classificacao[1]?.nome

    const atualizacoes = knockoutJogos.flatMap(jogo => {
      const updates: Record<string, string> = {}
      if (jogo.time_a === `1º Grupo ${grupo}` && primeiro) updates.time_a = primeiro
      if (jogo.time_a === `2º Grupo ${grupo}` && segundo)  updates.time_a = segundo
      if (jogo.time_b === `1º Grupo ${grupo}` && primeiro) updates.time_b = primeiro
      if (jogo.time_b === `2º Grupo ${grupo}` && segundo)  updates.time_b = segundo
      return Object.keys(updates).length > 0 ? [{ id: jogo.id, updates }] : []
    })

    await Promise.all(
      atualizacoes.map(({ id, updates }) =>
        adminClient.from('jogos').update(updates).eq('id', id)
      )
    )
  }
}

export async function resolverSlots() {
  await assertAdmin()
  const adminClient = createAdminClient()
  await _resolverSlots(adminClient)
  revalidateAll()
}

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
  // Tenta auto-resolver slots do mata-mata baseado em grupos completos
  await _resolverSlots(adminClient)
  revalidateAll()
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

export async function destravartodosPalpites() {
  await assertAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('jogos')
    .update({ prazo_edicao: null })
    .neq('status', 'encerrado')
  if (error) throw error
  revalidatePath('/admin')
  revalidatePath('/')
}

export async function travarTodosPalpites() {
  await assertAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('jogos')
    .update({ prazo_edicao: new Date().toISOString() })
    .neq('status', 'encerrado')
  if (error) throw error
  revalidatePath('/admin')
  revalidatePath('/')
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
