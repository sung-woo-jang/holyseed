import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsNumber, IsOptional } from 'class-validator'

export class LaofusRunRequestDto {
  @ApiProperty({ description: '실주문 여부 (false면 dry-run)', default: false })
  @IsBoolean()
  @IsOptional()
  live?: boolean

  @ApiProperty({ description: 'dry-run 가격 주입 (테스트용)', required: false })
  @IsNumber()
  @IsOptional()
  price?: number
}
