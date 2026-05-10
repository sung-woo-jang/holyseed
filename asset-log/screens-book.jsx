// screens-book.jsx — 가계부 (거래목록 + 정기지출), 거래입력시트

function BookScreen({ data, theme, role, onAddTx, onAddRecurring, onEditRecurring }) {
  const [tab, setTab] = React.useState('tx');
  const isViewer = role === 'VIEWER';

  // available months sorted desc
  const months = React.useMemo(() => {
    const set = new Set(data.transactions.map(t => t.date.slice(0, 7)));
    return [...set].sort().reverse();
  }, [data.transactions]);
  const [month, setMonth] = React.useState(months[0] || '2026-04');
  const monthIdx = months.indexOf(month);
  const canPrev = monthIdx < months.length - 1;
  const canNext = monthIdx > 0;

  // filter to selected month
  const monthTx = React.useMemo(
    () => data.transactions.filter(t => t.date.startsWith(month)),
    [data.transactions, month]
  );

  // group transactions by date
  const grouped = {};
  monthTx.forEach(t => {
    if (!grouped[t.date]) grouped[t.date] = [];
    grouped[t.date].push(t);
  });
  const dates = Object.keys(grouped).sort().reverse();

  // monthly totals
  const monthIncome = monthTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const monthLabel = `${parseInt(month.slice(5))}월 (${month.slice(0, 4)})`;

  return (
    <div style={{ paddingBottom: 120, position: 'relative' }}>
      <div style={{ padding: '8px 20px 0' }}>
        <div style={{
          display: 'flex', gap: 4, padding: 4, background: theme.card,
          borderRadius: 12, border: `1px solid ${theme.border}`,
        }}>
          {[
            { k: 'tx', l: '거래' },
            { k: 'rec', l: '정기지출' },
          ].map(o => (
            <button key={o.k} onClick={() => setTab(o.k)}
              style={{
                flex: 1, padding: '8px', borderRadius: 8, border: 'none',
                background: tab === o.k ? theme.brand : 'transparent',
                color: tab === o.k ? '#fff' : theme.textMuted,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>{o.l}</button>
          ))}
        </div>
      </div>

      {tab === 'tx' && (
        <>
          {/* Month selector */}
          <div style={{ padding: '14px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <button onClick={() => canPrev && setMonth(months[monthIdx + 1])}
              disabled={!canPrev}
              style={{
                width: 32, height: 32, borderRadius: 8, border: `1px solid ${theme.border}`,
                background: theme.card, color: canPrev ? theme.text : theme.textMuted,
                cursor: canPrev ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: 16, lineHeight: 1,
                opacity: canPrev ? 1 : 0.4,
              }}>‹</button>
            <div style={{ fontSize: 14, color: theme.text, fontWeight: 700 }}>{monthLabel}</div>
            <button onClick={() => canNext && setMonth(months[monthIdx - 1])}
              disabled={!canNext}
              style={{
                width: 32, height: 32, borderRadius: 8, border: `1px solid ${theme.border}`,
                background: theme.card, color: canNext ? theme.text : theme.textMuted,
                cursor: canNext ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: 16, lineHeight: 1,
                opacity: canNext ? 1 : 0.4,
              }}>›</button>
          </div>
          <div style={{ padding: '10px 20px 12px' }}>
            <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 4, fontWeight: 500 }}>
              현금흐름
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
              <div>
                <div style={{ fontSize: 11, color: theme.textMuted }}>수입</div>
                <div style={{ fontSize: 17, color: theme.brand, fontWeight: 700 }}>+{KRW_SHORT(monthIncome)}원</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: theme.textMuted }}>지출</div>
                <div style={{ fontSize: 17, color: theme.danger, fontWeight: 700 }}>-{KRW_SHORT(monthExpense)}원</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: theme.textMuted }}>저축률</div>
                <div style={{ fontSize: 17, color: theme.text, fontWeight: 700 }}>
                  {monthIncome > 0 ? Math.round(((monthIncome - monthExpense) / monthIncome) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>

          {dates.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: theme.textMuted, fontSize: 13 }}>
              이 달엔 거래가 없어요
            </div>
          )}
          {dates.map(d => {
            const items = grouped[d];
            const dayExp = items.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
            return (
              <div key={d} style={{ padding: '0 20px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px 6px' }}>
                  <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>
                    {d.slice(5).replace('-', '월 ')}일 · {['일','월','화','수','목','금','토'][new Date(d).getDay()]}
                  </div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>
                    -{KRW_SHORT(dayExp)}원
                  </div>
                </div>
                <div style={{ background: theme.card, borderRadius: 12, border: `1px solid ${theme.border}` }}>
                  {items.map((t, i) => {
                    const cat = CATEGORY_DEFS[t.category] || {};
                    const fromAsset = data.assets.find(a => a.id === t.from);
                    return (
                      <div key={t.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                        borderBottom: i < items.length - 1 ? `1px solid ${theme.border}` : 'none',
                      }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                          {cat.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ fontSize: 13, color: theme.text, fontWeight: 600,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {t.title}
                            </div>
                            {t.auto && <AutoBadge theme={theme} />}
                          </div>
                          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.category} {fromAsset ? `· ${fromAsset.name}` : ''}
                            {t.memo ? ` · ${t.memo}` : ''}
                          </div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700,
                          color: t.type === 'INCOME' ? theme.brand : (t.type === 'TRANSFER' ? theme.textMuted : theme.text) }}>
                          {t.type === 'INCOME' ? '+' : t.type === 'EXPENSE' ? '-' : ''}{KRW_SHORT(t.amount)}원
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}

      {tab === 'rec' && (
        <RecurringList data={data} theme={theme} role={role} onAdd={onAddRecurring} onEdit={onEditRecurring} />
      )}

      {!isViewer && (
        <button onClick={tab === 'tx' ? onAddTx : onAddRecurring}
          style={{
            position: 'absolute', right: 20, bottom: 90,
            width: 56, height: 56, borderRadius: 28, border: 'none',
            background: theme.brand, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(49,130,246,0.4)', cursor: 'pointer', fontFamily: 'inherit',
          }}
          title={tab === 'tx' ? '거래 추가' : '고정지출 추가'}>
          {tab === 'tx' ? Icon.plus('#fff') : (
            <span style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>＋</span>
          )}
        </button>
      )}
    </div>
  );
}

function RecurringList({ data, theme, role, onAdd, onEdit }) {
  const [items, setItems] = React.useState(data.recurring);
  const [highlighted, setHighlighted] = React.useState(null);
  const isViewer = role === 'VIEWER';

  const toggleActive = (id) => {
    setItems(its => its.map(it => it.id === id ? { ...it, active: !it.active } : it));
  };

  const total = items.filter(i => i.active).reduce((s, r) => s + r.amount, 0);

  // simulation: trigger one auto-generation
  const simulate = () => {
    const next = items.find(i => i.active);
    if (!next) return;
    setHighlighted(next.id);
    setTimeout(() => setHighlighted(null), 2500);
  };

  return (
    <div>
      <div style={{ padding: '14px 20px 12px' }}>
        <div style={{
          padding: 14, background: theme.brandSoft, borderRadius: 12,
        }}>
          <div style={{ fontSize: 12, color: theme.brand, fontWeight: 600, marginBottom: 4 }}>
            매월 고정으로 나가는 돈
          </div>
          <div style={{ fontSize: 22, color: theme.text, fontWeight: 800 }}>
            {KRW(total)}
          </div>
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
            활성 {items.filter(i => i.active).length}건 · 일시중지 {items.filter(i => !i.active).length}건
          </div>
        </div>
      </div>

      {!isViewer && (
        <div style={{ padding: '0 20px 12px' }}>
          <button onClick={simulate}
            style={{
              width: '100%', padding: '10px', borderRadius: 10,
              background: theme.card, color: theme.text, border: `1px solid ${theme.border}`,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
            ⚡ 자동 생성 시뮬레이션 (오늘이 17일이라면?)
          </button>
        </div>
      )}

      <div style={{ padding: '0 20px' }}>
        {items.map(r => {
          const cat = CATEGORY_DEFS[r.category] || {};
          const isHi = highlighted === r.id;
          return (
            <div key={r.id} style={{
              background: theme.card, borderRadius: 12, border: `1px solid ${isHi ? theme.brand : theme.border}`,
              padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12,
              opacity: r.active ? 1 : 0.5,
              transition: 'all 0.3s', boxShadow: isHi ? '0 0 0 4px rgba(49,130,246,0.15)' : 'none',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                {cat.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 14, color: theme.text, fontWeight: 700 }}>{r.title}</div>
                  {isHi && (
                    <span style={{ fontSize: 9, padding: '2px 5px', borderRadius: 4,
                      background: theme.brand, color: '#fff', fontWeight: 700 }}>자동 생성됨</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                  매월 {r.dayOfMonth}일 · 다음: {r.nextDate}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, color: theme.text, fontWeight: 700 }}>{KRW_SHORT(r.amount)}원</div>
                {!isViewer && (
                  <button onClick={() => toggleActive(r.id)} style={{
                    marginTop: 4, padding: '3px 8px', borderRadius: 6, border: 'none',
                    background: r.active ? theme.brandSoft : theme.bg,
                    color: r.active ? theme.brand : theme.textMuted,
                    fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{r.active ? '활성' : '중지'}</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 거래 입력 시트
function AddTxSheet({ data, theme, onClose, onSave }) {
  const [type, setType] = React.useState('EXPENSE');
  const [amount, setAmount] = React.useState('');
  const [category, setCategory] = React.useState('식비');
  const [title, setTitle] = React.useState('');
  const [memo, setMemo] = React.useState('');
  const [from, setFrom] = React.useState(data.assets[0]?.id);
  const [to, setTo] = React.useState(data.assets[3]?.id);
  const [showCat, setShowCat] = React.useState(false);
  const [showAsset, setShowAsset] = React.useState(null); // 'from' | 'to' | null
  const [done, setDone] = React.useState(false);

  const cats = Object.entries(CATEGORY_DEFS).filter(([, v]) => v.type === type);
  const fromAsset = data.assets.find(a => a.id === from);
  const toAsset = data.assets.find(a => a.id === to);

  const save = () => {
    if (!amount) return;
    setDone(true);
    setTimeout(() => { onSave && onSave(); onClose(); }, 700);
  };

  if (done) {
    return (
      <SheetShell theme={theme}>
        <div style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: theme.text }}>거래 저장 완료</div>
        </div>
      </SheetShell>
    );
  }

  return (
    <SheetShell theme={theme}>
      <ScreenHeader title="거래 입력" onClose={onClose} theme={theme} />

      {/* type segmented */}
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{ display: 'flex', gap: 4, padding: 4, background: theme.card,
          borderRadius: 10, border: `1px solid ${theme.border}` }}>
          {[
            { k: 'EXPENSE', l: '지출' },
            { k: 'INCOME', l: '수입' },
            { k: 'TRANSFER', l: '이체' },
          ].map(o => (
            <button key={o.k} onClick={() => { setType(o.k); setCategory(Object.entries(CATEGORY_DEFS).find(([,v]) => v.type === o.k)[0]); }}
              style={{
                flex: 1, padding: '8px', borderRadius: 7, border: 'none',
                background: type === o.k ? (o.k === 'INCOME' ? theme.brand : o.k === 'EXPENSE' ? theme.text : theme.textMuted) : 'transparent',
                color: type === o.k ? '#fff' : theme.textMuted,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>{o.l}</button>
          ))}
        </div>
      </div>

      {/* amount */}
      <div style={{ padding: '0 20px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, fontWeight: 600 }}>금액</div>
        <input
          type="text"
          autoFocus
          placeholder="0"
          value={amount ? Number(amount).toLocaleString() : ''}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
          style={{
            border: 'none', background: 'transparent', textAlign: 'center',
            fontSize: 36, fontWeight: 800, color: theme.text, fontFamily: 'inherit',
            width: '100%', outline: 'none', letterSpacing: -1,
          }} />
        <div style={{ fontSize: 14, color: theme.textMuted, fontWeight: 600 }}>원</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        <div style={{ background: theme.card, borderRadius: 12, border: `1px solid ${theme.border}`, marginBottom: 14 }}>
          {type !== 'TRANSFER' && (
            <FormRow theme={theme} label="카테고리" onClick={() => setShowCat(true)}
              value={<span><span style={{ marginRight: 6 }}>{CATEGORY_DEFS[category]?.icon}</span>{category}</span>} />
          )}
          {(type === 'EXPENSE' || type === 'TRANSFER') && (
            <FormRow theme={theme} label={type === 'TRANSFER' ? '보내는 자산' : '출금 자산'}
              onClick={() => setShowAsset('from')}
              value={fromAsset?.name || '선택'} isLast={type !== 'TRANSFER'} />
          )}
          {(type === 'INCOME' || type === 'TRANSFER') && (
            <FormRow theme={theme} label={type === 'TRANSFER' ? '받는 자산' : '입금 자산'}
              onClick={() => setShowAsset('to')}
              value={toAsset?.name || '선택'} isLast={true} />
          )}
        </div>

        <input
          type="text"
          placeholder="제목 (예: 1월 전기세)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '14px',
            border: `1px solid ${theme.border}`, borderRadius: 12,
            background: theme.card, color: theme.text, fontSize: 14,
            fontFamily: 'inherit', marginBottom: 10, outline: 'none',
          }} />
        <textarea
          placeholder="메모 (예: 사용량 320kWh, 평소보다 +50)"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '14px',
            border: `1px solid ${theme.border}`, borderRadius: 12,
            background: theme.card, color: theme.text, fontSize: 14,
            fontFamily: 'inherit', minHeight: 70, resize: 'none', outline: 'none',
          }} />
      </div>

      <div style={{ padding: 16, borderTop: `1px solid ${theme.border}`, background: theme.card }}>
        <button onClick={save} disabled={!amount}
          style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: amount ? theme.brand : theme.border, color: '#fff', border: 'none',
            fontSize: 15, fontWeight: 700, cursor: amount ? 'pointer' : 'default', fontFamily: 'inherit',
          }}>저장</button>
      </div>

      {showCat && (
        <PickerSheet title="카테고리 선택" theme={theme} onClose={() => setShowCat(false)}>
          {cats.map(([name, def]) => (
            <button key={name} onClick={() => { setCategory(name); setShowCat(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', border: 'none', background: 'transparent',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                borderBottom: `1px solid ${theme.border}`,
              }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: theme.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{def.icon}</div>
              <div style={{ flex: 1, fontSize: 14, color: theme.text, fontWeight: 600 }}>{name}</div>
              {category === name && Icon.check(theme.brand)}
            </button>
          ))}
        </PickerSheet>
      )}

      {showAsset && (
        <PickerSheet title={`${showAsset === 'from' ? '출금' : '입금'} 자산 선택`} theme={theme} onClose={() => setShowAsset(null)}>
          {data.assets.filter(a => !a.isLiability).map(a => {
            const meta = ASSET_CATEGORY_META[a.category] || {};
            const selected = (showAsset === 'from' ? from : to) === a.id;
            return (
              <button key={a.id} onClick={() => {
                if (showAsset === 'from') setFrom(a.id); else setTo(a.id);
                setShowAsset(null);
              }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', border: 'none', background: 'transparent',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                borderBottom: `1px solid ${theme.border}`,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: theme.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{meta.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: theme.text, fontWeight: 600 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>{KRW(a.value)}</div>
                </div>
                {selected && Icon.check(theme.brand)}
              </button>
            );
          })}
        </PickerSheet>
      )}
    </SheetShell>
  );
}

// 고정지출(정기) 입력 시트 — 거래 입력과는 분리
function AddRecurringSheet({ data, theme, onClose, onSave }) {
  const [title, setTitle] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [category, setCategory] = React.useState('구독');
  const [dayOfMonth, setDayOfMonth] = React.useState(1);
  const [from, setFrom] = React.useState(data.assets[0]?.id);
  const [active, setActive] = React.useState(true);
  const [showCat, setShowCat] = React.useState(false);
  const [showAsset, setShowAsset] = React.useState(false);
  const [showDay, setShowDay] = React.useState(false);
  const [done, setDone] = React.useState(false);

  // 정기지출은 EXPENSE 카테고리만
  const cats = Object.entries(CATEGORY_DEFS).filter(([, v]) => v.type === 'EXPENSE');
  const fromAsset = data.assets.find(a => a.id === from);

  const save = () => {
    if (!amount || !title) return;
    setDone(true);
    setTimeout(() => { onSave && onSave({ title, amount: Number(amount), category, dayOfMonth, from, active }); onClose(); }, 700);
  };

  const today = 29; // demo
  const nextDate = (() => {
    const d = new Date('2026-04-29');
    const target = new Date(d.getFullYear(), d.getMonth() + (dayOfMonth >= today ? 0 : 1), dayOfMonth);
    const y = target.getFullYear(), m = String(target.getMonth() + 1).padStart(2, '0'), dd = String(target.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  })();

  if (done) {
    return (
      <SheetShell theme={theme}>
        <div style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔁</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: theme.text }}>고정지출 등록 완료</div>
          <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 6 }}>
            매월 {dayOfMonth}일에 자동으로 기록할게요
          </div>
        </div>
      </SheetShell>
    );
  }

  return (
    <SheetShell theme={theme}>
      <ScreenHeader title="고정지출 추가" onClose={onClose} theme={theme} />

      <div style={{ padding: '0 20px 14px' }}>
        <div style={{
          padding: 12, borderRadius: 12, background: theme.brandSoft,
          fontSize: 12, color: theme.brand, lineHeight: 1.5, fontWeight: 600,
        }}>
          🔁 매월 같은 날 자동으로 기록되는 지출만 등록하세요.<br/>
          <span style={{ color: theme.textMuted, fontWeight: 500 }}>일회성 지출은 [거래] 탭에서 추가해주세요</span>
        </div>
      </div>

      {/* amount */}
      <div style={{ padding: '0 20px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, fontWeight: 600 }}>매월 빠져나갈 금액</div>
        <input
          type="text"
          autoFocus
          placeholder="0"
          value={amount ? Number(amount).toLocaleString() : ''}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
          style={{
            border: 'none', background: 'transparent', textAlign: 'center',
            fontSize: 32, fontWeight: 800, color: theme.text, fontFamily: 'inherit',
            width: '100%', outline: 'none', letterSpacing: -1,
          }} />
        <div style={{ fontSize: 14, color: theme.textMuted, fontWeight: 600 }}>원</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        {/* 제목 */}
        <input
          type="text"
          placeholder="이름 (예: 넷플릭스, 월세, 헬스장)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '14px',
            border: `1px solid ${theme.border}`, borderRadius: 12,
            background: theme.card, color: theme.text, fontSize: 14,
            fontFamily: 'inherit', marginBottom: 12, outline: 'none',
          }} />

        <div style={{ background: theme.card, borderRadius: 12, border: `1px solid ${theme.border}`, marginBottom: 14 }}>
          <FormRow theme={theme} label="카테고리" onClick={() => setShowCat(true)}
            value={<span><span style={{ marginRight: 6 }}>{CATEGORY_DEFS[category]?.icon}</span>{category}</span>} />
          <FormRow theme={theme} label="결제일" onClick={() => setShowDay(true)}
            value={`매월 ${dayOfMonth}일`} />
          <FormRow theme={theme} label="출금 자산" onClick={() => setShowAsset(true)}
            value={fromAsset?.name || '선택'} isLast />
        </div>

        {/* 활성 토글 */}
        <div style={{
          padding: '14px', background: theme.card, borderRadius: 12,
          border: `1px solid ${theme.border}`, marginBottom: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 14, color: theme.text, fontWeight: 700 }}>자동 생성 활성화</div>
            <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
              꺼두면 거래가 자동으로 기록되지 않아요
            </div>
          </div>
          <button onClick={() => setActive(a => !a)} style={{
            width: 44, height: 26, borderRadius: 13, border: 'none',
            background: active ? theme.brand : theme.border, position: 'relative',
            cursor: 'pointer', transition: 'background 0.2s',
          }}>
            <div style={{
              position: 'absolute', top: 3, left: active ? 21 : 3,
              width: 20, height: 20, borderRadius: 10, background: '#fff',
              transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>

        {/* 미리보기 */}
        {amount && title && (
          <div style={{
            padding: 14, background: theme.bg, borderRadius: 12,
            border: `1px dashed ${theme.brand}`, marginBottom: 14,
          }}>
            <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, marginBottom: 6 }}>미리보기</div>
            <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.5 }}>
              <b>{nextDate}</b>에 <b>{fromAsset?.name}</b>에서<br/>
              <b style={{ color: theme.danger }}>-{Number(amount).toLocaleString()}원</b>이 자동으로 기록돼요
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: 16, borderTop: `1px solid ${theme.border}`, background: theme.card }}>
        <button onClick={save} disabled={!amount || !title}
          style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: (amount && title) ? theme.brand : theme.border, color: '#fff', border: 'none',
            fontSize: 15, fontWeight: 700,
            cursor: (amount && title) ? 'pointer' : 'default', fontFamily: 'inherit',
          }}>고정지출 등록</button>
      </div>

      {showCat && (
        <PickerSheet title="카테고리 선택" theme={theme} onClose={() => setShowCat(false)}>
          {cats.map(([name, def]) => (
            <button key={name} onClick={() => { setCategory(name); setShowCat(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', border: 'none', background: 'transparent',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                borderBottom: `1px solid ${theme.border}`,
              }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: theme.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{def.icon}</div>
              <div style={{ flex: 1, fontSize: 14, color: theme.text, fontWeight: 600 }}>{name}</div>
              {category === name && Icon.check(theme.brand)}
            </button>
          ))}
        </PickerSheet>
      )}

      {showAsset && (
        <PickerSheet title="출금 자산 선택" theme={theme} onClose={() => setShowAsset(false)}>
          {data.assets.filter(a => !a.isLiability).map(a => {
            const meta = ASSET_CATEGORY_META[a.category] || {};
            return (
              <button key={a.id} onClick={() => { setFrom(a.id); setShowAsset(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', border: 'none', background: 'transparent',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  borderBottom: `1px solid ${theme.border}`,
                }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: theme.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{meta.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: theme.text, fontWeight: 600 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>{KRW(a.value)}</div>
                </div>
                {from === a.id && Icon.check(theme.brand)}
              </button>
            );
          })}
        </PickerSheet>
      )}

      {showDay && (
        <PickerSheet title="결제일 선택" theme={theme} onClose={() => setShowDay(false)}>
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
              <button key={d} onClick={() => { setDayOfMonth(d); setShowDay(false); }}
                style={{
                  aspectRatio: '1', border: 'none', borderRadius: 8,
                  background: d === dayOfMonth ? theme.brand : theme.bg,
                  color: d === dayOfMonth ? '#fff' : theme.text,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}>{d}</button>
            ))}
          </div>
          <div style={{ padding: '0 16px 16px', fontSize: 11, color: theme.textMuted }}>
            * 31일이 없는 달은 말일에 처리됩니다
          </div>
        </PickerSheet>
      )}
    </SheetShell>
  );
}


function FormRow({ theme, label, value, onClick, isLast }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', padding: '14px',
      borderBottom: isLast ? 'none' : `1px solid ${theme.border}`,
      background: 'transparent', border: 'none', cursor: 'pointer',
      fontFamily: 'inherit', textAlign: 'left',
    }}>
      <div style={{ fontSize: 13, color: theme.textMuted, width: 90 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 14, color: theme.text, fontWeight: 600 }}>{value}</div>
      {Icon.chevronRight(theme.textMuted)}
    </button>
  );
}

function PickerSheet({ title, theme, onClose, children }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end', zIndex: 200,
      animation: 'fadeIn 0.2s',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', background: theme.card, borderRadius: '20px 20px 0 0',
        maxHeight: '70%', display: 'flex', flexDirection: 'column',
        animation: 'sheetUp 0.25s ease-out',
      }}>
        <div style={{
          padding: '14px 20px', borderBottom: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 16, color: theme.text, fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: 0, display: 'flex',
          }}>{Icon.close(theme.textMuted)}</button>
        </div>
        <div style={{ overflow: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

Object.assign(window, { BookScreen, RecurringList, AddTxSheet, AddRecurringSheet, FormRow, PickerSheet });
