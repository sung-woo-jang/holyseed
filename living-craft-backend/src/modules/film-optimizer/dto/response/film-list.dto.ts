import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 필름지 목록 아이템 DTO
 */
export class FilmListItemDto {
  @ApiProperty({
    description: '필름지 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '필름지 이름',
    example: '인테리어 필름 (일반)',
  })
  name: string;

  @ApiProperty({
    description: '필름 폭 (mm)',
    example: 1220,
  })
  width: number;

  @ApiProperty({
    description: '필름 길이 (mm)',
    example: 60000,
  })
  length: number;

  @ApiPropertyOptional({
    description: '필름지 설명',
    example: '일반 인테리어용 필름지입니다.',
  })
  description: string | null;

  @ApiProperty({
    description: '활성화 여부',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: '재단 프로젝트 수',
    example: 5,
  })
  projectCount: number;

  @ApiProperty({
    description: '생성일시',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;
}

/**
 * 필름지 상세 DTO
 */
export class FilmDetailDto extends FilmListItemDto {
  @ApiProperty({
    description: '수정일시',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}
