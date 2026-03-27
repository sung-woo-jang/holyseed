import { ApiProperty } from '@nestjs/swagger';

export class TimeSlotConfigResponseDto {
  @ApiProperty({
    description: '가능한 요일 목록',
    example: ['mon', 'tue', 'wed', 'thu', 'fri'],
  })
  availableDays: string[];

  @ApiProperty({
    description: '시작 시간',
    example: '18:00',
  })
  startTime: string;

  @ApiProperty({
    description: '종료 시간',
    example: '22:00',
  })
  endTime: string;

  @ApiProperty({
    description: '슬롯 간격 (분)',
    example: 60,
  })
  slotDuration: number;
}

export class OperatingHoursResponseDto {
  @ApiProperty({
    description: '견적 시간 설정',
    type: TimeSlotConfigResponseDto,
  })
  estimate: TimeSlotConfigResponseDto;

  @ApiProperty({
    description: '시공 시간 설정',
    type: TimeSlotConfigResponseDto,
  })
  construction: TimeSlotConfigResponseDto;

  @ApiProperty({
    description: '휴무일 목록 (YYYY-MM-DD)',
    example: ['2024-01-01', '2024-02-09', '2024-02-10'],
  })
  holidays: string[];
}
