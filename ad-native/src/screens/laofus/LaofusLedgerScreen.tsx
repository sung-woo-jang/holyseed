import { useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Segmented from '../../components/common/Segmented';
import QueryError from '../../components/common/QueryError';
import LineChart from '../../components/charts/LineChart';
import { laofusRestApi, type LedgerSummaryDto } from '../../api/laofus';
import { useTheme } from '../../lib/theme';

type ThemeT = ReturnType<typeof useTheme>;
type Tab = '요약' | '입금' | '종목' | '환전';
const TABS: Tab[] = ['요약', '입금', '종목', '환전'];

const chartWidth = Dimensions.get('window').width - 32 - 28;

const won = (v: number) => `₩${Math.round(Math.abs(v)).toLocaleString('ko-KR')}`;
const signedWon = (v: number) => `${v < 0 ? '−' : '+'}${won(v)}`;
const usd = (v: number, d = 2) => `$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
const signedUsd = (v: number) => `${v < 0 ? '−' : '+'}${usd(v)}`;
const signedPct = (v: number, d = 1) => `${v < 0 ? '−' : '+'}${Math.abs(v * 100).toFixed(d)}%`;
const manWon = (v: number) => `${Math.round(Math.abs(v) / 1e4).toLocaleString('ko-KR')}만`;
const rate = (v: number) => `${Math.round(v).toLocaleString('ko-KR')}원`;

function tone(v: number, theme: ThemeT): string {
  if (v === 0) return theme.text;
  return v > 0 ? theme.brand : theme.danger;
}

function Card({ title, right, children, theme }: { title?: string; right?: string; children: React.ReactNode; theme: ThemeT }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {title && (
        <View style={styles.rowBetween}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
          {right && <Text style={{ color: theme.textMuted, fontSize: 12 }}>{right}</Text>}
        </View>
      )}
      {children}
    </View>
  );
}

function Row({ left, sub, right, rightSub, rightColor, first, theme }: { left: string; sub?: string; right: string; rightSub?: string; rightColor?: string; first?: boolean; theme: ThemeT }) {
  return (
    <View style={[styles.listRow, !first && { borderTopWidth: 1, borderTopColor: theme.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>{left}</Text>
        {sub && <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 1 }}>{sub}</Text>}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ color: rightColor ?? theme.text, fontSize: 14, fontWeight: '700' }}>{right}</Text>
        {rightSub && <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 1 }}>{rightSub}</Text>}
      </View>
    </View>
  );
}

function HeroCard({ d, theme }: { d: LedgerSummaryDto; theme: ThemeT }) {
  const t = d.total;
  const base = d.ext.net;
  const gainShare = Math.max(t.pl, 0) / (base + Math.max(t.pl, 0));
  return (
    <Card theme={theme}>
      <Text style={{ color: theme.textMuted, fontSize: 12.5 }}>총손익</Text>
      <View style={styles.heroLine}>
        <Text style={{ color: tone(t.pl, theme), fontSize: 28, fontWeight: '800' }}>{signedWon(t.pl)}</Text>
        <Badge type={t.pl >= 0 ? 'blue' : 'red'} badgeStyle="weak" size="medium">
          {signedPct(t.rate)}
        </Badge>
      </View>
      {t.xirr !== null && <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>연환산 {signedPct(t.xirr)} · 입금·출금 날짜를 반영한 금액가중</Text>}
      <View style={[styles.stack, { backgroundColor: theme.border }]}>
        <View style={{ flex: 1 - gainShare, backgroundColor: theme.textMuted, opacity: 0.5 }} />
        <View style={{ flex: gainShare, backgroundColor: theme.brand }} />
      </View>
      <View style={styles.rowBetween}>
        <View>
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>넣은 돈</Text>
          <Text style={[styles.big, { color: theme.text }]}>{won(base)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>지금 평가액</Text>
          <Text style={[styles.big, { color: theme.text }]}>{won(t.val)}</Text>
        </View>
      </View>
      <View style={[styles.rowBetween, styles.pairTop, { borderTopColor: theme.border }]}>
        <View>
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>입금 {d.ext.nIn}번</Text>
          <Text style={[styles.mid, { color: theme.text }]}>{won(d.ext.in)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>출금 {d.ext.nOut}번</Text>
          <Text style={[styles.mid, { color: theme.text }]}>{won(d.ext.out)}</Text>
        </View>
      </View>
      <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 10 }}>
        기준 {d.asof} · 1달러 {rate(d.fx.mid)} · 기록 {d.counts.records}건
      </Text>
    </Card>
  );
}

interface Step {
  name: string;
  sub: string;
  value: number;
  usd: number | null;
}

function WaterfallCard({ d, theme }: { d: LedgerSummaryDto; theme: ThemeT }) {
  const [ccy, setCcy] = useState<'원화' | '달러'>('원화');
  const inKrw = ccy === '원화';
  const mid = d.fx.mid;
  const steps: Step[] = inKrw
    ? [
        { name: '실현손익', sub: '팔아서 확정', value: d.usd.real * mid, usd: d.usd.real },
        { name: '평가손익', sub: '들고 있는 종목', value: d.usd.unreal * mid, usd: d.usd.unreal },
        { name: '배당·이자', sub: '달러 배당, 이용료', value: d.total.incKrw, usd: d.usd.inc },
        { name: '환차손익', sub: '달러 평균 매입가', value: d.total.fxKrw, usd: null },
        { name: '원화 계좌', sub: 'ETF, 이자, 세금', value: d.total.krwKrw, usd: null },
      ]
    : [
        { name: '실현손익', sub: '팔아서 확정', value: d.usd.real, usd: null },
        { name: '평가손익', sub: '들고 있는 종목', value: d.usd.unreal, usd: null },
        { name: '배당·이자', sub: '달러 배당, 이용료', value: d.usd.inc, usd: null },
      ];
  let acc = 0;
  let lo = 0;
  let hi = 0;
  const ranges = steps.map((s) => {
    const a = acc;
    acc += s.value;
    lo = Math.min(lo, a, acc);
    hi = Math.max(hi, a, acc);
    return [a, acc] as const;
  });
  const span = hi - lo || 1;
  const fmt = inKrw ? signedWon : signedUsd;
  const stock = d.usd.real + d.usd.unreal;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.rowBetween}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>손익은 어디서 나왔나</Text>
        <Segmented options={['원화', '달러']} value={ccy} onChange={(v) => setCcy(v as '원화' | '달러')} small alignment="fluid" />
      </View>
      {steps.map((s, i) => {
        const [a, b] = ranges[i];
        return (
          <View key={s.name} style={[styles.wfRow, { borderTopColor: theme.border }, i > 0 && { borderTopWidth: 1 }]}>
            <View style={{ width: 82 }}>
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>{s.name}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 10.5 }}>{s.sub}</Text>
            </View>
            <View style={[styles.track, { backgroundColor: theme.bg }]}>
              <View style={{ position: 'absolute', top: 0, bottom: 0, borderRadius: 3, left: `${((Math.min(a, b) - lo) / span) * 100}%`, width: `${Math.max((Math.abs(b - a) / span) * 100, 1)}%`, backgroundColor: s.value >= 0 ? theme.brand : theme.danger }} />
            </View>
            <View style={{ width: 94, alignItems: 'flex-end' }}>
              <Text style={{ color: tone(s.value, theme), fontSize: 13, fontWeight: '700' }}>{fmt(s.value)}</Text>
              {inKrw && s.usd !== null && <Text style={{ color: theme.textMuted, fontSize: 10.5 }}>{signedUsd(s.usd)}</Text>}
            </View>
          </View>
        );
      })}
      <View style={[styles.wfRow, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
        <View style={{ width: 82 }}>
          <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>합계</Text>
          <Text style={{ color: theme.textMuted, fontSize: 10.5 }}>위 항목의 합</Text>
        </View>
        <View style={[styles.track, { backgroundColor: theme.bg }]}>
          <View style={{ position: 'absolute', top: 0, bottom: 0, borderRadius: 3, left: `${((Math.min(0, acc) - lo) / span) * 100}%`, width: `${(Math.abs(acc) / span) * 100}%`, backgroundColor: theme.text }} />
        </View>
        <View style={{ width: 94, alignItems: 'flex-end' }}>
          <Text style={{ color: tone(acc, theme), fontSize: 13, fontWeight: '800' }}>{fmt(acc)}</Text>
        </View>
      </View>
      <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 8, lineHeight: 17 }}>
        주식 매매만 보면 {signedUsd(stock)}({signedWon(d.total.stockKrw)})입니다. 환율 영향은 작았어요.
      </Text>
    </View>
  );
}

function HoldCard({ d, theme }: { d: LedgerSummaryDto; theme: ThemeT }) {
  return (
    <Card title="지금 들고 있는 것" right={`합계 ${usd(d.usd.assets)}`} theme={theme}>
      {d.hold.map((h, i) => (
        <Row
          key={h.name}
          first={i === 0}
          left={h.name}
          sub={`${h.q.toLocaleString('en-US', { maximumFractionDigits: 6 })}주 · 평균 ${usd(h.cost / h.q)}`}
          right={usd(h.mv)}
          rightSub={`${signedUsd(h.pl)} (${signedPct(h.cost > 0 ? h.pl / h.cost : 0)})`}
          rightColor={undefined}
          theme={theme}
        />
      ))}
      <Row left="달러 현금" sub={d.counts.pending > 0 ? `결제 대기 ${d.counts.pending}건 반영` : undefined} right={usd(d.usd.cash)} theme={theme} />
      {d.counts.unquoted > 0 && <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 6 }}>시세를 못 가져온 종목 {d.counts.unquoted}개는 원가로 보여드려요</Text>}
    </Card>
  );
}

function FlowCards({ d, theme }: { d: LedgerSummaryDto; theme: ThemeT }) {
  const line = d.series.map((p) => ({ date: `${p.m}-01`, value: p.c }));
  const peak = d.series.reduce((a, b) => (b.c > a.c ? b : a), d.series[0]);
  const recent = d.series.slice(-12).reverse();
  return (
    <>
      <Card title="누적 순입금" right="월 단위" theme={theme}>
        <View style={{ marginTop: 8 }}>
          <LineChart data={line} width={chartWidth} height={180} color={theme.brand} dark={theme.dark} interactive />
        </View>
        {peak && (
          <Text style={{ color: theme.textMuted, fontSize: 11.5, lineHeight: 17, marginTop: 4 }}>
            {peak.m}에 {won(peak.c)}까지 올랐고 지금은 {won(d.ext.net)}이에요.
          </Text>
        )}
      </Card>
      <Card title="최근 12개월 입금·출금" theme={theme}>
        {recent.map((p, i) => (
          <Row key={p.m} first={i === 0} left={p.m} sub={p.o > 0 ? `출금 ${manWon(p.o)}` : undefined} right={p.i > 0 ? `+${manWon(p.i)}` : '—'} rightColor={p.i > 0 ? theme.brand : theme.textMuted} theme={theme} />
        ))}
      </Card>
      <Card title="연도별 넣은 돈" theme={theme}>
        {d.years.map((y, i) => (
          <Row key={y.y} first={i === 0} left={`${y.y}년`} sub={`입금 ${manWon(y.i)} · 출금 ${manWon(y.o)} · ${y.n}번`} right={won(y.i - y.o)} rightSub="순입금" theme={theme} />
        ))}
        <Row left="합계" sub={`${d.ext.nIn + d.ext.nOut}번`} right={won(d.ext.net)} theme={theme} />
      </Card>
    </>
  );
}

function StockCard({ d, theme }: { d: LedgerSummaryDto; theme: ThemeT }) {
  const [all, setAll] = useState(false);
  const list = d.stocks;
  const max = Math.max(...list.map((s) => Math.abs(s.real)), 1);
  const wins = list.filter((s) => s.real > 0).length;
  const sum = list.reduce((a, s) => a + s.real, 0);
  const shown = all || list.length <= 10 ? list : [...list.slice(0, 6), ...list.slice(-4)];
  return (
    <Card title="종목별 실현손익" right={`${list.length}개 중 ${wins}개 이익`} theme={theme}>
      <Text style={{ color: tone(sum, theme), fontSize: 22, fontWeight: '800', marginTop: 6 }}>{signedUsd(sum)}</Text>
      <Text style={{ color: theme.textMuted, fontSize: 11.5, marginBottom: 6 }}>수수료·세금 반영, 팔아서 확정된 손익</Text>
      {shown.map((s, i) => {
        const w = (Math.abs(s.real) / max) * 50;
        return (
          <View key={s.name} style={[styles.stockRow, i > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}>
            <View style={styles.stockName}>
              <Text numberOfLines={1} style={{ color: theme.text, fontSize: 13, flexShrink: 1 }}>
                {s.name}
              </Text>
              {s.held && (
                <View style={[styles.heldTag, { backgroundColor: theme.brandSoft }]}>
                  <Text style={{ color: theme.brand, fontSize: 9.5, fontWeight: '700' }}>보유</Text>
                </View>
              )}
            </View>
            <View style={styles.diverge}>
              <View style={{ position: 'absolute', left: '50%', top: -5, bottom: -5, width: 1, backgroundColor: theme.border }} />
              <View style={{ position: 'absolute', top: 1, bottom: 1, borderRadius: 3, backgroundColor: s.real >= 0 ? theme.brand : theme.danger, ...(s.real >= 0 ? { left: '50%', width: `${w}%` } : { right: '50%', width: `${w}%` }) }} />
            </View>
            <Text style={{ width: 88, textAlign: 'right', color: tone(s.real, theme), fontSize: 13, fontWeight: '700' }}>{signedUsd(s.real)}</Text>
          </View>
        );
      })}
      {list.length > 10 && (
        <View style={{ marginTop: 10 }}>
          <Button size="medium" type="primary" style="weak" onPress={() => setAll((v) => !v)}>
            {all ? '접기' : `전체 ${list.length}개 보기`}
          </Button>
        </View>
      )}
    </Card>
  );
}

function FxCards({ d, theme }: { d: LedgerSummaryDto; theme: ThemeT }) {
  const x = d.ex;
  return (
    <>
      <Card title="환전" right="평균 환율" theme={theme}>
        <Row first left="원화 → 달러" sub={`${x.nIn}번 · ${won(x.krwOut)} → ${usd(x.usdIn)}`} right={rate(x.rIn)} rightSub="1달러당" theme={theme} />
        <Row left="달러 → 원화" sub={`${x.nOut}번 · ${usd(x.usdOut)} → ${won(x.krwIn)}`} right={rate(x.rOut)} rightSub="1달러당" theme={theme} />
        <Row left="남은 달러의 평균 매입" sub={`순 ${usd(x.netUsd)} · ${won(x.netKrw)}`} right={rate(x.rAvg)} rightSub={`지금 ${rate(d.fx.mid)}`} theme={theme} />
      </Card>
      <Card title="환차손익" theme={theme}>
        <Text style={{ color: tone(d.total.fxKrw, theme), fontSize: 24, fontWeight: '800', marginTop: 6 }}>{signedWon(d.total.fxKrw)}</Text>
        <Text style={{ color: theme.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 }}>지금 환율과 평균 매입 환율의 차이로 생긴 몫이에요. 환전은 넣은 돈에 세지 않아요.</Text>
      </Card>
    </>
  );
}

export default function LaofusLedgerScreen() {
  const theme = useTheme();
  const q = useQuery({ queryKey: ['laofus-ledger'], queryFn: laofusRestApi.ledger });
  const [tab, setTab] = useState<Tab>('요약');
  const [refreshing, setRefreshing] = useState(false);

  if (q.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }
  if (q.isError && !q.data) return <QueryError onRetry={() => { void q.refetch(); }} />;
  const d = q.data;
  if (!d) return <QueryError onRetry={() => { void q.refetch(); }} message="원장 데이터가 아직 없어요" />;

  const onRefresh = async () => {
    setRefreshing(true);
    await q.refetch();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
    >
      <Segmented options={TABS} value={tab} onChange={(v) => setTab(v as Tab)} />
      {tab === '요약' && (
        <>
          <HeroCard d={d} theme={theme} />
          <WaterfallCard d={d} theme={theme} />
          <HoldCard d={d} theme={theme} />
          <Text style={{ color: theme.textMuted, fontSize: 11.5, lineHeight: 17 }}>
            실현손익은 종목별 평균 원가, 환율은 토스 중간 환율이에요. 토스 기록 {d.counts.firstDate}~{d.counts.lastDate}를 계산했어요.
          </Text>
        </>
      )}
      {tab === '입금' && <FlowCards d={d} theme={theme} />}
      {tab === '종목' && <StockCard d={d} theme={theme} />}
      {tab === '환전' && <FxCards d={d} theme={theme} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14 },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' },
  stack: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', marginTop: 14, marginBottom: 8 },
  big: { fontSize: 17, fontWeight: '800', marginTop: 1 },
  mid: { fontSize: 15, fontWeight: '800', marginTop: 1 },
  pairTop: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  wfRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9 },
  track: { flex: 1, height: 12, borderRadius: 4, overflow: 'hidden' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  stockName: { width: 104, flexDirection: 'row', alignItems: 'center', gap: 5 },
  heldTag: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 999 },
  diverge: { flex: 1, height: 12 },
});
