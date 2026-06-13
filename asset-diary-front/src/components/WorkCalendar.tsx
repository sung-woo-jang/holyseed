import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function WorkCalendar({ month, logs, selectedDate, onSelectDay }: WorkCalendarProps) {
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
    <View style={styles.container}>
      {/* 요일 헤더 */}
      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <View key={w} style={styles.cell}>
            <Text style={[styles.weekday, { color: i === 0 ? theme.danger : i === 6 ? theme.brand : theme.textMuted }]}>{w}</Text>
          </View>
        ))}
      </View>

      {/* 주별 행 */}
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            if (day === null) return <View key={di} style={styles.cell} />;
            const dateStr = `${month}-${pad(day)}`;
            const dayLogs = byDate[dateStr] ?? [];
            const isSelected = selectedDate === dateStr;
            return (
              <TouchableOpacity
                key={di}
                style={styles.cell}
                onPress={() => onSelectDay(dateStr)}
                activeOpacity={0.6}
              >
                <View style={styles.dayInner}>
                  <View style={[styles.dayBox, isSelected && { backgroundColor: theme.brandSoft }]}>
                    <Text style={[styles.dayNum, { color: di === 0 ? theme.danger : di === 6 ? theme.brand : theme.text }]}>
                      {day}
                    </Text>
                  </View>
                  <View style={styles.dots}>
                    {dayLogs.slice(0, 3).map((l) => (
                      <View
                        key={l.id}
                        style={[
                          styles.dot,
                          { backgroundColor: l.colorLabel || theme.brand, opacity: l.settled ? 1 : 0.4 },
                        ]}
                      />
                    ))}
                    {dayLogs.length > 3 && (
                      <Text style={[styles.moreDot, { color: theme.textMuted }]}>+{dayLogs.length - 3}</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 12 },
  weekRow: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center' },
  weekday: { fontSize: 11, fontWeight: '600', paddingVertical: 6 },
  dayInner: { alignItems: 'center', paddingVertical: 3 },
  dayBox: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontSize: 13, fontWeight: '500' },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, height: 10, marginTop: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  moreDot: { fontSize: 8, fontWeight: '600' },
});
