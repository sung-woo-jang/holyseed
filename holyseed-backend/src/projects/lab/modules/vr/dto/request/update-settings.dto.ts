import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ description: '종목' })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiPropertyOptional({ description: 'G (기울기)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  gFactor?: number;

  @ApiPropertyOptional({ description: '밴드 (%)' })
  @IsOptional()
  @IsNumber()
  bandPct?: number;

  @ApiPropertyOptional({ description: '사이클당 적립금 ($)' })
  @IsOptional()
  @IsNumber()
  depositAmount?: number;

  @ApiPropertyOptional({ description: 'Pool 사용 한도 (%)' })
  @IsOptional()
  @IsNumber()
  poolLimitPct?: number;
}
