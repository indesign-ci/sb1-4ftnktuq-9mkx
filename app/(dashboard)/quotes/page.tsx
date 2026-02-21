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
import { Plus, Search, Pencil, Trash2, Eye, Copy, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { QuoteForm } from '@/components/quotes/quote-form'
import { QuoteDetail } from '@/components/quotes/quote-detail'

type Quote = {
  id: string
  quote_number: string
  date: string
  valid_until: string
  object: string
  status: string
  total_ttc: number
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
  accepted: 'bg-green-500 text-white',
  rejected: 'bg-red-500 text-white',
  expired: 'bg-orange-500 text-white',
}

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  rejected: 'Refusé',
  expired: 'Expiré',
}

export default function QuotesPage() {
  const searchParams = useSearchParams()
  const { profile } = useAuth()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const defaultClientIdFromUrl = searchParams.get('client_id') || undefined

  useEffect(() => {
    if (defaultClientIdFromUrl) setIsCreateOpen(true)
  }, [defaultClientIdFromUrl])

  const loadQuotes = async () => {
    try {
      let query = supabase
        .from('quotes')
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
      setQuotes(data || [])
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors du chargement des devis')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuotes()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) return

    try {
      const { error } = await supabase.from('quotes').delete().eq('id', id)
      if (error) throw error
      toast.success('Devis supprimé')
      loadQuotes()
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la suppression')
    }
  }

  const handleDuplicate = async (quote: Quote) => {
    try {
      const { data: originalQuote, error: fetchError } = await supabase
        .from('quotes')
        .select('*, quote_sections(*, quote_lines(*))')
        .eq('id', quote.id)
        .single()

      if (fetchError) throw fetchError
      if (!originalQuote) return

      const original = originalQuote as any

      const quoteNumber = await generateQuoteNumber()

      const { data: newQuote, error: insertError } = await supabase
        .from('quotes')
        .insert({
          company_id: profile?.company_id as string,
          client_id: original.client_id,
          project_id: original.project_id,
          quote_number: quoteNumber,
          date: new Date().toISOString().split('T')[0],
          valid_until: original.valid_until,
          object: `${original.object} (Copie)`,
          status: 'draft',
          subtotal: original.subtotal,
          discount_percent: original.discount_percent,
          discount_amount: original.discount_amount,
          total_ht: original.total_ht,
          vat_10: original.vat_10,
          vat_20: original.vat_20,
          total_ttc: original.total_ttc,
          payment_terms: original.payment_terms,
          notes: original.notes,
          created_by: profile?.id,
        } as any)
        .select()
        .single()

      if (insertError) throw insertError
      if (!newQuote) return

      const newQ = newQuote as any

      if (original.quote_sections) {
        for (const section of original.quote_sections) {
          const { data: newSection, error: sectionError } = await supabase
            .from('quote_sections')
            .insert({
              quote_id: newQ.id,
              title: section.title,
              position: section.position,
            } as any)
            .select()
            .single()

          if (sectionError) throw sectionError

          if (section.quote_lines) {
            const lines = section.quote_lines.map((line: any) => ({
              quote_id: newQ.id,
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
        }
      }

      toast.success('Devis dupliqué')
      loadQuotes()
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la duplication')
    }
  }

  const handleConvertToInvoice = async (quote: Quote) => {
    if (quote.status !== 'accepted') {
      toast.error('Seuls les devis acceptés peuvent être convertis en facture')
      return
    }

    try {
      const { data: fullQuote, error: fetchError } = await supabase
        .from('quotes')
        .select('*, quote_sections(*, quote_lines(*))')
        .eq('id', quote.id)
        .single()

      if (fetchError) throw fetchError
      if (!fullQuote) return

      const full = fullQuote as any

      const invoiceNumber = await generateInvoiceNumber()

      const { data: newInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          company_id: profile?.company_id as string,
          client_id: full.client_id,
          project_id: full.project_id,
          quote_id: full.id,
          invoice_number: invoiceNumber,
          date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          invoice_type: 'deposit',
          object: full.object,
          status: 'draft',
          subtotal: full.subtotal,
          discount_percent: full.discount_percent,
          discount_amount: full.discount_amount,
          total_ht: full.total_ht,
          vat_10: full.vat_10,
          vat_18: full.vat_18,
          vat_20: full.vat_20,
          total_ttc: full.total_ttc,
          amount_due: full.total_ttc,
          payment_terms: full.payment_terms,
          notes: full.notes,
          created_by: profile?.id,
        } as any)
        .select()
        .single()

      if (invoiceError) throw invoiceError
      if (!newInvoice) return

      const newInv = newInvoice as any

      if (full.quote_sections) {
        const allLines = full.quote_sections.flatMap((section: any) =>
          section.quote_lines.map((line: any, index: number) => ({
            invoice_id: newInv.id,
            designation: line.designation,
            description: line.description,
            quantity: line.quantity,
            unit: line.unit,
            unit_price: line.unit_price,
            vat_rate: line.vat_rate,
            discount_percent: line.discount_percent,
            total_ht: line.total_ht,
            position: index,
          }))
        )

        const { error: linesError } = await supabase
          .from('invoice_lines')
          .insert(allLines as any)

        if (linesError) throw linesError
      }

      toast.success('Facture créée avec succès')
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la conversion en facture')
    }
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

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      quote.quote_number.toLowerCase().includes(search.toLowerCase()) ||
      quote.object?.toLowerCase().includes(search.toLowerCase()) ||
      `${quote.clients?.first_name} ${quote.clients?.last_name}`
        .toLowerCase()
        .includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Devis</h1>
          <p className="text-gray-600 mt-1">{quotes.length} devis</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto bg-[#C5A572] hover:bg-[#B39562] text-white">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau devis
            </Button>
          </DialogTrigger>
          {/* Plein écran mobile, centré sur desktop */}
          <DialogContent className="flex h-full max-h-[100dvh] w-full max-w-none flex-col rounded-none border-0 p-4 md:h-auto md:max-h-[90vh] md:max-w-6xl md:rounded-lg md:border md:p-6 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouveau devis</DialogTitle>
              <DialogDescription>
                Créez un nouveau devis pour votre client
              </DialogDescription>
            </DialogHeader>
            <QuoteForm
              defaultClientId={defaultClientIdFromUrl}
              onSuccess={() => {
                setIsCreateOpen(false)
                loadQuotes()
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
                placeholder="Rechercher un devis..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="sent">Envoyé</SelectItem>
                <SelectItem value="accepted">Accepté</SelectItem>
                <SelectItem value="rejected">Refusé</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A572] mx-auto"></div>
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun devis trouvé
            </div>
          ) : (
            <>
              {/* Vue cartes mobile */}
              <div className="space-y-3 md:hidden">
                {filteredQuotes.map((quote) => (
                  <Card key={quote.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">{quote.quote_number}</p>
                        <p className="text-sm text-gray-500">
                          {quote.clients?.first_name} {quote.clients?.last_name}
                        </p>
                        <p className="text-sm text-gray-600 truncate">{quote.object}</p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {parseFloat(quote.total_ttc.toString()).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA
                        </p>
                        <Badge className={cn('mt-2', statusColors[quote.status])}>
                          {statusLabels[quote.status]}
                        </Badge>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setSelectedQuote(quote); setIsDetailOpen(true) }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setSelectedQuote(quote); setIsEditOpen(true) }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleDuplicate(quote)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        {quote.status === 'accepted' && (
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleConvertToInvoice(quote)} title="Convertir en facture">
                            <FileText className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleDelete(quote.id)}>
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
                      <TableHead>Objet</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Montant TTC</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuotes.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell className="font-medium">
                          {quote.quote_number}
                        </TableCell>
                        <TableCell>
                          {quote.clients?.first_name} {quote.clients?.last_name}
                        </TableCell>
                        <TableCell>{quote.object}</TableCell>
                        <TableCell>
                          {new Date(quote.date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          {parseFloat(quote.total_ttc.toString()).toLocaleString('fr-FR', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}{' '}
                          FCFA
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[quote.status]}>
                            {statusLabels[quote.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedQuote(quote)
                                setIsDetailOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedQuote(quote)
                                setIsEditOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDuplicate(quote)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {quote.status === 'accepted' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleConvertToInvoice(quote)}
                                title="Convertir en facture"
                              >
                                <FileText className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(quote.id)}
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
          {selectedQuote && <QuoteDetail quoteId={selectedQuote.id} />}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le devis</DialogTitle>
          </DialogHeader>
          {selectedQuote && (
            <QuoteForm
              quoteId={selectedQuote.id}
              onSuccess={() => {
                setIsEditOpen(false)
                loadQuotes()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
