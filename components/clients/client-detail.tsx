// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Phone, MapPin, Home, Banknote, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface ClientDetailProps {
  clientId: string
}

const statusColors: Record<string, string> = {
  prospect: 'bg-gray-500 text-white',
  first_contact: 'bg-blue-500 text-white',
  premier_contact: 'bg-blue-500 text-white',
  quote_sent: 'bg-yellow-500 text-white',
  devis_envoye: 'bg-yellow-500 text-white',
  project_signed: 'bg-green-500 text-white',
  projet_signe: 'bg-green-500 text-white',
  active: 'bg-emerald-500 text-white',
  actif: 'bg-emerald-500 text-white',
  completed: 'bg-purple-500 text-white',
  termine: 'bg-purple-500 text-white',
  inactive: 'bg-gray-400 text-white',
  inactif: 'bg-gray-400 text-white',
}

const statusLabels: Record<string, string> = {
  prospect: 'Prospect',
  first_contact: 'Premier contact',
  premier_contact: 'Premier contact',
  quote_sent: 'Devis envoyé',
  devis_envoye: 'Devis envoyé',
  project_signed: 'Projet signé',
  projet_signe: 'Projet signé',
  active: 'Actif',
  actif: 'Actif',
  completed: 'Terminé',
  termine: 'Terminé',
  inactive: 'Inactif',
  inactif: 'Inactif',
}

export function ClientDetail({ clientId }: ClientDetailProps) {
  const [client, setClient] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  

  useEffect(() => {
    loadData()
  }, [clientId])

  const loadData = async () => {
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (clientError) throw clientError

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (projectsError) throw projectsError

      setClient(clientData)
      setProjects(projectsData || [])
    } catch (error: any) {
      toast.error('Erreur lors du chargement')
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

  if (!client) return null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {client.first_name} {client.last_name}
          </h2>
          <Badge className={cn('mt-2', statusColors[client.status] || 'bg-gray-500 text-white')}>{statusLabels[client.status] || client.status || '—'}</Badge>
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Informations</TabsTrigger>
          <TabsTrigger value="projects">Projets ({projects.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <div>{client.address}</div>
                    {client.city && client.postal_code && (
                      <div className="text-gray-600">
                        {client.postal_code} {client.city}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                {client.property_type && (
                  <div>
                    <div className="text-sm text-gray-600">Type de bien</div>
                    <div className="font-medium">{client.property_type}</div>
                  </div>
                )}
                {client.surface_area && (
                  <div>
                    <div className="text-sm text-gray-600">Surface</div>
                    <div className="font-medium">{client.surface_area} m²</div>
                  </div>
                )}
                {client.estimated_budget && (
                  <div>
                    <div className="text-sm text-gray-600">Budget estimé</div>
                    <div className="font-medium">
                      {client.estimated_budget.toLocaleString()} FCFA
                    </div>
                  </div>
                )}
                {client.style_preference && (
                  <div>
                    <div className="text-sm text-gray-600">Style préféré</div>
                    <div className="font-medium">{client.style_preference}</div>
                  </div>
                )}
                {client.source && (
                  <div>
                    <div className="text-sm text-gray-600">Source</div>
                    <div className="font-medium">{client.source}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-600">Date de création</div>
                  <div className="font-medium">
                    {format(new Date(client.created_at), 'dd MMMM yyyy', {
                      locale: fr,
                    })}
                  </div>
                </div>
              </div>

              {client.notes && (
                <div className="mt-4">
                  <div className="text-sm text-gray-600 mb-1">Notes</div>
                  <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          {projects.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Aucun projet pour ce client
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <Card key={project.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{project.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {project.address}
                        </p>
                      </div>
                      <Badge>{project.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
