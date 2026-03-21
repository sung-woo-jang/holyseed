import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PortfolioListItemDto {
  @ApiProperty({
    description: '포트폴리오 ID',
    example: '1',
  })
  id: string;

  @ApiProperty({
    description: '카테고리',
    example: '인테리어필름',
  })
  category: string;

  @ApiProperty({
    description: '프로젝트명',
    example: '강남 오피스텔 인테리어 필름 시공',
  })
  projectName: string;

  @ApiProperty({
    description: '간단 설명',
    example: '고급 인테리어 필름으로 새 집처럼 변신',
  })
  description: string;

  @ApiProperty({
    description: '대표 이미지 URL',
    example: 'https://example.com/image1.jpg',
  })
  thumbnailImage: string;

  @ApiPropertyOptional({
    description: '태그 목록',
    example: ['대리석', '싱크대', '리모델링'],
  })
  tags?: string[];
}

export class PortfolioListResponseDto {
  @ApiProperty({
    description: '포트폴리오 목록',
    type: [PortfolioListItemDto],
  })
  items: PortfolioListItemDto[];

  @ApiProperty({
    description: '전체 개수',
    example: 20,
  })
  total: number;
}
