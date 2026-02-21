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
import { Plus, Trash2, Upload, Download } from 'lucide-react'
import { generateProfessionalDocumentPDF } from '@/lib/pdf/professional-document-pdf'

const BUCKET_DOCUMENTS = 'documents'
const MAX_FILE_MB = 20
const ACCEPT_FILES = 'image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf'

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

const UNITES = ['m²', 'ml', 'u', 'forfait', 'h'] as const

type PosteTravaux = {
  id: string
  numero: number
  intitule: string
  description: string
  localisation: string
  quantite: string
  unite: string
  materiaux_imposes: string
  plans_joints: string
  plans_joints_file_name: string
  photos_reference: string
  photos_reference_file_name: string
  remarques: string
}

const defaultPoste = (numero: number): PosteTravaux => ({
  id: crypto.randomUUID(),
  numero,
  intitule: '',
  description: '',
  localisation: '',
  quantite: '',
  unite: 'u',
  materiaux_imposes: '',
  plans_joints: '',
  plans_joints_file_name: '',
  photos_reference: '',
  photos_reference_file_name: '',
  remarques: '',
})

export default function CahierChargesArtisansPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [projects, setProjects] = useState<{ id: string; name: string; address?: string; city?: string; postal_code?: string; client_id?: string }[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [company, setCompany] = useState<{ name?: string; address?: string; phone?: string; email?: string } | null>(null)

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    project_id: '',
    lot: '',
    artisan_supplier_id: '',
    artisan_libre: '',
    normes: '',
    dtu: '',
    materiaux_fournis_client_oui_non: 'Non',
    materiaux_fournis_client_liste: '',
    contraintes_acces: '',
    horaires_chantier: '',
    gestion_dechets: '',
    protection_ouvrages: '',
    date_limite_devis: '',
    duree_validite_devis: '',
    format_reponse: 'poste par poste',
    visite_obligatoire: 'Non',
    date_visite: '',
    contact_site: '',
    documents_plans: '',
    documents_details_techniques: '',
    documents_echantillons: '',
    documents_plans_file_name: '',
    documents_details_techniques_file_name: '',
  })

  const [postes, setPostes] = useState<PosteTravaux[]>([defaultPoste(1)])
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.company_id) return
    const load = async () => {
      try {
        const [projRes, supRes, companyRes] = await Promise.all([
          supabase.from('projects').select('id, name, address, city, postal_code, client_id').eq('company_id', profile.company_id),
          supabase.from('suppliers').select('id, name').eq('company_id', profile.company_id).order('name'),
          supabase.from('companies').select('name, address, phone, email').eq('id', profile.company_id).maybeSingle(),
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

  const uploadFile = async (
    file: File,
    fieldKey: string
  ): Promise<{ url: string; name: string }> => {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Fichier trop volumineux (max ${MAX_FILE_MB} Mo)`)
      throw new Error('File too large')
    }
    const companyId = profile?.company_id || 'anon'
    const ext = file.name.split('.').pop() || 'bin'
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const path = `cahier-charges/${companyId}/${Date.now()}_${safeName}`

    setUploading(fieldKey)
    try {
      const { error } = await supabase.storage.from(BUCKET_DOCUMENTS).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from(BUCKET_DOCUMENTS).getPublicUrl(path)
      return { url: publicUrl, name: file.name }
    } finally {
      setUploading(null)
    }
  }

  const generateDocumentNumber = () => {
    const year = new Date().getFullYear()
    const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
    return `CDC-${year}-${seq}`
  }

  const selectedProject = projects.find((p) => p.id === formData.project_id)
  const projectAddress = selectedProject
    ? [selectedProject.address, selectedProject.postal_code, selectedProject.city].filter(Boolean).join(', ') || selectedProject.name
    : ''
  const artisanLabel = formData.artisan_supplier_id
    ? suppliers.find((s) => s.id === formData.artisan_supplier_id)?.name ?? formData.artisan_libre
    : formData.artisan_libre || '—'

  const addPoste = () => {
    setPostes((prev) => [...prev, defaultPoste(prev.length + 1)])
  }

  const removePoste = (id: string) => {
    setPostes((prev) => {
      const next = prev.filter((p) => p.id !== id)
      return next.map((p, i) => ({ ...p, numero: i + 1 }))
    })
  }

  const updatePoste = (id: string, field: keyof PosteTravaux, value: string | number) => {
    setPostes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
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
        document_type: 'cahier_charges_artisans',
        document_phase: 'phase4',
        document_number: generateDocumentNumber(),
        title: `Cahier des charges artisans - ${selectedProject?.name ?? 'Projet'} - ${formData.lot || 'Lot'}`,
        project_id: formData.project_id || null,
        client_id: selectedProject?.client_id ?? null,
        status: 'draft',
        document_data: { ...formData, postes },
      })
      if (error) throw error
      toast.success('Cahier des charges sauvegardé en brouillon')
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
      const sections: { title: string; content: string }[] = [
        {
          title: 'Informations Projet',
          content: `Projet : ${selectedProject.name}\nAdresse : ${projectAddress}\nLot : ${formData.lot || '—'}\nArtisan destinataire : ${artisanLabel}`,
        },
        {
          title: 'Descriptif des Travaux',
          content: postes
            .map(
              (p) =>
                `Poste ${p.numero} — ${p.intitule}\n${p.description ? p.description + '\n' : ''}Localisation : ${p.localisation || '—'} | Qté : ${p.quantite || '—'} ${p.unite}\nMatériaux imposés : ${p.materiaux_imposes || '—'}\nPlans joints : ${p.plans_joints || '—'}\nPhotos : ${p.photos_reference || '—'}\nRemarques : ${p.remarques || '—'}`
            )
            .join('\n\n'),
        },
        {
          title: 'Prescriptions Techniques',
          content: `Normes : ${formData.normes || '—'}\nDTU : ${formData.dtu || '—'}\nMatériaux fournis par le client : ${formData.materiaux_fournis_client_oui_non}${formData.materiaux_fournis_client_liste ? ' — ' + formData.materiaux_fournis_client_liste : ''}\nContraintes d'accès : ${formData.contraintes_acces || '—'}\nHoraires chantier : ${formData.horaires_chantier || '—'}\nGestion des déchets : ${formData.gestion_dechets || '—'}\nProtection des ouvrages : ${formData.protection_ouvrages || '—'}`,
        },
        {
          title: 'Conditions de Consultation',
          content: `Date limite de remise des devis : ${formData.date_limite_devis || '—'}\nDurée de validité des devis : ${formData.duree_validite_devis || '—'}\nFormat de réponse : ${formData.format_reponse || '—'}\nVisite sur site obligatoire : ${formData.visite_obligatoire}\nDate de visite proposée : ${formData.date_visite || '—'}\nContact sur site : ${formData.contact_site || '—'}`,
        },
        {
          title: 'Documents Joints',
          content: `Plans : ${formData.documents_plans || '—'}\nDétails techniques : ${formData.documents_details_techniques || '—'}\nÉchantillons / Références : ${formData.documents_echantillons || '—'}`,
        },
      ]
      await generateProfessionalDocumentPDF({
        documentNumber: generateDocumentNumber(),
        documentTitle: 'Cahier des Charges Artisans',
        documentDate: new Date(formData.date),
        company: { name: company?.name ?? '', address: company?.address, phone: company?.phone, email: company?.email },
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
          <h3 className="text-lg font-semibold text-gray-900">Informations Projet</h3>
          <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} {p.address ? ` — ${p.address}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {projectAddress && <p className="text-sm text-gray-600">Adresse : {projectAddress}</p>}
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
            <div className="space-y-2">
              <Label>Artisan destinataire</Label>
              <Select
                value={formData.artisan_supplier_id || '__libre__'}
                onValueChange={(v) => setFormData({ ...formData, artisan_supplier_id: v === '__libre__' ? '' : v })}
              >
                <SelectTrigger><SelectValue placeholder="Fournisseur ou autre" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                  <SelectItem value="__libre__">Autre (texte libre)</SelectItem>
                </SelectContent>
              </Select>
              {(!formData.artisan_supplier_id || formData.artisan_supplier_id === '__libre__') && (
                <Input
                  placeholder="Nom de l'artisan (texte libre)"
                  value={formData.artisan_libre}
                  onChange={(e) => setFormData({ ...formData, artisan_libre: e.target.value })}
                  className="mt-2"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Descriptif des Travaux</h3>
            {uploading && <span className="text-sm text-gray-500">Upload en cours...</span>}
            <Button type="button" variant="outline" size="sm" onClick={addPoste}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter un poste
            </Button>
          </div>
          <div className="space-y-4">
            {postes.map((p) => (
              <div key={p.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Poste {p.numero}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removePoste(p.id)} className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label>Intitulé du poste</Label>
                    <Input value={p.intitule} onChange={(e) => updatePoste(p.id, 'intitule', e.target.value)} placeholder="Intitulé" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Description détaillée des travaux</Label>
                    <Textarea rows={3} value={p.description} onChange={(e) => updatePoste(p.id, 'description', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Localisation (pièce(s))</Label>
                    <Input value={p.localisation} onChange={(e) => updatePoste(p.id, 'localisation', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantité</Label>
                    <Input type="text" value={p.quantite} onChange={(e) => updatePoste(p.id, 'quantite', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Unité</Label>
                    <Select value={p.unite} onValueChange={(v) => updatePoste(p.id, 'unite', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {UNITES.map((u) => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Matériaux imposés (référence)</Label>
                    <Input value={p.materiaux_imposes} onChange={(e) => updatePoste(p.id, 'materiaux_imposes', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Plans joints</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        type="file"
                        accept={ACCEPT_FILES}
                        className="max-w-[200px] text-sm"
                        disabled={!!uploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          try {
                            const { url, name } = await uploadFile(file, `plans-${p.id}`)
                            updatePoste(p.id, 'plans_joints', url)
                            updatePoste(p.id, 'plans_joints_file_name', name)
                            toast.success('Fichier envoyé')
                          } catch (err) {
                            toast.error('Erreur upload')
                          }
                          e.target.value = ''
                        }}
                      />
                      {!p.plans_joints?.startsWith('http') && (
                        <Input
                          placeholder="Ou référence texte"
                          value={p.plans_joints}
                          onChange={(e) => updatePoste(p.id, 'plans_joints', e.target.value)}
                          className="flex-1 min-w-[120px]"
                        />
                      )}
                    </div>
                    {(p.plans_joints?.startsWith('http') || p.plans_joints_file_name) && (
                      <p className="text-sm flex items-center gap-2">
                        <span className="text-gray-600">{p.plans_joints_file_name || 'Fichier joint'}</span>
                        <a href={p.plans_joints} target="_blank" rel="noopener noreferrer" className="text-[#C5A572] hover:underline inline-flex items-center gap-1">
                          <Download className="h-3.5 w-3.5" /> Télécharger
                        </a>
                        <button type="button" onClick={() => { updatePoste(p.id, 'plans_joints', ''); updatePoste(p.id, 'plans_joints_file_name', '') }} className="text-red-600 text-xs">Supprimer</button>
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Photos de référence</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        type="file"
                        accept={ACCEPT_FILES}
                        className="max-w-[200px] text-sm"
                        disabled={!!uploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          try {
                            const { url, name } = await uploadFile(file, `photos-${p.id}`)
                            updatePoste(p.id, 'photos_reference', url)
                            updatePoste(p.id, 'photos_reference_file_name', name)
                            toast.success('Fichier envoyé')
                          } catch (err) {
                            toast.error('Erreur upload')
                          }
                          e.target.value = ''
                        }}
                      />
                      {!p.photos_reference?.startsWith('http') && (
                        <Input
                          placeholder="Ou référence texte"
                          value={p.photos_reference}
                          onChange={(e) => updatePoste(p.id, 'photos_reference', e.target.value)}
                          className="flex-1 min-w-[120px]"
                        />
                      )}
                    </div>
                    {(p.photos_reference?.startsWith('http') || p.photos_reference_file_name) && (
                      <p className="text-sm flex items-center gap-2">
                        <span className="text-gray-600">{p.photos_reference_file_name || 'Fichier joint'}</span>
                        <a href={p.photos_reference} target="_blank" rel="noopener noreferrer" className="text-[#C5A572] hover:underline inline-flex items-center gap-1">
                          <Download className="h-3.5 w-3.5" /> Télécharger
                        </a>
                        <button type="button" onClick={() => { updatePoste(p.id, 'photos_reference', ''); updatePoste(p.id, 'photos_reference_file_name', '') }} className="text-red-600 text-xs">Supprimer</button>
                      </p>
                    )}
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Remarques techniques</Label>
                    <Textarea rows={2} value={p.remarques} onChange={(e) => updatePoste(p.id, 'remarques', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Prescriptions Techniques</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Normes à respecter</Label>
              <Textarea rows={2} value={formData.normes} onChange={(e) => setFormData({ ...formData, normes: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>DTU applicables</Label>
              <Textarea rows={2} value={formData.dtu} onChange={(e) => setFormData({ ...formData, dtu: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Matériaux fournis par le client</Label>
              <Select value={formData.materiaux_fournis_client_oui_non} onValueChange={(v) => setFormData({ ...formData, materiaux_fournis_client_oui_non: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Oui">Oui</SelectItem>
                  <SelectItem value="Non">Non</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Liste si oui" value={formData.materiaux_fournis_client_liste} onChange={(e) => setFormData({ ...formData, materiaux_fournis_client_liste: e.target.value })} className="mt-2" />
            </div>
            <div className="space-y-2">
              <Label>Contraintes d'accès chantier</Label>
              <Textarea rows={2} value={formData.contraintes_acces} onChange={(e) => setFormData({ ...formData, contraintes_acces: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Horaires de chantier autorisés</Label>
              <Textarea rows={2} value={formData.horaires_chantier} onChange={(e) => setFormData({ ...formData, horaires_chantier: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Gestion des déchets</Label>
              <Textarea rows={2} value={formData.gestion_dechets} onChange={(e) => setFormData({ ...formData, gestion_dechets: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Protection des ouvrages existants</Label>
              <Textarea rows={2} value={formData.protection_ouvrages} onChange={(e) => setFormData({ ...formData, protection_ouvrages: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Conditions de Consultation</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date limite de remise des devis</Label>
              <Input type="date" value={formData.date_limite_devis} onChange={(e) => setFormData({ ...formData, date_limite_devis: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Durée de validité des devis demandée</Label>
              <Input value={formData.duree_validite_devis} onChange={(e) => setFormData({ ...formData, duree_validite_devis: e.target.value })} placeholder="Ex: 60 jours" />
            </div>
            <div className="space-y-2">
              <Label>Format de réponse souhaité</Label>
              <Input value={formData.format_reponse} onChange={(e) => setFormData({ ...formData, format_reponse: e.target.value })} placeholder="Poste par poste" />
            </div>
            <div className="space-y-2">
              <Label>Visite sur site obligatoire</Label>
              <Select value={formData.visite_obligatoire} onValueChange={(v) => setFormData({ ...formData, visite_obligatoire: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Oui">Oui</SelectItem>
                  <SelectItem value="Non">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date de visite proposée</Label>
              <Input type="date" value={formData.date_visite} onChange={(e) => setFormData({ ...formData, date_visite: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Contact sur site</Label>
              <Input value={formData.contact_site} onChange={(e) => setFormData({ ...formData, contact_site: e.target.value })} placeholder="Nom, tél." />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Documents Joints</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plans</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="file"
                  accept={ACCEPT_FILES}
                  className="max-w-[220px] text-sm"
                  disabled={!!uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      const { url, name } = await uploadFile(file, 'doc-plans')
                      setFormData((prev) => ({ ...prev, documents_plans: url, documents_plans_file_name: name }))
                      toast.success('Fichier envoyé')
                    } catch (err) {
                      toast.error('Erreur upload')
                    }
                    e.target.value = ''
                  }}
                />
                {!formData.documents_plans?.startsWith('http') && (
                  <Input
                    placeholder="Ou référence texte"
                    value={formData.documents_plans}
                    onChange={(e) => setFormData({ ...formData, documents_plans: e.target.value })}
                    className="flex-1 min-w-[120px]"
                  />
                )}
              </div>
              {(formData.documents_plans?.startsWith('http') || formData.documents_plans_file_name) && (
                <p className="text-sm flex items-center gap-2">
                  <span className="text-gray-600">{formData.documents_plans_file_name || 'Fichier joint'}</span>
                  <a href={formData.documents_plans} target="_blank" rel="noopener noreferrer" className="text-[#C5A572] hover:underline inline-flex items-center gap-1">
                    <Download className="h-3.5 w-3.5" /> Télécharger
                  </a>
                  <button type="button" onClick={() => setFormData((prev) => ({ ...prev, documents_plans: '', documents_plans_file_name: '' }))} className="text-red-600 text-xs">Supprimer</button>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Détails techniques</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="file"
                  accept={ACCEPT_FILES}
                  className="max-w-[220px] text-sm"
                  disabled={!!uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      const { url, name } = await uploadFile(file, 'doc-details')
                      setFormData((prev) => ({ ...prev, documents_details_techniques: url, documents_details_techniques_file_name: name }))
                      toast.success('Fichier envoyé')
                    } catch (err) {
                      toast.error('Erreur upload')
                    }
                    e.target.value = ''
                  }}
                />
                {!formData.documents_details_techniques?.startsWith('http') && (
                  <Input
                    placeholder="Ou référence texte"
                    value={formData.documents_details_techniques}
                    onChange={(e) => setFormData({ ...formData, documents_details_techniques: e.target.value })}
                    className="flex-1 min-w-[120px]"
                  />
                )}
              </div>
              {(formData.documents_details_techniques?.startsWith('http') || formData.documents_details_techniques_file_name) && (
                <p className="text-sm flex items-center gap-2">
                  <span className="text-gray-600">{formData.documents_details_techniques_file_name || 'Fichier joint'}</span>
                  <a href={formData.documents_details_techniques} target="_blank" rel="noopener noreferrer" className="text-[#C5A572] hover:underline inline-flex items-center gap-1">
                    <Download className="h-3.5 w-3.5" /> Télécharger
                  </a>
                  <button type="button" onClick={() => setFormData((prev) => ({ ...prev, documents_details_techniques: '', documents_details_techniques_file_name: '' }))} className="text-red-600 text-xs">Supprimer</button>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Échantillons / Références</Label>
              <Textarea rows={2} value={formData.documents_echantillons} onChange={(e) => setFormData({ ...formData, documents_echantillons: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const previewContent = (
    <ProfessionalDocumentPreview
      documentNumber={generateDocumentNumber()}
      documentTitle="Cahier des Charges Artisans"
      documentDate={new Date(formData.date)}
      companyName={company?.name}
      companyAddress={company?.address}
      companyPhone={company?.phone}
      companyEmail={company?.email}
      projectName={selectedProject?.name}
    >
      <div className="space-y-6 text-sm">
        <div>
          <h4 className="font-semibold text-[#C5A572]">Informations Projet</h4>
          <p>Projet : {selectedProject?.name ?? '—'} — Adresse : {projectAddress || '—'}</p>
          <p>Lot : {formData.lot || '—'} — Artisan destinataire : {artisanLabel}</p>
        </div>
        <div>
          <h4 className="font-semibold text-[#C5A572]">Descriptif des Travaux</h4>
          <div className="space-y-3 mt-2">
            {postes.map((p) => (
              <div key={p.id} className="border-l-2 border-[#C5A572]/30 pl-3">
                <p className="font-medium">Poste {p.numero} — {p.intitule || '—'}</p>
                {p.description && <p className="whitespace-pre-wrap text-gray-600">{p.description}</p>}
                <p className="text-gray-600">Localisation : {p.localisation || '—'} | Qté : {p.quantite || '—'} {p.unite}</p>
                {p.materiaux_imposes && <p>Matériaux imposés : {p.materiaux_imposes}</p>}
                {p.plans_joints && (p.plans_joints.startsWith('http') ? <p>Plans : <a href={p.plans_joints} target="_blank" rel="noopener noreferrer" className="text-[#C5A572] underline">Télécharger{p.plans_joints_file_name ? ` (${p.plans_joints_file_name})` : ''}</a></p> : <p>Plans : {p.plans_joints}</p>)}
                {p.photos_reference && (p.photos_reference.startsWith('http') ? <p>Photos : <a href={p.photos_reference} target="_blank" rel="noopener noreferrer" className="text-[#C5A572] underline">Télécharger{p.photos_reference_file_name ? ` (${p.photos_reference_file_name})` : ''}</a></p> : <p>Photos : {p.photos_reference}</p>)}
                {p.remarques && <p className="italic">Remarques : {p.remarques}</p>}
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-[#C5A572]">Prescriptions Techniques</h4>
          <p className="whitespace-pre-wrap mt-1">{formData.normes || '—'}</p>
          <p>DTU : {formData.dtu || '—'}</p>
          <p>Matériaux fournis client : {formData.materiaux_fournis_client_oui_non} {formData.materiaux_fournis_client_liste}</p>
          <p>Accès : {formData.contraintes_acces || '—'} | Horaires : {formData.horaires_chantier || '—'}</p>
        </div>
        <div>
          <h4 className="font-semibold text-[#C5A572]">Conditions de Consultation</h4>
          <p>Date limite devis : {formData.date_limite_devis || '—'} | Validité : {formData.duree_validite_devis || '—'}</p>
          <p>Visite obligatoire : {formData.visite_obligatoire} | Date visite : {formData.date_visite || '—'}</p>
          <p>Contact site : {formData.contact_site || '—'}</p>
        </div>
        <div>
          <h4 className="font-semibold text-[#C5A572]">Documents Joints</h4>
          <p>
            Plans : {formData.documents_plans?.startsWith('http') ? (
              <a href={formData.documents_plans} target="_blank" rel="noopener noreferrer" className="text-[#C5A572] underline">Télécharger{formData.documents_plans_file_name ? ` (${formData.documents_plans_file_name})` : ''}</a>
            ) : (formData.documents_plans || '—')}
            {' | '}
            Détails : {formData.documents_details_techniques?.startsWith('http') ? (
              <a href={formData.documents_details_techniques} target="_blank" rel="noopener noreferrer" className="text-[#C5A572] underline">Télécharger{formData.documents_details_techniques_file_name ? ` (${formData.documents_details_techniques_file_name})` : ''}</a>
            ) : (formData.documents_details_techniques || '—')}
          </p>
          <p>{formData.documents_echantillons || '—'}</p>
        </div>
      </div>
    </ProfessionalDocumentPreview>
  )

  return (
    <BaseDocumentLayout
      title="Cahier des Charges Artisans"
      formContent={formContent}
      previewContent={previewContent}
      onSave={handleSave}
      isSaving={isSaving}
      onPreviewPDF={handleDownloadPDF}
    />
  )
}
