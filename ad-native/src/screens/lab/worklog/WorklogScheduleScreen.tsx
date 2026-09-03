import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import TextField from '../../../components/ui/TextField';
import Button from '../../../components/ui/Button';
import AppToast from '../../../components/common/AppToast';
import { labWorklogApi } from '../../../api/lab-worklog';
import { useTheme } from '../../../lib/theme';
import { toLocalDateString, todayLocal } from '../../../lib/date';
import { isKoreanHoliday } from '../../../lib/koreanHolidays';
import { getErrorMessage } from '../../../lib/error';
import type { WorklogStackParamList } from '../../../navigation/WorklogStack';

type Props = NativeStackScreenProps<WorklogStackParamList, 'WorklogSchedule'>;

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function WorklogScheduleScreen({ navigation }: Props) {
  const theme = useTheme();
  const qc = useQueryClient();
  const [ym, setYm] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [dailyWage, setDailyWage] = useState('');
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const categoriesQ = useQuery({ queryKey: ['lab-worklog-categories'], queryFn: labWorklogApi.categoryOptions });
  const categories = [...(categoriesQ.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  const worklogQ = useQuery({ queryKey: ['lab-worklog', ym.year, ym.month], queryFn: () => labWorklogApi.search(ym.year, ym.month) });
  const existingDates = new Set((worklogQ.data?.records ?? []).map((r) => r.workDate));

  function changeMonth(delta: number) {
    setYm((prev) => {
      const d = new Date(prev.year, prev.month - 1 + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
    setSelectedDates(new Set());
  }

  function toggleDate(dateStr: string) {
    if (existingDates.has(dateStr)) return;
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  }

  const isValid = title.trim().length > 0 && !!category && selectedDates.size > 0;

  async function handleRegister() {
    if (!isValid) return;
    setSaving(true);
    setError('');
    try {
      await Promise.all(
        [...selectedDates].map((workDate) =>
          labWorklogApi.create({
            title: title.trim(),
            workDate,
            category,
            payStatus: 'SCHEDULED',
            dailyWage: dailyWage ? Number(dailyWage) : undefined,
          }),
        ),
      );
      await qc.invalidateQueries({ queryKey: ['lab-worklog', ym.year, ym.month] });
      setToast(`${selectedDates.size}일을 근무예정으로 등록했어요`);
      navigation.goBack();
    } catch (e) {
      setError(getErrorMessage(e, '등록에 실패했어요'));
    } finally {
      setSaving(false);
    }
  }

  const daysInMonth = new Date(ym.year, ym.month, 0).getDate();
  const firstWeekday = new Date(ym.year, ym.month - 1, 1).getDay();
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const today = todayLocal();

  return (
    <SafeAreaView edges={['bottom']} style={[styles.root, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 12 }}>
          현장명·분류를 한 번 입력하고, 아래 달력에서 근무 예정인 날짜들을 체크해서 한번에 등록해요. 이미 기록이 있는 날짜는 선택할 수 없어요.
        </Text>

        <TextField variant="line" placeholder="현장명 (예: 송도 / 학익)" value={title} onChangeText={setTitle} style={{ marginBottom: 12 }} />

        {categories.length > 0 && (
          <View style={styles.chipRow}>
            {categories.map((c) => {
              const active = c.name === category;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCategory(c.name)}
                  style={[styles.chip, { borderColor: active ? theme.brand : theme.border, backgroundColor: active ? theme.brandSoft : theme.card }]}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: active ? theme.brand : theme.text }}>{c.name}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <TextField
          variant="box"
          placeholder="일급여 (미지정 시 자동)"
          value={dailyWage}
          onChangeText={setDailyWage}
          keyboardType="numeric"
          suffix="원"
          style={{ marginBottom: 16 }}
        />

        <View style={[styles.calCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.monthNav}>
            <Pressable hitSlop={10} onPress={() => changeMonth(-1)}>
              <Text style={{ color: theme.text, fontSize: 18 }}>‹</Text>
            </Pressable>
            <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>
              {ym.year}년 {ym.month}월
            </Text>
            <Pressable hitSlop={10} onPress={() => changeMonth(1)}>
              <Text style={{ color: theme.text, fontSize: 18 }}>›</Text>
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
              const dateStr = toLocalDateString(new Date(ym.year, ym.month - 1, day));
              const disabled = existingDates.has(dateStr);
              const selected = selectedDates.has(dateStr);
              const isToday = dateStr === today;
              const weekday = i % 7;
              const holiday = isKoreanHoliday(dateStr);
              const dateColor = disabled ? theme.textMuted : holiday || weekday === 0 ? theme.danger : weekday === 6 ? theme.brand : theme.text;
              return (
                <Pressable key={i} style={styles.cell} onPress={() => toggleDate(dateStr)} disabled={disabled}>
                  <View
                    style={[
                      styles.dayCircle,
                      selected && { backgroundColor: theme.brand },
                      disabled && { backgroundColor: theme.bg },
                    ]}
                  >
                    <Text style={{ color: selected ? '#fff' : dateColor, fontSize: 13, fontWeight: isToday || selected ? '700' : '500', opacity: disabled ? 0.4 : 1 }}>
                      {day}
                    </Text>
                  </View>
                  {disabled && <Text style={{ color: theme.textMuted, fontSize: 8, marginTop: 1 }}>기록있음</Text>}
                </Pressable>
              );
            })}
          </View>
        </View>

        {error ? <Text style={{ color: theme.danger, fontSize: 12, marginTop: 12 }}>{error}</Text> : null}

        <View style={{ marginTop: 16 }}>
          <Button display="full" size="big" type="primary" disabled={!isValid} loading={saving} onPress={handleRegister}>
            선택한 {selectedDates.size}일 근무예정으로 등록
          </Button>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
      <AppToast open={!!toast} text={toast} onClose={() => setToast('')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  calCard: { borderRadius: 14, borderWidth: 1, padding: 12 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingBottom: 10 },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 0.85, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
