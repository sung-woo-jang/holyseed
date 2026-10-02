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
import type { Hex, Palette } from './palette';
import { signedPct, signedWon, wonShort } from './format';

function MixLegend({ p, mix, total }: { p: Palette; mix: AssetWidgetData['mix']; total: number }) {
  return (
    <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', marginTop: 4 }}>
      {mix.slice(0, 4).map((m, i) => (
        <FlexWidget key={i} style={{ flex: 1 }}>
          <TextWidget
            text={`${m.label} ${Math.round((m.value / (total || 1)) * 100)}%`}
            maxLines={1}
            style={{ fontSize: 10.5, fontWeight: '600', color: m.color as Hex }}
          />
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}

function AssetBody({ p, data, size }: { p: Palette; data: AssetWidgetData; size: WidgetViewProps<AssetWidgetData>['size'] }) {
  const m = metrics(size);
  const first = data.periods[0];
  const saved = data.monthIncome - data.monthExpense;

  const fixed: Section[] = [
    {
      key: 'hero',
      h: 58,
      prio: 0,
      el: (
        <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
          <Big p={p} text={wonShort(data.netWorth)} />
          {first && <Sub p={p} color={tone(p, first.change)} text={`${first.label} ${signedWon(first.change)}${first.pct !== null ? ` (${signedPct(first.pct)})` : ''}`} />}
        </FlexWidget>
      ),
    },
    {
      key: 'periods',
      h: 66,
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
    },
    {
      key: 'flow',
      h: 52,
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
                <MixLegend p={p} mix={data.mix} total={data.assetTotal} />
              </FlexWidget>
            ),
          } satisfies Section,
        ]
      : []),
  ];

  const kept = pack(fixed, m.avail);
  const rows = Math.min(data.recent.length, rowsFit(m.avail - totalH(kept), ROW_H));
  const list: Section[] =
    rows > 0
      ? [
          {
            key: 'recent',
            h: 20 + rows * ROW_H,
            prio: 9,
            el: (
              <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
                <ListTitle p={p} text="최근 거래" />
                {data.recent.slice(0, rows).map((r, i) => (
                  <LineRow
                    key={i}
                    p={p}
                    left={`${r.date}  ${r.title}`}
                    right={`${r.type === 'INCOME' ? '+' : '-'}${wonShort(r.amount)}`}
                    rightColor={r.type === 'INCOME' ? p.brand : p.text}
                  />
                ))}
              </FlexWidget>
            ),
          },
        ]
      : [];

  return <Body>{[...kept, ...list].map((s) => s.el)}</Body>;
}

export function AssetDiaryWidget(props: WidgetViewProps<AssetWidgetData>) {
  const { p, data, at, stale, size } = props;
  const empty = emptyBody(p, props);
  return (
    <Frame p={p} title="자산일기 · 순자산" link={WIDGET_URI.asset} at={at} stale={stale}>
      {empty ?? (data && <AssetBody p={p} data={data} size={size} />)}
    </Frame>
  );
}
