import React, { useMemo, useState } from 'react';
import { createRoute } from '@granite-js/react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Border, ListRow, Loader } from '@toss/tds-react-native';
import ScreenHeader from '../../components/common/ScreenHeader';
import EmptyState from '../../components/common/EmptyState';
import WaterfallChart from '../../components/charts/WaterfallChart';
import { useTheme } from '../../lib/theme';
import { useDataSource } from '../../lib/data-source';
import { useAuthStore } from '../../stores/auth.store';
import { comparisonApi } from '../../api';
import { qk } from '../../queries/keys';
import { krw, krwShort } from '../../lib/format';
import { TE } from '../../lib/toss-emoji';
import { ASSET_CATEGORY_META } from '../../lib/category-meta';

function CompareScreen() {
  const navigation = Route.useNavigation();
  const theme = useTheme();
  const data = useDataSource();
  const { currentHousehold, useMock } = useAuthStore();
  const hid = currentHousehold?.id;

  // 실제 연간 비교 API
  const compareQ = useQuery({
    queryKey: qk.comparison(hid ?? 0),
    queryFn: () => comparisonApi.yearly(hid!),
    enabled: !!hid && !useMock,
    staleTime: 60_000,
  });

  // API 결과가 있으면 그걸, 없으면 mock 데이터 폴백
  const apiData: any = compareQ.data;
  const apiYearlyContrib: Record<number, any[]> = apiData?.yearlyContrib ?? {};
  const hasApiData = Object.keys(apiYearlyContrib).length > 0;

  const yearlyContrib = hasApiData ? apiYearlyContrib : data.yearlyContrib;
  const years = Object.keys(yearlyContrib).map(Number).sort((a, b) => a - b);
  const [selectedYearIdx, setSelectedYearIdx] = useState(years.length > 1 ? years.length - 1 : 0);
  const selectedYear = years[selectedYearIdx] ?? (years[years.length - 1] ?? new Date().getFullYear());
  const prevYear = selectedYear - 1;

  const contribs: { category: string; value: number; color: string }[] = yearlyContrib[selectedYear] ?? [];

  const prevNetWorth = useMemo(() => {
    const h = data.netWorth.monthlyHistory;
    const prevEntry = h.filter((p) => p.date.startsWith(`${prevYear}-12`)).pop();
    const fallback = data.netWorth.current - contribs.reduce((s, c) => s + c.value, 0);
    return prevEntry?.value ?? fallback;
  }, [selectedYear, data, prevYear, contribs]);

  const change = contribs.reduce((s, c) => s + c.value, 0);
  const currentNetWorth = prevNetWorth + change;

  type WfType = 'total' | 'pos' | 'neg';
  const wfData: { label: string; value: number; type: WfType }[] = [
    { label: `${prevYear}년말`, value: prevNetWorth, type: 'total' },
    ...contribs.map((c) => ({ label: c.category, value: c.value, type: (c.value >= 0 ? 'pos' : 'neg') as WfType })),
    { label: `${selectedYear}년말`, value: currentNetWorth, type: 'total' },
  ];

  // 5년 bar chart 데이터
  const netWorthByYear: Record<number, number> = hasApiData
    ? (apiData?.netWorthByYear ?? {})
    : Object.fromEntries(
        years.map((y) => {
          if (y === new Date().getFullYear()) return [y, data.netWorth.current];
          const ybContribs: any[] = yearlyContrib[y] ?? [];
          return [y, ybContribs.reduce((s: number, c: any) => s + (c.value ?? 0), 0)];
        })
      );

  const yearBars = years.map((y) => ({ year: y, value: netWorthByYear[y] ?? 0 }));
  const maxBar = Math.max(...yearBars.map((b) => b.value), 1);

  if (compareQ.isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: theme.bg }]}>
        <ScreenHeader title="연간 비교" onBack={() => navigation?.goBack?.()} />
        <Loader.Centered size="medium" type="primary" />
      </View>
    );
  }

  if (years.length < 2) {
    return (
      <View style={[styles.root, { backgroundColor: theme.bg }]}>
        <ScreenHeader title="연간 비교" onBack={() => navigation?.goBack?.()} />
        <EmptyState
          iconCode={TE.chartUp}
          title="비교할 데이터가 아직 부족해요"
          desc="2년 이상 자산 스냅샷이 쌓이면 연도별 증감을 비교할 수 있어요"
        />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScreenHeader title="연간 비교" onBack={() => navigation?.goBack?.()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 연도 pill 셀렉터 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearScroll}>
          {years.slice(1).map((y) => {
            const isActive = selectedYear === y;
            return (
              <TouchableOpacity
                key={y}
                style={[styles.yearPill, { backgroundColor: isActive ? theme.brand : theme.bg, borderColor: isActive ? theme.brand : theme.border }]}
                onPress={() => setSelectedYearIdx(years.indexOf(y))}
              >
                <Text style={[styles.yearPillText, { color: isActive ? '#fff' : theme.textMuted }]}>
                  {y - 1} → {y}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Headline delta */}
        <View style={[styles.headlineCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.headlineDelta, { color: change >= 0 ? theme.brand : theme.danger }]}>
            {change >= 0 ? '+' : ''}{krw(change)} {change >= 0 ? '늘었어요' : '줄었어요'}
          </Text>
          <View style={[styles.pctChip, { backgroundColor: change >= 0 ? theme.brandSoft : '#FEE2E2' }]}>
            <Text style={[styles.pctChipText, { color: change >= 0 ? theme.brand : theme.danger }]}>
              {prevNetWorth > 0 ? ((change / prevNetWorth) * 100).toFixed(1) : 0}%
            </Text>
          </View>
        </View>

        {/* 5년 net-worth 바 차트 */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>연도별 순자산</Text>
          <View style={styles.barRow}>
            {yearBars.map((b) => {
              const h = Math.max(8, (b.value / maxBar) * 120);
              const isActive = b.year === selectedYear;
              return (
                <TouchableOpacity
                  key={b.year}
                  style={styles.barCol}
                  onPress={() => setSelectedYearIdx(years.indexOf(b.year))}
                >
                  <Text style={[styles.barTopLabel, { color: isActive ? theme.brand : theme.textMuted }]}>
                    {isActive ? krwShort(b.value) : ''}
                  </Text>
                  <View style={[styles.barBody, { height: h, backgroundColor: isActive ? theme.brand : theme.brandSoft }]} />
                  <Text style={[styles.barLabel, { color: isActive ? theme.brand : theme.textMuted }]}>
                    {b.year}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* WaterfallChart */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>자산군별 증감 워터폴</Text>
          <View style={{ marginTop: 12 }}>
            <WaterfallChart data={wfData} width={327} height={220} />
          </View>
        </View>

        {/* Top contributors */}
        <View style={[styles.section, { backgroundColor: theme.card, marginBottom: 32 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>자산군별 기여</Text>
          {contribs
            .slice()
            .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
            .map((c, idx, arr) => {
              const weight = Math.abs(change) > 0 ? ((Math.abs(c.value) / Math.abs(change)) * 100).toFixed(0) : '0';
              const catKey = Object.keys(ASSET_CATEGORY_META).find(
                (k) => ASSET_CATEGORY_META[k as keyof typeof ASSET_CATEGORY_META].label === c.category
              );
              const catColor = c.color ?? (catKey ? ASSET_CATEGORY_META[catKey as keyof typeof ASSET_CATEGORY_META].color : '#94A3B8');
              return (
                <React.Fragment key={c.category}>
                  <ListRow
                    left={<View style={[styles.accentBar, { backgroundColor: catColor }]} />}
                    contents={
                      <View style={styles.contribTopRow}>
                        <Text style={[styles.contribCat, { color: theme.text }]}>{c.category}</Text>
                        <Text style={[styles.contribWeight, { color: theme.textMuted }]}>{weight}%</Text>
                      </View>
                    }
                    right={
                      <Text style={[styles.contribVal, { color: c.value >= 0 ? theme.brand : theme.danger }]}>
                        {c.value >= 0 ? '+' : ''}{krwShort(c.value)}
                      </Text>
                    }
                    verticalPadding="small"
                  />
                  {idx < arr.length - 1 && <Border type="full" />}
                </React.Fragment>
              );
            })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  yearScroll: { paddingHorizontal: 20, paddingVertical: 12 },
  yearPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  yearPillText: { fontSize: 13, fontWeight: '600' },
  headlineCard: { marginHorizontal: 20, borderRadius: 16, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 18, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headlineDelta: { fontSize: 22, fontWeight: '800', flex: 1 },
  pctChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  pctChipText: { fontSize: 13, fontWeight: '700' },
  section: { marginHorizontal: 20, marginTop: 8, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  barRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 12 },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTopLabel: { fontSize: 10, fontWeight: '700', height: 14 },
  barBody: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 11, fontWeight: '600' },
  contribRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  accentBar: { width: 4, height: 32, borderRadius: 2 },
  contribInfo: { flex: 1 },
  contribTopRow: { flexDirection: 'row', gap: 8 },
  contribCat: { flex: 1, fontSize: 14, fontWeight: '600' },
  contribWeight: { fontSize: 12 },
  contribVal: { fontSize: 14, fontWeight: '700' },
});

export const Route = createRoute('/more/compare', {
  component: CompareScreen,
});
