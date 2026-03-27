import {
  IsEnum,
  IsArray,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  Matches,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScheduleMode } from '../../entities/service-schedule.entity';
import { ERROR_MESSAGES } from '@common/constants';

/**
 * 서비스 스케줄 입력 DTO
 */
export class ServiceScheduleInputDto {
  // ===== 견적 스케줄 설정 =====

  @ApiProperty({
    description: '견적 스케줄 모드',
    enum: ScheduleMode,
    example: ScheduleMode.GLOBAL,
    default: ScheduleMode.GLOBAL,
  })
  @IsEnum(ScheduleMode, {
    message: '유효한 스케줄 모드를 선택해주세요.',
  })
  estimateScheduleMode: ScheduleMode;

  @ApiPropertyOptional({
    description: '견적 가능 요일 (CUSTOM/EVERYDAY_EXCEPT 모드에서 사용)',
    example: ['mon', 'tue', 'wed', 'thu', 'fri'],
  })
  @IsOptional()
  @IsArray({
    message: ERROR_MESSAGES.VALIDATION.IS_ARRAY('견적 가능 요일'),
  })
  @IsString({ each: true, message: '요일은 문자열이어야 합니다.' })
  estimateAvailableDays?: string[];

  @ApiPropertyOptional({
    description: '견적 시작 시간 (HH:mm 형식)',
    example: '18:00',
  })
  @IsOptional()
  @IsString({ message: '시작 시간은 문자열이어야 합니다.' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: '시작 시간은 HH:mm 형식이어야 합니다.',
  })
  estimateStartTime?: string;

  @ApiPropertyOptional({
    description: '견적 종료 시간 (HH:mm 형식)',
    example: '22:00',
  })
  @IsOptional()
  @IsString({ message: '종료 시간은 문자열이어야 합니다.' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: '종료 시간은 HH:mm 형식이어야 합니다.',
  })
  estimateEndTime?: string;

  @ApiPropertyOptional({
    description: '견적 슬롯 간격 (분 단위)',
    example: 60,
  })
  @IsOptional()
  @IsNumber({}, { message: '슬롯 간격은 숫자여야 합니다.' })
  @Min(15, { message: '슬롯 간격은 최소 15분이어야 합니다.' })
  @Max(480, { message: '슬롯 간격은 최대 480분(8시간)이어야 합니다.' })
  estimateSlotDuration?: number;

  // ===== 시공 스케줄 설정 =====

  @ApiProperty({
    description: '시공 스케줄 모드',
    enum: ScheduleMode,
    example: ScheduleMode.GLOBAL,
    default: ScheduleMode.GLOBAL,
  })
  @IsEnum(ScheduleMode, {
    message: '유효한 스케줄 모드를 선택해주세요.',
  })
  constructionScheduleMode: ScheduleMode;

  @ApiPropertyOptional({
    description: '시공 가능 요일 (CUSTOM/EVERYDAY_EXCEPT 모드에서 사용)',
    example: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  })
  @IsOptional()
  @IsArray({
    message: ERROR_MESSAGES.VALIDATION.IS_ARRAY('시공 가능 요일'),
  })
  @IsString({ each: true, message: '요일은 문자열이어야 합니다.' })
  constructionAvailableDays?: string[];

  @ApiPropertyOptional({
    description: '시공 시작 시간 (HH:mm 형식)',
    example: '09:00',
  })
  @IsOptional()
  @IsString({ message: '시작 시간은 문자열이어야 합니다.' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: '시작 시간은 HH:mm 형식이어야 합니다.',
  })
  constructionStartTime?: string;

  @ApiPropertyOptional({
    description: '시공 종료 시간 (HH:mm 형식)',
    example: '18:00',
  })
  @IsOptional()
  @IsString({ message: '종료 시간은 문자열이어야 합니다.' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: '종료 시간은 HH:mm 형식이어야 합니다.',
  })
  constructionEndTime?: string;

  @ApiPropertyOptional({
    description: '시공 슬롯 간격 (분 단위)',
    example: 60,
  })
  @IsOptional()
  @IsNumber({}, { message: '슬롯 간격은 숫자여야 합니다.' })
  @Min(15, { message: '슬롯 간격은 최소 15분이어야 합니다.' })
  @Max(480, { message: '슬롯 간격은 최대 480분(8시간)이어야 합니다.' })
  constructionSlotDuration?: number;

  // ===== 예약 가능 기간 =====

  @ApiPropertyOptional({
    description: '예약 가능 기간 (개월 단위)',
    example: 3,
    default: 3,
  })
  @IsOptional()
  @IsNumber({}, { message: '예약 가능 기간은 숫자여야 합니다.' })
  @Min(1, { message: '예약 가능 기간은 최소 1개월이어야 합니다.' })
  @Max(12, { message: '예약 가능 기간은 최대 12개월이어야 합니다.' })
  bookingPeriodMonths?: number;
}

/**
 * 서비스 휴무일 입력 DTO
 */
export class ServiceHolidayInputDto {
  @ApiProperty({
    description: '휴무일 날짜 (YYYY-MM-DD 형식)',
    example: '2024-01-15',
  })
  @IsString({ message: '날짜는 문자열이어야 합니다.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: '날짜는 YYYY-MM-DD 형식이어야 합니다.',
  })
  date: string;

  @ApiProperty({
    description: '휴무 사유',
    example: '설날 연휴',
  })
  @IsString({ message: '휴무 사유는 문자열이어야 합니다.' })
  reason: string;
}

/**
 * 서비스 휴무일 추가 요청 DTO
 */
export class AddServiceHolidayDto {
  @ApiProperty({
    description: '휴무일 목록',
    type: [ServiceHolidayInputDto],
  })
  @IsArray({
    message: ERROR_MESSAGES.VALIDATION.IS_ARRAY('휴무일 목록'),
  })
  @ArrayMinSize(1, {
    message: ERROR_MESSAGES.VALIDATION.ARRAY_NOT_EMPTY('휴무일 목록'),
  })
  holidays: ServiceHolidayInputDto[];
}

/**
 * 서비스 휴무일 삭제 요청 DTO
 */
export class DeleteServiceHolidayDto {
  @ApiProperty({
    description: '삭제할 휴무일 ID 목록',
    example: [1, 2, 3],
  })
  @IsArray({
    message: ERROR_MESSAGES.VALIDATION.IS_ARRAY('휴무일 ID 목록'),
  })
  @ArrayMinSize(1, {
    message: ERROR_MESSAGES.VALIDATION.ARRAY_NOT_EMPTY('휴무일 ID 목록'),
  })
  @IsNumber({}, { each: true, message: '휴무일 ID는 숫자여야 합니다.' })
  holidayIds: number[];
}
