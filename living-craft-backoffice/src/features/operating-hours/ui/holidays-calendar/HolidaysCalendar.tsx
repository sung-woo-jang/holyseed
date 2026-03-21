import type { Holiday } from '@/shared/types/api'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Plus, Trash2 } from 'lucide-react'
import { useDeleteHoliday } from '@/features/operating-hours/api'

interface HolidaysCalendarProps {
  holidays: Holiday[]
}

export function HolidaysCalendar({ holidays }: HolidaysCalendarProps) {
  const deleteHoliday = useDeleteHoliday()

  const handleAddHoliday = () => {
    // TODO: 휴무일 추가 Dialog 구현
  }

  const handleDeleteHoliday = (date: string) => {
    if (confirm('이 휴무일을 삭제하시겠습니까?')) {
      deleteHoliday.mutate(date)
    }
  }

  // 날짜별로 정렬
  const sortedHolidays = [...holidays].sort((a, b) =>
    a.date.localeCompare(b.date)
  )

  // 연도별로 그룹화
  const holidaysByYear = sortedHolidays.reduce(
    (acc, holiday) => {
      const year = holiday.date.substring(0, 4)
      if (!acc[year]) {
        acc[year] = []
      }
      acc[year].push(holiday)
      return acc
    },
    {} as Record<string, Holiday[]>
  )

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
    return `${month}월 ${day}일 (${weekday})`
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>휴무일 관리</CardTitle>
            <CardDescription>정기 휴무일과 공휴일을 관리합니다</CardDescription>
          </div>
          <Button onClick={handleAddHoliday} size='sm'>
            <Plus className='mr-2 size-4' />
            휴무일 추가
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {Object.keys(holidaysByYear).length === 0 ? (
          <div className='text-muted-foreground py-8 text-center text-sm'>
            등록된 휴무일이 없습니다.
          </div>
        ) : (
          <div className='space-y-6'>
            {Object.entries(holidaysByYear).map(([year, yearHolidays]) => (
              <div key={year} className='space-y-3'>
                <h3 className='text-lg font-semibold'>{year}년</h3>
                <div className='space-y-2'>
                  {yearHolidays.map((holiday) => (
                    <div
                      key={holiday.date}
                      className='hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors'
                    >
                      <div className='flex items-center gap-3'>
                        <Badge variant='outline' className='font-mono'>
                          {formatDate(holiday.date)}
                        </Badge>
                        <span className='text-sm font-medium'>
                          {holiday.reason}
                        </span>
                      </div>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleDeleteHoliday(holiday.date)}
                      >
                        <Trash2 className='text-destructive size-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
