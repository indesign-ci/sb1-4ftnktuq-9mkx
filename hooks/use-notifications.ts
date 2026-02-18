'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Bell,
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  FileText,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'

export function getNotificationIcon(type: string): LucideIcon {
  const map: Record<string, LucideIcon> = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle,
    document: FileText,
    message: MessageSquare,
    default: Bell,
  }
  return map[type] ?? map.default
}

export function getNotificationColor(type: string): string {
  const map: Record<string, string> = {
    info: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-amber-500',
    error: 'text-red-500',
    document: 'text-violet-500',
    message: 'text-sky-500',
    default: 'text-gray-500',
  }
  return map[type] ?? map.default
}

export interface Notification {
  id: string
  user_id: string | null
  type: string
  title: string
  message: string
  is_read: boolean
  link: string | null
  metadata: Record<string, unknown>
  created_at: string
  read_at: string | null
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        toast.error('Erreur lors du chargement des notifications')
        setNotifications([])
        setUnreadCount(0)
        return
      }

      setNotifications(data || [])
      setUnreadCount((data || []).filter((n: Notification) => !n.is_read).length)
    } catch {
      toast.error('Erreur lors du chargement des notifications')
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id)

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error:', err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('is_read', false)

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error:', err)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = payload.new as Notification
          setNotifications(prev => [newNotif, ...prev])
          if (!newNotif.is_read) setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchNotifications])

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchNotifications }
}
