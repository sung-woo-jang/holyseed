import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * lab 스키마를 ad 스키마로 합친다 (lab 이름 제거).
 * - VR·근무일지·지출·스페이스X 테이블 14개를 `ALTER TABLE ... SET SCHEMA ad`로 이동 — 데이터·인덱스·시퀀스가 그대로 따라감.
 * - enum 타입 4개는 lab_ 접두사를 떼고 ad로 이동 (엔티티 enumName도 같이 변경됨).
 * - 사용처가 없는 레거시 테이블(films, cutting_*, benchmark_prices, spy_prices, backtest_prices)과 lab.users를 삭제하고 lab 스키마를 드랍.
 *   `DROP SCHEMA`는 CASCADE 없이 실행 — 예상 밖의 객체가 남아 있으면 실패해서 전체가 롤백된다(마이그레이션은 트랜잭션).
 * 모든 문장이 IF EXISTS라 새 DB에서도 안전. down은 이동한 테이블·enum을 lab로 되돌린다(삭제된 레거시 테이블은 백업 dump에서 복원).
 */
const TABLES = [
  'vr_cycles',
  'vr_events',
  'vr_fills',
  'vr_pending_orders',
  'vr_settings',
  'worklogs',
  'worklog_job_options',
  'worklog_category_options',
  'worklog_title_options',
  'expenses',
  'spacex_entries',
  'spacex_state',
];
const ENUMS: [string, string][] = [
  ['lab_expense_kind', 'expense_kind'],
  ['lab_expense_type', 'expense_type'],
  ['lab_pay_status', 'pay_status'],
  ['lab_vr_fill_kind', 'vr_fill_kind'],
];
const LEGACY = [
  'films',
  'cutting_pieces',
  'cutting_projects',
  'benchmark_prices',
  'spy_prices',
  'backtest_prices',
  'users',
];

export class MergeLabIntoAd1784400000000 implements MigrationInterface {
  name = 'MergeLabIntoAd1784400000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE SCHEMA IF NOT EXISTS ad`);
    for (const [from, to] of ENUMS) {
      await q.query(`
        DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'lab' AND t.typname = '${from}') THEN
            ALTER TYPE lab.${from} RENAME TO ${to};
            ALTER TYPE lab.${to} SET SCHEMA ad;
          END IF;
        END $$;`);
    }
    for (const t of TABLES) await q.query(`ALTER TABLE IF EXISTS lab.${t} SET SCHEMA ad`);
    for (const t of LEGACY) await q.query(`DROP TABLE IF EXISTS lab.${t} CASCADE`);
    await q.query(`DROP SCHEMA IF EXISTS lab`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`CREATE SCHEMA IF NOT EXISTS lab`);
    for (const t of TABLES) await q.query(`ALTER TABLE IF EXISTS ad.${t} SET SCHEMA lab`);
    for (const [from, to] of ENUMS) {
      await q.query(`
        DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'ad' AND t.typname = '${to}') THEN
            ALTER TYPE ad.${to} SET SCHEMA lab;
            ALTER TYPE lab.${to} RENAME TO ${from};
          END IF;
        END $$;`);
    }
  }
}
