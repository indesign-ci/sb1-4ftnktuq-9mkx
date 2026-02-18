import type { Company, Client, QuoteData, InvoiceData } from './pdf-generator'

export function transformCompanyData(companyData: any): Company {
  return {
    name: companyData?.name || '',
    address: companyData?.address || '',
    city: companyData?.city || '',
    zipCode: companyData?.postal_code || '',
    phone: companyData?.phone || '',
    email: companyData?.email || '',
    website: companyData?.website || '',
    siret: companyData?.siret || '',
    tvaNumber: companyData?.vat_number || '',
    rcs: companyData?.rcs || '',
    capital: companyData?.capital || '',
    iban: companyData?.iban || '',
    logo: companyData?.logo_url || '',
  }
}

export function transformClientData(clientData: any): Client {
  return {
    civility: clientData?.civility || 'M.',
    firstName: clientData?.first_name || '',
    lastName: clientData?.last_name || '',
    company: clientData?.company_name || '',
    address: clientData?.address || '',
    city: clientData?.city || '',
    zipCode: clientData?.postal_code || '',
    email: clientData?.email || '',
    phone: clientData?.phone || '',
  }
}

export function transformQuoteData(quoteData: any, companyData: any): QuoteData {
  const sections = quoteData?.quote_sections?.map((section: any) => ({
    title: section.title,
    lines: section.quote_lines?.map((line: any) => ({
      designation: line.designation,
      description: line.description || '',
      quantity: parseFloat(line.quantity),
      unit: line.unit,
      unitPriceHT: parseFloat(line.unit_price),
      tvaRate: parseFloat(line.vat_rate),
      discount: parseFloat(line.discount_percent || 0),
      totalHT: parseFloat(line.total_ht),
    })) || [],
    subtotalHT: section.quote_lines?.reduce(
      (sum: number, line: any) => sum + parseFloat(line.total_ht),
      0
    ) || 0,
  })) || []

  const depositPercent = companyData?.deposit_percent || 30
  const depositAmount = (parseFloat(quoteData?.total_ttc || 0) * depositPercent) / 100

  return {
    number: quoteData?.quote_number || '',
    date: quoteData?.date || new Date().toISOString(),
    validityDate: quoteData?.valid_until || new Date().toISOString(),
    object: quoteData?.object || '',
    sections,
    totalHT: parseFloat(quoteData?.total_ht || 0),
    discountPercent: parseFloat(quoteData?.discount_percent || 0),
    discountAmount: parseFloat(quoteData?.discount_amount || 0),
    netHT: parseFloat(quoteData?.total_ht || 0) - parseFloat(quoteData?.discount_amount || 0),
    tva10Amount: parseFloat(quoteData?.vat_10 || 0),
    tva20Amount: parseFloat(quoteData?.vat_20 || 0),
    totalTTC: parseFloat(quoteData?.total_ttc || 0),
    depositPercent,
    depositAmount,
    paymentConditions: quoteData?.payment_terms || companyData?.payment_terms || 'Paiement à réception de facture',
    cgv: companyData?.terms_and_conditions || `ARTICLE 1 - Objet
Les présentes Conditions Générales de Vente (CGV) définissent les droits et obligations des parties dans le cadre de la vente de prestations de décoration d'intérieur.

ARTICLE 2 - Prix
Les prix sont exprimés en euros et sont fermes et définitifs. Ils sont valables pour la durée indiquée sur le devis.

ARTICLE 3 - Modalités de paiement
Un acompte de ${depositPercent}% est exigé à la signature du devis. Le solde est payable à la fin des travaux.

ARTICLE 4 - Délais
Les délais indiqués sont donnés à titre indicatif et ne constituent pas un engagement contractuel.

ARTICLE 5 - Responsabilité
L'entreprise ne peut être tenue responsable des dommages résultant d'une mauvaise utilisation ou d'un manque d'entretien des éléments fournis.

ARTICLE 6 - Propriété intellectuelle
Les créations et concepts restent la propriété intellectuelle de l'entreprise jusqu'au paiement intégral.

ARTICLE 7 - Litiges
En cas de litige, les parties s'engagent à rechercher une solution amiable avant toute action judiciaire.`,
  }
}

export function transformInvoiceData(invoiceData: any, companyData: any): InvoiceData {
  const typeMap: Record<string, 'Acompte' | 'Intermédiaire' | 'Solde' | 'Avoir'> = {
    deposit: 'Acompte',
    intermediate: 'Intermédiaire',
    final: 'Solde',
    credit_note: 'Avoir',
  }

  const lines = invoiceData?.invoice_lines?.map((line: any) => ({
    designation: line.designation,
    description: line.description || '',
    quantity: parseFloat(line.quantity),
    unit: line.unit,
    unitPriceHT: parseFloat(line.unit_price),
    tvaRate: parseFloat(line.vat_rate),
    discount: parseFloat(line.discount_percent || 0),
    totalHT: parseFloat(line.total_ht),
  })) || []

  const sections = [{
    title: 'Prestations',
    lines,
    subtotalHT: lines.reduce((sum: number, line: any) => sum + line.totalHT, 0),
  }]

  return {
    number: invoiceData?.invoice_number || '',
    date: invoiceData?.date || new Date().toISOString(),
    validityDate: invoiceData?.due_date || new Date().toISOString(),
    object: invoiceData?.object || '',
    sections,
    totalHT: parseFloat(invoiceData?.total_ht || 0),
    discountPercent: parseFloat(invoiceData?.discount_percent || 0),
    discountAmount: parseFloat(invoiceData?.discount_amount || 0),
    netHT: parseFloat(invoiceData?.total_ht || 0) - parseFloat(invoiceData?.discount_amount || 0),
    tva10Amount: parseFloat(invoiceData?.vat_10 || 0),
    tva20Amount: parseFloat(invoiceData?.vat_20 || 0),
    totalTTC: parseFloat(invoiceData?.total_ttc || 0),
    depositPercent: 0,
    depositAmount: 0,
    paymentConditions: invoiceData?.payment_terms || companyData?.payment_terms || 'Paiement à réception de facture',
    cgv: '',
    type: typeMap[invoiceData?.invoice_type] || 'Solde',
    quoteRef: invoiceData?.quote_number || '',
    iban: companyData?.iban || '',
    latePaymentPenalty: "En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée, ainsi qu'une indemnité forfaitaire de 40 FCFA pour frais de recouvrement.",
  }
}
