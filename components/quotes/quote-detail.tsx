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
import { QuotePDFDocument } from '@/lib/pdf/pdf-generator'
import { transformCompanyData, transformClientData, transformQuoteData } from '@/lib/pdf/pdf-data-transform'
import { PDFPreviewModal } from '@/components/pdf/pdf-preview-modal'

type QuoteDetailProps = {
  quoteId: string
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

export function QuoteDetail({ quoteId }: QuoteDetailProps) {
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<any>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    loadQuote()
    loadCompany()
  }, [quoteId])

  const loadQuote = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
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
          quote_sections (
            id,
            title,
            position,
            quote_lines (
              id,
              designation,
              description,
              quantity,
              unit,
              unit_price,
              vat_rate,
              discount_percent,
              total_ht,
              position
            )
          )
        `)
        .eq('id', quoteId)
        .single()

      if (error) throw error

      const quoteData = data as any

      const sortedSections = quoteData.quote_sections
        ?.map((section: any) => ({
          ...section,
          quote_lines: section.quote_lines?.sort(
            (a: any, b: any) => a.position - b.position
          ),
        }))
        .sort((a: any, b: any) => a.position - b.position)

      setQuote({ ...quoteData, quote_sections: sortedSections })
    } catch (error: any) {
      toast.error('Erreur lors du chargement du devis')
    } finally {
      setLoading(false)
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
    if (!quote || !company) {
      toast.error('Données manquantes pour générer le PDF')
      return
    }
    setPreviewOpen(true)
  }

  const getPDFData = () => {
    if (!quote || !company) return null

    return {
      company: transformCompanyData(company),
      client: transformClientData(quote.clients),
      quote: transformQuoteData(quote, company),
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A572] mx-auto"></div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="text-center py-8 text-gray-500">Devis introuvable</div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {quote.quote_number}
          </h2>
          <p className="text-gray-600 mt-1">{quote.object}</p>
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
                <QuotePDFDocument
                  company={getPDFData()!.company}
                  client={getPDFData()!.client}
                  quote={getPDFData()!.quote}
                />
              }
              fileName={`Devis_${quote.quote_number}.pdf`}
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
          <Badge className={statusColors[quote.status]}>
            {statusLabels[quote.status]}
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
                {quote.clients?.first_name} {quote.clients?.last_name}
              </p>
              <p className="text-sm text-gray-600">{quote.clients?.email}</p>
              <p className="text-sm text-gray-600">{quote.clients?.phone}</p>
            </div>

            {quote.clients?.address && (
              <div>
                <p className="text-sm text-gray-600">Adresse</p>
                <p className="text-sm">{quote.clients.address}</p>
                <p className="text-sm">
                  {quote.clients.postal_code} {quote.clients.city}
                </p>
              </div>
            )}

            {quote.projects && (
              <div>
                <p className="text-sm text-gray-600">Projet</p>
                <p className="font-medium">{quote.projects.name}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-600">Date du devis</p>
              <p className="font-medium">
                {new Date(quote.date).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Valide jusqu'au</p>
              <p className="font-medium">
                {new Date(quote.valid_until).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {quote.quote_sections?.map((section: any) => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {section.quote_lines && section.quote_lines.length > 0 ? (
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
                  {section.quote_lines.map((line: any) => (
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
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Récapitulatif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Sous-total HT</span>
            <span className="font-medium">
              {parseFloat(quote.subtotal).toFixed(2)} FCFA
            </span>
          </div>

          {parseFloat(quote.discount_percent) > 0 && (
            <div className="flex justify-between text-red-600">
              <span>
                Remise globale ({parseFloat(quote.discount_percent).toFixed(1)}
                %)
              </span>
              <span>-{parseFloat(quote.discount_amount).toFixed(2)} FCFA</span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between font-medium">
            <span>Total HT</span>
            <span>{parseFloat(quote.total_ht).toFixed(2)} FCFA</span>
          </div>

          {parseFloat(quote.vat_10) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>TVA 10%</span>
              <span>{parseFloat(quote.vat_10).toFixed(2)} FCFA</span>
            </div>
          )}

          {parseFloat(quote.vat_18) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>TVA 18%</span>
              <span>{parseFloat(quote.vat_18).toFixed(2)} FCFA</span>
            </div>
          )}

          {parseFloat(quote.vat_20) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>TVA 20%</span>
              <span>{parseFloat(quote.vat_20).toFixed(2)} FCFA</span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between text-xl font-bold">
            <span>Total TTC</span>
            <span className="text-[#C5A572]">
              {parseFloat(quote.total_ttc).toFixed(2)} FCFA
            </span>
          </div>
        </CardContent>
      </Card>

      {quote.payment_terms && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conditions de paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {quote.payment_terms}
            </p>
          </CardContent>
        </Card>
      )}

      {quote.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {quote.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {getPDFData() && (
        <PDFPreviewModal
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          title={`Aperçu du devis ${quote.quote_number}`}
        >
          <QuotePDFDocument
            company={getPDFData()!.company}
            client={getPDFData()!.client}
            quote={getPDFData()!.quote}
          />
        </PDFPreviewModal>
      )}
    </div>
  )
}
