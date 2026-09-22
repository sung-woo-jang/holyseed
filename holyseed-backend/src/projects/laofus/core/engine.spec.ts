import { capLegPriceForDeviation } from './engine';

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
