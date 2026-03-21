import { useState, useRef } from 'react'
import type { OperatingHours, DayOfWeek } from '@/shared/types/api'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Checkbox } from '@/shared/ui/checkbox'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { useUpdateOperatingHours } from '@/features/operating-hours/api'

interface TimeSlotFormProps {
  title: string
  description: string
  operatingHours: OperatingHours
  slotType: 'estimateSlots' | 'constructionSlots'
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: '월요일',
  tuesday: '화요일',
  wednesday: '수요일',
  thursday: '목요일',
  friday: '금요일',
  saturday: '토요일',
  sunday: '일요일',
}

const DAYS: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export function TimeSlotForm({
  title,
  description,
  operatingHours,
  slotType,
}: TimeSlotFormProps) {
  const slots = operatingHours[slotType]
  const [selectedDays, setSelectedDays] = useState<Set<DayOfWeek>>(
    new Set(DAYS.filter((day) => slots[day] !== undefined))
  )

  const startTimeRef = useRef<HTMLInputElement>(null)
  const endTimeRef = useRef<HTMLInputElement>(null)
  const [interval, setInterval] = useState(
    String(slots[DAYS[0]]?.interval || 60)
  )

  const updateOperatingHours = useUpdateOperatingHours()

  const handleDayToggle = (day: DayOfWeek) => {
    const newSelectedDays = new Set(selectedDays)
    if (newSelectedDays.has(day)) {
      newSelectedDays.delete(day)
    } else {
      newSelectedDays.add(day)
    }
    setSelectedDays(newSelectedDays)
  }

  const handleSave = () => {
    const startTime = startTimeRef.current?.value || '09:00'
    const endTime = endTimeRef.current?.value || '18:00'
    const intervalNum = Number(interval)

    // 선택된 요일에 대해 시간 슬롯 생성
    const updatedSlots: Partial<
      Record<
        DayOfWeek,
        { startTime: string; endTime: string; interval: number }
      >
    > = {}

    selectedDays.forEach((day) => {
      updatedSlots[day] = {
        startTime,
        endTime,
        interval: intervalNum,
      }
    })

    // 기존 OperatingHours에 업데이트된 슬롯 병합
    const updatedOperatingHours: OperatingHours = {
      ...operatingHours,
      [slotType]: updatedSlots,
    }

    updateOperatingHours.mutate(updatedOperatingHours)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* 요일 선택 */}
        <div className='space-y-2'>
          <Label>운영 요일</Label>
          <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
            {DAYS.map((day) => (
              <div key={day} className='flex items-center space-x-2'>
                <Checkbox
                  id={`${slotType}-${day}`}
                  checked={selectedDays.has(day)}
                  onCheckedChange={() => handleDayToggle(day)}
                />
                <Label
                  htmlFor={`${slotType}-${day}`}
                  className='cursor-pointer font-normal'
                >
                  {DAY_LABELS[day]}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* 시간 설정 */}
        {selectedDays.size > 0 && (
          <div className='grid gap-4 md:grid-cols-3'>
            <div className='space-y-2'>
              <Label htmlFor={`${slotType}-start`}>시작 시간</Label>
              <Input
                id={`${slotType}-start`}
                type='time'
                ref={startTimeRef}
                defaultValue={slots[DAYS[0]]?.startTime || '09:00'}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor={`${slotType}-end`}>종료 시간</Label>
              <Input
                id={`${slotType}-end`}
                type='time'
                ref={endTimeRef}
                defaultValue={slots[DAYS[0]]?.endTime || '18:00'}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor={`${slotType}-interval`}>슬롯 간격</Label>
              <Select value={interval} onValueChange={setInterval}>
                <SelectTrigger id={`${slotType}-interval`}>
                  <SelectValue placeholder='선택' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='30'>30분</SelectItem>
                  <SelectItem value='60'>1시간</SelectItem>
                  <SelectItem value='120'>2시간</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* 저장 버튼 */}
        <div className='flex justify-end'>
          <Button onClick={handleSave}>저장</Button>
        </div>
      </CardContent>
    </Card>
  )
}
