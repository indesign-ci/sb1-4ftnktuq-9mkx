'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, User, Users, Tag, Palette } from 'lucide-react'
import { CompanySettings } from '@/components/settings/company-settings'
import { ProfileSettings } from '@/components/settings/profile-settings'
import { TeamSettings } from '@/components/settings/team-settings'
import { CategoriesSettings } from '@/components/settings/categories-settings'
import { AppearanceSettings } from '@/components/settings/appearance-settings'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company')

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-light text-anthracite-800">Paramètres</h1>
        <p className="text-gray-600 mt-1">Configuration de l'application</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-white border border-gray-200">
          <TabsTrigger value="company" className="flex items-center gap-2 data-[state=active]:bg-gold-50 data-[state=active]:text-gold-600">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Mon entreprise</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-gold-50 data-[state=active]:text-gold-600">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Mon profil</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2 data-[state=active]:bg-gold-50 data-[state=active]:text-gold-600">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Équipe</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2 data-[state=active]:bg-gold-50 data-[state=active]:text-gold-600">
            <Tag className="h-4 w-4" />
            <span className="hidden sm:inline">Catégories</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2 data-[state=active]:bg-gold-50 data-[state=active]:text-gold-600">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Apparence</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <CompanySettings />
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <TeamSettings />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoriesSettings />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <AppearanceSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
