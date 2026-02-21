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
import { formatCurrency } from '@/lib/currency'
import { generateProfessionalDocumentPDF } from '@/lib/pdf/professional-document-pdf'

type QuoteLine = {
  id: string
  category: string
  description: string
  quantity: string
  unit: string
  unit_price: string
  total: string
}

export default function DetailedQuotePage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [company, setCompany] = useState<any>(null)

  const [formData, setFormData] = useState({
    client_id: '',
    project_id: '',
    quote_date: new Date().toISOString().split('T')[0],
    validity_date: '',
    project_description: '',
    lines: [] as QuoteLine[],
    subtotal: '0',
    discount_percentage: '0',
    discount_amount: '0',
    vat_percentage: '18',
    vat_amount: '0',
    total_amount: '0',
    payment_terms: '',
    delivery_timeline: '',
    special_conditions: '',
    notes: '',
  })

  useEffect(() => {
    if (profile?.company_id) loadData()
  }, [profile?.company_id])

  useEffect(() => {
    calculateTotals()
  }, [formData.lines, formData.discount_percentage, formData.vat_percentage])

  const loadData = async () => {
    if (!profile?.company_id) return
    try {
      const [clientsRes, projectsRes, companyRes] = await Promise.all([
        supabase
          .from('clients')
          .select('id, first_name, last_name, email, phone, address')
          .eq('company_id', profile.company_id)
          .order('first_name'),
        supabase
          .from('projects')
          .select('id, name, client_id')
          .eq('company_id', profile.company_id)
          .order('name'),
        supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .maybeSingle(),
      ])

      if (clientsRes.data) setClients(clientsRes.data)
      if (projectsRes.data) setProjects(projectsRes.data)
      if (companyRes.data) setCompany(companyRes.data)
    } catch (error: any) {
      console.error('Error loading data:', error)
    }
  }

  const projectsForSelect = formData.client_id
    ? projects.filter((p: { client_id?: string }) => p.client_id === formData.client_id)
    : projects

  const generateDocumentNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')
    return `DEV-${year}${month}-${random}`
  }

  const calculateTotals = () => {
    const subtotal = formData.lines.reduce(
      (sum, line) => sum + (parseFloat(line.total) || 0),
      0
    )

    const discountPercentage = parseFloat(formData.discount_percentage) || 0
    const discountAmount = (subtotal * discountPercentage) / 100

    const subtotalAfterDiscount = subtotal - discountAmount

    const vatPercentage = parseFloat(formData.vat_percentage) || 0
    const vatAmount = (subtotalAfterDiscount * vatPercentage) / 100

    const totalAmount = subtotalAfterDiscount + vatAmount

    setFormData((prev) => ({
      ...prev,
      subtotal: subtotal.toFixed(0),
      discount_amount: discountAmount.toFixed(0),
      vat_amount: vatAmount.toFixed(0),
      total_amount: totalAmount.toFixed(0),
    }))
  }

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [
        ...formData.lines,
        {
          id: Date.now().toString(),
          category: '',
          description: '',
          quantity: '1',
          unit: 'unité',
          unit_price: '',
          total: '',
        },
      ],
    })
  }

  const removeLine = (id: string) => {
    setFormData({
      ...formData,
      lines: formData.lines.filter((line) => line.id !== id),
    })
  }

  const updateLine = (id: string, field: keyof QuoteLine, value: string) => {
    setFormData({
      ...formData,
      lines: formData.lines.map((line) => {
        if (line.id === id) {
          const updatedLine = { ...line, [field]: value }
          if (field === 'quantity' || field === 'unit_price') {
            const quantity = parseFloat(field === 'quantity' ? value : updatedLine.quantity) || 0
            const unitPrice = parseFloat(field === 'unit_price' ? value : updatedLine.unit_price) || 0
            updatedLine.total = (quantity * unitPrice).toFixed(0)
          }
          return updatedLine
        }
        return line
      }),
    })
  }

  const handleSave = async () => {
    if (!formData.client_id) {
      toast.error('Veuillez sélectionner un client')
      return
    }

    setIsSaving(true)
    try {
      const documentNumber = generateDocumentNumber()

      const { error } = await supabase.from('professional_documents').insert({
        company_id: profile?.company_id,
        created_by: profile?.id,
        document_type: 'detailed_quote',
        document_phase: 'phase3',
        document_number: documentNumber,
        title: `Devis détaillé - ${
          clients.find((c) => c.id === formData.client_id)?.first_name || ''
        }`,
        client_id: formData.client_id || null,
        project_id: formData.project_id || null,
        status: 'draft',
        document_data: formData,
      })

      if (error) throw error

      toast.success('Devis sauvegardé en brouillon')
      router.push('/documents-pro')
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la sauvegarde')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedClient = clients.find((c) => c.id === formData.client_id)
  const selectedProject = projects.find((p) => p.id === formData.project_id)

  const handleDownloadPDF = async () => {
    if (!selectedClient) {
      toast.error('Veuillez sélectionner un client avant de générer le PDF')
      return
    }

    try {
      const sections = []

      if (formData.project_description) {
        sections.push({ title: 'Description du projet', content: formData.project_description })
      }

      if (formData.lines.length > 0) {
        const linesData = formData.lines.map((line) => ({
          label: `${line.description} (${line.category})`,
          value: `${line.quantity} ${line.unit} × ${formatCurrency(line.unit_price)} = ${formatCurrency(line.total)}`,
        }))
        sections.push({ title: 'Détail du devis', content: linesData })
      }

      const financialSummary = []
      financialSummary.push({ label: 'Sous-total', value: formatCurrency(formData.subtotal) })
      if (parseFloat(formData.discount_percentage) > 0) {
        financialSummary.push({
          label: `Remise (${formData.discount_percentage}%)`,
          value: `- ${formatCurrency(formData.discount_amount)}`,
        })
      }
      financialSummary.push({
        label: `TVA (${formData.vat_percentage}%)`,
        value: formatCurrency(formData.vat_amount),
      })
      financialSummary.push({ label: 'TOTAL TTC', value: formatCurrency(formData.total_amount) })
      sections.push({ title: 'Récapitulatif financier', content: financialSummary })

      if (formData.payment_terms) {
        sections.push({ title: 'Conditions de paiement', content: formData.payment_terms })
      }

      await generateProfessionalDocumentPDF({
        documentNumber: generateDocumentNumber(),
        documentTitle: 'Devis détaillé',
        documentDate: new Date(formData.quote_date),
        company: {
          name: company?.name || 'Votre Entreprise',
          address: company?.address,
          phone: company?.phone,
          email: company?.email,
        },
        client: {
          name: `${selectedClient.first_name} ${selectedClient.last_name}`,
          address: selectedClient.address,
          phone: selectedClient.phone,
          email: selectedClient.email,
        },
        projectName: selectedProject?.name,
        sections,
      })

      toast.success('PDF généré avec succès')
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF')
      console.error(error)
    }
  }

  const formContent = (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Client *</Label>
              <Select
                value={formData.client_id || undefined}
                onValueChange={(v) => setFormData({ ...formData, client_id: v, project_id: '' })}
              >
                <SelectTrigger id="client_id">
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_id">Projet (optionnel)</Label>
              <Select
                value={formData.project_id || undefined}
                onValueChange={(v) => setFormData({ ...formData, project_id: v })}
                disabled={!formData.client_id}
              >
                <SelectTrigger id="project_id">
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun projet</SelectItem>
                  {projectsForSelect.map((project: { id: string; name: string }) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote_date">Date du devis</Label>
              <Input
                id="quote_date"
                type="date"
                value={formData.quote_date}
                onChange={(e) => setFormData({ ...formData, quote_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="validity_date">Date de validité</Label>
              <Input
                id="validity_date"
                type="date"
                value={formData.validity_date}
                onChange={(e) => setFormData({ ...formData, validity_date: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="project_description">Description du projet</Label>
              <Textarea
                id="project_description"
                placeholder="Description générale des travaux..."
                rows={3}
                value={formData.project_description}
                onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Lignes du devis</h3>
            <Button onClick={addLine} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une ligne
            </Button>
          </div>

          {formData.lines.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              Aucune ligne ajoutée. Cliquez sur "Ajouter une ligne" pour commencer.
            </p>
          )}

          <div className="space-y-4">
            {formData.lines.map((line, index) => (
              <div key={line.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-gray-700">Ligne {index + 1}</span>
                  <Button
                    onClick={() => removeLine(line.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Input
                      placeholder="Ex: Mobilier, Peinture..."
                      value={line.category}
                      onChange={(e) => updateLine(line.id, 'category', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Description détaillée de la prestation..."
                      rows={2}
                      value={line.description}
                      onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Quantité</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={line.quantity}
                      onChange={(e) => updateLine(line.id, 'quantity', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Unité</Label>
                    <Select value={line.unit} onValueChange={(v) => updateLine(line.id, 'unit', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unité">Unité</SelectItem>
                        <SelectItem value="m²">m²</SelectItem>
                        <SelectItem value="ml">ml (mètre linéaire)</SelectItem>
                        <SelectItem value="forfait">Forfait</SelectItem>
                        <SelectItem value="heure">Heure</SelectItem>
                        <SelectItem value="jour">Jour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Prix unitaire (FCFA)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={line.unit_price}
                      onChange={(e) => updateLine(line.id, 'unit_price', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Total (FCFA)</Label>
                    <Input
                      type="text"
                      value={line.total ? formatCurrency(line.total) : '0 FCFA'}
                      readOnly
                      className="bg-gray-100 font-semibold"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculs financiers</h3>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Sous-total:</span>
                <span className="font-semibold">{formatCurrency(formData.subtotal)}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_percentage">Remise (%)</Label>
                  <Input
                    id="discount_percentage"
                    type="number"
                    step="0.01"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Montant remise</Label>
                  <Input value={formatCurrency(formData.discount_amount)} readOnly className="bg-gray-100" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vat_percentage">TVA (%)</Label>
                  <Input
                    id="vat_percentage"
                    type="number"
                    step="0.01"
                    value={formData.vat_percentage}
                    onChange={(e) => setFormData({ ...formData, vat_percentage: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Montant TVA</Label>
                  <Input value={formatCurrency(formData.vat_amount)} readOnly className="bg-gray-100" />
                </div>
              </div>

              <div className="border-t pt-3 flex justify-between">
                <span className="text-lg font-bold text-gray-900">TOTAL TTC:</span>
                <span className="text-lg font-bold text-[#C5A572]">{formatCurrency(formData.total_amount)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_terms">Conditions de paiement</Label>
              <Textarea
                id="payment_terms"
                placeholder="Ex: 30% à la signature, 40% en milieu de projet, 30% à la livraison..."
                rows={3}
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_timeline">Délai de réalisation</Label>
              <Input
                id="delivery_timeline"
                placeholder="Ex: 3 mois à compter de la signature"
                value={formData.delivery_timeline}
                onChange={(e) => setFormData({ ...formData, delivery_timeline: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_conditions">Conditions particulières</Label>
              <Textarea
                id="special_conditions"
                placeholder="Garanties, assurances, clauses spéciales..."
                rows={3}
                value={formData.special_conditions}
                onChange={(e) => setFormData({ ...formData, special_conditions: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Informations complémentaires..."
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const previewContent = (
    <ProfessionalDocumentPreview
      documentNumber={generateDocumentNumber()}
      documentTitle="Devis détaillé"
      documentDate={new Date(formData.quote_date)}
      companyName={company?.name}
      companyAddress={company?.address}
      companyPhone={company?.phone}
      companyEmail={company?.email}
      clientName={selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : undefined}
      clientAddress={selectedClient?.address}
      clientPhone={selectedClient?.phone}
      clientEmail={selectedClient?.email}
      projectName={selectedProject?.name}
    >
      <div className="space-y-6">
        {formData.validity_date && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Validité:</span> Jusqu'au{' '}
              {new Date(formData.validity_date).toLocaleDateString('fr-FR')}
            </p>
          </div>
        )}

        {formData.project_description && (
          <div>
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Description du projet</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.project_description}</p>
          </div>
        )}

        {formData.lines.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Détail du devis</h3>
            <div className="space-y-3">
              {formData.lines.map((line) => (
                <div key={line.id} className="bg-[#F5F5F5] p-3 rounded">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{line.description}</p>
                      <p className="text-xs text-gray-500 uppercase">{line.category}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {line.quantity} {line.unit} × {formatCurrency(line.unit_price)}
                      </p>
                    </div>
                    <p className="font-semibold text-[#C5A572]">{formatCurrency(line.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Récapitulatif financier</h3>
          <div className="bg-[#F5F5F5] p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Sous-total:</span>
              <span className="font-semibold">{formatCurrency(formData.subtotal)}</span>
            </div>
            {parseFloat(formData.discount_percentage) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Remise ({formData.discount_percentage}%):</span>
                <span className="text-red-600">- {formatCurrency(formData.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">TVA ({formData.vat_percentage}%):</span>
              <span className="font-semibold">{formatCurrency(formData.vat_amount)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="text-lg font-bold text-gray-900">TOTAL TTC:</span>
              <span className="text-xl font-bold text-[#C5A572]">{formatCurrency(formData.total_amount)}</span>
            </div>
          </div>
        </div>

        {formData.payment_terms && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Conditions de paiement</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.payment_terms}</p>
          </div>
        )}

        {formData.delivery_timeline && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Délai de réalisation</h3>
            <p className="text-sm text-gray-700">{formData.delivery_timeline}</p>
          </div>
        )}

        {formData.special_conditions && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#C5A572] mb-3">Conditions particulières</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.special_conditions}</p>
          </div>
        )}
      </div>
    </ProfessionalDocumentPreview>
  )

  return (
    <BaseDocumentLayout
      title="Devis détaillé"
      formContent={formContent}
      previewContent={previewContent}
      onSave={handleSave}
      isSaving={isSaving}
      onDownloadPDF={handleDownloadPDF}
    />
  )
}
