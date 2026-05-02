import { IsString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuoteItemDto {
  @ApiPropertyOptional({
    description: '제품 모델 ID (선택사항)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  productModelId?: string;

  @ApiProperty({
    description: '제품명',
    example: '코헬러 K-123 샤워헤드',
  })
  @IsString()
  productName: string;

  @ApiProperty({
    description: '수량',
    example: 2,
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: '자재 단가 (자재가 × (1 + 마진율)). 미입력 시 ProductModel에서 자동 계산.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  materialPrice?: number;

  @ApiPropertyOptional({ description: '시공비 단가. 미입력 시 ProductModel에서 자동 채움.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  laborPrice?: number;

  @ApiPropertyOptional({
    description: '단가 (= materialPrice + laborPrice). materialPrice/laborPrice 지정 시 무시됨.',
    example: 50000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({
    description: '항목 메모',
    example: '설치비 포함',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description: '정렬 순서',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
