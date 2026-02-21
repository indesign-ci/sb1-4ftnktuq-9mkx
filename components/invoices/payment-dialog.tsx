// @ts-nocheck
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { createNotification } from '@/lib/notifications/utils'

type PaymentDialogProps = {
  invoice: {
    id: string
    invoice_number: string
    total_ttc: number
    amount_paid: number
    amount_due: number
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const paymentMethods = [
  { value: 'bank_transfer', label: 'Virement' },
  { value: 'check', label: 'Chèque' },
  { value: 'card', label: 'Carte bancaire' },
  { value: 'cash', label: 'Espèces' },
  { value: 'other', label: 'Autre' },
]

export function PaymentDialog({
  invoice,
  open,
  onOpenChange,
  onSuccess,
}: PaymentDialogProps) {
  const { profile } = useAuth()
  
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    amount: invoice.amount_due.toString(),
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    reference: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amount = parseFloat(formData.amount)

    if (amount <= 0) {
      toast.error('Le montant doit être supérieur à 0')
      return
    }

    if (amount > invoice.amount_due) {
      toast.error('Le montant ne peut pas dépasser le reste dû')
      return
    }

    setLoading(true)
    try {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          company_id: profile?.company_id,
          invoice_id: invoice.id,
          amount,
          payment_date: formData.payment_date,
          payment_method: formData.payment_method,
          reference: formData.reference || null,
          notes: formData.notes || null,
          created_by: profile?.id,
        } as any)

      if (paymentError) throw paymentError

      const newAmountPaid = invoice.amount_paid + amount
      const newAmountDue = invoice.total_ttc - newAmountPaid

      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          amount_paid: newAmountPaid,
          amount_due: newAmountDue,
        } as any)
        .eq('id', invoice.id)

      if (updateError) throw updateError

      await createNotification({
        type: 'payment_received',
        title: 'Paiement reçu',
        message: `Paiement de ${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}FCFA reçu pour la facture ${invoice.invoice_number}`,
        link: `/invoices`,
        metadata: {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          amount,
          payment_method: formData.payment_method,
        },
      })

      toast.success('Paiement enregistré')
      onSuccess()
      onOpenChange(false)

      setFormData({
        amount: '0',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'bank_transfer',
        reference: '',
        notes: '',
      })
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de l\'enregistrement du paiement')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
          <DialogDescription>
            Facture {invoice.invoice_number} - Reste dû :{' '}
            {parseFloat(invoice.amount_due.toString()).toLocaleString('fr-FR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            FCFA
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Montant *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_date">Date du paiement *</Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) =>
                setFormData({ ...formData, payment_date: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Mode de paiement *</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) =>
                setFormData({ ...formData, payment_method: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Référence</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) =>
                setFormData({ ...formData, reference: e.target.value })
              }
              placeholder="Numéro de chèque, de transaction..."
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
              placeholder="Notes optionnelles"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#C5A572] hover:bg-[#B39562] text-white"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
