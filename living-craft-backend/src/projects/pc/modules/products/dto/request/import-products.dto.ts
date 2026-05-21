import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportPriceItemDto {
  @ApiProperty({ description: '업체명', example: 'A마트' })
  @IsString()
  vendor: string;

  @ApiProperty({ description: '가격', example: 46000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: '비고', example: '택배비포함' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}

export class ImportProductItemDto {
  @ApiPropertyOptional({ description: '카테고리 경로 (root→leaf)', example: ['주방후드', '슬라이드후드'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryPath?: string[];

  @ApiProperty({ description: '모델코드', example: 'G60AL' })
  @IsString()
  @MaxLength(120)
  modelCode: string;

  @ApiProperty({ description: '표시명', example: 'G60 실버' })
  @IsString()
  @MaxLength(200)
  displayName: string;

  @ApiPropertyOptional({ description: '브랜드' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  brand?: string;

  @ApiPropertyOptional({ description: '사양' })
  @IsOptional()
  @IsString()
  spec?: string;

  @ApiPropertyOptional({ description: '단위', default: 'EA' })
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

  @ApiPropertyOptional({ description: '업체별 가격 목록' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportPriceItemDto)
  prices?: ImportPriceItemDto[];
}

export class ImportOptionsDto {
  @ApiPropertyOptional({ description: '카테고리 자동 생성 (false 권장)', default: false })
  @IsOptional()
  @IsBoolean()
  autoCreateCategory?: boolean;

  @ApiPropertyOptional({ description: '업체 자동 생성 (false 권장)', default: false })
  @IsOptional()
  @IsBoolean()
  autoCreateVendor?: boolean;

  @ApiPropertyOptional({ description: '1개 실패 시 전체 롤백', default: false })
  @IsOptional()
  @IsBoolean()
  atomic?: boolean;
}

export class ImportProductsDto {
  @ApiPropertyOptional({ description: '임포트 옵션' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ImportOptionsDto)
  options?: ImportOptionsDto;

  @ApiProperty({ description: '임포트할 제품 목록', type: [ImportProductItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportProductItemDto)
  items: ImportProductItemDto[];
}
