'use no memo';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { LaofusWidgetData } from './data';
import { Big, Column, Frame, Metric, MetricRow, Sub, WIDGET_URI, emptyBody, tone, type WidgetViewProps } from './components';
import { signedPct, usd } from './format';

export function LaofusWidget(props: WidgetViewProps<LaofusWidgetData>) {
  const { p, data, at, stale } = props;
  const empty = emptyBody(p, props);
  return (
    <Frame p={p} title={`라오어 · SOXL${data?.sessionLabel ? ` · ${data.sessionLabel}` : ''}`} link={WIDGET_URI.laofus} at={at} stale={stale}>
      {empty ??
        (data && (
          <Column>
            <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center' }}>
              <Big p={p} text={usd(data.price)} />
              <TextWidget
                text={`  ${signedPct(data.changePct, 2)}`}
                style={{ fontSize: 13, fontWeight: '600', color: tone(p, data.changePct), marginTop: 8 }}
              />
            </FlexWidget>
            {data.orders.length === 0 && <Sub p={p} text="걸린 주문 없음" />}
            {data.orders.map((o, i) => (
              <Sub
                key={i}
                p={p}
                color={o.alert ? p.danger : p.text}
                text={`${o.side === 'BUY' ? '매수' : '매도'} ${o.type} ${usd(o.price)} · ${o.quantity}주 · 현재가 ${signedPct(o.distancePct)}${i === data.orders.length - 1 && data.orderCount > data.orders.length ? ` 외 ${data.orderCount - data.orders.length}건` : ''}`}
              />
            ))}
            <MetricRow p={p}>
              <Metric p={p} label="T" value={data.t !== null ? String(Math.round(data.t * 100) / 100) : '—'} />
              <Metric p={p} label="평단" value={usd(data.avgPrice)} />
              <Metric p={p} label="수익률" value={signedPct(data.profitPct, 1)} color={tone(p, data.profitPct)} />
            </MetricRow>
          </Column>
        ))}
    </Frame>
  );
}
