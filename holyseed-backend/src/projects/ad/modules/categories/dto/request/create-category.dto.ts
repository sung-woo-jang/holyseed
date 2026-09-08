import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { CategoryType, CostType } from '../../entities/category.entity';

export class CreateCategoryDto {
  @ApiProperty({ enum: CategoryType })
  @IsEnum(CategoryType)
  type: CategoryType;

  @ApiProperty({ description: '카테고리명' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ description: '아이콘' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: '색상 코드' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: '정렬 순서' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ description: '상위 카테고리 ID (지정 시 소분류로 생성)' })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiPropertyOptional({ enum: CostType, description: '기본 분류 (지출 카테고리에 소비 성격을 미리 지정 — 거래 기록 시 자동 반영됨)' })
  @IsOptional()
  @IsEnum(CostType)
  defaultCostType?: CostType;
}
