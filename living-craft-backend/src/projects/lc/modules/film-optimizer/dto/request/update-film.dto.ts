import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 필름지 수정 DTO
 */
export class UpdateFilmDto {
  @ApiPropertyOptional({
    description: '필름지 이름',
    example: '인테리어 필름 (프리미엄)',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: '필름지 이름은 문자열이어야 합니다.' })
  @MaxLength(100, { message: '필름지 이름은 100자를 초과할 수 없습니다.' })
  name?: string;

  @ApiPropertyOptional({
    description: '필름 폭 (mm)',
    example: 1220,
  })
  @IsOptional()
  @IsNumber({}, { message: '필름 폭은 숫자여야 합니다.' })
  @Min(1, { message: '필름 폭은 1mm 이상이어야 합니다.' })
  width?: number;

  @ApiPropertyOptional({
    description: '필름 길이 (mm)',
    example: 60000,
  })
  @IsOptional()
  @IsNumber({}, { message: '필름 길이는 숫자여야 합니다.' })
  @Min(1, { message: '필름 길이는 1mm 이상이어야 합니다.' })
  length?: number;

  @ApiPropertyOptional({
    description: '필름지 설명',
    example: '프리미엄 인테리어용 필름지입니다.',
  })
  @IsOptional()
  @IsString({ message: '설명은 문자열이어야 합니다.' })
  description?: string;

  @ApiPropertyOptional({
    description: '활성화 여부',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: '활성화 여부는 boolean이어야 합니다.' })
  isActive?: boolean;
}
