// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
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
import { toast } from 'sonner'
import { Eye, Download } from 'lucide-react'
import { format, addMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import jsPDF from 'jspdf'

const MODES_REMUNERATION = [
  { value: 'percentage', label: 'Pourcentage du montant des travaux' },
  { value: 'forfait', label: 'Forfait global' },
  { value: 'horaire', label: 'Tarif horaire' },
  { value: 'mixte', label: 'Mixte' },
]

const DEFAULT_PRESENTATION = `Notre agence INDESIGN est spécialisée dans l'architecture d'intérieur haut de gamme. Nous accompagnons nos clients de la conception à la réalisation de leurs projets.`

const PHASES_DEFAULTS = [
  { title: 'Phase 1 — Relevé & Diagnostic', description: 'Relevé de mesures, état des lieux, diagnostic technique, identification des contraintes et opportunités.', duration: '', unit: 'weeks' as const },
  { title: 'Phase 2 — Étude de conception', description: 'Moodboards, plans d\'aménagement, rendus 3D, sélection mobilier et matériaux.', duration: '', unit: 'weeks' as const },
  { title: 'Phase 3 — Plans d\'exécution', description: 'Plans techniques détaillés, plans électriques et plomberie, calepinages, dossier de consultation.', duration: '', unit: 'weeks' as const },
  { title: 'Phase 4 — Consultation entreprises', description: 'Cahier des charges, appels d\'offres, analyse et comparatif des devis, recommandations.', duration: '', unit: 'weeks' as const },
  { title: 'Phase 5 — Suivi de chantier', description: 'Réunions hebdomadaires, coordination des corps de métiers, contrôle qualité, respect des délais.', duration: '', unit: 'months' as const },
  { title: 'Phase 6 — Décoration & Livraison', description: 'Shopping et commandes, installation du mobilier, styling, shooting photo, remise des clés.', duration: '', unit: 'weeks' as const },
]

const DEFAULT_INCLUS = `Honoraires de conception et de suivi selon les phases retenues, déplacements sur site (dans la limite convenue), réunions de coordination, documents et plans listés dans chaque phase.`

const DEFAULT_NON_INCLUS = `Coût des travaux, mobilier, décoration, diagnostics techniques (amiante, plomb, termites, etc.), frais de permis de construire ou déclarations, assurances dommages-ouvrage.`

const DEFAULT_CONDITIONS_RESILIATION = `En cas de résiliation par l'une des parties, un préavis de 2 mois par lettre recommandée est requis. Les honoraires dus pour les prestations déjà réalisées restent acquis. Les documents et études restent la propriété du maître d'ouvrage sous réserve du règlement intégral des sommes dues.`

type PhaseState = { title: string; description: string; duration: string; unit: 'weeks' | 'months'; enabled: boolean }

export default function MissionProposalPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('form')
  const [docNumber] = useState(() => `PM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`)
  const [dateDoc, setDateDoc] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [projectId, setProjectId] = useState('')
  const [clientName, setClientName] = useState('')
  const [presentation, setPresentation] = useState(DEFAULT_PRESENTATION)
  const [referencesProjets, setReferencesProjets] = useState('')
  const [resumeBrief, setResumeBrief] = useState('')
  const [objectifs, setObjectifs] = useState('')
  const [contraintes, setContraintes] = useState('')
  const [phases, setPhases] = useState<PhaseState[]>(() =>
    PHASES_DEFAULTS.map((p) => ({ ...p, enabled: true }))
  )
  const [modeRemuneration, setModeRemuneration] = useState('forfait')
  const [pourcentage, setPourcentage] = useState('')
  const [forfaitHT, setForfaitHT] = useState('')
  const [tarifHoraireHT, setTarifHoraireHT] = useState('')
  const [totalHT, setTotalHT] = useState('')
  const [acomptePercent, setAcomptePercent] = useState('30')
  const [echeancier, setEcheancier] = useState('')
  const [inclus, setInclus] = useState(DEFAULT_INCLUS)
  const [nonInclus, setNonInclus] = useState(DEFAULT_NON_INCLUS)
  const [dateDebut, setDateDebut] = useState('')
  const [dureeTotaleMois, setDureeTotaleMois] = useState('')
  const [rcPro, setRcPro] = useState('')
  const [conditionsResiliation, setConditionsResiliation] = useState(DEFAULT_CONDITIONS_RESILIATION)
  const [projects, setProjects] = useState<{ id: string; name: string; client_id: string }[]>([])
  const [clients, setClients] = useState<{ id: string; first_name: string; last_name: string }[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        let q = supabase.from('projects').select('id, name, client_id').is('deleted_at', null).order('name')
        if (profile?.company_id) q = q.eq('company_id', profile.company_id)
        const { data: proj } = await q
        setProjects(proj || [])
        let qc = supabase.from('clients').select('id, first_name, last_name')
        if (profile?.company_id) qc = qc.eq('company_id', profile.company_id)
        const { data: cli } = await qc
        setClients(cli || [])
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [profile?.company_id])

  useEffect(() => {
    if (!projectId) { setClientName(''); return }
    const p = projects.find((x) => x.id === projectId)
    if (!p?.client_id) { setClientName(''); return }
    const c = clients.find((x) => x.id === p.client_id)
    setClientName(c ? `${c.first_name} ${c.last_name}` : '')
  }, [projectId, projects, clients])

  const totalHTNum = parseFloat(totalHT) || 0
  const tva = totalHTNum * 0.2
  const ttc = totalHTNum + tva
  const acompteNum = totalHTNum * (parseFloat(acomptePercent) || 0) / 100

  const dateFinCalc = dateDebut && dureeTotaleMois
    ? format(addMonths(new Date(dateDebut), parseInt(dureeTotaleMois, 10) || 0), 'yyyy-MM-dd')
    : ''

  const updatePhase = (index: number, key: keyof PhaseState, value: string | number | boolean) => {
    setPhases((prev) => prev.map((p, i) => (i === index ? { ...p, [key]: value } : p)))
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-lg p-5 mb-6 shadow-sm" style={{ backgroundColor: '#FAFAF8' }}>
      <h2 className="font-serif text-lg mb-4" style={{ color: '#C5A572' }}>{title}</h2>
      {children}
    </div>
  )

  const handleSaveDraft = async () => {
    try {
      const { error } = await supabase.from('professional_documents').insert({
        company_id: profile?.company_id,
        created_by: profile?.id,
        document_type: 'mission_proposal',
        document_phase: 'phase3',
        document_number: docNumber,
        title: `Proposition de mission – ${projects.find((p) => p.id === projectId)?.name || 'Projet'}`,
        client_id: projects.find((p) => p.id === projectId)?.client_id || null,
        project_id: projectId || null,
        status: 'draft',
        document_data: {
          dateDoc,
          projectId,
          clientName,
          presentation,
          referencesProjets,
          resumeBrief,
          objectifs,
          contraintes,
          phases,
          modeRemuneration,
          pourcentage,
          forfaitHT,
          tarifHoraireHT,
          totalHT,
          acomptePercent,
          echeancier,
          inclus,
          nonInclus,
          dateDebut,
          dureeTotaleMois,
          dateFin: dateFinCalc,
          rcPro,
          conditionsResiliation,
        },
      })
      if (error) throw error
      toast.success('Brouillon enregistré')
      router.push('/documents-pro')
    } catch (e: any) {
      toast.error(e?.message || 'Erreur sauvegarde')
    }
  }

  const handleFinalize = async () => {
    try {
      const { error } = await supabase.from('professional_documents').insert({
        company_id: profile?.company_id,
        created_by: profile?.id,
        document_type: 'mission_proposal',
        document_phase: 'phase3',
        document_number: docNumber,
        title: `Proposition de mission – ${projects.find((p) => p.id === projectId)?.name || 'Projet'}`,
        client_id: projects.find((p) => p.id === projectId)?.client_id || null,
        project_id: projectId || null,
        status: 'finalized',
        document_data: {
          dateDoc,
          projectId,
          clientName,
          presentation,
          referencesProjets,
          resumeBrief,
          objectifs,
          contraintes,
          phases,
          modeRemuneration,
          pourcentage,
          forfaitHT,
          tarifHoraireHT,
          totalHT,
          acomptePercent,
          echeancier,
          inclus,
          nonInclus,
          dateDebut,
          dureeTotaleMois,
          dateFin: dateFinCalc,
          rcPro,
          conditionsResiliation,
        },
      })
      if (error) throw error
      toast.success('Proposition finalisée')
      router.push('/documents-pro')
    } catch (e: any) {
      toast.error(e?.message || 'Erreur')
    }
  }

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const m = 20
      const w = doc.internal.pageSize.getWidth() - 2 * m
      let y = m

      doc.setFont('helvetica')
      doc.setFontSize(18)
      doc.setTextColor(197, 165, 114)
      doc.text('INDESIGN', m, y)
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text('PROPOSITION DE MISSION', doc.internal.pageSize.getWidth() - m, y, { align: 'right' })
      y += 10
      doc.setDrawColor(197, 165, 114)
      doc.setLineWidth(0.5)
      doc.line(m, y, doc.internal.pageSize.getWidth() - m, y)
      y += 10
      doc.setFontSize(10)
      doc.setTextColor(80, 80, 80)
      doc.text(`N° ${docNumber}  |  Date : ${format(new Date(dateDoc), 'd MMMM yyyy', { locale: fr })}  |  Projet : ${projects.find((p) => p.id === projectId)?.name || '-'}  |  Client : ${clientName || '-'}`, m, y)
      y += 12

      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      const wrap = (text: string, maxW: number) => doc.splitTextToSize(text || '-', maxW)
      wrap(presentation, w).forEach((line: string) => { doc.text(line, m, y); y += 5 })
      y += 4
      if (referencesProjets) {
        doc.setFont('helvetica', 'bold')
        doc.text('Références projets similaires', m, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        wrap(referencesProjets, w).forEach((line: string) => { doc.text(line, m, y); y += 5 })
        y += 4
      }
      if (resumeBrief) {
        doc.setFont('helvetica', 'bold')
        doc.text('Compréhension du projet – Résumé du brief', m, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        wrap(resumeBrief, w).forEach((line: string) => { doc.text(line, m, y); y += 5 })
        y += 4
      }
      if (objectifs) {
        doc.setFont('helvetica', 'bold')
        doc.text('Objectifs identifiés', m, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        wrap(objectifs, w).forEach((line: string) => { doc.text(line, m, y); y += 5 })
        y += 4
      }
      if (contraintes) {
        doc.setFont('helvetica', 'bold')
        doc.text('Contraintes identifiées', m, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        wrap(contraintes, w).forEach((line: string) => { doc.text(line, m, y); y += 5 })
        y += 6
      }

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(197, 165, 114)
      doc.text('Prestations proposées', m, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      phases.filter((p) => p.enabled).forEach((p) => {
        doc.setFont('helvetica', 'bold')
        doc.text(p.title, m, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        wrap(p.description, w).forEach((line: string) => { doc.text(line, m, y); y += 5 })
        if (p.duration) doc.text(`Durée : ${p.duration} ${p.unit === 'months' ? 'mois' : 'semaines'}`, m, y), (y += 6)
        else y += 4
      })
      y += 4

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(197, 165, 114)
      doc.text('Honoraires', m, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(`Mode : ${MODES_REMUNERATION.find((x) => x.value === modeRemuneration)?.label || modeRemuneration}`, m, y)
      y += 6
      doc.text(`Montant total HT : ${totalHT || '0'} FCFA`, m, y)
      y += 5
      doc.text(`TVA 20% : ${tva.toFixed(0)} FCFA`, m, y)
      y += 5
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(197, 165, 114)
      doc.text(`Montant TTC : ${ttc.toFixed(0)} FCFA`, m, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(`Acompte à la signature : ${acomptePercent}% soit ${acompteNum.toFixed(0)} FCFA`, m, y)
      y += 8
      if (echeancier) {
        wrap(echeancier, w).forEach((line: string) => { doc.text(line, m, y); y += 5 })
        y += 4
      }
      if (dateDebut) doc.text(`Démarrage souhaité : ${format(new Date(dateDebut), 'd MMMM yyyy', { locale: fr })}`, m, y), (y += 5)
      if (dureeTotaleMois) doc.text(`Durée totale estimée : ${dureeTotaleMois} mois`, m, y), (y += 5)
      if (dateFinCalc) doc.text(`Fin prévisionnelle : ${format(new Date(dateFinCalc), 'd MMMM yyyy', { locale: fr })}`, m, y), (y += 6)
      if (rcPro) doc.text(`Assurance RC Pro n° : ${rcPro}`, m, y), (y += 5)
      doc.text('Délai de rétractation : 14 jours', m, y)
      y += 10

      if (y > 240) { doc.addPage(); y = 20 }
      doc.setFont('helvetica', 'bold')
      doc.text('Bon pour accord', m, y)
      y += 8
      doc.setFont('helvetica', 'normal')
      doc.text('Pour INDESIGN', m, y)
      doc.text('Le client', doc.internal.pageSize.getWidth() - m - 40, y)
      y += 15
      doc.line(m, y, m + 50, y)
      doc.line(doc.internal.pageSize.getWidth() - m - 50, y, doc.internal.pageSize.getWidth() - m, y)
      y += 5
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text('Signature', m, y)
      doc.text('Signature', doc.internal.pageSize.getWidth() - m - 40, y)

      doc.save(`Proposition-Mission-${docNumber}.pdf`)
      toast.success('PDF téléchargé')
    } catch (e) {
      console.error(e)
      toast.error('Erreur génération PDF')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-light text-gray-900">Proposition de Mission</h1>
        <Button variant="ghost" onClick={() => router.push('/documents-pro')}>Retour</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 rounded-lg bg-gray-100 p-1">
          <TabsTrigger value="form" className="rounded-md data-[state=active]:bg-[#C5A572] data-[state=active]:text-white">📝 Formulaire</TabsTrigger>
          <TabsTrigger value="preview" className="rounded-md data-[state=active]:bg-[#C5A572] data-[state=active]:text-white">👁️ Aperçu</TabsTrigger>
          <TabsTrigger value="pdf" className="rounded-md data-[state=active]:bg-[#C5A572] data-[state=active]:text-white">📄 PDF</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="mt-6">
          <div className="max-w-4xl space-y-2">
            <Section title="En-tête">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Numéro</Label>
                  <Input className="rounded-lg bg-gray-50 font-mono" value={docNumber} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" className="rounded-lg" value={dateDoc} onChange={(e) => setDateDoc(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Projet</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Sélectionner un projet" /></SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Input className="rounded-lg bg-gray-50" value={clientName} readOnly placeholder="Rempli selon le projet" />
                </div>
              </div>
            </Section>

            <Section title="Présentation Agence">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Texte de présentation</Label>
                  <Textarea className="rounded-lg min-h-[120px]" value={presentation} onChange={(e) => setPresentation(e.target.value)} rows={5} />
                </div>
                <div className="space-y-2">
                  <Label>Références projets similaires</Label>
                  <Textarea className="rounded-lg" value={referencesProjets} onChange={(e) => setReferencesProjets(e.target.value)} rows={3} placeholder="Projets de référence..." />
                </div>
              </div>
            </Section>

            <Section title="Compréhension du Projet">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Résumé du brief</Label>
                  <Textarea className="rounded-lg min-h-[100px]" value={resumeBrief} onChange={(e) => setResumeBrief(e.target.value)} rows={4} />
                </div>
                <div className="space-y-2">
                  <Label>Objectifs identifiés</Label>
                  <Textarea className="rounded-lg" value={objectifs} onChange={(e) => setObjectifs(e.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Contraintes identifiées</Label>
                  <Textarea className="rounded-lg" value={contraintes} onChange={(e) => setContraintes(e.target.value)} rows={3} />
                </div>
              </div>
            </Section>

            <Section title="Prestations Proposées">
              <div className="space-y-6">
                {phases.map((phase, i) => (
                  <div key={i} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center gap-3 mb-3">
                      <Switch checked={phase.enabled} onCheckedChange={(v) => updatePhase(i, 'enabled', v)} />
                      <span className="font-medium">{phase.title}</span>
                    </div>
                    <div className="pl-0 space-y-3">
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea className="rounded-lg" value={phase.description} onChange={(e) => updatePhase(i, 'description', e.target.value)} rows={3} />
                      </div>
                      <div className="flex gap-4 items-end">
                        <div className="space-y-2 w-32">
                          <Label>Durée ({phase.unit === 'months' ? 'mois' : 'semaines'})</Label>
                          <Input type="number" className="rounded-lg" value={phase.duration} onChange={(e) => updatePhase(i, 'duration', e.target.value)} placeholder="—" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Honoraires">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mode de rémunération</Label>
                  <Select value={modeRemuneration} onValueChange={setModeRemuneration}>
                    <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MODES_REMUNERATION.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {modeRemuneration === 'percentage' && (
                  <div className="space-y-2">
                    <Label>Pourcentage %</Label>
                    <Input type="number" className="rounded-lg" value={pourcentage} onChange={(e) => setPourcentage(e.target.value)} placeholder="%" />
                  </div>
                )}
                {modeRemuneration === 'forfait' && (
                  <div className="space-y-2">
                    <Label>Forfait HT (FCFA)</Label>
                    <Input type="number" className="rounded-lg" value={forfaitHT} onChange={(e) => setForfaitHT(e.target.value)} />
                  </div>
                )}
                {modeRemuneration === 'horaire' && (
                  <div className="space-y-2">
                    <Label>Tarif horaire HT (FCFA/h)</Label>
                    <Input type="number" className="rounded-lg" value={tarifHoraireHT} onChange={(e) => setTarifHoraireHT(e.target.value)} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Montant total HT estimé (FCFA)</Label>
                  <Input type="number" className="rounded-lg" value={totalHT} onChange={(e) => setTotalHT(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>TVA 20%</Label>
                  <Input className="rounded-lg bg-gray-50" value={tva.toFixed(0)} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Montant TTC</Label>
                  <div className="font-bold text-lg" style={{ color: '#C5A572' }}>{ttc.toFixed(0)} FCFA</div>
                </div>
                <div className="space-y-2">
                  <Label>Acompte à la signature %</Label>
                  <Input type="number" className="rounded-lg" value={acomptePercent} onChange={(e) => setAcomptePercent(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Montant acompte</Label>
                  <div className="font-medium" style={{ color: '#C5A572' }}>{acompteNum.toFixed(0)} FCFA</div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Échéancier des paiements</Label>
                  <Textarea className="rounded-lg" value={echeancier} onChange={(e) => setEcheancier(e.target.value)} rows={2} placeholder="Ex: 30% à la signature, 40% à la livraison des plans, 30% à la réception" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Ce qui est inclus</Label>
                  <Textarea className="rounded-lg" value={inclus} onChange={(e) => setInclus(e.target.value)} rows={4} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Ce qui n'est PAS inclus</Label>
                  <Textarea className="rounded-lg" value={nonInclus} onChange={(e) => setNonInclus(e.target.value)} rows={3} />
                </div>
              </div>
            </Section>

            <Section title="Planning Prévisionnel">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date démarrage souhaitée</Label>
                  <Input type="date" className="rounded-lg" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Durée totale estimée (mois)</Label>
                  <Input type="number" className="rounded-lg" value={dureeTotaleMois} onChange={(e) => setDureeTotaleMois(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Date fin prévisionnelle</Label>
                  <Input className="rounded-lg bg-gray-50" value={dateFinCalc ? format(new Date(dateFinCalc), 'dd/MM/yyyy') : ''} readOnly />
                </div>
              </div>
            </Section>

            <Section title="Conditions">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Assurance RC Pro n°</Label>
                  <Input className="rounded-lg" value={rcPro} onChange={(e) => setRcPro(e.target.value)} placeholder="Numéro de police" />
                </div>
                <div className="space-y-2">
                  <Label>Délai de rétractation</Label>
                  <p className="text-sm text-gray-600">14 jours</p>
                </div>
                <div className="space-y-2">
                  <Label>Conditions de résiliation</Label>
                  <Textarea className="rounded-lg" value={conditionsResiliation} onChange={(e) => setConditionsResiliation(e.target.value)} rows={5} />
                </div>
              </div>
            </Section>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="border-[#C5A572] text-[#C5A572] hover:bg-[#C5A572]/10 rounded-lg" onClick={handleSaveDraft}>
                Sauvegarder brouillon
              </Button>
              <Button className="bg-[#C5A572] hover:bg-[#B08D5B] text-white rounded-lg" onClick={handleFinalize}>
                Finaliser
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <Card className="max-w-4xl mx-auto rounded-xl shadow-sm overflow-hidden">
            <CardContent className="p-8 bg-white">
              <div className="space-y-6 font-sans text-sm text-gray-800">
                <div className="flex justify-between items-start border-b pb-4" style={{ borderColor: '#C5A572' }}>
                  <span className="font-serif text-xl" style={{ color: '#C5A572' }}>INDESIGN</span>
                  <div className="text-right">
                    <div className="font-serif text-lg font-medium" style={{ color: '#C5A572' }}>PROPOSITION DE MISSION</div>
                    <div className="text-xs text-gray-500 mt-1">N° {docNumber}</div>
                    <div className="text-xs text-gray-500">{format(new Date(dateDoc), 'd MMMM yyyy', { locale: fr })}</div>
                    {projects.find((p) => p.id === projectId)?.name && <div className="text-xs text-gray-600 mt-1">Projet : {projects.find((p) => p.id === projectId)?.name}</div>}
                    {clientName && <div className="text-xs text-gray-600">Client : {clientName}</div>}
                  </div>
                </div>
                {presentation && <div className="whitespace-pre-wrap">{presentation}</div>}
                {referencesProjets && <div><strong style={{ color: '#C5A572' }}>Références :</strong><div className="whitespace-pre-wrap mt-1">{referencesProjets}</div></div>}
                {resumeBrief && <div><strong style={{ color: '#C5A572' }}>Résumé du brief :</strong><div className="whitespace-pre-wrap mt-1">{resumeBrief}</div></div>}
                {objectifs && <div><strong style={{ color: '#C5A572' }}>Objectifs :</strong><div className="whitespace-pre-wrap mt-1">{objectifs}</div></div>}
                {contraintes && <div><strong style={{ color: '#C5A572' }}>Contraintes :</strong><div className="whitespace-pre-wrap mt-1">{contraintes}</div></div>}
                <div>
                  <strong style={{ color: '#C5A572' }}>Prestations proposées</strong>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {phases.filter((p) => p.enabled).map((p, i) => (
                      <li key={i}><strong>{p.title}</strong> {p.duration && `— ${p.duration} ${p.unit === 'months' ? 'mois' : 'semaines'}`}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border-2 p-4" style={{ borderColor: '#C5A572' }}>
                  <strong style={{ color: '#C5A572' }}>Honoraires</strong>
                  <div className="mt-2 space-y-1">
                    <p>Mode : {MODES_REMUNERATION.find((x) => x.value === modeRemuneration)?.label}</p>
                    <p>Total HT : <strong>{totalHT || '0'} FCFA</strong></p>
                    <p>TVA 20% : {tva.toFixed(0)} FCFA</p>
                    <p className="font-bold text-lg" style={{ color: '#C5A572' }}>TTC : {ttc.toFixed(0)} FCFA</p>
                    <p>Acompte {acomptePercent}% : {acompteNum.toFixed(0)} FCFA</p>
                  </div>
                </div>
                {(dateDebut || dureeTotaleMois) && (
                  <div>
                    <strong style={{ color: '#C5A572' }}>Planning</strong>
                    <p className="mt-1">{dateDebut && format(new Date(dateDebut), 'd MMMM yyyy', { locale: fr })} — {dureeTotaleMois} mois — Fin : {dateFinCalc ? format(new Date(dateFinCalc), 'd MMMM yyyy', { locale: fr }) : '-'}</p>
                  </div>
                )}
                <div className="pt-8 border-t flex justify-between">
                  <div>
                    <p className="font-semibold">Pour INDESIGN</p>
                    <div className="h-12 w-40 border-b border-gray-400 mt-2" />
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Le client</p>
                    <div className="h-12 w-40 border-b border-gray-400 mt-2 ml-auto" />
                  </div>
                </div>
                <div className="pt-4 text-xs text-gray-500 text-center">INDESIGN | Proposition de mission | Confidentiel</div>
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
                Prévisualiser
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
