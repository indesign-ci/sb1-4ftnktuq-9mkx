// @ts-nocheck
'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import type { PlanningTask } from './task-detail-sheet'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Progress } from '@/components/ui/progress'

type PlanningListProps = {
  tasks: PlanningTask[]
  projectNames: Record<string, string>
  onTaskClick?: (task: PlanningTask) => void
  filters?: {
    projectId: string
    phaseKey: string
    status: string
  }
  onFiltersChange?: (f: { projectId: string; phaseKey: string; status: string }) => void
  projects: { id: string; name: string }[]
  deadlineOnly?: boolean
}

const STATUS_LABEL: Record<string, string> = {
  todo: 'Non démarré',
  in_progress: 'En cours',
  waiting: 'En attente',
  completed: 'Terminé',
  overdue: 'En retard',
}

export function PlanningList({
  tasks,
  projectNames,
  onTaskClick,
  filters = { projectId: 'all', phaseKey: 'all', status: 'all' },
  onFiltersChange,
  projects,
  deadlineOnly = false,
}: PlanningListProps) {
  const [sortKey, setSortKey] = useState<string>('start_date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [search, setSearch] = useState('')

  const filteredAndSorted = useMemo(() => {
    let list = [...tasks]
    if (filters.projectId && filters.projectId !== 'all')
      list = list.filter((t) => t.project_id === filters.projectId)
    if (filters.phaseKey && filters.phaseKey !== 'all')
      list = list.filter((t) => t.phase_key === filters.phaseKey)
    if (filters.status && filters.status !== 'all')
      list = list.filter((t) => t.status === filters.status)
    if (deadlineOnly) {
      const now = new Date()
      const threeDays = 3 * 24 * 60 * 60 * 1000
      list = list.filter((t) => {
        if (!t.end_date || t.status === 'completed') return false
        const end = new Date(t.end_date)
        const diff = end.getTime() - now.getTime()
        return diff < 0 || diff <= threeDays
      })
    }
    if (search.trim())
      list = list.filter((t) =>
        t.title.toLowerCase().includes(search.toLowerCase())
      )
    list.sort((a, b) => {
      let aVal: any = a[sortKey as keyof PlanningTask]
      let bVal: any = b[sortKey as keyof PlanningTask]
      if (sortKey === 'start_date' || sortKey === 'end_date') {
        aVal = aVal ? new Date(aVal).getTime() : 0
        bVal = bVal ? new Date(bVal).getTime() : 0
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [tasks, filters, search, sortKey, sortDir])

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else setSortKey(key)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Rechercher une tâche..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs rounded-lg"
        />
        <Select
          value={filters.projectId}
          onValueChange={(v) =>
            onFiltersChange?.({
              ...filters,
              projectId: v,
            })
          }
        >
          <SelectTrigger className="w-[200px] rounded-lg">
            <SelectValue placeholder="Projet" />
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
        <Select
          value={filters.status}
          onValueChange={(v) =>
            onFiltersChange?.({
              ...filters,
              status: v,
            })
          }
        >
          <SelectTrigger className="w-[180px] rounded-lg">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(STATUS_LABEL).map(([k, l]) => (
              <SelectItem key={k} value={k}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead
              className="cursor-pointer hover:text-[#C5A572]"
              onClick={() => toggleSort('title')}
            >
              Tâche
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-[#C5A572]"
              onClick={() => toggleSort('project_id')}
            >
              Projet
            </TableHead>
            <TableHead>Phase</TableHead>
            <TableHead>Assigné</TableHead>
            <TableHead
              className="cursor-pointer hover:text-[#C5A572]"
              onClick={() => toggleSort('start_date')}
            >
              Début
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-[#C5A572]"
              onClick={() => toggleSort('end_date')}
            >
              Fin
            </TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Progression</TableHead>
            <TableHead>Priorité</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSorted.map((task) => (
            <TableRow
              key={task.id}
              className="cursor-pointer hover:bg-amber-50/30"
              onClick={() => onTaskClick?.(task)}
            >
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="rounded-full">
                  {projectNames[task.project_id] || '—'}
                </Badge>
              </TableCell>
              <TableCell className="text-gray-600">
                {task.phase_name || '—'}
              </TableCell>
              <TableCell className="text-gray-600">
                {task.assigned_to_name || '—'}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {task.start_date
                  ? format(new Date(task.start_date), 'd MMM yyyy', {
                      locale: fr,
                    })
                  : '—'}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {task.end_date
                  ? format(new Date(task.end_date), 'd MMM yyyy', {
                      locale: fr,
                    })
                  : '—'}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    task.status === 'completed'
                      ? 'success'
                      : task.status === 'overdue'
                        ? 'danger'
                        : 'secondary'
                  }
                  className="rounded-full"
                >
                  {STATUS_LABEL[task.status] || task.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="w-24">
                  <Progress
                    value={task.progress ?? 0}
                    className="h-2 [&>div]:bg-[#C5A572]"
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {task.progress ?? 0}%
                </span>
              </TableCell>
              <TableCell className="capitalize text-sm">
                {task.priority === 'high'
                  ? 'Haute'
                  : task.priority === 'low'
                    ? 'Basse'
                    : 'Moyenne'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {filteredAndSorted.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucune tâche ne correspond aux filtres
        </div>
      )}
    </div>
  )
}
