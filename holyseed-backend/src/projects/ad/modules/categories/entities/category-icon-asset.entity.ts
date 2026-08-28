import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

/** 가구별로 업로드한 커스텀 카테고리 아이콘 이미지 라이브러리 — 카테고리가 삭제/변경돼도 계속 남아 재사용 가능 */
@Entity('category_icon_assets', { schema: 'ad' })
export class CategoryIconAsset extends BaseEntity {
  @Column({ name: 'household_id' })
  householdId: number;

  @Column({ length: 500 })
  url: string;

  @Column({ length: 255 })
  filename: string;
}
