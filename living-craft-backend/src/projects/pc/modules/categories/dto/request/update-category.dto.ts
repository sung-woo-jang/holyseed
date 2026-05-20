import { IsString, IsOptional, IsInt, IsNumber, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ description: '부모 카테고리 ID', example: 1 })
  @IsOptional()
  @IsInt({ message: '부모 카테고리 ID는 정수여야 합니다.' })
  parentId?: number;

  @ApiPropertyOptional({ description: '카테고리명', example: '주방후드' })
  @IsOptional()
  @IsString({ message: '카테고리명은 문자열이어야 합니다.' })
  @MaxLength(80)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({ description: '정렬 순서', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}
