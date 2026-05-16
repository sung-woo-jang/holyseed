import type { AssetCategory, MemberRole } from '../types/api';

export interface MockAsset {
  id: string;
  name: string;
  category: AssetCategory;
  currency: string;
  currencyValue?: number;
  fxRate?: number;
  value: number;
  isLiability: boolean;
  delta: number;
  deltaPct: number;
}

export interface MockSnapshot {
  date: string;
  value: number;
  fxRate: number;
  valueKRW: number;
}

export interface MockTransaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  category: string;
  title: string;
  memo?: string;
  from?: string;
  to?: string;
  auto?: boolean;
}

export interface MockRecurring {
  id: string;
  title: string;
  amount: number;
  category: string;
  dayOfMonth: number;
  from: string;
  active: boolean;
  nextDate: string;
}

export interface MockMember {
  id: string;
  name: string;
  role: MemberRole;
  avatar: string;
  initial: string;
  joined: string;
}

export interface MockNetWorth {
  current: number;
  lastYear: number;
  snapshotDate: string;
  monthlyHistory: { date: string; value: number }[];
  yearly: { year: number; value: number }[];
}

export interface MockPersona {
  netWorth: MockNetWorth;
  yearlyContrib: Record<number, { category: string; value: number; color: string }[]>;
  contributions: { category: string; value: number; color: string }[];
  assets: MockAsset[];
  snapshots: Record<string, MockSnapshot[]>;
  transactions: MockTransaction[];
  recurring: MockRecurring[];
  members: MockMember[];
  pendingInvites: { id: string; code: string; role: MemberRole; from: string; household: string; expiresAt: string }[];
}

function genMonthly(startVal: number, endVal: number, startYearMonth = '2021-05') {
  const result: { date: string; value: number }[] = [];
  const parts = startYearMonth.split('-').map(Number);
  const sy = parts[0] ?? 2021;
  const sm = parts[1] ?? 5;
  const months = 60;
  for (let i = 0; i < months; i++) {
    const y = sy + Math.floor((sm - 1 + i) / 12);
    const m = ((sm - 1 + i) % 12) + 1;
    const date = `${y}-${String(m).padStart(2, '0')}`;
    const t = i / (months - 1);
    const base = startVal + (endVal - startVal) * Math.pow(t, 0.85);
    const noise = (Math.sin(i * 1.3) + Math.cos(i * 0.7)) * (endVal - startVal) * 0.012;
    result.push({ date, value: Math.round((base + noise) / 100000) * 100000 });
  }
  return result;
}

function genTxs(): MockTransaction[] {
  const txs: MockTransaction[] = [];
  let id = 1;
  const cats = [
    { name: '식비', range: [15000, 120000] as [number, number] },
    { name: '교통', range: [3000, 80000] as [number, number] },
    { name: '쇼핑', range: [25000, 350000] as [number, number] },
    { name: '여가', range: [12000, 180000] as [number, number] },
    { name: '의료', range: [8000, 250000] as [number, number] },
    { name: '교육', range: [50000, 400000] as [number, number] },
    { name: '기타', range: [5000, 100000] as [number, number] },
  ];
  const titles: Record<string, string[]> = {
    식비: ['주말 장보기', '동료 점심', '외식', '편의점', '배달음식', '카페', '주말 외식'],
    교통: ['지하철', '주유', '택시', '하이패스 충전'],
    쇼핑: ['의류 쇼핑', '생필품', '쿠팡', '온라인 주문'],
    여가: ['영화', '공연', '여행', '북카페', '게임'],
    의료: ['병원', '약국', '치과'],
    교육: ['도서', '강의', '학원비'],
    기타: ['선물', '경조사', '기부', '잡화'],
  };

  for (let mi = 0; mi < 60; mi++) {
    const y = 2021 + Math.floor((4 + mi) / 12);
    const m = ((4 + mi) % 12) + 1;
    const mm = String(m).padStart(2, '0');
    const dim = new Date(y, m, 0).getDate();
    const baseSalary = 4000000 + mi * 8000;

    txs.push({ id: `t${id++}`, date: `${y}-${mm}-25`, type: 'INCOME', amount: baseSalary, category: '급여', title: `${m}월 급여`, to: 'a1' });
    txs.push({ id: `t${id++}`, date: `${y}-${mm}-01`, type: 'EXPENSE', amount: 13900, category: '구독', title: 'Spotify Family', from: 'a1', auto: true });
    txs.push({ id: `t${id++}`, date: `${y}-${mm}-05`, type: 'EXPENSE', amount: 95000, category: '보험료', title: '실손보험', from: 'a1', auto: true });
    txs.push({ id: `t${id++}`, date: `${y}-${mm}-15`, type: 'EXPENSE', amount: 850000, category: '주거', title: '월세', from: 'a1', auto: true });
    txs.push({ id: `t${id++}`, date: `${y}-${mm}-17`, type: 'EXPENSE', amount: 13500, category: '구독', title: '넷플릭스', from: 'a1', auto: true });
    txs.push({ id: `t${id++}`, date: `${y}-${mm}-25`, type: 'EXPENSE', amount: 280000 + Math.round(Math.sin(mi) * 80000), category: '주거', title: `${m}월 관리비`, memo: '전기 320kWh / 가스 18㎥', from: 'a1', auto: true });

    const numVar = 10 + Math.floor((Math.sin(mi * 1.3) + 1) * 3);
    for (let k = 0; k < numVar; k++) {
      const cat = cats[Math.floor(Math.abs(Math.sin(mi * 7 + k * 3)) * cats.length) % cats.length]!;
      const day = Math.max(1, Math.min(dim, Math.floor(Math.abs(Math.cos(mi * 5 + k * 11)) * dim) + 1));
      const amt = Math.round((cat.range[0] + Math.abs(Math.sin(mi + k * 2)) * (cat.range[1] - cat.range[0])) / 1000) * 1000;
      const titleArr = titles[cat.name] ?? [];
      const title = titleArr[k % (titleArr.length || 1)] ?? cat.name;
      txs.push({ id: `t${id++}`, date: `${y}-${mm}-${String(day).padStart(2, '0')}`, type: 'EXPENSE', amount: amt, category: cat.name, title, from: 'a1' });
    }

    if (m % 3 === 0) {
      txs.push({ id: `t${id++}`, date: `${y}-${mm}-03`, type: 'INCOME', amount: 350000 + Math.floor(Math.abs(Math.sin(mi)) * 200000), category: '투자수익', title: '분기 배당금', to: 'a5' });
    }
  }
  return txs.sort((a, b) => b.date.localeCompare(a.date));
}

const _monthly = genMonthly(215000000, 412500000, '2021-05');
const _allTx = genTxs();

export const MOCK_PERSONA: MockPersona = {
  netWorth: {
    current: 412500000,
    lastYear: 367200000,
    snapshotDate: '2026-04-29',
    monthlyHistory: _monthly,
    yearly: [
      { year: 2021, value: 215000000 },
      { year: 2022, value: 268000000 },
      { year: 2023, value: 312000000 },
      { year: 2024, value: 367200000 },
      { year: 2025, value: 412500000 },
    ],
  },
  yearlyContrib: {
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
  },
  contributions: [
    { category: '주식·ETF', value: 18500000, color: '#3182F6' },
    { category: '예적금', value: 12300000, color: '#0AB39C' },
    { category: '부동산', value: 8500000, color: '#F59E0B' },
    { category: '코인', value: 4200000, color: '#A78BFA' },
    { category: '연금', value: 3100000, color: '#EC4899' },
    { category: '부채상환', value: -1300000, color: '#94A3B8' },
  ],
  assets: [
    { id: 'a1', name: '신한 주거래 통장', category: 'CASH', currency: 'KRW', value: 28500000, isLiability: false, delta: 1200000, deltaPct: 4.4 },
    { id: 'a2', name: '카카오뱅크 세이프박스', category: 'CASH', currency: 'KRW', value: 18000000, isLiability: false, delta: 500000, deltaPct: 2.9 },
    { id: 'a3', name: '청약저축', category: 'CASH', currency: 'KRW', value: 12500000, isLiability: false, delta: 240000, deltaPct: 2.0 },
    { id: 'a4', name: '미래에셋 미국주식', category: 'INVESTMENT', currency: 'USD', currencyValue: 31000, fxRate: 1380, value: 42800000, isLiability: false, delta: 8500000, deltaPct: 24.7 },
    { id: 'a5', name: '삼성증권 국내주식', category: 'INVESTMENT', currency: 'KRW', value: 35200000, isLiability: false, delta: 6200000, deltaPct: 21.4 },
    { id: 'a6', name: '연금저축펀드', category: 'PENSION', currency: 'KRW', value: 24500000, isLiability: false, delta: 3100000, deltaPct: 14.5 },
    { id: 'a7', name: '업비트 지갑', category: 'CRYPTO', currency: 'KRW', value: 8200000, isLiability: false, delta: 4200000, deltaPct: 105.0 },
    { id: 'a8', name: '강남 빌라 (자가)', category: 'REAL_ESTATE', currency: 'KRW', value: 380000000, isLiability: false, delta: 8500000, deltaPct: 2.3 },
    { id: 'a9', name: '주택담보대출', category: 'LIABILITY', currency: 'KRW', value: 180000000, isLiability: true, delta: -4800000, deltaPct: -2.6 },
    { id: 'a10', name: '신용대출', category: 'LIABILITY', currency: 'KRW', value: 15500000, isLiability: true, delta: 3500000, deltaPct: 29.2 },
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
  members: [
    { id: 'u1', name: '김토스', role: 'OWNER', avatar: '#3182F6', initial: '김', joined: '2024-01-15' },
    { id: 'u2', name: '이토스', role: 'EDITOR', avatar: '#FF6B6B', initial: '이', joined: '2024-01-20' },
    { id: 'u3', name: '아버지', role: 'VIEWER', avatar: '#8E44AD', initial: '父', joined: '2024-08-12' },
  ],
  pendingInvites: [
    { id: 'inv1', code: 'TOSS-MK7P92', role: 'EDITOR', from: '박엄마', household: '엄마집', expiresAt: '2026-05-08' },
  ],
};
