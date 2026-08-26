import React, { useState } from 'react';
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
import DonutChart from '../components/charts/DonutChart';
import SnapshotSheet from '../components/sheets/SnapshotSheet';
import EmptyState from '../components/common/EmptyState';
import AppToast from '../components/common/AppToast';
import { todayLocal, daysBetween, isSameMonth } from '../lib/date';
import type { MainTabParamList } from '../navigation/types';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const data = useHouseholdData();
  const [chartRange, setChartRange] = useState('1년');
  const [snapshotVisible, setSnapshotVisible] = useState(false);
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
  const change = nw.current - nw.lastYear;
  const changePct = nw.lastYear > 0 ? (change / nw.lastYear) * 100 : 0;

  const all = nw.monthlyHistory;
  const sliced = chartRange === '1년' ? all.slice(-12) : chartRange === '3년' ? all.slice(-36) : all;
  const first = sliced[0]?.value ?? 0;
  const last = sliced[sliced.length - 1]?.value ?? 0;
  const delta = last - first;
  const deltaPct = first ? (delta / first) * 100 : 0;

  const recentTxs = data.transactions.slice(0, 3);

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand} colors={[theme.brand]} />}
      >
        {/* Period label */}
        <View style={styles.periodRow}>
          <Text style={[styles.periodText, { color: theme.textMuted }]}>전년 동기 대비</Text>
          <Text style={[styles.periodText, { color: theme.textMuted }]}>{nw.snapshotDate} 기준</Text>
        </View>

        {/* Net worth hero */}
        <View style={styles.heroBlock}>
          <Text style={[styles.heroLabel, { color: theme.textMuted }]}>우리집 순자산</Text>
          <Text style={[styles.heroValue, { color: theme.text }]}>{krw(nw.current)}</Text>
          <View style={styles.changeRow}>
            <Badge type="blue" badgeStyle="weak" size="small">
              {pct(changePct)}
            </Badge>
            <Text style={[styles.changeAbs, { color: theme.text }]}>{krw(change)}</Text>
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

        {/* Chart card */}
        <View style={styles.sectionPad}>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>순자산 변화</Text>
              <Segmented options={['1년', '3년', '5년']} value={chartRange} onChange={setChartRange} small alignment="fluid" />
            </View>
            <Text style={[styles.chartSubtitle, { color: theme.textMuted }]}>
              {sliced[0]?.date} → {sliced[sliced.length - 1]?.date}{'  '}
              <Text style={{ color: delta >= 0 ? theme.brand : theme.danger, fontWeight: '700' }}>
                {delta > 0 ? '+' : ''}
                {krwShort(delta)}원 ({pct(deltaPct)})
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

        {/* Donut contribution card */}
        <View style={styles.sectionPad}>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>올해 자산군별 기여도</Text>
            <Text style={[styles.cardSub, { color: theme.textMuted }]}>우리집 순자산이 얼마나 늘었는지 자산별로 쪼개봤어요</Text>
            {data.contributions.length === 0 ? (
              <EmptyState compact iconCode={TE.chartBar} title="아직 기여도 데이터가 없어요" desc="스냅샷을 입력하면 자산군별 기여도가 표시돼요" />
            ) : (
              <>
                <View style={styles.donutRow}>
                  <View style={styles.donutWrap}>
                    <DonutChart data={data.contributions} size={140} thickness={18} dark={theme.dark} />
                    <View style={styles.donutCenter}>
                      <Text style={[styles.donutLabel, { color: theme.textMuted }]}>총 기여</Text>
                      <Text style={[styles.donutValue, { color: theme.text }]}>
                        {(() => {
                          const sum = data.contributions.reduce((s, c) => s + c.value, 0);
                          return `${sum >= 0 ? '+' : ''}${krwShort(sum)}`;
                        })()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.legend}>
                    {data.contributions.slice(0, 4).map((c, i) => (
                      <View key={i} style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                        <Text style={[styles.legendCat, { color: theme.text }]} numberOfLines={1}>
                          {c.category}
                        </Text>
                        <Text style={[styles.legendVal, { color: c.value >= 0 ? theme.brand : theme.danger }]}>
                          {c.value > 0 ? '+' : ''}
                          {krwShort(c.value)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                {data.contributions[0] && (
                  <View style={[styles.insightBox, { backgroundColor: theme.brandSoft }]}>
                    <Text style={[styles.insightText, { color: theme.text }]}>
                      {'💡 '}
                      <Text style={{ fontWeight: '800' }}>{data.contributions[0].category}</Text>
                      {`가 우리집 자산 성장의 가장 큰 원동력이에요.\n올해만 +${krwShort(data.contributions[0].value)} 기여했어요.`}
                    </Text>
                  </View>
                )}
              </>
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
          {recentTxs.map((tx, i) => {
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
                      </Text>
                    </View>
                  }
                  right={
                    <Text style={[styles.txAmount, { color: tx.type === 'INCOME' ? theme.brand : theme.text }]}>
                      {tx.type === 'INCOME' ? '+' : '-'}
                      {krwShort(tx.amount)}원
                    </Text>
                  }
                  verticalPadding="small"
                />
                {i < recentTxs.length - 1 && <Border type="full" />}
              </React.Fragment>
            );
          })}
        </View>
      </ScrollView>

      <SnapshotSheet visible={snapshotVisible} onClose={() => setSnapshotVisible(false)} onSaved={() => setToast('스냅샷을 저장했어요')} />
      <AppToast open={!!toast} text={toast} onClose={() => setToast('')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 24 },
  periodRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12 },
  periodText: { fontSize: 12 },
  heroBlock: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  heroLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  heroValue: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  changeAbs: { fontSize: 14, fontWeight: '700' },
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
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  donutWrap: { alignItems: 'center', justifyContent: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  donutLabel: { fontSize: 11 },
  donutValue: { fontSize: 15, fontWeight: '800' },
  legend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendCat: { flex: 1, fontSize: 12, fontWeight: '600' },
  legendVal: { fontSize: 12, fontWeight: '700' },
  insightBox: { borderRadius: 12, padding: 12, marginTop: 14 },
  insightText: { fontSize: 12.5, lineHeight: 18 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  txIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  txTitle: { fontSize: 14, fontWeight: '600' },
  txMeta: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
});
