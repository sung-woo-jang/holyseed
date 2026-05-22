// ─────────────────────────────────────────────────────────────────────────
// onboarding.jsx — first strategy registration flow
// ─────────────────────────────────────────────────────────────────────────

function Onboarding({ onComplete }) {
  const [step, setStep] = React.useState(0);
  const [ticker, setTicker] = React.useState("TQQQ");
  const [division, setDivision] = React.useState(40);
  const [principalStr, setPrincipalStr] = React.useState("4800");
  const principal = parseFloat(principalStr) || 0;

  const steps = ["종목", "분할수", "원금", "확인"];

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column",
                  background: "var(--bg)" }} className="fade-up">
      {/* Header w/ progress */}
      <div style={{ padding: "calc(var(--safe-top) + 12px) 20px 12px" }}>
        <div className="spread" style={{ marginBottom: 14 }}>
          <button onClick={() => step > 0 ? setStep(step - 1) : null}
                  style={{
                    width: 36, height: 36, borderRadius: 999, border: "none",
                    background: "var(--surface-2)", color: "var(--text)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: step === 0 ? "default" : "pointer",
                    opacity: step === 0 ? 0.3 : 1,
                  }}>
            <Icon name="chev-left" size={18}/>
          </button>
          <div style={{ fontSize: 13, color: "var(--text-mute)", fontWeight: 600 }}>
            {step + 1} / {steps.length}
          </div>
        </div>
        <div style={{
          display: "flex", gap: 6,
        }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 999,
              background: i <= step ? "var(--gold)" : "var(--surface-2)",
              transition: "background 0.25s ease",
            }}/>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div style={{ flex: 1, padding: "24px 24px 12px", overflowY: "auto" }}>
        {step === 0 && (
          <div className="fade-up">
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.3 }}>
              어느 종목으로<br/>운용할까요?
            </div>
            <div style={{ color: "var(--text-dim)", fontSize: 14, marginTop: 8 }}>
              나스닥 3배 또는 반도체 3배 ETF를 추천해요
            </div>
            <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { code: "TQQQ", name: "ProShares UltraPro QQQ", desc: "나스닥 100 × 3" },
                { code: "SOXL", name: "Direxion Semiconductors Bull 3X", desc: "필라델피아 반도체 × 3" },
              ].map(t => (
                <button key={t.code} onClick={() => setTicker(t.code)}
                        style={{
                          textAlign: "left",
                          padding: "18px 18px",
                          background: ticker === t.code ? "var(--gold-tint)" : "var(--surface-2)",
                          border: "1.5px solid " + (ticker === t.code ? "var(--gold)" : "var(--hairline)"),
                          borderRadius: "var(--r-md)",
                          color: "var(--text)",
                          cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 14,
                        }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: ticker === t.code ? "var(--gold)" : "var(--surface-3)",
                    color: ticker === t.code ? "#1a1407" : "var(--text)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 800,
                  }}>{t.code.slice(0,2)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{t.code}</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
                      {t.desc}
                    </div>
                  </div>
                  {ticker === t.code && <Icon name="check-circle" size={20} color="var(--gold)"/>}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="fade-up">
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.3 }}>
              분할수는 몇 회로?
            </div>
            <div style={{ color: "var(--text-dim)", fontSize: 14, marginTop: 8 }}>
              원금을 몇 번에 나눠 매수할지 정해요
            </div>
            <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
              {[20, 40].map(d => (
                <button key={d} onClick={() => setDivision(d)}
                        style={{
                          flex: 1,
                          padding: "24px 12px",
                          background: division === d ? "var(--gold-tint)" : "var(--surface-2)",
                          border: "1.5px solid " + (division === d ? "var(--gold)" : "var(--hairline)"),
                          borderRadius: "var(--r-md)",
                          color: "var(--text)",
                          cursor: "pointer",
                          display: "flex", flexDirection: "column",
                          alignItems: "center", gap: 6,
                        }}>
                  <div className="num" style={{
                    fontSize: 32, fontWeight: 800,
                    color: division === d ? "var(--gold-soft)" : "var(--text)",
                  }}>{d}</div>
                  <div style={{ fontSize: 13, color: "var(--text-dim)", fontWeight: 600 }}>
                    {d}분할 ({d}회 매수)
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 4 }}>
                    {d === 40 ? "기본 · 안정형" : "공격형 · 빠른 진행"}
                  </div>
                </button>
              ))}
            </div>
            <div style={{
              marginTop: 16,
              padding: "12px 14px",
              background: "var(--bg-elev-0)",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--hairline)",
              fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6,
            }}>
              <strong style={{ color: "var(--text)" }}>{division}분할</strong>은
              전반전 0 &lt; T &lt; <span className="num">{division/2}</span> /
              후반전 <span className="num">{division/2}</span> ≤ T &lt; <span className="num">{division}</span> /
              리버스 T &gt; <span className="num">{division-1}</span> 로 구간이 나뉩니다.
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-up">
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.3 }}>
              원금은 얼마인가요?
            </div>
            <div style={{ color: "var(--text-dim)", fontSize: 14, marginTop: 8 }}>
              {ticker} 운용에 투입할 총 금액 (USD)
            </div>
            <div style={{ marginTop: 36, textAlign: "center" }}>
              <div style={{ position: "relative", display: "inline-block" }}>
                <span style={{
                  position: "absolute", left: -28, top: "50%", transform: "translateY(-50%)",
                  fontSize: 28, fontWeight: 700, color: "var(--text-mute)",
                }}>$</span>
                <input
                  type="number" inputMode="decimal"
                  value={principalStr}
                  onChange={(e) => setPrincipalStr(e.target.value)}
                  className="num"
                  style={{
                    width: "100%", maxWidth: 240,
                    background: "transparent", border: "none",
                    borderBottom: "2px solid var(--gold)",
                    color: "var(--text)",
                    fontSize: 48, fontWeight: 800, textAlign: "center",
                    outline: "none",
                    padding: "8px 0",
                  }}
                />
              </div>
              <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-mute)" }}>
                1회 매수액 ≈ <span className="num">{fmtUSD(principal / division)}</span>
              </div>
            </div>
            <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {[2400, 4800, 8000, 12000].map(v => (
                <button key={v} onClick={() => setPrincipalStr(String(v))}
                        style={{
                          padding: "8px 14px",
                          background: "var(--surface-2)",
                          border: "1px solid var(--hairline)",
                          borderRadius: 999,
                          color: principal === v ? "var(--gold)" : "var(--text-dim)",
                          fontSize: 13, fontWeight: 600,
                          cursor: "pointer",
                        }}>
                  ${v.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-up">
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.3 }}>
              이렇게 시작할게요
            </div>
            <div style={{ color: "var(--text-dim)", fontSize: 14, marginTop: 8 }}>
              내일 첫 LOC 주문이 계산되어 표시됩니다
            </div>
            <div style={{ marginTop: 28 }} className="card">
              <div style={{ padding: "18px 18px" }}>
                <div className="spread" style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 20, fontWeight: 800 }}>{ticker}</span>
                  <ModeBadge mode="cycle_start"/>
                </div>
                <KpiRow label="분할수" value={`${division}분할`}/>
                <KpiRow label="원금" value={fmtUSD(principal)}/>
                <KpiRow label="1회 매수액 (예상)" value={fmtUSD(principal / division)}/>
                <KpiRow label="T값" value="0.0" sub="사이클 시작"/>
              </div>
            </div>
            <div style={{
              marginTop: 16,
              padding: "12px 14px",
              background: "var(--gold-tint)",
              borderRadius: "var(--r-md)",
              fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6,
              display: "flex", gap: 10,
            }}>
              <Icon name="warn" size={16} color="var(--gold)" stroke="2"/>
              <div>
                내일 장 시작 전에 <strong style={{ color: "var(--gold-soft)" }}>큰수매수 LOC</strong> 가격이
                표시됩니다. 증권사 앱에서 그대로 입력하시면 돼요.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div style={{ padding: "12px 20px calc(20px + var(--safe-bottom))" }}>
        <button
          className="btn btn-primary btn-block"
          style={{ height: 56, fontSize: 17 }}
          disabled={step === 2 && principal <= 0}
          onClick={() => {
            if (step === steps.length - 1) onComplete({ ticker, division, principal });
            else setStep(step + 1);
          }}>
          {step === steps.length - 1 ? "시작하기" : "다음"}
        </button>
      </div>
    </div>
  );
}

window.Onboarding = Onboarding;
