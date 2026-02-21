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
import { Plus, Trash2, Download } from 'lucide-react'
import { generateProfessionalDocumentPDF } from '@/lib/pdf/professional-document-pdf'

const BUCKET_DOCUMENTS = 'documents'
const MAX_FILE_MB = 20
const ACCEPT_FILES = 'image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf'

type FileItem = { url: string; name: string }
type FicheTechnique = { id: string; materiel: string; reference: string; fournisseur: string; fiche_url: string; fiche_name: string }
type Intervenant = { id: string; corps_metier: string; entreprise: string; contact: string; telephone: string; email: string }

const defaultFiche = (): FicheTechnique => ({ id: crypto.randomUUID(), materiel: '', reference: '', fournisseur: '', fiche_url: '', fiche_name: '' })
const defaultIntervenant = (): Intervenant => ({ id: crypto.randomUUID(), corps_metier: '', entreprise: '', contact: '', telephone: '', email: '' })

export default function DOEPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [projects, setProjects] = useState<{ id: string; name: string; client_id?: string }[]>([])
  const [clients, setClients] = useState<{ id: string; first_name: string; last_name: string }[]>([])
  const [company, setCompany] = useState<{ name?: string } | null>(null)

  const [formData, setFormData] = useState({
    date_remise: new Date().toISOString().split('T')[0],
    project_id: '',
    plans_amenagement_url: '',
    plans_amenagement_name: '',
    plans_electriques_url: '',
    plans_electriques_name: '',
    plans_plomberie_url: '',
    plans_plomberie_name: '',
    plans_reseaux_url: '',
    plans_reseaux_name: '',
    entretien_sols_texte: '',
    entretien_sols_url: '',
    entretien_sols_name: '',
    entretien_murs_texte: '',
    entretien_murs_url: '',
    entretien_murs_name: '',
    entretien_mobilier_texte: '',
    entretien_mobilier_url: '',
    entretien_mobilier_name: '',
    notice_chaudiere_url: '',
    notice_chaudiere_name: '',
    notice_domotique_url: '',
    notice_domotique_name: '',
    notice_cuisine_url: '',
    notice_cuisine_name: '',
    pv_reception_url: '',
    pv_reception_name: '',
  })

  const [fiches, setFiches] = useState<FicheTechnique[]>([defaultFiche()])
  const [garantiesFabricants, setGarantiesFabricants] = useState<FileItem[]>([])
  const [assurancesDecennales, setAssurancesDecennales] = useState<FileItem[]>([])
  const [intervenants, setIntervenants] = useState<Intervenant[]>([defaultIntervenant()])
  const [photosAvant, setPhotosAvant] = useState<FileItem[]>([])
  const [photosApres, setPhotosApres] = useState<FileItem[]>([])

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

  const generateDocumentNumber = () => {
    const year = new Date().getFullYear()
    const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
    return `DOE-${year}-${seq}`
  }

  const selectedProject = projects.find((p) => p.id === formData.project_id)
  const selectedClient = selectedProject?.client_id ? clients.find((c) => c.id === selectedProject.client_id) : null
  const clientName = selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : ''

  const uploadOne = async (file: File, key: string): Promise<FileItem> => {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Fichier trop volumineux (max ${MAX_FILE_MB} Mo)`)
      throw new Error('File too large')
    }
    const path = `doe/${profile?.company_id || 'anon'}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
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

  const addToArray = (setter: React.Dispatch<React.SetStateAction<FileItem[]>>, file: File, key: string) => {
    uploadOne(file, key).then((item) => {
      setter((prev) => [...prev, item])
      toast.success('Fichier ajouté')
    }).catch(() => toast.error('Erreur upload'))
  }

  const removeFromArray = (setter: React.Dispatch<React.SetStateAction<FileItem[]>>, index: number) => {
    setter((prev) => prev.filter((_, i) => i !== index))
  }

  const addFiche = () => setFiches((prev) => [...prev, defaultFiche()])
  const removeFiche = (id: string) => setFiches((prev) => (prev.length > 1 ? prev.filter((f) => f.id !== id) : prev))
  const updateFiche = (id: string, field: keyof FicheTechnique, value: string) => {
    setFiches((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)))
  }

  const addIntervenant = () => setIntervenants((prev) => [...prev, defaultIntervenant()])
  const removeIntervenant = (id: string) => setIntervenants((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev))
  const updateIntervenant = (id: string, field: keyof Intervenant, value: string) => {
    setIntervenants((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
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
        document_type: 'doe',
        document_phase: 'phase7',
        document_number: generateDocumentNumber(),
        title: `DOE - ${selectedProject?.name ?? ''}`,
        project_id: formData.project_id,
        client_id: selectedProject?.client_id ?? null,
        status: 'draft',
        document_data: { formData, fiches, garantiesFabricants, assurancesDecennales, intervenants, photosAvant, photosApres },
      })
      if (error) throw error
      toast.success('DOE sauvegardé en brouillon')
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
      const sections = [
        { title: 'Plans définitifs', content: `Aménagement: ${formData.plans_amenagement_name || '—'}\nÉlectriques: ${formData.plans_electriques_name || '—'}\nPlomberie: ${formData.plans_plomberie_name || '—'}\nRéseaux: ${formData.plans_reseaux_name || '—'}` },
        { title: 'Fiches techniques', content: fiches.map((f) => `${f.materiel} | ${f.reference} | ${f.fournisseur}`).join('\n') || '—' },
        { title: 'Notices et entretien', content: `Sols: ${formData.entretien_sols_texte || formData.entretien_sols_name || '—'}\nMurs: ${formData.entretien_murs_texte || formData.entretien_murs_name || '—'}\nMobilier: ${formData.entretien_mobilier_texte || formData.entretien_mobilier_name || '—'}` },
        { title: 'Garanties', content: `Garanties fabricants: ${garantiesFabricants.length} fichier(s)\nAssurances décennales: ${assurancesDecennales.length} fichier(s)\nPV réception: ${formData.pv_reception_name || '—'}` },
        { title: 'Intervenants', content: intervenants.map((i) => `${i.corps_metier} | ${i.entreprise} | ${i.contact} | ${i.telephone} | ${i.email}`).join('\n') || '—' },
      ]
      await generateProfessionalDocumentPDF({
        documentNumber: generateDocumentNumber(),
        documentTitle: 'Dossier des Ouvrages Exécutés (DOE)',
        documentDate: new Date(formData.date_remise),
        company: { name: company?.name ?? '' },
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

  const renderUpload = (label: string, urlKey: keyof typeof formData, nameKey: keyof typeof formData) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input type="file" accept={ACCEPT_FILES} className="max-w-[220px] text-sm" disabled={!!uploading} onChange={async (e) => { const f = e.target.files?.[0]; if (f) try { const { url, name } = await uploadOne(f, nameKey); setFormData((prev) => ({ ...prev, [urlKey]: url, [nameKey]: name })); toast.success('Fichier envoyé'); } catch { toast.error('Erreur'); } e.target.value = ''; }} />
        {(formData[urlKey] as string) && (
          <span className="text-sm flex items-center gap-2">
            {formData[nameKey] as string}
            <a href={formData[urlKey] as string} target="_blank" rel="noopener noreferrer" className="text-[#C5A572]"><Download className="h-3.5 w-3.5" /></a>
          </span>
        )}
      </div>
    </div>
  )

  const renderUploadMultiple = (label: string, items: FileItem[], setItems: React.Dispatch<React.SetStateAction<FileItem[]>>, key: string) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        <Input type="file" accept={ACCEPT_FILES} className="max-w-[220px] text-sm" disabled={!!uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) addToArray(setItems, f, key); e.target.value = ''; }} />
        {items.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-1 text-sm bg-gray-100 rounded px-2 py-1">
            {it.name}
            <a href={it.url} target="_blank" rel="noopener noreferrer" className="text-[#C5A572]"><Download className="h-3.5 w-3.5" /></a>
            <button type="button" onClick={() => removeFromArray(setItems, i)} className="text-red-600">×</button>
          </span>
        ))}
      </div>
    </div>
  )

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
              <Label>Date de remise</Label>
              <Input type="date" value={formData.date_remise} onChange={(e) => setFormData({ ...formData, date_remise: e.target.value })} />
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
          <h3 className="text-lg font-semibold text-gray-900">1. Plans définitifs (après travaux)</h3>
          <div className="grid grid-cols-2 gap-4">
            {renderUpload('Plans d\'aménagement définitifs', 'plans_amenagement_url', 'plans_amenagement_name')}
            {renderUpload('Plans électriques', 'plans_electriques_url', 'plans_electriques_name')}
            {renderUpload('Plans plomberie', 'plans_plomberie_url', 'plans_plomberie_name')}
            {renderUpload('Plans des réseaux', 'plans_reseaux_url', 'plans_reseaux_name')}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">2. Fiches techniques des matériaux</h3>
            <button type="button" onClick={addFiche} className="text-sm text-[#C5A572] hover:underline flex items-center gap-1"><Plus className="h-4 w-4" /> Ajouter</button>
          </div>
          <div className="space-y-3">
            {fiches.map((f) => (
              <div key={f.id} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end border rounded p-3 bg-gray-50">
                <Input placeholder="Matériau" value={f.materiel} onChange={(e) => updateFiche(f.id, 'materiel', e.target.value)} />
                <Input placeholder="Référence" value={f.reference} onChange={(e) => updateFiche(f.id, 'reference', e.target.value)} />
                <Input placeholder="Fournisseur" value={f.fournisseur} onChange={(e) => updateFiche(f.id, 'fournisseur', e.target.value)} />
                <div className="flex gap-1">
                  <Input type="file" accept="application/pdf" className="text-sm" disabled={!!uploading} onChange={async (e) => { const file = e.target.files?.[0]; if (file) try { const { url, name } = await uploadOne(file, 'fiche'); updateFiche(f.id, 'fiche_url', url); updateFiche(f.id, 'fiche_name', name); toast.success('Fiche ajoutée'); } catch { toast.error('Erreur'); } e.target.value = ''; }} />
                  {f.fiche_name && <a href={f.fiche_url} target="_blank" rel="noopener noreferrer" className="text-[#C5A572] shrink-0"><Download className="h-4 w-4" /></a>}
                </div>
                <button type="button" onClick={() => removeFiche(f.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">3. Notices d'utilisation & Entretien</h3>
          <div className="space-y-4">
            {['sols', 'murs', 'mobilier'].map((key) => (
              <div key={key} className="space-y-2">
                <Label>Entretien des {key === 'sols' ? 'sols' : key === 'murs' ? 'murs' : 'mobilier'}</Label>
                <Textarea rows={2} placeholder="Texte ou référence" value={formData[`entretien_${key}_texte` as keyof typeof formData] as string} onChange={(e) => setFormData({ ...formData, [`entretien_${key}_texte`]: e.target.value })} />
                <div className="flex items-center gap-2">
                  <Input type="file" accept={ACCEPT_FILES} className="max-w-[200px] text-sm" disabled={!!uploading} onChange={async (e) => { const f = e.target.files?.[0]; if (f) try { const { url, name } = await uploadOne(f, key); setFormData((prev) => ({ ...prev, [`entretien_${key}_url`]: url, [`entretien_${key}_name`]: name })); toast.success('Fichier ajouté'); } catch { toast.error('Erreur'); } e.target.value = ''; }} />
                  {(formData[`entretien_${key}_url` as keyof typeof formData] as string) && <span className="text-sm">{(formData[`entretien_${key}_name` as keyof typeof formData] as string)} <a href={formData[`entretien_${key}_url` as keyof typeof formData] as string} target="_blank" rel="noopener noreferrer" className="text-[#C5A572]">Télécharger</a></span>}
                </div>
              </div>
            ))}
            {renderUpload('Notice chaudière/climatisation', 'notice_chaudiere_url', 'notice_chaudiere_name')}
            {renderUpload('Notice domotique', 'notice_domotique_url', 'notice_domotique_name')}
            {renderUpload('Notice cuisine/électroménager', 'notice_cuisine_url', 'notice_cuisine_name')}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">4. Garanties</h3>
          {renderUploadMultiple('Garanties fabricants', garantiesFabricants, setGarantiesFabricants, 'garanties')}
          {renderUploadMultiple('Assurances décennales artisans', assurancesDecennales, setAssurancesDecennales, 'decennales')}
          {renderUpload('PV de réception', 'pv_reception_url', 'pv_reception_name')}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">5. Coordonnées des intervenants</h3>
            <button type="button" onClick={addIntervenant} className="text-sm text-[#C5A572] hover:underline flex items-center gap-1"><Plus className="h-4 w-4" /> Ajouter</button>
          </div>
          <div className="space-y-3">
            {intervenants.map((i) => (
              <div key={i.id} className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end border rounded p-3 bg-gray-50">
                <Input placeholder="Corps de métier" value={i.corps_metier} onChange={(e) => updateIntervenant(i.id, 'corps_metier', e.target.value)} />
                <Input placeholder="Entreprise" value={i.entreprise} onChange={(e) => updateIntervenant(i.id, 'entreprise', e.target.value)} />
                <Input placeholder="Contact" value={i.contact} onChange={(e) => updateIntervenant(i.id, 'contact', e.target.value)} />
                <Input placeholder="Téléphone" value={i.telephone} onChange={(e) => updateIntervenant(i.id, 'telephone', e.target.value)} />
                <Input placeholder="Email" value={i.email} onChange={(e) => updateIntervenant(i.id, 'email', e.target.value)} />
                <button type="button" onClick={() => removeIntervenant(i.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">6. Photos avant/après</h3>
          {renderUploadMultiple('Photos avant travaux', photosAvant, setPhotosAvant, 'avant')}
          {renderUploadMultiple('Photos après travaux', photosApres, setPhotosApres, 'apres')}
        </CardContent>
      </Card>
    </div>
  )

  const previewContent = (
    <ProfessionalDocumentPreview documentNumber={generateDocumentNumber()} documentTitle="Dossier des Ouvrages Exécutés (DOE)" documentDate={new Date(formData.date_remise)} companyName={company?.name} clientName={clientName} projectName={selectedProject?.name}>
      <div className="mt-6 text-sm space-y-2">
        <p>Plans : {[formData.plans_amenagement_name, formData.plans_electriques_name, formData.plans_plomberie_name].filter(Boolean).join(', ') || '—'}</p>
        <p>Fiches techniques : {fiches.length} — Intervenants : {intervenants.length}</p>
      </div>
    </ProfessionalDocumentPreview>
  )

  return (
    <BaseDocumentLayout title="Dossier des Ouvrages Exécutés (DOE)" formContent={formContent} previewContent={previewContent} onSave={handleSave} onPreviewPDF={handleDownloadPDF} isSaving={isSaving} />
  )
}
