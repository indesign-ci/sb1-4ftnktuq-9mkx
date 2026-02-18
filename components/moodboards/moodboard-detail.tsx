// @ts-nocheck
'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Edit, Download, Palette, Image as ImageIcon, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { MoodboardPDFPreview } from './moodboard-pdf-preview'

interface MoodboardDetailProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  moodboard: any
  onEdit: (moodboard: any) => void
  company: any
}

export function MoodboardDetail({ open, onOpenChange, moodboard, onEdit, company }: MoodboardDetailProps) {
  const [showPDFPreview, setShowPDFPreview] = useState(false)

  if (!moodboard) return null

  const downloadImage = (url: string, index: number) => {
    const link = document.createElement('a')
    link.href = url
    link.download = `${moodboard.name}-${index + 1}.jpg`
    link.target = '_blank'
    link.click()
  }

  const hasImages = moodboard.images?.length > 0
  const hasColors = moodboard.color_palette?.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0">
        <div className="flex flex-col h-full max-h-[95vh]">
          <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
            <div className="flex items-center gap-6">
              {company?.logo_url && (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="h-10 object-contain opacity-80"
                />
              )}
              <div>
                <h2 className="text-3xl font-light text-gray-900 tracking-tight">
                  {moodboard.name}
                </h2>
                {moodboard.description && (
                  <p className="text-gray-500 mt-1 font-light">{moodboard.description}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPDFPreview(true)}
                className="border-[#C5A572] text-[#C5A572] hover:bg-[#C5A572] hover:text-white transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                Aperçu PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onEdit(moodboard)
                  onOpenChange(false)
                }}
                className="border-[#C5A572] text-[#C5A572] hover:bg-[#C5A572] hover:text-white transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <div id="moodboard-content" className="max-w-6xl mx-auto space-y-12 bg-white p-8">
              {hasColors && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Palette className="h-6 w-6 text-[#C5A572]" />
                    <h3 className="text-2xl font-light text-gray-900">Palette de couleurs</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {moodboard.color_palette.map((color: string, index: number) => (
                      <div key={index} className="space-y-3">
                        <div
                          className="aspect-square rounded-2xl border-2 border-gray-200 shadow-lg transition-transform hover:scale-105 hover:shadow-xl"
                          style={{ backgroundColor: color }}
                        />
                        <div className="text-center">
                          <span className="text-sm text-gray-600 font-mono font-light">
                            {color.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasImages && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ImageIcon className="h-6 w-6 text-[#C5A572]" />
                      <h3 className="text-2xl font-light text-gray-900">
                        Inspirations ({moodboard.images.length})
                      </h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {moodboard.images.map((image: string, index: number) => (
                      <div key={index} className="group relative">
                        <div className="aspect-square rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
                          <img
                            src={image}
                            alt={`${moodboard.name} ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => window.open(image, '_blank')}
                            className="bg-white/95 hover:bg-white backdrop-blur-sm"
                          >
                            Aperçu
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => downloadImage(image, index)}
                            className="bg-white/95 hover:bg-white backdrop-blur-sm"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Télécharger
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!hasImages && !hasColors && (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                    <Palette className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-light text-gray-900 mb-2">
                    Moodboard vide
                  </h3>
                  <p className="text-gray-500 mb-8 font-light">
                    Ce moodboard ne contient pas encore d'éléments
                  </p>
                  <Button
                    onClick={() => {
                      onEdit(moodboard)
                      onOpenChange(false)
                    }}
                    className="bg-[#C5A572] hover:bg-[#B39562] text-white"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Ajouter du contenu
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      <MoodboardPDFPreview
        open={showPDFPreview}
        onOpenChange={setShowPDFPreview}
        moodboard={moodboard}
        company={company}
      />
    </Dialog>
  )
}
