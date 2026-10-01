import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * fridge 스키마 생성 — synchronize:true는 테이블만 만들고 스키마 자체는 못 만드는 함정 대응.
 * down은 no-op (데이터 보호 — 스키마 드랍 금지).
 */
export class CreateFridgeSchema1784500000000 implements MigrationInterface {
  name = 'CreateFridgeSchema1784500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS fridge`);
  }

  public async down(): Promise<void> {
    // no-op: fridge 스키마는 데이터 보호를 위해 드랍하지 않음
  }
}
