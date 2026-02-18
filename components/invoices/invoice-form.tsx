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
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { CURRENCIES } from '@/lib/constants'

type InvoiceLine = {
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

type InvoiceFormProps = {
  invoiceId?: string
  onSuccess: () => void
}

const UNITS = ['m²', 'ml', 'u', 'forfait', 'h']

export function InvoiceForm({ invoiceId, onSuccess }: InvoiceFormProps) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  

  const [formData, setFormData] = useState({
    client_id: '',
    project_id: 'none',
    invoice_type: 'deposit',
    object: '',
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    status: 'draft',
    discount_percent: 0,
    payment_terms: 'Paiement à 30 jours',
    notes: '',
    currency: 'XAF',
  })

  const [lines, setLines] = useState<InvoiceLine[]>([])

  useEffect(() => {
    loadClients()
    if (invoiceId) {
      loadInvoice()
    }
  }, [invoiceId])

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

  const loadInvoice = async () => {
    if (!invoiceId) return

    try {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_lines (*)
        `)
        .eq('id', invoiceId)
        .single()

      if (error) throw error

      const invoiceData = invoice as any

      setFormData({
        client_id: invoiceData.client_id,
        project_id: invoiceData.project_id || 'none',
        invoice_type: invoiceData.invoice_type,
        object: invoiceData.object,
        date: invoiceData.date,
        due_date: invoiceData.due_date || '',
        status: invoiceData.status,
        discount_percent: parseFloat(invoiceData.discount_percent) || 0,
        payment_terms: invoiceData.payment_terms || '',
        notes: invoiceData.notes || '',
        currency: invoiceData.currency || 'XAF',
      })

      if (invoiceData.invoice_lines && invoiceData.invoice_lines.length > 0) {
        const loadedLines = invoiceData.invoice_lines.map((line: any) => ({
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
        setLines(loadedLines)
      }
    } catch (error: any) {
      toast.error('Erreur lors du chargement de la facture')
    }
  }

  const getCurrencySymbol = () => {
    const currency = CURRENCIES.find(c => c.value === formData.currency)
    return currency?.symbol || 'FCFA'
  }

  const calculateLineTotal = (line: InvoiceLine): number => {
    const subtotal = line.quantity * line.unit_price
    const discount = subtotal * (line.discount_percent / 100)
    return subtotal - discount
  }

  const calculateTotals = () => {
    let subtotal = 0
    let vat_10 = 0
    let vat_18 = 0
    let vat_20 = 0

    lines.forEach((line) => {
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

  const addLine = () => {
    setLines([
      ...lines,
      {
        designation: '',
        description: '',
        quantity: 1,
        unit: 'u',
        unit_price: 0,
        vat_rate: 20,
        discount_percent: 0,
        total_ht: 0,
        position: lines.length,
      },
    ])
  }

  const removeLine = (index: number) => {
    const newLines = [...lines]
    newLines.splice(index, 1)
    newLines.forEach((line, idx) => {
      line.position = idx
    })
    setLines(newLines)
  }

  const updateLine = (
    index: number,
    field: keyof InvoiceLine,
    value: any
  ) => {
    const newLines = [...lines]
    newLines[index] = {
      ...newLines[index],
      [field]: value,
    }

    const line = newLines[index]
    line.total_ht = calculateLineTotal(line)

    setLines(newLines)
  }

  const generateInvoiceNumber = async () => {
    if (!profile?.company_id) return 'FACT-2025-001'

    const year = new Date().getFullYear()
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('company_id', profile.company_id)
      .like('invoice_number', `FACT-${year}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) {
      return `FACT-${year}-001`
    }

    const lastNumber = parseInt((data[0] as any).invoice_number.split('-')[2])
    const nextNumber = (lastNumber + 1).toString().padStart(3, '0')
    return `FACT-${year}-${nextNumber}`
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
      const invoiceData = {
        company_id: profile?.company_id as string,
        client_id: formData.client_id,
        project_id: formData.project_id === 'none' ? null : formData.project_id,
        invoice_type: formData.invoice_type,
        object: formData.object,
        date: formData.date,
        due_date: formData.due_date || null,
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
        amount_paid: 0,
        amount_due: totals.total_ttc,
        payment_terms: formData.payment_terms,
        notes: formData.notes,
        created_by: profile?.id,
      } as any

      let savedInvoiceId = invoiceId

      if (invoiceId) {
        const { error: updateError } = await supabase
          .from('invoices')
          .update(invoiceData)
          .eq('id', invoiceId)

        if (updateError) throw updateError

        const { error: deleteLinesError } = await supabase
          .from('invoice_lines')
          .delete()
          .eq('invoice_id', invoiceId)

        if (deleteLinesError) throw deleteLinesError
      } else {
        const invoiceNumber = await generateInvoiceNumber()
        const { data: newInvoice, error: insertError } = await supabase
          .from('invoices')
          .insert({ ...invoiceData, invoice_number: invoiceNumber })
          .select()
          .single()

        if (insertError) throw insertError
        savedInvoiceId = (newInvoice as any).id
      }

      if (lines.length > 0) {
        const invoiceLines = lines.map((line) => ({
          invoice_id: savedInvoiceId,
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
          .from('invoice_lines')
          .insert(invoiceLines as any)

        if (linesError) throw linesError
      }

      toast.success(invoiceId ? 'Facture modifiée' : 'Facture créée')
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
          <Label htmlFor="invoice_type">Type de facture *</Label>
          <Select
            value={formData.invoice_type}
            onValueChange={(value) =>
              setFormData({ ...formData, invoice_type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deposit">Acompte</SelectItem>
              <SelectItem value="intermediate">Intermédiaire</SelectItem>
              <SelectItem value="final">Solde</SelectItem>
              <SelectItem value="credit_note">Avoir</SelectItem>
            </SelectContent>
          </Select>
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
              <SelectItem value="sent">Envoyée</SelectItem>
              <SelectItem value="partial">Payée partiellement</SelectItem>
              <SelectItem value="paid">Payée</SelectItem>
              <SelectItem value="overdue">En retard</SelectItem>
              <SelectItem value="cancelled">Annulée</SelectItem>
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
            placeholder="Objet de la facture"
            required
          />
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
          <Label htmlFor="due_date">Date d'échéance</Label>
          <Input
            id="due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) =>
              setFormData({ ...formData, due_date: e.target.value })
            }
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

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Lignes de la facture</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLine}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une ligne
          </Button>
        </div>

        {lines.map((line, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs">Désignation *</Label>
                  <Input
                    value={line.designation}
                    onChange={(e) =>
                      updateLine(index, 'designation', e.target.value)
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
                      updateLine(index, 'description', e.target.value)
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
                        index,
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
                      updateLine(index, 'unit', value)
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
                        index,
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
                      updateLine(index, 'vat_rate', parseFloat(value))
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
                        index,
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
                    onClick={() => removeLine(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
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
          {loading ? 'Enregistrement...' : invoiceId ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  )
}
