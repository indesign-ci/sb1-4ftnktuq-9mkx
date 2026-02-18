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
import { toast } from 'sonner'
import { generateProfessionalDocumentPDF } from '@/lib/pdf/professional-document-pdf'

export default function SiteReportPage() {
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
    visit_time: '10:00',
    attendees: '',
    weather: 'sunny',
    work_progress: '',
    completed_tasks: '',
    ongoing_tasks: '',
    planned_tasks: '',
    issues_identified: '',
    corrective_actions: '',
    material_status: '',
    quality_observations: '',
    safety_observations: '',
    next_visit_date: '',
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
    return `RC-${year}${month}-${random}`
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
        document_type: 'site_report',
        document_phase: 'phase6',
        document_number: documentNumber,
        title: `Rapport de chantier - ${
          projects.find((p) => p.id === formData.project_id)?.name || ''
        }`,
        client_id: formData.client_id || null,
        project_id: formData.project_id || null,
        status: 'draft',
        document_data: formData,
      })

      if (error) throw error

      toast.success('Rapport sauvegardé en brouillon')
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
    if (!selectedProject) {
      toast.error('Veuillez sélectionner un projet avant de générer le PDF')
      return
    }

    try {
      const sections = []

      const visitDetails = []
      visitDetails.push({ label: 'Date de visite', value: `${formData.visit_date} à ${formData.visit_time}` })
      if (formData.attendees) visitDetails.push({ label: 'Personnes présentes', value: formData.attendees })
      visitDetails.push({ label: 'Conditions météo', value: formData.weather })
      sections.push({ title: 'Informations de visite', content: visitDetails })

      if (formData.work_progress) {
        sections.push({ title: 'Avancement des travaux', content: formData.work_progress })
      }

      if (formData.completed_tasks) {
        sections.push({ title: 'Tâches terminées', content: formData.completed_tasks })
      }

      if (formData.ongoing_tasks) {
        sections.push({ title: 'Tâches en cours', content: formData.ongoing_tasks })
      }

      if (formData.issues_identified) {
        sections.push({ title: 'Problèmes identifiés', content: formData.issues_identified })
      }

      if (formData.corrective_actions) {
        sections.push({ title: 'Actions correctives', content: formData.corrective_actions })
      }

      await generateProfessionalDocumentPDF({
        documentNumber: generateDocumentNumber(),
        documentTitle: 'Compte-rendu de chantier',
        documentDate: new Date(formData.visit_date),
        company: {
          name: company?.name || 'Votre Entreprise',
          address: company?.address,
          phone: company?.phone,
          email: company?.email,
        },
        client: selectedClient ? {
          name: `${selectedClient.first_name} ${selectedClient.last_name}`,
          phone: selectedClient.phone,
          email: selectedClient.email,
        } : undefined,
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
              <Label htmlFor="project_id">Projet *</Label>
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
              <Label htmlFor="client_id">Client (optionnel)</Label>
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
                placeholder="Ex: Chef de chantier, architecte..."
                value={formData.attendees}
                onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weather">Conditions météo</Label>
              <Select value={formData.weather} onValueChange={(v) => setFormData({ ...formData, weather: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sunny">Ensoleillé</SelectItem>
                  <SelectItem value="cloudy">Nuageux</SelectItem>
                  <SelectItem value="rainy">Pluvieux</SelectItem>
                  <SelectItem value="stormy">Orageux</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Avancement des travaux</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="work_progress">État d'avancement général</Label>
              <Textarea
                id="work_progress"
                placeholder="Pourcentage et description de l'avancement..."
                rows={3}
                value={formData.work_progress}
                onChange={(e) => setFormData({ ...formData, work_progress: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="completed_tasks">Tâches terminées</Label>
              <Textarea
                id="completed_tasks"
                placeholder="Liste des tâches complétées..."
                rows={4}
                value={formData.completed_tasks}
                onChange={(e) => setFormData({ ...formData, completed_tasks: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ongoing_tasks">Tâches en cours</Label>
              <Textarea
                id="ongoing_tasks"
                placeholder="Travaux actuellement en exécution..."
                rows={4}
                value={formData.ongoing_tasks}
                onChange={(e) => setFormData({ ...formData, ongoing_tasks: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="planned_tasks">Tâches planifiées</Label>
              <Textarea
                id="planned_tasks"
                placeholder="Prochaines étapes à venir..."
                rows={4}
                value={formData.planned_tasks}
                onChange={(e) => setFormData({ ...formData, planned_tasks: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Observations et incidents</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="issues_identified">Problèmes identifiés</Label>
              <Textarea
                id="issues_identified"
                placeholder="Anomalies, retards, non-conformités..."
                rows={4}
                value={formData.issues_identified}
                onChange={(e) => setFormData({ ...formData, issues_identified: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="corrective_actions">Actions correctives</Label>
              <Textarea
                id="corrective_actions"
                placeholder="Mesures à prendre pour résoudre les problèmes..."
                rows={4}
                value={formData.corrective_actions}
                onChange={(e) => setFormData({ ...formData, corrective_actions: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality_observations">Observations qualité</Label>
              <Textarea
                id="quality_observations"
                placeholder="Contrôles qualité effectués..."
                rows={3}
                value={formData.quality_observations}
                onChange={(e) => setFormData({ ...formData, quality_observations: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="safety_observations">Observations sécurité</Label>
              <Textarea
                id="safety_observations"
                placeholder="Respect des normes de sécurité..."
                rows={3}
                value={formData.safety_observations}
                onChange={(e) => setFormData({ ...formData, safety_observations: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="material_status">État des matériaux</Label>
              <Textarea
                id="material_status"
                placeholder="Réception, stockage, disponibilité..."
                rows={3}
                value={formData.material_status}
                onChange={(e) => setFormData({ ...formData, material_status: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Suivi</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="next_visit_date">Date de la prochaine visite</Label>
              <Input
                id="next_visit_date"
                type="date"
                value={formData.next_visit_date}
                onChange={(e) => setFormData({ ...formData, next_visit_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes complémentaires</Label>
              <Textarea
                id="notes"
                placeholder="Autres remarques..."
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
      documentTitle="Compte-rendu de chantier"
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
            <div>
              <p className="font-semibold text-gray-700">Conditions météo</p>
              <p className="text-gray-600 capitalize">{formData.weather}</p>
            </div>
            {formData.attendees && (
              <div className="col-span-2">
                <p className="font-semibold text-gray-700">Personnes présentes</p>
                <p className="text-gray-600">{formData.attendees}</p>
              </div>
            )}
          </div>
        </div>

        {formData.work_progress && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Avancement des travaux</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.work_progress}</p>
          </div>
        )}

        {formData.completed_tasks && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Tâches terminées</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.completed_tasks}</p>
          </div>
        )}

        {formData.ongoing_tasks && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Tâches en cours</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.ongoing_tasks}</p>
          </div>
        )}

        {formData.planned_tasks && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Tâches planifiées</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.planned_tasks}</p>
          </div>
        )}

        {formData.issues_identified && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Problèmes identifiés</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.issues_identified}</p>
          </div>
        )}

        {formData.corrective_actions && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Actions correctives</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.corrective_actions}</p>
          </div>
        )}
      </div>
    </ProfessionalDocumentPreview>
  )

  return (
    <BaseDocumentLayout
      title="Compte-rendu de chantier"
      formContent={formContent}
      previewContent={previewContent}
      onSave={handleSave}
      isSaving={isSaving}
      onPreviewPDF={handleDownloadPDF}
    />
  )
}
