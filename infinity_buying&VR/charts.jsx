// ─────────────────────────────────────────────────────────────────────────
// charts.jsx — Price + RSI chart panels (card-level and detail-level)
// ─────────────────────────────────────────────────────────────────────────

// ─── RSI computation ────────────────────────────────────────────────────
function computeRSI(closes, period = 14) {
  if (!closes || closes.length < period + 1) return closes.map(() => 50);
  const rsi = new Array(closes.length).fill(null);
  let gainSum = 0, lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gainSum += d; else lossSum -= d;
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  rsi[period] = 100 - 100 / (1 + (avgLoss === 0 ? 100 : avgGain / avgLoss));
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    const gain = d > 0 ? d : 0;
    const loss = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rsi[i] = 100 - 100 / (1 + (avgLoss === 0 ? 100 : avgGain / avgLoss));
  }
  // Backfill leading nulls with the first valid value so we still draw a line
  const first = rsi.find(v => v !== null) ?? 50;
  for (let i = 0; i < rsi.length; i++) if (rsi[i] === null) rsi[i] = first;
  return rsi;
}

function rsiColor(v) {
  if (v >= 70) return "var(--sell-soft)";
  if (v <= 30) return "var(--buy-soft)";
  return "var(--text-dim)";
}

function rsiLabel(v) {
  if (v >= 70) return "과매수";
  if (v <= 30) return "과매도";
  return "중립";
}

// ─── RSI Pill (used in card header) ──────────────────────────────────────
function RSIPill({ value }) {
  const color = rsiColor(value);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 999,
      background: `color-mix(in oklab, ${color} 14%, transparent)`,
      border: `1px solid color-mix(in oklab, ${color} 28%, transparent)`,
      color,
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em" }}>RSI</span>
      <span className="num" style={{ fontSize: 12, fontWeight: 800 }}>{value.toFixed(1)}</span>
    </span>
  );
}

// ─── Combined Price + RSI Panel (dashboard card) ─────────────────────────
function ChartPanel({
  closes, rsi, avgPrice, starPrice, accent = "var(--gold)",
  width = 360, priceH = 96, rsiH = 56,
}) {
  // Layout
  const w = width;
  const padBottom = 16; // for x-axis labels
  const min = Math.min(...closes, avgPrice || Infinity, starPrice || Infinity) * 0.985;
  const max = Math.max(...closes, avgPrice || -Infinity, starPrice || -Infinity) * 1.015;
  const span = max - min || 1;
  const stepX = w / (closes.length - 1);
  const xs = i => i * stepX;
  const ys = v => priceH - 4 - ((v - min) / span) * (priceH - 8);

  const linePath = closes.map((v, i) => `${i === 0 ? "M" : "L"} ${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`).join(" ");
  const areaPath = linePath + ` L ${xs(closes.length - 1)} ${priceH} L 0 ${priceH} Z`;

  const lastIdx = closes.length - 1;
  const lastX = xs(lastIdx);
  const lastY = ys(closes[lastIdx]);

  // RSI
  const rsiYs = v => priceH + 8 + (100 - v) / 100 * (rsiH - 12);
  const rsiPath = rsi.map((v, i) => `${i === 0 ? "M" : "L"} ${xs(i).toFixed(1)} ${rsiYs(v).toFixed(1)}`).join(" ");
  const rsiLast = rsi[rsi.length - 1];

  // Color RSI fill below 30 / above 70
  const overboughtY = rsiYs(70);
  const oversoldY = rsiYs(30);

  const totalH = priceH + rsiH + padBottom;
  const gradId = `ch-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${totalH}`} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={accent} stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* ─── Price area ─── */}
      {/* Horizontal grid */}
      {[0.3, 0.7].map((t, i) => (
        <line key={i} x1="0" y1={priceH * t} x2={w} y2={priceH * t}
              stroke="var(--hairline)" strokeWidth="1" strokeDasharray="2 4" opacity="0.5"/>
      ))}

      {/* Star (별지점) reference line */}
      {starPrice != null && starPrice > min && starPrice < max && (
        <g>
          <line x1="0" y1={ys(starPrice)} x2={w - 56} y2={ys(starPrice)}
                stroke="var(--gold)" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.7"/>
          <rect x={w - 54} y={ys(starPrice) - 9} width="54" height="18" rx="9"
                fill="color-mix(in oklab, var(--gold) 22%, var(--bg))"
                stroke="color-mix(in oklab, var(--gold) 40%, transparent)" strokeWidth="1"/>
          <text x={w - 27} y={ys(starPrice) + 4} fontSize="10"
                fill="var(--gold-soft)" textAnchor="middle" fontWeight="700">
            ★ {fmtUSD(starPrice)}
          </text>
        </g>
      )}

      {/* Avg (평단) reference line */}
      {avgPrice != null && avgPrice > min && avgPrice < max && (
        <g>
          <line x1="0" y1={ys(avgPrice)} x2={w} y2={ys(avgPrice)}
                stroke="var(--cyan)" strokeWidth="1" strokeDasharray="2 3" opacity="0.55"/>
        </g>
      )}

      {/* Area + line */}
      <path d={areaPath} fill={`url(#${gradId})`}/>
      <path d={linePath} fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Last point */}
      <circle cx={lastX} cy={lastY} r="4" fill={accent}/>
      <circle cx={lastX} cy={lastY} r="8" fill={accent} opacity="0.18"/>

      {/* ─── RSI area ─── */}
      <line x1="0" y1={priceH + 4} x2={w} y2={priceH + 4} stroke="var(--hairline)" strokeWidth="1"/>

      {/* Overbought / oversold bands */}
      <rect x="0" y={rsiYs(100)} width={w} height={rsiYs(70) - rsiYs(100)}
            fill="var(--sell)" opacity="0.06"/>
      <rect x="0" y={rsiYs(30)} width={w} height={rsiYs(0) - rsiYs(30)}
            fill="var(--buy)" opacity="0.06"/>

      {/* 70/30 ref lines */}
      <line x1="0" y1={overboughtY} x2={w} y2={overboughtY}
            stroke="var(--sell)" strokeWidth="1" strokeDasharray="3 3" opacity="0.45"/>
      <line x1="0" y1={oversoldY} x2={w} y2={oversoldY}
            stroke="var(--buy)" strokeWidth="1" strokeDasharray="3 3" opacity="0.45"/>

      {/* Labels */}
      <text x="4" y={overboughtY - 3} fontSize="8.5" fill="var(--sell-soft)" fontWeight="700">70</text>
      <text x="4" y={oversoldY + 10} fontSize="8.5" fill="var(--buy-soft)" fontWeight="700">30</text>

      {/* RSI line */}
      <path d={rsiPath} fill="none" stroke={rsiColor(rsiLast)} strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={xs(rsi.length - 1)} cy={rsiYs(rsiLast)} r="3" fill={rsiColor(rsiLast)}/>
    </svg>
  );
}

// ─── Large detail-page chart with crosshair + tooltip-like callout ──────
function DetailPriceChart({ closes, avgLine, starPrice, height = 200 }) {
  const w = 360, h = height;
  const all = [...closes, ...(avgLine || []), starPrice].filter(v => v != null);
  const min = Math.min(...all) * 0.985;
  const max = Math.max(...all) * 1.015;
  const span = max - min;
  const xs = (i) => (i / (closes.length - 1)) * w;
  const ys = (v) => h - ((v - min) / span) * h;

  const linePath = closes.map((v, i) => `${i === 0 ? "M" : "L"} ${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`).join(" ");
  const areaPath = linePath + ` L ${w} ${h} L 0 ${h} Z`;
  const avgPath = avgLine ? avgLine.map((v, i) => `${i === 0 ? "M" : "L"} ${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`).join(" ") : "";

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 8}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="dpcFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((t, i) => (
        <line key={i} x1="0" y1={h * t} x2={w} y2={h * t}
              stroke="var(--hairline)" strokeWidth="1" strokeDasharray="2 4" opacity="0.6"/>
      ))}
      {/* Star line */}
      {starPrice && starPrice > min && starPrice < max && (
        <g>
          <line x1="0" y1={ys(starPrice)} x2={w - 70} y2={ys(starPrice)}
                stroke="var(--gold-soft)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.65"/>
          <rect x={w - 70} y={ys(starPrice) - 11} width="70" height="22" rx="11"
                fill="color-mix(in oklab, var(--gold) 24%, var(--bg))"
                stroke="color-mix(in oklab, var(--gold) 44%, transparent)" strokeWidth="1"/>
          <text x={w - 35} y={ys(starPrice) + 5} fontSize="11"
                fill="var(--gold-soft)" textAnchor="middle" fontWeight="700">
            ★ {fmtUSD(starPrice)}
          </text>
        </g>
      )}
      <path d={areaPath} fill="url(#dpcFill)"/>
      {avgLine && (
        <path d={avgPath} fill="none" stroke="var(--cyan)" strokeWidth="2"
              strokeDasharray="4 4" strokeLinecap="round"/>
      )}
      <path d={linePath} fill="none" stroke="var(--gold)" strokeWidth="2.6"
            strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={xs(closes.length - 1)} cy={ys(closes[closes.length - 1])} r="5" fill="var(--gold)"/>
      <circle cx={xs(closes.length - 1)} cy={ys(closes[closes.length - 1])} r="11" fill="var(--gold)" opacity="0.18"/>
    </svg>
  );
}

// ─── Stand-alone RSI panel (detail page) ────────────────────────────────
function DetailRSIPanel({ rsi, height = 100 }) {
  const w = 360, h = height;
  const xs = (i) => (i / (rsi.length - 1)) * w;
  const ys = (v) => h - (v / 100) * h;
  const path = rsi.map((v, i) => `${i === 0 ? "M" : "L"} ${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`).join(" ");
  const last = rsi[rsi.length - 1];

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 4}`} style={{ display: "block" }}>
      {/* Bands */}
      <rect x="0" y={ys(100)} width={w} height={ys(70) - ys(100)} fill="var(--sell)" opacity="0.08"/>
      <rect x="0" y={ys(30)} width={w} height={ys(0) - ys(30)} fill="var(--buy)" opacity="0.08"/>

      {/* 50 midline */}
      <line x1="0" y1={ys(50)} x2={w} y2={ys(50)}
            stroke="var(--hairline)" strokeWidth="1" strokeDasharray="2 4"/>

      {/* 70/30 ref lines */}
      <line x1="0" y1={ys(70)} x2={w} y2={ys(70)}
            stroke="var(--sell)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6"/>
      <line x1="0" y1={ys(30)} x2={w} y2={ys(30)}
            stroke="var(--buy)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6"/>

      {/* Labels */}
      <text x="6" y={ys(70) - 4} fontSize="10" fill="var(--sell-soft)" fontWeight="700">70 과매수</text>
      <text x="6" y={ys(30) + 12} fontSize="10" fill="var(--buy-soft)" fontWeight="700">30 과매도</text>
      <text x={w - 4} y={ys(50) - 3} fontSize="9" fill="var(--text-mute)" textAnchor="end">50</text>

      {/* RSI line */}
      <path d={path} fill="none" stroke={rsiColor(last)} strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={xs(rsi.length - 1)} cy={ys(last)} r="5" fill={rsiColor(last)}/>
      <circle cx={xs(rsi.length - 1)} cy={ys(last)} r="11" fill={rsiColor(last)} opacity="0.2"/>
    </svg>
  );
}

Object.assign(window, {
  computeRSI, rsiColor, rsiLabel,
  RSIPill, ChartPanel, DetailPriceChart, DetailRSIPanel,
});
