// ─────────────────────────────────────────────────────────────────────────
// shared.jsx — Icons, formatters, primitives reused across screens
// Exposes onto window so other Babel scripts can pick them up.
// ─────────────────────────────────────────────────────────────────────────

const fmtUSD = (v, digits = 2) => {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return "$" + Number(v).toLocaleString("en-US", {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  });
};

const fmtNum = (v, digits = 2) => {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("en-US", {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  });
};

const fmtPct = (v, digits = 2) => {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return sign + Number(v).toFixed(digits) + "%";
};

const fmtT = (v) => {
  if (v === null || v === undefined) return "—";
  // Display as one decimal, but show .0 when integer
  return Number(v).toFixed(1);
};

const fmtDate = (s) => {
  // "2026-05-21" → "5/21 목"
  if (!s) return "";
  const d = new Date(s + "T00:00:00");
  const days = ["일","월","화","수","목","금","토"];
  return `${d.getMonth()+1}/${d.getDate()} ${days[d.getDay()]}`;
};

const MODE_LABEL = {
  cycle_start: "사이클 시작",
  first_half:  "전반전",
  second_half: "후반전",
  reverse:     "리버스",
};
const MODE_FULL = {
  cycle_start: "사이클 시작",
  first_half:  "일반 · 전반전",
  second_half: "일반 · 후반전",
  reverse:     "리버스 모드",
};
const MODE_COLOR = {
  cycle_start: "var(--mode-start)",
  first_half:  "var(--mode-first)",
  second_half: "var(--mode-second)",
  reverse:     "var(--mode-reverse)",
};

// ─── Icon set (inline SVGs, 24px) ───────────────────────────────────────
const Icon = ({ name, size = 24, stroke = 1.8, color = "currentColor", style }) => {
  const props = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: color, strokeWidth: stroke,
    strokeLinecap: "round", strokeLinejoin: "round",
    style,
  };
  switch (name) {
    case "home":
      return <svg {...props}><path d="M3 11.5L12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/></svg>;
    case "clock":
      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>;
    case "sliders":
      return <svg {...props}><path d="M4 6h10"/><path d="M18 6h2"/><path d="M4 12h4"/><path d="M12 12h8"/><path d="M4 18h14"/><path d="M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="20" cy="18" r="1.4"/></svg>;
    case "user":
      return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"/></svg>;
    case "plus":
      return <svg {...props}><path d="M12 5v14"/><path d="M5 12h14"/></svg>;
    case "x":
      return <svg {...props}><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg>;
    case "chev-right":
      return <svg {...props}><path d="M9 6l6 6-6 6"/></svg>;
    case "chev-left":
      return <svg {...props}><path d="M15 6l-6 6 6 6"/></svg>;
    case "chev-down":
      return <svg {...props}><path d="M6 9l6 6 6-6"/></svg>;
    case "chev-up":
      return <svg {...props}><path d="M6 15l6-6 6 6"/></svg>;
    case "refresh":
      return <svg {...props}><path d="M4 12a8 8 0 0 1 14-5.3L20 8"/><path d="M20 4v4h-4"/><path d="M20 12a8 8 0 0 1-14 5.3L4 16"/><path d="M4 20v-4h4"/></svg>;
    case "trash":
      return <svg {...props}><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg>;
    case "check":
      return <svg {...props}><path d="M5 12l5 5L20 7"/></svg>;
    case "check-circle":
      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>;
    case "warn":
      return <svg {...props}><path d="M12 4l10 17H2L12 4z"/><path d="M12 10v5"/><circle cx="12" cy="18" r="0.7" fill={color} stroke="none"/></svg>;
    case "star":
      return <svg {...props} fill={color} stroke="none"><path d="M12 3l2.7 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.5 6.5 20.3l1.1-6.3L3 9.6l6.3-.9L12 3z"/></svg>;
    case "trending-up":
      return <svg {...props}><path d="M3 17l6-6 4 4 8-9"/><path d="M14 6h7v7"/></svg>;
    case "trending-down":
      return <svg {...props}><path d="M3 7l6 6 4-4 8 9"/><path d="M14 18h7v-7"/></svg>;
    case "settings":
      return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.13.32.2.66.2 1.01"/></svg>;
    case "log-out":
      return <svg {...props}><path d="M15 5h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5"/><path d="M5 12h12"/></svg>;
    case "share":
      return <svg {...props}><path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3"/></svg>;
    case "download":
      return <svg {...props}><path d="M12 4v12"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/></svg>;
    case "calendar":
      return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 3v4"/><path d="M16 3v4"/></svg>;
    case "lock":
      return <svg {...props}><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>;
    case "mail":
      return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>;
    case "spark":
      return <svg {...props}><path d="M12 3v3"/><path d="M12 18v3"/><path d="M5.6 5.6L7.7 7.7"/><path d="M16.3 16.3l2.1 2.1"/><path d="M3 12h3"/><path d="M18 12h3"/><path d="M5.6 18.4L7.7 16.3"/><path d="M16.3 7.7l2.1-2.1"/></svg>;
    case "phone":
      return <svg {...props}><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 19h2"/></svg>;
    default:
      return null;
  }
};

// ─── ModeBadge ────────────────────────────────────────────────────────────
const ModeBadge = ({ mode, size = "md" }) => {
  const color = MODE_COLOR[mode] || "var(--text-mute)";
  const label = MODE_LABEL[mode] || mode;
  const sizes = {
    sm: { fs: 11, p: "4px 8px" },
    md: { fs: 12, p: "5px 10px" },
    lg: { fs: 13, p: "6px 12px" },
  }[size];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontSize: sizes.fs, fontWeight: 700, padding: sizes.p,
      borderRadius: 999, color,
      background: `color-mix(in oklab, ${color} 18%, transparent)`,
      border: `1px solid color-mix(in oklab, ${color} 35%, transparent)`,
      letterSpacing: "0.01em",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color }}/>
      {label}
    </span>
  );
};

// ─── KpiRow ───────────────────────────────────────────────────────────────
const KpiRow = ({ label, value, sub, accent, mono = true, big = false }) => (
  <div style={{
    display: "flex", alignItems: "baseline", justifyContent: "space-between",
    padding: "10px 0", borderBottom: "1px solid var(--hairline)",
  }}>
    <div style={{ color: "var(--text-dim)", fontSize: 14, fontWeight: 500 }}>{label}</div>
    <div style={{ textAlign: "right" }}>
      <div className={mono ? "num" : ""} style={{
        fontSize: big ? 18 : 15, fontWeight: 700,
        color: accent || "var(--text)",
        lineHeight: 1.2,
      }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

// ─── Sparkline ────────────────────────────────────────────────────────────
const Sparkline = ({
  data, width = 280, height = 60, stroke = "var(--gold)",
  fill = "var(--gold-tint)", smooth = true,
}) => {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => [i * stepX, height - 4 - ((v - min) / span) * (height - 8)]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = path + ` L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={`spark-${stroke}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.32"/>
          <stop offset="100%" stopColor={stroke} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${stroke})`} opacity="0.6"/>
      <path d={path} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3" fill={stroke}/>
    </svg>
  );
};

// ─── Avatar / status pill ─────────────────────────────────────────────────
const Pill = ({ children, color = "var(--text-dim)", bg = "transparent", style }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    fontSize: 11, fontWeight: 600, padding: "4px 9px", borderRadius: 999,
    color, background: bg, ...style,
  }}>{children}</span>
);

// ─── Toggle (simple) ──────────────────────────────────────────────────────
const Toggle = ({ value, onChange, label }) => (
  <button
    role="switch"
    aria-checked={value}
    onClick={() => onChange(!value)}
    style={{
      position: "relative",
      width: 48, height: 28, borderRadius: 999,
      border: "none", padding: 0,
      background: value ? "var(--gold)" : "var(--surface-3)",
      transition: "background 0.18s ease", cursor: "pointer",
      flexShrink: 0,
    }}
    aria-label={label}
  >
    <span style={{
      position: "absolute", top: 3, left: value ? 23 : 3,
      width: 22, height: 22, borderRadius: 999, background: "#fff",
      transition: "left 0.18s ease",
      boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
    }}/>
  </button>
);

// ─── Field (labeled input) ────────────────────────────────────────────────
const Field = ({ label, error, children, hint }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dim)" }}>{label}</span>
    {children}
    {hint && !error && <span style={{ fontSize: 12, color: "var(--text-mute)" }}>{hint}</span>}
    {error && <span style={{ fontSize: 12, color: "var(--sell)" }}>{error}</span>}
  </label>
);

const inputBase = {
  background: "var(--surface-2)",
  border: "1px solid var(--hairline)",
  color: "var(--text)",
  padding: "14px 16px",
  borderRadius: "var(--r-md)",
  fontSize: 16,
  outline: "none",
  width: "100%",
  fontFamily: "inherit",
  transition: "border-color 0.15s ease, background 0.15s ease",
};

Object.assign(window, {
  fmtUSD, fmtNum, fmtPct, fmtT, fmtDate,
  MODE_LABEL, MODE_FULL, MODE_COLOR,
  Icon, ModeBadge, KpiRow, Sparkline, Pill, Toggle, Field, inputBase,
});
