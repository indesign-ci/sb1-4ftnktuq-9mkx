'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Pencil, Trash2, Eye, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { ClientForm } from '@/components/clients/client-form'
import { ClientDetail } from '@/components/clients/client-detail'

type Client = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  status: string
  property_type: string
  estimated_budget: number
  created_at: string
}

const statusColors: Record<string, string> = {
  prospect: 'bg-gray-500 text-white',
  first_contact: 'bg-blue-500 text-white',
  premier_contact: 'bg-blue-500 text-white',
  quote_sent: 'bg-yellow-500 text-white',
  devis_envoye: 'bg-yellow-500 text-white',
  project_signed: 'bg-green-500 text-white',
  projet_signe: 'bg-green-500 text-white',
  active: 'bg-emerald-500 text-white',
  actif: 'bg-emerald-500 text-white',
  completed: 'bg-purple-500 text-white',
  termine: 'bg-purple-500 text-white',
  inactive: 'bg-gray-400 text-white',
  inactif: 'bg-gray-400 text-white',
}

const statusLabels: Record<string, string> = {
  prospect: 'Prospect',
  first_contact: 'Premier contact',
  premier_contact: 'Premier contact',
  quote_sent: 'Devis envoyé',
  devis_envoye: 'Devis envoyé',
  project_signed: 'Projet signé',
  projet_signe: 'Projet signé',
  active: 'Actif',
  actif: 'Actif',
  completed: 'Terminé',
  termine: 'Terminé',
  inactive: 'Inactif',
  inactif: 'Inactif',
}

export default function ClientsPage() {
  const { profile } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const loadClients = async () => {
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      // Filter by company_id only if profile exists
      if (profile?.company_id) {
        query = query.eq('company_id', profile.company_id)
      }

      const { data, error } = await query

      if (error) throw error
      setClients(data || [])
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors du chargement des clients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return

    try {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
      toast.success('Client supprimé')
      loadClients()
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la suppression')
    }
  }

  // Recherche progressive par nom (prénom, nom ou les deux), email
  const searchTrimmed = search.trim().toLowerCase()
  const searchTerms = searchTrimmed ? searchTrimmed.split(/\s+/) : []

  const filteredClients = clients.filter((client) => {
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase()
    const fullNameReversed = `${client.last_name} ${client.first_name}`.toLowerCase()
    const matchesSearch = searchTerms.length
      ? searchTerms.every(
          (term) =>
            client.first_name.toLowerCase().includes(term) ||
            client.last_name.toLowerCase().includes(term) ||
            fullName.includes(term) ||
            fullNameReversed.includes(term) ||
            client.email?.toLowerCase().includes(term)
        )
      : true

    const statusMatchesFilter = (dbStatus: string, filter: string) => {
      if (filter === 'all') return true
      const equivalents: Record<string, string[]> = {
        prospect: ['prospect'],
        first_contact: ['first_contact', 'premier_contact'],
        quote_sent: ['quote_sent', 'devis_envoye'],
        project_signed: ['project_signed', 'projet_signe'],
        active: ['active', 'actif'],
        completed: ['completed', 'termine'],
        inactive: ['inactive', 'inactif'],
      }
      return (equivalents[filter] ?? [filter]).includes(dbStatus)
    }
    const matchesStatus = statusFilter === 'all' || statusMatchesFilter(client.status, statusFilter)

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">{clients.length} clients</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto bg-[#C5A572] hover:bg-[#B39562] text-white">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau client
            </Button>
          </DialogTrigger>
          {/* Formulaire en plein écran, menu visible à gauche ; zone scrollable pour voir tout le formulaire + bouton Créer */}
          <DialogContent
            overlayClassName="md:left-16 lg:left-64"
            className="fixed inset-0 z-50 flex h-[100dvh] w-full max-w-none flex-col overflow-hidden rounded-none border-0 bg-background md:left-16 lg:left-64"
          >
            <DialogHeader className="shrink-0 border-b bg-background px-3 py-2 sm:px-4 md:px-6">
              <DialogTitle className="text-base">Nouveau client</DialogTitle>
              <DialogDescription className="text-xs">
                Remplissez les informations du nouveau client
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 md:px-6">
              <ClientForm
                onSuccess={() => {
                  setIsCreateOpen(false)
                  loadClients()
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Zone recherche : saisie du nom pour affichage progressif des clients */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <Input
                type="search"
                placeholder="Rechercher par nom du client (saisir pour afficher les résultats)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 focus-visible:ring-[#C5A572]"
                autoComplete="off"
              />
              {searchTrimmed && (
                <p className="mt-1.5 text-sm text-gray-500">
                  {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} affiché{filteredClients.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto md:min-w-[220px]">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 border-gray-200 focus:border-[#C5A572]">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="first_contact">Premier contact</SelectItem>
                  <SelectItem value="quote_sent">Devis envoyé</SelectItem>
                  <SelectItem value="project_signed">Projet signé</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A572] mx-auto"></div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun client trouvé
            </div>
          ) : (
            <>
              {/* Vue cartes mobile */}
              <div className="space-y-3 md:hidden">
                {filteredClients.map((client) => (
                  <Card key={client.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">
                          {client.first_name} {client.last_name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{client.email}</p>
                        {client.phone && (
                          <p className="text-sm text-gray-500">{client.phone}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge className={statusColors[client.status]}>
                            {statusLabels[client.status]}
                          </Badge>
                          {client.property_type && (
                            <span className="text-xs text-gray-500">{client.property_type}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => {
                            setSelectedClient(client)
                            setIsDetailOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => {
                            setSelectedClient(client)
                            setIsEditOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => handleDelete(client.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              {/* Tableau tablette / desktop */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Type de bien</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          {client.first_name} {client.last_name}
                        </TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell>{client.property_type || '-'}</TableCell>
                        <TableCell>
                          {client.estimated_budget
                            ? `${client.estimated_budget.toLocaleString()} FCFA`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[client.status]}>
                            {statusLabels[client.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedClient(client)
                                setIsDetailOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedClient(client)
                                setIsEditOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(client.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedClient && (
            <ClientDetail clientId={selectedClient.id} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <ClientForm
              clientId={selectedClient.id}
              onSuccess={() => {
                setIsEditOpen(false)
                loadClients()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
