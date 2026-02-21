'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/auth-context'
import { APP_VERSION } from '@/lib/app-config'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  Receipt,
  Calendar,
  Library,
  Image,
  FileStack,
  FileCheck,
  Settings,
  LogOut,
  Package,
  ClipboardList,
  UserCircle,
  LayoutGrid,
} from 'lucide-react'

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Portail client', href: '/client', icon: UserCircle },
  { name: 'Conception', href: '/conception', icon: LayoutGrid },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Projets', href: '/projects', icon: FolderKanban },
  { name: 'Devis', href: '/quotes', icon: FileText },
  { name: 'Factures', href: '/invoices', icon: Receipt },
  { name: 'Planning', href: '/planning', icon: Calendar },
  { name: 'Matériaux', href: '/library', icon: Library },
  { name: 'Fournisseurs', href: '/suppliers', icon: Package },
  { name: 'Moodboards', href: '/moodboards', icon: Image },
  { name: 'Documents Pro', href: '/documents-pro', icon: ClipboardList },
  { name: 'Documents', href: '/documents', icon: FileStack },
  { name: 'Templates', href: '/templates', icon: FileCheck },
  { name: 'Paramètres', href: '/settings', icon: Settings },
]

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  architect: 'Architecte',
  assistant: 'Assistante',
  accountant: 'Comptable',
  client: 'Client',
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, profile, signOut, isAccountant, isClient, role } = useAuth()

  const userMeta = user?.user_metadata as { full_name?: string; avatar_url?: string } | undefined
  const fullName = profile?.first_name || profile?.last_name
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ')
    : userMeta?.full_name || user?.email?.split('@')[0] || 'Administrateur'
  const roleLabel = role ? ROLE_LABELS[role] || role : 'Admin'
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const avatarUrl = userMeta?.avatar_url || null

  // Navigation visible selon le rôle
  let visibleNavigation = navigation
  if (isAccountant) {
    visibleNavigation = navigation.filter((item) =>
      ['Tableau de bord', 'Devis', 'Factures'].includes(item.name),
    )
  }
  if (isClient) {
    visibleNavigation = []
  }

  return (
    <div className="hidden md:flex h-screen flex-col bg-gradient-to-b from-[#1A1A1A] to-[#222222] text-white w-16 lg:w-64 shrink-0 transition-[width] duration-200">
      {/* Logo Section */}
      <div className="flex h-20 items-center justify-center px-2 pt-6 lg:px-3">
        <div className="flex flex-col items-center w-full min-w-0">
          {/* Desktop: INDESIGN plus grand que Plus / Pro */}
          <span className="hidden lg:inline-flex flex-col items-center leading-tight text-[#F5E6C8]">
            <span className="text-[17px] font-semibold tracking-[0.32em]">
              INDESIGN
            </span>
            <span className="mt-[2px] text-[9px] font-medium tracking-[0.22em] opacity-90">
              PLUS&nbsp;PRO
            </span>
            <span className="mt-0.5 text-[8px] font-mono text-[#C5A572]/70">v{APP_VERSION}</span>
          </span>
          {/* Sidebar réduite (md) */}
          <span className="flex flex-col items-center text-sm font-semibold tracking-[0.18em] text-[#F5E6C8] lg:hidden">
            <span>INDESIGN</span>
            <span className="text-[8px] font-mono text-[#C5A572]/70">v{APP_VERSION}</span>
          </span>
        </div>
      </div>

      {/* Separator */}
      <div className="mx-2 lg:mx-6 my-4 h-px bg-[#C5A572]/30" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-1">
        {visibleNavigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              title={item.name}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-2 lg:px-4 py-2.5 text-sm font-medium transition-all duration-200 relative justify-center lg:justify-start',
                isActive
                  ? 'bg-[rgba(197,165,114,0.1)] text-[#C5A572] border-l-[3px] border-[#C5A572]'
                  : 'text-[#9CA3AF] hover:bg-[#2D2D2D] hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive ? 'text-[#C5A572]' : 'text-[#9CA3AF] group-hover:text-white'
                )}
                strokeWidth={1.5}
              />
              <span className="hidden lg:inline truncate">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Section - hidden on tablet collapsed, show on lg */}
      <div className="border-t border-[#C5A572]/20 p-2 lg:p-4 hidden lg:block">
        <div className="flex items-center gap-3 mb-3 px-2 rounded-lg bg-[#1F1F1F]">
          <Avatar className="h-10 w-10 shrink-0 border-2 border-[#C5A572] rounded-full my-2 flex items-center justify-center">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="bg-[#C5A572] text-white text-sm font-medium rounded-full w-full h-full flex items-center justify-center">
              {initials || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 py-2">
            <p className="text-sm font-medium text-white truncate">
              {fullName}
            </p>
            <p className="text-xs text-gray-400 truncate capitalize">
              {roleLabel}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-1 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-200"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </div>
  )
}
