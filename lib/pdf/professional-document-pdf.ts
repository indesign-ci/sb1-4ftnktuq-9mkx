import jsPDF from 'jspdf'
import { formatCurrency } from '@/lib/currency'

type CompanyInfo = {
  name: string
  address?: string
  phone?: string
  email?: string
  logo_url?: string
}

type ClientInfo = {
  name: string
  address?: string
  phone?: string
  email?: string
}

type DocumentData = {
  documentNumber: string
  documentTitle: string
  documentDate: Date
  company: CompanyInfo
  client?: ClientInfo
  projectName?: string
  sections: DocumentSection[]
}

type DocumentSection = {
  title: string
  content: string | { label: string; value: string }[]
}

const COLORS = {
  primary: '#C5A572',
  dark: '#1A1A1A',
  light: '#F5F5F5',
  white: '#FFFFFF',
  gray: '#666666',
}

export async function generateProfessionalDocumentPDF(data: DocumentData): Promise<void> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - 2 * margin
  let yPosition = margin

  doc.setFont('helvetica')

  const addWatermark = () => {
    doc.saveGraphicsState()
    doc.setGState(new doc.GState({ opacity: 0.08 }))

    if (data.company?.logo_url) {
      try {
        const logoSize = 80
        const logoX = (pageWidth - logoSize) / 2
        const logoY = (pageHeight - logoSize) / 2
        doc.addImage(data.company.logo_url, 'PNG', logoX, logoY, logoSize, logoSize)
      } catch (e) {
        console.warn('Could not add logo watermark')
      }
    } else if (data.company?.name) {
      const initials = data.company.name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 3)

      doc.setFontSize(120)
      doc.setTextColor(150, 150, 150)
      doc.setFont('helvetica', 'bold')
      const textWidth = doc.getTextWidth(initials)
      doc.text(initials, (pageWidth - textWidth) / 2, pageHeight / 2, { angle: 45 })
    }

    doc.restoreGraphicsState()
  }

  const addGoldenLine = (y: number) => {
    doc.setDrawColor(197, 165, 114)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
  }

  addWatermark()

  if (data.company?.logo_url) {
    try {
      const logoHeight = 15
      doc.addImage(data.company.logo_url, 'PNG', margin, yPosition, logoHeight * 2, logoHeight)
      yPosition += 2
    } catch (e) {
      doc.setFillColor(197, 165, 114)
      doc.rect(margin, yPosition, 15, 15, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      const initials = data.company.name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 3)
      const textWidth = doc.getTextWidth(initials)
      doc.text(initials, margin + (15 - textWidth) / 2, yPosition + 10)
      yPosition += 2
    }
  } else {
    doc.setFillColor(197, 165, 114)
    doc.rect(margin, yPosition, 15, 15, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    const initials = data.company.name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 3)
    const textWidth = doc.getTextWidth(initials)
    doc.text(initials, margin + (15 - textWidth) / 2, yPosition + 10)
    yPosition += 2
  }

  doc.setTextColor(26, 26, 26)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(data.company.name, margin + 30, yPosition + 8)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  if (data.company.address) {
    doc.text(data.company.address, margin + 30, yPosition + 14)
  }
  if (data.company.phone || data.company.email) {
    const contactText = [data.company.phone, data.company.email].filter(Boolean).join(' • ')
    doc.text(contactText, margin + 30, yPosition + 19)
  }

  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text('N° Document', pageWidth - margin, yPosition + 5, { align: 'right' })
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(197, 165, 114)
  doc.text(data.documentNumber, pageWidth - margin, yPosition + 12, { align: 'right' })
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  const dateStr = data.documentDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  doc.text(dateStr, pageWidth - margin, yPosition + 18, { align: 'right' })

  yPosition += 30
  addGoldenLine(yPosition)
  yPosition += 10

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(26, 26, 26)
  doc.text(data.documentTitle, margin, yPosition)
  yPosition += 5

  if (data.projectName) {
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.text(`PROJET: ${data.projectName.toUpperCase()}`, margin, yPosition)
    yPosition += 5
  }
  yPosition += 5

  if (data.client) {
    doc.setFillColor(245, 245, 245)
    doc.rect(margin, yPosition, contentWidth, 25, 'F')

    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'bold')
    doc.text('INFORMATIONS CLIENT', margin + 5, yPosition + 6)

    doc.setFontSize(10)
    doc.setTextColor(26, 26, 26)
    doc.setFont('helvetica', 'bold')
    doc.text(data.client.name, margin + 5, yPosition + 12)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    if (data.client.address) {
      doc.text(data.client.address, margin + 5, yPosition + 17)
    }

    if (data.client.phone || data.client.email) {
      const contactInfo = [data.client.phone, data.client.email].filter(Boolean)
      contactInfo.forEach((info, index) => {
        doc.text(info, margin + 5, yPosition + 21 + index * 4)
      })
    }

    yPosition += 30
  }

  data.sections.forEach((section) => {
    if (yPosition > pageHeight - 40) {
      doc.addPage()
      addWatermark()
      yPosition = margin
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(197, 165, 114)
    doc.text(section.title, margin, yPosition)
    yPosition += 7

    if (typeof section.content === 'string') {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(50, 50, 50)
      const lines = doc.splitTextToSize(section.content, contentWidth)
      doc.text(lines, margin, yPosition)
      yPosition += lines.length * 5 + 8
    } else {
      section.content.forEach((item) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage()
          addWatermark()
          yPosition = margin
        }

        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(70, 70, 70)
        doc.text(item.label, margin, yPosition)

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        const valueLines = doc.splitTextToSize(item.value, contentWidth - 40)
        doc.text(valueLines, margin + 40, yPosition)

        yPosition += Math.max(valueLines.length * 5, 6)
      })
      yPosition += 5
    }
  })

  if (yPosition > pageHeight - 30) {
    doc.addPage()
    addWatermark()
    yPosition = margin
  } else {
    yPosition = pageHeight - 25
  }

  addGoldenLine(yPosition)
  yPosition += 5

  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  doc.text(data.company.name, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 4
  if (data.company.address) {
    doc.text(data.company.address, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 4
  }
  if (data.company.phone || data.company.email) {
    const footerContact = [data.company.phone, data.company.email].filter(Boolean).join(' • ')
    doc.text(footerContact, pageWidth / 2, yPosition, { align: 'center' })
  }

  const fileName = `${data.documentNumber}_${data.documentTitle.replace(/\s+/g, '_')}.pdf`
  doc.save(fileName)
}

export async function generateProfessionalDocumentPDFBlob(data: DocumentData): Promise<Blob> {
  const doc = await generateProfessionalDocumentPDFInstance(data)
  return doc.output('blob')
}

export async function generateProfessionalDocumentPDFDataURL(data: DocumentData): Promise<string> {
  const doc = await generateProfessionalDocumentPDFInstance(data)
  return doc.output('dataurlstring')
}

async function generateProfessionalDocumentPDFInstance(data: DocumentData): Promise<jsPDF> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - 2 * margin
  let yPosition = margin

  doc.setFont('helvetica')

  const addWatermark = () => {
    doc.saveGraphicsState()
    doc.setGState(new doc.GState({ opacity: 0.08 }))

    if (data.company?.logo_url) {
      try {
        const logoSize = 80
        const logoX = (pageWidth - logoSize) / 2
        const logoY = (pageHeight - logoSize) / 2
        doc.addImage(data.company.logo_url, 'PNG', logoX, logoY, logoSize, logoSize)
      } catch (e) {
        console.warn('Could not add logo watermark')
      }
    } else if (data.company?.name) {
      const initials = data.company.name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 3)

      doc.setFontSize(120)
      doc.setTextColor(150, 150, 150)
      doc.setFont('helvetica', 'bold')
      const textWidth = doc.getTextWidth(initials)
      doc.text(initials, (pageWidth - textWidth) / 2, pageHeight / 2, { angle: 45 })
    }

    doc.restoreGraphicsState()
  }

  const addGoldenLine = (y: number) => {
    doc.setDrawColor(197, 165, 114)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
  }

  addWatermark()

  if (data.company?.logo_url) {
    try {
      const logoHeight = 15
      doc.addImage(data.company.logo_url, 'PNG', margin, yPosition, logoHeight * 2, logoHeight)
      yPosition += 2
    } catch (e) {
      doc.setFillColor(197, 165, 114)
      doc.rect(margin, yPosition, 15, 15, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      const initials = data.company.name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 3)
      const textWidth = doc.getTextWidth(initials)
      doc.text(initials, margin + (15 - textWidth) / 2, yPosition + 10)
      yPosition += 2
    }
  } else {
    doc.setFillColor(197, 165, 114)
    doc.rect(margin, yPosition, 15, 15, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    const initials = data.company.name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 3)
    const textWidth = doc.getTextWidth(initials)
    doc.text(initials, margin + (15 - textWidth) / 2, yPosition + 10)
    yPosition += 2
  }

  doc.setTextColor(26, 26, 26)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(data.company.name, margin + 30, yPosition + 8)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  if (data.company.address) {
    doc.text(data.company.address, margin + 30, yPosition + 14)
  }
  if (data.company.phone || data.company.email) {
    const contactText = [data.company.phone, data.company.email].filter(Boolean).join(' • ')
    doc.text(contactText, margin + 30, yPosition + 19)
  }

  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text('N° Document', pageWidth - margin, yPosition + 5, { align: 'right' })
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(197, 165, 114)
  doc.text(data.documentNumber, pageWidth - margin, yPosition + 12, { align: 'right' })
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  const dateStr = data.documentDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  doc.text(dateStr, pageWidth - margin, yPosition + 18, { align: 'right' })

  yPosition += 30
  addGoldenLine(yPosition)
  yPosition += 10

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(26, 26, 26)
  doc.text(data.documentTitle, margin, yPosition)
  yPosition += 5

  if (data.projectName) {
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.text(`PROJET: ${data.projectName.toUpperCase()}`, margin, yPosition)
    yPosition += 5
  }
  yPosition += 5

  if (data.client) {
    doc.setFillColor(245, 245, 245)
    doc.rect(margin, yPosition, contentWidth, 25, 'F')

    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'bold')
    doc.text('INFORMATIONS CLIENT', margin + 5, yPosition + 6)

    doc.setFontSize(10)
    doc.setTextColor(26, 26, 26)
    doc.setFont('helvetica', 'bold')
    doc.text(data.client.name, margin + 5, yPosition + 12)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    if (data.client.address) {
      doc.text(data.client.address, margin + 5, yPosition + 17)
    }

    if (data.client.phone || data.client.email) {
      const contactInfo = [data.client.phone, data.client.email].filter(Boolean)
      contactInfo.forEach((info, index) => {
        doc.text(info, margin + 5, yPosition + 21 + index * 4)
      })
    }

    yPosition += 30
  }

  data.sections.forEach((section) => {
    if (yPosition > pageHeight - 40) {
      doc.addPage()
      addWatermark()
      yPosition = margin
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(197, 165, 114)
    doc.text(section.title, margin, yPosition)
    yPosition += 7

    if (typeof section.content === 'string') {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(50, 50, 50)
      const lines = doc.splitTextToSize(section.content, contentWidth)
      doc.text(lines, margin, yPosition)
      yPosition += lines.length * 5 + 8
    } else {
      section.content.forEach((item) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage()
          addWatermark()
          yPosition = margin
        }

        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(70, 70, 70)
        doc.text(item.label, margin, yPosition)

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        const valueLines = doc.splitTextToSize(item.value, contentWidth - 40)
        doc.text(valueLines, margin + 40, yPosition)

        yPosition += Math.max(valueLines.length * 5, 6)
      })
      yPosition += 5
    }
  })

  if (yPosition > pageHeight - 30) {
    doc.addPage()
    addWatermark()
    yPosition = margin
  } else {
    yPosition = pageHeight - 25
  }

  addGoldenLine(yPosition)
  yPosition += 5

  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  doc.text(data.company.name, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 4
  if (data.company.address) {
    doc.text(data.company.address, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 4
  }
  if (data.company.phone || data.company.email) {
    const footerContact = [data.company.phone, data.company.email].filter(Boolean).join(' • ')
    doc.text(footerContact, pageWidth / 2, yPosition, { align: 'center' })
  }

  return doc
}
