import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { CategoryType } from '../../entities/category.entity';

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
}
