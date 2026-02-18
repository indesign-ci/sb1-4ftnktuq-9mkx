'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { InstallPWA } from '@/components/layout/install-pwa'
import { useAuth } from '@/contexts/auth-context'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, isClient, isAccountant } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
      return
    }

    // Un client n'utilise pas le back-office : redirection vers le portail client
    if (isClient) {
      router.replace('/client')
      return
    }

    // Un comptable ne doit voir que devis / factures (et éventuellement dashboard)
    if (isAccountant) {
      const allowedPrefixes = ['/dashboard', '/quotes', '/invoices']
      const isAllowed = allowedPrefixes.some((p) =>
        pathname.startsWith(p),
      )
      if (!isAllowed) {
        router.replace('/invoices')
      }
    }
  }, [user, loading, isClient, isAccountant, pathname, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Chargement...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <BottomNav />
      <InstallPWA />
    </div>
  )
}
