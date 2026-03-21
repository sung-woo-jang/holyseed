import { ApiProperty } from '@nestjs/swagger';

export class UnavailableDateDto {
  @ApiProperty({
    description: '날짜 (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  date: string;

  @ApiProperty({
    description: '예약 불가 사유',
    example: '휴무일입니다.',
  })
  reason: string;
}

export class AvailableDatesResponseDto {
  @ApiProperty({
    description: '조회 연도',
    example: 2024,
  })
  year: number;

  @ApiProperty({
    description: '조회 월',
    example: 1,
  })
  month: number;

  @ApiProperty({
    description: '예약 불가능한 날짜 목록',
    type: [UnavailableDateDto],
  })
  unavailableDates: UnavailableDateDto[];

  @ApiProperty({
    description: '예약 가능 최대 날짜 (bookingPeriodMonths 기준)',
    example: '2024-04-30',
  })
  maxDate: string;
}
