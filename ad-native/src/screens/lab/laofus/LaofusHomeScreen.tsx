import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Loader from '../../../components/ui/Loader';
import { laofusRestApi, type EventDto } from '../../../api/laofus';
import { computeIndicators, computeBuyLocLegs, computeSellLocLegs, type ImuState } from '../../../lib/laofus-core';
import { useTheme } from '../../../lib/theme';
import { useKeyboardScrollRegistration, KeyboardScrollProvider } from '../../../lib/keyboard-scroll';
import { getLaofusDismissedErrorId, setLaofusDismissedErrorId } from '../../../lib/lab-prefs';
import type { LaofusStackParamList } from '../../../navigation/LaofusStack';

type Props = NativeStackScreenProps<LaofusStackParamList, 'LaofusHome'>;

function n(v: string | number | null | undefined): number {
  return Number(v ?? 0);
}
function usd(v: number, d = 2): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
}
function kst(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Tile({ label, value, sub, color, theme }: { label: string; value: string; sub?: string; color?: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.tile, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={{ color: theme.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: color ?? theme.text, fontSize: 19, fontWeight: '800', marginTop: 2 }}>{value}</Text>
      {sub && <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 2 }}>{sub}</Text>}
    </View>
  );
}

/** 온주 LOC 스탠딩 주문은 engine_state만으로 계산되고 현재가와 무관 — 매수/매도 legs를 그대로 나열해서 보여준다 */
function LegsCard({ s, theme }: { s: ImuState; theme: ReturnType<typeof useTheme> }) {
  const buyLegs = computeBuyLocLegs(s);
  const sellLegs = computeSellLocLegs(s);
  if (buyLegs.length === 0 && sellLegs.length === 0) {
    return <Text style={{ color: theme.textMuted, fontSize: 13 }}>오늘 걸릴 주문 없음 (리버스모드 대상이거나 사이클 시작 대기)</Text>;
  }
  return (
    <View style={{ gap: 8 }}>
      {buyLegs.map((leg, i) => (
        <View key={`b${i}`} style={styles.legRow}>
          <Text style={{ color: theme.brand, fontSize: 12, fontWeight: '800', width: 34 }}>매수</Text>
          <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', flex: 1 }}>
            {leg.quantity}주 @ {usd(leg.price)}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>{leg.halfStep ? '절반' : '전액'}</Text>
        </View>
      ))}
      {sellLegs.map((leg, i) => (
        <View key={`s${i}`} style={styles.legRow}>
          <Text style={{ color: theme.danger, fontSize: 12, fontWeight: '800', width: 34 }}>매도</Text>
          <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', flex: 1 }}>
            {leg.quantity}주 @ {usd(leg.price)}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>{leg.kind}</Text>
        </View>
      ))}
    </View>
  );
}

export default function LaofusHomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const { scrollRef, scrollToInput, onScroll, keyboardHeight } = useKeyboardScrollRegistration();

  const statusQ = useQuery({ queryKey: ['laofus-status'], queryFn: laofusRestApi.status, refetchInterval: 30_000 });
  const priceQ = useQuery({ queryKey: ['laofus-price'], queryFn: laofusRestApi.price, refetchInterval: 60_000 });

  const [dismissedErrorId, setDismissedErrorId] = useState<number | null>(null);
  useEffect(() => {
    getLaofusDismissedErrorId().then(setDismissedErrorId);
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([statusQ.refetch(), priceQ.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }

  const status = statusQ.data;
  const price = priceQ.data;

  const s: ImuState | null = useMemo(() => {
    const st = status?.state;
    if (!st) return null;
    return { cycle: st.cycleNo, T: n(st.t), quantity: n(st.quantity), avgPrice: n(st.avgPrice), cash: n(st.cash), principal: n(st.principal) };
  }, [status]);

  const latestError: EventDto | null = useMemo(() => {
    if (!status) return null;
    const err = status.events.find((e) => e.level === 'error');
    if (!err) return null;
    if (dismissedErrorId !== null && err.id <= dismissedErrorId) return null;
    const newerInfo = status.events.find((e) => e.level === 'info' && e.id > err.id);
    return newerInfo ? null : err;
  }, [status, dismissedErrorId]);

  function dismissError() {
    if (!latestError) return;
    setDismissedErrorId(latestError.id);
    setLaofusDismissedErrorId(latestError.id);
  }

  if (statusQ.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }

  const ind = s ? computeIndicators(s) : null;
  const pnl = s && price ? (price.price - s.avgPrice) * s.quantity : null;

  const engine = status?.engine;
  const live = engine?.mode === 'live';
  const next = engine?.nextRuns?.[0] ?? null;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView
      ref={scrollRef}
      style={[styles.root, { backgroundColor: theme.bg }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 + keyboardHeight }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand} colors={[theme.brand]} />}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <KeyboardScrollProvider value={scrollToInput}>
      <View style={styles.navRow}>
        <Pressable style={[styles.navChip, { borderColor: theme.border }]} onPress={() => navigation.navigate('LaofusCycles')}>
          <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: '700' }}>사이클 기록</Text>
        </Pressable>
        <Pressable style={[styles.navChip, { borderColor: theme.border }]} onPress={() => navigation.navigate('LaofusWealth')}>
          <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: '700' }}>실계좌 자산</Text>
        </Pressable>
        <Pressable style={[styles.navChip, { borderColor: theme.border }]} onPress={() => navigation.navigate('LaofusAssetTrend')}>
          <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: '700' }}>자산 추이</Text>
        </Pressable>
      </View>

      {latestError && (
        <View style={[styles.errorBanner, { borderColor: theme.danger, backgroundColor: theme.danger + '15' }]}>
          <View style={styles.errorHeaderRow}>
            <Text style={{ color: theme.danger, fontWeight: '700', fontSize: 13 }}>⚠ 엔진 오류</Text>
            <Pressable onPress={dismissError} hitSlop={8}>
              <Text style={{ color: theme.textMuted, fontSize: 15, fontWeight: '700' }}>✕</Text>
            </Pressable>
          </View>
          <Text style={{ color: theme.text, fontSize: 12.5, marginTop: 2 }}>
            {kst(latestError.ts)} — {latestError.message}
          </Text>
        </View>
      )}

      {engine && (
        <View style={[styles.engineBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.engineRow}>
            <View style={[styles.dot, { backgroundColor: engine.schedulerEnabled ? theme.brand : theme.danger }]} />
            <Text style={{ color: theme.text, fontSize: 12.5 }}>스케줄러 {engine.schedulerEnabled ? '활성' : '비활성'}</Text>
            <View style={[styles.liveBadge, { backgroundColor: live ? theme.danger : theme.bg }]}>
              <Text style={{ color: live ? '#fff' : theme.text, fontSize: 11, fontWeight: '700' }}>{live ? 'LIVE' : 'DRY-RUN'}</Text>
            </View>
          </View>
          {next && (
            <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 6 }}>
              다음 실행 {kst(next.at)}
            </Text>
          )}
        </View>
      )}

      {s && ind && (
        <>
          <View style={styles.tileGrid}>
            <Tile theme={theme} label={`T값 (${s.cycle}차 사이클)`} value={String(s.T)} sub={status?.state?.cycleDone ? '사이클 종료' : s.T < 10 ? '전반전' : '후반전'} />
            <Tile theme={theme} label="투자원금" value={usd(s.principal, 0)} />
            <Tile theme={theme} label="남은잔금" value={usd(s.cash)} color={theme.brand} sub={`원금의 ${((s.cash / s.principal) * 100).toFixed(1)}%`} />
            <Tile theme={theme} label="보유수량" value={s.quantity.toFixed(6)} />
            <Tile theme={theme} label="평단가" value={usd(s.avgPrice)} />
            <Tile
              theme={theme}
              label="현재가"
              value={price ? usd(price.price) : '—'}
              sub={pnl !== null ? `평가손익 ${pnl >= 0 ? '+' : ''}${usd(pnl)}` : undefined}
              color={pnl !== null ? (pnl >= 0 ? theme.brand : theme.danger) : undefined}
            />
            <Tile theme={theme} label="별지점" value={usd(ind.starPrice)} sub={`별 ${(ind.starPct * 100).toFixed(2)}%`} />
            <Tile theme={theme} label="전량매도가" value={usd(ind.fullSellPrice)} sub="평단 +20%" />
          </View>

          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>오늘 걸릴 주문</Text>
            <Text style={{ color: theme.textMuted, fontSize: 11.5, marginBottom: 10 }}>
              engine_state로 미리 계산되는 온주 LOC — 현재가와 무관, 장마감 종가로 자동 판정
            </Text>
            <LegsCard s={s} theme={theme} />
          </View>
        </>
      )}

      <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>최근 이벤트</Text>
          <Pressable onPress={() => navigation.navigate('LaofusSystem')}>
            <Text style={{ color: theme.brand, fontSize: 12, fontWeight: '700' }}>전체 보기 →</Text>
          </Pressable>
        </View>
        {(status?.events ?? []).slice(0, 5).map((e) => (
          <View key={e.id} style={[styles.eventRow, { borderColor: theme.border }]}>
            <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>{kst(e.ts)}</Text>
            <Text style={{ color: e.level === 'error' ? theme.danger : e.level === 'warn' ? '#F5A623' : theme.textMuted, fontSize: 11.5, fontWeight: '700', width: 36 }}>{e.level}</Text>
            <Text style={{ color: theme.text, fontSize: 12.5, flex: 1 }} numberOfLines={1}>
              {e.message}
            </Text>
          </View>
        ))}
      </View>
      </KeyboardScrollProvider>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  navChip: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  errorBanner: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  errorHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  engineBar: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  engineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  liveBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 'auto' },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tile: { width: '48%', borderWidth: 1, borderRadius: 12, padding: 12 },
  sectionCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 },
  legRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eventRow: { flexDirection: 'row', gap: 10, paddingVertical: 6, borderTopWidth: 1, alignItems: 'center' },
});
