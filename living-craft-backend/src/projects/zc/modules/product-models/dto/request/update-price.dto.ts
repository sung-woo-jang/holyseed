import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdatePriceDto {
  @ApiPropertyOptional({
    description: '원가 (매입가)',
    example: 50000,
  })
  @IsOptional()
  @IsNumber({}, { message: '원가는 숫자여야 합니다.' })
  @Min(0, { message: '원가는 0 이상이어야 합니다.' })
  costPrice?: number;

  @ApiPropertyOptional({
    description: '판매가 (견적용)',
    example: 80000,
  })
  @IsOptional()
  @IsNumber({}, { message: '판매가는 숫자여야 합니다.' })
  @Min(0, { message: '판매가는 0 이상이어야 합니다.' })
  sellingPrice?: number;

  @ApiPropertyOptional({
    description: '마진율 (%)',
    example: 60,
  })
  @IsOptional()
  @IsNumber({}, { message: '마진율은 숫자여야 합니다.' })
  @Min(0, { message: '마진율은 0 이상이어야 합니다.' })
  marginRate?: number;

  @ApiPropertyOptional({
    description: '가격 메모',
    example: '프로모션 가격 적용',
  })
  @IsOptional()
  @IsString({ message: '가격 메모는 문자열이어야 합니다.' })
  @Transform(({ value }) => value?.trim())
  priceNote?: string;
}
