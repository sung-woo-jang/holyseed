import { capLegPriceForDeviation, computeBuyLocLegs, worstCaseLocSpend, ImuState } from './engine';

describe('capLegPriceForDeviation', () => {
  it('기준가 대비 허용범위 안이면 그대로 통과', () => {
    const r = capLegPriceForDeviation(105, 100, 20);
    expect(r).toEqual({ price: 105, capped: false });
  });

  it('기준가보다 너무 높으면 상한으로 클램프', () => {
    // 평단 leg가 급락 후에도 고정돼 있던 실제 사례(2026-09-15) 재현: 평단 $121.82, 현재가 $101대
    const r = capLegPriceForDeviation(121.82, 101, 20);
    expect(r).toEqual({ price: 121.2, capped: true });
  });

  it('기준가보다 너무 낮으면 하한으로 클램프', () => {
    const r = capLegPriceForDeviation(70, 100, 20);
    expect(r).toEqual({ price: 80, capped: true });
  });

  it('임계값을 지정하면 그 값을 사용', () => {
    const r = capLegPriceForDeviation(115, 100, 10);
    expect(r).toEqual({ price: 110, capped: true });
  });
});

describe('computeBuyLocLegs — 1회매수금 ÷ 종가 규칙', () => {
  // 2026-10-15 실제 상태: 1회매수금 = 4218.99 / (20 - 9.875) = 416.69
  const firstHalf: ImuState = { cycle: 2, T: 9.875, quantity: 20, avgPrice: 140.717, cash: 4218.99, principal: 7000 };
  // 후반전 가정: 1회매수금 = 3800 / (20 - 12.875) = 533.33, 별지점 = 125 × (1 - 5.75%) = 117.81
  const secondHalf: ImuState = { cycle: 2, T: 12.875, quantity: 30, avgPrice: 125, cash: 3800, principal: 7000 };

  it('전반전: 별지점 1주·평단 1주 뒤에 1회매수금÷주수 가격으로 분할 1주씩', () => {
    const legs = computeBuyLocLegs(firstHalf);
    expect(legs.slice(0, 5)).toEqual([
      { price: 141.06, quantity: 1, halfStep: true, ladder: false },
      { price: 140.717, quantity: 1, halfStep: true, ladder: false },
      { price: 138.9, quantity: 1, halfStep: false, ladder: true },
      { price: 104.17, quantity: 1, halfStep: false, ladder: true },
      { price: 83.34, quantity: 1, halfStep: false, ladder: true },
    ]);
    expect(legs).toHaveLength(2 + 8);
  });

  it('후반전: 별지점 전액 leg 수량은 floor(1회매수금÷별지점가), 그 아래 분할', () => {
    const legs = computeBuyLocLegs(secondHalf);
    expect(legs[0]).toEqual({ price: 117.8, quantity: 4, halfStep: false, ladder: false });
    expect(legs[1]).toEqual({ price: 106.67, quantity: 1, halfStep: false, ladder: true });
    expect(legs[2]).toEqual({ price: 88.89, quantity: 1, halfStep: false, ladder: true });
  });

  it('현재가를 주면 -20% 아래 분할 단은 걸지 않는다', () => {
    // 기준가 103.99 → 하한 83.19: 83.34(5번째)까지만, 69.45(6번째)부터 제외
    const ladder = computeBuyLocLegs(firstHalf, 103.99).filter((l) => l.ladder);
    expect(ladder.map((l) => l.price)).toEqual([138.9, 104.17, 83.34]);
  });

  it('분할 leg는 모두 별지점·평단 leg보다 아래 가격', () => {
    for (const s of [firstHalf, secondHalf]) {
      const legs = computeBuyLocLegs(s);
      const baseMin = Math.min(...legs.filter((l) => !l.ladder).map((l) => l.price));
      for (const l of legs.filter((x) => x.ladder)) expect(l.price).toBeLessThan(baseMin);
    }
  });

  it('종가 p에서 체결 주 수는 floor(1회매수금÷p)이고 쓰는 돈은 1회매수금 이하', () => {
    for (const s of [firstHalf, secondHalf]) {
      const oneBuy = Math.round((s.cash / (20 - s.T)) * 100) / 100;
      const legs = computeBuyLocLegs(s);
      const buyStar = legs[0].price;
      const avg = s.T < 10 ? legs[1].price : buyStar;
      const lowestBase = Math.min(buyStar, avg);
      for (let p = 90; p <= lowestBase; p += 0.5) {
        const shares = legs.reduce((a, l) => a + (l.price >= p ? l.quantity : 0), 0);
        expect(shares).toBe(Math.floor(oneBuy / p));
        expect(shares * p).toBeLessThanOrEqual(oneBuy + 1e-9);
      }
    }
  });

  it('잔금이 0 이하여도 기본 leg는 최소 1주 유지하고 분할은 걸지 않는다', () => {
    const broke: ImuState = { ...firstHalf, cash: -50 };
    const legs = computeBuyLocLegs(broke);
    expect(legs.every((l) => !l.ladder)).toBe(true);
    expect(legs.every((l) => l.quantity >= 1)).toBe(true);
  });

  it('T=0 사이클 시작과 리버스모드는 이 함수 대상이 아니다', () => {
    expect(computeBuyLocLegs({ ...firstHalf, T: 0 })).toEqual([]);
    expect(computeBuyLocLegs({ ...firstHalf, T: 19.5 })).toEqual([]);
  });
});

describe('worstCaseLocSpend', () => {
  it('종가 후보마다 한도가 이상 leg 수량 합×가격 중 최댓값', () => {
    const legs = [
      { orderPrice: 124.79, quantity: 1 },
      { orderPrice: 124.79, quantity: 1 },
      { orderPrice: 124.79, quantity: 1 },
      { orderPrice: 104.17, quantity: 1 },
    ];
    expect(worstCaseLocSpend(legs)).toBe(416.68);
  });

  it('기존 2-leg(분할 없음)는 한도가×수량 합과 같다', () => {
    expect(worstCaseLocSpend([{ orderPrice: 124.79, quantity: 1 }, { orderPrice: 124.79, quantity: 1 }])).toBe(249.58);
    expect(worstCaseLocSpend([{ orderPrice: 80, quantity: 1 }, { orderPrice: 70, quantity: 2 }])).toBe(210);
  });
});
