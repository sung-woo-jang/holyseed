import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Border from '../../components/ui/Border';
import ListRow from '../../components/ui/ListRow';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/common/EmptyState';
import WaterfallChart from '../../components/charts/WaterfallChart';
import ChartLegend from '../../components/charts/ChartLegend';
import { useTheme } from '../../lib/theme';
import { useAuthStore } from '../../stores/auth.store';
import { comparisonApi } from '../../api';
import { qk } from '../../queries/keys';
import { krw, krwShort } from '../../lib/format';
import { TE } from '../../lib/toss-emoji';
import { formatRate, parseYearlyComparison } from '../../lib/net-worth';

// 신규 편입 막대·행 색 — 늘어남(초록)·줄어듦(빨강)과 구분되는 중립색
const NEW_ASSET_COLOR = '#8B95A1';

const shortDate = (d: string) => d.slice(5).replace('-', '/');

export default function CompareScreen() {
  const theme = useTheme();
  const hid = useAuthStore((s) => s.currentHousehold?.id);

  const compareQ = useQuery({
    queryKey: qk.comparison(hid ?? 0),
    queryFn: () => comparisonApi.yearly(hid!),
    enabled: !!hid,
    staleTime: 60_000,
  });

  const rows = useMemo(() => parseYearlyComparison(compareQ.data), [compareQ.data]);
  // 기록 시작 연도는 비교할 작년 말이 없어 막대로만 보여준다
  const comparable = rows.filter((r) => r.change != null);
  const [pickedYear, setPickedYear] = useState<number | null>(null);
  const [wfWidth, setWfWidth] = useState(0);
  const selected = comparable.find((r) => r.year === pickedYear) ?? comparable[comparable.length - 1];

  if (compareQ.isLoading) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }

  if (!selected) {
    return (
      <View style={[styles.root, { backgroundColor: theme.bg }]}>
        <EmptyState iconCode={TE.chartUp} title="비교할 데이터가 아직 부족해요" desc="작년 말 이전 스냅샷이 있어야 연도별 증감을 비교할 수 있어요" />
      </View>
    );
  }

  const prevYear = selected.year - 1;
  const change = selected.change ?? 0;
  const prevNetWorth = selected.prevNetWorth ?? 0;
  const endLabel = selected.isCurrentYear ? '현재' : `${selected.year}년말`;
  const periodText = `${prevYear}년 말 → ${selected.isCurrentYear ? `${shortDate(selected.asOf)} 기준 (올해 진행 중)` : `${selected.year}년 말`}`;
  const rateText = formatRate(selected.growthRate);

  const wfData: { label: string; value: number; color?: string }[] = [
    { label: `${prevYear}년말`, value: prevNetWorth },
    ...selected.contributions.map((c) => ({ label: c.label, value: c.value })),
    ...(selected.newAssetsKRW !== 0 ? [{ label: '신규 등록', value: selected.newAssetsKRW, color: NEW_ASSET_COLOR }] : []),
    { label: endLabel, value: selected.netWorth },
  ];

  const contribRows = [
    ...selected.contributions.map((c) => ({ key: c.category, label: c.label, color: c.color, value: c.value, sub: null as string | null })),
    ...(selected.newAssetsKRW !== 0
      ? [
          {
            key: 'new',
            label: '새로 기록한 자산',
            color: NEW_ASSET_COLOR,
            value: selected.newAssetsKRW,
            sub: selected.newAssets.length > 1 ? `${selected.newAssets[0].name} 외 ${selected.newAssets.length - 1}개` : (selected.newAssets[0]?.name ?? null),
          },
        ]
      : []),
  ].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const maxBar = Math.max(...rows.map((r) => Math.abs(r.netWorth)), 1);

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ paddingBottom: 32 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 12 }}>
        {comparable.map((r) => {
          const isActive = selected.year === r.year;
          return (
            <Pressable
              key={r.year}
              style={[styles.yearPill, { backgroundColor: isActive ? theme.brand : theme.bg, borderColor: isActive ? theme.brand : theme.border }]}
              onPress={() => setPickedYear(r.year)}
            >
              <Text style={{ color: isActive ? '#fff' : theme.textMuted, fontSize: 12, fontWeight: '700' }}>
                {r.year - 1} → {r.isCurrentYear ? '올해' : r.year}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.headlineCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.headlineRow}>
          <Text style={{ color: change >= 0 ? theme.brand : theme.danger, fontSize: 16, fontWeight: '800' }}>
            {change >= 0 ? '+' : ''}
            {krw(change)} {change >= 0 ? '늘었어요' : '줄었어요'}
          </Text>
          <View style={[styles.pctChip, { backgroundColor: (selected.growth ?? 0) >= 0 ? theme.brandSoft : (theme.dark ? '#3A1A1E' : '#FEE2E2') }]}>
            <Text style={{ color: (selected.growth ?? 0) >= 0 ? theme.brand : theme.danger, fontSize: 12, fontWeight: '700' }}>{rateText ?? '—'}</Text>
          </View>
        </View>
        <Text style={[styles.headlineSub, { color: theme.textMuted }]}>{periodText}</Text>
        {selected.newAssetsKRW !== 0 && (
          <Text style={[styles.headlineSub, { color: theme.textMuted }]}>
            새로 기록한 자산 {krwShort(selected.newAssetsKRW)}원은 증가율에서 뺐어요 · 실제 증가 {selected.growth! >= 0 ? '+' : ''}
            {krwShort(selected.growth!)}원
          </Text>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>연도별 순자산</Text>
        <View style={styles.barRow}>
          {rows.map((r) => {
            const h = Math.max(8, (Math.abs(r.netWorth) / maxBar) * 120);
            const isActive = r.year === selected.year;
            const color = r.netWorth < 0 ? theme.danger : theme.brand;
            return (
              <Pressable key={r.year} style={styles.barCol} onPress={() => setPickedYear(r.year)} disabled={r.change == null}>
                <Text style={{ color: isActive ? color : theme.textMuted, fontSize: 10, fontWeight: isActive ? '700' : '500', height: 14 }} numberOfLines={1}>
                  {krwShort(r.netWorth)}
                </Text>
                <View style={[styles.barBody, { height: h, backgroundColor: isActive ? color : r.netWorth < 0 ? 'rgba(239,68,68,0.25)' : theme.brandSoft }]} />
                <Text style={{ color: isActive ? theme.brand : theme.textMuted, fontSize: 11, fontWeight: '700', marginTop: 4 }}>{r.year}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {selected.staleAssets.length > 0 && (
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 4 }]}>
            {selected.isCurrentYear ? '오래된 값으로 계산한 자산이 있어요' : `${selected.year}년 말 값이 추정값인 자산이 있어요`}
          </Text>
          <Text style={[styles.hint, { color: theme.textMuted, marginBottom: 8 }]}>
            기준일과 한 달 넘게 떨어진 기록을 그대로 썼어요. 자산 상세에서 {selected.isCurrentYear ? '최근' : `${selected.year}-12-31`} 잔액을 입력하면 정확해져요.
          </Text>
          {selected.staleAssets.map((a) => (
            <View key={a.assetId} style={styles.staleRow}>
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                {a.name}
              </Text>
              <Text style={{ color: theme.danger, fontSize: 12, fontWeight: '600' }}>
                {a.snapshotDate} 기록 · {a.daysBefore}일 전
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>자산군별 증감 워터폴</Text>
        <View onLayout={(e) => setWfWidth(Math.floor(e.nativeEvent.layout.width))}>
          {wfWidth > 0 && <WaterfallChart data={wfData} width={wfWidth} height={220} dark={theme.dark} />}
        </View>
        <ChartLegend
          items={[
            { kind: 'bar', color: '#3182F6', label: '시작·끝 순자산' },
            { kind: 'bar', color: '#0AB39C', label: '늘어난 자산군' },
            { kind: 'bar', color: '#EF4444', label: '줄어든 자산군' },
            ...(selected.newAssetsKRW !== 0 ? [{ kind: 'bar' as const, color: NEW_ASSET_COLOR, label: '새로 기록한 자산' }] : []),
          ]}
          hint="시작 순자산에서 자산군별 증감이 차례로 쌓여 끝 순자산이 돼요."
        />
      </View>

      {selected.flows && (
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 4 }]}>왜 변했나요?</Text>
          <Text style={[styles.hint, { color: theme.textMuted }]}>가계부 수입·지출로 설명되는 부분과 나머지를 나눠봤어요</Text>
          <View style={styles.whyRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.whyLabel, { color: theme.text }]}>모은 돈 (수입 − 지출)</Text>
              <Text style={[styles.whyMeta, { color: theme.textMuted }]}>
                수입 {krwShort(selected.flows.income)}원 · 지출 {krwShort(selected.flows.expense)}원
              </Text>
            </View>
            <Text style={[styles.whyValue, { color: selected.flows.saved >= 0 ? theme.brand : theme.danger }]}>
              {selected.flows.saved >= 0 ? '+' : ''}
              {krwShort(selected.flows.saved)}원
            </Text>
          </View>
          <View style={styles.whyRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.whyLabel, { color: theme.text }]}>투자 평가·기타</Text>
              <Text style={[styles.whyMeta, { color: theme.textMuted }]}>주가 변동, 스냅샷 입력 시차 등</Text>
            </View>
            <Text style={[styles.whyValue, { color: selected.flows.other >= 0 ? theme.brand : theme.danger }]}>
              {selected.flows.other >= 0 ? '+' : ''}
              {krwShort(selected.flows.other)}원
            </Text>
          </View>
          {selected.newAssetsKRW !== 0 && (
            <View style={styles.whyRow}>
              <Text style={[styles.whyLabel, { color: theme.text, flex: 1 }]}>새로 기록한 자산</Text>
              <Text style={[styles.whyValue, { color: theme.textMuted }]}>
                {selected.newAssetsKRW >= 0 ? '+' : ''}
                {krwShort(selected.newAssetsKRW)}원
              </Text>
            </View>
          )}
          <Border type="full" />
          <View style={styles.whyRow}>
            <Text style={[styles.whyLabel, { color: theme.text, flex: 1 }]}>순자산 변화</Text>
            <Text style={[styles.whyValue, { color: change >= 0 ? theme.brand : theme.danger }]}>
              {change >= 0 ? '+' : ''}
              {krwShort(change)}원
            </Text>
          </View>
        </View>
      )}

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>자산군별 기여</Text>
        {contribRows.map((c, idx, arr) => {
          const weight = Math.abs(change) > 0 ? ((Math.abs(c.value) / Math.abs(change)) * 100).toFixed(0) : '0';
          const isNew = c.key === 'new';
          return (
            <View key={c.key}>
              <ListRow
                left={<View style={[styles.accentBar, { backgroundColor: c.color }]} />}
                contents={
                  <View>
                    <View style={styles.contribTopRow}>
                      <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{c.label}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 11 }}>{weight}%</Text>
                    </View>
                    {c.sub && (
                      <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                        {c.sub}
                      </Text>
                    )}
                  </View>
                }
                right={
                  <Text style={{ color: isNew ? theme.textMuted : c.value >= 0 ? theme.brand : theme.danger, fontSize: 14, fontWeight: '700' }}>
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
        {selected.newAssets.length > 0 && (
          <Text style={[styles.hint, { color: theme.textMuted, marginTop: 8 }]}>
            새로 기록한 자산은 {prevYear}-12-31 기록이 없어서 늘어난 돈이 아니라 새로 편입된 돈으로 봤어요. 자산 상세에서 그날 잔액을 입력하면 증가율에 반영돼요.
            {'\n'}
            {selected.newAssets.map((a) => `${a.name} (첫 기록 ${a.firstSnapshotDate})`).join(', ')}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  yearScroll: { flexGrow: 0 },
  yearPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  headlineCard: { marginHorizontal: 20, borderRadius: 16, borderWidth: 1, padding: 16, gap: 6 },
  headlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headlineSub: { fontSize: 12 },
  pctChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  section: { marginHorizontal: 20, marginTop: 12, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  hint: { fontSize: 12, lineHeight: 17 },
  barRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  barCol: { alignItems: 'center', flex: 1 },
  barBody: { width: 20, borderRadius: 6 },
  accentBar: { width: 4, height: 32, borderRadius: 2 },
  contribTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  staleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  whyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  whyLabel: { fontSize: 13.5, fontWeight: '600' },
  whyMeta: { fontSize: 11, marginTop: 2 },
  whyValue: { fontSize: 14, fontWeight: '800' },
});
