'use client'

import { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Save, Send, Eye, Download, Mail } from 'lucide-react'

type BaseDocumentLayoutProps = {
  title: string
  formContent: ReactNode
  previewContent: ReactNode
  onSave: () => void
  onFinalize?: () => void
  onPreviewPDF?: () => void
  onDownloadPDF?: () => void | Promise<void>
  onSendEmail?: () => void | Promise<void>
  isSaving?: boolean
}

export function BaseDocumentLayout({
  title,
  formContent,
  previewContent,
  onSave,
  onFinalize,
  onPreviewPDF,
  onDownloadPDF,
  onSendEmail,
  isSaving = false,
}: BaseDocumentLayoutProps) {
  const hasPdfTab = onDownloadPDF != null
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onPreviewPDF && (
            <Button
              variant="outline"
              onClick={onPreviewPDF}
              className="border-[#C5A572] text-[#C5A572] hover:bg-[#C5A572] hover:text-white"
            >
              <Eye className="mr-2 h-4 w-4" />
              Aperçu PDF
            </Button>
          )}
          {onDownloadPDF && (
            <Button
              variant="outline"
              onClick={onDownloadPDF}
              className="border-[#C5A572] text-[#C5A572] hover:bg-[#C5A572] hover:text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Télécharger PDF
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onSave}
            disabled={isSaving}
            className="border-[#C5A572] text-[#C5A572] hover:bg-[#C5A572] hover:text-white"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Enregistrement...' : 'Sauvegarder brouillon'}
          </Button>
          {onSendEmail && (
            <Button
              variant="outline"
              onClick={onSendEmail}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <Mail className="mr-2 h-4 w-4" />
              Envoyer par email
            </Button>
          )}
          {onFinalize && (
            <Button
              variant="outline"
              onClick={onFinalize}
              className="border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white"
            >
              <Send className="mr-2 h-4 w-4" />
              Finaliser
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="form" className="w-full">
        <TabsList className={hasPdfTab ? 'grid w-full grid-cols-3 bg-[#F5F5F5]' : 'grid w-full grid-cols-2 bg-[#F5F5F5]'}>
          <TabsTrigger value="form" className="data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A]">
            📝 Formulaire
          </TabsTrigger>
          <TabsTrigger value="preview" className="data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A]">
            👁️ Aperçu
          </TabsTrigger>
          {hasPdfTab && (
            <TabsTrigger value="pdf" className="data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A]">
              📄 Télécharger PDF
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="form" className="mt-6">
          {formContent}
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <div className="bg-white rounded-lg border border-[#C5A572]/30 p-8 min-h-[800px] shadow-sm">
            {previewContent}
          </div>
        </TabsContent>

        {hasPdfTab && (
          <TabsContent value="pdf" className="mt-6">
            <Card className="border-[#C5A572]/30 bg-[#F5F5F5]">
              <CardContent className="pt-6">
                <p className="text-[#1A1A1A] mb-4">
                  Générez un PDF professionnel avec le logo de l&apos;entreprise, la numérotation et la mise en forme luxueuse (fond blanc, accents dorés).
                </p>
                <Button
                  onClick={onDownloadPDF}
                  className="bg-[#C5A572] hover:bg-[#B08D5B] text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Générer et télécharger le PDF
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
