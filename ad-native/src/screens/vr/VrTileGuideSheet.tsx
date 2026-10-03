import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import SheetModal from '../../components/sheets/SheetModal';
import { useTheme } from '../../lib/theme';
import { TILE_GUIDE, resolveTxt, type GuideCtx, type LakeFocus } from '../../lib/vr-tile-guide';

const WATER = '#3182F6';
const POOL_COLOR = '#14B8A6';

/** `**굵게**` 표기를 굵은 글씨로 */
function Rich({ text, color, boldColor, size = 13.5 }: { text: string; color: string; boldColor?: string; size?: number }) {
  const parts = text.split('**');
  return (
    <Text style={{ color, fontSize: size, lineHeight: size * 1.6 }}>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <Text key={i} style={{ fontWeight: '800', color: boldColor ?? color }}>
            {p}
          </Text>
        ) : (
          p
        ),
      )}
    </Text>
  );
}

function Lake({ focus, width }: { focus: LakeFocus; width: number }) {
  const theme = useTheme();
  const op = (k: LakeFocus) => (focus === 'all' || focus === k ? 1 : 0.28);
  const waterOp = focus === 'all' || focus === 'water' ? 1 : 0.55;
  const h = (width * 120) / 320;
  return (
    <Svg width={width} height={h} viewBox="0 0 320 120">
      <G opacity={0.55}>
        <Path d="M16 14 V104 H156 V14" stroke={theme.text} strokeWidth={2} fill="none" />
        <Path d="M200 46 V104 H304 V46" stroke={theme.text} strokeWidth={2} fill="none" />
        <Path d="M156 84 H200" stroke={theme.text} strokeWidth={3} fill="none" />
      </G>
      <Rect x={18} y={36} width={136} height={66} fill={WATER} opacity={0.18 + 0.3 * waterOp} />
      <Rect x={202} y={62} width={100} height={40} fill={POOL_COLOR} opacity={0.18 + 0.3 * op('pool')} />
      <G opacity={op('max')}>
        <Line x1={18} x2={154} y1={22} y2={22} stroke={theme.danger} strokeWidth={2} strokeDasharray="5 4" />
        <SvgText x={22} y={17} fontSize={9} fontWeight="700" fill={theme.danger}>
          최대 밴드 · 매도
        </SvgText>
      </G>
      <G opacity={op('v')}>
        <Line x1={18} x2={154} y1={42} y2={42} stroke={WATER} strokeWidth={2} strokeDasharray="5 4" />
        <SvgText x={22} y={37} fontSize={9} fontWeight="700" fill={WATER}>
          V (목표)
        </SvgText>
      </G>
      <G opacity={op('min')}>
        <Line x1={18} x2={154} y1={64} y2={64} stroke={theme.danger} strokeWidth={2} strokeDasharray="5 4" />
        <SvgText x={22} y={76} fontSize={9} fontWeight="700" fill={theme.danger}>
          최소 밴드 · 매수
        </SvgText>
      </G>
      <G opacity={op('water')}>
        <SvgText x={22} y={96} fontSize={9.5} fontWeight="700" fill={theme.text}>
          평가금 = 물 높이
        </SvgText>
      </G>
      <G opacity={op('pool')}>
        <SvgText x={214} y={86} fontSize={10} fontWeight="700" fill={POOL_COLOR}>
          Pool (현금)
        </SvgText>
      </G>
      <G opacity={op('valve')}>
        <Rect x={172} y={78} width={12} height={12} rx={6} fill="none" stroke={theme.text} strokeWidth={2} />
        <SvgText x={158} y={72} fontSize={9} fontWeight="700" fill={theme.text}>
          G 밸브
        </SvgText>
      </G>
      <SvgText x={52} y={116} fontSize={10} fontWeight="700" fill={theme.text} opacity={0.8}>
        저수지 (TQQQ)
      </SvgText>
      <SvgText x={226} y={116} fontSize={10} fontWeight="700" fill={theme.text} opacity={0.8}>
        연못
      </SvgText>
    </Svg>
  );
}

interface Props {
  /** 열린 타일 id — null이면 닫힘 */
  id: string | null;
  ctx: GuideCtx;
  /** 타일 id → 표시 이름·값 */
  tiles: Record<string, { label: string; value: string }>;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function VrTileGuideSheet({ id, ctx, tiles, onSelect, onClose }: Props) {
  const theme = useTheme();
  const [lakeW, setLakeW] = useState(300);
  const guide = id ? TILE_GUIDE[id] : undefined;
  const tile = id ? tiles[id] : undefined;
  const mine = guide ? guide.mine(ctx) : null;

  function onLakeLayout(e: LayoutChangeEvent) {
    setLakeW(Math.max(200, Math.floor(e.nativeEvent.layout.width)));
  }

  return (
    <SheetModal
      visible={!!(id && guide && tile)}
      onClose={onClose}
      scrollResetKey={id}
      header={tile?.label}
      headerRight={tile ? <Text style={{ color: theme.brand, fontSize: 14, fontWeight: '800' }}>{tile.value}</Text> : undefined}
    >
      {guide && tile ? (
        <View style={{ gap: 16 }}>
          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700', lineHeight: 22 }}>{guide.sum}</Text>

          <View>
            <Text style={[styles.k, { color: theme.textMuted }]}>공식적인 뜻</Text>
            <Rich text={resolveTxt(guide.formal, ctx)} color={theme.text} />
            <View style={[styles.eq, { backgroundColor: theme.bg }]}>
              <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: '700' }}>{guide.eq}</Text>
            </View>
          </View>

          <View>
            <Text style={[styles.k, { color: theme.textMuted }]}>저수지로 보면</Text>
            <View onLayout={onLakeLayout} style={[styles.lakeBox, { borderColor: theme.border, backgroundColor: theme.bg }]}>
              <Lake focus={guide.focus} width={lakeW - 22} />
            </View>
            <Rich text={guide.lake} color={theme.text} />
          </View>

          {mine ? (
            <View style={[styles.mine, { backgroundColor: theme.brandSoft }]}>
              <Text style={{ color: theme.brand, fontSize: 13, fontWeight: '800', marginBottom: 4 }}>내 값으로 읽으면</Text>
              <Rich text={mine} color={theme.text} boldColor={theme.brand} size={13} />
            </View>
          ) : null}

          {guide.warn ? (
            <View style={[styles.warn, { borderColor: theme.border }]}>
              <Text style={{ color: theme.danger, fontSize: 12.5, fontWeight: '800', marginBottom: 4 }}>헷갈리기 쉬워요</Text>
              <Rich text={guide.warn} color={theme.text} size={13} />
            </View>
          ) : null}

          <View>
            <Text style={[styles.k, { color: theme.textMuted }]}>함께 보면 좋은 타일</Text>
            <View style={styles.relRow}>
              {guide.rel
                .filter((r) => tiles[r])
                .map((r) => (
                  <Pressable key={r} onPress={() => onSelect(r)} style={[styles.relChip, { backgroundColor: theme.bg }]}>
                    <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>{tiles[r]!.label}</Text>
                  </Pressable>
                ))}
            </View>
          </View>
        </View>
      ) : null}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  k: { fontSize: 12.5, fontWeight: '700', marginBottom: 5 },
  eq: { marginTop: 8, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 9 },
  lakeBox: { borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 8, alignItems: 'center' },
  mine: { borderRadius: 12, padding: 12 },
  warn: { borderWidth: 1, borderRadius: 12, padding: 12 },
  relRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  relChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
});
