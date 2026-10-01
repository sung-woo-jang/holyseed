import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class SearchWorklogDto {
  @ApiProperty({ description: '연도', example: 2026 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({ description: '월 (1~12)', example: 7 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}
