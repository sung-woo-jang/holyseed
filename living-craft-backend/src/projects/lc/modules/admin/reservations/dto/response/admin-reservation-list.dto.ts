import { ApiProperty } from '@nestjs/swagger';

export class AdminReservationListItemDto {
  @ApiProperty({ description: '예약 ID' })
  id: string;

  @ApiProperty({ description: '예약 번호' })
  reservationNumber: string;

  @ApiProperty({ description: '고객명' })
  customerName: string;

  @ApiProperty({ description: '고객 전화번호' })
  customerPhone: string;

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

  @ApiProperty({ description: '주소' })
  address: string;

  @ApiProperty({ description: '예약 상태' })
  status: string;

  @ApiProperty({ description: '생성 일시' })
  createdAt: string;
}

export class AdminReservationListResponseDto {
  @ApiProperty({ type: [AdminReservationListItemDto] })
  items: AdminReservationListItemDto[];

  @ApiProperty({ description: '전체 개수' })
  total: number;
}
