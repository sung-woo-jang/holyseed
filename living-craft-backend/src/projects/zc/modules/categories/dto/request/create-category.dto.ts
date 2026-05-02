import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsUUID, Min, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: '카테고리명', example: '양변기' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '상위 카테고리 ID' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: '정렬 순서', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: '설명' })
  @IsOptional()
  @IsString()
  description?: string;
}
