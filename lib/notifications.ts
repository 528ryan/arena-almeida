import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

type Top3Entry = { id: string; nome: string; pontos: number }

function top3Mudou(anterior: Top3Entry[], atual: Top3Entry[]): boolean {
  if (anterior.length !== atual.length) return true
  return atual.some((u, i) => u.id !== anterior[i]?.id || u.pontos !== anterior[i]?.pontos)
}

function montarMensagem(anterior: Top3Entry[], atual: Top3Entry[]): string {
  const novoLider = atual[0]
  const liderAnterior = anterior[0]

  if (!liderAnterior || novoLider?.id !== liderAnterior?.id) {
    return `${novoLider?.nome ?? 'Alguém'} assumiu a liderança com ${novoLider?.pontos ?? 0} pts!`
  }
  return `O top 3 mudou! Confira o ranking atualizado.`
}

export async function verificarENotificarRanking(): Promise<void> {
  const supabase = createAdminClient()

  // Top 3 atual
  const { data: perfisData } = await supabase
    .from('perfis')
    .select('id, nome, pontos')
    .order('pontos', { ascending: false })
    .limit(3)

  const atual: Top3Entry[] = (perfisData ?? []).map(p => ({
    id: p.id as string,
    nome: p.nome as string,
    pontos: p.pontos as number,
  }))

  // Snapshot anterior
  const { data: snapshotData } = await supabase
    .from('ranking_snapshot')
    .select('top3')
    .eq('id', 1)
    .single()

  const anterior: Top3Entry[] = (snapshotData?.top3 as Top3Entry[]) ?? []

  if (!top3Mudou(anterior, atual)) return

  // Atualiza snapshot
  await supabase
    .from('ranking_snapshot')
    .update({ top3: atual, atualizado_em: new Date().toISOString() })
    .eq('id', 1)

  // Busca todas as subscriptions
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('subscription')

  if (!subs || subs.length === 0) return

  const payload = JSON.stringify({
    title: '🏆 Virada no Ranking!',
    body: montarMensagem(anterior, atual),
  })

  // Envia em paralelo, ignorando erros individuais
  await Promise.allSettled(
    subs.map(({ subscription }) =>
      webpush.sendNotification(
        subscription as webpush.PushSubscription,
        payload,
      ).catch(() => {/* subscription expirada ou inválida */})
    )
  )
}
