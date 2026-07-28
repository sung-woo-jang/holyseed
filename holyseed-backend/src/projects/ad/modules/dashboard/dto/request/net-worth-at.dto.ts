import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class NetWorthAtDto {
  @ApiProperty({ description: '기준 날짜 (YYYY-MM-DD)', example: '2026-03-15' })
  @IsDateString({}, { message: '날짜는 YYYY-MM-DD 형식이어야 합니다.' })
  date: string;
}
