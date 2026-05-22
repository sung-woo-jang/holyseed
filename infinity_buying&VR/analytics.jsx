// ─────────────────────────────────────────────────────────────────────────
// analytics.jsx — Fear & Greed gauge + Daily change bars
// ─────────────────────────────────────────────────────────────────────────

// ─── Fear & Greed data (mock CNN-style) — per ticker ────────────────────
// CNN's index is technically market-wide, but for the prototype we show
// ticker-specific sentiment (Nasdaq for TQQQ, Semiconductors for SOXL).
const FNG_BY_TICKER = {
  TQQQ: {
    history: [
      55, 52, 48, 45, 42, 38, 35, 32, 28, 25,
      22, 24, 27, 30, 33, 31, 28, 26, 28, 32,
      35, 38, 41, 38, 36, 33, 35, 38, 40, 38,
    ],
    market: "나스닥",
  },
  SOXL: {
    history: [
      48, 45, 41, 38, 34, 30, 27, 23, 19, 16,
      14, 17, 21, 25, 28, 26, 22, 19, 22, 26,
      29, 32, 34, 31, 28, 25, 28, 31, 33, 30,
    ],
    market: "필라델피아 반도체",
  },
};

function getFNG(ticker) {
  const data = FNG_BY_TICKER[ticker] || FNG_BY_TICKER.TQQQ;
  const history = data.history;
  const current = history[history.length - 1];
  return {
    history,
    current,
    yesterday: history[history.length - 2],
    weekAgo: history[history.length - 8],
    monthAgo: history[0],
    market: data.market,
  };
}

// Backwards-compat alias
const FNG_DATA = getFNG("TQQQ");

function fngZone(v) {
  if (v <= 24) return { label: "극한 공포", color: "#dc2626", short: "Extreme Fear" };
  if (v <= 44) return { label: "공포",      color: "#ea580c", short: "Fear" };
  if (v <= 54) return { label: "중립",      color: "#eab308", short: "Neutral" };
  if (v <= 74) return { label: "탐욕",      color: "#65a30d", short: "Greed" };
  return        { label: "극한 탐욕",        color: "#15803d", short: "Extreme Greed" };
}

// ─── Compact in-card Fear & Greed section ──────────────────────────────
function FearGreedSection({ ticker }) {
  const { history, current, yesterday, market } = getFNG(ticker);
  const zone = fngZone(current);
  const delta = current - yesterday;

  // Inline bar with zone segments + marker
  const w = 100; // percent
  const markerLeft = `${current}%`;

  return (
    <div style={{ padding: "12px 18px 14px" }}>
      <div className="spread" style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            color: "var(--text-mute)", textTransform: "uppercase",
          }}>공포 & 탐욕</span>
          <span style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 500 }}>
            {market} · CNN
          </span>
        </div>
        <span style={{
          fontSize: 11, color: delta > 0 ? "var(--buy-soft)" : delta < 0 ? "var(--sell-soft)" : "var(--text-mute)",
          fontWeight: 700,
        }} className="num">
          전일 {delta > 0 ? "+" : ""}{delta}
        </span>
      </div>

      <div className="row gap-3" style={{ alignItems: "center", marginBottom: 10 }}>
        <span className="num" style={{
          fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em",
          color: zone.color, lineHeight: 1,
        }}>{current}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: zone.color, lineHeight: 1.1 }}>
            {zone.label}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
            {zone.short} · {ticker} 시장 심리
          </div>
        </div>
        <div style={{ width: 96 }}>
          <FNGInlineSpark data={history.slice(-14)} zone={zone}/>
        </div>
      </div>

      {/* Segmented bar with marker */}
      <div style={{ position: "relative", height: 12, borderRadius: 999, overflow: "visible" }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: 999, overflow: "hidden",
          display: "flex",
        }}>
          {[
            { range: 24, color: "#dc2626" },
            { range: 44, color: "#ea580c" },
            { range: 54, color: "#eab308" },
            { range: 74, color: "#65a30d" },
            { range: 100, color: "#15803d" },
          ].map((z, i, arr) => {
            const prev = i === 0 ? 0 : arr[i - 1].range;
            const flex = z.range - prev;
            const active = current >= prev && current <= z.range;
            return (
              <div key={i} style={{
                flex,
                background: z.color,
                opacity: active ? 1 : 0.35,
              }}/>
            );
          })}
        </div>
        {/* Marker */}
        <div style={{
          position: "absolute", top: -3, bottom: -3,
          left: `calc(${markerLeft} - 3px)`,
          width: 6,
          background: "var(--text)",
          borderRadius: 999,
          boxShadow: "0 0 0 2px var(--surface), 0 2px 6px rgba(0,0,0,0.3)",
        }}/>
      </div>
      <div className="spread" style={{ marginTop: 6, fontSize: 9.5, color: "var(--text-mute)", fontWeight: 600 }}>
        <span style={{ color: "#dc2626" }}>극공포</span>
        <span style={{ color: "#ea580c" }}>공포</span>
        <span style={{ color: "#eab308" }}>중립</span>
        <span style={{ color: "#65a30d" }}>탐욕</span>
        <span style={{ color: "#15803d" }}>극탐욕</span>
      </div>
    </div>
  );
}

// Tiny sparkline for the in-card section
function FNGInlineSpark({ data, zone }) {
  const w = 96, h = 32;
  const min = 0, max = 100;
  const xs = i => (i / (data.length - 1)) * w;
  const ys = v => h - ((v - min) / (max - min)) * h;
  const path = data.map((v, i) => `${i === 0 ? "M" : "L"} ${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`).join(" ");

  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <line x1="0" y1={ys(50)} x2={w} y2={ys(50)}
            stroke="var(--hairline-strong)" strokeWidth="1" strokeDasharray="2 3" opacity="0.5"/>
      <path d={path} fill="none" stroke={zone.color} strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={xs(data.length - 1)} cy={ys(data[data.length - 1])} r="3" fill={zone.color}/>
    </svg>
  );
}

// ─── (legacy, retained for compat) Fear & Greed Full Card ───────────────
function FearGreedCard() {
  const { history, current, yesterday, weekAgo, monthAgo } = FNG_DATA;
  const zone = fngZone(current);
  const delta = current - yesterday;

  return (
    <div className="card" style={{ padding: "16px 18px", marginBottom: 14 }}>
      {/* Header */}
      <div className="spread" style={{ marginBottom: 14 }}>
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            color: "var(--text-mute)", textTransform: "uppercase",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            공포 & 탐욕 지수
            <span style={{ color: "var(--text-mute)", fontWeight: 500, opacity: 0.7 }}>CNN</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
            <span className="num" style={{
              fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em",
              color: zone.color, lineHeight: 1,
            }}>{current}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: zone.color }}>
              {zone.label}
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600 }}>전일 대비</div>
          <div className="num" style={{
            fontSize: 14, fontWeight: 700, marginTop: 2,
            color: delta > 0 ? "var(--buy-soft)" : delta < 0 ? "var(--sell-soft)" : "var(--text-mute)",
          }}>
            {delta > 0 ? "+" : ""}{delta}
          </div>
        </div>
      </div>

      {/* Gauge */}
      <FNGGauge value={current}/>

      {/* History line */}
      <div style={{ marginTop: 14 }}>
        <FNGHistoryLine data={history}/>
        <div className="spread" style={{ marginTop: 8, fontSize: 11, color: "var(--text-mute)" }}>
          <span>30일 전: <span className="num" style={{ fontWeight: 700, color: fngZone(monthAgo).color }}>{monthAgo}</span></span>
          <span>1주 전: <span className="num" style={{ fontWeight: 700, color: fngZone(weekAgo).color }}>{weekAgo}</span></span>
          <span>현재: <span className="num" style={{ fontWeight: 700, color: zone.color }}>{current}</span></span>
        </div>
      </div>
    </div>
  );
}

// ─── Semicircular gauge ─────────────────────────────────────────────────
function FNGGauge({ value }) {
  const w = 320, h = 130;
  const cx = w / 2, cy = h - 8;
  const r = 100;
  const trackWidth = 16;

  // Five zones with stops on the semicircle (0..1)
  const zones = [
    { range: [0, 24],   color: "#dc2626" }, // Extreme Fear
    { range: [25, 44],  color: "#ea580c" }, // Fear
    { range: [45, 54],  color: "#eab308" }, // Neutral
    { range: [55, 74],  color: "#65a30d" }, // Greed
    { range: [75, 100], color: "#15803d" }, // Extreme Greed
  ];

  // 0..100 → angle in radians where 0 = π (left), 100 = 0 (right)
  const valToAngle = (v) => Math.PI - (v / 100) * Math.PI;
  const polar = (angle, radius = r) => [cx + radius * Math.cos(angle), cy - radius * Math.sin(angle)];

  // Arc path between two values
  const arcPath = (v0, v1) => {
    const a0 = valToAngle(v0);
    const a1 = valToAngle(v1);
    const [x0, y0] = polar(a0);
    const [x1, y1] = polar(a1);
    return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  };

  // Needle
  const needleAngle = valToAngle(value);
  const [nx, ny] = polar(needleAngle, r + 4);
  const [bx, by] = polar(needleAngle + Math.PI, 6); // back stub

  const zone = fngZone(value);

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 10}`} style={{ display: "block" }}>
      {/* Track */}
      {zones.map((z, i) => (
        <path key={i}
              d={arcPath(z.range[0], z.range[1])}
              fill="none" stroke={z.color} strokeWidth={trackWidth}
              strokeLinecap="butt"
              opacity={value >= z.range[0] && value <= z.range[1] ? 1 : 0.35}/>
      ))}

      {/* Tick labels */}
      {[0, 25, 50, 75, 100].map((v, i) => {
        const [tx, ty] = polar(valToAngle(v), r + 18);
        return <text key={i} x={tx} y={ty + 4} fontSize="10"
                     fill="var(--text-mute)" textAnchor="middle" fontWeight="600">{v}</text>;
      })}

      {/* Needle */}
      <g>
        <line x1={bx} y1={by} x2={nx} y2={ny}
              stroke="var(--text)" strokeWidth="3" strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r="8" fill="var(--surface-3)" stroke="var(--text)" strokeWidth="2"/>
      </g>

      {/* Center label */}
      <text x={cx} y={cy - 28} textAnchor="middle"
            fontSize="11" fill="var(--text-mute)" fontWeight="600">{zone.short}</text>
    </svg>
  );
}

// ─── F&G history line ──────────────────────────────────────────────────
function FNGHistoryLine({ data }) {
  const w = 320, h = 70;
  const min = 0, max = 100;
  const xs = (i) => (i / (data.length - 1)) * w;
  const ys = (v) => h - ((v - min) / (max - min)) * h;
  const path = data.map((v, i) => `${i === 0 ? "M" : "L"} ${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`).join(" ");
  const lastZone = fngZone(data[data.length - 1]);

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 4}`} style={{ display: "block" }}>
      {/* Zone bands */}
      <rect x="0" y={ys(75)} width={w} height={ys(100) - ys(75)} fill="#15803d" opacity="0.04"/>
      <rect x="0" y={ys(55)} width={w} height={ys(75) - ys(55)} fill="#65a30d" opacity="0.04"/>
      <rect x="0" y={ys(45)} width={w} height={ys(55) - ys(45)} fill="#eab308" opacity="0.04"/>
      <rect x="0" y={ys(25)} width={w} height={ys(45) - ys(25)} fill="#ea580c" opacity="0.04"/>
      <rect x="0" y={ys(0)}  width={w} height={ys(25) - ys(0)}  fill="#dc2626" opacity="0.04"/>

      {/* Midline */}
      <line x1="0" y1={ys(50)} x2={w} y2={ys(50)}
            stroke="var(--hairline-strong)" strokeWidth="1" strokeDasharray="2 4"/>

      {/* Line — use neutral color */}
      <path d={path} fill="none" stroke="var(--text-dim)" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={xs(data.length - 1)} cy={ys(data[data.length - 1])} r="5"
              fill={lastZone.color}/>
      <circle cx={xs(data.length - 1)} cy={ys(data[data.length - 1])} r="10"
              fill={lastZone.color} opacity="0.18"/>
    </svg>
  );
}

// ─── Daily change bars ──────────────────────────────────────────────────
function DailyChangeBars({ closes }) {
  // Compute % change between adjacent closes
  const changes = closes.slice(1).map((c, i) => ((c - closes[i]) / closes[i]) * 100);
  const maxMag = Math.max(...changes.map(Math.abs), 1);

  const w = 360, h = 130;
  const midY = h / 2;
  const barW = (w / changes.length) * 0.7;
  const gap = (w / changes.length) * 0.3;

  // Stats
  const upDays = changes.filter(c => c > 0).length;
  const downDays = changes.filter(c => c < 0).length;
  const biggest = changes.reduce((acc, c) => Math.abs(c) > Math.abs(acc) ? c : acc, 0);

  return (
    <div className="card" style={{ padding: "16px 16px 14px" }}>
      {/* Header */}
      <div className="spread" style={{ marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            전일 변동
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
            <span className="num" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em",
              color: changes[changes.length - 1] >= 0 ? "var(--buy-soft)" : "var(--sell-soft)" }}>
              {changes[changes.length - 1] >= 0 ? "+" : ""}{changes[changes.length - 1].toFixed(2)}%
            </span>
            <span style={{ fontSize: 12, color: "var(--text-mute)" }}>어제 vs 그전날</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Pill color="var(--buy-soft)" bg="var(--buy-tint)">상승 {upDays}일</Pill>
          <Pill color="var(--sell-soft)" bg="var(--sell-tint)">하락 {downDays}일</Pill>
        </div>
      </div>

      {/* Bars */}
      <svg width="100%" viewBox={`0 0 ${w} ${h + 8}`} style={{ display: "block" }}>
        {/* Zero line */}
        <line x1="0" y1={midY} x2={w} y2={midY}
              stroke="var(--hairline-strong)" strokeWidth="1"/>

        {/* Bars */}
        {changes.map((c, i) => {
          const isUp = c >= 0;
          const barH = (Math.abs(c) / maxMag) * (h / 2 - 4);
          const x = (i + 0.15) * (w / changes.length);
          const y = isUp ? midY - barH : midY;
          return (
            <rect key={i}
                  x={x.toFixed(1)} y={y.toFixed(1)}
                  width={barW.toFixed(1)} height={Math.max(barH, 1).toFixed(1)}
                  rx="2"
                  fill={isUp ? "var(--buy)" : "var(--sell)"}
                  opacity={i === changes.length - 1 ? 1 : 0.78}/>
          );
        })}

        {/* Max magnitude label */}
        <text x={w - 2} y={10} fontSize="9" fill="var(--text-mute)" textAnchor="end" fontWeight="600">
          최대 ±{maxMag.toFixed(1)}%
        </text>
      </svg>

      {/* Footer */}
      <div className="spread" style={{ marginTop: 8, fontSize: 12, color: "var(--text-mute)" }}>
        <span>30거래일</span>
        <span>
          최대 변동:&nbsp;
          <span className="num" style={{
            fontWeight: 700, color: biggest > 0 ? "var(--buy-soft)" : "var(--sell-soft)",
          }}>{biggest > 0 ? "+" : ""}{biggest.toFixed(2)}%</span>
        </span>
      </div>
    </div>
  );
}

Object.assign(window, { FNG_DATA, getFNG, fngZone, FearGreedCard, FearGreedSection, DailyChangeBars });
