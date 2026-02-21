// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Search, Star, Phone, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { SupplierForm } from '@/components/suppliers/supplier-form'
import { SupplierDetail } from '@/components/suppliers/supplier-detail'

export default function SuppliersPage() {
  const { profile, loading: authLoading } = useAuth()
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  

  const loadSuppliers = async () => {
    try {
      let query = supabase
        .from('suppliers')
        .select('*')
        .order('name')

      // Filter by company_id only if profile exists
      if (profile?.company_id) {
        query = query.eq('company_id', profile.company_id)
      }

      const { data, error } = await query

      if (error) throw error
      setSuppliers(data || [])
      setFilteredSuppliers(data || [])
    } catch (error: any) {
      toast.error('Erreur lors du chargement des fournisseurs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    loadSuppliers()
  }, [authLoading, profile?.company_id])

  useEffect(() => {
    filterSuppliers()
  }, [searchQuery, suppliers])

  const filterSuppliers = () => {
    if (!searchQuery) {
      setFilteredSuppliers(suppliers)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.contact_person?.toLowerCase().includes(query) ||
        s.categories?.toLowerCase().includes(query)
    )
    setFilteredSuppliers(filtered)
  }

  const handleSupplierClick = (supplier: any) => {
    setSelectedSupplier(supplier)
    setIsDetailOpen(true)
  }

  const handleDelete = async () => {
    if (
      !selectedSupplier ||
      !confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')
    ) {
      return
    }

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', selectedSupplier.id)

      if (error) throw error
      toast.success('Fournisseur supprimé')
      setIsDetailOpen(false)
      setSelectedSupplier(null)
      loadSuppliers()
    } catch (error: any) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleEdit = () => {
    setIsDetailOpen(false)
    setIsEditOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fournisseurs</h1>
          <p className="text-gray-600 mt-1">
            {filteredSuppliers.length} fournisseur{filteredSuppliers.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-[#C5A572] hover:bg-[#B39562] text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouveau fournisseur
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher un fournisseur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A572] mx-auto"></div>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucun fournisseur trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => (
            <Card
              key={supplier.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleSupplierClick(supplier)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">
                      {supplier.name}
                    </h3>
                    {supplier.categories && (
                      <p className="text-sm text-gray-600 mt-1">
                        {supplier.categories}
                      </p>
                    )}
                  </div>
                  {supplier.quality_rating && (
                    <div className="flex gap-0.5 ml-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Star
                          key={rating}
                          className={`h-4 w-4 ${
                            rating <= supplier.quality_rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {supplier.contact_person && (
                    <p className="text-sm text-gray-600">
                      Contact: {supplier.contact_person}
                    </p>
                  )}

                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      {supplier.phone}
                    </div>
                  )}

                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      {supplier.email}
                    </div>
                  )}

                  {supplier.discount_percentage !== null && (
                    <Badge variant="secondary" className="mt-2">
                      Remise {supplier.discount_percentage}%
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau fournisseur</DialogTitle>
          </DialogHeader>
          <SupplierForm
            onSuccess={() => {
              setIsCreateOpen(false)
              loadSuppliers()
            }}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSupplier && (
            <SupplierDetail
              supplierId={selectedSupplier.id}
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
            <DialogTitle>Modifier le fournisseur</DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <SupplierForm
              supplierId={selectedSupplier.id}
              onSuccess={() => {
                setIsEditOpen(false)
                setSelectedSupplier(null)
                loadSuppliers()
              }}
              onCancel={() => setIsEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
