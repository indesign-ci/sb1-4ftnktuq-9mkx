import { jsPDF } from 'jspdf'

interface MoodboardPDFOptions {
  moodboard: {
    name: string
    description?: string
    images?: string[]
    color_palette?: string[]
    project?: { name: string }
    client?: { first_name: string; last_name: string }
  }
  company: {
    name?: string
    logo_url?: string
    address?: string
    phone?: string
    email?: string
  }
}

const COLORS = {
  primary: '#C5A572',
  dark: '#2C2C2C',
  light: '#F5F5F5',
  white: '#FFFFFF',
  gray: '#666666',
}

export async function generateMoodboardPDF({ moodboard, company }: MoodboardPDFOptions) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - 2 * margin
  let yPosition = margin

  const addWatermark = () => {
    pdf.saveGraphicsState()
    pdf.setGState(new pdf.GState({ opacity: 0.08 }))

    if (company?.logo_url) {
      try {
        const logoSize = 80
        const logoX = (pageWidth - logoSize) / 2
        const logoY = (pageHeight - logoSize) / 2
        pdf.addImage(company.logo_url, 'PNG', logoX, logoY, logoSize, logoSize)
      } catch (e) {
        console.warn('Could not add logo watermark')
      }
    } else if (company?.name) {
      const initials = company.name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 3)

      pdf.setFontSize(120)
      pdf.setTextColor(150, 150, 150)
      pdf.setFont('helvetica', 'bold')
      const textWidth = pdf.getTextWidth(initials)
      pdf.text(initials, (pageWidth - textWidth) / 2, pageHeight / 2, { angle: 45 })
    }

    pdf.restoreGraphicsState()
  }

  const addHeader = () => {
    if (company?.logo_url) {
      try {
        const logoHeight = 12
        pdf.addImage(company.logo_url, 'PNG', margin, yPosition, logoHeight * 2, logoHeight)
      } catch (e) {
        if (company?.name) {
          const initials = company.name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 3)

          pdf.setFillColor(197, 165, 114)
          pdf.rect(margin, yPosition, 15, 15, 'F')

          pdf.setFontSize(10)
          pdf.setTextColor(255, 255, 255)
          pdf.setFont('helvetica', 'bold')
          const textWidth = pdf.getTextWidth(initials)
          pdf.text(initials, margin + (15 - textWidth) / 2, yPosition + 10)
        }
      }
    } else if (company?.name) {
      const initials = company.name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 3)

      pdf.setFillColor(197, 165, 114)
      pdf.rect(margin, yPosition, 15, 15, 'F')

      pdf.setFontSize(10)
      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      const textWidth = pdf.getTextWidth(initials)
      pdf.text(initials, margin + (15 - textWidth) / 2, yPosition + 10)
    }

    pdf.setDrawColor(197, 165, 114)
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition + 18, pageWidth - margin, yPosition + 18)

    yPosition += 25
  }

  const addFooter = () => {
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.setFont('helvetica', 'normal')

    const footerY = pageHeight - 15

    pdf.setDrawColor(197, 165, 114)
    pdf.setLineWidth(0.5)
    pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5)

    const footerParts = []
    if (company?.name) footerParts.push(company.name)
    if (company?.phone) footerParts.push(company.phone)
    if (company?.email) footerParts.push(company.email)

    if (footerParts.length > 0) {
      const footerText = footerParts.join('  •  ')
      const textWidth = pdf.getTextWidth(footerText)
      pdf.text(footerText, (pageWidth - textWidth) / 2, footerY)
    }

    const pageNum = `Page ${pdf.getCurrentPageInfo().pageNumber}`
    pdf.text(pageNum, pageWidth - margin - pdf.getTextWidth(pageNum), footerY)
  }

  addWatermark()
  addHeader()

  pdf.setFontSize(24)
  pdf.setTextColor(44, 44, 44)
  pdf.setFont('helvetica', 'bold')
  pdf.text(moodboard.name, margin, yPosition)
  yPosition += 8

  if (moodboard.description) {
    pdf.setFontSize(10)
    pdf.setTextColor(102, 102, 102)
    pdf.setFont('helvetica', 'normal')
    const descLines = pdf.splitTextToSize(moodboard.description, contentWidth)
    pdf.text(descLines, margin, yPosition)
    yPosition += descLines.length * 5
  }

  yPosition += 5

  if (moodboard.project?.name || (moodboard.client?.first_name && moodboard.client?.last_name)) {
    pdf.setFillColor(245, 245, 245)
    pdf.rect(margin, yPosition, contentWidth, 15, 'F')

    pdf.setFontSize(9)
    pdf.setTextColor(102, 102, 102)
    pdf.setFont('helvetica', 'normal')
    let infoY = yPosition + 6

    if (moodboard.project?.name) {
      pdf.text(`Projet: ${moodboard.project.name}`, margin + 5, infoY)
      infoY += 5
    }

    if (moodboard.client?.first_name && moodboard.client?.last_name) {
      pdf.text(
        `Client: ${moodboard.client.first_name} ${moodboard.client.last_name}`,
        margin + 5,
        infoY
      )
    }

    yPosition += 20
  }

  if (moodboard.color_palette && moodboard.color_palette.length > 0) {
    if (yPosition > pageHeight - 80) {
      pdf.addPage()
      addWatermark()
      addHeader()
      yPosition = margin + 25
    }

    pdf.setFontSize(14)
    pdf.setTextColor(197, 165, 114)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Palette de couleurs', margin, yPosition)
    yPosition += 10

    const colors = moodboard.color_palette
    const colorBoxSize = 25
    const colorSpacing = 5
    const colorsPerRow = Math.floor(contentWidth / (colorBoxSize + colorSpacing))

    for (let i = 0; i < colors.length; i++) {
      const col = i % colorsPerRow
      const row = Math.floor(i / colorsPerRow)

      const x = margin + col * (colorBoxSize + colorSpacing)
      const y = yPosition + row * (colorBoxSize + 12)

      if (y > pageHeight - 80) {
        pdf.addPage()
        addWatermark()
        addHeader()
        yPosition = margin + 25

        const newY = yPosition + Math.floor(i / colorsPerRow) * (colorBoxSize + 12)
        if (newY > pageHeight - 80) continue
      }

      const color = colors[i]
      const rgb = hexToRgb(color)
      if (rgb) {
        pdf.setFillColor(rgb.r, rgb.g, rgb.b)
        pdf.rect(x, y, colorBoxSize, colorBoxSize, 'F')

        pdf.setDrawColor(200, 200, 200)
        pdf.setLineWidth(0.3)
        pdf.rect(x, y, colorBoxSize, colorBoxSize, 'S')

        pdf.setFontSize(7)
        pdf.setTextColor(100, 100, 100)
        pdf.setFont('courier', 'normal')
        const colorText = color.toUpperCase()
        const textWidth = pdf.getTextWidth(colorText)
        pdf.text(colorText, x + (colorBoxSize - textWidth) / 2, y + colorBoxSize + 8)
      }
    }

    yPosition += Math.ceil(colors.length / colorsPerRow) * (colorBoxSize + 12) + 10
  }

  if (moodboard.images && moodboard.images.length > 0) {
    if (yPosition > pageHeight - 80) {
      pdf.addPage()
      addWatermark()
      addHeader()
      yPosition = margin + 25
    }

    pdf.setFontSize(14)
    pdf.setTextColor(197, 165, 114)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`Inspirations (${moodboard.images.length})`, margin, yPosition)
    yPosition += 10

    const images = moodboard.images
    const imageSize = (contentWidth - 10) / 3
    const imageSpacing = 5

    for (let i = 0; i < images.length; i++) {
      const col = i % 3
      const row = Math.floor(i / 3)

      const x = margin + col * (imageSize + imageSpacing)
      const y = yPosition + row * (imageSize + imageSpacing)

      if (y + imageSize > pageHeight - 30) {
        pdf.addPage()
        addWatermark()
        addHeader()
        yPosition = margin + 25

        const newRow = Math.floor(i / 3)
        const newY = yPosition + newRow * (imageSize + imageSpacing)
        if (newY + imageSize > pageHeight - 30) continue
      }

      try {
        await new Promise<void>((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            try {
              pdf.addImage(img, 'JPEG', x, y, imageSize, imageSize)
              resolve()
            } catch (e) {
              console.warn('Could not add image to PDF:', e)
              pdf.setFillColor(240, 240, 240)
              pdf.rect(x, y, imageSize, imageSize, 'F')

              pdf.setDrawColor(200, 200, 200)
              pdf.setLineWidth(0.3)
              pdf.rect(x, y, imageSize, imageSize, 'S')

              resolve()
            }
          }
          img.onerror = () => {
            pdf.setFillColor(240, 240, 240)
            pdf.rect(x, y, imageSize, imageSize, 'F')

            pdf.setDrawColor(200, 200, 200)
            pdf.setLineWidth(0.3)
            pdf.rect(x, y, imageSize, imageSize, 'S')

            resolve()
          }
          img.src = images[i]
        })
      } catch (e) {
        pdf.setFillColor(240, 240, 240)
        pdf.rect(x, y, imageSize, imageSize, 'F')

        pdf.setDrawColor(200, 200, 200)
        pdf.setLineWidth(0.3)
        pdf.rect(x, y, imageSize, imageSize, 'S')
      }
    }

    yPosition += Math.ceil(images.length / 3) * (imageSize + imageSpacing) + 10
  }

  addFooter()

  const fileName = `Moodboard_${moodboard.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
  pdf.save(fileName)

  return pdf
}

export async function generateMoodboardPDFBlob({ moodboard, company }: MoodboardPDFOptions): Promise<Blob> {
  const pdf = await generateMoodboardPDF({ moodboard, company })
  return pdf.output('blob')
}

export async function generateMoodboardPDFDataURL({ moodboard, company }: MoodboardPDFOptions): Promise<string> {
  const pdf = await generateMoodboardPDF({ moodboard, company })
  return pdf.output('dataurlstring')
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}
