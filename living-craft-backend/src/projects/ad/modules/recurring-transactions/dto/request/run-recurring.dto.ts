import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class RunRecurringDto {
  @ApiPropertyOptional({ description: '금액 (변동형: 이번 달 실제 금액)', example: 73210 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({ description: '거래 날짜 (YYYY-MM-DD, 미지정 시 오늘)' })
  @IsOptional()
  @IsDateString()
  date?: string;
}
