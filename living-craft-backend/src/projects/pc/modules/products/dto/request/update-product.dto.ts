import { IsString, IsInt, IsOptional, IsBoolean, MaxLength, IsArray, ValidateNested, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewItemDto {
  @IsString() @MaxLength(60) name: string;
  @IsString() @MaxLength(60) area: string;
  @IsNumber() @Min(1) @Max(5) stars: number;
  @IsString() @MaxLength(500) text: string;
}

export class FaqItemDto {
  @IsString() @MaxLength(200) q: string;
  @IsString() @MaxLength(1000) a: string;
}

export class TrustBadgeItemDto {
  @IsString() @MaxLength(10) icon: string;
  @IsString() @MaxLength(60) title: string;
  @IsString() @MaxLength(200) desc: string;
}

export class InstallStepItemDto {
  @IsString() @MaxLength(60) title: string;
  @IsString() @MaxLength(300) desc: string;
}

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

  @ApiPropertyOptional({ description: '고객 노출 소개문' })
  @IsOptional()
  @IsString()
  intro?: string;

  @ApiPropertyOptional({ description: '태그라인' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tagline?: string;

  @ApiPropertyOptional({ description: '후기 목록' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewItemDto)
  reviews?: ReviewItemDto[];

  @ApiPropertyOptional({ description: 'FAQ 목록' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqItemDto)
  faqs?: FaqItemDto[];

  @ApiPropertyOptional({ description: '신뢰 배지 목록' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrustBadgeItemDto)
  trustBadges?: TrustBadgeItemDto[];

  @ApiPropertyOptional({ description: '시공 단계 목록' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstallStepItemDto)
  installSteps?: InstallStepItemDto[];

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
