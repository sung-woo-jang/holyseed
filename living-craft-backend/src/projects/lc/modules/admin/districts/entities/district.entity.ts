import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { DistrictLevel } from '@common/enums/district-level.enum';

/**
 * 행정구역 엔티티
 *
 * 전국 행정구역 데이터를 3단계 계층 구조로 관리합니다.
 * - 시/도 (SIDO)
 * - 시/군/구 (SIGUNGU)
 * - 읍/면/동 (EUPMYEONDONG)
 *
 * Self-referencing 관계를 사용하여 부모-자식 관계를 표현합니다.
 */
@Entity('districts')
@Index(['code'])
@Index(['parentId'])
@Index(['level'])
@Index(['isActive'])
@Index(['level', 'parentId', 'isActive'])
export class District extends BaseEntity {
  @ApiProperty({
    description: '법정동 코드 (10자리)',
    example: '1111010100',
    maxLength: 10,
  })
  @Column({
    type: 'varchar',
    length: 10,
    unique: true,
    comment: '법정동 코드 (10자리)',
  })
  code: string;

  @ApiProperty({
    description: '전체 이름 (예: 서울특별시 종로구 청운동)',
    example: '서울특별시 종로구 청운동',
    maxLength: 200,
  })
  @Column({
    type: 'varchar',
    length: 200,
    comment: '행정구역 전체 이름',
  })
  fullName: string;

  @ApiProperty({
    description: '단일 이름 (예: 청운동)',
    example: '청운동',
    maxLength: 100,
  })
  @Column({
    type: 'varchar',
    length: 100,
    comment: '행정구역 단일 이름',
  })
  name: string;

  @ApiProperty({
    description: '행정구역 레벨',
    enum: DistrictLevel,
    example: DistrictLevel.EUPMYEONDONG,
  })
  @Column({
    type: 'enum',
    enum: DistrictLevel,
    comment:
      '행정구역 레벨 (SIDO: 시/도, SIGUNGU: 시/군/구, EUPMYEONDONG: 읍/면/동)',
  })
  level: DistrictLevel;

  @ApiProperty({
    description: '활성화 여부',
    example: true,
  })
  @Column({
    type: 'boolean',
    default: true,
    comment: '활성화 여부',
  })
  isActive: boolean;

  @ApiProperty({
    description: '폐지 여부 (항상 false, 폐지된 구역은 DB에 저장하지 않음)',
    example: false,
  })
  @Column({
    type: 'boolean',
    default: false,
    comment: '폐지 여부 (항상 false, 폐지된 구역은 DB에 저장하지 않음)',
  })
  isAbandoned: boolean;

  @ApiPropertyOptional({
    description: '상위 행정구역 (부모)',
    type: () => District,
  })
  @ManyToOne(() => District, (district) => district.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: District;

  @ApiPropertyOptional({
    description: '상위 행정구역 ID',
    example: 10,
  })
  @Column({
    type: 'int',
    nullable: true,
    name: 'parent_id',
    comment: '상위 행정구역 ID',
  })
  parentId: number;

  @ApiPropertyOptional({
    description: '하위 행정구역 목록',
    type: () => [District],
  })
  @OneToMany(() => District, (district) => district.parent)
  children: District[];
}
