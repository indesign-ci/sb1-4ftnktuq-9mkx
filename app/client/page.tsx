'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { FolderKanban, MessageSquare, FileText, Receipt, ArrowRight, Search } from 'lucide-react'
import { toast } from 'sonner'

type ClientRecord = {
  id: string
  first_name: string
  last_name: string
  email?: string | null
}

type ProjectRow = {
  id: string
  name: string
  status?: string
  address?: string
}

type PortalMessage = {
  id: string
  content: string
  sender_name: string
  created_at: string
  is_read: boolean
}

export default function ClientPortalPage() {
  const { profile } = useAuth()
  const isAdminOrStaff =
    profile?.role === 'admin' ||
    profile?.role === 'architecte' ||
    profile?.role === 'assistant'

  const [clientRecord, setClientRecord] = useState<ClientRecord | null>(null)
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [clientsForAdmin, setClientsForAdmin] = useState<ClientRecord[]>([])
  const [searchClient, setSearchClient] = useState('')
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [messages, setMessages] = useState<PortalMessage[]>([])
  const [loading, setLoading] = useState(true)

  // Résoudre le client : soit l'utilisateur connecté (role client) soit le client sélectionné (admin)
  const effectiveClientId = isAdminOrStaff ? selectedClientId : clientRecord?.id

  useEffect(() => {
    if (!profile) return
    if (isAdminOrStaff) {
      loadClientsForAdmin()
    } else {
      loadClientByEmail()
    }
  }, [profile?.id, profile?.email, isAdminOrStaff])

  useEffect(() => {
    if (!effectiveClientId) {
      setProjects([])
      setMessages([])
      setLoading(false)
      return
    }
    loadProjectsAndMessages(effectiveClientId)
  }, [effectiveClientId])

  const loadClientByEmail = async () => {
    if (!profile?.email) {
      setLoading(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email')
        .ilike('email', profile.email)
        .maybeSingle()
      if (error) throw error
      setClientRecord(data || null)
    } catch (e) {
      console.error(e)
      toast.error('Impossible de charger votre profil client')
    } finally {
      setLoading(false)
    }
  }

  const loadClientsForAdmin = async () => {
    if (!profile?.company_id) {
      setLoading(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email')
        .eq('company_id', profile.company_id)
        .order('first_name')
      if (error) throw error
      setClientsForAdmin(data || [])
      if (data?.length === 1) setSelectedClientId(data[0].id)
    } catch (e) {
      console.error(e)
      toast.error('Impossible de charger la liste des clients')
    } finally {
      setLoading(false)
    }
  }

  const loadProjectsAndMessages = async (clientId: string) => {
    setLoading(true)
    try {
      const [projRes, msgRes] = await Promise.all([
        supabase
          .from('projects')
          .select('id, name, status, address')
          .eq('client_id', clientId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
        supabase
          .from('portal_messages')
          .select('id, content, sender_name, created_at, is_read')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(20),
      ])
      if (projRes.error) throw projRes.error
      if (msgRes.error) throw msgRes.error
      setProjects(projRes.data || [])
      setMessages(msgRes.data || [])
    } catch (e) {
      console.error(e)
      toast.error('Erreur chargement des données')
    } finally {
      setLoading(false)
    }
  }

  // Recherche progressive par nom (prénom, nom ou les deux), email
  const searchClientTrimmed = searchClient.trim().toLowerCase()
  const searchClientTerms = searchClientTrimmed ? searchClientTrimmed.split(/\s+/) : []
  const filteredClientsForAdmin = clientsForAdmin.filter((client) => {
    if (!searchClientTerms.length) return true
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase()
    const fullNameReversed = `${client.last_name} ${client.first_name}`.toLowerCase()
    return searchClientTerms.every(
      (term) =>
        client.first_name.toLowerCase().includes(term) ||
        client.last_name.toLowerCase().includes(term) ||
        fullName.includes(term) ||
        fullNameReversed.includes(term) ||
        client.email?.toLowerCase().includes(term)
    )
  })

  const displayName = isAdminOrStaff
    ? selectedClientId
      ? clientsForAdmin.find((c) => c.id === selectedClientId)?.first_name +
        ' ' +
        (clientsForAdmin.find((c) => c.id === selectedClientId)?.last_name || '')
      : null
    : clientRecord
      ? `${clientRecord.first_name} ${clientRecord.last_name}`
      : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isAdminOrStaff ? 'Vue portail client' : 'Mon espace'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isAdminOrStaff
            ? 'Sélectionnez un client pour voir son portail.'
            : 'Consultez vos projets et vos échanges.'}
        </p>
      </div>

      {isAdminOrStaff && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Label className="text-sm font-medium text-gray-700">
              Voir le portail en tant que
            </Label>
            {/* Zone recherche : saisie du nom pour affichage progressif des clients */}
            <div className="space-y-2">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Rechercher par nom du client (saisir pour afficher les résultats)..."
                  value={searchClient}
                  onChange={(e) => setSearchClient(e.target.value)}
                  className="pl-9 focus-visible:ring-[#C5A572]"
                  autoComplete="off"
                />
              </div>
              {searchClientTrimmed && (
                <p className="text-sm text-gray-500">
                  {filteredClientsForAdmin.length} client{filteredClientsForAdmin.length !== 1 ? 's' : ''} affiché{filteredClientsForAdmin.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <Select
              value={selectedClientId || undefined}
              onValueChange={setSelectedClientId}
            >
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Choisir un client" />
              </SelectTrigger>
              <SelectContent>
                {filteredClientsForAdmin.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-gray-500">
                    Aucun client trouvé
                  </div>
                ) : (
                  filteredClientsForAdmin.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                      {c.email ? ` — ${c.email}` : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {!effectiveClientId && !loading && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            {isAdminOrStaff
              ? 'Sélectionnez un client ci-dessus pour afficher son portail.'
              : "Aucun profil client associé à votre compte. Contactez votre architecte pour activer l'accès."}
          </CardContent>
        </Card>
      )}

      {effectiveClientId && (
        <>
          {displayName && (
            <p className="text-sm text-gray-600">
              Portail de : <strong>{displayName}</strong>
            </p>
          )}

          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FolderKanban className="h-5 w-5 text-[#C5A572]" />
                  Projets
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-gray-500">Chargement...</p>
                ) : projects.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Aucun projet pour le moment.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {projects.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/client/projects/${p.id}`}
                          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                        >
                          <span className="font-medium text-gray-900">
                            {p.name}
                          </span>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-[#C5A572]" />
                  Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-gray-500">Chargement...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Aucun message pour le moment.
                  </p>
                ) : (
                  <ul className="space-y-3 max-h-[280px] overflow-y-auto">
                    {messages.map((m) => (
                      <li
                        key={m.id}
                        className={`rounded-lg border px-3 py-2 text-sm ${
                          m.is_read
                            ? 'border-gray-100 bg-gray-50'
                            : 'border-[#C5A572]/30 bg-[#C5A572]/5'
                        }`}
                      >
                        <p className="text-gray-900">{m.content}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {m.sender_name} ·{' '}
                          {new Date(m.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                {isAdminOrStaff && (
                  <p className="mt-2 text-xs text-gray-400">
                    En tant qu&apos;admin, vous pouvez gérer les messages depuis
                    le back-office (projet concerné).
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {isAdminOrStaff && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Accès rapides</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link href={selectedClientId ? `/quotes?client_id=${selectedClientId}` : '/quotes'}>
                    <FileText className="mr-2 h-4 w-4" />
                    Devis
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={selectedClientId ? `/invoices?client_id=${selectedClientId}` : '/invoices'}>
                    <Receipt className="mr-2 h-4 w-4" />
                    Factures
                  </Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <Link href="/dashboard">Retour au back-office</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
