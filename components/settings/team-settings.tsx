// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { UserPlus, Mail, Pencil, Trash2, Shield, User } from 'lucide-react'

const roles = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'architect', label: 'Architecte' },
  { value: 'assistant', label: 'Assistant' },
  { value: 'accountant', label: 'Comptable' },
  { value: 'user', label: 'Utilisateur' },
]

export function TeamSettings() {
  const { profile, isAdmin, loading: authLoading } = useAuth()
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)

  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'user',
  })
  const [createData, setCreateData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'user',
  })

  useEffect(() => {
    loadMembers()
  }, [profile?.company_id])

  const loadMembers = async () => {
    if (!profile?.company_id) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
        .order('created_at')

      if (error) throw error
      setMembers(data || [])
    } catch (error: any) {
      toast.error('Erreur lors du chargement de l\'équipe')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inviteData.email) {
      toast.error('Veuillez saisir un email')
      return
    }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Session expirée. Reconnectez-vous.')
        setLoading(false)
        return
      }

      const res = await fetch('/api/invite-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: inviteData.email.trim(),
          role: inviteData.role,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error || 'Erreur lors de l\'invitation')
        return
      }
      toast.success(json.message || 'Invitation envoyée')
      setIsInviteOpen(false)
      setInviteData({ email: '', role: 'user' })
      loadMembers()
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de l\'invitation')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createData.email || !createData.password || createData.password.length < 6) {
      toast.error('Email et mot de passe (min. 6 caractères) requis.')
      return
    }
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Session expirée. Reconnectez-vous.')
        setLoading(false)
        return
      }
      const res = await fetch('/api/create-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: createData.email.trim(),
          password: createData.password,
          role: createData.role,
          first_name: createData.first_name.trim() || undefined,
          last_name: createData.last_name.trim() || undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error || 'Erreur lors de la création du compte')
        setLoading(false)
        return
      }
      toast.success(json.message || 'Utilisateur créé.')
      setIsCreateOpen(false)
      setCreateData({ email: '', password: '', first_name: '', last_name: '', role: 'user' })
      loadMembers()
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedMember) return

    if (selectedMember.id === profile?.id) {
      toast.error('Vous ne pouvez pas modifier votre propre rôle')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedMember.role })
        .eq('id', selectedMember.id)

      if (error) throw error

      toast.success('Rôle mis à jour')
      setIsEditOpen(false)
      setSelectedMember(null)
      loadMembers()
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (member: any) => {
    if (member.id === profile?.id) {
      toast.error('Vous ne pouvez pas supprimer votre propre compte')
      return
    }

    if (!confirm(`Êtes-vous sûr de vouloir retirer ${member.first_name} ${member.last_name} de l'équipe ?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', member.id)

      if (error) throw error

      toast.success('Membre retiré de l\'équipe')
      loadMembers()
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la suppression')
    }
  }

  const getRoleLabel = (role: string) => {
    return roles.find((r) => r.value === role)?.label || role
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'architect':
        return 'bg-blue-100 text-blue-800'
      case 'accountant':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (authLoading || !profile) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A572] mx-auto" />
        </CardContent>
      </Card>
    )
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Seuls les administrateurs peuvent gérer l'équipe
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Équipe</CardTitle>
              <CardDescription>
                Gérer les membres de votre équipe
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(true)}
                className="border-[#C5A572] text-[#C5A572] hover:bg-[#C5A572]/10"
              >
                <User className="mr-2 h-4 w-4" />
                Créer un utilisateur
              </Button>
              <Button
                onClick={() => setIsInviteOpen(true)}
                className="bg-[#C5A572] hover:bg-[#B39562] text-white"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Inviter un membre
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A572] mx-auto"></div>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun membre dans l'équipe
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar>
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback className="bg-[#C5A572] text-white">
                        {member.first_name?.[0]}{member.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {member.first_name} {member.last_name}
                        {member.id === profile?.id && (
                          <span className="text-xs text-gray-500 ml-2">(Vous)</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <p className="text-sm text-gray-600 truncate">{member.email}</p>
                      </div>
                    </div>
                    <Badge className={getRoleBadgeColor(member.role)}>
                      {getRoleLabel(member.role)}
                    </Badge>
                  </div>

                  {member.id !== profile?.id && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedMember(member)
                          setIsEditOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(member)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inviter un membre</DialogTitle>
            <DialogDescription>
              Un email d'invitation sera envoyé à cette adresse
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite_email">Email *</Label>
              <Input
                id="invite_email"
                type="email"
                value={inviteData.email}
                onChange={(e) =>
                  setInviteData({ ...inviteData, email: e.target.value })
                }
                placeholder="nom@exemple.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite_role">Rôle *</Label>
              <Select
                value={inviteData.role}
                onValueChange={(value) =>
                  setInviteData({ ...inviteData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#C5A572] hover:bg-[#B39562] text-white"
              >
                {loading ? 'Envoi...' : 'Envoyer l\'invitation'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un utilisateur</DialogTitle>
            <DialogDescription>
              Créez un compte directement. L&apos;utilisateur pourra se connecter avec cet email et le mot de passe que vous définissez.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create_first_name">Prénom</Label>
                <Input
                  id="create_first_name"
                  value={createData.first_name}
                  onChange={(e) => setCreateData({ ...createData, first_name: e.target.value })}
                  placeholder="Jean"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_last_name">Nom</Label>
                <Input
                  id="create_last_name"
                  value={createData.last_name}
                  onChange={(e) => setCreateData({ ...createData, last_name: e.target.value })}
                  placeholder="Dupont"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_email">Email *</Label>
              <Input
                id="create_email"
                type="email"
                value={createData.email}
                onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                placeholder="nom@exemple.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_password">Mot de passe (min. 6 caractères) *</Label>
              <Input
                id="create_password"
                type="password"
                value={createData.password}
                onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_role">Rôle *</Label>
              <Select
                value={createData.role}
                onValueChange={(value) => setCreateData({ ...createData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#C5A572] hover:bg-[#B39562] text-white"
              >
                {loading ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>
              Modifier le rôle de {selectedMember?.first_name} {selectedMember?.last_name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateRole} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_role">Rôle *</Label>
              <Select
                value={selectedMember?.role}
                onValueChange={(value) =>
                  setSelectedMember({ ...selectedMember, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditOpen(false)
                  setSelectedMember(null)
                }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#C5A572] hover:bg-[#B39562] text-white"
              >
                {loading ? 'Modification...' : 'Modifier'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
