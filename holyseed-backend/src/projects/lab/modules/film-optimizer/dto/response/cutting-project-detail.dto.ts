import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PackingResultJson } from '../../entities/cutting-project.entity';

/**
 * 재단 조각 응답 DTO
 */
export class CuttingPieceResponseDto {
  @ApiProperty({
    description: '조각 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '조각 폭 (mm)',
    example: 500,
  })
  width: number;

  @ApiProperty({
    description: '조각 높이 (mm)',
    example: 400,
  })
  height: number;

  @ApiProperty({
    description: '수량',
    example: 1,
  })
  quantity: number;

  @ApiPropertyOptional({
    description: '라벨',
    example: '거실 창문 1',
  })
  label: string | null;

  @ApiProperty({
    description: '정렬 순서',
    example: 1,
  })
  sortOrder: number;

  @ApiProperty({
    description: '재단 완료 여부',
    example: false,
  })
  isCompleted: boolean;

  @ApiPropertyOptional({
    description: '완료된 조각의 고정 위치',
    example: { x: 0, y: 0, width: 500, height: 400, rotated: false },
  })
  fixedPosition: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotated: boolean;
  } | null;

  @ApiProperty({
    description: '생성일시',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;
}

/**
 * 필름지 정보 DTO (프로젝트 상세용)
 */
export class FilmInfoDto {
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
}

/**
 * 재단 프로젝트 상세 DTO
 */
export class CuttingProjectDetailDto {
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
    description: '필름지 정보',
    type: FilmInfoDto,
  })
  film: FilmInfoDto;

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

  @ApiPropertyOptional({
    description: '패킹 결과 JSON',
  })
  packingResult: PackingResultJson | null;

  @ApiProperty({
    description: '재단 조각 목록',
    type: [CuttingPieceResponseDto],
  })
  pieces: CuttingPieceResponseDto[];

  @ApiProperty({
    description: '생성일시',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일시',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}
