import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

const SEQUENCE_TABLE_MAP: Array<{ seq: string; table: string }> = [
  { seq: 'jip.pc_categories_id_seq', table: 'jip.pc_categories' },
  { seq: 'jip.pc_products_id_seq', table: 'jip.pc_products' },
  { seq: 'jip.pc_vendors_id_seq', table: 'jip.pc_vendors' },
  { seq: 'jip.pc_product_images_id_seq', table: 'jip.pc_product_images' },
  { seq: 'jip.pc_product_prices_id_seq', table: 'jip.pc_product_prices' },
  { seq: 'jip.pc_product_features_id_seq', table: 'jip.pc_product_features' },
  { seq: 'jip.pc_product_colors_id_seq', table: 'jip.pc_product_colors' },
];

@Injectable()
export class PcSequenceSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PcSequenceSyncService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    for (const { seq, table } of SEQUENCE_TABLE_MAP) {
      try {
        await this.dataSource.query(
          `SELECT setval('${seq}', GREATEST(COALESCE((SELECT MAX(id) FROM ${table}), 1), 1))`,
        );
      } catch (err) {
        this.logger.warn(`시퀀스 동기화 실패: ${seq} — ${err.message}`);
      }
    }
    this.logger.log('PC 시퀀스 동기화 완료');
  }
}
