// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Eye, Download } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import jsPDF from 'jspdf'

const CIVILITIES = ['M.', 'Mme', 'M. et Mme', 'Société']
const SOURCES = [
  'Instagram', 'Site web', 'Bouche-à-oreille', 'Recommandation client',
  'Salon professionnel', 'Presse', 'Google', 'LinkedIn', 'Autre',
]
const PROPERTY_TYPES = [
  'Appartement', 'Maison', 'Duplex', 'Loft', 'Penthouse', 'Villa',
  'Bureau', 'Commerce', 'Restaurant', 'Hôtel', 'Autre',
]
const CONDITIONS = ['Neuf', 'Bon état', 'À rafraîchir', 'À rénover entièrement', 'Brut/Coque']
const NATURE_TRAVAUX = [
  'Rénovation complète', 'Rénovation partielle', 'Décoration uniquement', 'Cuisine', 'Salle(s) de bain',
  'Suite parentale', 'Dressing', 'Extension', 'Verrière', 'Terrasse', 'Bureaux', 'Commerce', 'Autre',
]
const PIECES = [
  'Entrée', 'Salon', 'Salle à manger', 'Cuisine', 'Chambre parentale', 'Chambre enfant', 'Bureau',
  'Salle de bain', 'Salle d\'eau', 'WC', 'Buanderie', 'Dressing', 'Couloir', 'Terrasse', 'Jardin',
]
const STYLES = [
  'Contemporain', 'Classique', 'Art Déco', 'Scandinave', 'Industriel', 'Bohème', 'Japandi',
  'Minimaliste', 'Méditerranéen', 'Luxe', 'Mid-Century', 'Éclectique',
]
const HEBERGEMENT = ['Sur place', 'Absent', 'À déterminer']
const NEXT_STEPS = ['Visite technique', 'Envoi proposition de mission', 'Rappeler', 'En attente', 'Décliné']

const defaultForm = {
  civility: '',
  firstName: '',
  lastName: '',
  company: '',
  email: '',
  phone: '',
  phoneSecondary: '',
  address: '',
  source: '',
  sourceDetail: '',
  propertyType: '',
  propertyAddress: '',
  floorAccess: '',
  surface: '',
  rooms: '',
  yearBuilt: '',
  condition: '',
  copropriete: false,
  constraints: '',
  natureTravaux: [] as string[],
  pieces: [] as string[],
  style: [] as string[],
  colorsPref: '',
  colorsAvoid: '',
  materials: '',
  inspirations: '',
  keepFurniture: false,
  keepFurnitureDetail: '',
  occupantsAdults: '',
  occupantsKids: '',
  animals: false,
  animalsDetail: '',
  budgetMin: '',
  budgetMax: '',
  budgetMobilierInclus: true,
  deadline: '',
  planningConstraints: '',
  hebergement: '',
  notesRdv: '',
  impression: '',
  priorites: '',
  vigilance: '',
  nextStep: '',
  relanceDate: '',
  architecte: '',
}

export default function FirstContactPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('form')
  const [form, setForm] = useState(defaultForm)
  const [docNumber] = useState(() => `FC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`)

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }))
  const toggleArray = (key: 'natureTravaux' | 'pieces' | 'style', value: string) => {
    setForm((f) => {
      const arr = f[key] as string[]
      const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]
      return { ...f, [key]: next }
    })
  }

  const handleSaveDraft = () => {
    toast.success('Brouillon enregistré (local)')
  }

  const handleFinalize = () => {
    toast.success('Document finalisé')
  }

  const handleDownloadPDF = async () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const m = 20
      const w = doc.internal.pageSize.getWidth() - 2 * m
      let y = m

      doc.setFont('helvetica')
      doc.setFontSize(18)
      doc.setTextColor(197, 165, 114)
      doc.text('INDESIGN', m, y)
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text('FICHE DE PREMIER CONTACT', doc.internal.pageSize.getWidth() - m, y, { align: 'right' })
      y += 10
      doc.setDrawColor(197, 165, 114)
      doc.setLineWidth(0.5)
      doc.line(m, y, doc.internal.pageSize.getWidth() - m, y)
      y += 8
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.text(`N° ${docNumber}`, doc.internal.pageSize.getWidth() - m, y, { align: 'right' })
      doc.text(`Date : ${format(new Date(), 'd MMMM yyyy', { locale: fr })}`, m, y)
      y += 12

      const section = (title: string, lines: string[]) => {
        if (lines.every((l) => !l.trim())) return
        doc.setFontSize(11)
        doc.setTextColor(197, 165, 114)
        doc.setFont('helvetica', 'bold')
        doc.text(title, m, y)
        y += 6
        doc.setDrawColor(197, 165, 114)
        doc.line(m, y, m + 40, y)
        y += 6
        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'normal')
        lines.forEach((line) => {
          if (y > 270) { doc.addPage(); y = m }
          const split = doc.splitTextToSize(line, w)
          split.forEach((s: string) => { doc.text(s, m, y); y += 5 })
        })
        y += 6
      }

      section('Informations Client', [
        [form.civility, form.firstName, form.lastName].filter(Boolean).join(' '),
        form.company && `Société : ${form.company}`,
        form.email && `Email : ${form.email}`,
        form.phone && `Tél : ${form.phone}`,
        form.phoneSecondary && `Tél secondaire : ${form.phoneSecondary}`,
        form.address,
        form.source && `Source : ${form.source}`,
        form.sourceDetail && `Détail : ${form.sourceDetail}`,
      ].filter(Boolean) as string[])

      section('Le Bien', [
        form.propertyType && `Type : ${form.propertyType}`,
        form.propertyAddress,
        form.floorAccess && `Étage / Accès : ${form.floorAccess}`,
        form.surface && `Surface : ${form.surface} m²`,
        form.rooms && `Pièces : ${form.rooms}`,
        form.yearBuilt && `Année construction : ${form.yearBuilt}`,
        form.condition && `État : ${form.condition}`,
        form.copropriete ? 'Copropriété : Oui' : 'Copropriété : Non',
        form.constraints,
      ].filter(Boolean) as string[])

      section('Le Projet', [
        form.natureTravaux.length ? `Nature des travaux : ${form.natureTravaux.join(', ')}` : '',
        form.pieces.length ? `Pièces : ${form.pieces.join(', ')}` : '',
        form.style.length ? `Style : ${form.style.join(', ')}` : '',
        form.colorsPref && `Couleurs préférées : ${form.colorsPref}`,
        form.colorsAvoid && `Couleurs à éviter : ${form.colorsAvoid}`,
        form.materials && `Matériaux : ${form.materials}`,
        form.inspirations,
        form.keepFurniture ? `Mobilier à conserver : ${form.keepFurnitureDetail || 'Oui'}` : '',
        form.occupantsAdults && `Occupants adultes : ${form.occupantsAdults}`,
        form.occupantsKids && `Enfants : ${form.occupantsKids}`,
        form.animals ? `Animaux : ${form.animalsDetail || 'Oui'}` : '',
      ].filter(Boolean) as string[])

      section('Budget & Planning', [
        form.budgetMin && `Budget min : ${form.budgetMin} FCFA`,
        form.budgetMax && `Budget max : ${form.budgetMax} FCFA`,
        form.budgetMobilierInclus ? 'Mobilier inclus : Oui' : 'Mobilier inclus : Non',
        form.deadline && `Échéance : ${form.deadline}`,
        form.planningConstraints,
        form.hebergement && `Hébergement : ${form.hebergement}`,
      ].filter(Boolean) as string[])

      section('Notes & Observations', [
        form.notesRdv,
        form.impression,
        form.priorites,
        form.vigilance,
      ].filter(Boolean) as string[])

      section('Suite à donner', [
        form.nextStep && `Prochaine étape : ${form.nextStep}`,
        form.relanceDate && `Date de relance : ${form.relanceDate}`,
        form.architecte && `Architecte : ${form.architecte}`,
      ].filter(Boolean) as string[])

      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text('INDESIGN | Confidentiel | Page 1/1', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' })

      doc.save(`Fiche-Premier-Contact-${docNumber}.pdf`)
      toast.success('PDF téléchargé')
    } catch (e) {
      console.error(e)
      toast.error('Erreur génération PDF')
    }
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-lg p-5 mb-6" style={{ backgroundColor: '#FAFAF8' }}>
      <h2 className="font-serif text-lg mb-4" style={{ color: '#C5A572' }}>{title}</h2>
      {children}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-light text-gray-900">Fiche de Premier Contact</h1>
        <Button variant="ghost" onClick={() => router.push('/documents-pro')}>
          Retour
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 rounded-lg bg-gray-100 p-1">
          <TabsTrigger value="form" className="rounded-md data-[state=active]:bg-[#C5A572] data-[state=active]:text-white">
            📝 Formulaire
          </TabsTrigger>
          <TabsTrigger value="preview" className="rounded-md data-[state=active]:bg-[#C5A572] data-[state=active]:text-white">
            👁️ Aperçu
          </TabsTrigger>
          <TabsTrigger value="pdf" className="rounded-md data-[state=active]:bg-[#C5A572] data-[state=active]:text-white">
            📄 PDF
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="mt-6">
          <div className="max-w-4xl space-y-2">
            <Section title="Informations Client">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Civilité</Label>
                  <Select value={form.civility} onValueChange={(v) => update('civility', v)}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>{CIVILITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Prénom</Label><Input className="rounded-lg" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} placeholder="Prénom" /></div>
                <div className="space-y-2"><Label>Nom</Label><Input className="rounded-lg" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} placeholder="Nom" /></div>
                <div className="space-y-2"><Label>Société (optionnel)</Label><Input className="rounded-lg" value={form.company} onChange={(e) => update('company', e.target.value)} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" className="rounded-lg" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="email@exemple.com" /></div>
                <div className="space-y-2"><Label>Téléphone principal</Label><Input className="rounded-lg" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="06 00 00 00 00" /></div>
                <div className="space-y-2"><Label>Téléphone secondaire (optionnel)</Label><Input className="rounded-lg" value={form.phoneSecondary} onChange={(e) => update('phoneSecondary', e.target.value)} /></div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Adresse complète</Label>
                  <Textarea className="rounded-lg" value={form.address} onChange={(e) => update('address', e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Source de contact</Label>
                  <Select value={form.source} onValueChange={(v) => update('source', v)}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Détail source</Label><Input className="rounded-lg" value={form.sourceDetail} onChange={(e) => update('sourceDetail', e.target.value)} /></div>
              </div>
            </Section>

            <Section title="Le Bien">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type de bien</Label>
                  <Select value={form.propertyType} onValueChange={(v) => update('propertyType', v)}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>{PROPERTY_TYPES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-2"><Label>Adresse du bien</Label><Textarea className="rounded-lg" value={form.propertyAddress} onChange={(e) => update('propertyAddress', e.target.value)} rows={2} /></div>
                <div className="space-y-2"><Label>Étage / Accès</Label><Input className="rounded-lg" value={form.floorAccess} onChange={(e) => update('floorAccess', e.target.value)} /></div>
                <div className="space-y-2"><Label>Surface approximative (m²)</Label><Input type="number" className="rounded-lg" value={form.surface} onChange={(e) => update('surface', e.target.value)} /></div>
                <div className="space-y-2"><Label>Nombre de pièces</Label><Input type="number" className="rounded-lg" value={form.rooms} onChange={(e) => update('rooms', e.target.value)} /></div>
                <div className="space-y-2"><Label>Année de construction</Label><Input className="rounded-lg" value={form.yearBuilt} onChange={(e) => update('yearBuilt', e.target.value)} placeholder="Ex: 1920" /></div>
                <div className="space-y-2">
                  <Label>État actuel</Label>
                  <Select value={form.condition} onValueChange={(v) => update('condition', v)}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2"><Switch checked={form.copropriete} onCheckedChange={(v) => update('copropriete', v)} /><Label>Copropriété</Label></div>
                <div className="md:col-span-2 space-y-2"><Label>Contraintes techniques connues</Label><Textarea className="rounded-lg" value={form.constraints} onChange={(e) => update('constraints', e.target.value)} rows={3} /></div>
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
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Couleurs préférées</Label><Input className="rounded-lg" value={form.colorsPref} onChange={(e) => update('colorsPref', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Couleurs à éviter</Label><Input className="rounded-lg" value={form.colorsAvoid} onChange={(e) => update('colorsAvoid', e.target.value)} /></div>
                  <div className="md:col-span-2 space-y-2"><Label>Matériaux appréciés</Label><Input className="rounded-lg" value={form.materials} onChange={(e) => update('materials', e.target.value)} /></div>
                  <div className="md:col-span-2 space-y-2"><Label>Inspirations (magazines, Instagram, hôtels...)</Label><Textarea className="rounded-lg" value={form.inspirations} onChange={(e) => update('inspirations', e.target.value)} rows={2} /></div>
                  <div className="flex items-center gap-2"><Switch checked={form.keepFurniture} onCheckedChange={(v) => update('keepFurniture', v)} /><Label>Mobilier existant à conserver</Label></div>
                  {form.keepFurniture && <div className="md:col-span-2 space-y-2"><Label>Détail</Label><Textarea className="rounded-lg" value={form.keepFurnitureDetail} onChange={(e) => update('keepFurnitureDetail', e.target.value)} rows={2} /></div>}
                  <div className="space-y-2"><Label>Nombre d'occupants adultes</Label><Input type="number" className="rounded-lg" value={form.occupantsAdults} onChange={(e) => update('occupantsAdults', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Nombre d'enfants + âges</Label><Input className="rounded-lg" value={form.occupantsKids} onChange={(e) => update('occupantsKids', e.target.value)} placeholder="Ex: 2 (5 ans, 10 ans)" /></div>
                  <div className="flex items-center gap-2"><Switch checked={form.animals} onCheckedChange={(v) => update('animals', v)} /><Label>Animaux</Label></div>
                  {form.animals && <div className="space-y-2"><Label>Précisions</Label><Input className="rounded-lg" value={form.animalsDetail} onChange={(e) => update('animalsDetail', e.target.value)} /></div>}
                </div>
              </div>
            </Section>

            <Section title="Budget & Planning">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Budget minimum envisagé (FCFA)</Label><Input type="number" className="rounded-lg" value={form.budgetMin} onChange={(e) => update('budgetMin', e.target.value)} /></div>
                <div className="space-y-2"><Label>Budget maximum envisagé (FCFA)</Label><Input type="number" className="rounded-lg" value={form.budgetMax} onChange={(e) => update('budgetMax', e.target.value)} /></div>
                <div className="flex items-center gap-2"><Switch checked={form.budgetMobilierInclus} onCheckedChange={(v) => update('budgetMobilierInclus', v)} /><Label>Budget mobilier inclus</Label></div>
                <div className="space-y-2"><Label>Échéance souhaitée</Label><Input type="date" className="rounded-lg" value={form.deadline} onChange={(e) => update('deadline', e.target.value)} /></div>
                <div className="md:col-span-2 space-y-2"><Label>Contraintes planning</Label><Textarea className="rounded-lg" value={form.planningConstraints} onChange={(e) => update('planningConstraints', e.target.value)} rows={2} /></div>
                <div className="space-y-2">
                  <Label>Hébergement pendant travaux</Label>
                  <Select value={form.hebergement} onValueChange={(v) => update('hebergement', v)}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>{HEBERGEMENT.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </Section>

            <Section title="Notes & Observations">
              <div className="space-y-4">
                <div className="space-y-2"><Label>Notes du premier rendez-vous</Label><Textarea className="rounded-lg" value={form.notesRdv} onChange={(e) => update('notesRdv', e.target.value)} rows={6} /></div>
                <div className="space-y-2"><Label>Impression générale</Label><Textarea className="rounded-lg" value={form.impression} onChange={(e) => update('impression', e.target.value)} rows={3} /></div>
                <div className="space-y-2"><Label>Priorités du client</Label><Textarea className="rounded-lg" value={form.priorites} onChange={(e) => update('priorites', e.target.value)} rows={3} /></div>
                <div className="space-y-2"><Label>Points de vigilance</Label><Textarea className="rounded-lg" value={form.vigilance} onChange={(e) => update('vigilance', e.target.value)} rows={3} /></div>
              </div>
            </Section>

            <Section title="Suite à donner">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prochaine étape</Label>
                  <Select value={form.nextStep} onValueChange={(v) => update('nextStep', v)}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>{NEXT_STEPS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Date de relance</Label><Input type="date" className="rounded-lg" value={form.relanceDate} onChange={(e) => update('relanceDate', e.target.value)} /></div>
                <div className="md:col-span-2 space-y-2"><Label>Architecte assigné</Label><Input className="rounded-lg" value={form.architecte} onChange={(e) => update('architecte', e.target.value)} /></div>
              </div>
            </Section>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="border-[#C5A572] text-[#C5A572] hover:bg-[#C5A572]/10 rounded-lg" onClick={handleSaveDraft}>
                Sauvegarder le brouillon
              </Button>
              <Button className="bg-[#C5A572] hover:bg-[#B08D5B] text-white rounded-lg shadow-sm" onClick={handleFinalize}>
                Finaliser
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <Card className="max-w-4xl mx-auto rounded-xl shadow-sm overflow-hidden">
            <CardContent className="p-8 bg-white">
              <div className="space-y-6 font-sans text-sm text-gray-800">
                <div className="flex justify-between items-start border-b border-[#C5A572] pb-3">
                  <span className="font-serif text-xl text-[#C5A572]">INDESIGN</span>
                  <div className="text-right">
                    <div className="font-serif text-lg font-medium text-gray-900">FICHE DE PREMIER CONTACT</div>
                    <div className="text-xs text-gray-500 mt-1">N° {docNumber}</div>
                    <div className="text-xs text-gray-500">{format(new Date(), 'd MMMM yyyy', { locale: fr })}</div>
                  </div>
                </div>

                {(form.civility || form.firstName || form.lastName || form.email || form.phone || form.address || form.source) && (
                  <div>
                    <h3 className="font-serif text-[#C5A572] border-b border-[#C5A572]/40 pb-1 mb-3">Informations Client</h3>
                    <div className="space-y-1">
                      {(form.civility || form.firstName || form.lastName) && <p>{[form.civility, form.firstName, form.lastName].filter(Boolean).join(' ')}</p>}
                      {form.company && <p>Société : {form.company}</p>}
                      {form.email && <p>Email : {form.email}</p>}
                      {form.phone && <p>Tél : {form.phone}</p>}
                      {form.phoneSecondary && <p>Tél secondaire : {form.phoneSecondary}</p>}
                      {form.address && <p className="whitespace-pre-wrap">{form.address}</p>}
                      {form.source && <p>Source : {form.source}{form.sourceDetail ? ` — ${form.sourceDetail}` : ''}</p>}
                    </div>
                  </div>
                )}

                {(form.propertyType || form.propertyAddress || form.surface || form.rooms || form.condition) && (
                  <div>
                    <h3 className="font-serif text-[#C5A572] border-b border-[#C5A572]/40 pb-1 mb-3">Le Bien</h3>
                    <div className="space-y-1">
                      {form.propertyType && <p>Type : {form.propertyType}</p>}
                      {form.propertyAddress && <p className="whitespace-pre-wrap">{form.propertyAddress}</p>}
                      {form.floorAccess && <p>Étage / Accès : {form.floorAccess}</p>}
                      {form.surface && <p>Surface : {form.surface} m²</p>}
                      {form.rooms && <p>Pièces : {form.rooms}</p>}
                      {form.yearBuilt && <p>Année : {form.yearBuilt}</p>}
                      {form.condition && <p>État : {form.condition}</p>}
                      <p>Copropriété : {form.copropriete ? 'Oui' : 'Non'}</p>
                      {form.constraints && <p className="whitespace-pre-wrap">{form.constraints}</p>}
                    </div>
                  </div>
                )}

                {(form.natureTravaux.length > 0 || form.pieces.length > 0 || form.style.length > 0 || form.colorsPref || form.materials) && (
                  <div>
                    <h3 className="font-serif text-[#C5A572] border-b border-[#C5A572]/40 pb-1 mb-3">Le Projet</h3>
                    <div className="space-y-2">
                      {form.natureTravaux.length > 0 && <p><strong>Nature des travaux :</strong><ul className="list-disc pl-5 mt-1">{form.natureTravaux.map((n) => <li key={n}>{n}</li>)}</ul></p>}
                      {form.pieces.length > 0 && <p><strong>Pièces :</strong><ul className="list-disc pl-5 mt-1">{form.pieces.map((p) => <li key={p}>{p}</li>)}</ul></p>}
                      {form.style.length > 0 && <p><strong>Style :</strong><ul className="list-disc pl-5 mt-1">{form.style.map((s) => <li key={s}>{s}</li>)}</ul></p>}
                      {form.colorsPref && <p>Couleurs préférées : {form.colorsPref}</p>}
                      {form.colorsAvoid && <p>Couleurs à éviter : {form.colorsAvoid}</p>}
                      {form.materials && <p>Matériaux : {form.materials}</p>}
                      {form.inspirations && <p className="whitespace-pre-wrap">{form.inspirations}</p>}
                      {form.keepFurniture && <p>Mobilier à conserver : {form.keepFurnitureDetail || 'Oui'}</p>}
                      {form.occupantsAdults && <p>Occupants adultes : {form.occupantsAdults}</p>}
                      {form.occupantsKids && <p>Enfants : {form.occupantsKids}</p>}
                      {form.animals && <p>Animaux : {form.animalsDetail || 'Oui'}</p>}
                    </div>
                  </div>
                )}

                {(form.budgetMin || form.budgetMax || form.deadline || form.hebergement) && (
                  <div>
                    <h3 className="font-serif text-[#C5A572] border-b border-[#C5A572]/40 pb-1 mb-3">Budget & Planning</h3>
                    <div className="space-y-1">
                      {form.budgetMin && <p>Budget min : {form.budgetMin} FCFA</p>}
                      {form.budgetMax && <p>Budget max : {form.budgetMax} FCFA</p>}
                      <p>Mobilier inclus : {form.budgetMobilierInclus ? 'Oui' : 'Non'}</p>
                      {form.deadline && <p>Échéance : {form.deadline}</p>}
                      {form.planningConstraints && <p className="whitespace-pre-wrap">{form.planningConstraints}</p>}
                      {form.hebergement && <p>Hébergement : {form.hebergement}</p>}
                    </div>
                  </div>
                )}

                {(form.notesRdv || form.impression || form.priorites || form.vigilance) && (
                  <div>
                    <h3 className="font-serif text-[#C5A572] border-b border-[#C5A572]/40 pb-1 mb-3">Notes & Observations</h3>
                    <div className="space-y-2">
                      {form.notesRdv && <p className="whitespace-pre-wrap">{form.notesRdv}</p>}
                      {form.impression && <p><strong>Impression :</strong> {form.impression}</p>}
                      {form.priorites && <p><strong>Priorités :</strong> {form.priorites}</p>}
                      {form.vigilance && <p><strong>Vigilance :</strong> {form.vigilance}</p>}
                    </div>
                  </div>
                )}

                {(form.nextStep || form.relanceDate || form.architecte) && (
                  <div>
                    <h3 className="font-serif text-[#C5A572] border-b border-[#C5A572]/40 pb-1 mb-3">Suite à donner</h3>
                    <div className="space-y-1">
                      {form.nextStep && <p>Prochaine étape : {form.nextStep}</p>}
                      {form.relanceDate && <p>Date de relance : {form.relanceDate}</p>}
                      {form.architecte && <p>Architecte : {form.architecte}</p>}
                    </div>
                  </div>
                )}

                {!form.firstName && !form.lastName && !form.email && !form.phone && !form.notesRdv && (
                  <p className="text-gray-400 italic">Remplissez le formulaire pour voir l’aperçu en temps réel.</p>
                )}

                <div className="pt-6 mt-6 border-t border-gray-200 text-xs text-gray-500 text-center">
                  INDESIGN | Confidentiel | Page 1/1
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pdf" className="mt-6">
          <Card className="max-w-md mx-auto rounded-xl shadow-sm p-8">
            <CardContent className="flex flex-col gap-4">
              <Button size="lg" className="w-full bg-[#C5A572] hover:bg-[#B08D5B] text-white rounded-lg h-12" onClick={handleDownloadPDF}>
                <Download className="mr-2 h-5 w-5" />
                Télécharger en PDF
              </Button>
              <Button variant="outline" size="lg" className="w-full border-[#C5A572] text-[#C5A572] hover:bg-[#C5A572]/10 rounded-lg h-12" onClick={() => setActiveTab('preview')}>
                <Eye className="mr-2 h-5 w-5" />
                Prévisualiser le PDF
              </Button>
              <p className="text-xs text-gray-500 text-center mt-2">Le PDF reprend le même design que l’aperçu.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
