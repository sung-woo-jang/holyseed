import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface TimeDistributionProps {
  labels: string[]
  data: number[]
}

export function TimeDistribution({ labels, data }: TimeDistributionProps) {
  const chartData = labels.map((label, index) => ({
    time: label,
    count: data[index],
  }))

  return (
    <Card className='col-span-4 lg:col-span-2'>
      <CardHeader>
        <CardTitle>시간대별 분포</CardTitle>
        <CardDescription>시간대별 예약 선호도</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis
              dataKey='time'
              stroke='#888888'
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke='#888888'
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip />
            <Bar
              dataKey='count'
              fill='hsl(var(--primary))'
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
