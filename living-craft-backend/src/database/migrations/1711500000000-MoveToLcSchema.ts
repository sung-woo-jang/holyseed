import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveToLcSchema1711500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. LC 스키마 생성
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS lc;`);

    // 2. 기존 테이블들을 lc 스키마로 이동
    const tables = [
      'admin_users',
      'customers',
      'services',
      'service_regions',
      'service_schedules',
      'service_holidays',
      'reservations',
      'reviews',
      'portfolios',
      'districts',
      'icons',
      'promotions',
      'operating_settings',
      'holidays',
      'films',
      'cutting_projects',
      'cutting_pieces',
    ];

    for (const table of tables) {
      // 테이블이 public 스키마에 존재하는지 확인
      const tableExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = '${table}'
        );
      `);

      if (tableExists[0].exists) {
        await queryRunner.query(`ALTER TABLE public.${table} SET SCHEMA lc;`);
        console.log(`✅ Moved table ${table} to lc schema`);
      } else {
        console.log(`⚠️  Table ${table} does not exist in public schema, skipping...`);
      }
    }

    console.log('✅ All tables moved to lc schema successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 롤백: lc 스키마의 테이블들을 다시 public으로 이동
    const tables = [
      'admin_users',
      'customers',
      'services',
      'service_regions',
      'service_schedules',
      'service_holidays',
      'reservations',
      'reviews',
      'portfolios',
      'districts',
      'icons',
      'promotions',
      'operating_settings',
      'holidays',
      'films',
      'cutting_projects',
      'cutting_pieces',
    ];

    for (const table of tables) {
      const tableExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'lc'
          AND table_name = '${table}'
        );
      `);

      if (tableExists[0].exists) {
        await queryRunner.query(`ALTER TABLE lc.${table} SET SCHEMA public;`);
        console.log(`✅ Moved table ${table} back to public schema`);
      }
    }

    // lc 스키마 삭제 (주의: 다른 테이블이 있을 수 있으므로 CASCADE 사용)
    await queryRunner.query(`DROP SCHEMA IF EXISTS lc CASCADE;`);

    console.log('✅ Rollback completed: All tables moved back to public schema');
  }
}
