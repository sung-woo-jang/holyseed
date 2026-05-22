// ─────────────────────────────────────────────────────────────────────────
// secondary.jsx — History tab, Settings tab, Account tab, Strategy detail
// ─────────────────────────────────────────────────────────────────────────

// ─── History tab ─────────────────────────────────────────────────────────
function HistoryScreen({ strategies, onOpenDetail }) {
  const [activeId, setActiveId] = React.useState(strategies[0].id);
  const s = strategies.find(s => s.id === activeId);
  const items = s.history;

  return (
    <div className="phone-scroll with-tabs">
      <div className="app-header">
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>체결 내역</div>
        <div style={{ display: "flex", gap: 8 }}>
          {strategies.map(st => (
            <button key={st.id} onClick={() => setActiveId(st.id)}
                    style={{
                      padding: "8px 16px",
                      background: activeId === st.id ? "var(--text)" : "var(--surface-2)",
                      border: "1px solid " + (activeId === st.id ? "var(--text)" : "var(--hairline)"),
                      borderRadius: 999,
                      color: activeId === st.id ? "#0b1220" : "var(--text-dim)",
                      fontSize: 13, fontWeight: 700,
                      cursor: "pointer",
                    }}>
              {st.ticker}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "8px 16px 20px" }}>
        {/* Summary card */}
        <div className="card" style={{ padding: "16px 18px", marginBottom: 16 }}>
          <div className="spread" style={{ marginBottom: 12 }}>
            <span className="section-label">사이클 {s.cycle}</span>
            <span style={{ fontSize: 12, color: "var(--text-mute)", fontWeight: 600 }}>
              {items.length}건
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600 }}>현재 T</div>
              <div className="num" style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{fmtT(s.t)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600 }}>평단</div>
              <div className="num" style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{fmtUSD(s.avg)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600 }}>보유</div>
              <div className="num" style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>
                {Math.floor(s.quantityRaw)}<span style={{ fontSize: 12, color: "var(--text-mute)", marginLeft: 2 }}>주</span>
              </div>
            </div>
          </div>
        </div>

        {/* History list — grouped by month */}
        {groupByMonth(items).map(([month, group]) => (
          <div key={month} style={{ marginBottom: 18 }}>
            <div style={{
              fontSize: 12, fontWeight: 700, color: "var(--text-mute)",
              padding: "8px 4px",
              letterSpacing: "0.04em",
            }}>{month}</div>
            <div className="card" style={{ overflow: "hidden" }}>
              {group.map((h, i) => (
                <HistoryItem key={i} item={h} last={i === group.length - 1}/>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function groupByMonth(items) {
  const map = new Map();
  items.forEach(it => {
    const m = it.date.slice(0, 7);
    if (!map.has(m)) map.set(m, []);
    map.get(m).push(it);
  });
  return [...map.entries()].map(([k, v]) => {
    const [y, mo] = k.split("-");
    return [`${y}년 ${parseInt(mo)}월`, v];
  });
}

function HistoryItem({ item, last }) {
  const isBuy = item.type === "buy";
  const color = isBuy ? "var(--buy)" : "var(--sell)";
  const bg = isBuy ? "var(--buy-tint)" : "var(--sell-tint)";
  return (
    <div style={{
      padding: "14px 16px",
      display: "flex", gap: 12, alignItems: "flex-start",
      borderBottom: last ? "none" : "1px solid var(--hairline)",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon name={isBuy ? "trending-down" : "trending-up"} size={18} color={color}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="spread" style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{item.label}</span>
          <span className="num" style={{ fontSize: 13, fontWeight: 700, color }}>
            {isBuy ? "−" : "+"}{fmtUSD(item.amount)}
          </span>
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: 12, color: "var(--text-mute)",
        }}>
          <span>{fmtDate(item.date)} · <span className="num">{fmtUSD(item.price)} × {item.qty}주</span></span>
        </div>
        <div style={{
          marginTop: 8,
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6,
        }}>
          <MiniStat label="T" value={`${fmtT(item.tFrom)}→${fmtT(item.tTo)}`} highlight/>
          <MiniStat label="평단" value={fmtUSD(item.avg)}/>
          <MiniStat label="잔금" value={fmtUSD(item.cash)}/>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, highlight }) {
  return (
    <div style={{
      background: "var(--bg-elev-0)",
      borderRadius: 8, padding: "6px 8px",
    }}>
      <div style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 600 }}>{label}</div>
      <div className="num" style={{
        fontSize: 12, fontWeight: 700, marginTop: 1,
        color: highlight ? "var(--gold-soft)" : "var(--text)",
      }}>{value}</div>
    </div>
  );
}

// ─── Settings tab ────────────────────────────────────────────────────────
function SettingsScreen({ strategies, theme, onToggleTheme, onAddStrategy, onEditStrategy }) {
  return (
    <div className="phone-scroll with-tabs">
      <div className="app-header">
        <div style={{ fontSize: 24, fontWeight: 800 }}>설정</div>
      </div>

      <div style={{ padding: "8px 16px 20px" }}>
        <div className="section-label" style={{ padding: "8px 4px 10px" }}>전략 운용</div>
        <div className="card" style={{ overflow: "hidden" }}>
          {strategies.map((s, i) => (
            <button key={s.id} onClick={() => onEditStrategy(s)} style={{
              width: "100%", background: "transparent", border: "none",
              borderBottom: i === strategies.length ? "none" : "1px solid var(--hairline)",
              padding: "14px 16px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 12,
              color: "var(--text)", textAlign: "left",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: "var(--surface-3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 13,
              }}>{s.ticker.slice(0,2)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{s.ticker}</div>
                <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
                  {s.division}분할 · 원금 <span className="num">{fmtUSD(s.principal)}</span> · 사이클 {s.cycle}
                </div>
              </div>
              <Icon name="chev-right" size={16} color="var(--text-mute)"/>
            </button>
          ))}
          <button onClick={onAddStrategy} style={{
            width: "100%", background: "transparent", border: "none",
            padding: "14px 16px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 12,
            color: "var(--gold-soft)", fontWeight: 700,
            borderTop: "1px solid var(--hairline)",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "var(--gold-tint)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="plus" size={18} color="var(--gold)"/>
            </div>
            <span style={{ fontSize: 15 }}>전략 추가</span>
          </button>
        </div>

        <div className="section-label" style={{ padding: "20px 4px 10px" }}>화면</div>
        <div className="card" style={{ overflow: "hidden" }}>
          <ThemeRow theme={theme} onToggle={onToggleTheme}/>
        </div>

        <div className="section-label" style={{ padding: "20px 4px 10px" }}>앱 설정</div>
        <div className="card" style={{ overflow: "hidden" }}>
          <SettingRow icon="phone" label="홈화면에 추가 (PWA)"
                      hint="네이티브 앱처럼 사용"/>
          <SettingRow icon="refresh" label="시세 자동 갱신"
                      right={<Toggle value={true} onChange={()=>{}}/>}/>
          <SettingRow icon="calendar" label="시세 새로고침"
                      hint="마지막 갱신: 08:42"/>
          <SettingRow icon="download" label="데이터 내보내기 (CSV)" last/>
        </div>

        <div className="section-label" style={{ padding: "20px 4px 10px" }}>정보</div>
        <div className="card" style={{ overflow: "hidden" }}>
          <SettingRow icon="check-circle" label="방법론 가이드"/>
          <SettingRow icon="warn" label="자주 묻는 질문"/>
          <SettingRow icon="share" label="피드백 보내기" last/>
        </div>

        <div style={{ textAlign: "center", color: "var(--text-mute)",
                      fontSize: 12, padding: "24px 0 8px" }}>
          무한매수법 v0.1.0 · 라오어 V4.0 기반
        </div>
      </div>
    </div>
  );
}

// ─── Theme row (segmented control) ──────────────────────────────────────
function ThemeRow({ theme, onToggle }) {
  return (
    <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: "var(--surface-3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text-dim)",
      }}>
        <Icon name={theme === "light" ? "spark" : "star"} size={16}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>테마</div>
        <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
          {theme === "light" ? "라이트 모드" : "다크 모드"}
        </div>
      </div>
      <div style={{
        display: "flex", gap: 4,
        background: "var(--surface-2)",
        padding: 3, borderRadius: 999,
      }}>
        {[
          { id: "dark",  label: "다크" },
          { id: "light", label: "라이트" },
        ].map(opt => (
          <button key={opt.id} onClick={() => onToggle(opt.id)}
                  style={{
                    padding: "6px 14px", border: "none",
                    background: theme === opt.id ? "var(--surface)" : "transparent",
                    color: theme === opt.id ? "var(--text)" : "var(--text-mute)",
                    borderRadius: 999, fontSize: 12, fontWeight: 700,
                    cursor: "pointer",
                    border: theme === opt.id ? "1px solid var(--hairline)" : "1px solid transparent",
                  }}>{opt.label}</button>
        ))}
      </div>
    </div>
  );
}

function SettingRow({ icon, label, hint, right, last }) {
  return (
    <div style={{
      padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 12,
      borderBottom: last ? "none" : "1px solid var(--hairline)",
      cursor: "pointer",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: "var(--surface-3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text-dim)",
      }}>
        <Icon name={icon} size={16}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>{hint}</div>}
      </div>
      {right !== undefined ? right : <Icon name="chev-right" size={16} color="var(--text-mute)"/>}
    </div>
  );
}

// ─── Account tab ─────────────────────────────────────────────────────────
function AccountScreen({ user, onLogout }) {
  return (
    <div className="phone-scroll with-tabs">
      <div className="app-header">
        <div style={{ fontSize: 24, fontWeight: 800 }}>계정</div>
      </div>

      <div style={{ padding: "8px 16px 20px" }}>
        {/* Profile card */}
        <div className="card" style={{ padding: "20px 18px", textAlign: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: 999,
            background: "var(--gold-tint)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            color: "var(--gold)", fontSize: 28, fontWeight: 800,
            marginBottom: 12,
            border: "2px solid color-mix(in oklab, var(--gold) 40%, transparent)",
          }}>
            {user.name.slice(0,1)}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{user.name}</div>
          <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 2 }}>{user.email}</div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
          <div className="card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600 }}>운용 일수</div>
            <div className="num" style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>16일</div>
          </div>
          <div className="card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600 }}>완료 사이클</div>
            <div className="num" style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>0</div>
          </div>
        </div>

        <div className="section-label" style={{ padding: "20px 4px 10px" }}>보안</div>
        <div className="card" style={{ overflow: "hidden" }}>
          <SettingRow icon="lock" label="비밀번호 변경"/>
          <SettingRow icon="mail" label="이메일 변경" last/>
        </div>

        <button onClick={onLogout} style={{
          marginTop: 20, width: "100%",
          padding: "16px",
          background: "transparent",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--r-md)",
          color: "var(--sell-soft)",
          fontSize: 15, fontWeight: 700,
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <Icon name="log-out" size={18}/>
          로그아웃
        </button>
      </div>
    </div>
  );
}

// ─── Strategy detail page ────────────────────────────────────────────────
function StrategyDetail({ strategy, onBack }) {
  const [tab, setTab] = React.useState("chart");
  const s = strategy;

  return (
    <div className="phone-scroll">
      <div className="app-header" style={{ paddingTop: "calc(var(--safe-top) + 12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <button onClick={onBack} style={{
            width: 36, height: 36, borderRadius: 999, border: "none",
            background: "var(--surface-2)", color: "var(--text)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
            <Icon name="chev-left" size={18}/>
          </button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.1 }}>{s.ticker} 상세</div>
            <div style={{ fontSize: 12, color: "var(--text-mute)" }}>사이클 {s.cycle} · {MODE_FULL[s.mode]}</div>
          </div>
        </div>
        <div style={{
          display: "flex", gap: 4,
          background: "var(--surface-2)",
          padding: 4, borderRadius: 999,
        }}>
          {[
            { id: "chart", label: "차트" },
            { id: "history", label: "히스토리" },
            { id: "timeline", label: "모드 흐름" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "10px 8px", border: "none",
              background: tab === t.id ? "var(--surface)" : "transparent",
              color: tab === t.id ? "var(--text)" : "var(--text-dim)",
              borderRadius: 999, fontSize: 13, fontWeight: 700,
              cursor: "pointer",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "8px 16px 24px" }}>
        {tab === "chart" && <DetailChart s={s}/>}
        {tab === "history" && (
          <div className="card" style={{ overflow: "hidden" }}>
            {s.history.map((h, i) => (
              <HistoryItem key={i} item={h} last={i === s.history.length - 1}/>
            ))}
          </div>
        )}
        {tab === "timeline" && <ModeTimeline s={s}/>}
      </div>
    </div>
  );
}

function DetailChart({ s }) {
  const closes = s.closes;
  const avgLine = s.avgLine || closes.map(() => s.avg);
  const tLine = s.tLine || closes.map(() => s.t);
  const rsiSeries = React.useMemo(() => computeRSI(closes), [closes]);
  const rsiNow = rsiSeries[rsiSeries.length - 1];

  return (
    <div>
      {/* Price vs Avg dual line */}
      <div className="card" style={{ padding: "16px 16px 12px", marginBottom: 12 }}>
        <div className="spread" style={{ marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600, letterSpacing: "0.06em" }}>
              종가 · 30일
            </div>
            <div className="num" style={{ fontSize: 26, fontWeight: 800, marginTop: 2, letterSpacing: "-0.02em" }}>
              {fmtUSD(s.lastClose)}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", fontSize: 11 }}>
            <span style={{ color: "var(--text-dim)" }}>
              <span style={{ display: "inline-block", width: 10, height: 2, background: "var(--gold)", verticalAlign: "middle", marginRight: 4 }}/>
              종가
            </span>
            <span style={{ color: "var(--text-dim)" }}>
              <span style={{ display: "inline-block", width: 10, height: 1.5, background: "var(--cyan)", verticalAlign: "middle", marginRight: 4 }}/>
              평단
            </span>
          </div>
        </div>
        <DetailPriceChart closes={closes} avgLine={avgLine} starPrice={s.starPrice}/>
      </div>

      {/* RSI panel */}
      <div className="card" style={{ padding: "16px 16px 12px", marginBottom: 12 }}>
        <div className="spread" style={{ marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600, letterSpacing: "0.06em" }}>
              RSI 14
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
              <span className="num" style={{ fontSize: 26, fontWeight: 800, color: rsiColor(rsiNow), letterSpacing: "-0.02em" }}>
                {rsiNow.toFixed(1)}
              </span>
              <span style={{ fontSize: 13, color: rsiColor(rsiNow), fontWeight: 700 }}>
                {rsiLabel(rsiNow)}
              </span>
            </div>
          </div>
          <Pill color={rsiColor(rsiNow)} bg={`color-mix(in oklab, ${rsiColor(rsiNow)} 14%, transparent)`}>
            {rsiNow >= 70 ? "매도 신호" : rsiNow <= 30 ? "매수 신호" : "관망"}
          </Pill>
        </div>
        <DetailRSIPanel rsi={rsiSeries}/>
        <div style={{
          marginTop: 12, padding: "10px 12px",
          background: "var(--bg-elev-0)",
          borderRadius: "var(--r-sm)",
          fontSize: 12, color: "var(--text-mute)", lineHeight: 1.5,
        }}>
          RSI는 14일 평균 상승폭/하락폭으로 모멘텀을 측정합니다.
          무한매수법 자체는 RSI 무관 분할매수이지만, <strong style={{ color: "var(--text-dim)" }}>큰수매수·매도거부</strong>
          판단에 참고로 활용하세요.
        </div>
      </div>

      {/* Daily change bars */}
      <div style={{ marginBottom: 12 }}>
        <DailyChangeBars closes={closes}/>
      </div>

      {/* T value chart */}
      <div className="card" style={{ padding: "16px 16px 8px", marginBottom: 12 }}>
        <div className="spread" style={{ marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600, letterSpacing: "0.06em" }}>
              T값 추이
            </div>
            <div className="num" style={{ fontSize: 26, fontWeight: 800, marginTop: 2, letterSpacing: "-0.02em" }}>
              {fmtT(s.t)}
              <span style={{ fontSize: 14, color: "var(--text-mute)", marginLeft: 4 }}>/ {s.division}</span>
            </div>
          </div>
          <Pill color="var(--gold)" bg="var(--gold-tint)">
            {MODE_LABEL[s.mode]}
          </Pill>
        </div>
        <TChart data={tLine} division={s.division}/>
      </div>

      {/* Key metrics */}
      <div className="card" style={{ padding: "8px 16px" }}>
        <KpiRow label="별% (현재)" value={s.starPct !== null && s.starPct !== undefined ? `${s.starPct.toFixed(3)}%` : "—"}/>
        <KpiRow label="별지점" value={fmtUSD(s.starPrice)} accent="var(--gold)"/>
        <KpiRow label="LOC 매수" value={fmtUSD(s.locBuy)}/>
        <KpiRow label="LOC 매도" value={fmtUSD(s.locSell)}/>
        <KpiRow label="RSI 14" value={
          <span style={{ color: rsiColor(rsiNow) }}>{rsiNow.toFixed(1)} · {rsiLabel(rsiNow)}</span>
        }/>
      </div>
    </div>
  );
}

function DualLineChart({ price, avg, starPrice }) {
  const w = 360, h = 160;
  const all = [...price, ...avg];
  const min = Math.min(...all) * 0.98;
  const max = Math.max(...all) * 1.02;
  const span = max - min;
  const xs = (i) => (i / (price.length - 1)) * w;
  const ys = (v) => h - ((v - min) / span) * h;

  const path = (data) =>
    data.map((v, i) => `${i === 0 ? "M" : "L"} ${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 20}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* Grid */}
      {[0.25, 0.5, 0.75].map((t, i) => (
        <line key={i} x1="0" y1={h * t} x2={w} y2={h * t}
              stroke="var(--hairline)" strokeWidth="1" strokeDasharray="2 4"/>
      ))}
      {/* Star line */}
      {starPrice && starPrice > min && starPrice < max && (
        <g>
          <line x1="0" y1={ys(starPrice)} x2={w} y2={ys(starPrice)}
                stroke="var(--gold-soft)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6"/>
          <text x={w - 4} y={ys(starPrice) - 6} fontSize="10" fill="var(--gold-soft)"
                textAnchor="end" fontWeight="700">★ {fmtUSD(starPrice)}</text>
        </g>
      )}
      {/* Area */}
      <path d={path(price) + ` L ${w} ${h} L 0 ${h} Z`} fill="url(#priceFill)"/>
      {/* Avg line */}
      <path d={path(avg)} fill="none" stroke="var(--cyan)" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round"/>
      {/* Price line */}
      <path d={path(price)} fill="none" stroke="var(--gold)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={xs(price.length - 1)} cy={ys(price[price.length-1])} r="4" fill="var(--gold)"/>
    </svg>
  );
}

function TChart({ data, division }) {
  const w = 360, h = 120;
  const min = 0, max = division;
  const xs = (i) => (i / (data.length - 1)) * w;
  const ys = (v) => h - (v / max) * h;
  const path = data.map((v, i) => `${i === 0 ? "M" : "L"} ${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`).join(" ");

  // Mode zones
  const halfY = ys(division / 2);
  const reverseY = ys(division - 1);

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 20}`} style={{ display: "block" }}>
      {/* Zone fills */}
      <rect x="0" y="0" width={w} height={reverseY} fill="var(--sell)" opacity="0.05"/>
      <rect x="0" y={reverseY} width={w} height={halfY - reverseY} fill="var(--mode-second)" opacity="0.05"/>
      <rect x="0" y={halfY} width={w} height={h - halfY} fill="var(--mode-first)" opacity="0.05"/>
      {/* Zone labels */}
      <text x="6" y={h - 6} fontSize="9" fill="var(--mode-first)" fontWeight="700">전반전</text>
      <text x="6" y={halfY - 4} fontSize="9" fill="var(--mode-second)" fontWeight="700">후반전</text>
      <text x="6" y={reverseY - 4} fontSize="9" fill="var(--sell)" fontWeight="700">리버스</text>
      {/* Path */}
      <path d={path} fill="none" stroke="var(--gold)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={xs(data.length - 1)} cy={ys(data[data.length-1])} r="4" fill="var(--gold)"/>
    </svg>
  );
}

function ModeTimeline({ s }) {
  const stages = [
    { mode: "cycle_start", label: "사이클 시작", date: "2025-05-06", desc: "큰수매수 LOC", active: false, done: true },
    { mode: "first_half", label: "일반 · 전반전", date: "2025-05-07 ~ 현재", desc: `T = ${fmtT(s.t)} (0 → ${s.division/2})`, active: s.mode === "first_half", done: false },
    { mode: "second_half", label: "일반 · 후반전", date: "예정", desc: `T ≥ ${s.division/2}`, active: s.mode === "second_half", done: false, future: s.mode !== "second_half" },
    { mode: "reverse", label: "리버스 모드", date: "예정", desc: `T > ${s.division - 1}`, active: s.mode === "reverse", done: false, future: true },
  ];
  return (
    <div className="card" style={{ padding: "16px 20px" }}>
      {stages.map((st, i) => {
        const color = MODE_COLOR[st.mode];
        return (
          <div key={i} style={{
            display: "flex", gap: 14, paddingBottom: i === stages.length - 1 ? 0 : 20,
            position: "relative",
          }}>
            {/* Connector line */}
            {i !== stages.length - 1 && (
              <div style={{
                position: "absolute", left: 11, top: 24, bottom: 0, width: 2,
                background: st.future ? "var(--hairline)" : color, opacity: 0.4,
              }}/>
            )}
            <div style={{
              width: 24, height: 24, borderRadius: 999,
              flexShrink: 0,
              background: st.future ? "var(--surface-3)" : color,
              border: st.active ? "3px solid color-mix(in oklab, " + color + " 30%, transparent)" : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 1,
              boxShadow: st.active ? `0 0 0 4px color-mix(in oklab, ${color} 18%, transparent)` : "none",
            }}>
              {st.done && <Icon name="check" size={14} color="#fff" stroke="2.6"/>}
            </div>
            <div style={{ flex: 1, paddingTop: 2 }}>
              <div style={{
                fontSize: 14, fontWeight: 700,
                color: st.future ? "var(--text-mute)" : "var(--text)",
              }}>{st.label}</div>
              <div style={{ fontSize: 12, color: st.future ? "var(--text-mute)" : "var(--text-dim)", marginTop: 2 }}>
                {st.date}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 4 }}>
                {st.desc}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { HistoryScreen, SettingsScreen, AccountScreen, StrategyDetail });
