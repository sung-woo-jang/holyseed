import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateHouseholdDto {
  @ApiPropertyOptional({ description: '가구명' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: '아이콘' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: '기준 통화' })
  @IsOptional()
  @IsString()
  baseCurrency?: string;
}
