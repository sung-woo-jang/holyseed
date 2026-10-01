import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import Badge from '../components/ui/Badge';
import Border from '../components/ui/Border';
import Button from '../components/ui/Button';
import ListRow from '../components/ui/ListRow';
import TextButton from '../components/ui/TextButton';
import { useHouseholdData } from '../queries/useHouseholdData';
import { useTheme } from '../lib/theme';
import { krw, krwShort, pct } from '../lib/format';
import { TE } from '../lib/toss-emoji';
import { resolveCategoryVisual } from '../lib/category-meta';
import CategoryIcon from '../components/common/CategoryIcon';
import Segmented from '../components/common/Segmented';
import AutoBadge from '../components/common/AutoBadge';
import TossEmoji from '../components/common/TossEmoji';
import { Icon } from '../components/common/Icon';
import LineChart from '../components/charts/LineChart';
import SnapshotSheet from '../components/sheets/SnapshotSheet';
import EmptyState from '../components/common/EmptyState';
import AppToast from '../components/common/AppToast';
import { todayLocal, daysBetween, isSameMonth } from '../lib/date';
import {
  PERIOD_BASE_TEXT,
  PERIOD_LABELS,
  categoryContributions,
  findStaleAssets,
  hasFlowCoverage,
  sumFlows,
  summarizeChange,
  type PeriodKey,
} from '../lib/net-worth';
import type { MainTabParamList } from '../navigation/types';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const data = useHouseholdData();
  const [chartRange, setChartRange] = useState('1년');
  const [periodLabel, setPeriodLabel] = useState(PERIOD_LABELS.d30);
  const [snapshotVisible, setSnapshotVisible] = useState(false);
  const [staleSheetVisible, setStaleSheetVisible] = useState(false);
  const [toast, setToast] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await data.refetch();
    } finally {
      setRefreshing(false);
    }
  }

  // 마지막 스냅샷 입력일 (자산별 최신 스냅샷 날짜의 최댓값)
  const lastInputDate = data.assets.reduce<string | null>(
    (max, a) => (a.snapshotDate && (!max || a.snapshotDate > max) ? a.snapshotDate : max),
    null,
  );
  const today = todayLocal();
  const inputDoneThisMonth = !!lastInputDate && isSameMonth(lastInputDate, today);
  const ctaCaption = !lastInputDate
    ? '첫 스냅샷을 입력하면 순자산 추이가 시작돼요'
    : inputDoneThisMonth
      ? `이번 달 입력 완료 · ${daysBetween(lastInputDate, today)}일 전`
      : `마지막 입력 후 ${daysBetween(lastInputDate, today)}일 지났어요`;

  const nw = data.netWorth;
  const periodKey = (Object.keys(PERIOD_LABELS) as PeriodKey[]).find((k) => PERIOD_LABELS[k] === periodLabel) ?? 'd30';
  const base = data.periods?.[periodKey] ?? null;
  const summary = base ? summarizeChange(base.netWorth, nw.current) : null;
  const up = (summary?.change ?? 0) >= 0;

  // 수입·지출로 설명되는 변화(모은 돈)와 나머지(평가손익·입력 차이)로 분해 — 거래 기록이 기준일 이전부터 있을 때만
  const flows = useMemo(() => {
    if (!base || !summary || !hasFlowCoverage(data.transactions, base.date)) return null;
    const f = sumFlows(data.transactions, base.date, today);
    const saved = f.income - f.expense;
    return { ...f, saved, other: summary.change - saved };
  }, [base, summary, data.transactions, today]);

  const contribs = useMemo(() => (base ? categoryContributions(data.donut, base.byCategory) : []), [base, data.donut]);
  const maxContrib = Math.max(...contribs.map((c) => Math.abs(c.value)), 1);

  const staleAssets = useMemo(() => findStaleAssets(data.assets, today), [data.assets, today]);

  const all = nw.monthlyHistory;
  const sliced = chartRange === '1년' ? all.slice(-12) : chartRange === '3년' ? all.slice(-36) : all;
  const chartChange = summarizeChange(sliced[0]?.value ?? 0, sliced[sliced.length - 1]?.value ?? 0);

  const pastTxs = data.transactions.filter((t) => t.date <= today);
  const recentTxs = pastTxs.slice(0, 3);
  const upcomingTxs = data.transactions
    .filter((t) => t.date > today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  function renderTx(tx: (typeof data.transactions)[number], i: number, list: unknown[], upcoming = false) {
    const catVisual = resolveCategoryVisual(tx.categoryId, tx.category, data.categories);
    return (
      <React.Fragment key={tx.id}>
        <ListRow
          left={
            <View style={[styles.txIcon, { backgroundColor: theme.bg }]}>
              <CategoryIcon icon={catVisual.icon} size={22} />
            </View>
          }
          contents={
            <View style={{ minWidth: 0 }}>
              <View style={styles.txTitleRow}>
                <Text style={[styles.txTitle, { color: theme.text }]} numberOfLines={1}>
                  {tx.title}
                </Text>
                {tx.auto && <AutoBadge />}
              </View>
              <Text style={[styles.txMeta, { color: theme.textMuted }]}>
                {tx.category} · {tx.date.slice(5).replace('-', '/')}
                {upcoming ? ` · ${daysBetween(today, tx.date)}일 뒤` : ''}
              </Text>
            </View>
          }
          right={
            <Text style={[styles.txAmount, { color: upcoming ? theme.textMuted : tx.type === 'INCOME' ? theme.brand : theme.text }]}>
              {tx.type === 'INCOME' ? '+' : '-'}
              {krwShort(tx.amount)}원
            </Text>
          }
          verticalPadding="small"
        />
        {i < list.length - 1 && <Border type="full" />}
      </React.Fragment>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand} colors={[theme.brand]} />}
      >
        {/* Net worth hero */}
        <View style={styles.heroBlock}>
          <View style={styles.periodRow}>
            <Text style={[styles.heroLabel, { color: theme.textMuted }]}>우리집 순자산</Text>
            <Text style={[styles.periodText, { color: theme.textMuted }]}>{data.periods?.asOf ?? nw.snapshotDate} 기준</Text>
          </View>
          <Text style={[styles.heroValue, { color: theme.text }]}>{krw(nw.current)}</Text>
          {summary && base && (
            <>
              <View style={styles.changeRow}>
                {summary.rateText && (
                  <Badge type={up ? 'blue' : 'red'} badgeStyle="weak" size="small">
                    {summary.rateText}
                  </Badge>
                )}
                <Text style={[styles.changeAbs, { color: up ? theme.brand : theme.danger }]}>
                  {up ? '+' : ''}
                  {krw(summary.change)}
                </Text>
                <Text style={[styles.periodText, { color: theme.textMuted }]}>{PERIOD_BASE_TEXT[periodKey]} 대비</Text>
              </View>
              <Text style={[styles.baseLine, { color: theme.textMuted }]}>
                {base.date} {krwShort(base.netWorth)}원 → 지금 {krwShort(nw.current)}원
              </Text>
            </>
          )}
          <View style={styles.periodSeg}>
            <Segmented options={Object.values(PERIOD_LABELS)} value={periodLabel} onChange={setPeriodLabel} small alignment="fluid" />
          </View>
        </View>

        {/* Snapshot CTA */}
        <View style={styles.sectionPad}>
          <Button
            display="full"
            size="big"
            type="primary"
            style={inputDoneThisMonth ? 'weak' : 'fill'}
            leftAccessory={<TossEmoji code={inputDoneThisMonth ? TE.check : TE.camera} size={18} />}
            onPress={() => setSnapshotVisible(true)}
          >
            {inputDoneThisMonth ? '이번 달 스냅샷 다시 입력하기' : '이번 달 자산 스냅샷 입력하기'}
          </Button>
          <Text style={[styles.ctaCaption, { color: theme.textMuted }]}>{ctaCaption}</Text>
        </View>

        {/* Stale assets */}
        {staleAssets.length > 0 && (
          <View style={styles.sectionPad}>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{staleAssets.length}개 자산이 일주일 넘게 그대로예요</Text>
              <Text style={[styles.cardSub, { color: theme.textMuted }]}>오래된 값이 섞이면 순자산이 실제와 달라질 수 있어요</Text>
              {staleAssets.slice(0, 3).map((a) => (
                <View key={a.id} style={styles.staleRow}>
                  <Text style={[styles.staleName, { color: theme.text }]} numberOfLines={1}>
                    {a.name}
                  </Text>
                  <Text style={[styles.staleDays, { color: theme.danger }]}>{a.daysAgo}일 전</Text>
                </View>
              ))}
              {staleAssets.length > 3 && <Text style={[styles.txMeta, { color: theme.textMuted }]}>외 {staleAssets.length - 3}개</Text>}
              <View style={{ marginTop: 12 }}>
                <Button display="full" size="medium" type="primary" style="weak" onPress={() => setStaleSheetVisible(true)}>
                  이 자산만 입력하기
                </Button>
              </View>
            </View>
          </View>
        )}

        {/* Why it changed */}
        {flows && base && (
          <View style={styles.sectionPad}>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{PERIOD_BASE_TEXT[periodKey]}부터 왜 변했나요?</Text>
              <Text style={[styles.cardSub, { color: theme.textMuted }]}>가계부 수입·지출로 설명되는 부분과 나머지를 나눠봤어요</Text>
              <View style={styles.whyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.whyLabel, { color: theme.text }]}>모은 돈 (수입 − 지출)</Text>
                  <Text style={[styles.txMeta, { color: theme.textMuted }]}>
                    수입 {krwShort(flows.income)}원 · 지출 {krwShort(flows.expense)}원
                  </Text>
                </View>
                <Text style={[styles.whyValue, { color: flows.saved >= 0 ? theme.brand : theme.danger }]}>
                  {flows.saved >= 0 ? '+' : ''}
                  {krwShort(flows.saved)}원
                </Text>
              </View>
              <View style={styles.whyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.whyLabel, { color: theme.text }]}>투자 평가·기타</Text>
                  <Text style={[styles.txMeta, { color: theme.textMuted }]}>주가 변동, 스냅샷 입력 시차 등</Text>
                </View>
                <Text style={[styles.whyValue, { color: flows.other >= 0 ? theme.brand : theme.danger }]}>
                  {flows.other >= 0 ? '+' : ''}
                  {krwShort(flows.other)}원
                </Text>
              </View>
              <Border type="full" />
              <View style={styles.whyRow}>
                <Text style={[styles.whyLabel, { color: theme.text, flex: 1 }]}>순자산 변화</Text>
                <Text style={[styles.whyValue, { color: up ? theme.brand : theme.danger }]}>
                  {up ? '+' : ''}
                  {krwShort(summary!.change)}원
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Chart card */}
        <View style={styles.sectionPad}>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>순자산 변화</Text>
              <Segmented options={['1년', '3년', '전체']} value={chartRange} onChange={setChartRange} small alignment="fluid" />
            </View>
            <Text style={[styles.chartSubtitle, { color: theme.textMuted }]}>
              {sliced[0]?.date} → {sliced[sliced.length - 1]?.date}{'  '}
              <Text style={{ color: chartChange.change >= 0 ? theme.brand : theme.danger, fontWeight: '700' }}>
                {chartChange.change > 0 ? '+' : ''}
                {krwShort(chartChange.change)}원{chartChange.rateText ? ` (${chartChange.rateText})` : ''}
              </Text>
            </Text>
            <LineChart data={sliced} width={295} height={180} color={theme.brand} dark={theme.dark} />
            <Text style={[styles.chartHint, { color: theme.textMuted }]}>그래프를 눌러서 그 시점의 금액을 볼 수 있어요</Text>
          </View>
        </View>

        {/* YoY waterfall link */}
        <View style={styles.sectionPad}>
          <Pressable
            style={[styles.card, styles.yoyCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => navigation.navigate('More', { screen: 'Compare' })}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.yoyTitle, { color: theme.text }]}>작년이랑 얼마나 달라졌지?</Text>
              <Text style={[styles.yoySub, { color: theme.textMuted }]}>자산군별 증감 워터폴 보기</Text>
            </View>
            {Icon.chevronRight(theme.textMuted)}
          </Pressable>
        </View>

        {/* Category contribution card */}
        <View style={styles.sectionPad}>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{PERIOD_BASE_TEXT[periodKey]}보다 자산군별로 이만큼 달라졌어요</Text>
            <Text style={[styles.cardSub, { color: theme.textMuted }]}>순자산 변화를 자산군별로 쪼갠 값이에요 (부채가 줄면 +)</Text>
            {contribs.length === 0 ? (
              <EmptyState compact iconCode={TE.chartBar} title="아직 비교할 데이터가 없어요" desc="스냅샷이 쌓이면 자산군별 변화가 표시돼요" />
            ) : (
              contribs.map((c) => (
                <View key={c.category} style={styles.contribBlock}>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                    <Text style={[styles.legendCat, { color: theme.text }]} numberOfLines={1}>
                      {c.label}
                    </Text>
                    <Text style={[styles.legendVal, { color: c.value >= 0 ? theme.brand : theme.danger }]}>
                      {c.value > 0 ? '+' : ''}
                      {krwShort(c.value)}원
                    </Text>
                  </View>
                  <View style={[styles.barTrack, { backgroundColor: theme.border }]}>
                    <View style={[styles.barFill, { width: `${Math.max(3, (Math.abs(c.value) / maxContrib) * 100)}%`, backgroundColor: c.value >= 0 ? c.color : theme.danger }]} />
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Recent transactions */}
        <View style={styles.sectionPad}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>최근 거래</Text>
            {recentTxs.length > 0 && (
              <TextButton typography="t5" variant="clear" color={theme.textMuted} onPress={() => navigation.navigate('Book', { screen: 'BookHome' })}>
                모두 보기
              </TextButton>
            )}
          </View>
          {recentTxs.length === 0 && <EmptyState compact iconCode={TE.receipt} title="아직 거래 내역이 없어요" desc="가계부에서 첫 거래를 기록해보세요" />}
          {recentTxs.map((tx, i) => renderTx(tx, i, recentTxs))}
          {upcomingTxs.length > 0 && (
            <>
              <Text style={[styles.upcomingTitle, { color: theme.textMuted }]}>예정된 거래 · {upcomingTxs.length}건</Text>
              {upcomingTxs.map((tx, i) => renderTx(tx, i, upcomingTxs, true))}
            </>
          )}
        </View>
      </ScrollView>

      <SnapshotSheet visible={snapshotVisible} onClose={() => setSnapshotVisible(false)} onSaved={() => setToast('스냅샷을 저장했어요')} />
      <SnapshotSheet
        visible={staleSheetVisible}
        onClose={() => setStaleSheetVisible(false)}
        onlyAssetIds={staleAssets.map((a) => a.id)}
        onSaved={() => setToast('스냅샷을 저장했어요')}
      />
      <AppToast open={!!toast} text={toast} onClose={() => setToast('')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 24 },
  periodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  periodText: { fontSize: 12 },
  heroBlock: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  heroLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  heroValue: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  changeAbs: { fontSize: 14, fontWeight: '700' },
  baseLine: { fontSize: 12, marginTop: 6 },
  periodSeg: { marginTop: 12 },
  staleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  staleName: { flex: 1, fontSize: 13, fontWeight: '600' },
  staleDays: { fontSize: 12, fontWeight: '700' },
  whyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  whyLabel: { fontSize: 13.5, fontWeight: '600' },
  whyValue: { fontSize: 14, fontWeight: '800' },
  contribBlock: { marginTop: 12, gap: 6 },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  upcomingTitle: { fontSize: 12, fontWeight: '700', marginTop: 16, marginBottom: 4 },
  sectionPad: { paddingHorizontal: 20, paddingTop: 16 },
  ctaCaption: { fontSize: 12, textAlign: 'center', marginTop: 8 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardSub: { fontSize: 12, marginBottom: 12 },
  chartSubtitle: { fontSize: 11, marginBottom: 6 },
  chartHint: { fontSize: 10, marginTop: 4, textAlign: 'center' },
  yoyCard: { flexDirection: 'row', alignItems: 'center' },
  yoyTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  yoySub: { fontSize: 12 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendCat: { flex: 1, fontSize: 12, fontWeight: '600' },
  legendVal: { fontSize: 12, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  txIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  txTitle: { fontSize: 14, fontWeight: '600' },
  txMeta: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
});
