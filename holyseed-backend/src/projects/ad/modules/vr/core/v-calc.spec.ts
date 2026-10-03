import { buildVCalc } from './v-calc';

const base = {
  vValue: 1917.13,
  depositAmount: 200,
  prevVValue: 1322.96,
  poolInput: 3941.74,
  gFactor: 10,
  calcSource: 'ROLLOVER' as const,
};

describe('buildVCalc', () => {
  it('저장된 입력으로 재계산해 일치하면 matches=true', () => {
    const r = buildVCalc(base);
    expect(r.recomputed).toBe(1917.13);
    expect(r.poolTerm).toBe(394.17);
    expect(r.delta).toBe(0);
    expect(r.matches).toBe(true);
    expect(r.growth).toBe(594.17);
    expect(r.growthPct).toBe(44.91);
  });

  it('기록된 V가 공식과 다르면 delta와 matches=false', () => {
    const r = buildVCalc({ ...base, vValue: 2432.71, prevVValue: 1917.13, poolInput: 3410.92, calcSource: 'BACKFILL' });
    expect(r.recomputed).toBe(2458.22);
    expect(r.delta).toBe(-25.51);
    expect(r.matches).toBe(false);
    expect(r.source).toBe('BACKFILL');
  });

  it('입력이 없으면 출처만 남기고 재계산하지 않는다', () => {
    const r = buildVCalc({ ...base, prevVValue: null, poolInput: null, gFactor: null, calcSource: 'MANUAL' });
    expect(r.source).toBe('MANUAL');
    expect(r.recomputed).toBeNull();
    expect(r.matches).toBeNull();
    expect(r.growth).toBeNull();
    expect(r.result).toBe(1917.13);
  });

  it('G가 0 이하면 재계산하지 않는다', () => {
    expect(buildVCalc({ ...base, gFactor: 0 }).recomputed).toBeNull();
  });

  it('적립금 250인 사이클도 반올림 경계에서 일치', () => {
    const r = buildVCalc({
      vValue: 4419.97,
      depositAmount: 250,
      prevVValue: 3910.38,
      poolInput: 2595.91,
      gFactor: 10,
      calcSource: 'ROLLOVER',
    });
    expect(r.matches).toBe(true);
  });
});
