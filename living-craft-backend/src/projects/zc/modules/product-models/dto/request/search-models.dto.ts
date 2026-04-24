import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsBoolean, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchModelsDto {
  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지당 개수', default: 20 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;

  @ApiPropertyOptional({ description: '검색어 (모델명, 표시명)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '브랜드 ID' })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({ description: '활성화 여부' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({ description: '최소 판매가' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  minSellingPrice?: number;

  @ApiPropertyOptional({ description: '최대 판매가' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  maxSellingPrice?: number;
}
