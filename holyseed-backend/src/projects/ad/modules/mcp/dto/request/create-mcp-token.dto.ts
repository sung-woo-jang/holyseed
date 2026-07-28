import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMcpTokenDto {
  @ApiPropertyOptional({ description: '토큰 라벨 (예: 아이폰, 맥북)', example: '아이폰' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;
}
