'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { SELECOES } from '@/lib/selecoes'

export async function atualizarSelecao(selecao: string | null): Promise<{ error?: string }> {
  if (selecao !== null && !SELECOES[selecao]) return { error: 'Seleção inválida' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('perfis')
    .update({ selecao_favorita: selecao })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/perfil')
  return {}
}

export async function atualizarNome(nome: string): Promise<{ error?: string }> {
  // eslint-disable-next-line no-useless-escape
  const trimmed = nome.replace(/[<>&"'`]/g, '').trim()
  if (!trimmed || trimmed.length < 2) return { error: 'Nome muito curto' }
  if (trimmed.length > 50)           return { error: 'Nome muito longo' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('perfis')
    .update({ nome: trimmed })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/perfil')
  revalidatePath('/ranking')
  return {}
}
