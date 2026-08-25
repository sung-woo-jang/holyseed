import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme';
import { toLocalDateString, todayLocal } from '../../lib/date';

interface DatePickerProps {
  visible: boolean;
  /** 현재 선택된 날짜 (YYYY-MM-DD) */
  value: string;
  onSelect: (date: string) => void;
  onClose: () => void;
  /** 이후 날짜 선택 불가 (기본: 제한 없음) */
  maxDate?: string;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 앱 전용 캘린더 드로어 — 다른 선택 시트들과 여백·디자인을 동일하게 맞추기 위해 네이티브 다이얼로그 대신 자체 구현 */
export default function DatePicker({ visible, value, onSelect, onClose, maxDate }: DatePickerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [viewYear, setViewYear] = useState(() => (value ? new Date(value) : new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (value ? new Date(value) : new Date()).getMonth());

  useEffect(() => {
    if (!visible) return;
    const d = value ? new Date(value) : new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [visible, value]);

  if (!visible) return null;

  const today = todayLocal();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  function changeMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  function isDisabled(day: number): boolean {
    if (!maxDate) return false;
    return toLocalDateString(new Date(viewYear, viewMonth, day)) > maxDate;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.panel, { backgroundColor: theme.card, paddingBottom: insets.bottom + 20 }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          <View style={styles.header}>
            <Pressable hitSlop={10} onPress={() => changeMonth(-1)} style={styles.navBtn}>
              <Text style={{ color: theme.text, fontSize: 20 }}>‹</Text>
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {viewYear}년 {viewMonth + 1}월
            </Text>
            <Pressable hitSlop={10} onPress={() => changeMonth(1)} style={styles.navBtn}>
              <Text style={{ color: theme.text, fontSize: 20 }}>›</Text>
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((w, i) => (
              <Text key={w} style={[styles.weekLabel, { color: i === 0 ? theme.danger : i === 6 ? theme.brand : theme.textMuted }]}>
                {w}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (day == null) return <View key={i} style={styles.cell} />;
              const dateStr = toLocalDateString(new Date(viewYear, viewMonth, day));
              const selected = dateStr === value;
              const isToday = dateStr === today;
              const disabled = isDisabled(day);
              return (
                <Pressable
                  key={i}
                  disabled={disabled}
                  style={styles.cell}
                  onPress={() => {
                    onSelect(dateStr);
                    onClose();
                  }}
                >
                  <View style={[styles.dayCircle, selected && { backgroundColor: theme.brand }]}>
                    <Text
                      style={{
                        color: disabled ? theme.textMuted : selected ? '#fff' : theme.text,
                        opacity: disabled ? 0.35 : 1,
                        fontSize: 14,
                        fontWeight: selected || isToday ? '700' : '500',
                      }}
                    >
                      {day}
                    </Text>
                  </View>
                  {isToday && !selected && <View style={[styles.todayDot, { backgroundColor: theme.brand }]} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  panel: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 10, paddingHorizontal: 20 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28, marginBottom: 12 },
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', minWidth: 110, textAlign: 'center' },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  dayCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  todayDot: { position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: 2 },
});
