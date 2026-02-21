'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

type Project = {
  id: string
  name: string
  status?: string
  address?: string
  description?: string
}

export default function ClientProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useAuth()
  const projectId = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status, address, description')
        .eq('id', projectId)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      setProject(data || null)
    } catch (e) {
      console.error(e)
      toast.error('Projet introuvable')
      router.push('/client')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Chargement...</p>
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/client" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour à l&apos;espace client
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{project.name}</CardTitle>
          {project.status && (
            <p className="text-sm font-normal text-gray-500 capitalize">
              Statut : {project.status}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {project.address && (
            <p className="text-sm text-gray-600">
              <strong>Adresse :</strong> {project.address}
            </p>
          )}
          {project.description && (
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {project.description}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
