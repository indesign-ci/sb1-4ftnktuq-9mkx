// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { createNotification } from '@/lib/notifications/utils'
import { CURRENCIES } from '@/lib/constants'

type QuoteLine = {
  id?: string
  designation: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  vat_rate: number
  discount_percent: number
  total_ht: number
  position: number
}

type QuoteSection = {
  id?: string
  title: string
  position: number
  lines: QuoteLine[]
}

type QuoteFormProps = {
  quoteId?: string
  onSuccess: () => void
}

const DEFAULT_SECTIONS = [
  'Démolition',
  'Second œuvre',
  'Mobilier',
  'Décoration',
  'Honoraires',
]

const UNITS = ['m²', 'ml', 'u', 'forfait', 'h']

export function QuoteForm({ quoteId, onSuccess }: QuoteFormProps) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  

  const [formData, setFormData] = useState({
    client_id: '',
    project_id: 'none',
    object: '',
    date: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    status: 'draft',
    discount_percent: 0,
    payment_terms: 'Acompte de 30% à la commande, solde à la livraison',
    notes: '',
    currency: 'XAF',
  })

  const [sections, setSections] = useState<QuoteSection[]>(
    DEFAULT_SECTIONS.map((title, index) => ({
      title,
      position: index,
      lines: [],
    }))
  )

  useEffect(() => {
    loadClients()
    if (quoteId) {
      loadQuote()
    }
  }, [quoteId])

  useEffect(() => {
    if (formData.client_id) {
      loadProjects(formData.client_id)
    }
  }, [formData.client_id])

  const loadClients = async () => {
    if (!profile?.company_id) return

    const { data, error } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
      .eq('company_id', profile.company_id)
      .order('first_name')

    if (!error && data) {
      setClients(data)
    }
  }

  const loadProjects = async (clientId: string) => {
    if (!profile?.company_id) return

    const { data, error } = await supabase
      .from('projects')
      .select('id, name')
      .eq('company_id', profile.company_id)
      .eq('client_id', clientId)
      .order('name')

    if (!error && data) {
      setProjects(data)
    }
  }

  const loadQuote = async () => {
    if (!quoteId) return

    try {
      const { data: quote, error } = await supabase
        .from('quotes')
        .select(`
          *,
          quote_sections (
            *,
            quote_lines (*)
          )
        `)
        .eq('id', quoteId)
        .single()

      if (error) throw error

      const quoteData = quote as any

      setFormData({
        client_id: quoteData.client_id,
        project_id: quoteData.project_id || 'none',
        object: quoteData.object,
        date: quoteData.date,
        valid_until: quoteData.valid_until,
        status: quoteData.status,
        discount_percent: parseFloat(quoteData.discount_percent) || 0,
        payment_terms: quoteData.payment_terms || '',
        notes: quoteData.notes || '',
        currency: quoteData.currency || 'XAF',
      })

      if (quoteData.quote_sections && quoteData.quote_sections.length > 0) {
        const loadedSections = quoteData.quote_sections.map((section: any) => ({
          id: section.id,
          title: section.title,
          position: section.position,
          lines: section.quote_lines
            ? section.quote_lines.map((line: any) => ({
                id: line.id,
                designation: line.designation,
                description: line.description || '',
                quantity: parseFloat(line.quantity),
                unit: line.unit,
                unit_price: parseFloat(line.unit_price),
                vat_rate: parseFloat(line.vat_rate),
                discount_percent: parseFloat(line.discount_percent) || 0,
                total_ht: parseFloat(line.total_ht),
                position: line.position,
              }))
            : [],
        }))
        setSections(loadedSections)
      }
    } catch (error: any) {
      toast.error('Erreur lors du chargement du devis')
    }
  }

  const getCurrencySymbol = () => {
    const currency = CURRENCIES.find(c => c.value === formData.currency)
    return currency?.symbol || 'FCFA'
  }

  const calculateLineTotal = (line: QuoteLine): number => {
    const subtotal = line.quantity * line.unit_price
    const discount = subtotal * (line.discount_percent / 100)
    return subtotal - discount
  }

  const calculateTotals = () => {
    let subtotal = 0
    let vat_10 = 0
    let vat_18 = 0
    let vat_20 = 0

    sections.forEach((section) => {
      section.lines.forEach((line) => {
        const lineTotal = calculateLineTotal(line)
        subtotal += lineTotal

        if (line.vat_rate === 10) {
          vat_10 += lineTotal * 0.1
        } else if (line.vat_rate === 18) {
          vat_18 += lineTotal * 0.18
        } else if (line.vat_rate === 20) {
          vat_20 += lineTotal * 0.2
        }
      })
    })

    const globalDiscount = subtotal * (formData.discount_percent / 100)
    const total_ht = subtotal - globalDiscount
    const adjustedVat10 = subtotal > 0 ? (vat_10 / subtotal) * total_ht : 0
    const adjustedVat18 = subtotal > 0 ? (vat_18 / subtotal) * total_ht : 0
    const adjustedVat20 = subtotal > 0 ? (vat_20 / subtotal) * total_ht : 0
    const total_ttc = total_ht + adjustedVat10 + adjustedVat18 + adjustedVat20

    return {
      subtotal,
      discount_amount: globalDiscount,
      total_ht,
      vat_10: adjustedVat10,
      vat_18: adjustedVat18,
      vat_20: adjustedVat20,
      total_ttc,
    }
  }

  const addLine = (sectionIndex: number) => {
    const newSections = [...sections]
    newSections[sectionIndex].lines.push({
      designation: '',
      description: '',
      quantity: 1,
      unit: 'u',
      unit_price: 0,
      vat_rate: 20,
      discount_percent: 0,
      total_ht: 0,
      position: newSections[sectionIndex].lines.length,
    })
    setSections(newSections)
  }

  const removeLine = (sectionIndex: number, lineIndex: number) => {
    const newSections = [...sections]
    newSections[sectionIndex].lines.splice(lineIndex, 1)
    newSections[sectionIndex].lines.forEach((line, idx) => {
      line.position = idx
    })
    setSections(newSections)
  }

  const updateLine = (
    sectionIndex: number,
    lineIndex: number,
    field: keyof QuoteLine,
    value: any
  ) => {
    const newSections = [...sections]
    newSections[sectionIndex].lines[lineIndex] = {
      ...newSections[sectionIndex].lines[lineIndex],
      [field]: value,
    }

    const line = newSections[sectionIndex].lines[lineIndex]
    line.total_ht = calculateLineTotal(line)

    setSections(newSections)
  }

  const generateQuoteNumber = async () => {
    if (!profile?.company_id) return 'DEV-2025-001'

    const year = new Date().getFullYear()
    const { data, error } = await supabase
      .from('quotes')
      .select('quote_number')
      .eq('company_id', profile.company_id)
      .like('quote_number', `DEV-${year}-%`)
      .order('quote_number', { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) {
      return `DEV-${year}-001`
    }

    const lastNumber = parseInt((data[0] as any).quote_number.split('-')[2])
    const nextNumber = (lastNumber + 1).toString().padStart(3, '0')
    return `DEV-${year}-${nextNumber}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.client_id) {
      toast.error('Veuillez sélectionner un client')
      return
    }

    const totals = calculateTotals()

    setLoading(true)
    try {
      const quoteData = {
        company_id: profile?.company_id as string,
        client_id: formData.client_id,
        project_id: formData.project_id === 'none' ? null : formData.project_id,
        object: formData.object,
        date: formData.date,
        valid_until: formData.valid_until,
        status: formData.status,
        subtotal: totals.subtotal,
        discount_percent: formData.discount_percent,
        discount_amount: totals.discount_amount,
        total_ht: totals.total_ht,
        vat_10: totals.vat_10,
        vat_18: totals.vat_18,
        vat_20: totals.vat_20,
        total_ttc: totals.total_ttc,
        currency: formData.currency,
        payment_terms: formData.payment_terms,
        notes: formData.notes,
        created_by: profile?.id,
      } as any

      let savedQuoteId = quoteId
      let previousStatus: string | null = null

      if (quoteId) {
        const { data: existingQuote } = await supabase
          .from('quotes')
          .select('status, quote_number, clients(first_name, last_name)')
          .eq('id', quoteId)
          .single()

        previousStatus = existingQuote?.status

        // @ts-expect-error - TypeScript type inference issue with Supabase update
        const { error: updateError } = await supabase
          .from('quotes')
          .update(quoteData)
          .eq('id', quoteId)

        if (updateError) throw updateError

        if (previousStatus !== 'accepted' && formData.status === 'accepted' && existingQuote) {
          const clientName = `${existingQuote.clients.first_name} ${existingQuote.clients.last_name}`
          await createNotification({
            type: 'quote_accepted',
            title: 'Devis accepté',
            message: `Le devis ${existingQuote.quote_number} a été accepté par ${clientName}`,
            link: `/quotes`,
            metadata: {
              quote_id: quoteId,
              quote_number: existingQuote.quote_number,
              client_name: clientName,
            },
          })
        }

        const { error: deleteSectionsError } = await supabase
          .from('quote_sections')
          .delete()
          .eq('quote_id', quoteId)

        if (deleteSectionsError) throw deleteSectionsError
      } else {
        const quoteNumber = await generateQuoteNumber()
        // @ts-expect-error - TypeScript type inference issue with Supabase insert
        const { data: newQuote, error: insertError } = await supabase
          .from('quotes')
          .insert({ ...quoteData, quote_number: quoteNumber })
          .select()
          .single()

        if (insertError) throw insertError
        savedQuoteId = (newQuote as any).id
      }

      for (const section of sections) {
        if (section.lines.length === 0) continue

        const { data: newSection, error: sectionError } = await supabase
          .from('quote_sections')
          .insert({
            quote_id: savedQuoteId,
            title: section.title,
            position: section.position,
          } as any)
          .select()
          .single()

        if (sectionError) throw sectionError

        const lines = section.lines.map((line) => ({
          quote_id: savedQuoteId,
          section_id: (newSection as any).id,
          designation: line.designation,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          unit_price: line.unit_price,
          vat_rate: line.vat_rate,
          discount_percent: line.discount_percent,
          total_ht: line.total_ht,
          position: line.position,
        }))

        const { error: linesError } = await supabase
          .from('quote_lines')
          .insert(lines as any)

        if (linesError) throw linesError
      }

      toast.success(quoteId ? 'Devis modifié' : 'Devis créé')
      onSuccess()
    } catch (error: any) {
      toast.error('Erreur lors de la sauvegarde')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const totals = calculateTotals()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="client_id">Client *</Label>
          <Select
            value={formData.client_id}
            onValueChange={(value) =>
              setFormData({ ...formData, client_id: value, project_id: 'none' })
            }
          >
            <SelectTrigger>
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
            value={formData.project_id}
            onValueChange={(value) =>
              setFormData({ ...formData, project_id: value })
            }
            disabled={!formData.client_id}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un projet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun projet</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="object">Objet *</Label>
          <Input
            id="object"
            value={formData.object}
            onChange={(e) =>
              setFormData({ ...formData, object: e.target.value })
            }
            placeholder="Objet du devis"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="sent">Envoyé</SelectItem>
              <SelectItem value="accepted">Accepté</SelectItem>
              <SelectItem value="rejected">Refusé</SelectItem>
              <SelectItem value="expired">Expiré</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) =>
              setFormData({ ...formData, date: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="valid_until">Valide jusqu'au</Label>
          <Input
            id="valid_until"
            type="date"
            value={formData.valid_until}
            onChange={(e) =>
              setFormData({ ...formData, valid_until: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Devise</Label>
          <Select
            value={formData.currency}
            onValueChange={(value) =>
              setFormData({ ...formData, currency: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Lignes du devis</h3>

        {sections.map((section, sectionIndex) => (
          <Card key={sectionIndex}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-gray-400" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.lines.map((line, lineIndex) => (
                <div
                  key={lineIndex}
                  className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-lg"
                >
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Désignation *</Label>
                    <Input
                      value={line.designation}
                      onChange={(e) =>
                        updateLine(
                          sectionIndex,
                          lineIndex,
                          'designation',
                          e.target.value
                        )
                      }
                      placeholder="Désignation"
                      required
                    />
                  </div>

                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={line.description}
                      onChange={(e) =>
                        updateLine(
                          sectionIndex,
                          lineIndex,
                          'description',
                          e.target.value
                        )
                      }
                      placeholder="Description"
                    />
                  </div>

                  <div className="col-span-1 space-y-1">
                    <Label className="text-xs">Qté</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(
                          sectionIndex,
                          lineIndex,
                          'quantity',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      required
                    />
                  </div>

                  <div className="col-span-1 space-y-1">
                    <Label className="text-xs">Unité</Label>
                    <Select
                      value={line.unit}
                      onValueChange={(value) =>
                        updateLine(sectionIndex, lineIndex, 'unit', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-1 space-y-1">
                    <Label className="text-xs">P.U. HT</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={line.unit_price}
                      onChange={(e) =>
                        updateLine(
                          sectionIndex,
                          lineIndex,
                          'unit_price',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      required
                    />
                  </div>

                  <div className="col-span-1 space-y-1">
                    <Label className="text-xs">TVA %</Label>
                    <Select
                      value={line.vat_rate.toString()}
                      onValueChange={(value) =>
                        updateLine(
                          sectionIndex,
                          lineIndex,
                          'vat_rate',
                          parseFloat(value)
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-1 space-y-1">
                    <Label className="text-xs">Rem. %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={line.discount_percent}
                      onChange={(e) =>
                        updateLine(
                          sectionIndex,
                          lineIndex,
                          'discount_percent',
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>

                  <div className="col-span-1 space-y-1">
                    <Label className="text-xs">Total HT</Label>
                    <Input
                      value={line.total_ht.toFixed(2)}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>

                  <div className="col-span-1 flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLine(sectionIndex, lineIndex)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addLine(sectionIndex)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une ligne
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="discount_percent">Remise globale (%)</Label>
            <Input
              id="discount_percent"
              type="number"
              step="0.01"
              value={formData.discount_percent}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discount_percent: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_terms">Conditions de paiement</Label>
            <Textarea
              id="payment_terms"
              value={formData.payment_terms}
              onChange={(e) =>
                setFormData({ ...formData, payment_terms: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Récapitulatif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sous-total HT</span>
              <span className="font-medium">
                {totals.subtotal.toFixed(2)} {getCurrencySymbol()}
              </span>
            </div>

            {formData.discount_percent > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Remise globale ({formData.discount_percent}%)</span>
                <span>-{totals.discount_amount.toFixed(2)} {getCurrencySymbol()}</span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between text-sm font-medium">
              <span>Total HT</span>
              <span>{totals.total_ht.toFixed(2)} {getCurrencySymbol()}</span>
            </div>

            {totals.vat_10 > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">TVA 10%</span>
                <span>{totals.vat_10.toFixed(2)} {getCurrencySymbol()}</span>
              </div>
            )}

            {totals.vat_18 > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">TVA 18%</span>
                <span>{totals.vat_18.toFixed(2)} {getCurrencySymbol()}</span>
              </div>
            )}

            {totals.vat_20 > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">TVA 20%</span>
                <span>{totals.vat_20.toFixed(2)} {getCurrencySymbol()}</span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span>Total TTC</span>
              <span className="text-[#C5A572]">
                {totals.total_ttc.toFixed(2)} {getCurrencySymbol()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-[#C5A572] hover:bg-[#B39562] text-white"
        >
          {loading ? 'Enregistrement...' : quoteId ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  )
}
