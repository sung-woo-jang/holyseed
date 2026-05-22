// ─────────────────────────────────────────────────────────────────────────
// shell.jsx — Tab bar + app shell (auth/onboarding/main routing)
// ─────────────────────────────────────────────────────────────────────────

function TabBar({ active, onSelect }) {
  const tabs = [
    { id: "dashboard", label: "홈",     icon: "home" },
    { id: "history",   label: "히스토리", icon: "clock" },
    { id: "settings",  label: "설정",   icon: "sliders" },
    { id: "account",   label: "계정",   icon: "user" },
  ];
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, bottom: 0,
      zIndex: 50,
      padding: "8px 8px calc(8px + var(--safe-bottom))",
      background: "color-mix(in oklab, var(--bg) 92%, transparent)",
      backdropFilter: "blur(20px) saturate(160%)",
      WebkitBackdropFilter: "blur(20px) saturate(160%)",
      borderTop: "1px solid var(--hairline)",
      display: "flex",
    }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onSelect(t.id)}
                  style={{
                    flex: 1,
                    background: "transparent", border: "none",
                    color: isActive ? "var(--gold)" : "var(--text-mute)",
                    cursor: "pointer",
                    padding: "8px 4px",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 4,
                    minHeight: 56,
                    fontWeight: 700,
                  }}>
            <Icon name={t.icon} size={22} stroke={isActive ? 2.2 : 1.7}/>
            <span style={{ fontSize: 10.5, letterSpacing: "0.02em" }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── CycleEnd overlay ────────────────────────────────────────────────────
function CycleEndOverlay({ strategy, onClose }) {
  const [option, setOption] = React.useState("compound");
  const s = strategy;
  const newPrincipal = option === "compound" ? s.newCash : s.principal;

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 200,
      background: "rgba(4, 8, 16, 0.92)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      display: "flex", flexDirection: "column",
      padding: "calc(var(--safe-top) + 24px) 24px calc(24px + var(--safe-bottom))",
      animation: "overlayIn 0.3s ease",
    }}>
      <button onClick={onClose} style={{
        position: "absolute", top: "calc(var(--safe-top) + 16px)", right: 16,
        width: 36, height: 36, borderRadius: 999, border: "none",
        background: "var(--surface-2)", color: "var(--text-dim)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
      }}>
        <Icon name="x" size={18}/>
      </button>

      <div style={{ flex: 0.4 }}/>

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 80, height: 80, borderRadius: 999,
          background: "var(--gold)",
          marginBottom: 18,
          boxShadow: "0 12px 40px rgba(212,175,55,0.5)",
        }}>
          <Icon name="check" size={42} color="#1a1407" stroke="3"/>
        </div>
        <div style={{ fontSize: 14, color: "var(--gold-soft)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          사이클 완료
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, letterSpacing: "-0.02em" }}>
          {s.ticker} 사이클 {s.cycle}
        </div>
      </div>

      <div className="card" style={{ padding: "20px", marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, textAlign: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600 }}>수익금</div>
            <div className="num" style={{ fontSize: 24, fontWeight: 800, color: "var(--buy-soft)", marginTop: 4 }}>
              +{fmtUSD(s.profit)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600 }}>수익률</div>
            <div className="num" style={{ fontSize: 24, fontWeight: 800, color: "var(--buy-soft)", marginTop: 4 }}>
              +{s.profitPct}%
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>다음 사이클 원금</div>
        <button onClick={() => setOption("compound")} style={{
          width: "100%", marginBottom: 8,
          padding: "16px 18px",
          background: option === "compound" ? "var(--gold-tint)" : "var(--surface-2)",
          border: "1.5px solid " + (option === "compound" ? "var(--gold)" : "var(--hairline)"),
          borderRadius: "var(--r-md)",
          color: "var(--text)", textAlign: "left",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>복리</div>
            <div style={{ fontSize: 12, color: "var(--text-mute)" }}>수익 포함, 점점 굴려가요</div>
          </div>
          <div className="num" style={{ fontSize: 17, fontWeight: 800, color: option === "compound" ? "var(--gold-soft)" : "var(--text)" }}>
            {fmtUSD(s.newCash)}
          </div>
        </button>
        <button onClick={() => setOption("simple")} style={{
          width: "100%",
          padding: "16px 18px",
          background: option === "simple" ? "var(--gold-tint)" : "var(--surface-2)",
          border: "1.5px solid " + (option === "simple" ? "var(--gold)" : "var(--hairline)"),
          borderRadius: "var(--r-md)",
          color: "var(--text)", textAlign: "left",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>단리</div>
            <div style={{ fontSize: 12, color: "var(--text-mute)" }}>최초 원금 유지, 수익 분리</div>
          </div>
          <div className="num" style={{ fontSize: 17, fontWeight: 800, color: option === "simple" ? "var(--gold-soft)" : "var(--text)" }}>
            {fmtUSD(s.principal)}
          </div>
        </button>
      </div>

      <div style={{ flex: 1 }}/>

      <button className="btn btn-primary btn-block"
              style={{ height: 56, fontSize: 17 }}
              onClick={onClose}>
        새 사이클 {s.cycle + 1} 시작
      </button>
    </div>
  );
}

// ─── App shell ───────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "live",
  "tickerVariant": "first_half",
  "showCycleEnd": false,
  "showLargeNumberBuy": false,
  "theme": "dark"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = React.useState("auth");  // 'auth' | 'onboarding' | 'main' | 'detail'
  const [authMode, setAuthMode] = React.useState("login");
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [sheetStrategy, setSheetStrategy] = React.useState(null);
  const [editSheetStrategy, setEditSheetStrategy] = React.useState(null);
  const [detailStrategy, setDetailStrategy] = React.useState(null);
  const [toast, setToast] = React.useState(null);

  // ─── Theme management ───
  React.useEffect(() => {
    document.body.dataset.theme = t.theme || "dark";
  }, [t.theme]);
  const setTheme = (next) => setTweak("theme", next);

  // Build strategies array — apply Tweaks variants for comparison
  const strategies = React.useMemo(() => {
    let tqqq = SEED.tqqq;
    // Apply variant to first ticker for mode comparison
    if (t.tickerVariant === "second_half") {
      // Use SOXL's second-half-style state but with TQQQ ticker
      tqqq = { ...SEED.tqqq, mode: "second_half", t: 22.4, starPct: -1.8, starPrice: 73.50, locBuy: 73.49, locSell: 73.50, sellFixed: 86.08, onceAmount: 222.50 };
    } else if (t.tickerVariant === "reverse") {
      tqqq = SEED.reverseSample;
    } else if (t.tickerVariant === "cycle_start") {
      tqqq = SEED.cycleStartSample;
    } else if (t.tickerVariant === "large_number") {
      tqqq = SEED.largeNumberSample;
    }
    return [tqqq, SEED.soxl];
  }, [t.tickerVariant]);

  const cycleEndStrategy = t.showCycleEnd ? SEED.cycleEndSample : null;

  // Show a small toast
  const flashToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  // ─── Render ───
  let content;
  if (route === "auth") {
    content = (
      <AuthScreen
        mode={authMode}
        onSwitchMode={setAuthMode}
        onSuccess={(next) => setRoute(next === "onboarding" ? "onboarding" : "main")}
      />
    );
  } else if (route === "onboarding") {
    content = (
      <Onboarding
        onComplete={() => { setRoute("main"); flashToast("전략이 등록되었어요"); }}
      />
    );
  } else if (route === "detail" && detailStrategy) {
    content = (
      <StrategyDetail
        strategy={detailStrategy}
        onBack={() => { setDetailStrategy(null); setRoute("main"); }}
      />
    );
  } else {
    content = (
      <React.Fragment>
        {activeTab === "dashboard" && (
          <Dashboard
            strategies={strategies}
            user={SEED.user}
            onOpenSheet={setSheetStrategy}
            onOpenDetail={(s) => { setDetailStrategy(s); setRoute("detail"); }}
          />
        )}
        {activeTab === "history" && (
          <HistoryScreen
            strategies={strategies}
            onOpenDetail={(s) => { setDetailStrategy(s); setRoute("detail"); }}
          />
        )}
        {activeTab === "settings" && (
          <SettingsScreen
            strategies={strategies}
            theme={t.theme || "dark"}
            onToggleTheme={setTheme}
            onAddStrategy={() => setRoute("onboarding")}
            onEditStrategy={(s) => setEditSheetStrategy(s)}
          />
        )}
        {activeTab === "account" && (
          <AccountScreen
            user={SEED.user}
            onLogout={() => { setRoute("auth"); setAuthMode("login"); }}
          />
        )}
        <TabBar active={activeTab} onSelect={setActiveTab}/>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      {content}

      {sheetStrategy && (
        <ExecutionSheet
          strategy={sheetStrategy}
          onClose={() => setSheetStrategy(null)}
          onSave={() => {
            setSheetStrategy(null);
            flashToast("저장 완료 · 내일 계획이 갱신됐어요");
          }}
        />
      )}

      {editSheetStrategy && (
        <CycleEditSheet
          strategy={editSheetStrategy}
          onClose={() => setEditSheetStrategy(null)}
          onSave={() => { setEditSheetStrategy(null); flashToast("전략 설정이 저장됐어요"); }}
          onResetCycle={() => { setEditSheetStrategy(null); flashToast("사이클이 강제 종료됐어요"); }}
          onDelete={() => { setEditSheetStrategy(null); flashToast("전략이 삭제됐어요"); }}
        />
      )}

      {cycleEndStrategy && (
        <CycleEndOverlay
          strategy={cycleEndStrategy}
          onClose={() => setTweak("showCycleEnd", false)}
        />
      )}

      {toast && (
        <div style={{
          position: "absolute", left: "50%", bottom: "calc(96px + var(--safe-bottom))",
          transform: "translateX(-50%)",
          background: "rgba(15, 23, 42, 0.94)",
          backdropFilter: "blur(20px)",
          color: "var(--text)",
          padding: "12px 18px", borderRadius: 12,
          fontSize: 13, fontWeight: 600,
          border: "1px solid var(--hairline-strong)",
          boxShadow: "var(--shadow-1)",
          zIndex: 80,
          whiteSpace: "nowrap",
          animation: "fadeUp 0.2s ease",
        }}>{toast}</div>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="테마"/>
        <TweakRadio
          label="모드"
          value={t.theme || "dark"}
          options={["dark", "light"]}
          onChange={(v) => setTweak("theme", v)}
        />

        <TweakSection label="화면 비교"/>
        <TweakSelect
          label="대시보드 카드 상태"
          value={t.tickerVariant}
          options={[
            { value: "first_half",   label: "전반전 (실데이터)" },
            { value: "second_half",  label: "후반전" },
            { value: "reverse",      label: "리버스 모드" },
            { value: "cycle_start",  label: "사이클 시작 (T=0)" },
            { value: "large_number", label: "큰수매수 경고" },
          ]}
          onChange={(v) => setTweak("tickerVariant", v)}
        />
        <TweakToggle
          label="사이클 종료 오버레이"
          value={t.showCycleEnd}
          onChange={(v) => setTweak("showCycleEnd", v)}
        />

        <TweakSection label="플로우 점프"/>
        <TweakSelect
          label="화면"
          value={
            route === "auth" ? (authMode === "login" ? "login" : "signup") :
            route === "onboarding" ? "onboarding" :
            route === "detail" ? "detail" :
            activeTab
          }
          options={[
            { value: "login",      label: "로그인" },
            { value: "signup",     label: "회원가입" },
            { value: "onboarding", label: "온보딩" },
            { value: "dashboard",  label: "대시보드" },
            { value: "history",    label: "히스토리" },
            { value: "settings",   label: "설정" },
            { value: "account",    label: "계정" },
            { value: "detail",     label: "전략 상세" },
          ]}
          onChange={(v) => {
            setSheetStrategy(null);
            setDetailStrategy(null);
            if (v === "login")      { setRoute("auth"); setAuthMode("login"); }
            else if (v === "signup"){ setRoute("auth"); setAuthMode("signup"); }
            else if (v === "onboarding") { setRoute("onboarding"); }
            else if (v === "detail"){
              setRoute("detail");
              setDetailStrategy(strategies[0]);
            }
            else { setRoute("main"); setActiveTab(v); }
          }}
        />
        <TweakButton label="체결 입력 시트 열기"
                     onClick={() => setSheetStrategy(strategies[0])}/>
        <TweakButton label="사이클 편집 시트 열기"
                     onClick={() => setEditSheetStrategy(strategies[0])}/>
      </TweaksPanel>
    </React.Fragment>
  );
}

window.App = App;

// Inject extra @keyframes (some browsers strip styled-jsx-style frames)
(() => {
  const s = document.createElement("style");
  s.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(s);
})();
