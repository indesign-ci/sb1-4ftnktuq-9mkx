// @ts-nocheck
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin } from 'lucide-react'
import { format, isToday, isTomorrow } from 'date-fns'
import { fr } from 'date-fns/locale'

type UpcomingEventsProps = {
  events: any[]
  onEventClick: (event: any) => void
}

const eventTypes = {
  meeting: { label: 'Rendez-vous client', color: 'bg-blue-500' },
  site_visit: { label: 'Visite chantier', color: 'bg-green-500' },
  contractor_meeting: { label: 'Réunion artisans', color: 'bg-orange-500' },
  deadline: { label: 'Deadline projet', color: 'bg-purple-500' },
  internal: { label: 'Tâche interne', color: 'bg-gray-500' },
}

export function UpcomingEvents({ events, onEventClick }: UpcomingEventsProps) {
  const upcomingEvents = events
    .filter((event) => new Date(event.start_datetime) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
    )
    .slice(0, 10)

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Aujourd\'hui'
    if (isTomorrow(date)) return 'Demain'
    return format(date, 'EEEE d MMMM', { locale: fr })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Prochains événements</CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Aucun événement à venir
          </p>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => {
              const startDate = new Date(event.start_datetime)
              const eventType = eventTypes[event.event_type as keyof typeof eventTypes]

              return (
                <div
                  key={event.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onEventClick(event)}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full mt-1 ${eventType?.color || 'bg-gray-500'}`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{event.title}</h4>
                      <p className="text-xs text-gray-500 capitalize">
                        {getDateLabel(startDate)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 ml-5">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(startDate, 'HH:mm')} -{' '}
                        {format(new Date(event.end_datetime), 'HH:mm')}
                      </span>
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
