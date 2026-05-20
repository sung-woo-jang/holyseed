import { IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertPriceDto {
  @ApiProperty({ description: '제품 ID', example: 1 })
  @IsInt({ message: '제품 ID는 정수여야 합니다.' })
  productId: number;

  @ApiProperty({ description: '업체 ID', example: 1 })
  @IsInt({ message: '업체 ID는 정수여야 합니다.' })
  vendorId: number;

  @ApiProperty({ description: '가격', example: 46000 })
  @IsNumber({}, { message: '가격은 숫자여야 합니다.' })
  @Min(0, { message: '가격은 0 이상이어야 합니다.' })
  price: number;

  @ApiPropertyOptional({ description: '통화', default: 'KRW' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @ApiPropertyOptional({ description: '비고', example: '택배비포함' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;

  @ApiPropertyOptional({ description: '견적일', example: '2025-05-01' })
  @IsOptional()
  @IsDateString()
  quotedAt?: string;
}
