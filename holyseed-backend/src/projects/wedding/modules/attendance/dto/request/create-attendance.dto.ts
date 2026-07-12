import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { AttendanceStatus } from '../../entities/wedding-attendance.entity';

export class CreateAttendanceDto {
  @ApiProperty({ description: '커플 ID (UUID)' })
  @IsUUID('4', { message: '유효한 커플 ID여야 합니다.' })
  coupleId: string;

  @ApiProperty({ description: '하객 이름', example: '홍길동' })
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  guestName: string;

  @ApiProperty({ description: '참석 인원', minimum: 1, maximum: 10, default: 1 })
  @IsNumber()
  @Min(1)
  @Max(10)
  @Transform(({ value }) => Number(value))
  guestCount: number;

  @ApiProperty({ enum: AttendanceStatus, description: '참석 여부' })
  @IsEnum(AttendanceStatus, { message: '유효한 참석 상태여야 합니다.' })
  attendanceStatus: AttendanceStatus;

  @ApiPropertyOptional({ description: '축하 메시지' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  message?: string;

  @ApiPropertyOptional({ description: '연락처' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => value?.trim())
  phoneNumber?: string;
}
