'use no memo';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { LaofusWidgetData } from './data';
import {
  Big,
  Body,
  Frame,
  LineRow,
  ListTitle,
  ROW_H,
  Spark,
  SparkLegend,
  StackBar,
  Sub,
  Tiles,
  WIDGET_URI,
  emptyBody,
  layout,
  metrics,
  tone,
  type Section,
  type WidgetViewProps,
} from './components';
import type { Palette } from './palette';
import { signedPct, usd, wonShort } from './format';
import { orderSideLabel } from '../lib/laofus-order-label';

const signedUsd = (v: number | null) => (v === null ? '—' : `${v >= 0 ? '+' : '-'}${usd(Math.abs(v))}`);

function OrdersList({ p, data, rows }: { p: Palette; data: LaofusWidgetData; rows: number }) {
  return (
    <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
      <ListTitle p={p} text={`걸린 주문 ${data.orders.length}건`} right={data.nextRun ? `다음 실행 ${data.nextRun}` : undefined} />
      {data.orders.length === 0 && <LineRow p={p} left="걸린 주문 없음" right="" leftColor={p.muted} />}
      {data.orders.slice(0, rows).map((o, i) => (
        <LineRow
          key={i}
          p={p}
          left={`${orderSideLabel('SOXL', o)} ${o.type} ${usd(o.price)} · ${o.quantity}주`}
          leftColor={o.alert ? p.danger : p.text}
          right={`현재가 ${signedPct(o.distancePct)}`}
          rightColor={o.alert ? p.danger : p.muted}
        />
      ))}
    </FlexWidget>
  );
}

function TradesList({ p, data, rows }: { p: Palette; data: LaofusWidgetData; rows: number }) {
  return (
    <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
      <ListTitle p={p} text="최근 체결" />
      {data.trades.slice(0, rows).map((x, i) => (
        <LineRow
          key={i}
          p={p}
          left={`${x.date}  ${x.side === 'BUY' ? `매수 ${x.kind}` : x.kind}`}
          right={`${usd(x.price)} × ${Math.round(x.quantity * 100) / 100}`}
          rightColor={x.side === 'BUY' ? p.brand : p.danger}
        />
      ))}
    </FlexWidget>
  );
}

function LaofusBody({ p, data, size }: { p: Palette; data: LaofusWidgetData; size: WidgetViewProps<LaofusWidgetData>['size'] }) {
  const m = metrics(size);
  const wide = m.inner >= 290;
  const t = data.t ?? 0;
  const fill = Math.max(0.02, Math.min(1, t / data.splits));

  const tilesA = [
    { label: '평단', value: usd(data.avgPrice) },
    { label: '별지점', value: usd(data.star) },
    { label: '전량매도 +20%', value: usd(data.target) },
    ...(wide ? [{ label: '1회 매수', value: usd(data.oneBuy, 0) }] : []),
  ];

  const nOrders = Math.max(1, data.orders.length);
  const nTrades = data.trades.length;

  const sections: Section[] = [
    {
      key: 'hero',
      h: 58,
      prio: 0,
      el: (
        <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
          <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center' }}>
            <Big p={p} text={usd(data.price)} />
            <TextWidget text={`  ${signedPct(data.changePct, 2)}`} style={{ fontSize: 13, fontWeight: '600', color: tone(p, data.changePct), marginTop: 8 }} />
          </FlexWidget>
          <Sub p={p} text={`${data.sessionLabel ? `${data.sessionLabel} · ` : ''}보유 ${data.quantity ?? '—'}주 · 평가금 ${usd(data.marketValueUsd)}`} />
        </FlexWidget>
      ),
    },
    {
      key: 'gauge',
      h: 36,
      prio: 2,
      el: (
        <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
          <ListTitle
            p={p}
            text={`T ${Math.round(t * 100) / 100} / ${data.splits}`}
            right={data.cycleNo !== null ? `사이클 ${data.cycleNo}${data.cycleDay !== null ? ` · ${data.cycleDay}일째` : ''}` : undefined}
          />
          <StackBar p={p} top={4} parts={[{ weight: fill, color: p.brand }, { weight: 1 - fill, color: p.surface }]} />
        </FlexWidget>
      ),
    },
    { key: 'levels', h: 50, prio: 1, el: <Tiles p={p} items={tilesA} /> },
    {
      key: 'pnl',
      h: 64,
      prio: 3,
      el: (
        <Tiles
          p={p}
          items={[
            { label: '평가손익', value: signedUsd(data.profitUsd), color: tone(p, data.profitUsd), sub: signedPct(data.profitPct, 1), subColor: tone(p, data.profitPct) },
            { label: '잔금', value: usd(data.cashUsd, 0), sub: data.oneBuy !== null ? `1회 ${usd(data.oneBuy, 0)}` : undefined },
            {
              label: '계좌 총자산',
              value: data.totalAssetsKrw !== null ? wonShort(data.totalAssetsKrw) : '—',
              sub: data.dayProfitUsd !== null ? `오늘 ${signedUsd(data.dayProfitUsd)}` : undefined,
              subColor: tone(p, data.dayProfitUsd),
            },
          ]}
        />
      ),
    },
    {
      key: 'orders',
      h: 20 + 1 * ROW_H,
      prio: 1,
      el: <OrdersList p={p} data={data} rows={1} />,
      grow: { min: 1, max: nOrders, rowH: ROW_H, make: (rows: number) => <OrdersList p={p} data={data} rows={rows} /> },
    },
    ...(nTrades > 0
      ? [
          {
            key: 'trades',
            h: 20 + ROW_H,
            prio: 5,
            el: <TradesList p={p} data={data} rows={1} />,
            grow: { min: 1, max: nTrades, rowH: ROW_H, make: (rows: number) => <TradesList p={p} data={data} rows={rows} /> },
          } satisfies Section,
        ]
      : []),
    ...(data.closes.length >= 5
      ? [
          {
            key: 'spark',
            h: 92,
            prio: 6,
            el: (
              <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
                <ListTitle p={p} text="SOXL 최근 1개월" />
                <Spark
                  p={p}
                  width={m.inner}
                  height={46}
                  series={[{ values: data.closes, color: p.brand, fill: true }]}
                  hlines={data.avgPrice !== null ? [{ value: data.avgPrice, color: '#A78BFA', dashed: true }] : []}
                  top={4}
                />
                <SparkLegend
                  p={p}
                  items={[
                    { label: '종가', color: p.brand },
                    ...(data.avgPrice !== null ? [{ label: `내 평단 ${usd(data.avgPrice)}`, color: '#A78BFA' as const, dashed: true }] : []),
                  ]}
                  right={data.avgPrice !== null && data.price !== null ? `평단 대비 ${signedPct(((data.price - data.avgPrice) / data.avgPrice) * 100, 1)}` : undefined}
                  rightColor={data.avgPrice !== null && data.price !== null ? tone(p, data.price - data.avgPrice) : undefined}
                />
              </FlexWidget>
            ),
          } satisfies Section,
        ]
      : []),
  ];

  return <Body>{layout(m.avail, sections)}</Body>;
}

export function LaofusWidget(props: WidgetViewProps<LaofusWidgetData>) {
  const { p, data, at, stale, size } = props;
  const empty = emptyBody(p, props);
  return (
    <Frame p={p} title="라오어 · SOXL 무한매수법" link={WIDGET_URI.laofus} at={at} stale={stale}>
      {empty ?? (data && <LaofusBody p={p} data={data} size={size} />)}
    </Frame>
  );
}
