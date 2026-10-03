import { buildVCalc } from './v-calc';
import { computeV2Skill } from './rollover';

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

describe('computeV2Skill (실력공식)', () => {
  it('라오어 VR 1기 거치식 282주차: E 71067.34, V₁ 69818.35, Pool 16205.33, G 16 → 70987.31', () => {
    expect(computeV2Skill(69818.35, 16205.33, 16, 71067.34, 0)).toBe(70987.31);
  });

  it('284주차: E 71332.48, V₁ 70987.31 → 72043.29', () => {
    expect(computeV2Skill(70987.31, 16205.33, 16, 71332.48, 0)).toBe(72043.29);
  });

  it('적립금은 그대로 더한다', () => {
    expect(computeV2Skill(70987.31, 16205.33, 16, 71332.48, 250)).toBe(72293.29);
  });

  it('E가 V보다 낮으면 보정항이 음수가 돼 V가 덜 오른다', () => {
    const basic = 1917.13 + 3410.92 / 10 + 200;
    const skill = computeV2Skill(1917.13, 3410.92, 10, 1755.77, 200);
    expect(skill).toBeLessThan(basic);
    expect(skill).toBe(2432.71);
  });
});

describe('buildVCalc 실력공식', () => {
  it('평가금이 저장돼 있으면 실력공식으로 재계산해 대조한다', () => {
    const r = buildVCalc({
      vValue: 72043.29,
      depositAmount: 0,
      prevVValue: 70987.31,
      poolInput: 16205.33,
      gFactor: 16,
      evaluationInput: 71332.48,
      calcSource: 'ROLLOVER',
    });
    expect(r.formula).toBe('SKILL');
    expect(r.evalTerm).toBe(43.15);
    expect(r.poolTerm).toBe(1012.83);
    expect(r.matches).toBe(true);
  });

  it('평가금이 없으면 기본공식으로 재계산한다', () => {
    expect(buildVCalc(base).formula).toBe('BASIC');
  });
});
