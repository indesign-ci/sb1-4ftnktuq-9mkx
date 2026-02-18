'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ProjectForm } from '@/components/projects/project-form'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Edit,
  Calendar,
  MapPin,
  User,
  Building,
  Euro,
  TrendingUp,
  Clock,
  FileText,
  Image as ImageIcon,
  CheckSquare,
  Activity,
  Phone,
  Mail,
} from 'lucide-react'
import { format } from 'date-fns'
import { getPhaseLabel, getStatusBadgeColor, formatCurrency, calculateMargin } from '@/lib/project-utils'

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useAuth()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [phases, setPhases] = useState([])
  const [tasks, setTasks] = useState([])
  const [documents, setDocuments] = useState([])
  const [moodboards, setMoodboards] = useState([])
  const [activities, setActivities] = useState([])

  useEffect(() => {
    loadProject()
    loadPhases()
    loadTasks()
    loadDocuments()
    loadMoodboards()
    loadActivities()
  }, [params.id])

  const loadProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          clients (id, first_name, last_name, email, phone, address, city, postal_code),
          profiles (id, first_name, last_name, email)
        `)
        .eq('id', params.id)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        toast.error('Projet introuvable')
        router.push('/projects')
        return
      }

      setProject(data)
    } catch (error) {
      console.error('Error loading project:', error)
      toast.error('Erreur lors du chargement du projet')
    } finally {
      setLoading(false)
    }
  }

  const loadPhases = async () => {
    try {
      const { data, error } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', params.id)
        .order('order_index', { ascending: true })

      if (error) throw error
      setPhases(data || [])
    } catch (error) {
      console.error('Error loading phases:', error)
    }
  }

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(first_name, last_name)
        `)
        .eq('project_id', params.id)
        .order('due_date', { ascending: true })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', params.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
    }
  }

  const loadMoodboards = async () => {
    try {
      const { data, error } = await supabase
        .from('moodboards')
        .select('*')
        .eq('project_id', params.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMoodboards(data || [])
    } catch (error) {
      console.error('Error loading moodboards:', error)
    }
  }

  const loadActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          user:profiles!activities_user_id_fkey(first_name, last_name)
        `)
        .eq('project_id', params.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Error loading activities:', error)
    }
  }

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false)
    loadProject()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A572]"></div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  const margin = calculateMargin(
    Number(project.budget_estimated) || 0,
    Number(project.budget_spent) || 0
  )

  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const taskProgress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/projects')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-1">
              {project.clients ? (
                <span>
                  {project.clients.first_name} {project.clients.last_name}
                </span>
              ) : (
                'Aucun client assigné'
              )}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsEditDialogOpen(true)}
          className="bg-[#C5A572] hover:bg-[#B39562] text-white"
        >
          <Edit className="mr-2 h-4 w-4" />
          Modifier
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Statut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusBadgeColor(project.status)}>
              {project.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Phase actuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{getPhaseLabel(project.current_phase)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={Number(project.progress) || 0} className="h-2" />
              <p className="text-lg font-semibold">{Math.round(Number(project.progress) || 0)}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date de livraison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {project.deadline
                ? format(new Date(project.deadline), 'dd/MM/yyyy')
                : 'Non définie'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations du projet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.description && (
                <div>
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600">{project.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {project.address && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Adresse
                    </h3>
                    <p className="text-gray-600">
                      {project.address}
                      {project.city && (
                        <>
                          <br />
                          {project.postal_code} {project.city}
                        </>
                      )}
                    </p>
                  </div>
                )}

                {project.profiles && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-1 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Architecte
                    </h3>
                    <p className="text-gray-600">
                      {project.profiles.first_name} {project.profiles.last_name}
                    </p>
                    {project.profiles.email && (
                      <p className="text-sm text-gray-500">{project.profiles.email}</p>
                    )}
                  </div>
                )}

                {project.surface_area && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-1 flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Surface
                    </h3>
                    <p className="text-gray-600">{project.surface_area} m²</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Budget et finances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">Budget estimé</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(Number(project.budget_estimated) || 0)}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">Dépensé</h3>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(Number(project.budget_spent) || 0)}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">Marge</h3>
                  <p
                    className={`text-2xl font-bold ${
                      margin.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(margin.amount)}
                  </p>
                  <p
                    className={`text-sm ${
                      margin.amount >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {margin.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Phases du projet</CardTitle>
              <CardDescription>
                {phases.filter((p) => p.is_completed).length} sur {phases.length} phases complétées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {phases.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune phase définie</p>
              ) : (
                <div className="space-y-3">
                  {phases.map((phase) => (
                    <div
                      key={phase.id}
                      className={`p-4 rounded-lg border ${
                        phase.is_completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckSquare
                            className={`h-5 w-5 ${
                              phase.is_completed ? 'text-green-600' : 'text-gray-400'
                            }`}
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900">{phase.name}</h4>
                            {phase.description && (
                              <p className="text-sm text-gray-600 mt-1">{phase.description}</p>
                            )}
                          </div>
                        </div>
                        {phase.is_completed && phase.completed_at && (
                          <Badge variant="outline" className="bg-white">
                            {format(new Date(phase.completed_at), 'dd/MM/yyyy')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {project.clients && (
            <Card>
              <CardHeader>
                <CardTitle>Informations client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold text-sm text-gray-700 mb-1">Nom</h3>
                  <p className="text-gray-900">
                    {project.clients.first_name} {project.clients.last_name}
                  </p>
                </div>
                {project.clients.email && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-1 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </h3>
                    <a
                      href={`mailto:${project.clients.email}`}
                      className="text-[#C5A572] hover:underline"
                    >
                      {project.clients.email}
                    </a>
                  </div>
                )}
                {project.clients.phone && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-1 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Téléphone
                    </h3>
                    <a
                      href={`tel:${project.clients.phone}`}
                      className="text-[#C5A572] hover:underline"
                    >
                      {project.clients.phone}
                    </a>
                  </div>
                )}
                {project.clients.address && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Adresse
                    </h3>
                    <p className="text-gray-600">
                      {project.clients.address}
                      {project.clients.city && (
                        <>
                          <br />
                          {project.clients.postal_code} {project.clients.city}
                        </>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Tâches
              </CardTitle>
              <CardDescription>
                {completedTasks} sur {tasks.length} tâches complétées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune tâche</p>
              ) : (
                <div className="space-y-2">
                  <Progress value={taskProgress} className="h-2 mb-4" />
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {tasks.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className={`p-3 rounded border ${
                          task.status === 'completed'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        {task.due_date && (
                          <p className="text-xs text-gray-500 mt-1">
                            Échéance: {format(new Date(task.due_date), 'dd/MM/yyyy')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {tasks.length > 5 && (
                    <p className="text-sm text-gray-500 text-center mt-2">
                      et {tasks.length - 5} autres tâches...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucun document</p>
              ) : (
                <div className="space-y-2">
                  {documents.slice(0, 5).map((doc) => (
                    <div key={doc.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                    </div>
                  ))}
                  {documents.length > 5 && (
                    <p className="text-sm text-gray-500 text-center mt-2">
                      et {documents.length - 5} autres documents...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Moodboards
              </CardTitle>
            </CardHeader>
            <CardContent>
              {moodboards.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucun moodboard</p>
              ) : (
                <div className="space-y-2">
                  {moodboards.slice(0, 3).map((moodboard) => (
                    <div key={moodboard.id} className="p-2 rounded border border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{moodboard.title}</p>
                      {moodboard.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {moodboard.description}
                        </p>
                      )}
                    </div>
                  ))}
                  {moodboards.length > 3 && (
                    <p className="text-sm text-gray-500 text-center mt-2">
                      et {moodboards.length - 3} autres moodboards...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le projet</DialogTitle>
          </DialogHeader>
          <ProjectForm
            project={project}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
