// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, X, Package, DollarSign, Users } from 'lucide-react'

type CategoryType = 'material' | 'budget_post' | 'acquisition_source'

export function CategoriesSettings() {
  const { profile } = useAuth()
  const [materialCategories, setMaterialCategories] = useState<any[]>([])
  const [budgetPostCategories, setBudgetPostCategories] = useState<any[]>([])
  const [acquisitionSourceCategories, setAcquisitionSourceCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  

  const [newMaterial, setNewMaterial] = useState('')
  const [newBudgetPost, setNewBudgetPost] = useState('')
  const [newAcquisitionSource, setNewAcquisitionSource] = useState('')

  useEffect(() => {
    loadCategories()
  }, [profile?.company_id])

  const loadCategories = async () => {
    if (!profile?.company_id) return

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('position')

      if (error) throw error

      const materials = data?.filter((c) => c.type === 'material') || []
      const budgets = data?.filter((c) => c.type === 'budget_post') || []
      const sources = data?.filter((c) => c.type === 'acquisition_source') || []

      setMaterialCategories(materials)
      setBudgetPostCategories(budgets)
      setAcquisitionSourceCategories(sources)
    } catch (error: any) {
      toast.error('Erreur lors du chargement des catégories')
    } finally {
      setLoading(false)
    }
  }

  const addCategory = async (type: CategoryType, name: string) => {
    if (!name.trim()) {
      toast.error('Veuillez saisir un nom')
      return
    }

    try {
      let maxPosition = 0
      if (type === 'material') {
        maxPosition = Math.max(...materialCategories.map((c) => c.position), 0)
      } else if (type === 'budget_post') {
        maxPosition = Math.max(...budgetPostCategories.map((c) => c.position), 0)
      } else {
        maxPosition = Math.max(...acquisitionSourceCategories.map((c) => c.position), 0)
      }

      const { error } = await supabase.from('categories').insert({
        company_id: profile?.company_id,
        type,
        name: name.trim(),
        position: maxPosition + 1,
      })

      if (error) throw error

      toast.success('Catégorie ajoutée')
      if (type === 'material') setNewMaterial('')
      if (type === 'budget_post') setNewBudgetPost('')
      if (type === 'acquisition_source') setNewAcquisitionSource('')
      loadCategories()
    } catch (error: any) {
      toast.error('Erreur lors de l\'ajout')
    }
  }

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ?`)) {
      return
    }

    try {
      const { error } = await supabase.from('categories').delete().eq('id', id)

      if (error) throw error

      toast.success('Catégorie supprimée')
      loadCategories()
    } catch (error: any) {
      toast.error('Erreur lors de la suppression')
    }
  }

  if (profile?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-600">
            Seuls les administrateurs peuvent gérer les catégories
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A572] mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <div>
              <CardTitle>Catégories de matériaux</CardTitle>
              <CardDescription>
                Gérer les catégories pour la bibliothèque matériaux
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nouvelle catégorie"
              value={newMaterial}
              onChange={(e) => setNewMaterial(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addCategory('material', newMaterial)
                }
              }}
            />
            <Button
              onClick={() => addCategory('material', newMaterial)}
              className="bg-[#C5A572] hover:bg-[#B39562] text-white"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {materialCategories.map((category) => (
              <Badge
                key={category.id}
                variant="outline"
                className="text-sm py-2 px-3 flex items-center gap-2"
              >
                {category.name}
                <button
                  onClick={() => deleteCategory(category.id, category.name)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <div>
              <CardTitle>Postes budgétaires</CardTitle>
              <CardDescription>
                Gérer les postes pour les budgets de projets
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nouveau poste budgétaire"
              value={newBudgetPost}
              onChange={(e) => setNewBudgetPost(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addCategory('budget_post', newBudgetPost)
                }
              }}
            />
            <Button
              onClick={() => addCategory('budget_post', newBudgetPost)}
              className="bg-[#C5A572] hover:bg-[#B39562] text-white"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {budgetPostCategories.map((category) => (
              <Badge
                key={category.id}
                variant="outline"
                className="text-sm py-2 px-3 flex items-center gap-2"
              >
                {category.name}
                <button
                  onClick={() => deleteCategory(category.id, category.name)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <div>
              <CardTitle>Sources d'acquisition client</CardTitle>
              <CardDescription>
                Gérer les sources pour suivre l'origine des clients
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nouvelle source"
              value={newAcquisitionSource}
              onChange={(e) => setNewAcquisitionSource(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addCategory('acquisition_source', newAcquisitionSource)
                }
              }}
            />
            <Button
              onClick={() => addCategory('acquisition_source', newAcquisitionSource)}
              className="bg-[#C5A572] hover:bg-[#B39562] text-white"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {acquisitionSourceCategories.map((category) => (
              <Badge
                key={category.id}
                variant="outline"
                className="text-sm py-2 px-3 flex items-center gap-2"
              >
                {category.name}
                <button
                  onClick={() => deleteCategory(category.id, category.name)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
