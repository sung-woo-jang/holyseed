import { ApiProperty } from '@nestjs/swagger';

export class AdminCustomerListItemDto {
  @ApiProperty({ description: '고객 ID' })
  id: string;

  @ApiProperty({ description: '고객 이름' })
  name: string;

  @ApiProperty({ description: '전화번호' })
  phone: string;

  @ApiProperty({ description: '총 예약 수' })
  totalReservations: number;

  @ApiProperty({ description: '총 리뷰 수' })
  totalReviews: number;

  @ApiProperty({ description: '가입 일시' })
  createdAt: string;
}

export class AdminCustomerListResponseDto {
  @ApiProperty({ type: [AdminCustomerListItemDto] })
  items: AdminCustomerListItemDto[];

  @ApiProperty({ description: '전체 개수' })
  total: number;
}
