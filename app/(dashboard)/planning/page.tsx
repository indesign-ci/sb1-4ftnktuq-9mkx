// @ts-nocheck
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, LayoutGrid, Calendar, List, GanttChart } from 'lucide-react'
import { toast } from 'sonner'
import { CalendarView } from '@/components/planning/calendar-view'
import { EventForm } from '@/components/planning/event-form'
import { EventDetail } from '@/components/planning/event-detail'
import { GanttView } from '@/components/planning/gantt-view'
import { PlanningKanban } from '@/components/planning/planning-kanban'
import { PlanningList } from '@/components/planning/planning-list'
import { TaskDetailSheet, type PlanningTask } from '@/components/planning/task-detail-sheet'
import { PlanningWorkload } from '@/components/planning/planning-workload'
import { PROJECT_PHASES, DEFAULT_TASKS_BY_PHASE } from '@/lib/project-utils'
import { addMonths, startOfMonth, endOfMonth, addDays } from 'date-fns'

type MainView = 'gantt' | 'calendar' | 'kanban' | 'list' | 'workload'
type Zoom = 'day' | 'week' | 'month'

const DEMO_MILESTONES = [
  'Validation client',
  'Démarrage chantier',
  'Livraison mobilier',
  'Réception travaux',
]

function generateId() {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function PlanningPage() {
  const { profile } = useAuth()
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [phases, setPhases] = useState<{ id: string; name: string; order_index?: number; key?: string }[]>([])
  const [tasks, setTasks] = useState<PlanningTask[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [assignees, setAssignees] = useState<{ id: string; first_name: string; last_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [mainView, setMainView] = useState<MainView>('gantt')
  const [zoom, setZoom] = useState<Zoom>('week')
  const [taskSheetOpen, setTaskSheetOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<PlanningTask | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [listFilters, setListFilters] = useState({
    projectId: 'all',
    phaseKey: 'all',
    status: 'all',
  })
  const [overdueCount, setOverdueCount] = useState(0)
  const [dueSoonCount, setDueSoonCount] = useState(0)
  const [showDeadlinesOnly, setShowDeadlinesOnly] = useState(false)

  const loadProjects = async () => {
    try {
      let query = supabase
        .from('projects')
        .select('id, name')
        .is('deleted_at', null)
        .order('name')
      if (profile?.company_id) query = query.eq('company_id', profile.company_id)
      const { data, error } = await query
      if (error) throw error
      setProjects(data || [])
      if (data?.length && !selectedProjectId) setSelectedProjectId(data[0].id)
    } catch (e) {
      console.error(e)
      toast.error('Erreur chargement projets')
    }
  }

  const loadPhases = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })
      if (error) throw error
      const list = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        order_index: p.order_index ?? p.order_number,
        key: p.phase_key || p.key,
      }))
      setPhases(list)
      return list
    } catch (e) {
      console.error(e)
      setPhases([])
      return []
    }
  }

  const loadTasks = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(first_name, last_name)
        `)
        .eq('project_id', projectId)
      if (error) throw error
      if (data && data.length > 0) {
        const mapped: PlanningTask[] = data.map((t: any) => ({
          id: t.id,
          project_id: t.project_id,
          phase_id: t.phase_id,
          phase_key: t.phase,
          phase_name: t.phase,
          title: t.title,
          start_date: t.start_date || t.due_date,
          end_date: t.end_date || t.due_date,
          status: t.status || 'todo',
          progress: t.progress ?? 0,
          priority: t.priority || 'medium',
          assigned_to: t.assigned_to,
          assigned_to_name: t.assigned_to_profile
            ? `${t.assigned_to_profile.first_name} ${t.assigned_to_profile.last_name}`
            : undefined,
          notes: t.notes,
          is_milestone: t.is_milestone,
        }))
        setTasks(mapped)
        return
      }
      const phaseList = await loadPhases(projectId)
      const demoPhases = phaseList.length ? phaseList : PROJECT_PHASES.map((p, i) => ({ id: p.key, name: p.name, order_index: i, key: p.key }))
      const projectStart = new Date()
      const demo: PlanningTask[] = []
      demoPhases.forEach((phase, pi) => {
        const titles = DEFAULT_TASKS_BY_PHASE[(pi + 1) as keyof typeof DEFAULT_TASKS_BY_PHASE] as string[] | undefined
        if (titles) {
          titles.forEach((title, ti) => {
            const start = addDays(projectStart, pi * 14 + ti * 2)
            demo.push({
              id: generateId(),
              project_id: projectId,
              phase_id: phase.id,
              phase_key: phase.key,
              phase_name: phase.name,
              title,
              start_date: start.toISOString().slice(0, 10),
              end_date: addDays(start, 1).toISOString().slice(0, 10),
              status: ti === 0 ? 'in_progress' : 'todo',
              progress: ti === 0 ? 30 : 0,
              priority: 'medium',
              notes: '',
              is_milestone: false,
            })
          })
        }
      })
      DEMO_MILESTONES.forEach((title, i) => {
        demo.push({
          id: generateId(),
          project_id: projectId,
          phase_id: '',
          phase_name: 'Jalons',
          title,
          start_date: addDays(projectStart, (i + 1) * 21).toISOString().slice(0, 10),
          end_date: addDays(projectStart, (i + 1) * 21).toISOString().slice(0, 10),
          status: 'todo',
          progress: 0,
          priority: 'high',
          is_milestone: true,
        })
      })
      setTasks(demo)
    } catch (e) {
      console.error(e)
      setTasks([])
    }
  }

  const loadTasksAllProjects = async () => {
    try {
      let query = supabase
        .from('tasks')
        .select(
          `
          *,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(first_name, last_name)
        `
        )
      if (profile?.company_id) query = query.eq('company_id', profile.company_id)
      const { data, error } = await query
      if (error) throw error
      const mapped: PlanningTask[] = (data || []).map((t: any) => ({
        id: t.id,
        project_id: t.project_id,
        phase_id: t.phase_id,
        phase_key: t.phase,
        phase_name: t.phase,
        title: t.title,
        start_date: t.start_date || t.due_date,
        end_date: t.end_date || t.due_date,
        status: t.status || 'todo',
        progress: t.progress ?? 0,
        priority: t.priority || 'medium',
        assigned_to: t.assigned_to,
        assigned_to_name: t.assigned_to_profile
          ? `${t.assigned_to_profile.first_name} ${t.assigned_to_profile.last_name}`
          : undefined,
        notes: t.notes,
        is_milestone: t.is_milestone,
      }))
      setTasks(mapped)
    } catch (e) {
      console.error(e)
      setTasks([])
    }
  }

  const loadEvents = async () => {
    try {
      let query = supabase
        .from('events')
        .select('*, clients(first_name, last_name), projects(name)')
        .order('start_datetime', { ascending: true })
      if (profile?.company_id) query = query.eq('company_id', profile.company_id)
      const { data, error } = await query
      if (error) throw error
      setEvents(data || [])
    } catch (e) {
      toast.error('Erreur chargement événements')
    }
  }

  const loadAssignees = async () => {
    try {
      let query = supabase.from('profiles').select('id, first_name, last_name').eq('is_active', true)
      if (profile?.company_id) query = query.eq('company_id', profile.company_id)
      const { data, error } = await query
      if (error) throw error
      setAssignees(data || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      await loadProjects()
      await loadAssignees()
      await loadEvents()
      setLoading(false)
    })()
  }, [])

  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== 'all') {
      loadPhases(selectedProjectId)
      loadTasks(selectedProjectId)
    } else if (selectedProjectId === 'all') {
      setPhases([])
      loadTasksAllProjects()
    } else {
      setPhases([])
      setTasks([])
    }
  }, [selectedProjectId])

  useEffect(() => {
    if (!tasks.length) {
      setOverdueCount(0)
      setDueSoonCount(0)
      setShowDeadlinesOnly(false)
      return
    }
    const now = new Date()
    const threeDays = 3 * 24 * 60 * 60 * 1000
    let overdue = 0
    let dueSoon = 0
    tasks.forEach((t) => {
      if (!t.end_date || t.status === 'completed') return
      const end = new Date(t.end_date)
      const diff = end.getTime() - now.getTime()
      if (end < now) overdue++
      else if (diff <= threeDays && diff >= 0) dueSoon++
    })
    setOverdueCount(overdue)
    setDueSoonCount(dueSoon)
    if (overdue > 0) {
      toast.error(`${overdue} tâche${overdue > 1 ? 's' : ''} en retard dans le planning`)
    } else if (dueSoon > 0) {
      toast.warning(
        `${dueSoon} tâche${dueSoon > 1 ? 's' : ''} arrive${
          dueSoon > 1 ? 'nt' : ''
        } à échéance sous 3 jours`
      )
    }
  }, [tasks])

  const projectStart = useMemo(() => {
    if (tasks.length === 0) return startOfMonth(new Date())
    const dates = tasks
      .filter((t) => t.start_date)
      .map((t) => new Date(t.start_date).getTime())
    return new Date(Math.min(...dates))
  }, [tasks])

  const projectEnd = useMemo(() => {
    if (tasks.length === 0) return endOfMonth(addMonths(new Date(), 2))
    const dates = tasks
      .filter((t) => t.end_date)
      .map((t) => new Date(t.end_date).getTime())
    return new Date(Math.max(...dates))
  }, [tasks])

  const milestones = useMemo(() => tasks.filter((t) => t.is_milestone), [tasks])
  const taskBars = useMemo(() => tasks.filter((t) => !t.is_milestone), [tasks])
  const projectNames = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.name])),
    [projects]
  )

  const handleTaskClick = (task: PlanningTask) => {
    setSelectedTask(task)
    setTaskSheetOpen(true)
  }

  const handleSaveTask = (updated: PlanningTask) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    )
    setTaskSheetOpen(false)
    setSelectedTask(null)
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    setTaskSheetOpen(false)
    setSelectedTask(null)
    toast.success('Tâche supprimée')
  }

  const handleStatusChange = (taskId: string, newStatus: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )
  }

  const handleAddTask = () => {
    if (!selectedProjectId) {
      toast.error('Sélectionnez un projet')
      return
    }
    const start = new Date()
    const end = addDays(start, 1)
    const newTask: PlanningTask = {
      id: generateId(),
      project_id: selectedProjectId,
      phase_id: phases[0]?.id,
      phase_key: phases[0]?.key,
      phase_name: phases[0]?.name,
      title: 'Nouvelle tâche',
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      status: 'todo',
      progress: 0,
      priority: 'medium',
      is_milestone: false,
    }
    setTasks((prev) => [...prev, newTask])
    setSelectedTask(newTask)
    setTaskSheetOpen(true)
  }

  const handleAddMilestone = () => {
    if (!selectedProjectId) {
      toast.error('Sélectionnez un projet')
      return
    }
    const d = addDays(new Date(), 14)
    const newTask: PlanningTask = {
      id: generateId(),
      project_id: selectedProjectId,
      phase_name: 'Jalons',
      title: 'Nouveau jalon',
      start_date: d.toISOString().slice(0, 10),
      end_date: d.toISOString().slice(0, 10),
      status: 'todo',
      progress: 0,
      priority: 'high',
      is_milestone: true,
    }
    setTasks((prev) => [...prev, newTask])
    setSelectedTask(newTask)
    setTaskSheetOpen(true)
  }

  const handleEventClick = (event: any) => {
    setSelectedEvent(event)
    setIsDetailOpen(true)
  }
  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setIsCreateOpen(true)
  }
  const handleDeleteEvent = async () => {
    if (!selectedEvent?.id || !confirm('Supprimer cet événement ?')) return
    try {
      await supabase.from('events').delete().eq('id', selectedEvent.id)
      toast.success('Événement supprimé')
      setIsDetailOpen(false)
      setSelectedEvent(null)
      loadEvents()
    } catch (e) {
      toast.error('Erreur suppression')
    }
  }
  const handleEditEvent = () => {
    setIsDetailOpen(false)
    setIsEditOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#C5A572] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-light text-gray-900">
            Planning
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-3">
            Gestion de projet et chantier
            {(overdueCount > 0 || dueSoonCount > 0) && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 text-xs px-3 py-1 border border-red-100 hover:bg-red-100"
                onClick={() => {
                  setShowDeadlinesOnly(true)
                  setMainView('list')
                }}
              >
                {overdueCount > 0 && <span>{overdueCount} en retard</span>}
                {dueSoonCount > 0 && <span>{dueSoonCount} à échéance</span>}
              </button>
            )}
          </p>
        </div>
      </div>

      <Card className="rounded-xl shadow-sm border-gray-200 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Select
              value={selectedProjectId || ''}
              onValueChange={(v) => setSelectedProjectId(v || null)}
            >
              <SelectTrigger className="w-[240px] rounded-lg">
                <SelectValue placeholder="Sélectionner un projet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les projets</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex rounded-lg border border-gray-200 p-1">
              {(
                [
                  { id: 'gantt', label: 'Gantt', icon: GanttChart },
                  { id: 'calendar', label: 'Calendrier', icon: Calendar },
                  { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
                  { id: 'list', label: 'Liste', icon: List },
                  { id: 'workload', label: 'Charge', icon: Calendar },
                ] as const
              ).map((v) => (
                <Button
                  key={v.id}
                  variant={mainView === v.id ? 'default' : 'ghost'}
                  size="sm"
                  className={
                    mainView === v.id
                      ? 'bg-[#C5A572] hover:bg-[#B08D5B] text-white rounded-md'
                      : 'rounded-md'
                  }
                  onClick={() => setMainView(v.id as MainView)}
                >
                  <v.icon className="h-4 w-4 mr-1.5" />
                  {v.label}
                </Button>
              ))}
            </div>

            {mainView === 'gantt' && (
              <div className="flex rounded-lg border border-gray-200 p-1">
                {(['day', 'week', 'month'] as const).map((z) => (
                  <Button
                    key={z}
                    variant={zoom === z ? 'default' : 'ghost'}
                    size="sm"
                    className={
                      zoom === z
                        ? 'bg-gray-800 hover:bg-gray-700 text-white rounded-md'
                        : 'rounded-md'
                    }
                    onClick={() => setZoom(z)}
                  >
                    {z === 'day' ? 'Jour' : z === 'week' ? 'Semaine' : 'Mois'}
                  </Button>
                ))}
              </div>
            )}

            {mainView === 'calendar' && (
              <Button
                className="bg-[#C5A572] hover:bg-[#B08D5B] text-white rounded-lg"
                onClick={() => {
                  setSelectedDate(null)
                  setIsCreateOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvel événement
              </Button>
            )}
          </div>

          {mainView === 'gantt' && (
            <GanttView
              projectId={selectedProjectId}
              projectName={projectNames[selectedProjectId || ''] || ''}
              phases={phases}
              tasks={taskBars}
              milestones={milestones}
              zoom={zoom}
              projectStart={projectStart}
              projectEnd={projectEnd}
              onTaskClick={handleTaskClick}
              onAddTask={handleAddTask}
              onAddMilestone={handleAddMilestone}
            onDatesChange={(id, start, end) => {
              setTasks((prev) =>
                prev.map((t) =>
                  t.id === id ? { ...t, start_date: start, end_date: end } : t
                )
              )
            }}
            />
          )}

          {mainView === 'calendar' && (
            <div className="flex justify-center gap-2 mb-6">
              {(['month', 'week', 'day'] as const).map((m) => (
                <Button
                  key={m}
                  variant={viewMode === m ? 'default' : 'outline'}
                  size="sm"
                  className={
                    viewMode === m
                      ? 'bg-[#C5A572] hover:bg-[#B08D5B] text-white'
                      : ''
                  }
                  onClick={() => setViewMode(m)}
                >
                  {m === 'month' ? 'Mois' : m === 'week' ? 'Semaine' : 'Jour'}
                </Button>
              ))}
            </div>
          )}
          {mainView === 'calendar' && (
            <CalendarView
              events={events}
              currentDate={currentDate}
              viewMode={viewMode}
              onDateChange={setCurrentDate}
              onEventClick={handleEventClick}
              onDayClick={handleDayClick}
            />
          )}

          {mainView === 'kanban' && (
            <PlanningKanban
              tasks={tasks}
              projectNames={projectNames}
              onTaskClick={handleTaskClick}
              onStatusChange={handleStatusChange}
            />
          )}

          {mainView === 'list' && (
            <PlanningList
              tasks={tasks}
              projectNames={projectNames}
              projects={projects}
              onTaskClick={handleTaskClick}
              filters={listFilters}
              onFiltersChange={(f) => {
                setListFilters(f)
                setShowDeadlinesOnly(false)
              }}
              deadlineOnly={showDeadlinesOnly}
            />
          )}

          {mainView === 'workload' && (
            <PlanningWorkload tasks={tasks} assignees={assignees} />
          )}
        </CardContent>
      </Card>

      <TaskDetailSheet
        open={taskSheetOpen}
        onOpenChange={setTaskSheetOpen}
        task={selectedTask}
        phases={
          phases.length
            ? phases
            : PROJECT_PHASES.map((p) => ({
                id: p.key,
                name: p.name,
                key: p.key,
              }))
        }
        assignees={assignees}
        allTasks={tasks}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        {/* Plein écran mobile, centré sur desktop */}
        <DialogContent className="flex h-full max-h-[100dvh] w-full max-w-none flex-col rounded-none border-0 p-4 md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-lg md:border md:p-6 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#C5A572]">
              Nouvel événement
            </DialogTitle>
          </DialogHeader>
          <EventForm
            initialDate={selectedDate || undefined}
            onSuccess={() => {
              setIsCreateOpen(false)
              setSelectedDate(null)
              loadEvents()
            }}
            onCancel={() => {
              setIsCreateOpen(false)
              setSelectedDate(null)
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl rounded-xl">
          {selectedEvent && (
            <EventDetail
              eventId={selectedEvent.id}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
              onClose={() => setIsDetailOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#C5A572]">
              Modifier l'événement
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <EventForm
              eventId={selectedEvent.id}
              onSuccess={() => {
                setIsEditOpen(false)
                setSelectedEvent(null)
                loadEvents()
              }}
              onCancel={() => setIsEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
