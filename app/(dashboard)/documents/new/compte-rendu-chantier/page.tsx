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
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
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

const METEO_OPTIONS = ['Ensoleillé', 'Nuageux', 'Pluie', 'Froid'] as const
const PLANNING_OPTIONS = ['En avance', 'Conforme', 'Retard léger', 'Retard important'] as const
const STATUT_LOT_OPTIONS = ['Non démarré', 'En cours', 'En attente', 'Terminé', 'Problème'] as const
const STATUT_POINT_OPTIONS = ['Ouvert', 'En cours', 'Résolu'] as const
const DEMANDE_PAR_OPTIONS = ['Client', 'Architecte', 'Artisan'] as const
const STATUT_MODIF_OPTIONS = ['Proposition', 'Accepté', 'Refusé'] as const

const LOTS = [
  'Démolition',
  'Gros œuvre',
  'Plomberie/Sanitaires',
  'Électricité',
  'Peinture',
  'Revêtements de sol',
  'Revêtements muraux',
  'Menuiserie',
  'Cuisine',
  'Salle de bain',
  'Serrurerie/Métallerie',
  'Vitrerie',
  'Plâtrerie/Cloisons',
  'Climatisation',
  'Domotique',
] as const

type ParticipantRow = {
  id: string
  nom: string
  entreprise_role: string
  present: 'Oui' | 'Non'
  excuse: 'Oui' | 'Non'
  convoque_non_present: 'Oui' | 'Non'
  destinataire: boolean
}

type PhotoItem = { url: string; name: string }

type AvancementLotRow = {
  id: string
  lot: string
  entreprise: string
  avancement: number
  statut: string
  travaux_realises: string
  travaux_a_realiser: string
  effectif: string
  points_bloquants: string
  date_fin_prev: string
  observations: string
  photos: PhotoItem[]
}

type PointParticulierRow = {
  id: string
  numero: string
  description: string
  responsable: string
  echeance: string
  statut: string
  commentaire: string
}

type ModificationRow = {
  id: string
  description: string
  demande_par: string
  impact_budget: string
  impact_planning: string
  statut: string
  devis_reference: string
}

const defaultParticipant = (): ParticipantRow => ({
  id: crypto.randomUUID(),
  nom: '',
  entreprise_role: '',
  present: 'Non',
  excuse: 'Non',
  convoque_non_present: 'Non',
  destinataire: false,
})

const defaultLot = (): AvancementLotRow => ({
  id: crypto.randomUUID(),
  lot: '',
  entreprise: '',
  avancement: 0,
  statut: 'Non démarré',
  travaux_realises: '',
  travaux_a_realiser: '',
  effectif: '',
  points_bloquants: '',
  date_fin_prev: '',
  observations: '',
  photos: [],
})

const defaultPoint = (): PointParticulierRow => ({
  id: crypto.randomUUID(),
  numero: '',
  description: '',
  responsable: '',
  echeance: '',
  statut: 'Ouvert',
  commentaire: '',
})

const defaultModification = (): ModificationRow => ({
  id: crypto.randomUUID(),
  description: '',
  demande_par: 'Client',
  impact_budget: '',
  impact_planning: '',
  statut: 'Proposition',
  devis_reference: '',
})

export default function CompteRenduChantierPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [projects, setProjects] = useState<{ id: string; name: string; address?: string; city?: string; postal_code?: string; client_id?: string }[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [company, setCompany] = useState<{ name?: string } | null>(null)

  const [formData, setFormData] = useState({
    numero_projet: '001',
    reunion_numero: '1',
    reunion_total: '12',
    date_reunion: new Date().toISOString().split('T')[0],
    heure_debut: '',
    heure_fin: '',
    project_id: '',
    meteo: 'Ensoleillé',
    avancement_global: 0,
    respect_planning: 'Conforme',
    retard_jours: '',
    prochaine_reunion_date: '',
    prochaine_reunion_heure: '',
    prochaine_reunion_points: '',
    prochaine_reunion_documents: '',
    prochaine_reunion_date_fin: '',
    prochaine_reunion_heure_fin: '',
  })

  const [participants, setParticipants] = useState<ParticipantRow[]>([defaultParticipant()])
  const [lots, setLots] = useState<AvancementLotRow[]>([defaultLot()])
  const [points, setPoints] = useState<PointParticulierRow[]>([defaultPoint()])
  const [modifications, setModifications] = useState<ModificationRow[]>([defaultModification()])

  useEffect(() => {
    if (!profile?.company_id) return
    const load = async () => {
      try {
        const [projRes, supRes, companyRes] = await Promise.all([
          supabase.from('projects').select('id, name, address, city, postal_code, client_id').eq('company_id', profile.company_id),
          supabase.from('suppliers').select('id, name').eq('company_id', profile.company_id).order('name'),
          supabase.from('companies').select('name').eq('id', profile.company_id).maybeSingle(),
        ])
        if (projRes.data) setProjects(projRes.data)
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
    const p = String(formData.numero_projet || '001').padStart(3, '0')
    const r = String(formData.reunion_numero || '1').padStart(2, '0')
    return `CR-${year}-${p}-${r}`
  }

  const selectedProject = projects.find((p) => p.id === formData.project_id)
  const lieuChantier = selectedProject
    ? [selectedProject.address, selectedProject.postal_code, selectedProject.city].filter(Boolean).join(', ') || selectedProject.name
    : ''

  const uploadFile = async (file: File, key: string): Promise<{ url: string; name: string }> => {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Fichier trop volumineux (max ${MAX_FILE_MB} Mo)`)
      throw new Error('File too large')
    }
    const companyId = profile?.company_id || 'anon'
    const ext = file.name.split('.').pop() || 'bin'
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const path = `compte-rendu-chantier/${companyId}/${Date.now()}_${safeName}`

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

  const addParticipant = () => setParticipants((prev) => [...prev, defaultParticipant()])
  const removeParticipant = (id: string) => setParticipants((prev) => prev.filter((p) => p.id !== id))
  const updateParticipant = (id: string, field: keyof ParticipantRow, value: string | boolean) => {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const addLot = () => setLots((prev) => [...prev, defaultLot()])
  const removeLot = (id: string) => setLots((prev) => prev.filter((l) => l.id !== id))
  const updateLot = (id: string, field: keyof AvancementLotRow, value: string | number | PhotoItem[]) => {
    setLots((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)))
  }
  const addPhotoToLot = async (lotId: string, file: File) => {
    try {
      const { url, name } = await uploadFile(file, `photo-${lotId}`)
      const lot = lots.find((l) => l.id === lotId)
      if (lot) updateLot(lotId, 'photos', [...lot.photos, { url, name }])
      toast.success('Photo ajoutée')
    } catch (err: any) {
      toast.error(err?.message || 'Erreur upload')
    }
  }
  const removePhotoFromLot = (lotId: string, index: number) => {
    const lot = lots.find((l) => l.id === lotId)
    if (lot) updateLot(lotId, 'photos', lot.photos.filter((_, i) => i !== index))
  }

  const addPoint = () => setPoints((prev) => [...prev, defaultPoint()])
  const removePoint = (id: string) => setPoints((prev) => prev.filter((p) => p.id !== id))
  const updatePoint = (id: string, field: keyof PointParticulierRow, value: string) => {
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const addModification = () => setModifications((prev) => [...prev, defaultModification()])
  const removeModification = (id: string) => setModifications((prev) => prev.filter((m) => m.id !== id))
  const updateModification = (id: string, field: keyof ModificationRow, value: string) => {
    setModifications((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)))
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
        document_type: 'compte_rendu_reunion_chantier',
        document_phase: 'phase6',
        document_number: documentNumber,
        title: `CR Réunion chantier - ${selectedProject?.name ?? ''} - Réunion n°${formData.reunion_numero}`,
        project_id: formData.project_id,
        client_id: selectedProject?.client_id ?? null,
        status: 'draft',
        document_data: { formData, participants, lots, points, modifications },
      })
      if (error) throw error
      toast.success('Compte-rendu sauvegardé en brouillon')
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
      const participantsText = participants
        .map(
          (p) =>
            `${p.nom || '—'} | ${p.entreprise_role || '—'} | Présent: ${p.present} | Excusé: ${p.excuse} | Convoqué non présent: ${p.convoque_non_present}${p.destinataire ? ' | Destinataire CR' : ''}`
        )
        .join('\n')
      const lotsText = lots
        .map(
          (l) =>
            `Lot: ${l.lot || '—'} | Entreprise: ${l.entreprise || '—'} | Avancement: ${l.avancement}% | Statut: ${l.statut}\nTravaux réalisés: ${l.travaux_realises || '—'}\nTravaux à réaliser: ${l.travaux_a_realiser || '—'}\nEffectif: ${l.effectif || '—'} | Points bloquants: ${l.points_bloquants || '—'}\nDate fin prévue: ${l.date_fin_prev || '—'}\nObservations: ${l.observations || '—'}`
        )
        .join('\n\n')
      const pointsText = points
        .map(
          (p) =>
            `Point n°${p.numero} | ${p.description} | Responsable: ${p.responsable} | Échéance: ${p.echeance} | Statut: ${p.statut}\nCommentaire: ${p.commentaire || '—'}`
        )
        .join('\n\n')
      const modifsText = modifications
        .map(
          (m) =>
            `${m.description || '—'} | Demandé par: ${m.demande_par} | Impact budget: ${m.impact_budget}€ HT | Impact planning: ${m.impact_planning} j | Statut: ${m.statut} | Devis: ${m.devis_reference || '—'}`
        )
        .join('\n')

      const sections = [
        {
          title: 'En-tête',
          content: `Réunion n° ${formData.reunion_numero} / ${formData.reunion_total}\nDate: ${formData.date_reunion} | Heure: ${formData.heure_debut || '—'} - ${formData.heure_fin || '—'}\nLieu: ${lieuChantier || '—'}\nMétéo: ${formData.meteo}`,
        },
        { title: 'Participants', content: participantsText || '—' },
        {
          title: 'Avancement général',
          content: `Avancement global: ${formData.avancement_global}%\nRespect du planning: ${formData.respect_planning}\nRetard constaté: ${formData.retard_jours || '—'} jours\nProchaine réunion: ${formData.prochaine_reunion_date_fin || formData.prochaine_reunion_date || '—'} à ${formData.prochaine_reunion_heure_fin || formData.prochaine_reunion_heure || '—'}`,
        },
        { title: 'Avancement par lot', content: lotsText || '—' },
        { title: 'Points particuliers', content: pointsText || '—' },
        { title: 'Modifications / Travaux supplémentaires', content: modifsText || '—' },
        {
          title: 'Prochaine réunion',
          content: `Date: ${formData.prochaine_reunion_date_fin || formData.prochaine_reunion_date || '—'} | Heure: ${formData.prochaine_reunion_heure_fin || formData.prochaine_reunion_heure || '—'}\nPoints à traiter: ${formData.prochaine_reunion_points || '—'}\nDocuments à préparer: ${formData.prochaine_reunion_documents || '—'}`,
        },
        {
          title: 'Diffusion',
          content: participants.filter((p) => p.destinataire).map((p) => `${p.nom} (${p.entreprise_role})`).join(', ') || '—',
        },
      ]

      await generateProfessionalDocumentPDF({
        documentNumber: generateDocumentNumber(),
        documentTitle: 'Compte-rendu de réunion de chantier',
        documentDate: new Date(formData.date_reunion),
        company: { name: company?.name ?? '' },
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
      {/* En-tête */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">En-tête</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Numéro (ex. CR-2025-001-01)</Label>
              <Input value={generateDocumentNumber()} readOnly className="bg-gray-100" />
            </div>
            <div className="space-y-2">
              <Label>Numéro projet</Label>
              <Input
                placeholder="001"
                value={formData.numero_projet}
                onChange={(e) => setFormData({ ...formData, numero_projet: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Réunion n°</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="1"
                  value={formData.reunion_numero}
                  onChange={(e) => setFormData({ ...formData, reunion_numero: e.target.value })}
                />
                <span className="self-center">/</span>
                <Input
                  placeholder="12"
                  value={formData.reunion_total}
                  onChange={(e) => setFormData({ ...formData, reunion_total: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date de la réunion</Label>
              <Input
                type="date"
                value={formData.date_reunion}
                onChange={(e) => setFormData({ ...formData, date_reunion: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Heure début</Label>
              <Input
                type="time"
                value={formData.heure_debut}
                onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Heure fin</Label>
              <Input
                type="time"
                value={formData.heure_fin}
                onChange={(e) => setFormData({ ...formData, heure_fin: e.target.value })}
              />
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
              {lieuChantier && <p className="text-sm text-gray-500">Lieu (chantier) : {lieuChantier}</p>}
            </div>
            <div className="space-y-2">
              <Label>Météo</Label>
              <Select value={formData.meteo} onValueChange={(v) => setFormData({ ...formData, meteo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METEO_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participants */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Participants</h3>
            <Button type="button" variant="outline" size="sm" onClick={addParticipant}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter
            </Button>
          </div>
          <div className="space-y-3">
            {participants.map((p) => (
              <div key={p.id} className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end border rounded p-3 bg-gray-50">
                <Input placeholder="Nom" value={p.nom} onChange={(e) => updateParticipant(p.id, 'nom', e.target.value)} />
                <Input placeholder="Entreprise / Rôle" value={p.entreprise_role} onChange={(e) => updateParticipant(p.id, 'entreprise_role', e.target.value)} />
                <Select value={p.present} onValueChange={(v) => updateParticipant(p.id, 'present', v as 'Oui' | 'Non')}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Présent" /></SelectTrigger>
                  <SelectContent><SelectItem value="Oui">Oui</SelectItem><SelectItem value="Non">Non</SelectItem></SelectContent>
                </Select>
                <Select value={p.excuse} onValueChange={(v) => updateParticipant(p.id, 'excuse', v as 'Oui' | 'Non')}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Excusé" /></SelectTrigger>
                  <SelectContent><SelectItem value="Oui">Oui</SelectItem><SelectItem value="Non">Non</SelectItem></SelectContent>
                </Select>
                <Select value={p.convoque_non_present} onValueChange={(v) => updateParticipant(p.id, 'convoque_non_present', v as 'Oui' | 'Non')}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Convoqué NP" /></SelectTrigger>
                  <SelectContent><SelectItem value="Oui">Oui</SelectItem><SelectItem value="Non">Non</SelectItem></SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Checkbox id={`dest-${p.id}`} checked={p.destinataire} onCheckedChange={(c) => updateParticipant(p.id, 'destinataire', c === true)} />
                  <Label htmlFor={`dest-${p.id}`} className="text-xs">Destinataire CR</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeParticipant(p.id)} className="text-red-600 shrink-0"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Avancement général */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Avancement général</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Avancement global du chantier : {formData.avancement_global}%</Label>
              <Slider
                value={[formData.avancement_global]}
                onValueChange={([v]) => setFormData({ ...formData, avancement_global: v ?? 0 })}
                max={100}
                step={5}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Respect du planning</Label>
                <Select value={formData.respect_planning} onValueChange={(v) => setFormData({ ...formData, respect_planning: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLANNING_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Retard constaté (jours)</Label>
                <Input
                  placeholder="0"
                  value={formData.retard_jours}
                  onChange={(e) => setFormData({ ...formData, retard_jours: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prochaine réunion — Date</Label>
                <Input
                  type="date"
                  value={formData.prochaine_reunion_date}
                  onChange={(e) => setFormData({ ...formData, prochaine_reunion_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Prochaine réunion — Heure</Label>
                <Input
                  type="time"
                  value={formData.prochaine_reunion_heure}
                  onChange={(e) => setFormData({ ...formData, prochaine_reunion_heure: e.target.value })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avancement par lot */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Avancement par lot</h3>
            {uploading && <span className="text-sm text-gray-500">Upload...</span>}
            <Button type="button" variant="outline" size="sm" onClick={addLot}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter un lot
            </Button>
          </div>
          <div className="space-y-4">
            {lots.map((l) => (
              <div key={l.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Lot / Entreprise</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeLot(l.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label>Lot</Label>
                    <Select value={l.lot} onValueChange={(v) => updateLot(l.id, 'lot', v)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Choisir" /></SelectTrigger>
                      <SelectContent>
                        {LOTS.map((lot) => (
                          <SelectItem key={lot} value={lot}>{lot}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Entreprise</Label>
                    <Select value={l.entreprise} onValueChange={(v) => updateLot(l.id, 'entreprise', v)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Entreprise" /></SelectTrigger>
                      <SelectContent>
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Avancement {l.avancement}%</Label>
                    <Slider value={[l.avancement]} onValueChange={([v]) => updateLot(l.id, 'avancement', v ?? 0)} max={100} step={5} />
                  </div>
                  <div className="space-y-1">
                    <Label>Statut</Label>
                    <Select value={l.statut} onValueChange={(v) => updateLot(l.id, 'statut', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUT_LOT_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label>Travaux réalisés depuis la dernière réunion</Label>
                    <Textarea rows={2} value={l.travaux_realises} onChange={(e) => updateLot(l.id, 'travaux_realises', e.target.value)} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Travaux à réaliser pour la prochaine réunion</Label>
                    <Textarea rows={2} value={l.travaux_a_realiser} onChange={(e) => updateLot(l.id, 'travaux_a_realiser', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Effectif sur le chantier</Label>
                    <Input value={l.effectif} onChange={(e) => updateLot(l.id, 'effectif', e.target.value)} placeholder="Nombre" />
                  </div>
                  <div className="space-y-1">
                    <Label>Date prévue de fin du lot</Label>
                    <Input type="date" value={l.date_fin_prev} onChange={(e) => updateLot(l.id, 'date_fin_prev', e.target.value)} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Points bloquants</Label>
                    <Textarea rows={2} value={l.points_bloquants} onChange={(e) => updateLot(l.id, 'points_bloquants', e.target.value)} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Observations</Label>
                    <Textarea rows={2} value={l.observations} onChange={(e) => updateLot(l.id, 'observations', e.target.value)} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Photos</Label>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Input
                        type="file"
                        accept={ACCEPT_IMAGES}
                        className="max-w-[200px] text-sm"
                        disabled={!!uploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) await addPhotoToLot(l.id, file)
                          e.target.value = ''
                        }}
                      />
                      {l.photos.map((ph, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-sm bg-white border rounded px-2 py-1">
                          {ph.name}
                          <a href={ph.url} target="_blank" rel="noopener noreferrer" className="text-[#C5A572]"><Download className="h-3.5 w-3.5" /></a>
                          <button type="button" onClick={() => removePhotoFromLot(l.id, i)} className="text-red-600">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Points particuliers */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Points particuliers</h3>
            <Button type="button" variant="outline" size="sm" onClick={addPoint}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter
            </Button>
          </div>
          <div className="space-y-3">
            {points.map((p) => (
              <div key={p.id} className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end border rounded p-3 bg-gray-50">
                <Input placeholder="N°" value={p.numero} onChange={(e) => updatePoint(p.id, 'numero', e.target.value)} />
                <Input placeholder="Description" value={p.description} onChange={(e) => updatePoint(p.id, 'description', e.target.value)} />
                <Input placeholder="Responsable" value={p.responsable} onChange={(e) => updatePoint(p.id, 'responsable', e.target.value)} />
                <Input type="date" placeholder="Échéance" value={p.echeance} onChange={(e) => updatePoint(p.id, 'echeance', e.target.value)} />
                <Select value={p.statut} onValueChange={(v) => updatePoint(p.id, 'statut', v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUT_POINT_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-1">
                  <Input placeholder="Commentaire" value={p.commentaire} onChange={(e) => updatePoint(p.id, 'commentaire', e.target.value)} className="flex-1" />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removePoint(p.id)} className="text-red-600 shrink-0"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modifications / Travaux supplémentaires */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Modifications / Travaux supplémentaires</h3>
            <Button type="button" variant="outline" size="sm" onClick={addModification}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter
            </Button>
          </div>
          <div className="space-y-3">
            {modifications.map((m) => (
              <div key={m.id} className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end border rounded p-3 bg-gray-50">
                <Input placeholder="Description" value={m.description} onChange={(e) => updateModification(m.id, 'description', e.target.value)} />
                <Select value={m.demande_par} onValueChange={(v) => updateModification(m.id, 'demande_par', v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEMANDE_PAR_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Impact budget € HT" value={m.impact_budget} onChange={(e) => updateModification(m.id, 'impact_budget', e.target.value)} />
                <Input placeholder="Impact planning (jours)" value={m.impact_planning} onChange={(e) => updateModification(m.id, 'impact_planning', e.target.value)} />
                <Select value={m.statut} onValueChange={(v) => updateModification(m.id, 'statut', v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUT_MODIF_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-1">
                  <Input placeholder="Devis complémentaire réf." value={m.devis_reference} onChange={(e) => updateModification(m.id, 'devis_reference', e.target.value)} className="flex-1" />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeModification(m.id)} className="text-red-600 shrink-0"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Prochaine réunion (détail) */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Prochaine réunion</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.prochaine_reunion_date_fin || formData.prochaine_reunion_date}
                onChange={(e) => setFormData({ ...formData, prochaine_reunion_date_fin: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Heure</Label>
              <Input
                type="time"
                value={formData.prochaine_reunion_heure_fin || formData.prochaine_reunion_heure}
                onChange={(e) => setFormData({ ...formData, prochaine_reunion_heure_fin: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Points à traiter</Label>
              <Textarea rows={2} value={formData.prochaine_reunion_points} onChange={(e) => setFormData({ ...formData, prochaine_reunion_points: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Documents à préparer</Label>
              <Textarea rows={2} value={formData.prochaine_reunion_documents} onChange={(e) => setFormData({ ...formData, prochaine_reunion_documents: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diffusion */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Diffusion</h3>
          <p className="text-sm text-gray-500">Cocher les participants qui recevront le compte-rendu.</p>
          <div className="flex flex-wrap gap-4">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <Checkbox
                  id={`diff-${p.id}`}
                  checked={p.destinataire}
                  onCheckedChange={(c) => updateParticipant(p.id, 'destinataire', c === true)}
                />
                <Label htmlFor={`diff-${p.id}`} className="text-sm font-normal">
                  {p.nom || 'Sans nom'} {p.entreprise_role ? `(${p.entreprise_role})` : ''}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const previewContent = (
    <ProfessionalDocumentPreview
      documentNumber={generateDocumentNumber()}
      documentTitle="Compte-rendu de réunion de chantier"
      documentDate={new Date(formData.date_reunion)}
      companyName={company?.name}
      projectName={selectedProject?.name}
    >
      <div className="space-y-4 mt-6 text-sm">
        <p>Réunion n° {formData.reunion_numero} / {formData.reunion_total} — {formData.date_reunion} — {formData.heure_debut || '—'} à {formData.heure_fin || '—'}</p>
        <p>Lieu : {lieuChantier || '—'} — Météo : {formData.meteo}</p>
        <p>Avancement global : {formData.avancement_global}% — Planning : {formData.respect_planning}</p>
        <p>Prochaine réunion : {formData.prochaine_reunion_date_fin || formData.prochaine_reunion_date || '—'} à {formData.prochaine_reunion_heure_fin || formData.prochaine_reunion_heure || '—'}</p>
      </div>
    </ProfessionalDocumentPreview>
  )

  return (
    <BaseDocumentLayout
      title="Compte-rendu de réunion de chantier"
      formContent={formContent}
      previewContent={previewContent}
      onSave={handleSave}
      onPreviewPDF={handleDownloadPDF}
      isSaving={isSaving}
    />
  )
}
