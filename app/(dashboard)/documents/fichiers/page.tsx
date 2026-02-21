'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Upload,
  Search,
  FileText,
  Download,
  Trash2,
  Eye,
  File,
  Image,
  FileSpreadsheet,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'

const categories = [
  'Contrats',
  'Factures',
  'Devis',
  'Plans',
  'Photos',
  'Documents administratifs',
  'Autres',
]

export default function DocumentsFichiersPage() {
  const { profile } = useAuth()
  const [documents, setDocuments] = useState<{ id: string; name: string; file_url: string; file_type: string; file_size: number; category: string; created_at: string }[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<typeof documents>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<typeof documents[0] | null>(null)

  useEffect(() => {
    loadDocuments()
  }, [profile?.company_id])

  useEffect(() => {
    let filtered = documents
    if (categoryFilter && categoryFilter !== 'all') filtered = filtered.filter((doc) => doc.category === categoryFilter)
    if (searchTerm) filtered = filtered.filter((doc) => doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) || doc.category?.toLowerCase().includes(searchTerm.toLowerCase()))
    setFilteredDocuments(filtered)
  }, [searchTerm, categoryFilter, documents])

  const loadDocuments = async () => {
    if (!profile?.company_id) return
    try {
      const { data, error } = await supabase.from('documents').select('*').eq('company_id', profile.company_id).order('created_at', { ascending: false })
      if (error) throw error
      setDocuments(data || [])
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors du chargement des documents')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0 || !profile?.company_id) return
    setUploading(true)
    try {
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} dépasse 10 Mo`)
          continue
        }
        const fileExt = file.name.split('.').pop()
        const fileName = `document-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${profile.company_id}/documents/${fileName}`
        const { error: uploadError } = await supabase.storage.from('photos').upload(filePath, file)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filePath)
        const { error: insertError } = await supabase.from('documents').insert([{ company_id: profile.company_id, name: file.name, file_url: publicUrl, file_type: file.type, file_size: file.size, category: 'Autres', uploaded_by: profile.id }])
        if (insertError) throw insertError
      }
      toast.success('Document(s) uploadé(s)')
      loadDocuments()
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  const handleCategoryChange = async (documentId: string, newCategory: string) => {
    try {
      const { error } = await supabase.from('documents').update({ category: newCategory }).eq('id', documentId)
      if (error) throw error
      toast.success('Catégorie mise à jour')
      loadDocuments()
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la mise à jour')
    }
  }

  const confirmDelete = async () => {
    if (!selectedDocument) return
    try {
      const { error } = await supabase.from('documents').delete().eq('id', selectedDocument.id)
      if (error) throw error
      toast.success('Document supprimé')
      loadDocuments()
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la suppression')
    } finally {
      setDeleteDialogOpen(false)
      setSelectedDocument(null)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType?.startsWith('image/')) return <Image className="h-8 w-8" />
    if (fileType?.includes('pdf')) return <FileText className="h-8 w-8" />
    if (fileType?.includes('sheet') || fileType?.includes('excel')) return <FileSpreadsheet className="h-8 w-8" />
    return <File className="h-8 w-8" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-light text-gray-900 tracking-tight">Pièces jointes</h1>
          <p className="text-gray-500 mt-2 font-light">Fichiers uploadés (contrats, plans, photos…)</p>
        </div>
        <Button asChild variant="outline" className="border-[#C5A572] text-[#C5A572] hover:bg-[#C5A572]/10">
          <Link href="/documents">← Documents professionnels</Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 h-12 bg-white border-gray-200 focus:border-[#C5A572]" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-64 h-12">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => document.getElementById('file-upload')?.click()} disabled={uploading} className="h-12 px-6 bg-[#C5A572] hover:bg-[#B39562] text-white">
          <Upload className="h-5 w-5 mr-2" />
          {uploading ? 'Upload en cours...' : 'Uploader'}
        </Button>
        <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileUpload} />
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
            <FileText className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-light text-gray-900 mb-2">
            {searchTerm || categoryFilter !== 'all' ? 'Aucun document trouvé' : 'Aucun document'}
          </h3>
          <p className="text-gray-500 mb-8 font-light">
            {searchTerm || categoryFilter !== 'all' ? 'Essayez avec d\'autres critères' : 'Commencez par uploader vos premiers fichiers'}
          </p>
          {!searchTerm && categoryFilter === 'all' && (
            <Button onClick={() => document.getElementById('file-upload')?.click()} className="bg-[#C5A572] hover:bg-[#B39562] text-white px-8 py-3 h-auto">
              <Upload className="h-5 w-5 mr-2" />
              Uploader un document
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="group hover:shadow-lg transition-shadow border-gray-200">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-[#C5A572]">{getFileIcon(document.file_type)}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate text-sm">{document.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{formatFileSize(document.file_size)}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Select value={document.category || 'Autres'} onValueChange={(value) => handleCategoryChange(document.id, value)}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">{format(new Date(document.created_at), 'dd MMM yyyy', { locale: fr })}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open(document.file_url, '_blank')} className="flex-1">
                    <Eye className="h-3 w-3 mr-1" /> Aperçu
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { const link = window.document.createElement('a'); link.href = document.file_url; link.download = document.name; link.click() }}>
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setSelectedDocument(document); setDeleteDialogOpen(true) }} className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
            <AlertDialogDescription>Le document &quot;{selectedDocument?.name}&quot; sera définitivement supprimé.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
