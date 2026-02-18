'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: LucideIcon
  iconColor?: string
  iconBgColor?: string
  delay?: number
}

export function KpiCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  iconColor = 'text-gold-500',
  iconBgColor = 'bg-gold-100',
  delay = 0,
}: KpiCardProps) {
  const [displayValue, setDisplayValue] = useState<string>('0')
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true)
      if (typeof value === 'number') {
        animateNumber(value)
      } else {
        setDisplayValue(value)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  const animateNumber = (target: number) => {
    const duration = 1500
    const steps = 60
    const stepValue = target / steps
    let current = 0

    const interval = setInterval(() => {
      current += stepValue
      if (current >= target) {
        current = target
        clearInterval(interval)
      }
      setDisplayValue(Math.round(current).toLocaleString('fr-FR'))
    }, duration / steps)
  }

  return (
    <Card
      className={cn(
        'rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
        isAnimating ? 'animate-fade-in' : 'opacity-0'
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              {title}
            </p>
            <p className="text-3xl font-bold font-heading text-anthracite-800 mb-2">
              {displayValue}
            </p>
            {change && (
              <div className="flex items-center gap-1.5">
                {trend === 'up' && (
                  <div className="flex items-center text-green-600 text-sm font-medium">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {change}
                  </div>
                )}
                {trend === 'down' && (
                  <div className="flex items-center text-red-600 text-sm font-medium">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    {change}
                  </div>
                )}
                {trend === 'neutral' && (
                  <div className="text-sm text-gray-600">{change}</div>
                )}
              </div>
            )}
          </div>
          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-xl',
              iconBgColor
            )}
          >
            <Icon className={cn('w-6 h-6', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
