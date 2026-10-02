'use no memo';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { VrWidgetData } from './data';
import {
  Body,
  Frame,
  LineRow,
  ListTitle,
  ROW_H,
  Sub,
  Tiles,
  WIDGET_URI,
  emptyBody,
  metrics,
  pack,
  rowsFit,
  tone,
  totalH,
  type Section,
  type WidgetViewProps,
} from './components';
import type { Hex, Palette } from './palette';
import { signedPct, usd } from './format';
import { bandBoundaries, bandPosition, bandState } from '../lib/vr-trend';

const STATE_LABEL = { below: '밴드 아래 · 매수 구간', inside: '밴드 안', above: '밴드 위 · 매도 구간' } as const;
const KIND_LABEL: Record<string, string> = { INITIAL_BUY: '초기매수', BUY: '매수', SELL: '매도' };

const signedUsd = (v: number | null) => (v === null ? '—' : `${v >= 0 ? '+' : '-'}${usd(Math.abs(v))}`);

function BandBar({ p, pos, color }: { p: Palette; pos: number; color: Hex }) {
  const left = Math.max(0.03, Math.min(0.97, pos));
  return (
    <FlexWidget style={{ width: 'match_parent', height: 8, flexDirection: 'row', backgroundColor: p.surface, borderRadius: 4, marginTop: 8 }}>
      <FlexWidget style={{ flex: left, height: 8 }} />
      <FlexWidget style={{ width: 8, height: 8, backgroundColor: color, borderRadius: 4 }} />
      <FlexWidget style={{ flex: 1 - left, height: 8 }} />
    </FlexWidget>
  );
}

function VrBody({ p, data, size }: { p: Palette; data: VrWidgetData; size: WidgetViewProps<VrWidgetData>['size'] }) {
  const m = metrics(size);
  const value = data.price !== null ? data.quantity * data.price : null;
  const state = value !== null ? bandState(value, data.minBand, data.maxBand) : null;
  const stateColor: Hex = state === 'below' ? p.brand : state === 'above' ? p.danger : p.text;
  const totalAssets = value !== null ? data.pool + value : null;
  const profit = totalAssets !== null ? totalAssets - data.investedPrincipal : null;
  const profitPct = profit !== null && data.investedPrincipal > 0 ? (profit / data.investedPrincipal) * 100 : null;
  const unrealized = value !== null ? value - data.avgPrice * data.quantity : null;
  const cashPct = totalAssets !== null && totalAssets > 0 ? (data.pool / totalAssets) * 100 : null;
  const growth = data.v2Preview !== null && data.vValue > 0 ? ((data.v2Preview - data.vValue) / data.vValue) * 100 : null;
  const bounds = bandBoundaries({ quantity: data.quantity, minBand: data.minBand, maxBand: data.maxBand, price: data.price ?? 0 });

  const fixed: Section[] = [
    {
      key: 'hero',
      h: 58,
      prio: 0,
      el: (
        <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
          <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <TextWidget text={usd(value)} style={{ fontSize: 26, fontWeight: '700', color: p.text }} />
            <TextWidget text="  평가금" style={{ fontSize: 11, color: p.muted, marginTop: 9 }} />
          </FlexWidget>
          <TextWidget
            text={`${state ? STATE_LABEL[state] : '시세 조회 중'} · TQQQ ${usd(data.price)} ${signedPct(data.changePct, 2)}`}
            truncate="END"
            maxLines={1}
            style={{ fontSize: 12, fontWeight: '600', color: stateColor, marginTop: 1 }}
          />
        </FlexWidget>
      ),
    },
    {
      key: 'band',
      h: 62,
      prio: 1,
      el: (
        <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
          {value !== null && <BandBar p={p} pos={bandPosition(value, data.minBand, data.maxBand)} color={stateColor} />}
          <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', marginTop: 3 }}>
            <FlexWidget style={{ flex: 1 }}>
              <TextWidget text={`최소 ${usd(data.minBand, 0)}`} maxLines={1} style={{ fontSize: 10, color: p.muted }} />
            </FlexWidget>
            <FlexWidget style={{ flex: 1 }}>
              <TextWidget text={`V ${usd(data.vValue, 0)}`} maxLines={1} style={{ fontSize: 10, color: p.muted, textAlign: 'center' }} />
            </FlexWidget>
            <FlexWidget style={{ flex: 1 }}>
              <TextWidget text={`최대 ${usd(data.maxBand, 0)}`} maxLines={1} style={{ fontSize: 10, color: p.muted, textAlign: 'right' }} />
            </FlexWidget>
          </FlexWidget>
          {bounds && (
            <Sub
              p={p}
              color={p.text}
              text={`매수선 ${usd(bounds.buyPrice)} (${signedPct(bounds.buyDistancePct, 1)}) · 매도선 ${usd(bounds.sellPrice)} (${signedPct(bounds.sellDistancePct, 1)})`}
            />
          )}
        </FlexWidget>
      ),
    },
    {
      key: 'assets',
      h: 66,
      prio: 2,
      el: (
        <Tiles
          p={p}
          items={[
            { label: '총자산', value: usd(totalAssets, 0), sub: `원금 ${usd(data.investedPrincipal, 0)}` },
            { label: '수익률', value: signedPct(profitPct, 1), color: tone(p, profitPct), sub: signedUsd(profit), subColor: tone(p, profit) },
            { label: `보유 ${data.quantity}주`, value: signedUsd(unrealized), color: tone(p, unrealized), sub: `평단 ${usd(data.avgPrice)}` },
          ]}
        />
      ),
    },
    {
      key: 'pool',
      h: 66,
      prio: 3,
      el: (
        <Tiles
          p={p}
          items={[
            { label: 'Pool', value: usd(data.pool, 0), sub: `사용가능 ${usd(data.usablePool, 0)}` },
            { label: '현금 비중', value: cashPct !== null ? `${cashPct.toFixed(1)}%` : '—' },
            { label: 'V₂ 예정', value: usd(data.v2Preview, 0), sub: signedPct(growth, 1), subColor: tone(p, growth) },
          ]}
        />
      ),
    },
  ];

  const kept = pack(fixed, m.avail);
  const rows = Math.min(data.fills.length, rowsFit(m.avail - totalH(kept), ROW_H));
  const cycleText =
    data.cycleNo !== null ? `사이클 ${data.cycleNo}${data.cycleStart ? ` · ${data.cycleStart}${data.cycleEnd ? `~${data.cycleEnd}` : ''}` : ''}` : '최근 체결';
  const list: Section[] =
    rows > 0
      ? [
          {
            key: 'fills',
            h: 20 + rows * ROW_H,
            prio: 9,
            el: (
              <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
                <ListTitle p={p} text={cycleText} right={data.renewalInDays !== null ? `V 갱신 ${data.renewalInDays <= 0 ? '오늘' : `D-${data.renewalInDays}`}` : undefined} />
                {data.fills.slice(0, rows).map((f, i) => (
                  <LineRow
                    key={i}
                    p={p}
                    left={`${f.date}  ${KIND_LABEL[f.kind] ?? f.kind}`}
                    right={`${usd(f.price)} × ${f.quantity}`}
                    rightColor={f.kind === 'SELL' ? p.danger : p.brand}
                  />
                ))}
              </FlexWidget>
            ),
          },
        ]
      : [];

  return <Body>{[...kept, ...list].map((s) => s.el)}</Body>;
}

export function VrWidget(props: WidgetViewProps<VrWidgetData>) {
  const { p, data, at, stale, size } = props;
  const empty = emptyBody(p, props);
  return (
    <Frame p={p} title="VR · TQQQ" link={WIDGET_URI.vr} at={at} stale={stale}>
      {empty ?? (data && <VrBody p={p} data={data} size={size} />)}
    </Frame>
  );
}
