'use no memo';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { LedgerWidgetData } from './data';
import { Big, Body, Frame, Sub, WIDGET_URI, emptyBody, metrics, tone, type WidgetViewProps } from './components';
import type { Hex, Palette } from './palette';
import { signedWon, wonExact, wonShort } from './format';
import { isKoreanHoliday } from '../lib/koreanHolidays';

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];
const pad2 = (n: number) => String(n).padStart(2, '0');

/** 보여줄 날짜: 고른 날(이 달 안이면) → 이번 달이면 오늘 → 그 달에 거래가 있는 가장 최근 날 */
function pickDay(data: LedgerWidgetData, selected: string | null): string | null {
  const prefix = `${data.year}-${pad2(data.month)}`;
  if (selected && selected.startsWith(prefix)) return selected;
  if (data.today.startsWith(prefix)) return data.today;
  return data.txs[0]?.date ?? null;
}

function Calendar({ p, data, cell, picked }: { p: Palette; data: LedgerWidgetData; cell: number; picked: string | null }) {
  const first = new Date(data.year, data.month - 1, 1).getDay();
  const dim = new Date(data.year, data.month, 0).getDate();
  const weeks = Math.ceil((first + dim) / 7);
  const byDay = new Map(data.days.map((d) => [d.d, d]));
  const exps = data.days.filter((d) => d.exp > 0).map((d) => d.exp).sort((a, b) => a - b);
  const q = (r: number) => exps[Math.min(exps.length - 1, Math.floor(exps.length * r))] ?? 0;
  const [q1, q2, q3] = [q(0.34), q(0.67), q(0.9)];
  const prefix = `${data.year}-${pad2(data.month)}`;
  const todayD = data.today.startsWith(prefix) ? Number(data.today.slice(8, 10)) : -1;
  const pickedD = picked && picked.startsWith(prefix) ? Number(picked.slice(8, 10)) : -1;
  const fs = cell >= 22 ? 10.5 : 9.5;

  // 지출 농도(연한→진한 4단계) — 하루 지출이 큰 날이 한눈에 보이게
  const heat = (exp: number): Hex | undefined => {
    if (exp <= 0) return undefined;
    const a = exp <= q1 ? '2E' : exp <= q2 ? '55' : exp <= q3 ? '88' : 'BB';
    return `${p.danger}${a}` as Hex;
  };

  const rows = [];
  for (let w = 0; w < weeks; w++) {
    const cells = [];
    for (let c = 0; c < 7; c++) {
      const d = w * 7 + c - first + 1;
      if (d < 1 || d > dim) {
        cells.push(<FlexWidget key={c} style={{ width: cell, height: cell }} />);
        continue;
      }
      const day = byDay.get(d);
      const ds = `${prefix}-${pad2(d)}`;
      const red = c === 0 || isKoreanHoliday(ds);
      const incomeOnly = !!day && day.inc > 0 && day.exp === 0;
      const bg = heat(day?.exp ?? 0);
      const fg: Hex = incomeOnly ? p.brand : d === todayD ? p.brand : red ? p.danger : p.text;
      cells.push(
        <FlexWidget
          key={c}
          clickAction="LEDGER_DAY"
          clickActionData={{ date: ds }}
          style={{
            width: cell,
            height: cell,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 7,
            ...(bg ? { backgroundColor: bg } : {}),
            ...(d === pickedD ? { borderWidth: 1.5, borderColor: p.text } : {}),
          }}
        >
          <TextWidget text={String(d)} style={{ fontSize: fs, fontWeight: d === todayD || incomeOnly ? '800' : '500', color: fg }} />
        </FlexWidget>,
      );
    }
    rows.push(
      <FlexWidget key={w} style={{ flexDirection: 'row' }}>
        {cells}
      </FlexWidget>,
    );
  }

  return (
    <FlexWidget style={{ flexDirection: 'column' }}>
      <FlexWidget style={{ flexDirection: 'row' }}>
        {WEEK.map((w, i) => (
          <FlexWidget key={i} style={{ width: cell, alignItems: 'center' }}>
            <TextWidget text={w} style={{ fontSize: 9.5, color: i === 0 ? p.danger : p.muted }} />
          </FlexWidget>
        ))}
      </FlexWidget>
      {rows}
    </FlexWidget>
  );
}

function DayRow({ p, t }: { p: Palette; t: LedgerWidgetData['txs'][number] }) {
  return (
    <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
      <FlexWidget style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.color as Hex, marginRight: 5 }} />
      <FlexWidget style={{ flex: 1 }}>
        <TextWidget text={t.title} truncate="END" maxLines={1} style={{ fontSize: 10.5, color: p.text }} />
      </FlexWidget>
      <TextWidget
        text={`${t.type === 'INCOME' ? '+' : '-'}${wonExact(t.amount)}`}
        maxLines={1}
        style={{ fontSize: 10.5, fontWeight: '700', color: t.type === 'INCOME' ? p.brand : p.text, paddingLeft: 4 }}
      />
    </FlexWidget>
  );
}

function SidePanel({ p, data, picked, height }: { p: Palette; data: LedgerWidgetData; picked: string | null; height: number }) {
  const dayTx = picked ? data.txs.filter((t) => t.date === picked) : [];
  const dayExp = dayTx.filter((t) => t.type === 'EXPENSE').reduce((a, t) => a + t.amount, 0);
  const dayInc = dayTx.filter((t) => t.type === 'INCOME').reduce((a, t) => a + t.amount, 0);
  const label = picked ? `${Number(picked.slice(5, 7))}/${Number(picked.slice(8, 10))} (${WEEKDAY[new Date(Number(picked.slice(0, 4)), Number(picked.slice(5, 7)) - 1, Number(picked.slice(8, 10))).getDay()]})` : '날짜 선택';

  // 높이 배분: 제목 줄 + 선택한 날 목록 + (남으면) 지출 상위 카테고리
  const topRowsMax = Math.min(data.topCats.length, 3);
  const topNeeded = topRowsMax > 0 ? 16 + topRowsMax * 15 : 0;
  const listRows = Math.max(1, Math.min(dayTx.length, Math.floor((height - 18 - topNeeded) / 16)));
  const room = height - 18 - Math.max(1, Math.min(dayTx.length, listRows)) * 16 - 4;
  const topRows = Math.max(0, Math.min(topRowsMax, Math.floor((room - 16) / 15)));
  const more = dayTx.length - listRows;

  return (
    <FlexWidget style={{ flex: 1, flexDirection: 'column', marginLeft: 10 }}>
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center' }}>
        <FlexWidget style={{ flex: 1 }}>
          <TextWidget text={label} maxLines={1} style={{ fontSize: 11, fontWeight: '700', color: p.text }} />
        </FlexWidget>
        {dayExp > 0 && <TextWidget text={`-${wonExact(dayExp)}`} maxLines={1} style={{ fontSize: 10.5, fontWeight: '700', color: p.danger }} />}
        {dayExp === 0 && dayInc > 0 && <TextWidget text={`+${wonExact(dayInc)}`} maxLines={1} style={{ fontSize: 10.5, fontWeight: '700', color: p.brand }} />}
      </FlexWidget>
      {dayTx.length === 0 && <TextWidget text="거래 없음" style={{ fontSize: 10.5, color: p.muted, marginTop: 4 }} />}
      {dayTx.slice(0, listRows).map((t, i) => (
        <DayRow key={i} p={p} t={t} />
      ))}
      {more > 0 && <TextWidget text={`외 ${more}건`} style={{ fontSize: 10, color: p.muted, marginTop: 2 }} />}
      {topRows > 0 && (
        <FlexWidget style={{ width: 'match_parent', flexDirection: 'column', marginTop: 8 }}>
          <TextWidget text={`${data.month}월 지출 상위`} maxLines={1} style={{ fontSize: 10, fontWeight: '600', color: p.muted }} />
          {data.topCats.slice(0, topRows).map((c, i) => (
            <FlexWidget key={i} style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <FlexWidget style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.color as Hex, marginRight: 5 }} />
              <FlexWidget style={{ flex: 1 }}>
                <TextWidget text={c.name} truncate="END" maxLines={1} style={{ fontSize: 10.5, color: p.text }} />
              </FlexWidget>
              <TextWidget text={`${Math.round((c.amount / (data.expense || 1)) * 100)}%`} maxLines={1} style={{ fontSize: 10.5, color: p.muted }} />
            </FlexWidget>
          ))}
        </FlexWidget>
      )}
    </FlexWidget>
  );
}

function LedgerBody({ p, data, size, selected }: { p: Palette; data: LedgerWidgetData; size: WidgetViewProps<LedgerWidgetData>['size']; selected: string | null }) {
  const m = metrics(size);
  const weeks = Math.ceil((new Date(data.year, data.month - 1, 1).getDay() + new Date(data.year, data.month, 0).getDate()) / 7);
  const heroH = 58;
  const calAvail = Math.max(0, m.avail - heroH - 6);
  const cell = Math.max(18, Math.min(26, Math.floor((calAvail - 14) / weeks), Math.floor((m.inner * 0.55) / 7)));
  const showCal = calAvail >= 14 + weeks * 18;
  const sideW = m.inner - cell * 7 - 10;
  const picked = pickDay(data, selected);
  const saved = data.income - data.expense;
  const addUri = `${WIDGET_URI.ledgerAdd}${picked ? `?date=${picked}` : ''}`;

  return (
    <Body>
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center' }}>
        <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
          <Big p={p} text={`-${wonShort(data.expense)}`} />
          <Sub p={p} text={`수입 ${wonShort(data.income)} · 저축 ${signedWon(saved)}`} color={tone(p, saved)} />
        </FlexWidget>
        <FlexWidget
          clickAction="OPEN_URI"
          clickActionData={{ uri: addUri }}
          style={{ backgroundColor: p.brand, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginLeft: 8, alignItems: 'center', justifyContent: 'center' }}
        >
          <TextWidget text="+ 입력" style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }} />
        </FlexWidget>
      </FlexWidget>
      {showCal && (
        <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', marginTop: 6 }}>
          <Calendar p={p} data={data} cell={cell} picked={picked} />
          {sideW >= 90 && <SidePanel p={p} data={data} picked={picked} height={calAvail} />}
        </FlexWidget>
      )}
    </Body>
  );
}

export function LedgerWidget(props: WidgetViewProps<LedgerWidgetData>) {
  const { p, data, at, stale, size, monthOffset, ui } = props;
  const empty = emptyBody(p, props);
  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1).getMonth() + 1;
  return (
    <Frame
      p={p}
      title="거래장부 · 월 지출"
      link={WIDGET_URI.ledger}
      at={at}
      stale={stale}
      nav={{ label: `${month}월`, canPrev: monthOffset > -24, canNext: monthOffset < 0, isCurrent: monthOffset === 0 }}
    >
      {empty ?? (data && <LedgerBody p={p} data={data} size={size} selected={ui?.selectedDate ?? null} />)}
    </Frame>
  );
}
