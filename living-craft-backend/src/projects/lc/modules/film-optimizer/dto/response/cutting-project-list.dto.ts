import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 재단 프로젝트 목록 아이템 DTO
 */
export class CuttingProjectListItemDto {
  @ApiProperty({
    description: '프로젝트 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '프로젝트 이름',
    example: '거실 필름 시공',
  })
  name: string;

  @ApiProperty({
    description: '필름지 ID',
    example: 1,
  })
  filmId: number;

  @ApiProperty({
    description: '필름지 이름',
    example: '인테리어 필름 (일반)',
  })
  filmName: string;

  @ApiProperty({
    description: '필름 폭 (mm)',
    example: 1220,
  })
  filmWidth: number;

  @ApiProperty({
    description: '필름 길이 (mm)',
    example: 60000,
  })
  filmLength: number;

  @ApiProperty({
    description: '회전 허용 여부',
    example: true,
  })
  allowRotation: boolean;

  @ApiPropertyOptional({
    description: '손실율 (%)',
    example: 12.5,
  })
  wastePercentage: number | null;

  @ApiPropertyOptional({
    description: '사용된 필름 길이 (mm)',
    example: 2450,
  })
  usedLength: number | null;

  @ApiProperty({
    description: '재단 조각 수',
    example: 8,
  })
  pieceCount: number;

  @ApiProperty({
    description: '완료된 조각 수',
    example: 3,
  })
  completedPieceCount: number;

  @ApiProperty({
    description: '생성일시',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;
}
