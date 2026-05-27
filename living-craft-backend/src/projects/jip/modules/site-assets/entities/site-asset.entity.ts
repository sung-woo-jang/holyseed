import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('site_assets', { schema: 'jip' })
export class SiteAsset extends BaseEntity {
  @Column({ length: 100, unique: true })
  key: string;

  @Column({ name: 'image_url', length: 500 })
  imageUrl: string;

  @Column({ length: 200, nullable: true })
  caption: string;
}
