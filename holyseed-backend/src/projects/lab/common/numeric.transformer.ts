import { ValueTransformer } from 'typeorm';

/** decimal 컬럼을 number로 직렬화 (TypeORM 기본은 string) */
export class NumericTransformer implements ValueTransformer {
  to(value?: number | null): number | null | undefined {
    return value;
  }
  from(value?: string | null): number | null {
    if (value === null || value === undefined) return null;
    return parseFloat(value);
  }
}

export const numeric = new NumericTransformer();
