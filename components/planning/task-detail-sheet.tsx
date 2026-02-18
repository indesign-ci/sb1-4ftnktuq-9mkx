// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

export type PlanningTask = {
  id: string
  project_id: string
  phase_id?: string
  phase_key?: string
  phase_name?: string
  title: string
  start_date: string
  end_date: string
  status: string
  progress: number
  priority: string
  assigned_to?: string
  assigned_to_name?: string
  notes?: string
  is_milestone?: boolean
  depends_on?: string[]
}

type TaskDetailSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: PlanningTask | null
  phases: { id: string; name: string; key?: string }[]
  assignees: { id: string; first_name: string; last_name: string }[]
  allTasks: PlanningTask[]
  onSave: (task: PlanningTask) => void
  onDelete?: (taskId: string) => void
}

const STATUS_OPTIONS = [
  { value: 'todo', label: 'Non démarré' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'waiting', label: 'En attente' },
  { value: 'completed', label: 'Terminé' },
  { value: 'overdue', label: 'En retard' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Basse' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
]

export function TaskDetailSheet({
  open,
  onOpenChange,
  task,
  phases,
  assignees,
  allTasks,
  onSave,
  onDelete,
}: TaskDetailSheetProps) {
  const [form, setForm] = useState<Partial<PlanningTask>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (task) {
      setForm({
        id: task.id,
        project_id: task.project_id,
        phase_id: task.phase_id,
        phase_key: task.phase_key,
        phase_name: task.phase_name,
        title: task.title,
        start_date: task.start_date?.slice(0, 10) || '',
        end_date: task.end_date?.slice(0, 10) || '',
        status: task.status || 'todo',
        progress: task.progress ?? 0,
        priority: task.priority || 'medium',
        assigned_to: task.assigned_to || '',
        notes: task.notes || '',
        is_milestone: task.is_milestone,
        depends_on: task.depends_on || [],
      })
    }
  }, [task])

  const durationDays =
    form.start_date && form.end_date
      ? Math.max(
          0,
          Math.ceil(
            (new Date(form.end_date).getTime() -
              new Date(form.start_date).getTime()) /
              (24 * 60 * 60 * 1000)
          )
        ) + 1
      : 0

  const handleSave = async () => {
    if (!form.title?.trim()) {
      toast.error('Le nom de la tâche est requis')
      return
    }
    setSaving(true)
    try {
      onSave({
        ...task!,
        ...form,
        start_date: form.start_date!,
        end_date: form.end_date!,
        progress: form.progress ?? 0,
      } as PlanningTask)
      toast.success('Tâche enregistrée')
      onOpenChange(false)
    } catch (e) {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    if (!task?.id || !onDelete) return
    if (!confirm('Supprimer cette tâche ?')) return
    onDelete(task.id)
    onOpenChange(false)
  }

  if (!task) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-serif text-[#C5A572]">
            Détail de la tâche
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label>Nom de la tâche</Label>
            <Input
              value={form.title || ''}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Nom de la tâche"
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label>Phase parente</Label>
            <Select
              value={form.phase_id || ''}
              onValueChange={(v) => {
                const p = phases.find((x) => x.id === v)
                setForm((f) => ({
                  ...f,
                  phase_id: v,
                  phase_name: p?.name,
                  phase_key: p?.key,
                }))
              }}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Sélectionner une phase" />
              </SelectTrigger>
              <SelectContent>
                {phases.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date début</Label>
              <Input
                type="date"
                value={form.start_date || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, start_date: e.target.value }))
                }
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label>Date fin</Label>
              <Input
                type="date"
                value={form.end_date || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, end_date: e.target.value }))
                }
                className="rounded-lg"
              />
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Durée : {durationDays} jour{durationDays > 1 ? 's' : ''}
          </div>
          <div className="space-y-2">
            <Label>Assigné à</Label>
            <Select
              value={form.assigned_to || 'none'}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, assigned_to: v === 'none' ? '' : v }))
              }
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Non assigné" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Non assigné</SelectItem>
                {assignees.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.first_name} {a.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priorité</Label>
            <Select
              value={form.priority || 'medium'}
              onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select
              value={form.status || 'todo'}
              onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Progression — {form.progress ?? 0}%</Label>
            <Slider
              value={[form.progress ?? 0]}
              onValueChange={([v]) => setForm((f) => ({ ...f, progress: v }))}
              max={100}
              step={5}
              className="[&_[data-orientation=horizontal]>div:last-child]:bg-[#C5A572]"
            />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes || ''}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={4}
              className="rounded-lg"
              placeholder="Notes..."
            />
          </div>
          <div className="space-y-2">
            <Label>Dépendances (tâches précédentes)</Label>
            <div className="max-h-40 overflow-auto border rounded-lg p-2 bg-gray-50 space-y-1 text-sm">
              {allTasks
                .filter(
                  (t) =>
                    t.id !== task.id &&
                    t.project_id === task.project_id &&
                    !t.is_milestone
                )
                .map((t) => {
                  const checked = (form.depends_on || []).includes(t.id)
                  return (
                    <label
                      key={t.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={checked}
                        onChange={(e) => {
                          const isChecked = e.target.checked
                          setForm((f) => {
                            const current = new Set(f.depends_on || [])
                            if (isChecked) current.add(t.id)
                            else current.delete(t.id)
                            return { ...f, depends_on: Array.from(current) }
                          })
                        }}
                      />
                      <span className="truncate">{t.title}</span>
                    </label>
                  )
                })}
              {allTasks.filter(
                (t) =>
                  t.id !== task.id && t.project_id === task.project_id && !t.is_milestone
              ).length === 0 && (
                <p className="text-xs text-gray-400">
                  Aucune autre tâche dans ce projet pour définir des dépendances.
                </p>
              )}
            </div>
          </div>
        </div>
        <SheetFooter className="flex gap-2 sm:gap-0">
          {onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="mr-auto"
            >
              Supprimer
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            type="button"
            className="bg-[#C5A572] hover:bg-[#B08D5B] text-white"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Enregistrement...' : 'Sauvegarder'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
