import { MigrationInterface, QueryRunner } from 'typeorm'

export class DropLcSchema1777090701633 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SCHEMA IF EXISTS lc CASCADE;`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS lc;`)
  }
}
