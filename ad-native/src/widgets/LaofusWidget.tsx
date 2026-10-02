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
  StackBar,
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
import type { Palette } from './palette';
import { signedPct, usd, wonShort } from './format';

const signedUsd = (v: number | null) => (v === null ? '—' : `${v >= 0 ? '+' : '-'}${usd(Math.abs(v))}`);

function LaofusBody({ p, data, size }: { p: Palette; data: LaofusWidgetData; size: WidgetViewProps<LaofusWidgetData>['size'] }) {
  const m = metrics(size);
  const wide = m.inner >= 290;
  const t = data.t ?? 0;
  const fill = Math.max(0.02, Math.min(1, t / data.splits));

  const tilesA = [
    { label: '평단', value: usd(data.avgPrice) },
    { label: '별지점', value: usd(data.star) },
    { label: '목표가 +20%', value: usd(data.target) },
    ...(wide ? [{ label: '1회 매수', value: usd(data.oneBuy, 0) }] : []),
  ];

  const fixed: Section[] = [
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
      prio: 1,
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
    { key: 'levels', h: 52, prio: 2, el: <Tiles p={p} items={tilesA} /> },
    {
      key: 'pnl',
      h: 66,
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
  ];

  const kept = pack(fixed, m.avail);
  let leftover = m.avail - totalH(kept);
  const list: Section[] = [];

  const orderRows = Math.min(data.orders.length, rowsFit(leftover, ROW_H));
  if (orderRows > 0 || data.orders.length === 0) {
    const rows = data.orders.length === 0 ? 1 : orderRows;
    if (leftover >= 20 + rows * ROW_H) {
      list.push({
        key: 'orders',
        h: 20 + rows * ROW_H,
        prio: 8,
        el: (
          <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
            <ListTitle p={p} text={`걸린 주문 ${data.orders.length}건`} right={data.nextRun ? `다음 실행 ${data.nextRun}` : undefined} />
            {data.orders.length === 0 && <LineRow p={p} left="걸린 주문 없음" right="" leftColor={p.muted} />}
            {data.orders.slice(0, rows).map((o, i) => (
              <LineRow
                key={i}
                p={p}
                left={`${o.side === 'BUY' ? '매수' : '매도'} ${o.type} ${usd(o.price)} · ${o.quantity}주`}
                leftColor={o.alert ? p.danger : p.text}
                right={`현재가 ${signedPct(o.distancePct)}`}
                rightColor={o.alert ? p.danger : p.muted}
              />
            ))}
          </FlexWidget>
        ),
      });
      leftover -= 20 + rows * ROW_H;
    }
  }

  const tradeRows = Math.min(data.trades.length, rowsFit(leftover, ROW_H));
  if (tradeRows > 0) {
    list.push({
      key: 'trades',
      h: 20 + tradeRows * ROW_H,
      prio: 9,
      el: (
        <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
          <ListTitle p={p} text="최근 체결" />
          {data.trades.slice(0, tradeRows).map((x, i) => (
            <LineRow
              key={i}
              p={p}
              left={`${x.date}  ${x.side === 'BUY' ? '매수' : '매도'} ${x.kind}`}
              right={`${usd(x.price)} × ${Math.round(x.quantity * 100) / 100}`}
              rightColor={x.side === 'BUY' ? p.brand : p.danger}
            />
          ))}
        </FlexWidget>
      ),
    });
  }

  return <Body>{[...kept, ...list].map((s) => s.el)}</Body>;
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
