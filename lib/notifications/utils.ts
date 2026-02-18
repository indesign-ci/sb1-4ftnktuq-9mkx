import { supabase } from '@/lib/supabase/client'
import type { CreateNotificationParams, Notification } from './types'

export async function createNotification(params: CreateNotificationParams): Promise<Notification | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        metadata: params.metadata,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)

    if (error) {
      console.error('Error marking notification as read:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return false
  }
}

export async function markAllAsRead(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      console.error('Error marking all notifications as read:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return false
  }
}

export async function deleteOldNotifications(daysOld: number = 30): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .lt('created_at', cutoffDate.toISOString())
      .select()

    if (error) {
      console.error('Error deleting old notifications:', error)
      return 0
    }

    return data?.length || 0
  } catch (error) {
    console.error('Error deleting old notifications:', error)
    return 0
  }
}

export function getRelativeTime(date: string): string {
  const now = new Date()
  const notifDate = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - notifDate.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'À l\'instant'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} min`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `Il y a ${diffInHours}h`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) {
    return 'Hier'
  }

  if (diffInDays < 7) {
    return `Il y a ${diffInDays} jours`
  }

  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7)
    return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`
  }

  const months = Math.floor(diffInDays / 30)
  return `Il y a ${months} mois`
}
