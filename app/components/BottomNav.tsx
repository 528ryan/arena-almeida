'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, GitMerge, Trophy, User } from 'lucide-react'

const tabs = [
  { href: '/',          label: 'Grupos',    Icon: LayoutGrid, match: (p: string) => p === '/' || p.startsWith('/grupo') },
  { href: '/mata-mata', label: 'Mata-Mata', Icon: GitMerge,   match: (p: string) => p.startsWith('/mata-mata') },
  { href: '/ranking',   label: 'Ranking',   Icon: Trophy,     match: (p: string) => p.startsWith('/ranking') },
  { href: '/perfil',    label: 'Perfil',    Icon: User,       match: (p: string) => p.startsWith('/perfil') },
]

export default function BottomNav() {
  const pathname = usePathname()

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/auth')
  ) {
    return null
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 bg-[#009C3B]"
      style={{ boxShadow: '0 -4px 24px rgba(0,156,59,0.4)' }}
    >
      <div className="max-w-md mx-auto flex items-center"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        {tabs.map(({ href, label, Icon, match }) => {
          const active = match(pathname)
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 pt-2 pb-1"
            >
              {/* Pílula com ícone */}
              <div className={`flex items-center justify-center w-14 h-8 rounded-full transition-all duration-200 ${
                active ? 'bg-[#FFDF00]' : 'bg-transparent'
              }`}>
                <Icon
                  className={`w-5 h-5 transition-colors duration-200 ${
                    active ? 'text-[#002776]' : 'text-white/40'
                  }`}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </div>

              {/* Label */}
              <span className={`text-[10px] font-bold leading-none transition-colors duration-200 ${
                active ? 'text-[#FFDF00]' : 'text-white/40'
              }`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
