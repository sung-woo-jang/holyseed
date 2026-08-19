import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../lib/theme';

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

  const byDate: Record<string, CalLog[]> = {};
  logs.forEach((l) => {
    (byDate[l.date] ??= []).push(l);
  });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <View style={styles.container}>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <View key={w} style={styles.cell}>
            <Text style={[styles.weekday, { color: i === 0 ? theme.danger : i === 6 ? theme.brand : theme.textMuted }]}>{w}</Text>
          </View>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            if (day === null) return <View key={di} style={styles.cell} />;
            const dateStr = `${month}-${pad(day)}`;
            const dayLogs = byDate[dateStr] ?? [];
            const isSelected = selectedDate === dateStr;
            const isDisabled = !!maxDate && dateStr > maxDate;
            return (
              <Pressable key={di} style={[styles.cell, isDisabled && { opacity: 0.3 }]} onPress={() => !isDisabled && onSelectDay(dateStr)} disabled={isDisabled}>
                <View style={styles.dayInner}>
                  <View style={[styles.dayBox, isSelected && { backgroundColor: theme.brandSoft }]}>
                    <Text style={[styles.dayNum, { color: di === 0 ? theme.danger : di === 6 ? theme.brand : theme.text }]}>{day}</Text>
                  </View>
                  <View style={styles.dots}>
                    {dayLogs.slice(0, 3).map((l) => (
                      <View key={l.id} style={[styles.dot, { backgroundColor: l.colorLabel || theme.brand, opacity: l.settled ? 1 : 0.4 }]} />
                    ))}
                    {dayLogs.length > 3 && <Text style={[styles.moreDot, { color: theme.textMuted }]}>+{dayLogs.length - 3}</Text>}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 8, paddingVertical: 8 },
  weekRow: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  weekday: { fontSize: 11, fontWeight: '600' },
  dayInner: { alignItems: 'center', gap: 3 },
  dayBox: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontSize: 13, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: 2, height: 8, alignItems: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2 },
  moreDot: { fontSize: 8 },
});
