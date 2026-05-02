import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdatePriceDto {
  @ApiPropertyOptional({ description: '자재 원가 (연결된 listing 최저가 또는 수동 입력)', example: 500000 })
  @IsOptional()
  @IsNumber({}, { message: '자재 원가는 숫자여야 합니다.' })
  @Min(0)
  materialCost?: number;

  @ApiPropertyOptional({ description: '시공비 (고정)', example: 100000 })
  @IsOptional()
  @IsNumber({}, { message: '시공비는 숫자여야 합니다.' })
  @Min(0)
  laborCost?: number;


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
