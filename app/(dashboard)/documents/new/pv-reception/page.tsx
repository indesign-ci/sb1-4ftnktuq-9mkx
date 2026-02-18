'use client'

import { useState, useEffect, useMemo } from 'react'
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

const QUALITES_PRESENT = ['Maître d\'ouvrage', 'Maître d\'œuvre', 'Entreprise', 'Autre'] as const
const TYPES_RECEPTION = ['Pré-réception', 'Réception avec réserves', 'Réception sans réserve'] as const
const GRAVITE_OPTIONS = ['Mineure', 'Majeure', 'Bloquante'] as const
const QUALITE_TRAVAUX = ['Excellent', 'Bon', 'Satisfaisant', 'Insuffisant'] as const
const CONFORMITE_OPTIONS = ['Oui', 'Avec écarts mineurs', 'Non conforme'] as const
const PROPRETE_OPTIONS = ['Conforme', 'À améliorer', 'Insuffisant'] as const

const LOTS_PV = [
  'Démolition & Préparation',
  'Gros œuvre / Maçonnerie',
  'Plomberie / Sanitaires',
  'Électricité / Courants faibles',
  'Peinture / Enduits',
  'Revêtements de sol',
  'Revêtements muraux',
  'Menuiserie',
  'Serrurerie / Métallerie',
  'Cuisine',
  'Salle(s) de bain',
  'Mobilier',
  'Luminaires',
  'Honoraires maîtrise d\'œuvre',
  'Frais divers / Imprévus',
] as const

type PersonnePresente = { id: string; nom: string; qualite: string }
type Reserve = {
  id: string
  numero: number
  lot_entreprise: string
  localisation: string
  description: string
  photo_url: string
  photo_name: string
  gravite: string
  delai_reprise_jours: string
  date_limite_reprise: string
}
type SignatureEntreprise = { id: string; entreprise: string; date: string; signature: string; tampon: string }

const defaultPresent = (): PersonnePresente => ({ id: crypto.randomUUID(), nom: '', qualite: 'Maître d\'ouvrage' })
const defaultReserve = (numero: number): Reserve => ({
  id: crypto.randomUUID(),
  numero,
  lot_entreprise: '',
  localisation: '',
  description: '',
  photo_url: '',
  photo_name: '',
  gravite: 'Mineure',
  delai_reprise_jours: '',
  date_limite_reprise: '',
})
const defaultSignatureEntreprise = (): SignatureEntreprise => ({
  id: crypto.randomUUID(),
  entreprise: '',
  date: new Date().toISOString().split('T')[0],
  signature: '',
  tampon: '',
})

function addDays(dateStr: string, days: number): string {
  if (!dateStr || !days) return ''
  const d = new Date(dateStr)
  d.setDate(d.getDate() + Number(days))
  return d.toISOString().split('T')[0]
}

export default function PVReceptionPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [projects, setProjects] = useState<{ id: string; name: string; address?: string; city?: string; postal_code?: string; client_id?: string }[]>([])
  const [clients, setClients] = useState<{ id: string; first_name: string; last_name: string }[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [company, setCompany] = useState<{ name?: string } | null>(null)

  const [formData, setFormData] = useState({
    date_reception: new Date().toISOString().split('T')[0],
    heure: '',
    project_id: '',
    type_reception: 'Réception sans réserve',
    qualite_generale: 'Bon',
    conformite_plans: 'Oui',
    proprete: 'Conforme',
    observations_generales: '',
    decision: 'sans_reserve' as 'sans_reserve' | 'avec_reserves' | 'refusee',
    motif_refus: '',
    date_depart_garanties: '',
    signature_client_date: '',
    signature_client: '',
    signature_mo_date: '',
    signature_mo: '',
  })

  const [presents, setPresents] = useState<PersonnePresente[]>([defaultPresent()])
  const [reserves, setReserves] = useState<Reserve[]>([defaultReserve(1)])
  const [signaturesEntreprises, setSignaturesEntreprises] = useState<SignatureEntreprise[]>([defaultSignatureEntreprise()])

  useEffect(() => {
    if (!profile?.company_id) return
    const load = async () => {
      try {
        const [projRes, clientsRes, supRes, companyRes] = await Promise.all([
          supabase.from('projects').select('id, name, address, city, postal_code, client_id').eq('company_id', profile.company_id),
          supabase.from('clients').select('id, first_name, last_name').eq('company_id', profile.company_id),
          supabase.from('suppliers').select('id, name').eq('company_id', profile.company_id).order('name'),
          supabase.from('companies').select('name').eq('id', profile.company_id).maybeSingle(),
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
    return `PVR-${year}-${seq}`
  }

  const selectedProject = projects.find((p) => p.id === formData.project_id)
  const selectedClient = selectedProject?.client_id ? clients.find((c) => c.id === selectedProject.client_id) : null
  const adresseChantier = selectedProject
    ? [selectedProject.address, selectedProject.postal_code, selectedProject.city].filter(Boolean).join(', ') || selectedProject.name
    : ''
  const clientName = selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : ''

  const dateDepartGaranties = formData.date_depart_garanties || formData.date_reception
  const garantieParfaitAchevement = useMemo(() => addDays(dateDepartGaranties, 365), [dateDepartGaranties])
  const garantieBiennale = useMemo(() => addDays(dateDepartGaranties, 365 * 2), [dateDepartGaranties])
  const garantieDecennale = useMemo(() => addDays(dateDepartGaranties, 365 * 10), [dateDepartGaranties])

  const uploadFile = async (file: File, key: string): Promise<{ url: string; name: string }> => {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Fichier trop volumineux (max ${MAX_FILE_MB} Mo)`)
      throw new Error('File too large')
    }
    const companyId = profile?.company_id || 'anon'
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const path = `pv-reception/${companyId}/${Date.now()}_${safeName}`
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

  const addPresent = () => setPresents((prev) => [...prev, defaultPresent()])
  const removePresent = (id: string) => setPresents((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev))
  const updatePresent = (id: string, field: keyof PersonnePresente, value: string) => {
    setPresents((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const addReserve = () => setReserves((prev) => [...prev, defaultReserve(prev.length + 1)])
  const removeReserve = (id: string) => {
    setReserves((prev) => {
      const next = prev.filter((r) => r.id !== id)
      return next.map((r, i) => ({ ...r, numero: i + 1 }))
    })
  }
  const updateReserve = (id: string, field: keyof Reserve, value: string | number) => {
    setReserves((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }
  const updateReserveDateLimite = (id: string, delaiJours: string) => {
    const jours = parseInt(delaiJours, 10)
    const dateLimite = isNaN(jours) ? '' : addDays(formData.date_reception, jours)
    setReserves((prev) => prev.map((r) => (r.id === id ? { ...r, delai_reprise_jours: delaiJours, date_limite_reprise: dateLimite } : r)))
  }

  const addSignatureEntreprise = () => setSignaturesEntreprises((prev) => [...prev, defaultSignatureEntreprise()])
  const removeSignatureEntreprise = (id: string) => setSignaturesEntreprises((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev))
  const updateSignatureEntreprise = (id: string, field: keyof SignatureEntreprise, value: string) => {
    setSignaturesEntreprises((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
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
        document_type: 'pv_reception_travaux',
        document_phase: 'phase7',
        document_number: documentNumber,
        title: `PV Réception - ${selectedProject?.name ?? ''}`,
        project_id: formData.project_id,
        client_id: selectedProject?.client_id ?? null,
        status: 'draft',
        document_data: {
          formData,
          presents,
          reserves,
          signaturesEntreprises,
          garantieParfaitAchevement,
          garantieBiennale,
          garantieDecennale,
        },
      })
      if (error) throw error
      toast.success('PV de réception sauvegardé en brouillon')
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
      const presentsText = presents.map((p) => `${p.nom || '—'} (${p.qualite})`).join(', ')
      const reservesText = reserves
        .map(
          (r) =>
            `Réserve n°${r.numero} | Lot/Entreprise: ${r.lot_entreprise} | Localisation: ${r.localisation} | ${r.description} | Gravité: ${r.gravite} | Délai: ${r.delai_reprise_jours} j | Date limite: ${r.date_limite_reprise}`
        )
        .join('\n')
      const decisionText =
        formData.decision === 'sans_reserve'
          ? 'Sans réserve — les travaux sont conformes'
          : formData.decision === 'avec_reserves'
            ? 'Avec réserves — la liste des réserves devra être levée dans les délais impartis'
            : `Refusée — les travaux ne sont pas conformes. Motif: ${formData.motif_refus || '—'}`
      const sections = [
        {
          title: 'En-tête',
          content: `Date: ${formData.date_reception} à ${formData.heure || '—'}\nProjet: ${selectedProject.name}\nAdresse: ${adresseChantier}\nClient: ${clientName}`,
        },
        { title: 'Personnes présentes', content: presentsText || '—' },
        { title: 'Type de réception', content: formData.type_reception },
        { title: 'Réserves', content: reservesText || 'Aucune' },
        {
          title: 'Observations générales',
          content: `Qualité: ${formData.qualite_generale} | Conformité: ${formData.conformite_plans} | Propreté: ${formData.proprete}\n${formData.observations_generales || ''}`,
        },
        { title: 'Décision', content: decisionText },
        {
          title: 'Garanties',
          content: `Date départ: ${dateDepartGaranties}\nParfait achèvement (1 an): jusqu'au ${garantieParfaitAchevement}\nBiennale (2 ans): jusqu'au ${garantieBiennale}\nDécennale (10 ans): jusqu'au ${garantieDecennale}`,
        },
        {
          title: 'Signatures',
          content: `Maître d'Ouvrage: ${formData.signature_client_date} - ${formData.signature_client}\nMaître d'Œuvre: ${formData.signature_mo_date} - ${formData.signature_mo}\nEntreprises: ${signaturesEntreprises.map((s) => `${s.entreprise} - ${s.date} - ${s.signature}`).join(' ; ')}`,
        },
      ]
      await generateProfessionalDocumentPDF({
        documentNumber: generateDocumentNumber(),
        documentTitle: 'Procès-verbal de réception des travaux',
        documentDate: new Date(formData.date_reception),
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
              <Label>Date de la réception</Label>
              <Input type="date" value={formData.date_reception} onChange={(e) => setFormData({ ...formData, date_reception: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Heure</Label>
              <Input type="time" value={formData.heure} onChange={(e) => setFormData({ ...formData, heure: e.target.value })} />
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
              {adresseChantier && <p className="text-sm text-gray-500">Adresse : {adresseChantier}</p>}
              {clientName && <p className="text-sm text-gray-500">Client : {clientName}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Personnes présentes</h3>
            <button type="button" onClick={addPresent} className="text-sm text-[#C5A572] hover:underline flex items-center gap-1">
              <Plus className="h-4 w-4" /> Ajouter
            </button>
          </div>
          <div className="space-y-3">
            {presents.map((p) => (
              <div key={p.id} className="flex gap-3 items-center flex-wrap">
                <Input placeholder="Nom" value={p.nom} onChange={(e) => updatePresent(p.id, 'nom', e.target.value)} className="w-48" />
                <Select value={p.qualite} onValueChange={(v) => updatePresent(p.id, 'qualite', v)}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Qualité" /></SelectTrigger>
                  <SelectContent>
                    {QUALITES_PRESENT.map((q) => (
                      <SelectItem key={q} value={q}>{q}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button type="button" onClick={() => removePresent(p.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Type de réception</h3>
          <Select value={formData.type_reception} onValueChange={(v) => setFormData({ ...formData, type_reception: v })}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPES_RECEPTION.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Réserves</h3>
            {uploading && <span className="text-sm text-gray-500">Upload...</span>}
            <button type="button" onClick={addReserve} className="text-sm text-[#C5A572] hover:underline flex items-center gap-1">
              <Plus className="h-4 w-4" /> Ajouter une réserve
            </button>
          </div>
          <div className="space-y-4">
            {reserves.map((r) => (
              <div key={r.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Réserve n°{r.numero}</span>
                  <button type="button" onClick={() => removeReserve(r.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label>Lot / Entreprise concernée</Label>
                    <Select value={r.lot_entreprise} onValueChange={(v) => updateReserve(r.id, 'lot_entreprise', v)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Choisir" /></SelectTrigger>
                      <SelectContent>
                        {LOTS_PV.map((lot) => (
                          <SelectItem key={lot} value={lot}>{lot}</SelectItem>
                        ))}
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Localisation (pièce)</Label>
                    <Input value={r.localisation} onChange={(e) => updateReserve(r.id, 'localisation', e.target.value)} placeholder="Ex: Salon" />
                  </div>
                  <div className="space-y-1">
                    <Label>Gravité</Label>
                    <Select value={r.gravite} onValueChange={(v) => updateReserve(r.id, 'gravite', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GRAVITE_OPTIONS.map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Description de la réserve</Label>
                    <Textarea rows={2} value={r.description} onChange={(e) => updateReserve(r.id, 'description', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Délai reprise (jours)</Label>
                    <Input
                      placeholder="Ex: 30"
                      value={r.delai_reprise_jours}
                      onChange={(e) => {
                        const v = e.target.value
                        updateReserve(r.id, 'delai_reprise_jours', v)
                        updateReserveDateLimite(r.id, v)
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Date limite de reprise</Label>
                    <Input type="date" readOnly className="bg-gray-100" value={r.date_limite_reprise} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Photo</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept={ACCEPT_IMAGES}
                        className="max-w-[200px] text-sm"
                        disabled={!!uploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          try {
                            const { url, name } = await uploadFile(file, `reserve-${r.id}`)
                            updateReserve(r.id, 'photo_url', url)
                            updateReserve(r.id, 'photo_name', name)
                            toast.success('Photo ajoutée')
                          } catch {
                            toast.error('Erreur upload')
                          }
                          e.target.value = ''
                        }}
                      />
                      {(r.photo_url || r.photo_name) && (
                        <span className="flex items-center gap-1 text-sm">
                          {r.photo_name}
                          <a href={r.photo_url} target="_blank" rel="noopener noreferrer" className="text-[#C5A572]"><Download className="h-3.5 w-3.5" /></a>
                          <button type="button" onClick={() => { updateReserve(r.id, 'photo_url', ''); updateReserve(r.id, 'photo_name', '') }} className="text-red-600 text-xs">Suppr.</button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Observations générales</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Qualité générale des travaux</Label>
              <Select value={formData.qualite_generale} onValueChange={(v) => setFormData({ ...formData, qualite_generale: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QUALITE_TRAVAUX.map((q) => (
                    <SelectItem key={q} value={q}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conformité par rapport aux plans</Label>
              <Select value={formData.conformite_plans} onValueChange={(v) => setFormData({ ...formData, conformite_plans: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONFORMITE_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Propreté du chantier</Label>
              <Select value={formData.proprete} onValueChange={(v) => setFormData({ ...formData, proprete: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROPRETE_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observations</Label>
            <Textarea rows={3} value={formData.observations_generales} onChange={(e) => setFormData({ ...formData, observations_generales: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Décision</h3>
          <RadioGroup
            value={formData.decision}
            onValueChange={(v) => setFormData({ ...formData, decision: v as 'sans_reserve' | 'avec_reserves' | 'refusee' })}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sans_reserve" id="dec-sans" />
              <Label htmlFor="dec-sans" className="font-normal">Sans réserve — les travaux sont conformes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="avec_reserves" id="dec-avec" />
              <Label htmlFor="dec-avec" className="font-normal">Avec réserves — la liste des réserves ci-dessus devra être levée dans les délais impartis</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="refusee" id="dec-refusee" />
              <Label htmlFor="dec-refusee" className="font-normal">Refusée — les travaux ne sont pas conformes</Label>
            </div>
          </RadioGroup>
          {formData.decision === 'refusee' && (
            <div className="space-y-2 pl-6">
              <Label>Motif</Label>
              <Input placeholder="Motif du refus" value={formData.motif_refus} onChange={(e) => setFormData({ ...formData, motif_refus: e.target.value })} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Garanties</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Date de départ des garanties</Label>
              <Input type="date" value={dateDepartGaranties} onChange={(e) => setFormData({ ...formData, date_depart_garanties: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Garantie de parfait achèvement (1 an)</Label>
              <Input readOnly className="bg-gray-100" value={garantieParfaitAchevement ? `jusqu'au ${garantieParfaitAchevement}` : '—'} />
            </div>
            <div className="space-y-2">
              <Label>Garantie biennale (2 ans)</Label>
              <Input readOnly className="bg-gray-100" value={garantieBiennale ? `jusqu'au ${garantieBiennale}` : '—'} />
            </div>
            <div className="space-y-2">
              <Label>Garantie décennale (10 ans)</Label>
              <Input readOnly className="bg-gray-100" value={garantieDecennale ? `jusqu'au ${garantieDecennale}` : '—'} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Signatures</h3>
            <button type="button" onClick={addSignatureEntreprise} className="text-sm text-[#C5A572] hover:underline flex items-center gap-1">
              <Plus className="h-4 w-4" /> Ajouter entreprise
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Maître d'Ouvrage (Client) — Date</Label>
                <Input type="date" value={formData.signature_client_date} onChange={(e) => setFormData({ ...formData, signature_client_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Maître d'Ouvrage — Signature</Label>
                <Input placeholder="Signature" value={formData.signature_client} onChange={(e) => setFormData({ ...formData, signature_client: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Maître d'Œuvre (Architecte) — Date</Label>
                <Input type="date" value={formData.signature_mo_date} onChange={(e) => setFormData({ ...formData, signature_mo_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Maître d'Œuvre — Signature</Label>
                <Input placeholder="Signature" value={formData.signature_mo} onChange={(e) => setFormData({ ...formData, signature_mo: e.target.value })} />
              </div>
            </div>
            <div className="border-t pt-4 space-y-3">
              <Label>Entreprise(s) — date, signature, tampon</Label>
              {signaturesEntreprises.map((s) => (
                <div key={s.id} className="flex flex-wrap gap-3 items-end">
                  <Input placeholder="Entreprise" value={s.entreprise} onChange={(e) => updateSignatureEntreprise(s.id, 'entreprise', e.target.value)} className="w-48" />
                  <Input type="date" value={s.date} onChange={(e) => updateSignatureEntreprise(s.id, 'date', e.target.value)} className="w-36" />
                  <Input placeholder="Signature" value={s.signature} onChange={(e) => updateSignatureEntreprise(s.id, 'signature', e.target.value)} className="w-32" />
                  <Input placeholder="Tampon" value={s.tampon} onChange={(e) => updateSignatureEntreprise(s.id, 'tampon', e.target.value)} className="w-32" />
                  <button type="button" onClick={() => removeSignatureEntreprise(s.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const decisionLabel =
    formData.decision === 'sans_reserve'
      ? 'Sans réserve'
      : formData.decision === 'avec_reserves'
        ? 'Avec réserves'
        : 'Refusée'

  const previewContent = (
    <ProfessionalDocumentPreview
      documentNumber={generateDocumentNumber()}
      documentTitle="Procès-verbal de réception des travaux"
      documentDate={new Date(formData.date_reception)}
      companyName={company?.name}
      clientName={clientName}
      projectName={selectedProject?.name}
    >
      <div className="space-y-4 mt-6 text-sm">
        <p>Date : {formData.date_reception} à {formData.heure || '—'} — Type : {formData.type_reception}</p>
        <p>Qualité : {formData.qualite_generale} — Conformité : {formData.conformite_plans} — Décision : {decisionLabel}</p>
        <p>Garanties : Parfait achèvement jusqu'au {garantieParfaitAchevement} — Décennale jusqu'au {garantieDecennale}</p>
      </div>
    </ProfessionalDocumentPreview>
  )

  return (
    <BaseDocumentLayout
      title="Procès-verbal de réception des travaux"
      formContent={formContent}
      previewContent={previewContent}
      onSave={handleSave}
      onPreviewPDF={handleDownloadPDF}
      isSaving={isSaving}
    />
  )
}
