import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, MaxLength, IsBoolean, IsNumber, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateModelDto {
  @ApiPropertyOptional({ description: '브랜드 ID' })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiProperty({ description: '모델명', example: 'DST-6000' })
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  modelName: string;

  @ApiProperty({ description: '표시용 제품명', example: '대림바스 DST-6000 비데일체형 양변기' })
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  displayName: string;

  @ApiPropertyOptional({ description: '제품 설명' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  description?: string;

  @ApiPropertyOptional({ description: '스펙 정보 (JSON)' })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, string>;

  @ApiPropertyOptional({ description: '대표 이미지 URL' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: '활성화 여부', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '원가 (최저가 자동 계산)' })
  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @ApiPropertyOptional({ description: '판매가 (사용자 설정)' })
  @IsOptional()
  @IsNumber()
  sellingPrice?: number;

  @ApiPropertyOptional({ description: '가격 메모' })
  @IsOptional()
  @IsString()
  priceNote?: string;
}
