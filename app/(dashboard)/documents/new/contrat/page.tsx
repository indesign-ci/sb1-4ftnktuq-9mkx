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

const DEFAULT_ARTICLE_3 = `Le Maître d'Œuvre s'engage à : réaliser les prestations définies dans la proposition de mission ; respecter la réglementation en vigueur ; informer le Client de l'avancement des études ; assurer la coordination des interventions nécessaires à la mission.`

const DEFAULT_ARTICLE_4 = `Le Client s'engage à : fournir en temps utile toutes les informations et pièces nécessaires ; prendre les décisions demandées dans des délais raisonnables ; assurer l'accès au site aux personnes mandatées par le Maître d'Œuvre ; régler les honoraires selon l'échéancier convenu.`

const DEFAULT_ARTICLE_8 = `Les plans, esquisses, maquettes et créations réalisés par l'architecte d'intérieur dans le cadre de la mission restent sa propriété intellectuelle. Le Client dispose d'un droit d'usage pour la réalisation de son projet. Toute reproduction ou réutilisation à d'autres fins est subordonnée à l'accord écrit du Maître d'Œuvre.`

const DEFAULT_ARTICLE_9 = `Les parties s'engagent à maintenir la confidentialité sur les informations échangées dans le cadre du présent contrat, à l'exception des informations déjà publiques ou dont la divulgation serait imposée par la loi.`

const DEFAULT_ARTICLE_10 = `En cas de résiliation par l'une des parties, un préavis de 2 mois par lettre recommandée avec accusé de réception est requis. Les honoraires dus pour les prestations déjà réalisées restent acquis. Les documents et études restent la propriété du Maître d'Œuvre sous réserve du règlement intégral des sommes dues.`

const DEFAULT_ARTICLE_11 = `En cas de litige, les tribunaux du ressort du siège du Maître d'Œuvre seront seuls compétents, à l'exclusion de tout autre.`

const DEFAULT_ARTICLE_12 = `Conformément à l'article L.222-7 du Code de la consommation, le Client dispose d'un délai de 14 jours à compter de la signature du présent contrat pour exercer son droit de rétractation, par lettre recommandée avec accusé de réception. En cas de rétractation, les sommes déjà versées seront restituées dans un délai de 14 jours.`

export default function ContratMaitriseOeuvrePage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [clients, setClients] = useState<{ id: string; first_name: string; last_name: string; email?: string; phone?: string; address?: string }[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string; client_id?: string }[]>([])
  const [company, setCompany] = useState<{ name?: string; address?: string; phone?: string; email?: string } | null>(null)
  const [missionProposals, setMissionProposals] = useState<{ id: string; project_id: string | null; document_data: Record<string, unknown> }[]>([])

  const [formData, setFormData] = useState({
    client_id: '',
    project_id: '',
    date: new Date().toISOString().split('T')[0],
    article1_objet: '',
    article2_description_mission: '',
    article3_obligations_mo: DEFAULT_ARTICLE_3,
    article4_obligations_client: DEFAULT_ARTICLE_4,
    article5_honoraires: '',
    article6_date_debut: '',
    article6_date_fin: '',
    article7_rc_pro_numero: '',
    article7_compagnie: '',
    article8_propriete_intellectuelle: DEFAULT_ARTICLE_8,
    article9_confidentialite: DEFAULT_ARTICLE_9,
    article10_resiliation: DEFAULT_ARTICLE_10,
    article11_litiges: DEFAULT_ARTICLE_11,
    article12_retractation: DEFAULT_ARTICLE_12,
    annexe1_mission: 'Annexe 1 : Proposition de mission détaillée',
    annexe2_planning: 'Annexe 2 : Planning prévisionnel',
    annexe3_honoraires: 'Annexe 3 : Barème des honoraires',
    signature_lieu: '',
    signature_date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    loadData()
  }, [profile?.company_id])

  const loadData = async () => {
    if (!profile?.company_id) return
    try {
      const [clientsRes, projectsRes, companyRes, docsRes] = await Promise.all([
        supabase.from('clients').select('id, first_name, last_name, email, phone, address').eq('company_id', profile.company_id),
        supabase.from('projects').select('id, name, client_id').eq('company_id', profile.company_id),
        supabase.from('companies').select('name, address, phone, email').eq('id', profile.company_id).maybeSingle(),
        supabase.from('professional_documents').select('id, project_id, document_data').eq('document_type', 'mission_proposal').eq('company_id', profile.company_id),
      ])
      if (clientsRes.data) setClients(clientsRes.data)
      if (projectsRes.data) setProjects(projectsRes.data)
      if (companyRes.data) setCompany(companyRes.data)
      if (docsRes.data) setMissionProposals(docsRes.data)
    } catch (e) {
      console.error(e)
      toast.error('Erreur chargement des données')
    }
  }

  const generateDocumentNumber = () => {
    const year = new Date().getFullYear()
    const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
    return `CTR-${year}-${seq}`
  }

  const selectedClient = clients.find((c) => c.id === formData.client_id)
  const selectedProject = projects.find((p) => p.id === formData.project_id)
  const missionForProject = formData.project_id
    ? missionProposals.find((d) => d.project_id === formData.project_id)
    : null

  const fillFromMissionProposal = () => {
    if (!missionForProject?.document_data) return
    const d = missionForProject.document_data as Record<string, string>
    setFormData((prev) => ({
      ...prev,
      article2_description_mission: d.phases || d.presentation || prev.article2_description_mission,
      article5_honoraires: [d.totalHT, d.echeancier, d.modeRemuneration].filter(Boolean).join(' — ') || prev.article5_honoraires,
    }))
    toast.success('Champs remplis depuis la proposition de mission')
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
        document_type: 'contrat_maitrise_oeuvre',
        document_phase: 'phase3',
        document_number: documentNumber,
        title: `Contrat de maîtrise d'œuvre - ${selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : ''}`,
        client_id: formData.client_id || null,
        project_id: formData.project_id || null,
        status: 'draft',
        document_data: formData,
      })
      if (error) throw error
      toast.success('Contrat sauvegardé en brouillon')
      router.push('/documents-pro')
    } catch (e) {
      console.error(e)
      toast.error(e?.message || 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!selectedClient) {
      toast.error('Veuillez sélectionner un client')
      return
    }
    try {
      const sections = [
        { title: 'Article 1 — Objet du contrat', content: formData.article1_objet || '—' },
        { title: 'Article 2 — Description de la mission', content: formData.article2_description_mission || '—' },
        { title: "Article 3 — Obligations du Maître d'Œuvre", content: formData.article3_obligations_mo },
        { title: 'Article 4 — Obligations du Client', content: formData.article4_obligations_client },
        { title: 'Article 5 — Honoraires et modalités de paiement', content: formData.article5_honoraires || '—' },
        {
          title: 'Article 6 — Durée du contrat',
          content: `Date de début : ${formData.article6_date_debut || '___'} — Date de fin prévisionnelle : ${formData.article6_date_fin || '___'}`,
        },
        {
          title: 'Article 7 — Assurances',
          content: `N° police RC Pro : ${formData.article7_rc_pro_numero || '___'} — Compagnie : ${formData.article7_compagnie || '___'}`,
        },
        { title: 'Article 8 — Propriété intellectuelle', content: formData.article8_propriete_intellectuelle },
        { title: 'Article 9 — Confidentialité', content: formData.article9_confidentialite },
        { title: 'Article 10 — Résiliation', content: formData.article10_resiliation },
        { title: 'Article 11 — Litiges', content: formData.article11_litiges },
        { title: 'Article 12 — Droit de rétractation', content: formData.article12_retractation },
        {
          title: 'Annexes',
          content: [formData.annexe1_mission, formData.annexe2_planning, formData.annexe3_honoraires].join('\n'),
        },
        {
          title: 'Signatures',
          content: `Fait en 2 exemplaires originaux à ${formData.signature_lieu || '__________'}, le ${formData.signature_date || '__________'}\n\nLe Maître d'Œuvre : signature + tampon\nLe Client : signature + mention "Lu et approuvé, bon pour accord"\nParaphe en bas de chaque page.`,
        },
      ]
      await generateProfessionalDocumentPDF({
        documentNumber: generateDocumentNumber(),
        documentTitle: "Contrat de Maîtrise d'Œuvre",
        documentDate: new Date(formData.date),
        company: { name: company?.name ?? '', address: company?.address, phone: company?.phone, email: company?.email },
        client: {
          name: `${selectedClient.first_name} ${selectedClient.last_name}`,
          address: selectedClient.address,
          phone: selectedClient.phone,
          email: selectedClient.email,
        },
        projectName: selectedProject?.name,
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
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Client *</Label>
              <Select value={formData.client_id} onValueChange={(v) => setFormData({ ...formData, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Projet (optionnel)</Label>
              <Select value={formData.project_id} onValueChange={(v) => setFormData({ ...formData, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un projet" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {missionForProject && (
                <button
                  type="button"
                  onClick={fillFromMissionProposal}
                  className="text-sm text-[#C5A572] hover:underline"
                >
                  Remplir Article 2 et 5 depuis la proposition de mission
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Articles du contrat</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Article 1 — Objet du contrat</Label>
              <Textarea rows={3} value={formData.article1_objet} onChange={(e) => setFormData({ ...formData, article1_objet: e.target.value })} placeholder="Texte riche..." />
            </div>
            <div className="space-y-2">
              <Label>Article 2 — Description de la mission (pré-rempli depuis proposition)</Label>
              <Textarea rows={4} value={formData.article2_description_mission} onChange={(e) => setFormData({ ...formData, article2_description_mission: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Article 3 — Obligations du Maître d'Œuvre</Label>
              <Textarea rows={4} value={formData.article3_obligations_mo} onChange={(e) => setFormData({ ...formData, article3_obligations_mo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Article 4 — Obligations du Client</Label>
              <Textarea rows={4} value={formData.article4_obligations_client} onChange={(e) => setFormData({ ...formData, article4_obligations_client: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Article 5 — Honoraires et modalités de paiement</Label>
              <Textarea rows={4} value={formData.article5_honoraires} onChange={(e) => setFormData({ ...formData, article5_honoraires: e.target.value })} placeholder="Repris de la proposition de mission" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Article 6 — Date de début</Label>
                <Input type="date" value={formData.article6_date_debut} onChange={(e) => setFormData({ ...formData, article6_date_debut: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Article 6 — Date de fin prévisionnelle</Label>
                <Input type="date" value={formData.article6_date_fin} onChange={(e) => setFormData({ ...formData, article6_date_fin: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Article 7 — N° police RC Pro</Label>
                <Input value={formData.article7_rc_pro_numero} onChange={(e) => setFormData({ ...formData, article7_rc_pro_numero: e.target.value })} placeholder="N° police" />
              </div>
              <div className="space-y-2">
                <Label>Article 7 — Compagnie</Label>
                <Input value={formData.article7_compagnie} onChange={(e) => setFormData({ ...formData, article7_compagnie: e.target.value })} placeholder="Compagnie" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Article 8 — Propriété intellectuelle</Label>
              <Textarea rows={3} value={formData.article8_propriete_intellectuelle} onChange={(e) => setFormData({ ...formData, article8_propriete_intellectuelle: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Article 9 — Confidentialité</Label>
              <Textarea rows={2} value={formData.article9_confidentialite} onChange={(e) => setFormData({ ...formData, article9_confidentialite: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Article 10 — Résiliation</Label>
              <Textarea rows={3} value={formData.article10_resiliation} onChange={(e) => setFormData({ ...formData, article10_resiliation: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Article 11 — Litiges (tribunal compétent)</Label>
              <Textarea rows={2} value={formData.article11_litiges} onChange={(e) => setFormData({ ...formData, article11_litiges: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Article 12 — Droit de rétractation (14 jours)</Label>
              <Textarea rows={3} value={formData.article12_retractation} onChange={(e) => setFormData({ ...formData, article12_retractation: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Annexes</h3>
          <div className="space-y-2">
            <Input value={formData.annexe1_mission} onChange={(e) => setFormData({ ...formData, annexe1_mission: e.target.value })} />
            <Input value={formData.annexe2_planning} onChange={(e) => setFormData({ ...formData, annexe2_planning: e.target.value })} />
            <Input value={formData.annexe3_honoraires} onChange={(e) => setFormData({ ...formData, annexe3_honoraires: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Signatures</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lieu (Fait à ...)</Label>
              <Input value={formData.signature_lieu} onChange={(e) => setFormData({ ...formData, signature_lieu: e.target.value })} placeholder="Ville" />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={formData.signature_date} onChange={(e) => setFormData({ ...formData, signature_date: e.target.value })} />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Le Maître d'Œuvre : signature + tampon — Le Client : signature + « Lu et approuvé, bon pour accord » — Paraphe en bas de chaque page.
          </p>
        </CardContent>
      </Card>
    </div>
  )

  const previewContent = (
    <ProfessionalDocumentPreview
      documentNumber={generateDocumentNumber()}
      documentTitle="Contrat de Maîtrise d'Œuvre"
      documentDate={new Date(formData.date)}
      companyName={company?.name}
      companyAddress={company?.address}
      companyPhone={company?.phone}
      companyEmail={company?.email}
      clientName={selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : undefined}
      clientPhone={selectedClient?.phone}
      clientEmail={selectedClient?.email}
      projectName={selectedProject?.name}
    >
      <div className="space-y-6 text-sm">
        <p className="font-semibold">ENTRE : {company?.name || '—'} (paramètres entreprise)</p>
        <p className="font-semibold">ET : {selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : '—'} (client du projet)</p>

        <section><h4 className="font-semibold text-[#C5A572]">Article 1 — Objet du contrat</h4><p className="whitespace-pre-wrap mt-1">{formData.article1_objet || '—'}</p></section>
        <section><h4 className="font-semibold text-[#C5A572]">Article 2 — Description de la mission</h4><p className="whitespace-pre-wrap mt-1">{formData.article2_description_mission || '—'}</p></section>
        <section><h4 className="font-semibold text-[#C5A572]">Article 3 — Obligations du Maître d'Œuvre</h4><p className="whitespace-pre-wrap mt-1">{formData.article3_obligations_mo}</p></section>
        <section><h4 className="font-semibold text-[#C5A572]">Article 4 — Obligations du Client</h4><p className="whitespace-pre-wrap mt-1">{formData.article4_obligations_client}</p></section>
        <section><h4 className="font-semibold text-[#C5A572]">Article 5 — Honoraires et modalités de paiement</h4><p className="whitespace-pre-wrap mt-1">{formData.article5_honoraires || '—'}</p></section>
        <section><h4 className="font-semibold text-[#C5A572]">Article 6 — Durée</h4><p className="mt-1">Début : {formData.article6_date_debut || '___'} — Fin prévisionnelle : {formData.article6_date_fin || '___'}</p></section>
        <section><h4 className="font-semibold text-[#C5A572]">Article 7 — Assurances</h4><p className="mt-1">N° RC Pro : {formData.article7_rc_pro_numero || '___'} — Compagnie : {formData.article7_compagnie || '___'}</p></section>
        <section><h4 className="font-semibold text-[#C5A572]">Article 8 — Propriété intellectuelle</h4><p className="whitespace-pre-wrap mt-1">{formData.article8_propriete_intellectuelle}</p></section>
        <section><h4 className="font-semibold text-[#C5A572]">Article 9 — Confidentialité</h4><p className="whitespace-pre-wrap mt-1">{formData.article9_confidentialite}</p></section>
        <section><h4 className="font-semibold text-[#C5A572]">Article 10 — Résiliation</h4><p className="whitespace-pre-wrap mt-1">{formData.article10_resiliation}</p></section>
        <section><h4 className="font-semibold text-[#C5A572]">Article 11 — Litiges</h4><p className="whitespace-pre-wrap mt-1">{formData.article11_litiges}</p></section>
        <section><h4 className="font-semibold text-[#C5A572]">Article 12 — Droit de rétractation</h4><p className="whitespace-pre-wrap mt-1">{formData.article12_retractation}</p></section>

        <div className="border-t pt-4">
          <h4 className="font-semibold text-[#C5A572]">Annexes</h4>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>{formData.annexe1_mission}</li>
            <li>{formData.annexe2_planning}</li>
            <li>{formData.annexe3_honoraires}</li>
          </ul>
        </div>

        <div className="border-t pt-4">
          <p>Fait en 2 exemplaires originaux à {formData.signature_lieu || '__________'}, le {formData.signature_date || '__________'}</p>
          <p className="mt-4">Le Maître d'Œuvre : signature + tampon</p>
          <p>Le Client : signature + « Lu et approuvé, bon pour accord »</p>
          <p className="text-gray-600 mt-2">Paraphe en bas de chaque page.</p>
        </div>
      </div>
    </ProfessionalDocumentPreview>
  )

  return (
    <BaseDocumentLayout
      title="Contrat de Maîtrise d'Œuvre"
      formContent={formContent}
      previewContent={previewContent}
      onSave={handleSave}
      isSaving={isSaving}
      onPreviewPDF={handleDownloadPDF}
    />
  )
}
