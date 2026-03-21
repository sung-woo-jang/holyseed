import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ERROR_MESSAGES, FIELD_NAMES } from '@common/constants';

/**
 * 관리자가 변경할 수 있는 예약 상태
 * - confirmed: 확정 (견적 확정)
 * - completed: 시공 완료
 * - cancelled: 취소
 */
export enum AdminReservationStatusUpdate {
  /** 확정 (견적 확정) */
  CONFIRMED = 'confirmed',
  /** 완료 */
  COMPLETED = 'completed',
  /** 취소 */
  CANCELLED = 'cancelled',
}

export class UpdateReservationStatusDto {
  @ApiProperty({
    description: '변경할 예약 상태',
    enum: AdminReservationStatusUpdate,
    example: 'confirmed',
  })
  @IsEnum(AdminReservationStatusUpdate, {
    message: ERROR_MESSAGES.VALIDATION.INVALID_ENUM(
      FIELD_NAMES.status,
      Object.values(AdminReservationStatusUpdate).join(', '),
    ),
  })
  status: AdminReservationStatusUpdate;
}
