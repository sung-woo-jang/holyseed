import { IsInt, IsOptional, IsString, IsBoolean, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchProductsDto {
  @ApiPropertyOptional({ description: '카테고리 ID', example: 2 })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ description: '카테고리 하위 포함 여부', default: true })
  @IsOptional()
  @IsBoolean()
  includeDescendants?: boolean;

  @ApiPropertyOptional({ description: '검색어 (모델코드/표시명/브랜드)', example: 'G60' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '브랜드', example: '린나이' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: '활성만 조회', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '페이지 크기', default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
