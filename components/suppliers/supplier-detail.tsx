// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  User,
  CreditCard,
  Percent,
  Pencil,
  Trash2,
  Star,
  Package,
} from 'lucide-react'
import { toast } from 'sonner'

type SupplierDetailProps = {
  supplierId: string
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}

export function SupplierDetail({
  supplierId,
  onEdit,
  onDelete,
  onClose,
}: SupplierDetailProps) {
  const [supplier, setSupplier] = useState<any>(null)
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  

  useEffect(() => {
    loadSupplier()
    loadMaterials()
  }, [supplierId])

  const loadSupplier = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', supplierId)
        .single()

      if (error) throw error
      setSupplier(data)
    } catch (error: any) {
      toast.error('Erreur lors du chargement du fournisseur')
    } finally {
      setLoading(false)
    }
  }

  const loadMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('id, name, reference, price, unit, category')
        .eq('supplier_id', supplierId)
        .order('name')

      if (!error && data) {
        setMaterials(data)
      }
    } catch (error: any) {
      console.error('Error loading materials:', error)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A572] mx-auto"></div>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="text-center py-8 text-gray-500">Fournisseur introuvable</div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{supplier.name}</h2>
          {supplier.categories && (
            <p className="text-sm text-gray-600 mt-1">{supplier.categories}</p>
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

      {supplier.quality_rating && (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <Star
              key={rating}
              className={`h-5 w-5 ${
                rating <= supplier.quality_rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      )}

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {supplier.contact_person && (
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Contact</p>
              <p className="text-sm text-gray-600">{supplier.contact_person}</p>
            </div>
          </div>
        )}

        {supplier.phone && (
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Téléphone</p>
              <a
                href={`tel:${supplier.phone}`}
                className="text-sm text-[#C5A572] hover:underline"
              >
                {supplier.phone}
              </a>
            </div>
          </div>
        )}

        {supplier.email && (
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Email</p>
              <a
                href={`mailto:${supplier.email}`}
                className="text-sm text-[#C5A572] hover:underline"
              >
                {supplier.email}
              </a>
            </div>
          </div>
        )}

        {supplier.website && (
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Site web</p>
              <a
                href={supplier.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#C5A572] hover:underline"
              >
                {supplier.website}
              </a>
            </div>
          </div>
        )}

        {supplier.address && (
          <div className="flex items-start gap-3 md:col-span-2">
            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Adresse</p>
              <p className="text-sm text-gray-600">{supplier.address}</p>
            </div>
          </div>
        )}

        {supplier.payment_terms && (
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Conditions de paiement</p>
              <p className="text-sm text-gray-600">{supplier.payment_terms}</p>
            </div>
          </div>
        )}

        {supplier.discount_percentage !== null && (
          <div className="flex items-start gap-3">
            <Percent className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Remise</p>
              <p className="text-sm text-gray-600">{supplier.discount_percentage}%</p>
            </div>
          </div>
        )}
      </div>

      {supplier.notes && (
        <>
          <Separator />
          <div>
            <p className="font-medium mb-2">Notes</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {supplier.notes}
            </p>
          </div>
        </>
      )}

      {materials.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Matériaux associés ({materials.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {materials.map((material) => (
                <Card key={material.id}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {material.name}
                        </h4>
                        {material.reference && (
                          <p className="text-xs text-gray-500">
                            Réf: {material.reference}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {material.category}
                      </Badge>
                    </div>
                    {material.price && (
                      <p className="text-sm font-medium text-[#C5A572] mt-2">
                        {material.price} FCFA / {material.unit || 'unité'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
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
