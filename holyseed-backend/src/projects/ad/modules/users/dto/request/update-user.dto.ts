import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: '이름' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: '선호 통화', example: 'KRW' })
  @IsOptional()
  @IsString()
  preferredCurrency?: string;

  @ApiPropertyOptional({ description: '테마 모드', enum: ['light', 'dark', 'system'] })
  @IsOptional()
  @IsIn(['light', 'dark', 'system'])
  themeMode?: string;

  @ApiPropertyOptional({ description: '정기지출 자동 생성 알림 여부' })
  @IsOptional()
  @IsBoolean()
  notifyRecurringAuto?: boolean;

  @ApiPropertyOptional({ description: '아바타 컬러' })
  @IsOptional()
  @IsString()
  avatarColor?: string;
}
