// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

type EventFormProps = {
  eventId?: string
  initialDate?: Date
  onSuccess: () => void
  onCancel?: () => void
}

const eventTypes = [
  { value: 'meeting', label: 'Rendez-vous client', color: 'bg-blue-500' },
  { value: 'site_visit', label: 'Visite chantier', color: 'bg-green-500' },
  { value: 'contractor_meeting', label: 'Réunion artisans', color: 'bg-orange-500' },
  { value: 'deadline', label: 'Deadline projet', color: 'bg-purple-500' },
  { value: 'internal', label: 'Tâche interne', color: 'bg-gray-500' },
]

export function EventForm({ eventId, initialDate, onSuccess, onCancel }: EventFormProps) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  

  const getDefaultDateTime = (date?: Date) => {
    const d = date || new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const [formData, setFormData] = useState({
    title: '',
    event_type: 'meeting',
    start_datetime: getDefaultDateTime(initialDate),
    end_datetime: getDefaultDateTime(
      new Date((initialDate || new Date()).getTime() + 60 * 60 * 1000)
    ),
    location: '',
    client_id: 'none',
    project_id: 'none',
    description: '',
  })

  useEffect(() => {
    loadClients()
    if (eventId) {
      loadEvent()
    }
  }, [eventId])

  useEffect(() => {
    if (formData.client_id) {
      loadProjects(formData.client_id)
    }
  }, [formData.client_id])

  const loadClients = async () => {
    if (!profile?.company_id) return

    const { data, error } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
      .eq('company_id', profile.company_id)
      .order('first_name')

    if (!error && data) {
      setClients(data)
    }
  }

  const loadProjects = async (clientId: string) => {
    if (!profile?.company_id) return

    const { data, error } = await supabase
      .from('projects')
      .select('id, name')
      .eq('company_id', profile.company_id)
      .eq('client_id', clientId)
      .order('name')

    if (!error && data) {
      setProjects(data)
    }
  }

  const loadEvent = async () => {
    if (!eventId) return

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (error) throw error

      const event = data as any

      setFormData({
        title: event.title,
        event_type: event.event_type,
        start_datetime: event.start_datetime.slice(0, 16),
        end_datetime: event.end_datetime.slice(0, 16),
        location: event.location || '',
        client_id: event.client_id || 'none',
        project_id: event.project_id || 'none',
        description: event.description || '',
      })
    } catch (error: any) {
      toast.error('Erreur lors du chargement de l\'événement')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title) {
      toast.error('Veuillez saisir un titre')
      return
    }

    if (new Date(formData.end_datetime) <= new Date(formData.start_datetime)) {
      toast.error('La date de fin doit être après la date de début')
      return
    }

    setLoading(true)
    try {
      const eventData = {
        company_id: profile?.company_id,
        title: formData.title,
        event_type: formData.event_type,
        start_datetime: formData.start_datetime,
        end_datetime: formData.end_datetime,
        location: formData.location || null,
        client_id: formData.client_id === 'none' ? null : formData.client_id,
        project_id: formData.project_id === 'none' ? null : formData.project_id,
        description: formData.description || null,
        created_by: profile?.id,
      }

      if (eventId) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', eventId)

        if (error) throw error
        toast.success('Événement modifié')
      } else {
        const { error } = await supabase.from('events').insert(eventData)

        if (error) throw error
        toast.success('Événement créé')
      }

      onSuccess()
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la sauvegarde')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titre *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          placeholder="Titre de l'événement"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="event_type">Type *</Label>
        <Select
          value={formData.event_type}
          onValueChange={(value) =>
            setFormData({ ...formData, event_type: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {eventTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${type.color}`} />
                  {type.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_datetime">Date et heure de début *</Label>
          <Input
            id="start_datetime"
            type="datetime-local"
            value={formData.start_datetime}
            onChange={(e) =>
              setFormData({ ...formData, start_datetime: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_datetime">Date et heure de fin *</Label>
          <Input
            id="end_datetime"
            type="datetime-local"
            value={formData.end_datetime}
            onChange={(e) =>
              setFormData({ ...formData, end_datetime: e.target.value })
            }
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Lieu</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
          placeholder="Adresse ou lieu"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="client_id">Client</Label>
          <Select
            value={formData.client_id}
            onValueChange={(value) =>
              setFormData({ ...formData, client_id: value, project_id: 'none' })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun client</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.first_name} {client.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="project_id">Projet</Label>
          <Select
            value={formData.project_id}
            onValueChange={(value) =>
              setFormData({ ...formData, project_id: value })
            }
            disabled={!formData.client_id}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un projet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun projet</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Notes</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={4}
          placeholder="Notes et détails de l'événement"
        />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel || onSuccess}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-[#C5A572] hover:bg-[#B39562] text-white"
        >
          {loading ? 'Enregistrement...' : eventId ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  )
}
