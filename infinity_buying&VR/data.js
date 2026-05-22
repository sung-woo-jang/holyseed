// ─────────────────────────────────────────────────────────────────────────
// data.js — seed / mock data for the prototype
// ─────────────────────────────────────────────────────────────────────────

window.SEED = (() => {

  // TQQQ history from uploads/TQQQ_status.md
  const tqqqHistory = [
    { date: "2026-05-20", type: "buy",  label: "매수 ① ★ LOC",  price: 76.51, qty: 1,        amount: 76.51, tFrom: 5.5, tTo: 6.0, avg: 74.85, cash: 3922.94 },
    { date: "2026-05-19", type: "buy",  label: "매수 (★+평단)",  price: 72.93, qty: 2,        amount: 145.86, tFrom: 4.5, tTo: 5.5, avg: 74.70, cash: 3999.45 },
    { date: "2026-05-18", type: "buy",  label: "매수 (★+평단)",  price: 74.32, qty: 2,        amount: 148.64, tFrom: 3.5, tTo: 4.5, avg: 75.10, cash: 4145.31 },
    { date: "2025-05-15", type: "buy",  label: "매수 ② 평단 LOC", price: 75.34, qty: 1,        amount: 75.34, tFrom: 3.0, tTo: 3.5, avg: 75.34, cash: 4293.95 },
    { date: "2025-05-14", type: "buy",  label: "매수 ① ★ LOC",   price: 78.95, qty: 1,        amount: 78.95, tFrom: 2.5, tTo: 3.0, avg: 75.34, cash: 4369.29 },
    { date: "2025-05-13", type: "buy",  label: "매수 ① ★ LOC",   price: 77.24, qty: 1,        amount: 77.24, tFrom: 2.0, tTo: 2.5, avg: 74.57, cash: 4448.24 },
    { date: "2025-05-11", type: "buy",  label: "매수 ① ★ LOC",   price: 76.96, qty: 1,        amount: 76.96, tFrom: 1.5, tTo: 2.0, avg: 73.85, cash: 4525.48 },
    { date: "2025-05-08", type: "buy",  label: "매수 ① ★ LOC",   price: 76.28, qty: 1,        amount: 76.28, tFrom: 1.0, tTo: 1.5, avg: 72.71, cash: 4602.44 },
    { date: "2025-05-07", type: "buy",  label: "매수 ① ★ LOC",   price: 71.34, qty: 1,        amount: 71.34, tFrom: 0.5, tTo: 1.0, avg: 70.63, cash: 4678.72 },
    { date: "2025-05-06", type: "buy",  label: "사이클 시작 매수", price: 69.63, qty: 0.717169, amount: 49.94, tFrom: 0,   tTo: 0.5, avg: 69.63, cash: 4750.06 },
  ];

  // SOXL — a contrived state for variety
  const soxlHistory = [
    { date: "2026-05-20", type: "sell", label: "쿼터매도 LOC",  price: 24.18, qty: 3,  amount: 72.54, tFrom: 22.0, tTo: 16.5, avg: 21.05, cash: 1640.20 },
    { date: "2026-05-19", type: "buy",  label: "매수 ① ★ LOC",  price: 19.42, qty: 5,  amount: 97.10, tFrom: 21.5, tTo: 22.0, avg: 21.05, cash: 1567.66 },
    { date: "2026-05-18", type: "buy",  label: "매수 ① ★ LOC",  price: 19.88, qty: 5,  amount: 99.40, tFrom: 21.0, tTo: 21.5, avg: 21.13, cash: 1664.76 },
    { date: "2026-05-15", type: "buy",  label: "매수 ① ★ LOC",  price: 20.34, qty: 5,  amount: 101.70, tFrom: 20.5, tTo: 21.0, avg: 21.18, cash: 1764.16 },
    { date: "2026-05-14", type: "buy",  label: "매수 ① ★ LOC",  price: 20.71, qty: 5,  amount: 103.55, tFrom: 20.0, tTo: 20.5, avg: 21.21, cash: 1865.86 },
  ];

  // Sparkline data — close prices for last 30 days
  const tqqqCloses = [
    78.20, 79.10, 77.60, 76.90, 78.20, 79.50, 80.10, 78.80, 77.40, 76.20,
    75.10, 74.30, 73.80, 72.90, 73.50, 75.10, 76.20, 75.80, 74.10, 73.30,
    72.40, 73.80, 75.10, 76.20, 75.34, 75.34, 76.51, 74.32, 72.93, 76.51,
  ];
  const tqqqAvgLine = [
    69.63, 70.63, 71.20, 71.80, 72.10, 72.45, 72.71, 73.20, 73.50, 73.85,
    74.10, 74.30, 74.45, 74.57, 74.80, 75.10, 75.34, 75.34, 75.34, 75.34,
    75.34, 75.34, 75.10, 75.10, 75.10, 75.10, 74.85, 74.85, 74.70, 74.85,
  ];
  const tqqqT = [
    0.0, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.3, 1.5,
    1.7, 1.9, 2.0, 2.2, 2.4, 2.5, 2.8, 3.0, 3.2, 3.3,
    3.4, 3.5, 4.0, 4.2, 4.5, 4.5, 4.5, 5.5, 5.5, 6.0,
  ];

  // The "live state" used by dashboard cards
  const tqqq = {
    id: "tqqq",
    ticker: "TQQQ",
    name: "ProShares UltraPro QQQ",
    division: 40,
    principal: 4800.00,
    cycle: 1,
    mode: "first_half", // 'cycle_start' | 'first_half' | 'second_half' | 'reverse'
    t: 6.0,
    avg: 74.85,
    quantityRaw: 11.717169,
    cash: 3922.94,
    lastClose: 76.51,
    closes: tqqqCloses,
    avgLine: tqqqAvgLine,
    tLine: tqqqT,
    starPct: 10.5,
    starPrice: 82.71,
    locBuy: 82.70,
    locSell: 82.71,
    sellFixed: 86.08, // 15%
    onceAmount: 115.38,
    fetchedAt: "2026-05-21 08:42",
    history: tqqqHistory,
    recentCloses: [null, null, 74.32, 72.93, 76.51],
  };

  const soxl = {
    id: "soxl",
    ticker: "SOXL",
    name: "Direxion Daily Semiconductors Bull 3X",
    division: 40,
    principal: 2200.00,
    cycle: 1,
    mode: "second_half",
    t: 22.0,
    avg: 21.05,
    quantityRaw: 14.0,
    cash: 1640.20,
    lastClose: 22.46,
    closes: [25.10, 24.80, 24.20, 23.50, 22.90, 22.50, 21.80, 21.20, 20.50, 20.10,
             19.80, 20.30, 20.71, 20.34, 19.88, 19.42, 20.10, 20.80, 21.50, 22.10,
             22.46, 22.46, 22.46, 22.46, 22.46, 22.46, 22.46, 22.46, 22.46, 22.46],
    starPct: -2.0, // 20 - 22 = -2
    starPrice: 20.63, // 21.05 × (1 + -0.02)
    locBuy: 20.62,
    locSell: 20.63,
    sellFixed: 25.26, // 20%
    onceAmount: 91.12, // 1640.20 / (40-22)
    fetchedAt: "2026-05-21 08:42",
    history: soxlHistory,
    recentCloses: [22.46, 22.10, 21.50, 20.80, 20.10],
  };

  // A reverse-mode example (shown when user toggles)
  const reverseSample = {
    id: "tqqq",
    ticker: "TQQQ",
    name: "ProShares UltraPro QQQ",
    division: 40,
    principal: 4800.00,
    cycle: 1,
    mode: "reverse",
    t: 41.2,
    avg: 82.40,
    quantityRaw: 34.0,
    cash: 280.50,
    lastClose: 58.20,
    closes: tqqqCloses.map(v => v * 0.78),
    starPct: null,
    starPrice: 60.18, // 5-day avg
    locBuy: 60.17,
    locSell: 60.18,
    sellFixed: null,
    onceAmount: null,
    fetchedAt: "2026-05-21 08:42",
    history: tqqqHistory,
    recentCloses: [62.10, 60.40, 58.80, 60.50, 58.20],
    reverseExit: 82.40 * 0.85, // $70.04
  };

  const cycleStartSample = {
    id: "tqqq",
    ticker: "TQQQ",
    name: "ProShares UltraPro QQQ",
    division: 40,
    principal: 4800.00,
    cycle: 2,
    mode: "cycle_start",
    t: 0,
    avg: null,
    quantityRaw: 0,
    cash: 4800.00,
    lastClose: 78.40,
    closes: tqqqCloses,
    starPct: 15.0,
    starPrice: null,
    locBuy: 86.24, // 78.40 × 1.10
    locSell: null,
    sellFixed: null,
    onceAmount: 120.00, // 4800 / 40
    fetchedAt: "2026-05-21 08:42",
    history: [],
    recentCloses: [],
  };

  // Large-number-buy variant (gap > 15%)
  const largeNumberSample = {
    ...tqqq,
    lastClose: 62.00,
    largeNumberBuy: {
      gapPct: 35,
      suggested: 71.30,
    },
  };

  // Cycle-end sample
  const cycleEndSample = {
    ...tqqq,
    quantityRaw: 0,
    profit: 612.40,
    profitPct: 12.8,
    newCash: 5412.40,
  };

  return {
    tqqq, soxl, reverseSample, cycleStartSample, largeNumberSample, cycleEndSample,
    user: { email: "sigma@trader.kr", name: "라오어 운용 1호" },
  };
})();
