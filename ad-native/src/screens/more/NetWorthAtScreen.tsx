import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import ListRow from '../../components/ui/ListRow';
import Border from '../../components/ui/Border';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/common/EmptyState';
import WorkCalendar from '../../components/WorkCalendar';
import { useTheme } from '../../lib/theme';
import { useAuthStore } from '../../stores/auth.store';
import { dashboardApi } from '../../api';
import { qk } from '../../queries/keys';
import { krw } from '../../lib/format';
import { todayLocal } from '../../lib/date';
import { TE } from '../../lib/toss-emoji';
import { getAssetCategoryMeta } from '../../lib/category-meta';

const CATEGORY_ALIAS: Record<string, string> = { REAL_ASSET: 'REAL_ESTATE', DEBT: 'LIABILITY' };

function formatDateLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

interface NetWorthAtAsset {
  assetId: number;
  name: string;
  category: string;
  isLiability: boolean;
  valueKRW: number | null;
  snapshotDate: string | null;
}

export default function NetWorthAtScreen() {
  const theme = useTheme();
  const hid = useAuthStore((s) => s.currentHousehold?.id);

  const [date, setDate] = useState(todayLocal());
  const [month, setMonth] = useState(todayLocal().slice(0, 7));

  function shiftMonth(delta: number) {
    const [yy, mm] = month.split('-').map(Number);
    const d = new Date(yy!, mm! - 1 + delta, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const candidate = `${newMonth}-${String(lastDay).padStart(2, '0')}`;
    const today = todayLocal();
    setMonth(newMonth);
    setDate(candidate > today ? today : candidate);
  }
  const canGoNext = month < todayLocal().slice(0, 7);

  const q = useQuery({
    queryKey: qk.netWorthAt(hid ?? 0, date),
    queryFn: () => dashboardApi.netWorthAt(hid!, date),
    enabled: !!hid,
    staleTime: 30_000,
  });

  const data: { date: string; netWorth: number; byAsset: NetWorthAtAsset[] } | undefined = q.data as any;
  const byAsset = data?.byAsset ?? [];
  const hasAnySnapshot = byAsset.some((a) => a.valueKRW !== null);

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.monthNav}>
        <Pressable style={[styles.monthBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => shiftMonth(-1)}>
          <Text style={{ color: theme.text, fontSize: 18 }}>‹</Text>
        </Pressable>
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>{`${Number(month.slice(5))}월 (${month.slice(0, 4)})`}</Text>
        <Pressable style={[styles.monthBtn, { backgroundColor: theme.card, borderColor: theme.border, opacity: canGoNext ? 1 : 0.3 }]} onPress={() => canGoNext && shiftMonth(1)} disabled={!canGoNext}>
          <Text style={{ color: theme.text, fontSize: 18 }}>›</Text>
        </Pressable>
      </View>

      <View style={[styles.calCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <WorkCalendar month={month} logs={[]} selectedDate={date} onSelectDay={setDate} maxDate={todayLocal()} />
      </View>

      {q.isLoading ? (
        <View style={styles.loadingBox}>
          <Loader size="large" />
        </View>
      ) : !hasAnySnapshot ? (
        <EmptyState iconCode={TE.calendar} title="이 날짜의 기록이 없어요" desc="선택한 날짜 이전에 입력된 스냅샷이 하나도 없습니다" />
      ) : (
        <>
          <View style={[styles.headlineCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={{ color: theme.textMuted, fontSize: 12 }}>{formatDateLabel(date)} 기준 총자산</Text>
            <Text style={{ color: theme.text, fontSize: 24, fontWeight: '800', marginTop: 4 }}>{krw(data!.netWorth)}</Text>
          </View>

          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>자산별 내역</Text>
            {byAsset.map((a, idx) => {
              const meta = getAssetCategoryMeta(CATEGORY_ALIAS[a.category] ?? a.category);
              const isStale = a.snapshotDate !== null && a.snapshotDate !== date;
              return (
                <View key={a.assetId}>
                  <ListRow
                    left={<View style={[styles.accentBar, { backgroundColor: meta.color }]} />}
                    contents={
                      <View>
                        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{a.name}</Text>
                        {isStale && <Text style={{ color: theme.textMuted, fontSize: 11 }}>{a.snapshotDate} 입력 기준</Text>}
                        {a.snapshotDate === null && <Text style={{ color: theme.textMuted, fontSize: 11 }}>이 날짜 이전 기록 없음</Text>}
                      </View>
                    }
                    right={<Text style={{ color: a.isLiability ? theme.danger : theme.text, fontSize: 14, fontWeight: '700' }}>{a.valueKRW !== null ? krw(a.valueKRW) : '—'}</Text>}
                    verticalPadding="small"
                  />
                  {idx < byAsset.length - 1 && <Border type="full" />}
                </View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 16 },
  monthBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  calCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 16, borderWidth: 1 },
  loadingBox: { alignItems: 'center', paddingVertical: 40 },
  headlineCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 16, borderWidth: 1, padding: 16 },
  section: { marginHorizontal: 20, marginTop: 12, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  accentBar: { width: 4, height: 32, borderRadius: 2 },
});
