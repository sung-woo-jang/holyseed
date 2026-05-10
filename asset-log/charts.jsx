// charts.jsx — SVG chart components: line, donut, waterfall, bar

function LineChart({ data, width = 327, height = 180, color = '#3182F6', dark = false, interactive = true }) {
  if (!data || data.length === 0) return null;
  const padding = { top: 18, right: 44, bottom: 24, left: 8 };
  const w = width - padding.left - padding.right;
  const h = height - padding.top - padding.bottom;
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * w;
    const y = padding.top + h - ((d.value - min) / range) * h;
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const areaD = `${pathD} L${points[points.length-1].x},${padding.top + h} L${points[0].x},${padding.top + h} Z`;

  const gradId = `g-${Math.random().toString(36).slice(2, 7)}`;
  const gridColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const labelColor = dark ? 'rgba(255,255,255,0.4)' : '#8B95A1';

  const [hoverIdx, setHoverIdx] = React.useState(null);
  const svgRef = React.useRef(null);

  const onMove = (e) => {
    if (!interactive || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * (width / rect.width);
    const rel = (x - padding.left) / w;
    const idx = Math.max(0, Math.min(data.length - 1, Math.round(rel * (data.length - 1))));
    setHoverIdx(idx);
  };

  // Y-axis labels (3 ticks: max, mid, min)
  const yTicks = [
    { y: padding.top, value: max },
    { y: padding.top + h / 2, value: (max + min) / 2 },
    { y: padding.top + h, value: min },
  ];

  const hp = hoverIdx != null ? points[hoverIdx] : null;

  return (
    <svg ref={svgRef} width={width} height={height} style={{ display: 'block', touchAction: 'none' }}
      onMouseMove={onMove} onMouseLeave={() => setHoverIdx(null)}
      onTouchMove={onMove} onTouchEnd={() => setHoverIdx(null)}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padding.left} x2={padding.left + w} y1={t.y} y2={t.y}
            stroke={gridColor} strokeWidth="1" strokeDasharray="2 4" />
          <text x={width - 4} y={t.y + 3} fontSize="10" fill={labelColor}
            textAnchor="end" fontFamily="-apple-system, system-ui">
            {KRW_SHORT(t.value)}
          </text>
        </g>
      ))}
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 4 : 0}
          fill={color} stroke={dark ? '#191F28' : '#fff'} strokeWidth="2" />
      ))}
      {data.length > 0 && [0, Math.floor(data.length / 4), Math.floor(data.length / 2), Math.floor(data.length * 3/4), data.length - 1].map((i, k) => {
        const d = data[i].date;
        const label = d.length > 7 ? d.slice(0, 7) : d;
        return (
          <text key={k} x={padding.left + (i / (data.length - 1)) * w} y={height - 6}
            textAnchor="middle" fontSize="9.5" fill={labelColor}
            fontFamily="-apple-system, system-ui">{label.slice(2)}</text>
        );
      })}
      {hp && (
        <g style={{ pointerEvents: 'none' }}>
          <line x1={hp.x} x2={hp.x} y1={padding.top} y2={padding.top + h}
            stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          <circle cx={hp.x} cy={hp.y} r="6" fill={color}
            stroke={dark ? '#191F28' : '#fff'} strokeWidth="2.5" />
          <g transform={`translate(${Math.max(8, Math.min(width - 110, hp.x - 50))}, ${Math.max(2, hp.y - 38)})`}>
            <rect width="100" height="32" rx="6"
              fill={dark ? '#0F1115' : '#191F28'} opacity="0.95" />
            <text x="50" y="13" textAnchor="middle" fontSize="9.5"
              fill="rgba(255,255,255,0.6)" fontFamily="-apple-system, system-ui">{hp.date}</text>
            <text x="50" y="26" textAnchor="middle" fontSize="11" fontWeight="700"
              fill="#fff" fontFamily="-apple-system, system-ui">{KRW(hp.value)}</text>
          </g>
        </g>
      )}
    </svg>
  );
}

function DonutChart({ data, size = 180, thickness = 22, dark = false }) {
  const total = data.reduce((s, d) => s + Math.abs(d.value), 0) || 1;
  const r = size / 2 - thickness / 2;
  const cx = size / 2, cy = size / 2;
  let cumulative = 0;
  const arcs = data.map(d => {
    const frac = Math.abs(d.value) / total;
    const start = cumulative;
    cumulative += frac;
    const end = cumulative;
    const startAngle = start * 2 * Math.PI - Math.PI / 2;
    const endAngle = end * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = frac > 0.5 ? 1 : 0;
    return {
      d: `M${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2}`,
      color: d.color, frac, ...d,
    };
  });
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={dark ? 'rgba(255,255,255,0.06)' : '#F2F4F6'} strokeWidth={thickness} />
      {arcs.map((a, i) => (
        <path key={i} d={a.d} fill="none" stroke={a.color}
          strokeWidth={thickness} strokeLinecap="butt" />
      ))}
    </svg>
  );
}

function WaterfallChart({ data, width = 327, height = 240, dark = false }) {
  // data: [{label, value}], [0]=작년 total, middle=contributions, [last]=올해 total.
  // Use a broken-axis: the two totals are full-height anchor bars (e.g. 70% of h),
  // contributions are scaled vs MAX CONTRIBUTION (not vs total) so they're readable.
  const padding = { top: 38, right: 8, bottom: 56, left: 8 };
  const w = width - padding.left - padding.right;
  const h = height - padding.top - padding.bottom;

  const start = data[0].value;
  const end = data[data.length - 1].value;
  const contribs = data.slice(1, -1);
  const maxContrib = Math.max(...contribs.map(c => Math.abs(c.value))) || 1;

  // total bars: full height
  const totalH = h;
  // contribution bars: scaled to half h max
  const contribMaxH = h * 0.55;

  const n = data.length;
  const stepX = w / n;
  const barW = stepX * 0.62;
  const gap = stepX * 0.38;

  const labelColor = dark ? 'rgba(255,255,255,0.5)' : '#8B95A1';
  const valColor = dark ? '#fff' : '#191F28';
  const baselineY = padding.top + h - 1;

  // Pre-compute geometry
  const cells = data.map((d, i) => {
    const x = padding.left + i * stepX + gap / 2;
    if (i === 0 || i === n - 1) {
      const yTop = padding.top + h - totalH;
      return { x, w: barW, yTop, yBot: padding.top + h, value: d.value, label: d.label, type: 'total' };
    }
    const v = d.value;
    const barH = (Math.abs(v) / maxContrib) * contribMaxH;
    // pos bars sit on baseline going up; neg bars hang below
    if (v >= 0) {
      return { x, w: barW, yTop: baselineY - barH, yBot: baselineY, value: v, label: d.label, type: 'pos' };
    }
    return { x, w: barW, yTop: baselineY, yBot: baselineY + barH, value: v, label: d.label, type: 'neg' };
  });

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      {/* baseline */}
      <line x1={padding.left} x2={padding.left + w} y1={baselineY} y2={baselineY}
        stroke={dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} strokeWidth="1" />

      {cells.map((c, i) => {
        const color = c.type === 'total' ? '#3182F6' : c.type === 'pos' ? '#0AB39C' : '#EF4444';
        const barH = c.yBot - c.yTop;
        const isTotal = c.type === 'total';
        return (
          <g key={i}>
            <rect x={c.x} y={c.yTop} width={c.w} height={Math.max(3, barH)}
              rx="3" fill={color} opacity={isTotal ? 1 : 0.9} />
            {/* value label — above for pos/total, below for neg */}
            <text x={c.x + c.w / 2}
              y={c.type === 'neg' ? c.yBot + 13 : c.yTop - 7}
              textAnchor="middle" fontSize="10.5"
              fill={isTotal ? valColor : color} fontWeight="700"
              fontFamily="-apple-system, system-ui">
              {isTotal ? KRW_SHORT(c.value) : (c.value > 0 ? '+' : '') + KRW_SHORT(c.value)}
            </text>
            {/* x-axis label */}
            <text x={c.x + c.w / 2} y={padding.top + h + 32}
              textAnchor="middle" fontSize="9.5"
              fill={labelColor} fontFamily="-apple-system, system-ui">{c.label}</text>
          </g>
        );
      })}

      {/* legend hint at top */}
      <text x={padding.left} y={14} fontSize="9.5" fill={labelColor}
        fontFamily="-apple-system, system-ui">
        총자산 (전체 높이)
      </text>
      <text x={padding.left + w} y={14} fontSize="9.5" fill={labelColor}
        textAnchor="end" fontFamily="-apple-system, system-ui">
        기여도 (실제 비율)
      </text>
    </svg>
  );
}

function HBar({ value, max, color, height = 8, dark = false }) {
  const pct = Math.min(100, (Math.abs(value) / max) * 100);
  return (
    <div style={{
      width: '100%', height, borderRadius: height / 2,
      background: dark ? 'rgba(255,255,255,0.06)' : '#F2F4F6', overflow: 'hidden',
    }}>
      <div style={{
        width: `${pct}%`, height: '100%', background: color, borderRadius: height / 2,
      }} />
    </div>
  );
}

Object.assign(window, { LineChart, DonutChart, WaterfallChart, HBar });
