import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/ui/card'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'

interface ServiceDistributionProps {
  labels: string[]
  data: number[]
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
]

export function ServiceDistribution({
  labels,
  data,
}: ServiceDistributionProps) {
  const chartData = labels.map((label, index) => ({
    name: label,
    value: data[index],
  }))

  return (
    <Card className='col-span-4 lg:col-span-2'>
      <CardHeader>
        <CardTitle>서비스별 분포</CardTitle>
        <CardDescription>서비스 종류별 예약 비율</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx='50%'
              cy='50%'
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
              }
              outerRadius={80}
              fill='#8884d8'
              dataKey='value'
            >
              {chartData.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
