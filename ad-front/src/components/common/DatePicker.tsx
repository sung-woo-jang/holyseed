import { useEffect, useState } from 'react';
import PickerOverlay from '../sheets/PickerOverlay';
import WorkCalendar from '../WorkCalendar';
import { useTheme } from '../../lib/theme';
import { todayLocal, lastDayOfPrevMonth, shiftMonth } from '../../lib/date';
import styles from './DatePicker.module.css';

interface DatePickerProps {
  visible: boolean;
  /** 현재 선택된 날짜 (YYYY-MM-DD) */
  value: string;
  onSelect: (date: string) => void;
  onClose: () => void;
  /** 이후 날짜 선택 불가 (기본: 제한 없음) */
  maxDate?: string;
  title?: string;
}

/**
 * 캘린더 날짜 피커 — SheetModal의 overlay 슬롯에 넣어 사용.
 * WorkCalendar를 재사용하고 오늘/지난달 말일 프리셋을 제공한다.
 */
export default function DatePicker({ visible, value, onSelect, onClose, maxDate, title = '날짜 선택' }: DatePickerProps) {
  const theme = useTheme();
  const [month, setMonth] = useState(value.slice(0, 7));

  // 열릴 때 선택값의 월로 리셋
  useEffect(() => {
    if (visible) setMonth((value || todayLocal()).slice(0, 7));
  }, [visible, value]);

  const today = todayLocal();
  const prevMonthEnd = lastDayOfPrevMonth(today);
  const canGoNext = !maxDate || shiftMonth(month, 1) <= maxDate.slice(0, 7);
  const monthLabel = `${Number(month.slice(5))}월 (${month.slice(0, 4)})`;

  function pick(date: string) {
    onSelect(date);
    onClose();
  }

  const presets = [
    { label: '오늘', date: today },
    { label: '지난달 말일', date: prevMonthEnd },
  ].filter((p) => !maxDate || p.date <= maxDate);

  return (
    <PickerOverlay visible={visible} title={title} onClose={onClose}>
      <div className={styles.body}>
        {/* 프리셋 */}
        <div className={styles.presetRow}>
          {presets.map((p) => (
            <button
              type="button"
              key={p.label}
              className={styles.presetChip}
              style={{
                background: value === p.date ? theme.brand : theme.brandSoft,
                color: value === p.date ? '#fff' : theme.brand,
              }}
              onClick={() => pick(p.date)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* 월 네비 */}
        <div className={styles.monthNav}>
          <button
            type="button"
            className={styles.monthBtn}
            style={{ backgroundColor: theme.bg, borderColor: theme.border }}
            onClick={() => setMonth(shiftMonth(month, -1))}
          >
            <span className={styles.monthArrow} style={{ color: theme.text }}>‹</span>
          </button>
          <span className={styles.monthLabel} style={{ color: theme.text }}>{monthLabel}</span>
          <button
            type="button"
            className={styles.monthBtn}
            style={{ backgroundColor: theme.bg, borderColor: theme.border, opacity: canGoNext ? 1 : 0.3 }}
            onClick={() => canGoNext && setMonth(shiftMonth(month, 1))}
            disabled={!canGoNext}
          >
            <span className={styles.monthArrow} style={{ color: theme.text }}>›</span>
          </button>
        </div>

        <WorkCalendar
          month={month}
          logs={[]}
          selectedDate={value}
          onSelectDay={pick}
          maxDate={maxDate}
        />
      </div>
    </PickerOverlay>
  );
}
