'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, MapPin, User } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

interface Event {
  id: string
  title: string
  start_date: string
  location?: string
  client_name?: string
  event_type: string
}

interface UpcomingEventsProps {
  events: Event[]
}

const eventTypeColors: Record<string, string> = {
  meeting: 'text-blue-600 bg-blue-50',
  site_visit: 'text-green-600 bg-green-50',
  presentation: 'text-purple-600 bg-purple-50',
  deadline: 'text-red-600 bg-red-50',
  other: 'text-gray-600 bg-gray-50',
}

const eventTypeLabels: Record<string, string> = {
  meeting: 'Réunion',
  site_visit: 'Visite de chantier',
  presentation: 'Présentation',
  deadline: 'Échéance',
  other: 'Autre',
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  const router = useRouter()

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prochains rendez-vous</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 text-center py-8">
            Aucun rendez-vous à venir
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prochains rendez-vous</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event) => {
            const colorClass = eventTypeColors[event.event_type] || eventTypeColors.other
            const eventLabel = eventTypeLabels[event.event_type] || eventTypeLabels.other
            const eventDate = new Date(event.start_date)

            return (
              <div
                key={event.id}
                className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => router.push('/planning')}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${colorClass} flex flex-col items-center justify-center`}>
                  <span className="text-xs font-bold">
                    {format(eventDate, 'd', { locale: fr })}
                  </span>
                  <span className="text-[10px] uppercase">
                    {format(eventDate, 'MMM', { locale: fr })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {event.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(eventDate, 'HH:mm', { locale: fr })}
                    </span>
                    {event.client_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {event.client_name}
                      </span>
                    )}
                  </div>
                  {event.location && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </p>
                  )}
                  <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                    {eventLabel}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
