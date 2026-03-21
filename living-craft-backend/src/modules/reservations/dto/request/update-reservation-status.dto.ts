import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReservationStatus } from '../../entities';
import { ERROR_MESSAGES, FIELD_NAMES } from '@common/constants';

export class UpdateReservationStatusDto {
  @ApiProperty({
    description: '예약 상태',
    enum: ReservationStatus,
    example: ReservationStatus.CONFIRMED,
  })
  @IsEnum(ReservationStatus, {
    message: ERROR_MESSAGES.VALIDATION.INVALID_ENUM(
      FIELD_NAMES.status,
      Object.values(ReservationStatus).join(', '),
    ),
  })
  status: ReservationStatus;
}
