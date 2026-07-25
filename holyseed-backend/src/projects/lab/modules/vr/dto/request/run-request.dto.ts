import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class VrRunRequestDto {
  @ApiProperty({ description: '실주문 여부 (false면 dry-run)', default: false })
  @IsBoolean()
  @IsOptional()
  live?: boolean;
}
