import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  IsObject,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 고정 위치 DTO
 */
class FixedPositionInputDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;

  @IsBoolean()
  rotated: boolean;
}

/**
 * 재단 조각 입력 DTO
 */
export class CuttingPieceInputDto {
  @ApiProperty({
    description: '조각 폭 (mm)',
    example: 500,
  })
  @IsNumber({}, { message: '조각 폭은 숫자여야 합니다.' })
  @Min(1, { message: '조각 폭은 1mm 이상이어야 합니다.' })
  width: number;

  @ApiProperty({
    description: '조각 높이 (mm)',
    example: 400,
  })
  @IsNumber({}, { message: '조각 높이는 숫자여야 합니다.' })
  @Min(1, { message: '조각 높이는 1mm 이상이어야 합니다.' })
  height: number;

  @ApiPropertyOptional({
    description: '수량',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: '수량은 숫자여야 합니다.' })
  @Min(1, { message: '수량은 1개 이상이어야 합니다.' })
  quantity?: number;

  @ApiPropertyOptional({
    description: '라벨 (예: 거실 창문 1)',
    example: '거실 창문 1',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: '라벨은 문자열이어야 합니다.' })
  @MaxLength(100, { message: '라벨은 100자를 초과할 수 없습니다.' })
  label?: string;

  @ApiPropertyOptional({
    description: '재단 완료 여부',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: '완료 여부는 boolean이어야 합니다.' })
  isCompleted?: boolean;

  @ApiPropertyOptional({
    description: '완료된 조각의 고정 위치',
    example: { x: 0, y: 0, width: 500, height: 400, rotated: false },
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => FixedPositionInputDto)
  fixedPosition?: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotated: boolean;
  };
}

/**
 * 재단 프로젝트 생성 DTO
 */
export class CreateCuttingProjectDto {
  @ApiProperty({
    description: '프로젝트 이름',
    example: '거실 필름 시공',
    maxLength: 200,
  })
  @IsString({ message: '프로젝트 이름은 문자열이어야 합니다.' })
  @MaxLength(200, { message: '프로젝트 이름은 200자를 초과할 수 없습니다.' })
  name: string;

  @ApiProperty({
    description: '필름지 ID',
    example: 1,
  })
  @IsNumber({}, { message: '필름지 ID는 숫자여야 합니다.' })
  @Min(1, { message: '필름지 ID는 1 이상이어야 합니다.' })
  filmId: number;

  @ApiPropertyOptional({
    description: '회전 허용 여부',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: '회전 허용 여부는 boolean이어야 합니다.' })
  allowRotation?: boolean;

  @ApiPropertyOptional({
    description: '재단 조각 목록',
    type: [CuttingPieceInputDto],
  })
  @IsOptional()
  @IsArray({ message: '조각 목록은 배열이어야 합니다.' })
  @ValidateNested({ each: true })
  @Type(() => CuttingPieceInputDto)
  pieces?: CuttingPieceInputDto[];
}
