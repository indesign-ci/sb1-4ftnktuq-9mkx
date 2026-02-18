// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Package,
  Tag,
  Banknote,
  Truck,
  Link as LinkIcon,
  Pencil,
  Trash2,
  Heart,
  Building2,
} from 'lucide-react'
import { toast } from 'sonner'

type MaterialDetailProps = {
  materialId: string
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}

export function MaterialDetail({
  materialId,
  onEdit,
  onDelete,
  onClose,
}: MaterialDetailProps) {
  const [material, setMaterial] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  

  useEffect(() => {
    loadMaterial()
  }, [materialId])

  const loadMaterial = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          suppliers (name, phone, email, website)
        `)
        .eq('id', materialId)
        .single()

      if (error) throw error
      setMaterial(data)
    } catch (error: any) {
      toast.error('Erreur lors du chargement du matériau')
    } finally {
      setLoading(false)
    }
  }

  const handleFavoriteToggle = async () => {
    if (!material) return

    try {
      const { error } = await supabase
        .from('materials')
        .update({ is_favorite: !material.is_favorite } as any)
        .eq('id', materialId)

      if (error) throw error

      setMaterial({ ...material, is_favorite: !material.is_favorite })
      toast.success(
        !material.is_favorite ? 'Ajouté aux favoris' : 'Retiré des favoris'
      )
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A572] mx-auto"></div>
      </div>
    )
  }

  if (!material) {
    return (
      <div className="text-center py-8 text-gray-500">Matériau introuvable</div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{material.name}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFavoriteToggle}
              className="shrink-0"
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
          {material.category && (
            <Badge variant="outline" className="mt-2">
              {material.category}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {material.photo_url && (
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100">
          <img
            src={material.photo_url}
            alt={material.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {material.reference && (
          <div className="flex items-start gap-3">
            <Tag className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Référence</p>
              <p className="text-sm text-gray-600">{material.reference}</p>
            </div>
          </div>
        )}

        {material.price && (
          <div className="flex items-start gap-3">
            <Banknote className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Prix</p>
              <p className="text-sm text-gray-600">
                {material.price} FCFA / {material.unit || 'unité'}
              </p>
            </div>
          </div>
        )}

        {material.suppliers && (
          <div className="flex items-start gap-3 md:col-span-2">
            <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Fournisseur</p>
              <p className="text-sm text-gray-600">{material.suppliers.name}</p>
              {material.suppliers.phone && (
                <p className="text-xs text-gray-500">
                  Tél: {material.suppliers.phone}
                </p>
              )}
              {material.suppliers.email && (
                <p className="text-xs text-gray-500">
                  Email: {material.suppliers.email}
                </p>
              )}
            </div>
          </div>
        )}

        {material.delivery_time && (
          <div className="flex items-start gap-3">
            <Truck className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Délai de livraison</p>
              <p className="text-sm text-gray-600">{material.delivery_time}</p>
            </div>
          </div>
        )}

        {material.web_link && (
          <div className="flex items-start gap-3">
            <LinkIcon className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Lien web</p>
              <a
                href={material.web_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#C5A572] hover:underline"
              >
                Voir le produit
              </a>
            </div>
          </div>
        )}
      </div>

      {material.description && (
        <>
          <Separator />
          <div>
            <p className="font-medium mb-2">Description</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {material.description}
            </p>
          </div>
        </>
      )}

      <div className="flex justify-end pt-4">
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </div>
  )
}
