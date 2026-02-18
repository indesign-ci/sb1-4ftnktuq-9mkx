export type NotificationType =
  | 'new_prospect'
  | 'quote_accepted'
  | 'quote_expired'
  | 'payment_received'
  | 'invoice_overdue'
  | 'deadline_approaching'
  | 'task_assigned'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  link?: string
  metadata?: Record<string, any>
  created_at: string
  read_at?: string
}

export interface CreateNotificationParams {
  type: NotificationType
  title: string
  message: string
  link?: string
  metadata?: Record<string, any>
}
