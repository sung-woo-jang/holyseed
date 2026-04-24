import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { type DateRangeFilter, type PriceHistoryItem } from '@/features/products/types';
import { Button } from '@/shared/ui';

interface PriceHistoryChartProps {
  data: PriceHistoryItem[];
}

const DATE_RANGE_OPTIONS: { value: DateRangeFilter; label: string }[] = [
  { value: '7days', label: '7일' },
  { value: '30days', label: '30일' },
  { value: '90days', label: '90일' },
  { value: 'all', label: '전체' },
];

export function PriceHistoryChart({ data }: PriceHistoryChartProps) {
  const [dateRange, setDateRange] = useState<DateRangeFilter>('30days');

  // 날짜 범위에 따른 데이터 필터링
  const filteredData = useMemo(() => {
    if (dateRange === 'all') return data;

    const now = new Date();
    const daysMap = {
      '7days': 7,
      '30days': 30,
      '90days': 90,
      'all': Infinity,
    };
    const days = daysMap[dateRange];
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return data.filter((item) => new Date(item.crawledAt) >= startDate);
  }, [data, dateRange]);

  // 차트 데이터 변환
  const chartData = useMemo(() => {
    return filteredData.map((item) => ({
      date: new Date(item.crawledAt).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      }),
      정상가: item.price,
      할인가: item.discountPrice || item.price,
    }));
  }, [filteredData]);

  return (
    <div className="space-y-4">
      {/* 날짜 필터 버튼 */}
      <div className="flex gap-2">
        {DATE_RANGE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            size="sm"
            variant={dateRange === option.value ? 'default' : 'outline'}
            onClick={() => setDateRange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* 차트 */}
      <div className="h-[400px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) =>
                  typeof value === 'number'
                    ? `${value.toLocaleString()}원`
                    : value
                }
                labelStyle={{ color: '#000' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="정상가"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="할인가"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            해당 기간 가격 이력이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
