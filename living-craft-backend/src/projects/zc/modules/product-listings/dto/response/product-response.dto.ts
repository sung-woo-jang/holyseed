import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductImageDto {
  @ApiProperty({ description: '이미지 ID' })
  id: string;

  @ApiProperty({ description: '원본 이미지 URL' })
  originalUrl: string;

  @ApiProperty({ description: '이미지 타입', example: 'thumbnail' })
  type: string;

  @ApiProperty({ description: '정렬 순서' })
  sortOrder: number;
}

export class ProductResponseDto {
  @ApiProperty({ description: '제품 ID (UUID)' })
  id: string;

  @ApiProperty({ description: '사이트 제품 ID', example: '12345' })
  siteProductId: string;

  @ApiProperty({ description: '제품명', example: '파워업 샤워헤드' })
  productName: string;

  @ApiPropertyOptional({ description: '추출된 모델명' })
  extractedModelName?: string;

  @ApiProperty({ description: '현재 가격', example: 50000 })
  currentPrice: number;

  @ApiPropertyOptional({ description: '할인 가격', example: 45000 })
  currentDiscountPrice?: number;

  @ApiPropertyOptional({ description: '제품 설명' })
  description?: string;

  @ApiPropertyOptional({ description: '제조사' })
  manufacturer?: string;

  @ApiPropertyOptional({ description: '원산지' })
  origin?: string;

  @ApiProperty({ description: '제품 URL' })
  productUrl: string;

  @ApiProperty({ description: '판매 가능 여부', example: true })
  isAvailable: boolean;

  @ApiPropertyOptional({ description: '카테고리 정보' })
  category?: {
    id: string;
    name: string;
    siteCategoryCode: string;
  };

  @ApiPropertyOptional({ description: '브랜드 정보' })
  brand?: {
    id: string;
    name: string;
  };

  @ApiPropertyOptional({ description: '제품 이미지', type: [ProductImageDto] })
  images?: ProductImageDto[];

  @ApiProperty({ description: '마지막 크롤링 시간' })
  lastCrawledAt: Date;

  @ApiProperty({ description: '생성일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시' })
  updatedAt: Date;
}

export class ProductListResponseDto {
  @ApiProperty({ description: '제품 목록', type: [ProductResponseDto] })
  items: ProductResponseDto[];

  @ApiProperty({ description: '전체 개수', example: 811 })
  total: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지당 개수', example: 20 })
  limit: number;

  @ApiProperty({ description: '전체 페이지 수', example: 41 })
  totalPages: number;
}
