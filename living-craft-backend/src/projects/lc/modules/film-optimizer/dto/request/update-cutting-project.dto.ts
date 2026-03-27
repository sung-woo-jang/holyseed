import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PackingResultJson } from '../../entities/cutting-project.entity';

/**
 * 재단 프로젝트 수정 DTO
 */
export class UpdateCuttingProjectDto {
  @ApiPropertyOptional({
    description: '프로젝트 이름',
    example: '거실 필름 시공 (수정)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString({ message: '프로젝트 이름은 문자열이어야 합니다.' })
  @MaxLength(200, { message: '프로젝트 이름은 200자를 초과할 수 없습니다.' })
  name?: string;

  @ApiPropertyOptional({
    description: '필름지 ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: '필름지 ID는 숫자여야 합니다.' })
  @Min(1, { message: '필름지 ID는 1 이상이어야 합니다.' })
  filmId?: number;

  @ApiPropertyOptional({
    description: '회전 허용 여부',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: '회전 허용 여부는 boolean이어야 합니다.' })
  allowRotation?: boolean;

  @ApiPropertyOptional({
    description: '손실율 (%)',
    example: 12.5,
  })
  @IsOptional()
  @IsNumber({}, { message: '손실율은 숫자여야 합니다.' })
  @Min(0, { message: '손실율은 0 이상이어야 합니다.' })
  wastePercentage?: number;

  @ApiPropertyOptional({
    description: '사용된 필름 길이 (mm)',
    example: 2450,
  })
  @IsOptional()
  @IsNumber({}, { message: '사용된 필름 길이는 숫자여야 합니다.' })
  @Min(0, { message: '사용된 필름 길이는 0 이상이어야 합니다.' })
  usedLength?: number;

  @ApiPropertyOptional({
    description: '패킹 결과 JSON',
  })
  @IsOptional()
  packingResult?: PackingResultJson;
}
