import jsPDF from 'jspdf'

interface InvoiceData {
  invoice_number: string
  date: string
  due_date: string | null
  invoice_type: string
  object: string | null
  status: string
  subtotal: number
  discount_percent: number
  discount_amount: number
  total_ht: number
  vat_10: number
  vat_18: number
  vat_20: number
  total_ttc: number
  amount_paid: number
  amount_due: number
  payment_terms: string | null
  notes: string | null
  clients: {
    first_name: string
    last_name: string
    email: string
    phone: string
    address: string
    city: string
    postal_code: string
  }
  projects?: {
    name: string
  }
  invoice_lines: Array<{
    designation: string
    description: string | null
    quantity: number
    unit: string
    unit_price: number
    vat_rate: number
    discount_percent: number
    total_ht: number
  }>
}

interface CompanyData {
  name: string
  address: string | null
  city: string | null
  postal_code: string | null
  phone: string | null
  email: string | null
  siret: string | null
  vat_number: string | null
  rcs: string | null
  iban: string | null
  logo_url: string | null
}

const typeLabels: Record<string, string> = {
  deposit: "Facture d'acompte",
  intermediate: 'Facture intermédiaire',
  final: 'Facture de solde',
  credit_note: 'Avoir',
}

export async function generateInvoicePDF(invoice: InvoiceData, company: CompanyData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 20
  let y = margin

  const goldenColor = [197, 165, 114] as [number, number, number]
  const textColor = [33, 33, 33] as [number, number, number]
  const grayColor = [128, 128, 128] as [number, number, number]

  doc.setTextColor(...textColor)

  if (company.logo_url) {
    try {
      const logoSize = 30
      doc.addImage(company.logo_url, 'PNG', margin, y, logoSize, logoSize)
    } catch (error) {
      console.error('Error loading logo:', error)
    }
  }

  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...goldenColor)
  doc.text('FACTURE', pageWidth - margin, y, { align: 'right' })

  doc.setFontSize(10)
  doc.setTextColor(...textColor)
  doc.setFont('helvetica', 'normal')
  y += 8
  doc.text(`N° ${invoice.invoice_number}`, pageWidth - margin, y, { align: 'right' })
  y += 5
  doc.text(`Type : ${typeLabels[invoice.invoice_type] || invoice.invoice_type}`, pageWidth - margin, y, { align: 'right' })
  y += 5
  doc.text(`Date d'émission : ${new Date(invoice.date).toLocaleDateString('fr-FR')}`, pageWidth - margin, y, { align: 'right' })

  if (invoice.due_date) {
    y += 5
    doc.text(`Date d'échéance : ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}`, pageWidth - margin, y, { align: 'right' })
  }

  y = margin + 8
  if (company.logo_url) {
    y += 35
  }
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(company.name || 'Entreprise', margin, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  y += 5
  if (company.address) {
    doc.text(company.address, margin, y)
    y += 4
  }
  if (company.postal_code && company.city) {
    doc.text(`${company.postal_code} ${company.city}`, margin, y)
    y += 4
  }
  if (company.phone) {
    doc.text(`Tél : ${company.phone}`, margin, y)
    y += 4
  }
  if (company.email) {
    doc.text(`Email : ${company.email}`, margin, y)
    y += 4
  }
  if (company.siret) {
    doc.text(`SIRET : ${company.siret}`, margin, y)
    y += 4
  }
  if (company.vat_number) {
    doc.text(`N° TVA : ${company.vat_number}`, margin, y)
    y += 4
  }

  const clientX = pageWidth / 2 + 10
  y = margin + 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('CLIENT', clientX, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  y += 5
  doc.text(`${invoice.clients.first_name} ${invoice.clients.last_name}`, clientX, y)
  y += 4
  if (invoice.clients.address) {
    doc.text(invoice.clients.address, clientX, y)
    y += 4
  }
  if (invoice.clients.postal_code && invoice.clients.city) {
    doc.text(`${invoice.clients.postal_code} ${invoice.clients.city}`, clientX, y)
    y += 4
  }

  y = Math.max(y, 80)
  y += 10

  if (invoice.object) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('OBJET :', margin, y)
    doc.setFont('helvetica', 'normal')
    const objectLines = doc.splitTextToSize(invoice.object, pageWidth - 2 * margin)
    y += 5
    doc.text(objectLines, margin, y)
    y += objectLines.length * 5
    y += 5
  }

  if (y > pageHeight - 40) {
    doc.addPage()
    y = margin
    addPageFooter(doc, company)
  }

  doc.setFillColor(...goldenColor)
  doc.rect(margin, y, pageWidth - 2 * margin, 6, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text('PRESTATIONS', margin + 2, y + 4)
  doc.setTextColor(...textColor)
  y += 8

  const headers = ['Désignation', 'Qté', 'Unité', 'PU HT', 'TVA', 'Total HT']
  const colWidths = [70, 15, 15, 25, 15, 25]
  const startX = margin

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  let x = startX
  headers.forEach((header, i) => {
    const align = i > 0 ? 'right' : 'left'
    if (align === 'right') {
      doc.text(header, x + colWidths[i] - 2, y, { align: 'right' })
    } else {
      doc.text(header, x + 2, y)
    }
    x += colWidths[i]
  })
  y += 5

  doc.setDrawColor(...grayColor)
  doc.setLineWidth(0.1)
  doc.line(startX, y, startX + colWidths.reduce((a, b) => a + b, 0), y)
  y += 3

  let alternate = false
  doc.setFont('helvetica', 'normal')

  for (const line of invoice.invoice_lines || []) {
    if (y > pageHeight - 30) {
      doc.addPage()
      y = margin
      addPageFooter(doc, company)
    }

    const lineHeight = 8
    if (alternate) {
      doc.setFillColor(245, 245, 245)
      doc.rect(startX, y - 2, colWidths.reduce((a, b) => a + b, 0), lineHeight, 'F')
    }
    alternate = !alternate

    x = startX

    const designationLines = doc.splitTextToSize(line.designation, colWidths[0] - 4)
    doc.text(designationLines[0], x + 2, y + 3)

    x += colWidths[0]
    doc.text(line.quantity.toFixed(2), x + colWidths[1] - 2, y + 3, { align: 'right' })

    x += colWidths[1]
    doc.text(line.unit, x + colWidths[2] - 2, y + 3, { align: 'right' })

    x += colWidths[2]
    doc.text(`${line.unit_price.toFixed(2)} FCFA`, x + colWidths[3] - 2, y + 3, { align: 'right' })

    x += colWidths[3]
    doc.text(`${line.vat_rate}%`, x + colWidths[4] - 2, y + 3, { align: 'right' })

    x += colWidths[4]
    doc.text(`${line.total_ht.toFixed(2)} FCFA`, x + colWidths[5] - 2, y + 3, { align: 'right' })

    y += lineHeight

    if (line.description && designationLines.length === 1) {
      doc.setFontSize(7)
      doc.setTextColor(...grayColor)
      const descLines = doc.splitTextToSize(line.description, colWidths[0] - 4)
      doc.text(descLines.slice(0, 2), startX + 2, y)
      y += Math.min(descLines.length, 2) * 3
      doc.setFontSize(8)
      doc.setTextColor(...textColor)
    }
  }

  y += 5

  if (y > pageHeight - 80) {
    doc.addPage()
    y = margin
    addPageFooter(doc, company)
  }

  y += 5
  const summaryX = pageWidth - margin - 60

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Total HT :', summaryX, y)
  doc.text(`${invoice.total_ht.toFixed(2)} FCFA`, pageWidth - margin, y, { align: 'right' })
  y += 5

  if (invoice.discount_percent > 0) {
    doc.setTextColor(220, 38, 38)
    doc.text(`Remise (${invoice.discount_percent.toFixed(1)}%) :`, summaryX, y)
    doc.text(`-${invoice.discount_amount.toFixed(2)} FCFA`, pageWidth - margin, y, { align: 'right' })
    doc.setTextColor(...textColor)
    y += 5

    doc.setFont('helvetica', 'bold')
    doc.text('Net HT :', summaryX, y)
    doc.text(`${(invoice.total_ht - invoice.discount_amount).toFixed(2)} FCFA`, pageWidth - margin, y, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    y += 5
  }

  if (invoice.vat_10 > 0) {
    doc.text('TVA 10% :', summaryX, y)
    doc.text(`${invoice.vat_10.toFixed(2)} FCFA`, pageWidth - margin, y, { align: 'right' })
    y += 5
  }

  if (invoice.vat_18 > 0) {
    doc.text('TVA 18% :', summaryX, y)
    doc.text(`${invoice.vat_18.toFixed(2)} FCFA`, pageWidth - margin, y, { align: 'right' })
    y += 5
  }

  if (invoice.vat_20 > 0) {
    doc.text('TVA 20% :', summaryX, y)
    doc.text(`${invoice.vat_20.toFixed(2)} FCFA`, pageWidth - margin, y, { align: 'right' })
    y += 5
  }

  doc.setDrawColor(...goldenColor)
  doc.setLineWidth(0.5)
  doc.line(summaryX, y, pageWidth - margin, y)
  y += 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...goldenColor)
  doc.text('TOTAL TTC :', summaryX, y)
  doc.text(`${invoice.total_ttc.toFixed(2)} FCFA`, pageWidth - margin, y, { align: 'right' })
  doc.setTextColor(...textColor)
  y += 10

  if (company.iban) {
    if (y > pageHeight - 50) {
      doc.addPage()
      y = margin
      addPageFooter(doc, company)
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('COORDONNÉES BANCAIRES', margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`IBAN : ${company.iban}`, margin, y)
    y += 8
  }

  if (invoice.payment_terms) {
    if (y > pageHeight - 50) {
      doc.addPage()
      y = margin
      addPageFooter(doc, company)
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('CONDITIONS DE PAIEMENT', margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const termLines = doc.splitTextToSize(invoice.payment_terms, pageWidth - 2 * margin)
    doc.text(termLines, margin, y)
    y += termLines.length * 4 + 5
  }

  if (y > pageHeight - 50) {
    doc.addPage()
    y = margin
    addPageFooter(doc, company)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('MENTIONS LÉGALES', margin, y)
  y += 4
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  const legalText = "En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée, ainsi qu'une indemnité forfaitaire de 40 FCFA pour frais de recouvrement."
  const legalLines = doc.splitTextToSize(legalText, pageWidth - 2 * margin)
  doc.text(legalLines, margin, y)
  y += legalLines.length * 3

  addPageFooter(doc, company)

  return doc
}

function addPageFooter(doc: jsPDF, company: CompanyData) {
  const pageHeight = doc.internal.pageSize.height
  const pageWidth = doc.internal.pageSize.width
  const margin = 20

  doc.setDrawColor(197, 165, 114)
  doc.setLineWidth(0.3)
  doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)

  doc.setFontSize(7)
  doc.setTextColor(128, 128, 128)
  doc.setFont('helvetica', 'normal')

  let footerText = company.name || ''
  if (company.siret) footerText += ` - SIRET: ${company.siret}`
  if (company.vat_number) footerText += ` - TVA: ${company.vat_number}`
  if (company.rcs) footerText += ` - RCS: ${company.rcs}`

  doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' })

  const pageNumber = doc.getCurrentPageInfo().pageNumber
  doc.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 10, { align: 'right' })
}
