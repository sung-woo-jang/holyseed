// screens-home.jsx — 홈 / 가구 순자산 대시보드

function HomeScreen({ data, theme, role, onNav, onSnapshot }) {
  const nw = data.netWorth;
  const change = nw.current - nw.lastYear;
  const changePct = (change / nw.lastYear) * 100;
  const isViewer = role === 'VIEWER';

  return (
    <div style={{ paddingBottom: 120 }}>
      {/* Greeting + period selector */}
      <div style={{ padding: '16px 20px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, color: theme.textMuted, fontWeight: 500 }}>
          전년 동기 대비
        </div>
        <div style={{ fontSize: 12, color: theme.textMuted }}>
          {nw.snapshotDate} 기준
        </div>
      </div>

      {/* Net worth hero */}
      <div style={{ padding: '4px 20px 20px' }}>
        <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 6, fontWeight: 500 }}>
          우리집 순자산
        </div>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1, color: theme.text, lineHeight: 1.1 }}>
          {KRW(nw.current)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '4px 8px', borderRadius: 999,
            background: theme.brandSoft, color: theme.brand,
            fontSize: 13, fontWeight: 700,
          }}>
            {Icon.arrowUp(theme.brand)}
            {PCT(changePct)}
          </div>
          <span style={{ fontSize: 13, color: theme.text, fontWeight: 600 }}>
            {KRW(change)}
          </span>
        </div>
      </div>

      {/* Snapshot CTA */}
      {!isViewer && (
        <div style={{ padding: '0 20px 16px' }}>
          <button
            onClick={onSnapshot}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12,
              background: theme.brand, color: '#fff', border: 'none',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>
            <span style={{ whiteSpace: 'nowrap' }}>📸 이번 달 자산 스냅샷 입력하기</span>
            {Icon.chevronRight('#fff')}
          </button>
          <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 8, textAlign: 'center' }}>
            마지막 입력 후 32일 지났어요
          </div>
        </div>
      )}

      {/* Line chart card */}
      <ChartCard nw={nw} theme={theme} />

      {/* Year-over-year comparison link */}
      <div style={{ padding: '0 20px 16px' }}>
        <button
          onClick={() => onNav('compare')}
          style={{
            width: '100%', padding: '16px', borderRadius: 16,
            background: theme.card, border: `1px solid ${theme.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 14, color: theme.text, fontWeight: 700, marginBottom: 4 }}>
              작년이랑 얼마나 달라졌지?
            </div>
            <div style={{ fontSize: 12, color: theme.textMuted }}>
              자산군별 증감 워터폴 보기
            </div>
          </div>
          {Icon.chevronRight(theme.textMuted)}
        </button>
      </div>

      {/* Contribution donut */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{
          background: theme.card, borderRadius: 16, padding: 16,
          border: `1px solid ${theme.border}`,
        }}>
          <div style={{ fontSize: 14, color: theme.text, fontWeight: 700, marginBottom: 4 }}>
            올해 자산군별 기여도
          </div>
          <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 16 }}>
            우리집 순자산이 얼마나 늘었는지 자산별로 쪼개봤어요
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <DonutChart data={data.contributions} size={140} thickness={18} dark={theme.dark} />
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontSize: 10, color: theme.textMuted, fontWeight: 500 }}>총 기여</div>
                <div style={{ fontSize: 16, color: theme.text, fontWeight: 800 }}>
                  +{KRW_SHORT(data.contributions.reduce((s, c) => s + c.value, 0))}
                </div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.contributions.slice(0, 4).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                  <div style={{ fontSize: 12, color: theme.text, flex: 1, fontWeight: 500 }}>{c.category}</div>
                  <div style={{ fontSize: 12, color: c.value >= 0 ? theme.brand : theme.danger, fontWeight: 700 }}>
                    {c.value > 0 ? '+' : ''}{KRW_SHORT(c.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 12, padding: 12, background: theme.brandSoft, borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: theme.text, lineHeight: 1.5 }}>
              💡 <b>주식·ETF</b>가 우리집 자산 성장의 가장 큰 원동력이에요.
              올해만 +{KRW_SHORT(data.contributions[0].value)} 기여했어요.
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 14, color: theme.text, fontWeight: 700 }}>최근 거래</div>
          <button onClick={() => onNav('book')}
            style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            모두 보기
          </button>
        </div>
        <div style={{ background: theme.card, borderRadius: 16, border: `1px solid ${theme.border}` }}>
          {data.transactions.slice(0, 3).map((tx, i) => {
            const cat = CATEGORY_DEFS[tx.category] || {};
            const isLast = i === 2;
            return (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderBottom: isLast ? 'none' : `1px solid ${theme.border}`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: theme.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>{cat.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: 14, color: theme.text, fontWeight: 600,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.title}
                    </div>
                    {tx.auto && <AutoBadge theme={theme} />}
                  </div>
                  <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                    {tx.category} · {tx.date.slice(5).replace('-', '/')}
                  </div>
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  color: tx.type === 'INCOME' ? theme.brand : (tx.type === 'TRANSFER' ? theme.textMuted : theme.text),
                }}>
                  {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                  {KRW_SHORT(tx.amount)}원
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ nw, theme }) {
  const [range, setRange] = React.useState('1년');
  const all = nw.monthlyHistory;
  const sliced = React.useMemo(() => {
    if (range === '1년') return all.slice(-12);
    if (range === '3년') return all.slice(-36);
    return all;
  }, [range, all]);
  const first = sliced[0]?.value || 0;
  const last = sliced[sliced.length - 1]?.value || 0;
  const delta = last - first;
  const deltaPct = first ? (delta / first) * 100 : 0;

  return (
    <div style={{ padding: '0 20px 16px' }}>
      <div style={{
        background: theme.card, borderRadius: 16, padding: '16px 16px 10px',
        border: `1px solid ${theme.border}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 14, color: theme.text, fontWeight: 700 }}>순자산 변화</div>
          <Segmented options={['1년', '3년', '5년']} active={range} theme={theme} onChange={setRange} />
        </div>
        <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>
          {sliced[0]?.date} → {sliced[sliced.length-1]?.date}
          <span style={{ color: delta >= 0 ? theme.brand : theme.danger, fontWeight: 700, marginLeft: 6 }}>
            {delta > 0 ? '+' : ''}{KRW_SHORT(delta)}원 ({PCT(deltaPct)})
          </span>
        </div>
        <LineChart data={sliced} width={295} height={180} color={theme.brand} dark={theme.dark} />
        <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 4, textAlign: 'center' }}>
          그래프를 길게 누르거나 호버하면 그 시점의 금액을 볼 수 있어요
        </div>
      </div>
    </div>
  );
}


function Segmented({ options, active, theme, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 0, padding: 2, background: theme.bg,
      borderRadius: 8,
    }}>
      {options.map(o => (
        <button key={o}
          onClick={() => onChange && onChange(o)}
          style={{
            padding: '4px 10px', borderRadius: 6, border: 'none',
            background: o === active ? theme.card : 'transparent',
            color: o === active ? theme.text : theme.textMuted,
            fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: o === active ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
          }}>{o}</button>
      ))}
    </div>
  );
}

function AutoBadge({ theme }) {
  return (
    <span style={{
      fontSize: 10, padding: '2px 5px', borderRadius: 4,
      background: theme.brandSoft, color: theme.brand, fontWeight: 700,
      flexShrink: 0,
    }}>자동</span>
  );
}

Object.assign(window, { HomeScreen, Segmented, AutoBadge, ChartCard });
