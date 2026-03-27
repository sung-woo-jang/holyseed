import { ApiProperty } from '@nestjs/swagger';
import { IconListDto } from './icon-list.dto';

/**
 * 아이콘 목록 페이지네이션 응답 DTO
 */
export class IconListPaginatedDto {
  @ApiProperty({
    description: '아이콘 목록',
    type: [IconListDto],
  })
  items: IconListDto[];

  @ApiProperty({
    description: '전체 아이콘 개수',
    example: 3355,
  })
  total: number;

  @ApiProperty({
    description: '현재 페이지의 아이템 개수',
    example: 100,
  })
  count: number;

  @ApiProperty({
    description: '페이지 크기 (limit)',
    example: 100,
  })
  limit: number;

  @ApiProperty({
    description: '오프셋 (건너뛴 개수)',
    example: 0,
  })
  offset: number;
}
