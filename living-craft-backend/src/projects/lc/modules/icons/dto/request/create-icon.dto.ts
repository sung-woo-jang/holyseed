import { IsString, IsEnum, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IconType } from '../../enums/icon-type.enum';

/**
 * 아이콘 생성 DTO
 */
export class CreateIconDto {
  /**
   * 아이콘 이름
   * @example 'icon-account-fill'
   */
  @ApiProperty({
    description: '아이콘 이름',
    example: 'icon-account-fill',
    maxLength: 200,
  })
  @IsString({ message: '아이콘 이름은 문자열이어야 합니다.' })
  @MaxLength(200, { message: '아이콘 이름은 200자를 초과할 수 없습니다.' })
  @Transform(({ value }) => value?.trim())
  name: string;

  /**
   * 아이콘 타입
   * @example IconType.FILL
   */
  @ApiProperty({
    description: '아이콘 타입',
    enum: IconType,
    example: IconType.FILL,
  })
  @IsEnum(IconType, { message: '유효한 아이콘 타입을 선택해주세요.' })
  type: IconType;
}
