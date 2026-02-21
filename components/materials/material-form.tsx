// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'

type MaterialFormProps = {
  materialId?: string
  onSuccess: () => void
  onCancel?: () => void
}

const categories = [
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

const units = ['m²', 'm', 'unité', 'l', 'kg', 'rouleau', 'paquet']

export function MaterialForm({ materialId, onSuccess, onCancel }: MaterialFormProps) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  

  const [formData, setFormData] = useState({
    name: '',
    reference: '',
    supplier_id: 'none',
    category: '',
    photo_url: '',
    price: '',
    unit: 'm²',
    description: '',
    web_link: '',
    delivery_time: '',
  })

  useEffect(() => {
    loadSuppliers()
    if (materialId) {
      loadMaterial()
    }
  }, [materialId])

  const loadSuppliers = async () => {
    if (!profile?.company_id) return

    const { data, error } = await supabase
      .from('suppliers')
      .select('id, name')
      .eq('company_id', profile.company_id)
      .order('name')

    if (!error && data) {
      setSuppliers(data)
    }
  }

  const loadMaterial = async () => {
    if (!materialId) return

    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('id', materialId)
        .single()

      if (error) throw error

      setFormData({
        name: data.name || '',
        reference: data.reference || '',
        supplier_id: data.supplier_id || 'none',
        category: data.category || '',
        photo_url: data.photo_url || '',
        price: data.price?.toString() || '',
        unit: data.unit || 'm²',
        description: data.description || '',
        web_link: data.web_link || '',
        delivery_time: data.delivery_time || '',
      })

      if (data.photo_url) {
        setPhotoPreview(data.photo_url)
      }
    } catch (error: any) {
      toast.error('Erreur lors du chargement du matériau')
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La photo ne doit pas dépasser 5 Mo')
        return
      }
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadPhoto = async () => {
    if (!photoFile) return formData.photo_url

    const fileExt = photoFile.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${profile?.company_id}/materials/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filePath, photoFile)

    if (uploadError) throw uploadError

    const {
      data: { publicUrl },
    } = supabase.storage.from('photos').getPublicUrl(filePath)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      toast.error('Veuillez saisir un nom')
      return
    }

    setLoading(true)
    try {
      let photoUrl = formData.photo_url

      if (photoFile) {
        photoUrl = await uploadPhoto()
      }

      const materialData = {
        company_id: profile?.company_id,
        name: formData.name,
        reference: formData.reference || null,
        supplier_id: formData.supplier_id === 'none' ? null : formData.supplier_id,
        category: formData.category || null,
        photo_url: photoUrl || null,
        price: formData.price ? parseFloat(formData.price) : null,
        unit: formData.unit || null,
        description: formData.description || null,
        web_link: formData.web_link || null,
        delivery_time: formData.delivery_time || null,
        is_favorite: false,
      }

      if (materialId) {
        const { error } = await supabase
          .from('materials')
          .update(materialData)
          .eq('id', materialId)

        if (error) throw error
        toast.success('Matériau modifié')
      } else {
        const { error } = await supabase.from('materials').insert(materialData)

        if (error) throw error
        toast.success('Matériau créé')
      }

      onSuccess()
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la sauvegarde')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Nom du matériau"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="reference">Référence</Label>
          <Input
            id="reference"
            value={formData.reference}
            onChange={(e) =>
              setFormData({ ...formData, reference: e.target.value })
            }
            placeholder="REF-123"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Catégorie</Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData({ ...formData, category: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplier_id">Fournisseur</Label>
        <Select
          value={formData.supplier_id}
          onValueChange={(value) =>
            setFormData({ ...formData, supplier_id: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un fournisseur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun fournisseur</SelectItem>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Photo</Label>
        {photoPreview ? (
          <div className="relative w-full h-48 border rounded-lg overflow-hidden">
            <img
              src={photoPreview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => {
                setPhotoFile(null)
                setPhotoPreview(null)
                setFormData({ ...formData, photo_url: '' })
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <Label
                htmlFor="photo"
                className="cursor-pointer text-[#C5A572] hover:underline"
              >
                Cliquer pour uploader
              </Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, WEBP jusqu'à 5 Mo
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Prix</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">Unité</Label>
          <Select
            value={formData.unit}
            onValueChange={(value) => setFormData({ ...formData, unit: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {units.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="web_link">Lien web</Label>
          <Input
            id="web_link"
            type="url"
            value={formData.web_link}
            onChange={(e) =>
              setFormData({ ...formData, web_link: e.target.value })
            }
            placeholder="https://..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="delivery_time">Délai de livraison</Label>
          <Input
            id="delivery_time"
            value={formData.delivery_time}
            onChange={(e) =>
              setFormData({ ...formData, delivery_time: e.target.value })
            }
            placeholder="2 semaines"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={4}
          placeholder="Description détaillée du matériau"
        />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel || onSuccess}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-[#C5A572] hover:bg-[#B39562] text-white"
        >
          {loading ? 'Enregistrement...' : materialId ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  )
}
