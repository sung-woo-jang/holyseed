import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Border from '../../components/ui/Border';
import ListRow from '../../components/ui/ListRow';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/common/EmptyState';
import WaterfallChart from '../../components/charts/WaterfallChart';
import { useTheme } from '../../lib/theme';
import { useHouseholdData } from '../../queries/useHouseholdData';
import { useAuthStore } from '../../stores/auth.store';
import { comparisonApi } from '../../api';
import { qk } from '../../queries/keys';
import { krw, krwShort } from '../../lib/format';
import { TE } from '../../lib/toss-emoji';
import { ASSET_CATEGORY_META } from '../../lib/category-meta';

export default function CompareScreen() {
  const theme = useTheme();
  const data = useHouseholdData();
  const hid = useAuthStore((s) => s.currentHousehold?.id);

  const compareQ = useQuery({
    queryKey: qk.comparison(hid ?? 0),
    queryFn: () => comparisonApi.yearly(hid!),
    enabled: !!hid,
    staleTime: 60_000,
  });

  const apiData: any = compareQ.data;
  const apiYearlyContrib: Record<number, any[]> = apiData?.yearlyContrib ?? {};
  const years = Object.keys(apiYearlyContrib).map(Number).sort((a, b) => a - b);
  const [selectedYearIdx, setSelectedYearIdx] = useState(years.length > 1 ? years.length - 1 : 0);
  const selectedYear = years[selectedYearIdx] ?? years[years.length - 1] ?? new Date().getFullYear();
  const prevYear = selectedYear - 1;

  const contribs: { category: string; value: number; color: string }[] = apiYearlyContrib[selectedYear] ?? [];

  const prevNetWorth = useMemo(() => {
    const h = data.netWorth.monthlyHistory;
    const prevEntry = h.filter((p) => p.date.startsWith(`${prevYear}-12`)).pop();
    const fallback = data.netWorth.current - contribs.reduce((s, c) => s + c.value, 0);
    return prevEntry?.value ?? fallback;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, data, prevYear, contribs]);

  const change = contribs.reduce((s, c) => s + c.value, 0);
  const currentNetWorth = prevNetWorth + change;

  const wfData: { label: string; value: number }[] = [
    { label: `${prevYear}년말`, value: prevNetWorth },
    ...contribs.map((c) => ({ label: c.category, value: c.value })),
    { label: `${selectedYear}년말`, value: currentNetWorth },
  ];

  const netWorthByYear: Record<number, number> = apiData?.netWorthByYear ?? {};
  const yearBars = years.map((y) => ({ year: y, value: netWorthByYear[y] ?? 0 }));
  const maxBar = Math.max(...yearBars.map((b) => b.value), 1);

  if (compareQ.isLoading) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }

  if (years.length < 2) {
    return (
      <View style={[styles.root, { backgroundColor: theme.bg }]}>
        <EmptyState iconCode={TE.chartUp} title="비교할 데이터가 아직 부족해요" desc="2년 이상 자산 스냅샷이 쌓이면 연도별 증감을 비교할 수 있어요" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ paddingBottom: 32 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 12 }}>
        {years.slice(1).map((y) => {
          const isActive = selectedYear === y;
          return (
            <Pressable
              key={y}
              style={[styles.yearPill, { backgroundColor: isActive ? theme.brand : theme.bg, borderColor: isActive ? theme.brand : theme.border }]}
              onPress={() => setSelectedYearIdx(years.indexOf(y))}
            >
              <Text style={{ color: isActive ? '#fff' : theme.textMuted, fontSize: 12, fontWeight: '700' }}>
                {y - 1} → {y}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.headlineCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={{ color: change >= 0 ? theme.brand : theme.danger, fontSize: 16, fontWeight: '800' }}>
          {change >= 0 ? '+' : ''}
          {krw(change)} {change >= 0 ? '늘었어요' : '줄었어요'}
        </Text>
        <View style={[styles.pctChip, { backgroundColor: change >= 0 ? theme.brandSoft : '#FEE2E2' }]}>
          <Text style={{ color: change >= 0 ? theme.brand : theme.danger, fontSize: 12, fontWeight: '700' }}>{prevNetWorth > 0 ? ((change / prevNetWorth) * 100).toFixed(1) : 0}%</Text>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>연도별 순자산</Text>
        <View style={styles.barRow}>
          {yearBars.map((b) => {
            const h = Math.max(8, (b.value / maxBar) * 120);
            const isActive = b.year === selectedYear;
            return (
              <Pressable key={b.year} style={styles.barCol} onPress={() => setSelectedYearIdx(years.indexOf(b.year))}>
                <Text style={{ color: isActive ? theme.brand : theme.textMuted, fontSize: 10, fontWeight: '700', height: 14 }}>{isActive ? krwShort(b.value) : ''}</Text>
                <View style={[styles.barBody, { height: h, backgroundColor: isActive ? theme.brand : theme.brandSoft }]} />
                <Text style={{ color: isActive ? theme.brand : theme.textMuted, fontSize: 11, fontWeight: '700', marginTop: 4 }}>{b.year}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>자산군별 증감 워터폴</Text>
        <WaterfallChart data={wfData} width={327} height={220} dark={theme.dark} />
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>자산군별 기여</Text>
        {contribs
          .slice()
          .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
          .map((c, idx, arr) => {
            const weight = Math.abs(change) > 0 ? ((Math.abs(c.value) / Math.abs(change)) * 100).toFixed(0) : '0';
            const catKey = Object.keys(ASSET_CATEGORY_META).find((k) => ASSET_CATEGORY_META[k as keyof typeof ASSET_CATEGORY_META].label === c.category);
            const catColor = c.color ?? (catKey ? ASSET_CATEGORY_META[catKey as keyof typeof ASSET_CATEGORY_META].color : '#94A3B8');
            return (
              <View key={c.category}>
                <ListRow
                  left={<View style={[styles.accentBar, { backgroundColor: catColor }]} />}
                  contents={
                    <View style={styles.contribTopRow}>
                      <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{c.category}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 11 }}>{weight}%</Text>
                    </View>
                  }
                  right={
                    <Text style={{ color: c.value >= 0 ? theme.brand : theme.danger, fontSize: 14, fontWeight: '700' }}>
                      {c.value >= 0 ? '+' : ''}
                      {krwShort(c.value)}
                    </Text>
                  }
                  verticalPadding="small"
                />
                {idx < arr.length - 1 && <Border type="full" />}
              </View>
            );
          })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  yearScroll: { flexGrow: 0 },
  yearPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  headlineCard: { marginHorizontal: 20, borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pctChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  section: { marginHorizontal: 20, marginTop: 12, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  barRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  barCol: { alignItems: 'center', flex: 1 },
  barBody: { width: 20, borderRadius: 6 },
  accentBar: { width: 4, height: 32, borderRadius: 2 },
  contribTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
