import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DistrictLevel } from '@common/enums/district-level.enum';

/**
 * 행정구역 조회 응답 DTO
 */
export class DistrictDto {
  @ApiProperty({
    description: 'District ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '법정동 코드 (10자리)',
    example: '1111010100',
  })
  code: string;

  @ApiProperty({
    description: '단일 이름 (예: 서울특별시, 종로구, 청운동)',
    example: '서울특별시',
  })
  name: string;

  @ApiProperty({
    description: '전체 이름 (예: 서울특별시 종로구 청운동)',
    example: '서울특별시',
  })
  fullName: string;

  @ApiProperty({
    description: '행정구역 레벨',
    enum: DistrictLevel,
    example: DistrictLevel.SIDO,
  })
  level: DistrictLevel;

  @ApiPropertyOptional({
    description: '상위 행정구역 ID',
    example: null,
  })
  parentId: number | null;
}
