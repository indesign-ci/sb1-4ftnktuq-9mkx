'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, FolderKanban, Calendar, ClipboardList } from 'lucide-react'

const mobileNav = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Projets', href: '/projects', icon: FolderKanban },
  { name: 'Planning', href: '/planning', icon: Calendar },
  { name: 'Documents Pro', href: '/documents-pro', icon: ClipboardList },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-[#1A1A1A] border-t border-[#C5A572]/20 py-2 safe-area-pb md:hidden">
      {mobileNav.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-2 min-w-[64px] transition-colors',
              isActive ? 'text-[#C5A572]' : 'text-[#9CA3AF]'
            )}
            aria-label={item.name}
          >
            <item.icon className="h-6 w-6" strokeWidth={1.5} />
            <span className="text-[10px] font-medium truncate max-w-full">{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
