'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'

type DurationType = 'FIXED' | 'RANGE' | 'TIME_RANGE' | 'ALL_DAY'

interface DurationValue {
  type: DurationType
  hours?: number
  startHours?: number
  endHours?: number
  startTime?: number
  endTime?: number
}

interface DurationPickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}

/**
 * Duration 문자열을 DurationValue 객체로 파싱
 */
function parseDuration(str: string): DurationValue | null {
  if (!str) return null

  // "하루종일"
  if (str === '하루종일') {
    return { type: 'ALL_DAY' }
  }

  // "2시간" → FIXED
  const fixedMatch = str.match(/^(\d+)시간$/)
  if (fixedMatch) {
    return {
      type: 'FIXED',
      hours: parseInt(fixedMatch[1], 10),
    }
  }

  // "2-3시간" → RANGE
  const rangeMatch = str.match(/^(\d+)-(\d+)시간$/)
  if (rangeMatch) {
    return {
      type: 'RANGE',
      startHours: parseInt(rangeMatch[1], 10),
      endHours: parseInt(rangeMatch[2], 10),
    }
  }

  // "9시부터 18시까지" → TIME_RANGE
  const timeRangeMatch = str.match(/^(\d+)시부터 (\d+)시까지$/)
  if (timeRangeMatch) {
    return {
      type: 'TIME_RANGE',
      startTime: parseInt(timeRangeMatch[1], 10),
      endTime: parseInt(timeRangeMatch[2], 10),
    }
  }

  return null
}

/**
 * DurationValue 객체를 문자열로 변환
 */
function formatDuration(value: DurationValue): string {
  switch (value.type) {
    case 'FIXED':
      return `${value.hours}시간`
    case 'RANGE':
      return `${value.startHours}-${value.endHours}시간`
    case 'TIME_RANGE':
      return `${value.startTime}시부터 ${value.endTime}시까지`
    case 'ALL_DAY':
      return '하루종일'
    default:
      return ''
  }
}

export function DurationPicker({
  value,
  onChange,
  placeholder = '소요 시간 선택',
}: DurationPickerProps) {
  const [open, setOpen] = useState(false)

  // 내부 상태: 현재 선택된 타입과 값들
  const [selectedType, setSelectedType] = useState<DurationType>('FIXED')
  const [hours, setHours] = useState<string>('1')
  const [startHours, setStartHours] = useState<string>('1')
  const [endHours, setEndHours] = useState<string>('2')
  const [startTime, setStartTime] = useState<string>('9')
  const [endTime, setEndTime] = useState<string>('18')

  // value prop이 변경되면 내부 상태 동기화
  useEffect(() => {
    if (!value) return

    const parsed = parseDuration(value)
    if (!parsed) return

    setSelectedType(parsed.type)

    switch (parsed.type) {
      case 'FIXED':
        if (parsed.hours !== undefined) {
          setHours(String(parsed.hours))
        }
        break
      case 'RANGE':
        if (parsed.startHours !== undefined && parsed.endHours !== undefined) {
          setStartHours(String(parsed.startHours))
          setEndHours(String(parsed.endHours))
        }
        break
      case 'TIME_RANGE':
        if (parsed.startTime !== undefined && parsed.endTime !== undefined) {
          setStartTime(String(parsed.startTime))
          setEndTime(String(parsed.endTime))
        }
        break
      case 'ALL_DAY':
        // 추가 상태 없음
        break
    }
  }, [value])

  const handleConfirm = () => {
    let durationValue: DurationValue

    switch (selectedType) {
      case 'FIXED':
        durationValue = {
          type: 'FIXED',
          hours: parseInt(hours, 10),
        }
        break
      case 'RANGE':
        durationValue = {
          type: 'RANGE',
          startHours: parseInt(startHours, 10),
          endHours: parseInt(endHours, 10),
        }
        break
      case 'TIME_RANGE':
        durationValue = {
          type: 'TIME_RANGE',
          startTime: parseInt(startTime, 10),
          endTime: parseInt(endTime, 10),
        }
        break
      case 'ALL_DAY':
        durationValue = {
          type: 'ALL_DAY',
        }
        break
    }

    const formatted = formatDuration(durationValue)
    onChange?.(formatted)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full justify-between'
        >
          {value || placeholder}
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='ml-2 h-4 w-4 shrink-0 opacity-50'
          >
            <path d='m6 9 6 6 6-6' />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[320px] p-4'>
        <Tabs
          value={selectedType}
          onValueChange={(v) => setSelectedType(v as DurationType)}
        >
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='FIXED'>시간</TabsTrigger>
            <TabsTrigger value='RANGE'>범위</TabsTrigger>
            <TabsTrigger value='TIME_RANGE'>시간대</TabsTrigger>
            <TabsTrigger value='ALL_DAY'>하루종일</TabsTrigger>
          </TabsList>

          {/* FIXED: n시간 */}
          <TabsContent value='FIXED' className='mt-4'>
            <Select value={hours} onValueChange={setHours}>
              <SelectTrigger>
                <SelectValue placeholder='시간 선택' />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {h}시간
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TabsContent>

          {/* RANGE: n-m시간 */}
          <TabsContent value='RANGE' className='mt-4'>
            <div className='grid grid-cols-2 gap-2'>
              <Select value={startHours} onValueChange={setStartHours}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {h}시간
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={endHours} onValueChange={setEndHours}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {h}시간
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* TIME_RANGE: n시부터 m시까지 */}
          <TabsContent value='TIME_RANGE' className='mt-4'>
            <div className='grid grid-cols-2 gap-2'>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue placeholder='시작' />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {h}시
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
                  <SelectValue placeholder='종료' />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {h}시
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* ALL_DAY: 하루종일 */}
          <TabsContent value='ALL_DAY' className='mt-4'>
            <p className='text-muted-foreground text-sm'>
              하루 종일 작업이 진행됩니다.
            </p>
          </TabsContent>
        </Tabs>

        {/* 확인 버튼 */}
        <Button className='mt-4 w-full' onClick={handleConfirm}>
          확인
        </Button>
      </PopoverContent>
    </Popover>
  )
}
