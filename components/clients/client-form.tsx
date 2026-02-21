// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import { STYLE_PREFERENCES } from '@/lib/constants'
import { createNotification } from '@/lib/notifications/utils'

const clientSchema = z.object({
  title: z.enum(['M.', 'Mme', 'Mlle', 'M. et Mme']).optional(),
  first_name: z.string().min(1, 'Prénom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  client_type: z.enum(['individual', 'professional']),
  property_type: z.string().optional(),
  surface_area: z.number().optional(),
  estimated_budget: z.number().optional(),
  style_preference: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(['prospect', 'first_contact', 'quote_sent', 'project_signed', 'active', 'completed', 'inactive']),
  notes: z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

interface ClientFormProps {
  clientId?: string
  onSuccess: () => void
}

export function ClientForm({ clientId, onSuccess }: ClientFormProps) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      client_type: 'individual',
      status: 'prospect',
    },
  })

  const clientType = watch('client_type')
  const status = watch('status')

  useEffect(() => {
    if (clientId) {
      loadClient()
    }
  }, [clientId])

  const loadClient = async () => {
    if (!clientId) return

    const { data, error} = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (error) {
      toast.error('Erreur lors du chargement')
      return
    }

    const statusFromDb = (v: string): string => {
      const map: Record<string, string> = {
        prospect: 'prospect',
        premier_contact: 'first_contact',
        devis_envoye: 'quote_sent',
        projet_signe: 'project_signed',
        actif: 'active',
        termine: 'completed',
        inactif: 'inactive',
      }
      return map[v] ?? v
    }
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'client_type' && value) {
        setValue('client_type', value === 'particulier' ? 'individual' : value === 'professionnel' ? 'professional' : (value as 'individual' | 'professional'))
      } else if (key === 'status' && value) {
        setValue('status', statusFromDb(value as string) as ClientFormData['status'])
      } else {
        setValue(key as any, value)
      }
    })
  }

  // Valeurs client_type attendues par l'enum en base (particulier / professionnel)
  const clientTypeForDb = (v: string) => (v === 'individual' ? 'particulier' : v === 'professional' ? 'professionnel' : v)

  // Valeurs status attendues par l'enum client_status en base (souvent en français)
  const statusForDb = (v: string): string => {
    const map: Record<string, string> = {
      prospect: 'prospect',
      first_contact: 'premier_contact',
      quote_sent: 'devis_envoye',
      project_signed: 'projet_signe',
      active: 'actif',
      completed: 'termine',
      inactive: 'inactif',
    }
    return map[v] ?? v
  }

  const onSubmit = async (data: ClientFormData) => {
    if (!profile?.company_id) {
      toast.error('Entreprise non associée. Impossible d\'enregistrer le client.')
      return
    }
    setLoading(true)

    try {
      const clientData: Record<string, unknown> = {
        company_id: profile.company_id,
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        status: statusForDb(data.status),
        client_type: clientTypeForDb(data.client_type),
        title: data.title || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        postal_code: data.postal_code?.trim() || null,
        property_type: data.property_type?.trim() || null,
        surface_area: data.surface_area != null && !Number.isNaN(data.surface_area) ? Number(data.surface_area) : null,
        estimated_budget: data.estimated_budget != null && !Number.isNaN(data.estimated_budget) ? Number(data.estimated_budget) : null,
        style_preference: data.style_preference || null,
        source: data.source?.trim() || null,
        notes: data.notes?.trim() || null,
      }

      if (clientId) {
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', clientId)

        if (error) throw error
        toast.success('Client modifié')
      } else {
        const { data: newClient, error } = await supabase
          .from('clients')
          .insert(clientData)
          .select()
          .single()

        if (error) throw error
        toast.success('Client créé')

        if (data.status === 'prospect') {
          await createNotification({
            type: 'new_prospect',
            title: 'Nouveau prospect',
            message: `${data.first_name} ${data.last_name} a été ajouté comme prospect`,
            link: `/clients`,
            metadata: {
              client_id: newClient.id,
              client_name: `${data.first_name} ${data.last_name}`,
            },
          })
        }
      }

      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-sm">Civilité</Label>
          <Select onValueChange={(value: any) => setValue('title', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="M.">M.</SelectItem>
              <SelectItem value="Mme">Mme</SelectItem>
              <SelectItem value="Mlle">Mlle</SelectItem>
              <SelectItem value="M. et Mme">M. et Mme</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Type</Label>
          <Select value={clientType} onValueChange={(value: any) => setValue('client_type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Particulier</SelectItem>
              <SelectItem value="professional">Professionnel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-sm">Prénom *</Label>
          <Input {...register('first_name')} />
          {errors.first_name && (
            <p className="text-sm text-red-600">{errors.first_name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Nom *</Label>
          <Input {...register('last_name')} />
          {errors.last_name && (
            <p className="text-sm text-red-600">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-sm">Email</Label>
          <Input type="email" {...register('email')} />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Téléphone</Label>
          <Input {...register('phone')} />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-sm">Adresse</Label>
        <Input {...register('address')} className="h-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-sm">Ville</Label>
          <Input {...register('city')} />
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Code postal</Label>
          <Input {...register('postal_code')} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-sm">Type de bien</Label>
          <Input {...register('property_type')} placeholder="Appartement, Maison..." />
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Surface (m²)</Label>
          <Input
            type="number"
            {...register('surface_area', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-sm">Budget estimé (FCFA)</Label>
          <Input
            type="number"
            {...register('estimated_budget', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Style préféré</Label>
          <Select onValueChange={(value) => setValue('style_preference', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {STYLE_PREFERENCES.map((style) => (
                <SelectItem key={style} value={style}>
                  {style}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-sm">Source d'acquisition</Label>
          <Input {...register('source')} placeholder="Recommandation, Site web..." />
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Statut</Label>
          <Select value={status} onValueChange={(value: any) => setValue('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="first_contact">Premier contact</SelectItem>
              <SelectItem value="quote_sent">Devis envoyé</SelectItem>
              <SelectItem value="project_signed">Projet signé</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
              <SelectItem value="inactive">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-sm">Notes</Label>
        <Textarea {...register('notes')} rows={2} className="min-h-[60px]" />
      </div>

      {/* Bouton toujours visible en bas de la zone visible (sticky) */}
      <div className="sticky bottom-0 -mx-3 mt-3 border-t bg-background px-3 py-3 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6">
        <Button
          type="submit"
          className="w-full sm:w-auto bg-[#C5A572] hover:bg-[#B39562] text-white"
          disabled={loading}
        >
          {loading ? 'Enregistrement...' : clientId ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  )
}
