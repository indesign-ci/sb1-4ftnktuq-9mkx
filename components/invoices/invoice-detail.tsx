// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { InvoicePDFDocument } from '@/lib/pdf/pdf-generator'
import { transformCompanyData, transformClientData, transformInvoiceData } from '@/lib/pdf/pdf-data-transform'
import { PDFPreviewModal } from '@/components/pdf/pdf-preview-modal'

type InvoiceDetailProps = {
  invoiceId: string
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

export function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
  const [invoice, setInvoice] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<any>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    loadInvoice()
    loadPayments()
    loadCompany()
  }, [invoiceId])

  const loadInvoice = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (
            first_name,
            last_name,
            email,
            phone,
            address,
            city,
            postal_code
          ),
          projects (
            name
          ),
          invoice_lines (*)
        `)
        .eq('id', invoiceId)
        .single()

      if (error) throw error

      const invoiceData = data as any

      const sortedLines = invoiceData.invoice_lines?.sort(
        (a: any, b: any) => a.position - b.position
      )

      setInvoice({ ...invoiceData, invoice_lines: sortedLines })
    } catch (error: any) {
      toast.error('Erreur lors du chargement de la facture')
    } finally {
      setLoading(false)
    }
  }

  const loadPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('payment_date', { ascending: false })

      if (error) throw error
      setPayments(data || [])
    } catch (error: any) {
      console.error('Error loading payments:', error)
    }
  }

  const loadCompany = async () => {
    try {
      // En mode sans authentification, on charge simplement la première société disponible
      const { data: companyData, error } = await supabase
        .from('companies')
        .select('*')
        .limit(1)
        .single()

      if (error) {
        console.error('Error loading company:', error)
        return
      }

      setCompany(companyData)
    } catch (error) {
      console.error('Error loading company:', error)
    }
  }

  const handlePreviewPDF = () => {
    if (!invoice || !company) {
      toast.error('Données manquantes pour générer le PDF')
      return
    }
    setPreviewOpen(true)
  }

  const getPDFData = () => {
    if (!invoice || !company) return null

    return {
      company: transformCompanyData(company),
      client: transformClientData(invoice.clients),
      invoice: transformInvoiceData(invoice, company),
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A572] mx-auto"></div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-8 text-gray-500">
        Facture introuvable
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {invoice.invoice_number}
          </h2>
          <p className="text-gray-600 mt-1">{invoice.object}</p>
          <Badge variant="outline" className="mt-2">
            {typeLabels[invoice.invoice_type]}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviewPDF}
            disabled={!company}
          >
            <Eye className="h-4 w-4 mr-2" />
            Prévisualiser
          </Button>
          {getPDFData() && (
            <PDFDownloadLink
              document={
                <InvoicePDFDocument
                  company={getPDFData()!.company}
                  client={getPDFData()!.client}
                  invoice={getPDFData()!.invoice}
                />
              }
              fileName={`Facture_${invoice.invoice_number}.pdf`}
            >
              {({ loading }) => (
                <Button
                  size="sm"
                  disabled={loading || !company}
                  className="bg-[#C5A572] hover:bg-[#B09562]"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? 'Génération...' : 'Télécharger PDF'}
                </Button>
              )}
            </PDFDownloadLink>
          )}
          <Badge className={statusColors[invoice.status]}>
            {statusLabels[invoice.status]}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Client</p>
              <p className="font-medium">
                {invoice.clients?.first_name} {invoice.clients?.last_name}
              </p>
              <p className="text-sm text-gray-600">{invoice.clients?.email}</p>
              <p className="text-sm text-gray-600">{invoice.clients?.phone}</p>
            </div>

            {invoice.clients?.address && (
              <div>
                <p className="text-sm text-gray-600">Adresse</p>
                <p className="text-sm">{invoice.clients.address}</p>
                <p className="text-sm">
                  {invoice.clients.postal_code} {invoice.clients.city}
                </p>
              </div>
            )}

            {invoice.projects && (
              <div>
                <p className="text-sm text-gray-600">Projet</p>
                <p className="font-medium">{invoice.projects.name}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-600">Date de la facture</p>
              <p className="font-medium">
                {new Date(invoice.date).toLocaleDateString('fr-FR')}
              </p>
            </div>

            {invoice.due_date && (
              <div>
                <p className="text-sm text-gray-600">Date d'échéance</p>
                <p className="font-medium">
                  {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lignes de la facture</CardTitle>
        </CardHeader>
        <CardContent>
          {invoice.invoice_lines && invoice.invoice_lines.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Désignation</TableHead>
                  <TableHead>Qté</TableHead>
                  <TableHead>Unité</TableHead>
                  <TableHead className="text-right">P.U. HT</TableHead>
                  <TableHead className="text-right">TVA</TableHead>
                  <TableHead className="text-right">Remise</TableHead>
                  <TableHead className="text-right">Total HT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.invoice_lines.map((line: any) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{line.designation}</p>
                        {line.description && (
                          <p className="text-sm text-gray-600">
                            {line.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {parseFloat(line.quantity).toFixed(2)}
                    </TableCell>
                    <TableCell>{line.unit}</TableCell>
                    <TableCell className="text-right">
                      {parseFloat(line.unit_price).toFixed(2)} FCFA
                    </TableCell>
                    <TableCell className="text-right">
                      {line.vat_rate}%
                    </TableCell>
                    <TableCell className="text-right">
                      {parseFloat(line.discount_percent || 0).toFixed(0)}%
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {parseFloat(line.total_ht).toFixed(2)} FCFA
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500 text-sm">Aucune ligne</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Récapitulatif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Sous-total HT</span>
            <span className="font-medium">
              {parseFloat(invoice.subtotal).toFixed(2)} FCFA
            </span>
          </div>

          {parseFloat(invoice.discount_percent) > 0 && (
            <div className="flex justify-between text-red-600">
              <span>
                Remise globale (
                {parseFloat(invoice.discount_percent).toFixed(1)}%)
              </span>
              <span>-{parseFloat(invoice.discount_amount).toFixed(2)} FCFA</span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between font-medium">
            <span>Total HT</span>
            <span>{parseFloat(invoice.total_ht).toFixed(2)} FCFA</span>
          </div>

          {parseFloat(invoice.vat_10) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>TVA 10%</span>
              <span>{parseFloat(invoice.vat_10).toFixed(2)} FCFA</span>
            </div>
          )}

          {parseFloat(invoice.vat_18) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>TVA 18%</span>
              <span>{parseFloat(invoice.vat_18).toFixed(2)} FCFA</span>
            </div>
          )}

          {parseFloat(invoice.vat_20) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>TVA 20%</span>
              <span>{parseFloat(invoice.vat_20).toFixed(2)} FCFA</span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between text-xl font-bold">
            <span>Total TTC</span>
            <span className="text-[#C5A572]">
              {parseFloat(invoice.total_ttc).toFixed(2)} FCFA
            </span>
          </div>

          <Separator className="my-4" />

          <div className="flex justify-between text-lg">
            <span className="font-medium">Montant payé</span>
            <span className="text-green-600 font-bold">
              {parseFloat(invoice.amount_paid).toFixed(2)} FCFA
            </span>
          </div>

          <div className="flex justify-between text-xl font-bold">
            <span>Reste dû</span>
            <span className="text-red-600">
              {parseFloat(invoice.amount_due).toFixed(2)} FCFA
            </span>
          </div>
        </CardContent>
      </Card>

      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historique des paiements</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Référence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.payment_date).toLocaleDateString(
                        'fr-FR'
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {parseFloat(payment.amount).toFixed(2)} FCFA
                    </TableCell>
                    <TableCell>{payment.payment_method}</TableCell>
                    <TableCell className="text-gray-600">
                      {payment.reference || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {invoice.payment_terms && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conditions de paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {invoice.payment_terms}
            </p>
          </CardContent>
        </Card>
      )}

      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {invoice.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {getPDFData() && (
        <PDFPreviewModal
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          title={`Aperçu de la facture ${invoice.invoice_number}`}
        >
          <InvoicePDFDocument
            company={getPDFData()!.company}
            client={getPDFData()!.client}
            invoice={getPDFData()!.invoice}
          />
        </PDFPreviewModal>
      )}
    </div>
  )
}
