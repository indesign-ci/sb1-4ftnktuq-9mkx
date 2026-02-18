'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Palette, Type, Image as ImageIcon } from 'lucide-react'

const COLOR_PRESETS = [
  { name: 'Or classique', value: '#C5A572', description: 'Élégant et raffiné' },
  { name: 'Noir élégant', value: '#1A1A1A', description: 'Minimaliste et moderne' },
  { name: 'Bleu marine', value: '#1E3A5F', description: 'Professionnel et serein' },
  { name: 'Vert sauge', value: '#7C9082', description: 'Naturel et apaisant' },
  { name: 'Terracotta', value: '#C67B5C', description: 'Chaleureux et authentique' },
  { name: 'Bordeaux', value: '#722F37', description: 'Luxueux et sophistiqué' },
]

const HEADING_FONTS = [
  { name: 'Playfair Display', value: 'Playfair Display', description: 'Serif élégant (défaut)' },
  { name: 'Cormorant Garamond', value: 'Cormorant Garamond', description: 'Serif classique' },
  { name: 'Lora', value: 'Lora', description: 'Serif moderne' },
  { name: 'Montserrat', value: 'Montserrat', description: 'Sans-serif géométrique' },
  { name: 'Raleway', value: 'Raleway', description: 'Sans-serif élégant' },
]

const BODY_FONTS = [
  { name: 'Inter', value: 'Inter', description: 'Sans-serif moderne (défaut)' },
  { name: 'Work Sans', value: 'Work Sans', description: 'Sans-serif géométrique' },
  { name: 'Source Sans 3', value: 'Source Sans 3', description: 'Sans-serif classique' },
  { name: 'Nunito Sans', value: 'Nunito Sans', description: 'Sans-serif arrondi' },
]

const LOGIN_IMAGES = [
  {
    name: 'Salon contemporain luxueux',
    url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1920&q=80',
  },
  {
    name: 'Chambre design épurée',
    url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1920&q=80',
  },
  {
    name: 'Cuisine moderne marbre',
    url: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1920&q=80',
  },
  {
    name: 'Salle de bain spa',
    url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1920&q=80',
  },
  {
    name: 'Bureau élégant',
    url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1920&q=80',
  },
]

export function AppearanceSettings() {
  const [selectedColor, setSelectedColor] = useState('#C5A572')
  const [selectedHeadingFont, setSelectedHeadingFont] = useState('Playfair Display')
  const [selectedBodyFont, setSelectedBodyFont] = useState('Inter')
  const [selectedImage, setSelectedImage] = useState(LOGIN_IMAGES[0].url)

  const handleSave = () => {
    toast.success('Préférences sauvegardées avec succès')
  }

  const handleReset = () => {
    setSelectedColor('#C5A572')
    setSelectedHeadingFont('Playfair Display')
    setSelectedBodyFont('Inter')
    setSelectedImage(LOGIN_IMAGES[0].url)
    toast.info('Paramètres réinitialisés par défaut')
  }

  return (
    <div className="space-y-6">
      {/* Primary Color */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-gold-500" />
            <CardTitle>Couleur principale</CardTitle>
          </div>
          <CardDescription>
            Choisissez la couleur d'accent qui sera utilisée dans toute l'application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setSelectedColor(preset.value)}
                className={`
                  group relative p-4 rounded-lg border-2 transition-all hover:shadow-md
                  ${selectedColor === preset.value ? 'border-gold-500 bg-gold-50' : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: preset.value }}
                  />
                  <div className="text-left">
                    <p className="font-medium text-sm">{preset.name}</p>
                    <p className="text-xs text-gray-500">{preset.description}</p>
                  </div>
                </div>
                {selectedColor === preset.value && (
                  <Badge className="absolute top-2 right-2">Sélectionné</Badge>
                )}
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="p-6 bg-gray-50 rounded-lg border">
            <p className="text-sm text-gray-600 mb-4">Aperçu en temps réel</p>
            <div className="flex gap-3">
              <Button
                style={{ backgroundColor: selectedColor, borderColor: selectedColor }}
                className="shadow-md"
              >
                Bouton principal
              </Button>
              <Badge
                style={{ backgroundColor: `${selectedColor}20`, color: selectedColor }}
              >
                Badge accent
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fonts */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-gold-500" />
            <CardTitle>Typographie</CardTitle>
          </div>
          <CardDescription>
            Personnalisez les polices de caractères de l'application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Heading Font */}
          <div className="space-y-3">
            <Label>Police des titres</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {HEADING_FONTS.map((font) => (
                <button
                  key={font.value}
                  onClick={() => setSelectedHeadingFont(font.value)}
                  className={`
                    text-left p-4 rounded-lg border-2 transition-all hover:shadow-md
                    ${selectedHeadingFont === font.value ? 'border-gold-500 bg-gold-50' : 'border-gray-200 hover:border-gray-300'}
                  `}
                >
                  <p
                    className="text-lg font-semibold mb-1"
                    style={{ fontFamily: font.value }}
                  >
                    {font.name}
                  </p>
                  <p className="text-xs text-gray-500">{font.description}</p>
                </button>
              ))}
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p
                className="text-2xl font-semibold"
                style={{ fontFamily: selectedHeadingFont }}
              >
                Rénovation Haussmannien
              </p>
            </div>
          </div>

          {/* Body Font */}
          <div className="space-y-3">
            <Label>Police du corps de texte</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {BODY_FONTS.map((font) => (
                <button
                  key={font.value}
                  onClick={() => setSelectedBodyFont(font.value)}
                  className={`
                    text-left p-4 rounded-lg border-2 transition-all hover:shadow-md
                    ${selectedBodyFont === font.value ? 'border-gold-500 bg-gold-50' : 'border-gray-200 hover:border-gray-300'}
                  `}
                >
                  <p
                    className="font-semibold mb-1"
                    style={{ fontFamily: font.value }}
                  >
                    {font.name}
                  </p>
                  <p className="text-xs text-gray-500">{font.description}</p>
                </button>
              ))}
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p
                className="text-sm"
                style={{ fontFamily: selectedBodyFont }}
              >
                Ce projet de rénovation d'un appartement haussmannien allie tradition
                et modernité. Les moulures d'origine ont été restaurées avec soin.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Login Image */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-gold-500" />
            <CardTitle>Image de connexion</CardTitle>
          </div>
          <CardDescription>
            Choisissez l'image affichée sur la page de connexion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LOGIN_IMAGES.map((image) => (
              <button
                key={image.url}
                onClick={() => setSelectedImage(image.url)}
                className={`
                  group relative rounded-lg overflow-hidden border-4 transition-all hover:shadow-lg
                  ${selectedImage === image.url ? 'border-gold-500' : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <div className="aspect-video relative">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <p className="absolute bottom-2 left-2 right-2 text-white text-sm font-medium">
                    {image.name}
                  </p>
                </div>
                {selectedImage === image.url && (
                  <Badge className="absolute top-2 right-2">Sélectionné</Badge>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={handleReset}>
          Réinitialiser par défaut
        </Button>
        <Button onClick={handleSave}>
          Sauvegarder les préférences
        </Button>
      </div>
    </div>
  )
}
