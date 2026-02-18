// @ts-nocheck
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  addWeeks,
  isSameMonth,
  isSameDay,
  isToday,
  startOfDay,
  endOfDay,
} from 'date-fns'
import { fr } from 'date-fns/locale'

type CalendarViewProps = {
  events: any[]
  currentDate: Date
  viewMode: 'month' | 'week' | 'day'
  onDateChange: (date: Date) => void
  onEventClick: (event: any) => void
  onDayClick: (date: Date) => void
}

const eventTypeColors: Record<string, string> = {
  meeting: 'bg-blue-500 text-white',
  rendez_vous_client: 'bg-blue-500 text-white',
  site_visit: 'bg-green-500 text-white',
  visite_chantier: 'bg-green-500 text-white',
  contractor_meeting: 'bg-orange-500 text-white',
  reunion_artisan: 'bg-orange-500 text-white',
  deadline: 'bg-purple-500 text-white',
  deadline_phase: 'bg-purple-500 text-white',
  internal: 'bg-gray-500 text-white',
  reunion_interne: 'bg-gray-500 text-white',
  livraison: 'bg-red-500 text-white',
}

export function CalendarView({
  events,
  currentDate,
  viewMode,
  onDateChange,
  onEventClick,
  onDayClick,
}: CalendarViewProps) {
  const handlePrevious = () => {
    if (viewMode === 'month') {
      onDateChange(addMonths(currentDate, -1))
    } else if (viewMode === 'week') {
      onDateChange(addWeeks(currentDate, -1))
    } else {
      onDateChange(addDays(currentDate, -1))
    }
  }

  const handleNext = () => {
    if (viewMode === 'month') {
      onDateChange(addMonths(currentDate, 1))
    } else if (viewMode === 'week') {
      onDateChange(addWeeks(currentDate, 1))
    } else {
      onDateChange(addDays(currentDate, 1))
    }
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.start_datetime)
      return isSameDay(eventStart, date)
    })
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { locale: fr })
    const endDate = endOfWeek(monthEnd, { locale: fr })

    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day
        const dayEvents = getEventsForDate(currentDay)
        const isCurrentMonth = isSameMonth(currentDay, monthStart)
        const isCurrentDay = isToday(currentDay)

        days.push(
          <div
            key={currentDay.toString()}
            className={`min-h-[100px] border border-gray-200 p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
              !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
            } ${isCurrentDay ? 'ring-2 ring-[#C5A572]' : ''}`}
            onClick={() => onDayClick(currentDay)}
          >
            <div
              className={`text-sm font-medium mb-1 ${
                !isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
              } ${isCurrentDay ? 'text-[#C5A572] font-bold' : ''}`}
            >
              {format(currentDay, 'd')}
            </div>
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className={`text-xs px-2 py-1 rounded truncate ${
                    eventTypeColors[event.event_type] || 'bg-gray-500 text-white'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEventClick(event)
                  }}
                >
                  {format(new Date(event.start_datetime), 'HH:mm')} {event.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500 px-2">
                  +{dayEvents.length - 3} autre{dayEvents.length - 3 > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      )
      days = []
    }

    return <div className="space-y-0">{rows}</div>
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { locale: fr })
    const days = []

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i)
      const dayEvents = getEventsForDate(day)
      const isCurrentDay = isToday(day)

      days.push(
        <div
          key={day.toString()}
          className={`flex-1 border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
            isCurrentDay ? 'ring-2 ring-[#C5A572]' : ''
          }`}
          onClick={() => onDayClick(day)}
        >
          <div className="text-center mb-3">
            <div className="text-sm font-medium text-gray-500">
              {format(day, 'EEE', { locale: fr })}
            </div>
            <div
              className={`text-2xl font-bold ${
                isCurrentDay ? 'text-[#C5A572]' : 'text-gray-900'
              }`}
            >
              {format(day, 'd')}
            </div>
          </div>
          <div className="space-y-2">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className={`text-xs px-2 py-2 rounded cursor-pointer ${
                  eventTypeColors[event.event_type] || 'bg-gray-500 text-white'
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  onEventClick(event)
                }}
              >
                <div className="font-medium">{event.title}</div>
                <div className="opacity-90">
                  {format(new Date(event.start_datetime), 'HH:mm')} -{' '}
                  {format(new Date(event.end_datetime), 'HH:mm')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="flex gap-0 min-h-[500px]">
        {days}
      </div>
    )
  }

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate).sort(
      (a, b) =>
        new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
    )

    return (
      <div className="space-y-4">
        <div className="text-center py-4">
          <div className="text-sm font-medium text-gray-500">
            {format(currentDate, 'EEEE', { locale: fr })}
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {format(currentDate, 'd MMMM yyyy', { locale: fr })}
          </div>
        </div>

        <div className="space-y-3">
          {dayEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Aucun événement ce jour
            </div>
          ) : (
            dayEvents.map((event) => (
              <div
                key={event.id}
                className={`p-4 rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${
                  eventTypeColors[event.event_type] || 'bg-gray-500 text-white'
                }`}
                onClick={() => onEventClick(event)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <p className="text-sm opacity-90">
                      {format(new Date(event.start_datetime), 'HH:mm')} -{' '}
                      {format(new Date(event.end_datetime), 'HH:mm')}
                    </p>
                  </div>
                </div>
                {event.location && (
                  <p className="text-sm mt-2 opacity-90">{event.location}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  const getViewTitle = () => {
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy', { locale: fr })
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { locale: fr })
      const weekEnd = endOfWeek(currentDate, { locale: fr })
      return `${format(weekStart, 'd MMM', { locale: fr })} - ${format(
        weekEnd,
        'd MMM yyyy',
        { locale: fr }
      )}`
    } else {
      return format(currentDate, 'd MMMM yyyy', { locale: fr })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={handlePrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold capitalize">{getViewTitle()}</h2>
        <Button variant="outline" size="icon" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {viewMode === 'month' && (
        <>
          <div className="grid grid-cols-7 gap-0">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-gray-700 py-2 bg-gray-100"
              >
                {day}
              </div>
            ))}
          </div>
          {renderMonthView()}
        </>
      )}

      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}
    </div>
  )
}
