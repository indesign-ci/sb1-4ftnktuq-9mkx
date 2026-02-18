'use client'

import Link from 'next/link'
import { Search, LogOut, Settings } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NotificationBell } from './notification-bell'
import { useAuth } from '@/contexts/auth-context'
import { APP_VERSION } from '@/lib/app-config'

export function Header() {
  const { user, profile, signOut } = useAuth()
  const fullName = profile?.first_name || profile?.last_name
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ')
    : user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilisateur'
  const initials = fullName
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const avatarUrl = user?.user_metadata?.avatar_url ?? null

  return (
    <header className="h-14 md:h-16 border-b border-gray-100 bg-white px-4 md:px-6 flex items-center justify-between shadow-soft shrink-0">
      {/* Mobile: logo + spacer | Desktop: breadcrumb */}
      <div className="flex items-center min-w-0 flex-1 md:flex-initial">
        <Link
          href="/dashboard"
          className="md:hidden inline-flex max-w-full items-baseline gap-1.5 truncate whitespace-nowrap font-serif text-[#C5A572] shrink-0"
        >
          <span className="text-base font-semibold tracking-[0.22em]">
            INDESIGN
          </span>
          <span className="text-[10px] font-medium tracking-[0.18em] opacity-90">
            PLUS PRO
          </span>
          <span className="text-[9px] font-mono text-gray-400">v{APP_VERSION}</span>
        </Link>
        <Breadcrumb className="hidden md:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/dashboard"
                className="text-gray-500 hover:text-gold-500 transition-colors text-sm"
              >
                Accueil
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-gold-500/50" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-anthracite-800 font-medium text-sm">
                Tableau de bord
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <div className="relative w-80 hidden md:block">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Rechercher un client, projet, document..."
            className="pl-11 bg-gray-50 border-gray-200 rounded-full focus:bg-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500/20 transition-all duration-200"
          />
        </div>
        <div className="w-px h-6 bg-gray-200 hidden md:block" />
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-[#C5A572]/50"
              aria-label="Menu utilisateur"
            >
              <Avatar className="h-8 w-8 md:h-9 md:w-9 border-2 border-[#C5A572]/30">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-[#C5A572] text-white text-xs font-medium">
                  {initials || '?'}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                Paramètres
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
