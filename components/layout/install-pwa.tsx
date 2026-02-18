'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isInStandaloneMode = (navigator as any).standalone

    if (isStandalone || isInStandaloneMode) {
      setIsInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      const lastDismissed = localStorage.getItem('pwa-install-dismissed')
      const now = Date.now()
      const daysSinceDismissed = lastDismissed
        ? (now - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24)
        : 999

      if (daysSinceDismissed > 7) {
        setTimeout(() => {
          setShowInstallPrompt(true)
        }, 3000)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      if (process.env.NODE_ENV === 'development') console.log('PWA installée avec succès')
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return
    }

    deferredPrompt.prompt()

    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      if (process.env.NODE_ENV === 'development') console.log('Utilisateur a accepté l\'installation')
      setShowInstallPrompt(false)
    } else {
      if (process.env.NODE_ENV === 'development') console.log('Utilisateur a refusé l\'installation')
    }

    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (isInstalled || !showInstallPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-4 fade-in duration-500">
      <Card className="shadow-2xl border-2 border-[#C5A572] bg-gradient-to-br from-white to-amber-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#D4AF6A] to-[#B39562] flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl font-bold">DPM</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Installer DecoProManager
                  </h3>
                  <p className="text-xs text-gray-500">Application de bureau</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                Installez l'application sur votre{' '}
                <span className="font-semibold text-[#C5A572]">ordinateur</span> ou{' '}
                <span className="font-semibold text-[#C5A572]">iPad</span> pour un accès
                rapide et une meilleure expérience.
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C5A572]" />
                  <span>Accès rapide depuis votre bureau</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C5A572]" />
                  <span>Fonctionne hors ligne</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C5A572]" />
                  <span>Expérience optimisée</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleInstallClick}
                  className="flex-1 bg-gradient-to-r from-[#D4AF6A] to-[#B39562] hover:from-[#C5A572] hover:to-[#A38551] text-white shadow-lg"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Installer maintenant
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-xs text-gray-400 italic">
                Installation sécurisée • Pas d'app store requis
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
