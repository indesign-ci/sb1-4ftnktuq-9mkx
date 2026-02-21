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
import { formatCurrency } from '@/lib/currency'
import { generateProfessionalDocumentPDF } from '@/lib/pdf/professional-document-pdf'

export default function DesignContractPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [company, setCompany] = useState<any>(null)

  const [formData, setFormData] = useState({
    client_id: '',
    project_id: '',
    contract_date: new Date().toISOString().split('T')[0],
    project_description: '',
    project_address: '',
    project_area: '',
    services_included: '',
    design_phases: '',
    total_fees: '',
    payment_schedule: '',
    start_date: '',
    estimated_duration: '',
    deliverables: '',
    client_obligations: '',
    termination_clause: '',
    special_conditions: '',
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
    return `CONT-${year}${month}-${random}`
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
        document_type: 'design_contract',
        document_phase: 'phase3',
        document_number: documentNumber,
        title: `Contrat de maîtrise d'œuvre - ${
          clients.find((c) => c.id === formData.client_id)?.first_name || ''
        }`,
        client_id: formData.client_id || null,
        project_id: formData.project_id || null,
        status: 'draft',
        document_data: formData,
      })

      if (error) throw error

      toast.success('Contrat sauvegardé en brouillon')
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
    if (!selectedClient) {
      toast.error('Veuillez sélectionner un client avant de générer le PDF')
      return
    }

    try {
      const sections = []

      if (formData.project_description) {
        sections.push({ title: 'Description du projet', content: formData.project_description })
      }

      if (formData.services_included) {
        sections.push({ title: 'Prestations incluses', content: formData.services_included })
      }

      if (formData.design_phases) {
        sections.push({ title: 'Phases de conception', content: formData.design_phases })
      }

      const financialDetails = []
      if (formData.total_fees) financialDetails.push({ label: 'Honoraires totaux', value: formatCurrency(formData.total_fees) })
      if (formData.payment_schedule) financialDetails.push({ label: 'Échéancier', value: formData.payment_schedule })
      if (financialDetails.length > 0) {
        sections.push({ title: 'Conditions financières', content: financialDetails })
      }

      if (formData.deliverables) {
        sections.push({ title: 'Livrables', content: formData.deliverables })
      }

      if (formData.client_obligations) {
        sections.push({ title: 'Obligations du client', content: formData.client_obligations })
      }

      if (formData.termination_clause) {
        sections.push({ title: 'Clause de résiliation', content: formData.termination_clause })
      }

      await generateProfessionalDocumentPDF({
        documentNumber: generateDocumentNumber(),
        documentTitle: 'Contrat de maîtrise d\'œuvre',
        documentDate: new Date(formData.contract_date),
        company: {
          name: company?.name || 'Votre Entreprise',
          address: company?.address,
          phone: company?.phone,
          email: company?.email,
        },
        client: {
          name: `${selectedClient.first_name} ${selectedClient.last_name}`,
          address: selectedClient.address,
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
              <Label htmlFor="project_id">Projet (optionnel)</Label>
              <Select
                value={formData.project_id || undefined}
                onValueChange={(v) => setFormData({ ...formData, project_id: v })}
                disabled={!formData.client_id}
              >
                <SelectTrigger id="project_id">
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun projet</SelectItem>
                  {projectsForSelect.map((p: { id: string; name: string }) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_date">Date du contrat</Label>
              <Input
                id="contract_date"
                type="date"
                value={formData.contract_date}
                onChange={(e) => setFormData({ ...formData, contract_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Date de début</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails du projet</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project_description">Description du projet</Label>
              <Textarea
                id="project_description"
                placeholder="Description détaillée..."
                rows={4}
                value={formData.project_description}
                onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_address">Adresse du projet</Label>
                <Input
                  id="project_address"
                  placeholder="Adresse complète"
                  value={formData.project_address}
                  onChange={(e) => setFormData({ ...formData, project_address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project_area">Surface (m²)</Label>
                <Input
                  id="project_area"
                  type="number"
                  placeholder="Ex: 85"
                  value={formData.project_area}
                  onChange={(e) => setFormData({ ...formData, project_area: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_duration">Durée estimée</Label>
              <Input
                id="estimated_duration"
                placeholder="Ex: 6 mois"
                value={formData.estimated_duration}
                onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Prestations</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="services_included">Prestations incluses</Label>
              <Textarea
                id="services_included"
                placeholder="Liste des prestations..."
                rows={5}
                value={formData.services_included}
                onChange={(e) => setFormData({ ...formData, services_included: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="design_phases">Phases de conception</Label>
              <Textarea
                id="design_phases"
                placeholder="Détail des phases..."
                rows={4}
                value={formData.design_phases}
                onChange={(e) => setFormData({ ...formData, design_phases: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliverables">Livrables</Label>
              <Textarea
                id="deliverables"
                placeholder="Documents et livrables..."
                rows={4}
                value={formData.deliverables}
                onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conditions financières</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="total_fees">Honoraires totaux (FCFA)</Label>
              <Input
                id="total_fees"
                type="number"
                placeholder="Ex: 5000000"
                value={formData.total_fees}
                onChange={(e) => setFormData({ ...formData, total_fees: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="payment_schedule">Échéancier de paiement</Label>
              <Textarea
                id="payment_schedule"
                placeholder="Détail des paiements..."
                rows={4}
                value={formData.payment_schedule}
                onChange={(e) => setFormData({ ...formData, payment_schedule: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Clauses contractuelles</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_obligations">Obligations du client</Label>
              <Textarea
                id="client_obligations"
                placeholder="Obligations et engagements du client..."
                rows={4}
                value={formData.client_obligations}
                onChange={(e) => setFormData({ ...formData, client_obligations: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="termination_clause">Clause de résiliation</Label>
              <Textarea
                id="termination_clause"
                placeholder="Conditions de résiliation..."
                rows={3}
                value={formData.termination_clause}
                onChange={(e) => setFormData({ ...formData, termination_clause: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_conditions">Conditions particulières</Label>
              <Textarea
                id="special_conditions"
                placeholder="Autres conditions..."
                rows={3}
                value={formData.special_conditions}
                onChange={(e) => setFormData({ ...formData, special_conditions: e.target.value })}
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
      documentTitle="Contrat de maîtrise d'œuvre"
      documentDate={new Date(formData.contract_date)}
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
        {formData.project_description && (
          <div>
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Description du projet</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.project_description}</p>
            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
              {formData.project_address && (
                <div>
                  <p className="font-semibold text-gray-700">Adresse</p>
                  <p className="text-gray-600">{formData.project_address}</p>
                </div>
              )}
              {formData.project_area && (
                <div>
                  <p className="font-semibold text-gray-700">Surface</p>
                  <p className="text-gray-600">{formData.project_area} m²</p>
                </div>
              )}
            </div>
          </div>
        )}

        {formData.services_included && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Prestations incluses</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.services_included}</p>
          </div>
        )}

        {formData.design_phases && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Phases de conception</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.design_phases}</p>
          </div>
        )}

        {formData.total_fees && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Conditions financières</h3>
            <div className="bg-[#F5F5F5] p-4 rounded-lg">
              <p className="font-semibold text-xl text-[#C5A572]">
                Honoraires totaux : {formatCurrency(formData.total_fees)}
              </p>
              {formData.payment_schedule && (
                <div className="mt-3">
                  <p className="font-semibold text-sm text-gray-700 mb-1">Échéancier de paiement</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{formData.payment_schedule}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {formData.deliverables && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Livrables</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.deliverables}</p>
          </div>
        )}

        {formData.client_obligations && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Obligations du client</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.client_obligations}</p>
          </div>
        )}

        {formData.termination_clause && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Clause de résiliation</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.termination_clause}</p>
          </div>
        )}
      </div>
    </ProfessionalDocumentPreview>
  )

  return (
    <BaseDocumentLayout
      title="Contrat de maîtrise d'œuvre"
      formContent={formContent}
      previewContent={previewContent}
      onSave={handleSave}
      isSaving={isSaving}
      onDownloadPDF={handleDownloadPDF}
    />
  )
}
