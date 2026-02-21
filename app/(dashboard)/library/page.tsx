// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Search, Filter, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { MaterialsGrid } from '@/components/materials/materials-grid'
import { MaterialForm } from '@/components/materials/material-form'
import { MaterialDetail } from '@/components/materials/material-detail'

const categories = [
  'Tous',
  'Sol',
  'Mur',
  'Tissu',
  'Luminaire',
  'Mobilier',
  'Quincaillerie',
  'Peinture',
  'Papier peint',
  'Pierre',
  'Bois',
  'Métal',
]

export default function LibraryPage() {
  const { profile, loading: authLoading } = useAuth()
  const [materials, setMaterials] = useState<any[]>([])
  const [filteredMaterials, setFilteredMaterials] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tous')
  const [selectedSupplier, setSelectedSupplier] = useState('Tous')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null)
  

  const loadMaterials = async () => {
    try {
      let query = supabase
        .from('materials')
        .select(`
          *,
          suppliers (name)
        `)
        .order('name')

      // Filter by company_id only if profile exists
      if (profile?.company_id) {
        query = query.eq('company_id', profile.company_id)
      }

      const { data, error } = await query

      if (error) throw error
      setMaterials(data || [])
      setFilteredMaterials(data || [])
    } catch (error: any) {
      toast.error('Erreur lors du chargement des matériaux')
    } finally {
      setLoading(false)
    }
  }

  const loadSuppliers = async () => {
    let query = supabase
      .from('suppliers')
      .select('id, name')
      .order('name')

    // Filter by company_id only if profile exists
    if (profile?.company_id) {
      query = query.eq('company_id', profile.company_id)
    }

    const { data, error } = await query

    if (!error && data) {
      setSuppliers(data)
    }
  }

  useEffect(() => {
    if (authLoading) return
    setLoading(true)
    loadMaterials()
    loadSuppliers()
  }, [authLoading, profile?.company_id])

  useEffect(() => {
    filterMaterials()
  }, [searchQuery, selectedCategory, selectedSupplier, showFavoritesOnly, materials])

  const filterMaterials = () => {
    let filtered = [...materials]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.reference?.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query)
      )
    }

    if (selectedCategory !== 'Tous') {
      filtered = filtered.filter((m) => m.category === selectedCategory)
    }

    if (selectedSupplier !== 'Tous') {
      filtered = filtered.filter((m) => m.supplier_id === selectedSupplier)
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter((m) => m.is_favorite)
    }

    setFilteredMaterials(filtered)
  }

  const handleMaterialClick = (material: any) => {
    setSelectedMaterial(material)
    setIsDetailOpen(true)
  }

  const handleDelete = async () => {
    if (
      !selectedMaterial ||
      !confirm('Êtes-vous sûr de vouloir supprimer ce matériau ?')
    ) {
      return
    }

    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', selectedMaterial.id)

      if (error) throw error
      toast.success('Matériau supprimé')
      setIsDetailOpen(false)
      setSelectedMaterial(null)
      loadMaterials()
    } catch (error: any) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleEdit = () => {
    setIsDetailOpen(false)
    setIsEditOpen(true)
  }

  const handleFavoriteToggle = (materialId: string, isFavorite: boolean) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === materialId ? { ...m, is_favorite: isFavorite } : m))
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bibliothèque Matériaux</h1>
          <p className="text-gray-600 mt-1">
            {filteredMaterials.length} matériau{filteredMaterials.length > 1 ? 'x' : ''}
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-[#C5A572] hover:bg-[#B39562] text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouveau matériau
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un matériau..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Tous les fournisseurs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Tous">Tous les fournisseurs</SelectItem>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={showFavoritesOnly ? 'default' : 'outline'}
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={
            showFavoritesOnly
              ? 'bg-[#C5A572] hover:bg-[#B39562] text-white'
              : ''
          }
        >
          <Heart
            className={`h-4 w-4 mr-2 ${
              showFavoritesOnly ? 'fill-current' : ''
            }`}
          />
          Favoris
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A572] mx-auto"></div>
        </div>
      ) : (
        <MaterialsGrid
          materials={filteredMaterials}
          onMaterialClick={handleMaterialClick}
          onFavoriteToggle={handleFavoriteToggle}
        />
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau matériau</DialogTitle>
          </DialogHeader>
          <MaterialForm
            onSuccess={() => {
              setIsCreateOpen(false)
              loadMaterials()
            }}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedMaterial && (
            <MaterialDetail
              materialId={selectedMaterial.id}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onClose={() => setIsDetailOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le matériau</DialogTitle>
          </DialogHeader>
          {selectedMaterial && (
            <MaterialForm
              materialId={selectedMaterial.id}
              onSuccess={() => {
                setIsEditOpen(false)
                setSelectedMaterial(null)
                loadMaterials()
              }}
              onCancel={() => setIsEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
