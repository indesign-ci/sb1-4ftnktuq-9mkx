'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  DollarSign,
  UserPlus,
  FolderKanban,
  Calendar,
  Receipt,
  Send
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Activity {
  id: string
  type: 'quote' | 'payment' | 'client' | 'project' | 'event' | 'invoice'
  description: string
  created_at: string
}

interface ActivityTimelineProps {
  activities: Activity[]
}

const iconMap = {
  quote: Send,
  payment: DollarSign,
  client: UserPlus,
  project: FolderKanban,
  event: Calendar,
  invoice: Receipt,
}

const colorMap = {
  quote: 'text-blue-600 bg-blue-50',
  payment: 'text-green-600 bg-green-50',
  client: 'text-purple-600 bg-purple-50',
  project: 'text-[#C5A572] bg-amber-50',
  event: 'text-orange-600 bg-orange-50',
  invoice: 'text-gray-600 bg-gray-50',
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 text-center py-8">
            Aucune activité récente
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité récente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = iconMap[activity.type]
            const colorClass = colorMap[activity.type]

            return (
              <div key={activity.id} className="flex gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${colorClass} flex items-center justify-center`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
