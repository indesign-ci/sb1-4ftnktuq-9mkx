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

export default function AttestationFinTravauxPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [projects, setProjects] = useState<{ id: string; name: string; address?: string; city?: string; postal_code?: string; client_id?: string }[]>([])
  const [clients, setClients] = useState<{ id: string; first_name: string; last_name: string }[]>([])
  const [company, setCompany] = useState<{ name?: string } | null>(null)

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    project_id: '',
    description_travaux: '',
    date_reception: '',
    reference_pv: '',
    reception_sans_reserve: false,
    reception_avec_reserves: false,
    date_levee_reserves: '',
    signature_client_date: '',
    signature_client: '',
    signature_mo_date: '',
    signature_mo: '',
  })

  useEffect(() => {
    if (!profile?.company_id) return
    const load = async () => {
      try {
        const [projRes, clientsRes, companyRes] = await Promise.all([
          supabase.from('projects').select('id, name, address, city, postal_code, client_id').eq('company_id', profile.company_id),
          supabase.from('clients').select('id, first_name, last_name').eq('company_id', profile.company_id),
          supabase.from('companies').select('name').eq('id', profile.company_id).maybeSingle(),
        ])
        if (projRes.data) setProjects(projRes.data)
        if (clientsRes.data) setClients(clientsRes.data)
        if (companyRes.data) setCompany(companyRes.data)
      } catch (e) {
        console.error(e)
        toast.error('Erreur chargement des données')
      }
    }
    load()
  }, [profile?.company_id])

  const generateDocumentNumber = () => {
    const year = new Date().getFullYear()
    const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
    return `AFT-${year}-${seq}`
  }

  const selectedProject = projects.find((p) => p.id === formData.project_id)
  const selectedClient = selectedProject?.client_id ? clients.find((c) => c.id === selectedProject.client_id) : null
  const clientName = selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : ''
  const adresseBien = selectedProject ? [selectedProject.address, selectedProject.postal_code, selectedProject.city].filter(Boolean).join(', ') || selectedProject.name : ''
  const nomEntrepriseArchitecte = company?.name ?? ''

  const handleSave = async () => {
    if (!formData.project_id) {
      toast.error('Veuillez sélectionner un projet')
      return
    }
    setIsSaving(true)
    try {
      const { error } = await supabase.from('professional_documents').insert({
        company_id: profile?.company_id,
        created_by: profile?.id,
        document_type: 'attestation_fin_travaux',
        document_phase: 'phase7',
        document_number: generateDocumentNumber(),
        title: `Attestation de fin de travaux - ${selectedProject?.name ?? ''}`,
        project_id: formData.project_id,
        client_id: selectedProject?.client_id ?? null,
        status: 'draft',
        document_data: formData,
      })
      if (error) throw error
      toast.success('Attestation sauvegardée en brouillon')
      router.push('/documents-pro')
    } catch (e) {
      console.error(e)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!selectedProject) {
      toast.error('Veuillez sélectionner un projet')
      return
    }
    try {
      const texteAttestation = `Je soussigné(e), ${clientName}, propriétaire du bien situé au ${adresseBien}, atteste que les travaux de ${formData.description_travaux || '[description]'} réalisés par ${nomEntrepriseArchitecte} sont terminés à la date du ${formData.date}.`
      const receptionText = formData.reception_sans_reserve
        ? 'Les travaux ont été réceptionnés sans réserve.'
        : formData.reception_avec_reserves
          ? `Les travaux ont été réceptionnés avec réserves, levées le ${formData.date_levee_reserves || '—'}. (Réf. PV: ${formData.reference_pv || '—'})`
          : `Les travaux ont été réceptionnés le ${formData.date_reception || '—'} (référence PV: ${formData.reference_pv || '—'}).`
      const sections = [
        { title: 'Attestation', content: texteAttestation },
        { title: 'Réception', content: `Réception le ${formData.date_reception || '—'}. Référence PV: ${formData.reference_pv || '—'}\n${formData.reception_sans_reserve ? '□ Sans réserve' : ''} ${formData.reception_avec_reserves ? '□ Avec réserves, levées le ' + (formData.date_levee_reserves || '—') : ''}` },
        { title: 'Signatures', content: `Client: ${formData.signature_client_date} - ${formData.signature_client}\nArchitecte: ${formData.signature_mo_date} - ${formData.signature_mo}` },
      ]
      await generateProfessionalDocumentPDF({
        documentNumber: generateDocumentNumber(),
        documentTitle: 'Attestation de fin de travaux',
        documentDate: new Date(formData.date),
        company: { name: company?.name },
        client: { name: clientName },
        projectName: selectedProject.name,
        sections,
      })
      toast.success('PDF généré')
    } catch (e) {
      console.error(e)
      toast.error('Erreur génération PDF')
    }
  }

  const formContent = (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">En-tête</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Numéro</Label>
              <Input value={generateDocumentNumber()} readOnly className="bg-gray-100" />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Projet *</Label>
              <Select value={formData.project_id} onValueChange={(v) => setFormData({ ...formData, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un projet" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clientName && <p className="text-sm text-gray-500">Client : {clientName}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Attestation</h3>
          <p className="text-sm text-gray-600">
            Je soussigné(e), <strong>{clientName || '[nom client]'}</strong>, propriétaire du bien situé au <strong>{adresseBien || '[adresse]'}</strong>, atteste que les travaux décrits ci-dessous, réalisés par <strong>{nomEntrepriseArchitecte || '[nom entreprise architecte]'}</strong>, sont terminés à la date du <strong>{formData.date}</strong>.
          </p>
          <div className="space-y-2">
            <Label>Description des travaux</Label>
            <Textarea rows={3} placeholder="Description des travaux réalisés" value={formData.description_travaux} onChange={(e) => setFormData({ ...formData, description_travaux: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Réception</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de réception des travaux</Label>
              <Input type="date" value={formData.date_reception} onChange={(e) => setFormData({ ...formData, date_reception: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Référence du PV de réception</Label>
              <Input placeholder="Ex: PVR-2025-001" value={formData.reference_pv} onChange={(e) => setFormData({ ...formData, reference_pv: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.reception_sans_reserve} onChange={(e) => setFormData({ ...formData, reception_sans_reserve: e.target.checked })} className="rounded border-gray-300" />
              <span>Sans réserve</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.reception_avec_reserves} onChange={(e) => setFormData({ ...formData, reception_avec_reserves: e.target.checked })} className="rounded border-gray-300" />
              <span>Avec réserves, levées le</span>
              {formData.reception_avec_reserves && (
                <Input type="date" className="w-40" value={formData.date_levee_reserves} onChange={(e) => setFormData({ ...formData, date_levee_reserves: e.target.value })} />
              )}
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Signatures</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Client — Date</Label><Input type="date" value={formData.signature_client_date} onChange={(e) => setFormData({ ...formData, signature_client_date: e.target.value })} /></div>
            <div className="space-y-2"><Label>Client — Signature</Label><Input value={formData.signature_client} onChange={(e) => setFormData({ ...formData, signature_client: e.target.value })} placeholder="Signature" /></div>
            <div className="space-y-2"><Label>Architecte — Date</Label><Input type="date" value={formData.signature_mo_date} onChange={(e) => setFormData({ ...formData, signature_mo_date: e.target.value })} /></div>
            <div className="space-y-2"><Label>Architecte — Signature</Label><Input value={formData.signature_mo} onChange={(e) => setFormData({ ...formData, signature_mo: e.target.value })} placeholder="Signature" /></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const previewContent = (
    <ProfessionalDocumentPreview documentNumber={generateDocumentNumber()} documentTitle="Attestation de fin de travaux" documentDate={new Date(formData.date)} companyName={company?.name} clientName={clientName} projectName={selectedProject?.name}>
      <div className="mt-6 text-sm space-y-2">
        <p>Réception le {formData.date_reception || '—'} — Réf. PV : {formData.reference_pv || '—'}</p>
        <p>{formData.reception_sans_reserve ? 'Sans réserve' : formData.reception_avec_reserves ? `Avec réserves levées le ${formData.date_levee_reserves || '—'}` : ''}</p>
      </div>
    </ProfessionalDocumentPreview>
  )

  return (
    <BaseDocumentLayout title="Attestation de fin de travaux" formContent={formContent} previewContent={previewContent} onSave={handleSave} onPreviewPDF={handleDownloadPDF} isSaving={isSaving} />
  )
}
