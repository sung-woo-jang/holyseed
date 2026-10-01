import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { VrFillKind } from '../../entities';

export class CreateFillDto {
  @ApiProperty({ description: '체결일', example: '2026-07-07' })
  @IsDateString({}, { message: '체결일은 YYYY-MM-DD 형식이어야 합니다.' })
  fillDate: string;

  @ApiProperty({ description: '구분', enum: VrFillKind })
  @IsEnum(VrFillKind, { message: '구분은 INITIAL_BUY/BUY/SELL 중 하나여야 합니다.' })
  kind: VrFillKind;

  @ApiProperty({ description: '체결가 ($)', example: 70.85 })
  @IsNumber({}, { message: '체결가는 숫자여야 합니다.' })
  @Min(0)
  price: number;

  @ApiProperty({ description: '수량 (DEPOSIT은 0)', example: 1 })
  @IsInt({ message: '수량은 정수여야 합니다.' })
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ description: '메모' })
  @IsOptional()
  @IsString()
  note?: string;
}
