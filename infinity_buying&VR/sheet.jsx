// ─────────────────────────────────────────────────────────────────────────
// sheet.jsx — ExecutionSheet: bottom-sheet for entering yesterday's fills
// ─────────────────────────────────────────────────────────────────────────

const { useState: useStateSheet, useEffect: useEffectSheet, useMemo: useMemoSheet } = React;

// Exec type taxonomy
const EXEC_TYPES = [
  { id: "buy_full",      label: "매수 — 1회 전체",        dt: 1.0,  side: "buy" },
  { id: "buy_half_star", label: "매수 — 절반 (★ LOC)",    dt: 0.5,  side: "buy" },
  { id: "buy_half_avg",  label: "매수 — 절반 (평단 LOC)", dt: 0.5,  side: "buy" },
  { id: "sell_quarter",  label: "쿼터매도 LOC",            dt: "×0.75", side: "sell" },
  { id: "sell_fixed",    label: "지정가매도 (15% / 20%)",   dt: 0,    side: "sell" },
  { id: "sell_moc",      label: "MOC 매도 — 리버스 첫날",  dt: "×0.95", side: "sell" },
  { id: "no_exec",       label: "미체결 — 변화 없음",       dt: 0,    side: "none" },
];

function ExecutionSheet({ strategy, onClose, onSave }) {
  const s = strategy;
  const [rows, setRows] = useStateSheet(() => [
    { id: 1, type: "buy_half_star", price: s.locBuy?.toFixed(2) || "", qty: "1" }
  ]);
  const [date, setDate] = useStateSheet("2026-05-21");

  // Compute predicted next-state
  const preview = useMemoSheet(() => {
    let t = s.t;
    let avg = s.avg || 0;
    let qty = s.quantityRaw;
    let cash = s.cash;
    for (const r of rows) {
      const price = parseFloat(r.price);
      const q = parseFloat(r.qty);
      if (Number.isNaN(price) || Number.isNaN(q) || q === 0) continue;
      const meta = EXEC_TYPES.find(t => t.id === r.type);
      if (!meta) continue;
      if (meta.side === "buy") {
        const cost = price * q;
        const newQty = qty + q;
        avg = newQty > 0 ? ((avg * qty) + (price * q)) / newQty : price;
        qty = newQty;
        cash = cash - cost;
        t = t + meta.dt;
      } else if (r.type === "sell_quarter") {
        qty = qty - q;
        cash = cash + price * q;
        t = t * 0.75;
      } else if (r.type === "sell_moc") {
        qty = qty - q;
        cash = cash + price * q;
        t = t * 0.95;
      } else if (r.type === "sell_fixed") {
        qty = qty - q;
        cash = cash + price * q;
      }
    }
    return { t, avg, qty, cash };
  }, [rows, s]);

  const addRow = () => {
    const newId = (rows[rows.length - 1]?.id || 0) + 1;
    setRows([...rows, { id: newId, type: "buy_half_star", price: "", qty: "1" }]);
  };
  const removeRow = (id) => {
    if (rows.length === 1) {
      setRows([{ id: 1, type: "no_exec", price: "", qty: "" }]);
    } else {
      setRows(rows.filter(r => r.id !== id));
    }
  };
  const updateRow = (id, patch) => {
    setRows(rows.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  const hasFills = rows.some(r => r.type !== "no_exec" && parseFloat(r.qty) > 0 && parseFloat(r.price) > 0);

  // Lock body scroll while sheet open
  useEffectSheet(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", flexDirection: "column", justifyContent: "flex-end",
      animation: "overlayIn 0.18s ease",
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "absolute", inset: 0,
        background: "rgba(4, 8, 16, 0.6)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}/>

      {/* Sheet */}
      <div style={{
        position: "relative",
        background: "var(--surface)",
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        maxHeight: "92vh",
        display: "flex", flexDirection: "column",
        animation: "sheetUp 0.28s cubic-bezier(0.2, 0.9, 0.25, 1)",
        boxShadow: "0 -10px 40px rgba(0,0,0,0.4)",
        width: "100%", maxWidth: 420, alignSelf: "center",
      }}>
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--surface-3)" }}/>
        </div>

        {/* Header */}
        <div style={{ padding: "10px 20px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{s.ticker} 체결 입력</div>
            <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 2 }}>
              <span className="num">{date}</span> · 어제자
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: 999, border: "none",
            background: "var(--surface-2)", color: "var(--text-dim)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }} aria-label="닫기">
            <Icon name="x" size={18}/>
          </button>
        </div>

        {/* Scroll area */}
        <div style={{ overflowY: "auto", padding: "0 16px 12px" }}>
          {/* No-fill quick action */}
          <button onClick={() => {
            setRows([{ id: 1, type: "no_exec", price: "", qty: "" }]);
          }} style={{
            width: "100%", padding: "12px 14px",
            background: rows.length === 1 && rows[0].type === "no_exec" ? "var(--cyan-tint)" : "var(--surface-2)",
            border: "1px solid " + (rows.length === 1 && rows[0].type === "no_exec" ? "var(--cyan)" : "var(--hairline)"),
            borderRadius: "var(--r-md)",
            color: rows.length === 1 && rows[0].type === "no_exec" ? "var(--cyan)" : "var(--text-dim)",
            fontSize: 14, fontWeight: 600,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            marginBottom: 14,
          }}>
            <Icon name="check" size={16}/>
            오늘 체결 없음
          </button>

          {/* Fill rows */}
          <div className="stack gap-3">
            {rows.map((r, idx) => (
              <FillRow
                key={r.id}
                row={r}
                strategy={s}
                onChange={(patch) => updateRow(r.id, patch)}
                onRemove={() => removeRow(r.id)}
                canRemove={true}
              />
            ))}
          </div>

          <button onClick={addRow} style={{
            width: "100%", marginTop: 12,
            padding: "12px 14px",
            background: "transparent",
            border: "1.5px dashed var(--hairline-strong)",
            borderRadius: "var(--r-md)",
            color: "var(--text-dim)",
            fontSize: 14, fontWeight: 600,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <Icon name="plus" size={16}/>
            체결 추가
          </button>

          {/* Live preview */}
          <div style={{
            marginTop: 18,
            background: "var(--bg-elev-0)",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--hairline)",
            padding: "14px 16px",
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
              color: "var(--gold)", textTransform: "uppercase", marginBottom: 8,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <Icon name="spark" size={12} color="var(--gold)"/>
              예상 결과 — 내일 상태
            </div>
            <PreviewRow label="T값"    from={fmtT(s.t)}            to={fmtT(preview.t)}/>
            <PreviewRow label="평단"    from={fmtUSD(s.avg)}        to={fmtUSD(preview.avg)}/>
            <PreviewRow label="보유"    from={Math.floor(s.quantityRaw) + "주"}     to={Math.floor(preview.qty) + "주"}/>
            <PreviewRow label="잔금"    from={fmtUSD(s.cash)}       to={fmtUSD(preview.cash)} last/>
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{
          padding: "12px 20px calc(20px + var(--safe-bottom))",
          borderTop: "1px solid var(--hairline)",
          background: "var(--surface)",
        }}>
          <button
            className="btn btn-primary btn-block"
            style={{ height: 56, fontSize: 17 }}
            onClick={() => onSave && onSave({ rows, preview, date })}>
            저장 및 내일 계획 재계산
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Fill row ───────────────────────────────────────────────────────────
function FillRow({ row, strategy, onChange, onRemove }) {
  const meta = EXEC_TYPES.find(t => t.id === row.type);
  const side = meta?.side;
  const accentColor = side === "buy" ? "var(--buy)" : side === "sell" ? "var(--sell)" : "var(--text-mute)";

  return (
    <div style={{
      background: "var(--surface-2)",
      border: "1px solid var(--hairline)",
      borderRadius: "var(--r-md)",
      padding: "12px 14px 12px",
      position: "relative",
    }}>
      {/* Side stripe */}
      <div style={{
        position: "absolute", left: 0, top: 12, bottom: 12, width: 3,
        borderRadius: 999, background: accentColor,
      }}/>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingLeft: 6 }}>
        <select
          value={row.type}
          onChange={(e) => onChange({ type: e.target.value })}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text)",
            fontSize: 14, fontWeight: 700,
            outline: "none", cursor: "pointer",
            appearance: "none", WebkitAppearance: "none",
            paddingRight: 20,
            backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a4b0c8' stroke-width='2.4' stroke-linecap='round'><path d='M6 9l6 6 6-6'/></svg>\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right center",
          }}>
          {EXEC_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <button onClick={onRemove} style={{
          width: 32, height: 32, borderRadius: 8, border: "none",
          background: "transparent", color: "var(--text-mute)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }} aria-label="삭제">
          <Icon name="trash" size={16}/>
        </button>
      </div>

      {row.type !== "no_exec" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10, paddingLeft: 6 }}>
          <Field label="체결가">
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                color: "var(--text-mute)", fontSize: 15, fontWeight: 600,
              }}>$</span>
              <input
                type="number" inputMode="decimal" step="0.01"
                value={row.price}
                onChange={(e) => onChange({ price: e.target.value })}
                className="num"
                placeholder="0.00"
                style={{ ...inputBase, paddingLeft: 26, paddingRight: 12, paddingTop: 12, paddingBottom: 12, fontSize: 16 }}
              />
            </div>
          </Field>
          <Field label="수량">
            <input
              type="number" inputMode="decimal" step="1"
              value={row.qty}
              onChange={(e) => onChange({ qty: e.target.value })}
              className="num"
              placeholder="0"
              style={{ ...inputBase, paddingTop: 12, paddingBottom: 12, fontSize: 16 }}
            />
          </Field>
        </div>
      )}

      {row.type !== "no_exec" && (
        <div style={{
          marginTop: 10, paddingLeft: 6,
          display: "flex", justifyContent: "space-between",
          fontSize: 12, color: "var(--text-mute)",
        }}>
          <span>T 변화: <span style={{ color: accentColor, fontWeight: 700 }}>
            {typeof meta.dt === "string" ? `T ${meta.dt}` :
             meta.dt > 0 ? `T +${meta.dt}` :
             meta.dt < 0 ? `T ${meta.dt}` : "변화 없음"}
          </span></span>
          {parseFloat(row.price) > 0 && parseFloat(row.qty) > 0 && (
            <span className="num">
              체결금액 {fmtUSD(parseFloat(row.price) * parseFloat(row.qty))}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function PreviewRow({ label, from, to, last }) {
  const changed = from !== to;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "60px 1fr auto 1fr",
      alignItems: "center", gap: 8,
      padding: "8px 0",
      borderBottom: last ? "none" : "1px solid var(--hairline)",
    }}>
      <span style={{ fontSize: 13, color: "var(--text-dim)", fontWeight: 500 }}>{label}</span>
      <span className="num" style={{
        fontSize: 14, fontWeight: 600,
        color: "var(--text-mute)",
        textAlign: "right",
      }}>{from}</span>
      <Icon name="chev-right" size={14} color={changed ? "var(--gold)" : "var(--text-mute)"} stroke="2.4"/>
      <span className="num" style={{
        fontSize: 15, fontWeight: 700,
        color: changed ? "var(--gold-soft)" : "var(--text)",
        textAlign: "right",
      }}>{to}</span>
    </div>
  );
}

window.ExecutionSheet = ExecutionSheet;
