import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ERROR_MESSAGES, FIELD_NAMES } from '@common/constants';

export class ServiceOrderItemDto {
  @ApiProperty({ description: '서비스 ID' })
  @IsNumber(
    {},
    {
      message: ERROR_MESSAGES.VALIDATION.IS_NUMBER(FIELD_NAMES.serviceId),
    },
  )
  id: number;

  @ApiProperty({ description: '새 정렬 순서' })
  @IsNumber(
    {},
    {
      message: ERROR_MESSAGES.VALIDATION.IS_NUMBER('정렬 순서'),
    },
  )
  @Min(0, {
    message: ERROR_MESSAGES.VALIDATION.MIN('정렬 순서', 0),
  })
  sortOrder: number;
}

export class UpdateServiceOrderDto {
  @ApiProperty({
    description: '서비스 순서 목록',
    type: [ServiceOrderItemDto],
  })
  @IsArray({
    message: ERROR_MESSAGES.VALIDATION.IS_ARRAY('서비스 순서 목록'),
  })
  @ValidateNested({ each: true })
  @Type(() => ServiceOrderItemDto)
  serviceOrders: ServiceOrderItemDto[];
}
