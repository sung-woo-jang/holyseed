import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';

export type LegendKind = 'line' | 'dash' | 'dot' | 'band' | 'area' | 'bar';

export interface LegendItem {
  kind: LegendKind;
  color: string;
  label: string;
  /** area/band 견본의 투명도(16진 2자리) — 차트에서 연하게 칠한 면과 같게 맞출 때 */
  alpha?: string;
  /** 마지막 값 등 라벨 뒤에 굵게 붙일 값 */
  value?: string;
}

function Swatch({ kind, color, alpha }: { kind: LegendKind; color: string; alpha?: string }) {
  switch (kind) {
    case 'line':
      return <View style={{ width: 20, height: 3, borderRadius: 2, backgroundColor: color }} />;
    case 'dash':
      return (
        <View style={{ width: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ width: 5, height: 2.5, backgroundColor: color }} />
          ))}
        </View>
      );
    case 'dot':
      return <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color }} />;
    case 'band':
      return <View style={{ width: 20, height: 10, borderRadius: 2, backgroundColor: color + (alpha ?? '33'), borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: color }} />;
    case 'area':
      return <View style={{ width: 20, height: 10, borderRadius: 2, backgroundColor: color + (alpha ?? '99') }} />;
    case 'bar':
      return <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />;
  }
}

/** 차트 아래 범례 — 선 모양(실선·점선)·점·띠·면을 차트와 같은 색/모양의 견본으로 보여준다 */
export default function ChartLegend({ items, hint }: { items: LegendItem[]; hint?: string }) {
  const theme = useTheme();
  return (
    <View style={{ marginTop: 8 }}>
      <View style={styles.row}>
        {items.map((it) => (
          <View key={it.label} style={styles.item}>
            <Swatch kind={it.kind} color={it.color} alpha={it.alpha} />
            <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>
              {it.label}
              {it.value ? <Text style={{ color: theme.text, fontWeight: '800' }}> {it.value}</Text> : null}
            </Text>
          </View>
        ))}
      </View>
      {hint ? <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 5, opacity: 0.85 }}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
