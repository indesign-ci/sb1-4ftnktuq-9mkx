'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { APP_NAME } from '@/lib/app-config'

export default function OfflinePage() {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (online) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Connexion rétablie.</p>
          <Button onClick={() => window.location.replace('/dashboard')} className="bg-[#C5A572] hover:bg-[#B39562]">
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
      <div className="rounded-full bg-amber-100 p-6 mb-6">
        <WifiOff className="h-16 w-16 text-amber-600" />
      </div>
      <h1 className="text-2xl font-serif text-[#C5A572] mb-2">{APP_NAME}</h1>
      <p className="text-gray-600 mb-2 font-medium">Vous êtes hors ligne</p>
      <p className="text-gray-500 text-sm max-w-sm mb-8">
        Certaines fonctionnalités nécessitent une connexion. Vérifiez votre réseau puis réessayez.
      </p>
      <Button
        onClick={() => window.location.reload()}
        variant="outline"
        className="gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Réessayer
      </Button>
    </div>
  )
}
