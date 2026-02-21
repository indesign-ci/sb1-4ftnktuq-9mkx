// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'

export function CompanySettings() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [company, setCompany] = useState<any>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    siret: '',
    vat_number: '',
    rcs: '',
    iban: '',
    quote_legal_mentions: '',
    invoice_legal_mentions: '',
    terms_conditions: '',
  })

  useEffect(() => {
    loadCompany()
  }, [profile?.company_id])

  const loadCompany = async () => {
    if (!profile?.company_id) return

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .maybeSingle()

      if (error) throw error
      setCompany(data)
      setFormData({
        name: data.name || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        siret: data.siret || '',
        vat_number: data.vat_number || '',
        rcs: data.rcs || '',
        iban: data.iban || '',
        quote_legal_mentions: data.quote_legal_mentions || '',
        invoice_legal_mentions: data.invoice_legal_mentions || '',
        terms_conditions: data.terms_conditions || '',
      })
      if (data.logo_url) {
        setLogoPreview(data.logo_url)
      }
    } catch (error: any) {
      toast.error('Erreur lors du chargement des données')
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Le logo ne doit pas dépasser 5 Mo')
        return
      }
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadLogo = async () => {
    if (!logoFile) return company?.logo_url

    const fileExt = logoFile.name.split('.').pop()
    const fileName = `logo-${Date.now()}.${fileExt}`
    const filePath = `${profile?.company_id}/company/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filePath, logoFile)

    if (uploadError) throw uploadError

    const {
      data: { publicUrl },
    } = supabase.storage.from('photos').getPublicUrl(filePath)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      toast.error('Le nom est obligatoire')
      return
    }

    setLoading(true)
    try {
      let logoUrl = company?.logo_url

      if (logoFile) {
        logoUrl = await uploadLogo()
      }

      const { error } = await supabase
        .from('companies')
        .update({
          name: formData.name,
          address: formData.address || null,
          phone: formData.phone || null,
          email: formData.email || null,
          website: formData.website || null,
          siret: formData.siret || null,
          vat_number: formData.vat_number || null,
          rcs: formData.rcs || null,
          iban: formData.iban || null,
          quote_legal_mentions: formData.quote_legal_mentions || null,
          invoice_legal_mentions: formData.invoice_legal_mentions || null,
          terms_conditions: formData.terms_conditions || null,
          logo_url: logoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile?.company_id)

      if (error) throw error

      toast.success('Informations de l\'entreprise mises à jour')
      loadCompany()
    } catch (error: any) {
      const msg = error?.message || error?.error_description || 'Erreur lors de la sauvegarde'
      toast.error(msg)
      console.error('[CompanySettings]', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>Informations de base de votre entreprise</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Logo</Label>
            {logoPreview ? (
              <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1"
                  onClick={() => {
                    setLogoFile(null)
                    setLogoPreview(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center w-32 h-32 flex flex-col items-center justify-center">
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <Label
                  htmlFor="logo"
                  className="cursor-pointer text-xs text-[#C5A572] hover:underline"
                >
                  Upload
                </Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Nom de l'entreprise *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="website">Site web</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations légales</CardTitle>
          <CardDescription>SIRET, TVA, RCS et coordonnées bancaires</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siret">SIRET</Label>
              <Input
                id="siret"
                value={formData.siret}
                onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vat_number">N° TVA intracommunautaire</Label>
              <Input
                id="vat_number"
                value={formData.vat_number}
                onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="rcs">RCS</Label>
              <Input
                id="rcs"
                value={formData.rcs}
                onChange={(e) => setFormData({ ...formData, rcs: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="iban">IBAN / RIB</Label>
              <Input
                id="iban"
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mentions légales et conditions</CardTitle>
          <CardDescription>Textes apparaissant sur vos documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quote_legal_mentions">Mentions légales pour devis</Label>
            <Textarea
              id="quote_legal_mentions"
              value={formData.quote_legal_mentions}
              onChange={(e) =>
                setFormData({ ...formData, quote_legal_mentions: e.target.value })
              }
              rows={3}
              placeholder="Mentions légales apparaissant sur les devis..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice_legal_mentions">Mentions légales pour factures</Label>
            <Textarea
              id="invoice_legal_mentions"
              value={formData.invoice_legal_mentions}
              onChange={(e) =>
                setFormData({ ...formData, invoice_legal_mentions: e.target.value })
              }
              rows={3}
              placeholder="Mentions légales apparaissant sur les factures..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms_conditions">Conditions générales de vente</Label>
            <Textarea
              id="terms_conditions"
              value={formData.terms_conditions}
              onChange={(e) =>
                setFormData({ ...formData, terms_conditions: e.target.value })
              }
              rows={6}
              placeholder="Conditions générales de vente..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading}
          className="bg-[#C5A572] hover:bg-[#B39562] text-white"
        >
          {loading ? 'Enregistrement...' : 'Sauvegarder'}
        </Button>
      </div>
    </form>
  )
}
