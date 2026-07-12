import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateHouseholdDto {
  @ApiProperty({ description: '가구명', example: '우리 집' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '아이콘', example: '🏠' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: '기준 통화', example: 'KRW' })
  @IsOptional()
  @IsString()
  baseCurrency?: string;
}
