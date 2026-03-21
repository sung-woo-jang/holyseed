import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { IconType } from '../enums/icon-type.enum';
import { Service } from '@modules/services/entities/service.entity';
import { Promotion } from '@modules/promotions/entities/promotion.entity';

/**
 * 아이콘 엔티티
 * TDS (Toss Design System) 아이콘 마스터 데이터
 */
@Entity('icons')
export class Icon extends BaseEntity {
  /**
   * 아이콘 이름
   * @example "icon-account-fill"
   */
  @Column({ name: 'name', length: 200, unique: true })
  name: string;

  /**
   * 아이콘 타입
   * FILL, MONO, COLOR 중 하나
   */
  @Column({
    name: 'type',
    type: 'enum',
    enum: IconType,
    default: IconType.MONO,
  })
  type: IconType;

  /**
   * 이 아이콘을 사용하는 서비스 목록
   */
  @OneToMany(() => Service, (service) => service.icon)
  services: Service[];

  /**
   * 이 아이콘을 사용하는 프로모션 목록
   */
  @OneToMany(() => Promotion, (promotion) => promotion.icon)
  promotions: Promotion[];
}
