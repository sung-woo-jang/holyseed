// ─────────────────────────────────────────────────────────────────────────
// dashboard.jsx — Home tab: greeting + strategy cards + pull-to-refresh
// ─────────────────────────────────────────────────────────────────────────

function Dashboard({ strategies, user, onOpenSheet, onOpenDetail }) {
  const [refreshing, setRefreshing] = React.useState(false);
  const [pullY, setPullY] = React.useState(0);
  const startY = React.useRef(null);
  const scrollRef = React.useRef(null);

  // Totals
  const totals = React.useMemo(() => {
    let principal = 0, cash = 0, equity = 0;
    strategies.forEach(s => {
      principal += s.principal;
      cash += s.cash;
      equity += s.quantityRaw * (s.lastClose || s.avg || 0);
    });
    const total = cash + equity;
    return { principal, cash, equity, total, pnl: total - principal, pnlPct: ((total - principal) / principal) * 100 };
  }, [strategies]);

  const triggerRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); setPullY(0); }, 1100);
  };

  // Pull-to-refresh handlers
  const onTouchStart = (e) => {
    if (scrollRef.current?.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e) => {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0 && scrollRef.current?.scrollTop === 0) {
      setPullY(Math.min(dy * 0.5, 100));
    }
  };
  const onTouchEnd = () => {
    startY.current = null;
    if (pullY > 60 && !refreshing) {
      triggerRefresh();
    } else if (!refreshing) {
      setPullY(0);
    }
  };

  return (
    <div
      ref={scrollRef}
      className="phone-scroll with-tabs"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div style={{
        height: refreshing ? 60 : pullY,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: refreshing ? "height 0.2s ease" : (pullY === 0 ? "height 0.25s ease" : "none"),
        overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          color: "var(--gold)", fontSize: 12, fontWeight: 600,
        }}>
          <div style={{
            transform: refreshing ? "rotate(360deg)" : `rotate(${pullY * 4}deg)`,
            transition: refreshing ? "transform 0.6s linear infinite" : "none",
            animation: refreshing ? "spin 0.8s linear infinite" : "none",
            display: "flex",
          }}>
            <Icon name="refresh" size={16} color="var(--gold)" stroke="2.4"/>
          </div>
          <span>{refreshing ? "시세 갱신 중…" : pullY > 60 ? "놓으면 새로고침" : "당겨서 새로고침"}</span>
        </div>
      </div>

      {/* Header */}
      <div style={{ padding: "calc(var(--safe-top) + 12px) 20px 16px" }}>
        <div className="spread" style={{ marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--text-mute)", fontWeight: 600 }}>
              오늘 오전 8:42
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginTop: 2 }}>
              안녕하세요, {user.name}님
            </div>
          </div>
          <button onClick={triggerRefresh} style={{
            width: 40, height: 40, borderRadius: 999, border: "none",
            background: "var(--surface-2)", color: "var(--text-dim)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }} aria-label="새로고침">
            <Icon name="refresh" size={18}/>
          </button>
        </div>

        {/* Portfolio summary card */}
        <div style={{
          background: `linear-gradient(135deg,
            color-mix(in oklab, var(--gold) 14%, var(--surface)) 0%,
            var(--surface) 60%)`,
          borderRadius: var_("--r-lg", "20px"),
          border: "1px solid color-mix(in oklab, var(--gold) 22%, var(--hairline))",
          padding: "18px 18px 16px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ fontSize: 11, color: "var(--gold-soft)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            총 평가
          </div>
          <div className="num" style={{
            fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em",
            marginTop: 4, lineHeight: 1.1,
          }}>{fmtUSD(totals.total)}</div>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            marginTop: 6,
          }}>
            <Icon name={totals.pnl >= 0 ? "trending-up" : "trending-down"} size={14}
                  color={totals.pnl >= 0 ? "var(--buy-soft)" : "var(--sell-soft)"}/>
            <span className="num" style={{
              fontSize: 14, fontWeight: 700,
              color: totals.pnl >= 0 ? "var(--buy-soft)" : "var(--sell-soft)",
            }}>
              {totals.pnl >= 0 ? "+" : ""}{fmtUSD(totals.pnl)} ({fmtPct(totals.pnlPct, 2)})
            </span>
          </div>
          <hr className="hr" style={{ margin: "14px 0 12px", background: "color-mix(in oklab, var(--gold) 18%, var(--hairline))" }}/>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600 }}>원금</div>
              <div className="num" style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{fmtUSD(totals.principal)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600 }}>주식</div>
              <div className="num" style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{fmtUSD(totals.equity)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600 }}>잔금</div>
              <div className="num" style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{fmtUSD(totals.cash)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategies */}
      <div style={{ padding: "8px 16px 16px" }}>
        <div className="spread" style={{ padding: "0 4px 10px" }}>
          <span className="section-label">오늘 운용</span>
          <span style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600 }}>
            {strategies.length}개 전략 · 프리장 17:00 (서머타임)
          </span>
        </div>

        {strategies.map(s => (
          <StrategyCard
            key={s.id + s.mode + s.t}
            strategy={s}
            onOpenSheet={onOpenSheet}
            onOpenDetail={onOpenDetail}
          />
        ))}

        {/* PWA install hint */}
        <PWAInstallHint/>
      </div>
    </div>
  );
}

// Helper: read CSS var with fallback (some browsers need explicit fallback)
function var_(name, fallback) { return `var(${name}, ${fallback})`; }

function PWAInstallHint() {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;
  return (
    <div style={{
      marginTop: 14,
      padding: "16px 16px",
      background: "var(--bg-elev-0)",
      borderRadius: "var(--r-lg)",
      border: "1px dashed var(--hairline-strong)",
      display: "flex", gap: 12, alignItems: "flex-start",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: "var(--gold-tint)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon name="phone" size={18} color="var(--gold)"/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>홈화면에 추가하기</div>
        <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 4, lineHeight: 1.5 }}>
          Safari의 <strong style={{ color: "var(--text-dim)" }}>공유</strong> →
          "홈 화면에 추가"를 누르면 앱처럼 사용할 수 있어요.
        </div>
      </div>
      <button onClick={() => setDismissed(true)} style={{
        background: "transparent", border: "none", color: "var(--text-mute)",
        cursor: "pointer", padding: 4,
      }}>
        <Icon name="x" size={16}/>
      </button>
    </div>
  );
}

window.Dashboard = Dashboard;
