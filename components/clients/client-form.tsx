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

    Object.entries(data).forEach(([key, value]) => {
      setValue(key as any, value)
    })
  }

  const onSubmit = async (data: ClientFormData) => {
    setLoading(true)

    try {
      const clientData: any = {
        ...data,
        company_id: profile?.company_id,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        postal_code: data.postal_code || null,
        property_type: data.property_type || null,
        source: data.source || null,
        notes: data.notes || null,
        style_preference: data.style_preference || null,
      }

      if (clientId) {
        const { error } = await (supabase as any)
          .from('clients')
          .update(clientData)
          .eq('id', clientId)

        if (error) throw error
        toast.success('Client modifié')
      } else {
        const { data: newClient, error } = await (supabase as any)
          .from('clients')
          .insert([clientData])
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Civilité</Label>
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

        <div className="space-y-2">
          <Label>Type</Label>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Prénom *</Label>
          <Input {...register('first_name')} />
          {errors.first_name && (
            <p className="text-sm text-red-600">{errors.first_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Nom *</Label>
          <Input {...register('last_name')} />
          {errors.last_name && (
            <p className="text-sm text-red-600">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" {...register('email')} />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Téléphone</Label>
          <Input {...register('phone')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Adresse</Label>
        <Input {...register('address')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ville</Label>
          <Input {...register('city')} />
        </div>

        <div className="space-y-2">
          <Label>Code postal</Label>
          <Input {...register('postal_code')} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type de bien</Label>
          <Input {...register('property_type')} placeholder="Appartement, Maison..." />
        </div>

        <div className="space-y-2">
          <Label>Surface (m²)</Label>
          <Input
            type="number"
            {...register('surface_area', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Budget estimé (FCFA)</Label>
          <Input
            type="number"
            {...register('estimated_budget', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label>Style préféré</Label>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Source d'acquisition</Label>
          <Input {...register('source')} placeholder="Recommandation, Site web..." />
        </div>

        <div className="space-y-2">
          <Label>Statut</Label>
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

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea {...register('notes')} rows={3} />
      </div>

      <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
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
