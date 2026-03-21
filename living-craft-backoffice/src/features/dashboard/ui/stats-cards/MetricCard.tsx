import { cn } from '@/shared/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  progress?: number
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  progress,
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <Icon className='text-muted-foreground size-4' />
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        {description && (
          <p className='text-muted-foreground text-xs'>{description}</p>
        )}
        {trend && (
          <div className='mt-2 flex items-center text-xs'>
            {trend.isPositive ? (
              <TrendingUp className='mr-1 size-3 text-green-500' />
            ) : (
              <TrendingDown className='mr-1 size-3 text-red-500' />
            )}
            <span
              className={cn(
                trend.isPositive ? 'text-green-500' : 'text-red-500'
              )}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
            <span className='text-muted-foreground ml-1'>vs 이전 기간</span>
          </div>
        )}
        {progress !== undefined && (
          <div className='mt-2'>
            <div className='bg-secondary h-2 w-full overflow-hidden rounded-full'>
              <div
                className='bg-primary h-full transition-all'
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
