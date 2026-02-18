"use client"

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
  PDFDownloadLink,
} from '@react-pdf/renderer'

interface Company {
  name: string
  address: string
  city: string
  zipCode: string
  phone: string
  email: string
  website?: string
  siret: string
  tvaNumber: string
  rcs: string
  capital?: string
  iban?: string
  logo?: string
}

interface Client {
  civility: string
  firstName: string
  lastName: string
  company?: string
  address: string
  city: string
  zipCode: string
  email: string
  phone: string
}

interface QuoteLine {
  designation: string
  description?: string
  quantity: number
  unit: string
  unitPriceHT: number
  tvaRate: number
  discount: number
  totalHT: number
}

interface QuoteSection {
  title: string
  lines: QuoteLine[]
  subtotalHT: number
}

interface QuoteData {
  number: string
  date: string
  validityDate: string
  object: string
  sections: QuoteSection[]
  totalHT: number
  discountPercent: number
  discountAmount: number
  netHT: number
  tva10Amount: number
  tva20Amount: number
  totalTTC: number
  depositPercent: number
  depositAmount: number
  paymentConditions: string
  cgv: string
}

interface QuotePDFProps {
  company: Company
  client: Client
  quote: QuoteData
}

const GOLD = '#C5A572'
const DARK = '#1A1A1A'
const GRAY = '#666666'
const LIGHT_GRAY = '#F5F5F5'
const WHITE = '#FFFFFF'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 30,
    paddingBottom: 60,
    paddingHorizontal: 40,
    color: DARK,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    paddingBottom: 15,
  },
  logo: {
    width: 120,
    height: 60,
    objectFit: 'contain',
  },
  logoPlaceholder: {
    width: 120,
    height: 60,
    backgroundColor: LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: GOLD,
    letterSpacing: 3,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  infoBlock: {
    width: '45%',
  },
  infoBlockTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: GOLD,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
    paddingBottom: 4,
  },
  infoText: {
    fontSize: 9,
    marginBottom: 2,
    color: DARK,
  },
  infoBold: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },

  quoteInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: LIGHT_GRAY,
    padding: 12,
    marginBottom: 5,
    borderRadius: 3,
  },
  quoteInfoItem: {
    alignItems: 'center',
  },
  quoteInfoLabel: {
    fontSize: 7,
    color: GRAY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  quoteInfoValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
  },

  objectSection: {
    marginBottom: 20,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
    backgroundColor: LIGHT_GRAY,
  },
  objectLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: GOLD,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  objectText: {
    fontSize: 10,
    color: DARK,
  },

  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    backgroundColor: GOLD,
    padding: 6,
    paddingHorizontal: 8,
    marginTop: 10,
    marginBottom: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: DARK,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableHeaderText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  tableRowAlt: {
    backgroundColor: LIGHT_GRAY,
  },
  tableCell: {
    fontSize: 8,
    color: DARK,
  },
  tableCellDesc: {
    fontSize: 7,
    color: GRAY,
    marginTop: 2,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: '#F0EBE0',
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
  },
  subtotalText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
  },

  colDesignation: { width: '30%' },
  colDescription: { width: '18%' },
  colQty: { width: '8%', textAlign: 'center' },
  colUnit: { width: '8%', textAlign: 'center' },
  colPU: { width: '12%', textAlign: 'right' },
  colTVA: { width: '8%', textAlign: 'center' },
  colTotal: { width: '16%', textAlign: 'right' },

  recapSection: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  recapTable: {
    width: '45%',
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 3,
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  recapRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: GOLD,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  recapLabel: {
    fontSize: 9,
    color: DARK,
  },
  recapValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
  },
  recapTotalLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
  },
  recapTotalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
  },

  conditionsSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 3,
  },
  conditionsTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: GOLD,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  conditionsText: {
    fontSize: 8,
    color: GRAY,
    lineHeight: 1.4,
  },
  depositText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 3,
    textAlign: 'center',
  },

  signatureSection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBlock: {
    width: '45%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 3,
    padding: 15,
    minHeight: 100,
  },
  signatureTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: GOLD,
    marginBottom: 8,
    textAlign: 'center',
  },
  signatureLine: {
    fontSize: 8,
    color: GRAY,
    marginBottom: 4,
  },
  signatureSpace: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginTop: 10,
  },

  cgvSection: {
    marginTop: 20,
  },
  cgvTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: GOLD,
    marginBottom: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cgvText: {
    fontSize: 7,
    color: GRAY,
    lineHeight: 1.5,
    textAlign: 'justify',
  },

  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: GOLD,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: GRAY,
  },
  footerPage: {
    fontSize: 7,
    color: GOLD,
    fontFamily: 'Helvetica-Bold',
  },
})

const formatCurrency = (amount: number, currency: string = 'XAF'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const QuotePDFDocument: React.FC<QuotePDFProps> = ({
  company,
  client,
  quote,
}) => (
  <Document
    title={`Devis ${quote.number}`}
    author={company.name}
    subject={quote.object}
  >
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          {company.logo ? (
            <Image src={company.logo} style={styles.logo} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={{ fontSize: 10, color: GRAY }}>
                {company.name}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.headerTitle}>DEVIS</Text>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoBlock}>
          <Text style={styles.infoBlockTitle}>Émetteur</Text>
          <Text style={styles.infoBold}>{company.name}</Text>
          <Text style={styles.infoText}>{company.address}</Text>
          <Text style={styles.infoText}>
            {company.zipCode} {company.city}
          </Text>
          <Text style={styles.infoText}>Tél : {company.phone}</Text>
          <Text style={styles.infoText}>
            Email : {company.email}
          </Text>
          <Text style={styles.infoText}>SIRET : {company.siret}</Text>
          <Text style={styles.infoText}>
            TVA : {company.tvaNumber}
          </Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.infoBlockTitle}>Client</Text>
          <Text style={styles.infoBold}>
            {client.civility} {client.firstName} {client.lastName}
          </Text>
          {client.company && (
            <Text style={styles.infoText}>{client.company}</Text>
          )}
          <Text style={styles.infoText}>{client.address}</Text>
          <Text style={styles.infoText}>
            {client.zipCode} {client.city}
          </Text>
          <Text style={styles.infoText}>
            Email : {client.email}
          </Text>
          <Text style={styles.infoText}>
            Tél : {client.phone}
          </Text>
        </View>
      </View>

      <View style={styles.quoteInfoRow}>
        <View style={styles.quoteInfoItem}>
          <Text style={styles.quoteInfoLabel}>Numéro</Text>
          <Text style={styles.quoteInfoValue}>{quote.number}</Text>
        </View>
        <View style={styles.quoteInfoItem}>
          <Text style={styles.quoteInfoLabel}>Date d'émission</Text>
          <Text style={styles.quoteInfoValue}>
            {formatDate(quote.date)}
          </Text>
        </View>
        <View style={styles.quoteInfoItem}>
          <Text style={styles.quoteInfoLabel}>Validité</Text>
          <Text style={styles.quoteInfoValue}>
            {formatDate(quote.validityDate)}
          </Text>
        </View>
      </View>

      <View style={styles.objectSection}>
        <Text style={styles.objectLabel}>Objet</Text>
        <Text style={styles.objectText}>{quote.object}</Text>
      </View>

      {quote.sections.map((section, sectionIndex) => (
        <View key={sectionIndex} wrap={false}>
          <Text style={styles.sectionTitle}>{section.title}</Text>

          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDesignation]}>
              Désignation
            </Text>
            <Text style={[styles.tableHeaderText, styles.colDescription]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>
              Qté
            </Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>
              Unité
            </Text>
            <Text style={[styles.tableHeaderText, styles.colPU]}>
              PU HT
            </Text>
            <Text style={[styles.tableHeaderText, styles.colTVA]}>
              TVA
            </Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>
              Total HT
            </Text>
          </View>

          {section.lines.map((line, lineIndex) => (
            <View
              key={lineIndex}
              style={[
                styles.tableRow,
                lineIndex % 2 === 1 ? styles.tableRowAlt : {},
              ]}
            >
              <View style={styles.colDesignation}>
                <Text style={styles.tableCell}>{line.designation}</Text>
                {line.description && (
                  <Text style={styles.tableCellDesc}>
                    {line.description}
                  </Text>
                )}
              </View>
              <Text style={[styles.tableCell, styles.colDescription]}>
                {line.description || ''}
              </Text>
              <Text style={[styles.tableCell, styles.colQty]}>
                {line.quantity}
              </Text>
              <Text style={[styles.tableCell, styles.colUnit]}>
                {line.unit}
              </Text>
              <Text style={[styles.tableCell, styles.colPU]}>
                {formatCurrency(line.unitPriceHT)}
              </Text>
              <Text style={[styles.tableCell, styles.colTVA]}>
                {line.tvaRate}%
              </Text>
              <Text style={[styles.tableCell, styles.colTotal]}>
                {formatCurrency(line.totalHT)}
              </Text>
            </View>
          ))}

          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalText}>
              Sous-total {section.title} :{' '}
              {formatCurrency(section.subtotalHT)}
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.recapSection}>
        <View style={styles.recapTable}>
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Total HT</Text>
            <Text style={styles.recapValue}>
              {formatCurrency(quote.totalHT)}
            </Text>
          </View>
          {quote.discountPercent > 0 && (
            <>
              <View style={styles.recapRow}>
                <Text style={styles.recapLabel}>
                  Remise ({quote.discountPercent}%)
                </Text>
                <Text style={styles.recapValue}>
                  - {formatCurrency(quote.discountAmount)}
                </Text>
              </View>
              <View style={styles.recapRow}>
                <Text style={styles.recapLabel}>Net HT</Text>
                <Text style={styles.recapValue}>
                  {formatCurrency(quote.netHT)}
                </Text>
              </View>
            </>
          )}
          {quote.tva10Amount > 0 && (
            <View style={styles.recapRow}>
              <Text style={styles.recapLabel}>TVA 10%</Text>
              <Text style={styles.recapValue}>
                {formatCurrency(quote.tva10Amount)}
              </Text>
            </View>
          )}
          {quote.tva20Amount > 0 && (
            <View style={styles.recapRow}>
              <Text style={styles.recapLabel}>TVA 20%</Text>
              <Text style={styles.recapValue}>
                {formatCurrency(quote.tva20Amount)}
              </Text>
            </View>
          )}
          <View style={styles.recapRowTotal}>
            <Text style={styles.recapTotalLabel}>TOTAL TTC</Text>
            <Text style={styles.recapTotalValue}>
              {formatCurrency(quote.totalTTC)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.conditionsSection}>
        <Text style={styles.conditionsTitle}>
          Conditions de paiement
        </Text>
        <Text style={styles.conditionsText}>
          {quote.paymentConditions}
        </Text>
        <Text style={styles.depositText}>
          Acompte de {quote.depositPercent}% à la signature,
          soit {formatCurrency(quote.depositAmount)}
        </Text>
      </View>

      <View style={styles.signatureSection}>
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureTitle}>L'entreprise</Text>
          <Text style={styles.signatureLine}>
            Date : _______________
          </Text>
          <Text style={styles.signatureLine}>Signature :</Text>
          <View style={styles.signatureSpace} />
        </View>
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureTitle}>
            Le client — Bon pour accord
          </Text>
          <Text style={styles.signatureLine}>
            Date : _______________
          </Text>
          <Text style={styles.signatureLine}>
            Signature précédée de la mention
          </Text>
          <Text style={styles.signatureLine}>
            « Bon pour accord »
          </Text>
          <View style={styles.signatureSpace} />
        </View>
      </View>

      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>
          {company.name} — SIRET {company.siret} — TVA{' '}
          {company.tvaNumber} — RCS {company.rcs}
        </Text>
        <Text
          style={styles.footerPage}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} / ${totalPages}`
          }
        />
      </View>
    </Page>

    <Page size="A4" style={styles.page}>
      <View style={styles.cgvSection}>
        <Text style={styles.cgvTitle}>
          Conditions Générales de Vente
        </Text>
        <Text style={styles.cgvText}>{quote.cgv}</Text>
      </View>

      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>
          {company.name} — SIRET {company.siret} — TVA{' '}
          {company.tvaNumber} — RCS {company.rcs}
        </Text>
        <Text
          style={styles.footerPage}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} / ${totalPages}`
          }
        />
      </View>
    </Page>
  </Document>
)

interface InvoiceData extends QuoteData {
  type: 'Acompte' | 'Intermédiaire' | 'Solde' | 'Avoir'
  quoteRef?: string
  iban?: string
  latePaymentPenalty: string
}

interface InvoicePDFProps {
  company: Company
  client: Client
  invoice: InvoiceData
}

const InvoicePDFDocument: React.FC<InvoicePDFProps> = ({
  company,
  client,
  invoice,
}) => (
  <Document
    title={`Facture ${invoice.number}`}
    author={company.name}
  >
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          {company.logo ? (
            <Image src={company.logo} style={styles.logo} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={{ fontSize: 10, color: GRAY }}>
                {company.name}
              </Text>
            </View>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.headerTitle}>FACTURE</Text>
          <Text style={{
            fontSize: 10,
            color: GOLD,
            marginTop: 4,
            fontFamily: 'Helvetica-Bold'
          }}>
            {invoice.type === 'Acompte' && "Facture d'acompte"}
            {invoice.type === 'Intermédiaire' && 'Facture intermédiaire'}
            {invoice.type === 'Solde' && 'Facture de solde'}
            {invoice.type === 'Avoir' && 'Avoir'}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoBlock}>
          <Text style={styles.infoBlockTitle}>Émetteur</Text>
          <Text style={styles.infoBold}>{company.name}</Text>
          <Text style={styles.infoText}>{company.address}</Text>
          <Text style={styles.infoText}>
            {company.zipCode} {company.city}
          </Text>
          <Text style={styles.infoText}>Tél : {company.phone}</Text>
          <Text style={styles.infoText}>Email : {company.email}</Text>
          <Text style={styles.infoText}>SIRET : {company.siret}</Text>
          <Text style={styles.infoText}>TVA : {company.tvaNumber}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.infoBlockTitle}>Client</Text>
          <Text style={styles.infoBold}>
            {client.civility} {client.firstName} {client.lastName}
          </Text>
          {client.company && (
            <Text style={styles.infoText}>{client.company}</Text>
          )}
          <Text style={styles.infoText}>{client.address}</Text>
          <Text style={styles.infoText}>
            {client.zipCode} {client.city}
          </Text>
        </View>
      </View>

      <View style={styles.quoteInfoRow}>
        <View style={styles.quoteInfoItem}>
          <Text style={styles.quoteInfoLabel}>Numéro</Text>
          <Text style={styles.quoteInfoValue}>{invoice.number}</Text>
        </View>
        <View style={styles.quoteInfoItem}>
          <Text style={styles.quoteInfoLabel}>Date</Text>
          <Text style={styles.quoteInfoValue}>
            {formatDate(invoice.date)}
          </Text>
        </View>
        {invoice.quoteRef && (
          <View style={styles.quoteInfoItem}>
            <Text style={styles.quoteInfoLabel}>Réf. devis</Text>
            <Text style={styles.quoteInfoValue}>
              {invoice.quoteRef}
            </Text>
          </View>
        )}
        <View style={styles.quoteInfoItem}>
          <Text style={styles.quoteInfoLabel}>Échéance</Text>
          <Text style={styles.quoteInfoValue}>
            {formatDate(invoice.validityDate)}
          </Text>
        </View>
      </View>

      <View style={styles.objectSection}>
        <Text style={styles.objectLabel}>Objet</Text>
        <Text style={styles.objectText}>{invoice.object}</Text>
      </View>

      {invoice.sections.map((section, sectionIndex) => (
        <View key={sectionIndex} wrap={false}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDesignation]}>
              Désignation
            </Text>
            <Text style={[styles.tableHeaderText, styles.colDescription]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qté</Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>Unité</Text>
            <Text style={[styles.tableHeaderText, styles.colPU]}>PU HT</Text>
            <Text style={[styles.tableHeaderText, styles.colTVA]}>TVA</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>
              Total HT
            </Text>
          </View>
          {section.lines.map((line, lineIndex) => (
            <View
              key={lineIndex}
              style={[
                styles.tableRow,
                lineIndex % 2 === 1 ? styles.tableRowAlt : {},
              ]}
            >
              <Text style={[styles.tableCell, styles.colDesignation]}>
                {line.designation}
              </Text>
              <Text style={[styles.tableCell, styles.colDescription]}>
                {line.description || ''}
              </Text>
              <Text style={[styles.tableCell, styles.colQty]}>
                {line.quantity}
              </Text>
              <Text style={[styles.tableCell, styles.colUnit]}>
                {line.unit}
              </Text>
              <Text style={[styles.tableCell, styles.colPU]}>
                {formatCurrency(line.unitPriceHT)}
              </Text>
              <Text style={[styles.tableCell, styles.colTVA]}>
                {line.tvaRate}%
              </Text>
              <Text style={[styles.tableCell, styles.colTotal]}>
                {formatCurrency(line.totalHT)}
              </Text>
            </View>
          ))}
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalText}>
              Sous-total : {formatCurrency(section.subtotalHT)}
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.recapSection}>
        <View style={styles.recapTable}>
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Total HT</Text>
            <Text style={styles.recapValue}>
              {formatCurrency(invoice.totalHT)}
            </Text>
          </View>
          {invoice.tva10Amount > 0 && (
            <View style={styles.recapRow}>
              <Text style={styles.recapLabel}>TVA 10%</Text>
              <Text style={styles.recapValue}>
                {formatCurrency(invoice.tva10Amount)}
              </Text>
            </View>
          )}
          {invoice.tva20Amount > 0 && (
            <View style={styles.recapRow}>
              <Text style={styles.recapLabel}>TVA 20%</Text>
              <Text style={styles.recapValue}>
                {formatCurrency(invoice.tva20Amount)}
              </Text>
            </View>
          )}
          <View style={styles.recapRowTotal}>
            <Text style={styles.recapTotalLabel}>TOTAL TTC</Text>
            <Text style={styles.recapTotalValue}>
              {formatCurrency(invoice.totalTTC)}
            </Text>
          </View>
        </View>
      </View>

      {company.iban && (
        <View style={[styles.conditionsSection, { marginTop: 15 }]}>
          <Text style={styles.conditionsTitle}>
            Coordonnées bancaires
          </Text>
          <Text style={styles.conditionsText}>
            IBAN : {company.iban}
          </Text>
        </View>
      )}

      <View style={[styles.conditionsSection, { marginTop: 10 }]}>
        <Text style={styles.conditionsTitle}>Mentions légales</Text>
        <Text style={styles.conditionsText}>
          {invoice.paymentConditions}
        </Text>
        <Text style={[styles.conditionsText, { marginTop: 5 }]}>
          {invoice.latePaymentPenalty ||
            "En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée, ainsi qu'une indemnité forfaitaire de 40 FCFA pour frais de recouvrement."}
        </Text>
      </View>

      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>
          {company.name} — SIRET {company.siret} — TVA{' '}
          {company.tvaNumber} — RCS {company.rcs}
        </Text>
        <Text
          style={styles.footerPage}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} / ${totalPages}`
          }
        />
      </View>
    </Page>
  </Document>
)

export const DownloadQuotePDF: React.FC<QuotePDFProps & {
  className?: string
}> = ({ company, client, quote, className }) => (
  <PDFDownloadLink
    document={
      <QuotePDFDocument
        company={company}
        client={client}
        quote={quote}
      />
    }
    fileName={`${quote.number}.pdf`}
    className={className}
  >
    {({ loading }) =>
      loading ? 'Génération...' : 'Télécharger le devis PDF'
    }
  </PDFDownloadLink>
)

export const DownloadInvoicePDF: React.FC<InvoicePDFProps & {
  className?: string
}> = ({ company, client, invoice, className }) => (
  <PDFDownloadLink
    document={
      <InvoicePDFDocument
        company={company}
        client={client}
        invoice={invoice}
      />
    }
    fileName={`${invoice.number}.pdf`}
    className={className}
  >
    {({ loading }) =>
      loading ? 'Génération...' : 'Télécharger la facture PDF'
    }
  </PDFDownloadLink>
)

export { QuotePDFDocument, InvoicePDFDocument }
export type { QuotePDFProps, InvoicePDFProps, QuoteData, InvoiceData, Company, Client }
