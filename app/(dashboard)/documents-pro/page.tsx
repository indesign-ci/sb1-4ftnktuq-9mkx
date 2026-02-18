'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  FileText,
  ChevronDown,
  MessageSquare,
  Ruler,
  FileSignature,
  Palette,
  HardHat,
  ClipboardCheck,
  CheckCircle,
  Download,
  Send,
  ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

type ProfessionalDocument = {
  id: string
  document_type: string
  document_phase: string
  document_number: string
  title: string
  client_id: string
  project_id: string
  status: string
  created_at: string
  updated_at: string
  clients?: { first_name: string; last_name: string }
  projects?: { name: string }
}

const PHASE_COLORS: Record<string, string> = {
  phase1: '#3B82F6',
  phase2: '#22C55E',
  phase3: '#C5A572',
  phase4: '#8B5CF6',
  phase5: '#F59E0B',
  phase6: '#EF4444',
  phase7: '#059669',
}

const PHASES_CONFIG = [
  {
    id: 'phase1',
    label: 'Prise de Contact',
    icon: MessageSquare,
    color: PHASE_COLORS.phase1,
    documents: [
      { value: 'first_contact', label: 'Fiche de Premier Contact', description: 'Premier rendez-vous, besoins et envies du client', route: '/documents-pro/create/first-contact' },
      { value: 'needs_assessment', label: 'Évaluation des Besoins', description: 'Questionnaire détaillé du projet', route: '/documents-pro/create/needs-assessment' },
    ],
  },
  {
    id: 'phase2',
    label: 'Visite Technique',
    icon: Ruler,
    color: PHASE_COLORS.phase2,
    documents: [
      { value: 'technical_visit', label: 'Compte-Rendu de Visite Technique', description: 'État des lieux complet du bien', route: '/documents-pro/create/technical-visit' },
      { value: 'measurements', label: 'Relevé de Mesures', description: 'Dimensions détaillées de chaque pièce', route: '/documents-pro/create/measurements' },
      { value: 'site_report', label: 'Rapport de Site', description: 'Diagnostic technique et contraintes', route: '/documents-pro/create/site-report' },
    ],
  },
  {
    id: 'phase3',
    label: 'Contractualisation',
    icon: FileSignature,
    color: PHASE_COLORS.phase3,
    documents: [
      { value: 'mission_proposal', label: 'Proposition de Mission', description: 'Prestations et honoraires proposés', route: '/documents-pro/create/mission-proposal' },
      { value: 'design_contract', label: 'Contrat de Maîtrise d\'Œuvre', description: 'Contrat officiel client-architecte', route: '/documents-pro/create/design-contract' },
      { value: 'contrat_maitrise_oeuvre', label: 'Contrat de Maîtrise d\'Œuvre (complet)', description: 'Contrat 12 articles, annexes et signatures', route: '/documents/new/contrat' },
      { value: 'detailed_quote', label: 'Devis Détaillé', description: 'Devis multi-postes avec chiffrage', route: '/documents-pro/create/detailed-quote' },
    ],
  },
  {
    id: 'phase4',
    label: 'Conception',
    icon: Palette,
    color: PHASE_COLORS.phase4,
    documents: [
      { value: 'design_dossier', label: 'Dossier de Conception', description: 'Moodboards, plans, sélection matériaux', route: '/documents-pro/create/design-dossier' },
      { value: 'client_presentation', label: 'Fiche de Présentation Client', description: 'Support de présentation du projet', route: '/documents-pro/create/client-presentation' },
    ],
  },
  {
    id: 'phase5',
    label: 'Préparation Chantier',
    icon: HardHat,
    color: PHASE_COLORS.phase5,
    documents: [
      { value: 'cahier_charges_artisans', label: 'Cahier des Charges Artisans', description: 'Descriptif travaux pour demande de devis aux artisans', route: '/documents/new/cahier-charges' },
      { value: 'quote_comparison', label: 'Comparatif Devis Artisans', description: 'Tableau comparatif des offres reçues', route: '/documents/new/comparatif-devis' },
      { value: 'work_order', label: 'Ordre de Service / Démarrage chantier', description: 'Notification de démarrage des travaux', route: '/documents/new/ordre-service' },
    ],
  },
  {
    id: 'phase6',
    label: 'Suivi de Chantier',
    icon: ClipboardCheck,
    color: PHASE_COLORS.phase6,
    documents: [
      { value: 'site_meeting_report', label: 'Compte-Rendu de Réunion Chantier', description: 'PV de réunion hebdomadaire chantier', route: '/documents/new/compte-rendu-chantier' },
      { value: 'financial_tracking', label: 'Suivi Financier Chantier', description: 'Budget, engagé, facturé par lot', route: '/documents/new/suivi-financier' },
      { value: 'change_order', label: 'Fiche d\'Incident / Avenant', description: 'Modification ou imprévu en cours de chantier', route: '/documents-pro/create/change-order' },
    ],
  },
  {
    id: 'phase7',
    label: 'Réception & Livraison',
    icon: CheckCircle,
    color: PHASE_COLORS.phase7,
    documents: [
      { value: 'acceptance_report', label: 'PV de Réception des Travaux', description: 'Procès-verbal avec ou sans réserves', route: '/documents/new/pv-reception' },
      { value: 'defects_clearance', label: 'Fiche de Levée des Réserves', description: 'Suivi des reprises après réception', route: '/documents/new/levee-reserves' },
      { value: 'completion_certificate', label: 'Attestation de Fin de Travaux', description: 'Certificat de fin de chantier', route: '/documents/new/attestation-fin-travaux' },
      { value: 'as_built_dossier', label: 'Dossier des Ouvrages Exécutés (DOE)', description: 'Dossier technique remis au client', route: '/documents/new/doe' },
      { value: 'delivery_checklist', label: 'Livraison & Checklist Finale', description: 'Vérification complète avant remise des clés', route: '/documents-pro/create/delivery-checklist' },
    ],
  },
]

const ROUTES_BY_TYPE: Record<string, string> = {
  initial_contact: '/documents-pro/create/first-contact',
  first_contact: '/documents-pro/create/first-contact',
  needs_questionnaire: '/documents-pro/create/needs-assessment',
  needs_assessment: '/documents-pro/create/needs-assessment',
  technical_visit: '/documents-pro/create/technical-visit',
  measurements: '/documents-pro/create/measurements',
  measurement_report: '/documents-pro/create/measurements',
  site_report: '/documents-pro/create/site-report',
  mission_proposal: '/documents-pro/create/mission-proposal',
  design_contract: '/documents-pro/create/design-contract',
  quotation: '/documents-pro/create/detailed-quote',
  detailed_quote: '/documents-pro/create/detailed-quote',
  delivery_checklist: '/documents-pro/create/delivery-checklist',
  design_dossier: '/documents-pro/create/design-dossier',
  client_presentation: '/documents-pro/create/client-presentation',
  contractor_specs: '/documents-pro/create/contractor-specs',
  quote_comparison: '/documents/new/comparatif-devis',
  work_order: '/documents/new/ordre-service',
  ordre_service: '/documents/new/ordre-service',
  site_meeting_report: '/documents/new/compte-rendu-chantier',
  compte_rendu_reunion_chantier: '/documents/new/compte-rendu-chantier',
  financial_tracking: '/documents/new/suivi-financier',
  suivi_financier_chantier: '/documents/new/suivi-financier',
  change_order: '/documents-pro/create/change-order',
  acceptance_report: '/documents/new/pv-reception',
  pv_reception_travaux: '/documents/new/pv-reception',
  defects_clearance: '/documents/new/levee-reserves',
  levee_reserves: '/documents/new/levee-reserves',
  completion_certificate: '/documents/new/attestation-fin-travaux',
  attestation_fin_travaux: '/documents/new/attestation-fin-travaux',
  as_built_dossier: '/documents/new/doe',
  doe: '/documents/new/doe',
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-600' },
  finalized: { label: 'Finalisé', className: 'bg-blue-50 text-blue-600' },
  sent: { label: 'Envoyé', className: 'bg-green-50 text-green-600' },
  signed: { label: 'Signé', className: 'bg-amber-50 text-amber-700' },
  archived: { label: 'Archivé', className: 'bg-gray-100 text-gray-500' },
}

const DOCS_PER_PAGE = 15
const totalDocTypes = PHASES_CONFIG.reduce((acc, p) => acc + p.documents.length, 0)

function getDocumentLabel(type: string): string {
  for (const phase of PHASES_CONFIG) {
    const doc = phase.documents.find((d) => d.value === type)
    if (doc) return doc.label
  }
  return type
}

function getPhaseForType(type: string): string {
  for (const phase of PHASES_CONFIG) {
    if (phase.documents.some((d) => d.value === type)) return phase.id
  }
  return ''
}

export default function DocumentsProPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('create')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSearch, setModalSearch] = useState('')
  const [documents, setDocuments] = useState<ProfessionalDocument[]>([])
  const [clients, setClients] = useState<{ id: string; first_name: string; last_name: string }[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [phaseFilter, setPhaseFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [accordionValue, setAccordionValue] = useState<string[]>(['phase1'])

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
    } catch (e: any) {
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
    } catch (e) {
      console.error(e)
      toast.error('Impossible de charger les données')
    }
  }

  useEffect(() => {
    loadDocuments()
    loadClientsAndProjects()
  }, [profile?.company_id])

  const handleCreate = (route: string) => {
    setModalOpen(false)
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
    } catch (e: any) {
      toast.error('Erreur suppression')
    }
  }

  const filteredDocuments = documents.filter((doc: ProfessionalDocument) => {
    const searchLower = search.toLowerCase()
    const matchesSearch =
      !search ||
      doc.title?.toLowerCase().includes(searchLower) ||
      doc.document_number?.toLowerCase().includes(searchLower) ||
      (doc.clients && `${doc.clients.first_name} ${doc.clients.last_name}`.toLowerCase().includes(searchLower)) ||
      (doc.projects && doc.projects.name?.toLowerCase().includes(searchLower))
    const matchesType = typeFilter === 'all' || doc.document_type === typeFilter
    const matchesPhase = phaseFilter === 'all' || doc.document_phase === phaseFilter
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
    const matchesClient = clientFilter === 'all' || doc.client_id === clientFilter
    const matchesProject = projectFilter === 'all' || doc.project_id === projectFilter
    const docDate = new Date(doc.created_at).getTime()
    const matchesDateFrom = !dateFrom || docDate >= new Date(dateFrom).getTime()
    const matchesDateTo = !dateTo || docDate <= new Date(dateTo).setHours(23, 59, 59, 999)
    return matchesSearch && matchesType && matchesPhase && matchesStatus && matchesClient && matchesProject && matchesDateFrom && matchesDateTo
  })

  const paginatedDocuments = filteredDocuments.slice((currentPage - 1) * DOCS_PER_PAGE, currentPage * DOCS_PER_PAGE)
  const totalPages = Math.ceil(filteredDocuments.length / DOCS_PER_PAGE)

  const modalFilteredPhases = PHASES_CONFIG.map((phase) => ({
    ...phase,
    documents: phase.documents.filter(
      (d) =>
        !modalSearch ||
        d.label.toLowerCase().includes(modalSearch.toLowerCase()) ||
        d.description.toLowerCase().includes(modalSearch.toLowerCase())
    ),
  })).filter((p: { documents: unknown[] }) => p.documents.length > 0)

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="mt-1 h-8 w-8 rounded-full border border-gray-200 bg-white shadow-sm hover:border-[#C5A572]"
            onClick={() => router.back()}
            aria-label="Revenir à l'écran précédent"
          >
            <ArrowLeft className="h-4 w-4 text-gray-700" />
          </Button>
          <div>
            <h1
              className="font-serif text-3xl font-light text-gray-900"
              style={{ fontFamily: 'var(--font-playfair), serif' }}
            >
              Documents Professionnels
            </h1>
            <p className="mt-1 text-gray-500">
              Créez et gérez tous vos documents métier
            </p>
          </div>
        </div>
        <Button
          className="w-full md:w-auto bg-[#C5A572] hover:bg-[#B08D5B] text-white shrink-0 rounded-lg shadow-sm"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouveau document
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Rechercher dans tous les documents..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="rounded-lg border-gray-200 pl-9"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 rounded-lg bg-gray-100 p-1">
          <TabsTrigger value="create" className="rounded-md data-[state=active]:bg-[#C5A572] data-[state=active]:text-white">
            Créer un document
          </TabsTrigger>
          <TabsTrigger value="list" className="rounded-md data-[state=active]:bg-[#C5A572] data-[state=active]:text-white">
            Mes documents
          </TabsTrigger>
        </TabsList>

        {/* Tab 1 — Créer un document */}
        <TabsContent value="create" className="mt-6">
          <p className="mb-4 text-sm text-gray-500">
            {totalDocTypes} types de documents disponibles — Par phase de projet
          </p>
          <Accordion type="multiple" value={accordionValue} onValueChange={setAccordionValue} className="space-y-2">
            {PHASES_CONFIG.map((phase) => {
              const Icon = phase.icon
              const isOpen = accordionValue.includes(phase.id)
              return (
                <AccordionItem
                  key={phase.id}
                  value={phase.id}
                  className={cn(
                    'rounded-xl border border-gray-200 bg-white transition-colors duration-200',
                    isOpen && 'ring-1 ring-offset-0'
                  )}
                  style={isOpen ? { backgroundColor: `${phase.color}08` } : undefined}
                >
                  <AccordionTrigger className="px-5 py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    <div className="flex items-center gap-3 text-left">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: phase.color }}
                      >
                        {phase.id.replace('phase', '')}
                      </div>
                      <Icon className="h-5 w-5 shrink-0" style={{ color: phase.color }} />
                      <span className="font-semibold text-gray-900">
                        {phase.label}
                      </span>
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {phase.documents.length}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-500 transition-transform" />
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5 pt-0">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {phase.documents.map((doc) => (
                        <Card
                          key={doc.value}
                          className="group h-full cursor-pointer rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C5A572] hover:shadow-md hover:shadow-amber-200/30"
                          onClick={() => handleCreate(doc.route)}
                        >
                          <CardContent className="flex h-full flex-col p-5">
                            <div
                              className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                              style={{ backgroundColor: `${phase.color}20` }}
                            >
                              <FileText className="h-5 w-5" style={{ color: phase.color }} />
                            </div>
                            <h3 className="font-semibold text-gray-900">{doc.label}</h3>
                            <p className="mt-1 flex-1 text-sm text-gray-500">{doc.description}</p>
                            <button
                              type="button"
                              className="mt-3 text-sm font-medium text-[#C5A572] underline-offset-2 hover:underline"
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleCreate(doc.route) }}
                            >
                              Créer →
                            </button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </TabsContent>

        {/* Tab 2 — Mes documents */}
        <TabsContent value="list" className="mt-6">
          {/* Filters */}
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden border-gray-200"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtres {filtersOpen ? '▼' : '▶'}
            </Button>
            <div
              className={cn(
                'grid gap-3 pt-3',
                filtersOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr] lg:grid-rows-[1fr]'
              )}
            >
              <div className="flex min-h-0 flex-wrap items-end gap-3 overflow-hidden lg:overflow-visible">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full min-w-[180px] rounded-lg sm:w-auto">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {PHASES_CONFIG.flatMap((p: { documents: { value: string; label: string }[] }) => p.documents.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    )))}
                  </SelectContent>
                </Select>
                <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                  <SelectTrigger className="w-full min-w-[160px] rounded-lg sm:w-auto">
                    <SelectValue placeholder="Phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les phases</SelectItem>
                    {PHASES_CONFIG.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full min-w-[140px] rounded-lg sm:w-auto">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-full min-w-[160px] rounded-lg sm:w-auto">
                    <SelectValue placeholder="Projet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les projets</SelectItem>
                    {projects.map((proj: { id: string; name: string }) => (
                      <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="w-full min-w-[160px] rounded-lg sm:w-auto">
                    <SelectValue placeholder="Client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les clients</SelectItem>
                    {clients.map((c: { id: string; first_name: string; last_name: string }) => (
                      <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  placeholder="Du"
                  value={dateFrom}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFrom(e.target.value)}
                  className="w-full min-w-[120px] rounded-lg sm:w-auto"
                />
                <Input
                  type="date"
                  placeholder="Au"
                  value={dateTo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateTo(e.target.value)}
                  className="w-full min-w-[120px] rounded-lg sm:w-auto"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C5A572] border-t-transparent" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <Card className="rounded-xl border-gray-200">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-16 w-16 text-gray-300" />
                <p className="mt-4 text-lg font-medium text-gray-600">Aucun document pour le moment.</p>
                <p className="mt-1 text-sm text-gray-500">Commencez par créer votre premier document.</p>
                <Button className="mt-6 bg-[#C5A572] hover:bg-[#B08D5B] text-white rounded-lg" onClick={() => { setActiveTab('create'); setModalOpen(true) }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Tablette / desktop : tableau avec scroll horizontal si besoin */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 bg-gray-50">
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Titre / Objet</TableHead>
                      <TableHead>Projet</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDocuments.map((doc: ProfessionalDocument) => (
                      <TableRow key={doc.id} className="border-gray-100">
                        <TableCell>
                          <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${PHASE_COLORS[getPhaseForType(doc.document_type)] || '#888'}20`, color: PHASE_COLORS[getPhaseForType(doc.document_type)] || '#333' }}>
                            {getDocumentLabel(doc.document_type)}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{doc.document_number}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{doc.title}</TableCell>
                        <TableCell className="text-gray-600">{doc.projects?.name || '-'}</TableCell>
                        <TableCell className="text-gray-600">
                          {doc.clients ? `${doc.clients.first_name} ${doc.clients.last_name}` : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', STATUS_CONFIG[doc.status]?.className || 'bg-gray-100 text-gray-600')}>
                            {STATUS_CONFIG[doc.status]?.label || doc.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Voir" onClick={() => handleEdit(doc)}>
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

              {/* Vue cartes mobile */}
              <div className="space-y-3 md:hidden">
                {paginatedDocuments.map((doc: ProfessionalDocument) => (
                  <Card key={doc.id} className="rounded-xl border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="mb-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${PHASE_COLORS[getPhaseForType(doc.document_type)] || '#888'}20`, color: PHASE_COLORS[getPhaseForType(doc.document_type)] || '#333' }}>
                            {getDocumentLabel(doc.document_type)}
                          </span>
                          <p className="font-medium text-gray-900">{doc.title}</p>
                          <p className="mt-1 font-mono text-xs text-gray-500">{doc.document_number}</p>
                          <p className="mt-1 text-sm text-gray-600">{doc.projects?.name || '-'} — {doc.clients ? `${doc.clients.first_name} ${doc.clients.last_name}` : '-'}</p>
                          <p className="mt-1 text-xs text-gray-500">{format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })}</p>
                          <span className={cn('mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium', STATUS_CONFIG[doc.status]?.className)}>{STATUS_CONFIG[doc.status]?.label}</span>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(doc)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(doc)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p: number) => p - 1)}>
                    Précédent
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} / {totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p: number) => p + 1)}>
                    Suivant
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Nouveau document — plein écran sur mobile, centré sur desktop */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="flex h-full max-h-[100dvh] w-full max-w-none flex-col rounded-none border-0 p-0 md:h-auto md:max-h-[85vh] md:max-w-lg md:rounded-xl md:border">
          <DialogHeader className="shrink-0 border-b px-4 py-4 md:px-6">
            <DialogTitle className="font-serif text-lg md:text-xl">Quel document souhaitez-vous créer ?</DialogTitle>
          </DialogHeader>
          <div className="shrink-0 px-4 pb-2 md:px-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher un type de document..."
                value={modalSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModalSearch(e.target.value)}
                className="rounded-lg pl-9"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 md:max-h-[calc(85vh-180px)] md:px-6">
            {modalFilteredPhases.map((phase) => {
              const Icon = phase.icon
              return (
                <div key={phase.id} className="mb-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full text-xs text-white" style={{ backgroundColor: phase.color }}>
                      {phase.id.replace('phase', '')}
                    </div>
                    <Icon className="h-4 w-4" style={{ color: phase.color }} />
                    {phase.label}
                  </div>
                  <ul className="space-y-1">
                    {phase.documents.map((doc) => (
                      <li key={doc.value}>
                        <button
                          type="button"
                          className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-100"
                          onClick={() => handleCreate(doc.route)}
                        >
                          <FileText className="mt-0.5 h-4 w-4 shrink-0" style={{ color: phase.color }} />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">{doc.label}</p>
                            <p className="text-xs text-gray-500">{doc.description}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
            {modalFilteredPhases.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-500">Aucun document ne correspond à la recherche.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
