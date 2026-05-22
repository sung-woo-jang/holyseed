// ─────────────────────────────────────────────────────────────────────────
// cycle-edit.jsx — Bottom sheet for editing strategy principal / division
// ─────────────────────────────────────────────────────────────────────────

function CycleEditSheet({ strategy, onClose, onSave, onResetCycle, onDelete }) {
  const s = strategy;
  const [principalStr, setPrincipalStr] = React.useState(String(s.principal));
  const [division, setDivision] = React.useState(s.division);
  const [cycleNo, setCycleNo] = React.useState(s.cycle);
  const [showDanger, setShowDanger] = React.useState(false);

  const principal = parseFloat(principalStr) || 0;
  const changed = principal !== s.principal || division !== s.division;
  const isMidCycle = s.t > 0;

  React.useEffect(() => {
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
      <div onClick={onClose} style={{
        position: "absolute", inset: 0,
        background: "var(--backdrop-bg)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}/>

      <div style={{
        position: "relative",
        background: "var(--surface)",
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        maxHeight: "92vh",
        display: "flex", flexDirection: "column",
        animation: "sheetUp 0.28s cubic-bezier(0.2, 0.9, 0.25, 1)",
        boxShadow: "var(--shadow-2)",
        width: "100%", maxWidth: 420, alignSelf: "center",
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--surface-3)" }}/>
        </div>

        <div style={{ padding: "10px 20px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{s.ticker} 사이클 편집</div>
            <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 2 }}>
              사이클 {s.cycle} · {MODE_FULL[s.mode]}
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

        <div style={{ overflowY: "auto", padding: "0 20px 12px" }}>
          {/* Mid-cycle warning */}
          {isMidCycle && (
            <div style={{
              padding: "12px 14px",
              background: "var(--gold-tint)",
              border: "1px solid color-mix(in oklab, var(--gold) 30%, transparent)",
              borderRadius: "var(--r-md)",
              marginBottom: 16,
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <Icon name="warn" size={16} color="var(--gold)" stroke="2"/>
              <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>
                사이클 진행 중(T = <span className="num" style={{ color: "var(--gold-soft)", fontWeight: 700 }}>{fmtT(s.t)}</span>)
                입니다. 원금/분할수 변경은 <strong style={{ color: "var(--text)" }}>다음 사이클부터 적용</strong>됩니다.
              </div>
            </div>
          )}

          {/* Principal */}
          <Field label="원금 (USD)" hint={changed ? `현재 ${fmtUSD(s.principal)} → ${fmtUSD(principal)}` : null}>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                fontSize: 18, fontWeight: 700, color: "var(--text-mute)",
              }}>$</span>
              <input
                type="number" inputMode="decimal" step="100"
                value={principalStr}
                onChange={(e) => setPrincipalStr(e.target.value)}
                className="num"
                style={{
                  ...inputBase, paddingLeft: 32, fontSize: 22, fontWeight: 800,
                  textAlign: "right", letterSpacing: "-0.01em",
                }}
              />
            </div>
            <div style={{
              display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap",
            }}>
              {[2400, 4800, 8000, 12000, 20000].map(v => (
                <button key={v} onClick={() => setPrincipalStr(String(v))}
                        style={{
                          padding: "6px 12px",
                          background: principal === v ? "var(--gold-tint)" : "var(--surface-2)",
                          border: "1px solid " + (principal === v ? "var(--gold)" : "var(--hairline)"),
                          borderRadius: 999,
                          color: principal === v ? "var(--gold-soft)" : "var(--text-dim)",
                          fontSize: 12, fontWeight: 700,
                          cursor: "pointer",
                        }}>
                  ${v.toLocaleString()}
                </button>
              ))}
            </div>
          </Field>

          {/* Division */}
          <div style={{ marginTop: 18 }}>
            <Field label="분할수">
              <div style={{ display: "flex", gap: 10 }}>
                {[20, 40].map(d => (
                  <button key={d} onClick={() => setDivision(d)}
                          style={{
                            flex: 1,
                            padding: "16px 12px",
                            background: division === d ? "var(--gold-tint)" : "var(--surface-2)",
                            border: "1.5px solid " + (division === d ? "var(--gold)" : "var(--hairline)"),
                            borderRadius: "var(--r-md)",
                            color: "var(--text)",
                            cursor: "pointer",
                            display: "flex", flexDirection: "column",
                            alignItems: "center", gap: 4,
                          }}>
                    <div className="num" style={{
                      fontSize: 22, fontWeight: 800,
                      color: division === d ? "var(--gold-soft)" : "var(--text)",
                    }}>{d}</div>
                    <div style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600 }}>
                      {d === 40 ? "안정형" : "공격형"}
                    </div>
                  </button>
                ))}
              </div>
            </Field>
          </div>

          {/* Cycle no — read-only */}
          <div style={{
            marginTop: 18,
            padding: "12px 14px",
            background: "var(--bg-elev-0)",
            borderRadius: "var(--r-md)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            border: "1px solid var(--hairline)",
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dim)" }}>사이클 번호</div>
              <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
                사이클 종료 시 자동 증가
              </div>
            </div>
            <div className="num" style={{ fontSize: 22, fontWeight: 800 }}>
              {cycleNo}
            </div>
          </div>

          {/* Recalculated 1-buy preview */}
          {changed && !isMidCycle && (
            <div style={{
              marginTop: 16,
              padding: "12px 14px",
              background: "var(--gold-tint)",
              borderRadius: "var(--r-md)",
              border: "1px solid color-mix(in oklab, var(--gold) 30%, transparent)",
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                color: "var(--gold-soft)", textTransform: "uppercase",
                marginBottom: 6,
              }}>변경 후 예상</div>
              <div className="spread">
                <span style={{ fontSize: 13, color: "var(--text-dim)" }}>1회 매수액</span>
                <span className="num" style={{ fontSize: 16, fontWeight: 800, color: "var(--gold-soft)" }}>
                  {fmtUSD(principal / division)}
                </span>
              </div>
            </div>
          )}

          {/* Danger zone */}
          <div style={{ marginTop: 28 }}>
            <button onClick={() => setShowDanger(!showDanger)}
                    style={{
                      width: "100%", background: "transparent", border: "none",
                      padding: "8px 4px", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      color: "var(--text-mute)",
                    }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                위험 구역
              </span>
              <Icon name={showDanger ? "chev-up" : "chev-down"} size={16}/>
            </button>
            {showDanger && (
              <div style={{
                marginTop: 8,
                padding: "12px 14px",
                background: "var(--sell-tint)",
                borderRadius: "var(--r-md)",
                border: "1px solid color-mix(in oklab, var(--sell) 28%, transparent)",
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                <button onClick={onResetCycle}
                        style={{
                          padding: "12px 14px",
                          background: "transparent",
                          border: "1px solid color-mix(in oklab, var(--sell) 40%, transparent)",
                          borderRadius: "var(--r-md)",
                          color: "var(--sell-soft)",
                          fontSize: 14, fontWeight: 700, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                  <span>현재 사이클 강제 종료</span>
                  <Icon name="refresh" size={16}/>
                </button>
                <button onClick={onDelete}
                        style={{
                          padding: "12px 14px",
                          background: "var(--sell)",
                          border: "none",
                          borderRadius: "var(--r-md)",
                          color: "#fff",
                          fontSize: 14, fontWeight: 700, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                  <span>전략 삭제</span>
                  <Icon name="trash" size={16}/>
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{
          padding: "12px 20px calc(20px + var(--safe-bottom))",
          borderTop: "1px solid var(--hairline)",
          background: "var(--surface)",
        }}>
          <button
            className="btn btn-primary btn-block"
            style={{ height: 56, fontSize: 17, opacity: changed ? 1 : 0.5 }}
            disabled={!changed}
            onClick={() => onSave({ principal, division, cycle: cycleNo })}>
            {changed ? "변경사항 저장" : "변경된 내용 없음"}
          </button>
        </div>
      </div>
    </div>
  );
}

window.CycleEditSheet = CycleEditSheet;
