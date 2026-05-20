import { IsInt, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompareProductsDto {
  @ApiProperty({ description: '비교 기준 카테고리 ID', example: 2 })
  @IsInt({ message: '카테고리 ID는 정수여야 합니다.' })
  categoryId: number;

  @ApiPropertyOptional({ description: '하위 카테고리 포함 여부', default: true })
  @IsOptional()
  @IsBoolean()
  includeDescendants?: boolean;
}
