// ─────────────────────────────────────────────────────────────────────────
// card.jsx — StrategyCard: dashboard hero card for one ticker
// ─────────────────────────────────────────────────────────────────────────

const { useState, useMemo } = React;

function StrategyCard({ strategy, onOpenSheet, onOpenDetail, onCycleEnd }) {
  const s = strategy;
  const accent = window.MODE_COLOR[s.mode];

  // RSI series — computed from closes
  const rsiSeries = useMemo(() => computeRSI(s.closes), [s.closes]);
  const rsiNow = rsiSeries[rsiSeries.length - 1];

  // Buy plan rows (computed from current state)
  const buyRows = useMemo(() => {
    if (s.mode === "cycle_start") {
      const rows = [];
      const k = 1.0;
      let p = s.locBuy; // e.g. 86.24
      rows.push({ label: "큰수매수 LOC", price: p, qty: Math.max(1, Math.floor(s.onceAmount / p)), highlight: "star" });
      // Subsequent step rows
      for (let i = 1; i <= 6; i++) {
        p = p * 0.93;
        rows.push({ label: `분할 ${i + 1}`, price: p, qty: 1 });
      }
      return rows;
    }
    if (s.mode === "reverse") {
      return [{ label: "쿼터매수 LOC", price: s.locBuy, qty: Math.max(1, Math.floor((s.cash / 4) / s.locBuy)), highlight: "star" }];
    }
    // first_half / second_half
    const rows = [];
    if (s.mode === "first_half") {
      const half = s.onceAmount / 2;
      const starQty = Math.max(1, Math.floor(half / s.locBuy));
      const avgQty  = Math.max(1, Math.floor(half / s.avg));
      rows.push({ label: "★ LOC", price: s.locBuy, qty: starQty, highlight: "star" });
      rows.push({ label: "평단 LOC", price: s.avg, qty: avgQty, highlight: "avg" });
    } else {
      // second_half — single LOC
      const starQty = Math.max(1, Math.floor(s.onceAmount / s.locBuy));
      rows.push({ label: "★ LOC", price: s.locBuy, qty: starQty, highlight: "star" });
    }
    // Lower split lines
    let basis = s.mode === "first_half" ? s.avg : s.locBuy;
    let p = basis * 0.93;
    for (let i = 0; i < 5; i++) {
      rows.push({ label: `분할 ${i + 3}`, price: p, qty: 1 });
      p = p * 0.93;
    }
    return rows;
  }, [s]);

  const sellRows = useMemo(() => {
    if (s.mode === "cycle_start") return [];
    if (s.mode === "reverse") {
      const qty = Math.max(1, Math.floor(s.quantityRaw / 20));
      return [{ label: "쿼터매도 LOC", price: s.locSell, qty, type: "loc" }];
    }
    const quarterQty = Math.floor(s.quantityRaw / 4);
    const fixedQty = Math.floor(s.quantityRaw) - quarterQty;
    return [
      { label: "★% LOC", price: s.locSell, qty: quarterQty, type: "loc" },
      { label: s.ticker === "TQQQ" ? "15% 지정가" : "20% 지정가", price: s.sellFixed, qty: fixedQty, type: "fixed" },
    ];
  }, [s]);

  // Detect "large number buy" condition (gap >= 15%)
  const showLargeNumberWarning = s.largeNumberBuy ||
    (s.mode !== "cycle_start" && s.starPrice && s.lastClose &&
      Math.abs((s.starPrice - s.lastClose) / s.lastClose) >= 0.15);

  const isReverse = s.mode === "reverse";
  const isCycleStart = s.mode === "cycle_start";

  return (
    <div className="card" style={{ overflow: "hidden", marginBottom: 14 }}>
      {/* ─── Header ───────────────────────────────────────── */}
      <div style={{ padding: "16px 18px 12px" }}>
        <div className="spread" style={{ marginBottom: 10 }}>
          <div className="row gap-2">
            <span style={{
              fontSize: 18, fontWeight: 800, letterSpacing: "0.02em",
            }}>{s.ticker}</span>
            <span style={{ fontSize: 12, color: "var(--text-mute)", fontWeight: 600 }}>
              사이클 {s.cycle}
            </span>
          </div>
          <ModeBadge mode={s.mode}/>
        </div>

        {/* Large hero number — current price */}
        <div className="row" style={{ alignItems: "flex-end", gap: 8 }}>
          <div className="num" style={{
            fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em",
            color: "var(--text)", lineHeight: 1,
          }}>{fmtUSD(s.lastClose)}</div>
          <div style={{ paddingBottom: 4, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <Pill color="var(--text-mute)">
              <Icon name="clock" size={11} stroke="2"/>
              종가
            </Pill>
            <RSIPill value={rsiNow}/>
          </div>
        </div>

        {/* Price + RSI chart */}
        <div style={{ marginTop: 14, marginLeft: -2 }}>
          <ChartPanel
            closes={s.closes}
            rsi={rsiSeries}
            avgPrice={s.avg}
            starPrice={s.starPrice}
            accent={accent}
          />
          <div style={{
            display: "flex", justifyContent: "space-between",
            marginTop: 6, fontSize: 11, color: "var(--text-mute)", fontWeight: 600,
          }}>
            <span>지난 30거래일 · RSI 14</span>
            <span style={{ display: "flex", gap: 10 }}>
              <span><span style={{ display: "inline-block", width: 8, height: 2, background: accent, verticalAlign: "middle", marginRight: 4 }}/>종가</span>
              {s.avg && <span><span style={{ display: "inline-block", width: 8, height: 1, background: "var(--cyan)", verticalAlign: "middle", marginRight: 4 }}/>평단</span>}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Reverse mode warning ───────────────────────────── */}
      {isReverse && (
        <div style={{
          margin: "0 16px 12px",
          background: "var(--sell-tint)",
          border: "1px solid color-mix(in oklab, var(--sell) 30%, transparent)",
          borderRadius: "var(--r-md)",
          padding: "12px 14px",
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <Icon name="warn" size={18} color="var(--sell)" stroke="2"/>
          <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, color: "var(--sell-soft)", marginBottom: 2 }}>
              리버스 모드 진행 중 — 매일 손절 구간
            </div>
            <div style={{ color: "var(--text-dim)" }}>
              종료 조건: 종가 &gt; <span className="num">{fmtUSD(s.reverseExit || s.avg * 0.85)}</span>
              <span style={{ color: "var(--text-mute)" }}> (평단 × 0.85)</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Large-number-buy warning ───────────────────────── */}
      {showLargeNumberWarning && !isReverse && !isCycleStart && (
        <div style={{
          margin: "0 16px 12px",
          background: "var(--gold-tint)",
          border: "1px solid color-mix(in oklab, var(--gold) 40%, transparent)",
          borderRadius: "var(--r-md)",
          padding: "12px 14px",
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <Icon name="warn" size={18} color="var(--gold)" stroke="2"/>
          <div style={{ fontSize: 13, lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, color: "var(--gold-soft)", marginBottom: 2 }}>
              큰수매수 권장
            </div>
            <div style={{ color: "var(--text-dim)" }}>
              별지점 <span className="num">{fmtUSD(s.starPrice)}</span> vs 종가 <span className="num">{fmtUSD(s.lastClose)}</span>
              <span style={{ color: "var(--text-mute)" }}> · 괴리 {Math.round(Math.abs((s.starPrice - s.lastClose) / s.lastClose) * 100)}%</span>
            </div>
            <div style={{ color: "var(--gold-soft)", marginTop: 4, fontWeight: 600 }}>
              제안: <span className="num">{fmtUSD(s.largeNumberBuy?.suggested || s.lastClose * 1.15)}</span> 으로 LOC 시작
            </div>
          </div>
        </div>
      )}

      <hr className="hr"/>

      {/* ─── Fear & Greed (per ticker) ──────────────── */}
      <FearGreedSection ticker={s.ticker}/>

      <hr className="hr"/>

      {/* ─── Section 1: Current state ──────────────────────── */}
      <div style={{ padding: "14px 18px 6px" }}>
        <div className="section-label" style={{ marginBottom: 6 }}>현재 상태</div>
        <KpiRow label="T값" value={<>
          <span>{fmtT(s.t)}</span>
          <span style={{ color: "var(--text-mute)", fontSize: 12, fontWeight: 500, marginLeft: 4 }}>
            / {s.division}
          </span>
        </>} big/>
        <KpiRow label="평단" value={fmtUSD(s.avg)}/>
        <KpiRow label="보유 수량" value={<>
          <span>{Math.floor(s.quantityRaw)}</span>
          <span style={{ color: "var(--text-mute)", fontSize: 12, fontWeight: 500, marginLeft: 2 }}>주</span>
        </>} sub={s.quantityRaw % 1 !== 0 ? `실제 ${s.quantityRaw.toFixed(6)}주` : null}/>
        <KpiRow label="잔금" value={fmtUSD(s.cash)}/>
        {s.onceAmount && (
          <KpiRow label="1회 매수액" value={fmtUSD(s.onceAmount)}
                  sub={`잔금 ÷ (${s.division} − ${fmtT(s.t)})`}/>
        )}
      </div>

      {/* ─── Section 2: Today's indicators ──────────────────── */}
      {!isCycleStart && (
        <div style={{ padding: "8px 18px 6px" }}>
          <div className="section-label" style={{ marginBottom: 6 }}>오늘 지표</div>
          {s.starPct !== null && s.starPct !== undefined && (
            <KpiRow
              label="별%"
              value={<span>{s.starPct.toFixed(3)}%</span>}
              accent={s.starPct < 0 ? "var(--sell-soft)" : "var(--text)"}
              sub={isReverse ? "리버스 별지점 = 5거래일 평균" :
                   s.starPct < 0 ? "후반전: 평단 아래로 LOC" :
                   `(15 − 0.75 × ${fmtT(s.t)})%`}/>
          )}
          <KpiRow label="별지점" value={fmtUSD(s.starPrice)}
                  accent="var(--gold)"/>
          {!isReverse && s.locBuy && (
            <KpiRow label="LOC 매수" value={fmtUSD(s.locBuy)}/>
          )}
          {s.locSell && (
            <KpiRow label="LOC 매도" value={fmtUSD(s.locSell)}/>
          )}
          {!isReverse && s.sellFixed && (
            <KpiRow label={`${s.ticker === "TQQQ" ? "15%" : "20%"} 지정가`}
                    value={fmtUSD(s.sellFixed)}/>
          )}
        </div>
      )}

      {/* ─── Section 3: Buy plan ────────────────────────────── */}
      {buyRows.length > 0 && (
        <div style={{ padding: "14px 0 0" }}>
          <div className="spread" style={{ padding: "0 18px 8px" }}>
            <div className="row gap-2">
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--buy-soft)" }}>
                매수점
              </span>
              <span style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600 }}>
                {isReverse ? "리버스 쿼터매수" : isCycleStart ? "사이클 시작" :
                 s.mode === "first_half" ? "전반전 · 2개 LOC" : "후반전 · 1개 LOC"}
              </span>
            </div>
            {s.onceAmount && (
              <span className="num" style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 600 }}>
                {fmtUSD(s.onceAmount)}
              </span>
            )}
          </div>
          <PlanTable rows={buyRows} side="buy"/>
        </div>
      )}

      {/* ─── Section 4: Sell plan ───────────────────────────── */}
      {sellRows.length > 0 && (
        <div style={{ padding: "14px 0 0" }}>
          <div className="spread" style={{ padding: "0 18px 8px" }}>
            <div className="row gap-2">
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--sell-soft)" }}>
                매도점
              </span>
              <span style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600 }}>
                프리장 17:00 (서머타임)
              </span>
            </div>
          </div>
          <PlanTable rows={sellRows} side="sell"/>
        </div>
      )}

      {/* ─── Section 5: CTAs ────────────────────────────────── */}
      <div style={{
        padding: "16px 16px 16px",
        display: "flex", gap: 8,
        background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.18))",
        marginTop: 8,
      }}>
        <button className="btn btn-primary" style={{ flex: 2 }}
                onClick={() => onOpenSheet && onOpenSheet(s)}>
          어제 체결 입력
        </button>
        <button className="btn btn-ghost" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                onClick={() => onOpenDetail && onOpenDetail(s)}>
          상세
          <Icon name="chev-right" size={16} stroke="2.4"/>
        </button>
      </div>
    </div>
  );
}

// ─── PlanTable — the editorial-table look (rows, not cells) ─────────────
function PlanTable({ rows, side }) {
  return (
    <div style={{ borderTop: "1px solid var(--hairline)" }}>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1.1fr 0.6fr",
        padding: "8px 18px",
        fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
        color: "var(--text-mute)", textTransform: "uppercase",
        background: "var(--bg-elev-0)",
      }}>
        <span>구분</span>
        <span style={{ textAlign: "right" }}>{side === "buy" ? "LOC 가격" : "가격"}</span>
        <span style={{ textAlign: "right" }}>수량</span>
      </div>
      {rows.map((r, i) => {
        let labelColor = "var(--text-dim)";
        let labelWeight = 500;
        let rowBg = "transparent";
        let valueColor = "var(--text)";
        if (r.highlight === "star") {
          labelColor = "var(--gold-soft)";
          labelWeight = 700;
          rowBg = "color-mix(in oklab, var(--gold) 6%, transparent)";
        } else if (r.highlight === "avg") {
          labelColor = "var(--cyan)";
          labelWeight = 700;
          rowBg = "color-mix(in oklab, var(--cyan) 6%, transparent)";
        } else if (r.type === "loc" && side === "sell") {
          labelColor = "var(--sell-soft)";
          labelWeight = 700;
          rowBg = "color-mix(in oklab, var(--sell) 6%, transparent)";
        } else if (r.type === "fixed" && side === "sell") {
          labelColor = "var(--sell)";
          labelWeight = 700;
        }
        return (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "1fr 1.1fr 0.6fr",
            alignItems: "center",
            padding: "12px 18px",
            background: rowBg,
            borderBottom: i === rows.length - 1 ? "none" : "1px solid var(--hairline)",
            minHeight: 44,
          }}>
            <span style={{
              fontSize: 13, fontWeight: labelWeight, color: labelColor,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              {r.highlight === "star" && <Icon name="star" size={12} color="var(--gold)"/>}
              {r.label}
            </span>
            <span className="num" style={{
              fontSize: 14, textAlign: "right", fontWeight: 600, color: valueColor,
            }}>{fmtUSD(r.price)}</span>
            <span className="num" style={{
              fontSize: 14, textAlign: "right", fontWeight: 600,
              color: r.qty >= 1 ? "var(--text)" : "var(--text-mute)",
            }}>
              {r.qty}<span style={{ color: "var(--text-mute)", fontSize: 11, marginLeft: 2 }}>주</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

window.StrategyCard = StrategyCard;
