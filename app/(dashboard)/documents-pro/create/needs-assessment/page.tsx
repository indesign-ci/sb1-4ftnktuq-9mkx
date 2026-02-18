'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { BaseDocumentLayout } from '@/components/documents-pro/base-document-layout'
import { ProfessionalDocumentPreview } from '@/components/documents-pro/professional-document-preview'
import { DocumentPDFPreviewModal } from '@/components/documents-pro/document-pdf-preview-modal'
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
import { formatCurrency } from '@/lib/currency'
import { generateProfessionalDocumentPDF } from '@/lib/pdf/professional-document-pdf'

export default function NeedsAssessmentPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [company, setCompany] = useState<any>(null)
  const [showPDFPreview, setShowPDFPreview] = useState(false)
  const [pdfData, setPdfData] = useState<any>(null)

  const [formData, setFormData] = useState({
    client_id: '',
    project_id: '',
    assessment_date: new Date().toISOString().split('T')[0],
    project_type: '',
    property_type: '',
    total_area: '',
    number_of_rooms: '',
    current_occupants: '',
    lifestyle_description: '',
    daily_activities: '',
    entertaining_frequency: '',
    work_from_home: false,
    pets: false,
    children: false,
    accessibility_needs: '',
    style_preferences: '',
    color_preferences: '',
    material_preferences: '',
    inspiration_references: '',
    must_have_features: '',
    nice_to_have_features: '',
    dislikes: '',
    storage_needs: '',
    lighting_preferences: '',
    technology_integration: '',
    sustainability_concerns: '',
    budget_total: '',
    budget_flexibility: 'moderate',
    timeline_desired: '',
    timeline_flexibility: 'moderate',
    priority_ranking: '',
    special_requirements: '',
    future_plans: '',
    additional_notes: '',
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
    return `QB-${year}${month}-${random}`
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
        document_type: 'needs_assessment',
        document_phase: 'phase1',
        document_number: documentNumber,
        title: `Questionnaire de besoins - ${
          clients.find((c) => c.id === formData.client_id)?.first_name || ''
        }`,
        client_id: formData.client_id || null,
        project_id: formData.project_id || null,
        status: 'draft',
        document_data: formData,
      })

      if (error) throw error

      toast.success('Questionnaire sauvegardé en brouillon')
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

  const handlePreviewPDF = () => {
    if (!selectedClient) {
      toast.error('Veuillez sélectionner un client avant de générer le PDF')
      return
    }

    try {
      const sections = []

      const projectInfo = []
      if (formData.project_type) projectInfo.push({ label: 'Type de projet', value: formData.project_type })
      if (formData.property_type) projectInfo.push({ label: 'Type de bien', value: formData.property_type })
      if (formData.total_area) projectInfo.push({ label: 'Surface', value: `${formData.total_area} m²` })
      if (formData.number_of_rooms) projectInfo.push({ label: 'Nombre de pièces', value: formData.number_of_rooms })
      if (projectInfo.length > 0) {
        sections.push({ title: 'Informations du projet', content: projectInfo })
      }

      if (formData.lifestyle_description) {
        sections.push({ title: 'Mode de vie', content: formData.lifestyle_description })
      }

      const stylePrefs = []
      if (formData.style_preferences) stylePrefs.push({ label: 'Styles préférés', value: formData.style_preferences })
      if (formData.color_preferences) stylePrefs.push({ label: 'Couleurs', value: formData.color_preferences })
      if (formData.material_preferences) stylePrefs.push({ label: 'Matériaux', value: formData.material_preferences })
      if (stylePrefs.length > 0) {
        sections.push({ title: 'Préférences esthétiques', content: stylePrefs })
      }

      if (formData.must_have_features) {
        sections.push({ title: 'Éléments indispensables', content: formData.must_have_features })
      }

      if (formData.budget_total) {
        const budgetInfo = []
        budgetInfo.push({ label: 'Budget total', value: formatCurrency(formData.budget_total) })
        budgetInfo.push({ label: 'Flexibilité budgétaire', value: formData.budget_flexibility })
        if (formData.timeline_desired) budgetInfo.push({ label: 'Délai souhaité', value: formData.timeline_desired })
        sections.push({ title: 'Budget et planning', content: budgetInfo })
      }

      const documentData = {
        documentNumber: generateDocumentNumber(),
        documentTitle: 'Questionnaire de besoins',
        documentDate: new Date(formData.assessment_date),
        company: {
          name: company?.name || 'Votre Entreprise',
          address: company?.address,
          phone: company?.phone,
          email: company?.email,
          logo_url: company?.logo_url,
        },
        client: {
          name: `${selectedClient.first_name} ${selectedClient.last_name}`,
          phone: selectedClient.phone,
          email: selectedClient.email,
        },
        projectName: selectedProject?.name,
        sections,
      }

      setPdfData(documentData)
      setShowPDFPreview(true)
    } catch (error) {
      toast.error('Erreur lors de la préparation du PDF')
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
              <Label htmlFor="assessment_date">Date de l'évaluation</Label>
              <Input
                id="assessment_date"
                type="date"
                value={formData.assessment_date}
                onChange={(e) => setFormData({ ...formData, assessment_date: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Le projet</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project_type">Type de projet</Label>
              <Input
                id="project_type"
                placeholder="Ex: Rénovation complète, Décoration..."
                value={formData.project_type}
                onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_type">Type de bien</Label>
              <Input
                id="property_type"
                placeholder="Ex: Appartement, Maison, Bureau..."
                value={formData.property_type}
                onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_area">Surface totale (m²)</Label>
              <Input
                id="total_area"
                type="number"
                placeholder="Ex: 120"
                value={formData.total_area}
                onChange={(e) => setFormData({ ...formData, total_area: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number_of_rooms">Nombre de pièces</Label>
              <Input
                id="number_of_rooms"
                placeholder="Ex: 4"
                value={formData.number_of_rooms}
                onChange={(e) => setFormData({ ...formData, number_of_rooms: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mode de vie</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_occupants">Occupants actuels</Label>
              <Input
                id="current_occupants"
                placeholder="Ex: Couple avec 2 enfants"
                value={formData.current_occupants}
                onChange={(e) => setFormData({ ...formData, current_occupants: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="work_from_home"
                  checked={formData.work_from_home}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, work_from_home: checked as boolean })
                  }
                />
                <label htmlFor="work_from_home" className="text-sm font-medium">
                  Télétravail régulier
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pets"
                  checked={formData.pets}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, pets: checked as boolean })
                  }
                />
                <label htmlFor="pets" className="text-sm font-medium">
                  Animaux de compagnie
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="children"
                  checked={formData.children}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, children: checked as boolean })
                  }
                />
                <label htmlFor="children" className="text-sm font-medium">
                  Enfants à la maison
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lifestyle_description">Description du mode de vie</Label>
              <Textarea
                id="lifestyle_description"
                placeholder="Habitudes quotidiennes, routines, loisirs..."
                rows={4}
                value={formData.lifestyle_description}
                onChange={(e) => setFormData({ ...formData, lifestyle_description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entertaining_frequency">Fréquence des réceptions</Label>
              <Input
                id="entertaining_frequency"
                placeholder="Ex: Toutes les semaines, Rarement..."
                value={formData.entertaining_frequency}
                onChange={(e) => setFormData({ ...formData, entertaining_frequency: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Préférences esthétiques</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="style_preferences">Styles préférés</Label>
              <Textarea
                id="style_preferences"
                placeholder="Contemporain, Scandinave, Industriel..."
                rows={2}
                value={formData.style_preferences}
                onChange={(e) => setFormData({ ...formData, style_preferences: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color_preferences">Couleurs préférées</Label>
              <Input
                id="color_preferences"
                placeholder="Ex: Tons neutres, Bleu marine, Or..."
                value={formData.color_preferences}
                onChange={(e) => setFormData({ ...formData, color_preferences: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="material_preferences">Matériaux préférés</Label>
              <Input
                id="material_preferences"
                placeholder="Ex: Bois naturel, Marbre, Velours..."
                value={formData.material_preferences}
                onChange={(e) => setFormData({ ...formData, material_preferences: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspiration_references">Références d'inspiration</Label>
              <Textarea
                id="inspiration_references"
                placeholder="Pinterest, Instagram, magazines..."
                rows={3}
                value={formData.inspiration_references}
                onChange={(e) => setFormData({ ...formData, inspiration_references: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Besoins fonctionnels</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="must_have_features">Éléments indispensables</Label>
              <Textarea
                id="must_have_features"
                placeholder="Fonctionnalités et équipements essentiels..."
                rows={4}
                value={formData.must_have_features}
                onChange={(e) => setFormData({ ...formData, must_have_features: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nice_to_have_features">Souhaits secondaires</Label>
              <Textarea
                id="nice_to_have_features"
                placeholder="Éléments appréciés mais non essentiels..."
                rows={3}
                value={formData.nice_to_have_features}
                onChange={(e) => setFormData({ ...formData, nice_to_have_features: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dislikes">Ce qu'il faut éviter</Label>
              <Textarea
                id="dislikes"
                placeholder="Styles, couleurs, matériaux à éviter..."
                rows={3}
                value={formData.dislikes}
                onChange={(e) => setFormData({ ...formData, dislikes: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storage_needs">Besoins de rangement</Label>
              <Textarea
                id="storage_needs"
                placeholder="Type et volume de rangement nécessaire..."
                rows={2}
                value={formData.storage_needs}
                onChange={(e) => setFormData({ ...formData, storage_needs: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lighting_preferences">Préférences d'éclairage</Label>
              <Textarea
                id="lighting_preferences"
                placeholder="Lumière naturelle, éclairage d'ambiance..."
                rows={2}
                value={formData.lighting_preferences}
                onChange={(e) => setFormData({ ...formData, lighting_preferences: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="technology_integration">Intégration technologique</Label>
              <Textarea
                id="technology_integration"
                placeholder="Domotique, home cinema, son..."
                rows={2}
                value={formData.technology_integration}
                onChange={(e) => setFormData({ ...formData, technology_integration: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget et planning</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="budget_total">Budget total (FCFA)</Label>
              <Input
                id="budget_total"
                type="number"
                placeholder="Ex: 50000000"
                value={formData.budget_total}
                onChange={(e) => setFormData({ ...formData, budget_total: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget_flexibility">Flexibilité budgétaire</Label>
              <Select value={formData.budget_flexibility} onValueChange={(v) => setFormData({ ...formData, budget_flexibility: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strict">Strict</SelectItem>
                  <SelectItem value="moderate">Modérée</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline_flexibility">Flexibilité des délais</Label>
              <Select value={formData.timeline_flexibility} onValueChange={(v) => setFormData({ ...formData, timeline_flexibility: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strict">Strict</SelectItem>
                  <SelectItem value="moderate">Modérée</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="timeline_desired">Délai souhaité</Label>
              <Input
                id="timeline_desired"
                placeholder="Ex: 6 mois, Fin d'année..."
                value={formData.timeline_desired}
                onChange={(e) => setFormData({ ...formData, timeline_desired: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="priority_ranking">Hiérarchie des priorités</Label>
              <Textarea
                id="priority_ranking"
                placeholder="Classez vos priorités (1. Budget, 2. Qualité, 3. Délais...)"
                rows={3}
                value={formData.priority_ranking}
                onChange={(e) => setFormData({ ...formData, priority_ranking: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations complémentaires</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessibility_needs">Besoins d'accessibilité</Label>
              <Textarea
                id="accessibility_needs"
                placeholder="PMR, hauteurs adaptées..."
                rows={2}
                value={formData.accessibility_needs}
                onChange={(e) => setFormData({ ...formData, accessibility_needs: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sustainability_concerns">Préoccupations écologiques</Label>
              <Textarea
                id="sustainability_concerns"
                placeholder="Matériaux durables, économies d'énergie..."
                rows={2}
                value={formData.sustainability_concerns}
                onChange={(e) => setFormData({ ...formData, sustainability_concerns: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="future_plans">Projets futurs</Label>
              <Textarea
                id="future_plans"
                placeholder="Évolutions prévues, agrandissement..."
                rows={2}
                value={formData.future_plans}
                onChange={(e) => setFormData({ ...formData, future_plans: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_requirements">Exigences particulières</Label>
              <Textarea
                id="special_requirements"
                placeholder="Autres contraintes ou besoins spécifiques..."
                rows={3}
                value={formData.special_requirements}
                onChange={(e) => setFormData({ ...formData, special_requirements: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional_notes">Notes additionnelles</Label>
              <Textarea
                id="additional_notes"
                placeholder="Informations supplémentaires..."
                rows={3}
                value={formData.additional_notes}
                onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
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
      documentTitle="Questionnaire de besoins"
      documentDate={new Date(formData.assessment_date)}
      companyName={company?.name}
      companyLogo={company?.logo_url}
      companyAddress={company?.address}
      companyPhone={company?.phone}
      companyEmail={company?.email}
      clientName={selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : undefined}
      clientPhone={selectedClient?.phone}
      clientEmail={selectedClient?.email}
      projectName={selectedProject?.name}
    >
      <div className="space-y-6">
        {(formData.project_type || formData.property_type || formData.total_area) && (
          <div className="bg-[#F5F5F5] p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Le projet</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {formData.project_type && (
                <div>
                  <p className="font-semibold text-gray-700">Type de projet</p>
                  <p className="text-gray-600">{formData.project_type}</p>
                </div>
              )}
              {formData.property_type && (
                <div>
                  <p className="font-semibold text-gray-700">Type de bien</p>
                  <p className="text-gray-600">{formData.property_type}</p>
                </div>
              )}
              {formData.total_area && (
                <div>
                  <p className="font-semibold text-gray-700">Surface</p>
                  <p className="text-gray-600">{formData.total_area} m²</p>
                </div>
              )}
              {formData.number_of_rooms && (
                <div>
                  <p className="font-semibold text-gray-700">Pièces</p>
                  <p className="text-gray-600">{formData.number_of_rooms}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {formData.lifestyle_description && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Mode de vie</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.lifestyle_description}</p>
            {formData.current_occupants && (
              <p className="text-sm text-gray-600 mt-2">Occupants: {formData.current_occupants}</p>
            )}
          </div>
        )}

        {(formData.style_preferences || formData.color_preferences) && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Préférences esthétiques</h3>
            {formData.style_preferences && (
              <div className="mb-2">
                <p className="text-sm font-semibold text-gray-700">Styles</p>
                <p className="text-sm text-gray-600">{formData.style_preferences}</p>
              </div>
            )}
            {formData.color_preferences && (
              <div className="mb-2">
                <p className="text-sm font-semibold text-gray-700">Couleurs</p>
                <p className="text-sm text-gray-600">{formData.color_preferences}</p>
              </div>
            )}
            {formData.material_preferences && (
              <div>
                <p className="text-sm font-semibold text-gray-700">Matériaux</p>
                <p className="text-sm text-gray-600">{formData.material_preferences}</p>
              </div>
            )}
          </div>
        )}

        {formData.must_have_features && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Éléments indispensables</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.must_have_features}</p>
          </div>
        )}

        {formData.budget_total && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Budget et planning</h3>
            <div className="bg-[#F5F5F5] p-4 rounded-lg">
              <p className="font-semibold text-xl text-[#C5A572]">
                Budget: {formatCurrency(formData.budget_total)}
              </p>
              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-700">Flexibilité budgétaire</p>
                  <p className="text-gray-600 capitalize">{formData.budget_flexibility}</p>
                </div>
                {formData.timeline_desired && (
                  <div>
                    <p className="font-semibold text-gray-700">Délai souhaité</p>
                    <p className="text-gray-600">{formData.timeline_desired}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProfessionalDocumentPreview>
  )

  return (
    <>
      <BaseDocumentLayout
        title="Questionnaire de besoins"
        formContent={formContent}
        previewContent={previewContent}
        onSave={handleSave}
        isSaving={isSaving}
        onPreviewPDF={handlePreviewPDF}
      />

      {pdfData && (
        <DocumentPDFPreviewModal
          open={showPDFPreview}
          onOpenChange={setShowPDFPreview}
          documentData={pdfData}
        />
      )}
    </>
  )
}
