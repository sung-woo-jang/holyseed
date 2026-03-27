import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationStatus } from '../../entities';

export class ReservationServiceDto {
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

export class CreateReservationResponseDto {
  @ApiProperty({
    description: '예약 ID',
    example: '1',
  })
  id: string;

  @ApiProperty({
    description: '예약 번호',
    example: '20240115-0001',
  })
  reservationNumber: string;

  @ApiProperty({
    description: '예약 상태',
    enum: ReservationStatus,
    example: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @ApiProperty({
    description: '생성 일시',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: string;
}

export class ReservationDetailDto {
  @ApiProperty({
    description: '예약 ID',
    example: '1',
  })
  id: string;

  @ApiProperty({
    description: '예약 번호',
    example: '20240115-0001',
  })
  reservationNumber: string;

  @ApiProperty({
    description: '서비스 정보',
    type: ReservationServiceDto,
  })
  service: ReservationServiceDto;

  @ApiProperty({
    description: '견적 날짜',
    example: '2024-01-15',
  })
  estimateDate: string;

  @ApiProperty({
    description: '견적 시간',
    example: '18:00',
  })
  estimateTime: string;

  @ApiProperty({
    description: '시공 날짜',
    example: '2024-01-20',
  })
  constructionDate: string;

  @ApiPropertyOptional({
    description: '시공 시간 (null: 하루 종일)',
    example: '09:00',
  })
  constructionTime: string | null;

  @ApiProperty({
    description: '도로명 주소',
    example: '서울특별시 강남구 테헤란로 123',
  })
  address: string;

  @ApiProperty({
    description: '상세 주소',
    example: '2층 201호',
  })
  detailAddress: string;

  @ApiProperty({
    description: '고객 이름',
    example: '홍길동',
  })
  customerName: string;

  @ApiProperty({
    description: '고객 전화번호',
    example: '010-1234-5678',
  })
  customerPhone: string;

  @ApiProperty({
    description: '예약 상태',
    enum: ReservationStatus,
    example: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @ApiProperty({
    description: '취소 가능 여부',
    example: true,
  })
  canCancel: boolean;

  @ApiProperty({
    description: '리뷰 작성 가능 여부',
    example: false,
  })
  canReview: boolean;

  @ApiProperty({
    description: '생성 일시',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: string;
}

export class MyReservationListItemDto {
  @ApiProperty({
    description: '예약 ID',
    example: '1',
  })
  id: string;

  @ApiProperty({
    description: '예약 번호',
    example: '20240115-0001',
  })
  reservationNumber: string;

  @ApiProperty({
    description: '서비스 정보',
    type: ReservationServiceDto,
  })
  service: ReservationServiceDto;

  @ApiProperty({
    description: '견적 날짜',
    example: '2024-01-15',
  })
  estimateDate: string;

  @ApiProperty({
    description: '예약 상태',
    enum: ReservationStatus,
    example: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @ApiProperty({
    description: '생성 일시',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: string;
}

export class MyReservationListResponseDto {
  @ApiProperty({
    description: '예약 목록',
    type: [MyReservationListItemDto],
  })
  items: MyReservationListItemDto[];

  @ApiProperty({
    description: '전체 개수',
    example: 10,
  })
  total: number;
}
