import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewServiceDto {
  @ApiProperty({
    description: '서비스 ID',
    example: '1',
  })
  id: string;

  @ApiProperty({
    description: '서비스 제목',
    example: '인테리어 필름',
  })
  title: string;
}

export class ReviewListItemDto {
  @ApiProperty({
    description: '리뷰 ID',
    example: '1',
  })
  id: string;

  @ApiProperty({
    description: '작성자 이름 (마스킹)',
    example: '홍*동',
  })
  userName: string;

  @ApiProperty({
    description: '서비스 정보',
    type: ReviewServiceDto,
  })
  service: ReviewServiceDto;

  @ApiProperty({
    description: '평점',
    example: 5,
  })
  rating: number;

  @ApiProperty({
    description: '리뷰 내용',
    example: '친절하고 깔끔하게 시공해주셨습니다.',
  })
  comment: string;

  @ApiProperty({
    description: '작성 일시',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: string;
}

export class ReviewListResponseDto {
  @ApiProperty({
    description: '리뷰 목록',
    type: [ReviewListItemDto],
  })
  items: ReviewListItemDto[];

  @ApiProperty({
    description: '전체 개수',
    example: 50,
  })
  total: number;

  @ApiPropertyOptional({
    description: '평균 평점',
    example: 4.5,
  })
  averageRating?: number;
}

export class CreateReviewResponseDto {
  @ApiProperty({
    description: '리뷰 ID',
    example: '1',
  })
  id: string;

  @ApiProperty({
    description: '평점',
    example: 5,
  })
  rating: number;

  @ApiProperty({
    description: '리뷰 내용',
    example: '친절하고 깔끔하게 시공해주셨습니다.',
  })
  comment: string;

  @ApiProperty({
    description: '작성 일시',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: string;
}

export class MyReviewListItemDto {
  @ApiProperty({
    description: '리뷰 ID',
    example: '1',
  })
  id: string;

  @ApiProperty({
    description: '서비스 정보',
    type: ReviewServiceDto,
  })
  service: ReviewServiceDto;

  @ApiProperty({
    description: '평점',
    example: 5,
  })
  rating: number;

  @ApiProperty({
    description: '리뷰 내용',
    example: '친절하고 깔끔하게 시공해주셨습니다.',
  })
  comment: string;

  @ApiProperty({
    description: '작성 일시',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: string;
}

export class MyReviewListResponseDto {
  @ApiProperty({
    description: '리뷰 목록',
    type: [MyReviewListItemDto],
  })
  items: MyReviewListItemDto[];

  @ApiProperty({
    description: '전체 개수',
    example: 10,
  })
  total: number;
}
