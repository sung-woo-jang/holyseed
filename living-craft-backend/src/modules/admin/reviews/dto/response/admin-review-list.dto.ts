import { ApiProperty } from '@nestjs/swagger';

export class AdminReviewListItemDto {
  @ApiProperty({ description: '리뷰 ID' })
  id: string;

  @ApiProperty({ description: '서비스명' })
  serviceName: string;

  @ApiProperty({ description: '고객명' })
  customerName: string;

  @ApiProperty({ description: '고객 전화번호' })
  customerPhone: string;

  @ApiProperty({ description: '예약 번호' })
  reservationNumber: string;

  @ApiProperty({ description: '평점' })
  rating: number;

  @ApiProperty({ description: '리뷰 내용' })
  comment: string;

  @ApiProperty({ description: '작성 일시' })
  createdAt: string;
}

export class AdminReviewListResponseDto {
  @ApiProperty({ type: [AdminReviewListItemDto] })
  items: AdminReviewListItemDto[];

  @ApiProperty({ description: '전체 개수' })
  total: number;
}
