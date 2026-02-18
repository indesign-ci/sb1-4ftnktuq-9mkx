// @ts-nocheck
'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { PlanningTask } from './task-detail-sheet'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const COLUMNS = [
  { id: 'todo', title: 'À faire', color: 'bg-gray-100 border-gray-200' },
  { id: 'in_progress', title: 'En cours', color: 'bg-amber-50 border-amber-200' },
  { id: 'waiting', title: 'En attente', color: 'bg-orange-50 border-orange-200' },
  { id: 'completed', title: 'Terminé', color: 'bg-green-50 border-green-200' },
]

const PRIORITY_COLOR: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-600',
}

type PlanningKanbanProps = {
  tasks: PlanningTask[]
  projectNames: Record<string, string>
  onTaskClick?: (task: PlanningTask) => void
  onStatusChange?: (taskId: string, newStatus: string) => void
}

export function PlanningKanban({
  tasks,
  projectNames,
  onTaskClick,
  onStatusChange,
}: PlanningKanbanProps) {
  const [draggedTask, setDraggedTask] = useState<PlanningTask | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

  const tasksByCol = COLUMNS.reduce(
    (acc, col) => {
      acc[col.id] = tasks.filter((t) => t.status === col.id)
      return acc
    },
    {} as Record<string, PlanningTask[]>
  )

  const handleDragStart = (e: React.DragEvent, task: PlanningTask) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', task.id)
  }

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCol(colId)
  }

  const handleDragLeave = () => setDragOverCol(null)

  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    setDragOverCol(null)
    if (draggedTask && onStatusChange && draggedTask.status !== colId) {
      onStatusChange(draggedTask.id, colId)
    }
    setDraggedTask(null)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverCol(null)
  }

  return (
    <div className="grid grid-cols-4 gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => (
        <div
          key={col.id}
          className={`min-w-[260px] rounded-xl border-2 ${col.color} p-3 transition-colors ${
            dragOverCol === col.id ? 'ring-2 ring-[#C5A572]' : ''
          }`}
          onDragOver={(e) => handleDragOver(e, col.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, col.id)}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif font-medium text-gray-800">{col.title}</h3>
            <span className="text-sm text-gray-500">
              {tasksByCol[col.id]?.length ?? 0}
            </span>
          </div>
          <div className="space-y-2 min-h-[120px]">
            {(tasksByCol[col.id] ?? []).map((task) => (
              <Card
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                onDragEnd={handleDragEnd}
                className={`cursor-grab active:cursor-grabbing rounded-lg shadow-sm border transition-all hover:shadow-md ${
                  draggedTask?.id === task.id ? 'opacity-50' : ''
                }`}
                onClick={() => onTaskClick?.(task)}
              >
                <CardContent className="p-3">
                  <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                    {task.title}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {task.project_id && (
                      <Badge
                        variant="secondary"
                        className="rounded-full text-xs"
                      >
                        {projectNames[task.project_id] || 'Projet'}
                      </Badge>
                    )}
                    {task.phase_name && (
                      <span className="text-xs text-gray-500 truncate">
                        {task.phase_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white shadow">
                        <AvatarFallback className="text-xs font-medium bg-[#C5A572] text-white rounded-full">
                          {task.assigned_to_name
                            ? task.assigned_to_name
                                .split(' ')
                                .filter(Boolean)
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)
                            : '?'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.end_date && (
                        <span className="text-xs text-gray-500">
                          {format(new Date(task.end_date), 'd MMM', {
                            locale: fr,
                          })}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.medium
                        }`}
                      >
                        {task.priority === 'high'
                          ? 'Haute'
                          : task.priority === 'low'
                            ? 'Basse'
                            : 'Moyenne'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
