'use no memo';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WorklogWidgetData } from './data';
import { Big, Body, Frame, Sub, Tiles, WIDGET_URI, emptyBody, metrics, tone, type WidgetViewProps } from './components';
import type { Hex, Palette } from './palette';
import { signedWon, wonShort } from './format';
import { isKoreanHoliday } from '../lib/koreanHolidays';

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const pad2 = (n: number) => String(n).padStart(2, '0');

function Calendar({ p, data, cell }: { p: Palette; data: WorklogWidgetData; cell: number }) {
  const first = new Date(data.year, data.month - 1, 1).getDay();
  const dim = new Date(data.year, data.month, 0).getDate();
  const weeks = Math.ceil((first + dim) / 7);
  const status = new Map(data.days.map((d) => [d.d, d.s]));
  const isThisMonth = data.today.startsWith(`${data.year}-${pad2(data.month)}`);
  const todayD = isThisMonth ? Number(data.today.slice(8, 10)) : -1;
  const fs = cell >= 22 ? 10.5 : 9.5;

  const rows = [];
  for (let w = 0; w < weeks; w++) {
    const cells = [];
    for (let c = 0; c < 7; c++) {
      const d = w * 7 + c - first + 1;
      if (d < 1 || d > dim) {
        cells.push(<FlexWidget key={c} style={{ width: cell, height: cell }} />);
        continue;
      }
      const s = status.get(d);
      const ds = `${data.year}-${pad2(data.month)}-${pad2(d)}`;
      const red = c === 0 || isKoreanHoliday(ds);
      const bg: Hex | undefined = s === 'W' ? p.brand : s === 'S' ? p.brandSoft : undefined;
      const fg: Hex = s === 'W' ? '#FFFFFF' : s === 'S' ? p.brand : s === 'O' ? p.muted : red ? p.danger : p.text;
      cells.push(
        <FlexWidget
          key={c}
          clickAction="OPEN_URI"
          clickActionData={{ uri: s ? WIDGET_URI.worklog : `${WIDGET_URI.worklogAdd}?date=${ds}` }}
          style={{
            width: cell,
            height: cell,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: cell / 2,
            ...(bg ? { backgroundColor: bg } : {}),
            ...(d === todayD ? { borderWidth: 1.5, borderColor: s === 'W' ? p.text : p.brand } : {}),
          }}
        >
          <TextWidget text={String(d)} style={{ fontSize: fs, fontWeight: s ? '700' : '500', color: fg }} />
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

function Block({ p, label, value, color }: { p: Palette; label: string; value: string; color: Hex }) {
  return (
    <FlexWidget style={{ flexDirection: 'column', marginTop: 4 }}>
      <TextWidget text={label} maxLines={1} style={{ fontSize: 10, color: p.muted }} />
      <TextWidget text={value} truncate="END" maxLines={1} style={{ fontSize: 12, fontWeight: '600', color }} />
    </FlexWidget>
  );
}

function SidePanel({ p, data, height }: { p: Palette; data: WorklogWidgetData; height: number }) {
  const current = data.offset === 0;
  const blocks = [];
  let used = 0;
  if (current) {
    blocks.push(<Block key="today" p={p} label="오늘" value={data.todayTitle ?? '기록 없음'} color={data.todayTitle ? p.text : p.muted} />);
    blocks.push(<Block key="next" p={p} label="다음 근무" value={data.next ? `${data.next.date} ${data.next.title}` : '예정 없음'} color={data.next ? p.text : p.muted} />);
    used += 64;
  }
  // 받을 돈 — 남는 높이만큼 줄 수를 정한다
  let room = height - used - 6;
  if (data.receivables.length > 0 && room >= 31) {
    const rows = Math.min(data.receivables.length, Math.floor((room - 16) / 15));
    blocks.push(
      <FlexWidget key="recv" style={{ flexDirection: 'column', marginTop: 6 }}>
        <TextWidget text={`받을 돈 ${wonShort(data.pendingNet)}`} maxLines={1} style={{ fontSize: 10, color: p.danger, fontWeight: '600' }} />
        {data.receivables.slice(0, rows).map((r, i) => (
          <TextWidget key={i} text={`${r.date} ${r.title} ${wonShort(r.net)}`} truncate="END" maxLines={1} style={{ fontSize: 10.5, color: p.text }} />
        ))}
      </FlexWidget>,
    );
    room -= 22 + rows * 15;
  }
  if (data.records.length > 0 && room >= 31) {
    const rows = Math.min(data.records.length, Math.floor((room - 16) / 15));
    blocks.push(
      <FlexWidget key="rec" style={{ flexDirection: 'column', marginTop: 6 }}>
        <TextWidget text={`${data.month}월 기록`} maxLines={1} style={{ fontSize: 10, color: p.muted, fontWeight: '600' }} />
        {data.records.slice(0, rows).map((r, i) => (
          <TextWidget key={i} text={`${r.date} ${r.title} ${wonShort(r.net)}`} truncate="END" maxLines={1} style={{ fontSize: 10.5, color: p.text }} />
        ))}
      </FlexWidget>,
    );
  }
  return <FlexWidget style={{ flex: 1, flexDirection: 'column', marginLeft: 10 }}>{blocks}</FlexWidget>;
}

function WorklogBody({ p, data, size }: { p: Palette; data: WorklogWidgetData; size: WidgetViewProps<WorklogWidgetData>['size'] }) {
  const m = metrics(size);
  const weeks = Math.ceil((new Date(data.year, data.month - 1, 1).getDay() + new Date(data.year, data.month, 0).getDate()) / 7);
  const heroH = 58;
  const tilesH = 50;
  const calAvail = Math.max(0, m.avail - heroH - tilesH - 6);
  // 요일 줄 14dp + 주 수만큼의 셀 — 높이에 맞춰 셀을 줄이되 너비의 58%까지만 달력에 쓴다
  const cell = Math.max(16, Math.min(26, Math.floor((calAvail - 14) / weeks), Math.floor((m.inner * 0.58) / 7)));
  const showCal = calAvail >= 14 + weeks * 16;
  const sideW = m.inner - cell * 7 - 10;
  const delta = data.prevNet !== null ? data.totalNet - data.prevNet : null;
  const addDate = data.offset === 0 ? '' : `?date=${data.year}-${pad2(data.month)}-01`;

  const tiles = [
    { label: `${data.month}월 근무`, value: `${data.workDays}일` },
    { label: '받은 돈', value: wonShort(data.receivedNet), color: p.brand },
    { label: '미수령', value: wonShort(data.pendingNet), color: data.pendingNet > 0 ? p.danger : p.text },
    ...(delta !== null && m.inner >= 290 ? [{ label: '전월 대비', value: signedWon(delta), color: tone(p, delta) }] : []),
  ];

  return (
    <Body>
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center' }}>
        <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
          <Big p={p} text={wonShort(data.totalNet)} />
          <Sub p={p} text={`세전 ${wonShort(data.totalGross)} · ${data.laborUnits}품`} />
        </FlexWidget>
        <FlexWidget
          clickAction="OPEN_URI"
          clickActionData={{ uri: `${WIDGET_URI.worklogAdd}${addDate}` }}
          style={{ backgroundColor: p.brand, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginLeft: 8, alignItems: 'center', justifyContent: 'center' }}
        >
          <TextWidget text="+ 입력" style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }} />
        </FlexWidget>
      </FlexWidget>
      <Tiles p={p} items={tiles} />
      {showCal && (
        <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', marginTop: 6 }}>
          <Calendar p={p} data={data} cell={cell} />
          {sideW >= 80 && <SidePanel p={p} data={data} height={calAvail} />}
        </FlexWidget>
      )}
    </Body>
  );
}

export function WorklogWidget(props: WidgetViewProps<WorklogWidgetData>) {
  const { p, data, at, stale, size, monthOffset } = props;
  const empty = emptyBody(p, props);
  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1).getMonth() + 1;
  return (
    <Frame
      p={p}
      title="근무일지 · 실수령"
      link={WIDGET_URI.worklog}
      at={at}
      stale={stale}
      nav={{ label: `${month}월`, canPrev: monthOffset > -24, canNext: monthOffset < 2, isCurrent: monthOffset === 0 }}
    >
      {empty ?? (data && <WorklogBody p={p} data={data} size={size} />)}
    </Frame>
  );
}
