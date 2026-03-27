import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateReservationDto } from './create-reservation.dto';

export class CreateReservationMultipartDto extends CreateReservationDto {
  @ApiPropertyOptional({
    description: '첨부 사진 파일들 (최대 5개)',
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  photos?: any;
}
