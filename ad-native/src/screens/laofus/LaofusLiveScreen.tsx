import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Loader from '../../components/ui/Loader';
import { laofusRestApi, type LiveDto, type LiveOrderDto, type LiveSessionDto, type LiveSymbolDto } from '../../api/laofus';
import { useTheme } from '../../lib/theme';
import { useLiveInterval, useNowTick } from '../../lib/use-live-interval';
import { orderSideLabel } from '../../lib/laofus-order-label';
import { freshnessTag, krw, sessionHint, signedPct, usd } from '../../lib/live-format';
import type { LaofusHomeStackParamList } from '../../navigation/LaofusHomeStack';
import type { LaofusTabParamList } from '../../navigation/LaofusRootTabNavigator';

type Props = NativeStackScreenProps<LaofusHomeStackParamList, 'LaofusLive'>;

const WARN = '#F5A623';

type ThemeT = ReturnType<typeof useTheme>;

function sessionColors(session: LiveSessionDto | null, theme: ThemeT): { fg: string; bg: string } {
  if (!session || session.session === 'CLOSED') return { fg: theme.textMuted, bg: theme.border };
  if (session.session === 'REGULAR') return { fg: theme.brand, bg: theme.brandSoft };
  return { fg: WARN, bg: WARN + '26' };
}

function tone(v: number | null | undefined, theme: ThemeT): string {
  if (v === null || v === undefined || v === 0) return theme.text;
  return v > 0 ? theme.brand : theme.danger;
}

function OrderRow({ o, symbol, theme }: { o: LiveOrderDto; symbol: string; theme: ThemeT }) {
  const buy = o.side === 'BUY';
  const sideText = orderSideLabel(symbol, o);
  return (
    <View style={[styles.orderRow, { borderColor: theme.border }, o.alert && { backgroundColor: WARN + '26' }]}>
      <Text style={{ color: buy ? theme.brand : theme.danger, fontSize: 12, fontWeight: '800', width: sideText.length > 2 ? 54 : 34 }}>{sideText}</Text>
      <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', flex: 1 }}>
        {o.amount !== null ? `${usd(o.amount)} · 약 ${o.quantity}주` : `${o.quantity}주${o.price !== null ? ` @ ${usd(o.price)}` : ''}`}
      </Text>
      <Text style={{ color: theme.textMuted, fontSize: 11, borderColor: theme.border, borderWidth: 1, borderRadius: 5, paddingHorizontal: 5 }}>{o.type}</Text>
      <Text style={{ color: o.alert ? WARN : theme.text, fontSize: 12, fontWeight: '700', width: 58, textAlign: 'right', fontVariant: ['tabular-nums'] }}>
        {signedPct(o.distancePct)}
      </Text>
    </View>
  );
}

function SymbolCard({ s, theme, onPress }: { s: LiveSymbolDto; theme: ThemeT; onPress: () => void }) {
  return (
    <Pressable style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={onPress}>
      <View style={styles.rowBetween}>
        <View style={styles.rowBaseline}>
          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>{s.symbol}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '600' }}>{s.label}</Text>
        </View>
        <View style={styles.rowBaseline}>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{s.price !== null ? usd(s.price) : '—'}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 16 }}>›</Text>
        </View>
      </View>
      <View style={[styles.rowBetween, { marginTop: 2 }]}>
        <Text style={{ color: theme.textMuted, fontSize: 12 }}>
          {s.quantity !== null ? `${s.quantity}주 · 평가손익 ${signedPct(s.profitPct, 2)}` : '보유 정보 없음'}
        </Text>
        {s.changePct !== null && <Text style={{ color: tone(s.changePct, theme), fontSize: 12, fontWeight: '600' }}>오늘 {signedPct(s.changePct, 2)}</Text>}
      </View>
      <View style={{ marginTop: 10 }}>
        {s.orders.length === 0 ? (
          <Text style={{ color: theme.textMuted, fontSize: 12, borderTopWidth: 1, borderColor: theme.border, paddingTop: 9 }}>걸려 있는 주문 없음</Text>
        ) : (
          s.orders.map((o) => <OrderRow key={o.orderId} o={o} symbol={s.symbol} theme={theme} />)
        )}
      </View>
    </Pressable>
  );
}

function Summary({ live, tag, theme }: { live: LiveDto; tag: string; theme: ThemeT }) {
  const t = live.totals;
  const hasTotal = t?.totalAssetsUsd != null;
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.rowBetween}>
        <Text style={{ color: theme.textMuted, fontSize: 12 }}>{hasTotal ? '총 자산 (주식 + 잔고)' : '주식 평가금'}</Text>
        <Text style={{ color: theme.brand, fontSize: 11, fontWeight: '700' }}>{tag}</Text>
      </View>
      {t ? (
        <>
          <Text style={{ color: theme.text, fontSize: 24, fontWeight: '800', marginTop: 2 }}>{usd(t.totalAssetsUsd ?? t.marketValueUsd)}</Text>
          {(t.totalAssetsKrw ?? t.marketValueKrw) !== null && live.fx !== null && (
            <Text style={{ color: theme.textMuted, fontSize: 12.5, marginTop: 1 }}>
              {krw((t.totalAssetsKrw ?? t.marketValueKrw) as number)} · 환율 {live.fx.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          )}
          <View style={[styles.splitRow, { borderColor: theme.border }]}>
            <View style={styles.splitCell}>
              <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>주식 평가금</Text>
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800', marginTop: 1 }}>{usd(t.marketValueUsd)}</Text>
            </View>
            <View style={styles.splitCell}>
              <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>잔고</Text>
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800', marginTop: 1 }}>{t.cashUsd !== null ? usd(t.cashUsd) : '—'}</Text>
              {t.cashKrw !== null && t.cashKrw > 0 && <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 1 }}>+ {krw(t.cashKrw)}</Text>}
            </View>
          </View>
          <View style={styles.sumLines}>
            <Text style={{ color: theme.textMuted, fontSize: 12.5 }}>
              주식 손익{' '}
              <Text style={{ color: tone(t.profitUsd, theme), fontWeight: '700' }}>
                {t.profitUsd >= 0 ? '+' : '−'}
                {usd(Math.abs(t.profitUsd))} ({signedPct(t.profitPct, 2)})
              </Text>
            </Text>
            <Text style={{ color: theme.textMuted, fontSize: 12.5 }}>
              오늘{' '}
              <Text style={{ color: tone(t.dayProfitUsd, theme), fontWeight: '700' }}>
                {t.dayProfitUsd >= 0 ? '+' : '−'}
                {usd(Math.abs(t.dayProfitUsd))} ({signedPct(t.dayProfitPct, 2)})
              </Text>
            </Text>
          </View>
        </>
      ) : (
        <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 6 }}>보유 정보를 불러오지 못했어요</Text>
      )}
    </View>
  );
}

export default function LaofusLiveScreen({ navigation }: Props) {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const interval = useLiveInterval(5_000);
  const nowMs = useNowTick(interval !== false);
  const liveQ = useQuery({ queryKey: ['laofus-live'], queryFn: laofusRestApi.live, refetchInterval: interval });

  /** 종목을 누르면 그 종목의 전략(무한매수법·VR) 또는 기록(스페이스X) 탭으로 이동 */
  function openSymbol(symbol: string) {
    const tabs = navigation.getParent<BottomTabNavigationProp<LaofusTabParamList>>();
    if (symbol === 'TQQQ') tabs?.navigate('Strategy', { screen: 'VrOverview' });
    else if (symbol === 'SOXL') tabs?.navigate('Strategy', { screen: 'LaofusHome' });
    else if (symbol === 'SPCX') tabs?.navigate('Records');
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      await liveQ.refetch();
    } finally {
      setRefreshing(false);
    }
  }

  const live = liveQ.data;

  if (liveQ.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }

  if (!live) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Text style={{ color: theme.textMuted, fontSize: 13 }}>시세를 불러오지 못했어요</Text>
        <Pressable style={[styles.retry, { borderColor: theme.border }]} onPress={() => liveQ.refetch()}>
          <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: '700' }}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  const anyStale = live.symbols.some((s) => s.stale);
  const tag = freshnessTag(null, liveQ.dataUpdatedAt, nowMs, anyStale);
  const colors = sessionColors(live.session, theme);
  const hint = sessionHint(live.session, nowMs);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.bg }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand} colors={[theme.brand]} />}
    >
      {live.session && (
        <View style={[styles.sessionBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.pill, { backgroundColor: colors.bg }]}>
            <Text style={{ color: colors.fg, fontSize: 11.5, fontWeight: '800' }}>{live.session.label}</Text>
          </View>
          {hint && <Text style={{ color: theme.textMuted, fontSize: 12 }}>{hint}</Text>}
        </View>
      )}

      <Summary live={live} tag={tag} theme={theme} />

      {live.symbols.map((s) => (
        <SymbolCard key={s.symbol} s={s} theme={theme} onPress={() => openSymbol(s.symbol)} />
      ))}

      <View style={styles.chipRow}>
        <Pressable style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.card }]} onPress={() => navigation.navigate('LaofusWealth')}>
          <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: '700' }}>실계좌 자산</Text>
        </Pressable>
        <Pressable style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.card }]} onPress={() => navigation.navigate('LaofusAssetTrend')}>
          <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: '700' }}>자산 추이</Text>
        </Pressable>
      </View>

      {(live.partial || anyStale) && (
        <Text style={{ color: theme.textMuted, fontSize: 11.5, textAlign: 'center' }}>
          {anyStale ? '시세 갱신이 지연되고 있어요. 마지막으로 받은 값을 보여드려요' : '일부 정보를 불러오지 못했어요. 잠시 후 다시 갱신돼요'}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  retry: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14 },
  sessionBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10 },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  rowBetween: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  rowBaseline: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  sumLines: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 2, marginTop: 10 },
  splitRow: { flexDirection: 'row', gap: 12, marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  splitCell: { flex: 1 },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, borderTopWidth: 1 },
});
