import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { Transform } from 'class-transformer'

export class CreateStrategyDto {
  @ApiProperty({ description: '전략 타입', example: 'infinite', enum: ['infinite', 'vr'] })
  @IsIn(['infinite', 'vr'])
  strategyType: string

  @ApiProperty({ description: '종목', example: 'TQQQ', enum: ['TQQQ', 'SOXL'] })
  @IsIn(['TQQQ', 'SOXL'])
  ticker: string

  @ApiProperty({ description: '원금 (USD)', example: 4800 })
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseFloat(value))
  principal: number

  @ApiPropertyOptional({ description: '분할수 (무매)', example: 40, enum: [20, 40] })
  @IsOptional()
  @IsIn([20, 40])
  @Transform(({ value }) => parseInt(value, 10))
  division?: number
}
