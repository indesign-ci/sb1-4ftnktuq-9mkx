// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DocumentTemplateForm } from '@/components/documents/document-template-form'
import {
  FileText,
  Search,
  FileCheck,
  ClipboardList,
  FileSignature,
  Calendar,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'

const categoryIcons: any = {
  legal: FileCheck,
  technical: ClipboardList,
  commercial: FileSignature,
  planning: Calendar,
  general: FileText,
}

const categoryColors: any = {
  legal: 'bg-red-100 text-red-700 border-red-200',
  technical: 'bg-blue-100 text-blue-700 border-blue-200',
  commercial: 'bg-green-100 text-green-700 border-green-200',
  planning: 'bg-purple-100 text-purple-700 border-purple-200',
  general: 'bg-gray-100 text-gray-700 border-gray-200',
}

const categoryLabels: any = {
  legal: 'Juridique',
  technical: 'Technique',
  commercial: 'Commercial',
  planning: 'Planning',
  general: 'Général',
}

export default function TemplatesPage() {
  const { profile } = useAuth()
  const [templates, setTemplates] = useState<any[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)

  useEffect(() => {
    loadTemplates()
  }, [profile?.company_id])

  useEffect(() => {
    filterTemplates()
  }, [searchTerm, templates])

  const loadTemplates = async () => {
    if (!profile?.company_id) return

    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setTemplates(data || [])
      setFilteredTemplates(data || [])
    } catch (error: any) {
      toast.error('Erreur lors du chargement des templates')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filterTemplates = () => {
    if (!searchTerm) {
      setFilteredTemplates(templates)
      return
    }

    const filtered = templates.filter(
      (template) =>
        template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        categoryLabels[template.category]?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredTemplates(filtered)
  }

  const handleGenerate = (template: any) => {
    setSelectedTemplate(template)
    setFormOpen(true)
  }

  const groupedTemplates = filteredTemplates.reduce((acc: any, template) => {
    const category = template.category || 'general'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(template)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-heading text-gray-900 tracking-tight mb-2">
          Modèles de documents
        </h1>
        <p className="text-gray-500 font-light">
          Templates professionnels pour architectes d'intérieur
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Rechercher un template..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 bg-white border-gray-200 focus:border-[#C5A572] transition-colors"
          />
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
            <FileText className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-heading text-gray-900 mb-2">
            {searchTerm ? 'Aucun template trouvé' : 'Aucun template disponible'}
          </h3>
          <p className="text-gray-500 font-light">
            {searchTerm
              ? 'Essayez avec un autre terme de recherche'
              : 'Les templates par défaut sont en cours de chargement'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedTemplates)
            .sort()
            .map((category) => {
              const Icon = categoryIcons[category] || FileText
              return (
                <div key={category} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6 text-[#C5A572]" />
                    <h2 className="text-2xl font-heading text-gray-900">
                      {categoryLabels[category] || category}
                    </h2>
                    <Badge
                      variant="outline"
                      className={`${categoryColors[category]} border`}
                    >
                      {groupedTemplates[category].length}{' '}
                      {groupedTemplates[category].length > 1 ? 'templates' : 'template'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedTemplates[category].map((template: any) => (
                      <Card
                        key={template.id}
                        className="group hover:shadow-xl transition-all duration-300 border-gray-200 overflow-hidden"
                      >
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <CardTitle className="text-lg font-heading text-gray-900">
                                {template.name}
                              </CardTitle>
                              <CardDescription className="font-light">
                                {template.type}
                              </CardDescription>
                            </div>
                            {template.is_default && (
                              <Badge
                                variant="outline"
                                className="bg-[#C5A572]/10 text-[#C5A572] border-[#C5A572]/20"
                              >
                                Par défaut
                              </Badge>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <div className="text-sm text-gray-600 font-light">
                            {template.variables?.length || 0} champs à remplir
                          </div>

                          <Button
                            onClick={() => handleGenerate(template)}
                            className="w-full bg-[#C5A572] hover:bg-[#B39562] text-white transition-all group-hover:shadow-md"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Générer ce document
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
        </div>
      )}

      <DocumentTemplateForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={loadTemplates}
        template={selectedTemplate}
      />
    </div>
  )
}
