import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?erro=auth`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        ),
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(`${origin}/login?erro=auth`)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/login?erro=auth`)

  // Verifica se o perfil já existe (usuário antigo = login normal)
  const { data: perfil } = await supabase
    .from('perfis')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!perfil) {
    // Novo usuário — precisa ter passado pelo código de convite
    const invite = cookieStore.get('arena_invite')
    if (!invite) {
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/signup?erro=convite`)
    }
    cookieStore.delete('arena_invite')
  }

  return NextResponse.redirect(`${origin}/`)
}
