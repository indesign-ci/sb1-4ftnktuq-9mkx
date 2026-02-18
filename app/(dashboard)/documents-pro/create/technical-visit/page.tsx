'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { BaseDocumentLayout } from '@/components/documents-pro/base-document-layout'
import { ProfessionalDocumentPreview } from '@/components/documents-pro/professional-document-preview'
import { Card, CardContent } from '@/components/ui/card'
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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { generateProfessionalDocumentPDF } from '@/lib/pdf/professional-document-pdf'

export default function TechnicalVisitPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [company, setCompany] = useState<any>(null)

  const [formData, setFormData] = useState({
    client_id: '',
    project_id: '',
    visit_date: new Date().toISOString().split('T')[0],
    visit_time: '14:00',
    attendees: '',
    property_address: '',
    property_type: '',
    property_year: '',
    total_area: '',
    ceiling_height: '',
    number_of_rooms: '',
    orientation: '',
    natural_light: 'good',
    heating_type: '',
    insulation_quality: 'average',
    electrical_installation: 'compliant',
    plumbing_state: 'good',
    structural_issues: '',
    existing_features: '',
    features_to_keep: '',
    features_to_remove: '',
    technical_constraints: '',
    renovation_scope: '',
    special_observations: '',
    measurements_taken: false,
    photos_taken: false,
    plans_obtained: false,
    next_actions: '',
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
    return `VT-${year}${month}-${random}`
  }

  const handleSave = async () => {
    if (!formData.client_id) {
      toast.error('Veuillez sélectionner un client')
      return
    }

    setIsSaving(true)
    try {
      const documentNumber = generateDocumentNumber()

      const { error } = await supabase.from('professional_documents').insert({
        company_id: profile?.company_id,
        created_by: profile?.id,
        document_type: 'technical_visit',
        document_phase: 'phase2',
        document_number: documentNumber,
        title: `Compte-rendu de visite technique - ${
          clients.find((c) => c.id === formData.client_id)?.first_name || ''
        }`,
        client_id: formData.client_id || null,
        project_id: formData.project_id || null,
        status: 'draft',
        document_data: formData,
      })

      if (error) throw error

      toast.success('Document sauvegardé')
      router.push('/documents-pro')
    } catch (error: any) {
      toast.error('Erreur lors de la sauvegarde')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedClient = clients.find((c) => c.id === formData.client_id)
  const selectedProject = projects.find((p) => p.id === formData.project_id)

  const handleDownloadPDF = async () => {
    if (!selectedClient) {
      toast.error('Veuillez sélectionner un client avant de générer le PDF')
      return
    }

    try {
      const sections = []

      const propertyDetails = []
      if (formData.property_address) propertyDetails.push({ label: 'Adresse', value: formData.property_address })
      if (formData.property_type) propertyDetails.push({ label: 'Type', value: formData.property_type })
      if (formData.total_area) propertyDetails.push({ label: 'Surface', value: `${formData.total_area} m²` })
      if (formData.ceiling_height) propertyDetails.push({ label: 'Hauteur sous plafond', value: `${formData.ceiling_height} m` })
      if (formData.number_of_rooms) propertyDetails.push({ label: 'Nombre de pièces', value: formData.number_of_rooms })
      if (propertyDetails.length > 0) {
        sections.push({ title: 'Caractéristiques du bien', content: propertyDetails })
      }

      const technicalDetails = []
      technicalDetails.push({ label: 'Luminosité naturelle', value: formData.natural_light })
      if (formData.heating_type) technicalDetails.push({ label: 'Chauffage', value: formData.heating_type })
      technicalDetails.push({ label: 'Isolation', value: formData.insulation_quality })
      technicalDetails.push({ label: 'Installation électrique', value: formData.electrical_installation })
      sections.push({ title: 'État technique', content: technicalDetails })

      if (formData.renovation_scope) {
        sections.push({ title: 'Étendue des travaux', content: formData.renovation_scope })
      }

      if (formData.technical_constraints) {
        sections.push({ title: 'Contraintes techniques', content: formData.technical_constraints })
      }

      if (formData.next_actions) {
        sections.push({ title: 'Prochaines actions', content: formData.next_actions })
      }

      await generateProfessionalDocumentPDF({
        documentNumber: generateDocumentNumber(),
        documentTitle: 'Compte-rendu de visite technique',
        documentDate: new Date(formData.visit_date),
        company: {
          name: company?.name || 'Votre Entreprise',
          address: company?.address,
          phone: company?.phone,
          email: company?.email,
        },
        client: {
          name: `${selectedClient.first_name} ${selectedClient.last_name}`,
          phone: selectedClient.phone,
          email: selectedClient.email,
        },
        projectName: selectedProject?.name,
        sections,
      })

      toast.success('PDF généré avec succès')
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF')
      console.error(error)
    }
  }

  const formContent = (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Client *</Label>
              <Select value={formData.client_id} onValueChange={(v) => setFormData({ ...formData, client_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_id">Projet (optionnel)</Label>
              <Select value={formData.project_id} onValueChange={(v) => setFormData({ ...formData, project_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visit_date">Date de la visite</Label>
              <Input
                id="visit_date"
                type="date"
                value={formData.visit_date}
                onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visit_time">Heure</Label>
              <Input
                id="visit_time"
                type="time"
                value={formData.visit_time}
                onChange={(e) => setFormData({ ...formData, visit_time: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="attendees">Personnes présentes</Label>
              <Input
                id="attendees"
                placeholder="Ex: Client, architecte d'intérieur..."
                value={formData.attendees}
                onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Caractéristiques du bien</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="property_address">Adresse</Label>
              <Input
                id="property_address"
                placeholder="Adresse complète"
                value={formData.property_address}
                onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_type">Type de bien</Label>
              <Input
                id="property_type"
                placeholder="Ex: Appartement, Maison..."
                value={formData.property_type}
                onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_year">Année de construction</Label>
              <Input
                id="property_year"
                type="number"
                placeholder="Ex: 1990"
                value={formData.property_year}
                onChange={(e) => setFormData({ ...formData, property_year: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_area">Surface totale (m²)</Label>
              <Input
                id="total_area"
                type="number"
                placeholder="Ex: 85"
                value={formData.total_area}
                onChange={(e) => setFormData({ ...formData, total_area: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ceiling_height">Hauteur sous plafond (m)</Label>
              <Input
                id="ceiling_height"
                type="number"
                step="0.1"
                placeholder="Ex: 2.5"
                value={formData.ceiling_height}
                onChange={(e) => setFormData({ ...formData, ceiling_height: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number_of_rooms">Nombre de pièces</Label>
              <Input
                id="number_of_rooms"
                type="number"
                placeholder="Ex: 4"
                value={formData.number_of_rooms}
                onChange={(e) => setFormData({ ...formData, number_of_rooms: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orientation">Orientation</Label>
              <Input
                id="orientation"
                placeholder="Ex: Sud-Est"
                value={formData.orientation}
                onChange={(e) => setFormData({ ...formData, orientation: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">État technique</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="natural_light">Luminosité naturelle</Label>
              <Select value={formData.natural_light} onValueChange={(v) => setFormData({ ...formData, natural_light: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellente</SelectItem>
                  <SelectItem value="good">Bonne</SelectItem>
                  <SelectItem value="average">Moyenne</SelectItem>
                  <SelectItem value="poor">Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heating_type">Type de chauffage</Label>
              <Input
                id="heating_type"
                placeholder="Ex: Gaz, électrique..."
                value={formData.heating_type}
                onChange={(e) => setFormData({ ...formData, heating_type: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insulation_quality">Qualité de l'isolation</Label>
              <Select value={formData.insulation_quality} onValueChange={(v) => setFormData({ ...formData, insulation_quality: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellente</SelectItem>
                  <SelectItem value="good">Bonne</SelectItem>
                  <SelectItem value="average">Moyenne</SelectItem>
                  <SelectItem value="poor">Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="electrical_installation">Installation électrique</Label>
              <Select value={formData.electrical_installation} onValueChange={(v) => setFormData({ ...formData, electrical_installation: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compliant">Aux normes</SelectItem>
                  <SelectItem value="needs_update">À mettre aux normes</SelectItem>
                  <SelectItem value="non_compliant">Non conforme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="structural_issues">Problèmes structurels identifiés</Label>
              <Textarea
                id="structural_issues"
                placeholder="Fissures, humidité, etc..."
                rows={3}
                value={formData.structural_issues}
                onChange={(e) => setFormData({ ...formData, structural_issues: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Observations et recommandations</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="renovation_scope">Étendue des travaux envisagés</Label>
              <Textarea
                id="renovation_scope"
                placeholder="Description des travaux..."
                rows={4}
                value={formData.renovation_scope}
                onChange={(e) => setFormData({ ...formData, renovation_scope: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="technical_constraints">Contraintes techniques</Label>
              <Textarea
                id="technical_constraints"
                placeholder="Contraintes identifiées..."
                rows={3}
                value={formData.technical_constraints}
                onChange={(e) => setFormData({ ...formData, technical_constraints: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_observations">Observations particulières</Label>
              <Textarea
                id="special_observations"
                placeholder="Autres observations..."
                rows={3}
                value={formData.special_observations}
                onChange={(e) => setFormData({ ...formData, special_observations: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <Label>Documents et relevés</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="measurements_taken"
                  checked={formData.measurements_taken}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, measurements_taken: checked as boolean })
                  }
                />
                <label htmlFor="measurements_taken" className="text-sm">
                  Relevé de mesures effectué
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="photos_taken"
                  checked={formData.photos_taken}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, photos_taken: checked as boolean })
                  }
                />
                <label htmlFor="photos_taken" className="text-sm">
                  Photos prises
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="plans_obtained"
                  checked={formData.plans_obtained}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, plans_obtained: checked as boolean })
                  }
                />
                <label htmlFor="plans_obtained" className="text-sm">
                  Plans existants obtenus
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_actions">Prochaines actions</Label>
              <Textarea
                id="next_actions"
                placeholder="Actions à réaliser suite à la visite..."
                rows={3}
                value={formData.next_actions}
                onChange={(e) => setFormData({ ...formData, next_actions: e.target.value })}
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
      documentTitle="Compte-rendu de visite technique"
      documentDate={new Date(formData.visit_date)}
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
        <div className="bg-[#F5F5F5] p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-700">Date de visite</p>
              <p className="text-gray-600">{formData.visit_date} à {formData.visit_time}</p>
            </div>
            {formData.attendees && (
              <div>
                <p className="font-semibold text-gray-700">Personnes présentes</p>
                <p className="text-gray-600">{formData.attendees}</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-[#C5A572] mb-4">Caractéristiques du bien</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {formData.property_address && (
              <div className="col-span-2">
                <p className="font-semibold text-gray-700">Adresse</p>
                <p className="text-gray-600">{formData.property_address}</p>
              </div>
            )}
            {formData.property_type && (
              <div>
                <p className="font-semibold text-gray-700">Type</p>
                <p className="text-gray-600">{formData.property_type}</p>
              </div>
            )}
            {formData.total_area && (
              <div>
                <p className="font-semibold text-gray-700">Surface</p>
                <p className="text-gray-600">{formData.total_area} m²</p>
              </div>
            )}
            {formData.ceiling_height && (
              <div>
                <p className="font-semibold text-gray-700">Hauteur sous plafond</p>
                <p className="text-gray-600">{formData.ceiling_height} m</p>
              </div>
            )}
            {formData.number_of_rooms && (
              <div>
                <p className="font-semibold text-gray-700">Nombre de pièces</p>
                <p className="text-gray-600">{formData.number_of_rooms}</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-[#C5A572] mb-4">État technique</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-700">Luminosité naturelle</p>
              <p className="text-gray-600 capitalize">{formData.natural_light}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Isolation</p>
              <p className="text-gray-600 capitalize">{formData.insulation_quality}</p>
            </div>
            {formData.heating_type && (
              <div>
                <p className="font-semibold text-gray-700">Chauffage</p>
                <p className="text-gray-600">{formData.heating_type}</p>
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-700">Installation électrique</p>
              <p className="text-gray-600">{formData.electrical_installation}</p>
            </div>
          </div>
        </div>

        {formData.renovation_scope && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Étendue des travaux</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.renovation_scope}</p>
          </div>
        )}

        {formData.technical_constraints && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Contraintes techniques</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.technical_constraints}</p>
          </div>
        )}

        {formData.next_actions && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Prochaines actions</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.next_actions}</p>
          </div>
        )}
      </div>
    </ProfessionalDocumentPreview>
  )

  return (
    <BaseDocumentLayout
      title="Compte-rendu de visite technique"
      formContent={formContent}
      previewContent={previewContent}
      onSave={handleSave}
      isSaving={isSaving}
      onDownloadPDF={handleDownloadPDF}
    />
  )
}
