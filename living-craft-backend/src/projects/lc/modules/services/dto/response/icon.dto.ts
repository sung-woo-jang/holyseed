import { ApiProperty } from '@nestjs/swagger';
import { IconType } from '@lc/modules/icons/enums/icon-type.enum';

/**
 * 아이콘 정보 DTO (간소화)
 */
export class IconDto {
  @ApiProperty({
    description: '아이콘 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '아이콘 이름',
    example: 'icon-home-blue-fill',
  })
  name: string;

  @ApiProperty({
    description: '아이콘 타입',
    enum: IconType,
  })
  type: IconType;
}
