// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
import { MoodboardForm } from '@/components/moodboards/moodboard-form'
import { MoodboardDetail } from '@/components/moodboards/moodboard-detail'
import { Plus, Search, Eye, Edit, Trash2, Palette } from 'lucide-react'
import { toast } from 'sonner'

export default function MoodboardsPage() {
  const { profile } = useAuth()
  const [company, setCompany] = useState<any>(null)
  const [moodboards, setMoodboards] = useState<any[]>([])
  const [filteredMoodboards, setFilteredMoodboards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedMoodboard, setSelectedMoodboard] = useState<any>(null)

  useEffect(() => {
    loadCompanyAndMoodboards()
  }, [profile?.company_id])

  useEffect(() => {
    filterMoodboards()
  }, [searchTerm, moodboards])

  const loadCompanyAndMoodboards = async () => {
    if (!profile?.company_id) return

    try {
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .maybeSingle()

      setCompany(companyData)

      const { data, error } = await supabase
        .from('moodboards')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMoodboards(data || [])
      setFilteredMoodboards(data || [])
    } catch (error: any) {
      toast.error('Erreur lors du chargement')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filterMoodboards = () => {
    if (!searchTerm) {
      setFilteredMoodboards(moodboards)
      return
    }

    const filtered = moodboards.filter((moodboard) =>
      moodboard.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      moodboard.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredMoodboards(filtered)
  }

  const handleView = (moodboard: any) => {
    setSelectedMoodboard(moodboard)
    setDetailOpen(true)
  }

  const handleEdit = (moodboard: any) => {
    setSelectedMoodboard(moodboard)
    setFormOpen(true)
  }

  const handleDelete = (moodboard: any) => {
    setSelectedMoodboard(moodboard)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedMoodboard) return

    try {
      const { error } = await supabase
        .from('moodboards')
        .delete()
        .eq('id', selectedMoodboard.id)

      if (error) throw error

      toast.success('Moodboard supprimé')
      loadCompanyAndMoodboards()
    } catch (error: any) {
      toast.error('Erreur lors de la suppression')
      console.error(error)
    } finally {
      setDeleteDialogOpen(false)
      setSelectedMoodboard(null)
    }
  }

  const handleFormSuccess = () => {
    loadCompanyAndMoodboards()
    setSelectedMoodboard(null)
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
          <h1 className="text-4xl font-light text-gray-900 tracking-tight">Moodboards</h1>
          <p className="text-gray-500 mt-2 font-light">Planches d'ambiance & inspirations</p>
        </div>
        {company?.logo_url && (
          <img src={company.logo_url} alt={company.name} className="h-12 object-contain" />
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 bg-white border-gray-200 focus:border-[#C5A572] transition-colors"
          />
        </div>
        <Button
          onClick={() => {
            setSelectedMoodboard(null)
            setFormOpen(true)
          }}
          className="h-12 px-6 bg-[#C5A572] hover:bg-[#B39562] text-white transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="h-5 w-5 mr-2" />
          Créer un moodboard
        </Button>
      </div>

      {filteredMoodboards.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
            <Palette className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-light text-gray-900 mb-2">
            {searchTerm ? 'Aucun moodboard trouvé' : 'Aucun moodboard'}
          </h3>
          <p className="text-gray-500 mb-8 font-light">
            {searchTerm
              ? 'Essayez avec un autre terme de recherche'
              : 'Créez votre première planche d\'ambiance'}
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setFormOpen(true)}
              className="bg-[#C5A572] hover:bg-[#B39562] text-white px-8 py-3 h-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              Créer mon premier moodboard
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMoodboards.map((moodboard) => {
            const firstImage = moodboard.images?.[0]
            const imageCount = moodboard.images?.length || 0
            const colorCount = moodboard.color_palette?.length || 0

            return (
              <Card
                key={moodboard.id}
                className="group overflow-hidden border-gray-200 hover:shadow-2xl transition-all duration-300 cursor-pointer bg-white"
                onClick={() => handleView(moodboard)}
              >
                <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                  {firstImage ? (
                    <>
                      <img
                        src={firstImage}
                        alt={moodboard.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                      <Palette className="h-16 w-16 mb-3" />
                      <span className="text-sm font-light">Sans image</span>
                    </div>
                  )}

                  {imageCount > 1 && (
                    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-light">
                      +{imageCount - 1} {imageCount === 2 ? 'photo' : 'photos'}
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleView(moodboard)
                        }}
                        className="flex-1 bg-white/95 hover:bg-white backdrop-blur-sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(moodboard)
                        }}
                        className="bg-white/95 hover:bg-white backdrop-blur-sm"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(moodboard)
                        }}
                        className="bg-white/95 hover:bg-white text-red-600 backdrop-blur-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-light text-gray-900 mb-1">
                      {moodboard.name}
                    </h3>
                    {moodboard.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 font-light">
                        {moodboard.description}
                      </p>
                    )}
                  </div>

                  {colorCount > 0 && (
                    <div className="flex gap-1.5">
                      {moodboard.color_palette.slice(0, 8).map((color: string, index: number) => (
                        <div
                          key={index}
                          className="w-8 h-8 rounded-md border border-gray-200 shadow-sm transition-transform hover:scale-110"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <MoodboardForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleFormSuccess}
        moodboard={selectedMoodboard}
        company={company}
      />

      <MoodboardDetail
        open={detailOpen}
        onOpenChange={setDetailOpen}
        moodboard={selectedMoodboard}
        onEdit={handleEdit}
        company={company}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce moodboard ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le moodboard "{selectedMoodboard?.name}" sera définitivement supprimé.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
