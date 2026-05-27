import { IsString, IsInt, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiPropertyOptional({ description: '모델코드', example: 'G60AL' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => value?.trim())
  modelCode?: string;

  @ApiPropertyOptional({ description: '표시명' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  displayName?: string;

  @ApiPropertyOptional({ description: '카테고리 ID' })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ description: '브랜드' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }) => value?.trim())
  brand?: string;

  @ApiPropertyOptional({ description: '사양/스펙' })
  @IsOptional()
  @IsString()
  spec?: string;

  @ApiPropertyOptional({ description: '단위' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @ApiPropertyOptional({ description: '설명 (내부 메모용)' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '비고' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: '활성 여부' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '고객 URL 코드 (고유)', example: 'k1-1' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  code?: string;

  @ApiPropertyOptional({ description: 'ServiceItem ID' })
  @IsOptional()
  @IsInt()
  serviceItemId?: number;

  @ApiPropertyOptional({ description: '일러스트 종류' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  illustKind?: string;

  @ApiPropertyOptional({ description: '노출 순서' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
