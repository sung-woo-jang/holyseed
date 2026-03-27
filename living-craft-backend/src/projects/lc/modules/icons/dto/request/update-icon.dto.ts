import { IsString, IsEnum, MaxLength, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IconType } from '../../enums/icon-type.enum';

/**
 * 아이콘 수정 DTO
 */
export class UpdateIconDto {
  /**
   * 아이콘 이름
   * @example 'icon-account-fill'
   */
  @ApiPropertyOptional({
    description: '아이콘 이름',
    example: 'icon-account-fill',
    maxLength: 200,
  })
  @IsOptional()
  @IsString({ message: '아이콘 이름은 문자열이어야 합니다.' })
  @MaxLength(200, { message: '아이콘 이름은 200자를 초과할 수 없습니다.' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  /**
   * 아이콘 타입
   * @example IconType.MONO
   */
  @ApiPropertyOptional({
    description: '아이콘 타입',
    enum: IconType,
    example: IconType.MONO,
  })
  @IsOptional()
  @IsEnum(IconType, { message: '유효한 아이콘 타입을 선택해주세요.' })
  type?: IconType;
}
