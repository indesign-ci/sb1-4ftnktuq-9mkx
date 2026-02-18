'use client'

// @ts-nocheck

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { PlanningTask } from './task-detail-sheet'
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, differenceInDays } from 'date-fns'

type PlanningWorkloadProps = {
  tasks: PlanningTask[]
  assignees: { id: string; first_name: string; last_name: string }[]
}

const CAPACITY_DAYS_PER_WEEK = 5

export function PlanningWorkload({ tasks, assignees }: PlanningWorkloadProps) {
  const weekRange = useMemo(() => {
    const now = new Date()
    return {
      start: startOfWeek(now, { weekStartsOn: 1 }),
      end: endOfWeek(now, { weekStartsOn: 1 }),
    }
  }, [])

  const workload = useMemo(() => {
    const byUser: Record<
      string,
      {
        id: string
        name: string
        plannedDays: number
        tasks: PlanningTask[]
      }
    > = {}

    assignees.forEach((a) => {
      const name = `${a.first_name} ${a.last_name}`
      byUser[a.id] = { id: a.id, name, plannedDays: 0, tasks: [] }
    })

    tasks.forEach((task) => {
      if (!task.assigned_to || !byUser[task.assigned_to]) return
      if (!task.start_date || !task.end_date) return
      const start = parseISO(task.start_date)
      const end = parseISO(task.end_date)
      if (
        !isWithinInterval(start, { start: weekRange.start, end: weekRange.end }) &&
        !isWithinInterval(end, { start: weekRange.start, end: weekRange.end })
      ) {
        // ignore tasks completely outside the week
        return
      }
      const days = Math.max(
        1,
        differenceInDays(
          isWithinInterval(start, { start: weekRange.start, end: weekRange.end })
            ? end
            : weekRange.end,
          isWithinInterval(end, { start: weekRange.start, end: weekRange.end })
            ? start
            : weekRange.start
        ) + 1
      )
      byUser[task.assigned_to].plannedDays += days
      byUser[task.assigned_to].tasks.push(task)
    })

    return Object.values(byUser).sort((a, b) => b.plannedDays - a.plannedDays)
  }, [tasks, assignees, weekRange.start, weekRange.end])

  if (!assignees.length) {
    return (
      <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="py-10 text-center text-gray-500">
          Aucun membre actif pour calculer la charge de travail.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <CardContent className="p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Charge de travail (semaine en cours)</h2>
          <p className="text-sm text-gray-500">
            Estimation en jours planifiés sur la semaine (capacité de base&nbsp;: {CAPACITY_DAYS_PER_WEEK} jours).
          </p>
        </div>
        <div className="space-y-4">
          {workload.map((w) => {
            const ratio = (w.plannedDays / CAPACITY_DAYS_PER_WEEK) * 100
            const pct = Math.round(ratio)
            let barColor = 'bg-emerald-500'
            if (pct >= 80 && pct <= 100) barColor = 'bg-amber-500'
            if (pct > 100) barColor = 'bg-red-500'

            return (
              <div key={w.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{w.name}</p>
                  <p className="text-xs text-gray-500">
                    {w.plannedDays.toFixed(1)} j / {CAPACITY_DAYS_PER_WEEK} j ({pct}%)
                  </p>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-2 ${barColor} transition-all`}
                    style={{ width: `${Math.min(150, pct)}%` }}
                  />
                </div>
                {w.tasks.length > 0 && (
                  <p className="text-xs text-gray-500">
                    {w.tasks.length} tâche{w.tasks.length > 1 ? 's' : ''} cette semaine
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

