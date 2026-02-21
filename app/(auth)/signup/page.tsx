'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, User, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { APP_NAME, APP_VERSION } from '@/lib/app-config'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [first_name, setFirstName] = useState('')
  const [last_name, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return
    if (user) router.replace('/dashboard')
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/setup-first-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          first_name: first_name.trim(),
          last_name: last_name.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.error || 'Erreur lors de la création du compte'
        if (msg.toLowerCase().includes('invalid api key') || msg.toLowerCase().includes('configuration manquante')) {
          toast.error('Clé API Supabase manquante ou incorrecte. Vercel → Settings → Environment Variables : ajoutez SUPABASE_SERVICE_ROLE_KEY (clé service_role de Supabase), puis redéployez.')
        } else {
          toast.error(msg)
        }
        return
      }
      toast.success(data.message || 'Compte créé ! Connectez-vous.')
      router.push('/login')
    } catch (err: any) {
      toast.error(err?.message || 'Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
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
            {`"Le luxe, c'est quand le détail rejoint l'excellence."`}
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 sm:px-12 lg:px-20">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <div className="mb-4 inline-flex flex-col items-center gap-0.5">
              <span className="text-4xl sm:text-5xl tracking-[0.35em] font-serif text-[#C5A572]">INDESIGN</span>
              <span className="text-xs sm:text-sm font-medium tracking-[0.18em] text-[#C5A572]/90">PLUS&nbsp;PRO</span>
              <span className="text-[10px] text-gray-400 font-mono">v{APP_VERSION}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-light text-gray-900">Créer le compte administrateur</h1>
            <p className="text-gray-500 text-sm">Cette page permet de créer le premier compte Admin (accès complet).</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-xs font-medium uppercase text-gray-600">Prénom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="first_name"
                    placeholder="Admin"
                    value={first_name}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-xs font-medium uppercase text-gray-600">Nom</Label>
                <Input
                  id="last_name"
                  placeholder="Optionnel"
                  value={last_name}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium uppercase text-gray-600">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@votre-entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium uppercase text-gray-600">Mot de passe (min. 6 caractères)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C5A572] hover:bg-[#B08D5B] text-white py-3 rounded-lg font-semibold uppercase tracking-wider"
            >
              {loading ? 'Création...' : 'Créer le compte admin'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-[#C5A572] hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
