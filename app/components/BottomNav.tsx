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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
      <div className="max-w-md mx-auto flex">
        {tabs.map(({ href, label, Icon, match }) => {
          const active = match(pathname)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors relative ${
                active ? 'text-[#009C3B]' : 'text-gray-400'
              }`}
            >
              <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-xs font-semibold ${active ? 'text-[#009C3B]' : 'text-gray-400'}`}>
                {label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-10 h-0.5 bg-[#009C3B] rounded-t-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
