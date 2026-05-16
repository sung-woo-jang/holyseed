import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDataSource, useMockRole } from '../lib/data-source';
import { useTheme } from '../lib/theme';
import { krw, krwShort, pct } from '../lib/format';
import { getCategoryDef } from '../lib/category-meta';
import { TE } from '../lib/toss-emoji';
import Segmented from '../components/common/Segmented';
import AutoBadge from '../components/common/AutoBadge';
import TossEmoji from '../components/common/TossEmoji';
import { Icon } from '../components/common/Icon';
import LineChart from '../components/charts/LineChart';
import DonutChart from '../components/charts/DonutChart';
import SnapshotSheet from '../components/sheets/SnapshotSheet';

export default function HomeScreen() {
  const theme = useTheme();
  const role = useMockRole();
  const data = useDataSource();
  const [chartRange, setChartRange] = useState('1년');
  const [snapshotVisible, setSnapshotVisible] = useState(false);

  const nw = data.netWorth;
  const change = nw.current - nw.lastYear;
  const changePct = (change / nw.lastYear) * 100;
  const isViewer = role === 'VIEWER';

  const all = nw.monthlyHistory;
  const sliced = chartRange === '1년' ? all.slice(-12) : chartRange === '3년' ? all.slice(-36) : all;
  const first = sliced[0]?.value ?? 0;
  const last = sliced[sliced.length - 1]?.value ?? 0;
  const delta = last - first;
  const deltaPct = first ? (delta / first) * 100 : 0;

  const recentTxs = data.transactions.slice(0, 3);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={styles.content}>
      {/* Period label */}
      <View style={styles.periodRow}>
        <Text style={[styles.periodLeft, { color: theme.textMuted }]}>전년 동기 대비</Text>
        <Text style={[styles.periodRight, { color: theme.textMuted }]}>{nw.snapshotDate} 기준</Text>
      </View>

      {/* Net worth hero */}
      <View style={styles.heroBlock}>
        <Text style={[styles.heroLabel, { color: theme.textMuted }]}>우리집 순자산</Text>
        <Text style={[styles.heroValue, { color: theme.text }]}>{krw(nw.current)}</Text>
        <View style={styles.changeRow}>
          <View style={[styles.changePill, { backgroundColor: theme.brandSoft }]}>
            {Icon.arrowUp(theme.brand)}
            <Text style={[styles.changePillText, { color: theme.brand }]}>{pct(changePct)}</Text>
          </View>
          <Text style={[styles.changeAbs, { color: theme.text }]}>{krw(change)}</Text>
        </View>
      </View>

      {/* Snapshot CTA */}
      {!isViewer && (
        <View style={styles.sectionPad}>
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: theme.brand }]}
            onPress={() => setSnapshotVisible(true)}
          >
            <View style={styles.ctaLeft}>
              <TossEmoji code={TE.camera} size={20} />
              <Text style={styles.ctaBtnText}>이번 달 자산 스냅샷 입력하기</Text>
            </View>
            {Icon.chevronRight('#fff')}
          </TouchableOpacity>
          <Text style={[styles.ctaCaption, { color: theme.textMuted }]}>마지막 입력 후 32일 지났어요</Text>
        </View>
      )}

      {/* Chart card */}
      <View style={styles.sectionPad}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>순자산 변화</Text>
            <Segmented options={['1년', '3년', '5년']} value={chartRange} onChange={setChartRange} small />
          </View>
          <Text style={[styles.chartSubtitle, { color: theme.textMuted }]}>
            {sliced[0]?.date} → {sliced[sliced.length - 1]?.date}
            {'  '}
            <Text style={{ color: delta >= 0 ? theme.brand : theme.danger, fontWeight: '700' }}>
              {delta > 0 ? '+' : ''}{krwShort(delta)}원 ({pct(deltaPct)})
            </Text>
          </Text>
          <LineChart data={sliced} width={295} height={180} color={theme.brand} dark={theme.dark} />
          <Text style={[styles.chartHint, { color: theme.textMuted }]}>
            그래프를 길게 누르거나 호버하면 그 시점의 금액을 볼 수 있어요
          </Text>
        </View>
      </View>

      {/* YoY waterfall link */}
      <View style={styles.sectionPad}>
        <TouchableOpacity style={[styles.card, styles.yoyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.yoyTitle, { color: theme.text }]}>작년이랑 얼마나 달라졌지?</Text>
            <Text style={[styles.yoySub, { color: theme.textMuted }]}>자산군별 증감 워터폴 보기</Text>
          </View>
          {Icon.chevronRight(theme.textMuted)}
        </TouchableOpacity>
      </View>

      {/* Donut contribution card */}
      <View style={styles.sectionPad}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>올해 자산군별 기여도</Text>
          <Text style={[styles.cardSub, { color: theme.textMuted }]}>우리집 순자산이 얼마나 늘었는지 자산별로 쪼개봤어요</Text>
          <View style={styles.donutRow}>
            <View style={styles.donutWrap}>
              <DonutChart data={data.contributions} size={140} thickness={18} dark={theme.dark} />
              <View style={styles.donutCenter}>
                <Text style={[styles.donutLabel, { color: theme.textMuted }]}>총 기여</Text>
                <Text style={[styles.donutValue, { color: theme.text }]}>
                  +{krwShort(data.contributions.reduce((s, c) => s + c.value, 0))}
                </Text>
              </View>
            </View>
            <View style={styles.legend}>
              {data.contributions.slice(0, 4).map((c, i) => (
                <View key={i} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                  <Text style={[styles.legendCat, { color: theme.text }]}>{c.category}</Text>
                  <Text style={[styles.legendVal, { color: c.value >= 0 ? theme.brand : theme.danger }]}>
                    {c.value > 0 ? '+' : ''}{krwShort(c.value)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <View style={[styles.insightBox, { backgroundColor: theme.brandSoft }]}>
            <Text style={[styles.insightText, { color: theme.text }]}>
              {'💡 '}
              <Text style={{ fontWeight: '700' }}>{data.contributions[0]?.category}</Text>
              {`가 우리집 자산 성장의 가장 큰 원동력이에요.\n올해만 +${krwShort(data.contributions[0]?.value ?? 0)} 기여했어요.`}
            </Text>
          </View>
        </View>
      </View>

      {/* Recent transactions */}
      <View style={styles.sectionPad}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>최근 거래</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAll, { color: theme.textMuted }]}>모두 보기</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {recentTxs.map((tx, i) => {
            const catDef = getCategoryDef(tx.category);
            return (
              <View key={tx.id} style={[styles.txRow, i < recentTxs.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                <View style={[styles.txIcon, { backgroundColor: theme.bg }]}>
                  <TossEmoji code={catDef.iconCode} size={22} />
                </View>
                <View style={styles.txInfo}>
                  <View style={styles.txTitleRow}>
                    <Text style={[styles.txTitle, { color: theme.text }]} numberOfLines={1}>{tx.title}</Text>
                    {tx.auto && <AutoBadge />}
                  </View>
                  <Text style={[styles.txMeta, { color: theme.textMuted }]}>
                    {tx.category} · {tx.date.slice(5).replace('-', '/')}
                  </Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.type === 'INCOME' ? theme.brand : tx.type === 'TRANSFER' ? theme.textMuted : theme.text }]}>
                  {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                  {krwShort(tx.amount)}원
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <SnapshotSheet
        visible={snapshotVisible}
        onClose={() => setSnapshotVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 120 },
  periodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  periodLeft: { fontSize: 14, fontWeight: '500' },
  periodRight: { fontSize: 12 },
  heroBlock: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20 },
  heroLabel: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  heroValue: { fontSize: 34, fontWeight: '800', letterSpacing: -1, lineHeight: 40 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  changePill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  changePillText: { fontSize: 13, fontWeight: '700' },
  changeAbs: { fontSize: 13, fontWeight: '600' },
  sectionPad: { paddingHorizontal: 20, paddingBottom: 16 },
  ctaBtn: { width: '100%', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ctaLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctaBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  ctaCaption: { fontSize: 12, textAlign: 'center', marginTop: 8 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  cardSub: { fontSize: 12, marginBottom: 16 },
  chartSubtitle: { fontSize: 12, marginBottom: 6 },
  chartHint: { fontSize: 10, textAlign: 'center', marginTop: 4 },
  yoyCard: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  yoyTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  yoySub: { fontSize: 12 },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutWrap: { position: 'relative' },
  donutCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  donutLabel: { fontSize: 10, fontWeight: '500' },
  donutValue: { fontSize: 16, fontWeight: '800' },
  legend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendCat: { flex: 1, fontSize: 12, fontWeight: '500' },
  legendVal: { fontSize: 12, fontWeight: '700' },
  insightBox: { marginTop: 12, padding: 12, borderRadius: 10 },
  insightText: { fontSize: 12, lineHeight: 18 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  seeAll: { fontSize: 12 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  txIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1, minWidth: 0 },
  txTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  txTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
  txMeta: { fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
});
