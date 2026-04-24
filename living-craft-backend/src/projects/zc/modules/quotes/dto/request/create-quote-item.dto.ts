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

  @ApiProperty({
    description: '단가',
    example: 50000,
  })
  @IsNumber()
  @Min(0)
  unitPrice: number;

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
