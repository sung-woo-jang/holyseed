// data.jsx — dummy data + helpers (5 years of data)

const KRW = (n) => {
  if (n == null || isNaN(n)) return '0원';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(Math.round(n));
  return sign + abs.toLocaleString('ko-KR') + '원';
};

const KRW_SHORT = (n) => {
  if (n == null || isNaN(n)) return '0';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1e8) return sign + (abs / 1e8).toFixed(2).replace(/\.?0+$/, '') + '억';
  if (abs >= 1e4) return sign + Math.round(abs / 1e4).toLocaleString() + '만';
  return sign + abs.toLocaleString();
};

const PCT = (n, digits = 1) => {
  if (n == null || isNaN(n)) return '0%';
  const sign = n > 0 ? '+' : '';
  return sign + n.toFixed(digits) + '%';
};

// Generate 60 months (5 years) of net worth history
function genMonthly(startVal, endVal, startYearMonth = '2021-05') {
  const result = [];
  const [sy, sm] = startYearMonth.split('-').map(Number);
  const months = 60;
  for (let i = 0; i < months; i++) {
    const y = sy + Math.floor((sm - 1 + i) / 12);
    const m = ((sm - 1 + i) % 12) + 1;
    const date = `${y}-${String(m).padStart(2, '0')}`;
    // exponential-ish growth with noise
    const t = i / (months - 1);
    const base = startVal + (endVal - startVal) * (Math.pow(t, 0.85));
    const noise = (Math.sin(i * 1.3) + Math.cos(i * 0.7)) * (endVal - startVal) * 0.012;
    result.push({ date, value: Math.round((base + noise) / 100000) * 100000 });
  }
  return result;
}

// Generate transactions across 5 years
function genTxs() {
  const txs = [];
  let id = 1;
  const cats = [
    { name: '식비', icon: '🍚', range: [15000, 120000], freq: 0.7 },
    { name: '교통', icon: '🚇', range: [3000, 80000], freq: 0.4 },
    { name: '쇼핑', icon: '🛍️', range: [25000, 350000], freq: 0.25 },
    { name: '여가', icon: '🎬', range: [12000, 180000], freq: 0.3 },
    { name: '의료', icon: '💊', range: [8000, 250000], freq: 0.1 },
    { name: '교육', icon: '📚', range: [50000, 400000], freq: 0.08 },
    { name: '기타', icon: '💸', range: [5000, 100000], freq: 0.2 },
  ];
  const titles = {
    '식비': ['주말 장보기', '동료 점심', '외식', '편의점', '배달음식', '카페', '주말 외식'],
    '교통': ['지하철', '주유', '택시', '하이패스 충전'],
    '쇼핑': ['의류 쇼핑', '생필품', '쿠팡', '온라인 주문'],
    '여가': ['영화', '공연', '여행', '북카페', '게임'],
    '의료': ['병원', '약국', '치과'],
    '교육': ['도서', '강의', '학원비'],
    '기타': ['선물', '경조사', '기부', '잡화'],
  };

  // 60 months
  for (let mi = 0; mi < 60; mi++) {
    const y = 2021 + Math.floor((4 + mi) / 12);
    const m = ((4 + mi) % 12) + 1;
    const dim = new Date(y, m, 0).getDate();

    // 월급 (매월 25일)
    const baseSalary = 4000000 + mi * 8000;
    txs.push({ id: 't' + (id++), date: `${y}-${String(m).padStart(2, '0')}-25`,
      type: 'INCOME', amount: baseSalary, category: '급여', title: `${m}월 급여`, to: 'a1' });

    // 정기지출 자동
    txs.push({ id: 't' + (id++), date: `${y}-${String(m).padStart(2, '0')}-01`,
      type: 'EXPENSE', amount: 13900, category: '구독', title: 'Spotify Family', from: 'a1', auto: true });
    txs.push({ id: 't' + (id++), date: `${y}-${String(m).padStart(2, '0')}-05`,
      type: 'EXPENSE', amount: 95000, category: '보험료', title: '실손보험', from: 'a1', auto: true });
    txs.push({ id: 't' + (id++), date: `${y}-${String(m).padStart(2, '0')}-15`,
      type: 'EXPENSE', amount: 850000, category: '주거', title: '월세', from: 'a1', auto: true });
    txs.push({ id: 't' + (id++), date: `${y}-${String(m).padStart(2, '0')}-17`,
      type: 'EXPENSE', amount: 13500, category: '구독', title: '넷플릭스', from: 'a1', auto: true });
    txs.push({ id: 't' + (id++), date: `${y}-${String(m).padStart(2, '0')}-25`,
      type: 'EXPENSE', amount: 280000 + Math.round(Math.sin(mi) * 80000),
      category: '주거', title: `${m}월 관리비`, memo: '전기 320kWh / 가스 18㎥', from: 'a1', auto: true });

    // 변동 거래 (월별 8~16건)
    const numVar = 10 + Math.floor((Math.sin(mi * 1.3) + 1) * 3);
    for (let k = 0; k < numVar; k++) {
      const cat = cats[Math.floor(Math.abs(Math.sin(mi * 7 + k * 3)) * cats.length) % cats.length];
      const day = Math.max(1, Math.min(dim, Math.floor(Math.abs(Math.cos(mi * 5 + k * 11)) * dim) + 1));
      const amt = Math.round((cat.range[0] + Math.abs(Math.sin(mi + k * 2)) * (cat.range[1] - cat.range[0])) / 1000) * 1000;
      const titleArr = titles[cat.name];
      const title = titleArr[k % titleArr.length];
      txs.push({ id: 't' + (id++), date: `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        type: 'EXPENSE', amount: amt, category: cat.name, title, from: 'a1' });
    }

    // 분기마다 배당
    if (m % 3 === 0) {
      txs.push({ id: 't' + (id++), date: `${y}-${String(m).padStart(2, '0')}-03`,
        type: 'INCOME', amount: 350000 + Math.floor(Math.random() * 200000),
        category: '투자수익', title: '분기 배당금', to: 'a5' });
    }
  }
  return txs.sort((a, b) => b.date.localeCompare(a.date));
}

// Yearly comparison (5 years)
const YEARLY_NETWORTH = [
  { year: 2021, value: 215000000 },
  { year: 2022, value: 268000000 },
  { year: 2023, value: 312000000 },
  { year: 2024, value: 367200000 },
  { year: 2025, value: 412500000 },
];

const YEARLY_CONTRIB = {
  2025: [
    { category: '주식·ETF', value: 18500000, color: '#3182F6' },
    { category: '예적금', value: 12300000, color: '#0AB39C' },
    { category: '부동산', value: 8500000, color: '#F59E0B' },
    { category: '코인', value: 4200000, color: '#A78BFA' },
    { category: '연금', value: 3100000, color: '#EC4899' },
    { category: '부채상환', value: -1300000, color: '#94A3B8' },
  ],
  2024: [
    { category: '주식·ETF', value: 22000000, color: '#3182F6' },
    { category: '예적금', value: 15800000, color: '#0AB39C' },
    { category: '부동산', value: 12000000, color: '#F59E0B' },
    { category: '코인', value: 1500000, color: '#A78BFA' },
    { category: '연금', value: 2800000, color: '#EC4899' },
    { category: '부채상환', value: 1100000, color: '#94A3B8' },
  ],
  2023: [
    { category: '주식·ETF', value: 14000000, color: '#3182F6' },
    { category: '예적금', value: 18200000, color: '#0AB39C' },
    { category: '부동산', value: 5000000, color: '#F59E0B' },
    { category: '코인', value: -2300000, color: '#A78BFA' },
    { category: '연금', value: 2600000, color: '#EC4899' },
    { category: '부채상환', value: 6500000, color: '#94A3B8' },
  ],
  2022: [
    { category: '주식·ETF', value: 19500000, color: '#3182F6' },
    { category: '예적금', value: 22000000, color: '#0AB39C' },
    { category: '부동산', value: 8000000, color: '#F59E0B' },
    { category: '코인', value: -3500000, color: '#A78BFA' },
    { category: '연금', value: 2400000, color: '#EC4899' },
    { category: '부채상환', value: 4600000, color: '#94A3B8' },
  ],
};

const _allTx = genTxs();
const _monthly = genMonthly(215000000, 412500000, '2021-05');

const DUMMY_PERSONAS = {
  couple30: {
    name: '30대 부부',
    households: [
      { id: 'h1', name: '우리집', icon: '🏡' },
      { id: 'h2', name: '부모님댁', icon: '👨‍👩‍👧' },
    ],
    activeHouseholdId: 'h1',
    members: [
      { id: 'u1', name: '김토스', role: 'OWNER', avatar: '#3182F6', initial: '김', joined: '2024-01-15' },
      { id: 'u2', name: '이토스', role: 'EDITOR', avatar: '#FF6B6B', initial: '이', joined: '2024-01-20' },
      { id: 'u3', name: '아버지', role: 'VIEWER', avatar: '#8E44AD', initial: '父', joined: '2024-08-12' },
    ],
    netWorth: {
      current: 412500000,
      lastYear: 367200000,
      snapshotDate: '2026-04-29',
      monthlyHistory: _monthly,
      yearly: YEARLY_NETWORTH,
    },
    yearlyContrib: YEARLY_CONTRIB,
    contributions: YEARLY_CONTRIB[2025],
    assets: [
      { id: 'a1', name: '신한 주거래 통장', category: '현금성', value: 28500000, currency: 'KRW', delta: 1200000, deltaPct: 4.4 },
      { id: 'a2', name: '카카오뱅크 세이프박스', category: '현금성', value: 18000000, currency: 'KRW', delta: 500000, deltaPct: 2.9 },
      { id: 'a3', name: '청약저축', category: '현금성', value: 12500000, currency: 'KRW', delta: 240000, deltaPct: 2.0 },
      { id: 'a4', name: '미래에셋 미국주식', category: '투자', value: 42800000, currency: 'USD', currencyValue: 31000, fxRate: 1380, delta: 8500000, deltaPct: 24.7 },
      { id: 'a5', name: '삼성증권 국내주식', category: '투자', value: 35200000, currency: 'KRW', delta: 6200000, deltaPct: 21.4 },
      { id: 'a6', name: '연금저축펀드', category: '연금/보험', value: 24500000, currency: 'KRW', delta: 3100000, deltaPct: 14.5 },
      { id: 'a7', name: '업비트 지갑', category: '가상자산', value: 8200000, currency: 'KRW', delta: 4200000, deltaPct: 105.0 },
      { id: 'a8', name: '강남 빌라 (자가)', category: '실물자산', value: 380000000, currency: 'KRW', delta: 8500000, deltaPct: 2.3 },
      { id: 'a9', name: '주택담보대출', category: '부채', value: -180000000, currency: 'KRW', delta: 4800000, deltaPct: -2.6, isLiability: true },
      { id: 'a10', name: '신용대출', category: '부채', value: -15500000, currency: 'KRW', delta: -3500000, deltaPct: 29.2, isLiability: true },
    ],
    snapshots: {
      a4: [
        { date: '2025-05', value: 25000, fxRate: 1340, valueKRW: 33500000 },
        { date: '2025-08', value: 27500, fxRate: 1355, valueKRW: 37262500 },
        { date: '2025-11', value: 29000, fxRate: 1365, valueKRW: 39585000 },
        { date: '2026-02', value: 30500, fxRate: 1375, valueKRW: 41937500 },
        { date: '2026-04', value: 31000, fxRate: 1380, valueKRW: 42800000 },
      ],
    },
    transactions: _allTx,
    recurring: [
      { id: 'r1', title: '넷플릭스', amount: 13500, category: '구독', dayOfMonth: 17, from: 'a1', active: true, nextDate: '2026-05-17' },
      { id: 'r2', title: '월세', amount: 850000, category: '주거', dayOfMonth: 15, from: 'a1', active: true, nextDate: '2026-05-15' },
      { id: 'r3', title: 'Spotify Family', amount: 13900, category: '구독', dayOfMonth: 1, from: 'a1', active: true, nextDate: '2026-05-01' },
      { id: 'r4', title: '실손보험', amount: 95000, category: '보험료', dayOfMonth: 5, from: 'a1', active: true, nextDate: '2026-05-05' },
      { id: 'r5', title: '관리비', amount: 320000, category: '주거', dayOfMonth: 25, from: 'a1', active: true, nextDate: '2026-05-25' },
      { id: 'r6', title: '쿠팡 와우', amount: 7890, category: '구독', dayOfMonth: 23, from: 'a1', active: false, nextDate: '—' },
      { id: 'r7', title: 'YouTube Premium', amount: 14900, category: '구독', dayOfMonth: 8, from: 'a1', active: true, nextDate: '2026-05-08' },
      { id: 'r8', title: '운동센터 회비', amount: 130000, category: '여가', dayOfMonth: 1, from: 'a1', active: true, nextDate: '2026-05-01' },
    ],
    pendingInvites: [
      { id: 'inv1', code: 'TOSS-MK7P92', role: 'EDITOR', from: '박엄마', household: '엄마집', expiresAt: '2026-05-08' },
    ],
  },
};

const CATEGORY_DEFS = {
  '급여': { type: 'INCOME', icon: '💼', color: '#3182F6' },
  '투자수익': { type: 'INCOME', icon: '📈', color: '#0AB39C' },
  '사업소득': { type: 'INCOME', icon: '🧾', color: '#F59E0B' },
  '기타수입': { type: 'INCOME', icon: '✨', color: '#A78BFA' },
  '주거': { type: 'EXPENSE', icon: '🏠', color: '#EF4444' },
  '식비': { type: 'EXPENSE', icon: '🍚', color: '#F59E0B' },
  '교통': { type: 'EXPENSE', icon: '🚇', color: '#0AB39C' },
  '의료': { type: 'EXPENSE', icon: '💊', color: '#EC4899' },
  '쇼핑': { type: 'EXPENSE', icon: '🛍️', color: '#A78BFA' },
  '여가': { type: 'EXPENSE', icon: '🎬', color: '#06B6D4' },
  '교육': { type: 'EXPENSE', icon: '📚', color: '#8B5CF6' },
  '보험료': { type: 'EXPENSE', icon: '🛡️', color: '#64748B' },
  '구독': { type: 'EXPENSE', icon: '📺', color: '#3182F6' },
  '기타': { type: 'EXPENSE', icon: '💸', color: '#94A3B8' },
  '이체': { type: 'TRANSFER', icon: '🔄', color: '#94A3B8' },
};

const ASSET_CATEGORY_META = {
  '현금성': { color: '#0AB39C', icon: '💰' },
  '투자': { color: '#3182F6', icon: '📈' },
  '가상자산': { color: '#A78BFA', icon: '🪙' },
  '실물자산': { color: '#F59E0B', icon: '🏠' },
  '연금/보험': { color: '#EC4899', icon: '🛡️' },
  '부채': { color: '#94A3B8', icon: '💳' },
};

Object.assign(window, { KRW, KRW_SHORT, PCT, DUMMY_PERSONAS, CATEGORY_DEFS, ASSET_CATEGORY_META });
