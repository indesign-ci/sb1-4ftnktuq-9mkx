// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { FileText, Download } from 'lucide-react'

interface DocumentTemplateFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  template?: any
}

export function DocumentTemplateForm({
  open,
  onOpenChange,
  onSuccess,
  template,
}: DocumentTemplateFormProps) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    if (template) {
      loadTemplateData()
    }
  }, [template])

  const loadTemplateData = async () => {
    if (!template) return

    const variables = template.variables || []
    const initialData: any = {}

    variables.forEach((variable: any) => {
      initialData[variable.name] = ''
    })

    setFormData(initialData)
  }

  const generateDocument = async () => {
    setLoading(true)
    try {
      let content = template.content

      Object.keys(formData).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, 'g')
        content = content.replace(regex, formData[key] || '')
      })

      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile?.company_id)
        .maybeSingle()

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }

              body {
                font-family: 'Inter', sans-serif;
                line-height: 1.8;
                color: #1f2937;
                padding: 60px;
                background: white;
              }

              h1, h2, h3, h4, h5, h6 {
                font-family: 'Cormorant Garamond', serif;
                font-weight: 500;
                color: #111827;
                margin-bottom: 20px;
              }

              h1 {
                font-size: 36px;
                text-align: center;
                margin-bottom: 10px;
                color: #C5A572;
                letter-spacing: 2px;
              }

              h2 {
                font-size: 24px;
                margin-top: 40px;
                border-bottom: 2px solid #C5A572;
                padding-bottom: 10px;
              }

              h3 {
                font-size: 20px;
                margin-top: 25px;
                color: #374151;
              }

              p {
                margin-bottom: 15px;
                text-align: justify;
              }

              .header {
                text-align: center;
                margin-bottom: 60px;
                padding-bottom: 30px;
                border-bottom: 3px double #C5A572;
              }

              .logo {
                max-width: 150px;
                margin-bottom: 30px;
              }

              .parties {
                margin: 40px 0;
                padding: 30px;
                background: #f9fafb;
                border-left: 4px solid #C5A572;
              }

              .article {
                margin: 40px 0;
                page-break-inside: avoid;
              }

              .section {
                margin: 30px 0;
                page-break-inside: avoid;
              }

              ul, ol {
                margin: 15px 0 15px 40px;
              }

              li {
                margin-bottom: 10px;
              }

              strong {
                color: #111827;
                font-weight: 600;
              }

              .signatures {
                display: flex;
                justify-content: space-between;
                margin-top: 80px;
              }

              .signature-block {
                width: 45%;
                text-align: center;
              }

              .footer {
                margin-top: 60px;
                padding-top: 30px;
                border-top: 2px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
              }

              @media print {
                body {
                  padding: 40px;
                }
              }
            </style>
          </head>
          <body>
            ${companyData?.logo_url ? `<div class="header"><img src="${companyData.logo_url}" class="logo" alt="Logo"></div>` : ''}
            ${content}
          </body>
        </html>
      `

      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${template.name}.html`
      link.click()
      URL.revokeObjectURL(url)

      toast.success('Document généré')
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error('Erreur lors de la génération')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (!template) return null

  const variables = template.variables || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-[#C5A572]" />
            <DialogTitle className="text-2xl font-heading">
              Générer : {template.name}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-6">
          <p className="text-sm text-gray-600 font-light">
            Remplissez les champs ci-dessous pour générer votre document personnalisé.
          </p>

          {variables.map((variable: any) => (
            <div key={variable.name} className="space-y-2">
              <Label htmlFor={variable.name} className="text-base font-light">
                {variable.label}
              </Label>
              {variable.type === 'textarea' ? (
                <textarea
                  id={variable.name}
                  value={formData[variable.name] || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, [variable.name]: e.target.value })
                  }
                  className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:border-[#C5A572] focus:outline-none transition-colors"
                />
              ) : (
                <Input
                  id={variable.name}
                  type={variable.type}
                  value={formData[variable.name] || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, [variable.name]: e.target.value })
                  }
                  className="h-12"
                />
              )}
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={generateDocument}
              disabled={loading}
              className="bg-[#C5A572] hover:bg-[#B39562] text-white px-8"
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Génération...' : 'Générer le document'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
