import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Loader from '../../../components/ui/Loader';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import AppToast from '../../../components/common/AppToast';
import { spacexApi } from '../../../api/spacex';
import { useTheme } from '../../../lib/theme';
import { getErrorMessage } from '../../../lib/error';
import type { LaofusMoreStackParamList } from '../../../navigation/LaofusMoreStack';

type Props = NativeStackScreenProps<LaofusMoreStackParamList, 'SpacexOverview'>;

function usd(v: number, d = 2): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
}
/** 반올림이 아니라 절삭 — 기록 리스트(SpacexEntriesScreen)와 같은 표시 방식으로 맞춤 */
function usdTrunc(v: number): string {
  return usd(Math.trunc(v * 100) / 100);
}
function kstDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' });
}

function Tile({
  label,
  value,
  sub,
  theme,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  theme: ReturnType<typeof useTheme>;
  valueColor?: string;
}) {
  return (
    <View style={[styles.tile, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>{label}</Text>
      <Text style={{ color: valueColor ?? theme.text, fontSize: 16, fontWeight: '800', marginTop: 2 }}>{value}</Text>
      {sub && <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>{sub}</Text>}
    </View>
  );
}

export default function SpacexOverviewScreen({ navigation }: Props) {
  const theme = useTheme();
  const statusQ = useQuery({ queryKey: ['spacex-status'], queryFn: spacexApi.status });
  const [closeConfirm, setCloseConfirm] = useState(false);
  const [closing, setClosing] = useState(false);
  const [toast, setToast] = useState('');

  if (statusQ.isLoading || !statusQ.data) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }

  const s = statusQ.data;
  const isClosed = s.closedAt !== null;
  const lastRebalance = [...s.entries].find((e) => e.isRebalance);
  const days = s.startDate
    ? Math.round((new Date(isClosed ? s.closedAt! : new Date().toISOString()).getTime() - new Date(s.startDate).getTime()) / 86400000) + 1
    : 0;
  const currentDiff = s.currentValue !== null ? s.currentValue - s.totalPrincipal : null;
  const currentDiffPct = currentDiff !== null && s.totalPrincipal > 0 ? (currentDiff / s.totalPrincipal) * 100 : null;

  async function handleClose() {
    setClosing(true);
    try {
      await spacexApi.close();
      setCloseConfirm(false);
      setToast('투자를 종료 처리했어요');
      statusQ.refetch();
    } catch (e) {
      setToast(getErrorMessage(e, '종료 처리에 실패했어요'));
      setCloseConfirm(false);
    } finally {
      setClosing(false);
    }
  }

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 16 }}>
        {s.startDate ? kstDate(s.startDate) : '-'} 시작 · {days}일째 · {isClosed ? `${kstDate(s.closedAt!)} 종료` : '진행 중'}
      </Text>

      <View style={styles.tileGrid}>
        <Tile theme={theme} label="총 매수원금" value={usdTrunc(s.totalPrincipal)} sub="누적 입금 기준" />
        <Tile
          theme={theme}
          label="총 금액"
          value={s.currentValue !== null ? usdTrunc(s.currentValue) : '—'}
          sub={
            currentDiff !== null
              ? `${currentDiff >= 0 ? '+' : ''}${usd(currentDiff)}${currentDiffPct !== null ? ` (${currentDiffPct >= 0 ? '+' : ''}${currentDiffPct.toFixed(2)}%)` : ''}`
              : '시세 조회 실패'
          }
          valueColor={currentDiff === null ? undefined : currentDiff >= 0 ? theme.brand : theme.danger}
        />
        <Tile theme={theme} label="매수 일수" value={`${s.daysCount}일`} />
        <Tile theme={theme} label="평단" value={s.avgPrice !== null ? usd(s.avgPrice, 4) : '—'} sub={s.avgPrice !== null ? '가격 기록된 날 기준' : undefined} />
        <Tile
          theme={theme}
          label="수익률"
          value={s.profitPct !== null ? `${s.profitPct >= 0 ? '+' : ''}${s.profitPct.toFixed(2)}%` : '—'}
          sub={s.lastPrice !== null ? `최근 체결가 ${usd(s.lastPrice, 2)} 기준` : undefined}
          valueColor={s.profitPct === null ? undefined : s.profitPct >= 0 ? theme.brand : theme.danger}
        />
      </View>

      {lastRebalance && (
        <View style={[styles.memoCard, { backgroundColor: theme.brandSoft, borderColor: theme.border }]}>
          <Text style={{ color: theme.brand, fontSize: 10.5, fontWeight: '800', marginBottom: 6 }}>최근 리밸런싱 메모</Text>
          <Text style={{ color: theme.text, fontSize: 12.5, lineHeight: 18 }}>{lastRebalance.note ?? '(메모 없음)'}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 10.5, marginTop: 5 }}>{kstDate(lastRebalance.date)}</Text>
        </View>
      )}

      <View style={styles.btnRow}>
        <Pressable style={[styles.btn, { backgroundColor: theme.brand }]} onPress={() => navigation.navigate('SpacexEntries')}>
          <Text style={styles.btnTextPrimary}>기록 보기</Text>
        </Pressable>
        {!isClosed && (
          <Pressable style={[styles.btn, styles.btnGhost, { borderColor: theme.border }]} onPress={() => setCloseConfirm(true)}>
            <Text style={[styles.btnTextGhost, { color: theme.textMuted }]}>투자 종료</Text>
          </Pressable>
        )}
      </View>

      <ConfirmDialog
        visible={closeConfirm}
        title="투자 종료"
        description="종료하면 이후엔 조회만 가능해요. 계속할까요?"
        confirmText="종료"
        danger
        loading={closing}
        onConfirm={handleClose}
        onClose={() => setCloseConfirm(false)}
      />
      <AppToast open={toast.length > 0} text={toast} onClose={() => setToast('')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  tile: { width: '48%', borderWidth: 1, borderRadius: 12, padding: 12 },
  memoCard: { borderWidth: 1, borderRadius: 12, padding: 13, marginBottom: 16 },
  btnRow: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10 },
  btnGhost: { borderWidth: 1 },
  btnTextPrimary: { color: '#fff', fontSize: 13, fontWeight: '700' },
  btnTextGhost: { fontSize: 13, fontWeight: '700' },
});
