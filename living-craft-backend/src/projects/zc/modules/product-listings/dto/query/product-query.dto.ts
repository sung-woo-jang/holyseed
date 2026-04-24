import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsString, IsUUID, IsBoolean } from 'class-validator';

export class ProductQueryDto {
  @ApiPropertyOptional({ description: '페이지 번호', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지당 개수', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: '카테고리 ID (UUID)' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: '브랜드 ID (UUID)' })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({ description: '사이트 코드 (dasis, wooribath)' })
  @IsOptional()
  @IsString()
  siteCode?: string;

  @ApiPropertyOptional({ description: '매칭 여부 (true: 매칭됨, false: 미매칭, undefined: 전체)' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasModel?: boolean;

  @ApiPropertyOptional({ description: '검색어 (제품명)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '최소 가격' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: '최대 가격' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: '할인 상품만 조회', example: false })
  @IsOptional()
  onSale?: boolean;
}
