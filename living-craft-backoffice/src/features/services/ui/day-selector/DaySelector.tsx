import type { DayCode } from '@/shared/types/api'
import clsx from 'clsx'
import styles from './styles.module.scss'

interface DaySelectorProps {
  value: DayCode[]
  onChange: (value: DayCode[]) => void
  disabled?: boolean
  mode?: 'include' | 'exclude'
}

const DAYS: { code: DayCode; label: string; shortLabel: string }[] = [
  { code: 'sun', label: '일요일', shortLabel: '일' },
  { code: 'mon', label: '월요일', shortLabel: '월' },
  { code: 'tue', label: '화요일', shortLabel: '화' },
  { code: 'wed', label: '수요일', shortLabel: '수' },
  { code: 'thu', label: '목요일', shortLabel: '목' },
  { code: 'fri', label: '금요일', shortLabel: '금' },
  { code: 'sat', label: '토요일', shortLabel: '토' },
]

export function DaySelector({
  value,
  onChange,
  disabled = false,
  mode = 'include',
}: DaySelectorProps) {
  const handleToggle = (dayCode: DayCode) => {
    if (disabled) return

    if (value.includes(dayCode)) {
      onChange(value.filter((d) => d !== dayCode))
    } else {
      onChange([...value, dayCode])
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.dayGrid}>
        {DAYS.map((day) => {
          const isSelected = value.includes(day.code)
          return (
            <button
              key={day.code}
              type='button'
              onClick={() => handleToggle(day.code)}
              disabled={disabled}
              className={clsx(
                styles.dayButton,
                isSelected && styles.dayButtonSelected,
                mode === 'exclude' && isSelected && styles.dayButtonExcluded,
                disabled && styles.dayButtonDisabled
              )}
              title={day.label}
              aria-pressed={isSelected}
            >
              {day.shortLabel}
            </button>
          )
        })}
      </div>
      {mode === 'include' && value.length > 0 && (
        <p className={styles.hint}>
          선택된 요일:{' '}
          {value
            .map((d) => DAYS.find((day) => day.code === d)?.label)
            .join(', ')}
        </p>
      )}
      {mode === 'exclude' && value.length > 0 && (
        <p className={styles.hintExclude}>
          제외된 요일:{' '}
          {value
            .map((d) => DAYS.find((day) => day.code === d)?.label)
            .join(', ')}
        </p>
      )}
    </div>
  )
}
