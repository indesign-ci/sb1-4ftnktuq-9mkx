'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Pencil, Trash2, Eye, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { InvoiceDetail } from '@/components/invoices/invoice-detail'
import { PaymentDialog } from '@/components/invoices/payment-dialog'

type Invoice = {
  id: string
  invoice_number: string
  date: string
  due_date: string | null
  invoice_type: string
  object: string | null
  status: string
  total_ttc: number
  amount_paid: number
  amount_due: number
  client_id: string
  clients: {
    first_name: string
    last_name: string
  }
  created_at: string
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500 text-white',
  sent: 'bg-blue-500 text-white',
  partial: 'bg-yellow-500 text-white',
  paid: 'bg-green-500 text-white',
  overdue: 'bg-red-500 text-white',
  cancelled: 'bg-gray-400 text-white',
}

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  partial: 'Payée partiellement',
  paid: 'Payée',
  overdue: 'En retard',
  cancelled: 'Annulée',
}

const typeLabels: Record<string, string> = {
  deposit: 'Acompte',
  intermediate: 'Intermédiaire',
  final: 'Solde',
  credit_note: 'Avoir',
}

export default function InvoicesPage() {
  const searchParams = useSearchParams()
  const { profile } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)

  const defaultClientIdFromUrl = searchParams.get('client_id') || undefined

  useEffect(() => {
    if (defaultClientIdFromUrl) setIsCreateOpen(true)
  }, [defaultClientIdFromUrl])

  const loadInvoices = async () => {
    try {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          clients (first_name, last_name)
        `)
        .order('created_at', { ascending: false })

      // Filter by company_id only if profile exists
      if (profile?.company_id) {
        query = query.eq('company_id', profile.company_id)
      }

      const { data, error } = await query

      if (error) throw error
      setInvoices(data || [])
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors du chargement des factures')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return

    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id)
      if (error) throw error
      toast.success('Facture supprimée')
      loadInvoices()
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la suppression')
    }
  }

  const updateInvoiceStatus = async (id: string) => {
    try {
      const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select('total_ttc, amount_paid, due_date')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      const invoiceData = invoice as { total_ttc: number; amount_paid: number; due_date: string | null }
      const totalTtc = parseFloat(String(invoiceData.total_ttc))
      const amountPaid = parseFloat(String(invoiceData.amount_paid))

      let newStatus = 'draft'
      if (amountPaid >= totalTtc) {
        newStatus = 'paid'
      } else if (amountPaid > 0) {
        newStatus = 'partial'
      } else if (invoiceData.due_date && new Date(invoiceData.due_date) < new Date()) {
        newStatus = 'overdue'
      } else {
        newStatus = 'sent'
      }

      const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', id)

      if (updateError) throw updateError
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la mise à jour du statut')
    }
  }

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      invoice.object?.toLowerCase().includes(search.toLowerCase()) ||
      `${invoice.clients?.first_name} ${invoice.clients?.last_name}`
        .toLowerCase()
        .includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || invoice.status === statusFilter

    const matchesType =
      typeFilter === 'all' || invoice.invoice_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Factures</h1>
          <p className="text-gray-600 mt-1">{invoices.length} factures</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto bg-[#C5A572] hover:bg-[#B39562] text-white">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle facture
            </Button>
          </DialogTrigger>
          {/* Plein écran mobile, centré sur desktop */}
          <DialogContent className="flex h-full max-h-[100dvh] w-full max-w-none flex-col rounded-none border-0 p-4 md:h-auto md:max-h-[90vh] md:max-w-6xl md:rounded-lg md:border md:p-6 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouvelle facture</DialogTitle>
              <DialogDescription>
                Créez une nouvelle facture pour votre client
              </DialogDescription>
            </DialogHeader>
            <InvoiceForm
              defaultClientId={defaultClientIdFromUrl}
              onSuccess={() => {
                setIsCreateOpen(false)
                loadInvoices()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher une facture..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="sent">Envoyée</SelectItem>
                  <SelectItem value="partial">Payée partiellement</SelectItem>
                  <SelectItem value="paid">Payée</SelectItem>
                  <SelectItem value="overdue">En retard</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrer par type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="deposit">Acompte</SelectItem>
                  <SelectItem value="intermediate">Intermédiaire</SelectItem>
                  <SelectItem value="final">Solde</SelectItem>
                  <SelectItem value="credit_note">Avoir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A572] mx-auto"></div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune facture trouvée
            </div>
          ) : (
            <>
              {/* Vue cartes mobile */}
              <div className="space-y-3 md:hidden">
                {filteredInvoices.map((invoice) => (
                  <Card key={invoice.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                        <p className="text-sm text-gray-500">
                          {invoice.clients?.first_name} {invoice.clients?.last_name}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {parseFloat(invoice.total_ttc.toString()).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge className={statusColors[invoice.status]}>
                            {statusLabels[invoice.status]}
                          </Badge>
                          <Badge variant="outline">{typeLabels[invoice.invoice_type]}</Badge>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setSelectedInvoice(invoice); setIsDetailOpen(true) }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setSelectedInvoice(invoice); setIsEditOpen(true) }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setSelectedInvoice(invoice); setIsPaymentOpen(true) }} title="Paiement">
                            <CreditCard className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleDelete(invoice.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              {/* Tableau tablette / desktop */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Montant TTC</TableHead>
                      <TableHead>Payé</TableHead>
                      <TableHead>Reste dû</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>
                          {invoice.clients?.first_name} {invoice.clients?.last_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {typeLabels[invoice.invoice_type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          {parseFloat(invoice.total_ttc.toString()).toLocaleString(
                            'fr-FR',
                            {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }
                          )}{' '}
                          FCFA
                        </TableCell>
                        <TableCell>
                          {parseFloat(invoice.amount_paid.toString()).toLocaleString(
                            'fr-FR',
                            {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }
                          )}{' '}
                          FCFA
                        </TableCell>
                        <TableCell>
                          {parseFloat(invoice.amount_due.toString()).toLocaleString(
                            'fr-FR',
                            {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }
                          )}{' '}
                          FCFA
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[invoice.status]}>
                            {statusLabels[invoice.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedInvoice(invoice)
                                setIsDetailOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedInvoice(invoice)
                                setIsEditOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {invoice.status !== 'paid' &&
                              invoice.status !== 'cancelled' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedInvoice(invoice)
                                    setIsPaymentOpen(true)
                                  }}
                                  title="Enregistrer un paiement"
                                >
                                  <CreditCard className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(invoice.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedInvoice && <InvoiceDetail invoiceId={selectedInvoice.id} />}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la facture</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <InvoiceForm
              invoiceId={selectedInvoice.id}
              onSuccess={() => {
                setIsEditOpen(false)
                loadInvoices()
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {selectedInvoice && (
        <PaymentDialog
          invoice={selectedInvoice}
          open={isPaymentOpen}
          onOpenChange={setIsPaymentOpen}
          onSuccess={() => {
            loadInvoices()
            updateInvoiceStatus(selectedInvoice.id)
          }}
        />
      )}
    </div>
  )
}
