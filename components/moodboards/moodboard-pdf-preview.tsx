'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Loader2, X, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { generateMoodboardPDF, generateMoodboardPDFBlob } from '@/lib/pdf/moodboard-pdf'

interface MoodboardPDFPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  moodboard: any
  company: any
}

export function MoodboardPDFPreview({
  open,
  onOpenChange,
  moodboard,
  company,
}: MoodboardPDFPreviewProps) {
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    if (open && !pdfUrl) {
      generatePreview()
    }

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [open])

  const generatePreview = async () => {
    setLoading(true)
    try {
      toast.info('Génération de l\'aperçu...')

      const blob = await generateMoodboardPDFBlob({ moodboard, company })
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)

      toast.success('Aperçu généré')
    } catch (error) {
      console.error('Error generating preview:', error)
      toast.error('Erreur lors de la génération de l\'aperçu')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      toast.info('Téléchargement du PDF...')
      await generateMoodboardPDF({ moodboard, company })
      toast.success('PDF téléchargé avec succès')
      onOpenChange(false)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Erreur lors du téléchargement')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1200px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-[#C5A572]" />
              <DialogTitle className="text-xl font-light">
                Aperçu PDF - {moodboard.name}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              {pdfUrl && (
                <Button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="bg-[#C5A572] hover:bg-[#B39562] text-white"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Téléchargement...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger le PDF
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-gray-100 p-4">
          {loading && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-[#C5A572] mx-auto" />
                <p className="text-gray-600 font-light">
                  Génération de l'aperçu en cours...
                </p>
                <p className="text-sm text-gray-500">
                  Préparation du moodboard professionnel avec filigrane
                </p>
              </div>
            </div>
          )}

          {!loading && pdfUrl && (
            <div className="h-full rounded-lg overflow-hidden shadow-2xl bg-white">
              <iframe
                src={pdfUrl}
                className="w-full h-full"
                title="PDF Preview"
              />
            </div>
          )}

          {!loading && !pdfUrl && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-gray-600">
                  Impossible de générer l'aperçu
                </p>
                <Button
                  onClick={generatePreview}
                  variant="outline"
                  className="border-[#C5A572] text-[#C5A572] hover:bg-[#C5A572] hover:text-white"
                >
                  Réessayer
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-6">
              {moodboard.color_palette?.length > 0 && (
                <span>{moodboard.color_palette.length} couleurs</span>
              )}
              {moodboard.images?.length > 0 && (
                <span>{moodboard.images.length} images d'inspiration</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-[#C5A572]" />
              <span>Logo en filigrane inclus</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
