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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { generateProfessionalDocumentPDF } from '@/lib/pdf/professional-document-pdf'

const LOTS_FINANCIER = [
  'Démolition & Préparation',
  'Gros œuvre / Maçonnerie',
  'Plomberie / Sanitaires',
  'Électricité / Courants faibles',
  'Peinture / Enduits',
  'Revêtements de sol',
  'Revêtements muraux',
  'Menuiserie intérieure',
  'Menuiserie extérieure',
  'Serrurerie / Métallerie',
  'Cuisine (fourniture + pose)',
  'Salle(s) de bain (fourniture + pose)',
  'Mobilier',
  'Luminaires',
  'Décoration & Accessoires',
  'Textiles (rideaux, stores, tapis)',
  'Honoraires maîtrise d\'œuvre',
  'Diagnostics & Études',
  'Frais divers / Imprévus',
] as const

type LigneFinanciere = {
  id: string
  lot: string
  entreprise: string
  marche_ht: string
  avenants_ht: string
  facture_ht: string
  paye_ht: string
  pct_avancement: string
  observations: string
}

const toNum = (s: string) => (s === '' ? 0 : parseFloat(String(s).replace(/\s/g, '').replace(',', '.')) || 0)

const defaultLigne = (): LigneFinanciere => ({
  id: crypto.randomUUID(),
  lot: '',
  entreprise: '',
  marche_ht: '',
  avenants_ht: '',
  facture_ht: '',
  paye_ht: '',
  pct_avancement: '',
  observations: '',
})

export default function SuiviFinancierPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [projects, setProjects] = useState<{ id: string; name: string; client_id?: string }[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [company, setCompany] = useState<{ name?: string } | null>(null)

  const [formData, setFormData] = useState({
    project_id: '',
    date_maj: new Date().toISOString().split('T')[0],
    budget_initial: '',
    provision_imprevus: '',
  })

  const [lignes, setLignes] = useState<LigneFinanciere[]>([defaultLigne()])

  useEffect(() => {
    if (!profile?.company_id) return
    const load = async () => {
      try {
        const [projRes, supRes, companyRes] = await Promise.all([
          supabase.from('projects').select('id, name, client_id').eq('company_id', profile.company_id),
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

  const totals = useMemo(() => {
    let marche_ht = 0
    let avenants_ht = 0
    let total_marche = 0
    let facture_ht = 0
    let paye_ht = 0
    lignes.forEach((l) => {
      const m = toNum(l.marche_ht)
      const a = toNum(l.avenants_ht)
      const f = toNum(l.facture_ht)
      const p = toNum(l.paye_ht)
      marche_ht += m
      avenants_ht += a
      total_marche += m + a
      facture_ht += f
      paye_ht += p
    })
    return {
      marche_ht,
      avenants_ht,
      total_marche,
      facture_ht,
      paye_ht,
      reste_a_facturer: total_marche - facture_ht,
      reste_a_payer: facture_ht - paye_ht,
    }
  }, [lignes])

  const budgetInitial = toNum(formData.budget_initial)
  const totalMarchesSignes = totals.total_marche
  const totalAvenants = totals.avenants_ht
  const budgetRevise = budgetInitial + totalAvenants
  const ecartVsInitial = budgetRevise - budgetInitial
  const ecartPct = budgetInitial !== 0 ? (ecartVsInitial / budgetInitial) * 100 : 0
  const provisionImprevus = toNum(formData.provision_imprevus)
  const soldeDisponible = budgetRevise - totals.facture_ht - provisionImprevus

  const chartData = useMemo(
    () => [
      { name: 'Budget initial', value: budgetInitial, fill: '#94a3b8' },
      { name: 'Engagé', value: totalMarchesSignes, fill: '#C5A572' },
      { name: 'Facturé', value: totals.facture_ht, fill: '#3b82f6' },
      { name: 'Payé', value: totals.paye_ht, fill: '#22c55e' },
    ],
    [budgetInitial, totalMarchesSignes, totals.facture_ht, totals.paye_ht]
  )

  const addLigne = () => setLignes((prev) => [...prev, defaultLigne()])
  const removeLigne = (id: string) => setLignes((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev))
  const updateLigne = (id: string, field: keyof LigneFinanciere, value: string) => {
    setLignes((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)))
  }

  const formatEuro = (n: number) => (Number.isNaN(n) ? '0' : new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) + ' €')

  const handleSave = async () => {
    if (!formData.project_id) {
      toast.error('Veuillez sélectionner un projet')
      return
    }
    setIsSaving(true)
    try {
      const selectedProject = projects.find((p) => p.id === formData.project_id)
      const { error } = await supabase.from('professional_documents').insert({
        company_id: profile?.company_id,
        created_by: profile?.id,
        document_type: 'suivi_financier_chantier',
        document_phase: 'phase6',
        document_number: `SF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
        title: `Suivi financier - ${selectedProject?.name ?? ''}`,
        project_id: formData.project_id,
        client_id: selectedProject?.client_id ?? null,
        status: 'draft',
        document_data: { formData, lignes, totals },
      })
      if (error) throw error
      toast.success('Suivi financier sauvegardé en brouillon')
      router.push('/documents-pro')
    } catch (e) {
      console.error(e)
      toast.error(e?.message || 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadPDF = async () => {
    const selectedProject = projects.find((p) => p.id === formData.project_id)
    if (!selectedProject) {
      toast.error('Veuillez sélectionner un projet')
      return
    }
    try {
      const tableRows = lignes
        .map(
          (l) => {
            const m = toNum(l.marche_ht)
            const a = toNum(l.avenants_ht)
            const tot = m + a
            const f = toNum(l.facture_ht)
            const p = toNum(l.paye_ht)
            return `${l.lot || '—'} | ${l.entreprise || '—'} | ${m} | ${a} | ${tot} | ${f} | ${p} | ${tot - f} | ${f - p} | ${l.pct_avancement || '—'}% | ${l.observations || '—'}`
          }
        )
        .join('\n')
      const sections = [
        {
          title: 'Tableau financier',
          content: `Lot | Entreprise | Marché HT | Avenants HT | Total marché | Facturé HT | Payé HT | Reste à facturer | Reste à payer | % avancement | Observations\n${tableRows}\n\nTOTAL: Marché HT: ${totals.marche_ht} | Avenants: ${totals.avenants_ht} | Total marché: ${totals.total_marche} | Facturé: ${totals.facture_ht} | Payé: ${totals.paye_ht} | Reste à facturer: ${totals.reste_a_facturer} | Reste à payer: ${totals.reste_a_payer}`,
        },
        {
          title: 'Synthèse',
          content: `Budget initial total: ${formatEuro(budgetInitial)}\nTotal marchés signés: ${formatEuro(totalMarchesSignes)}\nTotal avenants: ${formatEuro(totalAvenants)}\nBudget révisé: ${formatEuro(budgetRevise)}\nÉcart vs budget initial: ${formatEuro(ecartVsInitial)} (${ecartPct.toFixed(1)}%)\nProvision pour imprévus: ${formatEuro(provisionImprevus)}\nSolde disponible: ${formatEuro(soldeDisponible)}`,
        },
      ]
      await generateProfessionalDocumentPDF({
        documentNumber: `SF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
        documentTitle: 'Fiche de suivi financier chantier',
        documentDate: new Date(formData.date_maj),
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

  const selectedProject = projects.find((p) => p.id === formData.project_id)

  const formContent = (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">En-tête</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Projet *</Label>
              <Select value={formData.project_id} onValueChange={(v) => setFormData({ ...formData, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un projet" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date de mise à jour</Label>
              <Input
                type="date"
                value={formData.date_maj}
                onChange={(e) => setFormData({ ...formData, date_maj: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Tableau par lot</h3>
            <button type="button" onClick={addLigne} className="text-sm text-[#C5A572] hover:underline flex items-center gap-1">
              <Plus className="h-4 w-4" /> Ajouter une ligne
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="border border-gray-200 p-2 text-left min-w-[140px]">Lot</th>
                  <th className="border border-gray-200 p-2 text-left min-w-[120px]">Entreprise</th>
                  <th className="border border-gray-200 p-2 text-right w-24">Marché HT</th>
                  <th className="border border-gray-200 p-2 text-right w-24">Avenants HT</th>
                  <th className="border border-gray-200 p-2 text-right w-24">Total marché</th>
                  <th className="border border-gray-200 p-2 text-right w-24">Facturé HT</th>
                  <th className="border border-gray-200 p-2 text-right w-24">Payé HT</th>
                  <th className="border border-gray-200 p-2 text-right w-24">Reste à facturer</th>
                  <th className="border border-gray-200 p-2 text-right w-24">Reste à payer</th>
                  <th className="border border-gray-200 p-2 text-right w-20">% avanc.</th>
                  <th className="border border-gray-200 p-2 text-left min-w-[100px]">Observations</th>
                  <th className="border border-gray-200 p-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => {
                  const m = toNum(l.marche_ht)
                  const a = toNum(l.avenants_ht)
                  const tot = m + a
                  const f = toNum(l.facture_ht)
                  const p = toNum(l.paye_ht)
                  const resteFact = tot - f
                  const restePaye = f - p
                  return (
                    <tr key={l.id} className="border-b border-gray-100">
                      <td className="border border-gray-200 p-1">
                        <Select value={l.lot} onValueChange={(v) => updateLigne(l.id, 'lot', v)}>
                          <SelectTrigger className="h-8 border-0 shadow-none"><SelectValue placeholder="Lot" /></SelectTrigger>
                          <SelectContent>
                            {LOTS_FINANCIER.map((lot) => (
                              <SelectItem key={lot} value={lot}>{lot}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="border border-gray-200 p-1">
                        <Select value={l.entreprise} onValueChange={(v) => updateLigne(l.id, 'entreprise', v)}>
                          <SelectTrigger className="h-8 border-0 shadow-none"><SelectValue placeholder="Entreprise" /></SelectTrigger>
                          <SelectContent>
                            {suppliers.map((s) => (
                              <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="border border-gray-200 p-1 text-right">
                        <Input type="text" inputMode="decimal" className="h-8 text-right w-full" placeholder="0" value={l.marche_ht} onChange={(e) => updateLigne(l.id, 'marche_ht', e.target.value)} />
                      </td>
                      <td className="border border-gray-200 p-1 text-right">
                        <Input type="text" inputMode="decimal" className="h-8 text-right w-full" placeholder="0" value={l.avenants_ht} onChange={(e) => updateLigne(l.id, 'avenants_ht', e.target.value)} />
                      </td>
                      <td className="border border-gray-200 p-1 text-right font-medium">{formatEuro(tot)}</td>
                      <td className="border border-gray-200 p-1 text-right">
                        <Input type="text" inputMode="decimal" className="h-8 text-right w-full" placeholder="0" value={l.facture_ht} onChange={(e) => updateLigne(l.id, 'facture_ht', e.target.value)} />
                      </td>
                      <td className="border border-gray-200 p-1 text-right">
                        <Input type="text" inputMode="decimal" className="h-8 text-right w-full" placeholder="0" value={l.paye_ht} onChange={(e) => updateLigne(l.id, 'paye_ht', e.target.value)} />
                      </td>
                      <td className="border border-gray-200 p-1 text-right text-gray-600">{formatEuro(resteFact)}</td>
                      <td className="border border-gray-200 p-1 text-right text-gray-600">{formatEuro(restePaye)}</td>
                      <td className="border border-gray-200 p-1 text-right">
                        <Input type="text" inputMode="decimal" className="h-8 text-right w-16" placeholder="0" value={l.pct_avancement} onChange={(e) => updateLigne(l.id, 'pct_avancement', e.target.value)} />
                      </td>
                      <td className="border border-gray-200 p-1">
                        <Input className="h-8 w-full" placeholder="Obs." value={l.observations} onChange={(e) => updateLigne(l.id, 'observations', e.target.value)} />
                      </td>
                      <td className="border border-gray-200 p-1">
                        <button type="button" onClick={() => removeLigne(l.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-gray-100 font-semibold">
                  <td className="border border-gray-200 p-2" colSpan={2}>Total</td>
                  <td className="border border-gray-200 p-2 text-right">{formatEuro(totals.marche_ht)}</td>
                  <td className="border border-gray-200 p-2 text-right">{formatEuro(totals.avenants_ht)}</td>
                  <td className="border border-gray-200 p-2 text-right">{formatEuro(totals.total_marche)}</td>
                  <td className="border border-gray-200 p-2 text-right">{formatEuro(totals.facture_ht)}</td>
                  <td className="border border-gray-200 p-2 text-right">{formatEuro(totals.paye_ht)}</td>
                  <td className="border border-gray-200 p-2 text-right">{formatEuro(totals.reste_a_facturer)}</td>
                  <td className="border border-gray-200 p-2 text-right">{formatEuro(totals.reste_a_payer)}</td>
                  <td className="border border-gray-200 p-2" colSpan={3} />
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Synthèse</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Budget initial total (€)</Label>
              <Input
                placeholder="0"
                value={formData.budget_initial}
                onChange={(e) => setFormData({ ...formData, budget_initial: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Total marchés signés</Label>
              <Input readOnly className="bg-gray-100" value={formatEuro(totalMarchesSignes)} />
            </div>
            <div className="space-y-2">
              <Label>Total avenants</Label>
              <Input readOnly className="bg-gray-100" value={formatEuro(totalAvenants)} />
            </div>
            <div className="space-y-2">
              <Label>Budget révisé</Label>
              <Input readOnly className="bg-gray-100" value={formatEuro(budgetRevise)} />
            </div>
            <div className="space-y-2">
              <Label>Écart vs budget initial</Label>
              <Input readOnly className="bg-gray-100" value={`${formatEuro(ecartVsInitial)} (${ecartPct.toFixed(1)}%)`} />
            </div>
            <div className="space-y-2">
              <Label>Provision pour imprévus (€)</Label>
              <Input
                placeholder="0"
                value={formData.provision_imprevus}
                onChange={(e) => setFormData({ ...formData, provision_imprevus: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Solde disponible</Label>
              <Input readOnly className="bg-gray-100" value={formatEuro(soldeDisponible)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Budget initial vs Engagé vs Facturé vs Payé</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={{ stroke: '#e5e7eb' }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={{ stroke: '#e5e7eb' }} tickFormatter={(v) => `${v >= 1000 ? (v / 1000) + 'k' : v}`} />
                <Tooltip formatter={(v: number) => formatEuro(v)} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Bar dataKey="value" name="Montant (€)" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const previewContent = (
    <ProfessionalDocumentPreview
      documentNumber={`SF-${new Date().getFullYear()}-001`}
      documentTitle="Fiche de suivi financier chantier"
      documentDate={new Date(formData.date_maj)}
      companyName={company?.name}
      projectName={selectedProject?.name}
    >
      <div className="space-y-4 mt-6 text-sm">
        <p>Date de mise à jour : {formData.date_maj}</p>
        <p>Budget initial : {formatEuro(budgetInitial)} — Engagé : {formatEuro(totalMarchesSignes)} — Facturé : {formatEuro(totals.facture_ht)} — Payé : {formatEuro(totals.paye_ht)}</p>
        <p>Budget révisé : {formatEuro(budgetRevise)} — Solde disponible : {formatEuro(soldeDisponible)}</p>
      </div>
    </ProfessionalDocumentPreview>
  )

  return (
    <BaseDocumentLayout
      title="Fiche de suivi financier chantier"
      formContent={formContent}
      previewContent={previewContent}
      onSave={handleSave}
      onPreviewPDF={handleDownloadPDF}
      isSaving={isSaving}
    />
  )
}
