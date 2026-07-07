import { useTheme } from '../lib/theme';
import styles from './WorkCalendar.module.css';

export interface CalLog {
  id: string | number;
  date: string;
  colorLabel?: string | null;
  settled: boolean;
}

interface WorkCalendarProps {
  month: string; // YYYY-MM
  logs: CalLog[];
  selectedDate?: string;
  onSelectDay: (date: string) => void;
  /** 이후 날짜는 선택 불가 (YYYY-MM-DD) */
  maxDate?: string;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function WorkCalendar({ month, logs, selectedDate, onSelectDay, maxDate }: WorkCalendarProps) {
  const theme = useTheme();
  const [y, m] = month.split('-').map(Number);
  const year = y ?? new Date().getFullYear();
  const monthIdx = (m ?? 1) - 1;

  const firstWeekday = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  // 날짜별 로그 묶음
  const byDate: Record<string, CalLog[]> = {};
  logs.forEach((l) => {
    (byDate[l.date] ??= []).push(l);
  });

  // 셀 배열: 선행 빈칸 + 일자
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className={styles.container}>
      <div className={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={styles.cell}>
            <span
              className={styles.weekday}
              style={{ color: i === 0 ? theme.danger : i === 6 ? theme.brand : theme.textMuted }}
            >
              {w}
            </span>
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} className={styles.weekRow}>
          {week.map((day, di) => {
            if (day === null) return <div key={di} className={styles.cell} />;
            const dateStr = `${month}-${pad(day)}`;
            const dayLogs = byDate[dateStr] ?? [];
            const isSelected = selectedDate === dateStr;
            const isDisabled = !!maxDate && dateStr > maxDate;
            return (
              <button
                type="button"
                key={di}
                className={styles.cell}
                onClick={() => onSelectDay(dateStr)}
                disabled={isDisabled}
                style={isDisabled ? { opacity: 0.3, cursor: 'default' } : undefined}
              >
                <div className={styles.dayInner}>
                  <div
                    className={styles.dayBox}
                    style={isSelected ? { backgroundColor: theme.brandSoft } : undefined}
                  >
                    <span
                      className={styles.dayNum}
                      style={{ color: di === 0 ? theme.danger : di === 6 ? theme.brand : theme.text }}
                    >
                      {day}
                    </span>
                  </div>
                  <div className={styles.dots}>
                    {dayLogs.slice(0, 3).map((l) => (
                      <span
                        key={l.id}
                        className={styles.dot}
                        style={{ backgroundColor: l.colorLabel || theme.brand, opacity: l.settled ? 1 : 0.4 }}
                      />
                    ))}
                    {dayLogs.length > 3 && (
                      <span className={styles.moreDot} style={{ color: theme.textMuted }}>
                        +{dayLogs.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
