import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Loader from '../../components/ui/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import SheetModal from '../../components/sheets/SheetModal';
import ListRow from '../../components/ui/ListRow';
import AppToast from '../../components/common/AppToast';
import { vrApi } from '../../api/vr';
import { useTheme } from '../../lib/theme';
import { getErrorMessage } from '../../lib/error';
import { evaluationNote, nextVSubstitution } from '../../lib/vr-format';
import QueryError from '../../components/common/QueryError';
import VrTileGuideSheet from './VrTileGuideSheet';
import type { GuideCtx } from '../../lib/vr-tile-guide';

function usd(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface CardDef {
  id: string;
  label: string;
  value: string;
  hint?: string;
  tone?: 'positive' | 'negative';
}

const ALL_CARD_IDS = [
  'initialCapital', 'investedPrincipal', 'costBasis', 'marketValue', 'unrealizedProfit', 'totalAssets',
  'profit', 'profitRate', 'pool', 'poolUsageRate', 'cashBalance', 'cashRatio', 'quantity', 'vValue',
  'growthRate', 'evalAdj', 'minBand', 'maxBand', 'avgPrice', 'depositAmount', 'gFactor',
];

export default function VrOverviewScreen() {
  const theme = useTheme();
  const [rolloverConfirm, setRolloverConfirm] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState('');
  const [guideId, setGuideId] = useState<string | null>(null);

  const qc = useQueryClient();
  const stateQ = useQuery({ queryKey: ['vr-state'], queryFn: vrApi.state, refetchInterval: 30_000 });
  const priceQ = useQuery({ queryKey: ['vr-price'], queryFn: vrApi.price, refetchInterval: 60_000 });
  const cashQ = useQuery({ queryKey: ['vr-cash'], queryFn: vrApi.cashBalance, refetchInterval: 60_000 });

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([stateQ.refetch(), priceQ.refetch(), cashQ.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }

  const state = stateQ.data;
  const price = priceQ.data?.price ?? null;
  const vrCash = cashQ.data?.vrCash ?? null;
  // 모으기도 같은 달러 예수금에서 결제돼서, 그 누적 매수액은 장부와의 차이에서 뺀다
  const dcaSpent = cashQ.data?.dcaSpent ?? 0;

  const cashDiff = state && vrCash !== null ? vrCash + dcaSpent - state.pool : null;
  const growthRate = state && state.v2Preview !== null && state.vValue > 0 ? ((state.v2Preview - state.vValue) / state.vValue) * 100 : null;
  const marketValue = state && price !== null ? state.quantity * price : null;
  const costBasis = state ? state.avgPrice * state.quantity : null;
  const unrealizedProfit = marketValue !== null && costBasis !== null ? marketValue - costBasis : null;
  const totalAssets = state && marketValue !== null ? state.pool + marketValue : null;
  const profit = state && totalAssets !== null ? totalAssets - state.investedPrincipal : null;
  const profitRate = profit !== null && state && state.investedPrincipal > 0 ? (profit / state.investedPrincipal) * 100 : null;
  const cashRatio = state && totalAssets !== null && totalAssets > 0 ? (state.pool / totalAssets) * 100 : null;
  const nextV = state?.nextV ?? null;
  const poolUsageRate = state?.cycle && state.cycle.poolStart > 0 ? ((state.cycle.poolStart - state.pool) / state.cycle.poolStart) * 100 : null;

  const cards = useMemo<Record<string, CardDef>>(() => {
    if (!state) return {} as Record<string, CardDef>;
    return {
      initialCapital: { id: 'initialCapital', label: '초기 투입금액', value: usd(state.initialCapital) },
      investedPrincipal: { id: 'investedPrincipal', label: '투자원금', value: usd(state.investedPrincipal) },
      costBasis: { id: 'costBasis', label: '매수원가', value: costBasis !== null ? usd(costBasis) : '—' },
      marketValue: { id: 'marketValue', label: '평가금', value: marketValue !== null ? usd(marketValue) : '조회 중…', hint: price !== null ? `${state.quantity}주 × ${usd(price)}` : undefined },
      unrealizedProfit: {
        id: 'unrealizedProfit', label: '미실현손익',
        value: unrealizedProfit !== null ? `${unrealizedProfit >= 0 ? '+' : ''}${usd(unrealizedProfit)}` : '—',
        tone: unrealizedProfit === null ? undefined : unrealizedProfit >= 0 ? 'positive' : 'negative',
      },
      totalAssets: { id: 'totalAssets', label: '총자산', value: totalAssets !== null ? usd(totalAssets) : '—', hint: 'Pool + 평가금' },
      profit: {
        id: 'profit', label: '총손익', value: profit !== null ? `${profit >= 0 ? '+' : ''}${usd(profit)}` : '—',
        tone: profit === null ? undefined : profit >= 0 ? 'positive' : 'negative',
      },
      profitRate: {
        id: 'profitRate', label: '수익률', value: profitRate !== null ? `${profitRate >= 0 ? '+' : ''}${profitRate.toFixed(2)}%` : '—',
        tone: profitRate === null ? undefined : profitRate >= 0 ? 'positive' : 'negative',
      },
      pool: { id: 'pool', label: 'Pool', value: usd(state.pool), hint: `사용가능(${state.settings.poolLimitPct}%) ${usd(state.usablePool)}` },
      poolUsageRate: { id: 'poolUsageRate', label: 'Pool 소진율', value: poolUsageRate !== null ? `${poolUsageRate.toFixed(1)}%` : '—' },
      cashBalance: {
        id: 'cashBalance', label: '예수금 차이', value: cashDiff !== null ? `${cashDiff >= 0 ? '+' : ''}${usd(cashDiff)}` : vrCash === null ? '조회 중…' : '—',
        hint: vrCash !== null
          ? `실제 ${usd(vrCash)}${dcaSpent > 0 ? ` + 모으기 ${usd(dcaSpent)}` : ''} / 있어야 할 ${usd(state.pool)}`
          : undefined,
        tone: cashDiff === null ? undefined : cashDiff >= 0 ? 'positive' : 'negative',
      },
      cashRatio: { id: 'cashRatio', label: '현금 비중', value: cashRatio !== null ? `${cashRatio.toFixed(1)}%` : '조회 중…' },
      quantity: { id: 'quantity', label: '보유수량', value: `${state.quantity}주` },
      vValue: { id: 'vValue', label: 'V', value: usd(state.vValue), hint: `V₂ 예정 ${usd(state.v2Preview)}` },
      evalAdj: {
        id: 'evalAdj', label: '평가금 보정',
        value: nextV ? `${nextV.evalTerm >= 0 ? '+' : '−'}${usd(Math.abs(nextV.evalTerm))}` : '—',
        hint: nextV ? `E ${usd(nextV.evaluation)}` : undefined,
        tone: nextV ? (nextV.evalTerm >= 0 ? 'positive' : 'negative') : undefined,
      },
      growthRate: {
        id: 'growthRate', label: 'V 증가율', hint: '적립금 포함', value: growthRate !== null ? `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(2)}%` : '—',
        tone: growthRate === null ? undefined : growthRate >= 0 ? 'positive' : 'negative',
      },
      minBand: { id: 'minBand', label: '최소 밴드', value: usd(state.minBand) },
      maxBand: { id: 'maxBand', label: '최대 밴드', value: usd(state.maxBand) },
      avgPrice: { id: 'avgPrice', label: '평단 (기록용)', value: usd(state.avgPrice) },
      depositAmount: { id: 'depositAmount', label: '적립금 / 사이클', value: usd(state.settings.depositAmount) },
      gFactor: { id: 'gFactor', label: 'G (기울기)', value: String(state.settings.gFactor) },
    };
  }, [state, price, vrCash, dcaSpent, cashDiff, growthRate, nextV, marketValue, costBasis, unrealizedProfit, totalAssets, profit, profitRate, cashRatio, poolUsageRate]);

  const guideCtx = useMemo<GuideCtx | null>(() => {
    if (!state) return null;
    return {
      v: state.vValue, v2: state.v2Preview, pool: state.pool, poolStart: state.cycle?.poolStart ?? null, usablePool: state.usablePool,
      limitPct: state.settings.poolLimitPct, g: state.settings.gFactor, deposit: state.settings.depositAmount, bandPct: state.settings.bandPct,
      minBand: state.minBand, maxBand: state.maxBand, quantity: state.quantity, avgPrice: state.avgPrice, price,
      marketValue, costBasis, unrealized: unrealizedProfit, totalAssets, invested: state.investedPrincipal, initial: state.initialCapital,
      profit, profitRate, cashRatio, cashDiff, poolUsage: poolUsageRate, growthRate, evalTerm: nextV?.evalTerm ?? null, evaluation: nextV?.evaluation ?? null, poolTerm: nextV?.poolTerm ?? null,
    };
  }, [state, price, marketValue, costBasis, unrealizedProfit, totalAssets, profit, profitRate, cashRatio, cashDiff, poolUsageRate, growthRate, nextV]);

  async function handleRollover() {
    setRolling(true);
    try {
      await vrApi.rollover({});
      setRolloverConfirm(false);
      setToast('V 갱신이 완료됐어요');
      void Promise.all(['vr-state', 'vr-cycles', 'vr-fills', 'vr-wealth-history'].map((k) => qc.invalidateQueries({ queryKey: [k] })));
    } catch (e) {
      setToast(getErrorMessage(e, 'V 갱신에 실패했어요'));
      setRolloverConfirm(false);
    } finally {
      setRolling(false);
    }
  }

  async function toggleHidden(id: string) {
    if (!state) return;
    const hidden = new Set(state.settings.hiddenCards);
    if (hidden.has(id)) hidden.delete(id);
    else hidden.add(id);
    await vrApi.updateSettings({ hiddenCards: Array.from(hidden) });
    stateQ.refetch();
  }

  if (stateQ.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }
  if ((stateQ.isError && !stateQ.data)) return <QueryError onRetry={() => { void stateQ.refetch(); }} />;

  const order = state?.settings.cardOrder?.length ? [...state.settings.cardOrder, ...ALL_CARD_IDS.filter((id) => !state.settings.cardOrder.includes(id))] : ALL_CARD_IDS;
  const hidden = new Set(state?.settings.hiddenCards ?? []);
  const visibleOrder = order.filter((id) => !hidden.has(id) && cards[id]);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.bg }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand} colors={[theme.brand]} />}
    >
      <View style={styles.navRow}>
        <Pressable style={[styles.navChip, { borderColor: theme.border }]} onPress={() => setSettingsOpen(true)}>
          <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: '700' }}>카드 표시 설정</Text>
        </Pressable>
      </View>

      {state?.cycle ? (
        <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 12 }}>
          사이클 {state.cycle.cycleNo} ({state.cycle.startDate} ~ {state.cycle.endDate}) · 다음 V 갱신일 {state.nextRenewalDate}
        </Text>
      ) : (
        <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 12 }}>진행 중인 사이클이 없어요 — 체결 내역에서 사이클을 등록하세요</Text>
      )}

      {state?.cycle && (
        <Pressable style={[styles.rolloverBtn, { backgroundColor: theme.brand }]} onPress={() => (nextV ? setRolloverConfirm(true) : setToast('다음 V에 쓸 TQQQ 가격을 불러오지 못했어요. 잠시 후 다시 시도해 주세요'))}>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>V 갱신 실행</Text>
        </Pressable>
      )}

      <View style={styles.tileGrid}>
        {visibleOrder.map((id) => {
          const c = cards[id];
          return (
            <Pressable
              key={id}
              onPress={() => setGuideId(id)}
              style={({ pressed }) => [styles.tile, { backgroundColor: theme.card, borderColor: theme.border }, pressed && { opacity: 0.6 }]}
            >
              <View style={[styles.infoDot, { borderColor: theme.textMuted }]}>
                <Text style={{ color: theme.textMuted, fontSize: 9, fontWeight: '700' }}>i</Text>
              </View>
              <Text style={{ color: theme.textMuted, fontSize: 11, paddingRight: 16 }}>{c.label}</Text>
              <Text style={{ color: c.tone === 'positive' ? theme.brand : c.tone === 'negative' ? theme.danger : theme.text, fontSize: 15, fontWeight: '800', marginTop: 2 }}>
                {c.value}
              </Text>
              {c.hint && (
                <Text style={{ color: theme.textMuted, fontSize: 10.5, marginTop: 2 }} numberOfLines={1}>
                  {c.hint}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <ConfirmDialog
        visible={rolloverConfirm}
        title="V 갱신을 실행할까요?"
        description={
          state?.cycle && nextV
            ? `현재 사이클 ${state.cycle.cycleNo}을 종료하고 V₂ = ${usd(nextV.v2)}로 새 사이클을 시작해요.\n\n${nextVSubstitution(nextV)}\n(V₁ + Pool ÷ G + (E − V₁) ÷ 2√G + 적립금)\n\n${evaluationNote(nextV)}`
            : undefined
        }
        confirmText="갱신 실행"
        loading={rolling}
        onConfirm={handleRollover}
        onClose={() => setRolloverConfirm(false)}
      />

      <SheetModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} header="카드 표시 설정">
        <View>
          {ALL_CARD_IDS.filter((id) => cards[id]).map((id) => (
            <ListRow
              key={id}
              contents={<Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{cards[id].label}</Text>}
              right={<Text style={{ color: hidden.has(id) ? theme.textMuted : theme.brand, fontSize: 13, fontWeight: '700' }}>{hidden.has(id) ? '숨김' : '표시'}</Text>}
              onPress={() => toggleHidden(id)}
              verticalPadding="small"
            />
          ))}
        </View>
      </SheetModal>

      {guideCtx ? (
        <VrTileGuideSheet
          id={guideId}
          ctx={guideCtx}
          tiles={Object.fromEntries(Object.values(cards).map((c) => [c.id, { label: c.label, value: c.value }]))}
          onSelect={setGuideId}
          onClose={() => setGuideId(null)}
        />
      ) : null}

      <AppToast open={!!toast} text={toast} onClose={() => setToast('')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  navChip: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  rolloverBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 12 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '48%', borderWidth: 1, borderRadius: 12, padding: 12 },
  infoDot: { position: 'absolute', top: 9, right: 9, width: 14, height: 14, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center', opacity: 0.8 },
});
