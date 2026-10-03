import { StyleSheet, Text, View } from 'react-native';
import type { VrCycle, VrState, VrVCalc } from '../../api/vr';
import { useTheme } from '../../lib/theme';
import { V_SOURCE_LABEL, md, nextVSubstitution, pct, usd, vCalcSubstitution } from '../../lib/vr-format';

export function VCalcBadges({ calc }: { calc: VrVCalc | undefined }) {
  const theme = useTheme();
  if (!calc?.source) return <Text style={{ color: theme.textMuted, fontSize: 11 }}>산출 기록 없음</Text>;
  const bad = calc.matches === false;
  return (
    <View style={styles.chips}>
      <View style={[styles.chip, { backgroundColor: calc.source === 'ROLLOVER' ? theme.brandSoft : theme.bg }]}>
        <Text style={{ color: calc.source === 'ROLLOVER' ? theme.brand : theme.textMuted, fontSize: 11.5, fontWeight: '800' }}>{V_SOURCE_LABEL[calc.source]}</Text>
      </View>
      {calc.matches != null && (
        <View style={[styles.chip, { backgroundColor: bad ? (theme.dark ? '#3A1A1E' : '#FDECEE') : theme.brandSoft }]}>
          <Text style={{ color: bad ? theme.danger : theme.brand, fontSize: 11.5, fontWeight: '800' }}>
            {bad ? `불일치 ${usd(calc.delta ?? 0)}` : '재계산 일치'}
          </Text>
        </View>
      )}
    </View>
  );
}

function Row({ label, value, first }: { label: string; value: string; first?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, !first && { borderTopWidth: 1, borderColor: theme.border }]}>
      <Text style={{ color: theme.textMuted, fontSize: 12.5 }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

function Formula({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.formula, { backgroundColor: theme.bg }]}>
      <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

interface Props {
  cycle: VrCycle;
  prevCycleNo: number | null;
  /** 진행 중 사이클일 때 다음 갱신 예정 계산용 */
  state?: VrState;
}

/** 사이클 상세의 'V 산출' 카드 — 이 사이클의 V가 어떤 입력으로 나왔는지 */
export default function VCalcCard({ cycle, prevCycleNo, state }: Props) {
  const theme = useTheme();
  const calc = cycle.vCalc;
  const subst = calc ? vCalcSubstitution(calc) : null;
  const next =
    !cycle.isClosed && state?.cycle?.cycleNo === cycle.cycleNo
      ? nextVSubstitution(state.vValue, state.pool, state.settings.gFactor, state.settings.depositAmount, state.v2Preview)
      : null;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.head}>
        <Text style={{ color: theme.textMuted, fontSize: 12.5, fontWeight: '700' }}>V 산출</Text>
        <VCalcBadges calc={calc} />
      </View>

      {calc?.source === 'MANUAL' && !subst ? (
        <Text style={{ color: theme.textMuted, fontSize: 12.5, lineHeight: 18 }}>최초 V를 직접 입력한 사이클이라 계산식이 없어요. 이 값이 이후 사이클 V의 출발점이에요.</Text>
      ) : !calc?.source ? (
        <Text style={{ color: theme.textMuted, fontSize: 12.5, lineHeight: 18 }}>이 사이클은 V 산출 기록이 없어요.</Text>
      ) : (
        <>
          <Formula text="V₂ = V₁ + Pool ÷ G + 적립금" />
          {subst ? <Formula text={subst} /> : null}
          {calc.prevV != null && calc.poolInput != null && calc.g != null ? (
            <View>
              <Row first label={`직전 V${prevCycleNo != null ? ` (사이클 ${prevCycleNo})` : ''}`} value={usd(calc.prevV)} />
              <Row label={`Pool ÷ G (Pool ${usd(calc.poolInput)}, G ${calc.g})`} value={`+${usd(calc.poolTerm ?? 0)}`} />
              <Row label="적립금" value={`+${usd(calc.deposit)}`} />
              {calc.growth != null ? <Row label="증가" value={`${calc.growth >= 0 ? '+' : ''}${usd(calc.growth)}${calc.growthPct != null ? ` (${pct(calc.growthPct)})` : ''}`} /> : null}
            </View>
          ) : null}
          {calc.matches === false ? (
            <Text style={{ color: theme.textMuted, fontSize: 12, lineHeight: 17, marginTop: 8 }}>
              기록된 V는 {usd(calc.result)}이고, 위 입력으로 다시 계산하면 {usd(calc.recomputed ?? 0)}예요. 당시 Pool이나 G가 기록과 달랐을 수 있어요.
            </Text>
          ) : null}
          <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 8 }}>
            {calc.source === 'BACKFILL' ? '기록 당시 값이 아니라 저장된 직전 사이클 값과 현재 G로 다시 계산한 추정이에요.' : null}
            {calc.source === 'ROLLOVER' && cycle.bandPct != null ? `밴드 ${cycle.bandPct}%` : null}
            {calc.source === 'ROLLOVER' && cycle.rolledAt ? ` · ${md(cycle.rolledAt.slice(0, 10))} 갱신` : null}
          </Text>
        </>
      )}

      {next ? (
        <View style={{ marginTop: 12 }}>
          <Text style={{ color: theme.textMuted, fontSize: 11.5, fontWeight: '700', marginBottom: 6 }}>다음 V 예정 (지금 Pool 기준)</Text>
          <Formula text={next} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8, flexWrap: 'wrap' },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  formula: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, gap: 8 },
});
