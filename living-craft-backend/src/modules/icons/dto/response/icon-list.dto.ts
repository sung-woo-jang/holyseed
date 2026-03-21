import { ApiProperty } from '@nestjs/swagger';
import { IconType } from '@modules/icons/enums/icon-type.enum';

/**
 * 아이콘 목록 조회 응답 DTO
 */
export class IconListDto {
  @ApiProperty({
    description: '아이콘 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '아이콘 이름',
    example: 'icon-account-fill',
  })
  name: string;

  @ApiProperty({
    description: '아이콘 타입',
    enum: IconType,
    example: IconType.FILL,
  })
  type: IconType;

  @ApiProperty({
    description: '생성일',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;
}
