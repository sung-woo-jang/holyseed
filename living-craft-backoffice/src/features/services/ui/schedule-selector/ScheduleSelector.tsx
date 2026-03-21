import { useFormContext, Controller, useWatch } from 'react-hook-form'
import { ScheduleMode, type DayCode } from '@/shared/types/api'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import type { ServiceFormValues } from '../../model'
import { DaySelector } from '../day-selector'
import styles from './styles.module.scss'

/**
 * 스케줄 모드 옵션
 *
 * 고객은 견적 문의만 예약하고, 시공 일정은 견적 방문 후
 * 관리자가 백오피스 예약관리에서 직접 지정합니다.
 */
const SCHEDULE_MODES = [
  {
    value: ScheduleMode.GLOBAL,
    label: '전역 설정 사용',
    description: '운영 설정에서 관리하는 시간을 사용합니다',
  },
  {
    value: ScheduleMode.WEEKDAYS,
    label: '평일만',
    description: '월~금요일만 예약 가능',
  },
  {
    value: ScheduleMode.WEEKENDS,
    label: '주말만',
    description: '토~일요일만 예약 가능',
  },
  {
    value: ScheduleMode.EVERYDAY,
    label: '매일',
    description: '모든 요일 예약 가능',
  },
  {
    value: ScheduleMode.CUSTOM,
    label: '가능한 요일 선택',
    description: '예약 가능한 요일을 직접 선택',
  },
  {
    value: ScheduleMode.EVERYDAY_EXCEPT,
    label: '매일 (특정 요일 제외)',
    description: '특정 요일만 제외하고 예약 가능',
  },
]

const TIME_SLOTS = [
  '00:00',
  '01:00',
  '02:00',
  '03:00',
  '04:00',
  '05:00',
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
]

const SLOT_DURATIONS = [
  { value: 30, label: '30분' },
  { value: 60, label: '1시간' },
  { value: 90, label: '1시간 30분' },
  { value: 120, label: '2시간' },
]

/**
 * 견적 일정 설정 섹션
 *
 * 견적 가능 일정만 설정합니다.
 * 시공 일정은 견적 방문 후 예약관리에서 직접 지정합니다.
 */
function EstimateScheduleSection() {
  const { control } = useFormContext<ServiceFormValues>()

  // useWatch로 스케줄 모드 구독
  const currentMode =
    (useWatch({
      control,
      name: 'schedule.estimateScheduleMode',
    }) as ScheduleMode | undefined) ?? ScheduleMode.GLOBAL

  const showDaySelector =
    currentMode === ScheduleMode.CUSTOM ||
    currentMode === ScheduleMode.EVERYDAY_EXCEPT
  const showTimeSettings = currentMode !== ScheduleMode.GLOBAL

  return (
    <div className={styles.scheduleSection}>
      <h4 className={styles.scheduleSectionTitle}>견적 가능 일정</h4>

      <Controller
        name='schedule.estimateScheduleMode'
        control={control}
        render={({ field }) => (
          <RadioGroup
            value={field.value as string}
            onValueChange={field.onChange}
            className={styles.radioGroup}
          >
            {SCHEDULE_MODES.map((mode) => (
              <div key={mode.value} className={styles.radioItem}>
                <RadioGroupItem
                  value={mode.value}
                  id={`estimate-${mode.value}`}
                />
                <div className={styles.radioLabel}>
                  <Label htmlFor={`estimate-${mode.value}`}>{mode.label}</Label>
                  <span className={styles.radioDescription}>
                    {mode.description}
                  </span>
                </div>
              </div>
            ))}
          </RadioGroup>
        )}
      />

      {showDaySelector && (
        <div className={styles.daySelector}>
          <Label className={styles.subLabel}>
            {currentMode === ScheduleMode.CUSTOM
              ? '예약 가능한 요일 선택'
              : '제외할 요일 선택'}
          </Label>
          <Controller
            name='schedule.estimateAvailableDays'
            control={control}
            render={({ field }) => (
              <DaySelector
                value={
                  Array.isArray(field.value) ? (field.value as DayCode[]) : []
                }
                onChange={field.onChange}
                mode={
                  currentMode === ScheduleMode.EVERYDAY_EXCEPT
                    ? 'exclude'
                    : 'include'
                }
              />
            )}
          />
        </div>
      )}

      {showTimeSettings && (
        <div className={styles.timeSettings}>
          <div className={styles.timeRow}>
            <div className={styles.timeField}>
              <Label htmlFor='estimate-start' className={styles.subLabel}>
                시작 시간
              </Label>
              <Controller
                name='schedule.estimateStartTime'
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value as string}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id='estimate-start'>
                      <SelectValue placeholder='시작 시간' />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className={styles.timeField}>
              <Label htmlFor='estimate-end' className={styles.subLabel}>
                종료 시간
              </Label>
              <Controller
                name='schedule.estimateEndTime'
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value as string}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id='estimate-end'>
                      <SelectValue placeholder='종료 시간' />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className={styles.timeField}>
              <Label htmlFor='estimate-slot' className={styles.subLabel}>
                슬롯 간격
              </Label>
              <Controller
                name='schedule.estimateSlotDuration'
                control={control}
                render={({ field }) => (
                  <Select
                    value={String(field.value ?? '')}
                    onValueChange={(val) => field.onChange(parseInt(val))}
                  >
                    <SelectTrigger id='estimate-slot'>
                      <SelectValue placeholder='슬롯 간격' />
                    </SelectTrigger>
                    <SelectContent>
                      {SLOT_DURATIONS.map((slot) => (
                        <SelectItem
                          key={slot.value}
                          value={slot.value.toString()}
                        >
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 스케줄 선택 컴포넌트
 *
 * 견적 가능 일정만 설정합니다.
 * 시공 일정은 견적 방문 후 예약관리에서 직접 지정합니다.
 */
export function ScheduleSelector() {
  const { control } = useFormContext<ServiceFormValues>()

  return (
    <div className={styles.container}>
      <EstimateScheduleSection />

      <div className={styles.bookingPeriod}>
        <Label htmlFor='bookingPeriod' className={styles.subLabel}>
          예약 가능 기간 (개월)
        </Label>
        <div className={styles.bookingPeriodInput}>
          <Controller
            name='schedule.bookingPeriodMonths'
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id='bookingPeriod'
                type='number'
                min={1}
                max={12}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
              />
            )}
          />
          <span className={styles.bookingPeriodSuffix}>
            개월 후까지 예약 가능
          </span>
        </div>
        <p className={styles.bookingPeriodHint}>
          오늘부터 설정된 기간까지만 예약을 받습니다
        </p>
      </div>
    </div>
  )
}
