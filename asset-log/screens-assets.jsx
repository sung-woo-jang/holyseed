// screens-assets.jsx — 자산 리스트, 자산 상세, 스냅샷 입력

function AssetsScreen({ data, theme, role, onAsset, onSnapshot }) {
  const isViewer = role === 'VIEWER';
  const grouped = {};
  data.assets.forEach(a => {
    if (!grouped[a.category]) grouped[a.category] = [];
    grouped[a.category].push(a);
  });
  const total = data.assets.reduce((s, a) => s + a.value, 0);

  return (
    <div style={{ paddingBottom: 120 }}>
      <div style={{ padding: '12px 20px 16px' }}>
        <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 4, fontWeight: 500 }}>
          총 순자산
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.8, color: theme.text }}>
          {KRW(total)}
        </div>
      </div>

      {!isViewer && (
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onSnapshot}
              style={{
                flex: 1, padding: '12px', borderRadius: 12,
                background: theme.brand, color: '#fff', border: 'none',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                whiteSpace: 'nowrap',
              }}>
              📸 일괄 스냅샷
            </button>
            <button
              style={{
                flex: 1, padding: '12px', borderRadius: 12,
                background: theme.brandSoft, color: theme.brand, border: 'none',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                whiteSpace: 'nowrap',
              }}>
              ✏️ 개별 입력
            </button>
          </div>
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 8, textAlign: 'center' }}>
            개별 입력은 자산을 탭한 후 "이 자산만 스냅샷 입력" 버튼으로도 가능해요
          </div>
        </div>
      )}

      {Object.entries(grouped).map(([cat, items]) => {
        const meta = ASSET_CATEGORY_META[cat] || { color: theme.brand, icon: '📦' };
        const sum = items.reduce((s, a) => s + a.value, 0);
        return (
          <div key={cat} style={{ padding: '0 20px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>{meta.icon}</span>
                <div style={{ fontSize: 13, color: theme.text, fontWeight: 700 }}>{cat}</div>
                <div style={{ fontSize: 11, color: theme.textMuted }}>· {items.length}건</div>
              </div>
              <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>{KRW_SHORT(sum)}원</div>
            </div>
            <div style={{ background: theme.card, borderRadius: 14, border: `1px solid ${theme.border}` }}>
              {items.map((a, i) => (
                <button key={a.id} onClick={() => onAsset(a)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '14px', borderBottom: i < items.length - 1 ? `1px solid ${theme.border}` : 'none',
                    background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'inherit',
                  }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: theme.text, fontWeight: 600, marginBottom: 3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.name}
                    </div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>
                      {a.currency !== 'KRW' && (
                        <span>${a.currencyValue?.toLocaleString()} · 1{a.currency}={a.fxRate}원 · </span>
                      )}
                      <span style={{ color: a.delta >= 0 ? theme.brand : theme.danger, fontWeight: 600 }}>
                        {a.delta > 0 ? '+' : ''}{KRW_SHORT(a.delta)} ({PCT(a.deltaPct)})
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, color: a.isLiability ? theme.danger : theme.text, fontWeight: 700 }}>
                      {KRW(a.value)}
                    </div>
                  </div>
                  {Icon.chevronRight(theme.textMuted)}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AssetDetailScreen({ asset, data, theme, onBack, onSnapshot }) {
  const snapshots = data.snapshots[asset.id] || [];
  const [unit, setUnit] = React.useState(asset.currency === 'KRW' ? 'KRW' : asset.currency);
  const isFx = asset.currency !== 'KRW';
  const meta = ASSET_CATEGORY_META[asset.category] || {};
  const relatedTx = data.transactions.filter(t => t.from === asset.id || t.to === asset.id);

  const chartData = snapshots.map(s => ({
    date: s.date,
    value: unit === 'KRW' ? s.valueKRW : s.value,
  }));

  return (
    <div style={{ paddingBottom: 60 }}>
      <ScreenHeader title="자산 상세" onBack={onBack} theme={theme} />

      <div style={{ padding: '4px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>{meta.icon}</span>
          <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>{asset.category}</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: theme.text, marginBottom: 8 }}>
          {asset.name}
        </div>
        {isFx ? (
          <>
            <div style={{ fontSize: 28, fontWeight: 800, color: theme.text, letterSpacing: -0.8 }}>
              ${asset.currencyValue.toLocaleString()}
            </div>
            <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>
              ≈ {KRW(asset.value)} · 1 USD = {asset.fxRate}원
            </div>
          </>
        ) : (
          <div style={{ fontSize: 28, fontWeight: 800, color: asset.isLiability ? theme.danger : theme.text, letterSpacing: -0.8 }}>
            {KRW(asset.value)}
          </div>
        )}
        <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '4px 8px', background: theme.brandSoft, borderRadius: 8,
          color: asset.delta >= 0 ? theme.brand : theme.danger, fontSize: 12, fontWeight: 700 }}>
          {asset.delta > 0 ? '+' : ''}{KRW_SHORT(asset.delta)}원 ({PCT(asset.deltaPct)})
        </div>
        {onSnapshot && (
          <button onClick={() => onSnapshot(asset.id)} style={{
            marginTop: 14, width: '100%', padding: '12px', borderRadius: 12,
            background: theme.brand, color: '#fff', border: 'none',
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>📸 이 자산만 스냅샷 입력</button>
        )}
      </div>

      {chartData.length > 0 && (
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ background: theme.card, borderRadius: 16, padding: 16, border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: theme.text, fontWeight: 700 }}>평가액 추이</div>
              {isFx && (
                <Segmented options={['USD', 'KRW']} active={unit} theme={theme} onChange={setUnit} />
              )}
            </div>
            <LineChart data={chartData} width={295} height={150} color={theme.brand} dark={theme.dark} />
          </div>
        </div>
      )}

      <div style={{ padding: '0 20px 14px' }}>
        <div style={{ fontSize: 13, color: theme.text, fontWeight: 700, marginBottom: 8, padding: '0 4px' }}>
          스냅샷 히스토리
        </div>
        <div style={{ background: theme.card, borderRadius: 14, border: `1px solid ${theme.border}` }}>
          {snapshots.length === 0 && (
            <div style={{ padding: 16, fontSize: 13, color: theme.textMuted, textAlign: 'center' }}>
              스냅샷이 없어요
            </div>
          )}
          {snapshots.slice().reverse().map((s, i) => (
            <div key={i} style={{
              padding: '12px 14px', display: 'flex', justifyContent: 'space-between',
              borderBottom: i < snapshots.length - 1 ? `1px solid ${theme.border}` : 'none',
            }}>
              <div style={{ fontSize: 13, color: theme.text }}>{s.date}</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: theme.text, fontWeight: 700 }}>
                  {isFx ? `$${s.value.toLocaleString()}` : KRW(s.valueKRW || s.value)}
                </div>
                {isFx && (
                  <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                    ≈ {KRW_SHORT(s.valueKRW)}원 · {s.fxRate}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {relatedTx.length > 0 && (
        <div style={{ padding: '0 20px 14px' }}>
          <div style={{ fontSize: 13, color: theme.text, fontWeight: 700, marginBottom: 8, padding: '0 4px' }}>
            관련 거래
          </div>
          <div style={{ background: theme.card, borderRadius: 14, border: `1px solid ${theme.border}` }}>
            {relatedTx.slice(0, 4).map((tx, i) => {
              const cat = CATEGORY_DEFS[tx.category] || {};
              return (
                <div key={tx.id} style={{
                  padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
                  borderBottom: i < Math.min(relatedTx.length, 4) - 1 ? `1px solid ${theme.border}` : 'none',
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{cat.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: theme.text, fontWeight: 600 }}>{tx.title}</div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>{tx.date}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700,
                    color: tx.type === 'INCOME' ? theme.brand : theme.text }}>
                    {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}{KRW_SHORT(tx.amount)}원
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ScreenHeader({ title, onBack, onClose, theme, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '8px 12px 8px',
      background: theme.bg, position: 'sticky', top: 0, zIndex: 5,
    }}>
      <button onClick={onBack || onClose} style={{
        width: 40, height: 40, borderRadius: 10, border: 'none', background: 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {onClose ? Icon.close(theme.text) : Icon.back(theme.text)}
      </button>
      <div style={{ flex: 1, fontSize: 16, color: theme.text, fontWeight: 700, textAlign: 'center' }}>
        {title}
      </div>
      <div style={{ width: 40 }}>{right}</div>
    </div>
  );
}

function SnapshotSheet({ data, theme, onClose, onSave, focusAssetId }) {
  const editableAssets = focusAssetId
    ? data.assets.filter(a => a.id === focusAssetId)
    : data.assets;
  const [values, setValues] = React.useState(() => {
    const v = {};
    editableAssets.forEach(a => { v[a.id] = a.value; });
    return v;
  });
  const [saved, setSaved] = React.useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => { onSave && onSave(values); onClose(); }, 700);
  };

  if (saved) {
    return (
      <SheetShell theme={theme}>
        <div style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: theme.text }}>저장 완료!</div>
          <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 6 }}>
            대시보드가 업데이트됐어요
          </div>
        </div>
      </SheetShell>
    );
  }

  // total deltas across all changed values
  const totalOld = editableAssets.reduce((s, a) => s + a.value, 0);
  const totalNew = editableAssets.reduce((s, a) => s + (values[a.id] ?? a.value), 0);
  const totalDelta = totalNew - totalOld;
  const totalPct = totalOld ? (totalDelta / Math.abs(totalOld)) * 100 : 0;

  return (
    <SheetShell theme={theme}>
      <ScreenHeader title={focusAssetId ? '개별 스냅샷 입력' : '이번 달 스냅샷'} onClose={onClose} theme={theme} />
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.5 }}>
          {data.netWorth.snapshotDate} 기준 평가액을 입력하세요.
          {!focusAssetId && ' 모든 자산을 한 번에, 또는 자산 상세에서 개별로 입력할 수 있어요.'}
        </div>
      </div>

      {/* Total delta summary */}
      {!focusAssetId && (
        <div style={{ padding: '0 20px 14px' }}>
          <div style={{
            padding: 14, borderRadius: 12,
            background: totalDelta === 0 ? theme.bg : (totalDelta > 0 ? theme.brandSoft : 'rgba(245,101,101,0.12)'),
            border: `1px solid ${theme.border}`,
          }}>
            <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, marginBottom: 4 }}>
              합계 변화
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 20, fontWeight: 800,
                color: totalDelta === 0 ? theme.text : (totalDelta > 0 ? theme.brand : theme.danger) }}>
                {totalDelta > 0 ? '+' : ''}{KRW(totalDelta)}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700,
                color: totalDelta >= 0 ? theme.brand : theme.danger }}>
                {PCT(totalPct, 2)}
              </div>
            </div>
            <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
              {KRW_SHORT(totalOld)}원 → {KRW_SHORT(totalNew)}원
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '0 20px', flex: 1, overflow: 'auto' }}>
        {editableAssets.map(a => {
          const newVal = values[a.id] ?? a.value;
          const delta = newVal - a.value;
          const deltaPct = a.value ? (delta / Math.abs(a.value)) * 100 : 0;
          const meta = ASSET_CATEGORY_META[a.category] || {};
          return (
            <div key={a.id} style={{
              padding: '12px 0', borderBottom: `1px solid ${theme.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  {meta.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: theme.text, fontWeight: 700,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.name}
                  </div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>
                    이전: {KRW_SHORT(a.value)}원
                  </div>
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{
                  flex: 1, padding: '10px 12px', borderRadius: 10,
                  background: theme.bg, display: 'flex', alignItems: 'center',
                  border: `1px solid ${delta !== 0 ? (delta > 0 ? theme.brand : theme.danger) : 'transparent'}`,
                }}>
                  <input
                    type="text"
                    value={newVal?.toLocaleString() || ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d-]/g, '');
                      const n = raw === '' || raw === '-' ? 0 : Number(raw);
                      setValues(v => ({ ...v, [a.id]: n }));
                    }}
                    style={{
                      flex: 1, border: 'none', background: 'transparent',
                      textAlign: 'right', fontSize: 15, fontWeight: 700,
                      color: theme.text, fontFamily: 'inherit', outline: 'none',
                      minWidth: 0,
                    }} />
                  <div style={{ fontSize: 11, color: theme.textMuted, marginLeft: 4, fontWeight: 600 }}>원</div>
                </div>
              </div>
              {delta !== 0 && (
                <div style={{
                  marginTop: 6, fontSize: 11, fontWeight: 700,
                  color: delta > 0 ? theme.brand : theme.danger,
                  display: 'flex', justifyContent: 'flex-end', gap: 4,
                }}>
                  <span>{delta > 0 ? '▲' : '▼'} {KRW_SHORT(Math.abs(delta))}원</span>
                  <span>({PCT(deltaPct, 2)})</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${theme.border}`, background: theme.card }}>
        <button onClick={handleSave}
          style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: theme.brand, color: '#fff', border: 'none',
            fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
          저장하고 대시보드 업데이트
        </button>
      </div>
    </SheetShell>
  );
}

function SheetShell({ theme, children }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: theme.bg,
      display: 'flex', flexDirection: 'column', zIndex: 100,
      animation: 'sheetUp 0.25s ease-out',
    }}>
      {children}
    </div>
  );
}

Object.assign(window, { AssetsScreen, AssetDetailScreen, ScreenHeader, SnapshotSheet, SheetShell });
