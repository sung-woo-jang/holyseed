// screens-misc.jsx — 현금흐름, 연간비교, 더보기, 멤버관리

function CashflowScreen({ data, theme, onBack }) {
  const [range, setRange] = React.useState('이번달');
  const all = data.transactions;

  // filter by range
  const filtered = React.useMemo(() => {
    if (range === '이번달') return all.filter(t => t.date.startsWith('2026-04'));
    if (range === '올해') return all.filter(t => t.date.startsWith('2026'));
    if (range === '작년') return all.filter(t => t.date.startsWith('2025'));
    if (range === '3년') return all.filter(t => parseInt(t.date.slice(0, 4)) >= 2024);
    if (range === '전체') return all;
    return all;
  }, [range, all]);

  const expenses = filtered.filter(t => t.type === 'EXPENSE');
  const income = filtered.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const expense = expenses.reduce((s, t) => s + t.amount, 0);
  const savingsRate = income ? Math.round(((income - expense) / income) * 100) : 0;

  // category breakdown
  const byCat = {};
  expenses.forEach(t => {
    if (!byCat[t.category]) byCat[t.category] = 0;
    byCat[t.category] += t.amount;
  });
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const max = cats[0]?.[1] || 1;

  // monthly trend (income vs expense bars)
  const trend = React.useMemo(() => {
    const map = {};
    filtered.forEach(t => {
      const ym = t.date.slice(0, 7);
      if (!map[ym]) map[ym] = { ym, in: 0, out: 0 };
      if (t.type === 'INCOME') map[ym].in += t.amount;
      if (t.type === 'EXPENSE') map[ym].out += t.amount;
    });
    return Object.values(map).sort((a, b) => a.ym.localeCompare(b.ym));
  }, [filtered]);

  const trendMax = Math.max(...trend.map(t => Math.max(t.in, t.out)), 1);

  return (
    <div style={{ paddingBottom: 60 }}>
      <ScreenHeader title="현금흐름" onBack={onBack} theme={theme} />
      <div style={{ padding: '4px 20px 16px' }}>
        <Segmented options={['이번달', '올해', '작년', '3년', '전체']} active={range} theme={theme} onChange={setRange} />
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ background: theme.card, borderRadius: 16, padding: 20, border: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 500, marginBottom: 4 }}>수입</div>
              <div style={{ fontSize: 16, color: theme.brand, fontWeight: 700 }}>+{KRW_SHORT(income)}원</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 500, marginBottom: 4 }}>지출</div>
              <div style={{ fontSize: 16, color: theme.danger, fontWeight: 700 }}>-{KRW_SHORT(expense)}원</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 500, marginBottom: 4 }}>저축률</div>
              <div style={{ fontSize: 16, color: theme.text, fontWeight: 700 }}>{savingsRate}%</div>
            </div>
          </div>
          {income > 0 && (
            <>
              <div style={{ height: 8, borderRadius: 4, background: theme.bg, overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${Math.min(100, (expense / income) * 100)}%`, background: theme.danger }} />
                <div style={{ flex: 1, background: theme.brand }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: theme.textMuted }}>
                <span>지출 {Math.round((expense/income)*100)}%</span>
                <span>저축 {savingsRate}%</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* monthly trend bars */}
      {trend.length > 1 && (
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ fontSize: 13, color: theme.text, fontWeight: 700, marginBottom: 10, padding: '0 4px' }}>
            월별 수입·지출 추이
          </div>
          <div style={{ background: theme.card, borderRadius: 14, padding: 16, border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 110, overflowX: 'auto' }}>
              {trend.map((t, i) => (
                <div key={t.ym} style={{ flex: '0 0 auto', minWidth: trend.length > 12 ? 16 : 22,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 88 }}>
                    <div style={{
                      width: trend.length > 12 ? 5 : 8, height: `${(t.in / trendMax) * 100}%`,
                      background: theme.brand, borderRadius: '2px 2px 0 0', minHeight: 1,
                    }} />
                    <div style={{
                      width: trend.length > 12 ? 5 : 8, height: `${(t.out / trendMax) * 100}%`,
                      background: theme.danger, borderRadius: '2px 2px 0 0', minHeight: 1,
                    }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 9, color: theme.textMuted }}>
              <span>{trend[0]?.ym}</span>
              <span>{trend[trend.length - 1]?.ym}</span>
            </div>
            <div style={{ marginTop: 6, display: 'flex', gap: 12, justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: theme.textMuted }}>
                <div style={{ width: 8, height: 8, background: theme.brand, borderRadius: 2 }} /> 수입
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: theme.textMuted }}>
                <div style={{ width: 8, height: 8, background: theme.danger, borderRadius: 2 }} /> 지출
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ fontSize: 13, color: theme.text, fontWeight: 700, marginBottom: 10, padding: '0 4px' }}>
          어디에 가장 많이 썼을까?
        </div>
        <div style={{ background: theme.card, borderRadius: 14, padding: 16, border: `1px solid ${theme.border}` }}>
          {cats.length === 0 && (
            <div style={{ fontSize: 12, color: theme.textMuted, textAlign: 'center', padding: 16 }}>
              해당 기간의 지출이 없어요
            </div>
          )}
          {cats.map(([cat, amount], i) => {
            const def = CATEGORY_DEFS[cat] || {};
            const pct = expense ? (amount / expense) * 100 : 0;
            return (
              <div key={cat} style={{ marginBottom: i < cats.length - 1 ? 14 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{def.icon}</span>
                    <span style={{ fontSize: 13, color: theme.text, fontWeight: 600 }}>{cat}</span>
                    <span style={{ fontSize: 11, color: theme.textMuted }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ fontSize: 13, color: theme.text, fontWeight: 700 }}>{KRW_SHORT(amount)}원</div>
                </div>
                <HBar value={amount} max={max} color={def.color || theme.brand} dark={theme.dark} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CompareScreen({ data, theme, onBack }) {
  const yearlyContrib = data.yearlyContrib || {};
  const yearly = data.netWorth.yearly || [];
  const availableYears = Object.keys(yearlyContrib).map(Number).sort((a, b) => b - a);
  const [year, setYear] = React.useState(availableYears[0] || 2025);

  const yearIdx = yearly.findIndex(y => y.year === year);
  const cur = yearly[yearIdx];
  const prev = yearly[yearIdx - 1];
  const change = (cur && prev) ? cur.value - prev.value : 0;
  const contributions = yearlyContrib[year] || [];

  const wfData = [
    { label: `${year - 1}년`, value: prev?.value || 0 },
    ...contributions.map(c => ({ label: c.category.slice(0, 4), value: c.value })),
    { label: `${year}년`, value: cur?.value || 0 },
  ];

  return (
    <div style={{ paddingBottom: 60 }}>
      <ScreenHeader title="연간 비교" onBack={onBack} theme={theme} />

      {/* Year selector */}
      <div style={{ padding: '4px 20px 14px' }}>
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 0',
        }}>
          {availableYears.map(y => (
            <button key={y} onClick={() => setYear(y)}
              style={{
                flex: '0 0 auto', padding: '8px 14px', borderRadius: 10,
                background: y === year ? theme.brand : theme.card,
                color: y === year ? '#fff' : theme.text,
                border: `1px solid ${y === year ? theme.brand : theme.border}`,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}>
              {y - 1} → {y}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 4 }}>
          {year - 1}년 → {year}년 사이
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: theme.text, letterSpacing: -0.8 }}>
          {change >= 0 ? '+' : ''}{KRW(change)} {change >= 0 ? '늘었어요' : '줄었어요'}
        </div>
        <div style={{ marginTop: 8, display: 'inline-flex', padding: '4px 10px',
          background: change >= 0 ? theme.brandSoft : 'rgba(245,101,101,0.12)',
          color: change >= 0 ? theme.brand : theme.danger, borderRadius: 999,
          fontSize: 13, fontWeight: 700 }}>
          {prev ? PCT((change / prev.value) * 100) : '—'}
        </div>
      </div>

      {/* 5년 trend */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ background: theme.card, borderRadius: 16, padding: 16, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 13, color: theme.text, fontWeight: 700, marginBottom: 10 }}>
            5년 순자산 추이
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 110 }}>
            {yearly.map(y => {
              const maxV = Math.max(...yearly.map(x => x.value));
              const h = (y.value / maxV) * 100;
              const isActive = y.year === year;
              return (
                <div key={y.year} onClick={() => setYear(y.year)} style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 4, cursor: 'pointer',
                }}>
                  <div style={{ fontSize: 10, color: theme.text, fontWeight: 700,
                    opacity: isActive ? 1 : 0.5 }}>
                    {KRW_SHORT(y.value)}
                  </div>
                  <div style={{
                    width: '100%', height: `${h}%`, minHeight: 4,
                    background: isActive ? theme.brand : theme.brandSoft,
                    borderRadius: '4px 4px 0 0', transition: 'all 0.2s',
                  }} />
                  <div style={{ fontSize: 10, color: isActive ? theme.text : theme.textMuted,
                    fontWeight: isActive ? 700 : 500 }}>
                    {y.year}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ background: theme.card, borderRadius: 16, padding: 16, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 13, color: theme.text, fontWeight: 700, marginBottom: 4 }}>
            자산군별 증감 워터폴
          </div>
          <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 10 }}>
            {year - 1} → {year} 사이 어디서 얼마나 늘고 줄었는지
          </div>
          <WaterfallChart data={wfData} width={295} height={220} dark={theme.dark} />
        </div>
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ fontSize: 13, color: theme.text, fontWeight: 700, marginBottom: 10, padding: '0 4px' }}>
          가장 많이 기여한 자산군
        </div>
        <div style={{ background: theme.card, borderRadius: 14, border: `1px solid ${theme.border}` }}>
          {contributions.map((c, i) => (
            <div key={i} style={{
              padding: '14px', display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: i < contributions.length - 1 ? `1px solid ${theme.border}` : 'none',
            }}>
              <div style={{ width: 8, height: 36, borderRadius: 4, background: c.color }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: theme.text, fontWeight: 700 }}>{c.category}</div>
                <div style={{ fontSize: 11, color: theme.textMuted }}>
                  비중 {Math.round(Math.abs(c.value) / Math.max(1, Math.abs(change)) * 100)}%
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700,
                color: c.value >= 0 ? theme.brand : theme.danger }}>
                {c.value > 0 ? '+' : ''}{KRW_SHORT(c.value)}원
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MoreScreen({ data, theme, role, onMembers, onCashflow, onCompare, onCategories, onSwitchHousehold }) {
  const owner = data.members.find(m => m.role === 'OWNER');
  const items = [
    { icon: '👥', label: '멤버 관리', detail: `${data.members.length}명 · 초대/합류 코드`, onClick: onMembers },
    { icon: '💵', label: '현금흐름', detail: '카테고리별 분석', onClick: onCashflow },
    { icon: '📊', label: '연간 비교', detail: '5년 워터폴 차트', onClick: onCompare },
    { icon: '📂', label: '카테고리 관리', detail: '커스텀 카테고리 추가/편집', onClick: onCategories },
    { icon: '⚙️', label: '설정', detail: '알림, 통화, 백업' },
  ];

  return (
    <div style={{ paddingBottom: 120 }}>
      <div style={{ padding: '20px 20px 16px' }}>
        <div style={{
          padding: 16, borderRadius: 16, background: theme.card,
          border: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: theme.brand,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800,
          }}>🏡</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, color: theme.text, fontWeight: 700 }}>우리집</div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
              {data.members.length}명 · {owner?.name} 님이 소유
            </div>
          </div>
          <button onClick={onSwitchHousehold}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer',
              padding: 8, display: 'flex' }}>
            {Icon.refresh(theme.textMuted)}
          </button>
        </div>
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ background: theme.card, borderRadius: 14, border: `1px solid ${theme.border}` }}>
          {items.map((it, i) => (
            <button key={i} onClick={it.onClick}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px', border: 'none', background: 'transparent',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                borderBottom: i < items.length - 1 ? `1px solid ${theme.border}` : 'none',
              }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: theme.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {it.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: theme.text, fontWeight: 600 }}>{it.label}</div>
                <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{it.detail}</div>
              </div>
              {Icon.chevronRight(theme.textMuted)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px', textAlign: 'center', fontSize: 11, color: theme.textMuted }}>
        자산일기 v1.0 · Apps-in-Toss
      </div>
    </div>
  );
}

function MembersScreen({ data, theme, role, onBack }) {
  const [showInvite, setShowInvite] = React.useState(false);
  const [showJoin, setShowJoin] = React.useState(false);
  const isOwner = role === 'OWNER';

  return (
    <div style={{ paddingBottom: 60 }}>
      <ScreenHeader title="멤버 관리" onBack={onBack} theme={theme} />

      <div style={{ padding: '4px 20px 14px' }}>
        <div style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.5 }}>
          우리집 자산을 함께 기록·조회하는 멤버들이에요.
        </div>
      </div>

      <div style={{ padding: '0 20px 14px' }}>
        <div style={{ background: theme.card, borderRadius: 14, border: `1px solid ${theme.border}` }}>
          {data.members.map((m, i) => (
            <div key={m.id} style={{
              padding: '14px', display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: i < data.members.length - 1 ? `1px solid ${theme.border}` : 'none',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 20, background: m.avatar,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800,
              }}>{m.initial}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: theme.text, fontWeight: 700 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                  {m.joined} 합류
                </div>
              </div>
              <RoleBadge role={m.role} theme={theme} />
            </div>
          ))}
        </div>
      </div>

      {isOwner && (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => setShowInvite(true)} style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: theme.brand, color: '#fff', border: 'none',
            fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>+ 멤버 초대하기</button>
          <button onClick={() => setShowJoin(true)} style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: theme.brandSoft, color: theme.brand, border: 'none',
            fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>🔗 초대 코드로 합류하기</button>
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 6, textAlign: 'center' }}>
            토스 메시지나 카카오톡으로 초대 링크를 보낼 수 있어요
          </div>
        </div>
      )}

      {!isOwner && (
        <div style={{ padding: '0 20px' }}>
          <button onClick={() => setShowJoin(true)} style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: theme.brand, color: '#fff', border: 'none',
            fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>🔗 초대 코드로 합류하기</button>
          <div style={{ marginTop: 12, padding: 14, borderRadius: 12,
            background: theme.bg, border: `1px solid ${theme.border}` }}>
            <div style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.5 }}>
              🔒 멤버 초대는 OWNER만 할 수 있어요. 초대 코드를 받았다면 위 버튼으로 합류하세요.
            </div>
          </div>
        </div>
      )}

      {showInvite && <InviteSheet theme={theme} onClose={() => setShowInvite(false)} />}
      {showJoin && <JoinSheet theme={theme} onClose={() => setShowJoin(false)} />}
    </div>
  );
}

function JoinSheet({ theme, onClose }) {
  const [code, setCode] = React.useState('');
  const [step, setStep] = React.useState('enter'); // enter | preview | done
  const validCode = code.replace(/[^A-Z0-9-]/gi, '').toUpperCase().length >= 8;

  const handleNext = () => setStep('preview');
  const handleJoin = () => { setStep('done'); setTimeout(onClose, 1200); };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end', zIndex: 200,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', background: theme.card, borderRadius: '20px 20px 0 0',
        animation: 'sheetUp 0.25s ease-out',
      }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${theme.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, color: theme.text, fontWeight: 700 }}>
            {step === 'enter' && '초대 코드 입력'}
            {step === 'preview' && '가구 합류 확인'}
            {step === 'done' && '합류 완료!'}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none',
            cursor: 'pointer', display: 'flex' }}>{Icon.close(theme.textMuted)}</button>
        </div>

        {step === 'enter' && (
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
              초대받은 코드를 입력하면 그 가구의 자산일기에 합류할 수 있어요.
            </div>
            <input
              autoFocus
              type="text"
              placeholder="TOSS-XXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '16px',
                borderRadius: 12, border: `1.5px solid ${validCode ? theme.brand : theme.border}`,
                background: theme.bg, color: theme.text, fontSize: 18, fontWeight: 700,
                fontFamily: 'ui-monospace, monospace', textAlign: 'center', letterSpacing: 2,
                outline: 'none',
              }} />
            <button onClick={handleNext} disabled={!validCode} style={{
              width: '100%', padding: '14px', borderRadius: 12, marginTop: 14,
              background: validCode ? theme.brand : theme.border, color: '#fff', border: 'none',
              fontSize: 15, fontWeight: 700, cursor: validCode ? 'pointer' : 'default', fontFamily: 'inherit',
            }}>다음</button>
          </div>
        )}

        {step === 'preview' && (
          <div style={{ padding: 20 }}>
            <div style={{ padding: 18, borderRadius: 12, background: theme.bg,
              textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 6 }}>🏡</div>
              <div style={{ fontSize: 18, color: theme.text, fontWeight: 800 }}>김토스님의 우리집</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
                멤버 3명 · 자산 10건 기록중
              </div>
            </div>
            <div style={{ padding: 14, borderRadius: 10, background: theme.brandSoft, marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: theme.brand, fontWeight: 700, marginBottom: 4 }}>
                초대받은 권한
              </div>
              <div style={{ fontSize: 14, color: theme.text, fontWeight: 700 }}>편집자 (EDITOR)</div>
              <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4, lineHeight: 1.5 }}>
                자산·거래 입력 가능. 멤버 초대는 불가능해요.
              </div>
            </div>
            <button onClick={handleJoin} style={{
              width: '100%', padding: '14px', borderRadius: 12,
              background: theme.brand, color: '#fff', border: 'none',
              fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>합류하기</button>
          </div>
        )}

        {step === 'done' && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: theme.text }}>합류 완료!</div>
            <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 6 }}>
              우리집 자산일기에 오신 것을 환영해요
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoriesScreen({ theme, role, onBack }) {
  const isViewer = role === 'VIEWER';
  const [items, setItems] = React.useState(() =>
    Object.entries(CATEGORY_DEFS).map(([name, def]) => ({ name, ...def, builtin: true }))
  );
  const [showAdd, setShowAdd] = React.useState(false);

  const grouped = {
    INCOME: items.filter(i => i.type === 'INCOME'),
    EXPENSE: items.filter(i => i.type === 'EXPENSE'),
    TRANSFER: items.filter(i => i.type === 'TRANSFER'),
  };

  const onAdd = (cat) => { setItems(its => [...its, { ...cat, builtin: false }]); setShowAdd(false); };
  const onDelete = (name) => setItems(its => its.filter(i => i.name !== name));

  return (
    <div style={{ paddingBottom: 60 }}>
      <ScreenHeader title="카테고리 관리" onBack={onBack} theme={theme} />

      <div style={{ padding: '4px 20px 14px' }}>
        <div style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.5 }}>
          기본 카테고리에 더해, 우리집만의 카테고리를 만들 수 있어요.
        </div>
      </div>

      {[
        { k: 'INCOME', l: '수입', items: grouped.INCOME },
        { k: 'EXPENSE', l: '지출', items: grouped.EXPENSE },
        { k: 'TRANSFER', l: '이체', items: grouped.TRANSFER },
      ].map(g => (
        <div key={g.k} style={{ padding: '0 20px 14px' }}>
          <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 700,
            padding: '0 4px 6px' }}>{g.l} ({g.items.length})</div>
          <div style={{ background: theme.card, borderRadius: 14, border: `1px solid ${theme.border}` }}>
            {g.items.map((c, i) => (
              <div key={c.name} style={{
                padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: i < g.items.length - 1 ? `1px solid ${theme.border}` : 'none',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: theme.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {c.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: theme.text, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                    {c.builtin ? '기본 카테고리' : '커스텀'}
                  </div>
                </div>
                <div style={{ width: 14, height: 14, borderRadius: 7, background: c.color }} />
                {!c.builtin && !isViewer && (
                  <button onClick={() => onDelete(c.name)} style={{
                    background: 'transparent', border: 'none', color: theme.danger,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    padding: '4px 8px',
                  }}>삭제</button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {!isViewer && (
        <div style={{ padding: '0 20px' }}>
          <button onClick={() => setShowAdd(true)} style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: theme.brand, color: '#fff', border: 'none',
            fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>+ 카테고리 추가</button>
        </div>
      )}

      {showAdd && <AddCategorySheet theme={theme} onClose={() => setShowAdd(false)} onAdd={onAdd} />}
    </div>
  );
}

function AddCategorySheet({ theme, onClose, onAdd }) {
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState('EXPENSE');
  const [icon, setIcon] = React.useState('🎁');
  const [color, setColor] = React.useState('#3182F6');
  const icons = ['🎁','🐶','✈️','📷','🎮','🎵','🍰','💪','🌱','🚗','🎨','📱'];
  const colors = ['#3182F6','#0AB39C','#F59E0B','#EF4444','#A78BFA','#EC4899','#06B6D4','#8B5CF6'];
  const ok = name.trim().length > 0;

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end', zIndex: 200,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', background: theme.card, borderRadius: '20px 20px 0 0',
        animation: 'sheetUp 0.25s ease-out',
      }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${theme.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, color: theme.text, fontWeight: 700 }}>카테고리 추가</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none',
            cursor: 'pointer', display: 'flex' }}>{Icon.close(theme.textMuted)}</button>
        </div>
        <div style={{ padding: 20 }}>
          <input autoFocus value={name} onChange={e => setName(e.target.value)}
            placeholder="카테고리 이름 (예: 반려동물)"
            style={{
              width: '100%', boxSizing: 'border-box', padding: '14px',
              borderRadius: 12, border: `1px solid ${theme.border}`,
              background: theme.bg, color: theme.text, fontSize: 14, fontFamily: 'inherit',
              outline: 'none', marginBottom: 14,
            }} />

          <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 700, marginBottom: 8 }}>분류</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {[{k:'INCOME',l:'수입'},{k:'EXPENSE',l:'지출'},{k:'TRANSFER',l:'이체'}].map(o => (
              <button key={o.k} onClick={() => setType(o.k)} style={{
                flex: 1, padding: '8px', borderRadius: 8,
                border: `1.5px solid ${type === o.k ? theme.brand : theme.border}`,
                background: type === o.k ? theme.brandSoft : 'transparent',
                color: type === o.k ? theme.brand : theme.textMuted,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>{o.l}</button>
            ))}
          </div>

          <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 700, marginBottom: 8 }}>아이콘</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {icons.map(i => (
              <button key={i} onClick={() => setIcon(i)} style={{
                width: 40, height: 40, borderRadius: 10,
                border: `1.5px solid ${icon === i ? theme.brand : theme.border}`,
                background: icon === i ? theme.brandSoft : theme.bg, fontSize: 20,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>{i}</button>
            ))}
          </div>

          <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 700, marginBottom: 8 }}>색상</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {colors.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{
                width: 32, height: 32, borderRadius: 16,
                border: `3px solid ${color === c ? theme.text : 'transparent'}`,
                background: c, cursor: 'pointer',
              }} />
            ))}
          </div>

          <button onClick={() => onAdd({ name, type, icon, color })} disabled={!ok} style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: ok ? theme.brand : theme.border, color: '#fff', border: 'none',
            fontSize: 15, fontWeight: 700, cursor: ok ? 'pointer' : 'default', fontFamily: 'inherit',
          }}>저장</button>
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role, theme }) {
  const cfg = {
    OWNER: { label: '소유자', bg: theme.brandSoft, color: theme.brand },
    EDITOR: { label: '편집자', bg: theme.bg, color: theme.text },
    VIEWER: { label: '뷰어', bg: theme.bg, color: theme.textMuted },
  }[role];
  return (
    <span style={{
      padding: '4px 8px', borderRadius: 6,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
    }}>{cfg.label}</span>
  );
}

function InviteSheet({ theme, onClose }) {
  const [role, setRole] = React.useState('EDITOR');
  const [step, setStep] = React.useState('select'); // select | code

  const code = 'TOSS-' + Math.random().toString(36).slice(2, 8).toUpperCase();

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end', zIndex: 200,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', background: theme.card, borderRadius: '20px 20px 0 0',
        animation: 'sheetUp 0.25s ease-out',
      }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${theme.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, color: theme.text, fontWeight: 700 }}>
            {step === 'select' ? '멤버 초대' : '초대 링크 발급됨'}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none',
            cursor: 'pointer', display: 'flex' }}>{Icon.close(theme.textMuted)}</button>
        </div>

        {step === 'select' && (
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 12 }}>
              어떤 권한으로 초대할까요?
            </div>
            {[
              { k: 'EDITOR', t: '편집자', d: '자산·거래 입력 가능, 멤버 초대는 불가' },
              { k: 'VIEWER', t: '뷰어', d: '조회만 가능 (자녀, 부모, 회계사)' },
            ].map(o => (
              <button key={o.k} onClick={() => setRole(o.k)} style={{
                width: '100%', display: 'block', padding: 16, marginBottom: 10,
                borderRadius: 12, textAlign: 'left',
                border: `1.5px solid ${role === o.k ? theme.brand : theme.border}`,
                background: role === o.k ? theme.brandSoft : 'transparent',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 4 }}>
                  {o.t}
                </div>
                <div style={{ fontSize: 12, color: theme.textMuted }}>{o.d}</div>
              </button>
            ))}
            <button onClick={() => setStep('code')} style={{
              width: '100%', padding: 14, borderRadius: 12,
              background: theme.brand, color: '#fff', border: 'none',
              fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              marginTop: 8,
            }}>초대 링크 발급</button>
          </div>
        )}

        {step === 'code' && (
          <div style={{ padding: 20 }}>
            <div style={{ padding: 16, borderRadius: 12, background: theme.bg,
              textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 6 }}>초대 코드</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: theme.text,
                letterSpacing: 1, fontFamily: 'ui-monospace, monospace' }}>{code}</div>
              <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 8 }}>
                7일 후 만료
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{
                flex: 1, padding: 14, borderRadius: 12,
                background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`,
                fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>코드 복사</button>
              <button onClick={onClose} style={{
                flex: 1, padding: 14, borderRadius: 12,
                background: theme.brand, color: '#fff', border: 'none',
                fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>토스로 보내기</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { CashflowScreen, CompareScreen, MoreScreen, MembersScreen, RoleBadge, InviteSheet, JoinSheet, CategoriesScreen, AddCategorySheet });
