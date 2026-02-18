// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Calendar, Clock, MapPin, User, Briefcase, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type EventDetailProps = {
  eventId: string
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}

const eventTypes = {
  meeting: { label: 'Rendez-vous client', color: 'bg-blue-500' },
  site_visit: { label: 'Visite chantier', color: 'bg-green-500' },
  contractor_meeting: { label: 'Réunion artisans', color: 'bg-orange-500' },
  deadline: { label: 'Deadline projet', color: 'bg-purple-500' },
  internal: { label: 'Tâche interne', color: 'bg-gray-500' },
}

export function EventDetail({ eventId, onEdit, onDelete, onClose }: EventDetailProps) {
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  

  useEffect(() => {
    loadEvent()
  }, [eventId])

  const loadEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          clients (first_name, last_name),
          projects (name)
        `)
        .eq('id', eventId)
        .single()

      if (error) throw error
      setEvent(data)
    } catch (error: any) {
      toast.error('Erreur lors du chargement de l\'événement')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A572] mx-auto"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-8 text-gray-500">Événement introuvable</div>
    )
  }

  const eventType = eventTypes[event.event_type as keyof typeof eventTypes]
  const startDate = new Date(event.start_datetime)
  const endDate = new Date(event.end_datetime)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-3 h-3 rounded-full ${eventType.color}`} />
            <Badge variant="outline">{eventType.label}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <p className="font-medium">
              {format(startDate, 'EEEE d MMMM yyyy', { locale: fr })}
            </p>
            <p className="text-sm text-gray-600">
              De {format(startDate, 'HH:mm')} à {format(endDate, 'HH:mm')}
            </p>
          </div>
        </div>

        {event.location && (
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Lieu</p>
              <p className="text-sm text-gray-600">{event.location}</p>
            </div>
          </div>
        )}

        {event.clients && (
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Client</p>
              <p className="text-sm text-gray-600">
                {event.clients.first_name} {event.clients.last_name}
              </p>
            </div>
          </div>
        )}

        {event.projects && (
          <div className="flex items-start gap-3">
            <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Projet</p>
              <p className="text-sm text-gray-600">{event.projects.name}</p>
            </div>
          </div>
        )}
      </div>

      {event.description && (
        <>
          <Separator />
          <div>
            <p className="font-medium mb-2">Notes</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        </>
      )}

      <div className="flex justify-end pt-4">
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </div>
  )
}
