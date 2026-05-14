'use server'

import { cookies } from 'next/headers'

export async function verificarConvite(codigo: string): Promise<boolean> {
  const codigoEnv = process.env.INVITE_CODE
  if (!codigoEnv) return false

  const valido = codigo.trim().toUpperCase() === codigoEnv.toUpperCase()
  if (valido) {
    const store = await cookies()
    store.set('arena_invite', '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600, // 10 minutos para concluir o OAuth
      path: '/',
      sameSite: 'lax',
    })
  }
  return valido
}
