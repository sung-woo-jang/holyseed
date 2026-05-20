import { IsString, IsOptional, IsInt, IsNumber, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiPropertyOptional({ description: '부모 카테고리 ID (없으면 최상위)', example: 1 })
  @IsOptional()
  @IsInt({ message: '부모 카테고리 ID는 정수여야 합니다.' })
  parentId?: number;

  @ApiProperty({ description: '카테고리명', example: '주방후드' })
  @IsString({ message: '카테고리명은 문자열이어야 합니다.' })
  @MaxLength(80, { message: '카테고리명은 80자를 초과할 수 없습니다.' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({ description: '정렬 순서', default: 0 })
  @IsOptional()
  @IsNumber({}, { message: '정렬 순서는 숫자여야 합니다.' })
  @Min(0)
  sortOrder?: number;
}
