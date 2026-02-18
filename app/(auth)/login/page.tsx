'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import Link from 'next/link'
import { Building2, Mail, Lock, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { APP_NAME, APP_VERSION } from '@/lib/app-config'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user, loading: authLoading, signIn } = useAuth()

  useEffect(() => {
    if (authLoading) return
    if (user) router.replace('/dashboard')
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn(email, password)
      toast.success('Connexion réussie')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black h-screen">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1920"
            alt="Luxury Interior Design"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        </div>
        <div className="absolute bottom-12 left-12 right-12 z-10">
          <p className="text-white text-xl md:text-2xl italic font-light leading-relaxed">
            "Le luxe, c'est quand le détail rejoint l'excellence."
          </p>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 sm:px-12 lg:px-20">
        <div className="w-full max-w-md space-y-10 animate-fade-in">
          {/* Brand */}
          <div className="space-y-2 text-center">
            <div className="mb-4 inline-flex flex-col items-center gap-0.5">
              <div className="inline-flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl tracking-[0.35em] font-serif text-[#C5A572]">
                  INDESIGN
                </span>
                <span className="text-xs sm:text-sm font-medium tracking-[0.18em] text-[#C5A572]/90">
                  PLUS&nbsp;PRO
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono tracking-wider">v{APP_VERSION}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-light text-gray-900">
              Bienvenue
            </h1>
            <p className="text-gray-500 text-base">
              Connectez-vous à votre espace
            </p>
            <Link
              href="/signup"
              className="text-sm text-[#C5A572] hover:underline font-medium mt-2 inline-block"
            >
              Créer le premier compte admin →
            </Link>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-600 uppercase tracking-wide"
              >
                Adresse email
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nom@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 py-3.5 px-4 rounded-lg border border-gray-200 focus:border-[#C5A572] focus:ring-1 focus:ring-[#C5A572]/40 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-600 uppercase tracking-wide"
              >
                Mot de passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 py-3.5 px-4 rounded-lg border border-gray-200 focus:border-[#C5A572] focus:ring-1 focus:ring-[#C5A572]/40 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  Se souvenir de moi
                </label>
              </div>
              <button
                type="button"
                className="text-sm text-[#C5A572] hover:text-[#B08D5B] transition-colors"
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C5A572] hover:bg-[#B08D5B] text-white py-3.5 rounded-lg font-semibold uppercase tracking-[0.25em] transition-all duration-200 shadow-[0_12px_30px_rgba(197,165,114,0.45)] hover:shadow-[0_16px_40px_rgba(176,141,91,0.6)] group"
            >
              {loading ? (
                'Connexion...'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Se connecter
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-[0.2em]">
                <span className="px-4 bg-white text-gray-400">ou</span>
              </div>
            </div>

            {/* Secondary Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full border-[#C5A572] text-[#C5A572] hover:bg-[#C5A572]/5 py-3.5 rounded-lg font-medium transition-all duration-200"
            >
              Accéder au portail client
            </Button>
          </form>

          {/* Footer */}
          <div className="pt-4 text-center">
            <p className="text-xs text-gray-400">
              © 2025 {APP_NAME} · v{APP_VERSION} — Tous droits réservés
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Background */}
      <div className="lg:hidden fixed inset-0 -z-10 bg-white" />
    </div>
  )
}
