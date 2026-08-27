import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Loader from '../../../components/ui/Loader';
import { laofusRestApi, type EventDto } from '../../../api/laofus';
import { computeIndicators, decide, applyFill, type ImuState, type Decision } from '../../../lib/laofus-core';
import { useTheme } from '../../../lib/theme';
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

function describeDecision(d: Decision, s: ImuState, price: number): { text: string; after: string | null; color: 'buy' | 'sell' | 'none' } {
  if (d.action === 'BUY') {
    const q = d.amountUsd / price;
    const nx = applyFill(s, d, { quantity: q, price, amount: d.amountUsd });
    return {
      text: `매수(${d.kind}) ${usd(d.amountUsd)}`,
      after: `T ${s.T} → ${d.tAfter} · 예상 평단 ${usd(nx.avgPrice)} · 잔금 ${usd(nx.cash)}`,
      color: 'buy',
    };
  }
  if (d.action === 'SELL') {
    const nx = applyFill(s, d, { quantity: d.quantity, price, amount: d.quantity * price });
    return {
      text: `매도(${d.kind}) ${d.quantity.toFixed(6)}주 ≈ ${usd(d.quantity * price)}`,
      after: `T ${s.T} → ${nx.T} · 잔금 ${usd(nx.cash)}${nx.quantity === 0 ? ' · 사이클 종료' : ''}`,
      color: 'sell',
    };
  }
  return { text: `주문 없음 — ${d.reason}`, after: null, color: 'none' };
}

function DecisionCard({ title, s, price, theme }: { title: string; s: ImuState; price: number; theme: ReturnType<typeof useTheme> }) {
  const d = decide(s, price);
  const { text, after, color } = describeDecision(d, s, price);
  const c = color === 'sell' ? theme.danger : color === 'buy' ? theme.brand : theme.textMuted;
  return (
    <View style={[styles.decisionCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      <Text style={{ color: theme.textMuted, fontSize: 12 }}>{title}</Text>
      <Text style={{ color: c, fontSize: 14, fontWeight: '700', marginTop: 2 }}>{text}</Text>
      {after && <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{after}</Text>}
    </View>
  );
}

export default function LaofusHomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const [simInput, setSimInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const statusQ = useQuery({ queryKey: ['laofus-status'], queryFn: laofusRestApi.status, refetchInterval: 30_000 });
  const priceQ = useQuery({ queryKey: ['laofus-price'], queryFn: laofusRestApi.price, refetchInterval: 60_000 });

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
    const newerInfo = status.events.find((e) => e.level === 'info' && e.id > err.id);
    return newerInfo ? null : err;
  }, [status]);

  if (statusQ.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }

  const ind = s ? computeIndicators(s) : null;
  const pnl = s && price ? (price.price - s.avgPrice) * s.quantity : null;
  const simPrice = simInput !== '' && !Number.isNaN(Number(simInput)) ? Number(simInput) : null;

  const engine = status?.engine;
  const live = engine?.mode === 'live';
  const next = engine?.nextRuns?.[0] ?? null;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.bg }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand} colors={[theme.brand]} />}
    >
      {latestError && (
        <View style={[styles.errorBanner, { borderColor: theme.danger, backgroundColor: theme.danger + '15' }]}>
          <Text style={{ color: theme.danger, fontWeight: '700', fontSize: 13 }}>⚠ 엔진 오류</Text>
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
            <Tile theme={theme} label={`T값 (${s.cycle}차 사이클)`} value={String(s.T)} sub={status?.state?.cycleDone ? '사이클 종료' : s.T < 20 ? '전반전' : '후반전'} />
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
            <Tile theme={theme} label="1회매수금" value={usd(ind.oneBuyAmount)} sub={`잔금 ${usd(s.cash)}`} />
            <Tile theme={theme} label="전량매도가" value={usd(ind.fullSellPrice)} sub="평단 +20%" />
          </View>

          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>오늘의 판단 미리보기</Text>
            {price && <DecisionCard theme={theme} title={`지금 마감이면 (현재가 ${usd(price.price)})`} s={s} price={price.price} />}
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 6 }}>가상 가격으로 확인</Text>
              <TextInput
                style={[styles.simInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.bg }]}
                placeholder={price ? String(price.price) : '가격 입력'}
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={simInput}
                onChangeText={setSimInput}
              />
              {simPrice !== null && simPrice > 0 && <DecisionCard theme={theme} title={`종가가 ${usd(simPrice)} 이라면`} s={s} price={simPrice} />}
            </View>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorBanner: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  engineBar: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  engineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  liveBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 'auto' },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tile: { width: '48%', borderWidth: 1, borderRadius: 12, padding: 12 },
  sectionCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 },
  decisionCard: { borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 8 },
  simInput: { height: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, fontSize: 14 },
  eventRow: { flexDirection: 'row', gap: 10, paddingVertical: 6, borderTopWidth: 1, alignItems: 'center' },
});
