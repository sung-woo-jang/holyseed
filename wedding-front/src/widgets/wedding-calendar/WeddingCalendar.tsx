import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import cn from 'classnames'
import styles from './WeddingCalendar.module.css'

interface WeddingCalendarProps {
  weddingDate: Date
  groomName: string
  brideName: string
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const pad2 = (n: number) => String(n).padStart(2, '0')

function buildMonthGrid(year: number, month: number): (number | null)[][] {
  const startWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const weeks: (number | null)[][] = []
  let week: (number | null)[] = new Array(startWeekday).fill(null)
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

export default function WeddingCalendar({ weddingDate, groomName, brideName }: WeddingCalendarProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const year = weddingDate.getFullYear()
  const month = weddingDate.getMonth()
  const day = weddingDate.getDate()
  const weeks = buildMonthGrid(year, month)

  const diffMs = Math.max(weddingDate.getTime() - now.getTime(), 0)
  const totalSeconds = Math.floor(diffMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return (
    <div className={styles.card}>
      <div className={styles.dateHeading}>{format(weddingDate, 'yyyy. MM. dd')}</div>
      <div className={styles.dateSub}>{format(weddingDate, 'EEEE', { locale: ko })}</div>

      <div className={styles.divider} />

      <div className={styles.grid}>
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={cn(styles.weekdayLabel, { [styles.sun]: i === 0, [styles.sat]: i === 6 })}
          >
            {label}
          </div>
        ))}
        {weeks.map((week, wi) =>
          week.map((d, di) => (
            <div key={`${wi}-${di}`} className={styles.dayCell}>
              {d && (
                <span
                  className={cn(styles.day, {
                    [styles.sun]: di === 0,
                    [styles.sat]: di === 6,
                    [styles.dayActive]: d === day,
                  })}
                >
                  {d}
                </span>
              )}
            </div>
          )),
        )}
      </div>

      <div className={styles.divider} />

      <div className={styles.countdown}>
        <div className={styles.countUnit}>
          <span className={styles.countValue}>{days}</span>
          <span className={styles.countLabel}>DAYS</span>
        </div>
        <span className={styles.countColon}>:</span>
        <div className={styles.countUnit}>
          <span className={styles.countValue}>{pad2(hours)}</span>
          <span className={styles.countLabel}>HOUR</span>
        </div>
        <span className={styles.countColon}>:</span>
        <div className={styles.countUnit}>
          <span className={styles.countValue}>{pad2(minutes)}</span>
          <span className={styles.countLabel}>MIN</span>
        </div>
        <span className={styles.countColon}>:</span>
        <div className={styles.countUnit}>
          <span className={styles.countValue}>{pad2(seconds)}</span>
          <span className={styles.countLabel}>SEC</span>
        </div>
      </div>

      <p className={styles.message}>
        {groomName}, {brideName}의 결혼식이 <strong className={styles.messageStrong}>{days}</strong>일 남았습니다.
      </p>
    </div>
  )
}
