'use no memo';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { AssetWidgetData } from './data';
import {
  Big,
  Body,
  Frame,
  LineRow,
  ListTitle,
  ROW_H,
  Spark,
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
import type { Hex, Palette } from './palette';
import { signedPct, signedWon, wonShort } from './format';

function MixLegend({ mix, total }: { mix: AssetWidgetData['mix']; total: number }) {
  return (
    <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', marginTop: 4 }}>
      {mix.slice(0, 4).map((m, i) => (
        <FlexWidget key={i} style={{ flex: 1 }}>
          <TextWidget text={`${m.label} ${Math.round((m.value / (total || 1)) * 100)}%`} maxLines={1} style={{ fontSize: 10.5, fontWeight: '600', color: m.color as Hex }} />
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}

function AssetBody({ p, data, size }: { p: Palette; data: AssetWidgetData; size: WidgetViewProps<AssetWidgetData>['size'] }) {
  const m = metrics(size);
  const past = data.offset < 0;
  const first = data.periods[0];
  const saved = data.monthIncome - data.monthExpense;

  const sections: Section[] = [
    {
      key: 'hero',
      h: 58,
      prio: 0,
      el: (
        <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
          <Big p={p} text={wonShort(data.netWorth)} />
          {past && data.monthChange && (
            <Sub
              p={p}
              color={tone(p, data.monthChange.change)}
              text={`${data.month}월 말 · 전월 대비 ${signedWon(data.monthChange.change)}${data.monthChange.pct !== null ? ` (${signedPct(data.monthChange.pct)})` : ''}`}
            />
          )}
          {past && !data.monthChange && <Sub p={p} text={`${data.month}월 말 순자산`} />}
          {!past && first && <Sub p={p} color={tone(p, first.change)} text={`${first.label} ${signedWon(first.change)}${first.pct !== null ? ` (${signedPct(first.pct)})` : ''}`} />}
        </FlexWidget>
      ),
    },
    ...(data.periods.length > 0
      ? [
          {
            key: 'periods',
            h: 64,
            prio: 2,
            el: (
              <Tiles
                p={p}
                items={data.periods.map((x) => ({
                  label: x.label,
                  value: signedWon(x.change),
                  color: tone(p, x.change),
                  sub: x.pct !== null ? signedPct(x.pct) : '—',
                  subColor: tone(p, x.change),
                }))}
              />
            ),
          } satisfies Section,
        ]
      : []),
    {
      key: 'flow',
      h: 50,
      prio: 0,
      el: (
        <Tiles
          p={p}
          items={[
            { label: `${data.month}월 지출`, value: wonShort(data.monthExpense) },
            { label: `${data.month}월 수입`, value: wonShort(data.monthIncome) },
            { label: data.monthIncome > 0 ? `저축 ${Math.round((saved / data.monthIncome) * 100)}%` : '저축', value: signedWon(saved), color: tone(p, saved) },
          ]}
        />
      ),
    },
    ...(data.mix.length > 0
      ? [
          {
            key: 'mix',
            h: 60,
            prio: 3,
            el: (
              <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
                <ListTitle p={p} text="자산 구성" right={data.debtTotal > 0 ? `부채 ${wonShort(data.debtTotal)}` : data.inputAgeDays !== null ? `입력 ${data.inputAgeDays}일 전` : undefined} />
                <StackBar p={p} top={4} parts={data.mix.map((x) => ({ weight: x.value, color: x.color as Hex }))} />
                <MixLegend mix={data.mix} total={data.assetTotal} />
              </FlexWidget>
            ),
          } satisfies Section,
        ]
      : []),
    ...(data.topExpense.length > 0
      ? [
          {
            key: 'top',
            h: 20 + data.topExpense.length * ROW_H,
            prio: 4,
            el: (
              <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
                <ListTitle p={p} text={`${data.month}월 지출 상위`} />
                {data.topExpense.map((t, i) => (
                  <LineRow key={i} p={p} left={t.name} right={`${wonShort(t.amount)} · ${Math.round((t.amount / (data.monthExpense || 1)) * 100)}%`} />
                ))}
              </FlexWidget>
            ),
          } satisfies Section,
        ]
      : []),
    ...(data.recent.length > 0
      ? [
          {
            key: 'recent',
            h: 20 + Math.min(2, data.recent.length) * ROW_H,
            prio: 5,
            el: <RecentList p={p} data={data} rows={Math.min(2, data.recent.length)} />,
            grow: { min: Math.min(2, data.recent.length), max: data.recent.length, rowH: ROW_H, make: (rows: number) => <RecentList p={p} data={data} rows={rows} /> },
          } satisfies Section,
        ]
      : []),
    ...(data.trend.length >= 3
      ? [
          {
            key: 'trend',
            h: 74,
            prio: 6,
            el: (
              <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
                <ListTitle p={p} text="순자산 추이 12개월" right={`${wonShort(data.trend[0]!)} → ${wonShort(data.trend[data.trend.length - 1]!)}`} />
                <Spark p={p} width={m.inner} height={46} series={[{ values: data.trend, color: p.brand, fill: true }]} top={4} />
              </FlexWidget>
            ),
          } satisfies Section,
        ]
      : []),
  ];

  return <Body>{layout(m.avail, sections)}</Body>;
}

function RecentList({ p, data, rows }: { p: Palette; data: AssetWidgetData; rows: number }) {
  return (
    <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
      <ListTitle p={p} text={data.offset === 0 ? '최근 거래' : `${data.month}월 거래`} />
      {data.recent.slice(0, rows).map((r, i) => (
        <LineRow key={i} p={p} left={`${r.date}  ${r.title}`} right={`${r.type === 'INCOME' ? '+' : '-'}${wonShort(r.amount)}`} rightColor={r.type === 'INCOME' ? p.brand : p.text} />
      ))}
    </FlexWidget>
  );
}

export function AssetDiaryWidget(props: WidgetViewProps<AssetWidgetData>) {
  const { p, data, at, stale, size, monthOffset } = props;
  const empty = emptyBody(p, props);
  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1).getMonth() + 1;
  return (
    <Frame
      p={p}
      title="자산일기"
      link={WIDGET_URI.asset}
      at={at}
      stale={stale}
      nav={{ label: `${month}월`, canPrev: monthOffset > -24, canNext: monthOffset < 0, isCurrent: monthOffset === 0 }}
    >
      {empty ?? (data && <AssetBody p={p} data={data} size={size} />)}
    </Frame>
  );
}
