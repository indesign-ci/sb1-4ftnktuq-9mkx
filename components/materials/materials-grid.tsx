// @ts-nocheck
'use client'

import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, Package } from 'lucide-react'
import { toast } from 'sonner'

type MaterialsGridProps = {
  materials: any[]
  onMaterialClick: (material: any) => void
  onFavoriteToggle: (materialId: string, isFavorite: boolean) => void
}

export function MaterialsGrid({
  materials,
  onMaterialClick,
  onFavoriteToggle,
}: MaterialsGridProps) {
  

  const handleFavoriteClick = async (
    e: React.MouseEvent,
    materialId: string,
    currentFavorite: boolean
  ) => {
    e.stopPropagation()

    try {
      const { error } = await supabase
        .from('materials')
        .update({ is_favorite: !currentFavorite })
        .eq('id', materialId)

      if (error) throw error

      onFavoriteToggle(materialId, !currentFavorite)
      toast.success(
        !currentFavorite ? 'Ajouté aux favoris' : 'Retiré des favoris'
      )
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  if (materials.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <p className="text-gray-500 mt-4">Aucun matériau trouvé</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {materials.map((material) => (
        <Card
          key={material.id}
          className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden group"
          onClick={() => onMaterialClick(material)}
        >
          <div className="relative aspect-square bg-gray-100">
            {material.photo_url ? (
              <img
                src={material.photo_url}
                alt={material.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-16 w-16 text-gray-300" />
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-white/90 hover:bg-white"
              onClick={(e) =>
                handleFavoriteClick(e, material.id, material.is_favorite)
              }
            >
              <Heart
                className={`h-5 w-5 ${
                  material.is_favorite
                    ? 'fill-red-500 text-red-500'
                    : 'text-gray-600'
                }`}
              />
            </Button>
          </div>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-sm line-clamp-1 flex-1">
                {material.name}
              </h3>
              {material.category && (
                <Badge variant="outline" className="text-xs shrink-0">
                  {material.category}
                </Badge>
              )}
            </div>

            {material.reference && (
              <p className="text-xs text-gray-500 mb-2">
                Réf: {material.reference}
              </p>
            )}

            {material.suppliers && (
              <p className="text-xs text-gray-600 mb-2">
                {material.suppliers.name}
              </p>
            )}

            {material.price && (
              <p className="text-sm font-bold text-[#C5A572]">
                {material.price} FCFA / {material.unit || 'unité'}
              </p>
            )}

            {material.delivery_time && (
              <p className="text-xs text-gray-500 mt-2">
                Délai: {material.delivery_time}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
