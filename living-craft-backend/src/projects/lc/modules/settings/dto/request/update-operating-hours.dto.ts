import {
  IsArray,
  IsString,
  IsEnum,
  Matches,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ERROR_MESSAGES } from '@common/constants';

export enum DayOfWeek {
  MON = 'mon',
  TUE = 'tue',
  WED = 'wed',
  THU = 'thu',
  FRI = 'fri',
  SAT = 'sat',
  SUN = 'sun',
}

export class TimeSlotConfigDto {
  @ApiProperty({
    description: '가능한 요일 목록',
    enum: DayOfWeek,
    isArray: true,
    example: ['mon', 'tue', 'wed', 'thu', 'fri'],
  })
  @IsArray({
    message: ERROR_MESSAGES.VALIDATION.IS_ARRAY('가능한 요일 목록'),
  })
  @ArrayNotEmpty({
    message: ERROR_MESSAGES.VALIDATION.ARRAY_NOT_EMPTY('가능한 요일 목록'),
  })
  @IsEnum(DayOfWeek, {
    each: true,
    message: ERROR_MESSAGES.VALIDATION.INVALID_ENUM(
      '요일',
      Object.values(DayOfWeek).join(', '),
    ),
  })
  availableDays: DayOfWeek[];

  @ApiProperty({
    description: '시작 시간 (HH:mm)',
    example: '18:00',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING('시작 시간'),
  })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: ERROR_MESSAGES.VALIDATION.INVALID_TIME_FORMAT,
  })
  startTime: string;

  @ApiProperty({
    description: '종료 시간 (HH:mm)',
    example: '22:00',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING('종료 시간'),
  })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: ERROR_MESSAGES.VALIDATION.INVALID_TIME_FORMAT,
  })
  endTime: string;
}

export class UpdateOperatingHoursDto {
  @ApiProperty({
    description: '견적 시간 설정',
    type: TimeSlotConfigDto,
  })
  estimate: TimeSlotConfigDto;

  @ApiProperty({
    description: '시공 시간 설정',
    type: TimeSlotConfigDto,
  })
  construction: TimeSlotConfigDto;
}
