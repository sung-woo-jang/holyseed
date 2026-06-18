import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { AttendanceStatus } from '../../entities/wedding-attendance.entity';

export class SearchAttendanceDto {
  @ApiProperty({ description: '커플 ID (UUID)' })
  @IsUUID('4', { message: '유효한 커플 ID여야 합니다.' })
  coupleId: string;

  @ApiPropertyOptional({ enum: AttendanceStatus, description: '참석 상태 필터' })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  attendanceStatus?: AttendanceStatus;

  @ApiPropertyOptional({ description: '페이지당 개수', default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value !== undefined ? Number(value) : 50))
  limit?: number = 50;

  @ApiPropertyOptional({ description: '오프셋', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value !== undefined ? Number(value) : 0))
  offset?: number = 0;
}
