import { MigrationInterface, QueryRunner } from 'typeorm';

export class SimplifyServiceSchema1774609695023 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 외래 키 제약 조건 삭제 (존재하는 경우)
    await queryRunner.query(
      `ALTER TABLE IF EXISTS lc.service_regions DROP CONSTRAINT IF EXISTS fk_service_regions_service_id`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS lc.service_schedules DROP CONSTRAINT IF EXISTS fk_service_schedules_service_id`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS lc.service_holidays DROP CONSTRAINT IF EXISTS fk_service_holidays_service_id`,
    );

    // 2. 테이블 삭제
    await queryRunner.query(`DROP TABLE IF EXISTS lc.service_regions CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS lc.service_schedules CASCADE`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS lc.service_holidays CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 롤백 시 테이블 재생성 (개발 환경이므로 구현 생략)
    // 필요시 InitialSchema 마이그레이션 참조하여 재생성 가능
  }
}
