// ─────────────────────────────────────────────────────────────────────────
// auth.jsx — Login + Signup screens
// ─────────────────────────────────────────────────────────────────────────

function AuthScreen({ mode, onSwitchMode, onSuccess }) {
  const [email, setEmail] = React.useState(mode === "login" ? "sigma@trader.kr" : "");
  const [password, setPassword] = React.useState(mode === "login" ? "••••••••" : "");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const isLogin = mode === "login";
  const canSubmit = email.length > 3 && password.length > 3 && (isLogin || confirm === password);

  const submit = (e) => {
    e?.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setTimeout(() => { setBusy(false); onSuccess(isLogin ? "dashboard" : "onboarding"); }, 450);
  };

  return (
    <div style={{
      minHeight: "100%",
      display: "flex", flexDirection: "column",
      padding: "calc(var(--safe-top) + 8vh) 24px 28px",
      background: `
        radial-gradient(600px 400px at 80% 0%, rgba(212,175,55,0.10), transparent 60%),
        var(--bg)`,
    }} className="fade-up">
      {/* Brand */}
      <div style={{ marginBottom: 40 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 56, height: 56, borderRadius: 18,
          background: "var(--gold)",
          marginBottom: 18,
          boxShadow: "0 8px 24px rgba(212,175,55,0.32)",
        }}>
          <Icon name="star" size={28} color="#1a1407"/>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
          {isLogin ? "다시 만나서 반가워요" : "무한매수법을\n자동으로 운용해요"}
        </div>
        <div style={{ fontSize: 14, color: "var(--text-dim)", marginTop: 10, lineHeight: 1.5 }}>
          {isLogin ? "오늘의 LOC 주문을 30초 안에 확인하세요" :
                     "라오어 V4.0을 그대로, 계산은 자동으로"}
        </div>
      </div>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="이메일">
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              color: "var(--text-mute)", display: "flex",
            }}><Icon name="mail" size={18}/></span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ ...inputBase, paddingLeft: 44 }}
              placeholder="you@example.com"
            />
          </div>
        </Field>

        <Field label="비밀번호" hint={isLogin ? null : "8자 이상"}>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              color: "var(--text-mute)", display: "flex",
            }}><Icon name="lock" size={18}/></span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...inputBase, paddingLeft: 44 }}
              placeholder="••••••••"
            />
          </div>
        </Field>

        {!isLogin && (
          <Field label="비밀번호 확인"
                 error={confirm && confirm !== password ? "비밀번호가 일치하지 않아요" : null}>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                color: "var(--text-mute)", display: "flex",
              }}><Icon name="lock" size={18}/></span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={{ ...inputBase, paddingLeft: 44 }}
                placeholder="••••••••"
              />
            </div>
          </Field>
        )}

        <button
          type="submit"
          disabled={!canSubmit || busy}
          className="btn btn-primary btn-block"
          style={{ height: 56, marginTop: 8, fontSize: 16 }}>
          {busy ? "잠시만요…" : isLogin ? "로그인" : "계정 만들기"}
        </button>

        <div style={{ textAlign: "center", marginTop: 12, color: "var(--text-dim)", fontSize: 14 }}>
          {isLogin ? "처음이신가요? " : "이미 계정이 있나요? "}
          <button type="button" onClick={() => onSwitchMode(isLogin ? "signup" : "login")}
                  style={{
                    background: "transparent", border: "none",
                    color: "var(--gold-soft)", fontWeight: 700, fontSize: 14,
                    cursor: "pointer", padding: 0,
                  }}>
            {isLogin ? "회원가입" : "로그인"}
          </button>
        </div>
      </form>

      <div style={{ flex: 1 }}/>
      <div style={{ fontSize: 11, color: "var(--text-mute)", textAlign: "center", marginTop: 24 }}>
        본 서비스는 라오어 무한매수법 V4.0의 자동화 도구이며,<br/>
        매매 의사결정과 결과는 사용자 책임입니다.
      </div>
    </div>
  );
}

window.AuthScreen = AuthScreen;
