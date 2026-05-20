import { IsString, IsInt, IsOptional, IsBoolean, MaxLength, Min, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: '모델코드 (고유)', example: 'G60AL' })
  @IsString({ message: '모델코드는 문자열이어야 합니다.' })
  @MaxLength(120, { message: '모델코드는 120자를 초과할 수 없습니다.' })
  @Transform(({ value }) => value?.trim())
  modelCode: string;

  @ApiProperty({ description: '표시명', example: 'G60 실버 슬라이드후드' })
  @IsString({ message: '표시명은 문자열이어야 합니다.' })
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  displayName: string;

  @ApiProperty({ description: '카테고리 ID', example: 2 })
  @IsInt({ message: '카테고리 ID는 정수여야 합니다.' })
  categoryId: number;

  @ApiPropertyOptional({ description: '브랜드', example: '린나이' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }) => value?.trim())
  brand?: string;

  @ApiPropertyOptional({ description: '사양/스펙', example: '기본형 실버 가로600' })
  @IsOptional()
  @IsString()
  spec?: string;

  @ApiPropertyOptional({ description: '단위', default: 'EA' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @ApiPropertyOptional({ description: '비고' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: '활성 여부', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
