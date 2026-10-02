'use no memo';
import type { AssetWidgetData } from './data';
import { Big, Column, Frame, Metric, MetricRow, Sub, WIDGET_URI, emptyBody, tone, type WidgetViewProps } from './components';
import { signedPct, signedWon, wonShort } from './format';

export function AssetDiaryWidget(props: WidgetViewProps<AssetWidgetData>) {
  const { p, data, at, stale } = props;
  const empty = emptyBody(p, props);
  return (
    <Frame p={p} title="자산일기 · 순자산" link={WIDGET_URI.asset} at={at} stale={stale}>
      {empty ??
        (data && (
          <Column>
            <Big p={p} text={wonShort(data.netWorth)} />
            {data.change30d !== null && (
              <Sub
                p={p}
                color={tone(p, data.change30d)}
                text={`30일 ${signedWon(data.change30d)}${data.change30dPct !== null ? ` (${signedPct(data.change30dPct)})` : ''}`}
              />
            )}
            <MetricRow p={p}>
              <Metric p={p} label={`${data.month}월 지출`} value={wonShort(data.monthExpense)} />
              <Metric p={p} label={`${data.month}월 수입`} value={wonShort(data.monthIncome)} />
            </MetricRow>
          </Column>
        ))}
    </Frame>
  );
}
