import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ReservationStatus } from '../../entities';
import { ERROR_MESSAGES, FIELD_NAMES } from '@common/constants';

export class ReservationsQueryDto {
  @ApiPropertyOptional({
    description: '예약 상태 필터',
    enum: ReservationStatus,
    example: ReservationStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(ReservationStatus, {
    message: ERROR_MESSAGES.VALIDATION.INVALID_ENUM(
      FIELD_NAMES.status,
      Object.values(ReservationStatus).join(', '),
    ),
  })
  status?: ReservationStatus;

  @ApiPropertyOptional({
    description: '조회 개수',
    example: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;

  @ApiPropertyOptional({
    description: '건너뛸 개수',
    example: 0,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  offset?: number = 0;
}
