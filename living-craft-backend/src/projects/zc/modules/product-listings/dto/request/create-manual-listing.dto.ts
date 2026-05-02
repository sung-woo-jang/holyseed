import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsInt, Min, MaxLength } from 'class-validator';

export class CreateManualListingDto {
  @ApiProperty({ description: '사이트 ID' })
  @IsUUID()
  siteId: string;

  @ApiProperty({ description: '제품명', example: 'VIVANT XA600 샤워기' })
  @IsString()
  @MaxLength(255)
  productName: string;

  @ApiProperty({ description: '현재 가격', example: 150000 })
  @IsInt()
  @Min(0)
  currentPrice: number;

  @ApiPropertyOptional({ description: '할인가' })
  @IsOptional()
  @IsInt()
  @Min(0)
  currentDiscountPrice?: number;

  @ApiPropertyOptional({ description: '브랜드 ID' })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({ description: '사이트 카테고리 ID' })
  @IsOptional()
  @IsUUID()
  siteCategoryId?: string;

  @ApiPropertyOptional({ description: '제품 URL' })
  @IsOptional()
  @IsString()
  productUrl?: string;

  @ApiPropertyOptional({ description: '가격 출처 메모', example: '쿠팡 검색 기준 2024-01' })
  @IsOptional()
  @IsString()
  manualPriceNote?: string;
}
