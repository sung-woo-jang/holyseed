import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsInt, Min, MaxLength } from 'class-validator';

export class UpdateManualListingDto {
  @ApiPropertyOptional({ description: '제품명' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  productName?: string;

  @ApiPropertyOptional({ description: '현재 가격' })
  @IsOptional()
  @IsInt()
  @Min(0)
  currentPrice?: number;

  @ApiPropertyOptional({ description: '할인가 (null 전달 시 제거)' })
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

  @ApiPropertyOptional({ description: '가격 출처 메모' })
  @IsOptional()
  @IsString()
  manualPriceNote?: string;
}
