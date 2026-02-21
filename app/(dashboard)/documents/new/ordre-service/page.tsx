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

export default function OrdreServicePage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [projects, setProjects] = useState<{ id: string; name: string; client_id?: string }[]>([])
  const [clients, setClients] = useState<{ id: string; first_name: string; last_name: string }[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [company, setCompany] = useState<{ name?: string; address?: string; phone?: string; email?: string } | null>(null)

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    project_id: '',
    supplier_id: '',
    reference_devis: '',
    date_demarrage: '',
    duree_travaux: '',
    date_fin_prev: '',
    montant_ht: '',
    montant_ttc: '',
    conditions_particulieres: '',
    penalites_retard: '',
    contact_site_nom: '',
    contact_site_telephone: '',
    horaires_chantier: '',
    acces_chantier: '',
    remarques: '',
    signature_mo: '',
    signature_entreprise: 'Reçu et accepté',
  })

  useEffect(() => {
    if (!profile?.company_id) return
    const load = async () => {
      try {
        const [projRes, clientsRes, supRes, companyRes] = await Promise.all([
          supabase.from('projects').select('id, name, client_id').eq('company_id', profile.company_id),
          supabase.from('clients').select('id, first_name, last_name').eq('company_id', profile.company_id),
          supabase.from('suppliers').select('id, name').eq('company_id', profile.company_id).order('name'),
          supabase.from('companies').select('name, address, phone, email').eq('id', profile.company_id).maybeSingle(),
        ])
        if (projRes.data) setProjects(projRes.data)
        if (clientsRes.data) setClients(clientsRes.data)
        if (supRes.data) setSuppliers(supRes.data)
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
    return `OS-${year}-${seq}`
  }

  const selectedProject = projects.find((p) => p.id === formData.project_id)
  const selectedClient = selectedProject?.client_id
    ? clients.find((c) => c.id === selectedProject.client_id)
    : null
  const selectedSupplier = suppliers.find((s) => s.id === formData.supplier_id)

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
        document_type: 'ordre_service',
        document_phase: 'phase5',
        document_number: documentNumber,
        title: `Ordre de service - ${selectedProject?.name ?? ''} - ${selectedSupplier?.name ?? 'Entreprise'}`,
        client_id: selectedProject?.client_id ?? null,
        project_id: formData.project_id,
        status: 'draft',
        document_data: formData,
      })
      if (error) throw error
      toast.success('Ordre de service sauvegardé en brouillon')
      router.push('/documents-pro')
    } catch (e) {
      console.error(e)
      toast.error(e?.message || 'Erreur lors de la sauvegarde')
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
      const clientName = selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : '—'
      const sections = [
        {
          title: 'Objet et destinataire',
          content: `Projet : ${selectedProject.name}\nClient : ${clientName}\nEntreprise destinataire : ${selectedSupplier?.name ?? '—'}\nRéférence du devis accepté : ${formData.reference_devis || '—'}`,
        },
        {
          title: 'Planning',
          content: `Date de démarrage des travaux : ${formData.date_demarrage || '—'}\nDurée des travaux prévue : ${formData.duree_travaux || '—'}\nDate de fin prévisionnelle : ${formData.date_fin_prev || '—'}`,
        },
        {
          title: 'Montant du marché',
          content: `Montant HT : ${formData.montant_ht || '—'}\nMontant TTC : ${formData.montant_ttc || '—'}`,
        },
        {
          title: 'Conditions particulières',
          content: formData.conditions_particulieres || '—',
        },
        {
          title: 'Pénalités et chantier',
          content: `Pénalités de retard : ${formData.penalites_retard || '—'}\nContact sur site : ${formData.contact_site_nom || '—'} — ${formData.contact_site_telephone || '—'}\nHoraires de chantier autorisés : ${formData.horaires_chantier || '—'}\nAccès chantier (clés, codes, gardien) : ${formData.acces_chantier || '—'}`,
        },
        { title: 'Remarques', content: formData.remarques || '—' },
        {
          title: 'Signatures',
          content: `Maître d'œuvre : ${formData.signature_mo || 'Signature + tampon'}\nEntreprise : ${formData.signature_entreprise || 'Reçu et accepté'}`,
        },
      ]
      await generateProfessionalDocumentPDF({
        documentNumber: generateDocumentNumber(),
        documentTitle: 'Ordre de service / Démarrage chantier',
        documentDate: new Date(formData.date),
        company: { name: company?.name ?? '', address: company?.address, phone: company?.phone, email: company?.email },
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
          <div className="grid grid-cols-2 gap-4">
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
              {selectedProject?.client_id && (
                <p className="text-sm text-gray-500">
                  Client : {selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : '—'}
                </p>
              )}
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Entreprise destinataire</Label>
              <Select value={formData.supplier_id} onValueChange={(v) => setFormData({ ...formData, supplier_id: v })}>
                <SelectTrigger><SelectValue placeholder="Choisir un fournisseur" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Référence du devis accepté</Label>
              <Input
                placeholder="Ex: Devis n°123 du 01/01/2025"
                value={formData.reference_devis}
                onChange={(e) => setFormData({ ...formData, reference_devis: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Planning</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de démarrage des travaux</Label>
              <Input
                type="date"
                value={formData.date_demarrage}
                onChange={(e) => setFormData({ ...formData, date_demarrage: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Durée des travaux prévue</Label>
              <Input
                placeholder="Ex: 6 semaines"
                value={formData.duree_travaux}
                onChange={(e) => setFormData({ ...formData, duree_travaux: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Date de fin prévisionnelle</Label>
              <Input
                type="date"
                value={formData.date_fin_prev}
                onChange={(e) => setFormData({ ...formData, date_fin_prev: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Montant du marché</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Montant HT (€)</Label>
              <Input
                placeholder="Montant HT"
                value={formData.montant_ht}
                onChange={(e) => setFormData({ ...formData, montant_ht: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Montant TTC (€)</Label>
              <Input
                placeholder="Montant TTC"
                value={formData.montant_ttc}
                onChange={(e) => setFormData({ ...formData, montant_ttc: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Conditions et chantier</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Conditions particulières</Label>
              <Textarea
                placeholder="Conditions spécifiques au chantier..."
                value={formData.conditions_particulieres}
                onChange={(e) => setFormData({ ...formData, conditions_particulieres: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Pénalités de retard (€/jour)</Label>
              <Input
                placeholder="Ex: 150"
                value={formData.penalites_retard}
                onChange={(e) => setFormData({ ...formData, penalites_retard: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact sur site — Nom</Label>
                <Input
                  placeholder="Nom du contact"
                  value={formData.contact_site_nom}
                  onChange={(e) => setFormData({ ...formData, contact_site_nom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Contact sur site — Téléphone</Label>
                <Input
                  placeholder="Téléphone"
                  value={formData.contact_site_telephone}
                  onChange={(e) => setFormData({ ...formData, contact_site_telephone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Horaires de chantier autorisés</Label>
              <Input
                placeholder="Ex: Lun-Ven 8h-18h"
                value={formData.horaires_chantier}
                onChange={(e) => setFormData({ ...formData, horaires_chantier: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Accès chantier (clés, codes, gardien)</Label>
              <Textarea
                placeholder="Modalités d'accès au chantier..."
                value={formData.acces_chantier}
                onChange={(e) => setFormData({ ...formData, acces_chantier: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Remarques</Label>
              <Textarea
                placeholder="Remarques diverses..."
                value={formData.remarques}
                onChange={(e) => setFormData({ ...formData, remarques: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Signatures</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Signature maître d'œuvre</Label>
              <Input
                placeholder="Signature + tampon"
                value={formData.signature_mo}
                onChange={(e) => setFormData({ ...formData, signature_mo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Signature entreprise</Label>
              <Input
                placeholder="Reçu et accepté"
                value={formData.signature_entreprise}
                onChange={(e) => setFormData({ ...formData, signature_entreprise: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const clientName = selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : undefined
  const previewContent = (
    <ProfessionalDocumentPreview
      documentNumber={generateDocumentNumber()}
      documentTitle="Ordre de service / Démarrage chantier"
      documentDate={new Date(formData.date)}
      companyName={company?.name}
      companyAddress={company?.address}
      companyPhone={company?.phone}
      companyEmail={company?.email}
      clientName={clientName}
      projectName={selectedProject?.name}
    >
      <div className="space-y-6 mt-6 text-sm">
        <div>
          <h4 className="font-semibold text-[#C5A572] mb-2">Destinataire et référence</h4>
          <p>Projet : {selectedProject?.name ?? '—'}</p>
          <p>Client : {clientName ?? '—'}</p>
          <p>Entreprise : {selectedSupplier?.name ?? '—'}</p>
          <p>Référence devis : {formData.reference_devis || '—'}</p>
        </div>
        <div>
          <h4 className="font-semibold text-[#C5A572] mb-2">Planning</h4>
          <p>Démarrage : {formData.date_demarrage || '—'} — Durée : {formData.duree_travaux || '—'} — Fin prévisionnelle : {formData.date_fin_prev || '—'}</p>
        </div>
        <div>
          <h4 className="font-semibold text-[#C5A572] mb-2">Montant</h4>
          <p>HT : {formData.montant_ht || '—'} € — TTC : {formData.montant_ttc || '—'} €</p>
        </div>
        {(formData.conditions_particulieres || formData.penalites_retard || formData.contact_site_nom || formData.horaires_chantier || formData.acces_chantier) && (
          <div>
            <h4 className="font-semibold text-[#C5A572] mb-2">Conditions et chantier</h4>
            {formData.conditions_particulieres && <p className="whitespace-pre-wrap">{formData.conditions_particulieres}</p>}
            {formData.penalites_retard && <p>Pénalités de retard : {formData.penalites_retard} €/jour</p>}
            {(formData.contact_site_nom || formData.contact_site_telephone) && (
              <p>Contact site : {formData.contact_site_nom || ''} {formData.contact_site_telephone || ''}</p>
            )}
            {formData.horaires_chantier && <p>Horaires : {formData.horaires_chantier}</p>}
            {formData.acces_chantier && <p className="whitespace-pre-wrap">Accès : {formData.acces_chantier}</p>}
          </div>
        )}
        {formData.remarques && (
          <div>
            <h4 className="font-semibold text-[#C5A572] mb-2">Remarques</h4>
            <p className="whitespace-pre-wrap">{formData.remarques}</p>
          </div>
        )}
        <div>
          <h4 className="font-semibold text-[#C5A572] mb-2">Signatures</h4>
          <p>Maître d'œuvre : {formData.signature_mo || 'Signature + tampon'}</p>
          <p>Entreprise : {formData.signature_entreprise || 'Reçu et accepté'}</p>
        </div>
      </div>
    </ProfessionalDocumentPreview>
  )

  return (
    <BaseDocumentLayout
      title="Ordre de service / Démarrage chantier"
      formContent={formContent}
      previewContent={previewContent}
      onSave={handleSave}
      onPreviewPDF={handleDownloadPDF}
      isSaving={isSaving}
    />
  )
}
