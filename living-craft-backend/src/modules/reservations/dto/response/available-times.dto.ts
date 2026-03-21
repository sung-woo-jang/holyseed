import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TimeSlotDto {
  @ApiProperty({
    description: '시간 (HH:mm)',
    example: '18:00',
  })
  time: string;

  @ApiProperty({
    description: '예약 가능 여부',
    example: true,
  })
  available: boolean;
}

export class AvailableTimesResponseDto {
  @ApiProperty({
    description: '조회 날짜',
    example: '2024-01-15',
  })
  date: string;

  @ApiProperty({
    description: '요일',
    example: '월',
  })
  dayOfWeek: string;

  @ApiProperty({
    description: '해당 날짜 전체 예약 가능 여부 (휴무일 등)',
    example: true,
  })
  isAvailable: boolean;

  @ApiProperty({
    description: '가능한 시간대 목록',
    type: [TimeSlotDto],
  })
  times: TimeSlotDto[];

  @ApiProperty({
    description: '하루 종일 작업 시 기본 시작 시간',
    example: '09:00',
  })
  defaultTime: string;

  @ApiPropertyOptional({
    description: '예약 불가 사유 (isAvailable이 false일 때만 반환)',
    example: '휴무일입니다.',
  })
  reason?: string;
}
