// @ts-nocheck
'use client'

import { useMemo, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  format,
  startOfDay,
  differenceInDays,
  addDays,
  addWeeks,
  addMonths,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import type { PlanningTask } from './task-detail-sheet'
import { PROJECT_PHASES } from '@/lib/project-utils'

const BAR_COLORS: Record<string, string> = {
  todo: '#E5E5E5',
  in_progress: '#C5A572',
  completed: '#22C55E',
  overdue: '#EF4444',
  waiting: '#F59E0B',
}

type GanttViewProps = {
  projectId: string | null
  projectName: string
  phases: { id: string; name: string; order_index?: number; key?: string }[]
  tasks: PlanningTask[]
  milestones: PlanningTask[]
  zoom: 'day' | 'week' | 'month'
  projectStart: Date
  projectEnd: Date
  onTaskClick: (task: PlanningTask) => void
  onAddTask: () => void
  onAddMilestone: () => void
  onDatesChange?: (taskId: string, startDate: string, endDate: string) => void
}

const ZOOM_PX = { day: 40, week: 120, month: 30 }
const ROW_HEIGHT = 36
const PHASE_HEADER_HEIGHT = 44

export function GanttView({
  projectId,
  projectName,
  phases,
  tasks,
  milestones,
  zoom,
  projectStart,
  projectEnd,
  onTaskClick,
  onAddTask,
  onAddMilestone,
  onDatesChange,
}: GanttViewProps) {
  const dayWidth = ZOOM_PX[zoom]
  const totalDays = Math.max(
    1,
    differenceInDays(projectEnd, projectStart) + 1
  )
  const totalWidth = totalDays * dayWidth
  const topScrollRef = useRef<HTMLDivElement | null>(null)
  const mainScrollRef = useRef<HTMLDivElement | null>(null)

  const [dragState, setDragState] = useState<{
    taskId: string
    type: 'move' | 'resize-left' | 'resize-right'
    originX: number
    originStart: string
    originEnd: string
  } | null>(null)

  const timelineDates = useMemo(() => {
    const dates: Date[] = []
    let d = startOfDay(projectStart)
    while (d <= projectEnd) {
      dates.push(d)
      if (zoom === 'day') d = addDays(d, 1)
      else if (zoom === 'week') d = addWeeks(d, 1)
      else d = addMonths(d, 1)
    }
    return dates
  }, [projectStart, projectEnd, zoom])

  const todayOffset = useMemo(() => {
    const today = startOfDay(new Date())
    if (today < projectStart || today > projectEnd) return null
    return differenceInDays(today, projectStart) * dayWidth
  }, [projectStart, projectEnd, dayWidth])

  const phasesWithTasks = useMemo(() => {
    const order = phases.length
      ? phases
      : PROJECT_PHASES.map((p, i) => ({
          id: p.key,
          name: p.name,
          order_index: i,
          key: p.key,
        }))
    return order
      .slice()
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .map((phase) => ({
        phase,
        tasks: tasks.filter(
          (t) =>
            t.phase_id === phase.id ||
            t.phase_key === phase.key ||
            (phase.key && t.phase_key === phase.key)
        ),
      }))
  }, [phases, tasks])

  const getBarStyle = (task: PlanningTask) => {
    const start = startOfDay(new Date(task.start_date))
    const end = startOfDay(new Date(task.end_date))
    const left = Math.max(0, differenceInDays(start, projectStart) * dayWidth)
    const durationDays = differenceInDays(end, start) + 1
    const width = Math.max(dayWidth * 0.6, durationDays * dayWidth)
    const color = BAR_COLORS[task.status] || BAR_COLORS.todo
    return { left, width, color }
  }

  const getMilestoneStyle = (task: PlanningTask) => {
    const start = startOfDay(new Date(task.start_date))
    const left = Math.max(0, differenceInDays(start, projectStart) * dayWidth)
    return { left }
  }

  if (!projectId) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <p className="font-serif text-lg text-[#C5A572]">
          Sélectionnez un projet pour afficher le diagramme de Gantt
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 bg-gray-50/50 p-4 flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          className="rounded-lg"
          onClick={onAddTask}
        >
          Ajouter une tâche
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-lg"
          onClick={onAddMilestone}
        >
          Ajouter un jalon
        </Button>
      </div>
      <div
        ref={topScrollRef}
        className="h-3 overflow-x-auto overflow-y-hidden border-b border-gray-100 bg-gray-50/70"
        onScroll={(e) => {
          if (mainScrollRef.current) {
            mainScrollRef.current.scrollLeft = e.currentTarget.scrollLeft
          }
        }}
        onScroll={(e) => {
          if (topScrollRef.current) {
            topScrollRef.current.scrollLeft = e.currentTarget.scrollLeft
          }
        }}
      >
        <div style={{ width: totalWidth + 280 }} />
      </div>
      <div
        ref={mainScrollRef}
        className="overflow-x-auto"
        onMouseMove={(e) => {
          if (!dragState || !onDatesChange) return
          const deltaPx = e.movementX
          if (!deltaPx) return
          const deltaDays = Math.round(deltaPx / dayWidth)
          if (!deltaDays) return
          const task = tasks.find((t) => t.id === dragState.taskId)
          if (!task) return
          const start = new Date(dragState.originStart)
          const end = new Date(dragState.originEnd)
          if (dragState.type === 'move') {
            start.setDate(start.getDate() + deltaDays)
            end.setDate(end.getDate() + deltaDays)
          } else if (dragState.type === 'resize-left') {
            start.setDate(start.getDate() + deltaDays)
            if (start > end) start.setTime(end.getTime())
          } else if (dragState.type === 'resize-right') {
            end.setDate(end.getDate() + deltaDays)
            if (end < start) end.setTime(start.getTime())
          }
          const startStr = start.toISOString().slice(0, 10)
          const endStr = end.toISOString().slice(0, 10)
          onDatesChange(dragState.taskId, startStr, endStr)
        }}
        onMouseUp={() => setDragState(null)}
        onMouseLeave={() => setDragState(null)}
      >
        <div className="min-w-max">
          {/* Timeline header */}
          <div
            className="flex border-b border-gray-200 bg-white sticky top-0 z-10"
            style={{ minWidth: totalWidth + 280 }}
          >
            <div className="w-[260px] shrink-0 border-r border-gray-200 py-3 px-4">
              <span className="text-sm font-medium text-gray-500">
                Tâche / Phase
              </span>
            </div>
            <div
              className="flex shrink-0 relative"
              style={{ width: totalWidth, height: 48 }}
            >
              {timelineDates.map((d) => (
                <div
                  key={d.toISOString()}
                  className="flex flex-col items-center justify-center border-r border-gray-100 text-xs text-gray-500"
                  style={{ width: dayWidth, height: 48 }}
                >
                  {zoom === 'day' && format(d, 'd', { locale: fr })}
                  {zoom === 'week' &&
                    `S${format(d, 'w', { locale: fr })} ${format(d, 'MMM', { locale: fr })}`}
                  {zoom === 'month' && format(d, 'MMM yyyy', { locale: fr })}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {phasesWithTasks.map(({ phase, tasks: phaseTasks }) => (
            <div key={phase.id} className="border-b border-gray-100">
              {/* Phase row */}
              <div
                className="flex items-center border-b border-gray-100 bg-amber-50/30"
                style={{
                  minWidth: totalWidth + 280,
                  height: PHASE_HEADER_HEIGHT,
                }}
              >
                <div className="w-[260px] shrink-0 border-r border-gray-200 py-2 px-4 flex items-center gap-2">
                  <span className="text-base">📋</span>
                  <span className="font-medium text-gray-800">
                    {phase.name}
                  </span>
                </div>
                <div
                  className="relative shrink-0 bg-gray-50/50"
                  style={{ width: totalWidth, height: PHASE_HEADER_HEIGHT }}
                >
                  {todayOffset !== null && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-[5]"
                      style={{ left: todayOffset }}
                    />
                  )}
                </div>
              </div>
              {/* Task rows */}
              {phaseTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center hover:bg-gray-50/50 transition-colors"
                  style={{
                    minWidth: totalWidth + 280,
                    height: ROW_HEIGHT,
                  }}
                >
                  <div className="w-[260px] shrink-0 border-r border-gray-200 py-1.5 px-4 pl-8">
                    <span className="text-sm text-gray-700 truncate block">
                      {task.title}
                    </span>
                  </div>
                  <div
                    className="relative shrink-0"
                    style={{ width: totalWidth, height: ROW_HEIGHT }}
                  >
                    {todayOffset !== null && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-[5] pointer-events-none"
                        style={{ left: todayOffset }}
                      />
                    )}
                    {task.is_milestone ? (
                      <button
                        type="button"
                        onClick={() => onTaskClick(task)}
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rotate-45 bg-[#C5A572] hover:bg-[#B08D5B] border border-amber-800/20 z-[6] cursor-pointer shadow"
                        style={{
                          left: getMilestoneStyle(task).left - 8,
                        }}
                        title={task.title}
                      >
                        <span className="sr-only">{task.title}</span>
                      </button>
                    ) : (
                      <div
                        className="absolute top-2 text-left text-xs font-medium text-gray-800 z-[6]"
                        style={{
                          left: getBarStyle(task).left,
                          width: Math.max(60, getBarStyle(task).width),
                          height: ROW_HEIGHT - 8,
                        }}
                      >
                        <div
                          className="relative h-full w-full rounded-md shadow-sm hover:opacity-90 transition-opacity cursor-pointer border-0"
                          style={{ backgroundColor: getBarStyle(task).color }}
                          onMouseDown={(e) => {
                            if (e.button !== 0 || !onDatesChange) return
                            e.preventDefault()
                            setDragState({
                              taskId: task.id,
                              type: 'move',
                              originX: e.clientX,
                              originStart: task.start_date,
                              originEnd: task.end_date,
                            })
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            onTaskClick(task)
                          }}
                        >
                          <div
                            className="absolute inset-y-0 left-0 w-1 cursor-ew-resize"
                            onMouseDown={(e) => {
                              if (e.button !== 0 || !onDatesChange) return
                              e.preventDefault()
                              e.stopPropagation()
                              setDragState({
                                taskId: task.id,
                                type: 'resize-left',
                                originX: e.clientX,
                                originStart: task.start_date,
                                originEnd: task.end_date,
                              })
                            }}
                          />
                          <div
                            className="absolute inset-y-0 right-0 w-1 cursor-ew-resize"
                            onMouseDown={(e) => {
                              if (e.button !== 0 || !onDatesChange) return
                              e.preventDefault()
                              e.stopPropagation()
                              setDragState({
                                taskId: task.id,
                                type: 'resize-right',
                                originX: e.clientX,
                                originStart: task.start_date,
                                originEnd: task.end_date,
                              })
                            }}
                          />
                          <span className="absolute inset-y-0 left-1 right-1 flex items-center truncate">
                            {task.title}
                          </span>
                          {task.depends_on?.length ? (
                            <span className="absolute -bottom-3 left-1 text-[10px] text-gray-600">
                              ⇢ {task.depends_on.length}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {phaseTasks.length === 0 && (
                <div
                  className="flex items-center text-sm text-gray-400 pl-8"
                  style={{
                    minWidth: totalWidth + 280,
                    height: ROW_HEIGHT,
                  }}
                >
                  Aucune tâche
                </div>
              )}
            </div>
          ))}

          {/* Milestones row (global) */}
          {milestones.length > 0 && (
            <div className="border-b border-gray-100 bg-purple-50/20">
              <div
                className="flex items-center"
                style={{
                  minWidth: totalWidth + 280,
                  height: PHASE_HEADER_HEIGHT,
                }}
              >
                <div className="w-[260px] shrink-0 border-r border-gray-200 py-2 px-4 flex items-center gap-2">
                  <span className="text-base">◆</span>
                  <span className="font-medium text-gray-800">Jalons</span>
                </div>
                <div
                  className="relative shrink-0"
                  style={{ width: totalWidth, height: PHASE_HEADER_HEIGHT }}
                >
                  {todayOffset !== null && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-[5]"
                      style={{ left: todayOffset }}
                    />
                  )}
                  {milestones.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onTaskClick(m)}
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rotate-45 bg-[#C5A572] hover:bg-[#B08D5B] border border-amber-800/20 z-[6] cursor-pointer shadow"
                      style={{
                        left: getMilestoneStyle(m).left - 8,
                      }}
                      title={m.title}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
