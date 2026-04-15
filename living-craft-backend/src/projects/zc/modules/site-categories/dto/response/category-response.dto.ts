import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ description: '카테고리 ID (UUID)' })
  id: string;

  @ApiProperty({ description: '사이트 ID' })
  siteId: string;

  @ApiProperty({ description: '사이트 카테고리 코드 (예: 001, 003001)', example: '001' })
  siteCategoryCode: string;

  @ApiProperty({ description: '카테고리명', example: '샤워기' })
  name: string;

  @ApiPropertyOptional({ description: '부모 카테고리 ID' })
  parentId?: string;

  @ApiProperty({ description: '카테고리 레벨 (1: 대분류, 2: 중분류)', example: 1 })
  level: number;

  @ApiProperty({ description: '카테고리 URL', example: 'https://www.dasis.co.kr/goods/goods_list.php?cateCd=001' })
  url: string;

  @ApiPropertyOptional({ description: '제품 개수', example: 50 })
  productCount?: number;

  @ApiProperty({ description: '생성일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시' })
  updatedAt: Date;
}

export class CategoryTreeResponseDto extends CategoryResponseDto {
  @ApiPropertyOptional({ description: '하위 카테고리', type: [CategoryTreeResponseDto] })
  children?: CategoryTreeResponseDto[];
}
