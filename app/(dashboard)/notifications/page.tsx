'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Check, Trash2, Bell } from 'lucide-react'
import { useNotifications, getNotificationIcon, getNotificationColor, type Notification } from '@/hooks/use-notifications'
import { getRelativeTime, deleteOldNotifications } from '@/lib/notifications/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refetch } = useNotifications()
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread' && notification.is_read) return false
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false
    return true
  })

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }

    if (notification.link) {
      router.push(notification.link)
    }
  }

  const handleDeleteOld = async () => {
    const deletedCount = await deleteOldNotifications(30)
    if (deletedCount > 0) {
      toast.success(`${deletedCount} notification(s) supprimée(s)`)
      refetch()
    } else {
      toast.info('Aucune notification ancienne à supprimer')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Toutes les notifications sont lues'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer anciennes
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer les anciennes notifications</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action supprimera toutes les notifications de plus de 30 jours.
                  Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteOld}>
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              className="bg-[#C5A572] hover:bg-[#B09562]"
              size="sm"
            >
              <Check className="h-4 w-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Select value={filter} onValueChange={(value: 'all' | 'unread') => setFilter(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="unread">Non lues</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="new_prospect">Nouveaux prospects</SelectItem>
            <SelectItem value="quote_accepted">Devis acceptés</SelectItem>
            <SelectItem value="quote_expired">Devis expirés</SelectItem>
            <SelectItem value="payment_received">Paiements reçus</SelectItem>
            <SelectItem value="invoice_overdue">Factures en retard</SelectItem>
            <SelectItem value="deadline_approaching">Échéances proches</SelectItem>
            <SelectItem value="task_assigned">Tâches assignées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Aucune notification
            </p>
            <p className="text-gray-600">
              {filter === 'unread'
                ? 'Vous avez lu toutes vos notifications'
                : 'Vous n\'avez aucune notification pour le moment'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type)
            const color = getNotificationColor(notification.type)

            return (
              <Card
                key={notification.id}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-gray-50',
                  !notification.is_read && 'border-l-4 border-l-blue-500 bg-blue-50'
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="flex items-start gap-4 p-4">
                  <div className={cn('mt-1', color)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        <p className="text-gray-700 mt-1">{notification.message}</p>
                      </div>
                      {!notification.is_read && (
                        <Badge variant="default" className="bg-blue-600 text-white">
                          Nouveau
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {getRelativeTime(notification.created_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
