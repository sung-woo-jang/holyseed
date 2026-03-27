import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 재단 조각 수정 DTO
 */
export class UpdatePieceDto {
  @ApiPropertyOptional({
    description: '조각 폭 (mm)',
    example: 500,
  })
  @IsOptional()
  @IsNumber({}, { message: '조각 폭은 숫자여야 합니다.' })
  @Min(1, { message: '조각 폭은 1mm 이상이어야 합니다.' })
  width?: number;

  @ApiPropertyOptional({
    description: '조각 높이 (mm)',
    example: 400,
  })
  @IsOptional()
  @IsNumber({}, { message: '조각 높이는 숫자여야 합니다.' })
  @Min(1, { message: '조각 높이는 1mm 이상이어야 합니다.' })
  height?: number;

  @ApiPropertyOptional({
    description: '수량',
    example: 2,
  })
  @IsOptional()
  @IsNumber({}, { message: '수량은 숫자여야 합니다.' })
  @Min(1, { message: '수량은 1개 이상이어야 합니다.' })
  quantity?: number;

  @ApiPropertyOptional({
    description: '라벨',
    example: '거실 창문 1',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: '라벨은 문자열이어야 합니다.' })
  @MaxLength(100, { message: '라벨은 100자를 초과할 수 없습니다.' })
  label?: string;

  @ApiPropertyOptional({
    description: '재단 완료 여부',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: '재단 완료 여부는 boolean이어야 합니다.' })
  isCompleted?: boolean;
}
