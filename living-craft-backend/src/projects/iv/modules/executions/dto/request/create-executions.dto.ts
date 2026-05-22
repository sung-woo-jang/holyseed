import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Transform, Type } from 'class-transformer'

const EXEC_TYPES = ['buy_full', 'buy_half_star', 'buy_half_avg', 'sell_quarter', 'sell_fixed', 'sell_moc', 'no_exec']

export class FillRowDto {
  @ApiProperty({ description: '체결 타입', enum: EXEC_TYPES })
  @IsIn(EXEC_TYPES)
  execType: string

  @ApiProperty({ description: '체결가', example: 74.32 })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  price: number

  @ApiProperty({ description: '체결 수량', example: 4 })
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  qty: number

  @ApiPropertyOptional({ description: '메모' })
  @IsOptional()
  @IsString()
  note?: string
}

export class CreateExecutionsDto {
  @ApiProperty({ description: '체결일 (YYYY-MM-DD)', example: '2025-05-22' })
  @IsString()
  execDate: string

  @ApiProperty({ description: '체결 행 목록', type: [FillRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FillRowDto)
  rows: FillRowDto[]
}
