'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { BaseDocumentLayout } from '@/components/documents-pro/base-document-layout'
import { ProfessionalDocumentPreview } from '@/components/documents-pro/professional-document-preview'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { generateProfessionalDocumentPDF } from '@/lib/pdf/professional-document-pdf'

type RoomMeasurement = {
  id: string
  room_name: string
  length: string
  width: string
  height: string
  area: string
  notes: string
}

export default function MeasurementReportPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [company, setCompany] = useState<any>(null)

  const [formData, setFormData] = useState({
    client_id: '',
    project_id: '',
    measurement_date: new Date().toISOString().split('T')[0],
    property_address: '',
    total_area: '',
    ceiling_height_avg: '',
    rooms: [] as RoomMeasurement[],
    windows_doors: '',
    electrical_points: '',
    plumbing_points: '',
    structural_elements: '',
    special_features: '',
    access_constraints: '',
    general_notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [clientsRes, projectsRes, companyRes] = await Promise.all([
        supabase
          .from('clients')
          .select('id, first_name, last_name, email, phone')
          .eq('company_id', profile?.company_id || ''),
        supabase
          .from('projects')
          .select('id, name')
          .eq('company_id', profile?.company_id || ''),
        supabase
          .from('companies')
          .select('*')
          .eq('id', profile?.company_id || '')
          .maybeSingle(),
      ])

      if (clientsRes.data) setClients(clientsRes.data)
      if (projectsRes.data) setProjects(projectsRes.data)
      if (companyRes.data) setCompany(companyRes.data)
    } catch (error: any) {
      console.error('Error loading data:', error)
    }
  }

  const generateDocumentNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')
    return `RM-${year}${month}-${random}`
  }

  const addRoom = () => {
    setFormData({
      ...formData,
      rooms: [
        ...formData.rooms,
        {
          id: Date.now().toString(),
          room_name: '',
          length: '',
          width: '',
          height: '',
          area: '',
          notes: '',
        },
      ],
    })
  }

  const removeRoom = (id: string) => {
    setFormData({
      ...formData,
      rooms: formData.rooms.filter((room: RoomMeasurement) => room.id !== id),
    })
  }

  const updateRoom = (id: string, field: keyof RoomMeasurement, value: string) => {
    setFormData({
      ...formData,
      rooms: formData.rooms.map((room: RoomMeasurement) => {
        if (room.id === id) {
          const updatedRoom = { ...room, [field]: value }
          if (field === 'length' || field === 'width') {
            const length = parseFloat(field === 'length' ? value : updatedRoom.length) || 0
            const width = parseFloat(field === 'width' ? value : updatedRoom.width) || 0
            updatedRoom.area = length && width ? (length * width).toFixed(2) : ''
          }
          return updatedRoom
        }
        return room
      }),
    })
  }

  const handleSave = async () => {
    if (!formData.project_id) {
      toast.error('Veuillez sélectionner un projet')
      return
    }

    setIsSaving(true)
    try {
      const documentNumber = generateDocumentNumber()

      const { error } = await supabase.from('professional_documents').insert({
        company_id: profile?.company_id,
        created_by: profile?.id,
        document_type: 'measurement_report',
        document_phase: 'phase2',
        document_number: documentNumber,
        title: `Relevé de mesures - ${
          projects.find((p: { id: string; name: string }) => p.id === formData.project_id)?.name || ''
        }`,
        client_id: formData.client_id || null,
        project_id: formData.project_id || null,
        status: 'draft',
        document_data: formData,
      })

      if (error) throw error

      toast.success('Relevé sauvegardé en brouillon')
      router.push('/documents-pro')
    } catch (error: any) {
      toast.error('Erreur lors de la sauvegarde')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedClient = clients.find((c: { id: string; first_name: string; last_name: string }) => c.id === formData.client_id)
  const selectedProject = projects.find((p: { id: string; name: string }) => p.id === formData.project_id)

  const handleDownloadPDF = async () => {
    if (!selectedProject) {
      toast.error('Veuillez sélectionner un projet avant de générer le PDF')
      return
    }

    try {
      const sections = []

      if (formData.property_address) {
        sections.push({
          title: 'Adresse du bien',
          content: formData.property_address,
        })
      }

      if (formData.rooms.length > 0) {
        const roomsData = formData.rooms.map((room: RoomMeasurement) => ({
          label: room.room_name,
          value: `L: ${room.length}m × l: ${room.width}m × H: ${room.height}m = ${room.area}m²`,
        }))
        sections.push({ title: 'Mesures des pièces', content: roomsData })
      }

      if (formData.windows_doors) {
        sections.push({ title: 'Ouvertures (Portes et fenêtres)', content: formData.windows_doors })
      }

      if (formData.electrical_points) {
        sections.push({ title: 'Points électriques', content: formData.electrical_points })
      }

      if (formData.plumbing_points) {
        sections.push({ title: 'Points de plomberie', content: formData.plumbing_points })
      }

      if (formData.structural_elements) {
        sections.push({ title: 'Éléments structurels', content: formData.structural_elements })
      }

      await generateProfessionalDocumentPDF({
        documentNumber: generateDocumentNumber(),
        documentTitle: 'Relevé de mesures',
        documentDate: new Date(formData.measurement_date),
        company: {
          name: company?.name || 'Votre Entreprise',
          address: company?.address,
          phone: company?.phone,
          email: company?.email,
        },
        client: selectedClient
          ? {
              name: `${selectedClient.first_name} ${selectedClient.last_name}`,
              phone: selectedClient.phone,
              email: selectedClient.email,
            }
          : undefined,
        projectName: selectedProject?.name,
        sections,
      })

      toast.success('PDF généré avec succès')
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF')
      console.error(error)
    }
  }

  const totalArea = formData.rooms.reduce((sum: number, room: RoomMeasurement) => sum + (parseFloat(room.area) || 0), 0)

  const formContent = (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project_id">Projet *</Label>
              <Select value={formData.project_id} onValueChange={(v: string) => setFormData({ ...formData, project_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project: { id: string; name: string }) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_id">Client (optionnel)</Label>
              <Select value={formData.client_id} onValueChange={(v: string) => setFormData({ ...formData, client_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client: { id: string; first_name: string; last_name: string }) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="measurement_date">Date du relevé</Label>
              <Input
                id="measurement_date"
                type="date"
                value={formData.measurement_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, measurement_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_address">Adresse du bien</Label>
              <Input
                id="property_address"
                placeholder="Adresse complète"
                value={formData.property_address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, property_address: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Mesures des pièces</h3>
            <Button onClick={addRoom} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une pièce
            </Button>
          </div>

          {formData.rooms.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              Aucune pièce ajoutée. Cliquez sur "Ajouter une pièce" pour commencer.
            </p>
          )}

          <div className="space-y-4">
            {formData.rooms.map((room: RoomMeasurement, index: number) => (
              <div key={room.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-gray-700">Pièce {index + 1}</span>
                  <Button
                    onClick={() => removeRoom(room.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2 col-span-2">
                    <Label>Nom de la pièce</Label>
                    <Input
                      placeholder="Ex: Salon, Chambre 1..."
                      value={room.room_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRoom(room.id, 'room_name', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Longueur (m)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 5.50"
                      value={room.length}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRoom(room.id, 'length', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Largeur (m)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 4.20"
                      value={room.width}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRoom(room.id, 'width', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Hauteur (m)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 2.70"
                      value={room.height}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRoom(room.id, 'height', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Surface calculée (m²)</Label>
                    <Input
                      type="text"
                      value={room.area}
                      readOnly
                      className="bg-gray-100"
                      placeholder="Calculé auto"
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label>Notes</Label>
                    <Input
                      placeholder="Particularités de cette pièce..."
                      value={room.notes}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRoom(room.id, 'notes', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {formData.rooms.length > 0 && (
            <div className="bg-[#C5A572] text-white p-3 rounded-lg">
              <p className="font-semibold">Surface totale: {totalArea.toFixed(2)} m²</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Éléments techniques</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="windows_doors">Ouvertures (Portes et fenêtres)</Label>
              <Textarea
                id="windows_doors"
                placeholder="Dimensions et positions des portes et fenêtres..."
                rows={4}
                value={formData.windows_doors}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, windows_doors: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="electrical_points">Points électriques</Label>
              <Textarea
                id="electrical_points"
                placeholder="Prises, interrupteurs, tableau électrique..."
                rows={3}
                value={formData.electrical_points}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, electrical_points: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plumbing_points">Points de plomberie</Label>
              <Textarea
                id="plumbing_points"
                placeholder="Arrivées d'eau, évacuations..."
                rows={3}
                value={formData.plumbing_points}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, plumbing_points: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="structural_elements">Éléments structurels</Label>
              <Textarea
                id="structural_elements"
                placeholder="Poutres, poteaux, murs porteurs..."
                rows={3}
                value={formData.structural_elements}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, structural_elements: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_features">Particularités</Label>
              <Textarea
                id="special_features"
                placeholder="Cheminée, mezzanine, escalier..."
                rows={3}
                value={formData.special_features}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, special_features: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="access_constraints">Contraintes d'accès</Label>
              <Textarea
                id="access_constraints"
                placeholder="Ascenseur, escaliers étroits, distance de livraison..."
                rows={2}
                value={formData.access_constraints}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, access_constraints: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="general_notes">Notes générales</Label>
              <Textarea
                id="general_notes"
                placeholder="Observations complémentaires..."
                rows={3}
                value={formData.general_notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, general_notes: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const previewContent = (
    <ProfessionalDocumentPreview
      documentNumber={generateDocumentNumber()}
      documentTitle="Relevé de mesures"
      documentDate={new Date(formData.measurement_date)}
      companyName={company?.name}
      companyAddress={company?.address}
      companyPhone={company?.phone}
      companyEmail={company?.email}
      clientName={selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : undefined}
      clientPhone={selectedClient?.phone}
      clientEmail={selectedClient?.email}
      projectName={selectedProject?.name}
    >
      <div className="space-y-6">
        {formData.property_address && (
          <div className="bg-[#F5F5F5] p-4 rounded-lg">
            <p className="font-semibold text-gray-700">Adresse</p>
            <p className="text-gray-600">{formData.property_address}</p>
          </div>
        )}

        {formData.rooms.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Mesures des pièces</h3>
            <div className="space-y-3">
              {formData.rooms.map((room: RoomMeasurement) => (
                <div key={room.id} className="bg-[#F5F5F5] p-3 rounded">
                  <p className="font-semibold text-gray-900">{room.room_name}</p>
                  <div className="text-sm text-gray-600 mt-1">
                    <p>
                      Longueur: {room.length}m × Largeur: {room.width}m × Hauteur: {room.height}m
                    </p>
                    <p className="font-semibold text-[#C5A572]">Surface: {room.area} m²</p>
                    {room.notes && <p className="mt-1 italic">{room.notes}</p>}
                  </div>
                </div>
              ))}
              <div className="bg-[#C5A572] text-white p-3 rounded-lg mt-3">
                <p className="font-semibold">SURFACE TOTALE: {totalArea.toFixed(2)} m²</p>
              </div>
            </div>
          </div>
        )}

        {formData.windows_doors && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Ouvertures</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.windows_doors}</p>
          </div>
        )}

        {formData.electrical_points && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Points électriques</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.electrical_points}</p>
          </div>
        )}

        {formData.plumbing_points && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Points de plomberie</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.plumbing_points}</p>
          </div>
        )}

        {formData.structural_elements && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Éléments structurels</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.structural_elements}</p>
          </div>
        )}
      </div>
    </ProfessionalDocumentPreview>
  )

  return (
    <BaseDocumentLayout
      title="Relevé de mesures"
      formContent={formContent}
      previewContent={previewContent}
      onSave={handleSave}
      isSaving={isSaving}
      onPreviewPDF={handleDownloadPDF}
    />
  )
}
