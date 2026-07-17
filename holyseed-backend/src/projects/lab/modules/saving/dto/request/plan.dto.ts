import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class PlanDto {
  @ApiProperty({ description: '월 실수령 수입 합산 (원)', example: 3200000 })
  @IsInt()
  @Min(0)
  income: number;
}
