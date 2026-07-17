import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateCycleDto {
  @ApiProperty({ description: '사이클 번호', example: 1 })
  @IsInt()
  @Min(1)
  cycleNo: number;

  @ApiProperty({ description: '시작일', example: '2026-06-22' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: '종료일', example: '2026-07-03' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'V 값', example: 1322.96 })
  @IsNumber()
  vValue: number;

  @ApiProperty({ description: '시작 Pool', example: 4600 })
  @IsNumber()
  poolStart: number;

  @ApiPropertyOptional({ description: '적립금', example: 200 })
  @IsOptional()
  @IsNumber()
  depositAmount?: number;
}
