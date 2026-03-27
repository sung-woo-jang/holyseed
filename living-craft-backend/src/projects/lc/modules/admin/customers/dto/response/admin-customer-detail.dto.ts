import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerReservationItemDto {
  @ApiProperty({ description: '예약 ID' })
  id: string;

  @ApiProperty({ description: '예약 번호' })
  reservationNumber: string;

  @ApiProperty({ description: '서비스명' })
  serviceName: string;

  @ApiProperty({ description: '견적 날짜' })
  estimateDate: string;

  @ApiProperty({ description: '견적 시간' })
  estimateTime: string;

  @ApiProperty({ description: '시공 날짜' })
  constructionDate: string;

  @ApiProperty({ description: '시공 시간', nullable: true })
  constructionTime: string | null;

  @ApiProperty({ description: '예약 상태' })
  status: string;

  @ApiProperty({ description: '취소 가능 여부' })
  canCancel: boolean;

  @ApiProperty({ description: '리뷰 작성 가능 여부' })
  canReview: boolean;
}

export class CustomerReviewItemDto {
  @ApiProperty({ description: '리뷰 ID' })
  id: string;

  @ApiProperty({ description: '서비스명' })
  serviceName: string;

  @ApiProperty({ description: '평점' })
  rating: number;

  @ApiProperty({ description: '리뷰 내용' })
  comment: string;

  @ApiProperty({ description: '작성 일시' })
  createdAt: string;
}

export class AdminCustomerDetailDto {
  @ApiProperty({ description: '고객 ID' })
  id: string;

  @ApiProperty({ description: '고객 이름' })
  name: string;

  @ApiProperty({ description: '전화번호' })
  phone: string;

  @ApiPropertyOptional({ description: '이메일' })
  email?: string;

  @ApiProperty({ description: '예약 목록', type: [CustomerReservationItemDto] })
  reservations: CustomerReservationItemDto[];

  @ApiProperty({ description: '리뷰 목록', type: [CustomerReviewItemDto] })
  reviews: CustomerReviewItemDto[];

  @ApiProperty({ description: '가입 일시' })
  createdAt: string;
}
