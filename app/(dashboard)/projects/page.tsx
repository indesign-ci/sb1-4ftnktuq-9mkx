'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ProjectsTable } from '@/components/projects/projects-table'
import { ProjectForm } from '@/components/projects/project-form'
import { toast } from 'sonner'
import { Plus, Search, LayoutGrid, Table as TableIcon } from 'lucide-react'
import { PROJECT_PHASES, PROJECT_STATUSES } from '@/lib/project-utils'

type ProjectRow = {
  id: string
  name: string
  status: string
  current_phase?: string
  architect_id?: string | null
  clients?: { id: string; first_name: string; last_name: string } | null
  profiles?: { id: string; first_name: string; last_name: string } | null
  [key: string]: unknown
}

type ArchitectProfile = {
  id: string
  first_name: string | null
  last_name: string | null
}

export default function ProjectsPage() {
  const { profile } = useAuth()
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [filteredProjects, setFilteredProjects] = useState<ProjectRow[]>([])
  const [architects, setArchitects] = useState<ArchitectProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [phaseFilter, setPhaseFilter] = useState('all')
  const [architectFilter, setArchitectFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    loadProjects()
    loadArchitects()
  }, [])

  useEffect(() => {
    filterProjects()
  }, [projects, searchQuery, statusFilter, phaseFilter, architectFilter])

  const loadProjects = async () => {
    try {
      let query = supabase
        .from('projects')
        .select(`
          *,
          clients (id, first_name, last_name),
          profiles (id, first_name, last_name)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      // Filter by company_id only if profile exists
      if (profile?.company_id) {
        query = query.eq('company_id', profile.company_id)
      }

      const { data, error } = await query

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      toast.error('Erreur lors du chargement des projets')
    } finally {
      setLoading(false)
    }
  }

  const loadArchitects = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('is_active', true)

      // Filter by company_id only if profile exists
      if (profile?.company_id) {
        query = query.eq('company_id', profile.company_id)
      }

      const { data, error } = await query

      if (error) throw error
      setArchitects(data || [])
    } catch {
      toast.error('Erreur lors du chargement des architectes')
    }
  }

  const filterProjects = () => {
    let filtered = [...projects]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          `${p.clients?.first_name} ${p.clients?.last_name}`.toLowerCase().includes(query)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter)
    }

    if (phaseFilter !== 'all') {
      filtered = filtered.filter((p) => p.current_phase === phaseFilter)
    }

    if (architectFilter !== 'all') {
      filtered = filtered.filter((p) => p.architect_id === architectFilter)
    }

    setFilteredProjects(filtered)
    setCurrentPage(1)
  }

  const handleCreate = () => {
    setEditingProject(null)
    setIsFormOpen(true)
  }

  const handleEdit = (project: ProjectRow) => {
    setEditingProject(project)
    setIsFormOpen(true)
  }

  const handleDelete = async (project: ProjectRow) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', project.id)

      if (error) throw error

      toast.success('Projet supprimé')
      loadProjects()
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingProject(null)
    loadProjects()
  }

  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Projets</h1>
          <p className="text-gray-600 mt-1">Gestion de vos projets d'architecture d'intérieur</p>
        </div>
        <Button onClick={handleCreate} className="w-full md:w-auto bg-[#C5A572] hover:bg-[#B39562] text-white">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau projet
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom ou client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {PROJECT_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={phaseFilter} onValueChange={setPhaseFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Phase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les phases</SelectItem>
            {PROJECT_PHASES.map((phase) => (
              <SelectItem key={phase.key} value={phase.key}>
                {phase.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={architectFilter} onValueChange={setArchitectFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Architecte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les architectes</SelectItem>
            {architects.map((architect) => (
              <SelectItem key={architect.id} value={architect.id}>
                {architect.first_name} {architect.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('table')}
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <p>
          {filteredProjects.length} projet{filteredProjects.length > 1 ? 's' : ''} trouvé{filteredProjects.length > 1 ? 's' : ''}
        </p>
        {totalPages > 1 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Précédent
            </Button>
            <span className="flex items-center px-3">
              Page {currentPage} sur {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A572]"></div>
        </div>
      ) : (
        <ProjectsTable
          projects={paginatedProjects}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        {/* Plein écran mobile, centré sur desktop */}
        <DialogContent className="flex h-full max-h-[100dvh] w-full max-w-none flex-col rounded-none border-0 p-4 md:h-auto md:max-h-[90vh] md:max-w-3xl md:rounded-lg md:border md:p-6 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? 'Modifier le projet' : 'Nouveau projet'}
            </DialogTitle>
          </DialogHeader>
          <ProjectForm
            project={editingProject}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
