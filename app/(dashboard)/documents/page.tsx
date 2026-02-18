'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, Filter, Eye, Edit, Trash2, Download, Send, FileText, ChevronDown, FileStack } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  DOCUMENT_PHASES,
  STATUS_CONFIG,
  PHASE_COLORS,
  ROUTES_BY_TYPE,
  getDocumentLabel,
  getPhaseForType,
  getAllDocumentTypes,
} from '@/lib/documents-pro-config'

type ProfessionalDocument = {
  id: string
  document_type: string
  document_phase: string
  document_number: string
  title: string
  client_id: string | null
  project_id: string | null
  status: string
  created_at: string
  updated_at: string
  clients?: { first_name: string; last_name: string } | null
  projects?: { name: string } | null
}

const DOCS_PER_PAGE = 20

export default function DocumentsPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [documents, setDocuments] = useState<ProfessionalDocument[]>([])
  const [clients, setClients] = useState<{ id: string; first_name: string; last_name: string }[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [newDocOpen, setNewDocOpen] = useState(false)
  const [newDocSearch, setNewDocSearch] = useState('')

  const loadDocuments = async () => {
    try {
      let query = supabase
        .from('professional_documents')
        .select('*, clients(first_name, last_name), projects(name)')
        .order('created_at', { ascending: false })
      if (profile?.company_id) query = query.eq('company_id', profile.company_id)
      const { data, error } = await query
      if (error) throw error
      setDocuments(data || [])
    } catch {
      toast.error('Erreur chargement documents')
    } finally {
      setLoading(false)
    }
  }

  const loadClientsAndProjects = async () => {
    if (!profile?.company_id) return
    try {
      const [cRes, pRes] = await Promise.all([
        supabase.from('clients').select('id, first_name, last_name').eq('company_id', profile.company_id),
        supabase.from('projects').select('id, name').eq('company_id', profile.company_id).is('deleted_at', null),
      ])
      if (cRes.data) setClients(cRes.data)
      if (pRes.data) setProjects(pRes.data)
    } catch {
      toast.error('Impossible de charger les données')
    }
  }

  useEffect(() => {
    loadDocuments()
    loadClientsAndProjects()
  }, [profile?.company_id])

  const handleCreate = (route: string) => {
    setNewDocOpen(false)
    router.push(route)
  }

  const handleEdit = (doc: ProfessionalDocument) => {
    const route = ROUTES_BY_TYPE[doc.document_type]
    if (route) router.push(`${route}?edit=${doc.id}`)
    else toast.info('Édition non disponible pour ce type')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce document ?')) return
    try {
      const { error } = await supabase.from('professional_documents').delete().eq('id', id)
      if (error) throw error
      toast.success('Document supprimé')
      loadDocuments()
    } catch {
      toast.error('Erreur suppression')
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const searchLower = search.toLowerCase()
    const matchesSearch =
      !search ||
      doc.title?.toLowerCase().includes(searchLower) ||
      doc.document_number?.toLowerCase().includes(searchLower) ||
      (doc.clients && `${doc.clients.first_name} ${doc.clients.last_name}`.toLowerCase().includes(searchLower)) ||
      (doc.projects && doc.projects.name?.toLowerCase().includes(searchLower))
    const matchesType = typeFilter === 'all' || doc.document_type === typeFilter
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
    const matchesClient = clientFilter === 'all' || doc.client_id === clientFilter
    const matchesProject = projectFilter === 'all' || doc.project_id === projectFilter
    return matchesSearch && matchesType && matchesStatus && matchesClient && matchesProject
  })

  const paginatedDocuments = filteredDocuments.slice((currentPage - 1) * DOCS_PER_PAGE, currentPage * DOCS_PER_PAGE)
  const totalPages = Math.ceil(filteredDocuments.length / DOCS_PER_PAGE)

  const allTypes = getAllDocumentTypes()
  const newDocFiltered = newDocSearch
    ? allTypes.filter(
        (d) =>
          d.label.toLowerCase().includes(newDocSearch.toLowerCase()) ||
          d.description.toLowerCase().includes(newDocSearch.toLowerCase())
      )
    : allTypes

  return (
    <div className="space-y-6 pb-8">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] tracking-tight">Documents professionnels</h1>
          <p className="mt-1 text-gray-500">De la première visite client à la livraison du chantier</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="border-gray-200">
            <Link href="/documents/fichiers">
              <FileStack className="mr-2 h-4 w-4" />
              Pièces jointes
            </Link>
          </Button>
          <DropdownMenu open={newDocOpen} onOpenChange={setNewDocOpen}>
            <DropdownMenuTrigger asChild>
              <Button className="bg-[#C5A572] hover:bg-[#B08D5B] text-white">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau document
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[360px] max-h-[70vh] overflow-hidden flex flex-col">
              <DropdownMenuLabel className="font-normal">
                <Input
                  placeholder="Rechercher un type..."
                  value={newDocSearch}
                  onChange={(e) => setNewDocSearch(e.target.value)}
                  className="h-9"
                />
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="overflow-y-auto max-h-[50vh] p-1">
                {DOCUMENT_PHASES.map((phase) => (
                  <div key={phase.id} className="mb-2">
                    <p className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {phase.emoji} {phase.label}
                    </p>
                    {phase.documents
                      .filter((d) => !newDocSearch || d.label.toLowerCase().includes(newDocSearch.toLowerCase()) || d.description.toLowerCase().includes(newDocSearch.toLowerCase()))
                      .map((doc) => (
                        <DropdownMenuItem key={doc.value} onClick={() => handleCreate(doc.route)} className="cursor-pointer">
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="font-medium">{doc.label}</span>
                            <span className="text-xs text-gray-500">{doc.description}</span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                  </div>
                ))}
                {newDocFiltered.length === 0 && (
                  <p className="py-4 text-center text-sm text-gray-500">Aucun type trouvé.</p>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Rechercher par mot-clé (numéro, titre, client, projet…)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-lg border-gray-200"
        />
      </div>

      {/* Filtres */}
      <div className="space-y-3">
        <Button variant="outline" size="sm" className="lg:hidden border-gray-200" onClick={() => setFiltersOpen(!filtersOpen)}>
          <Filter className="mr-2 h-4 w-4" />
          Filtres {filtersOpen ? '▼' : '▶'}
        </Button>
        <div className={`flex flex-wrap items-end gap-3 ${filtersOpen ? '' : 'max-lg:hidden'}`}>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px] rounded-lg">
              <SelectValue placeholder="Type de document" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {allTypes.map((d) => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] rounded-lg">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[200px] rounded-lg">
              <SelectValue placeholder="Projet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les projets</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[200px] rounded-lg">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les clients</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C5A572] border-t-transparent" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card className="rounded-xl border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-16 w-16 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-600">Aucun document pour le moment.</p>
            <p className="mt-1 text-sm text-gray-500">Créez votre premier document avec le bouton &quot;Nouveau document&quot;.</p>
            <Button className="mt-6 bg-[#C5A572] hover:bg-[#B08D5B] text-white rounded-lg" onClick={() => setNewDocOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 overflow-x-auto bg-white">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 bg-[#F5F5F5]">
                  <TableHead className="font-semibold text-[#1A1A1A]">Type</TableHead>
                  <TableHead className="font-semibold text-[#1A1A1A]">Numéro</TableHead>
                  <TableHead className="font-semibold text-[#1A1A1A]">Projet</TableHead>
                  <TableHead className="font-semibold text-[#1A1A1A]">Client</TableHead>
                  <TableHead className="font-semibold text-[#1A1A1A]">Date</TableHead>
                  <TableHead className="font-semibold text-[#1A1A1A]">Statut</TableHead>
                  <TableHead className="text-right font-semibold text-[#1A1A1A]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDocuments.map((doc) => (
                  <TableRow key={doc.id} className="border-gray-100">
                    <TableCell>
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: `${PHASE_COLORS[getPhaseForType(doc.document_type)] || '#888'}20`,
                          color: PHASE_COLORS[getPhaseForType(doc.document_type)] || '#333',
                        }}
                      >
                        {getDocumentLabel(doc.document_type)}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[#1A1A1A]">{doc.document_number}</TableCell>
                    <TableCell className="text-gray-600">{doc.projects?.name ?? '—'}</TableCell>
                    <TableCell className="text-gray-600">
                      {doc.clients ? `${doc.clients.first_name} ${doc.clients.last_name}` : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', STATUS_CONFIG[doc.status]?.className ?? 'bg-gray-100 text-gray-600')}>
                        {STATUS_CONFIG[doc.status]?.label ?? doc.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Voir / Modifier" onClick={() => handleEdit(doc)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifier" onClick={() => handleEdit(doc)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Télécharger PDF">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Envoyer par email">
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" title="Supprimer" onClick={() => handleDelete(doc.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                Précédent
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                Suivant
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
