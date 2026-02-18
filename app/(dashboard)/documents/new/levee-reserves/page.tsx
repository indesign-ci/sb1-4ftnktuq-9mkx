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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Trash2, Download } from 'lucide-react'
import { generateProfessionalDocumentPDF } from '@/lib/pdf/professional-document-pdf'

const BUCKET_DOCUMENTS = 'documents'
const MAX_FILE_MB = 20
const ACCEPT_IMAGES = 'image/jpeg,image/jpg,image/png,image/gif,image/webp'

type ReserveLevee = {
  id: string
  numero: number
  lot: string
  localisation: string
  description: string
  date_limite: string
  date_reprise: string
  conforme: 'Oui' | 'Non'
  observations: string
  photo_apres_url: string
  photo_apres_name: string
}

function reserveFromPV(r: { numero: number; lot_entreprise: string; localisation: string; description: string; date_limite_reprise: string }): ReserveLevee {
  return {
    id: crypto.randomUUID(),
    numero: r.numero,
    lot: r.lot_entreprise,
    localisation: r.localisation,
    description: r.description,
    date_limite: r.date_limite_reprise,
    date_reprise: '',
    conforme: 'Non',
    observations: '',
    photo_apres_url: '',
    photo_apres_name: '',
  }
}

export default function LeveeReservesPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [projects, setProjects] = useState<{ id: string; name: string; client_id?: string }[]>([])
  const [clients, setClients] = useState<{ id: string; first_name: string; last_name: string }[]>([])
  const [pvList, setPvList] = useState<{ id: string; document_number: string; document_data: unknown }[]>([])
  const [company, setCompany] = useState<{ name?: string } | null>(null)

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    project_id: '',
    pv_reception_id: '',
    reference_pv: '',
    decision: 'toutes_levees' as 'toutes_levees' | 'certaines_non' | 'nouvelle_visite',
    detail_non_levees: '',
    nouvelle_visite_date: '',
    signature_client_date: '',
    signature_client: '',
    signature_mo_date: '',
    signature_mo: '',
  })

  const [reserves, setReserves] = useState<ReserveLevee[]>([])

  useEffect(() => {
    if (!profile?.company_id) return
    const load = async () => {
      try {
        const [projRes, clientsRes, companyRes] = await Promise.all([
          supabase.from('projects').select('id, name, client_id').eq('company_id', profile.company_id),
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

  useEffect(() => {
    if (!formData.project_id || !profile?.company_id) return
    const loadPVs = async () => {
      const { data } = await supabase
        .from('professional_documents')
        .select('id, document_number, document_data')
        .eq('company_id', profile.company_id)
        .eq('project_id', formData.project_id)
        .eq('document_type', 'pv_reception_travaux')
      if (data) setPvList(data)
    }
    loadPVs()
  }, [formData.project_id, profile?.company_id])

  const loadReservesFromPV = (pvId: string) => {
    const pv = pvList.find((p) => p.id === pvId)
    if (!pv?.document_data) return
    const data = pv.document_data as { reserves?: Array<{ numero: number; lot_entreprise: string; localisation: string; description: string; date_limite_reprise: string }> }
    if (data.reserves?.length) {
      setReserves(data.reserves.map(reserveFromPV))
      setFormData((prev) => ({ ...prev, reference_pv: (pv as { document_number?: string }).document_number || prev.reference_pv }))
      toast.success('Réserves importées depuis le PV')
    } else {
      toast.info('Aucune réserve dans ce PV')
    }
  }

  const generateDocumentNumber = () => {
    const year = new Date().getFullYear()
    const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
    return `LR-${year}-${seq}`
  }

  const selectedProject = projects.find((p) => p.id === formData.project_id)
  const selectedClient = selectedProject?.client_id ? clients.find((c) => c.id === selectedProject.client_id) : null
  const clientName = selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : ''

  const updateReserve = (id: string, field: keyof ReserveLevee, value: string) => {
    setReserves((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  const addReserveManuelle = () => {
    setReserves((prev) => [...prev, reserveFromPV({ numero: prev.length + 1, lot_entreprise: '', localisation: '', description: '', date_limite_reprise: '' })])
  }

  const uploadFile = async (file: File, key: string): Promise<{ url: string; name: string }> => {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Fichier trop volumineux (max ${MAX_FILE_MB} Mo)`)
      throw new Error('File too large')
    }
    const path = `levee-reserves/${profile?.company_id || 'anon'}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    setUploading(key)
    try {
      const { error } = await supabase.storage.from(BUCKET_DOCUMENTS).upload(path, file, { cacheControl: '3600', upsert: false })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from(BUCKET_DOCUMENTS).getPublicUrl(path)
      return { url: publicUrl, name: file.name }
    } finally {
      setUploading(null)
    }
  }

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
        document_type: 'levee_reserves',
        document_phase: 'phase7',
        document_number: generateDocumentNumber(),
        title: `Levée des réserves - ${selectedProject?.name ?? ''}`,
        project_id: formData.project_id,
        client_id: selectedProject?.client_id ?? null,
        status: 'draft',
        document_data: { formData, reserves },
      })
      if (error) throw error
      toast.success('Fiche sauvegardée en brouillon')
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
      const reservesText = reserves
        .map(
          (r) =>
            `N°${r.numero} | ${r.lot} | ${r.localisation} | ${r.description} | Limite: ${r.date_limite} | Reprise: ${r.date_reprise} | Conforme: ${r.conforme} | ${r.observations}`
        )
        .join('\n')
      const decisionText =
        formData.decision === 'toutes_levees'
          ? 'Toutes les réserves ont été levées à la satisfaction du Maître d\'Ouvrage'
          : formData.decision === 'certaines_non'
            ? `Certaines réserves n'ont pas été levées. Détail: ${formData.detail_non_levees || '—'}`
            : `Nouvelle visite nécessaire le ${formData.nouvelle_visite_date || '—'}`
      const sections = [
        { title: 'Référence', content: `PV de réception: ${formData.reference_pv || '—'}\nProjet: ${selectedProject.name}\nClient: ${clientName}` },
        { title: 'Tableau des réserves', content: reservesText || 'Aucune' },
        { title: 'Décision', content: decisionText },
        { title: 'Signatures', content: `Client: ${formData.signature_client_date} - ${formData.signature_client}\nArchitecte: ${formData.signature_mo_date} - ${formData.signature_mo}` },
      ]
      await generateProfessionalDocumentPDF({
        documentNumber: generateDocumentNumber(),
        documentTitle: 'Fiche de levée des réserves',
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
            <div className="space-y-2 col-span-2">
              <Label>Référence du PV de réception</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.pv_reception_id}
                  onValueChange={(v) => {
                    setFormData((prev) => ({ ...prev, pv_reception_id: v }))
                    loadReservesFromPV(v)
                  }}
                >
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Choisir un PV pour importer les réserves" /></SelectTrigger>
                  <SelectContent>
                    {pvList.map((pv) => (
                      <SelectItem key={pv.id} value={pv.id}>{pv.document_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Ou saisir la référence" value={formData.reference_pv} onChange={(e) => setFormData({ ...formData, reference_pv: e.target.value })} className="w-40" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Tableau des réserves</h3>
            <button type="button" onClick={addReserveManuelle} className="text-sm text-[#C5A572] hover:underline flex items-center gap-1">
              <Plus className="h-4 w-4" /> Ajouter une réserve
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="border border-gray-200 p-2 w-10">N°</th>
                  <th className="border border-gray-200 p-2 text-left min-w-[100px]">Lot</th>
                  <th className="border border-gray-200 p-2 text-left">Localisation</th>
                  <th className="border border-gray-200 p-2 text-left min-w-[120px]">Description</th>
                  <th className="border border-gray-200 p-2 w-28">Date limite</th>
                  <th className="border border-gray-200 p-2 w-28">Date reprise</th>
                  <th className="border border-gray-200 p-2 w-24">Conforme</th>
                  <th className="border border-gray-200 p-2 text-left min-w-[100px]">Observations</th>
                  <th className="border border-gray-200 p-2">Photo après</th>
                </tr>
              </thead>
              <tbody>
                {reserves.length === 0 ? (
                  <tr><td colSpan={9} className="border border-gray-200 p-4 text-gray-500 text-center">Sélectionnez un PV de réception pour importer les réserves, ou ajoutez-les manuellement ci-dessous.</td></tr>
                ) : (
                  reserves.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100">
                      <td className="border border-gray-200 p-1 text-center">{r.numero}</td>
                      <td className="border border-gray-200 p-1"><Input className="h-8 border-0 shadow-none" value={r.lot} onChange={(e) => updateReserve(r.id, 'lot', e.target.value)} /></td>
                      <td className="border border-gray-200 p-1"><Input className="h-8 border-0 shadow-none" value={r.localisation} onChange={(e) => updateReserve(r.id, 'localisation', e.target.value)} /></td>
                      <td className="border border-gray-200 p-1"><Input className="h-8 border-0 shadow-none" value={r.description} onChange={(e) => updateReserve(r.id, 'description', e.target.value)} /></td>
                      <td className="border border-gray-200 p-1"><Input type="date" className="h-8 border-0 shadow-none" value={r.date_limite} onChange={(e) => updateReserve(r.id, 'date_limite', e.target.value)} readOnly /></td>
                      <td className="border border-gray-200 p-1"><Input type="date" className="h-8 border-0 shadow-none" value={r.date_reprise} onChange={(e) => updateReserve(r.id, 'date_reprise', e.target.value)} /></td>
                      <td className="border border-gray-200 p-1">
                        <Select value={r.conforme} onValueChange={(v) => updateReserve(r.id, 'conforme', v as 'Oui' | 'Non')}>
                          <SelectTrigger className="h-8 border-0 shadow-none"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="Oui">Oui</SelectItem><SelectItem value="Non">Non</SelectItem></SelectContent>
                        </Select>
                      </td>
                      <td className="border border-gray-200 p-1"><Input className="h-8 border-0 shadow-none" value={r.observations} onChange={(e) => updateReserve(r.id, 'observations', e.target.value)} /></td>
                      <td className="border border-gray-200 p-1">
                        <div className="flex items-center gap-1">
                          <Input
                            type="file"
                            accept={ACCEPT_IMAGES}
                            className="max-w-[100px] text-xs"
                            disabled={!!uploading}
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              try {
                                const { url, name } = await uploadFile(file, `photo-${r.id}`)
                                updateReserve(r.id, 'photo_apres_url', url)
                                updateReserve(r.id, 'photo_apres_name', name)
                                toast.success('Photo ajoutée')
                              } catch { toast.error('Erreur upload') }
                              e.target.value = ''
                            }}
                          />
                          {(r.photo_apres_url || r.photo_apres_name) && (
                            <span className="flex items-center gap-1 text-xs">
                              <a href={r.photo_apres_url} target="_blank" rel="noopener noreferrer" className="text-[#C5A572]"><Download className="h-3 w-3" /></a>
                              <button type="button" onClick={() => { updateReserve(r.id, 'photo_apres_url', ''); updateReserve(r.id, 'photo_apres_name', '') }} className="text-red-600">×</button>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Décision</h3>
          <RadioGroup value={formData.decision} onValueChange={(v) => setFormData({ ...formData, decision: v as typeof formData.decision })} className="space-y-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="toutes_levees" id="dec-toutes" />
              <Label htmlFor="dec-toutes" className="font-normal">Toutes les réserves ont été levées à la satisfaction du Maître d'Ouvrage</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="certaines_non" id="dec-certaines" />
              <Label htmlFor="dec-certaines" className="font-normal">Certaines réserves n'ont pas été levées (détail)</Label>
            </div>
            {formData.decision === 'certaines_non' && (
              <div className="pl-6"><Textarea placeholder="Détail des réserves non levées" value={formData.detail_non_levees} onChange={(e) => setFormData({ ...formData, detail_non_levees: e.target.value })} rows={2} /></div>
            )}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nouvelle_visite" id="dec-visite" />
              <Label htmlFor="dec-visite" className="font-normal">Nouvelle visite nécessaire le</Label>
              {formData.decision === 'nouvelle_visite' && (
                <Input type="date" value={formData.nouvelle_visite_date} onChange={(e) => setFormData({ ...formData, nouvelle_visite_date: e.target.value })} className="w-40" />
              )}
            </div>
          </RadioGroup>
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
    <ProfessionalDocumentPreview documentNumber={generateDocumentNumber()} documentTitle="Fiche de levée des réserves" documentDate={new Date(formData.date)} companyName={company?.name} clientName={clientName} projectName={selectedProject?.name}>
      <div className="mt-6 text-sm space-y-2">
        <p>Référence PV : {formData.reference_pv || '—'}</p>
        <p>Réserves : {reserves.length} — Décision : {formData.decision === 'toutes_levees' ? 'Toutes levées' : formData.decision === 'certaines_non' ? 'Certaines non levées' : 'Nouvelle visite'}</p>
      </div>
    </ProfessionalDocumentPreview>
  )

  return (
    <BaseDocumentLayout title="Fiche de levée des réserves" formContent={formContent} previewContent={previewContent} onSave={handleSave} onPreviewPDF={handleDownloadPDF} isSaving={isSaving} />
  )
}
