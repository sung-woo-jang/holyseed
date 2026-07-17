import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * lab 스키마 생성 — synchronize:true는 테이블만 만들고 스키마 자체는 못 만드는 함정 대응.
 * down은 no-op (데이터 보호 — 스키마 드랍 금지).
 */
export class CreateLabSchema1784300000000 implements MigrationInterface {
  name = 'CreateLabSchema1784300000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS lab`)
  }

  public async down(): Promise<void> {
    // no-op: lab 스키마는 데이터 보호를 위해 드랍하지 않음
  }
}
