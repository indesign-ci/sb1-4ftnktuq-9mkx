'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { generateProfessionalDocumentPDF } from '@/lib/pdf/professional-document-pdf'
import { Upload, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const CIVILITIES = ['M.', 'Mme', 'M. et Mme', 'Société']
const SOURCES = [
  'Instagram', 'Site web', 'Bouche-à-oreille', 'Recommandation', 'Salon pro', 'Presse', 'Google', 'LinkedIn', 'Autre',
]
const PROPERTY_TYPES = [
  'Appartement', 'Maison', 'Duplex', 'Loft', 'Penthouse', 'Villa',
  'Bureau', 'Commerce', 'Restaurant', 'Hôtel', 'Autre',
]
const CONDITIONS = ['Neuf', 'Bon état', 'À rafraîchir', 'À rénover entièrement', 'Brut/Coque']
const DIAGNOSTICS = ['DPE', 'Amiante', 'Plomb', 'Électricité', 'Gaz', 'Termites']
const NATURE_TRAVAUX = [
  'Rénovation complète', 'Rénovation partielle', 'Décoration / Ameublement uniquement', 'Cuisine', 'Salle(s) de bain',
  'Suite parentale', 'Dressing', 'Extension', 'Aménagement combles', 'Création verrière', 'Aménagement extérieur / terrasse',
  'Bureaux professionnels', 'Commerce / Restaurant', 'Hôtellerie', 'Autre',
]
const PIECES = [
  'Entrée', 'Salon', 'Salle à manger', 'Cuisine', 'Chambre parentale', 'Chambre(s) enfant(s)', 'Chambre(s) ami(s)',
  'Bureau', 'Bibliothèque', 'Salle de bain', 'Salle d\'eau', 'WC', 'Buanderie', 'Dressing', 'Couloir',
  'Terrasse/Balcon', 'Jardin', 'Garage', 'Cave', 'Autre',
]
const STYLES = [
  'Contemporain', 'Classique', 'Art Déco', 'Scandinave', 'Industriel', 'Bohème', 'Japandi', 'Minimaliste',
  'Méditerranéen', 'Luxe', 'Mid-Century Modern', 'Wabi-Sabi', 'Éclectique', 'Autre',
]
const NEXT_STEPS = [
  'Visite technique', 'Envoi proposition de mission', 'Envoi questionnaire détaillé', 'Rappeler', 'En attente', 'Décliné',
]

const defaultForm = {
  client_id: '',
  project_id: '',
  civility: '',
  fullName: '',
  company: '',
  email: '',
  phone: '',
  phoneSecondary: '',
  address: '',
  source: '',
  howKnownAgency: '',
  propertyType: '',
  propertyAddress: '',
  floorAccess: '',
  surface: '',
  rooms: '',
  yearBuilt: '',
  condition: '',
  copropriete: false,
  syndicName: '',
  syndicPhone: '',
  constraints: '',
  diagnostics: [] as string[],
  natureTravaux: [] as string[],
  natureTravauxOther: '',
  pieces: [] as string[],
  piecesOther: '',
  style: [] as string[],
  styleOther: '',
  colorsPref: '',
  colorsAvoid: '',
  materials: '',
  inspirations: '',
  keepFurniture: false,
  keepFurnitureList: '',
  animals: false,
  animalsType: '',
  occupantsAdults: '',
  occupantsKids: '',
  occupantsAges: '',
  budgetGlobal: '',
  budgetMin: '',
  budgetMax: '',
  budgetMobilierInclus: true,
  budgetDecorationInclus: true,
  deadline: '',
  planningConstraints: '',
  hebergementSurPlace: true,
  notesRdv: '',
  impression: '',
  priorites: '',
  vigilance: '',
  photoUrls: [] as string[],
  nextStep: '',
  relanceDate: '',
  architectId: '',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg p-5 mb-6 bg-[#F5F5F5]">
      <h2 className="text-[#C5A572] font-semibold text-lg border-b border-[#C5A572]/40 pb-2 mb-4">{title}</h2>
      {children}
    </div>
  )
}

export default function BriefClientPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const { profile } = useAuth()
  const [form, setForm] = useState(defaultForm)
  const [clients, setClients] = useState<{ id: string; first_name: string; last_name: string; email?: string; phone?: string; address?: string }[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [company, setCompany] = useState<{ name: string; address?: string; phone?: string; email?: string; logo_url?: string; siret?: string } | null>(null)
  const [architects, setArchitects] = useState<{ id: string; first_name: string | null; last_name: string | null }[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [docNumber, setDocNumber] = useState('')
  const [uploading, setUploading] = useState(false)

  const update = (key: keyof typeof form, value: string | number | boolean | string[]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const toggleArray = (key: 'diagnostics' | 'natureTravaux' | 'pieces' | 'style', value: string) => {
    setForm((f) => {
      const arr = f[key] as string[]
      const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]
      return { ...f, [key]: next }
    })
  }

  const generateDocumentNumber = () => {
    const y = new Date().getFullYear()
    const n = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
    return `BC-${y}-${n}`
  }

  useEffect(() => {
    if (!profile?.company_id) return
    const load = async () => {
      const [cRes, pRes, coRes, aRes] = await Promise.all([
        supabase.from('clients').select('id, first_name, last_name, email, phone, address').eq('company_id', profile.company_id),
        supabase.from('projects').select('id, name').eq('company_id', profile.company_id).is('deleted_at', null),
        supabase.from('companies').select('name, address, phone, email, logo_url').eq('id', profile.company_id).maybeSingle(),
        supabase.from('profiles').select('id, first_name, last_name').eq('company_id', profile.company_id).eq('is_active', true),
      ])
      if (cRes.data) setClients(cRes.data)
      if (pRes.data) setProjects(pRes.data)
      if (coRes.data) setCompany(coRes.data as typeof company)
      if (aRes.data) setArchitects(aRes.data)
    }
    load()
  }, [profile?.company_id])

  useEffect(() => {
    if (editId) {
      supabase
        .from('professional_documents')
        .select('*')
        .eq('id', editId)
        .single()
        .then(({ data }) => {
          if (data) {
            setDocNumber(data.document_number)
            setForm({ ...defaultForm, ...(data.document_data as object), client_id: data.client_id || '', project_id: data.project_id || '' })
          }
        })
    } else {
      setDocNumber(generateDocumentNumber())
    }
  }, [editId])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        company_id: profile?.company_id,
        created_by: profile?.id,
        document_type: 'brief_client',
        document_phase: 'phase1',
        document_number: docNumber,
        title: `Fiche Premier Contact - ${form.fullName || 'Sans nom'}`,
        client_id: form.client_id || null,
        project_id: form.project_id || null,
        status: 'draft',
        document_data: form,
      }
      if (editId) {
        const { error } = await supabase.from('professional_documents').update(payload).eq('id', editId)
        if (error) throw error
        toast.success('Brouillon mis à jour')
      } else {
        const { error } = await supabase.from('professional_documents').insert(payload)
        if (error) throw error
        toast.success('Brouillon enregistré')
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedClient = clients.find((c) => c.id === form.client_id)
  const selectedProject = projects.find((p) => p.id === form.project_id)
  const clientName = form.fullName || (selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : '')
  const projectName = selectedProject?.name || ''

  const handleDownloadPDF = async () => {
    try {
      const sections: { title: string; content: string | { label: string; value: string }[] }[] = []

      const infoClient: { label: string; value: string }[] = []
      if (form.civility || form.fullName) infoClient.push({ label: 'Client', value: [form.civility, form.fullName].filter(Boolean).join(' ') })
      if (form.company) infoClient.push({ label: 'Société', value: form.company })
      if (form.email) infoClient.push({ label: 'Email', value: form.email })
      if (form.phone) infoClient.push({ label: 'Téléphone', value: form.phone })
      if (form.phoneSecondary) infoClient.push({ label: 'Tél. secondaire', value: form.phoneSecondary })
      if (form.address) infoClient.push({ label: 'Adresse', value: form.address })
      if (form.source) infoClient.push({ label: 'Source', value: form.source })
      if (form.howKnownAgency) infoClient.push({ label: 'Comment connu l\'agence', value: form.howKnownAgency })
      if (infoClient.length) sections.push({ title: 'Informations Client', content: infoClient })

      const leBien: { label: string; value: string }[] = []
      if (form.propertyType) leBien.push({ label: 'Type de bien', value: form.propertyType })
      if (form.propertyAddress) leBien.push({ label: 'Adresse du bien', value: form.propertyAddress })
      if (form.floorAccess) leBien.push({ label: 'Étage / Accès', value: form.floorAccess })
      if (form.surface) leBien.push({ label: 'Surface', value: `${form.surface} m²` })
      if (form.rooms) leBien.push({ label: 'Pièces', value: form.rooms })
      if (form.yearBuilt) leBien.push({ label: 'Année construction', value: form.yearBuilt })
      if (form.condition) leBien.push({ label: 'État', value: form.condition })
      leBien.push({ label: 'Copropriété', value: form.copropriete ? 'Oui' : 'Non' })
      if (form.copropriete && (form.syndicName || form.syndicPhone)) leBien.push({ label: 'Syndic', value: [form.syndicName, form.syndicPhone].filter(Boolean).join(' — ') })
      if (form.constraints) leBien.push({ label: 'Contraintes techniques', value: form.constraints })
      if (form.diagnostics.length) leBien.push({ label: 'Diagnostics', value: form.diagnostics.join(', ') })
      if (leBien.length) sections.push({ title: 'Le Bien', content: leBien })

      const leProjet: { label: string; value: string }[] = []
      if (form.natureTravaux.length) leProjet.push({ label: 'Nature des travaux', value: [...form.natureTravaux, form.natureTravauxOther].filter(Boolean).join(', ') })
      if (form.pieces.length) leProjet.push({ label: 'Pièces concernées', value: [...form.pieces, form.piecesOther].filter(Boolean).join(', ') })
      if (form.style.length) leProjet.push({ label: 'Style', value: [...form.style, form.styleOther].filter(Boolean).join(', ') })
      if (form.colorsPref) leProjet.push({ label: 'Couleurs préférées', value: form.colorsPref })
      if (form.colorsAvoid) leProjet.push({ label: 'Couleurs à éviter', value: form.colorsAvoid })
      if (form.materials) leProjet.push({ label: 'Matériaux', value: form.materials })
      if (form.inspirations) leProjet.push({ label: 'Inspirations', value: form.inspirations })
      if (form.keepFurniture) leProjet.push({ label: 'Mobilier à conserver', value: form.keepFurnitureList || 'Oui' })
      if (form.animals) leProjet.push({ label: 'Animaux', value: form.animalsType || 'Oui' })
      if (form.occupantsAdults || form.occupantsKids) leProjet.push({ label: 'Occupants', value: [form.occupantsAdults && `${form.occupantsAdults} adulte(s)`, form.occupantsKids && form.occupantsAges && `Enfants: ${form.occupantsKids} (${form.occupantsAges})`].filter(Boolean).join(' — ') })
      if (leProjet.length) sections.push({ title: 'Le Projet', content: leProjet })

      const budget: { label: string; value: string }[] = []
      if (form.budgetGlobal) budget.push({ label: 'Budget global', value: `${form.budgetGlobal} €` })
      if (form.budgetMin || form.budgetMax) budget.push({ label: 'Fourchette', value: [form.budgetMin, form.budgetMax].filter(Boolean).join(' à ') + ' €' })
      budget.push({ label: 'Mobilier inclus', value: form.budgetMobilierInclus ? 'Oui' : 'Non' })
      budget.push({ label: 'Décoration incluse', value: form.budgetDecorationInclus ? 'Oui' : 'Non' })
      if (form.deadline) budget.push({ label: 'Échéance', value: form.deadline })
      if (form.planningConstraints) budget.push({ label: 'Contraintes planning', value: form.planningConstraints })
      budget.push({ label: 'Hébergement pendant travaux', value: form.hebergementSurPlace ? 'Sur place' : 'Absent' })
      sections.push({ title: 'Budget & Planning', content: budget })

      const notes: string[] = []
      if (form.notesRdv) notes.push(form.notesRdv)
      if (form.impression) notes.push(`Impression : ${form.impression}`)
      if (form.priorites) notes.push(`Priorités : ${form.priorites}`)
      if (form.vigilance) notes.push(`Vigilance : ${form.vigilance}`)
      if (notes.length) sections.push({ title: 'Notes & Observations', content: notes.join('\n\n') })

      const suite: { label: string; value: string }[] = []
      if (form.nextStep) suite.push({ label: 'Prochaine étape', value: form.nextStep })
      if (form.relanceDate) suite.push({ label: 'Date de relance', value: form.relanceDate })
      const arch = architects.find((a) => a.id === form.architectId)
      if (arch) suite.push({ label: 'Architecte assigné', value: [arch.first_name, arch.last_name].filter(Boolean).join(' ') })
      if (suite.length) sections.push({ title: 'Suite à donner', content: suite })

      await generateProfessionalDocumentPDF({
        documentNumber: docNumber,
        documentTitle: 'FICHE DE PREMIER CONTACT / BRIEF CLIENT',
        documentDate: new Date(),
        company: {
          name: company?.name || 'Votre Entreprise',
          address: company?.address,
          phone: company?.phone,
          email: company?.email,
          logo_url: company?.logo_url,
        },
        client: clientName ? { name: clientName, address: form.address, phone: form.phone, email: form.email } : undefined,
        projectName: projectName || undefined,
        sections,
      })
      toast.success('PDF généré')
    } catch {
      toast.error('Erreur génération PDF')
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length || !profile?.company_id) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (let i = 0; i < Math.min(files.length, 10); i++) {
        const file = files[i]
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `${profile.company_id}/brief-photos/${Date.now()}-${i}.${ext}`
        const { error } = await supabase.storage.from('photos').upload(path, file)
        if (error) throw error
        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path)
        urls.push(publicUrl)
      }
      update('photoUrls', [...form.photoUrls, ...urls])
      toast.success('Photo(s) ajoutée(s)')
    } catch {
      toast.error('Erreur upload')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const formContent = (
    <div className="max-w-4xl space-y-2">
      <Card className="mb-4">
        <CardContent className="pt-6">
          <Label className="mb-2 block">Lier à un client existant (optionnel)</Label>
          <Select value={form.client_id} onValueChange={(v) => update('client_id', v)}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Aucun</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label className="mb-2 mt-4 block">Lier à un projet (optionnel)</Label>
          <Select value={form.project_id} onValueChange={(v) => update('project_id', v)}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un projet" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Aucun</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Section title="Informations Client">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Civilité</Label>
            <Select value={form.civility} onValueChange={(v) => update('civility', v)}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>{CIVILITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nom complet</Label>
            <Input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Nom complet" />
          </div>
          <div>
            <Label>Société (si professionnel)</Label>
            <Input value={form.company} onChange={(e) => update('company', e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </div>
          <div>
            <Label>Téléphone principal</Label>
            <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </div>
          <div>
            <Label>Téléphone secondaire</Label>
            <Input value={form.phoneSecondary} onChange={(e) => update('phoneSecondary', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Adresse postale</Label>
            <Textarea value={form.address} onChange={(e) => update('address', e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Source de contact</Label>
            <Select value={form.source} onValueChange={(v) => update('source', v)}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Comment avez-vous connu l&apos;agence ?</Label>
            <Textarea value={form.howKnownAgency} onChange={(e) => update('howKnownAgency', e.target.value)} rows={2} />
          </div>
        </div>
      </Section>

      <Section title="Le Bien">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Type de bien</Label>
            <Select value={form.propertyType} onValueChange={(v) => update('propertyType', v)}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>{PROPERTY_TYPES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Adresse du bien</Label>
            <Textarea value={form.propertyAddress} onChange={(e) => update('propertyAddress', e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Étage / Accès</Label>
            <Input value={form.floorAccess} onChange={(e) => update('floorAccess', e.target.value)} />
          </div>
          <div>
            <Label>Surface approximative (m²)</Label>
            <Input type="number" value={form.surface} onChange={(e) => update('surface', e.target.value)} />
          </div>
          <div>
            <Label>Nombre de pièces</Label>
            <Input value={form.rooms} onChange={(e) => update('rooms', e.target.value)} />
          </div>
          <div>
            <Label>Année de construction</Label>
            <Input value={form.yearBuilt} onChange={(e) => update('yearBuilt', e.target.value)} placeholder="Ex: 1920" />
          </div>
          <div>
            <Label>État actuel</Label>
            <Select value={form.condition} onValueChange={(v) => update('condition', v)}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.copropriete} onCheckedChange={(v) => update('copropriete', v)} />
            <Label>Copropriété</Label>
          </div>
          {form.copropriete && (
            <>
              <div>
                <Label>Syndic (nom)</Label>
                <Input value={form.syndicName} onChange={(e) => update('syndicName', e.target.value)} />
              </div>
              <div>
                <Label>Syndic (téléphone)</Label>
                <Input value={form.syndicPhone} onChange={(e) => update('syndicPhone', e.target.value)} />
              </div>
            </>
          )}
          <div className="md:col-span-2">
            <Label>Contraintes techniques connues</Label>
            <Textarea value={form.constraints} onChange={(e) => update('constraints', e.target.value)} rows={3} />
          </div>
          <div className="md:col-span-2">
            <Label>Diagnostics disponibles</Label>
            <div className="flex flex-wrap gap-3">
              {DIAGNOSTICS.map((d) => (
                <label key={d} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={form.diagnostics.includes(d)} onCheckedChange={() => toggleArray('diagnostics', d)} />
                  <span className="text-sm">{d}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Le Projet">
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Nature des travaux</Label>
            <div className="flex flex-wrap gap-3">
              {NATURE_TRAVAUX.map((n) => (
                <label key={n} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={form.natureTravaux.includes(n)} onCheckedChange={() => toggleArray('natureTravaux', n)} />
                  <span className="text-sm">{n}</span>
                </label>
              ))}
            </div>
            {form.natureTravaux.includes('Autre') && (
              <Input className="mt-2" placeholder="Précisez autre" value={form.natureTravauxOther} onChange={(e) => update('natureTravauxOther', e.target.value)} />
            )}
          </div>
          <div>
            <Label className="mb-2 block">Pièces concernées</Label>
            <div className="flex flex-wrap gap-3">
              {PIECES.map((p) => (
                <label key={p} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={form.pieces.includes(p)} onCheckedChange={() => toggleArray('pieces', p)} />
                  <span className="text-sm">{p}</span>
                </label>
              ))}
            </div>
            {form.pieces.includes('Autre') && (
              <Input className="mt-2" placeholder="Précisez autre" value={form.piecesOther} onChange={(e) => update('piecesOther', e.target.value)} />
            )}
          </div>
          <div>
            <Label className="mb-2 block">Style souhaité</Label>
            <div className="flex flex-wrap gap-3">
              {STYLES.map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={form.style.includes(s)} onCheckedChange={() => toggleArray('style', s)} />
                  <span className="text-sm">{s}</span>
                </label>
              ))}
            </div>
            {form.style.includes('Autre') && (
              <Input className="mt-2" placeholder="Précisez autre" value={form.styleOther} onChange={(e) => update('styleOther', e.target.value)} />
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Couleurs préférées</Label>
              <Input value={form.colorsPref} onChange={(e) => update('colorsPref', e.target.value)} />
            </div>
            <div>
              <Label>Couleurs à éviter</Label>
              <Input value={form.colorsAvoid} onChange={(e) => update('colorsAvoid', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Matériaux appréciés</Label>
              <Input value={form.materials} onChange={(e) => update('materials', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Inspirations (magazines, Instagram, hôtels…)</Label>
              <Textarea value={form.inspirations} onChange={(e) => update('inspirations', e.target.value)} rows={2} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.keepFurniture} onCheckedChange={(v) => update('keepFurniture', v)} />
              <Label>Mobilier existant à conserver</Label>
            </div>
            {form.keepFurniture && (
              <div className="md:col-span-2">
                <Label>Liste (si oui)</Label>
                <Textarea value={form.keepFurnitureList} onChange={(e) => update('keepFurnitureList', e.target.value)} rows={2} />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={form.animals} onCheckedChange={(v) => update('animals', v)} />
              <Label>Animaux de compagnie</Label>
            </div>
            {form.animals && (
              <div>
                <Label>Type</Label>
                <Input value={form.animalsType} onChange={(e) => update('animalsType', e.target.value)} placeholder="Ex: chat, chien" />
              </div>
            )}
            <div>
              <Label>Nombre d&apos;occupants (adultes)</Label>
              <Input type="number" value={form.occupantsAdults} onChange={(e) => update('occupantsAdults', e.target.value)} />
            </div>
            <div>
              <Label>Enfants + âges</Label>
              <Input value={form.occupantsKids} onChange={(e) => update('occupantsKids', e.target.value)} placeholder="Ex: 2" />
            </div>
            <div>
              <Label>Âges des enfants</Label>
              <Input value={form.occupantsAges} onChange={(e) => update('occupantsAges', e.target.value)} placeholder="Ex: 5 ans, 10 ans" />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Budget & Planning">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Budget global envisagé (€)</Label>
            <Input type="number" value={form.budgetGlobal} onChange={(e) => update('budgetGlobal', e.target.value)} placeholder="Ex: 50000" />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <Label>De (€)</Label>
              <Input type="number" value={form.budgetMin} onChange={(e) => update('budgetMin', e.target.value)} />
            </div>
            <span className="pt-6">à</span>
            <div>
              <Label>À (€)</Label>
              <Input type="number" value={form.budgetMax} onChange={(e) => update('budgetMax', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.budgetMobilierInclus} onCheckedChange={(v) => update('budgetMobilierInclus', v)} />
            <Label>Budget mobilier inclus ?</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.budgetDecorationInclus} onCheckedChange={(v) => update('budgetDecorationInclus', v)} />
            <Label>Budget décoration inclus ?</Label>
          </div>
          <div>
            <Label>Échéance souhaitée</Label>
            <Input type="date" value={form.deadline} onChange={(e) => update('deadline', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Contraintes de planning</Label>
            <Textarea value={form.planningConstraints} onChange={(e) => update('planningConstraints', e.target.value)} rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.hebergementSurPlace} onCheckedChange={(v) => update('hebergementSurPlace', v)} />
            <Label>Hébergement pendant travaux : Sur place (Oui) / Absent (Non)</Label>
          </div>
        </div>
      </Section>

      <Section title="Notes & Observations">
        <div className="space-y-4">
          <div>
            <Label>Notes du premier rendez-vous</Label>
            <Textarea value={form.notesRdv} onChange={(e) => update('notesRdv', e.target.value)} rows={6} className="mt-2" />
          </div>
          <div>
            <Label>Impression générale</Label>
            <Textarea value={form.impression} onChange={(e) => update('impression', e.target.value)} rows={2} className="mt-2" />
          </div>
          <div>
            <Label>Priorités du client</Label>
            <Textarea value={form.priorites} onChange={(e) => update('priorites', e.target.value)} rows={2} className="mt-2" />
          </div>
          <div>
            <Label>Points de vigilance</Label>
            <Textarea value={form.vigilance} onChange={(e) => update('vigilance', e.target.value)} rows={2} className="mt-2" />
          </div>
          <div>
            <Label>Photos jointes</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {form.photoUrls.map((url, i) => (
                <div key={i} className="relative inline-block">
                  <img src={url} alt="" className="h-20 w-20 object-cover rounded border" />
                  <button type="button" className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center" onClick={() => update('photoUrls', form.photoUrls.filter((_, j) => j !== i))}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="h-20 w-20 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-gray-50">
                <Upload className="h-6 w-6 text-gray-400" />
                <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Suite à donner">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Prochaine étape</Label>
            <Select value={form.nextStep} onValueChange={(v) => update('nextStep', v)}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>{NEXT_STEPS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date de relance prévue</Label>
            <Input type="date" value={form.relanceDate} onChange={(e) => update('relanceDate', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Architecte assigné(e)</Label>
            <Select value={form.architectId} onValueChange={(v) => update('architectId', v)}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun</SelectItem>
                {architects.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{[a.first_name, a.last_name].filter(Boolean).join(' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>
    </div>
  )

  const previewContent = (
    <ProfessionalDocumentPreview
      documentNumber={docNumber}
      documentTitle="FICHE DE PREMIER CONTACT / BRIEF CLIENT"
      documentDate={new Date()}
      companyName={company?.name}
      companyLogo={company?.logo_url}
      companyAddress={company?.address}
      companyPhone={company?.phone}
      companyEmail={company?.email}
      clientName={clientName || undefined}
      clientAddress={form.address || undefined}
      clientPhone={form.phone || undefined}
      clientEmail={form.email || undefined}
      projectName={projectName || undefined}
    >
      <div className="space-y-6 text-[#1A1A1A]">
        {(form.civility || form.fullName || form.email || form.phone) && (
          <div>
            <h3 className="text-[#C5A572] font-semibold text-sm uppercase tracking-wide mb-2">Informations Client</h3>
            <p className="text-sm">{[form.civility, form.fullName].filter(Boolean).join(' ')}</p>
            {form.company && <p className="text-sm">Société : {form.company}</p>}
            {form.email && <p className="text-sm">Email : {form.email}</p>}
            {form.phone && <p className="text-sm">Tél : {form.phone}</p>}
            {form.address && <p className="text-sm">{form.address}</p>}
            {form.source && <p className="text-sm">Source : {form.source}</p>}
          </div>
        )}
        {(form.propertyType || form.propertyAddress) && (
          <div>
            <h3 className="text-[#C5A572] font-semibold text-sm uppercase tracking-wide mb-2">Le Bien</h3>
            <p className="text-sm">{form.propertyType} — {form.propertyAddress}</p>
            {form.surface && <p className="text-sm">Surface : {form.surface} m² — {form.rooms} pièces</p>}
          </div>
        )}
        {(form.natureTravaux.length > 0 || form.style.length > 0) && (
          <div>
            <h3 className="text-[#C5A572] font-semibold text-sm uppercase tracking-wide mb-2">Le Projet</h3>
            {form.natureTravaux.length > 0 && <p className="text-sm">Travaux : {form.natureTravaux.join(', ')}</p>}
            {form.pieces.length > 0 && <p className="text-sm">Pièces : {form.pieces.join(', ')}</p>}
            {form.style.length > 0 && <p className="text-sm">Style : {form.style.join(', ')}</p>}
          </div>
        )}
        {(form.budgetGlobal || form.budgetMin || form.budgetMax) && (
          <div>
            <h3 className="text-[#C5A572] font-semibold text-sm uppercase tracking-wide mb-2">Budget & Planning</h3>
            <p className="text-sm">
              {form.budgetGlobal ? `${form.budgetGlobal} €` : [form.budgetMin, form.budgetMax].filter(Boolean).join(' à ') + ' €'}
              {form.deadline && ` — Échéance : ${format(new Date(form.deadline), 'dd MMM yyyy', { locale: fr })}`}
            </p>
          </div>
        )}
        {form.notesRdv && (
          <div>
            <h3 className="text-[#C5A572] font-semibold text-sm uppercase tracking-wide mb-2">Notes du premier rendez-vous</h3>
            <p className="text-sm whitespace-pre-wrap">{form.notesRdv}</p>
          </div>
        )}
        {form.photoUrls.length > 0 && (
          <div>
            <h3 className="text-[#C5A572] font-semibold text-sm uppercase tracking-wide mb-2">Photos jointes</h3>
            <div className="flex flex-wrap gap-2">
              {form.photoUrls.map((url, i) => (
                <img key={i} src={url} alt="" className="h-16 w-16 object-cover rounded border border-gray-200" />
              ))}
            </div>
          </div>
        )}
        {(form.nextStep || form.relanceDate) && (
          <div>
            <h3 className="text-[#C5A572] font-semibold text-sm uppercase tracking-wide mb-2">Suite à donner</h3>
            {form.nextStep && <p className="text-sm">Prochaine étape : {form.nextStep}</p>}
            {form.relanceDate && <p className="text-sm">Relance : {format(new Date(form.relanceDate), 'dd MMM yyyy', { locale: fr })}</p>}
          </div>
        )}
      </div>
    </ProfessionalDocumentPreview>
  )

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild className="text-gray-600">
        <Link href="/documents">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux documents
        </Link>
      </Button>
      <BaseDocumentLayout
        title="Fiche de Premier Contact / Brief Client"
      formContent={formContent}
      previewContent={previewContent}
      onSave={handleSave}
      isSaving={isSaving}
      onPreviewPDF={handleDownloadPDF}
      onDownloadPDF={handleDownloadPDF}
      />
    </div>
  )
}
