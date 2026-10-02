'use no memo';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { VrWidgetData } from './data';
import { Column, Frame, Metric, MetricRow, WIDGET_URI, emptyBody, tone, type WidgetViewProps } from './components';
import type { Palette } from './palette';
import { signedPct, usd } from './format';
import { bandPosition, bandState } from '../lib/vr-trend';

const STATE_LABEL = { below: '밴드 아래 · 매수 구간', inside: '밴드 안', above: '밴드 위 · 매도 구간' } as const;

function BandBar({ p, pos, color }: { p: Palette; pos: number; color: Palette['brand'] }) {
  const left = Math.max(0.03, Math.min(0.97, pos));
  return (
    <FlexWidget style={{ width: 'match_parent', height: 8, flexDirection: 'row', backgroundColor: p.surface, borderRadius: 4, marginTop: 8 }}>
      <FlexWidget style={{ flex: left, height: 8 }} />
      <FlexWidget style={{ width: 8, height: 8, backgroundColor: color, borderRadius: 4 }} />
      <FlexWidget style={{ flex: 1 - left, height: 8 }} />
    </FlexWidget>
  );
}

export function VrWidget(props: WidgetViewProps<VrWidgetData>) {
  const { p, data, at, stale } = props;
  const empty = emptyBody(p, props);

  let body = null;
  if (data) {
    const value = data.price !== null ? data.quantity * data.price : null;
    const state = value !== null ? bandState(value, data.minBand, data.maxBand) : null;
    const stateColor = state === 'below' ? p.brand : state === 'above' ? p.danger : p.text;
    const totalAssets = value !== null ? data.pool + value : null;
    const profitPct =
      totalAssets !== null && data.investedPrincipal > 0 ? ((totalAssets - data.investedPrincipal) / data.investedPrincipal) * 100 : null;
    body = (
      <Column>
        <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <TextWidget text={usd(value)} style={{ fontSize: 24, fontWeight: '700', color: p.text }} />
          <TextWidget text="  평가금" style={{ fontSize: 11, color: p.muted, marginTop: 8 }} />
        </FlexWidget>
        <TextWidget
          text={state ? STATE_LABEL[state] : '시세 조회 중'}
          style={{ fontSize: 12, fontWeight: '600', color: stateColor, marginTop: 1 }}
        />
        {value !== null && <BandBar p={p} pos={bandPosition(value, data.minBand, data.maxBand)} color={stateColor} />}
        <MetricRow p={p}>
          <Metric p={p} label={`TQQQ ${signedPct(data.changePct, 2)}`} value={usd(data.price)} />
          <Metric p={p} label="Pool" value={usd(data.pool, 0)} />
          <Metric p={p} label="수익률" value={signedPct(profitPct, 1)} color={tone(p, profitPct)} />
        </MetricRow>
      </Column>
    );
  }

  return (
    <Frame p={p} title="VR · TQQQ" link={WIDGET_URI.vr} at={at} stale={stale}>
      {empty ?? body}
    </Frame>
  );
}
