/** VR 개요 타일 해설 — 공식적인 뜻(VR 5.0 문서)과 저수지 비유, 지금 내 값으로 읽는 문장 */

export type LakeFocus = 'v' | 'min' | 'max' | 'pool' | 'water' | 'valve' | 'all';

export interface GuideCtx {
  v: number;
  v2: number | null;
  pool: number;
  poolStart: number | null;
  usablePool: number;
  limitPct: number;
  g: number;
  deposit: number;
  bandPct: number;
  minBand: number;
  maxBand: number;
  quantity: number;
  avgPrice: number;
  price: number | null;
  marketValue: number | null;
  costBasis: number | null;
  unrealized: number | null;
  totalAssets: number | null;
  invested: number;
  initial: number;
  profit: number | null;
  profitRate: number | null;
  cashRatio: number | null;
  cashDiff: number | null;
  poolUsage: number | null;
  growthRate: number | null;
  /** (E − V) ÷ 2√G — 실력공식의 평가금 보정 */
  evalTerm: number | null;
  evaluation: number | null;
  poolTerm: number | null;
}

type Txt = string | ((c: GuideCtx) => string);

export interface TileGuide {
  focus: LakeFocus;
  sum: string;
  formal: Txt;
  eq: string;
  lake: string;
  /** `**굵게**` 표기 지원. 값이 아직 없으면 null */
  mine: (c: GuideCtx) => string | null;
  warn?: string;
  rel: string[];
}

const usd = (v: number, d = 2) => `${v < 0 ? '−' : ''}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
const sgn = (v: number, d = 2) => `${v >= 0 ? '+' : '−'}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
const pc = (v: number, d = 2) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(d)}%`;
const b = (s: string) => `**${s}**`;
/** 숫자 문자열 끝 발음에 받침이 있는지 (영·일·삼·육·칠·팔, %는 '퍼센트'라 없음) */
const hasJong = (s: string) => !s.endsWith('%') && '013678'.includes(s.replace(/[^0-9]/g, '').slice(-1));
const ieyo = (s: string) => (hasJong(s) ? '이에요' : '예요');
const eun = (s: string) => (hasJong(s) ? '은' : '는');
const iga = (s: string) => (hasJong(s) ? '이' : '가');
const eul = (s: string) => (hasJong(s) ? '을' : '를');

export const TILE_GUIDE: Record<string, TileGuide> = {
  vValue: {
    focus: 'v',
    sum: '평가금이 따라가야 할 목표값이에요.',
    formal: '2주(사이클)마다 한 번 갱신하는 목표 평가금이에요. 실력공식으로 정해서, 연못(Pool)이 클수록 크게 오르고 평가금이 V보다 낮았으면 덜 올라요. 최대·최소 밴드의 기준이기도 해요.',
    eq: 'V₂ = V₁ + Pool ÷ G + (E − V₁) ÷ 2√G + 적립금',
    lake: '저수지의 목표 수위예요. 연못 물을 반영해 키우되, 실제 물 높이(평가금)가 목표보다 낮았으면 그만큼 덜 키워요. 정확히는 "목표 크기"예요.',
    mine: (c) =>
      c.v2 === null || c.poolTerm === null || c.evalTerm === null
        ? null
        : `${usd(c.v)} + Pool÷G ${b(usd(c.poolTerm))} ${c.evalTerm >= 0 ? '+' : '−'} 평가금 보정 ${b(usd(Math.abs(c.evalTerm)))} + 적립금 ${b(usd(c.deposit, 0))} = ${b(usd(c.v2))}${ieyo(usd(c.v2))}.`,
    rel: ['evalAdj', 'minBand', 'maxBand', 'pool', 'gFactor'],
  },
  evalAdj: {
    focus: 'v',
    sum: '평가금이 목표(V)보다 높았는지 낮았는지를 V에 반영한 금액이에요.',
    formal: '실력공식의 (E − V₁) ÷ 2√G 항이에요. E는 사이클이 끝났을 때의 마지막 평가금이에요. V₁보다 높으면 V가 더 오르고, 낮으면 덜 오르거나 오히려 깎여요.',
    eq: '(E − V₁) ÷ 2√G',
    lake: '목표 수위보다 실제 물 높이가 높았으면 목표도 그만큼 높이고, 낮았으면 덜 올려요. 하락장에서 목표 수위가 같이 내려오는 이유예요.',
    mine: (c) =>
      c.evalTerm === null || c.evaluation === null
        ? null
        : `마지막 평가금 E ${usd(c.evaluation)}${iga(usd(c.evaluation))} V ${usd(c.v)}보다 ${c.evaluation >= c.v ? '높아서' : '낮아서'} ${b(sgn(c.evalTerm))}${eul(sgn(c.evalTerm))} 더해요.`,
    warn: 'E는 사이클 종료일 종가 기준 평가금이에요. 월요일에 갱신해도 현재가가 아니라 직전 금요일 종가를 써요.',
    rel: ['vValue', 'gFactor', 'marketValue', 'growthRate'],
  },
  growthRate: {
    focus: 'v',
    sum: '다음 V가 지금 V보다 몇 % 커지는지예요. 적립금도 포함해요.',
    formal: '(V₂ 예정 − V) ÷ V예요. Pool 반영분, 평가금 보정, 적립금이 모두 들어 있어요.',
    eq: '(V₂ 예정 − V) ÷ V',
    lake: '이번에 저수지 목표 수위가 올라가는 폭 전체예요. 연못 물 반영분, 실제 수위와의 차이 보정, 새로 붓는 물을 합친 거예요.',
    mine: (c) =>
      c.growthRate === null || c.v2 === null
        ? null
        : `V가 ${usd(c.v)} → ${usd(c.v2)}, 즉 ${b(pc(c.growthRate))} 올라가요.${c.poolTerm !== null && c.evalTerm !== null ? ` 구성은 Pool÷G ${usd(c.poolTerm)}, 평가금 보정 ${sgn(c.evalTerm)}, 적립금 ${usd(c.deposit, 0)}${ieyo(usd(c.deposit, 0))}.` : ''}`,
    rel: ['evalAdj', 'vValue', 'depositAmount'],
  },
  minBand: {
    focus: 'min',
    sum: '평가금이 이 아래로 내려가면 매수하는 선이에요.',
    formal: (c) => `V × (1 − 밴드%)예요. 밴드는 ±${c.bandPct}%이고, 평가금이 닿으면 밴드 안으로 돌아올 만큼 사요.`,
    eq: '최소 밴드 = V × (1 − 밴드%)',
    lake: '저수지의 하한선이에요. 물이 이 밑으로 내려가면 수문을 열어 연못 물을 끌어와요.',
    mine: (c) =>
      c.marketValue === null
        ? null
        : c.marketValue < c.minBand
          ? `평가금 ${b(usd(c.marketValue))}${iga(usd(c.marketValue))} ${usd(c.minBand)} 아래라 지금은 매수 신호가 나와 있어요.`
          : `평가금 ${b(usd(c.marketValue))}${eun(usd(c.marketValue))} ${usd(c.minBand)}보다 위라서 매수 신호는 없어요.`,
    rel: ['vValue', 'maxBand', 'pool'],
  },
  maxBand: {
    focus: 'max',
    sum: '평가금이 이 위로 올라가면 매도하는 선이에요.',
    formal: (c) => `V × (1 + 밴드%)예요. 밴드는 ±${c.bandPct}%이고, 넘으면 밴드 안으로 돌아올 만큼 팔아서 그 돈은 Pool로 가요.`,
    eq: '최대 밴드 = V × (1 + 밴드%)',
    lake: '저수지의 상한선이에요. 물이 넘칠 것 같으면 연못으로 옮겨요.',
    mine: (c) =>
      c.marketValue === null
        ? null
        : c.marketValue > c.maxBand
          ? `평가금 ${b(usd(c.marketValue))}${iga(usd(c.marketValue))} ${usd(c.maxBand)}${eul(usd(c.maxBand))} 넘어서 지금은 매도 신호가 나와 있어요.`
          : `평가금 ${b(usd(c.marketValue))}${iga(usd(c.marketValue))} ${usd(c.maxBand)}보다 아래라서 매도 신호도 없어요.`,
    warn: '매도는 평단과 상관없이 이 선으로만 판단해요. 그래서 평단보다 낮게 팔게 되는 때도 있어요.',
    rel: ['vValue', 'minBand', 'pool'],
  },
  pool: {
    focus: 'pool',
    sum: '매수에 쓸 수 있는 현금이에요.',
    formal: (c) => `매수하면 줄고, 매도하거나 적립하면 늘어요. 적립식은 한 사이클에 적립 후 Pool의 ${c.limitPct}%까지만 쓸 수 있어요.`,
    eq: '사용가능 = Pool − 시작 Pool × (100 − 한도%)',
    lake: '저수지 옆 보조 연못이에요. 물이 모자라면 여기서 끌어오고, 연못이 든든해야 저수지를 과감하게 키울 수 있어요.',
    mine: (c) =>
      c.poolStart === null
        ? `Pool은 ${b(usd(c.pool))}${ieyo(usd(c.pool))}.`
        : `이번 사이클 시작 Pool ${usd(c.poolStart)}에서 바닥선 ${usd((c.poolStart * (100 - c.limitPct)) / 100)}${eul(usd((c.poolStart * (100 - c.limitPct)) / 100))} 빼면 ${b(usd(c.usablePool))}까지 쓸 수 있어요.`,
    rel: ['poolUsageRate', 'cashRatio', 'cashBalance'],
  },
  poolUsageRate: {
    focus: 'pool',
    sum: '이번 사이클에 연못 물을 얼마나 썼는지예요.',
    formal: (c) => `(사이클 시작 Pool − 현재 Pool) ÷ 사이클 시작 Pool이에요. 한도 ${c.limitPct}%에 닿으면 이번 사이클엔 더 못 사요.`,
    eq: '(시작 Pool − 현재 Pool) ÷ 시작 Pool',
    lake: '이번 사이클에 연못에서 퍼 쓴 비율이에요. 매도로 물이 돌아오면 다시 낮아져요.',
    mine: (c) =>
      c.poolUsage === null
        ? null
        : c.poolUsage <= 0
          ? `아직 이번 사이클에 Pool을 쓰지 않았어요(${b('0%')}). ${c.limitPct}%까지가 한도예요.`
          : `이번 사이클에 시작 Pool의 ${b(`${c.poolUsage.toFixed(1)}%`)}${eul(c.poolUsage.toFixed(1))} 썼어요. ${c.limitPct}%까지가 한도예요.`,
    rel: ['pool', 'vValue'],
  },
  cashRatio: {
    focus: 'all',
    sum: '전체 자산 중 현금이 차지하는 비율이에요.',
    formal: 'Pool ÷ 총자산이에요. 라오어 백테스트의 10년 평균은 약 13%(P/V 0.152)로 나와 있어요.',
    eq: 'Pool ÷ (Pool + 평가금)',
    lake: '저수지와 연못에 담긴 물 전체 중 연못의 몫이에요.',
    mine: (c) =>
      c.cashRatio === null || c.totalAssets === null
        ? null
        : `총자산 ${usd(c.totalAssets)} 중 Pool(${usd(c.pool)})이 차지하는 비율은 ${b(`${c.cashRatio.toFixed(1)}%`)}${ieyo(c.cashRatio.toFixed(1))}.`,
    warn: 'Pool이 많이 남는 것도 문서상 계획대로 진행되는 상태예요.',
    rel: ['pool', 'totalAssets'],
  },
  cashBalance: {
    focus: 'pool',
    sum: '증권 계좌의 실제 현금과 앱 기록 Pool이 맞는지 점검해요.',
    formal: '증권사 예수금에서 라오어 엔진 몫을 뺀 VR 현금과, 앱이 기록한 Pool의 차이예요. 같은 예수금에서 나간 모으기 매수액은 VR 몫이 아니라서 다시 더해 비교해요. 0에 가까워야 해요.',
    eq: '차이 = 실제 VR 현금 + 모으기 누적 매수액 − 앱 Pool',
    lake: '연못에 달아 둔 수위계 눈금과 실제 물의 양을 비교하는 거예요.',
    mine: (c) =>
      c.cashDiff === null
        ? null
        : Math.abs(c.cashDiff) < 0.005
          ? `차이가 ${b('$0')}이라 기록과 계좌가 맞아요.`
          : c.cashDiff > 0
            ? `계좌에 기록보다 ${b(usd(c.cashDiff))} 더 있어요.`
            : `계좌에 기록보다 ${b(usd(-c.cashDiff))} 적어요.`,
    warn: '차이가 계속 크면 체결 기록이 빠졌거나 잘못 들어갔을 수 있어요.',
    rel: ['pool'],
  },
  depositAmount: {
    focus: 'pool',
    sum: '2주마다 Pool에 넣는 금액이에요.',
    formal: '적립식 VR은 사이클마다 일정 금액을 넣어요. Pool에 들어가고, V 갱신 때 V에도 같은 금액이 더해져요.',
    eq: 'V₂ = V₁ + Pool ÷ G + (E − V₁) ÷ 2√G + 적립금',
    lake: '2주마다 연못에 물을 붓고, 저수지 목표 수위도 그만큼 올려요.',
    mine: (c) => `다음 V 갱신에 ${b(usd(c.deposit))}${iga(usd(c.deposit))} 반영돼요. 지금까지 넣은 돈은 모두 ${usd(c.invested)}${ieyo(usd(c.invested))}.`,
    rel: ['vValue', 'pool', 'investedPrincipal'],
  },
  gFactor: {
    focus: 'valve',
    sum: 'V가 얼마나 빨리 커질지를 정하는 숫자예요.',
    formal: 'Pool ÷ G와 (E − V₁) ÷ 2√G, 두 항의 분모에 들어가요. 클수록 V가 천천히 움직여서 더 보수적이에요. 적립식은 G=10으로 시작하는 것이 가이드예요. 라오어 1기 거치식은 G=16까지 올려 쓰고 있어요(6개월마다 1씩).',
    eq: 'Pool ÷ G + (E − V₁) ÷ 2√G',
    lake: '연못 물과 수위 차이를 저수지 목표 수위에 얼마나 반영할지 정하는 조절 밸브예요. 크게 돌릴수록 신중하게 키워요.',
    mine: (c) =>
      `G가 ${b(String(c.g))}이면 Pool의 1/${c.g}${c.poolTerm !== null ? `(${b(usd(c.poolTerm))})` : ''}이 더해지고, 평가금과 V의 차이는 2√${c.g} = ${(2 * Math.sqrt(c.g)).toFixed(2)}로 나눠서 반영해요.`,
    rel: ['vValue', 'evalAdj', 'pool'],
  },
  marketValue: {
    focus: 'water',
    sum: '지금 들고 있는 TQQQ의 시가예요.',
    formal: '보유수량 × 현재가예요. 밴드와 비교하는 값이에요.',
    eq: '평가금 = 보유수량 × 현재가',
    lake: '저수지의 현재 수위, 지금 담겨 있는 실제 물 높이예요.',
    mine: (c) => {
      if (c.marketValue === null || c.price === null) return null;
      const pos = c.marketValue < c.minBand ? '아래라 매수 신호가 나와 있어요.' : c.marketValue > c.maxBand ? '위라 매도 신호가 나와 있어요.' : '안이라 가만히 있어요.';
      return `${c.quantity}주 × ${usd(c.price)} = ${b(usd(c.marketValue))}이고, 밴드(${usd(c.minBand, 0)}~${usd(c.maxBand, 0)}) ${pos}`;
    },
    rel: ['vValue', 'minBand', 'maxBand', 'quantity'],
  },
  totalAssets: {
    focus: 'all',
    sum: '현금과 주식을 합친 전체 자산이에요.',
    formal: 'Pool + 평가금이에요.',
    eq: '총자산 = Pool + 평가금',
    lake: '저수지와 연못에 있는 물을 전부 합친 양이에요.',
    mine: (c) => (c.totalAssets === null || c.marketValue === null ? null : `Pool ${usd(c.pool)} + 평가금 ${usd(c.marketValue)} = ${b(usd(c.totalAssets))}${ieyo(usd(c.totalAssets))}.`),
    rel: ['marketValue', 'pool', 'profit'],
  },
  investedPrincipal: {
    focus: 'all',
    sum: '계좌에 넣은 돈을 모두 합친 금액이에요.',
    formal: '기록된 입금 체결 전체의 합이에요. 최초 입금과 사이클마다의 적립금이 모두 들어가요.',
    eq: '투자원금 = 입금 합계',
    lake: '내가 직접 부어 넣은 물의 누적량이에요. 비가 와서 늘어난 물은 포함되지 않아요.',
    mine: (c) => `처음 ${usd(c.initial)}에 적립 입금이 더해져 ${b(usd(c.invested))}${ieyo(usd(c.invested))}.`,
    rel: ['initialCapital', 'profit', 'depositAmount'],
  },
  initialCapital: {
    focus: 'all',
    sum: '처음 계좌에 넣은 금액이에요.',
    formal: '가장 먼저 기록된 입금 체결액이에요.',
    eq: '최초 입금',
    lake: '처음 저수지와 연못을 채운 물이에요.',
    mine: (c) =>
      c.invested > c.initial
        ? `이후 입금 ${b(usd(c.invested - c.initial))}${iga(usd(c.invested - c.initial))} 더해져 투자원금이 ${usd(c.invested)}가 됐어요.`
        : `아직 추가 입금이 없어서 투자원금과 같아요.`,
    rel: ['investedPrincipal'],
  },
  costBasis: {
    focus: 'water',
    sum: '지금 보유한 주식을 사는 데 쓴 돈이에요.',
    formal: '평단 × 보유수량이에요. 평단은 매수 체결의 가중평균이에요.',
    eq: '매수원가 = 평단 × 수량',
    lake: '지금 저수지에 담긴 물을 채우는 데 연못에서 퍼 간 양이에요.',
    mine: (c) => (c.costBasis === null ? null : `평단 ${usd(c.avgPrice)} × ${c.quantity}주 = ${b(usd(c.costBasis))}${ieyo(usd(c.costBasis))}.`),
    rel: ['avgPrice', 'unrealizedProfit', 'marketValue'],
  },
  unrealizedProfit: {
    focus: 'water',
    sum: '아직 팔지 않은 상태에서의 장부상 손익이에요.',
    formal: '평가금 − 매수원가예요. 팔기 전에는 확정되지 않은 값이에요.',
    eq: '평가금 − 매수원가',
    lake: '지금 저수지 수위가 처음 채웠던 양보다 얼마나 높은지예요.',
    mine: (c) =>
      c.unrealized === null || c.marketValue === null || c.costBasis === null
        ? null
        : `${usd(c.marketValue)} − ${usd(c.costBasis)} = ${b(sgn(c.unrealized))}${ieyo(sgn(c.unrealized))}.`,
    warn: 'VR은 이 값으로 매매하지 않아요. 밴드로만 판단해요.',
    rel: ['marketValue', 'costBasis'],
  },
  profit: {
    focus: 'all',
    sum: '넣은 돈 대비 지금까지 늘거나 줄어든 금액이에요.',
    formal: '총자산 − 투자원금이에요. 실현·미실현을 모두 합친 값이에요.',
    eq: '총자산 − 투자원금',
    lake: '내가 부은 물보다 저수지와 연못에 물이 얼마나 더 있는지예요.',
    mine: (c) => (c.profit === null || c.totalAssets === null ? null : `${usd(c.totalAssets)} − ${usd(c.invested)} = ${b(sgn(c.profit))}${ieyo(sgn(c.profit))}.`),
    rel: ['totalAssets', 'investedPrincipal', 'profitRate'],
  },
  profitRate: {
    focus: 'all',
    sum: '넣은 돈 대비 몇 % 벌었는지예요.',
    formal: '총손익 ÷ 투자원금이에요. 시기별 추가 입금을 반영하지 않은 단순 수익률이에요.',
    eq: '수익률 = 총손익 ÷ 투자원금',
    lake: '부은 물 대비 늘어난 물의 비율이에요.',
    mine: (c) => (c.profitRate === null || c.profit === null ? null : `${usd(Math.abs(c.profit))} ÷ ${usd(c.invested)} = ${b(pc(c.profitRate))}${ieyo(pc(c.profitRate))}.`),
    warn: '적립식은 나중에 넣은 돈이 원금에 섞여서 실제보다 낮게 나오고, 인출식은 반대예요. 다른 계좌와 직접 비교하면 안 돼요.',
    rel: ['profit', 'investedPrincipal'],
  },
  quantity: {
    focus: 'water',
    sum: '지금 들고 있는 TQQQ 주수예요.',
    formal: '체결 기록을 순서대로 반영한 보유 주수예요. 평가금은 이 수량 × 현재가예요.',
    eq: '평가금 = 보유수량 × 현재가',
    lake: '저수지에 담긴 물의 양이에요. 가격이 바뀌면 같은 양이어도 수위가 달라져요.',
    mine: (c) =>
      c.price === null || c.marketValue === null
        ? `${b(`${c.quantity}주`)}를 들고 있어요.`
        : `${b(`${c.quantity}주`)} × 현재가 ${usd(c.price)} = 평가금 ${usd(c.marketValue)}${ieyo(usd(c.marketValue))}.`,
    rel: ['marketValue', 'avgPrice'],
  },
  avgPrice: {
    focus: 'water',
    sum: '참고용 평균 매수가예요. VR 매매는 평단을 보지 않아요.',
    formal: '매수 체결을 수량으로 가중평균한 값이에요. 매매 판단에는 쓰지 않아요.',
    eq: '평단 = Σ(가격×수량) ÷ Σ수량',
    lake: '물을 길어 온 평균 비용이에요. 수문을 여는 기준은 아니에요.',
    mine: (c) =>
      c.price !== null && c.price > c.avgPrice
        ? `평단은 ${b(usd(c.avgPrice))}${ieyo(usd(c.avgPrice))}. 현재가가 더 높아도 이 값 때문에 팔지는 않아요.`
        : `평단은 ${b(usd(c.avgPrice))}${ieyo(usd(c.avgPrice))}. 이 값은 매수·매도 판단에 쓰이지 않아요.`,
    warn: '라오어 Q&A: VR 진행은 평단과 관계없어서 평단보다 낮은 가격에 매도되는 상황에서도 매도해야 해요.',
    rel: ['costBasis', 'maxBand'],
  },
};

export function resolveTxt(t: Txt, c: GuideCtx): string {
  return typeof t === 'function' ? t(c) : t;
}
