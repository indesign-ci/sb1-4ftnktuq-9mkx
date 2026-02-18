// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Star } from 'lucide-react'

type SupplierFormProps = {
  supplierId?: string
  onSuccess: () => void
  onCancel?: () => void
}

export function SupplierForm({ supplierId, onSuccess, onCancel }: SupplierFormProps) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    categories: '',
    payment_terms: '',
    discount_percentage: '',
    quality_rating: 0,
    notes: '',
  })

  useEffect(() => {
    if (supplierId) {
      loadSupplier()
    }
  }, [supplierId])

  const loadSupplier = async () => {
    if (!supplierId) return

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', supplierId)
        .single()

      if (error) throw error

      setFormData({
        name: data.name || '',
        contact_person: data.contact_person || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        address: data.address || '',
        categories: data.categories || '',
        payment_terms: data.payment_terms || '',
        discount_percentage: data.discount_percentage?.toString() || '',
        quality_rating: data.quality_rating || 0,
        notes: data.notes || '',
      })
    } catch (error: any) {
      toast.error('Erreur lors du chargement du fournisseur')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      toast.error('Veuillez saisir un nom')
      return
    }

    setLoading(true)
    try {
      const supplierData = {
        company_id: profile?.company_id,
        name: formData.name,
        contact_person: formData.contact_person || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        address: formData.address || null,
        categories: formData.categories || null,
        payment_terms: formData.payment_terms || null,
        discount_percentage: formData.discount_percentage
          ? parseFloat(formData.discount_percentage)
          : null,
        quality_rating: formData.quality_rating || null,
        notes: formData.notes || null,
      }

      if (supplierId) {
        const { error } = await supabase
          .from('suppliers')
          .update(supplierData)
          .eq('id', supplierId)

        if (error) throw error
        toast.success('Fournisseur modifié')
      } else {
        const { error } = await supabase.from('suppliers').insert(supplierData)

        if (error) throw error
        toast.success('Fournisseur créé')
      }

      onSuccess()
    } catch (error: any) {
      toast.error('Erreur lors de la sauvegarde')
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
          placeholder="Nom du fournisseur"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact_person">Contact</Label>
          <Input
            id="contact_person"
            value={formData.contact_person}
            onChange={(e) =>
              setFormData({ ...formData, contact_person: e.target.value })
            }
            placeholder="Nom du contact"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="06 12 34 56 78"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="contact@fournisseur.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Site web</Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) =>
              setFormData({ ...formData, website: e.target.value })
            }
            placeholder="https://www.fournisseur.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Adresse</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Adresse complète"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="categories">Catégories</Label>
        <Input
          id="categories"
          value={formData.categories}
          onChange={(e) =>
            setFormData({ ...formData, categories: e.target.value })
          }
          placeholder="Mobilier, Luminaires, Tissus..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="payment_terms">Conditions de paiement</Label>
          <Input
            id="payment_terms"
            value={formData.payment_terms}
            onChange={(e) =>
              setFormData({ ...formData, payment_terms: e.target.value })
            }
            placeholder="30 jours net, 50% acompte..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="discount_percentage">Remise (%)</Label>
          <Input
            id="discount_percentage"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.discount_percentage}
            onChange={(e) =>
              setFormData({ ...formData, discount_percentage: e.target.value })
            }
            placeholder="10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Note qualité</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => setFormData({ ...formData, quality_rating: rating })}
              className="focus:outline-none"
            >
              <Star
                className={`h-6 w-6 ${
                  rating <= formData.quality_rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
          placeholder="Notes internes sur le fournisseur"
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
          {loading ? 'Enregistrement...' : supplierId ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  )
}
