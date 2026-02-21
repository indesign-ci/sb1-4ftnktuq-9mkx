'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { APP_VERSION } from '@/lib/app-config'

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login?redirect=' + encodeURIComponent('/client'))
      return
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Chargement...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/client" className="flex items-center gap-2 text-[#1A1A1A]">
            <span className="text-lg font-semibold tracking-wide text-[#C5A572]">
              Espace client
            </span>
            <span className="text-xs text-gray-400 font-mono">v{APP_VERSION}</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 truncate max-w-[180px]">
              {user.email}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              title="Déconnexion"
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-4xl p-4 sm:p-6">
        {children}
      </main>
    </div>
  )
}
