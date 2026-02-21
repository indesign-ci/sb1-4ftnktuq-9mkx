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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { generateProfessionalDocumentPDF } from '@/lib/pdf/professional-document-pdf'

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

type ArtisanCol = {
  id: string
  nom_entreprise: string
  siret: string
  assurance_decennale: 'Oui' | 'Non'
  assurance_rc_pro: 'Oui' | 'Non'
  total_ht: string
  tva: string
  total_ttc: string
  delai_execution: string
}

type PosteComparatif = {
  id: string
  intitule: string
  prix: string[]
  remarques: string
}

const newArtisan = (): ArtisanCol => ({
  id: crypto.randomUUID(),
  nom_entreprise: '',
  siret: '',
  assurance_decennale: 'Non',
  assurance_rc_pro: 'Non',
  total_ht: '',
  tva: '',
  total_ttc: '',
  delai_execution: '',
})

const newPoste = (nbArtisans: number): PosteComparatif => ({
  id: crypto.randomUUID(),
  intitule: '',
  prix: Array(nbArtisans).fill(''),
  remarques: '',
})

export default function ComparatifDevisPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [company, setCompany] = useState<{ name?: string } | null>(null)

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    project_id: '',
    lot: '',
    artisan_recommande_index: 0,
    justification: '',
    points_vigilance: '',
  })

  const [artisans, setArtisans] = useState<ArtisanCol[]>(() => [newArtisan(), newArtisan()])
  const [postes, setPostes] = useState<PosteComparatif[]>(() => [newPoste(2)])

  useEffect(() => {
    if (!profile?.company_id) return
    const load = async () => {
      try {
        const [projRes, companyRes] = await Promise.all([
          supabase.from('projects').select('id, name').eq('company_id', profile.company_id),
          supabase.from('companies').select('name').eq('id', profile.company_id).maybeSingle(),
        ])
        if (projRes.data) setProjects(projRes.data)
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
    return `COMP-${year}-${seq}`
  }

  const selectedProject = projects.find((p) => p.id === formData.project_id)
  const nbArtisans = artisans.length

  const addArtisan = () => {
    const a = newArtisan()
    setArtisans((prev) => [...prev, a])
    setPostes((prev) => prev.map((p) => ({ ...p, prix: [...p.prix, ''] })))
  }

  const removeArtisan = (index: number) => {
    if (nbArtisans <= 1) return
    setArtisans((prev) => prev.filter((_, i) => i !== index))
    setPostes((prev) => prev.map((p) => ({ ...p, prix: p.prix.filter((_, i) => i !== index) })))
    if (formData.artisan_recommande_index >= nbArtisans - 1) {
      setFormData((prev) => ({ ...prev, artisan_recommande_index: Math.max(0, nbArtisans - 2) }))
    } else if (formData.artisan_recommande_index > index) {
      setFormData((prev) => ({ ...prev, artisan_recommande_index: prev.artisan_recommande_index - 1 }))
    }
  }

  const updateArtisan = (index: number, field: keyof ArtisanCol, value: string) => {
    setArtisans((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)))
  }

  const addPoste = () => {
    setPostes((prev) => [...prev, newPoste(nbArtisans)])
  }

  const removePoste = (id: string) => {
    setPostes((prev) => prev.filter((p) => p.id !== id))
  }

  const updatePoste = (id: string, field: 'intitule' | 'remarques', value: string) => {
    setPostes((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const updatePostePrix = (posteId: string, artisanIndex: number, value: string) => {
    setPostes((prev) =>
      prev.map((p) => {
        if (p.id !== posteId) return p
        const prix = [...p.prix]
        prix[artisanIndex] = value
        return { ...p, prix }
      })
    )
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
        document_type: 'comparatif_devis_artisans',
        document_phase: 'phase5',
        document_number: generateDocumentNumber(),
        title: `Comparatif devis - ${selectedProject?.name ?? 'Projet'} - ${formData.lot || 'Lot'}`,
        project_id: formData.project_id || null,
        client_id: selectedProject ? undefined : null,
        status: 'draft',
        document_data: { ...formData, artisans, postes },
      })
      if (error) throw error
      toast.success('Comparatif sauvegardé en brouillon')
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
      const headers = artisans.map((a) => a.nom_entreprise || `Artisan ${artisans.indexOf(a) + 1}`).join(' | ')
      const siretLine = artisans.map((a) => a.siret || '—').join(' | ')
      const decennaleLine = artisans.map((a) => a.assurance_decennale).join(' | ')
      const rcProLine = artisans.map((a) => a.assurance_rc_pro).join(' | ')
      const postesLines = postes
        .map(
          (p) =>
            `Poste: ${p.intitule || '—'}\nPrix: ${p.prix.join(' | ')}\nRemarques: ${p.remarques || '—'}`
        )
        .join('\n\n')
      const totalHt = artisans.map((a) => a.total_ht || '—').join(' | ')
      const tvaLine = artisans.map((a) => a.tva || '—').join(' | ')
      const totalTtc = artisans.map((a) => a.total_ttc || '—').join(' | ')
      const delaiLine = artisans.map((a) => a.delai_execution || '—').join(' | ')
      const recommandation = artisans[formData.artisan_recommande_index]?.nom_entreprise || '—'

      const sections = [
        { title: 'Tableau comparatif', content: `Entreprises: ${headers}\nSIRET: ${siretLine}\nAssurance décennale: ${decennaleLine}\nAssurance RC Pro: ${rcProLine}\n\n${postesLines}\n\nTotal HT: ${totalHt}\nTVA: ${tvaLine}\nTotal TTC: ${totalTtc}\nDélai d'exécution: ${delaiLine}` },
        { title: 'Analyse & Recommandation', content: `Artisan recommandé: ${recommandation}\n\nJustification: ${formData.justification || '—'}\n\nPoints de vigilance: ${formData.points_vigilance || '—'}` },
      ]
      await generateProfessionalDocumentPDF({
        documentNumber: generateDocumentNumber(),
        documentTitle: 'Tableau comparatif des devis artisans',
        documentDate: new Date(formData.date),
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
              <Label>Lot concerné</Label>
              <Select value={formData.lot} onValueChange={(v) => setFormData({ ...formData, lot: v })}>
                <SelectTrigger><SelectValue placeholder="Choisir un lot" /></SelectTrigger>
                <SelectContent>
                  {LOTS.map((lot) => (
                    <SelectItem key={lot} value={lot}>{lot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Tableau comparatif</h3>
            <Button type="button" variant="outline" size="sm" onClick={addArtisan}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter un artisan
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 p-2 text-left w-48">Critère / Poste</th>
                  {artisans.map((a, i) => (
                    <th key={a.id} className="border border-gray-200 p-2 min-w-[140px]">
                      <div className="flex items-center justify-between gap-2">
                        <span>Artisan {i + 1}</span>
                        {nbArtisans > 1 && (
                          <button type="button" onClick={() => removeArtisan(i)} className="text-red-600 hover:underline">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <Input
                        placeholder="Nom entreprise"
                        value={a.nom_entreprise}
                        onChange={(e) => updateArtisan(i, 'nom_entreprise', e.target.value)}
                        className="mt-1 font-normal"
                      />
                    </th>
                  ))}
                  <th className="border border-gray-200 p-2 text-left min-w-[120px]">Remarques</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 p-2 font-medium">SIRET</td>
                  {artisans.map((a, i) => (
                    <td key={a.id} className="border border-gray-200 p-2">
                      <Input placeholder="SIRET" value={a.siret} onChange={(e) => updateArtisan(i, 'siret', e.target.value)} className="h-8" />
                    </td>
                  ))}
                  <td className="border border-gray-200 p-2 bg-gray-50" />
                </tr>
                <tr>
                  <td className="border border-gray-200 p-2 font-medium">Assurance décennale</td>
                  {artisans.map((a, i) => (
                    <td key={a.id} className="border border-gray-200 p-2">
                      <Select value={a.assurance_decennale} onValueChange={(v) => updateArtisan(i, 'assurance_decennale', v as 'Oui' | 'Non')}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Oui">Oui</SelectItem><SelectItem value="Non">Non</SelectItem></SelectContent>
                      </Select>
                    </td>
                  ))}
                  <td className="border border-gray-200 p-2 bg-gray-50" />
                </tr>
                <tr>
                  <td className="border border-gray-200 p-2 font-medium">Assurance RC Pro</td>
                  {artisans.map((a, i) => (
                    <td key={a.id} className="border border-gray-200 p-2">
                      <Select value={a.assurance_rc_pro} onValueChange={(v) => updateArtisan(i, 'assurance_rc_pro', v as 'Oui' | 'Non')}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Oui">Oui</SelectItem><SelectItem value="Non">Non</SelectItem></SelectContent>
                      </Select>
                    </td>
                  ))}
                  <td className="border border-gray-200 p-2 bg-gray-50" />
                </tr>

                {postes.map((p) => (
                  <tr key={p.id}>
                    <td className="border border-gray-200 p-2 font-medium align-top">
                      <div className="flex items-center gap-1">
                        <Input placeholder="Intitulé poste" value={p.intitule} onChange={(e) => updatePoste(p.id, 'intitule', e.target.value)} className="h-8" />
                        <button type="button" onClick={() => removePoste(p.id)} className="text-red-600 shrink-0"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                    {p.prix.map((prix, i) => (
                      <td key={i} className="border border-gray-200 p-2">
                        <Input type="text" placeholder="Prix" value={prix} onChange={(e) => updatePostePrix(p.id, i, e.target.value)} className="h-8" />
                      </td>
                    ))}
                    <td className="border border-gray-200 p-2">
                      <Input placeholder="Remarques" value={p.remarques} onChange={(e) => updatePoste(p.id, 'remarques', e.target.value)} className="h-8" />
                    </td>
                  </tr>
                ))}

                <tr className="bg-gray-50">
                  <td className="border border-gray-200 p-2 font-medium">Total HT</td>
                  {artisans.map((a, i) => (
                    <td key={a.id} className="border border-gray-200 p-2">
                      <Input placeholder="Total HT" value={a.total_ht} onChange={(e) => updateArtisan(i, 'total_ht', e.target.value)} className="h-8" />
                    </td>
                  ))}
                  <td className="border border-gray-200 p-2 bg-gray-50" />
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-200 p-2 font-medium">TVA</td>
                  {artisans.map((a, i) => (
                    <td key={a.id} className="border border-gray-200 p-2">
                      <Input placeholder="TVA" value={a.tva} onChange={(e) => updateArtisan(i, 'tva', e.target.value)} className="h-8" />
                    </td>
                  ))}
                  <td className="border border-gray-200 p-2 bg-gray-50" />
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-200 p-2 font-medium">Total TTC</td>
                  {artisans.map((a, i) => (
                    <td key={a.id} className="border border-gray-200 p-2">
                      <Input placeholder="Total TTC" value={a.total_ttc} onChange={(e) => updateArtisan(i, 'total_ttc', e.target.value)} className="h-8" />
                    </td>
                  ))}
                  <td className="border border-gray-200 p-2 bg-gray-50" />
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-200 p-2 font-medium">Délai d'exécution</td>
                  {artisans.map((a, i) => (
                    <td key={a.id} className="border border-gray-200 p-2">
                      <Input placeholder="Ex: 6 semaines" value={a.delai_execution} onChange={(e) => updateArtisan(i, 'delai_execution', e.target.value)} className="h-8" />
                    </td>
                  ))}
                  <td className="border border-gray-200 p-2 bg-gray-50" />
                </tr>
              </tbody>
            </table>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addPoste} className="mt-2">
            <Plus className="h-4 w-4 mr-2" /> Ajouter un poste
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Analyse & Recommandation</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Artisan recommandé</Label>
              <Select
                value={String(formData.artisan_recommande_index)}
                onValueChange={(v) => setFormData({ ...formData, artisan_recommande_index: parseInt(v, 10) })}
              >
                <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                <SelectContent>
                  {artisans.map((a, i) => (
                    <SelectItem key={a.id} value={String(i)}>{a.nom_entreprise || `Artisan ${i + 1}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Justification</Label>
              <Textarea rows={4} value={formData.justification} onChange={(e) => setFormData({ ...formData, justification: e.target.value })} placeholder="Pourquoi cet artisan est recommandé..." />
            </div>
            <div className="space-y-2">
              <Label>Points de vigilance</Label>
              <Textarea rows={3} value={formData.points_vigilance} onChange={(e) => setFormData({ ...formData, points_vigilance: e.target.value })} placeholder="Points à surveiller..." />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const previewContent = (
    <ProfessionalDocumentPreview
      documentNumber={generateDocumentNumber()}
      documentTitle="Tableau comparatif des devis artisans"
      documentDate={new Date(formData.date)}
      companyName={company?.name}
      projectName={selectedProject?.name}
    >
      <div className="space-y-6 text-sm">
        <div>
          <h4 className="font-semibold text-[#C5A572]">Tableau comparatif</h4>
          <div className="overflow-x-auto mt-2">
            <table className="w-full border border-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 p-2 text-left">Critère</th>
                  {artisans.map((a, i) => (
                    <th key={a.id} className="border border-gray-200 p-2">{a.nom_entreprise || `Artisan ${i + 1}`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr><td className="border p-2 font-medium">SIRET</td>{artisans.map((a) => <td key={a.id} className="border p-2">{a.siret || '—'}</td>)}</tr>
                <tr><td className="border p-2 font-medium">Assurance décennale</td>{artisans.map((a) => <td key={a.id} className="border p-2">{a.assurance_decennale}</td>)}</tr>
                <tr><td className="border p-2 font-medium">Assurance RC Pro</td>{artisans.map((a) => <td key={a.id} className="border p-2">{a.assurance_rc_pro}</td>)}</tr>
                {postes.map((p) => (
                  <tr key={p.id}>
                    <td className="border p-2 font-medium">{p.intitule || '—'}</td>
                    {p.prix.map((prix, i) => <td key={i} className="border p-2">{prix || '—'}</td>)}
                    <td className="border p-2 text-gray-600">{p.remarques || '—'}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50"><td className="border p-2 font-medium">Total HT</td>{artisans.map((a) => <td key={a.id} className="border p-2">{a.total_ht || '—'}</td>)}</tr>
                <tr className="bg-gray-50"><td className="border p-2 font-medium">TVA</td>{artisans.map((a) => <td key={a.id} className="border p-2">{a.tva || '—'}</td>)}</tr>
                <tr className="bg-gray-50"><td className="border p-2 font-medium">Total TTC</td>{artisans.map((a) => <td key={a.id} className="border p-2">{a.total_ttc || '—'}</td>)}</tr>
                <tr className="bg-gray-50"><td className="border p-2 font-medium">Délai d'exécution</td>{artisans.map((a) => <td key={a.id} className="border p-2">{a.delai_execution || '—'}</td>)}</tr>
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-[#C5A572]">Analyse & Recommandation</h4>
          <p className="font-medium mt-1">Artisan recommandé : {artisans[formData.artisan_recommande_index]?.nom_entreprise || '—'}</p>
          <p className="mt-2 whitespace-pre-wrap">{formData.justification || '—'}</p>
          <p className="mt-2"><span className="font-medium">Points de vigilance :</span> {formData.points_vigilance || '—'}</p>
        </div>
      </div>
    </ProfessionalDocumentPreview>
  )

  return (
    <BaseDocumentLayout
      title="Tableau comparatif des devis artisans"
      formContent={formContent}
      previewContent={previewContent}
      onSave={handleSave}
      isSaving={isSaving}
      onPreviewPDF={handleDownloadPDF}
    />
  )
}
