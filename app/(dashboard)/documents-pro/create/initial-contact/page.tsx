'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/currency'
import { generateProfessionalDocumentPDF } from '@/lib/pdf/professional-document-pdf'

export default function InitialContactPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const { profile } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [company, setCompany] = useState<any>(null)

  const [formData, setFormData] = useState({
    client_id: '',
    project_id: '',
    contact_date: new Date().toISOString().split('T')[0],
    contact_method: 'phone',
    contact_person: '',
    project_type: '',
    property_type: '',
    property_address: '',
    property_size: '',
    estimated_budget: '',
    desired_timeline: '',
    main_needs: '',
    style_preferences: '',
    special_requirements: '',
    next_steps: '',
    follow_up_date: '',
    notes: '',
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

      if (editId) {
        const { data: document, error } = await supabase
          .from('professional_documents')
          .select('*')
          .eq('id', editId)
          .maybeSingle()

        if (document && document.document_data) {
          setFormData(document.document_data)
          setIsEditing(true)
          toast.success('Document chargé pour modification')
        } else if (error) {
          toast.error('Erreur lors du chargement du document')
          console.error(error)
        }
      }
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
    return `FC-${year}${month}-${random}`
  }

  const handleSave = async () => {
    if (!formData.client_id) {
      toast.error('Veuillez sélectionner un client')
      return
    }

    setIsSaving(true)
    try {
      if (isEditing && editId) {
        const { error } = await supabase
          .from('professional_documents')
          .update({
            client_id: formData.client_id || null,
            project_id: formData.project_id || null,
            title: `Fiche de premier contact - ${
              clients.find((c) => c.id === formData.client_id)?.first_name || ''
            }`,
            document_data: formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editId)

        if (error) throw error

        toast.success('Document mis à jour')
      } else {
        const documentNumber = generateDocumentNumber()

        const { error } = await supabase.from('professional_documents').insert({
          company_id: profile?.company_id,
          created_by: profile?.id,
          document_type: 'initial_contact',
          document_phase: 'phase1',
          document_number: documentNumber,
          title: `Fiche de premier contact - ${
            clients.find((c) => c.id === formData.client_id)?.first_name || ''
          }`,
          client_id: formData.client_id || null,
          project_id: formData.project_id || null,
          status: 'draft',
          document_data: formData,
        })

        if (error) throw error

        toast.success('Document sauvegardé')
      }

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

      if (formData.property_type || formData.property_size || formData.estimated_budget) {
        const details = []
        if (formData.property_type) details.push({ label: 'Type de bien', value: formData.property_type })
        if (formData.property_size) details.push({ label: 'Surface', value: `${formData.property_size} m²` })
        if (formData.property_address) details.push({ label: 'Adresse', value: formData.property_address })
        if (formData.estimated_budget) details.push({ label: 'Budget estimé', value: formatCurrency(formData.estimated_budget) })
        if (formData.desired_timeline) details.push({ label: 'Délai souhaité', value: formData.desired_timeline })
        sections.push({ title: 'Détails du projet', content: details })
      }

      if (formData.main_needs) {
        sections.push({ title: 'Besoins principaux', content: formData.main_needs })
      }

      if (formData.style_preferences) {
        sections.push({ title: 'Préférences de style', content: formData.style_preferences })
      }

      if (formData.special_requirements) {
        sections.push({ title: 'Contraintes particulières', content: formData.special_requirements })
      }

      if (formData.next_steps) {
        sections.push({ title: 'Prochaines étapes', content: formData.next_steps })
      }

      await generateProfessionalDocumentPDF({
        documentNumber: generateDocumentNumber(),
        documentTitle: 'Fiche de premier contact',
        documentDate: new Date(formData.contact_date),
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
              <Label htmlFor="contact_date">Date du contact</Label>
              <Input
                id="contact_date"
                type="date"
                value={formData.contact_date}
                onChange={(e) => setFormData({ ...formData, contact_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_method">Moyen de contact</Label>
              <Select value={formData.contact_method} onValueChange={(v) => setFormData({ ...formData, contact_method: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Téléphone</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Rendez-vous</SelectItem>
                  <SelectItem value="website">Site web</SelectItem>
                  <SelectItem value="referral">Recommandation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails du projet</h3>

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="property_size">Surface (m²)</Label>
              <Input
                id="property_size"
                type="number"
                placeholder="Ex: 85"
                value={formData.property_size}
                onChange={(e) => setFormData({ ...formData, property_size: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="property_address">Adresse du bien</Label>
              <Input
                id="property_address"
                placeholder="Adresse complète"
                value={formData.property_address}
                onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_budget">Budget estimé (FCFA)</Label>
              <Input
                id="estimated_budget"
                type="number"
                placeholder="Ex: 30000000"
                value={formData.estimated_budget}
                onChange={(e) => setFormData({ ...formData, estimated_budget: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desired_timeline">Délai souhaité</Label>
              <Input
                id="desired_timeline"
                placeholder="Ex: 3 mois"
                value={formData.desired_timeline}
                onChange={(e) => setFormData({ ...formData, desired_timeline: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="main_needs">Besoins principaux</Label>
            <Textarea
              id="main_needs"
              placeholder="Décrivez les besoins principaux du client..."
              rows={4}
              value={formData.main_needs}
              onChange={(e) => setFormData({ ...formData, main_needs: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="style_preferences">Préférences de style</Label>
            <Textarea
              id="style_preferences"
              placeholder="Styles préférés, inspirations, couleurs..."
              rows={3}
              value={formData.style_preferences}
              onChange={(e) => setFormData({ ...formData, style_preferences: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="special_requirements">Contraintes particulières</Label>
            <Textarea
              id="special_requirements"
              placeholder="Contraintes techniques, règlementaires, budgétaires..."
              rows={3}
              value={formData.special_requirements}
              onChange={(e) => setFormData({ ...formData, special_requirements: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Suivi</h3>

          <div className="space-y-2">
            <Label htmlFor="next_steps">Prochaines étapes</Label>
            <Textarea
              id="next_steps"
              placeholder="Actions à réaliser..."
              rows={3}
              value={formData.next_steps}
              onChange={(e) => setFormData({ ...formData, next_steps: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="follow_up_date">Date de relance</Label>
            <Input
              id="follow_up_date"
              type="date"
              value={formData.follow_up_date}
              onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes internes</Label>
            <Textarea
              id="notes"
              placeholder="Notes et remarques..."
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const previewContent = (
    <ProfessionalDocumentPreview
      documentNumber={generateDocumentNumber()}
      documentTitle="Fiche de premier contact"
      documentDate={new Date(formData.contact_date)}
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
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Date du contact
            </p>
            <p className="text-sm">{formData.contact_date}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Moyen de contact
            </p>
            <p className="text-sm capitalize">{formData.contact_method}</p>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-[#C5A572] mb-4">Détails du projet</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {formData.property_type && (
              <div>
                <p className="font-semibold text-gray-700">Type de bien</p>
                <p className="text-gray-600">{formData.property_type}</p>
              </div>
            )}
            {formData.property_size && (
              <div>
                <p className="font-semibold text-gray-700">Surface</p>
                <p className="text-gray-600">{formData.property_size} m²</p>
              </div>
            )}
            {formData.property_address && (
              <div className="col-span-2">
                <p className="font-semibold text-gray-700">Adresse</p>
                <p className="text-gray-600">{formData.property_address}</p>
              </div>
            )}
            {formData.estimated_budget && (
              <div>
                <p className="font-semibold text-gray-700">Budget estimé</p>
                <p className="text-gray-600">{formatCurrency(formData.estimated_budget)}</p>
              </div>
            )}
            {formData.desired_timeline && (
              <div>
                <p className="font-semibold text-gray-700">Délai souhaité</p>
                <p className="text-gray-600">{formData.desired_timeline}</p>
              </div>
            )}
          </div>
        </div>

        {formData.main_needs && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Besoins principaux</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.main_needs}</p>
          </div>
        )}

        {formData.style_preferences && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Préférences de style</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.style_preferences}</p>
          </div>
        )}

        {formData.special_requirements && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Contraintes particulières</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.special_requirements}</p>
          </div>
        )}

        {formData.next_steps && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Prochaines étapes</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.next_steps}</p>
          </div>
        )}
      </div>
    </ProfessionalDocumentPreview>
  )

  return (
    <BaseDocumentLayout
      title={isEditing ? "Modifier - Fiche de premier contact" : "Fiche de premier contact"}
      formContent={formContent}
      previewContent={previewContent}
      onSave={handleSave}
      isSaving={isSaving}
      onDownloadPDF={handleDownloadPDF}
    />
  )
}
