import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class CashflowQueryDto {
  @ApiProperty({ description: '시작 날짜 (YYYY-MM-DD)', example: '2024-01-01' })
  @IsDateString()
  from: string;

  @ApiProperty({ description: '종료 날짜 (YYYY-MM-DD)', example: '2024-12-31' })
  @IsDateString()
  to: string;
}
