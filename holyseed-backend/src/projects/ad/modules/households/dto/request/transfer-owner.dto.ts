import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class TransferOwnerDto {
  @ApiProperty({ description: '새 OWNER 사용자 ID' })
  @IsNumber()
  newOwnerUserId: number;
}
