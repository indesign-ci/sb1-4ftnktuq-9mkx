'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Receipt, FolderKanban, FileText, AlertCircle } from 'lucide-react'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { ProjectsDonut } from '@/components/dashboard/projects-donut'
import { RecentProjects } from '@/components/dashboard/recent-projects'
import { ActivityTimeline } from '@/components/dashboard/activity-timeline'
import { UpcomingEvents } from '@/components/dashboard/upcoming-events'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { toast } from 'sonner'

interface DashboardData {
  currentMonthRevenue: number
  previousMonthRevenue: number
  activeProjectsCount: number
  averageProjectProgress: number
  pendingQuotesCount: number
  pendingQuotesAmount: number
  overdueInvoicesCount: number
  overdueInvoicesAmount: number
  monthlyRevenue: Array<{ month: string; revenue: number }>
  projectsByStatus: Array<{ name: string; value: number; color: string }>
  recentProjects: Array<any>
  recentActivities: Array<any>
  upcomingEvents: Array<any>
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth()
      const firstDayCurrentMonth = new Date(currentYear, currentMonth, 1).toISOString()
      const firstDayNextMonth = new Date(currentYear, currentMonth + 1, 1).toISOString()
      const firstDayPreviousMonth = new Date(currentYear, currentMonth - 1, 1).toISOString()

      // Build queries conditionally based on profile existence
      let invoicesQuery = supabase.from('invoices').select('*')
      let projectsQuery = supabase.from('projects').select('*, clients(first_name, last_name)').is('deleted_at', null)
      let quotesQuery = supabase.from('quotes').select('*').eq('status', 'sent')
      let eventsQuery = supabase.from('events').select('*, clients(first_name, last_name)').gte('start_datetime', now.toISOString()).order('start_datetime', { ascending: true }).limit(5)

      if (profile?.company_id) {
        invoicesQuery = invoicesQuery.eq('company_id', profile.company_id)
        projectsQuery = projectsQuery.eq('company_id', profile.company_id)
        quotesQuery = quotesQuery.eq('company_id', profile.company_id)
        eventsQuery = eventsQuery.eq('company_id', profile.company_id)
      }

      const [
        invoicesResult,
        projectsResult,
        quotesResult,
        eventsResult,
      ] = await Promise.all([
        invoicesQuery,
        projectsQuery,
        quotesQuery,
        eventsQuery,
      ])

      const invoices = (invoicesResult.data || []) as Array<{ status?: string; updated_at?: string; total_ttc?: number; due_date?: string; [key: string]: unknown }>
      const projects = (projectsResult.data || []) as Array<{ status?: string; progress?: number; [key: string]: unknown }>
      const quotes = (quotesResult.data || []) as Array<{ total_ttc?: number; [key: string]: unknown }>
      const events = eventsResult.data || []

      const paidInvoices = invoices.filter(inv => inv.status === 'paid')
      const currentMonthRevenue = paidInvoices
        .filter(inv => {
          const paidDate = inv.updated_at
          return paidDate >= firstDayCurrentMonth && paidDate < firstDayNextMonth
        })
        .reduce((sum, inv) => sum + (inv.total_ttc || 0), 0)

      const previousMonthRevenue = paidInvoices
        .filter(inv => {
          const paidDate = inv.updated_at
          return paidDate >= firstDayPreviousMonth && paidDate < firstDayCurrentMonth
        })
        .reduce((sum, inv) => sum + (inv.total_ttc || 0), 0)

      const activeProjects = projects.filter(p => p.status === 'in_progress')
      const averageProgress = activeProjects.length > 0
        ? activeProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / activeProjects.length
        : 0

      const pendingQuotesAmount = quotes.reduce((sum, q) => sum + (q.total_ttc || 0), 0)

      const overdueInvoices = invoices.filter(inv =>
        inv.status !== 'paid' &&
        inv.due_date &&
        new Date(inv.due_date) < now
      )
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.total_ttc || 0), 0)

      const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
        const monthStart = new Date(currentYear, i, 1).toISOString()
        const monthEnd = new Date(currentYear, i + 1, 1).toISOString()
        const revenue = paidInvoices
          .filter(inv => {
            const paidDate = inv.updated_at
            return paidDate >= monthStart && paidDate < monthEnd
          })
          .reduce((sum, inv) => sum + (inv.total_ttc || 0), 0)

        return {
          month: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][i],
          revenue,
        }
      })

      const statusMap: Record<string, { name: string; color: string }> = {
        in_progress: { name: 'En cours', color: '#C5A572' },
        on_hold: { name: 'En pause', color: '#f97316' },
        completed: { name: 'Terminé', color: '#22c55e' },
        pending: { name: 'En attente', color: '#9ca3af' },
      }

      const projectsByStatus: Array<{ name: string; value: number; color: string }> = Object.entries(
        projects.reduce((acc, p) => {
          acc[p.status ?? ''] = (acc[p.status ?? ''] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      ).map(([status, count]) => ({
        name: statusMap[status]?.name || status,
        value: count,
        color: statusMap[status]?.color || '#9ca3af',
      }))

      const recentProjects = projects
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          name: p.name,
          client_name: p.clients ? `${p.clients.first_name} ${p.clients.last_name}` : 'Client inconnu',
          current_phase: p.current_phase || 'Non défini',
          progress: p.progress || 0,
          budget: p.budget || 0,
        }))

      const recentActivities = [
        ...quotes.slice(0, 3).map(q => ({
          id: q.id,
          type: 'quote' as const,
          description: `Devis ${q.quote_number} envoyé`,
          created_at: q.created_at,
        })),
        ...invoices.filter(i => i.status === 'paid').slice(0, 3).map(i => ({
          id: i.id,
          type: 'payment' as const,
          description: `Paiement de ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(i.total_ttc)} reçu`,
          created_at: i.updated_at,
        })),
        ...projects.slice(0, 2).map(p => ({
          id: p.id,
          type: 'project' as const,
          description: `Projet ${p.name} mis à jour`,
          created_at: p.updated_at,
        })),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)

      const upcomingEvents = events.map(e => ({
        id: e.id,
        title: e.title,
        start_date: e.start_datetime,
        location: e.location,
        client_name: e.clients ? `${e.clients.first_name} ${e.clients.last_name}` : undefined,
        event_type: e.event_type,
      }))

      setData({
        currentMonthRevenue,
        previousMonthRevenue,
        activeProjectsCount: activeProjects.length,
        averageProjectProgress: Math.round(averageProgress),
        pendingQuotesCount: quotes.length,
        pendingQuotesAmount,
        overdueInvoicesCount: overdueInvoices.length,
        overdueInvoicesAmount: overdueAmount,
        monthlyRevenue,
        projectsByStatus,
        recentProjects,
        recentActivities,
        upcomingEvents,
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Impossible de charger le tableau de bord')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#C5A572]" />
      </div>
    )
  }

  if (!data) return null

  const revenueChange = calculatePercentageChange(
    data.currentMonthRevenue,
    data.previousMonthRevenue
  )

  const kpis = [
    {
      title: 'CA du mois',
      value: formatCurrency(data.currentMonthRevenue),
      change: `${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}%`,
      trend: revenueChange >= 0 ? 'up' : 'down',
      icon: Receipt,
      iconColor: 'text-gold-600',
      iconBgColor: 'bg-gold-100',
    },
    {
      title: 'Projets en cours',
      value: data.activeProjectsCount,
      change: `${data.averageProjectProgress}% en moyenne`,
      trend: 'neutral' as const,
      icon: FolderKanban,
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-100',
    },
    {
      title: 'Devis en attente',
      value: data.pendingQuotesCount,
      change: formatCurrency(data.pendingQuotesAmount),
      trend: 'neutral' as const,
      icon: FileText,
      iconColor: 'text-orange-600',
      iconBgColor: 'bg-orange-100',
    },
    {
      title: 'Factures en retard',
      value: data.overdueInvoicesCount,
      change: formatCurrency(data.overdueInvoicesAmount),
      trend: data.overdueInvoicesCount > 0 ? 'down' : 'neutral',
      icon: AlertCircle,
      iconColor: 'text-red-600',
      iconBgColor: 'bg-red-100',
    },
  ]

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-serif text-anthracite-800">
            Bonjour, Sophie 👋
          </h1>
          <p className="text-gray-500">Voici un résumé de votre activité</p>
        </div>
        <p className="text-xs text-gray-500 capitalize sm:text-sm">
          {currentDate}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <KpiCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            trend={kpi.trend as 'up' | 'down' | 'neutral'}
            icon={kpi.icon}
            iconColor={kpi.iconColor}
            iconBgColor={kpi.iconBgColor}
            delay={index * 100}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart data={data.monthlyRevenue} />
        <ProjectsDonut data={data.projectsByStatus} />
      </div>

      <RecentProjects projects={data.recentProjects} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityTimeline activities={data.recentActivities} />
        <UpcomingEvents events={data.upcomingEvents} />
      </div>
    </div>
  )
}
