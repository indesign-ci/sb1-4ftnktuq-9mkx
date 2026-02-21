// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'
import { PROPERTY_TYPES, DESIGN_STYLES, PROJECT_PHASES, DEFAULT_TASKS_BY_PHASE } from '@/lib/project-utils'

interface ProjectFormProps {
  project?: any
  onSuccess: () => void
  onCancel: () => void
}

export function ProjectForm({ project, onSuccess, onCancel }: ProjectFormProps) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState([])
  const [architects, setArchitects] = useState([])
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    address: '',
    city: '',
    postal_code: '',
    property_type: '',
    surface_area: '',
    style: '',
    budget_estimated: '',
    start_date: '',
    deadline: '',
    architect_id: '',
    description: '',
  })

  useEffect(() => {
    loadClients()
    loadArchitects()

    if (project) {
      setFormData({
        name: project.name || '',
        client_id: project.client_id || '',
        address: project.address || '',
        city: project.city || '',
        postal_code: project.postal_code || '',
        property_type: project.property_type || '',
        surface_area: project.surface_area || '',
        style: project.style || '',
        budget_estimated: project.budget_estimated || '',
        start_date: project.start_date || '',
        deadline: project.deadline || '',
        architect_id: project.architect_id || '',
        description: project.description || '',
      })
      if (project.cover_image_url) {
        setCoverPreview(project.cover_image_url)
      }
    }
  }, [project])

  const loadClients = async () => {
    if (!profile?.company_id) return

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .eq('company_id', profile.company_id)
        .order('last_name')

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  const loadArchitects = async () => {
    if (!profile?.company_id) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)

      if (error) throw error
      setArchitects(data || [])
    } catch (error) {
      console.error('Error loading architects:', error)
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La photo ne doit pas dépasser 5 Mo')
        return
      }
      setCoverFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadCover = async () => {
    if (!coverFile) return project?.cover_image_url

    const fileExt = coverFile.name.split('.').pop()
    const fileName = `cover-${Date.now()}.${fileExt}`
    const filePath = `${profile?.company_id}/projects/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filePath, coverFile)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filePath)

    return publicUrl
  }

  const createProjectPhasesAndTasks = async (projectId: string) => {
    try {
      for (const phase of PROJECT_PHASES) {
        const { data: phaseData, error: phaseError } = await supabase
          .from('project_phases')
          .insert({
            project_id: projectId,
            name: phase.name,
            order_number: phase.id,
            status: phase.id === 1 ? 'in_progress' : 'todo',
          })
          .select()
          .single()

        if (phaseError) throw phaseError

        const tasks = DEFAULT_TASKS_BY_PHASE[phase.id] || []
        const taskInserts = tasks.map((taskTitle, index) => ({
          project_id: projectId,
          phase: phase.key,
          title: taskTitle,
          status: 'todo',
          priority: 'medium',
          position: index,
        }))

        if (taskInserts.length > 0) {
          const { error: tasksError } = await supabase
            .from('tasks')
            .insert(taskInserts)

          if (tasksError) throw tasksError
        }
      }

      await supabase.from('project_history').insert({
        project_id: projectId,
        user_id: profile?.id,
        action_type: 'project_created',
        description: 'Projet créé',
        metadata: { project_name: formData.name },
      })
    } catch (error) {
      console.error('Error creating phases and tasks:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.client_id) {
      toast.error('Veuillez remplir les champs obligatoires')
      return
    }

    setLoading(true)
    try {
      let coverUrl = project?.cover_image_url

      if (coverFile) {
        coverUrl = await uploadCover()
      }

      const projectData = {
        company_id: profile?.company_id,
        name: formData.name,
        client_id: formData.client_id || null,
        address: formData.address || null,
        city: formData.city || null,
        postal_code: formData.postal_code || null,
        property_type: formData.property_type || null,
        surface_area: formData.surface_area ? parseFloat(formData.surface_area) : null,
        style: formData.style || null,
        budget_estimated: formData.budget_estimated ? parseFloat(formData.budget_estimated) : 0,
        budget_spent: project?.budget_spent ?? 0,
        start_date: formData.start_date || null,
        deadline: formData.deadline || null,
        architect_id: formData.architect_id || null,
        description: formData.description || null,
        cover_image_url: coverUrl || null,
        status: (project?.status && project.status !== 'active') ? project.status : 'in_progress',
        current_phase: project?.current_phase || 'brief',
        progress: project?.progress ?? 0,
        updated_at: new Date().toISOString(),
      }

      if (project) {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', project.id)

        if (error) throw error

        await supabase.from('project_history').insert({
          project_id: project.id,
          user_id: profile?.id,
          action_type: 'project_updated',
          description: 'Projet modifié',
          metadata: { project_name: formData.name },
        })

        toast.success('Projet mis à jour')
      } else {
        const { data: newProject, error } = await supabase
          .from('projects')
          .insert(projectData)
          .select()
          .single()

        if (error) throw error

        await createProjectPhasesAndTasks(newProject.id)

        toast.success('Projet créé avec succès')
      }

      onSuccess()
    } catch (error: any) {
      const message = error?.message || error?.error_description || 'Erreur lors de la sauvegarde'
      toast.error(message)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Photo de couverture</Label>
          {coverPreview ? (
            <div className="relative w-full h-48 border rounded-lg overflow-hidden">
              <img
                src={coverPreview}
                alt="Cover"
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => {
                  setCoverFile(null)
                  setCoverPreview(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-12 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <Label
                htmlFor="cover"
                className="cursor-pointer text-[#C5A572] hover:underline"
              >
                Choisir une photo
              </Label>
              <Input
                id="cover"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverChange}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="name">Nom du projet *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Rénovation Haussmannien Saint-Germain"
              required
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="client_id">Client *</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="address">Adresse du bien</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postal_code">Code postal</Label>
            <Input
              id="postal_code"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="property_type">Type de bien</Label>
            <Select
              value={formData.property_type}
              onValueChange={(value) => setFormData({ ...formData, property_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="surface_area">Surface (m²)</Label>
            <Input
              id="surface_area"
              type="number"
              value={formData.surface_area}
              onChange={(e) => setFormData({ ...formData, surface_area: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="style">Style</Label>
            <Select
              value={formData.style}
              onValueChange={(value) => setFormData({ ...formData, style: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {DESIGN_STYLES.map((style) => (
                  <SelectItem key={style} value={style}>
                    {style}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget_estimated">Budget prévisionnel (FCFA)</Label>
            <Input
              id="budget_estimated"
              type="number"
              value={formData.budget_estimated}
              onChange={(e) => setFormData({ ...formData, budget_estimated: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date">Date de début</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Date de livraison prévue</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="architect_id">Architecte assigné</Label>
            <Select
              value={formData.architect_id}
              onValueChange={(value) => setFormData({ ...formData, architect_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {architects.map((architect) => (
                  <SelectItem key={architect.id} value={architect.id}>
                    {architect.first_name} {architect.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="description">Description / Notes</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-[#C5A572] hover:bg-[#B39562] text-white"
        >
          {loading ? 'Enregistrement...' : project ? 'Modifier' : 'Créer le projet'}
        </Button>
      </div>
    </form>
  )
}
