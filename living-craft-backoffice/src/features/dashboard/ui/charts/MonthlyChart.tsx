import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface MonthlyChartProps {
  labels: string[]
  data: number[]
}

export function MonthlyChart({ labels, data }: MonthlyChartProps) {
  const chartData = labels.map((label, index) => ({
    month: label,
    count: data[index],
  }))

  return (
    <Card className='col-span-4'>
      <CardHeader>
        <CardTitle>월별 예약 추이</CardTitle>
        <CardDescription>최근 12개월간 예약 건수</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis
              dataKey='month'
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
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip />
            <Line
              type='monotone'
              dataKey='count'
              stroke='hsl(var(--primary))'
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
