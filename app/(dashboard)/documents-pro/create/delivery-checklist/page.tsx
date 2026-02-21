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

export default function DeliveryChecklistPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [company, setCompany] = useState<any>(null)

  const [formData, setFormData] = useState({
    client_id: '',
    project_id: '',
    delivery_date: new Date().toISOString().split('T')[0],
    delivery_time: '14:00',
    attendees: '',
    general_cleaning_done: false,
    furniture_installed: false,
    decorations_placed: false,
    lighting_tested: false,
    plumbing_tested: false,
    electrical_tested: false,
    heating_cooling_tested: false,
    doors_windows_checked: false,
    finishes_quality: 'excellent',
    remaining_work: '',
    defects_identified: '',
    corrective_deadline: '',
    client_satisfaction: 'very_satisfied',
    client_feedback: '',
    handover_documents: '',
    maintenance_instructions: '',
    warranty_info: '',
    next_followup_date: '',
    notes: '',
  })

  useEffect(() => {
    if (profile?.company_id) loadData()
  }, [profile?.company_id])

  const loadData = async () => {
    if (!profile?.company_id) return
    try {
      const [clientsRes, projectsRes, companyRes] = await Promise.all([
        supabase
          .from('clients')
          .select('id, first_name, last_name, email, phone, address')
          .eq('company_id', profile.company_id)
          .order('first_name'),
        supabase
          .from('projects')
          .select('id, name, client_id')
          .eq('company_id', profile.company_id)
          .order('name'),
        supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .maybeSingle(),
      ])

      if (clientsRes.data) setClients(clientsRes.data)
      if (projectsRes.data) setProjects(projectsRes.data)
      if (companyRes.data) setCompany(companyRes.data)
    } catch (error: any) {
      console.error('Error loading data:', error)
    }
  }

  const projectsForSelect = formData.client_id
    ? projects.filter((p: { client_id?: string }) => p.client_id === formData.client_id)
    : projects

  const generateDocumentNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')
    return `LIV-${year}${month}-${random}`
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
        document_type: 'delivery_checklist',
        document_phase: 'phase7',
        document_number: documentNumber,
        title: `Check-list de livraison - ${
          projects.find((p) => p.id === formData.project_id)?.name || ''
        }`,
        client_id: formData.client_id || null,
        project_id: formData.project_id || null,
        status: 'draft',
        document_data: formData,
      })

      if (error) throw error

      toast.success('Check-list sauvegardée en brouillon')
      router.push('/documents-pro')
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la sauvegarde')
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

      const checklistItems = []
      checklistItems.push({ label: 'Nettoyage général', value: formData.general_cleaning_done ? '✓ Effectué' : '✗ Non effectué' })
      checklistItems.push({ label: 'Mobilier installé', value: formData.furniture_installed ? '✓ Effectué' : '✗ Non effectué' })
      checklistItems.push({ label: 'Décorations placées', value: formData.decorations_placed ? '✓ Effectué' : '✗ Non effectué' })
      checklistItems.push({ label: 'Éclairage testé', value: formData.lighting_tested ? '✓ Effectué' : '✗ Non effectué' })
      checklistItems.push({ label: 'Plomberie testée', value: formData.plumbing_tested ? '✓ Effectué' : '✗ Non effectué' })
      checklistItems.push({ label: 'Installation électrique testée', value: formData.electrical_tested ? '✓ Effectué' : '✗ Non effectué' })
      checklistItems.push({ label: 'Chauffage/Climatisation testé', value: formData.heating_cooling_tested ? '✓ Effectué' : '✗ Non effectué' })
      checklistItems.push({ label: 'Portes et fenêtres vérifiées', value: formData.doors_windows_checked ? '✓ Effectué' : '✗ Non effectué' })
      sections.push({ title: 'Contrôles effectués', content: checklistItems })

      if (formData.defects_identified) {
        sections.push({ title: 'Défauts identifiés', content: formData.defects_identified })
      }

      if (formData.client_feedback) {
        sections.push({ title: 'Retour client', content: formData.client_feedback })
      }

      if (formData.maintenance_instructions) {
        sections.push({ title: 'Instructions d\'entretien', content: formData.maintenance_instructions })
      }

      await generateProfessionalDocumentPDF({
        documentNumber: generateDocumentNumber(),
        documentTitle: 'Check-list de livraison',
        documentDate: new Date(formData.delivery_date),
        company: {
          name: company?.name || 'Votre Entreprise',
          address: company?.address,
          phone: company?.phone,
          email: company?.email,
        },
        client: selectedClient ? {
          name: `${selectedClient.first_name} ${selectedClient.last_name}`,
          address: selectedClient.address,
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
              <Label htmlFor="client_id">Client</Label>
              <Select
                value={formData.client_id || undefined}
                onValueChange={(v) => setFormData({ ...formData, client_id: v, project_id: '' })}
              >
                <SelectTrigger id="client_id">
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
              <Label htmlFor="project_id">Projet *</Label>
              <Select
                value={formData.project_id || undefined}
                onValueChange={(v) => setFormData({ ...formData, project_id: v })}
                disabled={!formData.client_id}
              >
                <SelectTrigger id="project_id">
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projectsForSelect.map((p: { id: string; name: string }) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_date">Date de livraison</Label>
              <Input
                id="delivery_date"
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_time">Heure</Label>
              <Input
                id="delivery_time"
                type="time"
                value={formData.delivery_time}
                onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="attendees">Personnes présentes</Label>
              <Input
                id="attendees"
                placeholder="Ex: Client, architecte d'intérieur, entrepreneur..."
                value={formData.attendees}
                onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Points de contrôle</h3>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="general_cleaning_done"
                checked={formData.general_cleaning_done}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, general_cleaning_done: checked as boolean })
                }
              />
              <label htmlFor="general_cleaning_done" className="text-sm font-medium">
                Nettoyage général effectué
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="furniture_installed"
                checked={formData.furniture_installed}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, furniture_installed: checked as boolean })
                }
              />
              <label htmlFor="furniture_installed" className="text-sm font-medium">
                Mobilier installé et positionné
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="decorations_placed"
                checked={formData.decorations_placed}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, decorations_placed: checked as boolean })
                }
              />
              <label htmlFor="decorations_placed" className="text-sm font-medium">
                Éléments décoratifs en place
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="lighting_tested"
                checked={formData.lighting_tested}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, lighting_tested: checked as boolean })
                }
              />
              <label htmlFor="lighting_tested" className="text-sm font-medium">
                Éclairage testé et fonctionnel
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="plumbing_tested"
                checked={formData.plumbing_tested}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, plumbing_tested: checked as boolean })
                }
              />
              <label htmlFor="plumbing_tested" className="text-sm font-medium">
                Plomberie testée
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="electrical_tested"
                checked={formData.electrical_tested}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, electrical_tested: checked as boolean })
                }
              />
              <label htmlFor="electrical_tested" className="text-sm font-medium">
                Installation électrique testée
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="heating_cooling_tested"
                checked={formData.heating_cooling_tested}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, heating_cooling_tested: checked as boolean })
                }
              />
              <label htmlFor="heating_cooling_tested" className="text-sm font-medium">
                Chauffage/Climatisation testé
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="doors_windows_checked"
                checked={formData.doors_windows_checked}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, doors_windows_checked: checked as boolean })
                }
              />
              <label htmlFor="doors_windows_checked" className="text-sm font-medium">
                Portes et fenêtres vérifiées
              </label>
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <Label htmlFor="finishes_quality">Qualité des finitions</Label>
            <Select value={formData.finishes_quality} onValueChange={(v) => setFormData({ ...formData, finishes_quality: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellente</SelectItem>
                <SelectItem value="good">Bonne</SelectItem>
                <SelectItem value="acceptable">Acceptable</SelectItem>
                <SelectItem value="poor">Médiocre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Observations</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="remaining_work">Travaux restants</Label>
              <Textarea
                id="remaining_work"
                placeholder="Liste des éléments à finaliser..."
                rows={3}
                value={formData.remaining_work}
                onChange={(e) => setFormData({ ...formData, remaining_work: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defects_identified">Défauts identifiés</Label>
              <Textarea
                id="defects_identified"
                placeholder="Anomalies ou défauts constatés..."
                rows={3}
                value={formData.defects_identified}
                onChange={(e) => setFormData({ ...formData, defects_identified: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="corrective_deadline">Délai de correction</Label>
              <Input
                id="corrective_deadline"
                type="date"
                value={formData.corrective_deadline}
                onChange={(e) => setFormData({ ...formData, corrective_deadline: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Retour client</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_satisfaction">Niveau de satisfaction</Label>
              <Select value={formData.client_satisfaction} onValueChange={(v) => setFormData({ ...formData, client_satisfaction: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="very_satisfied">Très satisfait</SelectItem>
                  <SelectItem value="satisfied">Satisfait</SelectItem>
                  <SelectItem value="neutral">Neutre</SelectItem>
                  <SelectItem value="dissatisfied">Insatisfait</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_feedback">Commentaires du client</Label>
              <Textarea
                id="client_feedback"
                placeholder="Retours et remarques du client..."
                rows={4}
                value={formData.client_feedback}
                onChange={(e) => setFormData({ ...formData, client_feedback: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentation remise</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="handover_documents">Documents transmis</Label>
              <Textarea
                id="handover_documents"
                placeholder="Liste des documents remis au client..."
                rows={3}
                value={formData.handover_documents}
                onChange={(e) => setFormData({ ...formData, handover_documents: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance_instructions">Instructions d'entretien</Label>
              <Textarea
                id="maintenance_instructions"
                placeholder="Conseils d'entretien et maintenance..."
                rows={4}
                value={formData.maintenance_instructions}
                onChange={(e) => setFormData({ ...formData, maintenance_instructions: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty_info">Informations garanties</Label>
              <Textarea
                id="warranty_info"
                placeholder="Détails des garanties..."
                rows={3}
                value={formData.warranty_info}
                onChange={(e) => setFormData({ ...formData, warranty_info: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_followup_date">Date du prochain suivi</Label>
              <Input
                id="next_followup_date"
                type="date"
                value={formData.next_followup_date}
                onChange={(e) => setFormData({ ...formData, next_followup_date: e.target.value })}
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
      documentTitle="Check-list de livraison"
      documentDate={new Date(formData.delivery_date)}
      companyName={company?.name}
      companyAddress={company?.address}
      companyPhone={company?.phone}
      companyEmail={company?.email}
      clientName={selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : undefined}
      clientAddress={selectedClient?.address}
      clientPhone={selectedClient?.phone}
      clientEmail={selectedClient?.email}
      projectName={selectedProject?.name}
    >
      <div className="space-y-6">
        <div className="bg-[#F5F5F5] p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Points de contrôle</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={formData.general_cleaning_done ? 'text-green-600' : 'text-red-600'}>
                {formData.general_cleaning_done ? '✓' : '✗'}
              </span>
              <span>Nettoyage général effectué</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={formData.furniture_installed ? 'text-green-600' : 'text-red-600'}>
                {formData.furniture_installed ? '✓' : '✗'}
              </span>
              <span>Mobilier installé et positionné</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={formData.decorations_placed ? 'text-green-600' : 'text-red-600'}>
                {formData.decorations_placed ? '✓' : '✗'}
              </span>
              <span>Éléments décoratifs en place</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={formData.lighting_tested ? 'text-green-600' : 'text-red-600'}>
                {formData.lighting_tested ? '✓' : '✗'}
              </span>
              <span>Éclairage testé et fonctionnel</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={formData.plumbing_tested ? 'text-green-600' : 'text-red-600'}>
                {formData.plumbing_tested ? '✓' : '✗'}
              </span>
              <span>Plomberie testée</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={formData.electrical_tested ? 'text-green-600' : 'text-red-600'}>
                {formData.electrical_tested ? '✓' : '✗'}
              </span>
              <span>Installation électrique testée</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t">
            <p className="font-semibold text-gray-700">Qualité des finitions</p>
            <p className="text-gray-600 capitalize">{formData.finishes_quality}</p>
          </div>
        </div>

        {formData.defects_identified && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Défauts identifiés</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.defects_identified}</p>
          </div>
        )}

        {formData.client_feedback && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Retour client</h3>
            <p className="text-sm font-semibold text-gray-700 mb-1 capitalize">
              Satisfaction: {formData.client_satisfaction.replace('_', ' ')}
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.client_feedback}</p>
          </div>
        )}

        {formData.maintenance_instructions && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Instructions d'entretien</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.maintenance_instructions}</p>
          </div>
        )}
      </div>
    </ProfessionalDocumentPreview>
  )

  return (
    <BaseDocumentLayout
      title="Check-list de livraison"
      formContent={formContent}
      previewContent={previewContent}
      onSave={handleSave}
      isSaving={isSaving}
      onDownloadPDF={handleDownloadPDF}
    />
  )
}
