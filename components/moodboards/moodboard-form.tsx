// @ts-nocheck
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Upload, X, Plus, FileImage } from 'lucide-react'

interface MoodboardFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  moodboard?: any
  company?: any
}

export function MoodboardForm({ open, onOpenChange, onSuccess, moodboard, company }: MoodboardFormProps) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>(moodboard?.images || [])
  const [colorPalette, setColorPalette] = useState<string[]>(moodboard?.color_palette || ['#000000'])

  const [formData, setFormData] = useState({
    name: moodboard?.name || '',
    description: moodboard?.description || '',
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + imageFiles.length + imagePreviews.length > 20) {
      toast.error('Maximum 20 images par moodboard')
      return
    }

    const validFiles: File[] = []

    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} dépasse 10 Mo`)
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
      validFiles.push(file)
    })

    setImageFiles((prev) => [...prev, ...validFiles])
  }

  const removeImage = (index: number) => {
    const existingImagesCount = moodboard?.images?.length || 0

    if (index < existingImagesCount) {
      setImagePreviews((prev) => prev.filter((_, i) => i !== index))
    } else {
      const fileIndex = index - existingImagesCount
      setImageFiles((prev) => prev.filter((_, i) => i !== fileIndex))
      setImagePreviews((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const addColor = () => {
    if (colorPalette.length >= 10) {
      toast.error('Maximum 10 couleurs')
      return
    }
    setColorPalette([...colorPalette, '#000000'])
  }

  const updateColor = (index: number, value: string) => {
    const newPalette = [...colorPalette]
    newPalette[index] = value
    setColorPalette(newPalette)
  }

  const removeColor = (index: number) => {
    if (colorPalette.length === 1) {
      toast.error('Au moins une couleur est requise')
      return
    }
    setColorPalette(colorPalette.filter((_, i) => i !== index))
  }

  const uploadImages = async () => {
    const uploadedUrls: string[] = []

    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop()
      const fileName = `moodboard-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${profile?.company_id}/moodboards/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('photos').getPublicUrl(filePath)

      uploadedUrls.push(publicUrl)
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      toast.error('Le nom est obligatoire')
      return
    }

    setLoading(true)
    try {
      let allImages = moodboard?.images
        ? [...moodboard.images.filter((img: string) => imagePreviews.includes(img))]
        : []

      if (imageFiles.length > 0) {
        const newUrls = await uploadImages()
        allImages = [...allImages, ...newUrls]
      }

      const moodboardData = {
        name: formData.name,
        title: formData.name,
        description: formData.description || null,
        company_id: profile?.company_id,
        images: allImages,
        color_palette: colorPalette.filter((c) => c),
      }

      if (moodboard) {
        const { error } = await supabase
          .from('moodboards')
          .update(moodboardData)
          .eq('id', moodboard.id)

        if (error) throw error
        toast.success('Moodboard mis à jour')
      } else {
        const { error } = await supabase.from('moodboards').insert([moodboardData])

        if (error) throw error
        toast.success('Moodboard créé')
      }

      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      toast.error('Erreur lors de la sauvegarde')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '' })
    setImageFiles([])
    setImagePreviews([])
    setColorPalette(['#000000'])
  }

  const handleGenerateDescription = async () => {
    if (!formData.name && !formData.description && colorPalette.length === 0) {
      toast.error('Renseignez au moins le nom ou une couleur avant de générer.')
      return
    }

    setAiLoading(true)
    try {
      const projectData = {
        typeBien: formData.name || 'Moodboard intérieur',
        surface: undefined,
        ville: company?.city || '',
        pays: company?.country || '',
        styles: [],
        couleurs: colorPalette.join(', '),
        budget: undefined,
        devise: '€',
        pieces: [],
        clientName: company?.name || profile?.first_name || 'Client',
        contraintes: formData.description || '',
      }

      const res = await fetch('/api/moodboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectData }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erreur API moodboard')
      }

      const data = await res.json()
      if (!data?.moodboard) {
        throw new Error('Réponse inattendue de l’API moodboard')
      }

      setFormData((prev) => ({
        ...prev,
        description: data.moodboard,
      }))
      toast.success('Description générée avec l’IA.')
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Erreur lors de la génération du moodboard')
    } finally {
      setAiLoading(false)
    }
  }


  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen)
        if (!isOpen) resetForm()
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-gray-100 pb-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-3xl font-light">
              {moodboard ? 'Modifier le moodboard' : 'Créer un moodboard'}
            </DialogTitle>
            {company?.logo_url && (
              <img src={company.logo_url} alt={company.name} className="h-8 object-contain opacity-60" />
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 pt-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-light">Nom du moodboard *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Salon Contemporain"
                required
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="description" className="text-base font-light">
                  Description
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateDescription}
                  disabled={aiLoading}
                >
                  {aiLoading ? '✨ Génération...' : '✨ Générer la description'}
                </Button>
              </div>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez l'ambiance, le style, les inspirations..."
                rows={6}
                className="text-base"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-light">Images (max 20)</Label>
                <span className="text-sm text-gray-500">
                  {imagePreviews.length}/20
                </span>
              </div>
              <p className="text-sm text-gray-500 font-light">
                Uploadez vos photos d'inspiration ou un moodboard PDF créé sur Canva
              </p>
              <div className="grid grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square border-2 border-gray-200 rounded-xl overflow-hidden group">
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white hover:bg-gray-100"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {imagePreviews.length < 20 && (
                  <Label
                    htmlFor="images"
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-[#C5A572] transition-colors"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500">Ajouter</span>
                    <Input
                      id="images"
                      type="file"
                      accept="image/*,application/pdf"
                      multiple
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </Label>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-light">Palette de couleurs</Label>
                <Button type="button" variant="outline" size="sm" onClick={addColor}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              <div className="grid grid-cols-5 gap-4">
                {colorPalette.map((color, index) => (
                  <div key={index} className="space-y-2">
                    <div className="relative">
                      <Input
                        type="color"
                        value={color}
                        onChange={(e) => updateColor(index, e.target.value)}
                        className="h-20 w-full rounded-xl cursor-pointer"
                      />
                      {colorPalette.length > 1 && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          onClick={() => removeColor(index)}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white border-2 border-white"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="text-xs text-center text-gray-500 font-mono">
                      {color.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#C5A572] hover:bg-[#B39562] text-white px-8"
            >
              {loading ? 'Enregistrement...' : moodboard ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
